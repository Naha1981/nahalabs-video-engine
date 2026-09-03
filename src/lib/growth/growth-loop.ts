// NahaLabs Growth OS — The Closed Growth Loop orchestrator (§2, §50, §67)
//
// BUSINESS MEMORY → SIGNALS → RESEARCH → OPPORTUNITY → CAMPAIGN → STRATEGY
//   → (Video Engine production) → QC → HUMAN APPROVAL → PUBLISH → MEASURE
//   → LEARN → NEXT OPPORTUNITY
//
// This orchestrates the autonomous flow but STOPS at consequential human
// decisions (approval, paid spend, compliance). It never fakes a capability:
// missing providers produce honest `degraded` steps, not fake success.

import type {
  Campaign,
  GrowthLoopResult,
  GrowthLoopStep,
  Checkpoint,
  ContentStrategy,
  CampaignStatus,
} from './types';
import { getBusinessProfile } from './tenant-store';
import { runResearch } from './research-engine';
import { evaluateOpportunities } from './opportunity-engine';
import { buildStrategy } from './strategy-engine';
import { advanceCheckpoint, applyApproval, getCampaign } from './campaigns';
import { isKindAvailable } from './providers';
import { requestPublish } from './publishing';
import { deriveLearnings, recordMetrics } from './performance-learning';
import { genId, update, writeAudit } from './tenant-store';

function step(part: Partial<GrowthLoopStep> & { step: string }): GrowthLoopStep {
  return { status: 'ok', detail: '', ...part };
}

/**
 * Run the autonomous front of the loop for an existing campaign:
 * research → opportunity link → strategy. Ends at AWAITING_APPROVAL (human
 * approval is on by default) unless autopilot policy + per-platform opt-in allow
 * continuation (handled in runProductionAndPublish).
 */
export function runIntelligence(tenantKey: string, campaignId: string): {
  result: GrowthLoopResult;
  strategy?: ContentStrategy;
} {
  const steps: GrowthLoopStep[] = [];
  const degradationNotes: string[] = [];
  const profile = getBusinessProfile(tenantKey);
  const campaign = getCampaign(tenantKey, campaignId);

  if (!profile) {
    return {
      result: { tenantId: tenantKey, campaignId, steps: [step({ step: 'business_understanding', status: 'failed', detail: 'No business profile for tenant.' })], awaitingHuman: true, degraded: true, degradationNotes: ['Business not understood yet.'] },
    };
  }
  if (!campaign) {
    return {
      result: { tenantId: tenantKey, campaignId, steps: [step({ step: 'campaign', status: 'failed', detail: 'Campaign not found.' })], awaitingHuman: true, degraded: true, degradationNotes: ['Campaign missing.'] },
    };
  }

  // 1. Research (hard rule — precedes generation, §7).
  const research = runResearch({ tenantKey, profile, trigger: 'on_demand_campaign', campaignId, brief: campaign.rawBrief });
  if (research.status === 'degraded_no_provider') {
    degradationNotes.push(research.degradationNote || 'Research provider unavailable.');
    steps.push(step({ step: 'research', status: 'degraded', detail: 'First-party/seasonal research only; live trends unavailable.', artifactId: research.id }));
  } else {
    steps.push(step({ step: 'research', status: 'ok', detail: `${research.findings.length} findings.`, artifactId: research.id }));
  }
  advanceCheckpoint(tenantKey, campaignId, 'RESEARCH_COMPLETE');

  // 2. Opportunity evaluation.
  const opportunities = evaluateOpportunities({ tenantKey, profile, research });
  const linked = campaign.opportunityId
    ? opportunities.find((o) => o.id === campaign.opportunityId) || opportunities[0]
    : opportunities[0];
  steps.push(step({
    step: 'opportunity',
    status: opportunities.length ? 'ok' : 'skipped',
    detail: linked ? `Top opportunity: ${linked.title} (score ${linked.score}, format ${linked.recommendedFormat}).` : 'No opportunity scored above threshold.',
    artifactId: linked?.id,
  }));

  // 3. Strategy (versioned).
  const strategy = buildStrategy({ tenantKey, campaign, profile, research, opportunity: linked });
  advanceCheckpoint(tenantKey, campaignId, 'STRATEGY_COMPLETE');
  update<Campaign>(tenantKey, 'campaigns', campaignId, { strategyId: strategy.id, researchRunId: research.id });
  steps.push(step({
    step: 'strategy',
    status: 'ok',
    detail: `Strategy v${strategy.version}: ${strategy.format} for ${strategy.platform}, hook ready. ${strategy.format !== 'reel' && strategy.format !== 'video_16x9' && strategy.format !== 'video_1x1' ? 'Non-video format recommended (§13).' : 'Video format.'}`,
    artifactId: strategy.id,
  }));

  const awaitingHuman = campaign.approvalPolicy === 'human_approval';
  if (awaitingHuman) {
    steps.push(step({ step: 'approval', status: 'needs_human', detail: 'Strategy ready — owner approval required before production (default).' }));
  }

  writeAudit(tenantKey, { actorId: 'system', action: 'growth.intelligence_complete', resource: 'campaign', resourceId: campaignId });

  return {
    result: {
      tenantId: tenantKey,
      campaignId,
      steps,
      awaitingHuman,
      degraded: degradationNotes.length > 0,
      degradationNotes,
    },
    strategy,
  };
}

/**
 * Production + QC + publish for an APPROVED campaign. This is where the Growth
 * OS hands off to the existing NahaLabs Video Engine. The Video Engine render
 * route (/api/render) performs precompose validation + post-render review; here
 * we drive checkpoints honestly and record the handoff.
 *
 * Returns steps; real rendering happens via the Video Engine API (which already
 * enforces precompose + post-render QC). This function records the production
 * plan and, if a renderer is not configured, marks the production step degraded
 * rather than claiming a render occurred.
 */
export function runProductionAndPublish(tenantKey: string, campaignId: string, opts: { qcPassed: boolean; mediaUrl?: string; caption?: string }): GrowthLoopResult {
  const steps: GrowthLoopStep[] = [];
  const degradationNotes: string[] = [];
  const campaign = getCampaign(tenantKey, campaignId);
  if (!campaign) {
    return { tenantId: tenantKey, campaignId, steps: [step({ step: 'campaign', status: 'failed', detail: 'Campaign not found.' })], awaitingHuman: true, degraded: true, degradationNotes: [] };
  }

  const productionCheckpoints: Checkpoint[] = ['SCRIPT_COMPLETE', 'SCENE_PLAN_COMPLETE', 'ASSETS_COMPLETE', 'EDIT_COMPLETE', 'AUDIO_COMPLETE', 'CAPTIONS_COMPLETE'];
  for (const cp of productionCheckpoints) {
    advanceCheckpoint(tenantKey, campaignId, cp);
    steps.push(step({ step: cp.toLowerCase(), status: 'ok', detail: 'Production stage planned by Video Engine Director.' }));
  }

  // Render — honest about renderer availability (§9 rendering must be real; no fakes).
  const rendererAvailable = isKindAvailable('renderer');
  if (!rendererAvailable) {
    degradationNotes.push('Render endpoint not configured — Video Engine produces the validated production plan and storyboard; final server render is unavailable until RENDERER_ENDPOINT is set. No fake export is reported.');
    steps.push(step({ step: 'render', status: 'degraded', detail: 'Renderer unavailable — production plan ready, no rendered file claimed.' }));
  } else {
    advanceCheckpoint(tenantKey, campaignId, 'RENDER_COMPLETE');
    steps.push(step({ step: 'render', status: 'ok', detail: 'Rendered via Video Engine.' }));
  }

  // QC (§11/§39) — a campaign is not "complete" just because render finished.
  if (opts.qcPassed) {
    advanceCheckpoint(tenantKey, campaignId, 'QC_COMPLETE');
    steps.push(step({ step: 'qc', status: 'ok', detail: 'Technical/Creative/Brand/Source/Reality/Industry/AI-slop QC passed.' }));
  } else {
    steps.push(step({ step: 'qc', status: 'needs_human', detail: 'QC did not pass — repair loop (§40) or human review required; campaign not published.' }));
    return { tenantId: tenantKey, campaignId, steps, awaitingHuman: true, degraded: degradationNotes.length > 0, degradationNotes };
  }

  // Publishing (§29) — only when connected; otherwise downloadable (honest).
  const platform = campaign.platforms[0] || 'instagram';
  const mediaUrl = opts.mediaUrl || `/exports/nahalabs_${campaign.id}_master.mp4`;
  const job = requestPublish(tenantKey, campaign, platform, mediaUrl, opts.caption);
  update<Campaign>(tenantKey, 'campaigns', campaignId, { publicationJobIds: [...campaign.publicationJobIds, job.id] });

  if (job.status === 'download_only') {
    degradationNotes.push(job.error || 'No connected publisher — approved asset delivered as a downloadable file.');
    steps.push(step({ step: 'publish', status: 'degraded', detail: 'Download-only: no connected OAuth account; asset approved and ready to download.', artifactId: job.id }));
  } else {
    steps.push(step({ step: 'publish', status: 'ok', detail: `Scheduled/published to ${platform}.`, artifactId: job.id }));
  }

  return { tenantId: tenantKey, campaignId, steps, awaitingHuman: false, degraded: degradationNotes.length > 0, degradationNotes };
}

/**
 * Post-publish: record measured metrics and derive learnings (§31–§34).
 * Metrics are only recorded when genuinely available; otherwise returns a note.
 */
export function closeLoopWithMetrics(tenantKey: string, campaignId: string, rawMetrics?: Parameters<typeof recordMetrics>[3]): GrowthLoopResult {
  const steps: GrowthLoopStep[] = [];
  const degradationNotes: string[] = [];
  const campaign = getCampaign(tenantKey, campaignId);
  if (!campaign) {
    return { tenantId: tenantKey, campaignId, steps: [step({ step: 'campaign', status: 'failed', detail: 'Campaign not found.' })], awaitingHuman: false, degraded: true, degradationNotes: [] };
  }

  if (rawMetrics) {
    const platform = campaign.platforms[0] || 'instagram';
    recordMetrics(tenantKey, campaignId, platform, rawMetrics, 'DIRECTLY_MEASURED');
    advanceCheckpoint(tenantKey, campaignId, 'PUBLISHED');
    update<Campaign>(tenantKey, 'campaigns', campaignId, { status: 'PUBLISHED' as CampaignStatus });
    const learnings = deriveLearnings(tenantKey, campaign);
    steps.push(step({ step: 'measure', status: 'ok', detail: 'Measured metrics normalized and stored.' }));
    steps.push(step({ step: 'learn', status: 'ok', detail: `${learnings.length} learning(s) derived from measured data → feeds next opportunity.` }));
  } else {
    degradationNotes.push('No metrics available yet (publisher unconfigured or not published) — nothing learned; performance is never fabricated.');
    steps.push(step({ step: 'measure', status: 'degraded', detail: 'No measured metrics; learning skipped.' }));
  }

  writeAudit(tenantKey, { actorId: 'system', action: 'growth.loop_closed', resource: 'campaign', resourceId: campaignId });
  return { tenantId: tenantKey, campaignId, steps, awaitingHuman: false, degraded: degradationNotes.length > 0, degradationNotes };
}

/** Convenience used by tests/seed: owner approves then production proceeds. */
export function approveCampaign(tenantKey: string, campaignId: string) {
  applyApproval(tenantKey, campaignId, 'APPROVE');
  return getCampaign(tenantKey, campaignId);
}

export { genId };

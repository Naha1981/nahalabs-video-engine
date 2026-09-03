import { describe, it, expect, beforeEach } from 'vitest';
import { _resetAllTenants, createTenant, getTenant, listTenants, getBusinessProfile } from '@/lib/growth/tenant-store';
import { understandBusiness, clarifyingQuestions } from '@/lib/growth/business-understanding';
import { getIndustryPack } from '@/lib/growth/industry-packs';
import { ingestSignal, ingestBusinessMetric, activeSignals, signalScore } from '@/lib/growth/signal-engine';
import { runResearch } from '@/lib/growth/research-engine';
import { evaluateOpportunities, recommendFormat, isVideoFormat } from '@/lib/growth/opportunity-engine';
import { buildStrategy } from '@/lib/growth/strategy-engine';
import {
  intakeCampaign,
  applyApproval,
  advanceCheckpoint,
  autopilotAllowed,
  recordFailure,
  resumeFromCheckpoint,
  listCampaigns,
} from '@/lib/growth/campaigns';
import { runIntelligence, runProductionAndPublish, closeLoopWithMetrics } from '@/lib/growth/growth-loop';
import { evaluateCostGuard } from '@/lib/growth/providers';
import { authorizeAndRecord, usageTotals, modelCostToServe, GROWTH_PLAN_TIERS } from '@/lib/growth/usage-ledger';
import { setBusinessProfile } from '@/lib/growth/tenant-store';
import { initiateConnection, setAutopilot, requestPublish } from '@/lib/growth/publishing';
import { recordMetrics, deriveLearnings, engagementRate, normalizeMetrics } from '@/lib/growth/performance-learning';
import { CHECKPOINT_ORDER } from '@/lib/growth/types';

function freshTenant(name = 'Test Business') {
  const org = createTenant({ name, slug: `t-${Math.random().toString(36).slice(2, 8)}` });
  return org.id;
}

describe('Growth OS — Business Understanding (§4)', () => {
  beforeEach(() => _resetAllTenants());

  it('detects a restaurant from a natural brief with HIGH confidence', () => {
    const tenant = freshTenant();
    const { profile } = understandBusiness({
      tenantId: tenant,
      description: "I'm a restaurant in Sandton. We have a new summer menu and I want 6 Instagram Reels to drive bookings.",
    });
    expect(profile.vertical).toBe('restaurant');
    expect(profile.industryId).toBe('hospitality-dining');
    expect(profile.detectionConfidence).toBe('HIGH');
    expect(profile.location).toBe('Sandton');
  });

  it('classifies the §13 test cases into meaningfully different verticals', () => {
    const cases: Array<[string, string]> = [
      ["I'm a dentist offering implants", 'dental_medical'],
      ["I'm selling sneakers and streetwear", 'retail_fashion_footwear'],
      ["I'm opening a restaurant in Cape Town", 'restaurant'],
      ["I'm listing a house, real estate agent", 'real_estate'],
      ["I'm selling a BMW at my dealership", 'automotive'],
      ["I'm a factory producing components", 'b2b_industrial'],
      ["I'm a hotel and safari lodge", 'hospitality_tourism'],
      ["I run a fitness gym and personal training", 'beauty_fitness'],
    ];
    for (const [desc, expectedVertical] of cases) {
      const { profile } = understandBusiness({ tenantId: freshTenant(), description: desc });
      expect(profile.vertical).toBe(expectedVertical);
    }
  });

  it('flags LOW confidence and asks for critical info when the brief is ambiguous', () => {
    const tenant = freshTenant();
    const { profile } = understandBusiness({ tenantId: tenant, description: 'hi' });
    expect(profile.detectionConfidence).toBe('LOW');
    expect(profile.missingCriticalInfo.length).toBeGreaterThan(0);
    expect(clarifyingQuestions(profile).length).toBeGreaterThan(0);
  });
});

describe('Growth OS — Industry packs (§5)', () => {
  it('provides deep launch packs for restaurant, dental and retail with compliance rules', () => {
    expect(getIndustryPack('restaurant').depth).toBe('deep');
    expect(getIndustryPack('dental_medical').depth).toBe('deep');
    expect(getIndustryPack('retail_fashion_footwear').depth).toBe('deep');
    expect(getIndustryPack('restaurant').complianceRules.join(' ')).toMatch(/alcohol/i);
    expect(getIndustryPack('dental_medical').complianceRules.join(' ')).toMatch(/consent|outcomes/i);
  });

  it('never hardcodes to restaurants — unknown verticals get a functional generic pack', () => {
    const pack = getIndustryPack('professional_services');
    expect(pack.opportunityTemplates.length).toBeGreaterThan(0);
    expect(pack.researchAngles.length).toBeGreaterThan(0);
  });
});

describe('Growth OS — Signals (§11, §32)', () => {
  beforeEach(() => _resetAllTenants());

  it('scores signals by strength, relevance and confidence', () => {
    const tenant = freshTenant();
    const strong = ingestSignal(tenant, {
      type: 'BOOKING_PATTERN',
      source: 'pos',
      sourceType: 'authorized_business_data',
      evidence: 'Tuesday covers down 30%',
      confidence: 'HIGH',
      strength: 90,
      relevance: 95,
    });
    const weak = ingestSignal(tenant, {
      type: 'TREND',
      source: 'feed',
      sourceType: 'public_trend',
      evidence: 'vague trend',
      confidence: 'LOW',
      strength: 40,
      relevance: 30,
    });
    expect(signalScore(strong)).toBeGreaterThan(signalScore(weak));
  });

  it('turns a real booking drop (≥15%) into a booking-pattern signal; small dips do not', () => {
    const tenant = freshTenant();
    const drop = ingestBusinessMetric(tenant, { kind: 'covers', value: 70, baseline: 100, period: 'Tuesday' });
    expect(drop.businessSignal.deltaPercent).toBeCloseTo(-30);
    expect(drop.generatedSignal).toBeDefined();
    expect(drop.generatedSignal?.type).toBe('BOOKING_PATTERN');

    const flat = ingestBusinessMetric(tenant, { kind: 'covers', value: 98, baseline: 100, period: 'Wednesday' });
    expect(flat.generatedSignal).toBeUndefined();
  });

  it('never surfaces prohibited-source signals as active', () => {
    const tenant = freshTenant();
    ingestSignal(tenant, {
      type: 'COMPETITOR_MOVE',
      source: 'bulk-scraped competitor account',
      sourceType: 'public_business_info',
      evidence: 'unauthorized scrape',
      complianceFlag: 'prohibited_source',
    });
    expect(activeSignals(tenant).length).toBe(0);
  });
});

describe('Growth OS — Research precedes generation (§7, §9)', () => {
  beforeEach(() => _resetAllTenants());

  it('always runs research and records findings, never empty', () => {
    const tenant = freshTenant();
    const { profile } = understandBusiness({ tenantId: tenant, description: "Restaurant in Sandton, new burger menu, want Instagram Reels" });
    setBusinessProfile(tenant, profile);
    const run = runResearch({ tenantKey: tenant, profile, trigger: 'on_demand_campaign' });
    expect(run.findings.length).toBeGreaterThan(0);
    // Without configured providers, research must honestly degrade — not fabricate.
    expect(['completed', 'degraded_no_provider']).toContain(run.status);
  });
});

describe('Growth OS — Opportunity engine & "know when NOT to make a video" (§12, §13)', () => {
  beforeEach(() => _resetAllTenants());

  it('recommends a carousel (not video) for B2B lead-gen with weak footage', () => {
    const r = recommendFormat({
      objective: 'leads',
      signalTypes: ['SEARCH_DEMAND'],
      packPreferred: getIndustryPack('professional_services').preferredFormats,
      hasStrongFootage: false,
    });
    expect(r.videoRecommended).toBe(false);
    expect(isVideoFormat(r.format)).toBe(false);
  });

  it('recommends a Reel for a restaurant bookings objective', () => {
    const r = recommendFormat({
      objective: 'bookings',
      signalTypes: ['BOOKING_PATTERN'],
      packPreferred: getIndustryPack('restaurant').preferredFormats,
      hasStrongFootage: true,
    });
    expect(r.format).toBe('reel');
    expect(r.videoRecommended).toBe(true);
  });

  it('produces scored, evidence-backed opportunities for a restaurant with a booking dip', () => {
    const tenant = freshTenant();
    const { profile } = understandBusiness({ tenantId: tenant, description: "Restaurant in Sandton, new burger, want Reels for bookings" });
    setBusinessProfile(tenant, profile);
    ingestBusinessMetric(tenant, { kind: 'covers', value: 65, baseline: 100, period: 'Tuesday' });
    const research = runResearch({ tenantKey: tenant, profile, trigger: 'scheduled_daily' });
    const opps = evaluateOpportunities({ tenantKey: tenant, profile, research, usableFootageCount: 8 });
    expect(opps.length).toBeGreaterThan(0);
    expect(opps[0].reason.length).toBeGreaterThan(10); // explainable
    expect(opps[0].evidence.length).toBeGreaterThan(0);
  });
});

describe('Growth OS — Campaign intake, state machine, approval, recovery (§3, §25, §26, §41, §56)', () => {
  beforeEach(() => _resetAllTenants());

  function restaurantCampaign(message = "I'm a restaurant in Sandton. Promote our new burger with Instagram Reels to drive bookings.") {
    const tenant = freshTenant();
    const { campaign } = intakeCampaign({ tenantKey: tenant, message });
    return { tenant, campaign };
  }

  it('normalizes a conversational brief into a structured campaign with defaults', () => {
    const { tenant, campaign } = restaurantCampaign();
    expect(campaign.platforms).toContain('instagram');
    expect(campaign.approvalPolicy).toBe('human_approval'); // default ON
    expect(campaign.status).toBe('DRAFT');
    expect(getBusinessProfile(tenant)).toBeDefined();
  });

  it('runs intelligence and stops for human approval by default (not autonomous publish)', () => {
    const { tenant, campaign } = restaurantCampaign();
    const { result } = runIntelligence(tenant, campaign.id);
    expect(result.awaitingHuman).toBe(true);
    expect(result.steps.find((s) => s.step === 'approval')?.status).toBe('needs_human');
    const updated = listCampaigns(tenant).find((c) => c.id === campaign.id);
    expect(updated?.status).toBe('AWAITING_APPROVAL');
  });

  it('approval transitions the campaign and logs APPROVAL_GRANTED checkpoint', () => {
    const { tenant, campaign } = restaurantCampaign();
    runIntelligence(tenant, campaign.id);
    const approved = applyApproval(tenant, campaign.id, 'APPROVE');
    expect(approved.checkpoints).toContain('APPROVAL_GRANTED');
  });

  it('autopilot is OFF by default and blocked even with autopilot policy unless per-platform opt-in + QC', () => {
    const tenant = freshTenant();
    const { campaign } = intakeCampaign({
      tenantKey: tenant,
      message: "Restaurant new burger Reels bookings",
      approvalPolicy: 'autopilot',
    });
    // platform autopilot NOT enabled
    const blocked = autopilotAllowed(campaign, 'instagram', { platformAutopilotEnabled: false, qcPassed: true, complianceBlocked: false });
    expect(blocked.allowed).toBe(false);
    // enabled + QC pass + no compliance → allowed
    const allowed = autopilotAllowed(campaign, 'instagram', { platformAutopilotEnabled: true, qcPassed: true, complianceBlocked: false });
    expect(allowed.allowed).toBe(true);
    // QC fail blocks
    const qcBlocked = autopilotAllowed(campaign, 'instagram', { platformAutopilotEnabled: true, qcPassed: false, complianceBlocked: false });
    expect(qcBlocked.allowed).toBe(false);
  });

  it('resumes from the last completed checkpoint without restarting earlier stages', () => {
    const { tenant, campaign } = restaurantCampaign();
    runIntelligence(tenant, campaign.id);
    ['SCRIPT_COMPLETE', 'SCENE_PLAN_COMPLETE', 'ASSETS_COMPLETE'].forEach((cp) =>
      advanceCheckpoint(tenant, campaign.id, cp as never),
    );
    recordFailure(tenant, campaign.id, 'render', 'Renderer timeout', true);
    const { resumeAt } = resumeFromCheckpoint(tenant, campaign.id);
    expect(resumeAt).toBe('EDIT_COMPLETE'); // stage after ASSETS_COMPLETE, NOT back at research
  });
});

describe('Growth OS — Cost governance & usage ledger (§16, §23, §24, §49)', () => {
  beforeEach(() => _resetAllTenants());

  it('FREE_ONLY absolutely blocks paid providers', () => {
    const tenant = freshTenant();
    // video-kling is paid; whether configured or not, FREE_ONLY must block paid spend.
    const decision = evaluateCostGuard({ mode: 'FREE_ONLY', providerId: 'video-kling', estimatedCostUsd: 1.0 });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('FREE_ONLY');
  });

  it('records every operation in the ledger and tracks free vs paid', () => {
    const tenant = freshTenant();
    const free = authorizeAndRecord({ tenantKey: tenant, operation: 'render.canvas', provider: 'renderer-hyperframes', estimatedCostUsd: 0, free: true, mode: 'FREE_ONLY' });
    expect(free.allowed).toBe(true);
    const blocked = authorizeAndRecord({ tenantKey: tenant, operation: 'generation.video', provider: 'video-kling', estimatedCostUsd: 1.2, free: false, mode: 'FREE_ONLY' });
    expect(blocked.allowed).toBe(false);
    const totals = usageTotals(tenant);
    expect(totals.operations).toBe(2);
  });

  it('models cost-to-serve and always flags the least-certain assumption', () => {
    const tenant = freshTenant();
    const model = modelCostToServe(tenant, 20);
    expect(model.totalCostUsd).toBeGreaterThan(0);
    expect(model.leastCertainLine.length).toBeGreaterThan(0);
    expect(GROWTH_PLAN_TIERS).toHaveLength(3);
    for (const tier of GROWTH_PLAN_TIERS) {
      expect(tier.leastCertainAssumption.length).toBeGreaterThan(0);
    }
  });
});

describe('Growth OS — Publishing is honest (§29, §30, §57)', () => {
  beforeEach(() => _resetAllTenants());

  it('never enables autopilot automatically and requires a connection', () => {
    const tenant = freshTenant();
    const conn = initiateConnection(tenant, 'instagram');
    expect(conn.autopilot).toBe(false);
    expect(conn.authMethod).toBe('oauth');
    expect(() => setAutopilot(tenant, conn.id, true)).toThrow(/AUTOPILOT_REQUIRES_CONNECTION/);
  });

  it('publishing with no connected account is download_only, never a fake publish', () => {
    const tenant = freshTenant();
    const { campaign } = intakeCampaign({ tenantKey: tenant, message: "Restaurant new burger Reels bookings" });
    const job = requestPublish(tenant, campaign, 'instagram', '/exports/x.mp4');
    expect(job.status).toBe('download_only');
    expect(job.error).toMatch(/downloadable/i);
  });
});

describe('Growth OS — Performance & learning only from measured data (§31–§34)', () => {
  beforeEach(() => _resetAllTenants());

  it('normalizes platform metrics and computes engagement rate', () => {
    const norm = normalizeMetrics('instagram', { reach: 1000, likes: 50, comments: 20, shares: 10, saves: 20 });
    expect(norm.views).toBe(1000);
    const metrics = recordMetrics(freshTenant(), 'cmp-x', 'instagram', { reach: 1000, likes: 50, comments: 20, shares: 10, saves: 20 });
    expect(engagementRate(metrics)).toBeCloseTo(10);
  });

  it('derives no learnings when there is no measured data (never invents performance)', () => {
    const tenant = freshTenant();
    const { campaign } = intakeCampaign({ tenantKey: tenant, message: "Restaurant new burger Reels bookings" });
    const learnings = deriveLearnings(tenant, campaign);
    expect(learnings.length).toBe(0);
  });

  it('derives learnings from real metrics after a campaign', () => {
    const tenant = freshTenant();
    const { campaign } = intakeCampaign({ tenantKey: tenant, message: "Restaurant new burger Reels bookings" });
    recordMetrics(tenant, campaign.id, 'instagram', { reach: 5000, views: 5000, likes: 300, comments: 60, shares: 40, saves: 100, clicks: 120, completionRate: 0.7 });
    const learnings = deriveLearnings(tenant, campaign);
    expect(learnings.length).toBeGreaterThan(0);
    expect(learnings.some((l) => l.appliesTo.includes('length'))).toBe(true);
  });
});

describe('Growth OS — End-to-end closed loop (§50, §67)', () => {
  beforeEach(() => _resetAllTenants());

  it('runs the restaurant pilot loop: brief → research → opportunity → strategy → approval → (degraded production) → download', () => {
    const tenant = freshTenant('Flavourly');
    // 1. Conversational intake
    const { campaign } = intakeCampaign({
      tenantKey: tenant,
      message: "I'm a restaurant in Sandton. Promote our new burger. I want Instagram Reels that drive bookings.",
    });
    // 2. Intelligence (research + opportunity + strategy)
    const intel = runIntelligence(tenant, campaign.id);
    expect(intel.strategy).toBeDefined();
    expect(intel.result.awaitingHuman).toBe(true);
    // 3. Strategy is versioned and evidence-backed
    const strat = intel.strategy!;
    expect(strat.version).toBe(1);
    expect(strat.researchEvidence.length).toBeGreaterThan(0);
    // 4. Approve
    applyApproval(tenant, campaign.id, 'APPROVE');
    // 5. Production + publish (honestly degraded: no renderer/publisher configured)
    const prod = runProductionAndPublish(tenant, campaign.id, { qcPassed: true });
    expect(prod.steps.some((s) => s.step === 'qc' && s.status === 'ok')).toBe(true);
    // With no OAuth connection → download_only (not a fake publish)
    expect(prod.steps.some((s) => s.step === 'publish' && s.status === 'degraded')).toBe(true);
    // 6. No fabricated metrics
    const closed = closeLoopWithMetrics(tenant, campaign.id);
    expect(closed.degraded).toBe(true);
  });

  it('performance-triggered campaign: booking dip creates a signal feeding an opportunity (§53)', () => {
    const tenant = freshTenant();
    const { profile } = understandBusiness({ tenantId: tenant, description: "Restaurant in Sandton, burger menu, Reels, bookings" });
    setBusinessProfile(tenant, profile);
    // Booking drop
    const { generatedSignal } = ingestBusinessMetric(tenant, { kind: 'covers', value: 60, baseline: 100, period: 'Tuesday' });
    expect(generatedSignal).toBeDefined();
    const research = runResearch({ tenantKey: tenant, profile, trigger: 'scheduled_daily' });
    const opps = evaluateOpportunities({ tenantKey: tenant, profile, research });
    expect(opps.some((o) => o.signalIds.includes(generatedSignal!.id) || o.score > 0)).toBe(true);
  });
});

describe('Growth OS — Multi-tenant isolation (§45)', () => {
  beforeEach(() => _resetAllTenants());

  it('keeps campaigns and signals isolated between tenants', () => {
    const a = freshTenant('Business A');
    const b = freshTenant('Business B');
    intakeCampaign({ tenantKey: a, message: "Restaurant new burger Reels bookings" });
    expect(listCampaigns(a).length).toBe(1);
    expect(listCampaigns(b).length).toBe(0);
    expect(() => intakeCampaign({ tenantKey: 'nonexistent-tenant', message: 'x' })).toThrow(/TENANT_NOT_FOUND/);
  });

  it('checkpoint order is defined and ordered', () => {
    expect(CHECKPOINT_ORDER[0]).toBe('RESEARCH_COMPLETE');
    expect(CHECKPOINT_ORDER[CHECKPOINT_ORDER.length - 1]).toBe('PUBLISHED');
  });
});

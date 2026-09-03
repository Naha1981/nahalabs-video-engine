// NahaLabs Growth OS — Campaign intake & lifecycle state machine
// (§3 intake normalization, §25 approval workflow, §26 autopilot,
//  §41 resumable checkpoints, §56 failure handling/recovery)
//
// Two equivalent entry points — conversational ("Promote our new burger") and
// dashboard — normalize into the SAME structured Campaign entity. The owner
// never specifies technical production details.

import type {
  Campaign,
  CampaignStatus,
  CampaignObjective,
  PlatformId,
  Checkpoint,
  ApprovalAction,
  Opportunity,
} from './types';
import { CHECKPOINT_ORDER } from './types';
import { understandBusiness } from './business-understanding';
import { setBusinessProfile, getBusinessProfile, insert, update, findById, listAll, genId, writeAudit } from './tenant-store';

export interface CampaignIntake {
  tenantKey: string;
  /** Free-text message OR dashboard-provided fields. Both converge here. */
  message?: string;
  objective?: CampaignObjective;
  platforms?: PlatformId[];
  offer?: string;
  audience?: string;
  geography?: string;
  deadline?: string;
  budgetUsd?: number;
  opportunityId?: string;
  /** Default is human approval; autopilot must be explicitly opted in per-platform. */
  approvalPolicy?: 'human_approval' | 'autopilot';
  source?: 'conversation' | 'dashboard';
}

/** §3 — normalize any intake into a structured Campaign (and ensure a BusinessProfile). */
export function intakeCampaign(input: CampaignIntake): { campaign: Campaign; understanding: ReturnType<typeof understandBusiness> } {
  const brief = (input.message || '').trim();

  // Ensure the tenant has a business profile — understand it from the brief.
  let profile = getBusinessProfile(input.tenantKey);
  const understanding = understandBusiness({
    tenantId: input.tenantKey,
    description: brief || profile?.description || '',
    name: profile?.name,
    website: profile?.website,
  });
  if (!profile) {
    profile = setBusinessProfile(input.tenantKey, understanding.profile);
  }

  const platforms = input.platforms && input.platforms.length ? input.platforms : understanding.platforms;

  const campaign: Campaign = {
    id: genId('cmp'),
    tenantId: input.tenantKey,
    businessId: profile.id,
    opportunityId: input.opportunityId,
    rawBrief: brief,
    objective: input.objective || understanding.objective,
    offer: input.offer,
    audience: input.audience,
    geography: input.geography || profile.location,
    campaignType: deriveCampaignType(understanding.objective, input.message),
    platforms,
    desiredContent: brief,
    deadline: input.deadline,
    budgetUsd: input.budgetUsd,
    // §25/§26 — human approval is ON by default. Autopilot is never implicit.
    approvalPolicy: input.approvalPolicy || 'human_approval',
    status: 'DRAFT',
    checkpoints: [],
    publicationJobIds: [],
    costUsd: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const stored = insert<Campaign>(input.tenantKey, 'campaigns', campaign);
  writeAudit(input.tenantKey, {
    actorId: 'owner',
    action: 'campaign.created',
    resource: 'campaign',
    resourceId: stored.id,
    metadata: { source: input.source || (input.message ? 'conversation' : 'dashboard'), objective: stored.objective },
  });
  return { campaign: stored, understanding };
}

function deriveCampaignType(objective: CampaignObjective, message?: string): string {
  const m = (message || '').toLowerCase();
  if (/reel|instagram|tiktok|short/.test(m)) return 'short_form_social';
  if (objective === 'bookings') return 'promotional_booking';
  if (objective === 'sales') return 'product_promo';
  if (objective === 'leads') return 'lead_generation';
  if (objective === 'awareness') return 'brand_awareness';
  return 'social_content';
}

// ─── Checkpoint state machine (§41) ─────────────────────────────────────────
export function advanceCheckpoint(tenantKey: string, campaignId: string, checkpoint: Checkpoint): Campaign {
  const campaign = findById<Campaign>(tenantKey, 'campaigns', campaignId);
  if (!campaign) throw new Error(`CAMPAIGN_NOT_FOUND:${campaignId}`);

  const checkpoints = campaign.checkpoints.includes(checkpoint)
    ? campaign.checkpoints
    : [...campaign.checkpoints, checkpoint];

  // Map checkpoint → status.
  const status = statusForCheckpoint(checkpoint, campaign);
  return update<Campaign>(tenantKey, 'campaigns', campaignId, {
    checkpoints,
    status,
    updatedAt: new Date().toISOString(),
  });
}

function statusForCheckpoint(cp: Checkpoint, campaign: Campaign): CampaignStatus {
  switch (cp) {
    case 'RESEARCH_COMPLETE':
      return 'RESEARCHED';
    case 'STRATEGY_COMPLETE':
      return campaign.approvalPolicy === 'autopilot' ? 'STRATEGY_READY' : 'AWAITING_APPROVAL';
    case 'SCRIPT_COMPLETE':
    case 'SCENE_PLAN_COMPLETE':
    case 'ASSETS_COMPLETE':
    case 'EDIT_COMPLETE':
    case 'AUDIO_COMPLETE':
    case 'CAPTIONS_COMPLETE':
      return 'PRODUCTION';
    case 'RENDER_COMPLETE':
      return 'QC';
    case 'QC_COMPLETE':
      return 'READY_TO_PUBLISH';
    case 'APPROVAL_GRANTED':
      return 'PRODUCTION';
    case 'PUBLISHED':
      return 'PUBLISHED';
    default:
      return campaign.status;
  }
}

// ─── Approval actions (§25) ─────────────────────────────────────────────────
export function applyApproval(tenantKey: string, campaignId: string, action: ApprovalAction, note?: string): Campaign {
  const campaign = findById<Campaign>(tenantKey, 'campaigns', campaignId);
  if (!campaign) throw new Error(`CAMPAIGN_NOT_FOUND:${campaignId}`);

  writeAudit(tenantKey, {
    actorId: 'owner',
    action: `campaign.${action.toLowerCase().replace(/_/g, '_')}`,
    resource: 'campaign',
    resourceId: campaignId,
    metadata: { note, fromStatus: campaign.status },
  });

  if (action === 'APPROVE') {
    const checkpoints = campaign.checkpoints.includes('APPROVAL_GRANTED')
      ? campaign.checkpoints
      : [...campaign.checkpoints, 'APPROVAL_GRANTED' as Checkpoint];
    // If production already finished (READY_TO_PUBLISH), approval moves to publishing;
    // if approved at strategy, move into production.
    const status: CampaignStatus = campaign.status === 'READY_TO_PUBLISH' ? 'READY_TO_PUBLISH' : 'PRODUCTION';
    return update<Campaign>(tenantKey, 'campaigns', campaignId, {
      checkpoints,
      status,
      failure: undefined,
      updatedAt: new Date().toISOString(),
    });
  }
  if (action === 'REQUEST_CHANGES') {
    return update<Campaign>(tenantKey, 'campaigns', campaignId, {
      status: 'CHANGES_REQUESTED',
      failure: { stage: 'approval', reason: note || 'Owner requested changes', retryCount: campaign.failure?.retryCount || 0, recoverable: true },
      updatedAt: new Date().toISOString(),
    });
  }
  // REJECT
  return update<Campaign>(tenantKey, 'campaigns', campaignId, {
    status: 'REJECTED',
    updatedAt: new Date().toISOString(),
  });
}

/**
 * §26 Autopilot gate: autopilot may only proceed when the platform connection
 * exists AND has autopilot explicitly enabled AND no blocking compliance issue
 * AND content passed QC. Default is always OFF for a new tenant/platform.
 */
export function autopilotAllowed(
  campaign: Campaign,
  platform: PlatformId,
  opts: { platformAutopilotEnabled: boolean; qcPassed: boolean; complianceBlocked: boolean },
): { allowed: boolean; reason: string } {
  if (campaign.approvalPolicy !== 'autopilot') {
    return { allowed: false, reason: 'Campaign is on human_approval policy (default). Owner must approve.' };
  }
  if (!opts.platformAutopilotEnabled) {
    return { allowed: false, reason: `Autopilot is OFF for ${platform}. It must be explicitly enabled per-platform.` };
  }
  if (opts.complianceBlocked) {
    return { allowed: false, reason: 'BLOCKED: open compliance issue — human decision required.' };
  }
  if (!opts.qcPassed) {
    return { allowed: false, reason: 'BLOCKED: content has not passed QC.' };
  }
  return { allowed: true, reason: 'AUTOPILOT_OK' };
}

// ─── Failure handling & recovery (§56, §15) ─────────────────────────────────
export function recordFailure(tenantKey: string, campaignId: string, stage: string, reason: string, recoverable: boolean): Campaign {
  const campaign = findById<Campaign>(tenantKey, 'campaigns', campaignId);
  if (!campaign) throw new Error(`CAMPAIGN_NOT_FOUND:${campaignId}`);
  const retryCount = (campaign.failure?.retryCount || 0) + 1;
  return update<Campaign>(tenantKey, 'campaigns', campaignId, {
    status: recoverable ? 'FAILED_RECOVERABLE' : 'REJECTED',
    failure: { stage, reason, retryCount, recoverable },
    updatedAt: new Date().toISOString(),
  });
}

/** §41 — resume from the last completed checkpoint; earlier stages are NOT rerun. */
export function resumeFromCheckpoint(tenantKey: string, campaignId: string): { campaign: Campaign; resumeAt: Checkpoint } {
  const campaign = findById<Campaign>(tenantKey, 'campaigns', campaignId);
  if (!campaign) throw new Error(`CAMPAIGN_NOT_FOUND:${campaignId}`);
  const lastIdx = campaign.checkpoints.length ? CHECKPOINT_ORDER.indexOf(campaign.checkpoints[campaign.checkpoints.length - 1]) : -1;
  const resumeAt = CHECKPOINT_ORDER[Math.min(lastIdx + 1, CHECKPOINT_ORDER.length - 1)];
  const updated = update<Campaign>(tenantKey, 'campaigns', campaignId, {
    status: resumeAt === 'PUBLISHED' ? 'PUBLISHED' : campaign.status === 'FAILED_RECOVERABLE' ? 'PRODUCTION' : campaign.status,
    failure: undefined,
    updatedAt: new Date().toISOString(),
  });
  return { campaign: updated, resumeAt };
}

export function getCampaign(tenantKey: string, id: string): Campaign | undefined {
  return findById<Campaign>(tenantKey, 'campaigns', id);
}

export function listCampaigns(tenantKey: string): Campaign[] {
  return listAll<Campaign>(tenantKey, 'campaigns').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export { CHECKPOINT_ORDER };
export type { Opportunity };

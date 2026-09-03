// NahaLabs Growth OS — Autonomous Growth & Content-Production Operating System
// Domain contracts for the closed growth loop that sits ABOVE the Video Engine.
//
// Loop: BUSINESS MEMORY -> SIGNALS -> RESEARCH -> OPPORTUNITY -> CAMPAIGN
//       -> STRATEGY -> (Video Engine production) -> QC -> APPROVAL
//       -> PUBLISH -> MEASURE -> LEARN -> NEXT OPPORTUNITY
//
// Nothing here fakes a vendor. Providers that are not configured report
// `status: 'unconfigured'` and the engine degrades honestly (see degraded-modes.ts).

import type { IndustryId, AspectRatio } from '../engine/types';

// ─── Re-exports so growth modules have a single import surface ───
export type { IndustryId, AspectRatio };

// ─── Confidence & fact integrity ────────────────────────────────────────────
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

/** §42 Factual integrity — every claim is classified, never invented. */
export type FactClassification =
  | 'KNOWN_FACT'
  | 'USER_CLAIM'
  | 'VERIFIED_SOURCE'
  | 'CREATIVE_INTERPRETATION'
  | 'UNKNOWN';

export type AttributionStatus =
  | 'DIRECTLY_MEASURED'
  | 'CORRELATED'
  | 'INFERRED'
  | 'UNKNOWN';

// ─── Tenancy, users, roles (§45, §46) ───────────────────────────────────────
export type UserRole = 'owner' | 'admin' | 'editor' | 'analyst' | 'viewer';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  planTierId: GrowthPlanTierId;
  createdAt: string;
  country?: string;
  /** Popia / data-residence opt-ins. */
  dataResidence?: 'ZA' | 'EU' | 'US';
}

// A "tenant" in Growth OS is an Organization. tenantId is the isolation key.
export type Tenant = Organization;

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Business understanding (§4) ────────────────────────────────────────────
export type BusinessVertical =
  | 'restaurant'
  | 'retail_fashion_footwear'
  | 'professional_services'
  | 'real_estate'
  | 'automotive'
  | 'beauty_fitness'
  | 'hospitality_tourism'
  | 'dental_medical'
  | 'b2b_industrial'
  | 'education_creator_agency';

export interface BusinessProfile {
  id: string;
  tenantId: string;
  name: string;
  /** Free-text the owner gave us ("I'm a restaurant in Johannesburg..."). */
  description: string;
  website?: string;
  location?: string;
  products: string[];
  services: string[];
  audience?: string;
  socialProfiles: { platform: string; handle: string }[];
  /** Mapping into the Video Engine industry pack. */
  industryId: IndustryId;
  vertical: BusinessVertical;
  detectionConfidence: Confidence;
  missingCriticalInfo: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Signals (§11) ──────────────────────────────────────────────────────────
export type SignalType =
  | 'TREND'
  | 'SEARCH_DEMAND'
  | 'SEASONALITY'
  | 'LOCAL_EVENT'
  | 'COMPETITOR_MOVE'
  | 'BUSINESS_EVENT'
  | 'PRODUCT_LAUNCH'
  | 'BOOKING_PATTERN'
  | 'SALES_PATTERN'
  | 'CAMPAIGN_PERFORMANCE'
  | 'CUSTOMER_SIGNAL'
  | 'CONTENT_GAP';

export type SignalSourceType =
  | 'public_trend'
  | 'search_demand_feed'
  | 'seasonal_calendar'
  | 'local_event_feed'
  | 'public_business_info'
  | 'authorized_business_data' // booking/POS — only with consent
  | 'manual_human_verified'
  | 'campaign_analytics'
  | 'owner_provided';

export interface Signal {
  id: string;
  tenantId: string;
  type: SignalType;
  source: string;
  sourceType: SignalSourceType;
  /** Human-readable evidence. */
  evidence: string;
  confidence: Confidence;
  /** 0-100 raw strength before relevance weighting. */
  strength: number;
  /** 0-100 relevance to THIS tenant. */
  relevance: number;
  timestamp: string;
  expiresAt?: string;
  /** §10 — competitor facts are never stated without compliant evidence. */
  complianceFlag?: 'ok' | 'requires_human_verification' | 'prohibited_source';
  metadata?: Record<string, unknown>;
}

// ─── Research (§7, §9) ──────────────────────────────────────────────────────
export type ResearchTrigger = 'scheduled_daily' | 'on_demand_campaign' | 'manual';

export interface ResearchFinding {
  id: string;
  signal: string;
  source: string;
  sourceType: SignalSourceType;
  timestamp: string;
  confidence: Confidence;
  evidence: string;
  relevance: string;
  interpretation: string;
  factClass: FactClassification;
}

export interface ResearchRun {
  id: string;
  tenantId: string;
  trigger: ResearchTrigger;
  campaignId?: string;
  findings: ResearchFinding[];
  /** §57 — if no research provider is configured we say so, never fake it. */
  status: 'completed' | 'degraded_no_provider' | 'failed';
  degradationNote?: string;
  startedAt: string;
  completedAt: string;
}

// ─── Opportunities (§12) ────────────────────────────────────────────────────
export type RecommendedFormat =
  | 'reel'
  | 'video_16x9'
  | 'video_1x1'
  | 'carousel'
  | 'static_ad'
  | 'image'
  | 'infographic'
  | 'social_post'
  | 'story'
  | 'email'
  | 'landing_page'
  | 'pdf';

export interface Opportunity {
  id: string;
  tenantId: string;
  title: string;
  /** 0-100 composite score. */
  score: number;
  evidence: string[];
  signalIds: string[];
  expectedObjective: string;
  recommendedFormat: RecommendedFormat;
  /** §13 — when video is NOT the best format, we say so. */
  formatRationale: string;
  recommendedPlatform: PlatformId;
  recommendedTiming: string;
  estimatedCostUsd: number;
  confidence: Confidence;
  expiresAt?: string;
  reason: string; // "Why is NahaLabs recommending this?"
  status: 'open' | 'accepted' | 'dismissed' | 'expired';
  createdAt: string;
}

// ─── Campaigns & approval state machine (§3, §25) ───────────────────────────
export type CampaignStatus =
  | 'DRAFT'
  | 'RESEARCHED'
  | 'STRATEGY_READY'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'PRODUCTION'
  | 'QC'
  | 'READY_TO_PUBLISH'
  | 'PUBLISHED'
  | 'CHANGES_REQUESTED'
  | 'REJECTED'
  | 'FAILED_RECOVERABLE'
  | 'ARCHIVED';

/** Ordered checkpoints so a failure at stage N never restarts stage 1 (§41). */
export type Checkpoint =
  | 'RESEARCH_COMPLETE'
  | 'STRATEGY_COMPLETE'
  | 'SCRIPT_COMPLETE'
  | 'SCENE_PLAN_COMPLETE'
  | 'ASSETS_COMPLETE'
  | 'EDIT_COMPLETE'
  | 'AUDIO_COMPLETE'
  | 'CAPTIONS_COMPLETE'
  | 'RENDER_COMPLETE'
  | 'QC_COMPLETE'
  | 'APPROVAL_GRANTED'
  | 'PUBLISHED';

export const CHECKPOINT_ORDER: Checkpoint[] = [
  'RESEARCH_COMPLETE',
  'STRATEGY_COMPLETE',
  'SCRIPT_COMPLETE',
  'SCENE_PLAN_COMPLETE',
  'ASSETS_COMPLETE',
  'EDIT_COMPLETE',
  'AUDIO_COMPLETE',
  'CAPTIONS_COMPLETE',
  'RENDER_COMPLETE',
  'QC_COMPLETE',
  'APPROVAL_GRANTED',
  'PUBLISHED',
];

export type CampaignObjective =
  | 'awareness'
  | 'engagement'
  | 'traffic'
  | 'bookings'
  | 'sales'
  | 'leads'
  | 'retention'
  | 'announcement';

export type ApprovalAction = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

export interface Campaign {
  id: string;
  tenantId: string;
  businessId: string;
  opportunityId?: string;
  /** §3 — normalized from either a chat message or the dashboard form. */
  rawBrief: string;
  objective: CampaignObjective;
  offer?: string;
  audience?: string;
  geography?: string;
  campaignType: string;
  platforms: PlatformId[];
  desiredContent: string;
  deadline?: string;
  budgetUsd?: number;
  /** Human approval is ON by default; autopilot is per-platform opt-in (§26). */
  approvalPolicy: 'human_approval' | 'autopilot';
  status: CampaignStatus;
  checkpoints: Checkpoint[];
  researchRunId?: string;
  strategyId?: string;
  videoProjectId?: string;
  publicationJobIds: string[];
  costUsd: number;
  /** §15 / §56 — recoverable failures keep the campaign alive. */
  failure?: { stage: string; reason: string; retryCount: number; recoverable: boolean };
  createdAt: string;
  updatedAt: string;
}

// ─── Content strategy (§14) — versioned artifact ────────────────────────────
export interface ContentStrategy {
  id: string;
  tenantId: string;
  campaignId: string;
  version: number;
  objective: CampaignObjective;
  audience: string;
  angle: string;
  hook: string;
  offer?: string;
  format: RecommendedFormat;
  platform: PlatformId;
  cta: string;
  creativeApproach: string;
  assetStrategy: string;
  productionStrategy: string;
  researchEvidence: string[];
  aspectRatio: AspectRatio;
  budgetUsd: number;
  expectedOutputs: string[];
  /** Provenance/evidence pointers so every choice is explainable (§43). */
  decisionLogIds: string[];
  createdAt: string;
}

// ─── Decision log (§44) ─────────────────────────────────────────────────────
export interface DecisionLogEntry {
  id: string;
  tenantId: string;
  campaignId?: string;
  decision: string;
  alternatives: string[];
  chosenOption: string;
  reason: string;
  confidence: Confidence;
  evidence: string[];
  costUsd?: number;
  actor: 'system' | 'owner' | 'engineer';
  timestamp: string;
}

// ─── Providers (§22, §57) — honest availability, no fake success ────────────
export type ProviderKind =
  | 'image'
  | 'video'
  | 'voice'
  | 'music'
  | 'transcription'
  | 'stock'
  | 'enhancement'
  | 'renderer'
  | 'publisher'
  | 'research'
  | 'llm';

export type ProviderStatus =
  | 'configured' // credentials present, reachable
  | 'unconfigured' // no credentials — feature honestly unavailable
  | 'degraded' // credentials present but failing/rate-limited
  | 'disabled';

export interface ProviderDescriptor {
  kind: ProviderKind;
  id: string;
  label: string;
  status: ProviderStatus;
  /** True when this provider can incur paid usage. */
  paid: boolean;
  /** What the system falls back to when this provider is absent. */
  fallbackNote: string;
  lastChecked?: string;
}

// ─── Cost governance (§23, §24, §49) ────────────────────────────────────────
export type CostMode = 'FREE_ONLY' | 'LOWEST_COST' | 'BALANCED' | 'QUALITY_FIRST' | 'MANUAL';

export interface UsageEvent {
  id: string;
  tenantId: string;
  campaignId?: string;
  projectId?: string;
  operation: string;
  provider: string;
  model?: string;
  quantity: number;
  unit?: string;
  estimatedCostUsd: number;
  actualCostUsd?: number;
  freeUsage: boolean;
  paidUsage: boolean;
  timestamp: string;
}

export interface CostEstimate {
  operation: string;
  provider: string;
  estimatedCostUsd: number;
  free: boolean;
  breakdown: { line: string; costUsd: number }[];
}

export interface CostGuardDecision {
  allowed: boolean;
  reason: string;
  mode: CostMode;
  estimate?: CostEstimate;
}

// ─── Publishing (§29, §30) ──────────────────────────────────────────────────
export type PlatformId = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'whatsapp';

export interface PublishingConnection {
  id: string;
  tenantId: string;
  platform: PlatformId;
  /** OAuth only — we never store passwords (§30). */
  authMethod: 'oauth';
  status: 'connected' | 'disconnected' | 'token_expired' | 'not_authorized';
  scopes: string[];
  platformAccountId?: string;
  tokenExpiresAt?: string;
  /** §26 — autopilot is per-platform and OFF until explicitly enabled. */
  autopilot: boolean;
  connectedAt?: string;
}

export type PublicationStatus =
  | 'pending_approval'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed_retryable'
  | 'failed_blocked'
  | 'download_only'; // §57 degraded: no publisher -> downloadable output

export interface PublicationJob {
  id: string;
  tenantId: string;
  campaignId: string;
  platform: PlatformId;
  status: PublicationStatus;
  scheduledAt?: string;
  publishedAt?: string;
  remotePostId?: string;
  mediaUrl: string;
  caption?: string;
  error?: string;
  retryCount: number;
}

// ─── Performance & learning (§31–§34) ───────────────────────────────────────
export interface PerformanceMetrics {
  id: string;
  tenantId: string;
  campaignId: string;
  platform: PlatformId;
  collectedAt: string;
  impressions?: number;
  reach?: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  follows?: number;
  watchTimeSec?: number;
  completionRate?: number;
  /** §32 — distinguish measured from inferred. */
  attribution: AttributionStatus;
}

export interface BusinessSignal {
  id: string;
  tenantId: string;
  kind: 'bookings' | 'covers' | 'sales' | 'product_sales' | 'enquiries' | 'leads' | 'appointments';
  value: number;
  baseline: number;
  /** percentage delta vs historical baseline. */
  deltaPercent: number;
  period: string;
  timestamp: string;
  attribution: AttributionStatus;
}

export interface Learning {
  id: string;
  tenantId: string;
  campaignId: string;
  topic: string;
  /** What actually happened, grounded in measured metrics only. */
  insight: string;
  appliesTo: ('hook' | 'topic' | 'format' | 'length' | 'cta' | 'visual_style' | 'timing' | 'platform')[];
  confidence: Confidence;
  measuredAt: string;
}

// ─── Pricing (§48) — three tiers, values validated against cost-to-serve ────
export type GrowthPlanTierId = 'starter' | 'growth' | 'scale';

export interface GrowthPlanTier {
  id: GrowthPlanTierId;
  name: string;
  monthlyCampaigns: number;
  platforms: PlatformId[];
  generationAllowance: number; // estimated paid generations/month
  researchRunsPerMonth: number;
  storageGb: number;
  publishingAllowance: number;
  features: string[];
  /** Populated by cost-to-serve model; null until measured data exists. */
  modeledCostToServeUsd: number | null;
  /** §24 — the least-certain cost assumption is flagged, never hidden. */
  leastCertainAssumption: string;
}

// ─── Growth loop orchestration result ───────────────────────────────────────
export interface GrowthLoopStep {
  step: string;
  status: 'ok' | 'degraded' | 'skipped' | 'needs_human' | 'failed';
  detail: string;
  artifactId?: string;
}

export interface GrowthLoopResult {
  tenantId: string;
  campaignId?: string;
  steps: GrowthLoopStep[];
  /** True when the loop stopped because a consequential human decision is needed. */
  awaitingHuman: boolean;
  /** True when a capability is honestly unavailable (not faked). */
  degraded: boolean;
  degradationNotes: string[];
}

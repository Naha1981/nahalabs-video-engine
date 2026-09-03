// NahaLabs Video Engine - Unified Type Definitions
// Architected for OpenMontage Upstream + NahaLabs Commercial Intelligence Layer

export type FunnelStage = 'TOP_OF_FUNNEL_HOOK' | 'MIDDLE_OF_FUNNEL_DEMO' | 'BOTTOM_OF_FUNNEL_CONVERSION' | 'RETENTION_CUSTOMER_STORY';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type RenderStatus = 'draft' | 'queued' | 'validating' | 'synthesizing_audio' | 'rendering_frames' | 'post_review' | 'ready' | 'failed';
export type ApprovalStatus = 'DRAFT' | 'INTERNAL_QA' | 'CLIENT_REVIEW' | 'APPROVED' | 'REVISIONS_REQUESTED';
export type IndustryId = 
  | 'b2b-saas'
  | 'd2c-ecommerce'
  | 'real-estate'
  | 'healthcare-wellness'
  | 'logistics-cargoiq'
  | 'hospitality-dining'
  | 'fintech'
  | 'legal-compliance'
  | 'high-ticket-coaching'
  | 'education-edtech'
  | 'manufacturing-industrial'
  | 'home-services-trades';

export interface BrandBrain {
  id: string;
  tenantId: string;
  name: string;
  industryId: IndustryId;
  voice: {
    tone: 'authoritative' | 'conversational' | 'cinematic' | 'urgent_direct' | 'empathetic_nurturing' | 'witty_challenger';
    readingLevel: 'accessible_grade6' | 'business_executive' | 'technical_specialist';
    prohibitedPhrases: string[];
    requiredTaglines: string[];
    pacingWpm: number; // Words Per Minute (e.g. 140-160 for commercial video)
  };
  visualIdentity: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    logoUrl?: string;
    watermarkEnabled: boolean;
    aspectRatioDefault: AspectRatio;
  };
  compliance: {
    claimVerificationRequired: boolean;
    prohibitedWords: string[];
    mandatoryDisclaimers: string[];
    maxSceneSeconds: number;
    requireCitations: boolean;
  };
  personas: {
    id: string;
    name: string;
    painPoint: string;
    dreamOutcome: string;
    objections: string[];
  }[];
  updatedAt: string;
}

export interface IndustryIntelligence {
  id: IndustryId;
  title: string;
  category: string;
  summary: string;
  recommendedDurationSec: number;
  avgConversionRate: string;
  keyPsychologicalTriggers: string[];
  hookBlueprints: {
    pattern: string;
    example: string;
    targetEmotion: string;
  }[];
  visualMetaphors: string[];
  pacingGuidelines: {
    hookDurationSec: number;
    problemAgitationSec: number;
    solutionRevealSec: number;
    proofSocialProofSec: number;
    ctaDurationSec: number;
  };
  defaultStockTags: string[];
  recommendedMotion: string;
  complianceNotes: string;
}

export interface Shot {
  id: string;
  durationSec: number;
  shotType: 'macro_detail' | 'wide_establishing' | 'medium_over_shoulder' | 'dynamic_tracking' | 'cinematic_drone' | 'screen_ui_demo';
  cameraMotion: 'subtle_zoom_in' | 'lateral_truck_right' | 'cinematic_pan' | 'dolly_forward' | 'static_hero';
  lightingStyle: 'hyper_realistic_soft_studio' | 'moody_dramatic_rim' | 'bright_natural_morning' | 'neon_cyber_glow';
  realismPrompt: string;
  negativePrompt: string;
  stockFootageKeywords: string[];
  bRollAssetUrl?: string;
  overlayText?: string;
}

export interface Scene {
  id: string;
  sceneIndex: number;
  title: string;
  funnelSection: 'HOOK' | 'PROBLEM' | 'AGITATION' | 'SOLUTION' | 'PROOF' | 'OFFER_CTA';
  durationSec: number;
  narrationText: string;
  audioVoiceoverUrl?: string;
  shots: Shot[];
  backgroundColor?: string;
  accentColor?: string;
  musicMood: 'energetic_propulsive' | 'curious_minimal' | 'cinematic_epic' | 'ambient_focus' | 'urgent_countdown';
}

export interface SubtitleWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  words?: SubtitleWord[];
}

export interface PrecomposeValidationResult {
  valid: boolean;
  timestamp: string;
  checks: {
    name: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    message: string;
    metric?: string;
  }[];
  totalDurationSec: number;
  sceneCount: number;
  audioDurationSec: number;
  estimatedRenderSeconds: number;
}

export interface PostRenderReviewResult {
  overallScore: number; // 0-100
  verdict: 'APPROVED' | 'PASS_WITH_SUGGESTIONS' | 'REVISION_NEEDED';
  reviewedAt: string;
  scores: {
    hookStrength: number;
    pacingAndContinuity: number;
    visualRealism: number;
    brandVoiceMatch: number;
    audioClarityAndMix: number;
    ctaClarity: number;
  };
  critique: string[];
  recommendedFixes: string[];
}

export interface AnnotationComment {
  id: string;
  timestampSec: number;
  authorName: string;
  authorRole: 'Client' | 'Creative Director' | 'Lead Producer' | 'Compliance Officer';
  text: string;
  status: 'open' | 'addressed' | 'resolved';
  createdAt: string;
}

export interface VideoProject {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  funnelStage: FunnelStage;
  aspectRatio: AspectRatio;
  industryId: IndustryId;
  brandBrainId: string;
  commercialObjective: string;
  targetAudience: string;
  primaryValueProp: string;
  callToAction: string;
  scenes: Scene[];
  totalDurationSec: number;
  status: RenderStatus;
  approvalStatus: ApprovalStatus;
  precomposeCheck?: PrecomposeValidationResult;
  postRenderReview?: PostRenderReviewResult;
  annotations: AnnotationComment[];
  videoExportUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  renderedAt?: string;
  renderCostUsd: number;
  tokensConsumed: number;
}

export interface UsageLedgerEntry {
  id: string;
  tenantId: string;
  projectId: string;
  projectTitle: string;
  timestamp: string;
  renderSeconds: number;
  tokensUsed: number;
  provider: 'Claude 3.5 / Fable 5.1' | 'Gemini 2.0 Flash' | 'OpenMontage Canvas' | 'FFmpeg Synthesis';
  costUsd: number;
  status: 'settled' | 'pending';
}

export interface PlanTier {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  monthlyPriceZar: number;
  monthlyPriceUsd: number;
  includedMinutes: number;
  maxProjects: number;
  maxTenants: number;
  resolution: '1080p' | '4K Cinema';
  priorityRendering: boolean;
  brandBrainsLimit: number;
  mcpAccess: boolean;
  whitelabel: boolean;
}

export interface TelemetryEvent {
  id: string;
  tenantId: string;
  projectId?: string;
  eventName: string;
  channel: 'web' | 'mcp' | 'webhook' | 'video_player' | 'api';
  actorId: string;
  timestamp: string;
  properties: Record<string, any>;
}

export interface IntentSignal {
  viewerId: string;
  projectId: string;
  projectTitle: string;
  intentScore: number; // 0-100
  funnelStage: FunnelStage;
  watchDepthPercent: number;
  repeatViews: number;
  ctaClicked: boolean;
  inferredReadiness: 'High Buying Intent' | 'Considering / Evaluating' | 'Top Funnel Casual';
  lastActive: string;
}

import { VideoProject, BrandBrain, IndustryId, TelemetryEvent, IntentSignal, UsageLedgerEntry } from '../engine/types';
import { DEFAULT_BRAND_BRAINS } from '../engine/brand-brain-store';
import { generateCommercialVideoProject } from '../engine/pipeline-orchestrator';

export interface VideoEngineState {
  currentTenantId: string;
  selectedProjectId: string;
  projects: VideoProject[];
  brandBrains: BrandBrain[];
  telemetryEvents: TelemetryEvent[];
  intentSignals: IntentSignal[];
  usageLedger: UsageLedgerEntry[];
  activeAspectRatio: '16:9' | '9:16' | '1:1';
}

export const INITIAL_PROJECTS: VideoProject[] = [
  generateCommercialVideoProject({
    title: 'NahaLabs Commercial Intelligence Engine',
    industryId: 'b2b-saas',
    funnelStage: 'TOP_OF_FUNNEL_HOOK',
    brandBrainId: 'brain-nahalabs-core',
    commercialObjective: 'Generate 50+ enterprise demo bookings per week',
    primaryValueProp: 'Agentic video production powered by OpenMontage and NahaLabs commercial intelligence',
    targetAudience: 'Chief Marketing Officers, VPs of Growth, and Startup Founders',
    callToAction: 'Claim your 60-day enterprise pilot at nahalabs.ai',
    aspectRatio: '16:9',
  }),
  generateCommercialVideoProject({
    title: 'CargoIQ - Zero-Demurrage Freight Velocity',
    industryId: 'logistics-cargoiq',
    funnelStage: 'MIDDLE_OF_FUNNEL_DEMO',
    brandBrainId: 'brain-cargoiq-freight',
    commercialObjective: 'Close 10 enterprise freight forwarding supply chain accounts',
    primaryValueProp: 'Real-time multi-modal container tracking and automated customs clearance verification',
    targetAudience: 'Supply Chain Directors, Customs Brokers, and Port Operators',
    callToAction: 'Request an enterprise API sandbox access at cargoiq.co.za',
    aspectRatio: '16:9',
  }),
  generateCommercialVideoProject({
    title: 'Flavourly - Gourmet Sensory Experience',
    industryId: 'hospitality-dining',
    funnelStage: 'BOTTOM_OF_FUNNEL_CONVERSION',
    brandBrainId: 'brain-flavourly-dining',
    commercialObjective: 'Fill 120 weekend dinner covers via direct WhatsApp concierge',
    primaryValueProp: 'Sensory dry-aged culinary dining and rooftop sunset cocktails in Sandton',
    targetAudience: 'Food enthusiasts, romantic couples, and executive dinner hosts',
    callToAction: 'Tap to book your VIP table on WhatsApp in 3 seconds',
    aspectRatio: '9:16',
  })
];

export const INITIAL_INTENT_SIGNALS: IntentSignal[] = [
  {
    viewerId: 'v-exec-901',
    projectId: INITIAL_PROJECTS[0].id,
    projectTitle: INITIAL_PROJECTS[0].title,
    intentScore: 94,
    funnelStage: 'TOP_OF_FUNNEL_HOOK',
    watchDepthPercent: 98,
    repeatViews: 4,
    ctaClicked: true,
    inferredReadiness: 'High Buying Intent',
    lastActive: '3 minutes ago',
  },
  {
    viewerId: 'v-cargomgr-341',
    projectId: INITIAL_PROJECTS[1].id,
    projectTitle: INITIAL_PROJECTS[1].title,
    intentScore: 88,
    funnelStage: 'MIDDLE_OF_FUNNEL_DEMO',
    watchDepthPercent: 85,
    repeatViews: 2,
    ctaClicked: true,
    inferredReadiness: 'High Buying Intent',
    lastActive: '14 minutes ago',
  },
  {
    viewerId: 'v-diner-108',
    projectId: INITIAL_PROJECTS[2].id,
    projectTitle: INITIAL_PROJECTS[2].title,
    intentScore: 92,
    funnelStage: 'BOTTOM_OF_FUNNEL_CONVERSION',
    watchDepthPercent: 100,
    repeatViews: 3,
    ctaClicked: true,
    inferredReadiness: 'High Buying Intent',
    lastActive: '22 minutes ago',
  },
  {
    viewerId: 'v-scout-552',
    projectId: INITIAL_PROJECTS[0].id,
    projectTitle: INITIAL_PROJECTS[0].title,
    intentScore: 62,
    funnelStage: 'TOP_OF_FUNNEL_HOOK',
    watchDepthPercent: 54,
    repeatViews: 1,
    ctaClicked: false,
    inferredReadiness: 'Considering / Evaluating',
    lastActive: '1 hour ago',
  }
];

export const INITIAL_USAGE_LEDGER: UsageLedgerEntry[] = [
  {
    id: 'led-1',
    tenantId: 'tenant-default',
    projectId: INITIAL_PROJECTS[0].id,
    projectTitle: INITIAL_PROJECTS[0].title,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    renderSeconds: 52,
    tokensUsed: 6200,
    provider: 'OpenMontage Canvas',
    costUsd: 1.04,
    status: 'settled',
  },
  {
    id: 'led-2',
    tenantId: 'tenant-default',
    projectId: INITIAL_PROJECTS[1].id,
    projectTitle: INITIAL_PROJECTS[1].title,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    renderSeconds: 50,
    tokensUsed: 5900,
    provider: 'Claude 3.5 / Fable 5.1',
    costUsd: 1.12,
    status: 'settled',
  },
  {
    id: 'led-3',
    tenantId: 'tenant-default',
    projectId: INITIAL_PROJECTS[2].id,
    projectTitle: INITIAL_PROJECTS[2].title,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    renderSeconds: 35,
    tokensUsed: 4400,
    provider: 'OpenMontage Canvas',
    costUsd: 0.70,
    status: 'settled',
  }
];

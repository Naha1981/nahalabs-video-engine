// NahaLabs Growth OS — Strategy Engine (§14)
//
// Produces a VERSIONED ContentStrategy artifact for a campaign: objective,
// audience, angle, hook, offer, format, platform, CTA, creative/asset/production
// strategy, research evidence and budget. Every consequential choice is written
// to the decision log (§44) so the owner can see why NahaLabs chose it.

import type {
  ContentStrategy,
  Campaign,
  BusinessProfile,
  ResearchRun,
  Opportunity,
  DecisionLogEntry,
  CampaignObjective,
  AspectRatio,
  RecommendedFormat,
} from './types';
import { getIndustryPack } from './industry-packs';
import { isVideoFormat } from './opportunity-engine';
import { insert, genId, findById, listAll } from './tenant-store';

function aspectForFormat(format: RecommendedFormat): AspectRatio {
  if (format === 'reel' || format === 'story') return '9:16';
  if (format === 'video_1x1' || format === 'static_ad' || format === 'carousel') return '1:1';
  return '16:9';
}

function hookFor(objective: CampaignObjective, profile: BusinessProfile): string {
  const pack = getIndustryPack(profile.vertical);
  // Deterministic, vertical-aware hook. Replaced by LLM-generated hook when a
  // configured LLM provider is available (provider layer, §22).
  const templates: Record<CampaignObjective, string> = {
    bookings: profile.products[0]
      ? `This week in ${profile.location || 'town'}: ${profile.products[0]} worth leaving home for.`
      : `Your table is waiting — here's what's new at ${profile.name}.`,
    sales: `New at ${profile.name}: ${profile.products[0] || 'something worth seeing'}. Real product, real footage.`,
    leads: `The question every ${pack.label.toLowerCase()} customer asks — answered in 20 seconds.`,
    traffic: `We're in ${profile.location || 'your area'} — come see what everyone's talking about.`,
    engagement: `We asked, you answered — here's what happened at ${profile.name}.`,
    awareness: `Meet ${profile.name} — ${pack.label.toLowerCase()}, done properly.`,
    retention: `Thank you for coming back. Here's what's new since your last visit.`,
    announcement: `Big news from ${profile.name}.`,
  };
  return templates[objective];
}

function ctaFor(objective: CampaignObjective, platform: string): string {
  switch (objective) {
    case 'bookings':
      return platform === 'whatsapp' ? 'Tap to book on WhatsApp' : 'Book your table/appointment — link in bio';
    case 'sales':
      return 'Shop now — link in bio';
    case 'leads':
      return 'Get your free quote — link in bio';
    case 'traffic':
      return 'Visit us — directions in bio';
    default:
      return 'Follow and tap the link in bio';
  }
}

export interface BuildStrategyInput {
  tenantKey: string;
  campaign: Campaign;
  profile: BusinessProfile;
  research?: ResearchRun;
  opportunity?: Opportunity;
}

export function buildStrategy(input: BuildStrategyInput): ContentStrategy {
  const { tenantKey, campaign, profile, research, opportunity } = input;
  const pack = getIndustryPack(profile.vertical);

  const format: RecommendedFormat = opportunity?.recommendedFormat || 'reel';
  const platform = opportunity?.recommendedPlatform || campaign.platforms[0] || 'instagram';
  const aspectRatio = aspectForFormat(format);
  const video = isVideoFormat(format);

  const evidence = research
    ? research.findings
        .filter((f) => f.factClass === 'KNOWN_FACT' || f.factClass === 'VERIFIED_SOURCE' || f.factClass === 'USER_CLAIM')
        .slice(0, 5)
        .map((f) => `${f.signal} — ${f.evidence}`)
    : [];

  const strategy: ContentStrategy = {
    id: genId('strat'),
    tenantId: tenantKey,
    campaignId: campaign.id,
    version: nextStrategyVersion(tenantKey, campaign.id),
    objective: campaign.objective,
    audience: campaign.audience || profile.audience || pack.label + ' customers in ' + (profile.location || 'the local area'),
    angle: opportunity ? opportunity.reason : pack.opportunityTemplates[0]?.angle || pack.label + ' value proposition',
    hook: hookFor(campaign.objective, profile),
    offer: campaign.offer || profile.products[0],
    format,
    platform,
    cta: ctaFor(campaign.objective, platform),
    creativeApproach: video
      ? 'Real client assets first; fast hook in first 2 seconds; authentic, commercially polished but not artificially perfect (§17 no AI slop).'
      : 'Single-purpose, on-brand asset; strong typography and real product/venue imagery.',
    assetStrategy: 'Reality-first hierarchy (§16): real client assets → existing project assets → licensed stock (provenance-tracked) → generated only for genuine gaps.',
    productionStrategy: video
      ? 'Native NahaLabs Video Engine pipeline: Director → scene plan → assets → edit → audio → captions → render → QC.'
      : 'Design/typography pipeline; no video render required.',
    researchEvidence: evidence,
    aspectRatio,
    budgetUsd: campaign.budgetUsd ?? opportunity?.estimatedCostUsd ?? 5,
    expectedOutputs: video
      ? [`${aspectRatio} master video`, 'captions (SRT/VTT)', 'thumbnail/still']
      : [`${format.replace(/_/g, ' ')} asset`, 'caption copy'],
    decisionLogIds: [],
    createdAt: new Date().toISOString(),
  };

  // ── Decision log entries (§44) ──
  const decisions: Omit<DecisionLogEntry, 'id' | 'tenantId' | 'timestamp'>[] = [
    {
      decision: 'content_format',
      alternatives: ['reel', 'carousel', 'static_ad', 'video_16x9'],
      chosenOption: format,
      reason: opportunity?.formatRationale || `Vertical-preferred format for ${pack.label}.`,
      confidence: opportunity?.confidence || 'MEDIUM',
      evidence,
      costUsd: opportunity?.estimatedCostUsd,
      actor: 'system',
      campaignId: campaign.id,
    },
    {
      decision: 'production_path',
      alternatives: ['native_video_engine', 'openmontage_adapter', 'moneyprinter_adapter', 'design_only'],
      chosenOption: video ? 'native_video_engine' : 'design_only',
      reason: video
        ? 'Video required; native engine is the audited, license-safe path (OpenMontage is AGPL — see docs/OPENMONTAGE_LICENSE_AUDIT.md).'
        : 'Non-video format; render pipeline not required.',
      confidence: 'HIGH',
      evidence: ['License audit: OpenMontage AGPL-3.0; MoneyPrinterTurbo MIT'],
      actor: 'system',
      campaignId: campaign.id,
    },
  ];

  const logged = decisions.map((d) => insert<DecisionLogEntry>(tenantKey, 'decisions', {
    ...d,
    id: genId('dec'),
    tenantId: tenantKey,
    timestamp: new Date().toISOString(),
  }));
  strategy.decisionLogIds = logged.map((d) => d.id);

  return insert<ContentStrategy>(tenantKey, 'strategies', strategy);
}

function nextStrategyVersion(tenantKey: string, campaignId: string): number {
  // Count existing strategies for this campaign to version correctly.
  const existing = listAll<ContentStrategy>(tenantKey, 'strategies').filter((s) => s.campaignId === campaignId);
  return existing.length + 1;
}

export function getStrategy(tenantKey: string, id: string): ContentStrategy | undefined {
  return findById<ContentStrategy>(tenantKey, 'strategies', id);
}

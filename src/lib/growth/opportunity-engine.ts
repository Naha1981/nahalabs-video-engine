// NahaLabs Growth OS — Opportunity Engine (§12, §13)
//
// Turns signals + research + business context into scored OPPORTUNITIES, and —
// critically — decides whether video is even the right format. The Video Engine
// is never allowed to force every opportunity into a video (§13).

import type {
  Opportunity,
  BusinessProfile,
  ResearchRun,
  RecommendedFormat,
  PlatformId,
  CampaignObjective,
} from './types';
import { getIndustryPack } from './industry-packs';
import { activeSignals, signalScore } from './signal-engine';
import { insert, update, genId, listAll } from './tenant-store';

// Rough, conservative production cost estimates (USD) per format.
const FORMAT_COST_USD: Record<RecommendedFormat, number> = {
  reel: 1.2,
  video_16x9: 2.4,
  video_1x1: 1.8,
  carousel: 0.15,
  static_ad: 0.1,
  image: 0.05,
  infographic: 0.1,
  social_post: 0.02,
  story: 0.3,
  email: 0.0,
  landing_page: 0.2,
  pdf: 0.1,
};

const VIDEO_FORMATS: RecommendedFormat[] = ['reel', 'video_16x9', 'video_1x1'];

export function isVideoFormat(f: RecommendedFormat): boolean {
  return VIDEO_FORMATS.includes(f);
}

/**
 * §13 — choose the best format for the objective/context and explain it.
 * Returns a rationale so the owner can see WHY video was or wasn't chosen.
 */
export function recommendFormat(input: {
  objective: CampaignObjective;
  signalTypes: string[];
  packPreferred: RecommendedFormat[];
  hasStrongFootage: boolean;
}): { format: RecommendedFormat; rationale: string; videoRecommended: boolean } {
  const { objective, signalTypes, packPreferred, hasStrongFootage } = input;

  // Explicit cases where video is NOT the best answer.
  if (objective === 'leads' && (packPreferred.includes('carousel') || packPreferred.includes('pdf'))) {
    return {
      format: packPreferred.includes('carousel') ? 'carousel' : 'pdf',
      rationale:
        'A B2B/lead-gen objective usually converts better from an educational carousel or downloadable guide than from a Reel. A video can still be produced if you want one.',
      videoRecommended: false,
    };
  }
  if (!hasStrongFootage && (objective === 'sales' || objective === 'awareness') && packPreferred.includes('static_ad')) {
    // Weak footage + conversion objective → static often safer than a thin reel.
    if (packPreferred[0] === 'static_ad' || packPreferred[0] === 'carousel') {
      return {
        format: packPreferred[0],
        rationale:
          'With limited usable footage, a static/carousel asset using real product photography is likely to outperform a footage-thin Reel. A Reel can still be made from stock/typography.',
        videoRecommended: false,
      };
    }
  }

  // Default: the vertical's preferred format (Reels for restaurants/fashion/retail).
  const format = packPreferred[0] || 'reel';
  const rationale = isVideoFormat(format)
    ? `For ${objective} in this vertical, a short vertical Reel is the strongest format to reach and convert the audience.`
    : `This vertical's highest-performing default for ${objective} is ${format.replace(/_/g, ' ')}.`;
  return { format, rationale, videoRecommended: isVideoFormat(format) };
}

export interface EvaluateInput {
  tenantKey: string;
  profile: BusinessProfile;
  research?: ResearchRun;
  /** How many usable client footage clips are available (drives footage confidence). */
  usableFootageCount?: number;
}

export function evaluateOpportunities(input: EvaluateInput): Opportunity[] {
  const pack = getIndustryPack(input.profile.vertical);
  const signals = activeSignals(input.tenantKey);
  const opportunities: Opportunity[] = [];

  const templates = pack.opportunityTemplates;
  templates.forEach((tpl, i) => {
    // Match template against available signals.
    const relatedSignals = signals.filter((s) =>
      pack.prioritySignals.some((p) => p.toLowerCase().includes(s.type.toLowerCase()) || s.type.toLowerCase().includes(p.toLowerCase())),
    );

    const signalStrength = relatedSignals.length
      ? relatedSignals.reduce((acc, s) => acc + signalScore(s), 0) / relatedSignals.length
      : 45; // baseline if no live signals

    const hasFootage = (input.usableFootageCount ?? 0) > 3;
    const fmt = recommendFormat({
      objective: objectiveFromTemplate(tpl.objective),
      signalTypes: relatedSignals.map((s) => s.type),
      packPreferred: pack.preferredFormats,
      hasStrongFootage: hasFootage,
    });

    // Evidence: prefer real signal evidence, else seasonal/research.
    const evidence = relatedSignals.slice(0, 3).map((s) => s.evidence);
    if (!evidence.length && input.research) {
      input.research.findings
        .filter((f) => f.factClass !== 'CREATIVE_INTERPRETATION')
        .slice(0, 2)
        .forEach((f) => evidence.push(`${f.signal}: ${f.evidence}`));
    }
    if (!evidence.length) {
      evidence.push(tpl.trigger);
    }

    const score = Math.round(Math.min(95, signalStrength * 0.7 + (relatedSignals.length ? 12 : 0) + 15 - i * 3));
    const confidence = score >= 70 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';

    opportunities.push({
      id: genId('opp'),
      tenantId: input.tenantKey,
      title: tpl.objective,
      score,
      evidence,
      signalIds: relatedSignals.map((s) => s.id),
      expectedObjective: tpl.objective,
      recommendedFormat: fmt.format,
      formatRationale: fmt.rationale,
      recommendedPlatform: tpl.platform as PlatformId,
      recommendedTiming: 'Next 48 hours',
      estimatedCostUsd: FORMAT_COST_USD[fmt.format] ?? 1,
      confidence,
      reason: `Because: ${tpl.trigger.toLowerCase()}. Recommended angle: ${tpl.angle.toLowerCase()}. ${fmt.rationale}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  });

  // Persist, deduplicating against existing open opportunities with the same title.
  const existing = listAll<Opportunity>(input.tenantKey, 'opportunities').filter((o) => o.status === 'open');
  const stored: Opportunity[] = [];
  for (const opp of opportunities.sort((a, b) => b.score - a.score)) {
    if (existing.some((e) => e.title === opp.title)) continue;
    stored.push(insert<Opportunity>(input.tenantKey, 'opportunities', opp));
  }
  return stored.length ? stored : opportunities;
}

function objectiveFromTemplate(s: string): CampaignObjective {
  if (/book|reservation|appointment|viewing|consult/i.test(s)) return 'bookings';
  if (/sale|sell|purchase|clearance/i.test(s)) return 'sales';
  if (/lead|enquir|rfq|quote/i.test(s)) return 'leads';
  if (/trust|authority|consideration/i.test(s)) return 'engagement';
  return 'awareness';
}

export function listOpportunities(tenantKey: string): Opportunity[] {
  return listAll<Opportunity>(tenantKey, 'opportunities').sort((a, b) => b.score - a.score);
}

export function dismissOpportunity(tenantKey: string, id: string): Opportunity {
  return update<Opportunity>(tenantKey, 'opportunities', id, { status: 'dismissed' });
}

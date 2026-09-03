// NahaLabs Growth OS — Research Engine (§7, §8, §9, §10)
//
// RESEARCH PRECEDES GENERATION — a hard rule. A bare "make me a video" is never
// sufficient to generate blindly. Every campaign first determines whether
// meaningful research is required and produces ResearchFindings.
//
// Honest sourcing (§10, §42):
//  - Seasonal/calendar and owner-authorized business data are ALWAYS real and
//    computed locally (no external call).
//  - Live search-demand, trends and competitor intel require a configured
//    research provider. If unconfigured, the run is marked
//    `degraded_no_provider` with an explicit note — we never fabricate trends,
//    demand numbers, or competitor moves.
//  - Competitor signals are never bulk-scraped; they require compliant public
//    sources or manual human verification.

import type {
  ResearchRun,
  ResearchFinding,
  ResearchTrigger,
  BusinessProfile,
  FactClassification,
  Signal,
} from './types';
import { getIndustryPack } from './industry-packs';
import { isKindAvailable } from './providers';
import { activeSignals } from './signal-engine';
import { insert, genId } from './tenant-store';

function seasonalFindings(profile: BusinessProfile): ResearchFinding[] {
  const pack = getIndustryPack(profile.vertical);
  const month = new Date().getMonth() + 1; // 1-12
  const findings: ResearchFinding[] = [];

  for (const moment of pack.seasonalMoments) {
    if (moment.months.includes(month)) {
      findings.push({
        id: genId('fnd'),
        signal: `Seasonal moment active: ${moment.name}`,
        source: 'NahaLabs seasonal calendar',
        sourceType: 'seasonal_calendar',
        timestamp: new Date().toISOString(),
        confidence: 'HIGH',
        evidence: `Current month (${month}) falls within the ${moment.name} window for ${pack.label}.`,
        relevance: `Seasonally relevant content angle for a ${profile.vertical} business.`,
        interpretation: `A ${moment.name.toLowerCase()} campaign is timely now.`,
        factClass: 'KNOWN_FACT',
      });
    }
  }
  return findings;
}

function signalToFinding(s: Signal): ResearchFinding {
  return {
    id: genId('fnd'),
    signal: `${s.type.replace(/_/g, ' ').toLowerCase()} signal`,
    source: s.source,
    sourceType: s.sourceType,
    timestamp: s.timestamp,
    confidence: s.confidence,
    evidence: s.evidence,
    relevance: `Relevance ${s.relevance}/100 to this business.`,
    interpretation: s.metadata?.interpretation ? String(s.metadata.interpretation) : 'Relevant growth signal for this business.',
    factClass: s.sourceType === 'owner_provided' || s.sourceType === 'authorized_business_data' ? 'USER_CLAIM' : 'VERIFIED_SOURCE',
  };
}

export interface RunResearchInput {
  tenantKey: string;
  profile: BusinessProfile;
  trigger: ResearchTrigger;
  campaignId?: string;
  brief?: string;
}

export function runResearch(input: RunResearchInput): ResearchRun {
  const startedAt = new Date().toISOString();
  const pack = getIndustryPack(input.profile.vertical);
  const providerAvailable = isKindAvailable('research') || isKindAvailable('llm');

  const findings: ResearchFinding[] = [];
  const degradationNotes: string[] = [];

  // 1. Always-available, honest local research: seasonal calendar.
  findings.push(...seasonalFindings(input.profile));

  // 2. Business context finding (USER_CLAIM — grounded in what the owner told us).
  findings.push({
    id: genId('fnd'),
    signal: `Business context: ${pack.label}`,
    source: 'owner-provided business profile',
    sourceType: 'owner_provided',
    timestamp: startedAt,
    confidence: input.profile.detectionConfidence,
    evidence: input.profile.description,
    relevance: `Industry detected as ${pack.label} (${input.profile.detectionConfidence} confidence).`,
    interpretation: `Apply the ${pack.label} industry pack: ${pack.researchAngles.length} research angles, ${pack.opportunityTemplates.length} opportunity templates.`,
    factClass: 'USER_CLAIM',
  });

  // 3. Existing active signals (booking patterns, campaigns, etc.)
  for (const s of activeSignals(input.tenantKey).slice(0, 6)) {
    findings.push(signalToFinding(s));
  }

  // 4. External research — ONLY if a provider is configured, otherwise honest gap.
  if (!providerAvailable) {
    degradationNotes.push(
      'Live search-demand, trend and competitor research are UNAVAILABLE (no research/LLM provider configured). Seasonal calendar, owner-provided data and authorized business signals were used. No demand numbers or competitor moves were fabricated.',
    );
    findings.push({
      id: genId('fnd'),
      signal: 'External research unavailable',
      source: 'NahaLabs provider registry',
      sourceType: 'owner_provided',
      timestamp: startedAt,
      confidence: 'HIGH',
      evidence: 'RESEARCH_API_KEY / ANTHROPIC_API_KEY not configured.',
      relevance: 'Research is running in degraded mode.',
      interpretation: 'Recommend configuring a research provider before paid campaigns; current findings rely on first-party data only.',
      factClass: 'KNOWN_FACT',
    });
  } else {
    findings.push({
      id: genId('fnd'),
      signal: 'Research angles to evaluate via provider',
      source: pack.label + ' industry pack',
      sourceType: 'public_trend',
      timestamp: startedAt,
      confidence: 'MEDIUM',
      evidence: pack.researchAngles.join(' | '),
      relevance: 'These angles must be grounded by the configured research provider before strategy.',
      interpretation: 'Provider present — angles should be populated with live evidence; this run records the research plan.',
      factClass: 'CREATIVE_INTERPRETATION',
    });
  }

  // 5. Compliance note (§10) — competitor intelligence caveat.
  findings.push({
    id: genId('fnd'),
    signal: 'Compliance boundary',
    source: 'NahaLabs compliance policy',
    sourceType: 'manual_human_verified',
    timestamp: startedAt,
    confidence: 'HIGH',
    evidence: pack.complianceRules.join(' | '),
    relevance: 'Applies to every campaign in this vertical.',
    interpretation: 'Competitor activity is only used from compliant public sources or manual verification — never bulk-scraped or stated as unverified fact.',
    factClass: 'KNOWN_FACT',
  });

  const run: ResearchRun = {
    id: genId('res'),
    tenantId: input.tenantKey,
    trigger: input.trigger,
    campaignId: input.campaignId,
    findings,
    status: providerAvailable ? 'completed' : 'degraded_no_provider',
    degradationNote: degradationNotes.join(' ') || undefined,
    startedAt,
    completedAt: new Date().toISOString(),
  };

  return insert<ResearchRun>(input.tenantKey, 'researchRuns', run);
}

/** §7 — should this campaign trigger research? Always yes for a real campaign. */
export function researchRequired(_brief?: string): boolean {
  return true;
}

export { FactClassification };

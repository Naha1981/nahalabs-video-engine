// NahaLabs Growth OS — Performance Intelligence & Learning Engine
// (§31 metrics normalization, §32 business signals & attribution,
//  §33 learning only from measured data, §34 content memory)
//
// Metrics are pulled from publishers and NORMALIZED into NahaLabs metrics.
// Attribution is explicitly classified (DIRECTLY_MEASURED / CORRELATED /
// INFERRED / UNKNOWN) — we never fabricate attribution or performance (§32/§33).

import type { PerformanceMetrics, PlatformId, Campaign, Learning, Confidence } from './types';
import { insert, listAll, genId } from './tenant-store';

export interface RawPlatformMetrics {
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
}

/** Normalize provider-specific metric names into the NahaLabs schema. */
export function normalizeMetrics(platform: PlatformId, raw: RawPlatformMetrics): Omit<PerformanceMetrics, 'id' | 'tenantId' | 'campaignId' | 'collectedAt' | 'attribution'> {
  // Different platforms expose different names; we map them defensively.
  return {
    platform,
    impressions: raw.impressions ?? raw.reach,
    reach: raw.reach ?? raw.impressions,
    views: raw.views ?? raw.impressions ?? raw.reach,
    likes: raw.likes ?? 0,
    comments: raw.comments ?? 0,
    shares: raw.shares ?? 0,
    saves: raw.saves ?? 0,
    clicks: raw.clicks ?? 0,
    follows: raw.follows ?? 0,
    watchTimeSec: raw.watchTimeSec,
    completionRate: raw.completionRate,
  };
}

/**
 * Record metrics. `attribution` must be honest: metrics pulled from the platform
 * API are DIRECTLY_MEASURED; anything estimated is INFERRED. No metrics are
 * invented when the publisher is unconfigured (caller checks availability).
 */
export function recordMetrics(
  tenantKey: string,
  campaignId: string,
  platform: PlatformId,
  raw: RawPlatformMetrics,
  attribution: PerformanceMetrics['attribution'] = 'DIRECTLY_MEASURED',
): PerformanceMetrics {
  const normalized = normalizeMetrics(platform, raw);
  const metrics: PerformanceMetrics = {
    id: genId('met'),
    tenantId: tenantKey,
    campaignId,
    collectedAt: new Date().toISOString(),
    attribution,
    ...normalized,
  };
  return insert<PerformanceMetrics>(tenantKey, 'metrics', metrics);
}

export function listMetrics(tenantKey: string, campaignId?: string): PerformanceMetrics[] {
  const all = listAll<PerformanceMetrics>(tenantKey, 'metrics');
  return campaignId ? all.filter((m) => m.campaignId === campaignId) : all;
}

/** Engagement rate — a normalized, comparable health score. */
export function engagementRate(m: PerformanceMetrics): number {
  const base = m.reach || m.impressions || m.views || 0;
  if (!base) return 0;
  const interactions = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
  return Number(((interactions / base) * 100).toFixed(2));
}

// ─── Learning Engine (§33) — learns ONLY from measured data ─────────────────
export function deriveLearnings(tenantKey: string, campaign: Campaign): Learning[] {
  const metrics = listMetrics(tenantKey, campaign.id);
  if (!metrics.length) return []; // §33 — never invent performance/learning.

  const learnings: Learning[] = [];
  const agg = metrics.reduce(
    (acc, m) => {
      acc.views += m.views || 0;
      acc.engagement += engagementRate(m);
      acc.completion += m.completionRate || 0;
      acc.clicks += m.clicks || 0;
      acc.count += 1;
      return acc;
    },
    { views: 0, engagement: 0, completion: 0, clicks: 0, count: 0 },
  );

  const avgEngagement = agg.count ? agg.engagement / agg.count : 0;
  const avgCompletion = agg.count ? agg.completion / agg.count : 0;

  const push = (topic: string, insight: string, appliesTo: Learning['appliesTo'], confidence: Confidence) => {
    learnings.push({
      id: genId('lrn'),
      tenantId: tenantKey,
      campaignId: campaign.id,
      topic,
      insight,
      appliesTo,
      confidence,
      measuredAt: new Date().toISOString(),
    });
  };

  if (avgCompletion > 0) {
    push(
      'video_length',
      avgCompletion >= 0.6
        ? `Measured completion rate ${(avgCompletion * 100).toFixed(0)}% — this length/pacing held attention; reuse for similar campaigns.`
        : `Measured completion rate ${(avgCompletion * 100).toFixed(0)}% — audience dropped off; test a shorter cut and stronger hook.`,
      ['length', 'hook'],
      avgCompletion >= 0.6 ? 'HIGH' : 'MEDIUM',
    );
  }
  if (agg.views > 0) {
    push(
      'platform_performance',
      `Campaign reached ${agg.views.toLocaleString()} views with ${avgEngagement.toFixed(2)}% average engagement across ${agg.count} platform(s).`,
      ['platform', 'format'],
      avgEngagement >= 3 ? 'HIGH' : 'MEDIUM',
    );
  }
  if (agg.clicks > 0) {
    push(
      'cta_effectiveness',
      `CTA drove ${agg.clicks} measured clicks — the offer/CTA pairing produced direct response; keep the CTA pattern for this objective.`,
      ['cta'],
      'HIGH',
    );
  }

  return learnings.map((l) => insert<Learning>(tenantKey, 'learnings', l));
}

export function listLearnings(tenantKey: string): Learning[] {
  return listAll<Learning>(tenantKey, 'learnings');
}

/** Content memory (§34) — the next campaign knows what happened before. */
export function campaignMemory(tenantKey: string) {
  const campaigns = listAll<Campaign>(tenantKey, 'campaigns');
  const learnings = listLearnings(tenantKey);
  const metrics = listMetrics(tenantKey);
  return {
    totalCampaigns: campaigns.length,
    publishedCampaigns: campaigns.filter((c) => c.status === 'PUBLISHED').length,
    totalLearnings: learnings.length,
    totalMeasuredViews: metrics.reduce((a, m) => a + (m.views || 0), 0),
    recentLearnings: learnings.slice(-5),
  };
}

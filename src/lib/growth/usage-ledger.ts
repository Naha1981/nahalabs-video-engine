// NahaLabs Growth OS — Usage Ledger & Cost-to-Serve (§24, §49, §48)
//
// The usage ledger is the source of truth for pricing validation. Every paid or
// free operation is recorded BEFORE/AFTER execution via the Cost Guard. Cost to
// serve per tier is MODELED and, as real usage lands, the model's assumptions
// are replaced by measured values. The least-certain assumption is always
// flagged (§24) rather than hidden inside a healthy-looking margin.

import type { UsageEvent, CostEstimate, CostMode, GrowthPlanTier, GrowthPlanTierId } from './types';
import { evaluateCostGuard } from './providers';
import { insert, update, listAll, genId } from './tenant-store';

// ─── Estimate before expensive execution ────────────────────────────────────
export function estimateOperation(input: {
  operation: string;
  provider: string;
  estimatedCostUsd: number;
  free: boolean;
  breakdown?: { line: string; costUsd: number }[];
}): CostEstimate {
  return {
    operation: input.operation,
    provider: input.provider,
    estimatedCostUsd: input.estimatedCostUsd,
    free: input.free,
    breakdown: input.breakdown || [{ line: input.operation, costUsd: input.estimatedCostUsd }],
  };
}

// ─── Eligibility → Cost Guard → (Provider) → Usage Ledger (§16/§23) ─────────
export function authorizeAndRecord(input: {
  tenantKey: string;
  campaignId?: string;
  projectId?: string;
  operation: string;
  provider: string;
  model?: string;
  quantity?: number;
  unit?: string;
  estimatedCostUsd: number;
  free: boolean;
  mode: CostMode;
  budgetUsd?: number;
}): { allowed: boolean; reason: string; event?: UsageEvent } {
  const guard = evaluateCostGuard({
    mode: input.mode,
    providerId: input.provider,
    estimatedCostUsd: input.estimatedCostUsd,
    budgetUsd: input.budgetUsd,
  });

  // Record the attempt in the ledger regardless (auditable; blocked = blocked).
  const event: UsageEvent = {
    id: genId('use'),
    tenantId: input.tenantKey,
    campaignId: input.campaignId,
    projectId: input.projectId,
    operation: input.operation,
    provider: input.provider,
    model: input.model,
    quantity: input.quantity ?? 1,
    unit: input.unit,
    estimatedCostUsd: input.estimatedCostUsd,
    freeUsage: input.free || !guard.allowed,
    paidUsage: guard.allowed && !input.free && input.estimatedCostUsd > 0,
    timestamp: new Date().toISOString(),
  };
  insert<UsageEvent>(input.tenantKey, 'usage', event);

  return { allowed: guard.allowed, reason: guard.reason, event: guard.allowed ? event : undefined };
}

/** Reconcile an estimate with the actual measured cost after execution. */
export function recordActualCost(tenantKey: string, eventId: string, actualCostUsd: number): UsageEvent {
  const event = listAll<UsageEvent>(tenantKey, 'usage').find((u) => u.id === eventId);
  if (!event) throw new Error(`USAGE_EVENT_NOT_FOUND:${eventId}`);
  return update<UsageEvent>(tenantKey, 'usage', eventId, {
    actualCostUsd,
    paidUsage: actualCostUsd > 0,
    freeUsage: actualCostUsd <= 0,
  });
}

export function listUsage(tenantKey: string): UsageEvent[] {
  return listAll<UsageEvent>(tenantKey, 'usage');
}

export function usageTotals(tenantKey: string): { freeCostUsd: number; paidCostUsd: number; operations: number } {
  const events = listAll<UsageEvent>(tenantKey, 'usage');
  return events.reduce(
    (acc, e) => {
      const cost = e.actualCostUsd ?? e.estimatedCostUsd;
      if (e.paidUsage) acc.paidCostUsd += cost;
      else acc.freeCostUsd += cost;
      acc.operations += 1;
      return acc;
    },
    { freeCostUsd: 0, paidCostUsd: 0, operations: 0 },
  );
}

// ─── Pricing tiers (§48) + modeled cost-to-serve (§24) ──────────────────────
//
// Values are conservative MODEL assumptions. Each assumption carries a
// confidence; the LEAST certain one is surfaced to the owner/pricing UI. As
// measured ledger data accrues, `measuredCostToServe` replaces the model.
export const GROWTH_PLAN_TIERS: GrowthPlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyCampaigns: 4,
    platforms: ['instagram', 'facebook'],
    generationAllowance: 0, // free-only by default
    researchRunsPerMonth: 30,
    storageGb: 5,
    publishingAllowance: 12,
    features: ['business understanding', 'industry packs', 'real-asset editing', 'approval workflow', 'captions'],
    modeledCostToServeUsd: 6.5,
    leastCertainAssumption: 'Generation cost assumed $0 (FREE_ONLY); if owners add paid generation, per-campaign cost rises $0.15–$1.33 — validate during Pilot Proof.',
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyCampaigns: 20,
    platforms: ['instagram', 'facebook', 'tiktok'],
    generationAllowance: 20,
    researchRunsPerMonth: 200,
    storageGb: 50,
    publishingAllowance: 60,
    features: ['everything in Starter', 'licensed stock', 'limited generation', 'autopilot (opt-in)', 'performance learning'],
    modeledCostToServeUsd: 34,
    leastCertainAssumption: 'Research provider cost is shared across tenants and has NOT been measured at volume — this is the least-trusted number; validate before Validated stage.',
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyCampaigns: 100,
    platforms: ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'],
    generationAllowance: 120,
    researchRunsPerMonth: 1000,
    storageGb: 250,
    publishingAllowance: 300,
    features: ['everything in Growth', 'multi-platform', 'higher generation', 'priority rendering', 'API/MCP access'],
    modeledCostToServeUsd: 165,
    leastCertainAssumption: 'Render + storage at 100 campaigns/month extrapolated from single-campaign measurements; storage growth is unvalidated.',
  },
];

export function getPlanTier(id: GrowthPlanTierId): GrowthPlanTier {
  return GROWTH_PLAN_TIERS.find((t) => t.id === id) || GROWTH_PLAN_TIERS[0];
}

export interface CostToServeModel {
  researchCostUsd: number;
  generationCostUsd: number;
  renderCostUsd: number;
  storageCostUsd: number;
  publishingCostUsd: number;
  transcriptionCostUsd: number;
  otherCostUsd: number;
  totalCostUsd: number;
  leastCertainLine: string;
  measured: boolean;
}

/** Model per-campaign cost-to-serve from a usage ledger (measured if data exists). */
export function modelCostToServe(tenantKey: string, campaignsPerMonth: number): CostToServeModel {
  const events = listAll<UsageEvent>(tenantKey, 'usage');
  const measured = events.length > 0;

  const sum = (op: string) => events.filter((e) => e.operation.includes(op)).reduce((a, e) => a + (e.actualCostUsd ?? e.estimatedCostUsd), 0);

  // Measured average per campaign so far (fallback to conservative defaults).
  const perCampaign = (line: string, defaultCost: number) => {
    const total = sum(line);
    return measured && campaignsPerMonth > 0 ? total / Math.max(1, events.length) : defaultCost;
  };

  const model: CostToServeModel = {
    researchCostUsd: perCampaign('research', 0.08),
    generationCostUsd: perCampaign('generation', 0.6),
    renderCostUsd: perCampaign('render', 0.9),
    storageCostUsd: perCampaign('storage', 0.12),
    publishingCostUsd: perCampaign('publishing', 0.05),
    transcriptionCostUsd: perCampaign('transcription', 0.15),
    otherCostUsd: perCampaign('other', 0.1),
    totalCostUsd: 0,
    leastCertainLine: measured
      ? 'Measured sample size is small; research + generation variance remains the least-certain line.'
      : 'No measured usage yet — all lines are modeled assumptions; generation cost ($0.15–$1.33/short range) is the least certain.',
    measured,
  };
  model.totalCostUsd = Number(
    (
      model.researchCostUsd +
      model.generationCostUsd +
      model.renderCostUsd +
      model.storageCostUsd +
      model.publishingCostUsd +
      model.transcriptionCostUsd +
      model.otherCostUsd
    ).toFixed(3),
  );
  return model;
}

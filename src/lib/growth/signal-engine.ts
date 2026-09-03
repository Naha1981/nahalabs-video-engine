// NahaLabs Growth OS — Signal Engine (§11)
//
// Generic signal ingestion and scoring. Signals are the raw material of the
// growth loop. This module only scores/stores; the Opportunity Engine decides
// whether a signal is worth acting on.
//
// Signal strength (raw) × relevance (to this tenant) → weighted score.
// Compliance flags are set at ingestion (§10) — prohibited/unsourced competitor
// signals never become opportunities.

import type { Signal, SignalType, SignalSourceType, Confidence, BusinessSignal } from './types';
import { insert, listAll, genId } from './tenant-store';

export interface IngestSignalInput {
  type: SignalType;
  source: string;
  sourceType: SignalSourceType;
  evidence: string;
  confidence?: Confidence;
  strength?: number;
  relevance?: number;
  expiresInHours?: number;
  complianceFlag?: Signal['complianceFlag'];
  metadata?: Record<string, unknown>;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function ingestSignal(tenantKey: string, input: IngestSignalInput): Signal {
  const now = Date.now();
  const signal: Signal = {
    id: genId('sig'),
    tenantId: tenantKey,
    type: input.type,
    source: input.source,
    sourceType: input.sourceType,
    evidence: input.evidence,
    confidence: input.confidence || 'MEDIUM',
    strength: clamp(input.strength ?? 50),
    relevance: clamp(input.relevance ?? 60),
    timestamp: new Date(now).toISOString(),
    expiresAt: input.expiresInHours ? new Date(now + input.expiresInHours * 3600_000).toISOString() : undefined,
    complianceFlag: input.complianceFlag || 'ok',
    metadata: input.metadata,
  };
  return insert<Signal>(tenantKey, 'signals', signal);
}

/** 0-100 weighted score used by the Opportunity Engine. */
export function signalScore(s: Signal): number {
  const confidenceWeight = s.confidence === 'HIGH' ? 1 : s.confidence === 'MEDIUM' ? 0.7 : 0.4;
  const base = s.strength * 0.5 + s.relevance * 0.5;
  return clamp(base * confidenceWeight);
}

export function activeSignals(tenantKey: string): Signal[] {
  const now = Date.now();
  return listAll<Signal>(tenantKey, 'signals')
    .filter((s) => !s.expiresAt || new Date(s.expiresAt).getTime() > now)
    .filter((s) => s.complianceFlag !== 'prohibited_source')
    .sort((a, b) => signalScore(b) - signalScore(a));
}

// ─── Authorized business signals (§32) — booking/covers/sales patterns ──────
/**
 * Convert an authorized business metric (covers, sales, bookings) into a Signal
 * when it deviates from the historical baseline. This is the Growth OS growth
 * trigger (e.g. "Tuesday covers below normal" → opportunity).
 * Attribution is always marked DIRECTLY_MEASURED only for real ingested data.
 */
export function ingestBusinessMetric(
  tenantKey: string,
  metric: Omit<BusinessSignal, 'id' | 'tenantId' | 'deltaPercent' | 'attribution' | 'timestamp'> & {
    deltaPercent?: number;
    attribution?: BusinessSignal['attribution'];
    timestamp?: string;
  },
): { businessSignal: BusinessSignal; generatedSignal?: Signal } {
  const baseline = metric.baseline || metric.value;
  const deltaPercent = metric.deltaPercent ?? (baseline ? ((metric.value - baseline) / baseline) * 100 : 0);

  const businessSignal: BusinessSignal = {
    ...metric,
    id: genId('bsi'),
    tenantId: tenantKey,
    kind: metric.kind,
    value: metric.value,
    baseline,
    deltaPercent: Math.round(deltaPercent * 10) / 10,
    period: metric.period,
    timestamp: metric.timestamp || new Date().toISOString(),
    attribution: metric.attribution || 'DIRECTLY_MEASURED',
  };
  insert<BusinessSignal>(tenantKey, 'businessSignals', businessSignal);

  let generatedSignal: Signal | undefined;
  // A meaningful DROP (>=15% below baseline) on a demand metric is an opportunity trigger.
  if (deltaPercent <= -15 && ['bookings', 'covers', 'sales', 'appointments', 'enquiries'].includes(metric.kind)) {
    generatedSignal = ingestSignal(tenantKey, {
      type: metric.kind === 'sales' || metric.kind === 'product_sales' ? 'SALES_PATTERN' : 'BOOKING_PATTERN',
      source: 'authorized business data',
      sourceType: 'authorized_business_data',
      evidence: `${metric.kind} for ${metric.period} are ${Math.abs(Math.round(deltaPercent))}% below the historical baseline (${metric.value} vs baseline ${baseline}).`,
      confidence: 'HIGH',
      strength: clamp(Math.abs(deltaPercent) * 1.6),
      relevance: 90,
      expiresInHours: 72,
      metadata: { businessSignalId: businessSignal.id },
    });
  }

  return { businessSignal, generatedSignal };
}

export function listBusinessSignals(tenantKey: string): BusinessSignal[] {
  return listAll<BusinessSignal>(tenantKey, 'businessSignals');
}

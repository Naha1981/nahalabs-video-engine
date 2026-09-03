import { NextRequest, NextResponse } from 'next/server';
import { activeSignals, ingestSignal, ingestBusinessMetric, listBusinessSignals } from '@/lib/growth/signal-engine';
import { tenantExists } from '@/lib/growth/tenant-store';

// GET /api/growth/signals?tenantId=...  → active signals + business signals
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || '';
  if (!tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
  if (!tenantExists(tenantId)) return NextResponse.json({ success: false, error: 'TENANT_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({
    success: true,
    signals: activeSignals(tenantId),
    businessSignals: listBusinessSignals(tenantId),
  });
}

// POST /api/growth/signals { tenantId, kind: 'signal'|'business_metric', ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });

    if (body.kind === 'business_metric') {
      // §32 — authorized booking/covers/sales data becomes a signal only on real deviation.
      const { businessSignal, generatedSignal } = ingestBusinessMetric(body.tenantId, {
        kind: body.metricKind,
        value: Number(body.value),
        baseline: Number(body.baseline),
        period: body.period || 'this week',
      });
      return NextResponse.json({ success: true, businessSignal, generatedSignal });
    }

    const signal = ingestSignal(body.tenantId, {
      type: body.type,
      source: body.source || 'manual',
      sourceType: body.sourceType || 'owner_provided',
      evidence: body.evidence || '',
      confidence: body.confidence,
      strength: body.strength,
      relevance: body.relevance,
      expiresInHours: body.expiresInHours,
    });
    return NextResponse.json({ success: true, signal }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: 'SIGNAL_ERROR', message }, { status: 400 });
  }
}

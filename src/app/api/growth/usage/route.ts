import { NextRequest, NextResponse } from 'next/server';
import { listUsage, usageTotals, modelCostToServe, GROWTH_PLAN_TIERS } from '@/lib/growth/usage-ledger';
import { tenantExists } from '@/lib/growth/tenant-store';

// GET /api/growth/usage?tenantId=...&campaignsPerMonth=20
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || '';
  if (!tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
  if (!tenantExists(tenantId)) return NextResponse.json({ success: false, error: 'TENANT_NOT_FOUND' }, { status: 404 });
  const campaignsPerMonth = Number(req.nextUrl.searchParams.get('campaignsPerMonth') || '20');

  return NextResponse.json({
    success: true,
    ledger: listUsage(tenantId),
    totals: usageTotals(tenantId),
    costToServe: modelCostToServe(tenantId, campaignsPerMonth),
    planTiers: GROWTH_PLAN_TIERS,
  });
}

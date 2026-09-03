import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfile, ensureSeedTenant, tenantExists } from '@/lib/growth/tenant-store';
import { evaluateOpportunities, listOpportunities } from '@/lib/growth/opportunity-engine';
import { runResearch } from '@/lib/growth/research-engine';

export async function GET(req: NextRequest) {
  ensureSeedTenant();
  const tenantId = req.nextUrl.searchParams.get('tenantId') || '';
  if (!tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
  if (!tenantExists(tenantId)) return NextResponse.json({ success: false, error: 'TENANT_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ success: true, opportunities: listOpportunities(tenantId) });
}

// POST /api/growth/opportunities { tenantId, usableFootageCount? } → run research + evaluate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
    const profile = getBusinessProfile(body.tenantId);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'BUSINESS_NOT_UNDERSTOOD', message: 'Onboard a business / send a campaign brief first.' }, { status: 400 });
    }
    const research = runResearch({ tenantKey: body.tenantId, profile, trigger: body.trigger || 'on_demand_campaign' });
    const opportunities = evaluateOpportunities({ tenantKey: body.tenantId, profile, research, usableFootageCount: body.usableFootageCount });
    return NextResponse.json({ success: true, research, opportunities });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: 'OPPORTUNITY_ERROR', message }, { status: 400 });
  }
}

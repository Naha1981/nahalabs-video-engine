import { NextRequest, NextResponse } from 'next/server';
import { intakeCampaign, listCampaigns } from '@/lib/growth/campaigns';
import { runIntelligence } from '@/lib/growth/growth-loop';
import { ensureSeedTenant } from '@/lib/growth/tenant-store';

// GET /api/growth/campaigns?tenantId=...
export async function GET(req: NextRequest) {
  ensureSeedTenant();
  const tenantId = req.nextUrl.searchParams.get('tenantId') || '';
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'TENANT_REQUIRED', message: 'tenantId query parameter is required' }, { status: 400 });
  }
  try {
    return NextResponse.json({ success: true, campaigns: listCampaigns(tenantId) });
  } catch {
    return NextResponse.json({ success: false, error: 'TENANT_NOT_FOUND', message: 'Unknown tenant — access denied (fail-closed isolation).' }, { status: 404 });
  }
}

// POST /api/growth/campaigns  { tenantId, message, ... } → intake + run intelligence
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.tenantId) {
      return NextResponse.json({ success: false, error: 'TENANT_REQUIRED', message: 'tenantId is required' }, { status: 400 });
    }

    // §3 — conversational or dashboard intake converge into the same Campaign entity.
    const { campaign, understanding } = intakeCampaign({
      tenantKey: body.tenantId,
      message: body.message,
      objective: body.objective,
      platforms: body.platforms,
      offer: body.offer,
      audience: body.audience,
      budgetUsd: body.budgetUsd,
      approvalPolicy: body.approvalPolicy,
      source: body.source || (body.message ? 'conversation' : 'dashboard'),
    });

    // Run the autonomous front of the loop: research → opportunity → strategy.
    const { result, strategy } = runIntelligence(body.tenantId, campaign.id);

    return NextResponse.json({
      success: true,
      campaign,
      business: understanding.profile,
      missingInfo: understanding.profile.missingCriticalInfo,
      loop: result,
      strategy,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: 'CAMPAIGN_INTAKE_ERROR', message }, { status: 400 });
  }
}

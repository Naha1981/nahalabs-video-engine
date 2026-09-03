import { NextRequest, NextResponse } from 'next/server';
import { getCampaign, applyApproval, resumeFromCheckpoint } from '@/lib/growth/campaigns';
import { runProductionAndPublish, closeLoopWithMetrics } from '@/lib/growth/growth-loop';

interface Ctx {
  params: Promise<{ campaignId: string }>;
}

function tenantOf(req: NextRequest): string {
  return req.nextUrl.searchParams.get('tenantId') || '';
}

// GET /api/growth/campaigns/:id?tenantId=...
export async function GET(req: NextRequest, ctx: Ctx) {
  const { campaignId } = await ctx.params;
  const tenantId = tenantOf(req);
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
  }
  const campaign = getCampaign(tenantId, campaignId);
  if (!campaign) {
    return NextResponse.json({ success: false, error: 'CAMPAIGN_NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ success: true, campaign });
}

// POST /api/growth/campaigns/:id?tenantId=...  { action: 'approve'|'request_changes'|'reject'|'produce'|'resume'|'record_metrics', ... }
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { campaignId } = await ctx.params;
    const tenantId = tenantOf(req);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
    }
    const body = await req.json();

    switch (body.action) {
      case 'approve':
      case 'request_changes':
      case 'reject': {
        const actionMap = { approve: 'APPROVE', request_changes: 'REQUEST_CHANGES', reject: 'REJECT' } as const;
        const mapped = actionMap[body.action as keyof typeof actionMap];
        const campaign = applyApproval(tenantId, campaignId, mapped, body.note);
        return NextResponse.json({ success: true, campaign });
      }
      case 'produce': {
        // Owner approval is the default gate; if produce is called we assume approval recorded.
        applyApproval(tenantId, campaignId, 'APPROVE');
        const result = runProductionAndPublish(tenantId, campaignId, {
          qcPassed: body.qcPassed !== false,
          mediaUrl: body.mediaUrl,
          caption: body.caption,
        });
        return NextResponse.json({ success: true, loop: result, campaign: getCampaign(tenantId, campaignId) });
      }
      case 'resume': {
        const { campaign, resumeAt } = resumeFromCheckpoint(tenantId, campaignId);
        return NextResponse.json({ success: true, campaign, resumeAt });
      }
      case 'record_metrics': {
        const result = closeLoopWithMetrics(tenantId, campaignId, body.metrics);
        return NextResponse.json({ success: true, loop: result, campaign: getCampaign(tenantId, campaignId) });
      }
      default:
        return NextResponse.json({ success: false, error: 'UNKNOWN_ACTION', message: `Unknown action: ${body.action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('NOT_FOUND') ? 404 : 400;
    return NextResponse.json({ success: false, error: 'CAMPAIGN_ACTION_ERROR', message }, { status });
  }
}

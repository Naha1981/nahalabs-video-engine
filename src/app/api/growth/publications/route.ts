import { NextRequest, NextResponse } from 'next/server';
import { listPublications, executePublication, requestPublish } from '@/lib/growth/publishing';
import { getCampaign } from '@/lib/growth/campaigns';
import { tenantExists } from '@/lib/growth/tenant-store';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || '';
  if (!tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
  if (!tenantExists(tenantId)) return NextResponse.json({ success: false, error: 'TENANT_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ success: true, publications: listPublications(tenantId) });
}

// POST { tenantId, campaignId, platform, mediaUrl, caption } → request publish
//      { tenantId, publicationJobId, action: 'execute' } → execute (real if configured)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });

    if (body.action === 'execute' && body.publicationJobId) {
      const job = await executePublication(body.tenantId, body.publicationJobId);
      return NextResponse.json({ success: true, publication: job });
    }

    const campaign = getCampaign(body.tenantId, body.campaignId);
    if (!campaign) return NextResponse.json({ success: false, error: 'CAMPAIGN_NOT_FOUND' }, { status: 404 });
    const job = requestPublish(body.tenantId, campaign, body.platform || campaign.platforms[0], body.mediaUrl || '', body.caption);
    return NextResponse.json({ success: true, publication: job }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: 'PUBLICATION_ERROR', message }, { status: 400 });
  }
}

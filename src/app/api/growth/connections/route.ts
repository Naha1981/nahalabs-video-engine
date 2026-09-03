import { NextRequest, NextResponse } from 'next/server';
import { initiateConnection, listConnections, setAutopilot } from '@/lib/growth/publishing';
import { tenantExists } from '@/lib/growth/tenant-store';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || '';
  if (!tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });
  if (!tenantExists(tenantId)) return NextResponse.json({ success: false, error: 'TENANT_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ success: true, connections: listConnections(tenantId) });
}

// POST { tenantId, platform } to initiate OAuth; { tenantId, connectionId, autopilot } to toggle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.tenantId) return NextResponse.json({ success: false, error: 'TENANT_REQUIRED' }, { status: 400 });

    if (body.connectionId && typeof body.autopilot === 'boolean') {
      const conn = setAutopilot(body.tenantId, body.connectionId, body.autopilot);
      return NextResponse.json({ success: true, connection: conn });
    }

    if (!body.platform) {
      return NextResponse.json({ success: false, error: 'PLATFORM_REQUIRED' }, { status: 400 });
    }
    const conn = initiateConnection(body.tenantId, body.platform);
    // OAuth-only; we never collect passwords (§30).
    return NextResponse.json({
      success: true,
      connection: conn,
      note: conn.status === 'not_authorized'
        ? 'OAuth app credentials are not configured on the server. Configure the platform OAuth client to enable connect; passwords are never accepted.'
        : 'Redirect the owner to the platform OAuth consent screen.',
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: 'CONNECTION_ERROR', message }, { status: 400 });
  }
}

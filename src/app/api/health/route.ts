import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'nahalabs-video-engine',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    version: '3.0.0-governed',
    upstreamEngine: 'OpenMontage Architecture v1.2',
    uptimeSeconds: Math.floor(process.uptime()),
    governance: 'NAHALABS 10/10 ACTIVE'
  });
}

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'live',
    service: 'nahalabs-video-engine',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memory: process.memoryUsage(),
  });
}

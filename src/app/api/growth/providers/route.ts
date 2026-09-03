import { NextResponse } from 'next/server';
import { getProviders } from '@/lib/growth/providers';

// GET /api/growth/providers → honest provider availability (never fake success).
export async function GET() {
  const providers = getProviders();
  const configuredCount = providers.filter((p) => p.status === 'configured').length;
  return NextResponse.json({
    success: true,
    providers,
    summary: {
      total: providers.length,
      configured: configuredCount,
      unconfigured: providers.length - configuredCount,
      costModeDefault: 'FREE_ONLY',
    },
  });
}

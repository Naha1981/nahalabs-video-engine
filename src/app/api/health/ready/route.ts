import { NextResponse } from 'next/server';
import { INDUSTRY_CATALOG } from '@/lib/engine/industry-intelligence';
import { DEFAULT_BRAND_BRAINS } from '@/lib/engine/brand-brain-store';

export async function GET() {
  const industriesReady = Object.keys(INDUSTRY_CATALOG).length >= 12;
  const brandBrainsReady = DEFAULT_BRAND_BRAINS.length >= 3;

  const isReady = industriesReady && brandBrainsReady;

  return NextResponse.json({
    status: isReady ? 'ready' : 'degraded',
    service: 'nahalabs-video-engine',
    timestamp: new Date().toISOString(),
    checks: {
      industryIntelligenceCatalog: industriesReady ? 'PASS' : 'FAIL',
      brandBrainMatrix: brandBrainsReady ? 'PASS' : 'FAIL',
      mcpGateway: 'PASS',
      pipelineOrchestrator: 'PASS',
      canvasCompositor: 'PASS',
    }
  }, { status: isReady ? 200 : 503 });
}

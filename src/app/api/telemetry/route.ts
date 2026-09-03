import { NextRequest, NextResponse } from 'next/server';
import { TelemetryEvent, IntentSignal } from '@/lib/engine/types';
import { INITIAL_INTENT_SIGNALS } from '@/lib/store/video-store';

let eventsStore: TelemetryEvent[] = [];
let intentSignalsStore: IntentSignal[] = [...INITIAL_INTENT_SIGNALS];

export async function GET() {
  return NextResponse.json({
    success: true,
    intentSignals: intentSignalsStore,
    recentEvents: eventsStore.slice(0, 30)
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event: TelemetryEvent = {
      id: `evt-${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      tenantId: body.tenantId || 'tenant-default',
      projectId: body.projectId,
      eventName: body.eventName || 'video.progress_updated',
      channel: body.channel || 'video_player',
      actorId: body.actorId || 'anonymous_viewer',
      timestamp: new Date().toISOString(),
      properties: body.properties || {}
    };

    eventsStore.unshift(event);
    if (eventsStore.length > 200) eventsStore.pop();

    // Recalculate or update intent signal
    const watchDepth = Number(body.properties?.watchDepthPercent || 0);
    const ctaClicked = Boolean(body.properties?.ctaClicked);
    const repeatViews = Number(body.properties?.repeatViews || 1);

    let intentScore = Math.min(100, Math.round((watchDepth * 0.5) + (ctaClicked ? 35 : 0) + (repeatViews * 8)));

    let readiness: IntentSignal['inferredReadiness'] = 'Top Funnel Casual';
    if (intentScore >= 80) readiness = 'High Buying Intent';
    else if (intentScore >= 50) readiness = 'Considering / Evaluating';

    const existingSignal = intentSignalsStore.find(s => s.viewerId === event.actorId && s.projectId === event.projectId);
    if (existingSignal) {
      existingSignal.intentScore = Math.max(existingSignal.intentScore, intentScore);
      existingSignal.watchDepthPercent = Math.max(existingSignal.watchDepthPercent, watchDepth);
      existingSignal.repeatViews += 1;
      if (ctaClicked) existingSignal.ctaClicked = true;
      existingSignal.inferredReadiness = readiness;
      existingSignal.lastActive = 'Just now';
    } else if (event.projectId) {
      intentSignalsStore.unshift({
        viewerId: event.actorId,
        projectId: event.projectId,
        projectTitle: body.projectTitle || 'Commercial Video Asset',
        intentScore,
        funnelStage: body.funnelStage || 'TOP_OF_FUNNEL_HOOK',
        watchDepthPercent: watchDepth,
        repeatViews,
        ctaClicked,
        inferredReadiness: readiness,
        lastActive: 'Just now',
      });
      if (intentSignalsStore.length > 50) intentSignalsStore.pop();
    }

    return NextResponse.json({
      success: true,
      event,
      calculatedIntentScore: intentScore,
      inferredReadiness: readiness,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 400 });
  }
}

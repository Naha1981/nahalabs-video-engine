import { NextRequest, NextResponse } from 'next/server';
import { runPrecomposeValidation } from '@/lib/engine/precompose-validator';
import { runPostRenderReview } from '@/lib/engine/post-render-reviewer';
import { getBrandBrain } from '@/lib/engine/brand-brain-store';
import { VideoProject } from '@/lib/engine/types';
import { calculateVideoCost } from '@/lib/engine/cost-governor';

export async function POST(req: NextRequest) {
  try {
    const project: VideoProject = await req.json();
    const brandBrain = getBrandBrain(project.brandBrainId);

    // Step 1: Precompose Validation Gate
    const precomposeCheck = runPrecomposeValidation(project.scenes, brandBrain);
    if (!precomposeCheck.valid) {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: 'PRECOMPOSE_VALIDATION_FAILED',
        precomposeCheck,
        message: 'Project failed pre-compose quality boundaries. Please address failed checks before rendering.'
      }, { status: 422 });
    }

    // Step 2: Simulate Synthesis & Rendering (Audio, Canvas Composition, Encoding)
    const cost = calculateVideoCost({
      durationSeconds: project.totalDurationSec || 60,
      resolution: project.aspectRatio === '9:16' ? '1080p' : '4K Cinema',
      sceneCount: project.scenes.length,
      shotCount: project.scenes.length,
      aiProvider: 'nahalabs_canvas',
      ttsVoiceEnabled: true,
    });

    // Step 3: Post-Render Self-Review Engine
    const postRenderReview = runPostRenderReview(project, brandBrain);

    const renderedProject: VideoProject = {
      ...project,
      status: 'ready',
      approvalStatus: 'CLIENT_REVIEW',
      precomposeCheck,
      postRenderReview,
      renderedAt: new Date().toISOString(),
      renderCostUsd: cost.totalCostUsd,
      tokensConsumed: cost.llmTokensEstimated,
      videoExportUrl: `/exports/nahalabs_${project.id}_master.mp4`,
      thumbnailUrl: project.scenes[0]?.shots[0]?.bRollAssetUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80'
    };

    return NextResponse.json({
      success: true,
      status: 'ready',
      project: renderedProject,
      costBreakdown: cost,
      precomposeCheck,
      postRenderReview,
      message: 'Render and post-render review successfully executed.'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'RENDER_ENGINE_ERROR',
      message: err.message
    }, { status: 500 });
  }
}

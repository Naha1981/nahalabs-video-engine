import { VideoProject, Scene, FunnelStage, IndustryId, BrandBrain, Shot } from './types';
import { getIndustryIntelligence } from './industry-intelligence';
import { getBrandBrain } from './brand-brain-store';
import { enrichRealismPrompt, STANDARD_NEGATIVE_PROMPT } from './realism-engine';
import { runPrecomposeValidation } from './precompose-validator';
import { runPostRenderReview } from './post-render-reviewer';
import { calculateVideoCost } from './cost-governor';

export interface GenerateProjectParams {
  title: string;
  industryId: IndustryId;
  funnelStage: FunnelStage;
  brandBrainId: string;
  commercialObjective: string;
  primaryValueProp: string;
  targetAudience: string;
  callToAction: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export function generateCommercialVideoProject(params: GenerateProjectParams): VideoProject {
  const industry = getIndustryIntelligence(params.industryId);
  const brandBrain = getBrandBrain(params.brandBrainId);
  const aspectRatio = params.aspectRatio || brandBrain.visualIdentity.aspectRatioDefault || '16:9';

  // Build 4-5 high-converting scenes based on funnel stage
  const scenes: Scene[] = [];

  // Scene 1: Pattern Interrupt Hook
  const hookBlueprint = industry.hookBlueprints[0] || {
    pattern: 'Direct Pattern Interrupt',
    example: `If you are still running manual operations in ${industry.title}, this will change everything.`,
    targetEmotion: 'Urgent Recognition'
  };

  const scene1Duration = industry.pacingGuidelines.hookDurationSec || 4;
  const shot1: Shot = {
    id: 'shot-1',
    durationSec: scene1Duration,
    shotType: 'macro_detail',
    cameraMotion: 'subtle_zoom_in',
    lightingStyle: 'hyper_realistic_soft_studio',
    realismPrompt: enrichRealismPrompt(
      `Extreme close-up macro visual of ${industry.visualMetaphors[0] || 'high-tech operational interface'}`,
      'macro_detail',
      'subtle_zoom_in',
      'hyper_realistic_soft_studio'
    ),
    negativePrompt: STANDARD_NEGATIVE_PROMPT,
    stockFootageKeywords: industry.defaultStockTags.slice(0, 3),
    bRollAssetUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1920&q=80',
    overlayText: 'THE UNCOMFORTABLE REALITY'
  };

  scenes.push({
    id: 'scene-1-hook',
    sceneIndex: 0,
    title: 'Scene 1: Pattern Interrupt Hook',
    funnelSection: 'HOOK',
    durationSec: scene1Duration,
    narrationText: hookBlueprint.example,
    shots: [shot1],
    backgroundColor: brandBrain.visualIdentity.backgroundColor,
    accentColor: brandBrain.visualIdentity.primaryColor,
    musicMood: 'urgent_countdown'
  });

  // Scene 2: Problem Agitation
  const scene2Duration = industry.pacingGuidelines.problemAgitationSec || 12;
  const shot2: Shot = {
    id: 'shot-2',
    durationSec: scene2Duration,
    shotType: 'medium_over_shoulder',
    cameraMotion: 'lateral_truck_right',
    lightingStyle: 'moody_dramatic_rim',
    realismPrompt: enrichRealismPrompt(
      `Executive or practitioner in ${industry.title} confronting operational chaos and bottleneck`,
      'medium_over_shoulder',
      'lateral_truck_right',
      'moody_dramatic_rim'
    ),
    negativePrompt: STANDARD_NEGATIVE_PROMPT,
    stockFootageKeywords: industry.defaultStockTags,
    bRollAssetUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1920&q=80',
    overlayText: 'THE HIDDEN COST'
  };

  scenes.push({
    id: 'scene-2-problem',
    sceneIndex: 1,
    title: 'Scene 2: Problem Agitation & Cost of Inaction',
    funnelSection: 'PROBLEM',
    durationSec: scene2Duration,
    narrationText: `Every day you delay solving this, your team loses valuable momentum and margin. While competitors modernize, traditional methods silently drain your resources.`,
    shots: [shot2],
    backgroundColor: '#0a0e1a',
    accentColor: '#f43f5e',
    musicMood: 'curious_minimal'
  });

  // Scene 3: Solution Reveal (Value Prop)
  const scene3Duration = industry.pacingGuidelines.solutionRevealSec || 18;
  const shot3: Shot = {
    id: 'shot-3',
    durationSec: scene3Duration,
    shotType: 'dynamic_tracking',
    cameraMotion: 'dolly_forward',
    lightingStyle: 'bright_natural_morning',
    realismPrompt: enrichRealismPrompt(
      `Sleek technological solution in action: ${params.primaryValueProp}. Crystal-clear data and high velocity throughput`,
      'dynamic_tracking',
      'dolly_forward',
      'bright_natural_morning'
    ),
    negativePrompt: STANDARD_NEGATIVE_PROMPT,
    stockFootageKeywords: industry.defaultStockTags,
    bRollAssetUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80',
    overlayText: 'THE PROVEN SOLUTION'
  };

  scenes.push({
    id: 'scene-3-solution',
    sceneIndex: 2,
    title: 'Scene 3: Solution Architecture & Primary Value',
    funnelSection: 'SOLUTION',
    durationSec: scene3Duration,
    narrationText: `That is why we built this solution. ${params.primaryValueProp}. Seamlessly integrated into your daily workflow in minutes, not months.`,
    shots: [shot3],
    backgroundColor: '#060c18',
    accentColor: brandBrain.visualIdentity.primaryColor,
    musicMood: 'energetic_propulsive'
  });

  // Scene 4: Social Proof & Metrics
  const scene4Duration = industry.pacingGuidelines.proofSocialProofSec || 10;
  const shot4: Shot = {
    id: 'shot-4',
    durationSec: scene4Duration,
    shotType: 'screen_ui_demo',
    cameraMotion: 'subtle_zoom_in',
    lightingStyle: 'hyper_realistic_soft_studio',
    realismPrompt: enrichRealismPrompt(
      `Audited business analytics dashboard displaying rapid revenue elevation and green telemetry metrics`,
      'screen_ui_demo',
      'subtle_zoom_in',
      'hyper_realistic_soft_studio'
    ),
    negativePrompt: STANDARD_NEGATIVE_PROMPT,
    stockFootageKeywords: ['verified statistics', 'roi graph', 'happy enterprise team'],
    bRollAssetUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=80',
    overlayText: 'VERIFIED ROI'
  };

  scenes.push({
    id: 'scene-4-proof',
    sceneIndex: 3,
    title: 'Scene 4: Concrete Social Proof & ROI',
    funnelSection: 'PROOF',
    durationSec: scene4Duration,
    narrationText: `Validated by industry leaders who have already eliminated friction and multiplied verified output.`,
    shots: [shot4],
    backgroundColor: '#05111a',
    accentColor: '#10b981',
    musicMood: 'cinematic_epic'
  });

  // Scene 5: High-Converting Offer CTA
  const scene5Duration = industry.pacingGuidelines.ctaDurationSec || 6;
  const shot5: Shot = {
    id: 'shot-5',
    durationSec: scene5Duration,
    shotType: 'wide_establishing',
    cameraMotion: 'static_hero',
    lightingStyle: 'hyper_realistic_soft_studio',
    realismPrompt: enrichRealismPrompt(
      `Majestic branded hero closing screen with clear call-to-action directive: ${params.callToAction}`,
      'wide_establishing',
      'static_hero',
      'hyper_realistic_soft_studio'
    ),
    negativePrompt: STANDARD_NEGATIVE_PROMPT,
    stockFootageKeywords: ['brand logo reveal', 'action button click', 'modern minimal studio'],
    bRollAssetUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80',
    overlayText: params.callToAction.toUpperCase()
  };

  scenes.push({
    id: 'scene-5-cta',
    sceneIndex: 4,
    title: 'Scene 5: High-Converting Directive & CTA',
    funnelSection: 'OFFER_CTA',
    durationSec: scene5Duration,
    narrationText: `${params.callToAction}. Secure your competitive advantage today.`,
    shots: [shot5],
    backgroundColor: brandBrain.visualIdentity.backgroundColor,
    accentColor: brandBrain.visualIdentity.accentColor,
    musicMood: 'energetic_propulsive'
  });

  const totalDurationSec = scenes.reduce((acc, s) => acc + s.durationSec, 0);

  const costBreakdown = calculateVideoCost({
    durationSeconds: totalDurationSec,
    resolution: '1080p',
    sceneCount: scenes.length,
    shotCount: scenes.length,
    aiProvider: 'nahalabs_canvas',
    ttsVoiceEnabled: true,
  });

  const project: VideoProject = {
    id: `proj-${Date.now().toString(36)}`,
    tenantId: brandBrain.tenantId || 'tenant-default',
    title: params.title || `${industry.title} Commercial`,
    description: `Targeted ${params.funnelStage} commercial video engineered for ${params.targetAudience}.`,
    funnelStage: params.funnelStage,
    aspectRatio,
    industryId: params.industryId,
    brandBrainId: params.brandBrainId,
    commercialObjective: params.commercialObjective,
    targetAudience: params.targetAudience,
    primaryValueProp: params.primaryValueProp,
    callToAction: params.callToAction,
    scenes,
    totalDurationSec,
    status: 'draft',
    approvalStatus: 'DRAFT',
    annotations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    renderCostUsd: costBreakdown.totalCostUsd,
    tokensConsumed: costBreakdown.llmTokensEstimated,
    thumbnailUrl: scenes[0]?.shots[0]?.bRollAssetUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80'
  };

  // Run initial precompose & post-review baseline
  project.precomposeCheck = runPrecomposeValidation(scenes, brandBrain);
  project.postRenderReview = runPostRenderReview(project, brandBrain);

  return project;
}

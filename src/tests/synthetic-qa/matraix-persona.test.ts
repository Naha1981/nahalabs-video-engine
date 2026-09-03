import { describe, it, expect } from 'vitest';
import { generateCommercialVideoProject } from '@/lib/engine/pipeline-orchestrator';
import { runPrecomposeValidation } from '@/lib/engine/precompose-validator';
import { runPostRenderReview } from '@/lib/engine/post-render-reviewer';
import { getBrandBrain } from '@/lib/engine/brand-brain-store';
import { calculateVideoCost } from '@/lib/engine/cost-governor';

describe('MatrAIx Synthetic Persona QA Test Suite (v3.0)', () => {

  // Persona 1: Direct-Response Performance Marketer
  it('Persona [Direct-Response Marketer]: validates 9:16 vertical hook velocity and CTA strength', () => {
    const brandBrain = getBrandBrain('brain-nahalabs-core');
    const project = generateCommercialVideoProject({
      title: 'Performance Marketing Viral Short',
      industryId: 'd2c-ecommerce',
      funnelStage: 'BOTTOM_OF_FUNNEL_CONVERSION',
      brandBrainId: 'brain-nahalabs-core',
      commercialObjective: 'Achieve 4.5x ROAS on TikTok / Reels',
      primaryValueProp: 'Unbreakable premium leather carryall with lifetime warranty',
      targetAudience: 'Urban professionals aged 25-40',
      callToAction: 'Order now for 20% off before midnight',
      aspectRatio: '9:16',
    });

    const precompose = runPrecomposeValidation(project.scenes, brandBrain);
    expect(precompose.valid).toBe(true);

    // Assert first scene hook is within 5 seconds for viral retention
    const hookScene = project.scenes[0];
    expect(hookScene.durationSec).toBeLessThanOrEqual(5);

    // Assert post-render review validates CTA clarity
    const review = runPostRenderReview(project, brandBrain);
    expect(review.scores.ctaClarity).toBeGreaterThanOrEqual(80);
    expect(review.verdict).not.toBe('REVISION_NEEDED');
  });

  // Persona 2: B2B SaaS Enterprise Founder
  it('Persona [Enterprise SaaS Founder]: validates brand tone, compliance guardrails, and cost governance', () => {
    const brandBrain = getBrandBrain('brain-nahalabs-core');
    const project = generateCommercialVideoProject({
      title: 'Enterprise Platform Modernization',
      industryId: 'b2b-saas',
      funnelStage: 'TOP_OF_FUNNEL_HOOK',
      brandBrainId: 'brain-nahalabs-core',
      commercialObjective: 'Compress 6-month sales cycle into 60-second clarity',
      primaryValueProp: 'Eliminate manual sync drift across multi-cloud infrastructure',
      targetAudience: 'Chief Information Officers and VPs of Engineering',
      callToAction: 'Schedule an executive architecture review at nahalabs.ai',
      aspectRatio: '16:9',
    });

    const precompose = runPrecomposeValidation(project.scenes, brandBrain);
    expect(precompose.valid).toBe(true);

    const cost = calculateVideoCost({
      durationSeconds: project.totalDurationSec,
      resolution: '4K Cinema',
      sceneCount: project.scenes.length,
      shotCount: project.scenes.length,
      aiProvider: 'claude_fable',
      ttsVoiceEnabled: true,
    });

    expect(cost.savingsPercent).toBeGreaterThan(90);
    expect(cost.totalCostUsd).toBeLessThan(10); // Less than $10 vs $5,000 agency
  });

  // Persona 3: CargoIQ Logistics & Freight Director
  it('Persona [CargoIQ Freight Director]: validates sovereign supply chain velocity and zero demurrage focus', () => {
    const brandBrain = getBrandBrain('brain-cargoiq-freight');
    const project = generateCommercialVideoProject({
      title: 'CargoIQ Port of Durban Velocity',
      industryId: 'logistics-cargoiq',
      funnelStage: 'MIDDLE_OF_FUNNEL_DEMO',
      brandBrainId: 'brain-cargoiq-freight',
      commercialObjective: 'Eliminate port demurrage penalties for multimodal freight',
      primaryValueProp: 'Real-time customs manifest clearance in 400 milliseconds',
      targetAudience: 'Global freight forwarders and customs brokers',
      callToAction: 'Request sovereign container API access at cargoiq.co.za',
      aspectRatio: '16:9',
    });

    const precompose = runPrecomposeValidation(project.scenes, brandBrain);
    expect(precompose.valid).toBe(true);

    const fullNarration = project.scenes.map(s => s.narrationText).join(' ');
    expect(fullNarration.toLowerCase()).not.toContain('guaranteed zero customs delay'); // Compliance check

    const review = runPostRenderReview(project, brandBrain);
    expect(review.scores.brandVoiceMatch).toBeGreaterThanOrEqual(85);
  });

  // Persona 4: Flavourly Dining & VIP Concierge
  it('Persona [Hospitality VIP Host]: validates sensory dining hooks and WhatsApp reservation CTA', () => {
    const brandBrain = getBrandBrain('brain-flavourly-dining');
    const project = generateCommercialVideoProject({
      title: 'Flavourly Weekend VIP Dining Experience',
      industryId: 'hospitality-dining',
      funnelStage: 'BOTTOM_OF_FUNNEL_CONVERSION',
      brandBrainId: 'brain-flavourly-dining',
      commercialObjective: 'Fill 120 weekend dinner covers via WhatsApp',
      primaryValueProp: 'Wood-fired dry-aged Wagyu and Cape Town sunset mixology',
      targetAudience: 'Romantic couples and culinary enthusiasts in Sandton',
      callToAction: 'Tap to book VIP table via WhatsApp concierge in 3 seconds',
      aspectRatio: '9:16',
    });

    const precompose = runPrecomposeValidation(project.scenes, brandBrain);
    expect(precompose.valid).toBe(true);

    const review = runPostRenderReview(project, brandBrain);
    expect(review.scores.hookStrength).toBeGreaterThanOrEqual(85);
    expect(review.overallScore).toBeGreaterThanOrEqual(88);
  });

});

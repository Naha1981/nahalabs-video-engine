import { describe, it, expect } from 'vitest';
import { calculateVideoCost } from '@/lib/engine/cost-governor';
import { generateHmacV2Signature, verifyHmacV2Signature } from '@/lib/integrations/hmac-security';
import { runPrecomposeValidation } from '@/lib/engine/precompose-validator';
import { runPostRenderReview } from '@/lib/engine/post-render-reviewer';
import { getBrandBrain } from '@/lib/engine/brand-brain-store';
import { generateCommercialVideoProject } from '@/lib/engine/pipeline-orchestrator';
import { executeMcpTool } from '@/lib/integrations/mcp-server';
import { generateSubtitleCues, exportToSrt } from '@/lib/engine/subtitle-engine';

describe('NahaLabs Video Engine - Unit & Governance Tests', () => {
  
  // 1. Cost Governor Test
  it('calculates deterministic render seconds, tokens, and agency savings', () => {
    const cost = calculateVideoCost({
      durationSeconds: 60,
      resolution: '1080p',
      sceneCount: 5,
      shotCount: 5,
      aiProvider: 'nahalabs_canvas',
      ttsVoiceEnabled: true,
    });

    expect(cost.totalCostUsd).toBeGreaterThan(0);
    expect(cost.totalCostZar).toBeGreaterThan(0);
    expect(cost.savingsPercent).toBeGreaterThan(90);
    expect(cost.llmTokensEstimated).toBeGreaterThan(5000);
  });

  // 2. HMAC-SHA256 v2 Security Test
  it('generates and cryptographically verifies HMAC v2 signatures with fail-closed security', () => {
    const secret = 'test_secret_key_123';
    const payload = { event: 'video.rendered', projectId: 'proj-123' };

    const { signature, headerValue, timestamp } = generateHmacV2Signature({
      secret,
      body: payload
    });

    expect(signature).toBeDefined();
    expect(headerValue).toContain('v2=');

    // Valid verification
    const validResult = verifyHmacV2Signature(headerValue, payload, secret);
    expect(validResult.valid).toBe(true);

    // Tampered payload verification MUST fail
    const tamperedPayload = { event: 'video.rendered', projectId: 'proj-999' };
    const invalidResult = verifyHmacV2Signature(headerValue, tamperedPayload, secret);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.reason).toContain('mismatch');

    // Missing header MUST fail
    const missingResult = verifyHmacV2Signature(null, payload, secret);
    expect(missingResult.valid).toBe(false);
  });

  // 3. Precompose Quality Gate Test
  it('enforces precompose validation and catches prohibited compliance terms', () => {
    const brandBrain = getBrandBrain('brain-nahalabs-core');
    const project = generateCommercialVideoProject({
      title: 'Compliance Test Campaign',
      industryId: 'b2b-saas',
      funnelStage: 'TOP_OF_FUNNEL_HOOK',
      brandBrainId: 'brain-nahalabs-core',
      commercialObjective: 'Test compliance',
      primaryValueProp: 'High-speed video rendering',
      targetAudience: 'CMOs',
      callToAction: 'Visit nahalabs.ai',
    });

    const cleanResult = runPrecomposeValidation(project.scenes, brandBrain);
    expect(cleanResult.valid).toBe(true);

    // Inject a prohibited compliance phrase
    const contaminatedScenes = [...project.scenes];
    contaminatedScenes[0] = {
      ...contaminatedScenes[0],
      narrationText: 'Get guaranteed profit with our instant miracle button!'
    };

    const contaminatedResult = runPrecomposeValidation(contaminatedScenes, brandBrain);
    expect(contaminatedResult.valid).toBe(false);
    expect(contaminatedResult.checks.some(c => c.status === 'FAIL')).toBe(true);
  });

  // 4. Post-Render Review Rubric Test
  it('executes automated 6-point post-render self-review rubric', () => {
    const brandBrain = getBrandBrain('brain-nahalabs-core');
    const project = generateCommercialVideoProject({
      title: 'Review Test Project',
      industryId: 'b2b-saas',
      funnelStage: 'TOP_OF_FUNNEL_HOOK',
      brandBrainId: 'brain-nahalabs-core',
      commercialObjective: 'Test review rubric',
      primaryValueProp: 'Agentic video pipelines',
      targetAudience: 'Growth Leaders',
      callToAction: 'Book demo today',
    });

    const review = runPostRenderReview(project, brandBrain);
    expect(review.overallScore).toBeGreaterThanOrEqual(75);
    expect(review.scores.hookStrength).toBeGreaterThan(0);
    expect(review.scores.pacingAndContinuity).toBeGreaterThan(0);
    expect(review.scores.visualRealism).toBeGreaterThan(0);
    expect(review.critique.length).toBeGreaterThan(0);
  });

  // 5. Universal MCP Gateway Tool Execution Test
  it('executes MCP tools with typed inputs and structured outputs', async () => {
    const strategies = await executeMcpTool('list_industry_strategies', {});
    expect(strategies.length).toBeGreaterThanOrEqual(12);

    const brain = await executeMcpTool('get_brand_brain', { brandBrainId: 'brain-nahalabs-core' });
    expect(brain.id).toBe('brain-nahalabs-core');
    expect(brain.voice.tone).toBe('authoritative');

    const createdProj = await executeMcpTool('create_commercial_video_project', {
      title: 'MCP Generated Campaign',
      industryId: 'fintech',
      funnelStage: 'MIDDLE_OF_FUNNEL_DEMO',
      primaryValueProp: 'Instant settlement treasury',
      callToAction: 'Open account today',
    });
    expect(createdProj.id).toBeDefined();
    expect(createdProj.scenes.length).toBeGreaterThanOrEqual(3);

    const health = await executeMcpTool('get_system_health', {});
    expect(health.status).toBe('ok');
    expect(health.keepAlive.status).toBe('active');
  });

  // 6. Subtitle Engine & SRT Exporter Test
  it('generates word-by-word subtitle cues and formats valid SRT', () => {
    const project = generateCommercialVideoProject({
      title: 'Subtitle Test',
      industryId: 'b2b-saas',
      funnelStage: 'TOP_OF_FUNNEL_HOOK',
      brandBrainId: 'brain-nahalabs-core',
      commercialObjective: 'Subtitle test',
      primaryValueProp: 'Speech sync',
      targetAudience: 'Viewers',
      callToAction: 'Read along',
    });

    const cues = generateSubtitleCues(project.scenes);
    expect(cues.length).toBeGreaterThan(0);
    expect(cues[0].words?.length).toBeGreaterThan(0);

    const srt = exportToSrt(cues);
    expect(srt).toContain('-->');
    expect(srt).toContain('1\n00:00:');
  });

});

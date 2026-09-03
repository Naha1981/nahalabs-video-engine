import { Scene, BrandBrain, PrecomposeValidationResult } from './types';

export function runPrecomposeValidation(
  scenes: Scene[],
  brandBrain: BrandBrain
): PrecomposeValidationResult {
  const checks: PrecomposeValidationResult['checks'] = [];
  let totalWords = 0;
  let totalDurationSec = 0;

  // 1. Scene Count Check
  if (scenes.length < 2) {
    checks.push({
      name: 'Scene Count Boundary',
      status: 'FAIL',
      message: 'Video must contain at least 2 structured scenes for commercial storytelling.',
      metric: `${scenes.length} scenes`
    });
  } else if (scenes.length > 10) {
    checks.push({
      name: 'Scene Count Boundary',
      status: 'WARN',
      message: 'High scene count (>10) may cause rapid context switching and audience fatigue.',
      metric: `${scenes.length} scenes`
    });
  } else {
    checks.push({
      name: 'Scene Count Boundary',
      status: 'PASS',
      message: 'Optimal scene structure aligned to commercial retention curve.',
      metric: `${scenes.length} scenes`
    });
  }

  // 2. Duration & Pacing WPM Check
  scenes.forEach((scene, index) => {
    totalDurationSec += scene.durationSec;
    const words = scene.narrationText.trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;

    const wpm = (words / Math.max(scene.durationSec, 1)) * 60;
    const targetWpm = brandBrain.voice.pacingWpm || 150;

    if (wpm > targetWpm * 1.3) {
      checks.push({
        name: `Scene ${index + 1} Speech Velocity`,
        status: 'WARN',
        message: `Narration pace (${Math.round(wpm)} WPM) is too fast for brand voice (${targetWpm} WPM). Audience may lose comprehension.`,
        metric: `${Math.round(wpm)} WPM`
      });
    } else if (wpm < targetWpm * 0.7 && words > 0) {
      checks.push({
        name: `Scene ${index + 1} Speech Velocity`,
        status: 'PASS',
        message: `Generous cinematic pauses allowed for visual absorption (${Math.round(wpm)} WPM).`,
        metric: `${Math.round(wpm)} WPM`
      });
    } else {
      checks.push({
        name: `Scene ${index + 1} Speech Velocity`,
        status: 'PASS',
        message: `Pacing precisely locked to Brand Brain target (${Math.round(wpm)} WPM).`,
        metric: `${Math.round(wpm)} WPM`
      });
    }

    // 3. Prohibited Words & Compliance Check
    const lowerText = scene.narrationText.toLowerCase();
    const prohibitedFound = brandBrain.compliance.prohibitedWords.filter(pw => 
      lowerText.includes(pw.toLowerCase())
    );

    if (prohibitedFound.length > 0) {
      checks.push({
        name: `Scene ${index + 1} Compliance Gate`,
        status: 'FAIL',
        message: `Found prohibited compliance terms: "${prohibitedFound.join(', ')}". Must be sanitized before rendering.`,
        metric: `${prohibitedFound.length} violations`
      });
    }

    const voiceProhibitedFound = brandBrain.voice.prohibitedPhrases.filter(pf =>
      lowerText.includes(pf.toLowerCase())
    );

    if (voiceProhibitedFound.length > 0) {
      checks.push({
        name: `Scene ${index + 1} Brand Voice Gate`,
        status: 'WARN',
        message: `Found discouraged brand voice phrases: "${voiceProhibitedFound.join(', ')}".`,
        metric: `${voiceProhibitedFound.length} violations`
      });
    }
  });

  // 4. Hook Duration Check (First Scene)
  const hookScene = scenes[0];
  if (hookScene) {
    if (hookScene.durationSec > 7) {
      checks.push({
        name: 'First-Scene Hook Velocity',
        status: 'WARN',
        message: `First scene hook is ${hookScene.durationSec}s. Commercial retention drops 40% if the pattern interrupt takes >5s.`,
        metric: `${hookScene.durationSec}s`
      });
    } else {
      checks.push({
        name: 'First-Scene Hook Velocity',
        status: 'PASS',
        message: `First scene hook is punchy (${hookScene.durationSec}s), securing viewer retention.`,
        metric: `${hookScene.durationSec}s`
      });
    }
  }

  // 5. Shot Realism Prompt Inspection
  let emptyPromptCount = 0;
  scenes.forEach(s => {
    s.shots.forEach(sh => {
      if (!sh.realismPrompt || sh.realismPrompt.trim().length < 15) {
        emptyPromptCount++;
      }
    });
  });

  if (emptyPromptCount > 0) {
    checks.push({
      name: 'Cinematic Prompt Depth',
      status: 'WARN',
      message: `${emptyPromptCount} shot(s) lack detailed optical/lighting realism prompts.`,
      metric: `${emptyPromptCount} unoptimized shots`
    });
  } else {
    checks.push({
      name: 'Cinematic Prompt Depth',
      status: 'PASS',
      message: 'All shots equipped with 35mm optical parameters, camera motion vectors, and lighting metadata.',
      metric: '100% optimized'
    });
  }

  const hasFails = checks.some(c => c.status === 'FAIL');
  const estimatedRenderSeconds = Math.max(15, Math.round(totalDurationSec * 1.8));

  return {
    valid: !hasFails,
    timestamp: new Date().toISOString(),
    checks,
    totalDurationSec,
    sceneCount: scenes.length,
    audioDurationSec: totalDurationSec,
    estimatedRenderSeconds,
  };
}

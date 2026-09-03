import { PlanTier, UsageLedgerEntry } from './types';

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter Studio',
    monthlyPriceZar: 1450,
    monthlyPriceUsd: 89,
    includedMinutes: 30,
    maxProjects: 10,
    maxTenants: 1,
    resolution: '1080p',
    priorityRendering: false,
    brandBrainsLimit: 2,
    mcpAccess: true,
    whitelabel: false,
  },
  {
    id: 'growth',
    name: 'Commercial Growth (10/10 Moat)',
    monthlyPriceZar: 4900,
    monthlyPriceUsd: 299,
    includedMinutes: 150,
    maxProjects: 50,
    maxTenants: 5,
    resolution: '4K Cinema',
    priorityRendering: true,
    brandBrainsLimit: 10,
    mcpAccess: true,
    whitelabel: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Agency Sovereign',
    monthlyPriceZar: 14500,
    monthlyPriceUsd: 899,
    includedMinutes: 600,
    maxProjects: 999,
    maxTenants: 50,
    resolution: '4K Cinema',
    priorityRendering: true,
    brandBrainsLimit: 99,
    mcpAccess: true,
    whitelabel: true,
  }
];

export interface CostCalculationParams {
  durationSeconds: number;
  resolution: '1080p' | '4K Cinema';
  sceneCount: number;
  shotCount: number;
  aiProvider: 'claude_fable' | 'gemini_omni' | 'openai_sora' | 'runway_gen3' | 'nahalabs_canvas';
  ttsVoiceEnabled: boolean;
}

export interface CostBreakdown {
  llmTokensEstimated: number;
  llmCostUsd: number;
  ttsCostUsd: number;
  renderCostUsd: number;
  totalCostUsd: number;
  totalCostZar: number;
  costPerSecondUsd: number;
  agencyBenchmarkUsd: number; // What a traditional production agency charges ($5,000 - $15,000)
  savingsPercent: number;
}

export function calculateVideoCost(params: CostCalculationParams): CostBreakdown {
  const { durationSeconds, resolution, sceneCount, shotCount, aiProvider, ttsVoiceEnabled } = params;

  // 1. LLM Token calculation (Research + Script + Scene breakdown + Director Prompts + Post-Review)
  const baseTokens = 2500;
  const perSceneTokens = 850;
  const llmTokensEstimated = baseTokens + (sceneCount * perSceneTokens) + (shotCount * 300);

  // Rate per 1k tokens ($0.003 for Claude 3.5 / Fable 5.1 blend)
  const llmCostUsd = (llmTokensEstimated / 1000) * 0.0035;

  // 2. TTS Voiceover cost (ElevenLabs/Edge TTS standard ~$0.0003 per character)
  const estimatedCharacters = durationSeconds * 14; // ~14 chars per sec
  const ttsCostUsd = ttsVoiceEnabled ? (estimatedCharacters * 0.00025) : 0;

  // 3. Render Cost based on provider and resolution
  let perSecondRenderRate = 0.015; // default NahaLabs Canvas compositing
  if (aiProvider === 'openai_sora') {
    perSecondRenderRate = 0.20;
  } else if (aiProvider === 'runway_gen3') {
    perSecondRenderRate = 0.12;
  } else if (aiProvider === 'gemini_omni') {
    perSecondRenderRate = 0.025;
  } else if (aiProvider === 'claude_fable') {
    perSecondRenderRate = 0.020;
  }

  if (resolution === '4K Cinema') {
    perSecondRenderRate *= 1.6;
  }

  const renderCostUsd = durationSeconds * perSecondRenderRate;
  const totalCostUsd = Number((llmCostUsd + ttsCostUsd + renderCostUsd).toFixed(3));
  const totalCostZar = Number((totalCostUsd * 18.2).toFixed(2));
  const costPerSecondUsd = Number((totalCostUsd / Math.max(durationSeconds, 1)).toFixed(4));

  // Agency benchmark: A standard 60-second agency video costs ~$4,500 - $8,000
  const agencyBenchmarkUsd = Math.max(1200, durationSeconds * 75);
  const savingsPercent = Number((((agencyBenchmarkUsd - totalCostUsd) / agencyBenchmarkUsd) * 100).toFixed(1));

  return {
    llmTokensEstimated,
    llmCostUsd: Number(llmCostUsd.toFixed(4)),
    ttsCostUsd: Number(ttsCostUsd.toFixed(4)),
    renderCostUsd: Number(renderCostUsd.toFixed(4)),
    totalCostUsd,
    totalCostZar,
    costPerSecondUsd,
    agencyBenchmarkUsd,
    savingsPercent,
  };
}

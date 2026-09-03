// NahaLabs Growth OS — Provider abstraction & honest availability registry (§22, §57)
//
// All external vendors sit behind descriptors. A provider is only `configured`
// when its credentials/endpoint are actually present. Otherwise it reports
// `unconfigured` and the engine degrades honestly — it NEVER fakes a successful
// generation, stock search, render, publish, or metric.
//
// Provider keys are read from environment variables. The app intentionally
// builds and runs with zero env vars (see README) — in that state everything
// reports unconfigured and the free/local/degraded paths are used.

import type { ProviderDescriptor, ProviderKind, CostMode } from './types';

interface ProviderBinding {
  kind: ProviderKind;
  id: string;
  label: string;
  /** Env var whose presence (non-empty) means the provider is configured. */
  envVar: string;
  paid: boolean;
  fallbackNote: string;
}

// Central registry — vendor SDK calls never get scattered through the app (§22).
const BINDINGS: ProviderBinding[] = [
  { kind: 'llm', id: 'llm-claude', label: 'Claude (research/scripting)', envVar: 'ANTHROPIC_API_KEY', paid: true, fallbackNote: 'Rule-based deterministic reasoning; no external LLM research.' },
  { kind: 'research', id: 'research-trends', label: 'Trend/demand research feed', envVar: 'RESEARCH_API_KEY', paid: true, fallbackNote: 'Seasonal calendar + authorized business data only; live demand/trends unavailable.' },
  { kind: 'image', id: 'image-flux', label: 'Image generation (FLUX etc.)', envVar: 'FAL_KEY', paid: true, fallbackNote: 'Real client photos + stock + typography; no generated stills.' },
  { kind: 'video', id: 'video-kling', label: 'Video generation (Kling/Veo)', envVar: 'VIDEO_GEN_API_KEY', paid: true, fallbackNote: 'Real footage editing path; no AI-generated motion clips (§8 generation optional).' },
  { kind: 'voice', id: 'voice-elevenlabs', label: 'TTS (ElevenLabs/cloud)', envVar: 'ELEVENLABS_API_KEY', paid: true, fallbackNote: 'Local/offline narration or captions-only; no cloud TTS.' },
  { kind: 'transcription', id: 'transcription-whisper', label: 'Transcription (Whisper/cloud)', envVar: 'OPENAI_API_KEY', paid: true, fallbackNote: 'Manual/ingested transcripts; automatic transcription unavailable.' },
  { kind: 'stock', id: 'stock-pexels', label: 'Licensed stock (Pexels/Pixabay)', envVar: 'PEXELS_API_KEY', paid: false, fallbackNote: 'Client assets only; stock search unavailable (still provenance-tracked).' },
  { kind: 'music', id: 'music-suno', label: 'Music library / generation', envVar: 'MUSIC_PROVIDER_KEY', paid: true, fallbackNote: 'Royalty-free local beds or silence; no licensed/generated music.' },
  { kind: 'renderer', id: 'renderer-hyperframes', label: 'HyperFrames/FFmpeg render', envVar: 'RENDERER_ENDPOINT', paid: false, fallbackNote: 'Canvas composition + storyboard; final server render unavailable.' },
  { kind: 'publisher', id: 'publish-instagram', label: 'Instagram publishing (OAuth)', envVar: 'META_OAUTH_TOKEN', paid: false, fallbackNote: 'Approved output delivered as downloadable file; no auto-publish.' },
  { kind: 'publisher', id: 'publish-facebook', label: 'Facebook publishing (OAuth)', envVar: 'META_OAUTH_TOKEN', paid: false, fallbackNote: 'Approved output delivered as downloadable file; no auto-publish.' },
  { kind: 'enhancement', id: 'enhance-basic', label: 'Media enhancement/upscale', envVar: 'ENHANCEMENT_API_KEY', paid: true, fallbackNote: 'Source resolution preserved; no AI upscaling.' },
];

function envPresent(name: string): boolean {
  try {
    return Boolean(process.env && process.env[name] && String(process.env[name]).trim().length > 0);
  } catch {
    return false;
  }
}

export function getProviders(): ProviderDescriptor[] {
  return BINDINGS.map((b) => {
    const configured = envPresent(b.envVar);
    return {
      kind: b.kind,
      id: b.id,
      label: b.label,
      status: configured ? 'configured' : 'unconfigured',
      paid: b.paid,
      fallbackNote: b.fallbackNote,
      lastChecked: new Date().toISOString(),
    };
  });
}

export function getProvider(id: string): ProviderDescriptor | undefined {
  return getProviders().find((p) => p.id === id);
}

export function providersByKind(kind: ProviderKind): ProviderDescriptor[] {
  return getProviders().filter((p) => p.kind === kind);
}

export function isProviderConfigured(id: string): boolean {
  return getProvider(id)?.status === 'configured';
}

export function isKindAvailable(kind: ProviderKind): boolean {
  return providersByKind(kind).some((p) => p.status === 'configured');
}

// ─── Cost governance modes (§23) ────────────────────────────────────────────
export const DEFAULT_COST_MODE: CostMode = 'FREE_ONLY';

/**
 * Cost Guard: Eligibility → Cost Guard → Provider → Usage Ledger.
 * FREE_ONLY means absolutely no paid execution (§16/§23).
 */
export function evaluateCostGuard(input: {
  mode: CostMode;
  providerId: string;
  estimatedCostUsd: number;
  budgetUsd?: number;
}): { allowed: boolean; reason: string } {
  const provider = getProvider(input.providerId);
  if (!provider) return { allowed: false, reason: `UNKNOWN_PROVIDER:${input.providerId}` };

  const isPaid = provider.paid && input.estimatedCostUsd > 0;

  if (input.mode === 'FREE_ONLY') {
    if (isPaid) {
      return { allowed: false, reason: `BLOCKED_BY_FREE_ONLY: ${provider.label} is a paid provider and mode is FREE_ONLY` };
    }
    return { allowed: true, reason: 'OK_FREE_PATH' };
  }

  if (input.mode === 'MANUAL') {
    return { allowed: false, reason: 'REQUIRES_MANUAL_APPROVAL: MANUAL mode never auto-executes paid operations' };
  }

  // Modes that may spend money — always enforce the budget ceiling.
  if (isPaid && input.budgetUsd !== undefined && input.estimatedCostUsd > input.budgetUsd) {
    return { allowed: false, reason: `BUDGET_EXCEEDED: estimate $${input.estimatedCostUsd.toFixed(2)} > budget $${input.budgetUsd.toFixed(2)}` };
  }

  return { allowed: true, reason: isPaid ? 'OK_PAID_WITHIN_POLICY' : 'OK_FREE_PATH' };
}

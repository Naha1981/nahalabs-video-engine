'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  Cpu, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Server, 
  DollarSign, 
  Activity, 
  ShieldCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function PipelinesPage() {
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<number>(0);

  const pipelineStages = [
    {
      step: 1,
      title: 'Business Intake & ICP Research',
      owner: 'NahaLabs Commercial Brain',
      runtime: '320ms',
      cost: '$0.001',
      status: 'READY',
      description: 'Ingests target audience pain points, industry category, value proposition, and commercial objective to establish the video strategy anchor.'
    },
    {
      step: 2,
      title: 'Scriptwriting & Retention Anchor',
      owner: 'Claude 3.5 / Fable 5.1',
      runtime: '840ms',
      cost: '$0.004',
      status: 'READY',
      description: 'Generates pattern-interrupt hook, problem agitation, solution architecture, audited proof metrics, and high-converting offer CTA.'
    },
    {
      step: 3,
      title: 'Scene Plan & 35mm Director Prompts',
      owner: 'OpenMontage Prompt Director',
      runtime: '560ms',
      cost: '$0.002',
      status: 'READY',
      description: 'Calculates shot framing (Macro, Wide, Tracking), camera motion vectors, 5600K studio lighting physics, and Arri RAW optical parameters.'
    },
    {
      step: 4,
      title: 'Stock B-Roll & Asset Retrieval',
      owner: 'OpenMontage Asset Catalog',
      runtime: '410ms',
      cost: '$0.000',
      status: 'READY',
      description: 'Matches scene tags with verified 4K video clips, tactile lifestyle photography, and commercial vector elements.'
    },
    {
      step: 5,
      title: 'Pre-Compose Quality Gate',
      owner: 'NahaLabs Gate Validator',
      runtime: '120ms',
      cost: '$0.000',
      status: 'READY',
      description: 'Enforces WPM speech pacing limits, safe margin boundaries, contrast ratio validation, and compliance blacklist filters.'
    },
    {
      step: 6,
      title: 'Multi-Track Timeline Composition',
      owner: 'NahaLabs Canvas & WebCodecs',
      runtime: '2,400ms',
      cost: '$0.015',
      status: 'READY',
      description: 'Synthesizes speech voiceover, renders Ken Burns camera movement, layers animated karaoke subtitles, and mixes ambient music.'
    },
    {
      step: 7,
      title: 'Post-Render Review & Self-Critique',
      owner: 'OpenMontage Self-Reviewer',
      runtime: '450ms',
      cost: '$0.003',
      status: 'READY',
      description: 'Executes automated 6-point rubric scoring hook strength, pacing continuity, optical realism, and brand voice adherence.'
    }
  ];

  const providerRegistry = [
    {
      name: 'Claude 3.5 Sonnet / Fable 5.1',
      role: 'Commercial Strategy & Scriptwriting',
      costPer1kTokens: '$0.003',
      latency: '450ms',
      status: 'Optimal (Primary)',
      uptime: '99.99%'
    },
    {
      name: 'Gemini 2.0 Flash Omni',
      role: 'Fast Multimodal Scene Decomposition',
      costPer1kTokens: '$0.001',
      latency: '180ms',
      status: 'Available (Failover)',
      uptime: '99.95%'
    },
    {
      name: 'OpenMontage Canvas Compositor',
      role: 'Zero-Dependency High-Res Frame Rendering',
      costPer1kTokens: '$0.000',
      latency: '1,200ms',
      status: 'Self-Owned Engine',
      uptime: '100.0%'
    },
    {
      name: 'ElevenLabs / Edge TTS Neural Voice',
      role: 'Speech Synthesis & Subtitle Timing',
      costPer1kTokens: '$0.0003/char',
      latency: '620ms',
      status: 'Integrated',
      uptime: '99.98%'
    }
  ];

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              OpenMontage Pipeline & Tool Registry
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upstream production orchestration, deterministic quality gates, and multi-provider failover routing.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            7/7 Pipeline Stages Healthy
          </span>
        </div>
      </div>

      {/* Visual Pipeline DAG Flow */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Execution DAG Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {pipelineStages.map((stage, idx) => {
            const isSelected = selectedPipelineStage === idx;
            return (
              <div
                key={stage.step}
                onClick={() => setSelectedPipelineStage(idx)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">
                      STAGE 0{stage.step}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white line-clamp-2">
                    {stage.title}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex justify-between font-mono">
                  <span>{stage.runtime}</span>
                  <span className="text-emerald-400">{stage.cost}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Drawer */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200">
              Stage {selectedPipelineStage + 1}: {pipelineStages[selectedPipelineStage].title}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              Engine: {pipelineStages[selectedPipelineStage].owner}
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            {pipelineStages[selectedPipelineStage].description}
          </p>
        </div>
      </div>

      {/* Provider Registry & Cost Matrix Table */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              AI Provider & Engine Registry
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Failover order: Claude 3.5 → Gemini 2.0 → Groq
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Engine / Model</th>
                <th className="pb-3 font-semibold">Production Role</th>
                <th className="pb-3 font-semibold">Cost Rate</th>
                <th className="pb-3 font-semibold">Latency</th>
                <th className="pb-3 font-semibold">Uptime</th>
                <th className="pb-3 font-semibold">Routing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {providerRegistry.map((prov, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="py-3 font-bold text-slate-200 font-sans">{prov.name}</td>
                  <td className="py-3 text-slate-400 font-sans">{prov.role}</td>
                  <td className="py-3 text-emerald-400">{prov.costPer1kTokens}</td>
                  <td className="py-3 text-slate-300">{prov.latency}</td>
                  <td className="py-3 text-slate-300">{prov.uptime}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                      {prov.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

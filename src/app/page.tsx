'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Film, 
  Brain, 
  Compass, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Play, 
  Zap, 
  ArrowRight, 
  Server, 
  CheckCircle2, 
  Users,
  Boxes,
  DollarSign
} from 'lucide-react';
import { INITIAL_PROJECTS, INITIAL_INTENT_SIGNALS } from '@/lib/store/video-store';
import { INDUSTRY_CATALOG } from '@/lib/engine/industry-intelligence';

export default function HomePage() {
  const [businessInput, setBusinessInput] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('b2b-saas');

  const activeProjects = INITIAL_PROJECTS;
  const recentSignals = INITIAL_INTENT_SIGNALS.slice(0, 3);

  return (
    <div className="flex flex-col space-y-8 pb-10">
      
      {/* Hero Executive Mission Control */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>OpenMontage Upstream + NahaLabs Commercial Brain</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            The Agentic Commercial Video Production Studio
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Turn business understanding into high-converting 4K cinematic commercial video assets in seconds. Governed by 10/10 fail-closed engineering, Brand Brain compliance, and real-time ROI attribution.
          </p>

          {/* Fast Intake Generator Input */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-xl">
            <input
              type="text"
              value={businessInput}
              onChange={(e) => setBusinessInput(e.target.value)}
              placeholder="Tell us what your business does and your objective..."
              className="flex-1 bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
            <Link
              href={`/studio`}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <Zap className="h-4 w-4" />
              <span>Launch Studio</span>
            </Link>
          </div>
        </div>

        {/* Live System Badges */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>10/10 Fail-Closed Governance</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>99.98% Render Uptime</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>98.6% Production Cost Savings</span>
          </div>
          <div className="flex items-center space-x-2">
            <Boxes className="h-4 w-4 text-indigo-400" />
            <span>Universal MCP Gateway Active</span>
          </div>
        </div>
      </div>

      {/* 4 Key Production Hub Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link 
          href="/studio"
          className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/60 shadow-xl transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <Film className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
            Studio & Timeline Editor
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            Multi-track timeline, 35mm optical realism prompts, and live canvas rendering.
          </p>
        </Link>

        <Link 
          href="/brand-brain"
          className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/60 shadow-xl transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Brain className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
            Brand Brain Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            Tone of voice rules, color tokens, compliance blacklists, and audience personas.
          </p>
        </Link>

        <Link 
          href="/industry-intel"
          className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/60 shadow-xl transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Compass className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
            12+ Industry Playbooks
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            Pre-engineered hooks, retention pacing curves, and visual metaphors by vertical.
          </p>
        </Link>

        <Link 
          href="/system-health"
          className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/60 shadow-xl transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Server className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
            System Health & Keep-Alive
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            Real-time backend telemetry, 10-minute ping schedulers, and service metrics.
          </p>
        </Link>

      </div>

      {/* Active Video Production Campaigns */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Film className="h-5 w-5 text-indigo-400" />
              <span>Active Commercial Video Campaigns</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production assets staged for multi-channel syndication.
            </p>
          </div>
          <Link
            href="/studio"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>Open Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeProjects.map((proj) => (
            <Link
              key={proj.id}
              href={`/studio`}
              className="group rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={proj.thumbnailUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80'}
                  alt={proj.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-cyan-300 text-[10px] font-mono">
                  {proj.totalDurationSec}s · {proj.aspectRatio}
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  {proj.approvalStatus}
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  {proj.funnelStage.replace(/_/g, ' ')}
                </span>
                <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-indigo-300">
                  {proj.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {proj.description}
                </p>
                <div className="pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-800/80">
                  <span>{proj.scenes.length} Scenes</span>
                  <span className="text-emerald-400 font-bold">${proj.renderCostUsd} USD</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 2-Column Live Snippets: OpenMontage Upstream Moat + Live Intent Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* OpenMontage Architecture Moat (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Why OpenMontage + NahaLabs Is Our Moat
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <strong className="text-indigo-400 block mb-1">OpenMontage Upstream Engine</strong>
              <p className="text-slate-400 leading-snug">
                Production pipelines, 35mm optical realism prompts, scene plan decomposition, pre-compose validation gates, and automated post-render review rubrics.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <strong className="text-cyan-400 block mb-1">NahaLabs Commercial Layer on Top</strong>
              <p className="text-slate-400 leading-snug">
                Business understanding, Brand Brain voice matrix, 12+ industry vertical retention curves, multi-tenant RBAC, and closed-loop revenue attribution.
              </p>
            </div>
          </div>
        </div>

        {/* Live Intent Signals (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Live Viewer Buying Intent
              </h3>
            </div>
            <Link href="/telemetry" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              View All Signals →
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            {recentSignals.map((sig, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{sig.viewerId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      {sig.intentScore}/100 Intent
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{sig.projectTitle}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {sig.inferredReadiness}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

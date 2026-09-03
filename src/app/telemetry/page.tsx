'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Eye, 
  MousePointerClick, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Users,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { INITIAL_INTENT_SIGNALS } from '@/lib/store/video-store';

export default function TelemetryPage() {
  const [signals, setSignals] = useState(INITIAL_INTENT_SIGNALS);

  const avgIntentScore = Math.round(signals.reduce((acc, s) => acc + s.intentScore, 0) / signals.length);
  const totalLeadsCaptured = 48;
  const verifiedRevenueAttributedZar = 284000;

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Telemetry & Intent Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time viewer engagement telemetry, algorithmic intent scoring, and closed-loop revenue attribution.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse mr-1.5" />
            Live Ingestion Stream Active
          </span>
        </div>
      </div>

      {/* Hero Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Avg Viewer Intent Score</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-white font-mono">{avgIntentScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
            ↑ +8.4% vs previous week
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">High-Intent Leads Identified</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-cyan-400 font-mono">{totalLeadsCaptured}</span>
            <span className="text-xs text-slate-500">leads</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Watch depth &gt;85% + CTA Clicked
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Attributed Closed Revenue</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-emerald-400 font-mono">
              R{verifiedRevenueAttributedZar.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
            PayFast & Stripe Webhook Verified
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Average Retention Curve</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-indigo-400 font-mono">78.2%</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Pattern-interrupt hook drops &lt;12%
          </span>
        </div>

      </div>

      {/* 2-Column Grid: Live Intent Stream + Funnel Retention Sankey */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Intent Scoring Stream (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Live Lead Intent Signals
              </h3>
            </div>
            <span className="text-xs text-slate-400">Algorithmic scoring model</span>
          </div>

          <div className="space-y-3">
            {signals.map((sig, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-indigo-300 font-bold">{sig.viewerId}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-semibold text-slate-200">{sig.projectTitle}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{sig.lastActive}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-400 block">Intent Score</span>
                    <span className={`font-black font-mono text-sm ${
                      sig.intentScore >= 80 ? 'text-emerald-400' : sig.intentScore >= 50 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {sig.intentScore}/100
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-400 block">Watch Depth</span>
                    <span className="font-bold text-slate-200 font-mono text-sm">{sig.watchDepthPercent}%</span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-400 block">Replays</span>
                    <span className="font-bold text-slate-200 font-mono text-sm">{sig.repeatViews}x</span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 text-center">
                    <span className="text-[10px] text-slate-400 block">CTA Action</span>
                    <span className={`font-bold text-xs ${sig.ctaClicked ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {sig.ctaClicked ? 'CLICKED ✓' : 'NONE'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-400">Inferred Buying Stage:</span>
                  <span className="font-semibold text-cyan-300 font-mono">
                    {sig.inferredReadiness}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Commercial Funnel Drop-off Simulation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Commercial Retention Curve
              </h3>
            </div>
            <span className="text-xs text-slate-400">60-sec Timeline</span>
          </div>

          <div className="space-y-3 text-xs">
            
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-indigo-300">00:00 - 00:05 (Hook Pattern Interrupt)</span>
                <span className="text-white font-bold font-mono">96.4% retained</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div style={{ width: '96.4%' }} className="h-full bg-indigo-500" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-rose-300">00:05 - 00:20 (Problem Agitation)</span>
                <span className="text-white font-bold font-mono">88.1% retained</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div style={{ width: '88.1%' }} className="h-full bg-rose-500" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-cyan-300">00:20 - 00:40 (Solution Architecture)</span>
                <span className="text-white font-bold font-mono">81.5% retained</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div style={{ width: '81.5%' }} className="h-full bg-cyan-500" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-emerald-300">00:40 - 00:52 (Audited Proof Metrics)</span>
                <span className="text-white font-bold font-mono">78.0% retained</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div style={{ width: '78.0%' }} className="h-full bg-emerald-500" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-amber-300">00:52 - 01:00 (Offer CTA Directive)</span>
                <span className="text-white font-bold font-mono">74.2% retained (6.8% converted)</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div style={{ width: '74.2%' }} className="h-full bg-amber-500" />
              </div>
            </div>

          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-slate-300 flex items-start space-x-2">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>OpenMontage Pacing Rule: By maintaining hook delivery under 5s, overall funnel conversion increased by 2.4x.</span>
          </div>

        </div>

      </div>

    </div>
  );
}

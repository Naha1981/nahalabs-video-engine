'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Clock, 
  Eye, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2,
  Film,
  Zap
} from 'lucide-react';
import { INDUSTRY_CATALOG } from '@/lib/engine/industry-intelligence';
import { IndustryId, IndustryIntelligence } from '@/lib/engine/types';

export default function IndustryIntelPage() {
  const [selectedIndustryId, setSelectedIndustryId] = useState<IndustryId>('b2b-saas');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const industries = Object.values(INDUSTRY_CATALOG);
  const activeIndustry: IndustryIntelligence = INDUSTRY_CATALOG[selectedIndustryId] || industries[0];

  const categories = ['all', 'Technology & Software', 'Retail & Consumer', 'Property & Architecture', 'Health & Life Sciences', 'Supply Chain & Transportation', 'Hospitality & Food', 'Finance & Banking', 'Professional Services'];

  const filteredIndustries = industries.filter(ind => {
    if (filterCategory === 'all') return true;
    return ind.category.toLowerCase() === filterCategory.toLowerCase();
  });

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Vertical Industry Intelligence Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pre-engineered commercial playbooks, psychological retention curves, and proven conversion hooks across 12+ enterprise sectors.
          </p>
        </div>

        {/* 1-Click Deploy to Studio */}
        <Link
          href={`/studio`}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Zap className="h-4 w-4" />
          <span>Deploy {activeIndustry.title.split(' ')[0]} to Studio</span>
        </Link>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat === 'all' ? 'All Verticals (12)' : cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Industry Selector Sidebar + Detailed Playbook View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Industry Card List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          {filteredIndustries.map((ind) => {
            const isSelected = ind.id === selectedIndustryId;
            return (
              <div
                key={ind.id}
                onClick={() => setSelectedIndustryId(ind.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-950/70 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    {ind.category}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    {ind.avgConversionRate}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  {ind.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {ind.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed Industry Playbook Dashboard (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Hero Industry Summary Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {activeIndustry.category} Playbook
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  {activeIndustry.title}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  Avg: {activeIndustry.avgConversionRate}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono">
                  {activeIndustry.recommendedDurationSec}s Ideal
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-4">
              {activeIndustry.summary}
            </p>

            {/* Psychological Triggers */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Key Psychological Triggers
              </span>
              <div className="flex flex-wrap gap-2">
                {activeIndustry.keyPsychologicalTriggers.map((trig, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-medium"
                  >
                    ⚡ {trig}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hook Blueprints */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Proven Pattern-Interrupt Hook Formulas
              </h3>
            </div>

            <div className="space-y-3">
              {activeIndustry.hookBlueprints.map((hook, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-400">{hook.pattern}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                      {hook.targetEmotion}
                    </span>
                  </div>
                  <p className="text-slate-200 italic leading-relaxed">
                    &quot;{hook.example}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Pacing Timeline Curve */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Golden Retention Pacing Curve (60-Second Breakdown)
              </h3>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30">
                <span className="text-[10px] text-indigo-400 block font-bold">HOOK</span>
                <span className="text-lg font-black text-white">{activeIndustry.pacingGuidelines.hookDurationSec}s</span>
                <span className="text-[10px] text-slate-400 block mt-1">Interrupt</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 block font-bold">PROBLEM</span>
                <span className="text-lg font-black text-white">{activeIndustry.pacingGuidelines.problemAgitationSec}s</span>
                <span className="text-[10px] text-slate-400 block mt-1">Agitation</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30">
                <span className="text-[10px] text-cyan-400 block font-bold">SOLUTION</span>
                <span className="text-lg font-black text-white">{activeIndustry.pacingGuidelines.solutionRevealSec}s</span>
                <span className="text-[10px] text-slate-400 block mt-1">Value Prop</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 block font-bold">PROOF</span>
                <span className="text-lg font-black text-white">{activeIndustry.pacingGuidelines.proofSocialProofSec}s</span>
                <span className="text-[10px] text-slate-400 block mt-1">Audited ROI</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-bold">OFFER</span>
                <span className="text-lg font-black text-white">{activeIndustry.pacingGuidelines.ctaDurationSec}s</span>
                <span className="text-[10px] text-slate-400 block mt-1">Directive</span>
              </div>
            </div>
          </div>

          {/* Visual Metaphors & Stock Tags */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Cinematic Visual Metaphors & Recommended Motion
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {activeIndustry.visualMetaphors.map((met, i) => (
                <div key={i} className="flex items-start space-x-2 text-slate-300">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span className="leading-relaxed">{met}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Recommended Stock B-Roll Retrieval Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeIndustry.defaultStockTags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Sparkles, 
  Layers, 
  Play, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  RotateCw, 
  Sliders, 
  FileCheck,
  Zap,
  TrendingUp,
  Share2,
  Download
} from 'lucide-react';
import { TimelinePlayer } from '@/components/studio/TimelinePlayer';
import { SceneEditor } from '@/components/studio/SceneEditor';
import { VideoProject, IndustryId, FunnelStage } from '@/lib/engine/types';
import { INITIAL_PROJECTS } from '@/lib/store/video-store';
import { INDUSTRY_CATALOG } from '@/lib/engine/industry-intelligence';
import { DEFAULT_BRAND_BRAINS } from '@/lib/engine/brand-brain-store';
import { generateCommercialVideoProject } from '@/lib/engine/pipeline-orchestrator';
import { runPrecomposeValidation } from '@/lib/engine/precompose-validator';
import { runPostRenderReview } from '@/lib/engine/post-render-reviewer';
import { getBrandBrain } from '@/lib/engine/brand-brain-store';
import { calculateVideoCost } from '@/lib/engine/cost-governor';

export default function StudioPage() {
  const [projects, setProjects] = useState<VideoProject[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newIndustry, setNewIndustry] = useState<IndustryId>('b2b-saas');
  const [newFunnel, setNewFunnel] = useState<FunnelStage>('TOP_OF_FUNNEL_HOOK');
  const [newBrandBrainId, setNewBrandBrainId] = useState('brain-nahalabs-core');
  const [newValueProp, setNewValueProp] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newCta, setNewCta] = useState('');

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const brandBrain = getBrandBrain(currentProject.brandBrainId);

  // Recalculate Precompose & Post-Review when project changes
  const precomposeCheck = currentProject.precomposeCheck || runPrecomposeValidation(currentProject.scenes, brandBrain);
  const postRenderReview = currentProject.postRenderReview || runPostRenderReview(currentProject, brandBrain);

  const costBreakdown = calculateVideoCost({
    durationSeconds: currentProject.totalDurationSec,
    resolution: currentProject.aspectRatio === '9:16' ? '1080p' : '4K Cinema',
    sceneCount: currentProject.scenes.length,
    shotCount: currentProject.scenes.length,
    aiProvider: 'nahalabs_canvas',
    ttsVoiceEnabled: true,
  });

  const handleUpdateProject = (updated: VideoProject) => {
    // Revalidate and update
    const pCheck = runPrecomposeValidation(updated.scenes, brandBrain);
    const pReview = runPostRenderReview(updated, brandBrain);
    
    const fullyUpdated = {
      ...updated,
      precomposeCheck: pCheck,
      postRenderReview: pReview,
      renderCostUsd: calculateVideoCost({
        durationSeconds: updated.totalDurationSec,
        resolution: updated.aspectRatio === '9:16' ? '1080p' : '4K Cinema',
        sceneCount: updated.scenes.length,
        shotCount: updated.scenes.length,
        aiProvider: 'nahalabs_canvas',
        ttsVoiceEnabled: true,
      }).totalCostUsd
    };

    setProjects(prev => prev.map(p => p.id === fullyUpdated.id ? fullyUpdated : p));
  };

  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    const created = generateCommercialVideoProject({
      title: newTitle || 'Commercial Video Campaign',
      industryId: newIndustry,
      funnelStage: newFunnel,
      brandBrainId: newBrandBrainId,
      commercialObjective: 'Drive high-converting customer acquisition',
      primaryValueProp: newValueProp || 'Automated high-velocity video production',
      targetAudience: newAudience || 'Target Commercial Buyers',
      callToAction: newCta || 'Visit our official website to claim offer',
      aspectRatio: '16:9',
    });

    setProjects(prev => [created, ...prev]);
    setSelectedProjectId(created.id);
    setActiveSceneIndex(0);
    setShowCreateModal(false);

    // Reset Form
    setNewTitle('');
    setNewValueProp('');
    setNewAudience('');
    setNewCta('');
  };

  const handleTriggerRender = async () => {
    setIsRendering(true);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProject)
      });
      const data = await res.json();
      if (data.success && data.project) {
        handleUpdateProject(data.project);
      }
    } catch (err) {
      console.error('Render error:', err);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Header & Project Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Production Studio & Timeline Editor
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              OpenMontage Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-track video composer, 35mm optical realism prompts, and automated self-critique rubric.
          </p>
        </div>

        {/* Project Selector & Launch New */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setActiveSceneIndex(0);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[240px] truncate"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                🎬 {p.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Video</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Timeline Player & Scene Editor (8 cols) */}
        <div className="xl:col-span-8 flex flex-col space-y-6">
          
          <TimelinePlayer
            project={currentProject}
            activeSceneIndex={activeSceneIndex}
            onSceneSelect={setActiveSceneIndex}
            onProjectUpdate={handleUpdateProject}
          />

          <SceneEditor
            project={currentProject}
            activeSceneIndex={activeSceneIndex}
            onSceneSelect={setActiveSceneIndex}
            onProjectUpdate={handleUpdateProject}
          />

        </div>

        {/* Right Column: Governance, Validation, Review, & Cost (4 cols) */}
        <div className="xl:col-span-4 flex flex-col space-y-6">
          
          {/* Quick Render Action Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1">
                <Zap className="h-4 w-4 mr-1 text-cyan-400" />
                <span>Production Action</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200">
                {currentProject.status.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Trigger the OpenMontage synthesis pipeline to compose frames, generate synchronized speech audio, apply LUT color science, and execute post-render review.
            </p>

            <button
              onClick={handleTriggerRender}
              disabled={isRendering || !precomposeCheck.valid}
              className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold shadow-lg transition-all ${
                !precomposeCheck.valid
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : isRendering
                  ? 'bg-indigo-700 text-white cursor-wait'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-600/30 active:scale-98'
              }`}
            >
              {isRendering ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Synthesize & Render Master (4K)</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Cost & Token Meter */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>Cost & Token Governance</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ${costBreakdown.totalCostUsd} USD
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Runtime:</span>
                <span className="text-slate-200 font-mono font-medium">{currentProject.totalDurationSec}s</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>LLM Tokens:</span>
                <span className="text-slate-200 font-mono font-medium">{costBreakdown.llmTokensEstimated.toLocaleString()} (${costBreakdown.llmCostUsd})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Render & Synthesis:</span>
                <span className="text-slate-200 font-mono font-medium">${costBreakdown.renderCostUsd}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>South Africa ZAR Rate:</span>
                <span className="text-slate-200 font-mono font-medium">R{costBreakdown.totalCostZar} ZAR</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Agency Cost Benchmark:</span>
                <span className="text-rose-400 line-through font-mono">${costBreakdown.agencyBenchmarkUsd}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                <span>Commercial Savings:</span>
                <span>{costBreakdown.savingsPercent}% Lower</span>
              </div>
            </div>
          </div>

          {/* Pre-Compose Validation Card (OpenMontage Gate) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Pre-Compose Quality Gate</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                precomposeCheck.valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {precomposeCheck.valid ? 'PASSED (0 FAIL)' : 'FAILED BOUNDARY'}
              </span>
            </div>

            <div className="space-y-2.5">
              {precomposeCheck.checks.map((check, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs">
                  {check.status === 'PASS' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                  {check.status === 'WARN' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />}
                  {check.status === 'FAIL' && <ShieldCheck className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-200">{check.name}</span>
                      {check.metric && <span className="text-[10px] text-slate-400 font-mono">{check.metric}</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Render Review Self-Critique Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1">
                <FileCheck className="h-4 w-4 text-indigo-400" />
                <span>Post-Render Self-Critique</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {postRenderReview.overallScore}/100 ({postRenderReview.verdict})
              </span>
            </div>

            {/* Sub-Scores Matrix */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-slate-950 text-xs">
                <span className="text-[10px] text-slate-400 block">Hook Strength</span>
                <span className="font-bold text-cyan-400">{postRenderReview.scores.hookStrength}/100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 text-xs">
                <span className="text-[10px] text-slate-400 block">Visual Realism</span>
                <span className="font-bold text-emerald-400">{postRenderReview.scores.visualRealism}/100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 text-xs">
                <span className="text-[10px] text-slate-400 block">Pacing & Flow</span>
                <span className="font-bold text-indigo-400">{postRenderReview.scores.pacingAndContinuity}/100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 text-xs">
                <span className="text-[10px] text-slate-400 block">Brand Voice</span>
                <span className="font-bold text-amber-400">{postRenderReview.scores.brandVoiceMatch}/100</span>
              </div>
            </div>

            {/* Key Critique Notes */}
            <div className="space-y-1.5 text-[11px] text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Critique & Recommendations
              </span>
              {postRenderReview.critique.map((c, i) => (
                <p key={i} className="leading-snug text-slate-300">• {c}</p>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Film className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Create Commercial Video Project</h2>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewProject} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Executive SaaS Modernization Campaign"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Industry Intelligence</label>
                  <select
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value as IndustryId)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {Object.values(INDUSTRY_CATALOG).map(ind => (
                      <option key={ind.id} value={ind.id}>{ind.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Funnel Stage</label>
                  <select
                    value={newFunnel}
                    onChange={(e) => setNewFunnel(e.target.value as FunnelStage)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="TOP_OF_FUNNEL_HOOK">Top of Funnel (Viral Hook & Interrupt)</option>
                    <option value="MIDDLE_OF_FUNNEL_DEMO">Middle of Funnel (Demo & Social Proof)</option>
                    <option value="BOTTOM_OF_FUNNEL_CONVERSION">Bottom of Funnel (Direct Response Offer)</option>
                    <option value="RETENTION_CUSTOMER_STORY">Retention (Customer Success Story)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Brand Brain Preset</label>
                <select
                  value={newBrandBrainId}
                  onChange={(e) => setNewBrandBrainId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  {DEFAULT_BRAND_BRAINS.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Value Proposition</label>
                <input
                  type="text"
                  required
                  value={newValueProp}
                  onChange={(e) => setNewValueProp(e.target.value)}
                  placeholder="e.g. Zero-loss customs freight clearance in 400ms"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Persona / ICP</label>
                <input
                  type="text"
                  required
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="e.g. Enterprise Supply Chain Directors and VPs of Procurement"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Call to Action Directive</label>
                <input
                  type="text"
                  required
                  value={newCta}
                  onChange={(e) => setNewCta(e.target.value)}
                  placeholder="e.g. Book a live technical walkthrough at cargoiq.co.za"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Timeline Pipeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

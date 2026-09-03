'use client';

import React from 'react';
import { 
  Clapperboard, 
  Camera, 
  Sparkles, 
  Sliders, 
  Music, 
  Eye, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Check, 
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Scene, Shot, VideoProject } from '@/lib/engine/types';
import { enrichRealismPrompt } from '@/lib/engine/realism-engine';

interface SceneEditorProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onProjectUpdate: (project: VideoProject) => void;
}

export function SceneEditor({
  project,
  activeSceneIndex,
  onSceneSelect,
  onProjectUpdate,
}: SceneEditorProps) {
  const currentScene = project.scenes[activeSceneIndex] || project.scenes[0];
  const currentShot = currentScene?.shots[0];

  const handleNarrationChange = (text: string) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[activeSceneIndex] = {
      ...currentScene,
      narrationText: text,
    };
    onProjectUpdate({
      ...project,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDurationChange = (durationSec: number) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[activeSceneIndex] = {
      ...currentScene,
      durationSec: Math.max(1, durationSec),
      shots: currentScene.shots.map(s => ({ ...s, durationSec: Math.max(1, durationSec) }))
    };
    const totalDurationSec = updatedScenes.reduce((acc, s) => acc + s.durationSec, 0);
    onProjectUpdate({
      ...project,
      scenes: updatedScenes,
      totalDurationSec,
      updatedAt: new Date().toISOString()
    });
  };

  const handleShotPropertyChange = (field: keyof Shot, value: any) => {
    if (!currentShot) return;
    const updatedShot = { ...currentShot, [field]: value };
    
    // Auto-recalculate realism prompt if optical settings changed
    if (field === 'shotType' || field === 'cameraMotion' || field === 'lightingStyle') {
      updatedShot.realismPrompt = enrichRealismPrompt(
        `Visual scene for ${currentScene.title}`,
        updatedShot.shotType,
        updatedShot.cameraMotion,
        updatedShot.lightingStyle
      );
    }

    const updatedScenes = [...project.scenes];
    updatedScenes[activeSceneIndex] = {
      ...currentScene,
      shots: [updatedShot]
    };
    onProjectUpdate({
      ...project,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddScene = () => {
    const newIndex = project.scenes.length;
    const newScene: Scene = {
      id: `scene-${Date.now().toString(36)}`,
      sceneIndex: newIndex,
      title: `Scene ${newIndex + 1}: Key Value Reinforcement`,
      funnelSection: 'PROOF',
      durationSec: 8,
      narrationText: 'Audited enterprise results demonstrate 3.4x faster production turnaround.',
      shots: [
        {
          id: `shot-${Date.now().toString(36)}`,
          durationSec: 8,
          shotType: 'dynamic_tracking',
          cameraMotion: 'subtle_zoom_in',
          lightingStyle: 'hyper_realistic_soft_studio',
          realismPrompt: enrichRealismPrompt('Executive metrics dashboard with real-time green telemetry', 'dynamic_tracking', 'subtle_zoom_in', 'hyper_realistic_soft_studio'),
          negativePrompt: 'cartoon, blurry, low res',
          stockFootageKeywords: ['analytics', 'metrics', 'growth'],
          bRollAssetUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=80',
          overlayText: 'AUDITED TELEMETRY'
        }
      ],
      backgroundColor: '#060f1e',
      accentColor: '#38bdf8',
      musicMood: 'energetic_propulsive'
    };

    const updatedScenes = [...project.scenes, newScene];
    const totalDurationSec = updatedScenes.reduce((acc, s) => acc + s.durationSec, 0);

    onProjectUpdate({
      ...project,
      scenes: updatedScenes,
      totalDurationSec,
      updatedAt: new Date().toISOString()
    });
    onSceneSelect(newIndex);
  };

  const words = currentScene.narrationText.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.round((words / Math.max(currentScene.durationSec, 1)) * 60);

  return (
    <div className="flex flex-col space-y-4">
      
      {/* Scene Navigation Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-xl scrollbar-none">
          {project.scenes.map((scene, idx) => {
            const isActive = idx === activeSceneIndex;
            return (
              <button
                key={scene.id}
                onClick={() => onSceneSelect(idx)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">S{idx + 1}</span>
                <span>{scene.funnelSection}</span>
                <span className="text-[10px] opacity-60">({scene.durationSec}s)</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleAddScene}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/40 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 text-xs font-semibold transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Main Scene Detail Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        
        {/* Left Column: Script & Narration */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clapperboard className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                {currentScene.title}
              </h3>
            </div>
            
            <div className="flex items-center space-x-3 text-xs">
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                wpm > 180 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {wpm} WPM ({words} words)
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Duration:</span>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={currentScene.durationSec}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 5)}
                  className="w-14 bg-slate-950 border border-slate-700 text-slate-100 px-2 py-0.5 rounded text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-500">sec</span>
              </div>
            </div>
          </div>

          {/* Narration Script Textarea */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Voiceover Narration Transcript (Spoken Text)</span>
              <span className="text-[10px] text-slate-500">OpenMontage Speech Sync</span>
            </label>
            <textarea
              rows={4}
              value={currentScene.narrationText}
              onChange={(e) => handleNarrationChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
              placeholder="Enter the voiceover script for this scene..."
            />
          </div>

          {/* Overlay Headline Text */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Visual Headline Text (Graphic Overlay)
            </label>
            <input
              type="text"
              value={currentShot?.overlayText || ''}
              onChange={(e) => handleShotPropertyChange('overlayText', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. THE UNCOMFORTABLE TRUTH"
            />
          </div>

          {/* Cinematic Realism Prompt Display */}
          <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                <span>Cinematic Optics & Realism Prompt (Claude Fable 5.1)</span>
              </span>
              <button 
                onClick={() => handleShotPropertyChange('realismPrompt', enrichRealismPrompt(
                  `Visual scene for ${currentScene.title}`,
                  currentShot?.shotType || 'macro_detail',
                  currentShot?.cameraMotion || 'subtle_zoom_in',
                  currentShot?.lightingStyle || 'hyper_realistic_soft_studio'
                ))}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                title="Regenerate Prompt"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Optimize</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              {currentShot?.realismPrompt || 'No prompt generated.'}
            </p>
          </div>

        </div>

        {/* Right Column: Director Controls & Optics */}
        <div className="lg:col-span-5 flex flex-col space-y-4 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-5">
          
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Director Optics & Physics
            </h4>
          </div>

          {/* Shot Framing Type */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Shot Framing</label>
            <select
              value={currentShot?.shotType || 'macro_detail'}
              onChange={(e) => handleShotPropertyChange('shotType', e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="macro_detail">Macro Detail (Tactile close-up)</option>
              <option value="wide_establishing">Wide Establishing (Atmospheric scale)</option>
              <option value="medium_over_shoulder">Medium Over Shoulder (Human focus)</option>
              <option value="dynamic_tracking">Dynamic Tracking (High-velocity motion)</option>
              <option value="cinematic_drone">Cinematic Drone (Panoramic aerial)</option>
              <option value="screen_ui_demo">Screen UI Demo (Clean interface)</option>
            </select>
          </div>

          {/* Camera Motion */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Camera Motion Vector</label>
            <select
              value={currentShot?.cameraMotion || 'subtle_zoom_in'}
              onChange={(e) => handleShotPropertyChange('cameraMotion', e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="subtle_zoom_in">Subtle Zoom In (Dolly Push)</option>
              <option value="lateral_truck_right">Lateral Truck Right (Parallax)</option>
              <option value="cinematic_pan">Cinematic Rotational Pan</option>
              <option value="dolly_forward">Dolly Forward (Glide)</option>
              <option value="static_hero">Static Hero (Locked-off)</option>
            </select>
          </div>

          {/* Lighting Style */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Lighting Physics</label>
            <select
              value={currentShot?.lightingStyle || 'hyper_realistic_soft_studio'}
              onChange={(e) => handleShotPropertyChange('lightingStyle', e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="hyper_realistic_soft_studio">Hyper-Realistic Soft Studio (5600K)</option>
              <option value="moody_dramatic_rim">Moody Dramatic Rim Light</option>
              <option value="bright_natural_morning">Bright Natural Daylight</option>
              <option value="neon_cyber_glow">Neon Cyber Obsidian Glow</option>
            </select>
          </div>

          {/* Background Music Mood */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
              <Music className="h-3 w-3 text-indigo-400" />
              <span>Music Track Mood</span>
            </label>
            <select
              value={currentScene.musicMood || 'energetic_propulsive'}
              onChange={(e) => {
                const updatedScenes = [...project.scenes];
                updatedScenes[activeSceneIndex] = { ...currentScene, musicMood: e.target.value as any };
                onProjectUpdate({ ...project, scenes: updatedScenes });
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="energetic_propulsive">Energetic Propulsive (High Conversion)</option>
              <option value="curious_minimal">Curious Minimal (Tech Explainer)</option>
              <option value="cinematic_epic">Cinematic Epic (Authority & Scale)</option>
              <option value="ambient_focus">Ambient Focus (Calm Clarity)</option>
              <option value="urgent_countdown">Urgent Countdown (FOMO / Direct Offer)</option>
            </select>
          </div>

        </div>

      </div>

    </div>
  );
}

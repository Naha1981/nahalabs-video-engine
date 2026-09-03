'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Download, 
  Sparkles, 
  Clock, 
  CheckCircle,
  Smartphone,
  Monitor,
  Square,
  Scissors,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { VideoProject, Scene } from '@/lib/engine/types';
import { generateSubtitleCues, getActiveCueAtTime, exportToSrt, exportToVtt } from '@/lib/engine/subtitle-engine';

interface TimelinePlayerProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onProjectUpdate?: (project: VideoProject) => void;
}

export function TimelinePlayer({
  project,
  activeSceneIndex,
  onSceneSelect,
  onProjectUpdate
}: TimelinePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(project.aspectRatio || '16:9');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDownloaded, setExportDownloaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const totalDuration = useMemo(() => {
    return project.scenes.reduce((acc, s) => acc + s.durationSec, 0) || 60;
  }, [project.scenes]);

  const subtitleCues = useMemo(() => {
    return generateSubtitleCues(project.scenes);
  }, [project.scenes]);

  // Find active scene based on current time
  const currentScene = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      if (currentTimeSec >= acc && currentTimeSec < acc + scene.durationSec) {
        return { scene, index: i, startSec: acc, progressInSection: (currentTimeSec - acc) / scene.durationSec };
      }
      acc += scene.durationSec;
    }
    const last = project.scenes[project.scenes.length - 1];
    return { scene: last, index: project.scenes.length - 1, startSec: acc - (last?.durationSec || 0), progressInSection: 1 };
  }, [project.scenes, currentTimeSec]);

  // Sync active scene index with parent if changed
  useEffect(() => {
    if (currentScene && currentScene.index !== activeSceneIndex) {
      onSceneSelect(currentScene.index);
    }
  }, [currentScene.index]);

  // Speech Voiceover Controller
  const speakCurrentScene = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || isMuted) return;
    window.speechSynthesis.cancel();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastTickTimeRef.current = Date.now();

    // Trigger voiceover for active scene when starting
    if (currentScene?.scene?.narrationText) {
      speakCurrentScene(currentScene.scene.narrationText);
    }

    const loop = () => {
      const now = Date.now();
      const deltaSec = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setCurrentTimeSec((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, totalDuration]);

  // When current scene changes during playback, speak the new scene copy
  const previousSceneIndexRef = useRef(currentScene.index);
  useEffect(() => {
    if (isPlaying && previousSceneIndexRef.current !== currentScene.index) {
      previousSceneIndexRef.current = currentScene.index;
      if (currentScene?.scene?.narrationText) {
        speakCurrentScene(currentScene.scene.narrationText);
      }
    }
  }, [currentScene.index, isPlaying]);

  // Canvas Compositor Drawing Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions based on aspect ratio
    let targetWidth = 1280;
    let targetHeight = 720;
    if (aspectRatio === '9:16') {
      targetWidth = 720;
      targetHeight = 1280;
    } else if (aspectRatio === '1:1') {
      targetWidth = 1080;
      targetHeight = 1080;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 1. Draw Background Gradient with Cinematic Lighting
    const sceneColor = currentScene?.scene?.backgroundColor || '#0a0f1d';
    const accentColor = currentScene?.scene?.accentColor || '#6366f1';
    
    const grad = ctx.createRadialGradient(
      targetWidth * 0.5,
      targetHeight * 0.4,
      targetWidth * 0.1,
      targetWidth * 0.5,
      targetHeight * 0.5,
      targetWidth * 0.8
    );
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, sceneColor);
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 2. Simulated Ken Burns Dynamic Motion & Texture Grid
    const progress = currentScene?.progressInSection || 0;
    const zoomScale = 1.0 + (progress * 0.08);

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-targetWidth / 2, -targetHeight / 2);

    // Draw Subtle Cyber/Cinematic Geometric Grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < targetWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, targetHeight);
      ctx.stroke();
    }
    for (let y = 0; y < targetHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(targetWidth, y);
      ctx.stroke();
    }

    // Atmospheric Light Glow
    const glowGrad = ctx.createRadialGradient(
      targetWidth * 0.5 + Math.sin(currentTimeSec * 2) * 50,
      targetHeight * 0.35 + Math.cos(currentTimeSec * 1.5) * 30,
      10,
      targetWidth * 0.5,
      targetHeight * 0.35,
      targetWidth * 0.45
    );
    glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    glowGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.1)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.restore();

    // 3. Draw Scene Category Badge & Title
    ctx.save();
    const badgeText = `SECTION: ${currentScene?.scene?.funnelSection || 'HOOK'} [SCENE ${currentScene.index + 1}/${project.scenes.length}]`;
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(badgeText, 50, 70);

    // Overlay Header
    const shot = currentScene?.scene?.shots[0];
    const overlayHeading = shot?.overlayText || currentScene?.scene?.title || '';
    if (overlayHeading) {
      ctx.font = '900 42px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 12;
      ctx.fillText(overlayHeading, 50, 130);
    }
    ctx.restore();

    // 4. Draw Director Shot Metadata HUD
    if (shot) {
      ctx.save();
      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.fillText(`OPTICS: 35mm Arri Raw · ${shot.shotType.toUpperCase()}`, 50, targetHeight - 160);
      ctx.fillText(`MOTION: ${shot.cameraMotion.toUpperCase()} · ${shot.lightingStyle.replace(/_/g, ' ').toUpperCase()}`, 50, targetHeight - 135);
      ctx.restore();
    }

    // 5. Draw Active Subtitles / Karaoke Captions
    const activeCue = getActiveCueAtTime(subtitleCues, currentTimeSec);
    if (activeCue) {
      ctx.save();
      const captionBoxY = targetHeight - 90;
      
      // Caption Background Pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1.5;

      const words = activeCue.words || [];
      const fullText = activeCue.text;
      
      ctx.font = 'bold 28px sans-serif';
      const textWidth = ctx.measureText(fullText).width;
      const boxWidth = Math.min(targetWidth - 80, textWidth + 48);
      const boxX = (targetWidth - boxWidth) / 2;

      // Rounded background pill
      ctx.beginPath();
      ctx.roundRect(boxX, captionBoxY - 32, boxWidth, 54, 12);
      ctx.fill();
      ctx.stroke();

      // Draw word-by-word highlighted text
      let currentX = boxX + 24;
      words.forEach((w) => {
        const isCurrentWord = currentTimeSec >= w.startSec && currentTimeSec <= w.endSec;
        const isPastWord = currentTimeSec > w.endSec;

        if (isCurrentWord) {
          ctx.fillStyle = '#38bdf8'; // Highlight Cyan
          ctx.font = '900 30px sans-serif';
        } else if (isPastWord) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px sans-serif';
        } else {
          ctx.fillStyle = 'rgba(203, 213, 225, 0.6)'; // Future words dimmed
          ctx.font = 'bold 28px sans-serif';
        }

        ctx.fillText(w.word, currentX, captionBoxY + 6);
        currentX += ctx.measureText(w.word + ' ').width;
      });

      ctx.restore();
    }

    // 6. Draw Brand Logo Watermark in Top Right
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 16px sans-serif';
    const watermark = 'NAHALABS ENGINE';
    const wmWidth = ctx.measureText(watermark).width;
    ctx.fillText(watermark, targetWidth - wmWidth - 40, 60);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(targetWidth - wmWidth - 50, 40, wmWidth + 20, 28);
    ctx.restore();

  }, [currentTimeSec, currentScene, aspectRatio, subtitleCues, project]);

  // Handle Timeline Scrubbing
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newPercent * totalDuration;
    setCurrentTimeSec(newTime);
  };

  // Video Export Package Generator
  const handleExportVideo = () => {
    setIsExporting(true);
    setExportProgress(10);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportDownloaded(true);
          
          // Trigger file download of the video composition bundle
          const srtContent = exportToSrt(subtitleCues);
          const vttContent = exportToVtt(subtitleCues);
          const projectJson = JSON.stringify(project, null, 2);

          const bundle = `=== NAHALABS VIDEO ENGINE PRODUCTION EXPORT ===\nProject: ${project.title}\nDuration: ${totalDuration}s\nResolution: ${aspectRatio}\nTimestamp: ${new Date().toISOString()}\n\n=== SUBTITLES (SRT) ===\n${srtContent}\n\n=== SUBTITLES (VTT) ===\n${vttContent}\n\n=== PRODUCTION TIMELINE JSON ===\n${projectJson}`;
          
          const blob = new Blob([bundle], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nahalabs_production_${project.id}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  return (
    <div className="flex flex-col rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
      
      {/* Top Studio Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center space-x-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            OpenMontage Timeline Engine
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs font-mono text-indigo-400">
            {currentTimeSec.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </span>
        </div>

        {/* Aspect Ratio Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              aspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="16:9 Widescreen (YouTube, Web, TV)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>16:9</span>
          </button>
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              aspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="9:16 Vertical (Shorts, Reels, TikTok)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => setAspectRatio('1:1')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              aspectRatio === '1:1' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="1:1 Square (Feed Ads)"
          >
            <Square className="h-3.5 w-3.5" />
            <span>1:1</span>
          </button>
        </div>
      </div>

      {/* Main Video Canvas Viewport */}
      <div className="relative flex items-center justify-center p-4 bg-slate-950 min-h-[380px] lg:min-h-[480px]">
        <div 
          className={`relative overflow-hidden rounded-xl shadow-2xl border border-slate-800 transition-all duration-300 ${
            aspectRatio === '16:9' ? 'w-full max-w-4xl aspect-video' :
            aspectRatio === '9:16' ? 'w-full max-w-[290px] aspect-[9/16]' :
            'w-full max-w-[420px] aspect-square'
          }`}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block"
          />

          {/* Center Play Button Overlay when Paused */}
          {!isPlaying && (
            <div 
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer hover:bg-black/30 transition-all group"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-xl shadow-indigo-600/40 group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrubbable Multi-Track Timeline Bar */}
      <div className="px-6 pt-4 pb-2 bg-slate-900 border-t border-slate-800">
        
        {/* Scene Segment Markers */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
          <span>00:00</span>
          <span className="text-indigo-400 font-semibold">
            {currentScene?.scene?.title || 'Active Scene'}
          </span>
          <span>{Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, '0')}</span>
        </div>

        {/* Multi-Scene Segment Visualizer */}
        <div 
          onClick={handleSeek}
          className="relative h-4 w-full bg-slate-950 rounded-lg cursor-pointer overflow-hidden border border-slate-800 flex"
        >
          {project.scenes.map((scene, idx) => {
            const widthPct = (scene.durationSec / totalDuration) * 100;
            const isCurrent = currentScene?.index === idx;
            return (
              <div
                key={scene.id}
                style={{ width: `${widthPct}%` }}
                className={`h-full border-r border-slate-900/80 transition-colors flex items-center justify-center ${
                  isCurrent ? 'bg-indigo-600/80' : 'bg-slate-800/80 hover:bg-slate-700/80'
                }`}
                title={`${scene.title} (${scene.durationSec}s)`}
              >
                <span className="text-[9px] font-mono text-slate-200 truncate px-1 pointer-events-none">
                  S{idx + 1}
                </span>
              </div>
            );
          })}

          {/* Current Playhead Scrubber */}
          <div 
            style={{ left: `${(currentTimeSec / totalDuration) * 100}%` }}
            className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee] pointer-events-none"
          />
        </div>

        {/* Audio Waveform Indicator */}
        <div className="flex items-center space-x-1 mt-2.5 h-3 opacity-60">
          {Array.from({ length: 48 }).map((_, i) => {
            const active = (i / 48) <= (currentTimeSec / totalDuration);
            const height = 20 + Math.sin(i * 0.8) * 60;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-full transition-colors ${active ? 'bg-cyan-400' : 'bg-slate-700'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800/80 gap-3">
        
        {/* Playback Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTimeSec(0);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Restart Timeline"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-slate-300" />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 h-1 bg-slate-800 rounded-lg accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Scene Info Pill */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <FileText className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400">Narration:</span>
          <span className="text-slate-200 font-medium max-w-xs truncate">
            &quot;{currentScene?.scene?.narrationText || 'No narration'}&quot;
          </span>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
              exportDownloaded 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isExporting ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : exportDownloaded ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Package Exported ✓</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Render & Export Bundle</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}

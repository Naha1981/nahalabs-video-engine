'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  Plus, 
  Send, 
  Share2,
  Lock,
  Sparkles,
  Play
} from 'lucide-react';
import { VideoProject, AnnotationComment } from '@/lib/engine/types';
import { INITIAL_PROJECTS } from '@/lib/store/video-store';

export default function ApprovalsPage() {
  const [projects, setProjects] = useState<VideoProject[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [commentText, setCommentText] = useState('');
  const [timestampSec, setTimestampSec] = useState<number>(4);
  const [role, setRole] = useState<AnnotationComment['authorRole']>('Client');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const defaultAnnotations: AnnotationComment[] = [
    {
      id: 'ann-1',
      timestampSec: 2.5,
      authorName: 'Sarah Jenkins (VP Marketing)',
      authorRole: 'Client',
      text: 'Opening hook is super sharp. Can we make the logo watermark slightly brighter at 00:02?',
      status: 'resolved',
      createdAt: '2 hours ago'
    },
    {
      id: 'ann-2',
      timestampSec: 18.0,
      authorName: 'David K. (Creative Lead)',
      authorRole: 'Creative Director',
      text: 'Pacing in Scene 3 matches the 148 WPM brand target perfectly. Approved for client delivery.',
      status: 'open',
      createdAt: '45 minutes ago'
    }
  ];

  const annotations = activeProject.annotations?.length > 0 ? activeProject.annotations : defaultAnnotations;

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText) return;

    const newComment: AnnotationComment = {
      id: `ann-${Date.now().toString(36)}`,
      timestampSec,
      authorName: role === 'Client' ? 'Enterprise Client Lead' : 'NahaLabs Lead Producer',
      authorRole: role,
      text: commentText,
      status: 'open',
      createdAt: 'Just now'
    };

    const updated = {
      ...activeProject,
      annotations: [newComment, ...annotations]
    };

    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setCommentText('');
  };

  const handleUpdateApprovalStatus = (newStatus: VideoProject['approvalStatus']) => {
    const updated = { ...activeProject, approvalStatus: newStatus };
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/approvals?project=${activeProject.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Client Approvals & Revision Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Frame-accurate timestamp annotations, multi-role governance gates, and client sign-off audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleCopyShareLink}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copiedLink ? 'Link Copied ✓' : 'Share Client Link'}</span>
          </button>
        </div>
      </div>

      {/* 4-Stage Governance Quality Gates Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-lg text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-emerald-400 font-mono">GATE 0: SECURITY</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">PASSED</span>
          </div>
          <p className="text-[11px] text-slate-400">Zero sensitive secrets committed, tenant isolation enforced at data layer.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-lg text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-emerald-400 font-mono">GATE 1: PRE-COMPOSE</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">PASSED</span>
          </div>
          <p className="text-[11px] text-slate-400">WPM pacing verified, zero prohibited blacklist terms detected.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40 shadow-lg text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-indigo-400 font-mono">GATE 2: CLIENT REVIEW</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              {activeProject.approvalStatus}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Collaborative feedback & timestamped annotations open for review.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-400 font-mono">GATE 3: PRODUCTION</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">PENDING SIGN-OFF</span>
          </div>
          <p className="text-[11px] text-slate-400">Syndication to YouTube, Reels, and WhatsApp ad campaigns.</p>
        </div>
      </div>

      {/* Main Review Grid: Player Preview + Annotations Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Video Preview Thumbnail & Status Actions (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-2xl flex items-center justify-center group">
            <img 
              src={activeProject.thumbnailUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80'}
              alt={activeProject.title}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-between p-5">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 rounded bg-black/60 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono">
                  {activeProject.totalDurationSec}s · {activeProject.aspectRatio}
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Status: {activeProject.approvalStatus}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-white">{activeProject.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{activeProject.description}</p>
              </div>
            </div>
          </div>

          {/* Client Action Sign-Off Buttons */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Executive Sign-Off Decision
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUpdateApprovalStatus('APPROVED')}
                className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Video Master ✓</span>
              </button>

              <button
                onClick={() => handleUpdateApprovalStatus('REVISIONS_REQUESTED')}
                className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-rose-900/60 hover:bg-rose-800/80 border border-rose-600/50 text-rose-200 text-xs font-bold transition-all"
              >
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>Request Revisions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Timestamp Annotations (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Timestamped Feedback ({annotations.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Frame-accurate reviews</span>
          </div>

          {/* New Annotation Form */}
          <form onSubmit={handleAddAnnotation} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-slate-400">Timestamp:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={activeProject.totalDurationSec}
                  value={timestampSec}
                  onChange={(e) => setTimestampSec(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-center font-mono"
                />
                <span className="text-slate-500">sec</span>
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2.5 py-1 text-[11px]"
              >
                <option value="Client">Client Role</option>
                <option value="Creative Director">Creative Director</option>
                <option value="Lead Producer">Lead Producer</option>
                <option value="Compliance Officer">Compliance Officer</option>
              </select>
            </div>

            <textarea
              rows={2}
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave specific feedback at this timestamp (e.g. 'Trim narration by 1 sec')..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
              >
                <Send className="h-3 w-3" />
                <span>Post Note</span>
              </button>
            </div>
          </form>

          {/* Annotations List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {annotations.map((ann) => (
              <div key={ann.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                      ⏱ 00:{String(Math.floor(ann.timestampSec)).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-slate-200">{ann.authorName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{ann.createdAt}</span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {ann.text}
                </p>

                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-slate-500">Role: {ann.authorRole}</span>
                  <span className={`px-2 py-0.5 rounded font-mono ${
                    ann.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {ann.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

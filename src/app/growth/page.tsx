'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Sparkles, Lightbulb, Megaphone, Radio, Gauge, Share2, Activity, ShieldCheck,
  Send, Loader2, CheckCircle2, AlertTriangle, Zap, Brain, TrendingUp, Lock, XCircle,
} from 'lucide-react';

interface Opportunity {
  id: string; title: string; score: number; confidence: string; recommendedFormat: string;
  recommendedPlatform: string; estimatedCostUsd: number; reason: string; evidence: string[];
  formatRationale: string; status: string;
}
interface Campaign {
  id: string; rawBrief: string; objective: string; status: string; approvalPolicy: string;
  platforms: string[]; checkpoints: string[]; costUsd: number; failure?: { reason: string };
}
interface Provider { id: string; label: string; kind: string; status: string; paid: boolean; fallbackNote: string; }
interface LoopResult { awaitingHuman?: boolean; degraded?: boolean; degradationNotes?: string[]; steps?: { step: string; status: string; detail: string }[]; }
interface Connection { id: string; platform: string; status: string; autopilot: boolean; }
interface Usage { totals?: { freeCostUsd: number; paidCostUsd: number; operations: number }; }

const STATUS_COLORS: Record<string, string> = {
  ok: 'text-emerald-400', degraded: 'text-amber-400', needs_human: 'text-sky-400',
  skipped: 'text-slate-400', failed: 'text-rose-400',
};

export default function GrowthPage() {
  const [tenantId, setTenantId] = useState('');
  const [message, setMessage] = useState("Promote our new burger — I want Instagram Reels that drive Tuesday bookings.");
  const [busy, setBusy] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [usage, setUsage] = useState<Usage>({});
  const [loop, setLoop] = useState<LoopResult | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async (tid: string) => {
    if (!tid) return;
    const [opp, camp, prov, conn, us] = await Promise.all([
      fetch(`/api/growth/opportunities?tenantId=${tid}`).then((r) => r.json()),
      fetch(`/api/growth/campaigns?tenantId=${tid}`).then((r) => r.json()),
      fetch('/api/growth/providers').then((r) => r.json()),
      fetch(`/api/growth/connections?tenantId=${tid}`).then((r) => r.json()),
      fetch(`/api/growth/usage?tenantId=${tid}`).then((r) => r.json()),
    ]);
    setOpportunities(opp.opportunities || []);
    setCampaigns(camp.campaigns || []);
    setProviders(prov.providers || []);
    setConnections(conn.connections || []);
    setUsage({ totals: us.totals });
  }, []);

  useEffect(() => {
    // Seed/fetch the demo tenant on load.
    fetch('/api/growth/organizations')
      .then((r) => r.json())
      .then((d) => {
        const tid = d.organizations?.[0]?.id;
        if (tid) { setTenantId(tid); refresh(tid); }
      })
      .catch(() => setError('Could not initialize demo tenant.'));
  }, [refresh]);

  const runCampaign = async () => {
    if (!message.trim() || !tenantId) return;
    setBusy(true); setError(''); setLoop(null);
    try {
      const res = await fetch('/api/growth/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, message, source: 'conversation' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Campaign failed');
      setLoop(data.loop);
      await refresh(tenantId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const act = async (campaignId: string, action: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/growth/campaigns/${campaignId}?tenantId=${tenantId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, qcPassed: true }),
      });
      const data = await res.json();
      if (data.loop) setLoop(data.loop);
      await refresh(tenantId);
    } finally { setBusy(false); }
  };

  const configuredCount = providers.filter((p) => p.status === 'configured').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
          <TrendingUp className="h-3.5 w-3.5" /> NahaLabs Growth OS · Autonomous Growth Loop
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Tell NahaLabs what you want to achieve.</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          Business understanding → research → opportunity → strategy → Video Engine production → QC → approval → publishing → measurement → learning.
          Human approval is on by default; nothing is faked — unavailable capabilities report honestly.
        </p>

        {/* One-message intake (§3, §54) */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Promote our new burger — 6 Instagram Reels that drive bookings."
            className="flex-1 bg-slate-950/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={runCampaign}
            disabled={busy}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Run Growth Loop
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-400 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{error}</p>}
      </div>

      {/* Loop trace */}
      {loop && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-emerald-400" /> Autonomous loop trace</h2>
          <div className="space-y-1.5">
            {loop.steps?.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 ${STATUS_COLORS[s.status] || 'text-slate-300'}`}>
                  {s.status === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.status === 'needs_human' ? <ShieldCheck className="h-3.5 w-3.5" /> : s.status === 'degraded' ? <AlertTriangle className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
                </span>
                <span className="font-mono text-slate-400 w-32 shrink-0">{s.step}</span>
                <span className="text-slate-300">{s.detail}</span>
              </div>
            ))}
          </div>
          {loop.degraded && (
            <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
              <strong>Degraded (honest, not faked):</strong>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                {loop.degradationNotes?.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
          {loop.awaitingHuman && (
            <p className="mt-3 text-xs text-sky-300 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Stopped for a consequential human decision (approval). Approve to continue to production.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunities (§12) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Lightbulb className="h-4 w-4 text-amber-400" /> NahaLabs Opportunities</h2>
          <div className="space-y-3">
            {opportunities.length === 0 && <p className="text-xs text-slate-500">No opportunities yet — run a campaign or daily research.</p>}
            {opportunities.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{o.title}</p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{o.recommendedFormat.replace(/_/g, ' ')} · {o.recommendedPlatform} · ~${o.estimatedCostUsd.toFixed(2)} · {o.confidence} confidence</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-emerald-400">{o.score}</div>
                    <div className="text-[10px] text-slate-500">score</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2">{o.reason}</p>
                {!['reel', 'video_16x9', 'video_1x1'].includes(o.recommendedFormat) && (
                  <p className="text-[11px] text-cyan-300 mt-2 flex items-center gap-1"><Brain className="h-3 w-3" /> NahaLabs judged video is NOT the best format here — {o.formatRationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Provider honesty (§22, §57) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Gauge className="h-4 w-4 text-cyan-400" /> Providers · {configuredCount}/{providers.length} configured</h2>
          <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1"><Lock className="h-3 w-3" /> Default cost mode: FREE_ONLY — no paid execution without approval.</p>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {providers.map((p) => (
              <div key={p.id} className="flex items-start gap-2 text-xs">
                {p.status === 'configured'
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  : <XCircle className="h-3.5 w-3.5 text-slate-600 mt-0.5 shrink-0" />}
                <div>
                  <span className="text-slate-200">{p.label}</span>
                  {p.paid && <span className="ml-1 text-[10px] text-amber-400">PAID</span>}
                  {p.status !== 'configured' && <p className="text-[10px] text-slate-500">{p.fallbackNote}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns / approvals (§25) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Megaphone className="h-4 w-4 text-indigo-400" /> Campaigns & approval</h2>
        <div className="space-y-3">
          {campaigns.length === 0 && <p className="text-xs text-slate-500">No campaigns yet.</p>}
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white capitalize">{c.objective.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">“{c.rawBrief.slice(0, 90)}”</p>
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded-full bg-slate-800 text-slate-200">{c.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.checkpoints.map((cp) => (
                  <span key={cp} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{cp.replace(/_/g, ' ')}</span>
                ))}
              </div>
              {c.failure && <p className="mt-2 text-[11px] text-amber-300 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {c.failure.reason}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status === 'AWAITING_APPROVAL' && (
                  <>
                    <button onClick={() => act(c.id, 'approve')} disabled={busy} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">Approve & produce</button>
                    <button onClick={() => act(c.id, 'request_changes')} disabled={busy} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white">Request changes</button>
                    <button onClick={() => act(c.id, 'reject')} disabled={busy} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-700/80 hover:bg-rose-600 text-white">Reject</button>
                  </>
                )}
                {(c.status === 'READY_TO_PUBLISH' || c.status === 'FAILED_RECOVERABLE') && (
                  <button onClick={() => act(c.id, c.status === 'FAILED_RECOVERABLE' ? 'resume' : 'produce')} disabled={busy} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> {c.status === 'FAILED_RECOVERABLE' ? 'Resume from checkpoint' : 'Publish / deliver'}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channels + cost summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Radio className="h-4 w-4 text-fuchsia-400" /> Connected channels & autopilot</h2>
          {connections.length === 0 && <p className="text-xs text-slate-500">No channels. Connect via OAuth (passwords never accepted).</p>}
          {connections.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-800 last:border-0">
              <span className="capitalize text-slate-200">{c.platform}</span>
              <span className="flex items-center gap-2">
                <span className={c.status === 'connected' ? 'text-emerald-400' : 'text-slate-500'}>{c.status.replace(/_/g, ' ')}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.autopilot ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  autopilot {c.autopilot ? 'ON' : 'OFF'}
                </span>
              </span>
            </div>
          ))}
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Autopilot is always OFF per platform until explicitly enabled.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-emerald-400" /> Usage & cost-to-serve</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-950/60 p-3">
              <div className="text-xl font-black text-white">{usage.totals?.operations ?? 0}</div>
              <div className="text-[10px] text-slate-500">operations logged</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3">
              <div className="text-xl font-black text-emerald-400">${(usage.totals?.freeCostUsd ?? 0).toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">free usage</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3">
              <div className="text-xl font-black text-amber-400">${(usage.totals?.paidCostUsd ?? 0).toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">paid (guarded)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

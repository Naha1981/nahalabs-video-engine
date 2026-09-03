'use client';

import React, { useState } from 'react';
import { 
  Boxes, 
  Terminal, 
  ShieldCheck, 
  Send, 
  Sparkles, 
  Play, 
  Mail, 
  CheckCircle2, 
  Copy, 
  Code2,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { MCP_TOOLS } from '@/lib/integrations/mcp-server';
import { generateHmacV2Signature, verifyHmacV2Signature } from '@/lib/integrations/hmac-security';
import { dispatchWebhookEvent, getWebhookLogs } from '@/lib/integrations/activepieces-client';
import { sendTransactionalEmail, getEmailLogs, createVideoReadyEmail } from '@/lib/integrations/resend-email';

export default function IntegrationsPage() {
  const [selectedTool, setSelectedTool] = useState<string>(MCP_TOOLS[0].name);
  const [toolArgsJson, setToolArgsJson] = useState('{\n  "category": "Technology"\n}');
  const [mcpResult, setMcpResult] = useState<string>('');
  const [isCallingMcp, setIsCallingMcp] = useState(false);

  // HMAC Sandbox State
  const [hmacPayload, setHmacPayload] = useState('{\n  "event": "video.rendered",\n  "projectId": "proj-101",\n  "durationSec": 60\n}');
  const [hmacSecret, setHmacSecret] = useState('nahalabs_default_dev_hmac_secret_key_v2');
  const [generatedSig, setGeneratedSig] = useState<{ signature: string; headerValue: string } | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Webhook Dispatch State
  const [webhookUrl, setWebhookUrl] = useState('https://cloud.activepieces.com/api/v1/webhooks/demo');
  const [webhookLogs, setWebhookLogs] = useState(getWebhookLogs());
  const [isDispatching, setIsDispatching] = useState(false);

  // Email Test State
  const [emailTo, setEmailTo] = useState('founder@enterprise-client.com');
  const [emailSubject, setEmailSubject] = useState('🎬 Commercial Master Video Rendered (NahaLabs)');
  const [emailLogs, setEmailLogs] = useState(getEmailLogs());

  const handleTestMcpTool = async () => {
    setIsCallingMcp(true);
    setMcpResult('Executing MCP tool call via /api/mcp...');
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolArgsJson);
      } catch (err) {
        setMcpResult(`Invalid JSON Arguments: ${(err as Error).message}`);
        setIsCallingMcp(false);
        return;
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'mcp-test-1',
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedArgs
          }
        })
      });

      const data = await res.json();
      setMcpResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setMcpResult(`Error calling MCP endpoint: ${err.message}`);
    } finally {
      setIsCallingMcp(false);
    }
  };

  const handleGenerateHmac = () => {
    try {
      const sig = generateHmacV2Signature({
        secret: hmacSecret,
        body: hmacPayload
      });
      setGeneratedSig(sig);

      // Verify the generated signature
      const verify = verifyHmacV2Signature(sig.headerValue, hmacPayload, hmacSecret);
      setVerificationResult(verify);
    } catch (err: any) {
      setVerificationResult({ valid: false, reason: err.message });
    }
  };

  const handleDispatchWebhook = async () => {
    setIsDispatching(true);
    await dispatchWebhookEvent({
      targetUrl: webhookUrl,
      eventType: 'video.rendered',
      payload: {
        projectId: 'proj-live-demo',
        title: 'NahaLabs Commercial Engine Master',
        durationSec: 60,
        renderStatus: 'ready',
        exportUrl: 'https://nahalabs.ai/exports/master.mp4'
      },
      secret: hmacSecret
    });
    setWebhookLogs([...getWebhookLogs()]);
    setIsDispatching(false);
  };

  const handleSendTestEmail = async () => {
    await sendTransactionalEmail({
      to: emailTo,
      subject: emailSubject,
      html: createVideoReadyEmail('NahaLabs Enterprise Launch', 60, 'https://nahalabs.ai/studio'),
      templateType: 'video_ready'
    });
    setEmailLogs([...getEmailLogs()]);
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              MCP Gateway, Webhooks & Activepieces Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Universal AI agent access layer, HMAC-SHA256 v2 signed webhooks, and transactional communication infrastructure.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
            /api/mcp endpoint live
          </span>
        </div>
      </div>

      {/* 2-Column Grid: Universal MCP Tester & HMAC Security Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Universal MCP Gateway Explorer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Universal MCP Gateway Explorer (JSON-RPC 2.0)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Claude / Cursor / ChatGPT</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select MCP Tool</label>
              <select
                value={selectedTool}
                onChange={(e) => {
                  setSelectedTool(e.target.value);
                  if (e.target.value === 'calculate_video_cost') {
                    setToolArgsJson('{\n  "durationSeconds": 60,\n  "resolution": "4K Cinema",\n  "sceneCount": 5\n}');
                  } else if (e.target.value === 'get_brand_brain') {
                    setToolArgsJson('{\n  "brandBrainId": "brain-nahalabs-core"\n}');
                  } else if (e.target.value === 'get_system_health') {
                    setToolArgsJson('{}');
                  } else {
                    setToolArgsJson('{\n  "category": "Technology"\n}');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {MCP_TOOLS.map(t => (
                  <option key={t.name} value={t.name}>
                    🔧 {t.name} - {t.description.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">JSON-RPC Tool Arguments</label>
              <textarea
                rows={4}
                value={toolArgsJson}
                onChange={(e) => setToolArgsJson(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-cyan-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Exposes tool schema via /api/mcp</span>
              <button
                onClick={handleTestMcpTool}
                disabled={isCallingMcp}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/20"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{isCallingMcp ? 'Executing...' : 'Execute Tool Call'}</span>
              </button>
            </div>

            {/* MCP JSON Response Box */}
            {mcpResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  JSON-RPC Response Payload:
                </span>
                <pre className="text-[11px] text-slate-200 font-mono overflow-x-auto max-h-48 scrollbar-none whitespace-pre-wrap">
                  {mcpResult}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: HMAC v2 Security Sandbox (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                HMAC-SHA256 v2 Signature Sandbox
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
              Fail-Closed
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Shared Webhook Secret</label>
              <input
                type="text"
                value={hmacSecret}
                onChange={(e) => setHmacSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Raw Payload to Sign</label>
              <textarea
                rows={3}
                value={hmacPayload}
                onChange={(e) => setHmacPayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono text-[11px]"
              />
            </div>

            <button
              onClick={handleGenerateHmac}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
            >
              Generate & Verify HMAC v2 Signature
            </button>

            {generatedSig && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Header (x-nahalabs-signature):</span>
                  <span className="text-cyan-300 break-all">{generatedSig.headerValue}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Constant-Time Verification:</span>
                  <span className={`font-bold ${verificationResult?.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {verificationResult?.valid ? '✓ VALID SIGNATURE' : '✕ INVALID'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom 2-Column: Activepieces/Zapier Webhooks & Resend Transactional Email */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Activepieces / Zapier Webhook Dispatcher (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Activepieces & Zapier Webhook Dispatcher
              </h3>
            </div>
            <span className="text-xs text-slate-400">Auto-Syndication</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex space-x-2">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://cloud.activepieces.com/api/v1/webhooks/..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono"
              />
              <button
                onClick={handleDispatchWebhook}
                disabled={isDispatching}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors"
              >
                {isDispatching ? 'Sending...' : 'Fire Event'}
              </button>
            </div>

            {/* Webhook Delivery Log */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {webhookLogs.length === 0 ? (
                <p className="text-slate-500 italic py-2">No webhook dispatches yet.</p>
              ) : (
                webhookLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono flex justify-between items-center">
                    <div>
                      <span className="text-cyan-400 font-bold">{log.eventType}</span>
                      <span className="text-slate-500 ml-2 truncate max-w-xs block sm:inline">{log.targetUrl}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">✓ {log.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Resend Email Client Log (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Resend Transactional Email Infrastructure
              </h3>
            </div>
            <span className="text-xs text-slate-400">Zero Client-Side Keys</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex space-x-2">
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="client@enterprise.com"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
              />
              <button
                onClick={handleSendTestEmail}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Send className="h-3 w-3" />
                <span>Send Alert</span>
              </button>
            </div>

            {/* Email Logs */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {emailLogs.length === 0 ? (
                <p className="text-slate-500 italic py-2">No email notifications sent yet.</p>
              ) : (
                emailLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="text-indigo-300 font-bold block">{log.subject}</span>
                      <span className="text-slate-500 text-[10px]">To: {log.to} · {log.timestamp.substring(11, 19)}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {log.status === 'sent' ? '✓ DELIVERED' : '✓ SIMULATED'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

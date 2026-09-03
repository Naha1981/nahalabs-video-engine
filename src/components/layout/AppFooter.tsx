import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Server, Terminal, Code2, ExternalLink } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">NAHALABS VIDEO ENGINE</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">v3.0 Production</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-slate-400">
            OpenMontage Production Orchestrator + NahaLabs Commercial Brain
          </span>
        </div>

        <div className="flex items-center flex-wrap justify-center gap-4 text-slate-400">
          <Link href="/system-health" className="flex items-center space-x-1 hover:text-indigo-400 transition-colors">
            <Server className="h-3.5 w-3.5" />
            <span>Infrastructure Health</span>
          </Link>
          <Link href="/integrations" className="flex items-center space-x-1 hover:text-indigo-400 transition-colors">
            <Terminal className="h-3.5 w-3.5" />
            <span>MCP Gateway</span>
          </Link>
          <Link href="/api/health" target="_blank" className="flex items-center space-x-1 hover:text-indigo-400 transition-colors">
            <Code2 className="h-3.5 w-3.5" />
            <span>/api/health</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
          <div className="flex items-center text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            <span>Fail-Closed Governance</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

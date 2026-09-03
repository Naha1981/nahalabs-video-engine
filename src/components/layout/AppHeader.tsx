'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Film, 
  Brain, 
  Compass, 
  Layers, 
  CheckCircle2, 
  CreditCard, 
  Activity, 
  Server, 
  Boxes, 
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  ShieldCheck,
  Zap
} from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();
  const [selectedTenant, setSelectedTenant] = useState('NahaLabs Enterprise');
  const [isDark, setIsDark] = useState(true);
  const [healthStatus, setHealthStatus] = useState<'online' | 'degraded'>('online');

  useEffect(() => {
    // Check system health on load
    fetch('/api/health')
      .then(res => res.ok ? setHealthStatus('online') : setHealthStatus('degraded'))
      .catch(() => setHealthStatus('degraded'));
  }, []);

  const navItems = [
    { href: '/', label: 'Overview', icon: Sparkles },
    { href: '/studio', label: 'Studio Editor', icon: Film },
    { href: '/brand-brain', label: 'Brand Brain', icon: Brain },
    { href: '/industry-intel', label: 'Industry Intel', icon: Compass },
    { href: '/pipelines', label: 'Pipelines', icon: Layers },
    { href: '/approvals', label: 'Approvals', icon: CheckCircle2 },
    { href: '/telemetry', label: 'Intent & ROI', icon: Activity },
    { href: '/billing', label: 'Billing & Cost', icon: CreditCard },
    { href: '/system-health', label: 'System Health', icon: Server },
    { href: '/integrations', label: 'MCP & Webhooks', icon: Boxes },
  ];

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Film className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">NAHALABS</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  VIDEO ENGINE
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <span>OpenMontage Orchestrator</span>
                <span>•</span>
                <span className="flex items-center text-emerald-400">
                  <ShieldCheck className="h-3 w-3 mr-0.5" /> 10/10 Governance
                </span>
              </div>
            </div>
          </Link>

          {/* Tenant Switcher */}
          <div className="hidden xl:flex items-center pl-4 border-l border-slate-800">
            <div className="relative">
              <select 
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="NahaLabs Enterprise">🏢 NahaLabs Global (HQ)</option>
                <option value="CargoIQ Logistics">🚢 CargoIQ Freight OS</option>
                <option value="Flavourly Dining">🍷 Flavourly VIP Dining</option>
                <option value="Spaza Growth Co">🏪 Dukaan360 Retail</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls & Health Status */}
        <div className="flex items-center space-x-3">
          {/* Health Pulse */}
          <Link 
            href="/system-health"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <span className={`h-2 w-2 rounded-full ${healthStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-mono text-slate-300">
              {healthStatus === 'online' ? '99.98% Uptime' : 'Degraded'}
            </span>
          </Link>

          {/* Quick Create Button */}
          <Link
            href="/studio"
            className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Launch Studio</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-800" />}
          </button>
        </div>
      </div>
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Check, 
  Receipt, 
  HelpCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { PLAN_TIERS } from '@/lib/engine/cost-governor';
import { INITIAL_USAGE_LEDGER } from '@/lib/store/video-store';

export default function BillingPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('growth');
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');

  const usageMinutes = 34.2;
  const quotaMinutes = 150;
  const usagePercent = Math.round((usageMinutes / quotaMinutes) * 100);

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cost Governance, Usage Meter & Billing
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic per-second render accounting, token meter, and transparent agency benchmark savings.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setCurrency('ZAR')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currency === 'ZAR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇿🇦 ZAR (PayFast)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currency === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            💵 USD (Stripe)
          </button>
        </div>
      </div>

      {/* Hero Usage Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Monthly Video Quota</span>
            <span className="text-indigo-400 font-mono font-bold">{usageMinutes} / {quotaMinutes} min</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
            <div 
              style={{ width: `${usagePercent}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>{usagePercent}% utilized</span>
            <span>{quotaMinutes - usageMinutes} min remaining</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1.5">
          <span className="text-xs text-slate-400 font-medium">Current Cycle Spend</span>
          <div className="text-2xl font-black text-white font-mono">
            {currency === 'ZAR' ? 'R4,900 ZAR' : '$299 USD'}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1" /> Growth Tier · Priority Render Active
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1.5">
          <span className="text-xs text-slate-400 font-medium">Agency Production Savings</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            98.6% Lower Cost
          </div>
          <span className="text-[11px] text-slate-400">
            Saved ~$14,200 vs traditional video agencies this month
          </span>
        </div>

      </div>

      {/* Subscription Tiers */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span>Production Subscription Tiers</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLAN_TIERS.map((tier) => {
            const isSelected = selectedPlanId === tier.id;
            const price = currency === 'ZAR' ? `R${tier.monthlyPriceZar.toLocaleString()}` : `$${tier.monthlyPriceUsd}`;
            
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedPlanId(tier.id)}
                className={`p-6 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/70 to-slate-900 border-indigo-500 shadow-2xl shadow-indigo-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      {tier.name}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        CURRENT PLAN
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline space-x-1 mb-4">
                    <span className="text-3xl font-black text-white">{price}</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{tier.includedMinutes} video render minutes / mo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{tier.resolution} resolution output</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{tier.brandBrainsLimit} Brand Brain voice profiles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Universal MCP Gateway & Webhooks</span>
                    </div>
                    {tier.whitelabel && (
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="text-cyan-300 font-medium">Whitelabel client portals</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className={`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Active Plan' : 'Switch Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Production Usage Ledger Table */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Itemized Production Cost Ledger
            </h3>
          </div>
          <span className="text-xs text-slate-400">Deterministic billing history</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Campaign Asset</th>
                <th className="pb-3 font-semibold">Render Time</th>
                <th className="pb-3 font-semibold">LLM Tokens</th>
                <th className="pb-3 font-semibold">Synthesis Engine</th>
                <th className="pb-3 font-semibold">Cost (USD)</th>
                <th className="pb-3 font-semibold">Cost (ZAR)</th>
                <th className="pb-3 font-semibold">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {INITIAL_USAGE_LEDGER.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/30">
                  <td className="py-3 font-sans font-bold text-slate-200">{entry.projectTitle}</td>
                  <td className="py-3 text-slate-300">{entry.renderSeconds}s</td>
                  <td className="py-3 text-slate-400">{entry.tokensUsed.toLocaleString()}</td>
                  <td className="py-3 font-sans text-slate-300">{entry.provider}</td>
                  <td className="py-3 text-emerald-400 font-bold">${entry.costUsd.toFixed(2)}</td>
                  <td className="py-3 text-slate-300">R{(entry.costUsd * 18.2).toFixed(2)}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                      {entry.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

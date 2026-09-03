'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  Palette, 
  ShieldAlert, 
  Users, 
  FileText, 
  Volume2, 
  CheckCircle, 
  Plus, 
  Trash2,
  Lock,
  Save,
  Check
} from 'lucide-react';
import { BrandBrain } from '@/lib/engine/types';
import { DEFAULT_BRAND_BRAINS } from '@/lib/engine/brand-brain-store';

export default function BrandBrainPage() {
  const [brains, setBrains] = useState<BrandBrain[]>(DEFAULT_BRAND_BRAINS);
  const [selectedBrainId, setSelectedBrainId] = useState<string>(DEFAULT_BRAND_BRAINS[0].id);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeBrain = brains.find(b => b.id === selectedBrainId) || brains[0];

  const handleUpdateActiveBrain = (field: keyof BrandBrain, value: any) => {
    setBrains(prev => prev.map(b => {
      if (b.id === activeBrain.id) {
        return { ...b, [field]: value, updatedAt: new Date().toISOString() };
      }
      return b;
    }));
  };

  const handleSaveBrain = async () => {
    try {
      await fetch('/api/brand-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeBrain)
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProhibitedWord = (word: string) => {
    if (!word) return;
    const currentList = activeBrain.compliance.prohibitedWords || [];
    if (!currentList.includes(word)) {
      handleUpdateActiveBrain('compliance', {
        ...activeBrain.compliance,
        prohibitedWords: [...currentList, word]
      });
    }
  };

  const handleRemoveProhibitedWord = (index: number) => {
    const updated = [...activeBrain.compliance.prohibitedWords];
    updated.splice(index, 1);
    handleUpdateActiveBrain('compliance', {
      ...activeBrain.compliance,
      prohibitedWords: updated
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Brand Brain & Commercial Voice Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governance engine enforcing exact tone of voice, forbidden phrases, compliance boundaries, and visual hex design tokens.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedBrainId}
            onChange={(e) => setSelectedBrainId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {brains.map(b => (
              <option key={b.id} value={b.id}>
                🧠 {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveBrain}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            {savedSuccess ? <Check className="h-4 w-4 text-emerald-300" /> : <Save className="h-4 w-4" />}
            <span>{savedSuccess ? 'Changes Saved ✓' : 'Save Brand Brain'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Studio Configuration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Voice & Persona (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Volume2 className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Voice & Psychological Tone</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Tone Archetype</label>
              <select
                value={activeBrain.voice.tone}
                onChange={(e) => handleUpdateActiveBrain('voice', { ...activeBrain.voice, tone: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="authoritative">Authoritative (Institutional & Sovereign)</option>
                <option value="conversational">Conversational (Warm & Relatable)</option>
                <option value="cinematic">Cinematic (Epic & Narrative-driven)</option>
                <option value="urgent_direct">Urgent Direct (High-Converting Direct Response)</option>
                <option value="empathetic_nurturing">Empathetic Nurturing (Clinical & Healing)</option>
                <option value="witty_challenger">Witty Challenger (Bold Category Disruptor)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Reading Comprehension Level</label>
              <select
                value={activeBrain.voice.readingLevel}
                onChange={(e) => handleUpdateActiveBrain('voice', { ...activeBrain.voice, readingLevel: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="accessible_grade6">Accessible Grade 6 (Mass Consumer High Velocity)</option>
                <option value="business_executive">Business Executive (C-Suite & Enterprise)</option>
                <option value="technical_specialist">Technical Specialist (Engineers & Legal)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Target Speech Pacing</label>
                <span className="text-indigo-400 font-mono font-bold">{activeBrain.voice.pacingWpm} WPM</span>
              </div>
              <input 
                type="range"
                min="120"
                max="190"
                value={activeBrain.voice.pacingWpm}
                onChange={(e) => handleUpdateActiveBrain('voice', { ...activeBrain.voice, pacingWpm: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-950 rounded-lg accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>120 (Dramatic)</span>
                <span>150 (Commercial)</span>
                <span>190 (Fast Rap)</span>
              </div>
            </div>

            {/* Target Personas */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-2 flex items-center">
                <Users className="h-3.5 w-3.5 mr-1 text-cyan-400" />
                Target Audience ICPs
              </span>
              <div className="space-y-2">
                {activeBrain.personas.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                    <span className="font-bold text-slate-200 block">{p.name}</span>
                    <p className="text-slate-400 mt-1"><strong className="text-rose-400">Pain:</strong> {p.painPoint}</p>
                    <p className="text-slate-400 mt-1"><strong className="text-emerald-400">Outcome:</strong> {p.dreamOutcome}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Visual Identity & Design Tokens (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Palette className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Visual Design Tokens</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Color Palette */}
            <div>
              <label className="block text-slate-400 font-medium mb-2">Brand Hex Palette</label>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={activeBrain.visualIdentity.primaryColor}
                    onChange={(e) => handleUpdateActiveBrain('visualIdentity', { ...activeBrain.visualIdentity, primaryColor: e.target.value })}
                    className="h-7 w-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Primary</span>
                    <span className="font-mono text-slate-200 uppercase">{activeBrain.visualIdentity.primaryColor}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={activeBrain.visualIdentity.accentColor}
                    onChange={(e) => handleUpdateActiveBrain('visualIdentity', { ...activeBrain.visualIdentity, accentColor: e.target.value })}
                    className="h-7 w-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Accent</span>
                    <span className="font-mono text-slate-200 uppercase">{activeBrain.visualIdentity.accentColor}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={activeBrain.visualIdentity.backgroundColor}
                    onChange={(e) => handleUpdateActiveBrain('visualIdentity', { ...activeBrain.visualIdentity, backgroundColor: e.target.value })}
                    className="h-7 w-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Background</span>
                    <span className="font-mono text-slate-200 uppercase">{activeBrain.visualIdentity.backgroundColor}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={activeBrain.visualIdentity.textColor}
                    onChange={(e) => handleUpdateActiveBrain('visualIdentity', { ...activeBrain.visualIdentity, textColor: e.target.value })}
                    className="h-7 w-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Typography</span>
                    <span className="font-mono text-slate-200 uppercase">{activeBrain.visualIdentity.textColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Font Family */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Typography Font Family</label>
              <input
                type="text"
                value={activeBrain.visualIdentity.fontFamily}
                onChange={(e) => handleUpdateActiveBrain('visualIdentity', { ...activeBrain.visualIdentity, fontFamily: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
              />
            </div>

            {/* Default Aspect Ratio */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Default Aspect Ratio</label>
              <select
                value={activeBrain.visualIdentity.aspectRatioDefault}
                onChange={(e) => handleUpdateActiveBrain('visualIdentity', { ...activeBrain.visualIdentity, aspectRatioDefault: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
              >
                <option value="16:9">16:9 Widescreen (YouTube / Desktop Ads)</option>
                <option value="9:16">9:16 Vertical (Shorts / Reels / TikTok)</option>
                <option value="1:1">1:1 Square (Instagram / LinkedIn Feed)</option>
              </select>
            </div>

            {/* Live Visual Preview Tile */}
            <div 
              style={{ 
                backgroundColor: activeBrain.visualIdentity.backgroundColor,
                color: activeBrain.visualIdentity.textColor,
                fontFamily: activeBrain.visualIdentity.fontFamily
              }}
              className="p-4 rounded-xl border border-slate-700 shadow-lg mt-4 text-center"
            >
              <span 
                style={{ backgroundColor: activeBrain.visualIdentity.primaryColor }}
                className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-2"
              >
                LIVE COLOR SAMPLE
              </span>
              <p className="text-sm font-bold">
                &quot;The Sovereign Commercial Moat&quot;
              </p>
              <p style={{ color: activeBrain.visualIdentity.accentColor }} className="text-xs mt-1 font-semibold">
                Engineered with NahaLabs AI Standards
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Compliance & Forbidden Words (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Compliance & Blacklists</h3>
          </div>

          <div className="space-y-4 text-xs">
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Any generated script containing prohibited words or unverified claims will fail the OpenMontage pre-compose gate before rendering.
            </p>

            {/* Prohibited Compliance Words */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Blacklisted Compliance Words
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {activeBrain.compliance.prohibitedWords.map((word, idx) => (
                  <span 
                    key={idx}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]"
                  >
                    <span>{word}</span>
                    <button 
                      onClick={() => handleRemoveProhibitedWord(idx)}
                      className="hover:text-rose-100 ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Word Input */}
              <div className="flex space-x-2">
                <input
                  id="new-word-input"
                  type="text"
                  placeholder="e.g. 100% risk free"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProhibitedWord((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-word-input') as HTMLInputElement;
                    if (input && input.value) {
                      handleAddProhibitedWord(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Mandatory Legal Disclaimers */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-semibold mb-1">
                Mandatory Legal Disclaimer
              </label>
              <textarea
                rows={3}
                value={activeBrain.compliance.mandatoryDisclaimers[0] || ''}
                onChange={(e) => handleUpdateActiveBrain('compliance', {
                  ...activeBrain.compliance,
                  mandatoryDisclaimers: [e.target.value]
                })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs leading-relaxed"
                placeholder="Enter regulatory disclaimer..."
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

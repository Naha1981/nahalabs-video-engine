'use client';

import { useEffect, useState } from 'react';

type Palette = 'white-yellow' | 'charcoal-lime' | 'paper-orange' | 'black-white';

const palettes: Record<Palette, { name: string; bg: string; card: string; ink: string; accent: string; muted: string; border: string }> = {
  'white-yellow': { name: 'White & Yellow', bg: '#f4f1e8', card: '#fffdf7', ink: '#191919', accent: '#f5d442', muted: '#77746c', border: '#ded9ca' },
  'charcoal-lime': { name: 'Charcoal & Lime', bg: '#171916', card: '#242720', ink: '#f7f7ef', accent: '#c8f169', muted: '#b0b4a6', border: '#45483e' },
  'paper-orange': { name: 'Paper & Orange', bg: '#f6f0e6', card: '#fffaf2', ink: '#2b211a', accent: '#f08a36', muted: '#81766c', border: '#e0d1bd' },
  'black-white': { name: 'Black & White', bg: '#090909', card: '#191919', ink: '#ffffff', accent: '#ffffff', muted: '#c0c0c0', border: '#414141' },
};

export default function CreatorMotionCardRowLab() {
  const [palette, setPalette] = useState<Palette>('white-yellow');
  const [videoUrl, setVideoUrl] = useState('');
  const [labels, setLabels] = useState(['Less admin', 'Faster response', 'Clear next step']);
  const [replay, setReplay] = useState(0);
  const colors = palettes[palette];

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  function handleVideo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setVideoUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
    setReplay((n) => n + 1);
  }

  function updateLabel(index: number, value: string) {
    setLabels((old) => old.map((label, i) => i === index ? value.slice(0, 32) : label));
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <style jsx>{`
        @keyframes cardIn {
          0% { opacity: 0; transform: translateY(38px) scale(.96); }
          65% { opacity: 1; transform: translateY(-4px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes eyebrowIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .motion-card { opacity: 0; animation: cardIn 650ms cubic-bezier(.2,.8,.2,1) forwards; }
        .motion-card:nth-child(1) { animation-delay: 180ms; }
        .motion-card:nth-child(2) { animation-delay: 340ms; }
        .motion-card:nth-child(3) { animation-delay: 500ms; }
        .motion-eyebrow { animation: eyebrowIn 450ms ease-out 100ms both; }
        @media (prefers-reduced-motion: reduce) {
          .motion-card, .motion-eyebrow { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      <header className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-cyan-400">NahaLabs Video Engine · Motion Lab</div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Presenter Foreground Card Row</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-300">A lightweight, local-preview prototype inspired by CreatorMotion. Upload a presenter clip, change the card copy and palette, then inspect spacing and face clearance. The selected video stays in your browser; it is not uploaded.</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">16:9 composition preview</span>
            <button onClick={() => setReplay((n) => n + 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800">Replay animation ↻</button>
          </div>
          <div key={replay} className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {videoUrl ? (
              <video src={videoUrl} className="absolute inset-0 h-full w-full object-cover" controls muted playsInline />
            ) : (
              <div className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 18%, #55636d 0%, #28343d 34%, #111820 78%)' }}>
                <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute left-1/2 top-[12%] h-[24%] w-[18%] -translate-x-1/2 rounded-[48%] border border-white/10 bg-gradient-to-br from-[#b88e72] to-[#765543] shadow-xl" />
                <div className="absolute left-1/2 top-[32%] h-[51%] w-[40%] -translate-x-1/2 rounded-t-[42%] bg-gradient-to-br from-[#344d5b] to-[#182833] shadow-2xl" />
                <div className="absolute inset-x-0 top-[5%] text-center text-[10px] font-semibold uppercase tracking-[.28em] text-white/65 sm:text-xs">Presenter footage preview placeholder</div>
                <div className="absolute inset-x-0 bottom-[27%] text-center text-xs text-white/55">Upload a real clip to assess face clearance</div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.44))' }} />
            <div className="pointer-events-none absolute inset-x-[5%] bottom-[7%] z-10">
              <div className="motion-eyebrow mb-2 flex items-center justify-center gap-2 text-[clamp(7px,1.05vw,12px)] font-bold uppercase tracking-[.18em]" style={{ color: colors.accent }}>
                <span className="h-px w-5" style={{ background: colors.accent }} />
                THE NahaLabs DIFFERENCE
                <span className="h-px w-5" style={{ background: colors.accent }} />
              </div>
              <div className="grid grid-cols-3 gap-[1.5%]">
                {labels.map((label, index) => (
                  <div key={index} className="motion-card min-w-0 rounded-lg border p-[5%] shadow-xl sm:rounded-xl" style={{ background: colors.card, color: colors.ink, borderColor: colors.border }}>
                    <div className="mb-[8%] flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black sm:h-7 sm:w-7 sm:text-xs" style={{ background: colors.accent, color: palette === 'black-white' ? '#090909' : '#191919' }}>0{index + 1}</div>
                    <div className="break-words text-[clamp(8px,1.45vw,17px)] font-extrabold leading-tight">{label || 'Your key point'}</div>
                    <div className="mt-[8%] h-1 w-8 rounded-full" style={{ background: colors.accent }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs leading-5 text-slate-400">Preview only: this page demonstrates the visual layout and browser animation. It does not export an MP4 or change the source footage. Actual video rendering remains a separate integration step.</p>
        </div>

        <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div>
            <h2 className="mb-3 text-sm font-bold text-white">1. Add your footage</h2>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-950/70 p-4 text-center hover:border-cyan-500">
              <span className="text-2xl">▶</span>
              <span className="text-xs font-semibold text-slate-200">{videoUrl ? 'Choose another clip' : 'Select a local video'}</span>
              <span className="text-[11px] text-slate-500">MP4, WebM or MOV supported by your browser</span>
              <input type="file" accept="video/*" onChange={handleVideo} className="sr-only" />
            </label>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">2. Edit the card copy</h2>
            <div className="space-y-3">
              {labels.map((label, index) => (
                <label key={index} className="block text-xs text-slate-400">
                  Card 0{index + 1}
                  <input value={label} onChange={(event) => updateLabel(index, event.target.value)} maxLength={32} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">3. Choose a palette</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(palettes) as Palette[]).map((key) => (
                <button key={key} onClick={() => setPalette(key)} aria-pressed={palette === key} className={`rounded-lg border p-2 text-left text-xs font-semibold transition ${palette === key ? 'border-cyan-400 ring-1 ring-cyan-400/40' : 'border-slate-700 hover:border-slate-500'}`} style={{ background: palettes[key].bg, color: palettes[key].ink }}>
                  <span className="mb-2 flex gap-1"><i className="h-3 w-3 rounded-full" style={{ background: palettes[key].accent }} /><i className="h-3 w-3 rounded-full" style={{ background: palettes[key].card, border: '1px solid ' + palettes[key].border }} /></span>
                  {palettes[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-100/80">
            <strong className="text-amber-200">QA gate:</strong> check that the cards do not cover the presenter’s face, text remains readable at phone size, and the final card spacing feels balanced.
          </div>
        </aside>
      </section>
    </main>
  );
}

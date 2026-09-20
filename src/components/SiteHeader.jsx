import React, { useMemo, useRef, useState } from 'react';
import { Flame, Clock, Download, Upload, RotateCcw, X, WifiOff } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import useOnlineStatus from '../hooks/useOnlineStatus';

function BigStat({ label, value, tone }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-rig-faint">{label}</span>
      <span className={`text-3xl font-extrabold tabular-nums leading-none mt-0.5 ${tone}`}>{value}h</span>
    </div>
  );
}

function SafetyMenu({ onClose }) {
  const exportBoard = useBoardStore((s) => s.exportBoard);
  const importBoard = useBoardStore((s) => s.importBoard);
  const resetBoard = useBoardStore((s) => s.resetBoard);
  const clearAllTasks = useBoardStore((s) => s.clearAllTasks);
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleExport = () => {
    const json = exportBoard();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `burndown-board-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importBoard(text);
      setError('');
      onClose();
    } catch (err) {
      setError('Could not read that file — is it a board export?');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="absolute right-3 top-full mt-2 w-72 rounded-xl bg-rig-raised border border-rig-border shadow-cardLift z-50 p-2">
      <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b border-rig-border">
        <p className="text-sm font-bold text-rig-text">Board safety actions</p>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="min-h-touch min-w-touch flex items-center justify-center text-rig-faint active:text-rig-text"
        >
          <X size={18} />
        </button>
      </div>

      <p className="text-[11px] text-rig-faint px-1 pb-2 leading-relaxed">
        iOS can clear offline app data after ~7 days unused. Export the board before a long weekend, or if you
        share a device.
      </p>

      <button
        onClick={handleExport}
        className="w-full min-h-touch flex items-center gap-2 rounded-lg px-2 text-sm font-medium text-rig-text active:bg-rig-borderLight"
      >
        <Download size={17} className="text-signal-green" /> Export board (.json)
      </button>

      <button
        onClick={handleImportClick}
        className="w-full min-h-touch flex items-center gap-2 rounded-lg px-2 text-sm font-medium text-rig-text active:bg-rig-borderLight"
      >
        <Upload size={17} className="text-signal-amber" /> Import board file
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />

      <button
        onClick={() => {
          if (window.confirm('Clear all task assignments and burned hours? Tasks and technicians stay, just unassigned.')) {
            clearAllTasks();
            onClose();
          }
        }}
        className="w-full min-h-touch flex items-center gap-2 rounded-lg px-2 text-sm font-medium text-rig-text active:bg-rig-borderLight"
      >
        <RotateCcw size={17} className="text-signal-yellow" /> Clear today's assignments
      </button>

      <button
        onClick={() => {
          if (window.confirm('Reset the entire board to the default demo state? This cannot be undone.')) {
            resetBoard();
            onClose();
          }
        }}
        className="w-full min-h-touch flex items-center gap-2 rounded-lg px-2 text-sm font-medium text-signal-red active:bg-signal-redDim"
      >
        <RotateCcw size={17} /> Factory reset board
      </button>

      {error && <p className="text-xs text-signal-red px-1 pt-2">{error}</p>}
    </div>
  );
}

export default function SiteHeader() {
  // Same rule as the lanes: subscribe to the raw tasks array, not the
  // `siteTotals` helper reference, so the header updates live as hours are
  // logged or tasks are dragged around.
  const tasks = useBoardStore((s) => s.tasks);
  const siteDate = useBoardStore((s) => s.siteDate);
  const { planned, burned } = useMemo(
    () =>
      tasks.reduce(
        (acc, t) => {
          acc.planned += t.estHours;
          acc.burned += t.actualHours;
          return acc;
        },
        { planned: 0, burned: 0 }
      ),
    [tasks]
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const pct = planned > 0 ? Math.min(100, (burned / planned) * 100) : 0;
  const remaining = Math.max(0, planned - burned);
  const isOverSite = burned > planned && planned > 0;

  const dateLabel = new Date(siteDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="relative border-b border-rig-border bg-rig-bg px-4 pt-3 pb-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-rig-text tracking-tight">Daily Burn-Down</h1>
            <span className="text-rig-faint text-sm">· {dateLabel}</span>
            {!isOnline && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-signal-yellow bg-signal-yellowDim rounded-full px-2 py-0.5">
                <WifiOff size={11} /> Offline
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 mt-2">
            <BigStat label="Planned" value={planned} tone="text-rig-text" />
            <BigStat label="Burned" value={burned} tone={isOverSite ? 'text-signal-red' : 'text-signal-amber'} />
            <BigStat label="Remaining" value={remaining} tone="text-signal-green" />
          </div>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="min-h-touch px-3 rounded-lg bg-rig-raised border border-rig-border text-rig-muted text-xs font-semibold active:border-signal-amber active:text-signal-amber shrink-0"
        >
          Board options
        </button>
      </div>

      <div className="mt-3">
        <div className="h-4 w-full rounded-full bg-rig-surface overflow-hidden shadow-lane">
          <div
            className={`h-full rounded-full flex items-center justify-end transition-all duration-300 ${
              isOverSite ? 'bg-signal-red' : 'bg-signal-amber'
            }`}
            style={{ width: `${Math.max(pct, burned > 0 ? 4 : 0)}%` }}
          >
            <Flame size={11} className="text-rig-bg mr-1" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1 text-[11px] text-rig-faint">
          <span className="flex items-center gap-1">
            <Clock size={11} /> {pct.toFixed(0)}% of planned hours burned site-wide
          </span>
          {isOverSite && <span className="font-bold text-signal-red">Site is over planned hours</span>}
        </div>
      </div>

      {menuOpen && <SafetyMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

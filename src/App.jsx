import React from 'react';
import { useBoardStore } from './store/useBoardStore';
import SiteHeader from './components/SiteHeader';
import Board from './components/Board';

export default function App() {
  const hydrated = useBoardStore((s) => s.hydrated);

  // Brief, deliberate loading state while idb-keyval reads the persisted
  // board back out of IndexedDB. Avoids a flash of the (possibly stale)
  // in-memory seed data before real data lands.
  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-rig-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-rig-border border-t-signal-amber animate-spin" />
          <p className="text-rig-faint text-sm font-medium">Loading today's board…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-rig-bg overflow-hidden">
      <SiteHeader />
      <Board />
    </div>
  );
}

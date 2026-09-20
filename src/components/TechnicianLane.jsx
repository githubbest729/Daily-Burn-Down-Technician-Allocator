import React, { useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { AlertCircle, Flame, Minus, Plus, User } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import TaskCard from './TaskCard';

function CapacityBar({ scheduled, capacity, burned }) {
  const pct = capacity > 0 ? Math.min(100, (scheduled / capacity) * 100) : 0;
  const overflowPct = capacity > 0 ? Math.max(0, Math.min(100, ((scheduled - capacity) / capacity) * 100)) : 0;
  const isOver = scheduled > capacity;
  const burnPct = scheduled > 0 ? Math.min(100, (burned / scheduled) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span
          className={`text-sm font-bold tabular-nums ${
            isOver ? 'text-signal-red' : 'text-rig-text'
          }`}
        >
          {scheduled}
          <span className="text-rig-faint font-medium"> / {capacity}h scheduled</span>
        </span>
        {isOver && (
          <span className="flex items-center gap-1 text-signal-red text-xs font-bold">
            <AlertCircle size={13} strokeWidth={2.5} />
            OVER
          </span>
        )}
      </div>

      <div className="h-3 w-full rounded-full bg-rig-surface overflow-hidden shadow-lane relative">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            isOver ? 'bg-signal-red' : pct > 85 ? 'bg-signal-yellow' : 'bg-signal-green'
          }`}
          style={{ width: `${isOver ? 100 : pct}%` }}
        />
        {isOver && (
          <div
            className="absolute inset-y-0 right-0 bg-signal-red animate-pulse"
            style={{ width: `${Math.max(6, overflowPct)}%` }}
          />
        )}
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rig-faint">
        <Flame size={12} className="text-signal-amber" />
        <span className="tabular-nums">{burned}h burned</span>
        <div className="flex-1 h-1 rounded-full bg-rig-surface overflow-hidden">
          <div className="h-full bg-signal-amber" style={{ width: `${burnPct}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function TechnicianLane({ technician }) {
  // Subscribe to the raw tasks array (not a helper method reference) so this
  // lane actually re-renders when a task moves in/out of it or its hours
  // change — selecting a stable function reference like `s.tasksFor` would
  // not trigger a re-render on state changes.
  const tasks = useBoardStore((s) => s.tasks);
  const setCapacity = useBoardStore((s) => s.setCapacity);
  const removeTechnician = useBoardStore((s) => s.removeTechnician);

  const laneTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.technicianId === technician.id)
        .sort((a, b) => a.order - b.order),
    [tasks, technician.id]
  );
  const scheduled = useMemo(() => laneTasks.reduce((sum, t) => sum + t.estHours, 0), [laneTasks]);
  const burned = useMemo(() => laneTasks.reduce((sum, t) => sum + t.actualHours, 0), [laneTasks]);
  const isOver = scheduled > technician.capacityHours;

  return (
    <div
      className={`flex flex-col w-[300px] shrink-0 rounded-xl bg-rig-surface border ${
        isOver ? 'border-signal-red/60' : 'border-rig-border'
      } overflow-hidden`}
    >
      <div className="px-3 pt-3 pb-2 border-b border-rig-border bg-rig-raised/40">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-h-touch min-w-touch flex items-center justify-center rounded-full bg-rig-raised text-rig-muted shrink-0">
              <User size={18} />
            </div>
            <p className="font-bold text-rig-text truncate">{technician.name}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              aria-label="Decrease capacity"
              onClick={() => setCapacity(technician.id, technician.capacityHours - 1)}
              className="min-h-touch min-w-touch flex items-center justify-center rounded-md bg-rig-raised text-rig-muted active:bg-rig-borderLight"
            >
              <Minus size={16} strokeWidth={3} />
            </button>
            <span className="text-xs text-rig-faint w-10 text-center tabular-nums">
              {technician.capacityHours}h cap
            </span>
            <button
              aria-label="Increase capacity"
              onClick={() => setCapacity(technician.id, technician.capacityHours + 1)}
              className="min-h-touch min-w-touch flex items-center justify-center rounded-md bg-rig-raised text-rig-muted active:bg-rig-borderLight"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        <CapacityBar scheduled={scheduled} capacity={technician.capacityHours} burned={burned} />
      </div>

      <Droppable droppableId={technician.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[160px] p-2 space-y-2 overflow-y-auto transition-colors ${
              snapshot.isDraggingOver ? 'bg-signal-amberDim/20' : ''
            }`}
          >
            {laneTasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-center text-xs text-rig-faint py-6">Drop tasks here</p>
            )}
            {laneTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <button
        onClick={() => {
          if (window.confirm(`Remove ${technician.name} from today's board? Their tasks return to Unassigned.`)) {
            removeTechnician(technician.id);
          }
        }}
        className="min-h-touch text-[11px] font-medium text-rig-faint border-t border-rig-border active:text-signal-red active:bg-signal-redDim"
      >
        Remove technician
      </button>
    </div>
  );
}

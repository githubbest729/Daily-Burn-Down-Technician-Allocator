import React, { useMemo, useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Inbox, Plus } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import TaskCard from './TaskCard';

export default function UnassignedPool() {
  // Subscribe to the raw tasks array so this pool re-renders whenever a task
  // is added, removed, or dragged in/out — see TechnicianLane.jsx for why a
  // helper-method selector like `s.tasksFor` would silently go stale.
  const allTasks = useBoardStore((s) => s.tasks);
  const addTask = useBoardStore((s) => s.addTask);
  const tasks = useMemo(
    () => allTasks.filter((t) => t.technicianId === null).sort((a, b) => a.order - b.order),
    [allTasks]
  );
  const [draft, setDraft] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    addTask(title);
    setDraft('');
  };

  return (
    <div className="flex flex-col w-[300px] shrink-0 rounded-xl bg-rig-surface border border-rig-borderLight border-dashed overflow-hidden">
      <div className="px-3 pt-3 pb-2 border-b border-rig-border bg-rig-raised/40">
        <div className="flex items-center gap-2">
          <div className="min-h-touch min-w-touch flex items-center justify-center rounded-full bg-rig-raised text-signal-amber shrink-0">
            <Inbox size={18} />
          </div>
          <div>
            <p className="font-bold text-rig-text">Unassigned</p>
            <p className="text-[11px] text-rig-faint">{tasks.length} task{tasks.length === 1 ? '' : 's'} waiting</p>
          </div>
        </div>
      </div>

      <Droppable droppableId="unassigned">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[160px] p-2 space-y-2 overflow-y-auto transition-colors ${
              snapshot.isDraggingOver ? 'bg-signal-amberDim/20' : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-center text-xs text-rig-faint py-6">All tasks assigned</p>
            )}
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <form onSubmit={submit} className="p-2 border-t border-rig-border flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New task…"
          className="flex-1 min-h-touch rounded-md bg-rig-raised border border-rig-border px-2.5 text-sm text-rig-text placeholder:text-rig-faint focus:outline-none focus:border-signal-amber"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="min-h-touch min-w-touch flex items-center justify-center rounded-md bg-signal-amber text-rig-bg active:bg-signal-amber/80"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
}

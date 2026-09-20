import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { UserPlus } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import UnassignedPool from './UnassignedPool';
import TechnicianLane from './TechnicianLane';

/**
 * Primary drag-and-drop wrapper.
 *
 * @hello-pangea/dnd resolves collisions/droppable targets for us — we only
 * need to react to the final onDragEnd result and translate it into a store
 * mutation. Columns are either 'unassigned' or a technician's id, which is
 * exactly the shape useBoardStore.moveTask expects.
 */
export default function Board() {
  const technicians = useBoardStore((s) => s.technicians);
  const moveTask = useBoardStore((s) => s.moveTask);
  const addTechnician = useBoardStore((s) => s.addTechnician);
  const [addingTech, setAddingTech] = useState(false);
  const [techName, setTechName] = useState('');

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return; // dropped outside any column
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    moveTask(draggableId, destination.droppableId, destination.index);
  };

  const submitTech = (e) => {
    e.preventDefault();
    const name = techName.trim();
    if (!name) return;
    addTechnician(name);
    setTechName('');
    setAddingTech(false);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-3 min-w-max">
          <UnassignedPool />

          {technicians.map((tech) => (
            <TechnicianLane key={tech.id} technician={tech} />
          ))}

          <div className="w-[220px] shrink-0">
            {addingTech ? (
              <form
                onSubmit={submitTech}
                className="rounded-xl bg-rig-surface border border-rig-border p-3 space-y-2"
              >
                <input
                  autoFocus
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="Technician name"
                  className="w-full min-h-touch rounded-md bg-rig-raised border border-rig-border px-2.5 text-sm text-rig-text placeholder:text-rig-faint focus:outline-none focus:border-signal-amber"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 min-h-touch rounded-md bg-signal-amber text-rig-bg font-semibold text-sm active:bg-signal-amber/80"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingTech(false)}
                    className="flex-1 min-h-touch rounded-md bg-rig-raised text-rig-muted font-semibold text-sm active:bg-rig-borderLight"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingTech(true)}
                className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-rig-border text-rig-faint flex flex-col items-center justify-center gap-2 active:border-signal-amber active:text-signal-amber"
              >
                <UserPlus size={22} />
                <span className="text-sm font-semibold">Add technician</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

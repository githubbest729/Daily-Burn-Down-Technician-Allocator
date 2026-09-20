import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Minus, Plus, Check, Trash2 } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';

/**
 * Large, thumb-friendly stepper button. Every tap target here is >=44x44pt
 * per Apple HIG, since this is operated standing up, on glass, often with
 * gloves on.
 */
function StepperButton({ onClick, children, variant = 'neutral', label }) {
  const variantClasses =
    variant === 'danger'
      ? 'bg-signal-redDim text-signal-red active:bg-signal-red active:text-rig-bg'
      : variant === 'accent'
      ? 'bg-signal-amberDim text-signal-amber active:bg-signal-amber active:text-rig-bg'
      : 'bg-rig-raised text-rig-muted active:bg-rig-borderLight active:text-rig-text';

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`min-h-touch min-w-touch flex items-center justify-center rounded-md ${variantClasses} transition-colors duration-75`}
    >
      {children}
    </button>
  );
}

function HourStepper({ label, value, onDec, onInc, tone }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-rig-faint w-14 shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <StepperButton onClick={onDec} label={`Decrease ${label}`}>
          <Minus size={18} strokeWidth={3} />
        </StepperButton>
        <span className={`min-w-[3ch] text-center font-semibold tabular-nums text-lg ${tone}`}>{value}</span>
        <StepperButton onClick={onInc} label={`Increase ${label}`} variant="accent">
          <Plus size={18} strokeWidth={3} />
        </StepperButton>
      </div>
    </div>
  );
}

export default function TaskCard({ task, index }) {
  const setEstHours = useBoardStore((s) => s.setEstHours);
  const setActualHours = useBoardStore((s) => s.setActualHours);
  const toggleDone = useBoardStore((s) => s.toggleDone);
  const removeTask = useBoardStore((s) => s.removeTask);

  const overBurned = task.actualHours > task.estHours && task.estHours > 0;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-lg bg-rig-raised border ${
            task.done ? 'border-signal-green/50' : 'border-rig-border'
          } shadow-card select-none ${snapshot.isDragging ? 'shadow-cardLift rotate-1' : ''}`}
        >
          <div className="flex items-start gap-1 px-2.5 pt-2.5">
            <button
              {...provided.dragHandleProps}
              aria-label="Drag to reassign"
              className="min-h-touch min-w-touch flex items-center justify-center text-rig-faint active:text-signal-amber -ml-1.5 -mt-1.5 touch-none"
            >
              <GripVertical size={20} />
            </button>

            <div className="flex-1 min-w-0 pt-2">
              <p
                className={`font-semibold leading-snug break-words ${
                  task.done ? 'text-rig-muted line-through' : 'text-rig-text'
                }`}
              >
                {task.title}
              </p>
            </div>

            <button
              onClick={() => toggleDone(task.id)}
              aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
              className={`min-h-touch min-w-touch flex items-center justify-center rounded-md mt-0.5 ${
                task.done
                  ? 'bg-signal-green text-rig-bg'
                  : 'bg-rig-surface text-rig-faint border border-rig-border active:border-signal-green active:text-signal-green'
              }`}
            >
              <Check size={18} strokeWidth={3} />
            </button>
          </div>

          <div className="px-2.5 pb-2.5 pt-2 space-y-1.5">
            <HourStepper
              label="Est"
              value={task.estHours}
              tone="text-rig-text"
              onDec={() => setEstHours(task.id, -0.5)}
              onInc={() => setEstHours(task.id, 0.5)}
            />
            <HourStepper
              label="Burned"
              value={task.actualHours}
              tone={overBurned ? 'text-signal-red' : 'text-signal-amber'}
              onDec={() => setActualHours(task.id, -0.5)}
              onInc={() => setActualHours(task.id, 0.5)}
            />
          </div>

          {overBurned && (
            <div className="mx-2.5 mb-2.5 rounded-md bg-signal-redDim px-2 py-1 text-[11px] font-semibold text-signal-red">
              Over estimate by {(task.actualHours - task.estHours).toFixed(2).replace(/\.?0+$/, '')}h
            </div>
          )}

          <button
            onClick={() => removeTask(task.id)}
            aria-label="Delete task"
            className="w-full flex items-center justify-center gap-1.5 min-h-touch text-rig-faint border-t border-rig-border active:text-signal-red active:bg-signal-redDim rounded-b-lg text-xs font-medium"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
    </Draggable>
  );
}

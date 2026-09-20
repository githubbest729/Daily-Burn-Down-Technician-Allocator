import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const idbStorage = createJSONStorage(() => ({
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: async (name, value) => idbSet(name, value),
  removeItem: async (name) => idbDel(name)
}));

const seedTechnicians = () => [
  { id: uid('tech'), name: 'M. Alvarez', capacityHours: 8 },
  { id: uid('tech'), name: 'D. Whitfield', capacityHours: 8 },
  { id: uid('tech'), name: 'R. Okafor', capacityHours: 8 }
];

const seedTasks = () => [
  { id: uid('task'), title: 'Network Cabinet A', estHours: 3, actualHours: 0, technicianId: null, order: 0, done: false },
  { id: uid('task'), title: 'Drive Tuning — Line 2', estHours: 4, actualHours: 0, technicianId: null, order: 1, done: false },
  { id: uid('task'), title: 'PLC Firmware Check', estHours: 2, actualHours: 0, technicianId: null, order: 2, done: false },
  { id: uid('task'), title: 'Conveyor Belt Inspection', estHours: 2.5, actualHours: 0, technicianId: null, order: 3, done: false }
];

const initialTechnicians = seedTechnicians();

export const useBoardStore = create(
  persist(
    (set, get) => ({
      technicians: initialTechnicians,
      tasks: seedTasks(),
      siteDate: new Date().toISOString().slice(0, 10),
      hydrated: false,

      tasksFor: (columnId) =>
        get()
          .tasks.filter((t) => (columnId === 'unassigned' ? t.technicianId === null : t.technicianId === columnId))
          .sort((a, b) => a.order - b.order),

      plannedHoursFor: (technicianId) =>
        get()
          .tasks.filter((t) => t.technicianId === technicianId)
          .reduce((sum, t) => sum + t.estHours, 0),

      burnedHoursFor: (technicianId) =>
        get()
          .tasks.filter((t) => t.technicianId === technicianId)
          .reduce((sum, t) => sum + t.actualHours, 0),

      siteTotals: () => {
        const { tasks } = get();
        return tasks.reduce(
          (acc, t) => {
            acc.planned += t.estHours;
            acc.burned += t.actualHours;
            return acc;
          },
          { planned: 0, burned: 0 }
        );
      },

      moveTask: (taskId, toColumnId, toIndex) => {
        const toTechnicianId = toColumnId === 'unassigned' ? null : toColumnId;
        set((state) => {
          const moving = state.tasks.find((t) => t.id === taskId);
          if (!moving) return state;

          const withoutMoving = state.tasks.filter((t) => t.id !== taskId);
          const destColumn = withoutMoving
            .filter((t) => t.technicianId === toTechnicianId)
            .sort((a, b) => a.order - b.order);

          destColumn.splice(toIndex, 0, { ...moving, technicianId: toTechnicianId });

          const reindexedDest = destColumn.map((t, i) => ({ ...t, order: i }));
          const others = withoutMoving.filter((t) => t.technicianId !== toTechnicianId);

          return { tasks: [...others, ...reindexedDest] };
        });
      },

      addTask: (title, estHours = 1) =>
        set((state) => {
          const order = state.tasks.filter((t) => t.technicianId === null).length;
          return {
            tasks: [
              ...state.tasks,
              { id: uid('task'), title, estHours, actualHours: 0, technicianId: null, order, done: false }
            ]
          };
        }),

      removeTask: (taskId) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),

      setEstHours: (taskId, delta) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, estHours: Math.max(0, roundQuarter(t.estHours + delta)) } : t
          )
        })),

      setActualHours: (taskId, delta) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, actualHours: Math.max(0, roundQuarter(t.actualHours + delta)) } : t
          )
        })),

      toggleDone: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
        })),

      addTechnician: (name, capacityHours = 8) =>
        set((state) => ({
          technicians: [...state.technicians, { id: uid('tech'), name, capacityHours }]
        })),

      removeTechnician: (technicianId) =>
        set((state) => ({
          technicians: state.technicians.filter((t) => t.id !== technicianId),
          tasks: state.tasks.map((t) => (t.technicianId === technicianId ? { ...t, technicianId: null } : t))
        })),

      setCapacity: (technicianId, capacityHours) =>
        set((state) => ({
          technicians: state.technicians.map((t) =>
            t.id === technicianId ? { ...t, capacityHours: Math.max(0, capacityHours) } : t
          )
        })),

      exportBoard: () => {
        const { technicians, tasks, siteDate } = get();
        return JSON.stringify({ technicians, tasks, siteDate, exportedAt: new Date().toISOString() }, null, 2);
      },

      importBoard: (json) => {
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        if (!parsed || !Array.isArray(parsed.technicians) || !Array.isArray(parsed.tasks)) {
          throw new Error('Invalid board file');
        }
        set({
          technicians: parsed.technicians,
          tasks: parsed.tasks,
          siteDate: parsed.siteDate || new Date().toISOString().slice(0, 10)
        });
      },

      resetBoard: () => {
        const fresh = seedTechnicians();
        set({ technicians: fresh, tasks: seedTasks(), siteDate: new Date().toISOString().slice(0, 10) });
      },

      clearAllTasks: () =>
        set((state) => ({
          tasks: state.tasks.map((t) => ({ ...t, technicianId: null, actualHours: 0, done: false }))
        }))
    }),
    {
      name: 'daily-burndown-board',
      storage: idbStorage,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Board rehydration failed, starting from defaults:', error);
        }
        useBoardStore.setState({ hydrated: true });
      }
    }
  )
);

function roundQuarter(n) {
  return Math.round(n * 4) / 4;
}

import { create } from 'zustand'
import type { TaskBase } from "@/types/task.ts";

type QueueEntry = TaskBase & { _uid: number }

let _nextUid = 0

type State = {
  queue: QueueEntry[]
  appendTask: (task: TaskBase) => void
  removeTask: (uid: number) => void
  clearTaskList: () => void
  updateTaskValues: (uid: number, values: Record<string, unknown>) => void
  loadConfig: (payload: Record<string, unknown>) => void
}

export const useUserStore = create<State>((set) => ({
  queue: [],
  appendTask: (task) => {
    const uid = _nextUid++
    set((state) => ({
      queue: [...state.queue, { id: task.id, name: task.name, version: task.version, values: { ...task.values }, _uid: uid }]
    }))
  },
  removeTask: (uid: number) =>
    set((state) => ({
      queue: state.queue.filter((t) => t._uid !== uid)
    })),
  clearTaskList: () =>
    set(() => ({
      queue: []
    })),
  updateTaskValues: (uid: number, values: Record<string, unknown>) =>
    set((state) => ({
      queue: state.queue.map((t) =>
        t._uid === uid ? { ...t, values } : t
      )
    })),
  loadConfig: (payload: Record<string, unknown>) => {
    set((state) => {
      const keys = Object.keys(state) as (keyof State)[]
      const next: Partial<State> = {}
      for (const key of keys) {
        if (typeof state[key] === "function") continue
        if (!(key in payload)) continue
        if (key === "queue") {
          const raw = Array.isArray(payload.queue) ? payload.queue : (Array.isArray((payload as any).taskList) ? (payload as any).taskList : [])
          next.queue = raw.map((t: Record<string, unknown>) => ({
            id: t.id as string,
            name: t.name as string,
            version: t.version as string,
            values: (t.values ?? {}) as Record<string, unknown>,
            _uid: _nextUid++,
          }))
        } else {
          ;(next as any)[key] = payload[key as string]
        }
      }
      return next
    })
  },
}))

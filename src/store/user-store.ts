import { create } from 'zustand'
import type { Task } from "@/types/task.ts";

type TaskEntry = Omit<Task, "layout"> & { _uid: number }

let _nextUid = 0

type State = {
  taskList: TaskEntry[]
  appendTask: (task: Omit<Task, "layout">) => void
  removeTask: (uid: number) => void
  clearTaskList: () => void
  updateTaskValues: (uid: number, values: Record<string, unknown>) => void
  loadConfig: (payload: Record<string, unknown>) => void
}

export const useUserStore = create<State>((set) => ({
  taskList: [],
  appendTask: (task: Omit<Task, "layout">) => {
    const uid = _nextUid++
    set((state) => ({
      taskList: [...state.taskList, { ...task, _uid: uid }]
    }))
  },
  removeTask: (uid: number) =>
    set((state) => ({
      taskList: state.taskList.filter((t) => t._uid !== uid)
    })),
  clearTaskList: () =>
    set(() => ({
      taskList: []
    })),
  updateTaskValues: (uid: number, values: Record<string, unknown>) =>
    set((state) => ({
      taskList: state.taskList.map((t) =>
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
        if (key === "taskList") {
          next.taskList = Array.isArray(payload.taskList)
            ? (payload.taskList as Task[]).map((t) => ({ ...t, _uid: _nextUid++ }))
            : []
        } else {
          ;(next as any)[key] = payload[key as string]
        }
      }
      return next
    })
  },
}))

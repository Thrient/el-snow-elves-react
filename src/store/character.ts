import { create } from 'zustand'
import { useSettingsStore } from '@/store/settings-store'
import type { TaskBase } from '@/types/task'

export type ExecuteItem = TaskBase

type ExecuteEntry = ExecuteItem & { _uid: number }

let _executeUidCounter = 0

type Character = {
  character: string
  hwnd: string
  running: boolean
  opacity: number
  currentTask: string | null
  executeList: ExecuteEntry[]
}

type State = {
  characters: Character[]
  selectedHwnd: string | null
  add: (data: Omit<Character, 'executeList'> & { executeList: ExecuteItem[] }) => void
  remove: (hwnd: string) => void
  update: (data: Partial<Character> & { hwnd: string }) => void
  popExecute: (hwnd: string) => ExecuteItem | undefined
  setSelectedHwnd: (hwnd: string | null) => void
  pushExecute: (hwnd: string, item: ExecuteItem) => void
  removeExecute: (hwnd: string, uid: number) => void
  clearExecute: (hwnd: string) => void
  updateExecuteValues: (hwnd: string, uid: number, values: Record<string, unknown>) => void
  reorderExecute: (hwnd: string, orderedUids: number[]) => void
}

export const useCharacterStore = create<State>((set, get) => ({
  characters: [],
  selectedHwnd: null,
  add: (data) =>
    set((state) => ({
      characters: [
        ...state.characters,
        {
          ...data,
          executeList: data.executeList.map((item) => ({
            ...item,
            _uid: _executeUidCounter++,
          })),
        },
      ],
    })),
  update: (data: Partial<Character> & { hwnd: string }) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        character.hwnd === data.hwnd ? { ...character, ...data } : character
      ),
    })),
  popExecute: (hwnd: string) => {
    const character = get().characters.find((c) => c.hwnd === hwnd)
    const item = character?.executeList[0]
    if (item) {
      set((state) => ({
        characters: state.characters.map((character) =>
          character.hwnd === hwnd
            ? { ...character, currentTask: item.name, executeList: character.executeList.slice(1) }
            : character
        ),
      }))
      const settingsValues = useSettingsStore.getState().values ?? {}
      return { ...item, values: { ...item.values, CONFIG: settingsValues } }
    }
    return item
  },
  remove: (hwnd: string) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.hwnd !== hwnd),
      selectedHwnd: state.selectedHwnd === hwnd ? null : state.selectedHwnd,
    })),
  setSelectedHwnd: (hwnd: string | null) => set({ selectedHwnd: hwnd }),
  pushExecute: (hwnd: string, item: ExecuteItem) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        character.hwnd === hwnd
          ? {
              ...character,
              executeList: [
                ...character.executeList,
                { ...item, _uid: _executeUidCounter++ },
              ],
            }
          : character
      ),
    })),
  removeExecute: (hwnd: string, uid: number) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        character.hwnd === hwnd
          ? {
              ...character,
              executeList: character.executeList.filter((item) => item._uid !== uid),
            }
          : character
      ),
    })),
  clearExecute: (hwnd: string) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        character.hwnd === hwnd
          ? { ...character, executeList: [] }
          : character
      ),
    })),
  updateExecuteValues: (hwnd: string, uid: number, values: Record<string, unknown>) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        character.hwnd === hwnd
          ? {
              ...character,
              executeList: character.executeList.map((item) =>
                item._uid === uid ? { ...item, values } : item
              ),
            }
          : character
      ),
    })),
  reorderExecute: (hwnd: string, orderedUids: number[]) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        character.hwnd === hwnd
          ? {
              ...character,
              executeList: orderedUids
                .map((uid) => character.executeList.find((item) => item._uid === uid))
                .filter((item): item is ExecuteEntry => item !== undefined),
            }
          : character
      ),
    })),
}))

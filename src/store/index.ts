import { useCharacterStore } from "@/store/character.ts";
import { useTaskStore } from "@/store/task-store.ts";


declare global {
  interface Window {
    useCharacterStore?: typeof useCharacterStore;
    useTaskStore?: typeof useTaskStore;
  }
}


window.useCharacterStore = useCharacterStore
window.useTaskStore = useTaskStore
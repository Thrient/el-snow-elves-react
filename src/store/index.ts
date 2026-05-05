import { useCharacterStore } from "@/store/character.ts";


declare global {
  interface Window {
    useCharacterStore?: typeof useCharacterStore;
  }
}


window.useCharacterStore = useCharacterStore
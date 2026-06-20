import { create } from 'zustand'

const useStore = create((set) => ({
  phase: 'BOOT',
  setPhase: (phase) => set({ phase }),
  glitchIntensity: 0,
  setGlitchIntensity: (v) => set({ glitchIntensity: v }),
  activeProject: null,
  setActiveProject: (p) => set({ activeProject: p }),
  laptopPrompt: false,
  setLaptopPrompt: (v) => set({ laptopPrompt: v }),
  localHour: 12,
  setLocalHour: (v) => set({ localHour: v }),
}))

export default useStore

import { create } from 'zustand'

const useStore = create((set) => ({
  phase: 'BOOT',
  setPhase: (phase) => set({ phase }),
  glitchIntensity: 0,
  setGlitchIntensity: (v) => set({ glitchIntensity: v }),
}))

export default useStore

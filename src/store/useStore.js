import { create } from 'zustand'

// Detect touch/mobile once at module load time so it never changes mid-session.
// Coarse pointer (touchscreen) + small viewport = mobile.
const _isMobile =
  window.matchMedia('(pointer: coarse)').matches &&
  (window.innerWidth < 768 || 'ontouchstart' in window)

const useStore = create((set) => ({
  phase: 'BOOT',
  setPhase: (phase) => set({ phase }),
  isMobile: _isMobile,
  glitchIntensity: 0,
  setGlitchIntensity: (v) => set({ glitchIntensity: v }),
  activeProject: null,
  setActiveProject: (p) => set({ activeProject: p }),
  laptopPrompt: false,
  setLaptopPrompt: (v) => set({ laptopPrompt: v }),
  localHour: 12,
  setLocalHour: (v) => set({ localHour: v }),
  cursorState: 'default',
  hoveredObject: null,
  setCursor: (cursorState, hoveredObject = null) => set({ cursorState, hoveredObject }),
  soundEnabled: false,
  setSoundEnabled: (v) => set({ soundEnabled: v }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
}))

export default useStore

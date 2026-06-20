import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import { wrapEffect } from '@react-three/postprocessing'
import glitchFrag from '../../shaders/glitch.frag?raw'
import useStore from '../../store/useStore'

// Custom glitch post-processing effect.
// update() runs every frame via the EffectPass; we read intensity straight
// from the Zustand store (no React subscription, no ref plumbing needed).
class GlitchEffectImpl extends Effect {
  constructor() {
    super('GlitchEffect', glitchFrag, {
      uniforms: new Map([
        ['uIntensity', new Uniform(0)],
        ['uTime', new Uniform(0)],
      ]),
    })
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('uTime').value += deltaTime
    this.uniforms.get('uIntensity').value = useStore.getState().glitchIntensity
  }
}

// wrapEffect → component placed directly inside <EffectComposer>
export default wrapEffect(GlitchEffectImpl)

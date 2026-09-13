// ============================================================================
// Camera rig — orbit + snap-to-anchor.
//
// Deliberately NOT first-person walking. v1 of this portfolio used pointer-lock
// WASD and it was slow to navigate and hostile to anyone with 45 seconds.
// Orbit + fly-to-anchor is instantly legible and needs no instructions.
// ============================================================================

import * as THREE from 'three';
import gsap from 'gsap';

const _v = new THREE.Vector3();

/**
 * @param {THREE.PerspectiveCamera} camera
 * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} controls
 */
export function createRig(camera, controls) {
  let flight = null;

  /** Idle drift: a slow breath so a static scene never looks frozen. */
  let idle = { t: 0, enabled: true, amp: 0.012 };

  function cancelFlight() {
    if (flight) {
      flight.kill();
      flight = null;
    }
  }

  /**
   * Fly the camera to an anchor's saved viewpoint.
   * @param {{position:number[], target:number[]}} view
   * @param {{duration?:number, reduced?:boolean, onComplete?:Function}} opts
   */
  function flyTo(view, opts = {}) {
    cancelFlight();
    const { duration = 1.4, reduced = false, onComplete, onUpdate } = opts;

    const [px, py, pz] = view.position;
    const [tx, ty, tz] = view.target;

    // Reduced motion: teleport rather than sweep. Camera sweeps are a common
    // vestibular trigger, and this is a portfolio, not a game.
    if (reduced) {
      camera.position.set(px, py, pz);
      controls.target.set(tx, ty, tz);
      controls.update();
      onUpdate?.();
      onComplete?.();
      return;
    }

    idle.enabled = false;
    const proxy = {
      px: camera.position.x, py: camera.position.y, pz: camera.position.z,
      tx: controls.target.x, ty: controls.target.y, tz: controls.target.z,
    };

    flight = gsap.to(proxy, {
      px, py, pz, tx, ty, tz,
      duration,
      ease: 'power3.inOut', // matches --ease intent: fast out, settled landing
      onUpdate() {
        camera.position.set(proxy.px, proxy.py, proxy.pz);
        controls.target.set(proxy.tx, proxy.ty, proxy.tz);
        controls.update();
        onUpdate?.();
      },
      onComplete() {
        flight = null;
        idle.enabled = true;
        onComplete?.();
      },
    });
    gsap.ticker.wake();
  }

  /** Return to the wide establishing shot. */
  function reset(home, opts) {
    flyTo(home, opts);
  }

  /** Called every frame. `dt` in seconds. */
  function update(dt) {
    if (idle.enabled && !flight) {
      idle.t += dt;
      // Sub-pixel orbital drift — felt, not seen.
      const dx = Math.sin(idle.t * 0.25) * idle.amp;
      const dy = Math.cos(idle.t * 0.19) * idle.amp * 0.5;
      camera.position.x += dx * dt;
      camera.position.y += dy * dt;
    }
    controls.update();
  }

  /** Project a world point to CSS pixel coords. Returns null when behind camera. */
  function project(point, width, height) {
    _v.set(point[0], point[1], point[2]).project(camera);
    if (_v.z > 1) return null; // behind the near plane
    return {
      x: (_v.x * 0.5 + 0.5) * width,
      y: (-_v.y * 0.5 + 0.5) * height,
      depth: _v.z,
    };
  }

  function setIdle(on) {
    idle.enabled = on;
  }

  function dispose() {
    cancelFlight();
  }

  return { flyTo, reset, update, project, setIdle, dispose, get flying() { return !!flight; } };
}

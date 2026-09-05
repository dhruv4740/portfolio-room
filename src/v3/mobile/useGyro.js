// ============================================================================
// useGyro — deviceorientation → smoothed, clamped tilt for mobile parallax.
// Raw deviceorientation is noisy; we lerp toward the latest reading every
// frame so the deck feels like it has weight instead of jittering.
// iOS 13+ gates the API behind a user gesture (requestPermission()); other
// platforms expose it directly. Respects prefersReducedMotion — no listener,
// no rAF loop, tilt stays at rest.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/capability.js';

const LERP = 0.1;

function clamp(v, min = -1, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function hasDeviceOrientation() {
  return typeof window !== 'undefined' && typeof window.DeviceOrientationEvent !== 'undefined';
}

function needsIOSPermission() {
  return hasDeviceOrientation() && typeof window.DeviceOrientationEvent.requestPermission === 'function';
}

/**
 * @returns {{ tilt: {x: number, y: number}, permission: 'unsupported'|'prompt'|'granted'|'denied', request: () => void }}
 */
export function useGyro() {
  const reduced = prefersReducedMotion();

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [permission, setPermission] = useState(() => {
    if (reduced || !hasDeviceOrientation()) return 'unsupported';
    return needsIOSPermission() ? 'prompt' : 'granted';
  });

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const handleOrientation = useCallback((event) => {
    const gamma = typeof event.gamma === 'number' ? event.gamma : 0; // left/right, ~-90..90
    const beta = typeof event.beta === 'number' ? event.beta : 0; // front/back, ~-180..180
    targetRef.current = {
      x: clamp(gamma / 45),
      y: clamp(beta / 90),
    };
  }, []);

  useEffect(() => {
    if (reduced || permission !== 'granted') return undefined;

    const tick = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      current.x += (target.x - current.x) * LERP;
      current.y += (target.y - current.y) * LERP;
      setTilt({ x: current.x, y: current.y });
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced, permission, handleOrientation]);

  const request = useCallback(() => {
    if (reduced || !hasDeviceOrientation()) return;

    if (!needsIOSPermission()) {
      setPermission('granted');
      return;
    }

    window.DeviceOrientationEvent.requestPermission()
      .then((result) => {
        setPermission(result === 'granted' ? 'granted' : 'denied');
      })
      .catch(() => setPermission('denied'));
  }, [reduced]);

  return {
    tilt: reduced ? { x: 0, y: 0 } : tilt,
    permission,
    request,
  };
}

export default useGyro;

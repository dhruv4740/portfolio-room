// Quiet, gesture-unlocked room foley. The room never creates an AudioContext
// during arrival or initial render; short sounds are scheduled only after a
// user gesture has unlocked this module.
const MUTE_KEY = 'v3:room-muted';

let audioCtx = null;
let masterGain = null;
let muted = readMuted();
let visibilityBound = false;
const pendingCleanups = new Set();

function readMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

function contextClass() {
  return typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
}

export function isRoomMuted() {
  return muted;
}

export function setRoomMuted(value) {
  muted = !!value;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* private mode */ }
  if (audioCtx && masterGain) {
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.18, now, 0.025);
  }
  return muted;
}

export function unlockRoomAudio() {
  const AudioContextClass = contextClass();
  if (!AudioContextClass) return false;
  try {
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = muted ? 0 : 0.18;
      masterGain.connect(audioCtx.destination);
      if (!visibilityBound && typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibility);
        visibilityBound = true;
      }
    }
    if (!document.hidden && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return true;
  } catch (error) {
    console.warn('Room audio unlock failed', error);
    return false;
  }
}

// Suspending on hide is only half the contract: without the matching resume
// the context stays suspended after the tab returns, and playRoomFoley's
// `state !== 'running'` guard silently drops every later cue. The context was
// already unlocked by a real gesture, so resuming it does not create audio.
function handleVisibility() {
  if (!audioCtx || audioCtx.state === 'closed') return;
  if (document.hidden) audioCtx.suspend().catch(() => {});
  else if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}

function disconnectLater(nodes, delay) {
  const cleanup = { nodes, timer: 0 };
  cleanup.timer = window.setTimeout(() => {
    pendingCleanups.delete(cleanup);
    nodes.forEach((node) => { try { node.disconnect(); } catch {} });
  }, delay);
  pendingCleanups.add(cleanup);
}

function panNode(ctx, pan) {
  if (!ctx.createStereoPanner) return null;
  const node = ctx.createStereoPanner();
  node.pan.value = Math.max(-1, Math.min(1, Number(pan) || 0));
  node.connect(masterGain);
  return node;
}

function ceramicContact(ctx, when, amount, pan) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const output = panNode(ctx, pan);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1250, when);
  oscillator.frequency.exponentialRampToValueAtTime(720, when + 0.12);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(amount, when + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
  oscillator.connect(gain);
  gain.connect(output || masterGain);
  oscillator.start(when);
  oscillator.stop(when + 0.18);
  disconnectLater([oscillator, gain, output].filter(Boolean), 240);
}

function softCloth(ctx, when, amount, pan) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.14), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const output = panNode(ctx, pan);
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(amount, when + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.13);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output || masterGain);
  source.start(when);
  source.stop(when + 0.15);
  disconnectLater([source, filter, gain, output].filter(Boolean), 220);
}

function softSip(ctx, when, pan) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const output = panNode(ctx, pan);
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(280, when);
  oscillator.frequency.exponentialRampToValueAtTime(205, when + 0.28);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(0.028, when + 0.055);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
  oscillator.connect(gain);
  gain.connect(output || masterGain);
  oscillator.start(when);
  oscillator.stop(when + 0.37);
  disconnectLater([oscillator, gain, output].filter(Boolean), 430);
}

export function playRoomFoley({ kind, pan = 0 } = {}) {
  if (muted || document.hidden || !audioCtx || audioCtx.state !== 'running' || !masterGain) return;
  const when = audioCtx.currentTime + 0.005;
  if (kind === 'sip') {
    softSip(audioCtx, when, pan);
    return;
  }
  if (kind === 'cup-lift') {
    softCloth(audioCtx, when, 0.012, pan);
    ceramicContact(audioCtx, when + 0.025, 0.024, pan);
    return;
  }
  if (kind === 'cup-setdown') {
    softCloth(audioCtx, when, 0.009, pan);
    ceramicContact(audioCtx, when + 0.018, 0.034, pan);
  }
}

export function disposeRoomAudio() {
  if (visibilityBound && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibility);
    visibilityBound = false;
  }
  pendingCleanups.forEach(({ nodes, timer }) => {
    window.clearTimeout(timer);
    nodes.forEach((node) => { try { node.disconnect(); } catch {} });
  });
  pendingCleanups.clear();
  // close() returns a promise; a sync try/catch cannot absorb its rejection
  // (it rejects when the context is already closed), so catch it explicitly.
  try { audioCtx?.close().catch(() => {}); } catch {}
  audioCtx = null;
  masterGain = null;
}

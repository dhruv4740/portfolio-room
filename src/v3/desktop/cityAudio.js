// Synthesized city ambience: filtered brown noise (traffic roar) + low hums (urban grid).
// Strictly instantiated and started on user gesture; no external assets.
let audioCtx = null;
let masterGain = null;
let noiseSource = null;
let humOsc1 = null;
let humOsc2 = null;
// Tracks intent (last start/stop call), not the mid-ramp gain value — a fade
// in progress still counts as "playing" for sync-checking purposes.
let playing = false;

function createNoiseBuffer(ctx, duration = 3) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Brown noise approximation: leaky integrator creates low-frequency traffic wash
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  return buffer;
}

function initAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioCtx = new AudioContextClass();

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  // Noise generator for traffic rumble
  const noiseBuffer = createNoiseBuffer(audioCtx);
  noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  // Filter noise to sound like distant city traffic (lowpass around 420 Hz)
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(420, audioCtx.currentTime);
  filter.Q.setValueAtTime(1.2, audioCtx.currentTime);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

  noiseSource.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start();

  // Dual low hum oscillators for deep urban resonance (55 Hz and 110 Hz)
  humOsc1 = audioCtx.createOscillator();
  humOsc1.type = 'sine';
  humOsc1.frequency.setValueAtTime(55, audioCtx.currentTime);
  const humGain1 = audioCtx.createGain();
  humGain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
  humOsc1.connect(humGain1);
  humGain1.connect(masterGain);
  humOsc1.start();

  humOsc2 = audioCtx.createOscillator();
  humOsc2.type = 'sine';
  humOsc2.frequency.setValueAtTime(110, audioCtx.currentTime);
  const humGain2 = audioCtx.createGain();
  humGain2.gain.setValueAtTime(0.04, audioCtx.currentTime);
  humOsc2.connect(humGain2);
  humGain2.connect(masterGain);
  humOsc2.start();
}

export function startCityAmbience() {
  playing = true;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(0.22, t + 0.8);
  } catch (err) {
    console.warn('Audio start failed', err);
  }
}

export function stopCityAmbience() {
  playing = false;
  try {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(0, t + 0.5);
  } catch (err) {
    console.warn('Audio stop failed', err);
  }
}

export function isCityAmbiencePlaying() {
  return playing;
}

export function disposeCityAmbience() {
  playing = false;
  try {
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
      masterGain = null;
      noiseSource = null;
      humOsc1 = null;
      humOsc2 = null;
    }
  } catch {}
}

// Test/dev hook only — never used to drive production behavior.
if (
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
  (typeof localStorage !== 'undefined' && localStorage.getItem('v3:test') === '1')
) {
  if (typeof window !== 'undefined') {
    window.__cityAmbience = { playing: () => isCityAmbiencePlaying() };
  }
}

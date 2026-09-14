/**
 * audio.js — Resonance ambient soundscape via Web Audio API.
 * Bass sine + detuned saw pad through lowpass with LFO.
 * Starts ONLY on user gesture (toggle).
 */

let _ctx = null;
let _masterGain = null;
let _analyser = null;
let _nodes = [];
let _running = false;

function _buildSynth(ctx, dest) {
  const nodes = [];

  // Bass sine
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.value = 55;
  bassGain.gain.value = 0.18;
  bass.connect(bassGain);
  bassGain.connect(dest);
  bass.start();
  nodes.push(bass, bassGain);

  // Detuned saw pad + LFO lowpass
  const padFreqs = [110, 110.7, 109.3, 220.5, 219.8];
  padFreqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    lp.Q.value = 2;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1 + idx * 0.025;
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();
    osc.connect(g);
    g.connect(lp);
    lp.connect(dest);
    osc.start();
    nodes.push(osc, g, lp, lfo, lfoGain);
  });

  // Delay feedback (reverb-lite)
  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = 0.38;
  const fb = ctx.createGain();
  fb.gain.value = 0.4;
  const delayOut = ctx.createGain();
  delayOut.gain.value = 0.07;
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayOut);
  delayOut.connect(dest);
  nodes.push(delay, fb, delayOut);

  return nodes;
}

function _init() {
  if (_ctx) return;
  _ctx = new (window.AudioContext || window.webkitAudioContext)();
  _masterGain = _ctx.createGain();
  _masterGain.gain.value = 0.75;
  _analyser = _ctx.createAnalyser();
  _analyser.fftSize = 512;
  _analyser.smoothingTimeConstant = 0.0;
  _masterGain.connect(_analyser);
  _analyser.connect(_ctx.destination);
}

function start() {
  if (_running) return;
  _init();
  if (_ctx.state === 'suspended') _ctx.resume();
  _nodes = _buildSynth(_ctx, _masterGain);
  _running = true;
}

function stop() {
  if (!_running) return;
  _nodes.forEach(n => {
    try { if (n.stop) n.stop(); } catch (_) {}
    try { n.disconnect(); } catch (_) {}
  });
  _nodes = [];
  _running = false;
}

function toggle() {
  if (_running) stop(); else start();
  return _running;
}

/** Returns the AnalyserNode (or null before first start). */
function getAnalyser() {
  return _analyser;
}

export default {
  start,
  stop,
  toggle,
  init: _init,
  get context() { _init(); return _ctx; },
  get masterGain() { _init(); return _masterGain; },
  get analyser() { _init(); return getAnalyser(); },
  get running() { return _running; },
};

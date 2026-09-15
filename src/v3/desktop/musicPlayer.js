// src/v3/desktop/musicPlayer.js
// Singleton audio manager for /os/audio/song.mp3.
// Exactly one HTMLAudioElement plays the song across the room and dhruvOS monitor.
// Exposes window.__v3Music for same-origin iframe access.

class MusicPlayer {
  constructor() {
    this.audio = typeof Audio !== 'undefined'
      ? new Audio('/os/audio/song.mp3')
      : null;
    if (this.audio) {
      this.audio.loop = true;
      this.audio.preload = 'auto';
    }

    this.output = 'speakers'; // 'speakers' | 'headphones'
    this.volume = 0.6;
    this.listenerDistance = 1.2;

    this.ctx = null;
    this.source = null;
    this.analyser = null;
    this.masterGain = null;

    // Headphones path
    this.headphonesGain = null;

    // Speakers path
    this.hpFilter = null;
    this.lpFilter = null;
    this.convolver = null;
    this.dryGain = null;
    this.wetGain = null;
    this.speakersCombineGain = null;
    this.speakersBaseGain = null;
    this.speakersDistGain = null;
    this.speakersFadeGain = null;

    this.subscribers = new Set();
    this.heartbeatTimer = null;

    if (this.audio) {
      this.audio.volume = this.volume;
      this.audio.addEventListener('play', () => {
        this.startHeartbeat();
        this.notify();
      });
      this.audio.addEventListener('pause', () => {
        this.stopHeartbeat();
        this.notify();
      });
      this.audio.addEventListener('timeupdate', () => this.notify());
      this.audio.addEventListener('seeking', () => this.notify());
      this.audio.addEventListener('seeked', () => this.notify());
    }
  }

  ensureAudioGraph() {
    if (this.source || !this.audio || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Source from the single audio element
    this.source = this.ctx.createMediaElementSource(this.audio);

    // Analyser node for visualizer (reads raw audio source)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.source.connect(this.analyser);

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    // ── Headphones path (dry, full-range signal) ──
    this.headphonesGain = this.ctx.createGain();
    this.headphonesGain.gain.value = this.output === 'headphones' ? 1 : 0;
    this.source.connect(this.headphonesGain);
    this.headphonesGain.connect(this.masterGain);

    // ── Speakers path ──
    // Highpass ~120 Hz, lowpass ~5 kHz
    this.hpFilter = this.ctx.createBiquadFilter();
    this.hpFilter.type = 'highpass';
    this.hpFilter.frequency.value = 120;

    this.lpFilter = this.ctx.createBiquadFilter();
    this.lpFilter.type = 'lowpass';
    this.lpFilter.frequency.value = 5000;

    this.source.connect(this.hpFilter);
    this.hpFilter.connect(this.lpFilter);

    // Room echo: ConvolverNode with ~0.4s decaying-noise impulse, wet ≈ 0.18
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this.createImpulse(0.4, 3.5);

    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.18;
    this.convolver.connect(this.wetGain);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.82;

    this.lpFilter.connect(this.convolver);
    this.lpFilter.connect(this.dryGain);

    this.speakersCombineGain = this.ctx.createGain();
    this.dryGain.connect(this.speakersCombineGain);
    this.wetGain.connect(this.speakersCombineGain);

    // Overall gain ×0.7
    this.speakersBaseGain = this.ctx.createGain();
    this.speakersBaseGain.gain.value = 0.7;
    this.speakersCombineGain.connect(this.speakersBaseGain);

    // Listener distance factor: clamp(1.2 / d, 0.25, 1)
    this.speakersDistGain = this.ctx.createGain();
    const distFactor = Math.min(1, Math.max(0.25, 1.2 / this.listenerDistance));
    this.speakersDistGain.gain.value = distFactor;
    this.speakersBaseGain.connect(this.speakersDistGain);

    // Speakers crossfade gain
    this.speakersFadeGain = this.ctx.createGain();
    this.speakersFadeGain.gain.value = this.output === 'speakers' ? 1 : 0;
    this.speakersDistGain.connect(this.speakersFadeGain);
    this.speakersFadeGain.connect(this.masterGain);
  }

  createImpulse(duration = 0.4, decay = 3.5) {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const env = Math.exp(-decay * (i / length));
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
  }

  async play() {
    if (!this.audio) return;
    this.ensureAudioGraph();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }
    return this.audio.play();
  }

  pause() {
    if (!this.audio) return;
    this.audio.pause();
  }

  toggle() {
    if (!this.audio) return Promise.resolve();
    if (this.audio.paused) {
      return this.play();
    } else {
      this.pause();
      return Promise.resolve();
    }
  }

  seek(seconds) {
    if (!this.audio) return;
    this.audio.currentTime = seconds;
    this.notify();
  }

  setVolume(vol) {
    this.volume = Math.min(1, Math.max(0, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  setOutput(out) {
    if (out !== 'speakers' && out !== 'headphones') return;
    if (out === this.output) return;
    this.output = out;

    if (this.ctx && this.headphonesGain && this.speakersFadeGain) {
      const now = this.ctx.currentTime;
      const DURATION = 0.3; // 300 ms crossfade

      this.headphonesGain.gain.cancelScheduledValues(now);
      this.headphonesGain.gain.setValueAtTime(this.headphonesGain.gain.value, now);

      this.speakersFadeGain.gain.cancelScheduledValues(now);
      this.speakersFadeGain.gain.setValueAtTime(this.speakersFadeGain.gain.value, now);

      if (this.output === 'headphones') {
        this.headphonesGain.gain.linearRampToValueAtTime(1, now + DURATION);
        this.speakersFadeGain.gain.linearRampToValueAtTime(0, now + DURATION);
      } else {
        this.headphonesGain.gain.linearRampToValueAtTime(0, now + DURATION);
        this.speakersFadeGain.gain.linearRampToValueAtTime(1, now + DURATION);
      }
    }
    this.notify();
  }

  setListenerDistance(metres) {
    this.listenerDistance = metres;
    if (this.ctx && this.speakersDistGain) {
      const distFactor = Math.min(1, Math.max(0.25, 1.2 / metres));
      this.speakersDistGain.gain.setValueAtTime(distFactor, this.ctx.currentTime);
    }
  }

  getState() {
    return {
      playing: Boolean(this.audio && !this.audio.paused),
      currentTime: this.audio ? this.audio.currentTime : 0,
      duration: this.audio ? this.audio.duration || 0 : 0,
      volume: this.volume,
      output: this.output,
    };
  }

  getAnalyser() {
    this.ensureAudioGraph();
    return this.analyser;
  }

  startHeartbeat() {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      this.notify();
    }, 200);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  notify() {
    const state = this.getState();
    for (const fn of this.subscribers) {
      try {
        fn(state);
      } catch (_) {}
    }
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    try {
      fn(this.getState());
    } catch (_) {}
    return () => {
      this.subscribers.delete(fn);
    };
  }
}

export const musicPlayer = new MusicPlayer();

if (typeof window !== 'undefined') {
  window.__v3Music = musicPlayer;
}

export default musicPlayer;

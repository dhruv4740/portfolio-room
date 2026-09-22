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
      // 1.9 MB: only fetched once the headphones go on and play() is called.
      this.audio.preload = 'none';
    }

    this.volume = 0.6;
    this.ctx = null;
    this.source = null;
    this.analyser = null;
    this.masterGain = null;

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
    this.source.connect(this.masterGain);
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

  getState() {
    return {
      playing: Boolean(this.audio && !this.audio.paused),
      currentTime: this.audio ? this.audio.currentTime : 0,
      duration: this.audio ? this.audio.duration || 0 : 0,
      volume: this.volume,
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

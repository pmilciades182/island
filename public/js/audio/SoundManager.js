import { WorldConfig } from '../world/WorldConfig.js';

/**
 * SoundManager - Procedural audio using Web Audio API
 * Generates footstep sounds that vary by terrain type
 */
export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.initialized = false;
    this.volume = 0.3;

    // Footstep timing
    this._lastStepTime = 0;
    this._stepInterval = 280; // ms between steps
    this._stepIntervalSprint = 180;
    this._stepFoot = 0; // Alternates between 0 and 1

    // Variation ranges for natural sound
    this._volumeVariation = 0.25;  // ±25% volume variation
    this._pitchVariation = 0.12;   // ±12% pitch variation
  }

  /**
   * Get random value in range centered at 1.0
   * @param {number} variation - Variation amount (0.1 = ±10%)
   */
  _vary(variation) {
    return 1 + (Math.random() * 2 - 1) * variation;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  /**
   * Resume audio context if suspended (browser autoplay policy)
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Set master volume
   * @param {number} value - Volume from 0 to 1
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Create noise buffer for texture
   */
  _createNoiseBuffer(duration = 0.1) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Play footstep sound based on terrain
   * @param {number} terrainType - WorldConfig.TERRAIN type
   * @param {boolean} sprinting - Is player sprinting
   */
  playFootstep(terrainType, sprinting = false) {
    if (!this.initialized || !this.audioContext) return;

    const now = performance.now();
    const baseInterval = sprinting ? this._stepIntervalSprint : this._stepInterval;
    // Add ±15% timing variation for natural rhythm
    const interval = baseInterval * (0.85 + Math.random() * 0.3);

    if (now - this._lastStepTime < interval) return;

    this._lastStepTime = now;
    this._stepFoot = 1 - this._stepFoot;

    // Resume context if needed
    this.resume();

    // Generate sound based on terrain
    switch (terrainType) {
      case WorldConfig.TERRAIN.SAND:
        this._playSandStep();
        break;
      case WorldConfig.TERRAIN.GRASS_LIGHT:
      case WorldConfig.TERRAIN.GRASS_DARK:
        this._playGrassStep();
        break;
      case WorldConfig.TERRAIN.DIRT:
        this._playDirtStep();
        break;
      default:
        this._playDefaultStep();
    }
  }

  /**
   * Sand footstep - soft, muffled, shuffling
   */
  _playSandStep() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const volMult = this._vary(this._volumeVariation);
    const pitchMult = this._vary(this._pitchVariation);

    // Noise for sand texture
    const noise = ctx.createBufferSource();
    noise.buffer = this._createNoiseBuffer(0.15);
    noise.playbackRate.value = pitchMult;

    // Lowpass filter for muffled sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = (400 + Math.random() * 200) * pitchMult;
    filter.Q.value = 1;

    // Envelope with volume variation
    const baseVol = 0.15 + Math.random() * 0.05;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseVol * volMult, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  /**
   * Grass footstep - rustling with soft thud undertone
   */
  _playGrassStep() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const volMult = this._vary(this._volumeVariation);
    const pitchMult = this._vary(this._pitchVariation);

    // Layer 1: Soft low thud (ground contact)
    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'sine';
    const thudFreq = (60 + Math.random() * 40) * pitchMult;
    thudOsc.frequency.setValueAtTime(thudFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(thudFreq * 0.6, now + 0.06);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.08 * volMult, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);

    // Layer 2: Mid-range rustle (grass movement)
    const rustleNoise = ctx.createBufferSource();
    rustleNoise.buffer = this._createNoiseBuffer(0.1);
    rustleNoise.playbackRate.value = pitchMult * (0.8 + Math.random() * 0.4);

    const rustleFilter = ctx.createBiquadFilter();
    rustleFilter.type = 'bandpass';
    rustleFilter.frequency.value = (600 + Math.random() * 400) * pitchMult;
    rustleFilter.Q.value = 0.8;

    const rustleGain = ctx.createGain();
    const rustleVol = 0.1 + Math.random() * 0.04;
    rustleGain.gain.setValueAtTime(0, now);
    rustleGain.gain.linearRampToValueAtTime(rustleVol * volMult, now + 0.01);
    rustleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    rustleNoise.connect(rustleFilter);
    rustleFilter.connect(rustleGain);
    rustleGain.connect(this.masterGain);

    // Layer 3: Light high crinkle (occasional, random)
    if (Math.random() > 0.4) {
      const crinkleNoise = ctx.createBufferSource();
      crinkleNoise.buffer = this._createNoiseBuffer(0.06);
      crinkleNoise.playbackRate.value = pitchMult * (1.0 + Math.random() * 0.3);

      const crinkleFilter = ctx.createBiquadFilter();
      crinkleFilter.type = 'highpass';
      crinkleFilter.frequency.value = (1200 + Math.random() * 800) * pitchMult;

      const crinkleGain = ctx.createGain();
      const crinkleVol = 0.03 + Math.random() * 0.02;
      crinkleGain.gain.setValueAtTime(0, now + 0.01);
      crinkleGain.gain.linearRampToValueAtTime(crinkleVol * volMult, now + 0.02);
      crinkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      crinkleNoise.connect(crinkleFilter);
      crinkleFilter.connect(crinkleGain);
      crinkleGain.connect(this.masterGain);

      crinkleNoise.start(now + 0.01);
      crinkleNoise.stop(now + 0.08);
    }

    thudOsc.start(now);
    thudOsc.stop(now + 0.07);
    rustleNoise.start(now);
    rustleNoise.stop(now + 0.1);
  }

  /**
   * Dirt footstep - thuddy, earthy
   */
  _playDirtStep() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const volMult = this._vary(this._volumeVariation);
    const pitchMult = this._vary(this._pitchVariation);

    // Low thud oscillator with pitch variation
    const baseFreq = (80 + Math.random() * 30) * pitchMult;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.08);

    // Noise layer
    const noise = ctx.createBufferSource();
    noise.buffer = this._createNoiseBuffer(0.1);
    noise.playbackRate.value = pitchMult;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = (600 + Math.random() * 200) * pitchMult;

    // Oscillator envelope with volume variation
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.2 * volMult, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // Noise envelope with volume variation
    const baseNoiseVol = 0.08 + Math.random() * 0.03;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(baseNoiseVol * volMult, now + 0.015);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  /**
   * Default footstep - neutral sound
   */
  _playDefaultStep() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const volMult = this._vary(this._volumeVariation);
    const pitchMult = this._vary(this._pitchVariation);

    const noise = ctx.createBufferSource();
    noise.buffer = this._createNoiseBuffer(0.1);
    noise.playbackRate.value = pitchMult;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (1000 + Math.random() * 500) * pitchMult;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1 * volMult, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.1);
  }

  /**
   * Play UI click sound
   */
  playClick() {
    if (!this.initialized || !this.audioContext) return;
    this.resume();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Play interaction sound (when pressing E)
   */
  playInteract() {
    if (!this.initialized || !this.audioContext) return;
    this.resume();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Two-tone "pop"
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.06);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.1);
  }
}

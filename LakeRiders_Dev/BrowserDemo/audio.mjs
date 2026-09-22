// LakeRiders Web Audio Synthesizer Engine (Phase 10 / Realistic SFX & QQ Speed Style BGM)
// Pure procedural multi-channel synthesis without external audio file dependencies.

const NOTE_FREQS = {
  'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'Ab5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66
};

// 4 Iconic QQ Speed Style High-Octane Racing Tracks
export const BGM_TRACKS = [
  {
    title: '极速漂移 · Speed Drift',
    subtitle: 'QQ飞车风 · 经典欧陆电子摇滚',
    bpm: 140,
    bass: ['D3','D3','D3','D3', 'F3','F3','F3','F3', 'G3','G3','G3','G3', 'Bb3','Bb3','A3','A3'],
    melody: ['D5','F5','A5','G5', 'F5','D5','E5','F5', 'G5','A5','Bb5','A5', 'G5','E5','F5','D5',
             'A5','A5','Bb5','A5', 'G5','F5','E5','F5', 'G5','D5','F5','G5', 'A5','G5','E5','D5'],
    chords: [['D4','F4','A4'], ['F4','A4','C5'], ['G4','Bb4','D5'], ['Bb4','D5','F5']]
  },
  {
    title: '天山狂飙 · Alpine Rush',
    subtitle: '高燃电音 · 赛湖雪山飞驰',
    bpm: 134,
    bass: ['A3','A3','C4','A3', 'G3','G3','B3','G3', 'F3','F3','A3','F3', 'E3','E3','G3','E3'],
    melody: ['E5','A5','B5','C6', 'B5','A5','G5','E5', 'F5','A5','C6','B5', 'A5','G5','E5','A5',
             'C6','C6','B5','A5', 'G5','E5','G5','A5', 'B5','C6','D6','C6', 'B5','A5','G5','A5'],
    chords: [['A4','C5','E5'], ['G4','B4','D5'], ['F4','A4','C5'], ['E4','G4','B4']]
  },
  {
    title: '电音脉冲 · Cyber Pulse',
    subtitle: '飞车放克 · 动感低音推进',
    bpm: 128,
    bass: ['E3','E3','G3','E3', 'A3','A3','G3','E3', 'D3','D3','F3','D3', 'B3','B3','A3','G3'],
    melody: ['B5','E5','G5','B5', 'A5','G5','E5','D5', 'E5','G5','A5','B5', 'D6','B5','A5','G5',
             'G5','A5','B5','E5', 'G5','E5','D5','B4', 'D5','E5','G5','A5', 'G5','E5','D5','E5'],
    chords: [['E4','G4','B4'], ['A4','C5','E5'], ['D4','F4','A4'], ['B4','D5','F#5']]
  },
  {
    title: '赛湖微风 · Sayram Breeze',
    subtitle: '明朗竞速 · 高原湖畔燃曲',
    bpm: 118,
    bass: ['G3','G3','B3','G3', 'C4','C4','E4','C4', 'D4','D4','F#4','D4', 'G3','G3','B3','D4'],
    melody: ['D5','G5','A5','B5', 'C6','B5','A5','G5', 'A5','B5','A5','G5', 'E5','G5','A5','B5',
             'D6','B5','G5','A5', 'B5','A5','G5','E5', 'G5','A5','B5','D6', 'B5','A5','G5','G5'],
    chords: [['G4','B4','D5'], ['C4','E4','G4'], ['D4','F#4','A4'], ['G4','B4','D5']]
  }
];

export class RacingBgmPlayer {
  constructor(soundEngine) {
    this.engine = soundEngine;
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.stepIndex = 0;
    this.nextStepTime = 0;
    this.timerId = null;
    this.bgmGain = null;
    this.lookahead = 0.04; // 40ms
    this.scheduleAheadTime = 0.2; // 200ms
  }

  init(ctx, masterGain) {
    if (!ctx || !masterGain) return;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = 0.22; // Well-balanced with game sound effects
    this.bgmGain.connect(masterGain);
  }

  start(trackIndex = this.currentTrackIndex) {
    if (!this.engine.ctx) return;
    if (this.isPlaying && this.currentTrackIndex === trackIndex) return;
    this.stop();
    this.currentTrackIndex = (trackIndex + BGM_TRACKS.length) % BGM_TRACKS.length;
    this.isPlaying = true;
    this.stepIndex = 0;
    this.nextStepTime = this.engine.ctx.currentTime + 0.05;
    this._scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % BGM_TRACKS.length;
    this.start(nextIdx);
    return BGM_TRACKS[this.currentTrackIndex];
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  getCurrentTrack() {
    return BGM_TRACKS[this.currentTrackIndex];
  }

  getCurrentTrackInfo() {
    return this.getCurrentTrack();
  }

  startTrack(trackIndex = this.currentTrackIndex) {
    return this.start(trackIndex);
  }

  _scheduler() {
    if (!this.isPlaying || !this.engine.ctx) return;
    const ctx = this.engine.ctx;
    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this._scheduleStep(this.stepIndex, this.nextStepTime);
      const track = BGM_TRACKS[this.currentTrackIndex];
      const stepDuration = (60 / track.bpm) / 4; // 16th note step
      this.nextStepTime += stepDuration;
      this.stepIndex = (this.stepIndex + 1) % (track.melody.length);
    }
    this.timerId = setTimeout(() => this._scheduler(), this.lookahead * 1000);
  }

  _scheduleStep(step, time) {
    if (!this.bgmGain || this.engine.muted) return;
    const track = BGM_TRACKS[this.currentTrackIndex];
    const ctx = this.engine.ctx;

    // 1. Drums (Four-on-the-floor kick, snappy snare, 16th hi-hats)
    const isQuarter = (step % 4 === 0);
    const isSnare = (step % 8 === 4) || (step % 16 === 15);
    const isHihat = true;

    // Kick drum
    if (isQuarter) {
      this._playKick(time);
    }

    // Snare drum
    if (isSnare) {
      this._playSnare(time);
    }

    // Hi-hat (Crisp 16th notes with velocity accent)
    if (isHihat) {
      const accented = (step % 2 === 1); // Upbeat accent
      this._playHihat(time, accented ? 0.045 : 0.025);
    }

    // 2. Bassline (Classic QQ speed driving synth bass)
    const bassNote = track.bass[step % track.bass.length];
    if (bassNote && NOTE_FREQS[bassNote]) {
      this._playSynthBass(NOTE_FREQS[bassNote], time, (60 / track.bpm) / 4 * 0.85);
    }

    // 3. Melody / Lead hook
    const leadNote = track.melody[step % track.melody.length];
    if (leadNote && NOTE_FREQS[leadNote] && (step % 2 === 0 || Math.random() < 0.6)) {
      this._playSynthLead(NOTE_FREQS[leadNote], time, (60 / track.bpm) / 4 * 1.6);
    }

    // 4. Background chord pads / arps (every bar = 16 steps)
    if (step % 16 === 0) {
      const chordIndex = Math.floor(step / 16) % track.chords.length;
      const chord = track.chords[chordIndex];
      this._playChordPad(chord, time, (60 / track.bpm) * 4 * 0.9);
    }
  }

  _playKick(time) {
    const ctx = this.engine.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.09);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  _playSnare(time) {
    const ctx = this.engine.ctx;
    // Noise snap
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.28));
    }
    const node = ctx.createBufferSource();
    node.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 950;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    node.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    node.start(time);

    // Snare tone body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(185, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.12, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  _playHihat(time, volume = 0.03) {
    const ctx = this.engine.ctx;
    const len = Math.floor(ctx.sampleRate * 0.035);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.2));
    }
    const node = ctx.createBufferSource();
    node.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 7500;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.035);

    node.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    node.start(time);
  }

  _playSynthBass(freq, time, duration) {
    const ctx = this.engine.ctx;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.Q.value = 4.5;
    filter.frequency.setValueAtTime(850, time);
    filter.frequency.exponentialRampToValueAtTime(260, time + duration);

    gain.gain.setValueAtTime(0.20, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  _playSynthLead(freq, time, duration) {
    const ctx = this.engine.ctx;
    const osc = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    oscSub.type = 'sawtooth';
    oscSub.frequency.setValueAtTime(freq * 0.5, time); // One octave down sub layer

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.Q.value = 2.0;

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    oscSub.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    oscSub.start(time);
    osc.stop(time + duration);
    oscSub.stop(time + duration);
  }

  _playChordPad(chordNotes, time, duration) {
    if (!chordNotes || !chordNotes.length) return;
    const ctx = this.engine.ctx;
    chordNotes.forEach(noteName => {
      const freq = NOTE_FREQS[noteName];
      if (!freq) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.022, time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + duration);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(time);
      osc.stop(time + duration);
    });
  }
}

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.windSource = null;
    this.windGain = null;
    this.windFilter = null;
    this.pedalTimer = 0;
    this.lastBrakeTime = 0;
    this.bgmPlayer = new RacingBgmPlayer(this);
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.85;
    this.masterGain.connect(this.ctx.destination);

    // Initialize BGM subsystem
    this.bgmPlayer.init(this.ctx, this.masterGain);

    // Lakeside wind & lake wave ambient noise buffer
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2.5, this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      channel[i] = (Math.random() * 2 - 1) * 0.28;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = buffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 360;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.02;

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windSource.start();
  }

  startBgm(trackIndex = 0) {
    this.init();
    this.bgmPlayer.start(trackIndex);
  }

  stopBgm() {
    this.bgmPlayer.stop();
  }

  nextBgmTrack() {
    this.init();
    return this.bgmPlayer.nextTrack();
  }

  toggleBgm() {
    this.init();
    return this.bgmPlayer.toggle();
  }

  getBgmTitle() {
    return this.bgmPlayer.getCurrentTrack().title;
  }

  isBgmPlaying() {
    return this.bgmPlayer.isPlaying;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  updateAmbience(kph, pedaling = false, dt = 0.016) {
    if (!this.ctx || this.muted || !this.windGain || !this.windFilter) return;

    // Wind volume and pitch scaling with bike speed (0 - 65 km/h)
    const ratio = Math.min(1.2, Math.max(0, kph / 55));
    const targetFreq = 280 + ratio * 850;
    const targetGain = 0.015 + ratio * 0.09;

    this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    this.windGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);

    // Mechanical chain & pedal clicks during active pedaling
    if (pedaling && kph > 3) {
      this.pedalTimer += dt;
      const cadence = Math.max(0.08, 0.32 - ratio * 0.22);
      if (this.pedalTimer >= cadence) {
        this.pedalTimer = 0;
        this.playPedalClick(ratio);
      }
    }
  }

  playPedalClick(speedRatio = 0.5) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    const freq = 420 + speedRatio * 280 + Math.random() * 40;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.028);

    g.gain.setValueAtTime(0.012 + speedRatio * 0.02, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Realistic tire rubber screech and skid friction on asphalt
  playBrake(emergency = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastBrakeTime < 0.15) return;
    this.lastBrakeTime = now;

    const dur = emergency ? 0.48 : 0.24;

    // High frequency tire rubber friction noise with bandpass filtering
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.6));
    }
    const node = this.ctx.createBufferSource();
    node.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 5.5;
    filter.frequency.setValueAtTime(emergency ? 1850 : 1200, now);
    filter.frequency.linearRampToValueAtTime(emergency ? 900 : 650, now + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(emergency ? 0.16 : 0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    node.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    node.start(now);

    // Chassis rubber shudder oscillator
    const osc = this.ctx.createOscillator();
    const oscG = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(emergency ? 240 : 180, now);
    osc.frequency.linearRampToValueAtTime(95, now + dur);
    oscG.gain.setValueAtTime(emergency ? 0.07 : 0.035, now);
    oscG.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(oscG);
    oscG.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur);
  }

  // Realistic high-caliber pistol gunshot: Supersonic crack + explosive gunpowder blast + chamber click
  playGunshot() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // 1. Supersonic bullet crack transient (Sharp, high-frequency muzzle blast)
    const crackLen = Math.floor(this.ctx.sampleRate * 0.045);
    const crackBuf = this.ctx.createBuffer(1, crackLen, this.ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackLen * 0.15));
    }
    const crackNode = this.ctx.createBufferSource();
    crackNode.buffer = crackBuf;
    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.value = 2800;
    crackFilter.Q.value = 3.2;

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.42, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    crackNode.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);
    crackNode.start(now);

    // 2. Heavy explosive gunpowder ignition thump (Concussive bass punch)
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(460, now);
    thump.frequency.exponentialRampToValueAtTime(42, now + 0.22);

    thumpGain.gain.setValueAtTime(0.38, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thump.start(now);
    thump.stop(now + 0.22);

    // 3. Mechanical slide & open-air ricochet resonance (50ms - 260ms)
    const echoOsc = this.ctx.createOscillator();
    const echoGain = this.ctx.createGain();
    echoOsc.type = 'sine';
    echoOsc.frequency.setValueAtTime(880, now + 0.03);
    echoOsc.frequency.exponentialRampToValueAtTime(320, now + 0.26);

    echoGain.gain.setValueAtTime(0.001, now);
    echoGain.gain.setValueAtTime(0.08, now + 0.03);
    echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    echoOsc.connect(echoGain);
    echoGain.connect(this.masterGain);
    echoOsc.start(now + 0.03);
    echoOsc.stop(now + 0.26);
  }

  // Realistic baseball bat swing: Displaced air compression whoosh
  playBatSwing() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = 0.26;

    // Filtered aerodynamic turbulence whoosh
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const node = this.ctx.createBufferSource();
    node.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.5;
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.linearRampToValueAtTime(620, now + 0.11);
    filter.frequency.linearRampToValueAtTime(110, now + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.02, now);
    g.gain.linearRampToValueAtTime(0.24, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    node.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    node.start(now);
  }

  // Realistic solid hardwood bat impact: Sharp acoustic wood snap + hollow wood resonance + heavy kinetic thud
  playBatHit() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // 1. Sharp hardwood crack transient (Ash/Maple wood strike)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(540, now);
    snapOsc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

    snapGain.gain.setValueAtTime(0.32, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.06);

    // 2. Hollow wood body resonance ring
    const woodOsc = this.ctx.createOscillator();
    const woodFilter = this.ctx.createBiquadFilter();
    const woodGain = this.ctx.createGain();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(420, now);
    woodOsc.frequency.exponentialRampToValueAtTime(260, now + 0.16);

    woodFilter.type = 'bandpass';
    woodFilter.frequency.value = 520;
    woodFilter.Q.value = 6.0; // High resonant Q for realistic solid wood tone

    woodGain.gain.setValueAtTime(0.35, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    woodOsc.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodGain.connect(this.masterGain);
    woodOsc.start(now);
    woodOsc.stop(now + 0.16);

    // 3. Heavy physical blunt shock thud
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(140, now);
    thud.frequency.exponentialRampToValueAtTime(38, now + 0.22);
    thudGain.gain.setValueAtTime(0.30, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    thud.connect(thudGain);
    thudGain.connect(this.masterGain);
    thud.start(now);
    thud.stop(now + 0.22);
  }

  // Realistic grenade explosion: Detonation crack + earth-shaking shockwave + rolling thunder
  playGrenadeExplode() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = 0.85;

    // Sub-bass detonation concussion
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + dur);

    subGain.gain.setValueAtTime(0.48, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + dur);

    // Rolling explosive noise wave
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.38));
    }
    const node = this.ctx.createBufferSource();
    node.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(55, now + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.45, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    node.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    node.start(now);
  }

  // Realistic poop/mud splat: Viscous sloppy wet squelch & comedic slap
  playPoopSplat() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Frequency-modulated liquid slosh
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.linearRampToValueAtTime(140, now + 0.22);
    filter.Q.value = 5.0; // Bubbling liquid resonance

    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Realistic net swish: Whistling rope cord throw & high-tension snap
  playNetSwish() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.24);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playPoisonCough() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    this.playCoughChirp(now, 260);
    this.playCoughChirp(now + 0.14, 210);
  }

  playCoughChirp(time, baseFreq) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, time + 0.09);

    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 3;

    g.gain.setValueAtTime(0.14, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Cosmic spatial wormhole resonance with rising harmonics
  playPortalWarp() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(1850, now + 0.40);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.55);

    g.gain.setValueAtTime(0.15, now);
    g.gain.linearRampToValueAtTime(0.25, now + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  // Aerodynamic boost flare / afterburner spool
  playBoostFlare() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(1350, now + 0.38);

    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Realistic professional camera shutter snapshot (mirror click + curtain release)
  playCameraShutter() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Click 1: Mirror flip up
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(280, now + 0.025);
    g1.gain.setValueAtTime(0.28, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc1.connect(g1);
    g1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.03);

    // Click 2: Shutter curtain snap
    const t2 = now + 0.045;
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, t2);
    osc2.frequency.exponentialRampToValueAtTime(160, t2 + 0.035);
    g2.gain.setValueAtTime(0.32, t2);
    g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.035);
    osc2.connect(g2);
    g2.connect(this.masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.04);
  }

  playItemPickup() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [587, 740, 880]; // D5, F#5, A5
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  playCheer() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Layered crowd cheer
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      const base = 480 + i * 110;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.linearRampToValueAtTime(base * 1.3, now + 0.25);
      osc.frequency.linearRampToValueAtTime(base * 0.9, now + 0.5);

      g.gain.setValueAtTime(0.025, now);
      g.gain.linearRampToValueAtTime(0.05, now + 0.25);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  playVictory() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Grand celebratory fanfare: C5, E5, G5, C6
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }

  playSlipstream() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Aerodynamic slipstream vacuum whoosh using filtered noise buffer
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.45);
      filter.Q.setValueAtTime(4.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.45);
    } catch (_) {}
  }

  playNitroBoost() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // High-thrust supersonic afterburner ignition + flare
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(260, now + 0.2);
    subOsc.frequency.exponentialRampToValueAtTime(140, now + 0.8);
    subGain.gain.setValueAtTime(0.12, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.8);

    // Jet rushing sizzle
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.35;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.linearRampToValueAtTime(3200, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.7);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.7);
    } catch (_) {}
  }

  playDriftSkid() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Modulated tire friction screech on asphalt
    const osc = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.linearRampToValueAtTime(460, now + 0.35);

    mod.type = 'square';
    mod.frequency.setValueAtTime(38, now);
    modGain.gain.setValueAtTime(120, now);

    mod.connect(osc.frequency);
    osc.connect(g);

    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.06, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    g.connect(this.masterGain);
    mod.start(now);
    osc.start(now);
    mod.stop(now + 0.35);
    osc.stop(now + 0.35);
  }

  tone(f, d = 0.15, volume = 0.04) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(35, f / 2), now + d);
    g.gain.setValueAtTime(volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + d);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + d);
  }
}

export const soundEngine = new SoundEngine();

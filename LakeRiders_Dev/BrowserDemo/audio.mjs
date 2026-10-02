// LakeRiders Web Audio Synthesizer Engine (Phase 11 / Authentic QQ Speed Lobby & Racing BGM)
// Pure procedural multi-channel synthesis without external audio file dependencies.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ALIASES = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
const NOTE_FREQS = {};
for (let octave = 1; octave <= 7; octave++) {
  for (let i = 0; i < 12; i++) {
    const semitone = (octave - 4) * 12 + i - 9; // A4 is 440 Hz
    const freq = Math.round(440 * Math.pow(2, semitone / 12) * 100) / 100;
    NOTE_FREQS[NOTE_NAMES[i] + octave] = freq;
  }
}
for (const [flat, sharp] of Object.entries(ALIASES)) {
  for (let octave = 1; octave <= 7; octave++) {
    NOTE_FREQS[flat + octave] = NOTE_FREQS[sharp + octave];
  }
}

// 2 Iconic QQ Speed Lobby Tracks (2首大厅音乐 - 官方游戏内置原声)
export const QQ_LOBBY_TRACKS = [
  {
    id: 'lobby-loves-me-not',
    title: 'Loves Me Not',
    artist: 't.A.T.u.',
    category: 'lobby',
    categoryName: '大厅音乐',
    subtitle: 'QQ飞车经典第一大厅神曲 · 原声内置',
    builtinUrl: './assets/music/loves_me_not.mp3',
    builtinName: 't.A.T.u. - Loves Me Not',
    duration: '3:12',
    bpm: 128,
    drumStyle: 'four-on-the-floor',
    bass: ['E3','E3','E3','E3', 'C3','C3','C3','C3', 'G3','G3','G3','G3', 'D3','D3','D3','D3'],
    melody: [
      'B4','E5','G5','E5', 'B4','E5','G5','E5', 'B5','A5','G5','F#5', 'E5','D5','E5','G5',
      'C5','E5','G5','E5', 'C5','E5','G5','E5', 'G5','A5','B5','A5', 'G5','E5','G5','E5',
      'B4','D5','G5','D5', 'B4','D5','G5','D5', 'D6','B5','G5','A5', 'B5','A5','G5','D5',
      'A4','D5','F#5','D5', 'A4','D5','F#5','D5', 'A5','G5','F#5','E5', 'D5','F#5','E5','D5'
    ],
    chords: [['E4','G4','B4'], ['C4','E4','G4'], ['G4','B4','D5'], ['D4','F#4','A4']]
  },
  {
    id: 'lobby-right-now',
    title: 'Right Now (Na Na Na)',
    artist: 'Akon (阿肯)',
    category: 'lobby',
    categoryName: '大厅音乐',
    subtitle: 'QQ飞车经典动感大厅 · 原声内置',
    builtinUrl: './assets/music/right_now.mp3',
    builtinName: 'Akon - Right Now (Na Na Na)',
    duration: '4:01',
    bpm: 130,
    drumStyle: 'four-on-the-floor',
    bass: ['F#2','F#2','A2','F#2', 'D3','D3','F#3','D3', 'A2','A2','C#3','A2', 'E2','E2','G#2','E2'],
    melody: [
      'C#5','C#5','C#5','B4', 'A4','B4','C#5','A4', 'C#5','C#5','B4','A4', 'B4','C#5','B4','A4',
      'D5','D5','D5','C#5', 'B4','C#5','D5','B4', 'D5','D5','C#5','B4', 'C#5','D5','C#5','B4',
      'C#5','E5','E5','C#5', 'A4','B4','C#5','E5', 'E5','F#5','E5','C#5', 'B4','A4','B4','C#5',
      'B4','B4','B4','A4', 'G#4','A4','B4','G#4', 'A4','B4','C#5','B4', 'A4','G#4','A4','B4'
    ],
    chords: [['F#4','A4','C#5'], ['D4','F#4','A4'], ['A4','C#5','E5'], ['E4','G#4','B4']]
  }
];

// 2+ Iconic QQ Speed In-Game Racing Tracks (2首骑行比赛狂飙音乐 - 官方游戏内置原声)
export const QQ_RACE_TRACKS = [
  {
    id: 'race-let-you-go',
    title: 'Let You Go',
    artist: 'Ashley Parker Angel',
    category: 'race',
    categoryName: '比赛音乐',
    subtitle: '秋名山/十一城第一狂飙战歌 · 原声内置',
    builtinUrl: './assets/music/let_you_go.mp3',
    builtinName: 'Ashley Parker Angel - Let U Go',
    duration: '3:40',
    bpm: 152,
    drumStyle: 'rock-driving',
    bass: ['B2','B2','B2','B2', 'G2','G2','G2','G2', 'D3','D3','D3','D3', 'A2','A2','A2','A2'],
    melody: [
      'F#5','F#5','F#5','E5', 'D5','B4','D5','E5', 'F#5','F#5','E5','D5', 'F#5','A5','F#5','E5',
      'G5','G5','G5','F#5', 'E5','D5','B4','D5', 'G5','A5','B5','A5', 'G5','F#5','E5','D5',
      'A5','A5','F#5','E5', 'D5','F#5','A5','D6', 'C#6','B5','A5','F#5', 'E5','D5','E5','F#5',
      'E5','E5','D5','C#5', 'B4','A4','B4','C#5', 'D5','E5','F#5','A5', 'F#5','E5','D5','B4'
    ],
    chords: [['B3','D4','F#4'], ['G3','B3','D4'], ['D4','F#4','A4'], ['A3','C#4','E4']]
  },
  {
    id: 'race-numb',
    title: 'Numb',
    artist: 'Linkin Park (林肯公园)',
    category: 'race',
    categoryName: '比赛音乐',
    subtitle: 'QQ飞车神级高燃战歌 · 原声内置',
    builtinUrl: './assets/music/numb.mp3',
    builtinName: 'Linkin Park - Numb',
    duration: '3:07',
    bpm: 112,
    drumStyle: 'rock-driving',
    bass: ['E2','E2','E2','E2', 'C2','C2','C2','C2', 'G2','G2','G2','G2', 'D2','D2','D2','D2'],
    melody: [
      // Intro synth hook & verse
      'E5','G5','F#5','D5', 'E5','G5','F#5','D5', 'E5','D5','B4','G4', 'A4','B4','G4','E4',
      // Verse build-up
      'C5','E5','D5','B4', 'C5','E5','D5','B4', 'C5','B4','A4','G4', 'A4','B4','A4','G4',
      // Chorus: "I've become so numb, I can't feel you there..."
      'E5','E5','D5','C5', 'B4','B4','C5','B4', 'E5','E5','D5','C5', 'B4','A4','B4','A4',
      // Chorus 2: "Become so tired, so much more aware... Is be more like me..."
      'A4','B4','C5','D5', 'C5','B4','A4','G4', 'G4','A4','B4','A4', 'G4','F#4','E4','E4'
    ],
    chords: [['E3','G3','B3'], ['C3','E3','G3'], ['G3','B3','D4'], ['D3','F#3','A3']]
  },
  {
    id: 'race-faint',
    title: 'Faint',
    artist: 'Linkin Park (林肯公园)',
    category: 'race',
    categoryName: '比赛音乐',
    subtitle: '极致爆裂狂飙双喷战歌 · 原声内置',
    builtinUrl: './assets/music/faint.mp3',
    builtinName: 'Linkin Park - Faint',
    duration: '2:42',
    bpm: 135,
    drumStyle: 'rock-driving',
    bass: ['D2','D2','D2','D2', 'F2','F2','F2','F2', 'C2','C2','C2','C2', 'G2','G2','G2','G2'],
    melody: [
      'D5','D5','F5','E5', 'D5','D5','C5','A4', 'D5','D5','F5','G5', 'F5','E5','D5','C5',
      'D5','F5','A5','G5', 'F5','D5','F5','E5', 'D5','F5','G5','A5', 'G5','F5','E5','D5'
    ],
    chords: [['D3','F3','A3'], ['F3','A3','C4'], ['C3','E3','G3'], ['G3','B3','D4']]
  }
];

// Unified BGM Tracks list for backwards compatibility
export const BGM_TRACKS = [...QQ_LOBBY_TRACKS, ...QQ_RACE_TRACKS];

// IndexedDB persistence for user-uploaded genuine MP3 / audio files
const AUDIO_DB_NAME = 'LakeRiders_Audio_V2';
const AUDIO_STORE_NAME = 'user_audio_tracks';

function openAudioDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const req = indexedDB.open(AUDIO_DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

export async function saveAudioToStorage(trackId, fileOrBlob, metadata = {}) {
  const db = await openAudioDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(AUDIO_STORE_NAME);
      const record = {
        id: trackId,
        blob: fileOrBlob,
        name: metadata.name || fileOrBlob.name || trackId,
        size: fileOrBlob.size,
        type: fileOrBlob.type || 'audio/mpeg',
        updatedAt: Date.now()
      };
      store.put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

export async function removeAudioFromStorage(trackId) {
  const db = await openAudioDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(AUDIO_STORE_NAME);
      store.delete(trackId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

export async function loadAllAudioFromStorage() {
  const db = await openAudioDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(AUDIO_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (_) {
      resolve([]);
    }
  });
}

export class RacingBgmPlayer {
  constructor(soundEngine) {
    this.engine = soundEngine;
    this.mode = 'lobby'; // 'lobby' | 'race'
    this.lobbyIndex = 0;
    this.raceIndex = 0;
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.stepIndex = 0;
    this.nextStepTime = 0;
    this.timerId = null;
    this.bgmGain = null;
    this.lookahead = 0.04; // 40ms
    this.scheduleAheadTime = 0.2; // 200ms
    this._snareNoiseBuf = null;
    this._hihatNoiseBuf = null;
    this._renderedBuffers = {};
    this._activeSource = null;
    this._renderingPromises = {};

    // HTML5 Real Audio Player for user-uploaded MP3/WAV/etc.
    this._htmlAudio = null;
    this.userVolume = 0.85;
    this.customAudioMap = new Map(); // trackId -> { url, blob, name, size }
    this._dbLoaded = false;
    this._loadPersistedAudios();
  }

  async _loadPersistedAudios() {
    try {
      const records = await loadAllAudioFromStorage();
      for (const rec of records) {
        if (rec.id && rec.blob) {
          const url = URL.createObjectURL(rec.blob);
          this.customAudioMap.set(rec.id, {
            url,
            blob: rec.blob,
            name: rec.name,
            size: rec.size,
            updatedAt: rec.updatedAt
          });
        }
      }
      this._dbLoaded = true;
    } catch (e) {
      console.warn('Load persisted audio tracks failed:', e);
    }
  }

  init(ctx, masterGain) {
    if (!ctx || !masterGain) return;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = 0.24;
    this.bgmGain.connect(masterGain);

    const snareLen = Math.floor(ctx.sampleRate * 0.12);
    this._snareNoiseBuf = ctx.createBuffer(1, snareLen, ctx.sampleRate);
    const sData = this._snareNoiseBuf.getChannelData(0);
    for (let i = 0; i < snareLen; i++) {
      sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snareLen * 0.28));
    }

    const hihatLen = Math.floor(ctx.sampleRate * 0.035);
    this._hihatNoiseBuf = ctx.createBuffer(1, hihatLen, ctx.sampleRate);
    const hData = this._hihatNoiseBuf.getChannelData(0);
    for (let i = 0; i < hihatLen; i++) {
      hData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (hihatLen * 0.2));
    }

    // Pre-render primary tracks
    this._renderTrackBuffer(QQ_LOBBY_TRACKS[0]).catch(() => {});
    this._renderTrackBuffer(QQ_RACE_TRACKS[0]).catch(() => {});
  }

  get activeList() {
    return this.mode === 'race' ? QQ_RACE_TRACKS : QQ_LOBBY_TRACKS;
  }

  get activeIndex() {
    return this.mode === 'race' ? this.raceIndex : this.lobbyIndex;
  }

  setMode(newMode, autoPlay = true, randomize = true) {
    const validMode = (newMode === 'race') ? 'race' : 'lobby';
    const list = (validMode === 'race') ? QQ_RACE_TRACKS : QQ_LOBBY_TRACKS;
    if (randomize && list.length > 0) {
      const randIdx = Math.floor(Math.random() * list.length);
      if (validMode === 'race') {
        this.raceIndex = randIdx;
      } else {
        this.lobbyIndex = randIdx;
      }
    }
    this.mode = validMode;
    if (this.isPlaying || autoPlay) {
      this.start(this.activeIndex, this.mode);
    }
  }

  async _renderTrackBuffer(track) {
    if (!track) return null;
    const cacheKey = track.id;
    if (this._renderedBuffers[cacheKey]) return this._renderedBuffers[cacheKey];
    if (this._renderingPromises[cacheKey]) return this._renderingPromises[cacheKey];

    const OfflineCtxClass = typeof window !== 'undefined' && (window.OfflineAudioContext || window.webkitOfflineAudioContext);
    if (!OfflineCtxClass) return null;

    const bpm = track.bpm;
    const stepDuration = (60 / bpm) / 4;
    const totalSteps = 64; // 4-bar loop
    const totalDuration = totalSteps * stepDuration;
    const sampleRate = this.engine.ctx?.sampleRate || 44100;

    this._renderingPromises[cacheKey] = (async () => {
      try {
        const offCtx = new OfflineCtxClass(2, Math.ceil(sampleRate * totalDuration), sampleRate);
        const snareLen = Math.floor(sampleRate * 0.12);
        const sBuf = offCtx.createBuffer(1, snareLen, sampleRate);
        const sD = sBuf.getChannelData(0);
        for (let i = 0; i < snareLen; i++) sD[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snareLen * 0.28));

        const hihatLen = Math.floor(sampleRate * 0.035);
        const hBuf = offCtx.createBuffer(1, hihatLen, sampleRate);
        const hD = hBuf.getChannelData(0);
        for (let i = 0; i < hihatLen; i++) hD[i] = (Math.random() * 2 - 1) * Math.exp(-i / (hihatLen * 0.2));

        const bus = offCtx.createGain();
        bus.gain.value = 1.0;
        bus.connect(offCtx.destination);

        const drumStyle = track.drumStyle || 'four-on-the-floor';

        for (let step = 0; step < totalSteps; step++) {
          const t = step * stepDuration;

          let isKick = false, isSnare = false;
          if (drumStyle === 'rock-driving') {
            isKick = (step % 8 === 0) || (step % 8 === 3) || (step % 16 === 10);
            isSnare = (step % 8 === 4) || (step % 16 === 14);
          } else if (drumStyle === 'hiphop-heavy') {
            isKick = (step % 16 === 0) || (step % 16 === 6) || (step % 16 === 10);
            isSnare = (step % 16 === 4) || (step % 16 === 12);
          } else if (drumStyle === 'rnb-groove') {
            isKick = (step % 16 === 0) || (step % 16 === 10);
            isSnare = (step % 16 === 4) || (step % 16 === 12);
          } else {
            isKick = (step % 4 === 0);
            isSnare = (step % 8 === 4) || (step % 16 === 15);
          }

          if (isKick) {
            const osc = offCtx.createOscillator(), g = offCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(drumStyle === 'hiphop-heavy' ? 120 : 145, t);
            osc.frequency.exponentialRampToValueAtTime(drumStyle === 'hiphop-heavy' ? 28 : 36, t + 0.10);
            g.gain.setValueAtTime(0.38, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.13);
          }

          if (isSnare) {
            const node = offCtx.createBufferSource(); node.buffer = sBuf;
            const flt = offCtx.createBiquadFilter(); flt.type = 'highpass'; flt.frequency.value = 950;
            const g = offCtx.createGain(); g.gain.setValueAtTime(0.20, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            node.connect(flt); flt.connect(g); g.connect(bus); node.start(t);

            const osc = offCtx.createOscillator(), og = offCtx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(185, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
            og.gain.setValueAtTime(0.12, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(og); og.connect(bus); osc.start(t); osc.stop(t + 0.08);
          }

          // Hi-hat
          const accented = (step % 2 === 1);
          const hNode = offCtx.createBufferSource(); hNode.buffer = hBuf;
          const hFlt = offCtx.createBiquadFilter(); hFlt.type = 'bandpass'; hFlt.frequency.value = 7500; hFlt.Q.value = 3;
          const hGain = offCtx.createGain(); hGain.gain.setValueAtTime(accented ? 0.045 : 0.025, t);
          hGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.035);
          hNode.connect(hFlt); hFlt.connect(hGain); hGain.connect(bus); hNode.start(t);

          // Bass
          const bassNote = track.bass[step % track.bass.length];
          if (bassNote && NOTE_FREQS[bassNote]) {
            const bOsc = offCtx.createOscillator(), bFlt = offCtx.createBiquadFilter(), bG = offCtx.createGain();
            bOsc.type = 'sawtooth'; bOsc.frequency.setValueAtTime(NOTE_FREQS[bassNote], t);
            bFlt.type = 'lowpass'; bFlt.Q.value = 4.5; bFlt.frequency.setValueAtTime(850, t);
            bFlt.frequency.exponentialRampToValueAtTime(240, t + stepDuration * 0.85);
            bG.gain.setValueAtTime(0.22, t); bG.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.85);
            bOsc.connect(bFlt); bFlt.connect(bG); bG.connect(bus); bOsc.start(t); bOsc.stop(t + stepDuration * 0.85);
          }

          // Melody Hook
          const leadNote = track.melody[step % track.melody.length];
          if (leadNote && NOTE_FREQS[leadNote]) {
            const lFreq = NOTE_FREQS[leadNote], lDur = stepDuration * 1.5;
            const lOsc = offCtx.createOscillator(), lSub = offCtx.createOscillator(), lFlt = offCtx.createBiquadFilter(), lG = offCtx.createGain();
            lOsc.type = (track.category === 'race') ? 'sawtooth' : 'square';
            lOsc.frequency.setValueAtTime(lFreq, t);
            lSub.type = 'sawtooth'; lSub.frequency.setValueAtTime(lFreq * 0.5, t);
            lFlt.type = 'lowpass'; lFlt.frequency.setValueAtTime(2400, t); lFlt.Q.value = 2.2;
            lG.gain.setValueAtTime(0.13, t); lG.gain.exponentialRampToValueAtTime(0.001, t + lDur);
            lOsc.connect(lFlt); lSub.connect(lFlt); lFlt.connect(lG); lG.connect(bus);
            lOsc.start(t); lSub.start(t); lOsc.stop(t + lDur); lSub.stop(t + lDur);
          }

          // Chords
          if (step % 16 === 0) {
            const chord = track.chords[Math.floor(step / 16) % track.chords.length];
            const cDur = stepDuration * 16 * 0.9;
            for (const n of (chord || [])) {
              if (!NOTE_FREQS[n]) continue;
              const cOsc = offCtx.createOscillator(), cG = offCtx.createGain();
              cOsc.type = 'triangle'; cOsc.frequency.setValueAtTime(NOTE_FREQS[n], t);
              cG.gain.setValueAtTime(0.001, t); cG.gain.linearRampToValueAtTime(0.025, t + 0.15);
              cG.gain.exponentialRampToValueAtTime(0.0005, t + cDur);
              cOsc.connect(cG); cG.connect(bus); cOsc.start(t); cOsc.stop(t + cDur);
            }
          }
        }

        const rendered = await offCtx.startRendering();
        this._renderedBuffers[cacheKey] = rendered;
        return rendered;
      } catch (err) {
        console.warn('Offline BGM rendering fallback:', err);
        return null;
      }
    })();

    return this._renderingPromises[cacheKey];
  }

  start(trackIndex, mode = this.mode) {
    if (!this.engine.ctx) return;
    this.stop();
    this.mode = mode;
    const list = this.activeList;
    if (typeof trackIndex === 'number') {
      const idx = (trackIndex + list.length) % list.length;
      if (this.mode === 'race') this.raceIndex = idx;
      else this.lobbyIndex = idx;
    }
    this.currentTrackIndex = this.activeIndex;
    const track = list[this.activeIndex];
    this.isPlaying = true;

    // 1. Check if user has uploaded real MP3 audio for this track
    const customAudio = this.customAudioMap.get(track.id);
    if (customAudio && customAudio.url) {
      this._playRealAudio(customAudio.url);
      return;
    }

    // 2. Play official game built-in MP3 original track
    if (track.builtinUrl) {
      this._playRealAudio(track.builtinUrl);
      return;
    }

    // Check if offline rendered buffer is available
    const existing = this._renderedBuffers[track.id];
    if (existing) {
      this._playLoopBuffer(existing);
      return;
    }

    // Try pre-rendering and playing, with immediate fallback to step sequencer
    this._renderTrackBuffer(track).then(buf => {
      if (this.isPlaying && buf && !this.customAudioMap.has(track.id) && !track.builtinUrl) {
        if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
        this._playLoopBuffer(buf);
      }
    }).catch(() => {});

    // Fallback: start step sequencer until buffer is ready
    this.stepIndex = 0;
    this.nextStepTime = this.engine.ctx.currentTime + 0.05;
    this._scheduler();
  }

  _playRealAudio(url) {
    if (this._activeSource) {
      try { this._activeSource.stop(); this._activeSource.disconnect(); } catch (e) {}
      this._activeSource = null;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (!this._htmlAudio) {
      this._htmlAudio = new Audio();
      this._htmlAudio.loop = true;
      this._htmlAudio.preload = 'auto';
      this._htmlAudio.addEventListener('ended', () => {
        if (this.isPlaying) {
          this.nextTrack();
        }
      });
    }
    this._syncRealAudioVolume();

    // Check if same URL
    const isSameUrl = (this._htmlAudio.src === url || (this._htmlAudio.src && this._htmlAudio.src.endsWith(url.replace(/^\.\//, ''))));
    if (!isSameUrl) {
      this._htmlAudio.src = url;
    }
    this._htmlAudio.currentTime = 0;

    const playPromise = this._htmlAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Real audio playback auto-play interaction required:', err);
        const unlock = () => {
          if (this.isPlaying && this._htmlAudio) {
            this._htmlAudio.play().catch(() => {});
          }
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: true, passive: true });
        window.addEventListener('keydown', unlock, { once: true, passive: true });
        window.addEventListener('touchstart', unlock, { once: true, passive: true });
      });
    }
  }

  _syncRealAudioVolume() {
    if (!this._htmlAudio) return;
    const masterVol = (this.engine && typeof this.engine.masterVolume === 'number') ? this.engine.masterVolume : 0.85;
    const isMuted = !!(this.engine && this.engine.muted);
    this._htmlAudio.volume = isMuted ? 0 : Math.max(0, Math.min(1, this.userVolume * masterVol));
  }

  setVolume(vol) {
    this.userVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    this._syncRealAudioVolume();
  }

  getTrackById(trackId) {
    return BGM_TRACKS.find(t => t.id === trackId);
  }

  hasRealAudio(trackId) {
    if (this.customAudioMap.has(trackId)) return true;
    const track = this.getTrackById(trackId);
    return !!(track && track.builtinUrl);
  }

  getRealAudioInfo(trackId) {
    if (this.customAudioMap.has(trackId)) {
      const custom = this.customAudioMap.get(trackId);
      return {
        isCustom: true,
        isBuiltin: false,
        name: custom.name || '自定义原声 MP3',
        size: custom.size,
        updatedAt: custom.updatedAt,
        url: custom.url
      };
    }
    const track = this.getTrackById(trackId);
    if (track && track.builtinUrl) {
      return {
        isCustom: false,
        isBuiltin: true,
        name: track.builtinName || `${track.title} - ${track.artist} (官方内置原声)`,
        url: track.builtinUrl
      };
    }
    return null;
  }

  async attachRealAudio(trackId, fileOrBlob, name = '') {
    try {
      const url = URL.createObjectURL(fileOrBlob);
      const record = {
        url,
        blob: fileOrBlob,
        name: name || fileOrBlob.name || trackId,
        size: fileOrBlob.size,
        updatedAt: Date.now()
      };
      this.customAudioMap.set(trackId, record);
      await saveAudioToStorage(trackId, fileOrBlob, { name: record.name });
      const currentTrack = this.getCurrentTrack();
      if (this.isPlaying && currentTrack && currentTrack.id === trackId) {
        this._playRealAudio(url);
      }
      return true;
    } catch (e) {
      console.error('attachRealAudio failed:', e);
      return false;
    }
  }

  async removeRealAudio(trackId) {
    try {
      const existing = this.customAudioMap.get(trackId);
      if (existing && existing.url) {
        try { URL.revokeObjectURL(existing.url); } catch (_) {}
      }
      this.customAudioMap.delete(trackId);
      await removeAudioFromStorage(trackId);
      const currentTrack = this.getCurrentTrack();
      if (this.isPlaying && currentTrack && currentTrack.id === trackId) {
        this.start(this.activeIndex, this.mode);
      }
      return true;
    } catch (e) {
      console.error('removeRealAudio failed:', e);
      return false;
    }
  }

  _playLoopBuffer(buf) {
    if (!this.bgmGain || !this.engine.ctx || !buf) return;
    if (this._activeSource) {
      try { this._activeSource.stop(); this._activeSource.disconnect(); } catch (e) {}
    }
    const source = this.engine.ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.connect(this.bgmGain);
    source.start(0);
    this._activeSource = source;
  }

  stop() {
    this.isPlaying = false;
    if (this._htmlAudio) {
      try { this._htmlAudio.pause(); } catch (e) {}
    }
    if (this._activeSource) {
      try { this._activeSource.stop(); this._activeSource.disconnect(); } catch (e) {}
      this._activeSource = null;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  nextTrack() {
    const list = this.activeList;
    const nextIdx = (this.activeIndex + 1) % list.length;
    this.start(nextIdx, this.mode);
    return this.getCurrentTrack();
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
    const list = this.activeList;
    return list[this.activeIndex] || list[0];
  }

  getCurrentTrackInfo() {
    return this.getCurrentTrack();
  }

  startTrack(trackIndex = this.activeIndex) {
    return this.start(trackIndex, this.mode);
  }

  _scheduler() {
    if (!this.isPlaying || !this.engine.ctx) return;
    const ctx = this.engine.ctx;
    const track = this.getCurrentTrack();
    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this._scheduleStep(this.stepIndex, this.nextStepTime, track);
      const stepDuration = (60 / track.bpm) / 4; // 16th note step
      this.nextStepTime += stepDuration;
      this.stepIndex = (this.stepIndex + 1) % (track.melody.length);
    }
    this.timerId = setTimeout(() => this._scheduler(), this.lookahead * 1000);
  }

  _scheduleStep(step, time, track) {
    if (!this.bgmGain || this.engine.muted) return;
    const ctx = this.engine.ctx;
    const drumStyle = track.drumStyle || 'four-on-the-floor';

    let isKick = false, isSnare = false;
    if (drumStyle === 'rock-driving') {
      isKick = (step % 8 === 0) || (step % 8 === 3) || (step % 16 === 10);
      isSnare = (step % 8 === 4) || (step % 16 === 14);
    } else if (drumStyle === 'hiphop-heavy') {
      isKick = (step % 16 === 0) || (step % 16 === 6) || (step % 16 === 10);
      isSnare = (step % 16 === 4) || (step % 16 === 12);
    } else if (drumStyle === 'rnb-groove') {
      isKick = (step % 16 === 0) || (step % 16 === 10);
      isSnare = (step % 16 === 4) || (step % 16 === 12);
    } else {
      isKick = (step % 4 === 0);
      isSnare = (step % 8 === 4) || (step % 16 === 15);
    }

    if (isKick) this._playKick(time);
    if (isSnare) this._playSnare(time);
    this._playHihat(time, (step % 2 === 1) ? 0.045 : 0.025);

    const bassNote = track.bass[step % track.bass.length];
    if (bassNote && NOTE_FREQS[bassNote]) {
      this._playSynthBass(NOTE_FREQS[bassNote], time, (60 / track.bpm) / 4 * 0.85);
    }

    const leadNote = track.melody[step % track.melody.length];
    if (leadNote && NOTE_FREQS[leadNote]) {
      this._playSynthLead(NOTE_FREQS[leadNote], time, (60 / track.bpm) / 4 * 1.5);
    }

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
    // Noise snap using reusable pre-generated buffer
    const buf = this._snareNoiseBuf || (() => {
      const len = Math.floor(ctx.sampleRate * 0.12);
      const b = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.28));
      return (this._snareNoiseBuf = b);
    })();
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
    // Noise using reusable pre-generated buffer
    const buf = this._hihatNoiseBuf || (() => {
      const len = Math.floor(ctx.sampleRate * 0.035);
      const b = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.2));
      return (this._hihatNoiseBuf = b);
    })();
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
    const AudioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
      (typeof globalThis !== 'undefined' && globalThis.AudioContext) || null;
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

  setBgmMode(mode, autoPlay = true, randomize = true) {
    this.init();
    this.bgmPlayer.setMode(mode, autoPlay, randomize);
  }

  startBgm(trackIndex = 0, mode = undefined) {
    this.init();
    if (mode) this.bgmPlayer.mode = mode;
    this.bgmPlayer.start(trackIndex, this.bgmPlayer.mode);
  }

  startLobbyBgm(trackIndex = 0) {
    this.init();
    this.bgmPlayer.setMode('lobby', false);
    this.bgmPlayer.start(trackIndex, 'lobby');
  }

  startRaceBgm(trackIndex = 0) {
    this.init();
    this.bgmPlayer.setMode('race', false);
    this.bgmPlayer.start(trackIndex, 'race');
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

  getBgmInfo() {
    return this.bgmPlayer.getCurrentTrack();
  }

  isBgmPlaying() {
    return this.bgmPlayer.isPlaying;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
    if (this.bgmPlayer) {
      this.bgmPlayer._syncRealAudioVolume();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  updateAmbience(kph, pedaling = false, dt = 0.016) {
    if (!this.ctx || this.muted || !this.windGain || !this.windFilter) return;

    if (Math.abs(kph - (this._lastAmbienceKph || 0)) < 0.6) return;
    this._lastAmbienceKph = kph;

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

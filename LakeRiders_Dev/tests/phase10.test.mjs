import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RiderSimulation } from '../BrowserDemo/core.mjs';
import { SAYRAM_LANDMARKS } from '../BrowserDemo/scenery.mjs';
import { SoundEngine } from '../BrowserDemo/audio.mjs';

const tuning = JSON.parse(readFileSync(new URL('../BrowserDemo/data/tuning.json', import.meta.url), 'utf8'));

test('Phase 10: rider talents specialize acceleration, cooldowns and carried packs', () => {
  // Balanced default
  const balanced = new RiderSimulation(tuning);
  assert.equal(balanced.talent, 'balanced');
  assert.equal(balanced.packs, 2);

  // Tactician starts with 3 energy packs
  const tactician = new RiderSimulation(tuning, { talent: 'tactician' });
  assert.equal(tactician.talent, 'tactician');
  assert.equal(tactician.packs, 3);

  // Brawler has reduced melee attack cooldowns
  const brawler = new RiderSimulation(tuning, { talent: 'brawler' });
  assert.equal(brawler.talent, 'brawler');
  brawler.start();
  brawler.step(0.016, { attack: 1 }); // Punch
  assert.ok(brawler.punchLeft > 0);
  assert.ok(brawler.punchLeft <= tuning.punchCooldown * 0.8 + 0.01);

  // Sprinter reaches higher max speed than balanced rider
  const sprinter = new RiderSimulation(tuning, { talent: 'sprinter' });
  sprinter.start();
  balanced.start();
  sprinter.speed = 16.5;
  balanced.speed = 16.5;
  for (let i = 0; i < 120; i++) {
    sprinter.step(0.016, { accelerate: true });
    balanced.step(0.016, { accelerate: true });
  }
  assert.ok(sprinter.speed > balanced.speed);
});

test('Phase 10: Lake Sayram landmarks cover the full 3000m scenic loop in order', () => {
  assert.equal(SAYRAM_LANDMARKS.length, 6);

  // Must include the iconic landmarks
  const titles = SAYRAM_LANDMARKS.map(l => l.title);
  assert.ok(titles.some(t => t.includes('环湖总起点')));
  assert.ok(titles.some(t => t.includes('月亮湾')));
  assert.ok(titles.some(t => t.includes('三台古驿')));
  assert.ok(titles.some(t => t.includes('金花紫卉')));
  assert.ok(titles.some(t => t.includes('点将台')));
  assert.ok(titles.some(t => t.includes('亲水滩')));

  // Distances must be within [0, 3000] and monotonically increasing
  let lastS = -1;
  for (const lm of SAYRAM_LANDMARKS) {
    assert.ok(lm.s >= 0 && lm.s <= 3000);
    assert.ok(lm.s >= lastS);
    assert.ok(lm.title.length > 0);
    assert.ok(lm.subtitle.length > 0);
    lastS = lm.s;
  }
});

test('Phase 10: sound engine safely initializes, toggles mute and exposes all sfx handlers', () => {
  const engine = new SoundEngine();
  assert.equal(engine.muted, false);

  // Toggle mute
  const muted = engine.toggleMute();
  assert.equal(muted, true);
  assert.equal(engine.muted, true);
  engine.setMuted(false);
  assert.equal(engine.muted, false);

  // SFX triggers must be safe to call even without browser AudioContext (e.g. in test/headless mode)
  assert.doesNotThrow(() => {
    engine.init();
    engine.playBrake(true);
    engine.playBatSwing();
    engine.playBatHit();
    engine.playGunshot();
    engine.playGrenadeExplode();
    engine.playPoopSplat();
    engine.playNetSwish();
    engine.playPoisonCough();
    engine.playPortalWarp();
    engine.playItemPickup();
    engine.playCheer();
    engine.playVictory();
    engine.tone(440, 0.1, 0.05);
    engine.updateAmbience(45, false, 0.016);
  });
});

test('SoundEngine & BGM integration: uses single player instance and tracks mute/playback state', () => {
  const engine = new SoundEngine();
  assert.ok(engine.bgmPlayer, 'SoundEngine must have bgmPlayer initialized');
  assert.equal(engine.bgmPlayer.engine, engine, 'bgmPlayer must reference the host SoundEngine');
  assert.equal(engine.isBgmPlaying(), false);

  // Mute / Unmute state consistency
  assert.equal(engine.muted, false);
  const isMuted1 = engine.toggleMute();
  assert.equal(isMuted1, true);
  assert.equal(engine.muted, true);

  const isMuted2 = engine.toggleMute();
  assert.equal(isMuted2, false);
  assert.equal(engine.muted, false);

  // BGM control methods delegation
  assert.doesNotThrow(() => {
    engine.startBgm(0);
    engine.stopBgm();
    engine.toggleBgm();
    engine.stopBgm();
  });
});

test('SoundEngine AudioContext & MasterGain: verifies real click init state, Gain connection and target volume curve', () => {
  // Mock standard Web Audio API AudioContext & GainNode
  let destinationConnected = false;
  let scheduledTargetValue = null;
  const mockGainNode = {
    gain: {
      value: 1,
      setTargetAtTime: (val, time, constant) => {
        scheduledTargetValue = val;
      }
    },
    connect: (dest) => {
      destinationConnected = true;
    }
  };

  const originalAudioContext = globalThis.AudioContext;
  globalThis.AudioContext = class {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 44100;
      this.destination = {};
    }
    createGain() { return mockGainNode; }
    createBuffer(channels, length, rate) {
      return { getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      return { buffer: null, loop: false, connect: () => {}, start: () => {}, stop: () => {} };
    }
    createBiquadFilter() {
      return { type: 'lowpass', frequency: { value: 350 }, connect: () => {} };
    }
    createOscillator() {
      return { type: 'sine', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} };
    }
  };

  try {
    const engine = new SoundEngine();
    assert.equal(engine.ctx, null, 'Context uninitialized before user interaction click');
    
    // Simulate real user click triggering engine.init()
    engine.init();
    assert.ok(engine.ctx, 'AudioContext created after click');
    assert.ok(engine.masterGain, 'MasterGain created');
    assert.equal(destinationConnected, true, 'MasterGain must be connected to destination');

    // Simulate clicking mute button: toggleMute()
    engine.toggleMute();
    assert.equal(engine.muted, true, 'Engine state muted');
    assert.equal(scheduledTargetValue, 0, 'MasterGain scheduled to 0 on mute');

    // Simulate clicking unmute
    engine.toggleMute();
    assert.equal(engine.muted, false, 'Engine state unmuted');
    assert.equal(scheduledTargetValue, 0.85, 'MasterGain scheduled to 0.85 on unmute');
  } finally {
    globalThis.AudioContext = originalAudioContext;
  }
});


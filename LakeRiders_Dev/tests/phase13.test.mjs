import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRACK_SECTORS,
  SectorTimer,
  GhostRecorder,
  GhostPlayback,
  ACHIEVEMENTS,
  AchievementManager
} from '../BrowserDemo/timetrial.mjs';

test('Phase 13: TRACK_SECTORS covers 4 sequential sectors of the 3000m track', () => {
  assert.equal(TRACK_SECTORS.length, 4);
  assert.equal(TRACK_SECTORS[0].startDist, 0);
  assert.equal(TRACK_SECTORS[0].endDist, 750);
  assert.equal(TRACK_SECTORS[1].startDist, 750);
  assert.equal(TRACK_SECTORS[1].endDist, 1500);
  assert.equal(TRACK_SECTORS[2].startDist, 1500);
  assert.equal(TRACK_SECTORS[2].endDist, 2250);
  assert.equal(TRACK_SECTORS[3].startDist, 2250);
  assert.equal(TRACK_SECTORS[3].endDist, 3000);
});

test('Phase 13: SectorTimer records splits, calculates deltas and tracks personal bests', () => {
  const initialBests = { S1: 42.5, S2: 44.0 };
  const timer = new SectorTimer(initialBests);

  // Before 750m, no split
  let split = timer.onProgress(500, 28.0);
  assert.equal(split, null);

  // Cross S1 at 752m with 41.2s (faster by -1.3s)
  split = timer.onProgress(752, 41.2);
  assert.ok(split);
  assert.equal(split.sectorId, 'S1');
  assert.equal(split.sectorIndex, 1);
  assert.equal(split.splitTime, 41.2);
  assert.equal(split.isPersonalBest, true);
  assert.equal(split.delta, -1.3);

  // Calling again before S2 end does not re-trigger S1
  assert.equal(timer.onProgress(800, 45.0), null);

  // Cross S2 at 1505m with split of 45.3s (from 41.2 to 86.5 = 45.3s, slower than best 44.0 by +1.3s)
  split = timer.onProgress(1505, 86.5);
  assert.ok(split);
  assert.equal(split.sectorId, 'S2');
  assert.equal(split.sectorIndex, 2);
  assert.equal(split.splitTime, 45.3);
  assert.equal(split.isPersonalBest, false);
  assert.equal(split.delta, 1.3);

  // Cross S3 at 2260m with split 43.0s (new record for S3)
  split = timer.onProgress(2260, 129.5);
  assert.ok(split);
  assert.equal(split.sectorId, 'S3');
  assert.equal(split.isPersonalBest, true);

  // Cross S4 finish at 3000m
  split = timer.onProgress(3000, 171.0);
  assert.ok(split);
  assert.equal(split.sectorId, 'S4');
  assert.equal(split.sectorIndex, 4);

  // Formatter output
  const fast = timer.formatDelta(-1.25);
  assert.equal(fast.isFaster, true);
  assert.ok(fast.text.includes('-1.25'));

  const slow = timer.formatDelta(0.85);
  assert.equal(slow.isFaster, false);
  assert.ok(slow.text.includes('+0.85'));
});

test('Phase 13: GhostRecorder samples trajectory and serializes lap data', () => {
  const recorder = new GhostRecorder(0.1);

  // Not recording before start
  recorder.sample(0.05, 10, 1.2, -5.4, 0.1, 15);
  assert.equal(recorder.samples.length, 0);

  recorder.start();
  recorder.sample(0.0, 0, 0, 0, 0, 0);
  recorder.sample(0.05, 5, 0.2, 5.0, 0.05, 12); // ignored because dt < 0.1
  recorder.sample(0.12, 12, 0.5, 12.0, 0.08, 14);
  recorder.sample(0.24, 25, 1.0, 25.0, 0.12, 16);

  assert.equal(recorder.samples.length, 3);
  assert.equal(recorder.samples[0].t, 0);
  assert.equal(recorder.samples[1].t, 0.12);
  assert.equal(recorder.samples[2].t, 0.24);

  // Stop generates valid payload
  for (let i = 3; i <= 15; i++) {
    recorder.sample(i * 0.12, i * 15, 2, i * 15, 0.2, 20);
  }
  const payload = recorder.stop(170.5, '车手测试');
  assert.ok(payload);
  assert.equal(payload.version, 1);
  assert.equal(payload.totalTime, 170.5);
  assert.equal(payload.riderName, '车手测试');
  assert.ok(payload.samples.length >= 10);
});

test('Phase 13: GhostPlayback interpolates trajectory and calculates gap distance', () => {
  const mockGhost = {
    version: 1,
    totalTime: 10.0,
    riderName: '纪录保持者',
    samples: [
      { t: 0.0, s: 0, x: 0.0, z: 0.0, heading: 0.0, speed: 0.0 },
      { t: 2.0, s: 20, x: 10.0, z: 20.0, heading: 0.4, speed: 10.0 },
      { t: 4.0, s: 50, x: 20.0, z: 50.0, heading: 0.8, speed: 15.0 }
    ]
  };

  const playback = new GhostPlayback(mockGhost);
  assert.equal(playback.hasGhost(), false); // requires > 5 samples for full race

  // Give 6 samples
  mockGhost.samples.push(
    { t: 6.0, s: 80, x: 30.0, z: 80.0, heading: 1.0, speed: 15.0 },
    { t: 8.0, s: 120, x: 40.0, z: 120.0, heading: 1.2, speed: 16.0 },
    { t: 10.0, s: 160, x: 50.0, z: 160.0, heading: 1.2, speed: 16.0 }
  );

  playback.load(mockGhost);
  assert.equal(playback.hasGhost(), true);

  // Exact sample at t = 2.0
  const at2 = playback.sampleAt(2.0);
  assert.ok(at2);
  assert.equal(at2.x, 10.0);
  assert.equal(at2.z, 20.0);
  assert.equal(at2.s, 20);

  // Interpolated sample at t = 3.0 (halfway between t=2 and t=4)
  const at3 = playback.sampleAt(3.0);
  assert.ok(at3);
  assert.equal(at3.x, 15.0);
  assert.equal(at3.z, 35.0);
  assert.equal(at3.s, 35.0);

  // Gap calculation (if ghost is at 35m, player is at 25m, ghost is +10m ahead)
  const gap = playback.getGapMeters(25, 3.0);
  assert.equal(gap, 10);
});

test('Phase 13: AchievementManager evaluates run conditions and triggers unlocks', () => {
  const manager = new AchievementManager();
  manager.reset();

  assert.equal(ACHIEVEMENTS.length, 6);
  assert.equal(manager.getUnlockedCount(), 0);

  // Run with 66 km/h top speed & 4 hits
  const newlyUnlocked = manager.checkRunStats({
    topSpeedKph: 67.2,
    draftTime: 9.5,
    nitroUses: 3,
    hitsLanded: 4,
    finished: true,
    finishTime: 168.4,
    rank: 1
  });

  // All 6 criteria satisfied
  assert.equal(newlyUnlocked.length, 6);
  assert.equal(manager.getUnlockedCount(), 6);

  // Second check does not re-unlock
  const secondCheck = manager.checkRunStats({
    topSpeedKph: 70.0,
    draftTime: 10.0,
    nitroUses: 4,
    hitsLanded: 5,
    finished: true,
    finishTime: 160.0,
    rank: 1
  });
  assert.equal(secondCheck.length, 0);

  // Verify list
  const list = manager.getAll();
  assert.equal(list.length, 6);
  assert.ok(list.every(item => item.isUnlocked));
});

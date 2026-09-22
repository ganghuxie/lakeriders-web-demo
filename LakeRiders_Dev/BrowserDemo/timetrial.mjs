// LakeRiders Phase 13: Time Trial, Ghost Bike, Sector Splits & Achievements System

export const TRACK_SECTORS = [
  { id: 'S1', name: '月亮湾湖畔段', startDist: 0, endDist: 750, icon: '🌙' },
  { id: 'S2', name: '三台花海起伏段', startDist: 750, endDist: 1500, icon: '🌸' },
  { id: 'S3', name: '点将台险弯段', startDist: 1500, endDist: 2250, icon: '🚩' },
  { id: 'S4', name: '亲水滩冲刺段', startDist: 2250, endDist: 3000, icon: '🏁' }
];

export const SECTOR_STORAGE_KEY = 'lake-rider-sector-splits';
export const GHOST_STORAGE_KEY = 'lake-rider-ghost-lap';
export const ACHIEVEMENTS_STORAGE_KEY = 'lake-rider-achievements';

export class SectorTimer {
  constructor(initialBestSplits = null) {
    this.bestSplits = initialBestSplits || this.loadBestSplits();
    this.currentSectorIndex = 0;
    this.sectorStartTime = 0;
    this.currentRunSplits = [];
    this.passedSectors = new Set();
  }

  loadBestSplits() {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(SECTOR_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveBestSplits() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(SECTOR_STORAGE_KEY, JSON.stringify(this.bestSplits));
    } catch (err) {
      console.warn('Failed to save sector splits:', err);
    }
  }

  reset() {
    this.currentSectorIndex = 0;
    this.sectorStartTime = 0;
    this.currentRunSplits = [];
    this.passedSectors.clear();
  }

  onProgress(distance, elapsedTime) {
    if (this.currentSectorIndex >= TRACK_SECTORS.length) return null;

    const currentSector = TRACK_SECTORS[this.currentSectorIndex];
    if (distance >= currentSector.endDist && !this.passedSectors.has(currentSector.id)) {
      this.passedSectors.add(currentSector.id);

      const splitTime = Math.max(0.1, elapsedTime - this.sectorStartTime);
      const prevBest = this.bestSplits[currentSector.id];
      let delta = null;
      let isPersonalBest = false;

      if (prevBest !== undefined && prevBest !== null) {
        delta = splitTime - prevBest;
        if (splitTime < prevBest) {
          this.bestSplits[currentSector.id] = Number(splitTime.toFixed(3));
          isPersonalBest = true;
          this.saveBestSplits();
        }
      } else {
        this.bestSplits[currentSector.id] = Number(splitTime.toFixed(3));
        isPersonalBest = true;
        this.saveBestSplits();
      }

      const result = {
        sectorId: currentSector.id,
        sectorName: currentSector.name,
        sectorIndex: this.currentSectorIndex + 1,
        splitTime: Number(splitTime.toFixed(2)),
        bestSplitTime: this.bestSplits[currentSector.id],
        delta: delta !== null ? Number(delta.toFixed(2)) : null,
        isPersonalBest,
        icon: currentSector.icon
      };

      this.currentRunSplits.push(result);
      this.sectorStartTime = elapsedTime;
      this.currentSectorIndex++;

      return result;
    }

    return null;
  }

  formatDelta(delta) {
    if (delta === null || delta === undefined) return { text: 'BEST', color: '#10b981' };
    if (delta <= 0) {
      return { text: delta.toFixed(2) + 's', color: '#10b981', isFaster: true };
    }
    return { text: '+' + delta.toFixed(2) + 's', color: '#f59e0b', isFaster: false };
  }

  renderSplitsSummaryHTML() {
    if (!this.currentRunSplits || this.currentRunSplits.length === 0) return '';
    return `
      <div class="splits-summary-card" style="background:rgba(15,23,42,0.7);border:1px solid rgba(56,189,248,0.25);border-radius:10px;padding:10px 14px;margin:8px 0;width:100%">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;font-weight:600;display:flex;justify-content:space-between">
          <span>🏁 赛段分段时间对比 (SECTOR SPLITS)</span>
          <span style="color:#38bdf8">环湖 4 大赛段</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
          ${this.currentRunSplits.map(s => {
            const isFaster = s.delta !== null && s.delta <= 0;
            const deltaStr = s.delta !== null ? (isFaster ? '-' : '+') + Math.abs(s.delta).toFixed(2) + 's' : '首次纪录';
            return `
              <div style="background:rgba(30,41,59,0.85);border:1px solid ${isFaster ? 'rgba(16,185,129,0.4)' : 'rgba(148,163,184,0.2)'};border-radius:6px;padding:6px;text-align:center">
                <div style="font-size:11px;color:#cbd5e1;font-weight:700">${s.sectorId} ${s.icon || ''}</div>
                <div style="font-size:13px;font-weight:800;color:#f8fafc;margin:2px 0">${s.splitTime.toFixed(2)}s</div>
                <div style="font-size:10px;font-weight:700;color:${isFaster ? '#34d399' : '#f59e0b'}">${deltaStr}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
}

export class GhostRecorder {
  constructor(sampleInterval = 0.1) {
    this.sampleInterval = sampleInterval;
    this.lastSampleTime = -1;
    this.samples = [];
    this.isRecording = false;
  }

  start() {
    this.samples = [];
    this.lastSampleTime = -1;
    this.isRecording = true;
  }

  sample(time, distance, x, z, heading, speed) {
    if (!this.isRecording) return;
    if (this.lastSampleTime < 0 || (time - this.lastSampleTime) >= this.sampleInterval) {
      this.samples.push({
        t: Number(time.toFixed(2)),
        s: Math.round(distance),
        x: Number(x.toFixed(2)),
        z: Number(z.toFixed(2)),
        heading: Number(heading.toFixed(2)),
        speed: Number(speed.toFixed(1))
      });
      this.lastSampleTime = time;
    }
  }

  stop(totalTime, riderName = '个人纪录') {
    this.isRecording = false;
    if (this.samples.length < 10) return null;
    return {
      version: 1,
      totalTime: Number(totalTime.toFixed(2)),
      riderName,
      recordedAt: new Date().toISOString(),
      samples: this.samples
    };
  }

  reset() {
    this.samples = [];
    this.lastSampleTime = -1;
    this.isRecording = false;
  }
}

export function loadGhostLap() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(GHOST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export class GhostPlayback {
  constructor(ghostData = null) {
    this.ghostData = ghostData || this.loadGhostLap();
  }

  load(ghostData) {
    this.ghostData = ghostData;
  }

  loadGhostLap() {
    return loadGhostLap();
  }

  loadBestLap() {
    this.ghostData = loadGhostLap();
    return this.ghostData;
  }

  hasGhost() {
    return !!(this.ghostData && Array.isArray(this.ghostData.samples) && this.ghostData.samples.length > 5);
  }

  sampleAt(currentTime) {
    if (!this.hasGhost()) return null;
    const samples = this.ghostData.samples;

    if (currentTime <= samples[0].t) {
      const s0 = samples[0];
      return { x: s0.x, z: s0.z, heading: s0.heading, speed: s0.speed, s: s0.s, finished: false };
    }

    const last = samples[samples.length - 1];
    if (currentTime >= last.t) {
      return { x: last.x, z: last.z, heading: last.heading, speed: 0, s: last.s, finished: true };
    }

    // Binary search to find adjacent interval
    let low = 0, high = samples.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (samples[mid].t <= currentTime) {
        if (mid === samples.length - 1 || samples[mid + 1].t > currentTime) {
          const a = samples[mid];
          const b = samples[mid + 1];
          const factor = (currentTime - a.t) / (b.t - a.t);

          return {
            x: a.x + (b.x - a.x) * factor,
            z: a.z + (b.z - a.z) * factor,
            heading: a.heading + (b.heading - a.heading) * factor,
            speed: a.speed + (b.speed - a.speed) * factor,
            s: a.s + (b.s - a.s) * factor,
            finished: false
          };
        }
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return null;
  }

  getGapMeters(playerDistance, currentTime) {
    const ghost = this.sampleAt(currentTime);
    if (!ghost) return null;
    return Math.round(ghost.s - playerDistance);
  }
}

export function saveGhostLap(ghostData) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const existing = loadGhostLap();
    if (!existing || !existing.totalTime || ghostData.totalTime < existing.totalTime) {
      localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(ghostData));
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Failed to save ghost lap:', err);
    return false;
  }
}

export function clearGhostLap() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(GHOST_STORAGE_KEY);
  } catch {}
}

export const ACHIEVEMENTS = [
  {
    id: 'speed_65',
    title: '破风极速',
    desc: '单场比赛中最高骑行时速突破 65 km/h',
    icon: '⚡',
    category: 'speed',
    target: '≥ 65 km/h'
  },
  {
    id: 'draft_8s',
    title: '尾流破风手',
    desc: '单场比赛中在对手尾流区域累计吸附超 8 秒',
    icon: '💨',
    category: 'technique',
    target: '≥ 8 秒'
  },
  {
    id: 'drift_3',
    title: '赛湖漂移王',
    desc: '单场比赛中通过过弯漂移成功蓄满并释放 3 次氮气加速',
    icon: '🌀',
    category: 'technique',
    target: '3 次'
  },
  {
    id: 'combat_3',
    title: '赛道快打',
    desc: '使用拳脚、棍棒、手枪或趣味道具累计命中对手 3 次',
    icon: '🥊',
    category: 'combat',
    target: '3 次'
  },
  {
    id: 'sub_2m50s',
    title: '急速金牌传说',
    desc: '3000m 环湖用时跑进 2 分 50 秒以内',
    icon: '⏱️',
    category: 'record',
    target: '< 2:50.0'
  },
  {
    id: 'champion_gold',
    title: '赛里木湖总冠军',
    desc: '在 5 车环湖大对决中斩获第 1 名并登顶领奖台',
    icon: '🏆',
    category: 'podium',
    target: '第 1 名'
  }
];

export class AchievementManager {
  constructor() {
    this.unlocked = this.load();
  }

  load() {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  save() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(this.unlocked));
    } catch (err) {
      console.warn('Failed to save achievements:', err);
    }
  }

  unlock(id) {
    if (this.unlocked[id]) return false;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;

    this.unlocked[id] = {
      unlockedAt: new Date().toISOString(),
      title: def.title
    };
    this.save();
    return true;
  }

  checkRunStats(stats) {
    const newlyUnlocked = [];

    const tryUnlock = (id) => {
      if (this.unlock(id)) {
        const item = ACHIEVEMENTS.find(a => a.id === id);
        if (item) {
          newlyUnlocked.push({ ...item, name: item.title });
        }
      }
    };

    if (stats.topSpeedKph >= 65) tryUnlock('speed_65');
    if (stats.draftTime >= 8) tryUnlock('draft_8s');
    if (stats.nitroUses >= 3) tryUnlock('drift_3');
    if (stats.hitsLanded >= 3) tryUnlock('combat_3');
    if (stats.finished && stats.finishTime && stats.finishTime <= 170) tryUnlock('sub_2m50s');
    if (stats.finished && stats.rank === 1) tryUnlock('champion_gold');

    return newlyUnlocked;
  }

  getAll() {
    return ACHIEVEMENTS.map(item => ({
      ...item,
      name: item.title,
      title: item.title,
      unlocked: !!this.unlocked[item.id],
      isUnlocked: !!this.unlocked[item.id],
      unlockedAt: this.unlocked[item.id]?.unlockedAt || null
    }));
  }

  getAllAchievements() {
    return this.getAll();
  }

  getUnlockedCount() {
    return Object.keys(this.unlocked).length;
  }

  reset() {
    this.unlocked = {};
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
      }
    } catch {}
  }
}

// 3D Holographic Ghost Bike Mesh Generator for Three.js
export function createGhostVisual(THREE, scene = null) {
  const ghostRoot = new THREE.Group();
  ghostRoot.visible = false;
  if (scene) scene.add(ghostRoot);

  const ghostMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });

  const neonMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });

  // Bike frame
  const frameGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 5);
  const frameMesh = new THREE.Mesh(frameGeom, ghostMat);
  frameMesh.position.set(0, 0.55, 0);
  frameMesh.rotation.x = Math.PI / 4;
  ghostRoot.add(frameMesh);

  // Wheels
  for (const wheelZ of [-0.7, 0.7]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.045, 6, 16), neonMat);
    wheel.position.set(0, 0.43, wheelZ);
    wheel.rotation.y = Math.PI / 2;
    ghostRoot.add(wheel);
  }

  // Torso & Head
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 3, 6), ghostMat);
  torso.position.set(0, 1.4, -0.06);
  torso.rotation.x = 0.35;
  ghostRoot.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), neonMat);
  head.position.set(0, 1.95, 0.12);
  ghostRoot.add(head);

  // Floating ghost marker beacon
  const beaconGeom = new THREE.ConeGeometry(0.25, 0.5, 5);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
  const beacon = new THREE.Mesh(beaconGeom, beaconMat);
  beacon.position.set(0, 2.7, 0);
  beacon.rotation.x = Math.PI;
  ghostRoot.add(beacon);

  return {
    root: ghostRoot,
    group: ghostRoot,
    update(sample, visible = true) {
      if (!sample || !visible) {
        ghostRoot.visible = false;
        return;
      }
      ghostRoot.visible = true;
      ghostRoot.position.set(sample.x, 0.05, sample.z);
      ghostRoot.rotation.y = sample.heading;
      beacon.position.y = 2.7 + Math.sin(Date.now() * 0.005) * 0.12;
      beacon.rotation.y += 0.03;
    },
    updateWheels(speed, dt) {
      beacon.position.y = 2.7 + Math.sin(Date.now() * 0.005) * 0.12;
      beacon.rotation.y += 0.03;
    },
    dispose() {
      if (scene) scene.remove(ghostRoot);
      ghostMat.dispose();
      neonMat.dispose();
      beaconMat.dispose();
    }
  };
}

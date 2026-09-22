// LakeRiders Phase 10: Lake Sayram Scenic Environment & Visual Assets
// Authentic Tian Shan snow mountains, sapphire lake, Kazakh yurts, wild swans, alpine flower meadows, spruce pines & landmark posts.
import * as THREE from './vendor/three.module.js';

export const SAYRAM_LANDMARKS = [
  {
    s: 0,
    title: '赛里木湖 · 环湖总起点',
    subtitle: 'Lake Sayram Grand Circuit Arch · 0 KM',
    elevation: '2071m',
    landmarkImg: './assets/panoramas/sayram_arch_start.jpg',
    desc: '环湖骑行公路总起点，远眺天山冰川，湖水与晴空浑然一体，被称为大西洋最后一滴眼泪。'
  },
  {
    s: 500,
    title: '月亮湾 · 碧水连天',
    subtitle: 'Moon Bay Scenic Overlook · 0.5 KM',
    elevation: '2073m',
    landmarkImg: './assets/panoramas/sayram_moon_bay.jpg',
    desc: '弧形湖湾宛若新月，湖水由浅滩翡翠绿向湖心深邃宝石蓝层层渐变，水质透明度高达12米。'
  },
  {
    s: 1000,
    title: '三台古驿 · 丝路遗韵',
    subtitle: 'Santai Historic Silk Road Post · 1.0 KM',
    elevation: '2075m',
    landmarkImg: './assets/panoramas/sayram_santai_post.jpg',
    desc: '古代丝绸之路北道重要军驿旧址，群山怀抱，历经风霜，见证数百年丝路商贾驼铃。'
  },
  {
    s: 1500,
    title: '金花紫卉 · 环湖花海',
    subtitle: 'Sayram Alpine Floral Meadow · 1.5 KM',
    elevation: '2072m',
    landmarkImg: './assets/panoramas/sayram_flower_meadow.jpg',
    desc: '盛夏高山金莲花、野生紫鸢尾与郁金香交织怒放，铺成数百公顷的高原锦绣花毯。'
  },
  {
    s: 2100,
    title: '点将台 · 登高望远',
    subtitle: "General's Inspection Terrace · 2.1 KM",
    elevation: '2130m',
    landmarkImg: './assets/panoramas/sayram_general_terrace.jpg',
    desc: '相传成吉思汗西征在此筑台誓师检阅大军，登高俯瞰整座赛里木湖浩瀚全景尽收眼底。'
  },
  {
    s: 2650,
    title: '亲水滩 · 天鹅戏水',
    subtitle: 'Swan Waterfront Beach · 2.65 KM',
    elevation: '2071m',
    landmarkImg: './assets/panoramas/sayram_swan_beach.jpg',
    desc: '野生大天鹅与疣鼻天鹅栖息繁衍的天然乐园，雪山倒映在镜面湖水中，人与天鹅和谐共处。'
  }
];

export function createSayramSkyDome(scene) {
  const textureLoader = new THREE.TextureLoader();
  const skyTexture = textureLoader.load('./assets/panoramas/sayram_lake_360.jpg', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.mapping = THREE.EquirectangularReflectionMapping;
  });

  const skyGeo = new THREE.SphereGeometry(1800, 60, 40);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.position.set(0, 160, 0);
  skyDome.rotation.y = -Math.PI / 2;
  scene.add(skyDome);
  return skyDome;
}

// Realistic Sayram Sapphire Lake Water
export function createSayramLakeWater(scene, data) {
  const lakeShape = new THREE.Shape();
  data.points.forEach((p, i) => {
    const a = [p.x * 0.89, -p.z * 0.89];
    i ? lakeShape.lineTo(...a) : lakeShape.moveTo(...a);
  });

  // Procedural wave shimmer texture
  const waveCanvas = document.createElement('canvas');
  waveCanvas.width = 512;
  waveCanvas.height = 512;
  const wctx = waveCanvas.getContext('2d');
  const grad = wctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0a3d54');
  grad.addColorStop(0.3, '#105e7a');
  grad.addColorStop(0.65, '#1b8ea8');
  grad.addColorStop(1, '#0e465e');
  wctx.fillStyle = grad;
  wctx.fillRect(0, 0, 512, 512);

  // Soft caustics / wave ripple lines
  wctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  wctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 18) {
    wctx.beginPath();
    for (let x = 0; x <= 512; x += 20) {
      const cy = y + Math.sin(x * 0.05 + y * 0.03) * 6 + Math.cos(x * 0.08) * 4;
      x === 0 ? wctx.moveTo(x, cy) : wctx.lineTo(x, cy);
    }
    wctx.stroke();
  }

  const waterTex = new THREE.CanvasTexture(waveCanvas);
  waterTex.wrapS = THREE.RepeatWrapping;
  waterTex.wrapT = THREE.RepeatWrapping;
  waterTex.repeat.set(24, 24);

  const waterMaterial = new THREE.MeshStandardMaterial({
    color: '#2898b5',
    map: waterTex,
    roughness: 0.12,
    metalness: 0.45,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide
  });

  const lakeGeom = new THREE.ShapeGeometry(lakeShape);
  const lakeMesh = new THREE.Mesh(lakeGeom, waterMaterial);
  lakeMesh.position.set(0, -0.01, 0);
  lakeMesh.rotation.x = -Math.PI / 2;
  scene.add(lakeMesh);

  // Shoreline turquoise sand/pebble fringe
  const shoreShape = new THREE.Shape();
  data.points.forEach((p, i) => {
    const a = [p.x * 0.92, -p.z * 0.92];
    i ? shoreShape.lineTo(...a) : shoreShape.moveTo(...a);
  });
  const shoreMat = new THREE.MeshStandardMaterial({ color: '#578e91', roughness: 0.9 });
  const shoreMesh = new THREE.Mesh(new THREE.ShapeGeometry(shoreShape), shoreMat);
  shoreMesh.position.set(0, -0.06, 0);
  shoreMesh.rotation.x = -Math.PI / 2;
  scene.add(shoreMesh);

  return {
    mesh: lakeMesh,
    update(dt) {
      waterTex.offset.x = (waterTex.offset.x + dt * 0.012) % 1;
      waterTex.offset.y = (waterTex.offset.y + dt * 0.008) % 1;
    }
  };
}

// Kazakh Traditional White Yurts (哈萨克白色毡房群)
export function createKazakhYurts(scene, track) {
  const group = new THREE.Group();
  scene.add(group);

  const yurtLocations = [
    { s: 360, offset: 26, count: 4, rot: 0.2 },
    { s: 780, offset: -30, count: 3, rot: -0.3 },
    { s: 950, offset: -32, count: 3, rot: -0.4 },
    { s: 1350, offset: 28, count: 3, rot: 0.4 },
    { s: 1750, offset: 34, count: 4, rot: 0.6 },
    { s: 2020, offset: -28, count: 3, rot: -0.5 },
    { s: 2420, offset: -29, count: 4, rot: -0.2 },
    { s: 2860, offset: 25, count: 3, rot: 0.3 }
  ];

  const feltMat = new THREE.MeshStandardMaterial({ color: '#f5f7f2', roughness: 0.9 });
  const bandMat = new THREE.MeshStandardMaterial({ color: '#b93838', roughness: 0.8 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#5a3d24', roughness: 0.9 });
  const crownMat = new THREE.MeshStandardMaterial({ color: '#d99a38', roughness: 0.6 });

  for (const loc of yurtLocations) {
    const a = track.sample(loc.s);
    for (let i = 0; i < loc.count; i++) {
      const yurt = new THREE.Group();
      const spreadX = (i - loc.count / 2) * 11 + (i % 2) * 4;
      const spreadZ = (i % 2) * 8;
      const px = a.x + a.rx * (loc.offset + spreadX);
      const pz = a.z + a.rz * (loc.offset + spreadZ);
      yurt.position.set(px, 0, pz);
      yurt.rotation.y = loc.rot + i * 0.5;

      const radius = 4.2 + (i % 2) * 0.6;
      const wallH = 2.2;
      const roofH = 1.9;

      // Base cylinder
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, wallH, 16), feltMat);
      wall.position.y = wallH / 2;
      yurt.add(wall);

      // Red geometric ethnic band around wall
      const band = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.04, radius + 0.04, 0.45, 16), bandMat);
      band.position.y = wallH * 0.65;
      yurt.add(band);

      // Conical dome roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(radius + 0.35, roofH, 16), feltMat);
      roof.position.y = wallH + roofH / 2;
      yurt.add(roof);

      // Top golden smoke ring (Shanyrak)
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 6, 16), crownMat);
      crown.position.y = wallH + roofH + 0.1;
      crown.rotation.x = Math.PI / 2;
      yurt.add(crown);

      // Wooden door
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.2), woodMat);
      door.position.set(0, 0.8, radius * 0.98);
      yurt.add(door);

      // Wooden pasture fence nearby
      for (let f = -1; f <= 1; f++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.4, 5), woodMat);
        post.position.set(f * 2.8, 0.7, radius + 2.5);
        yurt.add(post);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.1, 0.08), woodMat);
      rail.position.set(0, 1.05, radius + 2.5);
      yurt.add(rail);

      group.add(yurt);
    }
  }
  return group;
}

// Wild Swans swimming on Sayram Lake (赛里木湖野生天鹅群)
export function createWildSwans(scene, track) {
  const group = new THREE.Group();
  scene.add(group);

  const swanLocations = [
    { s: 220, shoreOffset: 18, count: 4 },
    { s: 520, shoreOffset: 22, count: 5 }, // Moon Bay
    { s: 1100, shoreOffset: 20, count: 4 },
    { s: 1650, shoreOffset: 24, count: 5 },
    { s: 2280, shoreOffset: 19, count: 4 },
    { s: 2680, shoreOffset: 19, count: 6 } // Swan Waterfront Beach
  ];

  const swanBodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
  const beakMat = new THREE.MeshStandardMaterial({ color: '#ff6f00', roughness: 0.5 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#10252d' });
  const rippleMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, side: THREE.DoubleSide });

  const swans = [];

  for (const loc of swanLocations) {
    const a = track.sample(loc.s);
    for (let i = 0; i < loc.count; i++) {
      const swan = new THREE.Group();
      const ox = (i - loc.count / 2) * 4.5 + Math.sin(i * 1.5) * 3;
      const oz = (i % 2) * 4.2 + Math.cos(i) * 2;
      const px = a.x + a.rx * (loc.shoreOffset + ox);
      const pz = a.z + a.rz * (loc.shoreOffset + oz);

      swan.position.set(px, 0.04, pz);
      swan.rotation.y = Math.atan2(a.fx, a.fz) + (i % 2 ? 0.3 : -0.5);

      // Swan body (smooth capsule/ellipsoid)
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 8), swanBodyMat);
      body.scale.set(1.4, 0.7, 0.9);
      body.position.y = 0.25;
      swan.add(body);

      // Tail feathers
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 6), swanBodyMat);
      tail.position.set(-0.55, 0.35, 0);
      tail.rotation.z = Math.PI * 0.75;
      swan.add(tail);

      // Elegant S-curved neck
      const neckLower = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.55, 8), swanBodyMat);
      neckLower.position.set(0.45, 0.52, 0);
      neckLower.rotation.z = -0.3;
      swan.add(neckLower);

      const neckUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.45, 8), swanBodyMat);
      neckUpper.position.set(0.55, 0.88, 0);
      neckUpper.rotation.z = 0.2;
      swan.add(neckUpper);

      // Head & Beak
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), swanBodyMat);
      head.position.set(0.62, 1.06, 0);
      swan.add(head);

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), beakMat);
      beak.position.set(0.74, 1.03, 0);
      beak.rotation.z = -Math.PI / 2;
      swan.add(beak);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
      eye.position.set(0.64, 1.08, 0.1);
      swan.add(eye);

      // Gentle floating water ripple ring
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.75, 16), rippleMat);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.y = 0.02;
      swan.add(ripple);

      group.add(swan);
      swans.push({ mesh: swan, baseY: 0.04, phase: i * 1.8 });
    }
  }

  return {
    group,
    update(time) {
      for (const s of swans) {
        s.mesh.position.y = s.baseY + Math.sin(time * 2.2 + s.phase) * 0.04;
        s.mesh.rotation.z = Math.sin(time * 1.6 + s.phase) * 0.03;
      }
    }
  };
}

export function createSnowMountains(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const mountainCount = 36;
  const rockMaterialA = new THREE.MeshStandardMaterial({ color: '#4a626a', roughness: 0.95 });
  const rockMaterialB = new THREE.MeshStandardMaterial({ color: '#58737c', roughness: 0.95 });
  const snowMaterial = new THREE.MeshStandardMaterial({ color: '#f8fbff', roughness: 0.5, metalness: 0.05 });

  const dummy = new THREE.Object3D();
  const baseATransforms = [];
  const baseBTransforms = [];
  const snowTransforms = [];

  for (let i = 0; i < mountainCount; i++) {
    const angle = (i / mountainCount) * Math.PI * 2;
    const dist = 920 + (i % 6) * 70;
    const baseRadius = 160 + (i % 5) * 40;
    const totalHeight = 200 + (i % 4) * 55;
    const x = Math.sin(angle) * dist;
    const z = Math.cos(angle) * dist;

    // Mountain lower body
    dummy.position.set(x, totalHeight * 0.42, z);
    dummy.rotation.set(0, i * 0.9, 0);
    dummy.scale.set(baseRadius / 180, totalHeight / 220, baseRadius / 180);
    dummy.updateMatrix();
    if (i % 2) baseBTransforms.push(dummy.matrix.clone());
    else baseATransforms.push(dummy.matrix.clone());

    // Snow-capped peak (top 42% of mountain)
    const snowRadius = baseRadius * 0.44;
    const snowHeight = totalHeight * 0.44;
    dummy.position.set(x, totalHeight * 0.70, z);
    dummy.rotation.set(0, i * 0.9, 0);
    dummy.scale.set(snowRadius / 80, snowHeight / 95, snowRadius / 80);
    dummy.updateMatrix();
    snowTransforms.push(dummy.matrix.clone());
  }

  const baseGeom = new THREE.ConeGeometry(180, 220, 7);
  if (baseATransforms.length > 0) {
    const baseAInst = new THREE.InstancedMesh(baseGeom, rockMaterialA, baseATransforms.length);
    for (let i = 0; i < baseATransforms.length; i++) baseAInst.setMatrixAt(i, baseATransforms[i]);
    baseAInst.computeBoundingSphere();
    group.add(baseAInst);
  }
  if (baseBTransforms.length > 0) {
    const baseBInst = new THREE.InstancedMesh(baseGeom, rockMaterialB, baseBTransforms.length);
    for (let i = 0; i < baseBTransforms.length; i++) baseBInst.setMatrixAt(i, baseBTransforms[i]);
    baseBInst.computeBoundingSphere();
    group.add(baseBInst);
  }

  const snowGeom = new THREE.ConeGeometry(80, 95, 7);
  if (snowTransforms.length > 0) {
    const snowInst = new THREE.InstancedMesh(snowGeom, snowMaterial, snowTransforms.length);
    for (let i = 0; i < snowTransforms.length; i++) snowInst.setMatrixAt(i, snowTransforms[i]);
    snowInst.computeBoundingSphere();
    group.add(snowInst);
  }

  return group;
}

export function createFlowerPatches(scene, track, count = 120) {
  const group = new THREE.Group();
  scene.add(group);

  const colors = ['#f5c829', '#9b6bcc', '#4aa3df', '#ffffff', '#e06666'];
  const stemMaterial = new THREE.MeshBasicMaterial({ color: '#4d7536' });
  const materials = colors.map(c => new THREE.MeshBasicMaterial({ color: c }));

  const dummy = new THREE.Object3D();
  const stemTransforms = [];
  const blossomTransforms = [[], [], [], [], []];

  for (let i = 0; i < count; i++) {
    const s = (i * 37) % 3000;
    const side = i % 2 === 0 ? 1 : -1;
    const offset = side * (8.2 + (i % 4) * 2.5);
    const a = track.sample(s);
    const px = a.x + a.rx * offset;
    const pz = a.z + a.rz * offset;

    const numFlowers = 4 + (i % 3);
    for (let f = 0; f < numFlowers; f++) {
      const angle = (f / numFlowers) * Math.PI * 2;
      const r = 0.35 + (f % 2) * 0.45;
      const fx = px + Math.cos(angle) * r;
      const fz = pz + Math.sin(angle) * r;

      dummy.position.set(fx, 0.14, fz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      stemTransforms.push(dummy.matrix.clone());

      dummy.position.set(fx, 0.28, fz);
      dummy.updateMatrix();
      const cIdx = (i + f) % materials.length;
      blossomTransforms[cIdx].push(dummy.matrix.clone());
    }
  }

  const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 4);
  const stemInst = new THREE.InstancedMesh(stemGeom, stemMaterial, stemTransforms.length);
  for (let i = 0; i < stemTransforms.length; i++) stemInst.setMatrixAt(i, stemTransforms[i]);
  stemInst.computeBoundingSphere();
  group.add(stemInst);

  const blossomGeom = new THREE.DodecahedronGeometry(0.13, 0);
  for (let c = 0; c < materials.length; c++) {
    if (blossomTransforms[c].length > 0) {
      const bInst = new THREE.InstancedMesh(blossomGeom, materials[c], blossomTransforms[c].length);
      for (let i = 0; i < blossomTransforms[c].length; i++) bInst.setMatrixAt(i, blossomTransforms[c][i]);
      bInst.computeBoundingSphere();
      group.add(bInst);
    }
  }
  return group;
}

export function createSprucePines(scene, track, count = 180) {
  const group = new THREE.Group();
  scene.add(group);

  const foliageMaterialA = new THREE.MeshStandardMaterial({ color: '#1e3d26', roughness: 0.9 });
  const foliageMaterialB = new THREE.MeshStandardMaterial({ color: '#152d1c', roughness: 0.95 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#382516', roughness: 1.0 });

  const dummy = new THREE.Object3D();
  const trunkTransforms = [];
  const foliageATransforms = [];
  const foliageBTransforms = [];

  for (let i = 0; i < count; i++) {
    const s = (i * 23 + 11) % 3000;
    const side = (i % 3 === 0) ? -1 : 1;
    const d = 15 + (i * 13 % 45);
    const a = track.sample(s);
    const px = a.x + a.rx * d * side;
    const pz = a.z + a.rz * d * side;

    const trunkH = 1.9 + (i % 3) * 0.7;
    dummy.position.set(px, trunkH / 2, pz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, trunkH / 2.0, 1);
    dummy.updateMatrix();
    trunkTransforms.push(dummy.matrix.clone());

    const layers = 3;
    const isA = i % 2 === 0;
    for (let l = 0; l < layers; l++) {
      const scale = 1 - l * 0.24;
      dummy.position.set(px, trunkH + l * 1.6 + 1.2, pz);
      dummy.rotation.set(0, (i + l) * 0.7, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      if (isA) foliageATransforms.push(dummy.matrix.clone());
      else foliageBTransforms.push(dummy.matrix.clone());
    }
  }

  const trunkGeom = new THREE.CylinderGeometry(0.2, 0.3, 2.0, 5);
  const trunkInst = new THREE.InstancedMesh(trunkGeom, trunkMaterial, trunkTransforms.length);
  for (let i = 0; i < trunkTransforms.length; i++) trunkInst.setMatrixAt(i, trunkTransforms[i]);
  trunkInst.computeBoundingSphere();
  group.add(trunkInst);

  const coneGeom = new THREE.ConeGeometry(2.5, 3.4, 5);
  if (foliageATransforms.length > 0) {
    const folAInst = new THREE.InstancedMesh(coneGeom, foliageMaterialA, foliageATransforms.length);
    for (let i = 0; i < foliageATransforms.length; i++) folAInst.setMatrixAt(i, foliageATransforms[i]);
    folAInst.computeBoundingSphere();
    group.add(folAInst);
  }
  if (foliageBTransforms.length > 0) {
    const folBInst = new THREE.InstancedMesh(coneGeom, foliageMaterialB, foliageBTransforms.length);
    for (let i = 0; i < foliageBTransforms.length; i++) folBInst.setMatrixAt(i, foliageBTransforms[i]);
    folBInst.computeBoundingSphere();
    group.add(folBInst);
  }
  return group;
}

export function createSkyClouds(scene, count = 16) {
  const group = new THREE.Group();
  scene.add(group);
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.82, depthWrite: false });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = 720 + (i % 4) * 80;
    const height = 150 + (i % 3) * 35;

    const cloud = new THREE.Group();
    cloud.position.set(Math.sin(angle) * dist, height, Math.cos(angle) * dist);
    group.add(cloud);

    for (let c = 0; c < 4; c++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(24 + (c % 2) * 14, 7, 5), cloudMaterial);
      puff.position.set((c - 1.5) * 22, Math.sin(c) * 6, (c % 2) * 14);
      puff.scale.set(1.4, 0.65, 1.2);
      cloud.add(puff);
    }
  }
  return group;
}

export function createLakesideRails(scene, track) {
  const group = new THREE.Group();
  scene.add(group);
  const woodMaterial = new THREE.MeshStandardMaterial({ color: '#553c26', roughness: 0.85 });

  const dummy = new THREE.Object3D();
  const postTransforms = [];
  const beamTransforms = [];

  // Add rails along scenic lakeside curves: 380-880, 1480-1980, 2580-2820
  const sections = [[380, 880], [1480, 1980], [2580, 2820]];
  for (const [fromS, toS] of sections) {
    for (let s = fromS; s <= toS; s += 8) {
      const a = track.sample(s);
      const postX = a.x + a.rx * 7.2;
      const postZ = a.z + a.rz * 7.2;
      const h = Math.atan2(a.fx, a.fz);

      // Vertical post
      dummy.position.set(postX, 0.58, postZ);
      dummy.rotation.set(0, h, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      postTransforms.push(dummy.matrix.clone());

      // Horizontal beams (upper)
      dummy.position.set(postX, 0.95, postZ);
      dummy.rotation.set(0, h, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beamTransforms.push(dummy.matrix.clone());

      // Horizontal beams (lower)
      dummy.position.set(postX, 0.52, postZ);
      dummy.rotation.set(0, h, 0);
      dummy.scale.set(0.85, 0.85, 1);
      dummy.updateMatrix();
      beamTransforms.push(dummy.matrix.clone());
    }
  }

  const postGeom = new THREE.BoxGeometry(0.2, 1.15, 0.2);
  const postInst = new THREE.InstancedMesh(postGeom, woodMaterial, postTransforms.length);
  for (let i = 0; i < postTransforms.length; i++) postInst.setMatrixAt(i, postTransforms[i]);
  postInst.computeBoundingSphere();
  group.add(postInst);

  const beamGeom = new THREE.BoxGeometry(0.12, 0.14, 8.2);
  const beamInst = new THREE.InstancedMesh(beamGeom, woodMaterial, beamTransforms.length);
  for (let i = 0; i < beamTransforms.length; i++) beamInst.setMatrixAt(i, beamTransforms[i]);
  beamInst.computeBoundingSphere();
  group.add(beamInst);

  return group;
}

// Photorealistic Landmark Observation Viewpoints
export function createScenicLandmarks(scene, track) {
  const group = new THREE.Group();
  scene.add(group);

  const woodMat = new THREE.MeshStandardMaterial({ color: '#3d2817', roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#7a8585', roughness: 0.95 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d4aa38', roughness: 0.4, metalness: 0.3 });

  for (const landmark of SAYRAM_LANDMARKS) {
    const a = track.sample(landmark.s);
    const rot = Math.atan2(a.fx, a.fz);
    const postX = a.x + a.rx * -9.6;
    const postZ = a.z + a.rz * -9.6;

    const landmarkGroup = new THREE.Group();
    landmarkGroup.position.set(postX, 0, postZ);
    landmarkGroup.rotation.y = rot + Math.PI;
    group.add(landmarkGroup);

    // Stone base platform
    const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.45, 2.8), stoneMat);
    stoneBase.position.y = 0.22;
    landmarkGroup.add(stoneBase);

    // Twin sturdy timber pillars
    for (const sx of [-2.4, 2.4]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.4, 8), woodMat);
      pillar.position.set(sx, 2.2, 0);
      landmarkGroup.add(pillar);

      // Warm lantern on pillar
      const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), goldMat);
      lantern.position.set(sx, 4.2, 0.3);
      landmarkGroup.add(lantern);
    }

    // Top timber crossbeam
    const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.36, 0.45), woodMat);
    crossbeam.position.set(0, 4.2, 0);
    landmarkGroup.add(crossbeam);

    // High definition 16:9 scenic photo billboard
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const ctx = c.getContext('2d');

    // Default dark frame with placeholder
    ctx.fillStyle = '#0a1d24';
    ctx.fillRect(0, 0, 640, 360);
    ctx.strokeStyle = '#d3ed70';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 624, 344);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(landmark.title, 320, 160);

    ctx.fillStyle = '#d3ed70';
    ctx.font = '500 22px "Segoe UI", sans-serif';
    ctx.fillText(landmark.subtitle, 320, 210);

    const texture = new THREE.CanvasTexture(c);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = landmark.landmarkImg;
    img.onload = () => {
      // Draw authentic wide photograph with gradient caption overlay
      ctx.drawImage(img, 0, 0, 640, 360);

      // Bottom information plate
      const grad = ctx.createLinearGradient(0, 220, 0, 360);
      grad.addColorStop(0, 'rgba(10, 29, 36, 0)');
      grad.addColorStop(0.3, 'rgba(10, 29, 36, 0.85)');
      grad.addColorStop(1, 'rgba(10, 29, 36, 0.98)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 200, 640, 160);

      // Gold border
      ctx.strokeStyle = '#d3ed70';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 632, 352);

      // Bilingual text & elevation
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(landmark.title, 24, 280);

      ctx.fillStyle = '#d3ed70';
      ctx.font = '600 18px "Segoe UI", sans-serif';
      ctx.fillText(landmark.subtitle + ' · 海拔 ' + landmark.elevation, 24, 322);

      // Landmark badge
      ctx.fillStyle = 'rgba(211, 237, 112, 0.2)';
      ctx.beginPath();
      ctx.roundRect(500, 24, 116, 36, 6);
      ctx.fill();
      ctx.strokeStyle = '#d3ed70';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#d3ed70';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SAYRAM 360°', 558, 48);

      texture.needsUpdate = true;
    };

    // Double-sided grand entrance arches: front and back billboard presentations
    const boardFront = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 2.7),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide })
    );
    boardFront.position.set(0, 2.4, 0.08);
    landmarkGroup.add(boardFront);

    const boardBack = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 2.7),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide })
    );
    boardBack.position.set(0, 2.4, -0.08);
    boardBack.rotation.y = Math.PI;
    landmarkGroup.add(boardBack);
  }
  return group;
}

export function createConfettiParticleSystem(parent) {
  const group = new THREE.Group();
  parent.add(group);
  const count = 75;
  const particles = [];
  const palette = ['#ff4081', '#ffd740', '#00e5ff', '#76ff03', '#ff6e40', '#e040fb', '#ffffff'];

  for (let i = 0; i < count; i++) {
    const color = palette[i % palette.length];
    const geom = new THREE.PlaneGeometry(0.16, 0.32);
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    group.add(mesh);

    particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 12,
      vy: 6 + Math.random() * 9,
      vz: (Math.random() - 0.5) * 12,
      rotSpeedX: Math.random() * 10,
      rotSpeedY: Math.random() * 8,
      age: 0,
      lifespan: 2.2 + Math.random() * 1.5,
      active: false
    });
  }

  return {
    group,
    trigger(origin) {
      for (const p of particles) {
        p.active = true;
        p.age = 0;
        p.mesh.visible = true;
        p.mesh.position.set(origin.x + (Math.random() - 0.5) * 4, origin.y + 1.5, origin.z + (Math.random() - 0.5) * 4);
        p.vx = (Math.random() - 0.5) * 14;
        p.vy = 8 + Math.random() * 10;
        p.vz = (Math.random() - 0.5) * 14;
      }
    },
    update(dt) {
      for (const p of particles) {
        if (!p.active) continue;
        p.age += dt;
        if (p.age >= p.lifespan) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        p.vy -= 14 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += p.rotSpeedX * dt;
        p.mesh.rotation.y += p.rotSpeedY * dt;
        if (p.mesh.position.y < 0.1) {
          p.mesh.position.y = 0.1;
          p.vy = 0;
          p.vx *= 0.8;
          p.vz *= 0.8;
        }
      }
    }
  };
}

// Procedural high-detail Sayram Lake Highway Asphalt Texture (赛里木湖环湖公路沥青路面)
export function createSayramRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base highway asphalt
  ctx.fillStyle = '#2a3335';
  ctx.fillRect(0, 0, 1024, 1024);

  // Aggregate stone noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 26;
    d[i] = Math.min(255, Math.max(0, d[i] + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Tire contact wear grooves
  const gradLeft = ctx.createLinearGradient(240, 0, 420, 0);
  gradLeft.addColorStop(0, 'rgba(16, 20, 22, 0)');
  gradLeft.addColorStop(0.5, 'rgba(12, 16, 18, 0.32)');
  gradLeft.addColorStop(1, 'rgba(16, 20, 22, 0)');
  ctx.fillStyle = gradLeft;
  ctx.fillRect(240, 0, 180, 1024);

  const gradRight = ctx.createLinearGradient(600, 0, 780, 0);
  gradRight.addColorStop(0, 'rgba(16, 20, 22, 0)');
  gradRight.addColorStop(0.5, 'rgba(12, 16, 18, 0.32)');
  gradRight.addColorStop(1, 'rgba(16, 20, 22, 0)');
  ctx.fillStyle = gradRight;
  ctx.fillRect(600, 0, 180, 1024);

  // Outer solid crisp white shoulder lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(44, 0, 18, 1024);
  ctx.fillRect(962, 0, 18, 1024);

  // Center dashed highway yellow overtaking divider
  ctx.fillStyle = '#f59e0b';
  const dashH = 128, gapH = 96;
  for (let y = 0; y < 1024; y += dashH + gapH) {
    ctx.fillRect(504, y, 16, Math.min(dashH, 1024 - y));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

// Procedural high-detail Sayram Lake Alpine Meadow Ground Texture (高山花海草甸地貌)
export function createSayramMeadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Rich alpine grass gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  baseGrad.addColorStop(0, '#446337');
  baseGrad.addColorStop(0.5, '#527542');
  baseGrad.addColorStop(1, '#3b552f');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle turf & soil patches
  ctx.fillStyle = 'rgba(92, 118, 70, 0.45)';
  for (let i = 0; i < 350; i++) {
    const rx = Math.random() * 1024, ry = Math.random() * 1024, rw = 10 + Math.random() * 30, rh = 10 + Math.random() * 30;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Alpine wildflowers: Golden Trollius (金莲花), Purple Iris (紫鸢尾), White Edelweiss
  const flowerPalette = ['#ffd152', '#ffe682', '#9d74d4', '#be9fe8', '#ffffff', '#7cd67f'];
  for (let i = 0; i < 850; i++) {
    ctx.fillStyle = flowerPalette[i % flowerPalette.length];
    const fx = Math.random() * 1024, fy = Math.random() * 1024, fr = 1.5 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(64, 64);
  texture.anisotropy = 8;
  return texture;
}

// Grand Circuit Finish Arch & Arena (赛里木湖环湖挑战赛 · 宏伟终点拱门)
export function createGrandFinishArch(scene, track) {
  const group = new THREE.Group();
  scene.add(group);

  const at = track.sample(0);
  const rot = Math.atan2(at.fx, at.fz);
  group.position.set(at.x, 0, at.z);
  group.rotation.y = rot;

  const woodMat = new THREE.MeshStandardMaterial({ color: '#2e1b10', roughness: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35, metalness: 0.4 });
  const darkTrussMat = new THREE.MeshStandardMaterial({ color: '#15252b', roughness: 0.7 });

  // Main dual side pillars spanning 17 meters
  for (const sx of [-8.5, 8.5]) {
    // Stone foundation
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.8), new THREE.MeshStandardMaterial({ color: '#687577', roughness: 0.9 }));
    foundation.position.set(sx, 0.35, 0);
    group.add(foundation);

    // Twin cedar timber columns
    for (const sz of [-0.45, 0.45]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 6.8, 10), woodMat);
      col.position.set(sx, 3.8, sz);
      group.add(col);
    }

    // Gold decorative bands
    for (const gy of [2.2, 4.5, 6.8]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 1.4), goldMat);
      band.position.set(sx, gy, 0);
      group.add(band);
    }
  }

  // Overhead crossbeam trusses spanning the road
  const mainBeam = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.65, 1.2), darkTrussMat);
  mainBeam.position.set(0, 6.6, 0);
  group.add(mainBeam);

  const topRailing = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.3, 0.4), goldMat);
  topRailing.position.set(0, 7.15, 0);
  group.add(topRailing);

  // High-definition double-sided finish banner
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 1024;
  bannerCanvas.height = 256;
  const bctx = bannerCanvas.getContext('2d');

  // Banner background with checkered borders
  bctx.fillStyle = '#0f242c';
  bctx.fillRect(0, 0, 1024, 256);

  // Top/bottom checkered racing ribbons
  const sq = 20;
  for (let x = 0; x < 1024; x += sq) {
    for (const y of [0, 20, 216, 236]) {
      bctx.fillStyle = (Math.floor(x / sq) + Math.floor(y / sq)) % 2 === 0 ? '#ffffff' : '#111827';
      bctx.fillRect(x, y, sq, sq);
    }
  }

  // Gold borders
  bctx.strokeStyle = '#f59e0b';
  bctx.lineWidth = 6;
  bctx.strokeRect(10, 44, 1004, 168);

  // Official race titles
  bctx.fillStyle = '#d3ed70';
  bctx.font = 'bold 24px "Segoe UI", "Microsoft YaHei", sans-serif';
  bctx.textAlign = 'center';
  bctx.fillText('TOUR OF LAKE SAYRAM · 环赛里木湖公路自行车赛', 512, 82);

  bctx.fillStyle = '#ffffff';
  bctx.font = '900 62px "Segoe UI", "Microsoft YaHei", sans-serif';
  bctx.fillText('★ 3000M 终点 · FINISH ★', 512, 150);

  bctx.fillStyle = '#f59e0b';
  bctx.font = 'bold 22px "Segoe UI", sans-serif';
  bctx.fillText('海拔 2071M · 计时终点线 CHRONO TIMING LINE', 512, 192);

  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(15.6, 3.4), bannerMat);
  bannerMesh.position.set(0, 5.2, 0);
  bannerMesh.rotation.y = Math.PI; // Face oncoming riders from home straight
  group.add(bannerMesh);

  // Checkered finish line road markings (wide, high-contrast across track)
  const finishLineCanvas = document.createElement('canvas');
  finishLineCanvas.width = 512;
  finishLineCanvas.height = 128;
  const fctx = finishLineCanvas.getContext('2d');
  fctx.fillStyle = '#1e293b';
  fctx.fillRect(0, 0, 512, 128);
  const csize = 32;
  for (let y = 0; y < 128; y += csize) {
    for (let x = 0; x < 512; x += csize) {
      if ((Math.floor(x / csize) + Math.floor(y / csize)) % 2 === 0) {
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(x, y, csize, csize);
      }
    }
  }
  const finishRoadTex = new THREE.CanvasTexture(finishLineCanvas);
  const finishRoadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 2.8),
    new THREE.MeshBasicMaterial({ map: finishRoadTex, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  finishRoadMesh.rotation.x = -Math.PI / 2;
  finishRoadMesh.position.set(0, 0.045, 0);
  group.add(finishRoadMesh);

  // Flanking celebratory championship flags fluttering on both sides
  const flagColors = ['#f59e0b', '#06b6d4', '#10b981', '#ef4444'];
  for (let side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 6.2, 8), darkTrussMat);
      pole.position.set(side * (10.2 + i * 1.6), 3.1, -2 + i * 2.2);
      group.add(pole);

      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.8),
        new THREE.MeshBasicMaterial({ color: flagColors[(i + (side > 0 ? 2 : 0)) % flagColors.length], side: THREE.DoubleSide })
      );
      flag.position.set(side * (10.2 + i * 1.6) + 0.6, 5.5, -2 + i * 2.2);
      group.add(flag);
    }
  }

  return group;
}

/**
 * Creates the official Tour of Lake Sayram 3D Victory Podium Celebration Scene.
 * Features a 3-tiered gold/silver/bronze pedestal, official backdrop banner,
 * 3 cheering winner cyclists raising golden trophies, confetti, and camera flash effects.
 */
export function createPodiumCelebration(scene, track) {
  const group = new THREE.Group();
  group.name = 'podiumCelebration';

  // Position at the finish line celebration plaza (s = 16m, offset = 9.5m on the scenic lakeside lawn)
  const p = track.sample(16);
  group.position.set(p.x + p.rx * 9.8, 0.05, p.z + p.rz * 9.8);
  // Face towards the track so camera can shoot with the lake and mountains in the background
  group.rotation.y = Math.atan2(-p.rx, -p.rz) + 0.25;

  // Red Victory Carpet
  const carpetMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.8 });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 7.5), carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, 1.8);
  group.add(carpet);

  // Gold carpet trim border
  const carpetTrimMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
  const carpetTrimL = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 7.5), carpetTrimMat);
  carpetTrimL.rotation.x = -Math.PI / 2;
  carpetTrimL.position.set(-3.2, 0.025, 1.8);
  group.add(carpetTrimL);
  const carpetTrimR = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 7.5), carpetTrimMat);
  carpetTrimR.rotation.x = -Math.PI / 2;
  carpetTrimR.position.set(3.2, 0.025, 1.8);
  group.add(carpetTrimR);

  // Pedestal tiers
  const tierMatDark = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.65, roughness: 0.25 });
  const silverMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.6, roughness: 0.3 });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: '#b45309', metalness: 0.55, roughness: 0.35 });

  // 1st Place (Center - Height 1.35m)
  const tier1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.35, 2.0), tierMatDark);
  tier1.position.set(0, 0.675, 0);
  group.add(tier1);
  const tier1Top = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.1, 2.05), goldMat);
  tier1Top.position.set(0, 1.35, 0);
  group.add(tier1Top);

  // 2nd Place (Left - Height 0.90m)
  const tier2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.90, 1.9), tierMatDark);
  tier2.position.set(-2.25, 0.45, 0);
  group.add(tier2);
  const tier2Top = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.09, 1.95), silverMat);
  tier2Top.position.set(-2.25, 0.90, 0);
  group.add(tier2Top);

  // 3rd Place (Right - Height 0.60m)
  const tier3 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.60, 1.8), tierMatDark);
  tier3.position.set(2.2, 0.30, 0);
  group.add(tier3);
  const tier3Top = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 1.85), bronzeMat);
  tier3Top.position.set(2.2, 0.60, 0);
  group.add(tier3Top);

  // Number Emblems on front faces
  function createNumberCanvas(num, color, subtitle) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = color;
    ctx.font = 'bold 120px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num, 128, 115);

    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(subtitle, 128, 205);
    return new THREE.CanvasTexture(c);
  }

  const num1Mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: createNumberCanvas('1', '#f59e0b', 'CHAMPION') }));
  num1Mesh.position.set(0, 0.68, 1.01);
  group.add(num1Mesh);

  const num2Mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: createNumberCanvas('2', '#cbd5e1', 'RUNNER-UP') }));
  num2Mesh.position.set(-2.25, 0.45, 0.96);
  group.add(num2Mesh);

  const num3Mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: createNumberCanvas('3', '#b45309', '3RD PLACE') }));
  num3Mesh.position.set(2.2, 0.32, 0.91);
  group.add(num3Mesh);

  // Grand Backdrop Board
  const backdropCanvas = document.createElement('canvas');
  backdropCanvas.width = 1024;
  backdropCanvas.height = 512;
  const bctx = backdropCanvas.getContext('2d');
  const bGrad = bctx.createLinearGradient(0, 0, 1024, 512);
  bGrad.addColorStop(0, '#0b1d28');
  bGrad.addColorStop(0.5, '#123847');
  bGrad.addColorStop(1, '#081720');
  bctx.fillStyle = bGrad;
  bctx.fillRect(0, 0, 1024, 512);

  // Gold border & decorative stars
  bctx.strokeStyle = '#f59e0b';
  bctx.lineWidth = 14;
  bctx.strokeRect(16, 16, 992, 480);

  bctx.fillStyle = '#f59e0b';
  bctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
  bctx.textAlign = 'center';
  bctx.fillText('★ 2026 环赛里木湖公路自行车赛 · 荣耀颁奖典礼 ★', 512, 90);

  bctx.fillStyle = '#ffffff';
  bctx.font = '900 60px "Segoe UI", sans-serif';
  bctx.fillText('TOUR OF LAKE SAYRAM', 512, 185);

  bctx.fillStyle = '#d3ed70';
  bctx.font = 'bold 32px "Segoe UI", sans-serif';
  bctx.fillText('OFFICIAL VICTORY PODIUM · 赛湖明珠', 512, 245);

  bctx.fillStyle = '#94a3b8';
  bctx.font = '22px "Segoe UI", sans-serif';
  bctx.fillText('“大西洋最后一滴眼泪” · 海拔 2071M · 极限竞技荣耀登顶', 512, 310);

  // Laurels & championship insignia
  bctx.fillStyle = '#f59e0b';
  bctx.font = '48px "Segoe UI", sans-serif';
  bctx.fillText('🏆  🥇 🥈 🥉  🏆', 512, 400);

  const backdropTex = new THREE.CanvasTexture(backdropCanvas);
  const backdropMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9.0, 4.5),
    new THREE.MeshStandardMaterial({ map: backdropTex, roughness: 0.35, side: THREE.DoubleSide })
  );
  backdropMesh.position.set(0, 3.4, -1.2);
  group.add(backdropMesh);

  // Flanking Truss Columns & Spotlights
  const trussMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 6.2, 8), trussMat);
    post.position.set(side * 4.6, 3.1, -1.2);
    group.add(post);

    const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8), goldMat);
    lamp.rotation.z = side * 0.5;
    lamp.position.set(side * 4.6, 5.8, -1.1);
    group.add(lamp);

    // Flanking celebratory flags
    const flagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.0),
      new THREE.MeshBasicMaterial({ color: side > 0 ? '#f59e0b' : '#06b6d4', side: THREE.DoubleSide })
    );
    flagMesh.position.set(side * 4.6 + (side > 0 ? 0.8 : -0.8), 5.0, -1.2);
    group.add(flagMesh);
  }

  // Helper function to build a detailed Golden Championship Trophy
  function createTrophy(metalMat) {
    const trophy = new THREE.Group();
    // Base pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.16, 12), tierMatDark);
    base.position.y = 0.08;
    trophy.add(base);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 10), metalMat);
    stem.position.y = 0.24;
    trophy.add(stem);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.36, 14), metalMat);
    cup.position.y = 0.50;
    trophy.add(cup);

    // Twin curved handles
    const handleL = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 12, Math.PI), metalMat);
    handleL.rotation.z = Math.PI * 0.5;
    handleL.position.set(-0.25, 0.52, 0);
    trophy.add(handleL);

    const handleR = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 12, Math.PI), metalMat);
    handleR.rotation.z = -Math.PI * 0.5;
    handleR.position.set(0.25, 0.52, 0);
    trophy.add(handleR);

    // Top gold star / crown
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.15, 6), metalMat);
    crown.position.y = 0.74;
    trophy.add(crown);

    return trophy;
  }

  // Create 3 Podium Winner Characters
  const winnerRiders = [];
  const tierConfigs = [
    { tierX: 0, tierY: 1.4, rank: 1, trophyMat: goldMat, scale: 1.05 },
    { tierX: -2.25, tierY: 0.95, rank: 2, trophyMat: silverMat, scale: 1.0 },
    { tierX: 2.2, tierY: 0.65, rank: 3, trophyMat: bronzeMat, scale: 0.98 }
  ];

  for (let i = 0; i < 3; i++) {
    const cfg = tierConfigs[i];
    const rider = new THREE.Group();
    rider.position.set(cfg.tierX, cfg.tierY, 0.1);
    rider.scale.setScalar(cfg.scale);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: '#f3c59a', roughness: 0.6 });
    const jerseyMat = new THREE.MeshStandardMaterial({ color: i === 0 ? '#10b981' : (i === 1 ? '#3b82f6' : '#ef4444'), roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: i === 0 ? '#f59e0b' : '#38bdf8', roughness: 0.3 });
    const visorMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.9, roughness: 0.1 });

    // Torso / Cycling Jersey
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.72, 10), jerseyMat);
    torso.position.y = 0.95;
    rider.add(torso);

    // Legs / Pants
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8), pantsMat);
    legL.position.set(-0.14, 0.35, 0);
    rider.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8), pantsMat);
    legR.position.set(0.14, 0.35, 0);
    rider.add(legR);

    // Shoes
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.26), shoeMat);
    shoeL.position.set(-0.14, 0.05, 0.05);
    rider.add(shoeL);
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.26), shoeMat);
    shoeR.position.set(0.14, 0.05, 0.05);
    rider.add(shoeR);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), skinMat);
    head.position.y = 1.45;
    rider.add(head);

    // Cycling Helmet
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), helmetMat);
    helmet.scale.set(1.0, 0.8, 1.25);
    helmet.position.set(0, 1.54, -0.02);
    rider.add(helmet);

    // Sunglasses / Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.14), visorMat);
    visor.position.set(0, 1.47, 0.16);
    rider.add(visor);

    // Arms & Trophy Holding
    const armL = new THREE.Group();
    armL.position.set(-0.28, 1.22, 0);
    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8), jerseyMat);
    armLMesh.position.y = 0.22;
    armL.add(armLMesh);
    rider.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.28, 1.22, 0);
    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8), jerseyMat);
    armRMesh.position.y = 0.22;
    armR.add(armRMesh);
    rider.add(armR);

    // Trophy
    const trophy = createTrophy(cfg.trophyMat);
    if (cfg.rank === 1) {
      // 1st place holds trophy high above head with both hands!
      armL.rotation.z = -2.2;
      armR.rotation.z = 2.2;
      trophy.position.set(0, 1.95, 0.15);
      rider.add(trophy);
    } else {
      // 2nd and 3rd place hold trophy in raised right hand, waving left hand
      armR.rotation.z = 1.9;
      armL.rotation.z = -1.1;
      trophy.scale.setScalar(0.85);
      trophy.position.set(0.48, 1.6, 0.1);
      rider.add(trophy);
    }

    // Overhead Winner Name Tag
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    const nctx = nameCanvas.getContext('2d');
    nctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    nctx.roundRect ? nctx.roundRect(0, 0, 256, 64, 12) : nctx.fillRect(0, 0, 256, 64);
    nctx.fill();
    nctx.strokeStyle = cfg.rank === 1 ? '#f59e0b' : (cfg.rank === 2 ? '#cbd5e1' : '#b45309');
    nctx.lineWidth = 4;
    nctx.stroke();

    nctx.fillStyle = '#ffffff';
    nctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    nctx.textAlign = 'center';
    nctx.fillText(cfg.rank === 1 ? '🥇 冠军' : (cfg.rank === 2 ? '🥈 亚军' : '🥉 季军'), 128, 42);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true }));
    nameSprite.position.set(0, 2.3, 0);
    nameSprite.scale.set(1.4, 0.35, 1);
    rider.add(nameSprite);

    group.add(rider);
    winnerRiders.push({
      group: rider,
      armL,
      armR,
      trophy,
      jerseyMat,
      helmetMat,
      nameCanvas,
      nameTex,
      rank: cfg.rank
    });
  }

  // Celebration Confetti Particles floating over the podium
  const confettiCount = 50;
  const confettiGeo = new THREE.PlaneGeometry(0.12, 0.08);
  const confettiColors = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#ec4899', '#8b5cf6', '#ffffff'];
  const confettiList = [];

  for (let i = 0; i < confettiCount; i++) {
    const cMat = new THREE.MeshBasicMaterial({
      color: confettiColors[i % confettiColors.length],
      side: THREE.DoubleSide
    });
    const confettiMesh = new THREE.Mesh(confettiGeo, cMat);
    confettiMesh.position.set(
      (Math.random() - 0.5) * 6.5,
      1.5 + Math.random() * 3.5,
      (Math.random() - 0.5) * 3.0
    );
    confettiMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(confettiMesh);
    confettiList.push({
      mesh: confettiMesh,
      vy: 0.4 + Math.random() * 0.6,
      rotSpeed: (Math.random() - 0.5) * 4.0,
      initialY: confettiMesh.position.y
    });
  }

  // Camera Flash Bulb Visual Effect
  const flashLight = new THREE.PointLight(0xffffff, 0, 18);
  flashLight.position.set(0, 2.5, 4.0);
  group.add(flashLight);
  let flashTimer = 0;
  let flashNext = 1.2;

  scene.add(group);

  return {
    group,
    updateWinners(racers) {
      if (!racers || racers.length === 0) return;
      for (let i = 0; i < Math.min(3, racers.length); i++) {
        const r = racers[i];
        const w = winnerRiders[i];
        if (!w) continue;
        if (r.color) {
          w.jerseyMat.color.set(r.color);
        }
        // Update name tag
        const nctx = w.nameCanvas.getContext('2d');
        nctx.clearRect(0, 0, 256, 64);
        nctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        nctx.fillRect(0, 0, 256, 64);
        nctx.strokeStyle = w.rank === 1 ? '#f59e0b' : (w.rank === 2 ? '#cbd5e1' : '#b45309');
        nctx.lineWidth = 5;
        nctx.strokeRect(4, 4, 248, 56);

        nctx.fillStyle = '#ffffff';
        nctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
        nctx.textAlign = 'center';
        const rankPrefix = w.rank === 1 ? '🥇 ' : (w.rank === 2 ? '🥈 ' : '🥉 ');
        nctx.fillText(rankPrefix + (r.name || ('车手 ' + (i + 1))), 128, 40);
        w.nameTex.needsUpdate = true;
      }
    },
    update(dt, elapsed) {
      // 1. Cheering animations for the 3 winners
      winnerRiders.forEach((w, idx) => {
        const phase = elapsed * 3.5 + idx * 1.8;
        // Waving and raising trophy joyfully
        if (w.rank === 1) {
          w.trophy.position.y = 1.95 + Math.sin(phase) * 0.14;
          w.group.position.y = tierConfigs[0].tierY + Math.abs(Math.sin(phase * 0.8)) * 0.05;
        } else {
          w.armR.rotation.z = 1.9 + Math.sin(phase) * 0.25;
          w.armL.rotation.z = -1.1 + Math.cos(phase * 1.2) * 0.2;
          w.group.position.y = tierConfigs[idx].tierY + Math.abs(Math.sin(phase * 0.7)) * 0.04;
        }
      });

      // 2. Confetti falling and swirling
      confettiList.forEach(c => {
        c.mesh.position.y -= c.vy * dt;
        c.mesh.rotation.x += c.rotSpeed * dt;
        c.mesh.rotation.z += c.rotSpeed * dt * 0.8;
        if (c.mesh.position.y < 0.1) {
          c.mesh.position.y = 4.8 + Math.random() * 0.8;
        }
      });

      // 3. Camera flash bulb periodic flare
      flashTimer += dt;
      if (flashTimer > flashNext) {
        flashTimer = 0;
        flashNext = 1.0 + Math.random() * 1.5;
        flashLight.intensity = 4.5;
        flashLight.position.x = (Math.random() - 0.5) * 4.0;
      }
      if (flashLight.intensity > 0) {
        flashLight.intensity = Math.max(0, flashLight.intensity - dt * 25);
      }
    },
    triggerCameraFlash() {
      flashLight.intensity = 8.0;
      flashLight.position.set(0, 2.4, 3.8);
    },
    getPhotoCameraPose() {
      // Frame the podium from front-center slightly elevated
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y);
      const camPos = group.position.clone()
        .add(forward.clone().multiplyScalar(6.5))
        .add(new THREE.Vector3(0, 2.2, 0));
      const targetPos = group.position.clone().add(new THREE.Vector3(0, 1.8, 0));
      return { position: camPos, target: targetPos };
    }
  };
}

export const SAYRAM_WEATHER_PRESETS = {
  sunny: {
    id: 'sunny',
    name: '赛湖晴昼',
    sub: '湛蓝天光 · 纯净碧波',
    icon: '☀️',
    skyColor: 0x94c2d4,
    fogColor: 0x9fc8d6,
    fogDensity: 0.00045,
    hemiSky: 0xedf8f2,
    hemiGround: 0x748979,
    hemiIntensity: 2.0,
    sunColor: 0xfff0d0,
    sunIntensity: 2.2,
    sunPos: [-120, 300, 70],
    waterColor: 0x57979e,
    headlight: false
  },
  sunset: {
    id: 'sunset',
    name: '赛湖金霞',
    sub: '日照金山 · 晚霞波光',
    icon: '🌅',
    skyColor: 0xdf8459,
    fogColor: 0xde7b50,
    fogDensity: 0.00065,
    hemiSky: 0xffd2a0,
    hemiGround: 0x6e3c28,
    hemiIntensity: 1.6,
    sunColor: 0xff6622,
    sunIntensity: 2.8,
    sunPos: [-350, 110, -180],
    waterColor: 0xb5573e,
    headlight: false
  },
  starlit: {
    id: 'starlit',
    name: '暗夜星河',
    sub: '高原银河 · 车灯破晓',
    icon: '🌌',
    skyColor: 0x0e172a,
    fogColor: 0x091022,
    fogDensity: 0.00095,
    hemiSky: 0x22355b,
    hemiGround: 0x0b111e,
    hemiIntensity: 0.9,
    sunColor: 0x6280b8,
    sunIntensity: 0.85,
    sunPos: [150, 260, -90],
    waterColor: 0x0f2238,
    headlight: true
  }
};

export class WeatherAtmosphereManager {
  constructor(scene, skyDome, sayramWater, directionalLight, hemiLight) {
    this.scene = scene;
    this.skyDome = skyDome;
    this.sayramWater = sayramWater;
    this.directionalLight = directionalLight;
    this.hemiLight = hemiLight;
    this.currentMode = 'sunny';
    this.headlight = null;
  }

  getPreset() {
    const preset = SAYRAM_WEATHER_PRESETS[this.currentMode] || SAYRAM_WEATHER_PRESETS.sunny;
    return { ...preset, desc: preset.sub };
  }

  getCurrentPreset() {
    return this.getPreset();
  }

  attachHeadlight(bikeGroup) {
    if (!bikeGroup || this.headlight) return;
    const light = new THREE.SpotLight(0xfff8e8, 0, 50, Math.PI / 5.5, 0.45, 1.2);
    light.position.set(0, 1.1, 0.45);
    const target = new THREE.Object3D();
    target.position.set(0, 0.2, 18);
    bikeGroup.add(light);
    bikeGroup.add(target);
    light.target = target;
    this.headlight = light;
    if (this.currentMode === 'starlit') light.intensity = 4.2;
  }

  setWeather(mode) {
    const preset = SAYRAM_WEATHER_PRESETS[mode] || SAYRAM_WEATHER_PRESETS.sunny;
    this.currentMode = preset.id;
    if (this.skyDome && this.skyDome.material) {
      this.skyDome.material.color.setHex(preset.skyColor);
    }
    if (this.scene) {
      this.scene.background = new THREE.Color(preset.skyColor);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(preset.fogColor);
      }
    }
    if (this.hemiLight) {
      this.hemiLight.color.setHex(preset.hemiSky);
      this.hemiLight.groundColor.setHex(preset.hemiGround);
      this.hemiLight.intensity = preset.hemiIntensity;
    }
    if (this.directionalLight) {
      this.directionalLight.color.setHex(preset.sunColor);
      this.directionalLight.intensity = preset.sunIntensity;
      this.directionalLight.position.set(...preset.sunPos);
    }
    if (this.sayramWater && this.sayramWater.material) {
      this.sayramWater.material.color.setHex(preset.waterColor);
    }
    if (this.headlight) {
      this.headlight.intensity = preset.headlight ? 4.2 : 0;
    }
    return { ...preset, desc: preset.sub };
  }

  cycleWeather() {
    const keys = Object.keys(SAYRAM_WEATHER_PRESETS);
    const idx = keys.indexOf(this.currentMode);
    const nextKey = keys[(idx + 1) % keys.length];
    return this.setWeather(nextKey);
  }
}

export const BIKE_LIVERIES = {
  cyan: {
    id: 'cyan',
    name: '赛湖翡翠绿',
    tag: '环湖经典',
    frameColor: 0x00d2aa,
    accentColor: 0x0e5d52,
    jerseyColor: 0x00c49f,
    helmetColor: 0x00d2aa
  },
  orange: {
    id: 'orange',
    name: '烈焰熔岩橙',
    tag: '冲刺火焰',
    frameColor: 0xff5e1a,
    accentColor: 0x8a2400,
    jerseyColor: 0xff5500,
    helmetColor: 0xff8055
  },
  blue: {
    id: 'blue',
    name: '深海天蓝',
    tag: '湖心宝石',
    frameColor: 0x1e88e5,
    accentColor: 0x0d47a1,
    jerseyColor: 0x1976d2,
    helmetColor: 0x42a5f5
  },
  gold: {
    id: 'gold',
    name: '曜石黑金',
    tag: '冠军黑金',
    frameColor: 0x222226,
    accentColor: 0xf5a623,
    jerseyColor: 0x1a1a1c,
    helmetColor: 0xf5a623
  },
  purple: {
    id: 'purple',
    name: '霓虹电光紫',
    tag: '赛博狂飙',
    frameColor: 0x9c27b0,
    accentColor: 0x4a148c,
    jerseyColor: 0xaa00ff,
    helmetColor: 0xce93d8
  }
};

export const RECORDS_KEY = 'lakeriders_best_record';

export function getLocalRecords() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (_) {}
  return {
    bestTime: 0,
    bestTopKph: 0,
    totalRaces: 0,
    totalVictories: 0,
    totalHits: 0,
    totalDraftTime: 0
  };
}

export function saveLocalRecords(records) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }
  } catch (_) {}
}

export function updateRaceRecord({ finishTime, rank, topKph, hits = 0, draftTime = 0 }) {
  const current = getLocalRecords();
  current.totalRaces += 1;
  if (rank === 1) current.totalVictories += 1;
  current.totalHits += (hits || 0);
  current.totalDraftTime += Math.round(draftTime || 0);
  if (topKph > (current.bestTopKph || 0)) current.bestTopKph = Math.round(topKph * 10) / 10;

  let isNewRecord = false;
  if (finishTime > 0) {
    if (!current.bestTime || finishTime < current.bestTime) {
      current.bestTime = Math.round(finishTime * 10) / 10;
      isNewRecord = true;
    }
  }
  saveLocalRecords(current);
  return { records: current, isNewRecord };
}



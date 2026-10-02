import * as THREE from './vendor/three.module.js';
import {RiderSimulation,Track,RaceProgress,selectTarget,clamp,controlMapping,attackMapping,detectDrafting} from './core.mjs';
import {createBots,rankRacers,updateOvertakes,RiderCollisionWorld} from './ai.mjs';
import {generateEnergyPickups,collectEnergyPickups} from './pickups.mjs';
import {ITEM_TYPES,generateItemBoxes,collectItemBoxes,targetOrder} from './items.mjs';
import {MultiplayerClient,inviteUrl,invitedRoom} from './network.mjs';
import {RemoteRacer,serializeRacer} from './remote-racer.mjs';
import {crossedFinishMilestones} from './race-ui.mjs';
import {soundEngine, QQ_LOBBY_TRACKS, QQ_RACE_TRACKS} from './audio.mjs';
import {createSayramSkyDome,createSayramLakeWater,createKazakhYurts,createWildSwans,createSnowMountains,createFlowerPatches,createSprucePines,createSkyClouds,createLakesideRails,createScenicLandmarks,createConfettiParticleSystem,createSayramRoadTexture,createSayramMeadowTexture,createGrandFinishArch,createPodiumCelebration,SAYRAM_LANDMARKS,WeatherAtmosphereManager,SAYRAM_WEATHER_PRESETS,BIKE_LIVERIES,getLocalRecords,saveLocalRecords,updateRaceRecord} from './scenery.mjs';
import {PRESET_AVATARS,BOT_AVATARS,loadProfile,saveProfile,processUploadedImage,getRacerAvatarUrl,getPlayerAvatarUrl,generateOfficialCertificate,svgToDataUrl} from './profile.mjs';
import {TRACK_SECTORS,ACHIEVEMENTS,SectorTimer,GhostRecorder,GhostPlayback,AchievementManager,createGhostVisual,loadGhostLap,saveGhostLap} from './timetrial.mjs';
const $=s=>document.querySelector(s);
let raceMode='grand_prix';
const sectorTimer=new SectorTimer();
const ghostRecorder=new GhostRecorder();
const ghostPlayback=new GhostPlayback();
const achievementManager=new AchievementManager();
let ghostVisual=null;
let sectorSplitTimer=0;
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error(url+' '+r.status);return r.json();}
const [tuning,data]=await Promise.all([json('./data/tuning.json'),json('./data/track.json')]);
const track=new Track(data),canvas=$('#game'),renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.0));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.LinearToneMapping;renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=false;renderer.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();scene.background=new THREE.Color('#94c2d4');scene.fog=null;
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,2200);
const hemiLight=new THREE.HemisphereLight('#edf8f2','#748979',2.0);scene.add(hemiLight);const sun=new THREE.DirectionalLight('#fff0d0',2.2);sun.position.set(-120,300,70);scene.add(sun);
const colors={road:'#455252',edge:'#e9ecce',ground:'#94a58b',water:'#57979e',gravel:'#b6a37f',swamp:'#57684a',grass:'#c2d873',orange:'#f67b51',ink:'#193039',lime:'#d7ef83',energy:'#79e7ef',skin:'#efbd95',white:'#f2f1dd',pink:'#ff5d9e',pinkLight:'#ffb7d4',hair:'#4b2b2b',poison:'#41a928',portalCyan:'#4deeea',portalPurple:'#b879ff'};
const materials=Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,new THREE.MeshLambertMaterial({color:v})]));
const roadTexture=createSayramRoadTexture();materials.road.map=roadTexture;materials.road.color.set('#ffffff');
const groundTexture=createSayramMeadowTexture();materials.ground.map=groundTexture;materials.ground.color.set('#ffffff');
const boxes=new Map(),dummy=new THREE.Object3D(),boxGeometry=new THREE.BoxGeometry(1,1,1);
function box(x,y,z,w,h,d,material,rotation=0){if(!boxes.has(material))boxes.set(material,[]);boxes.get(material).push({x,y,z,w,h,d,rotation});}
function atBox(s,offset,y,w,h,d,material){const a=track.sample(s);box(a.x+a.rx*offset,y,a.z+a.rz*offset,w,h,d,material,Math.atan2(a.fx,a.fz));}
function mesh(geometry,material,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geometry,materials[material]||material);m.position.set(x,y,z);parent.add(m);return m;}
box(0,-.35,0,2600,.5,2600,'ground');
const sayramWater=createSayramLakeWater(scene,data);
for(let s=0;s<3000;s+=5){const a=track.sample(s),b=track.sample(s+5),h=Math.atan2(b.x-a.x,b.z-a.z),x=(a.x+b.x)/2,z=(a.z+b.z)/2,len=Math.hypot(b.x-a.x,b.z-a.z);box(x,.03,z,14,.12,len+.10,'road',h);
  for(const side of [-1,1]){box(x+a.rx*6.65*side,.101,z+a.rz*6.65*side,.13,.025,len+.12,'edge',h);if(s%25===0){atBox(s,8*side,.65,.15,1.3,.15,'white');atBox(s,8*side,1.05,.19,.12,.19,'orange');}}
  if(s%15===0)box(x,.104,z,.15,.02,2.5,'edge',h);
}
for(const zone of data.zones)for(let s=zone.from;s<zone.to;s+=4)atBox(s+2,(zone.minOffset+zone.maxOffset)/2,.126,zone.maxOffset-zone.minOffset,.025,4.2,zone.kind.toLowerCase());
for(const zone of data.features?.boosts||[]){const width=zone.maxOffset-zone.minOffset,center=(zone.minOffset+zone.maxOffset)/2;for(let s=zone.from;s<zone.to;s+=3){atBox(s+1.5,center,.15,width,.045,1.15,'lime');atBox(s+2.4,center,.16,Math.max(1.2,width*.46),.055,.28,'white');}}
for(const zone of data.features?.slows||[])for(let s=zone.from;s<zone.to;s+=3){for(let side=zone.minOffset+.8;side<zone.maxOffset;side+=1.8)atBox(s+1.5,side,.15,1.55,.05,2.7,(Math.floor((s-zone.from)/3)+Math.round(side*2))%4===0?'ink':'orange');}
for(const ramp of data.features?.ramps||[]){const steps=7;for(let i=0;i<steps;i++){const progress=(i+.5)/steps,height=.12+progress*1.7;atBox(ramp.s-ramp.length/2+progress*ramp.length,ramp.offset,height/2,ramp.width,height,ramp.length/steps+.12,i%2?'lime':'white');}}
const obstacles=data.obstacles.map(o=>{const a=track.sample(o.s);return {...o,x:a.x+a.rx*o.offset,z:a.z+a.rz*o.offset,energy:100,flash:0};});
const targetObstacles=obstacles.filter(o=>o.kind==='Target');
const pickupRoot=new THREE.Group();scene.add(pickupRoot);let energyPickups=[];
const itemRoot=new THREE.Group();scene.add(itemRoot);let itemBoxes=[];
function questionTexture(){const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#10252d';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#d3ed70';ctx.lineWidth=8;ctx.strokeRect(7,7,114,114);ctx.fillStyle='#edf3e9';ctx.font='900 82px Segoe UI';ctx.textAlign='center';ctx.fillText('?',64,94);return new THREE.CanvasTexture(c);}
function refreshEnergyPickups(sharedSeed){
  pickupRoot.clear();const seed=sharedSeed??Math.floor(Math.random()*4294967295);energyPickups=generateEnergyPickups(track,obstacles,tuning.worldPackCount,seed);
  for(const pickup of energyPickups){const group=new THREE.Group();group.position.set(pickup.x,.72,pickup.z);pickupRoot.add(group);const core=mesh(new THREE.OctahedronGeometry(.34,0),'energy',0,0,0,group);core.rotation.z=Math.PI/4;const ring=mesh(new THREE.TorusGeometry(.52,.045,7,18),new THREE.MeshBasicMaterial({color:colors.energy,transparent:true,opacity:.72}),0,0,0,group);ring.rotation.x=Math.PI/2;const crossA=mesh(new THREE.BoxGeometry(.12,.52,.12),'white',0,0,0,group),crossB=mesh(new THREE.BoxGeometry(.52,.12,.12),'white',0,0,0,group);pickup.mesh=group;pickup.core=core;pickup.ring=ring;}
}
function refreshItemBoxes(sharedSeed){
  itemRoot.clear();itemBoxes=generateItemBoxes(track,obstacles,energyPickups,7,sharedSeed??1);const labelMap=questionTexture();
  for(const item of itemBoxes){const group=new THREE.Group();group.position.set(item.x,.78,item.z);itemRoot.add(group);const cube=mesh(new THREE.BoxGeometry(.72,.72,.72),new THREE.MeshStandardMaterial({color:'#193039',emissive:'#d3ed70',emissiveIntensity:.12,roughness:.65}),0,0,0,group);cube.rotation.set(.16,.45,.08);const ring=mesh(new THREE.TorusGeometry(.56,.055,7,20),new THREE.MeshBasicMaterial({color:colors.lime,transparent:true,opacity:.75}),0,0,0,group);ring.rotation.x=Math.PI/2;for(const side of [-1,1]){const plate=mesh(new THREE.PlaneGeometry(.48,.48),new THREE.MeshBasicMaterial({map:labelMap,transparent:true,side:THREE.DoubleSide}),0,0,side*.38,group);plate.rotation.y=side<0?Math.PI:0;}item.mesh=group;item.cube=cube;item.ring=ring;}
}
for(const o of obstacles){const a=track.sample(o.s),rot=Math.atan2(a.fx,a.fz);
  if(o.kind==='Target'){const group=new THREE.Group();group.position.set(o.x,0,o.z);scene.add(group);mesh(new THREE.CylinderGeometry(.1,.16,.9,8),'ink',0,.45,0,group);mesh(new THREE.CapsuleGeometry(.3,.7,4,8),'orange',0,1.25,0,group);mesh(new THREE.SphereGeometry(.25,10,8),'white',0,1.95,0,group);o.mesh=group;}
  else if(o.kind==='Rock'){const rock=mesh(new THREE.DodecahedronGeometry(o.radius,0),'gravel',o.x,.35,o.z);rock.scale.y=.9;}
  else if(o.kind==='Truck'){box(o.x,1.25,o.z,2.4,2.5,4.6,'ink',rot);box(o.x+a.fx*2,1,o.z+a.fz*2,2.2,1.9,1.6,'orange',rot);}
  else {box(o.x,.65,o.z,1.8,1.3,.45,'orange',rot);box(o.x,.76,o.z,1.9,.2,.48,'white',rot);}
}
for(let i=0;i<10;i++){const s=i*300;for(const side of [-1,1]){atBox(s,8.4*side,1.8,.12,3.6,.12,'ink');atBox(s,8.4*side,3.1,.5,.7,.08,'lime');}}
createGrandFinishArch(scene,track);
const podiumCelebration=createPodiumCelebration(scene,track);
function label(text,s,offset,height,width=10){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=colors.ink;ctx.fillRect(0,0,768,128);ctx.fillStyle=colors.lime;ctx.font='bold 55px Segoe UI';ctx.textAlign='center';ctx.fillText(text,384,85);const a=track.sample(s),m=mesh(new THREE.PlaneGeometry(width,width/6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}),a.x+a.rx*offset,height,a.z+a.rz*offset);m.rotation.y=Math.atan2(a.fx,a.fz)+Math.PI;}
label('Q / E  ·  Z / C',24,-5,2.7,3.5);
for(const z of data.zones)label(z.kind.toUpperCase(),z.from-12,7,2.5,3.2);
for(const feature of data.features?.ramps||[])label('AIR RAMP',feature.s-18,feature.offset>0?-7:7,2.6,3.8);
for(const feature of data.features?.boosts||[])label('BOOST',feature.from-12,-7,2.5,3.2);
for(const feature of data.features?.slows||[])label('SLOW',feature.from-12,7,2.5,3.2);
for(const feature of data.features?.poisonZones||[])label('TOXIC GAS · 毒气',feature.from-14,0,2.8,4.2);
for(const portal of data.features?.portals||[])label('PORTAL · 捷径',portal.fromS-14,portal.fromOffset,2.8,4.2);
const poisonClouds=[];
for(const zone of data.features?.poisonZones||[]){
  for(let s=zone.from;s<=zone.to;s+=3.8){
    for(let off=zone.minOffset+1.2;off<=zone.maxOffset-1.2;off+=2.8){
      const a=track.sample(s);
      const cloud=mesh(new THREE.DodecahedronGeometry(1.2+(s%3)*.35,0),new THREE.MeshBasicMaterial({color:'#41a928',transparent:true,opacity:.26,depthWrite:false}),a.x+a.rx*off,.85+(s%2)*.4,a.z+a.rz*off);
      cloud.userData={baseY:cloud.position.y,phase:s*.08+off};
      poisonClouds.push(cloud);
    }
  }
}
const portalMeshes=[];
for(const portal of data.features?.portals||[]){
  const fromAt=track.sample(portal.fromS),fromH=Math.atan2(fromAt.fx,fromAt.fz);
  const entryGroup=new THREE.Group();
  entryGroup.position.set(fromAt.x+fromAt.rx*portal.fromOffset,1.6,fromAt.z+fromAt.rz*portal.fromOffset);
  entryGroup.rotation.y=fromH;
  scene.add(entryGroup);
  const entryRing=mesh(new THREE.TorusGeometry(portal.radius||2.2,.18,10,32),new THREE.MeshBasicMaterial({color:'#4deeea',transparent:true,opacity:.88}),0,0,0,entryGroup);
  const entryDisc=mesh(new THREE.CircleGeometry((portal.radius||2.2)-.1,24),new THREE.MeshBasicMaterial({color:'#2a7384',transparent:true,opacity:.45,side:THREE.DoubleSide}),0,0,0,entryGroup);
  portalMeshes.push({ring:entryRing,disc:entryDisc});

  const toAt=track.sample(portal.toS),toH=Math.atan2(toAt.fx,toAt.fz);
  const exitGroup=new THREE.Group();
  exitGroup.position.set(toAt.x+toAt.rx*portal.toOffset,1.6,toAt.z+toAt.rz*portal.toOffset);
  exitGroup.rotation.y=toH;
  scene.add(exitGroup);
  const exitRing=mesh(new THREE.TorusGeometry(portal.radius||2.2,.18,10,32),new THREE.MeshBasicMaterial({color:'#b879ff',transparent:true,opacity:.88}),0,0,0,exitGroup);
  const exitDisc=mesh(new THREE.CircleGeometry((portal.radius||2.2)-.1,24),new THREE.MeshBasicMaterial({color:'#602e8a',transparent:true,opacity:.45,side:THREE.DoubleSide}),0,0,0,exitGroup);
  portalMeshes.push({ring:exitRing,disc:exitDisc});
}
const trackPoopRoot=new THREE.Group();scene.add(trackPoopRoot);
const trackPoops=[];
function createTrackPoop(px,pz){
  const group=new THREE.Group();group.position.set(px,.02,pz);
  mesh(new THREE.ConeGeometry(.34,.38,8),materials.orange,0,.19,0,group);
  mesh(new THREE.SphereGeometry(.14,7,5),materials.orange,0,.36,0,group);
  trackPoopRoot.add(group);
  trackPoops.push({x:px,z:pz,mesh:group,active:true});
}
const cheerleaders=[];
function makeCheerleader(s,offset,phase){
  const at=track.sample(s),group=new THREE.Group();
  group.position.set(at.x+at.rx*offset,.02,at.z+at.rz*offset);
  group.rotation.y=Math.atan2(at.fx,at.fz)+(offset>0?Math.PI*0.5:-Math.PI*0.5);
  group.visible=false;
  scene.add(group);
  const body=new THREE.Group();
  group.add(body);
  mesh(new THREE.BoxGeometry(.16,.10,.28),'white',-.16,.05,.02,group);
  mesh(new THREE.BoxGeometry(.16,.10,.28),'white',.16,.05,.02,group);
  mesh(new THREE.CylinderGeometry(.07,.065,.55,8),'skin',-.16,.34,0,group);
  mesh(new THREE.CylinderGeometry(.07,.065,.55,8),'skin',.16,.34,0,group);
  mesh(new THREE.CylinderGeometry(.25,.38,.34,10),'pink',0,.74,0,body);
  mesh(new THREE.CylinderGeometry(.22,.24,.44,10),'pinkLight',0,1.08,0,body);
  mesh(new THREE.SphereGeometry(.22,10,8),'skin',0,1.48,0,body);
  const hair=mesh(new THREE.SphereGeometry(.24,10,8),'hair',0,1.52,-.02,body);hair.scale.set(1.02,.85,1.02);
  const visor=mesh(new THREE.BoxGeometry(.32,.06,.22),'pink',0,1.56,.14,body);visor.rotation.x=.15;
  const arms=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();
    arm.position.set(side*.28,1.24,0);
    body.add(arm);
    mesh(new THREE.CapsuleGeometry(.055,.34,3,6),'skin',0,.18,0,arm);
    const pom=mesh(new THREE.DodecahedronGeometry(.20,0),side<0?'#f43f5e':'#fde047',0,.42,0,arm);
    pom.scale.set(1.15,1.1,1.15);
    arms.push(arm);
  }
  cheerleaders.push({group,body,arms,station:s,phase,baseY:group.position.y});
}
for(const zone of data.features?.cheerZones||[])for(const side of [-1,1])for(let i=-2;i<=2;i++)makeCheerleader(zone.s+i*3.4,side*(13.8+(Math.abs(i)%2)*1.4),zone.s*.01+i*.8+(side>0?1.7:0));
const sayramSkyDome=createSayramSkyDome(scene);
const weatherManager=new WeatherAtmosphereManager(scene,sayramSkyDome,sayramWater,sun,hemiLight);
createSnowMountains(scene);
createFlowerPatches(scene,track);
createSprucePines(scene,track);
createSkyClouds(scene);
createLakesideRails(scene,track);
createScenicLandmarks(scene,track);
const sayramYurts=createKazakhYurts(scene,track);
const sayramSwans=createWildSwans(scene,track);
const finishConfetti=createConfettiParticleSystem(scene);
for(const [material,entries] of boxes){const batch=new THREE.InstancedMesh(boxGeometry,materials[material],entries.length);for(let i=0;i<entries.length;i++){const b=entries[i];dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.rotation,0);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);}batch.computeBoundingSphere();scene.add(batch);}
let currentProfile = loadProfile();

function makeAvatarCircleTexture(avatarUrl, rimColor = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;

  function draw(src) {
    ctx.clearRect(0, 0, 256, 256);
    const grad = ctx.createRadialGradient(128, 100, 20, 128, 128, 126);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚴', 128, 128);

    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.stroke();
    texture.needsUpdate = true;

    if (src) {
      const img = new Image();
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        ctx.clearRect(0, 0, 256, 256);
        ctx.save();
        ctx.beginPath();
        ctx.arc(128, 128, 116, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, 256, 256);
        ctx.restore();

        ctx.strokeStyle = rimColor;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(128, 128, 118, 0, Math.PI * 2);
        ctx.stroke();

        texture.needsUpdate = true;
      };
      img.src = src;
    }
  }

  draw(avatarUrl);

  return {
    texture,
    update(newUrl, newRim = rimColor) {
      rimColor = newRim;
      draw(newUrl);
    }
  };
}

function create3DAvatarFigureHead(avatarUrl, helmetColor = '#d7ef83', rimColor = '#ffffff') {
  const root = new THREE.Group();
  root.position.set(0, 1.95, 0.13);

  const headGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 32);
  const helmetMat = new THREE.MeshStandardMaterial({
    color: helmetColor,
    roughness: 0.45,
    metalness: 0.15
  });
  const headCylinder = new THREE.Mesh(headGeom, helmetMat);
  headCylinder.rotation.x = Math.PI / 2;
  root.add(headCylinder);

  const crownGeom = new THREE.SphereGeometry(0.335, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const crownMesh = new THREE.Mesh(crownGeom, helmetMat);
  crownMesh.position.set(0, 0.08, -0.01);
  crownMesh.scale.set(1.04, 0.55, 1.08);
  root.add(crownMesh);

  const finGeom = new THREE.ConeGeometry(0.10, 0.32, 5);
  const finMesh = new THREE.Mesh(finGeom, helmetMat);
  finMesh.position.set(0, 0.10, -0.22);
  finMesh.rotation.x = -Math.PI / 2.3;
  root.add(finMesh);

  const texHandler = makeAvatarCircleTexture(avatarUrl, rimColor);

  const frontDiscGeom = new THREE.CircleGeometry(0.285, 32);
  const frontDiscMat = new THREE.MeshBasicMaterial({
    map: texHandler.texture,
    side: THREE.FrontSide
  });
  const frontDisc = new THREE.Mesh(frontDiscGeom, frontDiscMat);
  frontDisc.position.set(0, 0, 0.112);
  root.add(frontDisc);

  const backDiscGeom = new THREE.CircleGeometry(0.285, 32);
  const backDiscMat = new THREE.MeshBasicMaterial({
    map: texHandler.texture,
    side: THREE.FrontSide
  });
  const backDisc = new THREE.Mesh(backDiscGeom, backDiscMat);
  backDisc.position.set(0, 0, -0.112);
  backDisc.rotation.y = Math.PI;
  root.add(backDisc);

  const visorGeom = new THREE.BoxGeometry(0.44, 0.09, 0.12);
  const visorMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.2,
    metalness: 0.8
  });
  const visor = new THREE.Mesh(visorGeom, visorMat);
  visor.position.set(0, 0.16, 0.12);
  root.add(visor);

  return {
    root,
    helmetMat,
    texHandler,
    updateAvatar(newUrl, newRim = rimColor) {
      texHandler.update(newUrl, newRim);
    },
    setHelmetColor(newColor) {
      if (typeof newColor === 'number') {
        helmetMat.color.setHex(newColor);
      } else {
        helmetMat.color.set(newColor);
      }
    }
  };
}

function createJerseyBackBib(avatarUrl, name, number = '01') {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 240;
  const ctx = c.getContext('2d');
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;

  function renderBib(src, riderName, riderNum) {
    ctx.clearRect(0, 0, 384, 240);
    ctx.fillStyle = '#f8fafcee';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, 368, 224, 24);
    else ctx.rect(8, 8, 368, 224);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, 368, 48, [24, 24, 0, 0]);
    else ctx.fillRect(8, 8, 368, 48);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LAKE RIDERS · 环湖赛', 192, 40);

    ctx.save();
    ctx.beginPath();
    ctx.arc(78, 142, 54, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚴', 78, 142);
    ctx.restore();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(78, 142, 54, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 68px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(riderNum || '01', 256, 146);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px Segoe UI, sans-serif';
    ctx.fillText(riderName || '赛湖骑手', 256, 192);
    texture.needsUpdate = true;

    if (src) {
      const img = new Image();
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(78, 142, 54, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 24, 88, 108, 108);
        ctx.restore();

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(78, 142, 54, 0, Math.PI * 2);
        ctx.stroke();

        texture.needsUpdate = true;
      };
      img.src = src;
    }
  }

  renderBib(avatarUrl, name, number);

  const bibGeom = new THREE.PlaneGeometry(0.32, 0.20);
  const bibMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const root = new THREE.Mesh(bibGeom, bibMat);
  root.position.set(0, 1.48, -0.22);
  root.rotation.set(-0.35, Math.PI, 0);

  return {
    root,
    texture,
    update(newUrl, newName = name, newNum = number) {
      name = newName;
      number = newNum;
      renderBib(newUrl, name, number);
    }
  };
}

const player=new THREE.Group();scene.add(player);const visual=new THREE.Group();player.add(visual);
weatherManager.attachHeadlight(player);
const wheels=[];for(const z of [-.7,.7]){const wheel=mesh(new THREE.TorusGeometry(.39,.055,8,20),'ink',0,.43,z,visual);wheel.rotation.y=Math.PI/2;wheels.push(wheel);const hub=mesh(new THREE.CylinderGeometry(.035,.035,.25,8),'white',0,.43,z,visual);hub.rotation.z=Math.PI/2;}
function tube(a,b,r,material,parent=visual){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p),m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),7),'lime',0,0,0,parent);m.material=materials[material];m.position.copy(p.add(q).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
for(const [a,b] of [[[-.04,.43,-.7],[0,.85,-.2]],[[0,.85,-.2],[0,.4,0]],[[0,.4,0],[0,.43,-.7]],[[0,.4,0],[0,1,.55]],[[0,1,.55],[0,.85,-.2]],[[0,1,.55],[0,.43,.7]]])tube(a,b,.045,'lime');
tube([-.42,1.12,.58],[.42,1.12,.58],.035,'ink');mesh(new THREE.BoxGeometry(.25,.10,.4),'ink',0,1,-.22,visual);
const torso=mesh(new THREE.CapsuleGeometry(.24,.43,4,8),'orange',0,1.42,-.07,visual);torso.rotation.x=.35;
const playerAvatarHead=create3DAvatarFigureHead(getPlayerAvatarUrl(currentProfile),materials.lime.color,'#ffffff');
visual.add(playerAvatarHead.root);
const playerJerseyBib=createJerseyBackBib(getPlayerAvatarUrl(currentProfile),currentProfile.nickname||'赛湖车手','01');
visual.add(playerJerseyBib.root);
const helmet={material:playerAvatarHead.helmetMat};
const arms=[],legs=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.29,1.65,.10);visual.add(arm);mesh(new THREE.CapsuleGeometry(.075,.40,3,6),'orange',0,-.23,0,arm);mesh(new THREE.SphereGeometry(.09,8,6),'ink',0,-.48,0,arm);arm.rotation.x=-.9;arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.18,1.1,-.25);visual.add(leg);mesh(new THREE.CapsuleGeometry(.10,.45,3,6),'ink',0,-.27,0,leg);mesh(new THREE.BoxGeometry(.16,.12,.32),'white',0,-.56,.09,leg);legs.push(leg);}
const nitroFlames=new THREE.Group();visual.add(nitroFlames);nitroFlames.position.set(0,.43,-.75);
const flameCore=mesh(new THREE.ConeGeometry(.14,.9,8),new THREE.MeshBasicMaterial({color:'#38bdf8',transparent:true,opacity:.9}),0,0,-.45,nitroFlames);flameCore.rotation.x=-Math.PI/2;
const flameGlow=mesh(new THREE.ConeGeometry(.24,1.4,8),new THREE.MeshBasicMaterial({color:'#f59e0b',transparent:true,opacity:.6}),0,0,-.7,nitroFlames);flameGlow.rotation.x=-Math.PI/2;
nitroFlames.visible=false;
const driftPuffRoot=new THREE.Group();scene.add(driftPuffRoot);
const driftPuffs=[];for(let i=0;i<14;i++){const p=mesh(new THREE.SphereGeometry(.22,6,5),new THREE.MeshBasicMaterial({color:'#e2e8f0',transparent:true,opacity:.35,depthWrite:false}),0,-100,0,driftPuffRoot);driftPuffs.push({mesh:p,life:0});}
function emitDriftPuff(px,pz){const p=driftPuffs.find(item=>item.life<=0);if(!p)return;p.mesh.position.set(px+(Math.random()-.5)*.3,.14,pz+(Math.random()-.5)*.3);p.life=.42;p.mesh.scale.setScalar(.45);}
function applyPlayerLivery(key){
  const liv=BIKE_LIVERIES[key]||BIKE_LIVERIES.cyan;
  playerAvatarHead.setHelmetColor(liv.helmetColor);
  torso.material.color.setHex(liv.jerseyColor);
  for(const a of arms)if(a.children[0])a.children[0].material.color.setHex(liv.jerseyColor);
  materials.lime.color.setHex(liv.frameColor);
}
const playerBat=new THREE.Group();mesh(new THREE.CylinderGeometry(.035,.02,.45,6),'orange',0,.22,0,playerBat);mesh(new THREE.CylinderGeometry(.065,.035,.55,6),'ink',0,.68,0,playerBat);playerBat.position.set(0,-.48,0);playerBat.rotation.x=Math.PI/2;playerBat.visible=false;arms[1].add(playerBat);
const playerPistol=new THREE.Group();mesh(new THREE.BoxGeometry(.06,.12,.18),'ink',0,-.48,.06,playerPistol);mesh(new THREE.BoxGeometry(.05,.06,.24),'white',0,-.44,.16,playerPistol);playerPistol.visible=false;arms[1].add(playerPistol);
const shadow=mesh(new THREE.CircleGeometry(1.15,28),new THREE.MeshBasicMaterial({color:'#10252d',transparent:true,opacity:.2,depthWrite:false}),0,.17,0,player);shadow.rotation.x=-Math.PI/2;shadow.scale.x=.55;
const packWind=new THREE.Group();player.add(packWind);const windStreaks=[];
for(let i=0;i<18;i++){const streak=mesh(new THREE.BoxGeometry(.018,.018,1.4+i%3*.35),new THREE.MeshBasicMaterial({color:i%3===0?colors.white:colors.energy,transparent:true,opacity:.34+i%4*.08,depthWrite:false}),(Math.random()-.5)*2.1,.35+Math.random()*1.55,-1.2-Math.random()*6,packWind);streak.userData.speed=7+Math.random()*8;windStreaks.push(streak);}packWind.visible=false;
const botConfigs=[
  {id:'bot-01',name:'AI·赤狐',color:'#ff8055',lane:-4.5,aggression:.24,skill:.97,seed:101},
  {id:'bot-02',name:'AI·山雀',color:'#f1c96b',lane:-2.1,aggression:.31,skill:1,seed:202},
  {id:'bot-03',name:'AI·蓝鲸',color:'#6fc8d0',lane:2.1,aggression:.22,skill:1.02,seed:303},
  {id:'bot-04',name:'AI·青鹿',color:'#9fcf86',lane:4.5,aggression:.36,skill:1.04,seed:404}
];
function shuffledBots(seed){const pool=botConfigs.map(config=>({...config}));let state=(Number(seed)>>>0)||1;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool;}
function riderLabel(text,color,avatarUrl=null){
  const c=document.createElement('canvas');c.width=384;c.height=96;const ctx=c.getContext('2d');
  ctx.fillStyle='#10252dee';ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(4,4,376,88,44);else ctx.rect(4,4,376,88);
  ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3.5;ctx.stroke();
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));
  sprite.position.set(0,2.85,0);sprite.scale.set(2.7,.68,1);
  if(avatarUrl){
    const img=new Image();img.crossOrigin='anonymous';
    img.onload=()=>{
      ctx.save();ctx.beginPath();ctx.arc(52,48,36,0,Math.PI*2);ctx.clip();
      ctx.drawImage(img,16,12,72,72);ctx.restore();
      ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(52,48,36,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=color;ctx.font='bold 32px Segoe UI, sans-serif';ctx.textAlign='left';ctx.fillText(text,102,60);
      sprite.material.map.needsUpdate=true;
    };
    img.src=avatarUrl;
  }else{
    ctx.fillStyle=color;ctx.font='bold 34px Segoe UI, sans-serif';ctx.textAlign='center';ctx.fillText(text,192,62);
  }
  return sprite;
}
const emotePalette={happy:{face:'#ffd84a',accent:'#45b7ff'},taunt:{face:'#b879ff',accent:'#ff6b9d'},panic:{face:'#72d8ff',accent:'#f7fbff'},angry:{face:'#ff635f',accent:'#ffca4f'}};
function drawCartoonFace(ctx,type,cx,cy,r){
  const palette=emotePalette[type]||emotePalette.happy;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.fillStyle=palette.face;ctx.strokeStyle='#10252d';ctx.lineWidth=r*.09;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(type==='happy'){
    ctx.beginPath();ctx.arc(cx-r*.36,cy-r*.08,r*.18,.1*Math.PI,.9*Math.PI);ctx.arc(cx+r*.36,cy-r*.08,r*.18,.1*Math.PI,.9*Math.PI);ctx.stroke();ctx.fillStyle='#8d2844';ctx.beginPath();ctx.arc(cx,cy+r*.18,r*.38,0,Math.PI);ctx.fill();ctx.fillStyle='#ff8eae';ctx.beginPath();ctx.ellipse(cx,cy+r*.43,r*.19,r*.1,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.accent;for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(cx+side*r*.7,cy+r*.02,r*.1,r*.2,side*.18,0,Math.PI*2);ctx.fill();}
  }else if(type==='taunt'){
    ctx.beginPath();ctx.moveTo(cx-r*.62,cy-r*.38);ctx.lineTo(cx-r*.2,cy-r*.5);ctx.moveTo(cx+r*.18,cy-r*.48);ctx.lineTo(cx+r*.63,cy-r*.28);ctx.stroke();ctx.fillStyle='#10252d';ctx.beginPath();ctx.ellipse(cx-r*.36,cy-r*.12,r*.08,r*.14,0,0,Math.PI*2);ctx.ellipse(cx+r*.37,cy-r*.08,r*.11,r*.08,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(cx-r*.38,cy+r*.28);ctx.quadraticCurveTo(cx+r*.15,cy+r*.58,cx+r*.55,cy+r*.12);ctx.stroke();ctx.fillStyle='#ff7fb2';ctx.beginPath();ctx.ellipse(cx+r*.25,cy+r*.38,r*.18,r*.1,-.28,0,Math.PI*2);ctx.fill();
  }else if(type==='panic'){
    ctx.fillStyle='#fff';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(cx+side*r*.35,cy-r*.1,r*.24,r*.32,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#10252d';ctx.beginPath();ctx.arc(cx+side*r*.35,cy-r*.05,r*.08,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';}ctx.fillStyle='#244a64';ctx.beginPath();ctx.ellipse(cx,cy+r*.43,r*.22,r*.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx+r*.63,cy-r*.52,r*.12,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.accent;ctx.beginPath();ctx.moveTo(cx+r*.63,cy-r*.78);ctx.quadraticCurveTo(cx+r*.86,cy-r*.48,cx+r*.62,cy-r*.28);ctx.quadraticCurveTo(cx+r*.39,cy-r*.48,cx+r*.63,cy-r*.78);ctx.fill();
  }else{
    ctx.beginPath();ctx.moveTo(cx-r*.62,cy-r*.5);ctx.lineTo(cx-r*.18,cy-r*.24);ctx.moveTo(cx+r*.62,cy-r*.5);ctx.lineTo(cx+r*.18,cy-r*.24);ctx.stroke();ctx.fillStyle='#10252d';ctx.beginPath();ctx.arc(cx-r*.34,cy-r*.05,r*.09,0,Math.PI*2);ctx.arc(cx+r*.34,cy-r*.05,r*.09,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.strokeStyle='#10252d';ctx.beginPath();ctx.roundRect(cx-r*.43,cy+r*.24,r*.86,r*.34,r*.08);ctx.fill();ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(cx+i*r*.16,cy+r*.25);ctx.lineTo(cx+i*r*.16,cy+r*.55);ctx.stroke();}ctx.strokeStyle=palette.accent;ctx.lineWidth=r*.12;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(cx+side*r*.74,cy-r*.62);ctx.quadraticCurveTo(cx+side*r*1.02,cy-r*.92,cx+side*r*.92,cy-r*1.08);ctx.stroke();}
  }ctx.restore();
}
function emoteCanvas(type,size=160){const c=document.createElement('canvas');c.width=size;c.height=size;const ctx=c.getContext('2d');drawCartoonFace(ctx,type,size/2,size/2,size*.39);return c;}
function itemCanvas(type,size=112){
  const c=document.createElement('canvas');c.width=size;c.height=size;const ctx=c.getContext('2d'),s=size/112;ctx.scale(s,s);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#10252d';ctx.lineWidth=7;
  if(!type){ctx.fillStyle='#193039';ctx.fillRect(12,12,88,88);ctx.strokeStyle='#d3ed70';ctx.strokeRect(14,14,84,84);ctx.fillStyle='#edf3e9';ctx.font='900 64px Segoe UI';ctx.textAlign='center';ctx.fillText('?',56,80);return c;}
  if(type==='grenade'){ctx.fillStyle='#445451';ctx.beginPath();ctx.arc(52,62,30,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#d3ed70';ctx.fillRect(42,20,26,18);ctx.strokeRect(42,20,26,18);ctx.beginPath();ctx.moveTo(63,22);ctx.quadraticCurveTo(88,6,88,30);ctx.strokeStyle='#ff8055';ctx.stroke();}
  if(type==='poop'){ctx.fillStyle='#9b613f';ctx.beginPath();ctx.moveTo(20,87);ctx.quadraticCurveTo(15,67,36,62);ctx.quadraticCurveTo(25,45,50,43);ctx.quadraticCurveTo(42,28,62,31);ctx.quadraticCurveTo(78,38,72,50);ctx.quadraticCurveTo(98,53,91,72);ctx.quadraticCurveTo(103,91,78,94);ctx.lineTo(38,94);ctx.quadraticCurveTo(19,94,20,87);ctx.fill();ctx.stroke();ctx.fillStyle='#edf3e9';ctx.beginPath();ctx.arc(47,65,7,0,Math.PI*2);ctx.arc(72,65,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#10252d';ctx.beginPath();ctx.arc(48,66,3,0,Math.PI*2);ctx.arc(71,66,3,0,Math.PI*2);ctx.fill();}
  if(type==='net'){ctx.strokeStyle='#79e7ef';ctx.lineWidth=6;ctx.strokeRect(20,20,72,72);ctx.lineWidth=4;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(20+i*18,20);ctx.lineTo(20+i*18,92);ctx.moveTo(20,20+i*18);ctx.lineTo(92,20+i*18);ctx.stroke();}ctx.strokeStyle='#10252d';ctx.lineWidth=6;ctx.strokeRect(20,20,72,72);}
  return c;
}
function emoteTexture(type){const c=document.createElement('canvas');c.width=256;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#10252df0';ctx.beginPath();ctx.roundRect(7,7,242,126,24);ctx.fill();ctx.strokeStyle=(emotePalette[type]||emotePalette.happy).accent;ctx.lineWidth=7;ctx.stroke();drawCartoonFace(ctx,type,128,68,48);ctx.fillStyle='#10252df0';ctx.beginPath();ctx.moveTo(108,132);ctx.lineTo(128,156);ctx.lineTo(148,132);ctx.fill();return new THREE.CanvasTexture(c);}
function createEmoteBadge(){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:emoteTexture('happy'),transparent:true,depthTest:false}));sprite.position.set(0,4.15,0);sprite.scale.set(1.9,1.18,1);sprite.visible=false;Object.assign(sprite.userData,{left:0,age:0,baseX:1.9,baseY:1.18});return sprite;}
function setEmoteBadge(sprite,type){sprite.material.map.dispose();sprite.material.map=emoteTexture(type);sprite.material.needsUpdate=true;sprite.userData.left=2.2;sprite.userData.age=0;sprite.visible=true;}
function animateEmoteBadge(sprite,dt){if(!sprite?.visible)return;sprite.userData.left=Math.max(0,sprite.userData.left-dt);sprite.userData.age+=dt;const intro=Math.min(1,sprite.userData.age/.2),bounce=1+Math.sin(sprite.userData.age*15)*.08*Math.max(0,1-sprite.userData.age/1.3),scale=intro*bounce;sprite.scale.set(sprite.userData.baseX*scale,sprite.userData.baseY*scale,1);sprite.material.opacity=Math.min(1,sprite.userData.left/.3);sprite.visible=sprite.userData.left>0;}
for(const button of document.querySelectorAll('[data-emote]'))button.querySelector('.emote-icon').append(emoteCanvas(button.dataset.emote,96));
const itemIconHost=$('#item-slot .item-icon');let itemIconType='';function renderItemIcon(type){if(type===itemIconType&&itemIconHost.childElementCount)return;itemIconType=type;itemIconHost.replaceChildren(itemCanvas(type));}
const playerEmoteBadge=createEmoteBadge();visual.add(playerEmoteBadge);
function makeBotVisual(config){
  const group=new THREE.Group(),body=new THREE.Group(),botMaterial=new THREE.MeshLambertMaterial({color:config.color});group.add(body);scene.add(group);
  const botWheels=[];for(const wheelZ of [-.7,.7]){const wheel=mesh(new THREE.TorusGeometry(.39,.055,7,16),'ink',0,.43,wheelZ,body);wheel.rotation.y=Math.PI/2;botWheels.push(wheel);}
  const line=(a,b,r=.045,material=botMaterial)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p),part=mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),material,0,0,0,body);part.position.copy(p.add(q).multiplyScalar(.5));part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());};
  for(const [a,b] of [[[-.04,.43,-.7],[0,.85,-.2]],[[0,.85,-.2],[0,.4,0]],[[0,.4,0],[0,.43,-.7]],[[0,.4,0],[0,1,.55]],[[0,1,.55],[0,.85,-.2]],[[0,1,.55],[0,.43,.7]]])line(a,b);
  line([-.4,1.12,.58],[.4,1.12,.58],.035,materials.ink);mesh(new THREE.CapsuleGeometry(.24,.43,3,7),botMaterial,0,1.42,-.07,body).rotation.x=.35;
  const botAvatarHead=create3DAvatarFigureHead(getRacerAvatarUrl(config.id),config.color,'#ffffff');
  body.add(botAvatarHead.root);
  const botJerseyBib=createJerseyBackBib(getRacerAvatarUrl(config.id),config.name,config.id.slice(-2));
  body.add(botJerseyBib.root);
  const botArms=[],botLegs=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.29,1.65,.1);body.add(arm);mesh(new THREE.CapsuleGeometry(.075,.38,3,6),botMaterial,0,-.22,0,arm);arm.rotation.x=-.9;botArms.push(arm);const leg=new THREE.Group();leg.position.set(side*.18,1.1,-.25);body.add(leg);mesh(new THREE.CapsuleGeometry(.1,.44,3,6),'ink',0,-.27,0,leg);botLegs.push(leg);}
  const botBat=new THREE.Group();mesh(new THREE.CylinderGeometry(.035,.02,.45,6),'orange',0,.22,0,botBat);mesh(new THREE.CylinderGeometry(.065,.035,.55,6),'ink',0,.68,0,botBat);botBat.position.set(0,-.48,0);botBat.rotation.x=Math.PI/2;botBat.visible=false;botArms[1].add(botBat);
  const botPistol=new THREE.Group();mesh(new THREE.BoxGeometry(.06,.12,.18),'ink',0,-.48,.06,botPistol);mesh(new THREE.BoxGeometry(.05,.06,.24),'white',0,-.44,.16,botPistol);botPistol.visible=false;botArms[1].add(botPistol);
  const nameLabel=riderLabel(config.name,config.color,getRacerAvatarUrl(config.id)),emoteBadge=createEmoteBadge();body.add(nameLabel,emoteBadge);
  return {group,body,wheels:botWheels,arms:botArms,legs:botLegs,nameLabel,emoteBadge,botMaterial,pedal:0,botBat,botPistol,botAvatarHead,botJerseyBib};
}
function setRiderIdentity(visual,name,color,avatarUrl=null){
  visual.botMaterial.color.set(color);
  if(visual.botAvatarHead){
    visual.botAvatarHead.setHelmetColor(color);
    if(avatarUrl)visual.botAvatarHead.updateAvatar(avatarUrl);
  }
  if(visual.botJerseyBib){
    visual.botJerseyBib.update(avatarUrl,name);
  }
  visual.nameLabel.material.map.dispose();
  const replacement=riderLabel(name,color,avatarUrl);
  visual.nameLabel.material.map=replacement.material.map;
  visual.nameLabel.material.needsUpdate=true;
}
const botVisuals=botConfigs.map(makeBotVisual);
let sim,progress,bots,remoteRacers=[],playerEntity,ranked=[],x,z,location,hits=0,received=0,collisions=0,overtakes=0,lastPlayerRank=0,collisionLock=0,paused=false,countdown=-1,toastLeft=0,milestoneLeft=0,scenicCardLeft=0,lastScenicSpot=null,look=0,looking=false,oldMouse=0,pedal=0,startedOnce=false,packFxLeft=0,hitFxLeft=0,hitFxSide=0,cameraShake=0,networkMode=false,networkRoom=null,networkSendLeft=0,networkRaceCode='',itemTargetIndex=0,itemEffectLeft=0,itemConfirmLeft=0;
const projectileRoot=new THREE.Group();scene.add(projectileRoot);const itemProjectiles=[];
let activeStunt = null, activeStuntTimer = 0, stuntDisplayTimer = 0;
const shockwaves = [];
const shockwaveGeo = new THREE.RingGeometry(0.22, 0.65, 32);
shockwaveGeo.rotateX(-Math.PI / 2);
function spawnTailShockwave(bx, bz, bHeading, type='drift'){
  const isLanding = type === 'landing';
  const ringColor = isLanding ? 0xf59e0b : 0x38bdf8;
  const forwardX = Math.sin(bHeading), forwardZ = Math.cos(bHeading);
  const tailX = bx - forwardX * 0.85;
  const tailZ = bz - forwardZ * 0.85;
  for(let i = 0; i < (isLanding ? 4 : 3); i++){
    const mat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ringMesh = new THREE.Mesh(shockwaveGeo, mat);
    ringMesh.position.set(tailX, 0.35 + i * 0.05, tailZ);
    ringMesh.scale.setScalar(0.4);
    scene.add(ringMesh);
    shockwaves.push({
      mesh: ringMesh,
      mat,
      delay: i * 0.05,
      life: 0.52,
      maxLife: 0.52,
      speed: 10 + i * 2.5,
      forwardX,
      forwardZ,
      maxScale: isLanding ? 4.8 : 3.8
    });
  }
  cameraShake = Math.max(cameraShake, isLanding ? 0.35 : 0.22);
}
function triggerStunt(stuntId, stuntName, points){
  if(!sim || sim.airLeft <= 0 || sim.crashLeft > 0) return;
  sim.performStunt(stuntName, points);
  activeStunt = stuntId;
  activeStuntTimer = 0.85;
  stuntDisplayTimer = 1.6;
  const card = $('#stunt-card');
  if(card){
    $('#stunt-title').textContent = '★ ' + stuntName + ' · 极限特技!';
    $('#stunt-sub').textContent = '+' + points + ' 技巧分 · 落地小喷充能!';
    card.classList.add('show');
  }
  tone(600, 0.15, 0.06);
}
const milestoneSeen=new Set();
const riderCollisions=new RiderCollisionWorld();
const network=new MultiplayerClient();
let opponentsCached=[],racersCached=[];
function updateRacerCaches(){opponentsCached=[...remoteRacers,...(bots||[])];racersCached=[playerEntity,...opponentsCached];}
const opponents=()=>opponentsCached;
const racers=()=>racersCached;
const keys=new Set();let pending={};
const bgmPlayer=soundEngine.bgmPlayer;
let bgmMuted=false;
function updateBgmButton(){
  const nameEl=$('#bgm-name');
  const actionEl=$('#bgm-action-tag');
  if(!nameEl)return;
  const track=bgmPlayer.getCurrentTrack();
  if(!track)return;
  const isPlaying=!bgmMuted&&bgmPlayer.isPlaying;
  nameEl.textContent=`《${track.title}》`;
  if(actionEl){
    actionEl.textContent=isPlaying?'⏸ 暂停':'▶ 播放';
    actionEl.className=isPlaying?'bgm-action-tag':'bgm-action-tag paused';
  }
  const btn=$('#btn-bgm');
  if(btn){
    btn.title=isPlaying?`当前播放《${track.title}》- 点击暂停`:`已暂停《${track.title}》- 点击播放`;
    btn.setAttribute('aria-label',btn.title);
  }
}
function toggleBgm(){
  soundEngine.init();
  if(!bgmMuted&&bgmPlayer.isPlaying){
    bgmMuted=true;
    soundEngine.stopBgm();
    updateBgmButton();
    const track=bgmPlayer.getCurrentTrack();
    toast(`⏸ 音乐已暂停（点击可恢复播放）`);
  }else{
    bgmMuted=false;
    const targetMode=(sim?.started&&!sim?.finished&&!sim?.playerFinishState)?'race':'lobby';
    soundEngine.setBgmMode(targetMode,true,false);
    updateBgmButton();
    const track=bgmPlayer.getCurrentTrack();
    toast(`▶ 恢复播放: 《${track.title}》- ${track.artist}`);
  }
}
$('#btn-bgm')?.addEventListener('click',toggleBgm);
$('#btn-bgm-next')?.addEventListener('click',(e)=>{
  e.stopPropagation();
  soundEngine.init();
  bgmMuted=false;
  bgmPlayer.nextTrack();
  updateBgmButton();
  const track=bgmPlayer.getCurrentTrack();
  toast(`⏭ 切换下一首: 《${track.title}》- ${track.artist}`);
});

let userInteracted=false;
function onFirstUserInteraction(){
  if(userInteracted)return;
  userInteracted=true;
  soundEngine.init();
  if(!soundEngine.muted&&!bgmMuted&&!soundEngine.isBgmPlaying()){
    const isRacing=sim?.started&&!sim?.finished&&!sim?.playerFinishState;
    soundEngine.setBgmMode(isRacing?'race':'lobby',true,true);
    updateBgmButton();
  }
}
window.addEventListener('pointerdown',onFirstUserInteraction,{once:true});
window.addEventListener('keydown',onFirstUserInteraction,{once:true});
function initAudio(){soundEngine.init();}
function tone(f,d=.15,volume=.04){soundEngine.tone(f,d,volume);}
const feedback={'EMERGENCY BRAKE':'急刹！','HIT':'碰撞 · 能量下降','HEAVY CRASH':'摔车 · 稍后回到赛道','CRASH':'失稳摔车','PUNCH':'挥拳','KICK':'踢腿','BAT':'挥棒重击！','PISTOL':'开枪射击！','POISON: DIZZY':'吸入毒气 · 视线眩晕！','POISON: COUGH':'吸入毒气 · 剧烈咳嗽！','POISON: SLOW':'吸入毒气 · 体力受阻！','PORTAL TELEPORT':'跃入传送门 · 捷径突围！','PACK COLLECTED':'拾取能量包 +1','ENERGY +30':'能量 +30','BOOST':'加速带 · 风压启动','NITRO BOOST':'⚡ 超音速氮气喷射！','DRIFT BOOST':'🔥 漂移集气大喷！','SLOW ZONE':'进入减速区','AIRBORNE':'腾空滑行！','ITEM GRENADE':'被手榴弹震下车！','ITEM POOP':'粑粑糊脸 · 速度下降','ITEM NET':'渔网缠住 · 转向受限','FINISH':'完成环湖挑战！'};
function toast(text){$('#toast').textContent=text;toastLeft=1.6;}
function showSectorSplitHUD(event){
  const el=$('#sector-split-hud');if(!el)return;
  const badge=$('#sector-badge'),name=$('#sector-name'),split=$('#sector-split'),delta=$('#sector-delta');
  if(badge)badge.textContent=`SECTOR ${event.sector.id}`;
  if(name)name.textContent=event.sector.name;
  if(split)split.textContent=`${event.splitTime.toFixed(2)}s`;
  if(delta){
    if(event.delta!==null){
      const sign=event.delta<=0?'-':'+';
      delta.textContent=`${sign}${Math.abs(event.delta).toFixed(2)}s`;
      delta.className='sector-delta '+(event.delta<=0?'faster':'slower');
      delta.style.display='inline-block';
    }else{
      delta.textContent='首次基准';
      delta.className='sector-delta faster';
      delta.style.display='inline-block';
    }
  }
  el.classList.add('show');
  sectorSplitTimer=3.5;
}
function showRaceMilestone(milestone){const el=$('#race-milestone');el.querySelector('strong').textContent=milestone.title;el.querySelector('span').textContent=milestone.subtitle;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');tone(milestone.at===2800?880:620,.35,.055);}
function showEmote(playerId,type){const target=playerId===playerEntity?.id?playerEmoteBadge:opponents().find(rider=>rider.id===playerId)?.visual?.emoteBadge;if(target)setEmoteBadge(target,type);}
function triggerEmote(type){if(!sim?.started||sim.finished||paused)return;showEmote(playerEntity.id,type);if(networkMode)network.emote(type);tone(type==='happy'?720:type==='taunt'?300:type==='panic'?520:170,.18,.035);}
function orderedItemTargets(){const list=targetOrder(playerEntity,opponents());if(!list.length)return [];itemTargetIndex=((itemTargetIndex%list.length)+list.length)%list.length;return list;}
function selectedItemTarget(){return orderedItemTargets()[itemTargetIndex]||null;}
function cycleItemTarget(){const list=orderedItemTargets();if(!list.length){toast('当前没有可选择的目标');return;}itemTargetIndex=(itemTargetIndex+1)%list.length;toast('道具目标 · '+list[itemTargetIndex].name);tone(420,.1,.025);}
function showItemEffect(type){const el=$('#item-effect'),meta=ITEM_TYPES[type];el.className=type+' show';el.querySelector('strong').textContent=type==='grenade'?'轰！震下车':type==='poop'?'糊脸了！':'渔网缠住！';itemEffectLeft=meta?.duration||1.5;}
function showItemConfirm(type,target,hit=true){const el=$('#item-confirm'),meta=ITEM_TYPES[type];el.querySelector('i').replaceChildren(itemCanvas(type));el.querySelector('b').textContent=hit?'命中 '+(target?.name||'对手'):'未命中';el.querySelector('small').textContent=hit?(meta?.name||'道具')+'生效 · '+(meta?.short||'干扰成功'):'目标受保护或状态已变化';el.className=(hit?'':'miss ')+'show';itemConfirmLeft=hit?2.1:1.6;tone(hit?760:150,.25,.055);}
function launchItemVisual(type,attacker,target){
  if(!attacker||!target)return;const material=new THREE.MeshBasicMaterial({color:ITEM_TYPES[type]?.color||colors.orange,transparent:true,opacity:.95}),geometry=type==='net'?new THREE.TorusGeometry(.28,.055,5,12):type==='poop'?new THREE.DodecahedronGeometry(.24,0):new THREE.SphereGeometry(.22,8,6),projectile=mesh(geometry,material,attacker.x,1.8,attacker.z,projectileRoot);itemProjectiles.push({mesh:projectile,from:new THREE.Vector3(attacker.x,1.8,attacker.z),target,age:0,duration:.48,type});
}
function launchBulletVisual(fromPos,toPos){
  const geom=new THREE.CylinderGeometry(.035,.035,.8,6),mat=new THREE.MeshBasicMaterial({color:'#ffee55',transparent:true,opacity:.95}),bullet=new THREE.Mesh(geom,mat);
  bullet.position.copy(fromPos);const dir=toPos.clone().sub(fromPos).normalize();bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);projectileRoot.add(bullet);
  itemProjectiles.push({mesh:bullet,from:fromPos.clone(),target:{x:toPos.x,z:toPos.z},age:0,duration:.18,isBullet:true});
}
function applyItemHit(attackerId,targetId,type){
  const list=racers(),attacker=list.find(rider=>rider.id===attackerId),target=list.find(rider=>rider.id===targetId);if(!attacker||!target)return false;launchItemVisual(type,attacker,target);if(type==='poop')createTrackPoop(attacker.x-Math.sin(attacker.heading)*2.5,attacker.z-Math.cos(attacker.heading)*2.5);const applied=target.receiveItem?.(type,attacker);if(applied){attacker.stats.itemHits=(attacker.stats.itemHits||0)+1;showEmote(target.id,type==='poop'?'angry':'panic');if(attacker===playerEntity){toast(ITEM_TYPES[type].name+'命中 '+target.name);showItemConfirm(type,target,true);}return true;}if(attacker===playerEntity)showItemConfirm(type,target,false);return false;
}
function useCarriedItem(){
  if(!playerEntity?.item||!sim.started||sim.finished||paused)return;const target=selectedItemTarget();if(!target){toast('没有可攻击的目标');return;}const type=playerEntity.item;if(networkMode){network.itemUse(target.id,type);toast('已投向 '+target.name);return;}if(applyItemHit(playerEntity.id,target.id,type)){playerEntity.item='';tone(ITEM_TYPES[type].color===colors.orange?120:330,.28,.065);}
}
let playerFinishState = 'none'; // 'none' | 'stopping' | 'podium'
let finishWaitTimer = 0;
let podiumTimer = 0;
let podiumStage = 0;

function startPodiumCeremony(){
  podiumTimer = 0;
  podiumStage = 0;
  ranked = rankRacers(racers());
  if(podiumCelebration){
    podiumCelebration.group.visible = true;
    podiumCelebration.updateWinners(ranked);
    podiumCelebration.setStage(0);
  }
}

function reset(options={}){document.body.classList.remove('results-open');playerFinishState='none';finishWaitTimer=0;podiumTimer=0;podiumStage=0;if(podiumCelebration)podiumCelebration.group.visible=false;networkMode=!!options.room;networkRoom=options.room||null;networkRaceCode=networkRoom?.code||'';const selectedTalent=$('#rider-talent')?.value||'balanced';sim=new RiderSimulation(tuning,{talent:selectedTalent});progress=new RaceProgress();location=track.sample(0);const roomPlayers=networkRoom?.players||[],localIndex=Math.max(0,roomPlayers.findIndex(item=>item.id===network.playerId)),grid=[-4.5,-2.1,0,2.1,4.5],startOffset=networkMode?grid[localIndex]:0;x=location.x+location.rx*startOffset;z=location.z+location.rz*startOffset;location=track.nearest(x,z);sim.heading=Math.atan2(location.fx,location.fz);smoothCamYaw=sim.heading;smoothAirY=0;accumulator=0;hits=0;received=0;collisions=0;overtakes=0;lastPlayerRank=0;collisionLock=0;packFxLeft=0;hitFxLeft=0;cameraShake=0;networkSendLeft=0;milestoneLeft=0;scenicCardLeft=0;lastScenicSpot=null;itemTargetIndex=0;itemEffectLeft=0;itemConfirmLeft=0;milestoneSeen.clear();$('#race-milestone').classList.remove('show');$('#scenic-card')?.classList.remove('show');$('#item-effect').className='';$('#item-confirm').className='';packWind.visible=false;$('#impact').style.opacity=0;projectileRoot.clear();itemProjectiles.length=0;keys.clear();pending={};paused=false;countdown=-1;startedOnce=false;riderCollisions.reset();refreshEnergyPickups(networkRoom?.seed);refreshItemBoxes(networkRoom?.seed);
  sectorTimer.reset();
  ghostRecorder.start();
  ghostPlayback.loadBestLap();
  if(ghostPlayback.hasGhost()){
    if(!ghostVisual){
      ghostVisual=createGhostVisual(THREE,scene);
    }
    ghostVisual.group.visible=true;
  }else if(ghostVisual){
    ghostVisual.group.visible=false;
  }
  trackPoopRoot.clear();trackPoops.length=0;for(const s of [560,1140,1940,2380]){const a=track.sample(s);createTrackPoop(a.x+a.rx*2.2,a.z+a.rz*2.2);}
  const remotePlayers=networkMode?roomPlayers.filter(item=>item.id!==network.playerId):[];remoteRacers=remotePlayers.map((roomPlayer,index)=>{const visual=botVisuals[index];setRiderIdentity(visual,roomPlayer.name,roomPlayer.color,getRacerAvatarUrl(roomPlayer.id));visual.group.visible=true;return new RemoteRacer(track,tuning,roomPlayer,visual,(targetId,attack)=>network.hit(targetId,attack));});
  const aiCount=networkMode?networkRoom.aiCount:4,aiConfigs=networkMode?shuffledBots(networkRoom.seed).slice(0,aiCount).map((config,index)=>({...config,lane:grid[roomPlayers.length+index]})):botConfigs;bots=createBots(track,tuning,aiConfigs);bots.forEach((bot,index)=>{const visual=botVisuals[remotePlayers.length+index];setRiderIdentity(visual,bot.name,bot.color,getRacerAvatarUrl(bot.id));bot.visual=visual;visual.group.visible=true;});for(let index=remotePlayers.length+bots.length;index<botVisuals.length;index++)botVisuals[index].group.visible=false;
  if(raceMode==='time_trial'){bots.forEach(b=>{b.visual.group.visible=false;});itemBoxes.forEach(item=>{if(item.mesh)item.mesh.visible=false;});}
  const localRoomPlayer=roomPlayers[localIndex];playerEntity={id:networkMode?network.playerId:'player',name:networkMode?localRoomPlayer?.name||'你':'你',color:networkMode?localRoomPlayer?.color||colors.lime:colors.lime,sim,progress,item:'',stats:{hits:0,received:0,collisions:0,overtakes:0,pickups:0,itemPickups:0,itemHits:0},finishTime:Infinity,lastRank:0,get x(){return x},get z(){return z},get heading(){return sim.heading},get offset(){return location.offset},get at(){return location},nudge(dx,dz){x+=dx;z+=dz},receiveCollision(damage,speedLoss,stabilityLoss){sim.damage(damage,speedLoss,stabilityLoss);collisions++;this.stats.collisions=collisions;cameraShake=Math.max(cameraShake,.2)},receiveHit(attack,attacker){const dx=x-attacker.x,dz=z-attacker.z,mag=Math.hypot(dx,dz)||1,rightX=Math.cos(sim.heading),rightZ=-Math.sin(sim.heading);hitFxSide=Math.sign((attacker.x-x)*rightX+(attacker.z-z)*rightZ)||1;hitFxLeft=.5;const isBat=!!attack.bat,isPistol=!!attack.pistol,isKick=!!attack.kick;cameraShake=isBat?.48:isKick?.38:isPistol?.26:.24;const speedLoss=isBat?7.5:isPistol?6.5:isKick?5.5:3,stabLoss=isBat?40:isKick?30:15;sim.damage(attack.damage,speedLoss,stabLoss);const push=isBat?.75:isKick?.55:.25;x+=dx/mag*push;z+=dz/mag*push;received++;this.stats.received=received;const name=isBat?'被球棒重击':isPistol?'被手枪射中':isKick?'被踢中':'被拳击命中';toast(name+' · -'+attack.damage+' 能量');if(isBat)soundEngine.playBatHit();else if(isPistol)soundEngine.playGunshot();else soundEngine.playPunchHit(isKick);},receiveItem(type){const applied=sim.applyItemEffect(type);if(applied){received++;this.stats.received=received;showItemEffect(type);showEmote(this.id,type==='poop'?'angry':'panic');cameraShake=Math.max(cameraShake,type==='grenade'?.72:.28);if(type==='grenade')soundEngine.playGrenadeExplode();else if(type==='poop')soundEngine.playPoopSplat();else if(type==='net')soundEngine.playNetSwish();}return applied;}};
  updateRacerCaches();
  ranked=racers();for(const o of obstacles){o.energy=100;o.flash=0;if(o.mesh){o.mesh.rotation.set(0,0,0);o.mesh.scale.setScalar(1);}}
  sim.onFeedback=e=>{
    toast(feedback[e]||e);
    if(e==='ENERGY +30')packFxLeft=1.35;
    if(e==='EMERGENCY BRAKE')soundEngine.playBrake(true);
    else if(e==='BAT')soundEngine.playBatSwing();
    else if(e==='PISTOL')soundEngine.playGunshot();
    else if(e==='SLIP CRASH'){soundEngine.playPunchHit(true);cameraShake=0.45;}
    else if(e==='DRIFT BOOST'){soundEngine.playNitroBoost();cameraShake=Math.max(cameraShake,0.25);}
    else if(e.includes('CRASH'))soundEngine.tone(65,.45,.1);
    else if(e==='ENERGY +30'||e==='PACK COLLECTED')soundEngine.playItemPickup();
    else if(e==='BOOST')soundEngine.playBoostFlare();
    else if(e==='NITRO BOOST'||e==='DRIFT BOOST'){soundEngine.playNitroBoost();cameraShake=Math.max(cameraShake,.32);}
    else soundEngine.tone(240,.15,.04);
    if(e==='FINISH'){
      bgmPlayer.stop();
      soundEngine.playVictory();
      soundEngine.playCheer();
      finishConfetti.trigger({x,y:2,z});
    }
  };
  sim.onRespawn=()=>{const safe=track.sample(location.s);x=safe.x;z=safe.z;sim.heading=Math.atan2(safe.fx,safe.fz);progress.lastS=safe.s;};
  sim.onAttack=attack=>{
    const isBat=!!attack.bat,isPistol=!!attack.pistol,isKick=!!attack.kick;
    if(isPistol){soundEngine.playGunshot();cameraShake=Math.max(cameraShake,.18);}
    else if(isBat){soundEngine.playBatHit();cameraShake=Math.max(cameraShake,.28);}
    else{soundEngine.playPunchHit(isKick);}
    const riderTargets=opponents().map(rider=>({x:rider.x,z:rider.z,energy:rider.sim.energy,ref:rider}));
    const chosen=selectTarget(riderTargets,x,z,sim.heading,attack);
    if(chosen){
      chosen.ref.receiveHit(attack,playerEntity);
      hits++;
      playerEntity.stats.hits=hits;
      const weaponName=isPistol?'手枪射中 ':isBat?'球棒重击 ':isKick?'精准侧踢 ':'重拳击中 ';
      toast('💥 '+weaponName+chosen.ref.name+' · -'+attack.damage+(isPistol?' (减速)':''));
      if(isPistol)launchBulletVisual(new THREE.Vector3(x,1.4,z),new THREE.Vector3(chosen.ref.x,1.2,chosen.ref.z));
      if(networkMode)network.hit(chosen.ref.id,attack);
      return;
    }
    if(isPistol){
      const targetPoint=new THREE.Vector3(x+Math.sin(sim.heading)*16,1.2,z+Math.cos(sim.heading)*16);
      launchBulletVisual(new THREE.Vector3(x,1.4,z),targetPoint);
      toast('手枪射击未命中目标');
      return;
    }
    const target=selectTarget(obstacles.filter(o=>o.kind==='Target'),x,z,sim.heading,attack);
    if(target){
      target.energy=Math.max(0,target.energy-attack.damage);
      target.flash=.35;hits++;playerEntity.stats.hits=hits;
      const weaponName=isPistol?'手枪射中':isBat?'球棒重击':isKick?'踢中':'拳击命中';
      toast(weaponName+' · 练习靶 -'+attack.damage);
      return;
    }
    toast(isBat?'挥棒落空 (需贴近身旁车手)':isKick?'飞踢未命中 (身旁无有效距离车手)':'拳击挥空 (身旁无有效距离车手)');
  };
  playerEmoteBadge.visible=false;camera.position.set(x-location.fx*8,4,z-location.fz*8);player.position.set(x,0,z);player.rotation.y=sim.heading;
  $('#panel').hidden=true;
  const dockEl=$('#quick-start-dock');if(dockEl)dockEl.style.display='flex';
  $('#pause').textContent='暂停 ESC';$('#countdown').textContent='';
}
const initialPanel=$('#panel').innerHTML;
function begin(seconds=1.5){
  startedOnce=true;
  initAudio();
  const pauseModal=$('#pause-overlay');
  if(pauseModal)pauseModal.hidden=true;
  if(!soundEngine.muted&&!bgmMuted){
    soundEngine.setBgmMode('race',true,true);
    updateBgmButton();
    const track=bgmPlayer.getCurrentTrack();
    toast(`🏁 开启比赛战歌: 《${track.title}》- ${track.artist}`);
  }
  $('#panel').hidden=true;
  const dockEl=$('#quick-start-dock');if(dockEl)dockEl.style.display='none';
  countdown=seconds;
  keys.clear();
  pending={};
  canvas.focus();
  const cdEl=$('#countdown');
  if(cdEl){
    cdEl.classList.remove('fade-out');
    cdEl.textContent=Math.ceil(countdown);
  }
  tone(440);
}
function startSimulation(){
  if(sim.started)return;
  $('#panel').hidden=true;
  const dockEl=$('#quick-start-dock');if(dockEl)dockEl.style.display='none';
  countdown=0;
  const cdEl=$('#countdown');
  if(cdEl){
    cdEl.textContent='GO! 出发';
    cdEl.classList.add('fade-out');
    setTimeout(()=>{ if(cdEl&&!countdown){ cdEl.textContent=''; cdEl.classList.remove('fade-out'); } }, 120);
  }
  sim.start();
  sim.protectionLeft=1.5;
  if(raceMode==='time_trial'){
    toast('⏱️ 纯速计时挑战开始！全力冲刺打破最佳单圈！');
  }else{
    bots.forEach(bot=>{bot.start();bot.sim.protectionLeft=1.5;});
    toast(networkMode?'联机比赛开始！':'出发！五车混战开始');
  }
  canvas.focus();
}
function showResults(){
  document.body.classList.add('results-open');
  if(!soundEngine.muted&&!bgmMuted){
    soundEngine.setBgmMode('lobby',true);
    updateBgmButton();
  }
  ranked=rankRacers(racers());
  podiumCelebration.updateWinners(ranked);
  podiumCelebration.triggerCameraFlash();

  const r1=ranked[0]||{name:'冠军车手',finishTime:sim.elapsed};
  const r2=ranked[1]||{name:'亚军车手',finishTime:sim.elapsed+2.4};
  const r3=ranked[2]||{name:'季军车手',finishTime:sim.elapsed+4.1};
  const place=ranked.indexOf(playerEntity)+1;
  const recordResult=updateRaceRecord({finishTime:sim.elapsed,rank:place,topKph:sim.topKph,hits,draftTime:sim.totalDraftTime});
  const completedGhostLap=ghostRecorder.stop(sim.elapsed, currentProfile?.nickname || riderName());
  let isNewGhostRecord=false;
  if(completedGhostLap&&completedGhostLap.samples.length>5){
    isNewGhostRecord=saveGhostLap(completedGhostLap);
    if(isNewGhostRecord)ghostPlayback.loadBestLap();
  }
  const newlyUnlocked=achievementManager.checkRunStats({
    topSpeedKph: sim.topKph,
    draftTime: sim.totalDraftTime,
    nitroUses: sim.nitroUses || 0,
    hitsLanded: hits,
    finished: true,
    finishTime: sim.elapsed,
    rank: place
  });
  if(newlyUnlocked.length>0){
    for(const ach of newlyUnlocked)toast(`🎖️ 解锁成就: ${ach.name}！`);
  }
  const sectorSplitsHTML=sectorTimer.renderSplitsSummaryHTML();
  const av1=getRacerAvatarUrl(r1.id, r1===playerEntity, currentProfile);
  const av2=getRacerAvatarUrl(r2.id, r2===playerEntity, currentProfile);
  const av3=getRacerAvatarUrl(r3.id, r3===playerEntity, currentProfile);
  $('#panel').hidden=false;
  const singleActions='<div class="results-actions"><button class="primary" id="again">再来一局 <span>↗</span></button><button class="results-secondary" id="back-home">返回主页 <span>⌂</span></button></div>';
  const networkActions='<p>你已冲线完赛，全员完赛后可由房主发起下一局。</p><div class="results-actions"><button class="primary" id="rematch" '+(networkRoom?.hostId===network.playerId?'':'disabled')+'>'+(networkRoom?.hostId===network.playerId?'发起下一局':'等待房主发起下一局')+' <span>↻</span></button><button class="results-secondary" id="back-home">返回主页 <span>⌂</span></button></div>';
  $('#panel').innerHTML=`
    <div class="podium-modal-card">
      <div class="podium-header">
        <span class="eyebrow" style="color:var(--lime)">TOUR OF LAKE SAYRAM · OFFICIAL VICTORY CEREMONY</span>
        <h2>★ 环赛里木湖荣耀颁奖合影 ★</h2>
        <p>冲线瞬间定格 · 1-2-3名齐聚领奖台高举奖杯欢呼合影</p>
      </div>
      <div class="podium-grid">
        <div class="podium-stand p-second">
          <span class="podium-trophy">🥈</span>
          <span class="podium-rank-badge">NO.2 亚军</span>
          <img class="podium-avatar" src="${av2}" alt="${escapeHtml(r2.name)}">
          <strong class="podium-racer-name">${escapeHtml(r2.name)}</strong>
          <span class="podium-racer-time">${formatTime(r2.finishTime||r2.elapsed||sim.elapsed+2.1)}</span>
        </div>
        <div class="podium-stand p-first">
          <span class="podium-trophy">🏆</span>
          <span class="podium-rank-badge">NO.1 冠军</span>
          <img class="podium-avatar" src="${av1}" alt="${escapeHtml(r1.name)}">
          <strong class="podium-racer-name">${escapeHtml(r1.name)}</strong>
          <span class="podium-racer-time">${formatTime(r1.finishTime||r1.elapsed||sim.elapsed)}</span>
        </div>
        <div class="podium-stand p-third">
          <span class="podium-trophy">🥉</span>
          <span class="podium-rank-badge">NO.3 季军</span>
          <img class="podium-avatar" src="${av3}" alt="${escapeHtml(r3.name)}">
          <strong class="podium-racer-name">${escapeHtml(r3.name)}</strong>
          <span class="podium-racer-time">${formatTime(r3.finishTime||r3.elapsed||sim.elapsed+3.8)}</span>
        </div>
      </div>
      <button id="snap-photo" class="podium-photo-btn">📸 官方快门合影 · 定格生成高光认证照片</button>
      <div class="results" style="margin-top:14px">
        ${recordResult.isNewRecord?'<div style="grid-column:1/-1;background:rgba(215,239,131,0.18);border:1px solid var(--lime);border-radius:8px;padding:8px 12px;color:var(--lime);font-weight:700">👑 创下历史最佳单圈纪录！</div>':''}
        ${isNewGhostRecord?'<div style="grid-column:1/-1;background:rgba(56,189,248,0.18);border:1px solid #38bdf8;border-radius:8px;padding:8px 12px;color:#38bdf8;font-weight:700">👻 创下历史最佳幽灵车单圈轨迹纪录！</div>':''}
        ${newlyUnlocked.length>0?`<div style="grid-column:1/-1;background:rgba(16,185,129,0.18);border:1px solid #10b981;border-radius:8px;padding:8px 12px;color:#34d399;font-weight:700">🎖️ 新解锁成就: ${newlyUnlocked.map(a=>a.name).join('、')}！</div>`:''}
        ${sectorSplitsHTML?`<div style="grid-column:1/-1">${sectorSplitsHTML}</div>`:''}
        <div>完赛用时<strong>${formatTime(sim.elapsed)}</strong></div>
        <div>最高速度<strong>${sim.topKph.toFixed(1)} km/h</strong></div>
        <div>尾流破风<strong>${sim.totalDraftTime.toFixed(1)} 秒</strong></div>
        <div>你的名次<strong>第 ${place} 名 (${place===1?'🥇登上最高领奖台':place<=3?'登台颁奖合影':'顺利完赛'})</strong></div>
        <div>命中 / 被击<strong>${hits} / ${received}</strong></div>
        <div>超车 / 摔车<strong>${playerEntity.stats.overtakes} / ${sim.crashes}</strong></div>
        <div>拾取补给<strong>${playerEntity.stats.pickups}</strong></div>
      </div>
      ${networkMode?networkActions:singleActions}
    </div>
  `;
  $('#snap-photo').onclick=()=>{
    soundEngine.playCameraShutter();
    soundEngine.playCheer();
    podiumCelebration.triggerCameraFlash();
    const flashEl=$('#photo-flash');
    if(flashEl){
      flashEl.classList.add('flash');
      setTimeout(()=>flashEl.classList.remove('flash'),120);
    }
    const certDataUrl=generateOfficialCertificate({
      playerName: currentProfile?.nickname || riderName(),
      avatarUrl: getPlayerAvatarUrl(currentProfile),
      title: currentProfile?.title || '赛湖破风之影',
      rank: place,
      finishTimeStr: formatTime(sim.elapsed),
      topKph: sim.topKph,
      draftTime: sim.totalDraftTime,
      hits: hits
    });
    const certPreview=$('#cert-img-preview'),downloadBtn=$('#download-cert-btn'),certModal=$('#cert-modal');
    if(certPreview)certPreview.src=certDataUrl;
    if(downloadBtn){
      downloadBtn.href=certDataUrl;
      downloadBtn.download='LakeRiders_Sayram_Certificate.png';
    }
    if(certModal)certModal.showModal();
    toast('📸 咔嚓！官方高光完赛认证照已定格生成');
  };
  if(!networkMode){
    $('#again').onclick=()=>{restore();begin();};
  }else{
    const rematchBtn=$('#rematch');
    if(rematchBtn&&networkRoom?.hostId===network.playerId){
      rematchBtn.onclick=()=>network.rematch();
    }
  }
  $('#back-home').onclick=()=>{
    if(networkMode)network.leave();
    restore();
  };
}
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function riderName(){return (currentProfile?.nickname||$('#nickname')?.value||sessionStorage.getItem('lake-rider-name')||'湖岸骑手').trim().slice(0,12);}
async function connectRoom(action){const status=$('#room-status');try{status.textContent='正在连接联机房间服务…';const name=riderName();sessionStorage.setItem('lake-rider-name',name);await network.connect();action(name);}catch(error){status.textContent=error.message;}}
async function copyText(value){try{await navigator.clipboard.writeText(value);return true;}catch{const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();return ok;}}
function showLobby(room){
  if(!soundEngine.muted&&!bgmMuted){
    soundEngine.setBgmMode('lobby',true);
    updateBgmButton();
  }
  networkRoom=room;const me=room.players.find(item=>item.id===network.playerId),host=room.hostId===network.playerId,allReady=room.players.length===room.humanSlots&&room.players.every(item=>item.ready&&item.connected!==false),missing=Math.max(0,room.humanSlots-room.players.length);
  $('#panel').hidden=false;$('#panel').innerHTML='<div class="eyebrow">ONLINE MULTIPLAYER ROOM</div><div class="room-code-row"><div class="room-code">'+room.code+'</div><span class="eyebrow">'+room.players.length+'/'+room.humanSlots+' HUMAN</span></div><div class="room-summary"><span>总车手 '+room.totalRiders+'</span><span>真人 '+room.humanSlots+'</span><span>AI '+room.aiCount+'</span></div><div class="room-tools"><button id="copy-code">复制房间码</button><button id="copy-link">复制邀请链接</button></div><p>'+(host?(room.humanSlots===1?'单人房间已就绪，AI 将自动补位，可以直接开赛。':'你是房主。真人席位凑齐并全部准备后即可开赛。'):'等待房主开始比赛。')+'</p><div class="room-list">'+room.players.map(player=>'<div class="room-player"><i style="background:'+player.color+'"></i><span>'+escapeHtml(player.name)+(player.id===room.hostId?' · 房主':'')+'</span><span>'+(player.connected===false?'重连中':player.ready?'已准备':'未准备')+'</span></div>').join('')+'</div><div class="lobby-actions"><button id="toggle-ready">'+(me?.ready?'取消准备':'准备')+'</button><button id="start-network" '+(!host||!allReady?'disabled':'')+'>房主开赛</button></div><button id="leave-room" class="primary">退出房间 <span>×</span></button><small>'+(missing?'还需 '+missing+' 名真人加入':room.humanSlots===1?'1 名真人 + '+room.aiCount+' 名 AI · 可直接开始':'真人席位已满 · 等待准备')+'</small>';
  $('#copy-code').onclick=async()=>toast(await copyText(room.code)?'房间码已复制':'复制失败，请手动选择');$('#copy-link').onclick=async()=>toast(await copyText(inviteUrl(room.code))?'邀请链接已复制':'复制失败，请手动选择');$('#toggle-ready').onclick=()=>network.ready(!me?.ready);$('#start-network').onclick=()=>{const btn=$('#start-network');if(btn){btn.disabled=true;btn.textContent='正在开赛…';}network.start();};$('#leave-room').onclick=()=>{network.leave();restore();};
}
function showNetworkResults(room){
  document.body.classList.add('results-open');const results=room.results||[],host=room.hostId===network.playerId;$('#panel').hidden=false;$('#panel').innerHTML='<div class="eyebrow">MULTIPLAYER RESULTS · ROOM '+room.code+'</div><h1>真人冲线结果</h1><div class="room-list">'+results.map(result=>'<div class="room-player"><i style="background:'+result.color+'"></i><span>第 '+result.rank+' 名 · '+escapeHtml(result.name)+'</span><strong>'+formatTime(result.elapsed)+'</strong></div>').join('')+'</div><p>'+(host?'当前队伍和房间码会保留。发起下一局后，全员重新准备。':'房间会继续保留，等待房主发起下一局。')+'</p><div class="results-actions"><button class="primary" id="rematch" '+(host?'':'disabled')+'>'+(host?'发起下一局':'等待房主发起下一局')+' <span>↻</span></button><button class="results-secondary" id="leave-results">返回主页 <span>⌂</span></button></div>';if(host)$('#rematch').onclick=()=>network.rematch();$('#leave-results').onclick=()=>{network.leave();restore();};
}
function wirePanel(){
  const saved=sessionStorage.getItem('lake-rider-name')||currentProfile.nickname;if(saved&&$('#nickname'))$('#nickname').value=saved;
  updateProfileDisplays();
  $('#profile-card-avatar-btn')?.addEventListener('click',()=>openProfileModal());
  $('#nickname')?.addEventListener('input',e=>{
    const val=e.target.value.trim().slice(0,12);
    if(val){
      currentProfile.nickname=val;
      saveProfile(currentProfile);
      updateProfileDisplays();
    }
  });
  const total=$('#total-riders'),ai=$('#ai-count'),humanHint=$('#human-count'),syncAi=()=>{const before=Number(ai.value)||0,max=Math.max(0,Number(total.value)-1);ai.innerHTML=Array.from({length:max+1},(_,index)=>'<option value="'+index+'">'+index+'</option>').join('');ai.value=String(Math.min(before,max));const humans=Number(total.value)-Number(ai.value);humanHint.textContent=(humans===1?'真人席位 1 · 你可以直接开赛':'真人席位 '+humans+' · 还可邀请 '+(humans-1)+' 位好友')+' · AI 性格随机';};total.onchange=syncAi;ai.onchange=syncAi;syncAi();ai.value=String(Math.min(3,Number(total.value)-1));syncAi();const invited=invitedRoom();if(invited){$('#room-code').value=invited;$('#room-status').textContent='已从邀请链接带入房间码 '+invited;}
  $('#start').onclick=()=>begin();$('#create-room').onclick=()=>connectRoom(name=>network.create(name,{totalRiders:Number(total.value),aiCount:Number(ai.value)}));$('#join-room').onclick=()=>connectRoom(name=>network.join($('#room-code').value,name));
  const closeBtn=$('#close-panel');if(closeBtn)closeBtn.onclick=hideRoomPanel;
  const modeSelect=$('#race-mode-select');
  if(modeSelect){
    modeSelect.value=raceMode;
    modeSelect.onchange=e=>setRaceMode(e.target.value);
  }
  updateModeDisplays();
  network.connect().catch(()=>{});
}
function restore(){
  document.body.classList.remove('results-open');
  $('#panel').innerHTML=initialPanel;
  reset();
  wirePanel();
  $('#panel').hidden=true;
  const dock=$('#quick-start-dock');
  if(dock)dock.style.display='flex';
  const pauseModal=$('#pause-overlay');
  if(pauseModal)pauseModal.hidden=true;
  $('#pause').textContent='暂停 ESC';
  $('#countdown').textContent='';
  // Returning to lobby: automatically randomize and play lobby music, display track name
  bgmMuted=false;
  soundEngine.init();
  soundEngine.setBgmMode('lobby',true,true);
  updateBgmButton();
}
function showRoomPanel(){
  $('#panel').hidden=false;
  const dock=$('#quick-start-dock');
  if(dock)dock.style.display='none';
}
function hideRoomPanel(){
  $('#panel').hidden=true;
  const dock=$('#quick-start-dock');
  if(dock&&(!sim||!sim.started))dock.style.display='flex';
}
if($('#btn-room-panel'))$('#btn-room-panel').onclick=showRoomPanel;
if($('#close-panel'))$('#close-panel').onclick=hideRoomPanel;
if($('#dock-config-btn'))$('#dock-config-btn').onclick=showRoomPanel;
if($('#dock-start-btn'))$('#dock-start-btn').onclick=()=>{
  hideRoomPanel();
  const dock=$('#quick-start-dock');
  if(dock)dock.style.display='none';
  begin(1.5);
};
network.addEventListener('room',event=>{const room=event.detail.room;if(room.phase==='lobby'){reset({room});startedOnce=false;showLobby(room);return;}if(room.phase==='countdown'||room.phase==='racing'){$('#panel').hidden=true;if(!startedOnce||networkRaceCode!==room.code){reset({room});begin(room.phase==='countdown'?Math.max(.1,(room.countdownAt-Date.now())/1000):.1);}}if(room.phase==='racing'&&networkRaceCode===room.code){$('#panel').hidden=true;startSimulation();}if(networkMode&&networkRaceCode===room.code){const active=new Set(room.players.map(player=>player.id)),left=remoteRacers.filter(rider=>!active.has(rider.id));for(const rider of left)rider.visual.group.visible=false;if(left.length){remoteRacers=remoteRacers.filter(rider=>active.has(rider.id));updateRacerCaches();toast(left.map(rider=>rider.name).join('、')+' 已离开比赛');}if(room.phase==='results'){toast('所有真人玩家已完成 · 房间继续保留');showNetworkResults(room);}}});
network.addEventListener('peer-state',event=>remoteRacers.find(rider=>rider.id===event.detail.playerId)?.apply(event.detail.state));
network.addEventListener('hit',event=>{if(!networkMode)return;const attacker=remoteRacers.find(rider=>rider.id===event.detail.attackerId)||{x,z};playerEntity.receiveHit(event.detail.attack,attacker);});
network.addEventListener('pickup',event=>{const pickup=energyPickups.find(item=>item.id===event.detail.pickupId);if(pickup?.active){pickup.active=false;if(pickup.mesh)pickup.mesh.visible=false;}});
network.addEventListener('item-pickup',event=>{const box=itemBoxes.find(item=>item.id===event.detail.boxId);if(box?.active){box.active=false;if(box.mesh)box.mesh.visible=false;}if(event.detail.playerId===playerEntity?.id){playerEntity.item=event.detail.item;toast('获得 '+ITEM_TYPES[event.detail.item].name+' · F 使用');tone(680,.22,.055);}else{const rider=remoteRacers.find(item=>item.id===event.detail.playerId);if(rider)rider.item=event.detail.item;}});
network.addEventListener('item-hit',event=>{if(event.detail.attackerId===playerEntity?.id)playerEntity.item='';const attacker=remoteRacers.find(item=>item.id===event.detail.attackerId);if(attacker)attacker.item='';applyItemHit(event.detail.attackerId,event.detail.targetId,event.detail.item);});
network.addEventListener('item-miss',event=>{const target=racers().find(item=>item.id===event.detail.targetId);showItemConfirm(event.detail.item,target,false);});
network.addEventListener('emote',event=>showEmote(event.detail.playerId,event.detail.emote));
network.addEventListener('error',event=>{const status=$('#room-status');if(status)status.textContent=event.detail.message;else toast(event.detail.message);});
network.addEventListener('connection',event=>{
  const el=$('#net-status');
  if(el){
    el.textContent=event.detail.connected?'网络已连接':'网络已断开';
    el.classList.toggle('online',event.detail.connected);
  }
  const roomStatus=$('#room-status');
  if(roomStatus){
    roomStatus.textContent=event.detail.connected?'公网房间已就绪 · 无需账号':'无法连接联机房间服务';
  }
});
network.addEventListener('latency',event=>{const el=$('#net-status');el.textContent='延迟 '+event.detail.ms+'ms · '+event.detail.grade;el.classList.add('online');});
network.addEventListener('resumed',event=>{const state=event.detail.state;if(state&&networkMode){x=state.x;z=state.z;sim.heading=state.heading;progress.distance=state.distance;progress.checkpoints=state.checkpoints;for(const key of ['speed','energy','packs','state','attackLeft','attackSide','attackIsKick','crashLeft','protectionLeft','boostLeft','slowLeft','poopLeft','netLeft','airLeft','airDuration','jumpHeight','elapsed','finished'])if(state[key]!==undefined)sim[key]=state[key];playerEntity.item=event.detail.item||'';location=track.nearest(x,z);}toast('连接已恢复 · 继续比赛');});
network.addEventListener('disconnected',()=>{if(networkMode)toast('联机服务已断开 · 当前比赛继续本地运行');});
function pause(value=!paused){
  if(!startedOnce||sim.finished)return;
  if(networkMode){toast('联机比赛持续进行，无法暂停');return;}
  paused=value;
  keys.clear();
  pending={};
  $('#pause').textContent=paused?'继续 ESC':'暂停 ESC';
  $('#countdown').textContent=paused?'已暂停':'';
  const pauseModal=$('#pause-overlay');
  if(pauseModal)pauseModal.hidden=!paused;
  if(!paused)canvas.focus();
}

function exitToLobby(){
  if(paused)pause(false);
  const pauseModal=$('#pause-overlay');
  if(pauseModal)pauseModal.hidden=true;
  if(networkMode){
    try{network.leave();}catch(_){}
    networkMode=false;
  }
  restore();
  toast('🚪 已退出比赛，已返回准备大厅');
}

$('#btn-quit')?.addEventListener('click',exitToLobby);
$('#footer-quit')?.addEventListener('click',exitToLobby);
$('#pause-quit-btn')?.addEventListener('click',exitToLobby);
$('#pause-resume-btn')?.addEventListener('click',()=>pause(false));
$('#pause-restart-btn')?.addEventListener('click',()=>{
  pause(false);
  reset();
  begin(1.5);
  toast('↺ 比赛已重新开始！');
});
function updateSoundButton(){
  const isMuted=soundEngine.muted;
  const btn=$('#sound');
  if(btn){
    btn.textContent=isMuted?'声音 关':'声音 开';
    btn.setAttribute('aria-pressed',String(!isMuted));
  }
}
updateSoundButton();
$('#pause').onclick=()=>pause();$('#restart').onclick=()=>{if(networkMode)network.leave();restore();};$('#sound').onclick=()=>{
  soundEngine.init();
  const isMuted=soundEngine.toggleMute();
  if(isMuted){
    soundEngine.stopBgm();
  }else if(!bgmMuted){
    const isRacing=sim?.started&&!sim?.finished&&!paused;
    soundEngine.setBgmMode(isRacing?'race':'lobby',true);
    updateBgmButton();
  }
  updateSoundButton();
  toast(isMuted?'🔇 全局静音已开启':'🔊 音效与音乐已开启');
};$('#pack').onclick=()=>{
  if(sim?.landingBoostReady){
    if(sim.triggerLandingBoost()){
      spawnTailShockwave(x,z,sim.heading,'landing');
      soundEngine.playNitroBoost?.();
      toast('🚀 完美落地小喷！冲刺波爆发！');
      return;
    }
  }else if(sim?.miniBoostReady){
    const wasDouble=sim.miniBoostCount===1;
    if(sim.triggerMiniBoost()){
      spawnTailShockwave(x,z,sim.heading,'drift');
      soundEngine.playDriftSkid?.();
      toast(wasDouble?'⚡ QQ飞车经典双喷！极速出弯！':'⚡ 漂移出弯小喷冲刺！');
      return;
    }
  }
  pending.pack=true;
  canvas.focus();
};$('#item-slot').onclick=()=>{useCarriedItem();canvas.focus();};$('#item-target').onclick=()=>{cycleItemTarget();canvas.focus();};
$('#weapon-bat').onclick=()=>{pending.attack=3;canvas.focus();};$('#weapon-pistol').onclick=()=>{pending.attack=4;canvas.focus();};
document.querySelectorAll('[data-emote]').forEach(button=>button.onclick=()=>triggerEmote(button.dataset.emote));
let helpWasPaused=false;$('#help').onclick=()=>{helpWasPaused=paused;pause(true);$('#instructions').showModal();};$('#close-help').onclick=()=>$('#instructions').close();$('#instructions').addEventListener('close',()=>{if(!helpWasPaused)pause(false);});
const handled=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE','KeyZ','KeyC','KeyV','KeyB','KeyF','KeyR','ShiftLeft','ShiftRight','KeyN','Space','Escape','Digit1','Digit2','Digit3','Digit4'];
addEventListener('keydown',e=>{
  if($('#instructions').open||$('#cert-modal')?.open||$('#profile-modal')?.open||$('#achievements-modal')?.open||$('#hall-of-fame')?.open||$('#scenic-gallery')?.open)return;
  if(!handled.includes(e.code))return;
  e.preventDefault();
  if(e.repeat)return;
  if(e.code==='Escape'){pause();return;}
  keys.add(e.code);

  if(!startedOnce&&countdown<0&&['Space','Enter','KeyW'].includes(e.code)){
    hideRoomPanel();
    const dock=$('#quick-start-dock');
    if(dock)dock.style.display='none';
    begin(1.5);
    return;
  }
  if(countdown>0&&['KeyW','Space','Enter','ArrowUp','KeyS','Digit1','Digit2','Digit3','Digit4'].includes(e.code)){
    tone(880);
    startSimulation();
    return;
  }
  if(paused||!sim.started)return;

  // Airborne Stunts: W, S, A, D, Q, E
  if(sim.airLeft>0&&sim.crashLeft<=0){
    if(['KeyW','ArrowUp'].includes(e.code)){
      triggerStunt('SUPERMAN','超人展翅',300);
      return;
    }else if(['KeyS','ArrowDown'].includes(e.code)){
      triggerStunt('TABLETOP','横摆折车',350);
      return;
    }else if(['KeyA','ArrowLeft'].includes(e.code)){
      triggerStunt('NO-FOOTER','双脱脚飞跃',250);
      return;
    }else if(['KeyD','ArrowRight'].includes(e.code)){
      triggerStunt('TAILWHIP','神龙摆尾360',400);
      return;
    }else if(['KeyQ','KeyE'].includes(e.code)){
      triggerStunt('BARSPIN','极速转把360',300);
      return;
    }
  }

  if(['ShiftLeft','ShiftRight','KeyN'].includes(e.code)&&!sim.finished&&sim.speed*3.6<40&&sim.driftCharge<0.85){
    toast('💡 车速需达 40 km/h (40码) 以上方可入弯漂移！');
  }
  if(['KeyS','ArrowDown'].includes(e.code))pending.brakePressed=true;

  // Space key: Landing Boost or Drift Mini-Boost, or Energy Pack
  if(e.code==='Space'){
    if(sim.landingBoostReady){
      if(sim.triggerLandingBoost()){
        spawnTailShockwave(x,z,sim.heading,'landing');
        soundEngine.playNitroBoost?.();
        toast('🚀 完美落地小喷！冲刺波爆发！');
        return;
      }
    }else if(sim.miniBoostReady){
      const wasDouble=sim.miniBoostCount===1;
      if(sim.triggerMiniBoost()){
        spawnTailShockwave(x,z,sim.heading,'drift');
        soundEngine.playDriftSkid?.();
        toast(wasDouble?'⚡ QQ飞车经典双喷！极速出弯！':'⚡ 漂移出弯小喷冲刺！');
        return;
      }
    }else{
      pending.pack=true;
    }
  }

  if(e.code==='KeyF')useCarriedItem();
  if(e.code==='KeyR')cycleItemTarget();
  if(attackMapping[e.code])pending.attack=attackMapping[e.code];
  const emote={Digit1:'happy',Digit2:'taunt',Digit3:'panic',Digit4:'angry'}[e.code];
  if(emote)triggerEmote(emote);
});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{if(!networkMode)pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&!networkMode)pause(true);});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(countdown>0){tone(880);startSimulation();}if(e.button===2){looking=true;oldMouse=e.clientX;canvas.setPointerCapture(e.pointerId);}canvas.focus();});canvas.addEventListener('pointermove',e=>{if(looking){look=clamp(look-(e.clientX-oldMouse)*.006,-.96,.96);oldMouse=e.clientX;}});canvas.addEventListener('pointerup',()=>looking=false);
let prevDrafting=false,prevNitro=false,prevDrifting=false;
function physics(dt){
  if(paused)return;
  if(countdown>0){
    const previous=Math.ceil(countdown);
    countdown=Math.max(0,countdown-dt);
    const cdEl=$('#countdown');
    if(countdown>0){
      const curSec=Math.ceil(countdown);
      if(cdEl)cdEl.textContent=curSec;
      if(curSec!==previous)tone(440);
    }else{
      tone(880);
      startSimulation();
    }
    return;
  }
  const isFinishedCrossing=sim.finished||playerFinishState!=='none';
  const input=isFinishedCrossing?{accelerate:false,brake:true,steer:0}:{accelerate:keys.has('KeyW')||keys.has('ArrowUp'),brake:keys.has('KeyS')||keys.has('ArrowDown'),...controlMapping(keys),...pending};pending={};
  location=track.nearest(x,z,location?.s);const previousS=location.s;if(sim.airLeft<=0)sim.enterSurface(track.surfaceAt(location));
  if(sim.started&&!sim.finished){
    const isDrafting=detectDrafting(playerEntity,opponents());
    sim.applyDraft(isDrafting,dt);
    if(sim.drafting&&!prevDrafting){soundEngine.playSlipstream();toast('💨 进入破风尾流吸附区 · 极速破风！');}
    prevDrafting=sim.drafting;
    if(sim.isDrifting&&!prevDrifting)soundEngine.playDriftSkid();
    if(sim.isDrifting)emitDriftPuff(x,z);
    prevDrifting=sim.isDrifting;
    if(sim.nitroLeft>0&&!prevNitro){soundEngine.playNitroBoost();cameraShake=Math.max(cameraShake,.32);}
    prevNitro=sim.nitroLeft>0;
  }
  sim.step(dt,input,location.curvature);
  if(!sim.started)return;
  if(sim.crashLeft<=0&&!sim.finished){
    const dx=Math.sin(sim.heading)*sim.speed*dt,dz=Math.cos(sim.heading)*sim.speed*dt;x+=dx;z+=dz;location=track.nearest(x,z,previousS);const boost=track.featureAt('boosts',location),slow=track.featureAt('slows',location),ramp=track.crossedRamp(previousS,location.s,location.offset);if(boost)sim.boost();if(slow)sim.slow();if(ramp)sim.launch();
    const poison=track.featureAt('poisonZones',location);if(poison)sim.applyPoison();
    const portal=track.crossedPortal(previousS,location.s,location.offset);
    if(portal&&sim.teleport(portal.toS,portal.toOffset)){
      const toAt=track.sample(portal.toS);x=toAt.x+toAt.rx*portal.toOffset;z=toAt.z+toAt.rz*portal.toOffset;location=track.nearest(x,z,portal.toS);sim.heading=Math.atan2(toAt.fx,toAt.fz);
      const jumpedS=(portal.toS-portal.fromS+3000)%3000;
      progress.distance+=jumpedS;
      progress.lastS=location.s;
      const pf=$('#portal-flash');if(pf){pf.classList.add('flash');setTimeout(()=>pf.classList.remove('flash'),450);}tone(980,.4,.08);
    }
    for(const poop of trackPoops){if(poop.active&&Math.hypot(x-poop.x,z-poop.z)<.95){poop.active=false;poop.mesh.visible=false;sim.applyItemEffect('poop');tone(110,.35,.09);}}
    const previousDistance=progress.distance;
    let finished=progress.advance(location,Math.hypot(dx,dz),3000);
    const crossedArch=(progress.distance>=2995 && (location.s<40 && previousS>2960 || progress.distance>=3000));
    if((finished || crossedArch) && playerFinishState==='none'){
      playerEntity.finishTime=sim.elapsed;
      sim.finished=true;
      sim.state='Finished';
      playerFinishState='stopping';
      finishWaitTimer=2.8;
      const archAt=track.sample(0);
      finishConfetti.trigger({x:archAt.x,y:3.5,z:archAt.z});
      soundEngine.playVictory();
      soundEngine.playCheer();
      ranked=rankRacers(racers());
      const curRank=Math.max(1,ranked.indexOf(playerEntity)+1);
      toast(curRank===1?'🥇 率先冲过终点线！荣耀夺冠！减速驶入领奖广场...':`🏁 冲过终点线！斩获第 ${curRank} 名！减速驶入领奖广场...`);
    }
    for(const milestone of crossedFinishMilestones(previousDistance,progress.distance,milestoneSeen))showRaceMilestone(milestone);
    const sectorEvent=sectorTimer.onProgress(progress.distance,sim.elapsed);
    if(sectorEvent){
      showSectorSplitHUD(sectorEvent);
      if(sectorEvent.delta!==null&&sectorEvent.delta<=0)tone(1046,.22,.08);
      else tone(784,.18,.06);
    }
    ghostRecorder.sample(sim.elapsed,progress.distance,x,z,sim.heading,sim.speed*3.6);

    collisionLock=Math.max(0,collisionLock-dt);
    // Roadside fence / guardrail collision: road half-width is 7.0m, rails at 7.2m
    // Requirement: 时速低于80码撞击道路边边，或者撞击障碍物，会出现晃动并适当减速（绝不摔车）
    const roadLimit=7.05;
    if(Math.abs(location.offset)>roadLimit){
      const sideSign=Math.sign(location.offset);
      // Soft clamp back into road bounds and gently steer inward away from rails
      x=location.x+location.rx*(sideSign*6.92);
      z=location.z+location.rz*(sideSign*6.92);
      location=track.nearest(x,z,previousS);
      sim.heading+=-sideSign*0.1;

      // Moderate speed reduction (~24% loss) while keeping player moving (no sudden stop or crash)
      sim.speed=Math.max(3.0,sim.speed*0.76);
      sim.isDrifting=false; // Cancel drift on road fence contact
      sim.stability=Math.max(50,sim.stability-15); // Maintain stability so player never crashes

      // Camera and bike shaking
      cameraShake=Math.max(cameraShake,0.36);

      if(collisionLock<=0){
        soundEngine.tone(160,0.22,0.07);
        toast('⚠️ 刮擦道路护栏！车身晃动并减速');
        collisionLock=0.45;
      }
    }

    if(location.distance>tuning.boundary){
      // Off-track boundary safety recovery without crashing
      x=location.x;
      z=location.z;
      sim.speed=Math.max(3.0,sim.speed*0.7);
      cameraShake=0.3;
      toast('⚠️ 偏离赛道已安全复位');
    }

    if(sim.airLeft<=0&&collisionLock<=0)for(const obstacle of obstacles){
      const distance=Math.hypot(x-obstacle.x,z-obstacle.z);
      if(distance>=obstacle.radius+.45)continue;

      const kph=sim.speed*3.6;
      const big=obstacle.kind==='Truck',rock=obstacle.kind==='Rock',barrier=obstacle.kind==='Barrier';
      const obsName=big?'工程车':rock?'巨石':barrier?'施工路障':'路桩';

      if(kph>=80){
        // Requirement: 在时速80码以上撞击障碍物的时候会摔倒
        collisionLock=0.8;
        cameraShake=0.6;
        soundEngine.playPunchHit(true);
        sim.damage(big?tuning.truckDamage:rock?tuning.rockDamage:tuning.coneDamage,0,100,true);
        sim.crash(true);
        toast(`💥 时速超过80码(${Math.round(kph)} km/h)猛烈撞击${obsName}！失去平衡摔倒！`);
      }else{
        // Requirement: 时速低于80码撞击障碍物，会出现晃动并适当减速（绝不摔车）
        collisionLock=0.5;
        // Moderate deceleration (~28% loss) while keeping momentum
        sim.speed=Math.max(3.0,sim.speed*0.72);
        sim.energy=Math.max(15,sim.energy-8);
        sim.stability=Math.max(50,sim.stability-20);
        cameraShake=Math.max(cameraShake,0.34+(kph/80)*0.16);
        soundEngine.playPunchHit(false);

        // Push bike smoothly out of obstacle bounding volume
        const nx=distance>1e-6?(x-obstacle.x)/distance:location.rx;
        const nz=distance>1e-6?(z-obstacle.z)/distance:location.rz;
        x=obstacle.x+nx*(obstacle.radius+0.6);
        z=obstacle.z+nz*(obstacle.radius+0.6);
        sim.heading+=location.offset>obstacle.offset?0.14:-0.14;

        toast(`⚡ 撞击${obsName}！车身剧烈晃动并适当减速！`);
      }
      break;
    }
  } else if(playerFinishState==='stopping'){
    sim.speed=Math.max(0,sim.speed-18*dt);
    const dx=Math.sin(sim.heading)*sim.speed*dt,dz=Math.cos(sim.heading)*sim.speed*dt;
    x+=dx;z+=dz;
    location=track.nearest(x,z,previousS);
    finishWaitTimer-=dt;
    const allBotsDone=bots.every(b=>b.sim.finished);
    if(finishWaitTimer<=0||allBotsDone){
      bots.forEach((b,i)=>{
        if(!b.sim.finished){
          b.sim.finish();
          b.finishTime=sim.elapsed+0.6+i*0.4;
        }
      });
      sim.finish();
      playerFinishState='podium';
      startPodiumCeremony();
    }
  }
  const raceList=racers();
  let leaderDistance=0;
  for(let i=0;i<raceList.length;i++){const d=raceList[i].progress.distance;if(d>leaderDistance)leaderDistance=d;}
  for(const bot of bots)bot.step(dt,raceList,obstacles,leaderDistance,energyPickups);
  for(const remote of remoteRacers)remote.smooth(dt);
  riderCollisions.step(dt,raceList);
  for(const event of collectEnergyPickups(raceList,energyPickups,tuning.maxPacks)){if(event.pickup.mesh)event.pickup.mesh.visible=false;if(networkMode)network.pickup(event.pickup.id);if(event.racer===playerEntity)toast('拾取能量包 · 当前 ×'+sim.packs);}
  const itemCollectors=networkMode?[playerEntity]:raceList;for(const event of collectItemBoxes(itemCollectors,itemBoxes)){if(event.box.mesh)event.box.mesh.visible=false;if(networkMode){event.racer.item='';network.itemPickup(event.box.id,event.item);}else if(event.racer===playerEntity){toast('获得 '+ITEM_TYPES[event.item].name+' · F 使用');tone(680,.22,.055);}}
  if(networkMode){networkSendLeft-=dt;if(networkSendLeft<=0){network.state(serializeRacer(playerEntity));networkSendLeft=.08;}}
  ranked=updateOvertakes(raceList);overtakes=playerEntity.stats.overtakes;const playerRank=ranked.indexOf(playerEntity)+1;if(lastPlayerRank&&playerRank<lastPlayerRank&&sim.elapsed>2)toast('升至第 '+playerRank+' 名');lastPlayerRank=playerRank;
}
const stateNames={Ready:'准备出发',Riding:'顺畅骑行',Braking:'制动',EmergencyBraking:'急刹',Leaning:'压弯',Attacking:'出手',UsingEnergyPack:'补充能量',Boosting:'加速带冲刺',Slowed:'减速区拖拽',Pooped:'粑粑糊脸 · 减速',Netted:'渔网缠绕 · 转向受限',Poisoned:'吸入毒气 · 眩晕中',Airborne:'空中滑行',Unstable:'失稳 · 请减速',Crash:'摔车恢复中',Finished:'🏁 顺利完赛'};
const surfaceNames={Asphalt:'柏油路',Gravel:'石子路',Swamp:'沼泽',Grass:'绿化加速区'};
function formatTime(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+(t%60).toFixed(1).padStart(4,'0');}
const mapCtx=$('#map').getContext('2d');const minX=Math.min(...data.points.map(p=>p.x)),maxX=Math.max(...data.points.map(p=>p.x)),minZ=Math.min(...data.points.map(p=>p.z)),maxZ=Math.max(...data.points.map(p=>p.z));
const mapScale=Math.min(164/(maxX-minX),144/(maxZ-minZ));const mapPoint=(x,z)=>[100+(x-(minX+maxX)/2)*mapScale,90-(z-(minZ+maxZ)/2)*mapScale];

const staticMapCanvas=document.createElement('canvas');staticMapCanvas.width=200;staticMapCanvas.height=180;
const staticMapCtx=staticMapCanvas.getContext('2d');
function renderStaticMap(){
  staticMapCtx.clearRect(0,0,200,180);staticMapCtx.strokeStyle='#bfd0c388';staticMapCtx.lineWidth=3;staticMapCtx.beginPath();
  data.points.forEach((point,index)=>{const a=mapPoint(point.x,point.z);index?staticMapCtx.lineTo(...a):staticMapCtx.moveTo(...a);});
  staticMapCtx.stroke();
  for(const ramp of data.features?.ramps||[]){const point=track.sample(ramp.s),a=mapPoint(point.x,point.z);staticMapCtx.fillStyle=colors.white;staticMapCtx.fillRect(a[0]-3,a[1]-3,6,6);}
  for(const boost of data.features?.boosts||[]){const point=track.sample(boost.from),a=mapPoint(point.x,point.z);staticMapCtx.fillStyle=colors.lime;staticMapCtx.fillRect(a[0]-2,a[1]-2,4,4);}
  for(const slow of data.features?.slows||[]){const point=track.sample(slow.from),a=mapPoint(point.x,point.z);staticMapCtx.fillStyle=colors.orange;staticMapCtx.fillRect(a[0]-2,a[1]-2,4,4);}
  for(const portal of data.features?.portals||[]){const p1=mapPoint(...[track.sample(portal.fromS).x,track.sample(portal.fromS).z]),p2=mapPoint(...[track.sample(portal.toS).x,track.sample(portal.toS).z]);staticMapCtx.fillStyle=colors.portalCyan;staticMapCtx.fillRect(p1[0]-3,p1[1]-3,6,6);staticMapCtx.fillStyle=colors.portalPurple;staticMapCtx.fillRect(p2[0]-3,p2[1]-3,6,6);}
}
renderStaticMap();
const CHECKPOINT_MAP_POINTS = Array.from({length: 10}, (_, i) => mapPoint(track.sample(i*300).x, track.sample(i*300).z));

function drawMap(){
  mapCtx.clearRect(0,0,200,180);
  mapCtx.drawImage(staticMapCanvas,0,0);
  for(let i=0;i<10;i++){const a=CHECKPOINT_MAP_POINTS[i];mapCtx.fillStyle=i<=progress.checkpoints?'#d3ed70':'#708985';mapCtx.fillRect(a[0]-2,a[1]-2,4,4);}
  for(const pickup of energyPickups)if(pickup.active){const p=mapPoint(pickup.x,pickup.z);mapCtx.fillStyle=colors.energy;mapCtx.fillRect(p[0]-2,p[1]-2,4,4);}
  for(const item of itemBoxes)if(item.active){const p=mapPoint(item.x,item.z);mapCtx.fillStyle=colors.lime;mapCtx.strokeStyle=colors.ink;mapCtx.fillRect(p[0]-3,p[1]-3,6,6);mapCtx.strokeRect(p[0]-3,p[1]-3,6,6);}
  for(const rider of opponents()){const p=mapPoint(rider.x,rider.z);mapCtx.fillStyle=rider.color;mapCtx.beginPath();mapCtx.arc(p[0],p[1],3,0,Math.PI*2);mapCtx.fill();}
  if(ghostPlayback.hasGhost()&&sim.started&&!sim.finished){
    const gs=ghostPlayback.sampleAt(sim.elapsed);
    if(gs){
      const gp=mapPoint(gs.x,gs.z);
      mapCtx.fillStyle='#38bdf8';
      mapCtx.beginPath();
      mapCtx.arc(gp[0],gp[1],2.5,0,Math.PI*2);
      mapCtx.fill();
    }
  }
  const p=mapPoint(x,z);mapCtx.save();mapCtx.translate(...p);mapCtx.rotate(sim.heading);mapCtx.fillStyle='#d3ed70';mapCtx.beginPath();mapCtx.moveTo(0,-6);mapCtx.lineTo(4,5);mapCtx.lineTo(0,3);mapCtx.lineTo(-4,5);mapCtx.fill();mapCtx.restore();
}
// Cached HUD DOM nodes to prevent layout thrashing and repetitive querySelector traversals
const hudElements = {
  speed: $('#speed'),
  energy: $('#energy'),
  energyFill: $('#energy-fill'),
  energyTrack: $('.energy-track'),
  packs: $('#packs'),
  racerCount: $('#racer-count'),
  ghostHud: $('#ghost-hud'),
  ghostGap: $('#ghost-gap'),
  packBtn: $('#pack'),
  state: $('#state'),
  surface: $('#surface'),
  scenicSpot: $('#scenic-spot'),
  scenicCard: $('#scenic-card'),
  distance: $('#distance'),
  progress: $('#progress'),
  checkpoints: $('#checkpoints'),
  time: $('#time'),
  packStatus: $('#pack-status'),
  rank: $('#rank'),
  leaderboard: $('#leaderboard'),
  itemName: $('#item-name'),
  itemHint: $('#item-hint'),
  itemTargetName: $('#item-target-name'),
  itemSlot: $('#item-slot'),
  itemTarget: $('#item-target'),
  weaponBat: $('#weapon-bat'),
  weaponPistol: $('#weapon-pistol'),
  nitroFill: $('#nitro-fill'),
  nitroStatus: $('#nitro-status'),
  speedo: $('.speedometer'),
  leftPunch: $('#left-punch'),
  rightPunch: $('#right-punch'),
  leftKick: $('#left-kick'),
  rightKick: $('#right-kick'),
  punchCds: document.querySelectorAll('.punch-cd'),
  kickCds: document.querySelectorAll('.kick-cd'),
  batCds: document.querySelectorAll('.bat-cd'),
  pistolCds: document.querySelectorAll('.pistol-cd'),
  emoteBtns: document.querySelectorAll('[data-emote]')
};

// Persistent row nodes for leaderboard to eliminate innerHTML rebuild and layout thrashing
const leaderboardRows = [];
function ensureLeaderboardRows(count) {
  const container = hudElements.leaderboard;
  if (!container) return;
  while (leaderboardRows.length < count) {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    const rankB = document.createElement('b');
    const avatar = document.createElement('img');
    avatar.className = 'leaderboard-avatar';
    avatar.alt = 'avatar';
    const swatch = document.createElement('i');
    swatch.className = 'swatch';
    const nameSpan = document.createElement('span');
    const gapSpan = document.createElement('span');
    gapSpan.className = 'gap';
    row.append(rankB, avatar, swatch, nameSpan, gapSpan);
    container.appendChild(row);
    leaderboardRows.push({ row, rankB, avatar, swatch, nameSpan, gapSpan });
  }
  for (let i = 0; i < leaderboardRows.length; i++) {
    leaderboardRows[i].row.style.display = i < count ? 'grid' : 'none';
  }
}

let lastLeaderboardFrame = -99;
const _hudCache = { speed: -1, energy: -1, packs: -1, rank: -1, checkpoints: -1, state: '', surface: '', distText: '' };
function hud(){
  const kph=sim.speed*3.6;
  const roundKph=Math.round(kph);
  if(roundKph!==_hudCache.speed){
    _hudCache.speed=roundKph;
    if(hudElements.speed) hudElements.speed.textContent=roundKph;
  }
  const roundEnergy=Math.round(sim.energy);
  if(roundEnergy!==_hudCache.energy){
    _hudCache.energy=roundEnergy;
    if(hudElements.energy) hudElements.energy.textContent=roundEnergy;
    if(hudElements.energyFill) hudElements.energyFill.style.width=roundEnergy+'%';
    if(hudElements.energyTrack) hudElements.energyTrack.classList.toggle('low',roundEnergy<30);
  }
  if(sim.packs!==_hudCache.packs){
    _hudCache.packs=sim.packs;
    if(hudElements.packs) hudElements.packs.textContent='×'+sim.packs;
  }
  if(hudElements.racerCount) hudElements.racerCount.textContent=String(racers().length).padStart(2,'0');
  if(hudElements.emoteBtns) hudElements.emoteBtns.forEach(button=>button.disabled=!sim.started||sim.finished||paused);

  if(ghostPlayback.hasGhost()){
    const gap=ghostPlayback.getGapMeters(progress.distance,sim.elapsed);
    if(hudElements.ghostHud&&hudElements.ghostGap){
      hudElements.ghostHud.style.display='inline-flex';
      hudElements.ghostHud.classList.toggle('ahead',gap>=0);
      hudElements.ghostHud.classList.toggle('behind',gap<0);
      hudElements.ghostGap.textContent=`幽灵车: ${gap>=0?'+':''}${gap.toFixed(1)}m`;
    }
  }else{
    if(hudElements.ghostHud) hudElements.ghostHud.style.display='none';
  }

  if(hudElements.packBtn) hudElements.packBtn.disabled=!sim.started||sim.finished||paused||sim.energy>=100||sim.packs<=0||sim.crashLeft>0||sim.packLeft>0||sim.attackLeft>0;
  const curState=playerFinishState==='stopping'?'🏁 冲线减速中':sim.protectionLeft>0?'起身保护':stateNames[sim.state];
  if(curState!==_hudCache.state){
    _hudCache.state=curState;
    if(hudElements.state) hudElements.state.textContent=curState;
  }
  const curSurface=surfaceNames[sim.surface];
  if(curSurface!==_hudCache.surface){
    _hudCache.surface=curSurface;
    if(hudElements.surface) hudElements.surface.textContent=curSurface;
  }

  let nearestSpot=SAYRAM_LANDMARKS[0],minGap=Infinity;
  for(const spot of SAYRAM_LANDMARKS){const gap=Math.min(Math.abs(location.s-spot.s),3000-Math.abs(location.s-spot.s));if(gap<minGap){minGap=gap;nearestSpot=spot;}}
  if(hudElements.scenicSpot) hudElements.scenicSpot.textContent=nearestSpot.title+' ('+minGap.toFixed(0)+'m)';
  if(progress.distance>90&&minGap<60&&nearestSpot!==lastScenicSpot&&sim.started&&!sim.finished){
    lastScenicSpot=nearestSpot;
    scenicCardLeft=2.4;
    const card=hudElements.scenicCard;
    if(card){
      card.querySelector('.scenic-thumb').src=nearestSpot.landmarkImg;
      card.querySelector('.scenic-title').textContent=nearestSpot.title;
      card.querySelector('.scenic-sub').textContent=nearestSpot.subtitle+' · 海拔 '+nearestSpot.elevation;
      const descEl=card.querySelector('.scenic-desc');
      if(descEl)descEl.textContent=nearestSpot.desc;
      card.classList.add('show');
    }
  }
  const distText=(Math.min(3000,progress.distance)/1000).toFixed(2);
  if(distText!==_hudCache.distText){
    _hudCache.distText=distText;
    if(hudElements.distance) hudElements.distance.textContent=distText;
    if(hudElements.progress) hudElements.progress.style.width=Math.min(100,progress.distance/30)+'%';
  }
  const checkpointText=(progress.checkpoints>=10||sim.finished)?'🏁 全程完赛 10 / 10':'检查点 '+progress.checkpoints+' / 10';
  if(checkpointText!==_hudCache.checkpoints){
    _hudCache.checkpoints=checkpointText;
    if(hudElements.checkpoints) hudElements.checkpoints.textContent=checkpointText;
  }
  if(hudElements.time) hudElements.time.textContent=formatTime(sim.elapsed);
  if(hudElements.packStatus) hudElements.packStatus.textContent=sim.packLeft>0?'补充中 '+(tuning.packDuration-sim.packLeft).toFixed(1)+' / 0.8 秒':sim.packs>=tuning.maxPacks?'携带已满 · '+sim.packs+' / '+tuning.maxPacks:sim.energy<30?'低能量 · 按 Space 使用能量包':'蓝色补给可增加携带数量';
  const currentRank=Math.max(1,ranked.indexOf(playerEntity)+1);
  if(currentRank!==_hudCache.rank){
    _hudCache.rank=currentRank;
    if(hudElements.rank) hudElements.rank.textContent=String(currentRank).padStart(2,'0');
  }

  // Smooth DOM recycling for leaderboard instead of innerHTML demolition
  if(frames-lastLeaderboardFrame>=6||sim.finished){
    lastLeaderboardFrame=frames;
    const leader=ranked[0]?.progress.distance||0;
    ensureLeaderboardRows(ranked.length);
    for(let index=0;index<ranked.length;index++){
      const racer=ranked[index];
      const rowItem=leaderboardRows[index];
      const isPlayer=racer===playerEntity;
      const avUrl=getRacerAvatarUrl(racer.id,isPlayer,currentProfile);
      const gap=racer.sim.finished?'FIN':index===0?'LEAD':'-'+Math.max(0,leader-racer.progress.distance).toFixed(0)+'m';

      rowItem.row.classList.toggle('player',isPlayer);
      rowItem.rankB.textContent=index+1;
      if(rowItem.avatar.getAttribute('data-src')!==avUrl){
        rowItem.avatar.src=avUrl;
        rowItem.avatar.setAttribute('data-src',avUrl);
      }
      rowItem.swatch.style.background=racer.color;
      rowItem.nameSpan.textContent=racer.name;
      rowItem.gapSpan.textContent=gap;
    }
  }
  const itemMeta=ITEM_TYPES[playerEntity.item],itemTarget=selectedItemTarget();
  renderItemIcon(playerEntity.item);
  if(hudElements.itemName) hudElements.itemName.textContent=itemMeta?.name||'暂无道具';
  if(hudElements.itemHint) hudElements.itemHint.textContent=itemMeta?.short||'撞问号箱获得';
  if(hudElements.itemTargetName) hudElements.itemTargetName.textContent=itemTarget?.name||'--';
  if(hudElements.itemSlot){
    hudElements.itemSlot.disabled=!itemMeta||!sim.started||sim.finished||paused;
    hudElements.itemSlot.classList.toggle('ready',!!itemMeta);
  }
  if(hudElements.itemTarget){
    hudElements.itemTarget.disabled=!itemMeta||!itemTarget;
    hudElements.itemTarget.classList.toggle('locked',!!itemMeta&&!!itemTarget);
  }

  const nearTargets = [];
  for(let i=0;i<bots.length;i++){
    const b=bots[i];
    if(Math.abs(b.x-x)<25 && Math.abs(b.z-z)<25){
      nearTargets.push({x:b.x,z:b.z,energy:b.sim.energy});
    }
  }
  for(let i=0;i<targetObstacles.length;i++){
    const o=targetObstacles[i];
    if(Math.abs(o.x-x)<25 && Math.abs(o.z-z)<25){
      nearTargets.push(o);
    }
  }

  for(const kind of ['punch','kick']){
    const cd=sim[kind+'Left'];
    const cdList=kind==='punch'?hudElements.punchCds:hudElements.kickCds;
    if(cdList) cdList.forEach(e=>e.textContent=cd>0?cd.toFixed(1)+' 秒':'就绪');
    for(const side of [-1,1]){
      const el=side<0 ? (kind==='punch'?hudElements.leftPunch:hudElements.leftKick) : (kind==='punch'?hudElements.rightPunch:hudElements.rightKick);
      if(el){
        el.classList.toggle('cooldown',cd>0);
        el.classList.toggle('ready-target',cd<=0&&nearTargets.length>0&&!!selectTarget(nearTargets,x,z,sim.heading,{side,range:kind==='kick'?tuning.kickRange:tuning.punchRange,longitudinal:tuning.attackLongitudinal}));
      }
    }
  }
  const batCd=sim.batLeft, pistolCd=sim.pistolLeft;
  if(hudElements.batCds) hudElements.batCds.forEach(e=>e.textContent=batCd>0?batCd.toFixed(1)+' 秒':'就绪');
  if(hudElements.pistolCds) hudElements.pistolCds.forEach(e=>e.textContent=pistolCd>0?pistolCd.toFixed(1)+' 秒':'就绪');
  const batEl=hudElements.weaponBat, pistolEl=hudElements.weaponPistol;
  if(batEl){batEl.classList.toggle('cooldown',batCd>0);batEl.classList.toggle('ready-target',batCd<=0&&nearTargets.length>0&&!!selectTarget(nearTargets,x,z,sim.heading,{bat:true,range:tuning.batRange,longitudinal:tuning.batLongitudinal}));}
  if(pistolEl){pistolEl.classList.toggle('cooldown',pistolCd>0);pistolEl.classList.toggle('ready-target',pistolCd<=0&&nearTargets.length>0&&!!selectTarget(nearTargets,x,z,sim.heading,{pistol:true,range:tuning.pistolRange,longitudinal:tuning.attackLongitudinal}));}
  const boostPrompt=$('#boost-prompt-hud');
  if(boostPrompt){
    if(sim.landingBoostReady){
      const pText=$('#boost-prompt-text'),pKbd=$('#boost-prompt-kbd');
      if(pText)pText.textContent='落地小喷就绪！点击空格冲刺！';
      if(pKbd)pKbd.textContent='SPACE';
      boostPrompt.className='boost-prompt-hud show';
    }else if(sim.miniBoostReady){
      const isDouble=sim.miniBoostCount>1||(sim.miniBoostCount===1&&sim.miniBoostQuality>=0.70);
      const pText=$('#boost-prompt-text'),pKbd=$('#boost-prompt-kbd');
      if(pText)pText.textContent=isDouble?'QQ飞车经典双喷！按空格连喷！':'出弯小喷就绪！按空格冲刺！';
      if(pKbd)pKbd.textContent='SPACE';
      boostPrompt.className='boost-prompt-hud show'+(isDouble?' double':'');
    }else{
      boostPrompt.className='boost-prompt-hud';
    }
  }

  const nitroFill=hudElements.nitroFill,nitroStatus=hudElements.nitroStatus,speedo=hudElements.speedo;
  if(nitroFill){
    if(sim.nitroLeft>0){
      nitroFill.style.width=((sim.nitroLeft/2.4)*100)+'%';
      if(nitroStatus)nitroStatus.textContent='⚡ 超音速氮气冲刺 ('+sim.nitroLeft.toFixed(1)+'s)';
      speedo?.classList.add('nitro-active');
    }else if(sim.landingBoostLeft>0){
      nitroFill.style.width=((sim.landingBoostLeft/1.1)*100)+'%';
      if(nitroStatus)nitroStatus.textContent='🚀 落地极限小喷 ('+sim.landingBoostLeft.toFixed(1)+'s)';
      speedo?.classList.add('nitro-active');
    }else if(sim.miniBoostLeft>0){
      nitroFill.style.width=((sim.miniBoostLeft/0.8)*100)+'%';
      if(nitroStatus)nitroStatus.textContent='⚡ 漂移出弯小喷 ('+sim.miniBoostLeft.toFixed(1)+'s)';
      speedo?.classList.add('nitro-active');
    }else if(sim.isDrifting){
      nitroFill.style.width=(sim.driftCharge*100)+'%';
      if(nitroStatus)nitroStatus.textContent='🌀 漂移集气中 '+Math.round(sim.driftCharge*100)+'% (过弯后按空格小喷)';
      speedo?.classList.remove('nitro-active');
    }else if(sim.miniBoostReady){
      nitroFill.style.width='100%';
      if(nitroStatus)nitroStatus.textContent='⚡ 按空格键释放出弯小喷冲刺！';
      speedo?.classList.remove('nitro-active');
    }else if(sim.drafting){
      nitroFill.style.width=(sim.driftCharge*100)+'%';
      if(nitroStatus)nitroStatus.textContent='💨 尾流破风吸附 · 充能中 ('+Math.round(sim.driftCharge*100)+'%)';
      speedo?.classList.remove('nitro-active');
    }else{
      nitroFill.style.width=(sim.driftCharge*100)+'%';
      if(nitroStatus)nitroStatus.textContent=sim.driftCharge>=0.85?'⚡ 氮气冲刺就绪 (按 Shift 释放)':(sim.speed*3.6<40?'40码以上按 Shift 入弯漂移集气':'Shift + 转向 技巧漂移集气');
      speedo?.classList.remove('nitro-active');
    }
  }
}
const lookAt=new THREE.Vector3(),targetLookAt=new THREE.Vector3();let last=performance.now(),accumulator=0,frames=0;let smoothCamYaw=0,smoothAirY=0;const FIXED_DT=1/60;const projectileTargetVec=new THREE.Vector3();
function animateBots(dt){
  const camPos=camera.position;
  for(const bot of opponents()){
    const v=bot.visual;
    v.group.position.set(bot.x,.02+bot.sim.airHeight(),bot.z);
    v.group.rotation.y=bot.heading;
    const distSq=camPos.distanceToSquared(v.group.position);
    if(distSq>3600){
      v.group.visible=false;
      continue;
    }
    v.group.visible=true;
    v.pedal+=bot.sim.speed*dt*3;
    v.body.rotation.set(bot.sim.airLeft>0?-.08:0,0,(bot.sim.crashLeft>0?78:bot.sim.lean)*Math.PI/180);
    v.body.visible=!(bot.sim.protectionLeft>0&&Math.sin(bot.sim.clock*25)>0);
    if(v.botAvatarHead){
      v.botAvatarHead.root.rotation.set(
        Math.sin(v.pedal*2)*.05,
        0,
        -v.body.rotation.z*.35+Math.sin(v.pedal*2)*.03
      );
    }
    for(let side=0;side<2;side++){
      v.arms[side].rotation.set(-.9,0,0);
      v.legs[side].rotation.set(Math.sin(v.pedal+side*Math.PI)*.6,0,0);
    }
    if(bot.sim.attackLeft>0){
      const side=bot.sim.attackSide<0?0:1,limb=bot.sim.attackIsKick?v.legs[side]:v.arms[side];
      limb.rotation.z=bot.sim.attackSide*(bot.sim.attackIsKick?1.25:1.6);
    }
    if(v.botBat)v.botBat.visible=bot.sim.attackLeft>0&&bot.sim.attackIsBat;
    if(v.botPistol)v.botPistol.visible=bot.sim.attackLeft>0&&bot.sim.attackIsPistol;
    for(const wheel of v.wheels)wheel.rotation.z+=bot.sim.speed*dt/.39;
    v.nameLabel.visible=distSq<2025;
    animateEmoteBadge(v.emoteBadge,dt);
  }
}
function animateCheerleaders(){
  if(smoothMode){
    for(const cheer of cheerleaders)if(cheer.group.visible)cheer.group.visible=false;
    return;
  }
  const playerDist=progress.distance;
  for(const cheer of cheerleaders){
    const gap=Math.min(Math.abs(playerDist-cheer.station),3000-Math.abs(playerDist-cheer.station));
    if(gap>=55){
      if(cheer.group.visible) cheer.group.visible=false;
      continue;
    }
    if(!cheer.group.visible) cheer.group.visible=true;
    // Strictly grounded on lawn: never leaves the ground!
    cheer.group.position.y=cheer.baseY;
    const wave=sim.clock*2.8+cheer.phase,energy=Math.max(0,1-gap/55);
    cheer.body.rotation.y=Math.sin(wave*0.9)*0.14*energy;
    cheer.body.rotation.z=Math.cos(wave*0.9)*0.05*energy;
    cheer.arms[0].rotation.z=-1.1-Math.sin(wave*1.5)*0.55*energy;
    cheer.arms[1].rotation.z=1.1+Math.sin(wave*1.5+1.2)*0.55*energy;
    cheer.arms[0].rotation.x=Math.cos(wave*1.2)*0.25*energy;
    cheer.arms[1].rotation.x=-Math.cos(wave*1.2)*0.25*energy;
  }
}
function animateEffects(dt){
  const camPos=camera.position;
  const isBoostActive=sim.nitroLeft>0||sim.landingBoostLeft>0||sim.miniBoostLeft>0;
  if(isBoostActive){
    nitroFlames.visible=true;
    const pulse=1+Math.sin(sim.clock*45)*.25;
    nitroFlames.scale.set(pulse,pulse,1.2+Math.random()*.6);
    if(sim.landingBoostLeft>0){
      flameCore.material.color.setHex(0xfbbf24);
      flameGlow.material.color.setHex(0xf59e0b);
    }else if(sim.miniBoostLeft>0){
      flameCore.material.color.setHex(0x38bdf8);
      flameGlow.material.color.setHex(0x0284c7);
    }else{
      flameCore.material.color.setHex(Math.random()>.4?0x38bdf8:0xffffff);
      flameGlow.material.color.setHex(0xf59e0b);
    }
  }else{
    nitroFlames.visible=false;
  }
  for(let i=shockwaves.length-1;i>=0;i--){
    const sw=shockwaves[i];
    if(sw.delay>0){
      sw.delay-=dt;
      continue;
    }
    sw.life-=dt;
    if(sw.life<=0){
      scene.remove(sw.mesh);
      sw.mat.dispose();
      shockwaves.splice(i,1);
      continue;
    }
    const p=1-(sw.life/sw.maxLife);
    sw.mesh.position.x-=sw.forwardX*sw.speed*dt*(1-p*0.5);
    sw.mesh.position.z-=sw.forwardZ*sw.speed*dt*(1-p*0.5);
    const curScale=0.4+p*sw.maxScale;
    sw.mesh.scale.set(curScale,curScale,curScale);
    sw.mat.opacity=Math.max(0,(1-p)*0.92);
  }
  for(let i=driftPuffs.length-1;i>=0;i--){
    const p=driftPuffs[i];
    if(p.life>0){
      p.life-=dt;
      p.mesh.scale.addScalar(dt*.7);
      p.mesh.position.y+=dt*.35;
      p.mesh.material.opacity=Math.max(0,p.life*.8);
    }else{
      p.mesh.position.y=-100;
    }
  }
  for(const pickup of energyPickups)if(pickup.active&&pickup.mesh){
    const dSq=(pickup.mesh.position.x-camPos.x)**2+(pickup.mesh.position.z-camPos.z)**2;
    if(dSq>6400){pickup.mesh.visible=false;continue;}
    pickup.mesh.visible=true;
    pickup.spin+=dt*1.8;pickup.mesh.rotation.y=pickup.spin;pickup.mesh.position.y=.72+Math.sin(pickup.spin*1.7)*.13;pickup.ring.rotation.z-=dt*1.4;
  }
  for(const item of itemBoxes)if(item.active&&item.mesh){
    const dSq=(item.mesh.position.x-camPos.x)**2+(item.mesh.position.z-camPos.z)**2;
    if(dSq>6400){item.mesh.visible=false;continue;}
    item.mesh.visible=true;
    item.spin+=dt*2.3;item.mesh.rotation.y=item.spin;item.mesh.position.y=.78+Math.sin(item.spin*1.45)*.16;item.cube.rotation.x+=dt*.45;item.ring.rotation.z+=dt*1.8;
  }
  for(const portal of portalMeshes){
    const dSq=(portal.ring.position.x-camPos.x)**2+(portal.ring.position.z-camPos.z)**2;
    if(dSq>10000){portal.ring.visible=false;portal.disc.visible=false;continue;}
    portal.ring.visible=true;portal.disc.visible=true;
    portal.ring.rotation.z+=dt*1.5;portal.disc.rotation.z-=dt*.8;
  }
  for(const cloud of poisonClouds){
    const dSq=(cloud.position.x-camPos.x)**2+(cloud.position.z-camPos.z)**2;
    if(dSq>10000){cloud.visible=false;continue;}
    cloud.visible=true;
    cloud.userData.phase+=dt*1.8;cloud.position.y=cloud.userData.baseY+Math.sin(cloud.userData.phase)*.2;
  }
  for(let i=itemProjectiles.length-1;i>=0;i--){const shot=itemProjectiles[i];shot.age+=dt;const p=Math.min(1,shot.age/shot.duration);projectileTargetVec.set(shot.target.x,1.35,shot.target.z);shot.mesh.position.lerpVectors(shot.from,projectileTargetVec,p);if(!shot.isBullet){shot.mesh.position.y+=Math.sin(p*Math.PI)*3.1;shot.mesh.rotation.x+=dt*9;shot.mesh.rotation.y+=dt*12;shot.mesh.scale.setScalar(1+Math.sin(p*Math.PI)*.7);}if(p>=1){projectileRoot.remove(shot.mesh);shot.mesh.geometry.dispose();shot.mesh.material.dispose();itemProjectiles.splice(i,1);}}
  packFxLeft=Math.max(0,packFxLeft-dt);packWind.visible=sim.packLeft>0||packFxLeft>0||sim.boostLeft>0||(sim.speed*3.6>48);if(packWind.visible)for(const streak of windStreaks){streak.position.z-=streak.userData.speed*dt*(sim.boostLeft>0?1.5:1);if(streak.position.z<-8){streak.position.z=-.8;streak.position.x=(Math.random()-.5)*2.1;streak.position.y=.35+Math.random()*1.55;}}
  animateEmoteBadge(playerEmoteBadge,dt);
  animateCheerleaders();
  if(sim.finished||progress.distance>2900){
    if(podiumCelebration)podiumCelebration.group.visible=true;
    finishConfetti.update(dt);
    podiumCelebration?.update(dt,performance.now()*.001);
  }else{
    if(podiumCelebration)podiumCelebration.group.visible=false;
  }
  if(!smoothMode&&frames%2===0)sayramWater?.update(dt*2);
  if(!smoothMode)sayramSwans?.update(performance.now()*0.001,camPos);
  milestoneLeft=Math.max(0,milestoneLeft-dt);if(milestoneLeft===0)$('#race-milestone').classList.remove('show');
  scenicCardLeft=Math.max(0,scenicCardLeft-dt);if(scenicCardLeft===0)$('#scenic-card')?.classList.remove('show');
  itemEffectLeft=Math.max(0,itemEffectLeft-dt);if(itemEffectLeft===0)$('#item-effect').className='';
  itemConfirmLeft=Math.max(0,itemConfirmLeft-dt);if(itemConfirmLeft===0)$('#item-confirm').className='';
  hitFxLeft=Math.max(0,hitFxLeft-dt);const impact=$('#impact');impact.className=hitFxSide<0?'left':'right';impact.style.opacity=hitFxLeft>0?String(Math.min(1,hitFxLeft*2.5)):0;
  cameraShake=Math.max(0,cameraShake-dt);
  sectorSplitTimer=Math.max(0,sectorSplitTimer-dt);
  if(sectorSplitTimer===0)$('#sector-split-hud')?.classList.remove('show');
  if(ghostPlayback.hasGhost()&&ghostVisual){
    const ghostSample=ghostPlayback.sampleAt(sim.elapsed);
    if(ghostSample&&sim.started&&!sim.finished){
      ghostVisual.group.visible=true;
      ghostVisual.group.position.set(ghostSample.x,.02,ghostSample.z);
      ghostVisual.group.rotation.y=ghostSample.heading;
      ghostVisual.updateWheels(ghostSample.speedKph/3.6,dt);
    }else{
      ghostVisual.group.visible=false;
    }
  }
}
function frame(now){
  try {
    let dt=(now-last)/1000;
    last=now;
    if(!Number.isFinite(dt)||dt<=0) dt=1/60;
    if(dt>0.05) dt=0.05;

    physics(dt);

    const airborneY=sim.airHeight();
    player.position.set(x,.02+airborneY,z);
    shadow.position.y=.17-airborneY;
    player.rotation.y=sim.heading;
    const f=clamp(sim.speed/(60/3.6),0,1);

    if(!paused){
      soundEngine.updateAmbience(sim.speed*3.6,false,dt);
      pedal+=sim.speed*dt*3;
      if(activeStuntTimer>0)activeStuntTimer-=dt;
      if(stuntDisplayTimer>0){
        stuntDisplayTimer-=dt;
        if(stuntDisplayTimer<=0)$('#stunt-card')?.classList.remove('show');
      }

      const isAirborne=sim.airLeft>0;
      if(isAirborne&&activeStuntTimer>0&&activeStunt&&sim.crashLeft<=0){
        if(activeStunt==='SUPERMAN'){
          torso.rotation.x=-0.58;
          torso.position.z=-0.32;
          for(let i=0;i<2;i++){
            arms[i].rotation.set(-1.4,0,0);
            legs[i].rotation.set(-1.15,0,(i===0?-0.15:0.15));
          }
        }else if(activeStunt==='TABLETOP'){
          visual.rotation.set(0,0,0.72);
          torso.rotation.x=0.2;
          torso.position.z=-0.07;
          for(let i=0;i<2;i++){
            arms[i].rotation.set(-0.8,0,0);
            legs[i].rotation.set(0.1,0,(i===0?-0.4:0.4));
          }
        }else if(activeStunt==='NO-FOOTER'){
          torso.rotation.x=0.35;
          torso.position.z=-0.07;
          arms[0].rotation.set(-0.9,0,0);
          arms[1].rotation.set(-0.9,0,0);
          legs[0].rotation.set(0.2,0,-0.85);
          legs[1].rotation.set(0.2,0,0.85);
        }else if(activeStunt==='TAILWHIP'){
          visual.rotation.set(0,Math.sin(sim.clock*22)*1.1,0);
          torso.rotation.x=0.35;
          torso.position.z=-0.07;
          for(let i=0;i<2;i++){arms[i].rotation.set(-.9,0,0);legs[i].rotation.set(Math.sin(pedal+i*Math.PI)*.6,0,0);}
        }else if(activeStunt==='BARSPIN'){
          visual.rotation.set(0,Math.PI*2*((sim.clock*4.5)%1),0);
          torso.rotation.x=0.35;
          torso.position.z=-0.07;
          for(let i=0;i<2;i++){arms[i].rotation.set(-.9,0,0);legs[i].rotation.set(Math.sin(pedal+i*Math.PI)*.6,0,0);}
        }
      }else{
        torso.rotation.x=0.35;
        torso.position.z=-0.07;
        visual.rotation.set(sim.emergencyLeft>0?.18:0,0,(sim.crashLeft>0?80:sim.lean)*Math.PI/180);
        for(let i=0;i<2;i++){arms[i].rotation.set(-.9,0,0);legs[i].rotation.set(Math.sin(pedal+i*Math.PI)*.6,0,0);}
        if(sim.attackLeft>0){
          const i=sim.attackSide<0?0:1,limb=sim.attackIsKick?legs[i]:arms[i];
          limb.rotation.z=sim.attackSide*(sim.attackIsKick?1.25:1.6);
        }
      }
      visual.visible=!(sim.protectionLeft>0&&Math.sin(sim.clock*25)>0);
      if(playerAvatarHead){
        playerAvatarHead.root.rotation.set(
          Math.sin(pedal*2)*0.05 + (sim.emergencyLeft>0 ? 0.22 : 0),
          (looking ? look*0.85 : -sim.turn*0.28),
          -visual.rotation.z*0.35 + Math.sin(pedal*2)*0.04
        );
      }
      playerBat.visible=sim.attackLeft>0&&sim.attackIsBat;
      playerPistol.visible=sim.attackLeft>0&&sim.attackIsPistol;
      for(const wheel of wheels)wheel.rotation.z+=sim.speed*dt/.39;
      animateBots(dt);
      animateEffects(dt);
      for(const o of obstacles)if(o.mesh){
        o.flash=Math.max(0,o.flash-dt);
        o.mesh.rotation.z=Math.sin(o.flash*40)*o.flash;
        if(o.energy<=0)o.mesh.scale.y=.25;
      }
      if(playerFinishState==='podium'&&podiumCelebration){
        podiumCelebration.group.visible=true;
        podiumCelebration.update(dt,sim.clock);
        const photoPose=podiumCelebration.getPhotoCameraPose();
        camera.position.lerp(photoPose.position,1-Math.exp(-dt*3.5));
        lookAt.lerp(photoPose.target,1-Math.exp(-dt*3.5));
        camera.lookAt(lookAt);
        camera.fov=58;
        camera.updateProjectionMatrix();

        podiumTimer+=dt;
        // Step 1: Champion arrives & takes highest pedestal (#1 gold)
        if(podiumStage===0&&podiumTimer>=0.5){
          podiumStage=1;
          podiumCelebration.setStage(1);
          podiumCelebration.triggerCameraFlash();
          soundEngine.playVictory();
          soundEngine.playCheer();
          const r1=ranked[0]||playerEntity;
          toast(`🥇 冠军登台！${r1.name} 荣膺金牌奖杯！🏆`);
        }
        // Step 2: Runner-up arrives & takes silver pedestal (#2)
        else if(podiumStage===1&&podiumTimer>=1.8){
          podiumStage=2;
          podiumCelebration.setStage(2);
          podiumCelebration.triggerCameraFlash();
          soundEngine.playCheer();
          const r2=ranked[1]||{name:'车手'};
          toast(`🥈 亚军登台！${r2.name} 荣膺银牌奖杯！🥈`);
        }
        // Step 3: 3rd place arrives & takes bronze pedestal (#3)
        else if(podiumStage===2&&podiumTimer>=3.1){
          podiumStage=3;
          podiumCelebration.setStage(3);
          podiumCelebration.triggerCameraFlash();
          soundEngine.playCheer();
          const r3=ranked[2]||{name:'车手'};
          toast(`🥉 季军登台！${r3.name} 荣膺铜牌奖杯！🥉`);
        }
        // Step 4: Full awards ceremony and results card
        else if(podiumStage===3&&podiumTimer>=4.3){
          podiumStage=4;
          podiumCelebration.setStage(4);
          podiumCelebration.triggerCameraFlash();
          showResults();
        }
      }else{
        if(!looking)look*=Math.exp(-dt*4);
        const targetYaw=sim.heading+look;
        const yawDelta=Math.atan2(Math.sin(targetYaw-smoothCamYaw),Math.cos(targetYaw-smoothCamYaw));
        if(frames<=2){
          smoothCamYaw=targetYaw;
          smoothAirY=airborneY;
        }else{
          smoothCamYaw+=yawDelta*(1-Math.exp(-dt*9));
          smoothAirY+=(airborneY-smoothAirY)*(1-Math.exp(-dt*11));
        }

        const distance=6.4+1.8*f-(sim.emergencyLeft>0?.6:0);
        const camHeight=3.2+f*.25+smoothAirY*.45;

        const forwardX=Math.sin(smoothCamYaw);
        const forwardZ=Math.cos(smoothCamYaw);

        camera.position.set(
          x-forwardX*distance,
          camHeight,
          z-forwardZ*distance
        );

        targetLookAt.set(
          x+forwardX*5.0,
          1.35+smoothAirY*.5,
          z+forwardZ*5.0
        );

        if(cameraShake>0){
          const shakeX=(Math.random()-.5)*cameraShake*.16;
          const shakeY=(Math.random()-.5)*cameraShake*.10;
          targetLookAt.x+=shakeX;
          targetLookAt.y+=shakeY;
          camera.lookAt(targetLookAt);
          cameraShake=Math.max(0,cameraShake-dt*3.5);
        }else{
          camera.lookAt(targetLookAt);
        }

        const targetFov=65+15*f+(sim.boostLeft>0?4:0);
        if(Math.abs(camera.fov-targetFov)>0.05){
          camera.fov+=(targetFov-camera.fov)*(1-Math.exp(-dt*5));
          camera.updateProjectionMatrix();
        }
      }
      toastLeft=Math.max(0,toastLeft-dt);if(toastLeft===0)$('#toast').textContent='';
    }
    if(frames%4===0)hud();
    if(frames%6===0)drawMap();
    frames++;
    renderer.render(scene,camera);
  } catch(e) {
    console.error('Frame error:', e);
  } finally {
    requestAnimationFrame(frame);
  }
}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
function initScenicGallery(){
  const galleryModal=$('#scenic-gallery');if(!galleryModal)return;
  const listEl=$('#gallery-thumbs-list');
  function showItem(idx){
    const spot=SAYRAM_LANDMARKS[idx];if(!spot)return;
    const heroImg=$('#gallery-hero-img');if(heroImg)heroImg.src=spot.landmarkImg;
    const titleEl=$('#gallery-hero-title');if(titleEl)titleEl.textContent=spot.title;
    const subEl=$('#gallery-hero-sub');if(subEl)subEl.textContent=spot.subtitle+' · '+(spot.s/1000).toFixed(1)+' KM · 海拔 '+spot.elevation;
    const descEl=$('#gallery-hero-desc');if(descEl)descEl.textContent=spot.desc;
    document.querySelectorAll('.gallery-thumb-item').forEach((el,i)=>el.classList.toggle('active',i===idx));
  }
  if(listEl){
    listEl.innerHTML=SAYRAM_LANDMARKS.map((spot,i)=>`
      <button class="gallery-thumb-item ${i===0?'active':''}" data-index="${i}">
        <img src="${spot.landmarkImg}" alt="${spot.title}">
        <div class="thumb-info">
          <b>${spot.title}</b>
          <small>${(spot.s/1000).toFixed(1)}KM · ${spot.elevation}</small>
        </div>
      </button>
    `).join('');
    listEl.querySelectorAll('.gallery-thumb-item').forEach(btn=>{
      btn.onclick=()=>showItem(Number(btn.dataset.index));
    });
  }
  let galleryWasPaused=false;
  function openGallery(targetIndex=0){
    galleryWasPaused=paused;
    pause(true);
    showItem(targetIndex);
    galleryModal.showModal();
  }
  $('#btn-gallery')?.addEventListener('click',()=>openGallery(0));
  $('#open-gallery')?.addEventListener('click',()=>openGallery(0));
  $('#close-gallery')?.addEventListener('click',()=>galleryModal.close());
  galleryModal.addEventListener('close',()=>{if(!galleryWasPaused)pause(false);});
  $('#scenic-card')?.addEventListener('click',()=>{
    const idx=SAYRAM_LANDMARKS.findIndex(s=>s===lastScenicSpot);
    openGallery(idx>=0?idx:0);
  });
}
initScenicGallery();
function initWeatherUI(){
  function updateWeatherButton(){
    const btn=$('#btn-weather');if(!btn)return;
    const curr=weatherManager.getPreset();
    btn.innerHTML=`<span>${curr.icon}</span> ${curr.name}`;
  }
  $('#btn-weather')?.addEventListener('click',()=>{
    const next=weatherManager.cycleWeather();
    updateWeatherButton();
    toast(`🌤️ 环湖天气已切换: ${next.name} (${next.desc})`);
  });
  updateWeatherButton();
}
initWeatherUI();

function initHallOfFameUI(){
  function renderHallOfFame(){
    const rec=getLocalRecords();
    const bestTimeEl=$('#rec-best-time');
    if(bestTimeEl)bestTimeEl.textContent=rec.bestTime?formatTime(rec.bestTime):'--:--.-';
    const topKphEl=$('#rec-top-kph');
    if(topKphEl)topKphEl.innerHTML=(rec.bestTopKph||0).toFixed(1)+' <small style="font-size:14px;color:var(--muted)">KM/H</small>';
    const racesEl=$('#rec-races');
    if(racesEl)racesEl.textContent=(rec.totalRaces||0)+' 场';
    const vicEl=$('#rec-victories');
    if(vicEl)vicEl.textContent=rec.totalVictories||0;
    const winrateEl=$('#rec-winrate');
    if(winrateEl){
      const rate=rec.totalRaces?Math.round((rec.totalVictories/rec.totalRaces)*100):0;
      winrateEl.textContent='生涯胜率 '+rate+'%';
    }
    const hitsEl=$('#rec-hits');
    if(hitsEl)hitsEl.textContent=rec.totalHits||0;
    const draftEl=$('#rec-draft-time');
    if(draftEl)draftEl.innerHTML=(rec.totalDraftTime||0)+' <small style="font-size:14px;color:var(--muted)">秒</small>';
  }
  let recordsWasPaused=false;
  $('#btn-records')?.addEventListener('click',()=>{
    recordsWasPaused=paused;
    pause(true);
    renderHallOfFame();
    $('#hall-of-fame')?.showModal();
  });
  $('#close-records')?.addEventListener('click',()=>$('#hall-of-fame')?.close());
  $('#hall-of-fame')?.addEventListener('close',()=>{if(!recordsWasPaused)pause(false);});
  $('#clear-records')?.addEventListener('click',()=>{
    saveLocalRecords({bestTime:null,bestTopKph:0,totalRaces:0,totalVictories:0,totalHits:0,totalDraftTime:0});
    renderHallOfFame();
    toast('已清空本地生涯历史战绩');
  });
}
initHallOfFameUI();

function initLiveryUI(){
  $('#bike-livery')?.addEventListener('change',e=>{
    applyPlayerLivery(e.target.value);
    sessionStorage.setItem('lake-rider-livery',e.target.value);
    toast(`🎨 已切换战车涂装: ${BIKE_LIVERIES[e.target.value]?.name||'默认'}`);
  });
  const savedLivery=sessionStorage.getItem('lake-rider-livery');
  if(savedLivery&&$('#bike-livery')){
    $('#bike-livery').value=savedLivery;
    applyPlayerLivery(savedLivery);
  }
}
initLiveryUI();

let smoothMode = localStorage.getItem('lake-riders-perf-v3') !== 'false';
function applySmoothMode(enabled) {
  smoothMode = enabled;
  localStorage.setItem('lake-riders-perf-v3', String(smoothMode));
  localStorage.setItem('lake-riders-smooth-mode', String(smoothMode));
  const btn = $('#btn-smooth');
  if (btn) {
    btn.textContent = smoothMode ? '⚡ 流畅模式: 开' : '⚡ 流畅模式: 关';
    btn.classList.toggle('active', smoothMode);
  }
  document.body.classList.toggle('smooth-performance', smoothMode);
  const targetRatio = smoothMode ? 0.85 : Math.min(window.devicePixelRatio||1, 1.0);
  renderer.setPixelRatio(targetRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  scene.fog = null;
  if (sayramSwans?.group) sayramSwans.group.visible = !smoothMode;
  for (const cheer of cheerleaders) if (cheer.group) cheer.group.visible = !smoothMode;
}
function initSmoothModeUI() {
  $('#btn-smooth')?.addEventListener('click', () => {
    applySmoothMode(!smoothMode);
    toast(smoothMode ? '⚡ 已开启极速流畅模式 (锁定 60FPS)' : '🌟 已切换至高画质模式 (完整湖光与远景雾效)');
  });
  applySmoothMode(smoothMode);
}
initSmoothModeUI();

let tempProfileAvatarType = currentProfile.avatarType;
let tempProfilePresetId = currentProfile.presetId;
let tempProfileCustomUrl = currentProfile.customAvatarUrl;

function updateProfileDisplays(){
  const avatarUrl=getPlayerAvatarUrl(currentProfile);
  const headerImg=$('#header-avatar-img');
  if(headerImg)headerImg.src=avatarUrl;
  const headerName=$('#header-nickname');
  if(headerName)headerName.textContent=currentProfile.nickname||'车手档案';
  const cardAvatar=$('#profile-card-avatar');
  if(cardAvatar)cardAvatar.src=avatarUrl;
  const cardName=$('#profile-display-name');
  if(cardName)cardName.textContent=currentProfile.nickname||'赛湖骑手';
  const cardTitle=$('#profile-display-title');
  if(cardTitle)cardTitle.textContent=currentProfile.title||'赛湖破风之影';
  if(typeof playerAvatarHead !== 'undefined' && playerAvatarHead){
    playerAvatarHead.updateAvatar(avatarUrl);
  }
  if(typeof playerJerseyBib !== 'undefined' && playerJerseyBib){
    playerJerseyBib.update(avatarUrl, currentProfile.nickname||'赛湖车手', '01');
  }
}

function updateModalPreview(){
  const previewImg=$('#modal-avatar-preview') || $('#avatar-preview-img');
  const typeBadge=$('#modal-avatar-type');
  const badgeName=$('#preview-badge-name');
  const badgeTitle=$('#preview-badge-title');
  const previewUrl = tempProfileAvatarType==='custom' && tempProfileCustomUrl
    ? tempProfileCustomUrl
    : svgToDataUrl(PRESET_AVATARS.find(p=>p.id===tempProfilePresetId)?.svg || PRESET_AVATARS[0].svg);
  if(previewImg) previewImg.src=previewUrl;
  if(typeBadge) typeBadge.textContent=tempProfileAvatarType==='custom'?'自定义照片':'官方预设';
  if(badgeName) badgeName.textContent=$('#profile-input-name')?.value || currentProfile.nickname;
  if(badgeTitle) badgeTitle.textContent=$('#profile-input-title')?.value || currentProfile.title;
  document.querySelectorAll('.preset-card').forEach(card=>{
    card.classList.toggle('active',tempProfileAvatarType==='preset' && card.dataset.id===tempProfilePresetId);
  });
}

function openProfileModal(){
  tempProfileAvatarType = currentProfile.avatarType;
  tempProfilePresetId = currentProfile.presetId;
  tempProfileCustomUrl = currentProfile.customAvatarUrl;
  if($('#profile-input-name'))$('#profile-input-name').value=currentProfile.nickname||'赛湖骑手';
  if($('#profile-input-title'))$('#profile-input-title').value=currentProfile.title||'赛湖破风之影';
  const grid=$('#presets-grid');
  if(grid){
    grid.innerHTML=PRESET_AVATARS.map(p=>`
      <div class="preset-card ${tempProfileAvatarType==='preset'&&tempProfilePresetId===p.id?'active':''}" data-id="${p.id}" title="${p.name} · ${p.title}">
        <div class="preset-card-avatar">${p.svg}</div>
        <span>${p.name}</span>
        <small>${p.title}</small>
      </div>
    `).join('');
    grid.querySelectorAll('.preset-card').forEach(card=>{
      card.onclick=()=>{
        tempProfileAvatarType='preset';
        tempProfilePresetId=card.dataset.id;
        const pObj = PRESET_AVATARS.find(p=>p.id===tempProfilePresetId);
        if(pObj){
          currentProfile.avatarType='preset';
          currentProfile.presetId=pObj.id;
          saveProfile(currentProfile);
          updateModalPreview();
          updateProfileDisplays();
          toast(`👤 已选定预设头像: ${pObj.name}`);
        }
      };
    });
  }
  updateModalPreview();
  $('#profile-modal')?.showModal();
}

function initProfileUI(){
  $('#btn-profile')?.addEventListener('click', openProfileModal);
  $('#profile-card')?.addEventListener('click', openProfileModal);
  $('#profile-card-avatar-btn')?.addEventListener('click', (e)=>{ e.stopPropagation(); openProfileModal(); });
  $('#close-profile')?.addEventListener('click', ()=>$('#profile-modal')?.close());
  $('#close-cert')?.addEventListener('click', ()=>$('#cert-modal')?.close());
  $('#profile-input-name')?.addEventListener('input', updateModalPreview);
  $('#profile-input-title')?.addEventListener('change', updateModalPreview);

  $('#avatar-file-input')?.addEventListener('change', async (e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      toast('⏳ 正在读取并裁剪头像图片...');
      const dataUrl=await processUploadedImage(file, 256);
      tempProfileAvatarType='custom';
      tempProfileCustomUrl=dataUrl;
      currentProfile.avatarType='custom';
      currentProfile.customAvatarUrl=dataUrl;
      currentProfile.customDataUrl=dataUrl;
      saveProfile(currentProfile);
      updateModalPreview();
      updateProfileDisplays();
      toast('📸 自定义头像已即时呈现并自动保存！');
    }catch(err){
      toast('⚠️ 头像导入失败: '+err.message);
    }
  });

  $('#save-profile')?.addEventListener('click', ()=>{
    const name=($('#profile-input-name')?.value||'赛湖骑手').trim().slice(0,12);
    const title=$('#profile-input-title')?.value||'赛湖破风之影';
    currentProfile.avatarType=tempProfileAvatarType;
    currentProfile.presetId=tempProfilePresetId;
    currentProfile.customAvatarUrl=tempProfileCustomUrl;
    currentProfile.nickname=name;
    currentProfile.title=title;
    saveProfile(currentProfile);
    sessionStorage.setItem('lake-rider-name', name);
    if($('#nickname'))$('#nickname').value=name;
    updateProfileDisplays();
    $('#profile-modal')?.close();
    toast('✨ 车手档案已保存，头像已同步全赛道！');
  });

  updateProfileDisplays();
}
initProfileUI();

function updateModeDisplays(){
  const isTT=raceMode==='time_trial';
  const modeName=$('#mode-name');
  if(modeName)modeName.textContent=isTT?'纯速计时赛':'大奖赛混战';
  const btn=$('#btn-mode');
  if(btn)btn.classList.toggle('time-trial',isTT);
  const select=$('#race-mode-select');
  if(select)select.value=raceMode;
  const startBtn=$('#start');
  if(startBtn)startBtn.innerHTML=isTT?'开启纯速计时挑战 <span>⏱️</span>':'单人五车混战 <span>↗</span>';
}

function setRaceMode(mode){
  raceMode=mode;
  updateModeDisplays();
  toast(raceMode==='time_trial'?'⏱️ 已切换到「纯速计时挑战赛」模式':'🏁 已切换到「大奖赛混战」模式');
  if(!sim.started)reset();
}

function initGameModeUI(){
  $('#btn-mode')?.addEventListener('click',()=>{
    setRaceMode(raceMode==='time_trial'?'grand_prix':'time_trial');
  });
  updateModeDisplays();
}
initGameModeUI();

function initAchievementsUI(){
  const modal=$('#achievements-modal');
  const btn=$('#btn-achieve');
  const closeBtn=$('#close-achievements');
  if(!modal||!btn)return;
  let achieveWasPaused=false;

  function renderAchievements(){
    const list=achievementManager.getAllAchievements();
    const count=list.filter(a=>a.unlocked).length;
    const counterEl=$('#achieve-counter');
    if(counterEl)counterEl.textContent=`已解锁 ${count} / ${list.length}`;
    const gridEl=$('#achievements-grid');
    if(gridEl){
      gridEl.innerHTML=list.map(a=>`
        <div class="achieve-card ${a.unlocked?'unlocked':''}">
          <div class="achieve-icon-box">${a.icon}</div>
          <div class="achieve-body">
            <div class="achieve-head">
              <span class="achieve-title">${a.name}</span>
              <span class="achieve-tag">${a.category}</span>
            </div>
            <p class="achieve-desc">${a.desc}</p>
            <div class="achieve-foot">
              <span>${a.unlocked?'✅ '+(a.unlockedAt?new Date(a.unlockedAt).toLocaleDateString():'已解锁'):'🔒 待挑战'}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  btn.addEventListener('click',()=>{
    achieveWasPaused=paused;
    pause(true);
    renderAchievements();
    modal.showModal();
  });
  closeBtn?.addEventListener('click',()=>modal.close());
  modal.addEventListener('close',()=>{
    if(!achieveWasPaused)pause(false);
  });
}
initAchievementsUI();

function initBgmModalUI(){
  const modal=$('#bgm-modal');
  const openBtn=$('#btn-music-modal');
  const closeBtn=$('#close-bgm');
  const fileInput=$('#bgm-file-input');
  if(!modal||!openBtn)return;

  let bgmWasPaused=false;
  let targetTrackForUpload=null;

  function renderTrackCard(track){
    const isPlaying = bgmPlayer.isPlaying && !bgmMuted && bgmPlayer.getCurrentTrack()?.id === track.id;
    const hasReal = bgmPlayer.hasRealAudio(track.id);
    const realInfo = bgmPlayer.getRealAudioInfo(track.id);
    const isCustom = realInfo && realInfo.isCustom;
    const isBuiltin = realInfo && realInfo.isBuiltin;

    let badgeHtml = '';
    let descExtra = '';
    if (isCustom) {
      badgeHtml = '<span class="badge-custom">🎧 自定义替换</span>';
      descExtra = `<br><small style="color:#c084fc">📁 已替换为自定义音频: ${realInfo.name} (${Math.round((realInfo.size||0)/1024)} KB)</small>`;
    } else if (isBuiltin || hasReal) {
      badgeHtml = '<span class="badge-real">🎵 官方内置原声 (MP3)</span>';
      descExtra = `<br><small style="color:#4ade80">⚡ 游戏工程已直接预载，所有用户进入即刻畅听</small>`;
    } else {
      badgeHtml = '<span class="badge-synth">🎹 电子合成伴奏</span>';
    }

    return `
      <div class="bgm-card ${isPlaying?'active-playing':''}" data-track-id="${track.id}">
        <div class="bgm-card-top">
          <div class="bgm-card-title-row">
            <span class="bgm-card-title">《${track.title}》</span>
            <span class="bgm-card-artist">${track.artist}</span>
          </div>
          ${badgeHtml}
        </div>
        <p class="bgm-card-desc">${track.subtitle || ''}${descExtra}</p>
        <div class="bgm-card-footer">
          <button class="btn-card-action play-btn" data-action="play" data-track-id="${track.id}">
            ${isPlaying ? '⏸ 正在播放' : '▶ 试听播放'}
          </button>
          <div class="bgm-card-actions">
            <button class="btn-card-action upload" data-action="upload" data-track-id="${track.id}">
              ${isCustom ? '📁 重新替换' : '📁 上传自定义MP3'}
            </button>
            ${isCustom ? `<button class="btn-card-action delete-btn" data-action="delete" data-track-id="${track.id}" title="恢复官方内置原声">🔄 恢复官方内置</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function updateStatusDisplay(){
    const currentTrack = bgmPlayer.getCurrentTrack();
    const isReal = currentTrack ? bgmPlayer.hasRealAudio(currentTrack.id) : false;
    const titleEl = $('#bgm-modal-current-title');
    const badgeEl = $('#bgm-modal-current-badge');
    const playBtn = $('#bgm-play-btn');
    const modeText = $('#bgm-mode-text');

    if(titleEl) titleEl.textContent = currentTrack ? `【${currentTrack.categoryName}】《${currentTrack.title}》- ${currentTrack.artist}` : '--';
    if(badgeEl){
      badgeEl.className = isReal ? 'badge-real' : 'badge-synth';
      badgeEl.textContent = isReal ? '🎵 真实原声' : '🎹 电子模拟';
    }
    if(playBtn) playBtn.textContent = (bgmPlayer.isPlaying && !bgmMuted) ? '⏸ 暂停' : '▶ 播放';
    if(modeText) modeText.textContent = bgmPlayer.mode === 'race' ? '比赛战歌' : '大厅休闲';
  }

  function renderAllTracks(){
    const lobbyList = $('#bgm-lobby-list');
    const raceList = $('#bgm-race-list');
    if(lobbyList) lobbyList.innerHTML = QQ_LOBBY_TRACKS.map(renderTrackCard).join('');
    if(raceList) raceList.innerHTML = QQ_RACE_TRACKS.map(renderTrackCard).join('');
    updateStatusDisplay();
    updateBgmButton();
    attachCardListeners();
  }

  function attachCardListeners(){
    modal.querySelectorAll('.bgm-card').forEach(card=>{
      const trackId = card.getAttribute('data-track-id');
      const allTracks = [...QQ_LOBBY_TRACKS, ...QQ_RACE_TRACKS];
      const track = allTracks.find(t=>t.id===trackId);
      if(!track)return;

      // Drag and drop audio files onto card
      card.addEventListener('dragover', (e)=>{
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', ()=>{
        card.classList.remove('drag-over');
      });
      card.addEventListener('drop', async (e)=>{
        e.preventDefault();
        card.classList.remove('drag-over');
        if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0){
          const file = e.dataTransfer.files[0];
          await handleAudioFileSelected(trackId, file);
        }
      });

      // Play button
      card.querySelector('[data-action="play"]')?.addEventListener('click', ()=>{
        soundEngine.init();
        bgmMuted = false;
        const list = track.category === 'race' ? QQ_RACE_TRACKS : QQ_LOBBY_TRACKS;
        const idx = list.findIndex(t=>t.id===trackId);
        soundEngine.setBgmMode(track.category, false, false);
        bgmPlayer.start(idx, track.category);
        renderAllTracks();
        toast(`🎵 开始播放《${track.title}》${bgmPlayer.hasRealAudio(trackId)?' (原声MP3)':''}`);
      });

      // Upload button
      card.querySelector('[data-action="upload"]')?.addEventListener('click', ()=>{
        targetTrackForUpload = trackId;
        if(fileInput){
          fileInput.value = '';
          fileInput.click();
        }
      });

      // Delete/Restore synth button
      card.querySelector('[data-action="delete"]')?.addEventListener('click', async ()=>{
        await bgmPlayer.removeRealAudio(trackId);
        renderAllTracks();
        toast(`已恢复《${track.title}》为官方内置原声`);
      });
    });
  }

  async function handleAudioFileSelected(trackId, file){
    if(!file)return;
    const valid = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
    if(!valid){
      toast('⚠️ 请选择有效的音频文件 (MP3 / WAV / OGG / M4A)');
      return;
    }
    toast(`⏳ 正在导入真实音频: ${file.name}...`);
    soundEngine.init();
    await bgmPlayer.attachRealAudio(trackId, file, file.name);
    renderAllTracks();
    toast(`✅ 成功装载《${file.name}》真实原声！立即播放！`);
  }

  fileInput?.addEventListener('change', async (e)=>{
    if(targetTrackForUpload && e.target.files && e.target.files.length > 0){
      const file = e.target.files[0];
      await handleAudioFileSelected(targetTrackForUpload, file);
      targetTrackForUpload = null;
    }
  });

  // Modal open
  openBtn.addEventListener('click', ()=>{
    soundEngine.init();
    bgmWasPaused = paused;
    pause(true);
    renderAllTracks();
    modal.showModal();
  });

  closeBtn?.addEventListener('click', ()=>modal.close());
  modal.addEventListener('close', ()=>{
    if(!bgmWasPaused) pause(false);
  });

  // Global controls
  $('#bgm-play-btn')?.addEventListener('click', ()=>{
    soundEngine.init();
    if(bgmPlayer.isPlaying && !bgmMuted){
      soundEngine.stopBgm();
    }else{
      bgmMuted = false;
      const targetMode = (sim?.started && !sim?.finished && !sim?.playerFinishState) ? 'race' : 'lobby';
      soundEngine.setBgmMode(targetMode, true, false);
    }
    renderAllTracks();
  });

  $('#bgm-prev-btn')?.addEventListener('click', ()=>{
    soundEngine.init();
    bgmMuted = false;
    const list = bgmPlayer.activeList;
    const prevIdx = (bgmPlayer.activeIndex - 1 + list.length) % list.length;
    bgmPlayer.start(prevIdx, bgmPlayer.mode);
    renderAllTracks();
  });

  $('#bgm-next-btn')?.addEventListener('click', ()=>{
    soundEngine.init();
    bgmMuted = false;
    bgmPlayer.nextTrack();
    renderAllTracks();
  });

  $('#bgm-mode-switch-btn')?.addEventListener('click', ()=>{
    soundEngine.init();
    bgmMuted = false;
    const newMode = bgmPlayer.mode === 'race' ? 'lobby' : 'race';
    soundEngine.setBgmMode(newMode, true, true);
    renderAllTracks();
    toast(`🔀 已切换为【${newMode==='race'?'比赛战歌':'大厅音乐'}】模式`);
  });

  const volSlider = $('#bgm-volume-slider');
  const volNum = $('#bgm-volume-num');
  volSlider?.addEventListener('input', (e)=>{
    const val = parseInt(e.target.value, 10);
    if(volNum) volNum.textContent = `${val}%`;
    bgmPlayer.setVolume(val / 100);
  });
}
initBgmModalUI();

restore();requestAnimationFrame(frame);

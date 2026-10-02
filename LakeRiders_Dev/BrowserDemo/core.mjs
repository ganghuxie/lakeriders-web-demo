export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function controlMapping(keys){return {steer:(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)-(keys.has('KeyD')||keys.has('ArrowRight')?1:0),drift:keys.has('ShiftLeft')||keys.has('ShiftRight'),nitro:keys.has('ShiftLeft')||keys.has('ShiftRight')||keys.has('KeyN')};}
export const attackMapping={KeyQ:-1,KeyE:1,KeyZ:-2,KeyC:2,KeyV:3,KeyB:4};
const tick=(v,dt)=>Math.max(0,v-dt), lerp=(a,b,t)=>a+(b-a)*t;
export function maxKph(energy,t){for(let i=1;i<t.energyKnots.length;i++)if(energy<=t.energyKnots[i])return lerp(t.speedKnots[i-1],t.speedKnots[i],clamp((energy-t.energyKnots[i-1])/(t.energyKnots[i]-t.energyKnots[i-1]),0,1));return t.speedKnots.at(-1);}
const TICK_TIMER_KEYS = [
  'emergencyLock','punchLeft','kickLeft','batLeft','pistolLeft','attackLeft',
  'protectionLeft','grassLeft','swampLeft','boostLeft','slowLeft','poopLeft',
  'netLeft','airLeft','rampLock','hitProtection','poisonLeft','poisonReactionLeft',
  'portalCooldownLeft','pistolSlowLeft','nitroLeft','miniBoostTimer','landingBoostTimer',
  'miniBoostLeft','landingBoostLeft','stuntDisplayTimer'
];

export class RiderSimulation {
  constructor(t, options = {}){
    const talent = options.talent || 'balanced';
    Object.assign(this,{
      t,talent,speed:0,energy:100,stability:100,steering:0,heading:0,lean:0,clock:0,elapsed:0,
      emergencyLeft:0,emergencyLock:0,punchLeft:0,kickLeft:0,batLeft:0,pistolLeft:0,attackLeft:0,
      packLeft:0,crashLeft:0,protectionLeft:0,grassLeft:0,swampLeft:0,boostLeft:0,slowLeft:0,
      poopLeft:0,netLeft:0,airLeft:0,prevAirLeft:0,airDuration:0,jumpHeight:0,rampLock:0,
      poisonLeft:0,poisonReactionLeft:0,portalCooldownLeft:0,pistolSlowLeft:0,lastBrake:-100,
      steeringHeld:0,hitProtection:0,topKph:0,packs:talent==='tactician'?3:2,crashes:0,
      attackSide:0,attackIsKick:false,attackIsBat:false,attackIsPistol:false,finished:false,
      started:false,surface:'Asphalt',state:'Ready',lastTurn:0,lastTurnAt:-100,restoreEnergy:false,
      drafting:false,draftCharge:0,nitroLeft:0,isDrifting:false,driftCharge:0,totalDraftTime:0,
      // QQ Speed style Mini-Boost & Landing Boost
      miniBoostTimer:0,miniBoostReady:false,miniBoostCount:0,miniBoostQuality:0,miniBoostLeft:0,
      landingBoostTimer:0,landingBoostReady:false,landingBoostLeft:0,
      // Airborne Stunt System
      airborneStunt:null,stuntScore:0,stuntDisplayTimer:0
    });
    this.onAttack=()=>{};
    this.onFeedback=()=>{};
    this.onRespawn=()=>{};
  }
  start(){this.started=true;this.state='Riding';}
  collectPack(maxPacks=3){if(this.finished||this.crashLeft>0||this.packs>=maxPacks)return false;this.packs++;this.onFeedback('PACK COLLECTED');return true;}
  finish(){this.finished=true;this.speed=0;this.packLeft=0;this.attackLeft=0;this.state='Finished';this.onFeedback('FINISH');}
  applyDraft(isDrafting,dt=1/60){
    if(this.finished||this.crashLeft>0||!this.started){this.drafting=false;return;}
    if(isDrafting){
      this.drafting=true;
      this.totalDraftTime+=dt;
      this.draftCharge=Math.min(1,this.draftCharge+dt*0.48);
    }else{
      this.drafting=false;
      this.draftCharge=Math.max(0,this.draftCharge-dt*0.18);
    }
  }
  triggerNitro(duration=2.4){
    if(this.finished||this.crashLeft>0||!this.started)return false;
    this.nitroLeft=duration;
    this.draftCharge=0;
    this.onFeedback('NITRO BOOST');
    return true;
  }
  triggerMiniBoost(){
    if(this.finished||this.crashLeft>0||!this.started)return false;
    if(this.miniBoostTimer<=0||this.miniBoostCount<=0)return false;
    this.miniBoostCount--;
    const isDouble=this.miniBoostCount>0;
    if(isDouble){
      this.miniBoostTimer=0.9;
    }else{
      this.miniBoostTimer=0;
      this.miniBoostReady=false;
    }
    this.miniBoostLeft=1.2;
    this.speed=Math.min((this.t.boostMaxKph||72)/3.6,Math.max(this.speed,42/3.6)+15/3.6);
    this.onFeedback(isDouble?'DOUBLE MINI BOOST':'MINI BOOST');
    return true;
  }
  triggerLandingBoost(){
    if(this.finished||this.crashLeft>0||!this.started)return false;
    if(this.landingBoostTimer<=0)return false;
    this.landingBoostTimer=0;
    this.landingBoostReady=false;
    this.landingBoostLeft=1.35;
    const bonus=this.airborneStunt?3.5:0;
    this.speed=Math.min((this.t.boostMaxKph||72)/3.6,Math.max(this.speed,46/3.6)+(17+bonus)/3.6);
    this.onFeedback('LANDING BOOST');
    return true;
  }
  performStunt(stuntName,points=300){
    if(this.airLeft<=0||this.crashLeft>0)return false;
    this.airborneStunt=stuntName;
    this.stuntScore+=points;
    this.stuntDisplayTimer=1.2;
    this.draftCharge=Math.min(1,this.draftCharge+0.25);
    this.onFeedback('STUNT: '+stuntName);
    return true;
  }
  enterSurface(next){if(next===this.surface)return;if(next==='Grass'){this.grassLeft=this.t.grassDuration;this.speed=Math.min(this.t.grassMaxKph/3.6,this.speed*this.t.grassMultiplier);}if(this.surface==='Swamp')this.swampLeft=this.t.swampRecovery;this.surface=next;}
  boost(duration=this.t.boostDuration){const fresh=this.boostLeft<=0;this.boostLeft=Math.max(this.boostLeft,duration);if(fresh)this.onFeedback('BOOST');}
  slow(duration=.15){const fresh=this.slowLeft<=0;this.slowLeft=Math.max(this.slowLeft,duration);if(fresh)this.onFeedback('SLOW ZONE');}
  launch(duration=this.t.rampAirDuration,height=this.t.rampHeight){if(this.rampLock>0||this.crashLeft>0||this.finished||this.speed*3.6<this.t.rampMinKph)return false;this.airDuration=duration;this.airLeft=duration;this.jumpHeight=height;this.rampLock=duration+.8;this.airborneStunt=null;this.speed=Math.max(this.speed,this.t.rampMinKph/3.6)*this.t.rampGlideMultiplier;this.boostLeft=Math.max(this.boostLeft,duration+.45);this.onFeedback('AIRBORNE');return true;}
  airHeight(){if(this.airLeft<=0||this.airDuration<=0)return 0;const progress=1-this.airLeft/this.airDuration;return Math.sin(progress*Math.PI)*this.jumpHeight;}
  applyPoison(reactionType){
    if(this.protectionLeft>0||this.crashLeft>0||!this.started||this.finished||this.poisonLeft>0)return false;
    this.poisonLeft=this.t.poisonCooldown||4.0;
    this.poisonReactionLeft=1.8;
    const reaction=reactionType||(Math.random()<.33?'dizzy':Math.random()<.66?'cough':'nausea');
    if(reaction==='dizzy'){this.stability=Math.max(0,this.stability-22);this.onFeedback('POISON: DIZZY');}
    else if(reaction==='cough'){this.energy=Math.max(1,this.energy-6);this.onFeedback('POISON: COUGH');}
    else{this.speed=Math.max(0,this.speed-12/3.6);this.onFeedback('POISON: SLOW');}
    return true;
  }
  teleport(toS,toOffset){
    if(this.portalCooldownLeft>0)return false;
    this.portalCooldownLeft=this.t.portalCooldown||6.0;
    this.onFeedback('PORTAL TELEPORT');
    return true;
  }
  crash(heavy,zero=false){if(this.crashLeft>0||this.finished)return;this.crashLeft=heavy?this.t.heavyCrash:this.t.lightCrash;this.restoreEnergy=zero;this.speed=0;this.packLeft=0;this.attackLeft=0;this.emergencyLeft=0;this.steering=0;this.lean=0;this.crashes++;this.state='Crash';this.onFeedback(heavy?'HEAVY CRASH':'CRASH');}
  damage(amount,speedLoss,stabilityLoss,force=false){if(this.protectionLeft>0||this.crashLeft>0||!this.started||this.finished)return;this.packLeft=0;this.energy=Math.max(0,this.energy-amount);this.speed=Math.max(0,this.speed-speedLoss/3.6);this.stability=Math.max(0,this.stability-stabilityLoss*(this.hitProtection>0?.35:1));this.hitProtection=.25;this.onFeedback('HIT');if(this.energy<=0)this.crash(true,true);else if(force||this.stability<=0)this.crash(force);}
  applyItemEffect(type){
    if(this.protectionLeft>0||this.crashLeft>0||!this.started||this.finished)return false;
    this.packLeft=0;
    if(type==='grenade'){this.crash(false);this.onFeedback('ITEM GRENADE');return true;}
    if(type==='poop'){this.poopLeft=Math.max(this.poopLeft,2.5);this.slowLeft=Math.max(this.slowLeft,2.5);this.speed=Math.min(this.speed,38/3.6);this.onFeedback('ITEM POOP');return true;}
    if(type==='net'){this.netLeft=Math.max(this.netLeft,3);this.speed=Math.min(this.speed,42/3.6);this.onFeedback('ITEM NET');return true;}
    return false;
  }
  step(dt,input={},curvature=0){
    const t=this.t;this.clock+=dt;
    for(let i=0;i<TICK_TIMER_KEYS.length;i++){const k=TICK_TIMER_KEYS[i];this[k]=tick(this[k],dt);}
    if(!this.started)return;
    if(this.finished){this.speed=0;this.state='Finished';return;}
    this.elapsed+=dt;
    if(this.crashLeft>0){this.crashLeft=tick(this.crashLeft,dt);this.state='Crash';if(this.crashLeft===0){if(this.restoreEnergy)this.energy=20;this.stability=100;this.protectionLeft=t.protection;this.lastBrake=-100;this.state='Riding';this.onRespawn();}return;}
    if(input.brakePressed){if(this.clock-this.lastBrake<=t.doubleTap&&this.emergencyLock<=0&&this.emergencyLeft<=0){this.emergencyLeft=t.emergencyDuration;this.emergencyLock=t.emergencyDuration+t.emergencyCooldown;this.stability=Math.max(0,this.stability-8);this.onFeedback('EMERGENCY BRAKE');this.lastBrake=-100;}else this.lastBrake=this.clock;}
    if(this.packLeft>0){this.packLeft=tick(this.packLeft,dt);if(this.packLeft===0){this.energy=Math.min(100,this.energy+t.packEnergy);this.packs--;this.onFeedback('ENERGY +30');}}
    if(input.pack&&this.packs>0&&this.energy<100&&this.packLeft<=0&&this.attackLeft<=0)this.packLeft=t.packDuration;
    if(input.attack&&this.packLeft<=0&&this.attackLeft<=0){
      const absAtk=Math.abs(input.attack);
      const isPistol=absAtk===4, isBat=absAtk===3, kick=absAtk===2;
      const cdKey=isPistol?'pistolLeft':isBat?'batLeft':kick?'kickLeft':'punchLeft';
      if(this[cdKey]<=0){
        const brawlerReduction = this.talent==='brawler'?0.8:1;
        this[cdKey]=(isPistol?t.pistolCooldown:isBat?t.batCooldown:kick?t.kickCooldown:t.punchCooldown)*brawlerReduction;
        this.attackLeft=isPistol?.5:isBat?.65:kick?.7:.45;
        this.attackSide=isPistol||isBat?1:Math.sign(input.attack);
        this.attackIsKick=kick;
        this.attackIsBat=isBat;
        this.attackIsPistol=isPistol;
        this.onFeedback(isPistol?'PISTOL':isBat?'BAT':kick?'KICK':'PUNCH');
        this.onAttack({
          kick,
          bat: isBat,
          pistol: isPistol,
          side: this.attackSide,
          damage: isPistol?t.pistolDamage:isBat?t.batDamage:kick?t.kickDamage:t.punchDamage,
          range: isPistol?t.pistolRange:isBat?t.batRange:kick?t.kickRange:t.punchRange,
          longitudinal: isPistol?t.pistolRange:isBat?t.batLongitudinal:t.attackLongitudinal
        });
      }
    }
    const kph=this.speed*3.6, steer=(input.steer||0)*(this.netLeft>0?.45:1),turn=Math.abs(steer)>.1?Math.sign(steer):0;
    if(turn&&turn!==this.lastTurn){if(this.lastTurn&&this.clock-this.lastTurnAt<.6&&kph>45)this.stability-=24;this.lastTurn=turn;this.lastTurnAt=this.clock;this.steeringHeld=0;}
    this.steeringHeld=turn?this.steeringHeld+dt:0;this.steering=lerp(this.steering,steer,1-Math.exp(-dt/t.steerReturn));
    const leaning=kph>=t.leanMinKph&&this.steeringHeld>=.2&&Math.abs(curvature)>.0006&&Math.sign(this.steering)===Math.sign(curvature)&&Math.abs(this.steering)>.15;
    const grip=this.surface==='Gravel'?.75:this.surface==='Swamp'?.65:1,turnScale=kph<20?1:kph<40?.85:kph<50?.7:.55;
    this.heading+=this.steering*t.steerDegrees*Math.PI/180*turnScale*grip*(leaning?1.2:1)*(this.airLeft>0?t.airSteerMultiplier:1)*(this.isDrifting?1.35:1)*clamp(this.speed/2,0,1)*dt;
    if(this.poisonReactionLeft>0){this.heading+=Math.sin(this.clock*24)*.07*dt;}
    this.lean=lerp(this.lean,leaning?-this.steering*32:-this.steering*12,1-Math.exp(-dt*7));
    const risk=leaning&&(kph>t.leanRiskKph||this.surface==='Gravel');this.stability=clamp(this.stability+(risk?-22*Math.abs(this.steering):18)*dt,0,100);
    if(this.stability<=0){this.crash(false);return;}if(this.stability<25){this.heading+=Math.sin(this.clock*17)*.09*dt;this.speed=Math.max(0,this.speed-1.5*dt);}

    // Check landing detection
    if(this.prevAirLeft>0 && this.airLeft<=0 && this.crashLeft<=0){
      this.landingBoostTimer=0.9;
      this.landingBoostReady=true;
      this.onFeedback('LANDING BOOST READY');
    }
    this.prevAirLeft=this.airLeft;
    if(this.miniBoostTimer<=0) this.miniBoostReady=false;
    if(this.landingBoostTimer<=0) this.landingBoostReady=false;

    // QQ Speed Style Drift & Mini-Boost System
    const wantsDrift = input.drift && kph >= 24.0 && (Math.abs(steer) > 0.05 || this.isDrifting);
    if(wantsDrift){
      this.isDrifting=true;
      this.driftCharge=Math.min(1,this.driftCharge+dt*0.75);
      // Drift also charges nitro tank
      this.draftCharge=Math.min(1,this.draftCharge+dt*0.38);
      // Oversteer warning (only at extreme angles)
      if(Math.abs(this.steering)>0.94){
        this.stability=clamp(this.stability-35*dt,0,100);
        if(this.stability<=0){
          this.isDrifting=false;
          this.driftCharge=0;
          this.crash(false);
          this.onFeedback('SLIP CRASH');
          return;
        }
      }
    }else if(this.isDrifting){
      // Exited drift: open Mini-Boost window!
      if(this.driftCharge>=0.20 && this.crashLeft<=0){
        this.miniBoostReady=true;
        this.miniBoostTimer=1.35;
        this.miniBoostQuality=this.driftCharge;
        this.miniBoostCount=this.driftCharge>=0.70 ? 2 : 1; // Double boost (双喷) if charged enough!
        this.onFeedback('MINI BOOST READY');
      }
      if(this.driftCharge>=0.95){
        this.draftCharge=1.0;
        this.onFeedback('NITRO FULL');
      }
      this.isDrifting=false;
      this.driftCharge=0;
    }

    if(input.nitro&&this.draftCharge>=0.85&&this.nitroLeft<=0){
      this.triggerNitro(2.4);
    }
    const terrainCap=this.surface==='Swamp'?.65:this.swampLeft>0?lerp(1,.65,this.swampLeft/t.swampRecovery):this.surface==='Gravel'?.9:1;
    const isBoosting=this.boostLeft>0||this.miniBoostLeft>0||this.landingBoostLeft>0;
    const boostCap=isBoosting?(t.boostMaxKph||74):Infinity,slowCap=this.slowLeft>0?t.slowMaxKph:Infinity,itemCap=this.netLeft>0?42:this.poopLeft>0?38:Infinity,pistolCap=this.pistolSlowLeft>0?t.pistolSlowMaxKph:Infinity;
    const grassCap=this.grassLeft>0&&!isBoosting?t.grassMaxKph:Infinity;
    const sprinterBonus=this.talent==='sprinter'?3:0;
    const normalMax=(maxKph(this.energy,t)+sprinterBonus)/3.6*terrainCap*(this.grassLeft>0?t.grassMultiplier:1)*(isBoosting?t.boostMultiplier:1);
    const baseWithBonus=(this.nitroLeft>0||this.landingBoostLeft>0)?Math.max(normalMax,(t.nitroMaxKph||70)/3.6):this.miniBoostLeft>0?Math.max(normalMax,62/3.6):this.drafting?normalMax+5.5/3.6:normalMax;
    const max=Math.min(baseWithBonus,grassCap/3.6,boostCap/3.6,slowCap/3.6,itemCap/3.6,pistolCap/3.6);
    const emergencyStep=Math.min(dt,this.emergencyLeft);this.emergencyLeft=tick(this.emergencyLeft,dt);
    if(emergencyStep>0)this.speed-=t.emergencyBrake*emergencyStep;else if(input.brake)this.speed-=t.brake*dt;else if(input.accelerate){const curve=kph<20?1:kph<40?.85:kph<50?.65:.35;this.speed+=t.acceleration*curve*(this.surface==='Swamp'?.6:1)*(this.slowLeft>0?t.slowAccelerationMultiplier:1)*dt;if(this.drafting)this.speed+=2.2*dt;}else this.speed-=(this.airLeft>0?t.airCoast:t.coast)*dt;
    if(this.nitroLeft>0)this.speed+=8.5*dt;
    if(this.miniBoostLeft>0)this.speed+=12.0*dt;
    if(this.landingBoostLeft>0)this.speed+=15.5*dt;
    this.speed-=Math.abs(this.steering)*(leaning?.12:.45)*dt;
    if(this.speed>max)this.speed=Math.max(max,this.speed-4*dt);this.speed=Math.max(0,this.speed);this.topKph=Math.max(this.topKph,this.speed*3.6);
    this.state=this.airLeft>0?'Airborne':this.landingBoostLeft>0?'LandingBoost':this.miniBoostLeft>0?'MiniBoost':emergencyStep>0?'EmergencyBraking':this.packLeft>0?'UsingEnergyPack':this.attackLeft>0?'Attacking':this.netLeft>0?'Netted':this.poopLeft>0?'Pooped':this.poisonReactionLeft>0?'Poisoned':this.nitroLeft>0?'Nitro':this.isDrifting?'Drifting':this.drafting?'Drafting':this.slowLeft>0?'Slowed':this.boostLeft>0?'Boosting':this.stability<50?'Unstable':leaning?'Leaning':input.brake?'Braking':'Riding';
  }
}
export function detectDrafting(follower,leaders=[]){
  if(!follower||(follower.sim?follower.sim.speed*3.6<20||follower.sim.finished:false))return false;
  const fDist=follower.progress?follower.progress.distance:0;
  const fOff=follower.offset!==undefined?follower.offset:(follower.location?follower.location.offset:0);
  for(const leader of leaders){
    if(!leader||leader===follower)continue;
    if(leader.sim&&leader.sim.finished)continue;
    const lDist=leader.progress?leader.progress.distance:0;
    const lOff=leader.offset!==undefined?leader.offset:(leader.location?leader.location.offset:0);
    const gap=lDist-fDist;
    if(gap>=1.2&&gap<=9.8){
      const lateral=Math.abs(lOff-fOff);
      if(lateral<=1.48)return true;
    }
  }
  return false;
}
export class Track {
  constructor(data){
    this.data=data;
    const p=this.data.points;
    this.gridCellSize=50;
    this.grid=new Map();
    this.segments=new Array(p.length-1);
    for(let i=0;i<p.length-1;i++){
      const a=p[i],b=p[i+1];
      const dx=b.x-a.x,dz=b.z-a.z,mag=Math.hypot(dx,dz);
      const prev=p[(i-1+p.length-1)%(p.length-1)],next=(i+1)%(p.length-1);
      const h0=Math.atan2(a.x-prev.x,a.z-prev.z),h1=Math.atan2(p[next+1].x-p[next].x,p[next+1].z-p[next].z),angle=Math.atan2(Math.sin(h1-h0),Math.cos(h1-h0));
      const lenSq=dx*dx+dz*dz;
      this.segments[i]={
        dx,dz,mag,
        fx:dx/mag,fz:dz/mag,rx:dz/mag,rz:-dx/mag,
        invDs:1/(b.s-a.s),
        invLenSq:lenSq>1e-9?1/lenSq:0,
        curvature:angle/((b.s-a.s)*2)
      };
      const minX=Math.min(a.x,b.x)-18, maxX=Math.max(a.x,b.x)+18;
      const minZ=Math.min(a.z,b.z)-18, maxZ=Math.max(a.z,b.z)+18;
      const x0=Math.floor(minX/this.gridCellSize), x1=Math.floor(maxX/this.gridCellSize);
      const z0=Math.floor(minZ/this.gridCellSize), z1=Math.floor(maxZ/this.gridCellSize);
      for(let gx=x0;gx<=x1;gx++){
        for(let gz=z0;gz<=z1;gz++){
          const key=`${gx},${gz}`;
          let cell=this.grid.get(key);
          if(!cell){cell=[];this.grid.set(key,cell);}
          cell.push(i);
        }
      }
    }
  }
  sample(distance){
    const {points:p,length}=this.data,s=((distance%length)+length)%length;
    let lo=0,hi=p.length-2;
    while(lo<hi){
      const m=Math.ceil((lo+hi)/2);
      if(p[m].s<=s)lo=m;else hi=m-1;
    }
    const a=p[lo],seg=this.segments[lo],t=(s-a.s)*seg.invDs;
    return {x:a.x+seg.dx*t,z:a.z+seg.dz*t,fx:seg.fx,fz:seg.fz,rx:seg.rx,rz:seg.rz,s,curvature:seg.curvature,distance:0,offset:0};
  }
  nearest(x,z,hintS=null){
    const p=this.data.points;
    let best=Infinity,dist=0,bestIdx=-1,bestT=0;
    // Fast path: if hintS is provided, check +/- 10 segments around hintS (+/- 50m)
    if(hintS!==null&&hintS!==undefined&&!Number.isNaN(hintS)){
      const segCount=p.length-1;
      const centerIdx=Math.floor((((hintS%this.data.length)+this.data.length)%this.data.length)/5);
      const halfWindow=10;
      for(let w=-halfWindow;w<=halfWindow;w++){
        const i=((centerIdx+w)%segCount+segCount)%segCount;
        const a=p[i],b=p[i+1],seg=this.segments[i];
        const t=clamp(((x-a.x)*seg.dx+(z-a.z)*seg.dz)*seg.invLenSq,0,1);
        const sq=(x-a.x-seg.dx*t)**2+(z-a.z-seg.dz*t)**2;
        if(sq<best){best=sq;dist=a.s+(b.s-a.s)*t;bestIdx=i;bestT=t;}
      }
      if(best<324&&bestIdx>=0){
        const a=p[bestIdx],seg=this.segments[bestIdx];
        const sx=a.x+seg.dx*bestT,sz=a.z+seg.dz*bestT;
        return {
          x:sx,z:sz,fx:seg.fx,fz:seg.fz,rx:seg.rx,rz:seg.rz,
          s:dist,curvature:seg.curvature,distance:Math.sqrt(best),
          offset:(x-sx)*seg.rx+(z-sz)*seg.rz
        };
      }
    }
    const gx=Math.floor(x/this.gridCellSize), gz=Math.floor(z/this.gridCellSize);
    let candidates=this.grid.get(`${gx},${gz}`);
    if(!candidates||candidates.length===0){
      for(let dx=-1;dx<=1;dx++){
        for(let dz=-1;dz<=1;dz++){
          if(dx===0&&dz===0)continue;
          const neighbor=this.grid.get(`${gx+dx},${gz+dz}`);
          if(neighbor){
            if(!candidates)candidates=[];
            candidates.push(...neighbor);
          }
        }
      }
    }
    if(candidates&&candidates.length>0){
      for(let k=0;k<candidates.length;k++){
        const i=candidates[k],a=p[i],b=p[i+1],seg=this.segments[i];
        const t=clamp(((x-a.x)*seg.dx+(z-a.z)*seg.dz)*seg.invLenSq,0,1);
        const sq=(x-a.x-seg.dx*t)**2+(z-a.z-seg.dz*t)**2;
        if(sq<best){best=sq;dist=a.s+(b.s-a.s)*t;}
      }
    }else{
      for(let i=0;i<p.length-1;i++){
        const a=p[i],b=p[i+1],seg=this.segments[i];
        const t=clamp(((x-a.x)*seg.dx+(z-a.z)*seg.dz)*seg.invLenSq,0,1);
        const sq=(x-a.x-seg.dx*t)**2+(z-a.z-seg.dz*t)**2;
        if(sq<best){best=sq;dist=a.s+(b.s-a.s)*t;}
      }
    }
    const out=this.sample(dist);
    out.offset=(x-out.x)*out.rx+(z-out.z)*out.rz;
    out.distance=Math.sqrt(best);
    return out;
  }
  surfaceAt(at){for(const z of this.data.zones)if(at.s>=z.from&&at.s<=z.to&&at.offset>=z.minOffset&&at.offset<=z.maxOffset)return z.kind;return at.distance>7?'Gravel':'Asphalt';}
  featureAt(kind,at){return (this.data.features?.[kind]||[]).find(feature=>at.s>=feature.from&&at.s<=feature.to&&at.offset>=feature.minOffset&&at.offset<=feature.maxOffset);}
  crossedRamp(fromS,toS,offset){const travel=((toS-fromS)%this.data.length+this.data.length)%this.data.length;if(travel<=0||travel>30)return null;return (this.data.features?.ramps||[]).find(ramp=>{const gap=((ramp.s-fromS)%this.data.length+this.data.length)%this.data.length;return gap<=travel+.1&&Math.abs(offset-ramp.offset)<=ramp.width/2;})||null;}
  crossedPortal(fromS,toS,offset){const travel=((toS-fromS)%this.data.length+this.data.length)%this.data.length;if(travel<=0||travel>30)return null;return (this.data.features?.portals||[]).find(portal=>{const gap=((portal.fromS-fromS)%this.data.length+this.data.length)%this.data.length;return gap<=travel+.1&&Math.abs(offset-portal.fromOffset)<=(portal.radius||2.5);})||null;}
}
export class RaceProgress {
  constructor(){this.distance=0;this.lastS=0;this.checkpoints=0;}
  advance(at,moved,length){
    let delta=at.s-this.lastS;
    if(delta>length/2)delta-=length;
    if(delta<-length/2)delta+=length;
    this.lastS=at.s;
    if(delta<0 && Math.abs(delta)>moved+5)return false;
    this.distance+=delta;
    if(this.distance<0) this.distance=0;

    const expectedCp = Math.min(10, Math.floor((this.distance + 5) / (length / 10)));
    if(expectedCp > this.checkpoints){
      this.checkpoints = expectedCp;
    }

    const isFinishCrossing = (this.distance >= length * 0.98) && (at.s < 40 && this.lastS > length - 40);
    if(this.distance >= length || isFinishCrossing){
      this.checkpoints = 10;
      this.distance = Math.max(this.distance, length);
      return true;
    }
    return false;
  }
}
export function selectTarget(targets,x,z,heading,attack){
  const fx=Math.sin(heading),fz=Math.cos(heading);
  const rx=fz,rz=-fx; // Local right normal vector
  return targets.filter(o=>{
    if(o.energy<=0) return false;
    const dx=o.x-x,dz=o.z-z;
    const longitudinal=dx*fx+dz*fz; // forward distance: >0 ahead, <0 behind
    const lateral=dx*rx+dz*rz; // lateral distance: >0 right, <0 left

    if(attack.pistol){
      // Pistol: shoot straight forward in a focused corridor
      return longitudinal > 0.6 && longitudinal <= (attack.range || 16) && Math.abs(lateral) <= (1.1 + longitudinal * 0.06);
    }

    if(attack.bat){
      // Baseball bat: forceful swing hitting rider alongside either left or right
      const absLat = Math.abs(lateral);
      return Math.abs(longitudinal) <= (attack.longitudinal || 1.35) && absLat >= 0.35 && absLat <= (attack.range || 1.75);
    }

    // Precise melee (Punch / Kick):
    // Must match the physical side (+1 right, -1 left) and be physically alongside the rider's bike frame
    const isRight = lateral >= 0.30 && lateral <= (attack.range || 1.4);
    const isLeft = lateral <= -0.30 && lateral >= -(attack.range || 1.4);
    const sideMatch = attack.side > 0 ? isRight : isLeft;

    // Longitudinal precision: punches are landed when bikes are alongside torso/bars (within ~1.15m)
    const maxLongitudinal = attack.kick ? 1.10 : 1.20;
    const longitudinalMatch = Math.abs(longitudinal) <= maxLongitudinal;

    return sideMatch && longitudinalMatch;
  }).sort((a,b)=>(a.x-x)**2+(a.z-z)**2-(b.x-x)**2-(b.z-z)**2)[0];
}

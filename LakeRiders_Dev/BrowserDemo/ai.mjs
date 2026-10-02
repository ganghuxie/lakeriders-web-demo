import {RiderSimulation,RaceProgress,clamp} from './core.mjs';

function forwardGap(from,to,length){return ((to-from)%length+length)%length;}
function relative(attacker,target){
  const fx=Math.sin(attacker.heading),fz=Math.cos(attacker.heading),rx=fz,rz=-fx;
  const dx=target.x-attacker.x,dz=target.z-attacker.z;
  return {lateral:dx*rx+dz*rz,longitudinal:dx*fx+dz*fz,distance:Math.hypot(dx,dz)};
}

export class BotRacer {
  constructor(track,tuning,config){
    this.track=track;this.tuning=tuning;this.id=config.id;this.name=config.name;this.color=config.color;
    this.aggression=config.aggression;this.skill=config.skill??1;this.seed=config.seed;this.startLane=config.lane;
    this.sim=new RiderSimulation(tuning);this.progress=new RaceProgress();
    this.stats={hits:0,received:0,collisions:0,overtakes:0,itemPickups:0,itemHits:0};this.finishTime=Infinity;this.lastRank=0;this.item='';this.itemThinkLeft=1.5+this.random()*2;
    this.offset=config.lane;this.desiredOffset=config.lane;this.course=0;this.thinkLeft=.8+this.random();
    this.x=0;this.z=0;this.heading=0;this.pendingTarget=null;this.lastAction='';
    this.sim.onAttack=attack=>{if(this.pendingTarget&&this.pendingTarget.sim.crashLeft<=0&&!this.pendingTarget.sim.finished){this.pendingTarget.receiveHit(attack,this);this.stats.hits++;this.lastAction=attack.kick?'KICK':'PUNCH';}};
    this.sim.onFeedback=message=>{if(message.includes('CRASH'))this.lastAction='CRASH';};
    this.place();
  }
  random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
  start(){this.sim.start();}
  place(){const at=this.track.sample(this.course);this.heading=Math.atan2(at.fx,at.fz);this.x=at.x+at.rx*this.offset;this.z=at.z+at.rz*this.offset;this.at={...at,offset:this.offset,distance:Math.abs(this.offset)};}
  receiveHit(attack,attacker){
    const before=this.sim.crashes;
    const isPistol=Boolean(attack.pistol), isBat=Boolean(attack.bat), kick=Boolean(attack.kick);
    this.sim.damage(attack.damage,isPistol?12:isBat?8:kick?5.5:3,isBat?40:kick?30:15);
    if(isPistol)this.sim.pistolSlowLeft=1.8;
    const side=Math.sign(relative(this,attacker).lateral)||1;
    this.offset=clamp(this.offset-side*(isBat?.95:kick?.75:.35),-6.2,6.2);
    this.stats.received++;if(this.sim.crashes>before)this.lastAction='DOWN';
  }
  receiveCollision(damage,speedLoss,stabilityLoss){this.sim.damage(damage,speedLoss,stabilityLoss);this.stats.collisions++;}
  receiveItem(type){const applied=this.sim.applyItemEffect(type);if(applied){this.stats.received++;this.lastAction='ITEM_'+type.toUpperCase();}return applied;}
  nudge(dx,dz){const at=this.track.sample(this.course);this.offset=clamp(this.offset+dx*at.rx+dz*at.rz,-6.3,6.3);}
  chooseLine(obstacles,competitors,pickups=[]){
    let bestSupply=null, minSupplyGap=Infinity;
    const trackLen=this.track.data.length;
    for(let i=0;i<pickups.length;i++){
      const item=pickups[i];
      if(!item.active)continue;
      const gap=forwardGap(this.at.s,item.s,trackLen);
      if(gap<95&&gap<minSupplyGap){
        minSupplyGap=gap;
        bestSupply=item;
      }
    }
    if(bestSupply&&this.sim.packs===0){this.desiredOffset=clamp(bestSupply.offset,-5.5,5.5);return;}
    for(let i=0;i<obstacles.length;i++){
      const o=obstacles[i];
      if(o.kind!=='Target'&&forwardGap(this.at.s,o.s,trackLen)<30&&Math.abs(o.offset-this.desiredOffset)<1.7){
        this.desiredOffset=clamp(o.offset+(o.offset>0?-3:3),-5.5,5.5);
        return;
      }
    }
    for(let i=0;i<competitors.length;i++){
      const other=competitors[i];
      if(other!==this&&forwardGap(this.at.s,other.at?.s??0,trackLen)<16&&Math.abs((other.offset??0)-this.offset)<1.2){
        this.desiredOffset=clamp(this.offset+(this.random()>.5?2.2:-2.2),-5.5,5.5);
        return;
      }
    }
    this.desiredOffset=clamp((this.random()-.5)*9,-5.5,5.5);
  }
  chooseAttack(competitors){
    if(this.sim.attackLeft>0||this.sim.packLeft>0)return 0;
    if(this.sim.pistolLeft<=0&&this.random()<this.aggression*.45){
      for(let i=0;i<competitors.length;i++){
        const other=competitors[i];
        if(other===this||other.sim.finished||other.sim.crashLeft>0)continue;
        const rel=relative(this,other);
        if(rel.longitudinal>1.5&&rel.longitudinal<=this.tuning.pistolRange&&Math.abs(rel.lateral)<=3.5){
          this.pendingTarget=other;
          return 4;
        }
      }
    }
    if(this.sim.batLeft<=0&&this.random()<this.aggression*.55){
      for(let i=0;i<competitors.length;i++){
        const other=competitors[i];
        if(other===this||other.sim.finished||other.sim.crashLeft>0)continue;
        const rel=relative(this,other);
        if(Math.abs(rel.lateral)<=this.tuning.batRange&&Math.abs(rel.longitudinal)<=this.tuning.batLongitudinal){
          this.pendingTarget=other;
          return 3;
        }
      }
    }
    let bestCand=null, bestDist=Infinity;
    for(let i=0;i<competitors.length;i++){
      const other=competitors[i];
      if(other===this||other.sim.finished||other.sim.crashLeft>0)continue;
      const rel=relative(this,other);
      if(Math.abs(rel.lateral)<=this.tuning.kickRange&&Math.abs(rel.longitudinal)<=this.tuning.attackLongitudinal){
        if(rel.distance<bestDist){
          bestDist=rel.distance;
          bestCand={other,lateral:rel.lateral};
        }
      }
    }
    if(!bestCand||this.random()>this.aggression)return 0;
    this.pendingTarget=bestCand.other;
    const side=Math.sign(bestCand.lateral)||1;
    return side*(this.random()<.42?2:1);
  }
  useItem(competitors){
    if(!this.item||this.sim.crashLeft>0||this.sim.finished)return null;
    const targets=competitors.filter(other=>other!==this&&!other.sim.finished&&other.sim.crashLeft<=0&&other.sim.protectionLeft<=0).sort((a,b)=>Math.abs(a.progress.distance-this.progress.distance)-Math.abs(b.progress.distance-this.progress.distance));
    if(!targets.length)return null;const target=targets[0],type=this.item;this.item='';if(target.receiveItem?.(type,this)){this.stats.itemHits++;return {target,type};}return null;
  }
  step(dt,competitors,obstacles,leaderDistance,pickups=[]){
    this.pendingTarget=null;if(!this.sim.started)return;
    if(this.sim.finished){this.sim.step(dt,{});return;}
    this.place();this.thinkLeft-=dt;this.itemThinkLeft-=dt;if(this.item&&this.itemThinkLeft<=0){this.useItem(competitors);this.itemThinkLeft=2.2+this.random()*2.5;}
    if(this.thinkLeft<=0){this.chooseLine(obstacles,competitors,pickups);this.thinkLeft=.75+this.random()*1.35;}
    const laneDelta=this.desiredOffset-this.offset;
    const curveSteer=Math.sign(this.at.curvature)*Math.min(.85,Math.abs(this.at.curvature)*150);
    const laneSteer=clamp(laneDelta*.16,-.55,.55);
    const attack=this.chooseAttack(competitors);
    const braking=Math.abs(this.at.curvature)>.008&&this.sim.speed*3.6>50;
    this.sim.enterSurface(this.track.surfaceAt(this.at));
    this.sim.step(dt,{accelerate:!braking,brake:braking,steer:clamp(curveSteer+laneSteer,-1,1),attack,pack:this.sim.energy<42&&this.sim.packs>0},this.at.curvature);
    this.sim.speed=Math.max(0,this.sim.speed+this.tuning.acceleration*(this.skill-1)*dt);
    if(this.sim.crashLeft>0){this.place();return;}
    const behind=Math.max(0,leaderDistance-this.progress.distance);
    if(behind>100)this.sim.speed+=this.tuning.acceleration*Math.min(.10,behind>180?.10:.06)*dt;
    const moved=this.sim.speed*dt,previousS=this.at.s;this.course+=moved;this.offset+=laneDelta*(1-Math.exp(-dt*1.35));
    this.place();
    const boost=this.track.featureAt('boosts',this.at),slow=this.track.featureAt('slows',this.at),ramp=this.track.crossedRamp(previousS,this.at.s,this.offset);
    if(boost)this.sim.boost();if(slow)this.sim.slow();if(ramp)this.sim.launch();
    const poison=this.track.featureAt('poisonZones',this.at);
    if(poison)this.sim.applyPoison();
    const portal=this.track.crossedPortal(previousS,this.at.s,this.offset);
    if(portal&&this.sim.teleport(portal.toS,portal.toOffset)){
      this.course=portal.toS;
      this.offset=portal.toOffset;
      const jumpedS=(portal.toS-portal.fromS+this.track.data.length)%this.track.data.length;
      this.progress.distance+=jumpedS;
      this.progress.lastS=this.course;
      this.place();
    }
    if(this.progress.advance(this.at,moved,this.track.data.length)){this.sim.finish();this.finishTime=this.sim.elapsed;this.course=this.track.data.length;this.place();}
  }
}

export function createBots(track,tuning,configs){return configs.map(config=>new BotRacer(track,tuning,config));}

export function rankRacers(racers){
  return [...racers].sort((a,b)=>{
    if(a.sim.finished!==b.sim.finished)return a.sim.finished?-1:1;
    if(a.sim.finished&&b.sim.finished)return a.finishTime-b.finishTime;
    return b.progress.distance-a.progress.distance;
  });
}

export function updateOvertakes(racers){
  const ranked=rankRacers(racers);
  ranked.forEach((racer,index)=>{const rank=index+1;if(racer.lastRank&&rank<racer.lastRank)racer.stats.overtakes+=racer.lastRank-rank;racer.lastRank=rank;});
  return ranked;
}

export class RiderCollisionWorld {
  constructor(){this.cooldowns=new Map();}
  reset(){this.cooldowns.clear();}
  step(dt,racers){
    for(const [key,left] of this.cooldowns)this.cooldowns.set(key,Math.max(0,left-dt));
    for(let i=0;i<racers.length;i++)for(let j=i+1;j<racers.length;j++){
      const a=racers[i],b=racers[j];if(a.sim.crashLeft>0||b.sim.crashLeft>0||a.sim.airLeft>0||b.sim.airLeft>0||a.sim.finished||b.sim.finished)continue;
      const dx=b.x-a.x,dz=b.z-a.z,distance=Math.hypot(dx,dz);if(distance>=.92)continue;
      const nx=distance>.001?dx/distance:1,nz=distance>.001?dz/distance:0,push=Math.max((.92-distance)*.5,.025);
      a.nudge(-nx*push,-nz*push);b.nudge(nx*push,nz*push);
      const key=a.id<b.id?a.id+'|'+b.id:b.id+'|'+a.id;if((this.cooldowns.get(key)||0)>0)continue;
      this.cooldowns.set(key,.55);
      const relativeSpeed=Math.abs(a.sim.speed-b.sim.speed),hard=relativeSpeed>4;
      const damage=hard?clamp(relativeSpeed*1.2,4,15):relativeSpeed>1?1:0;
      const speedLoss=hard?clamp(relativeSpeed*1.4,4,12):1;
      const stability=hard?clamp(relativeSpeed*5,18,55):8;
      a.receiveCollision(damage,speedLoss,stability);b.receiveCollision(damage,speedLoss,stability);
    }
  }
}

import {RiderSimulation,RaceProgress} from './core.mjs';

export class RemoteRacer {
  constructor(track,tuning,player,visual,sendHit){
    this.track=track;this.id=player.id;this.name=player.name;this.color=player.color;this.visual=visual;this.sendHit=sendHit;
    this.sim=new RiderSimulation(tuning);this.sim.start();this.progress=new RaceProgress();this.stats={hits:0,received:0,collisions:0,overtakes:0,pickups:0,itemHits:0};this.finishTime=Infinity;this.lastRank=0;this.lastSeq=-1;this.item='';
    const start=track.sample(0);this.x=this.targetX=start.x;this.z=this.targetZ=start.z;this.heading=this.targetHeading=Math.atan2(start.fx,start.fz);this.at=start;
  }
  apply(state){if(!state||state.seq<=this.lastSeq)return;this.lastSeq=state.seq;this.targetX=state.x;this.targetZ=state.z;this.targetHeading=state.heading;this.progress.distance=state.distance;this.progress.checkpoints=state.checkpoints;for(const key of ['speed','energy','packs','state','attackLeft','attackSide','attackIsKick','crashLeft','protectionLeft','boostLeft','slowLeft','poopLeft','netLeft','airLeft','airDuration','jumpHeight','elapsed','finished'])if(state[key]!==undefined)this.sim[key]=state[key];if(state.finished)this.finishTime=state.elapsed;}
  smooth(dt){const amount=1-Math.exp(-dt*14);this.x+=(this.targetX-this.x)*amount;this.z+=(this.targetZ-this.z)*amount;const angle=Math.atan2(Math.sin(this.targetHeading-this.heading),Math.cos(this.targetHeading-this.heading));this.heading+=angle*amount;this.at=this.track.nearest(this.x,this.z);}
  get offset(){return this.at.offset;}
  nudge(){}
  receiveCollision(){}
  receiveHit(attack){this.sendHit(this.id,attack);}
  receiveItem(type){return this.sim.applyItemEffect(type);}
}

export function serializeRacer(racer){return {x:racer.x,z:racer.z,heading:racer.heading,speed:racer.sim.speed,energy:racer.sim.energy,packs:racer.sim.packs,state:racer.sim.state,attackLeft:racer.sim.attackLeft,attackSide:racer.sim.attackSide,attackIsKick:racer.sim.attackIsKick,crashLeft:racer.sim.crashLeft,protectionLeft:racer.sim.protectionLeft,boostLeft:racer.sim.boostLeft,slowLeft:racer.sim.slowLeft,poopLeft:racer.sim.poopLeft,netLeft:racer.sim.netLeft,airLeft:racer.sim.airLeft,airDuration:racer.sim.airDuration,jumpHeight:racer.sim.jumpHeight,distance:racer.progress.distance,checkpoints:racer.progress.checkpoints,elapsed:racer.sim.elapsed,finished:racer.sim.finished};}

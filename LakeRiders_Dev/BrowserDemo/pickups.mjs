function rng(seed){
  let state=seed>>>0;
  return ()=>{state=(state+0x6d2b79f5)>>>0;let value=state;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return ((value^value>>>14)>>>0)/4294967296;};
}

function courseGap(a,b,length){const direct=Math.abs(a-b);return Math.min(direct,length-direct);}

export function generateEnergyPickups(track,obstacles,count,seed){
  const random=rng(seed),pickups=[],length=track.data.length;
  for(let attempts=0;pickups.length<count&&attempts<count*80;attempts++){
    const s=100+random()*(length-200),offset=-5+random()*10;
    if(obstacles.some(item=>item.kind!=='Target'&&courseGap(s,item.s,length)<28))continue;
    if(pickups.some(item=>courseGap(s,item.s,length)<135))continue;
    const at=track.sample(s);
    pickups.push({id:'energy-'+pickups.length,s,offset,x:at.x+at.rx*offset,z:at.z+at.rz*offset,active:true,mesh:null,spin:random()*Math.PI*2});
  }
  return pickups;
}

export function collectEnergyPickups(racers,pickups,maxPacks){
  const collected=[];
  for(const pickup of pickups){
    if(!pickup.active)continue;
    for(const racer of racers){
      if(racer.sim.finished||racer.sim.crashLeft>0||racer.sim.packs>=maxPacks)continue;
      if(Math.hypot(racer.x-pickup.x,racer.z-pickup.z)>1.05)continue;
      if(!racer.sim.collectPack(maxPacks))continue;
      pickup.active=false;racer.stats.pickups=(racer.stats.pickups||0)+1;collected.push({racer,pickup});break;
    }
  }
  return collected;
}

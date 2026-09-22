const seeded=seed=>{let state=seed>>>0;return()=>{state=(state+0x6d2b79f5)>>>0;let value=state;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return((value^value>>>14)>>>0)/4294967296;};};
const courseGap=(a,b,length)=>{const direct=Math.abs(a-b);return Math.min(direct,length-direct);};

export const ITEM_TYPES={
  grenade:{name:'手榴弹',short:'震下车',color:'#ff8055',duration:1.5},
  poop:{name:'粑粑',short:'糊脸减速',color:'#9b613f',duration:2.5},
  net:{name:'渔网',short:'缠绕操控',color:'#79e7ef',duration:3}
};

export function rollItemType(rank,total,roll){
  const behind=total<=1?0:(Math.max(1,rank)-1)/(total-1);
  const grenade=.25+behind*.20,net=.35+behind*.05;
  return roll<grenade?'grenade':roll<grenade+net?'net':'poop';
}

export function generateItemBoxes(track,obstacles,energyPickups=[],count=7,seed=1){
  const random=seeded((seed^0x91e10da5)>>>0),boxes=[],length=track.data.length;
  for(let attempts=0;boxes.length<count&&attempts<count*120;attempts++){
    const s=140+random()*(length-280),offset=-5.25+random()*10.5;
    if(obstacles.some(item=>item.kind!=='Target'&&courseGap(s,item.s,length)<22))continue;
    if(energyPickups.some(item=>courseGap(s,item.s,length)<55))continue;
    if(boxes.some(item=>courseGap(s,item.s,length)<160))continue;
    const at=track.sample(s);boxes.push({id:'item-'+boxes.length,s,offset,x:at.x+at.rx*offset,z:at.z+at.rz*offset,active:true,roll:random(),mesh:null,spin:random()*Math.PI*2});
  }
  return boxes;
}

export function collectItemBoxes(racers,boxes){
  const collected=[];
  for(const box of boxes){
    if(!box.active)continue;
    for(const racer of racers){
      if(racer.item||racer.sim.finished||racer.sim.crashLeft>0)continue;
      if(Math.hypot(racer.x-box.x,racer.z-box.z)>1.15)continue;
      const rank=Math.max(1,racer.lastRank||racers.indexOf(racer)+1),item=rollItemType(rank,racers.length,box.roll);
      box.active=false;racer.item=item;racer.stats.itemPickups=(racer.stats.itemPickups||0)+1;collected.push({racer,box,item});break;
    }
  }
  return collected;
}

export function targetOrder(racer,candidates){
  return candidates.filter(item=>item!==racer&&!item.sim.finished).sort((a,b)=>{
    const aheadA=a.progress.distance-racer.progress.distance,aheadB=b.progress.distance-racer.progress.distance;
    const bucketA=aheadA>=0?0:1,bucketB=aheadB>=0?0:1;
    return bucketA-bucketB||Math.abs(aheadA)-Math.abs(aheadB);
  });
}

import crypto from 'node:crypto';

const palette=['#d7ef83','#ff8055','#f1c96b','#6fc8d0','#9fcf86'];
const cleanName=value=>(String(value||'骑手').trim().slice(0,12)||'骑手');
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function newPlayer(id,name,color,joinedAt){
  return {id,name:cleanName(name),color,ready:color===palette[0],connected:true,reconnectToken:'',joinedAt,state:null,item:'',lastItemHitAt:-Infinity,lastHitAt:{punch:-Infinity,kick:-Infinity},lastEmoteAt:-Infinity};
}

function cleanSettings(settings={}){const totalRiders=clamp(Math.floor(finite(settings.totalRiders,5)),2,5),aiCount=clamp(Math.floor(finite(settings.aiCount,3)),0,totalRiders-1);return {totalRiders,aiCount,humanSlots:totalRiders-aiCount};}

function cleanState(state,lastState){
  const previous=lastState||{};
  return {
    seq:Math.max(0,Math.floor(finite(state.seq,0))),
    x:clamp(finite(state.x,finite(previous.x,0)),-2500,2500),
    z:clamp(finite(state.z,finite(previous.z,0)),-2500,2500),
    heading:finite(state.heading,finite(previous.heading,0)),
    speed:clamp(finite(state.speed,finite(previous.speed,0)),0,24),
    energy:clamp(finite(state.energy,previous.energy??100),0,100),
    packs:clamp(Math.floor(finite(state.packs,previous.packs??2)),0,3),
    state:String(state.state||previous.state||'ride').slice(0,24),
    attackLeft:clamp(finite(state.attackLeft),0,4),
    attackSide:clamp(Math.sign(finite(state.attackSide)),-1,1),
    attackIsKick:!!state.attackIsKick,
    crashLeft:clamp(finite(state.crashLeft),0,5),
    protectionLeft:clamp(finite(state.protectionLeft),0,3),
    boostLeft:clamp(finite(state.boostLeft),0,4),
    slowLeft:clamp(finite(state.slowLeft),0,2),
    poopLeft:clamp(finite(state.poopLeft),0,2.5),
    netLeft:clamp(finite(state.netLeft),0,3),
    airLeft:clamp(finite(state.airLeft),0,3),
    airDuration:clamp(finite(state.airDuration),0,3),
    jumpHeight:clamp(finite(state.jumpHeight),0,6),
    distance:clamp(finite(state.distance,finite(previous.distance,0)),0,3600),
    checkpoints:clamp(Math.floor(finite(state.checkpoints,finite(previous.checkpoints,0))),0,99),
    elapsed:clamp(finite(state.elapsed,finite(previous.elapsed,0)),0,3600),
    finished:!!state.finished
  };
}

export class RoomRegistry {
  constructor({now=()=>Date.now(),codeFactory}={}){this.now=now;this.codeFactory=codeFactory||(()=>crypto.randomBytes(3).toString('hex').toUpperCase());this.rooms=new Map();}
  create(clientId,name,settings){let code;do code=this.codeFactory();while(this.rooms.has(code));const room={code,hostId:clientId,phase:'lobby',countdownAt:0,seed:crypto.randomBytes(4).readUInt32LE(0),...cleanSettings(settings),players:new Map(),claimedPickups:new Set(),botItemHits:new Map()};room.players.set(clientId,newPlayer(clientId,name,palette[0],this.now()));this.rooms.set(code,room);return room;}
  join(code,clientId,name){const room=this.rooms.get(String(code||'').toUpperCase());if(!room)throw new Error('房间不存在');if(room.phase!=='lobby')throw new Error('比赛已经开始');if(room.players.size>=room.humanSlots)throw new Error('真人席位已满');if(!room.players.has(clientId))room.players.set(clientId,newPlayer(clientId,name,palette[room.players.size],this.now()));return room;}
  attachSession(room,clientId,token){const player=room?.players.get(clientId);if(!player)throw new Error('玩家不在房间');player.reconnectToken=token;player.connected=true;return player;}
  disconnect(room,clientId){const player=room?.players.get(clientId);if(player)player.connected=false;return room;}
  resume(code,clientId,token){const room=this.rooms.get(String(code||'').toUpperCase()),player=room?.players.get(clientId);if(!player||!token||player.reconnectToken!==token)throw new Error('续赛凭证无效或已经过期');player.connected=true;return {room,player};}
  setReady(room,clientId,ready){const player=room?.players.get(clientId);if(!player)throw new Error('玩家不在房间');player.ready=!!ready;return room;}
  rematch(room,clientId){
    if(!room||room.hostId!==clientId)throw new Error('只有房主可以发起下一局');
    if(room.phase!=='results')throw new Error('当前比赛尚未结束');
    room.phase='lobby';room.countdownAt=0;room.seed=crypto.randomBytes(4).readUInt32LE(0);room.claimedPickups.clear();room.botItemHits.clear();
    for(const player of room.players.values()){player.ready=false;player.state=null;player.item='';player.lastItemHitAt=-Infinity;player.lastHitAt={punch:-Infinity,kick:-Infinity,bat:-Infinity,pistol:-Infinity};player.lastEmoteAt=-Infinity;}
    return room;
  }
  start(room,clientId){if(!room||room.hostId!==clientId)throw new Error('只有房主可以开始');if(room.players.size<room.humanSlots)throw new Error(`还需要 ${room.humanSlots-room.players.size} 名真人玩家`);if([...room.players.values()].some(player=>!player.ready||!player.connected))throw new Error('仍有玩家未准备或已断线');room.phase='countdown';room.countdownAt=this.now()+3000;room.seed=crypto.randomBytes(4).readUInt32LE(0);room.claimedPickups.clear();room.botItemHits.clear();for(const player of room.players.values()){player.state=null;player.item='';player.lastItemHitAt=-Infinity;player.lastHitAt={punch:-Infinity,kick:-Infinity,bat:-Infinity,pistol:-Infinity};player.lastEmoteAt=-Infinity;}return room;}
  setRacing(room){if(room?.phase==='countdown')room.phase='racing';return room;}
  updateState(room,clientId,state){
    const player=room?.players.get(clientId);
    if(!player||room.phase==='lobby'||!state)return {accepted:false,results:false};
    const next=cleanState(state,player.state);
    if(player.state&&next.seq<=player.state.seq)return {accepted:false,results:false};
    player.state=next;
    const results=room.phase==='racing'&&[...room.players.values()].every(item=>item.state?.finished);
    if(results)room.phase='results';
    return {accepted:true,results};
  }
  validateHit(room,attackerId,targetId,attack={}){
    if(!room||room.phase!=='racing'||attackerId===targetId)return null;
    const attacker=room.players.get(attackerId),target=room.players.get(targetId);
    if(!attacker?.state||!target?.state||attacker.state.finished||target.state.finished)return null;
    const isPistol=!!attack.pistol,isBat=!!attack.bat,kick=!!attack.kick;
    const type=isPistol?'pistol':isBat?'bat':kick?'kick':'punch';
    const cooldown=isPistol?5000:isBat?3200:kick?2200:1000,now=this.now();
    if(now-attacker.lastHitAt[type]<cooldown)return null;
    const heading=attacker.state.heading,fx=Math.sin(heading),fz=Math.cos(heading),dx=target.state.x-attacker.state.x,dz=target.state.z-attacker.state.z;
    const lateral=dx*fz-dz*fx,longitudinal=dx*fx+dz*fz,side=Math.sign(finite(attack.side));
    const maxLat=isPistol?4.0:isBat?2.6:kick?1.6:1.35;
    const maxLong=isPistol?14.0:1.8;
    if(!isPistol&&!isBat&&(!side||Math.sign(lateral)!==side))return null;
    if(isPistol&&longitudinal<=0.2)return null;
    if(Math.abs(lateral)>maxLat||Math.abs(longitudinal)>maxLong)return null;
    attacker.lastHitAt[type]=now;
    const result={kick,side:side||1,damage:isPistol?22:isBat?18:kick?13:7};
    if(isBat)result.bat=true;
    if(isPistol)result.pistol=true;
    return result;
  }
  validateEmote(room,playerId,emote){const player=room?.players.get(playerId),allowed=new Set(['happy','taunt','panic','angry']),now=this.now();if(!player||room.phase!=='racing'||!allowed.has(emote)||now-player.lastEmoteAt<1200)return null;player.lastEmoteAt=now;return {playerId,emote};}
  claimPickup(room,pickupId){if(!room||room.claimedPickups.has(pickupId))return false;room.claimedPickups.add(pickupId);return true;}
  claimItem(room,playerId,boxId,item){const player=room?.players.get(playerId),allowed=new Set(['grenade','poop','net']);if(!player||room.phase!=='racing'||player.item||!/^item-\d+$/.test(String(boxId))||!allowed.has(item)||room.claimedPickups.has(boxId))return null;room.claimedPickups.add(boxId);player.item=item;return {boxId,playerId,item};}
  useItem(room,attackerId,targetId,item){const attacker=room?.players.get(attackerId),target=room?.players.get(targetId),bot=/^bot-\d+$/.test(String(targetId)),allowed=new Set(['grenade','poop','net']),now=this.now();if(!attacker||(!target&&!bot)||attackerId===targetId||room.phase!=='racing'||!allowed.has(item)||attacker.item!==item||attacker.state?.finished)return null;if(target&&(target.state?.finished||target.state?.crashLeft>0||target.state?.protectionLeft>0||now-target.lastItemHitAt<1000))return null;if(bot&&now-(room.botItemHits.get(targetId)??-Infinity)<1000)return null;attacker.item='';if(target)target.lastItemHitAt=now;else room.botItemHits.set(targetId,now);return {attackerId,targetId,item,duration:item==='grenade'?1.5:item==='poop'?2.5:3};}
  leave(room,clientId){if(!room)return null;room.players.delete(clientId);if(!room.players.size){this.rooms.delete(room.code);return null;}if(room.hostId===clientId)room.hostId=[...room.players.values()].sort((a,b)=>a.joinedAt-b.joinedAt)[0].id;if(room.phase==='racing'&&[...room.players.values()].every(player=>player.state?.finished))room.phase='results';return room;}
  snapshot(room){const players=[...room.players.values()];const results=room.phase==='results'?players.map(player=>({id:player.id,name:player.name,color:player.color,elapsed:player.state?.elapsed??Infinity})).sort((a,b)=>a.elapsed-b.elapsed).map((result,index)=>({...result,rank:index+1})):[];return {code:room.code,hostId:room.hostId,phase:room.phase,countdownAt:room.countdownAt,seed:room.seed,totalRiders:room.totalRiders,aiCount:room.aiCount,humanSlots:room.humanSlots,players:players.map(({id,name,color,ready,connected,joinedAt})=>({id,name,color,ready,connected,joinedAt})),results};}
}

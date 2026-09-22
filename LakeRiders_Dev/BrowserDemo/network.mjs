export function websocketUrl(locationLike=location){return (locationLike.protocol==='https:'?'wss:':'ws:')+'//'+locationLike.host+'/ws';}
export function latencyGrade(ms){return ms<80?'顺畅':ms<160?'可玩':ms<260?'偏高':'较差';}
export function inviteUrl(code,locationLike=location){const url=new URL(locationLike.href);url.search='';url.hash='';url.searchParams.set('room',String(code||'').trim().toUpperCase());return url.href;}
export function invitedRoom(locationLike=location){return (new URL(locationLike.href).searchParams.get('room')||'').trim().toUpperCase().slice(0,6);}

export class MultiplayerClient extends EventTarget {
  constructor({socketFactory=url=>new WebSocket(url),url}={}){super();this.socketFactory=socketFactory;this.url=url;this.socket=null;this.playerId='';this.connectionId='';this.reconnectToken='';this.room=null;this.sequence=0;this.latency=0;this.pingTimer=0;this.lastName='';this.reconnectAttempts=0;}
  connect(){
    if(this.socket?.readyState===1)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const socket=this.socket=this.socketFactory(this.url||websocketUrl());
      socket.addEventListener('open',()=>{this.reconnectAttempts=0;clearInterval(this.pingTimer);this.pingTimer=setInterval(()=>this.ping(),3000);this.dispatchEvent(new CustomEvent('connection',{detail:{connected:true}}));resolve();},{once:true});
      socket.addEventListener('error',()=>reject(new Error('无法连接联机房间服务')),{once:true});
      socket.addEventListener('close',()=>{clearInterval(this.pingTimer);this.dispatchEvent(new CustomEvent('connection',{detail:{connected:false}}));this.dispatchEvent(new CustomEvent('disconnected'));const session=this.room&&this.reconnectToken?{code:this.room.code,playerId:this.playerId,reconnectToken:this.reconnectToken}:null;if(session&&this.reconnectAttempts<3){const delay=1000*2**this.reconnectAttempts++;setTimeout(()=>this.connect().then(()=>this.send('resume',session)).catch(()=>{}),delay);}});
      socket.addEventListener('message',event=>{try{const message=JSON.parse(event.data);if(message.type==='connected')this.connectionId=message.playerId;if(['welcome','resumed'].includes(message.type)){this.playerId=message.playerId;this.reconnectToken=message.reconnectToken||this.reconnectToken;}if(['room','resumed'].includes(message.type)&&message.room)this.room=message.room;if(message.type==='pong'){this.latency=Math.max(0,Date.now()-message.clientAt);this.dispatchEvent(new CustomEvent('latency',{detail:{ms:this.latency,grade:latencyGrade(this.latency)}}));}this.dispatchEvent(new CustomEvent(message.type,{detail:message}));}catch{this.dispatchEvent(new CustomEvent('error',{detail:{message:'收到无法识别的联机消息'}}));}});
    });
  }
  send(type,data={}){if(this.socket?.readyState!==1)throw new Error('联机服务尚未连接');this.socket.send(JSON.stringify({type,...data}));}
  create(name,settings){this.lastName=name;this.send('create',{name,settings});}
  join(code,name){this.lastName=name;this.send('join',{code:String(code||'').trim().toUpperCase(),name});}
  ping(){if(this.socket?.readyState===1)this.send('ping',{clientAt:Date.now()});}
  ready(value){this.send('ready',{ready:value});}
  rematch(){this.send('rematch');}
  start(){this.send('start');}
  state(state){this.send('state',{state:{...state,seq:++this.sequence}});}
  hit(targetId,attack){this.send('hit',{targetId,attack});}
  pickup(pickupId){this.send('pickup',{pickupId});}
  itemPickup(boxId,item){this.send('item-pickup',{boxId,item});}
  itemUse(targetId,item){this.send('item-use',{targetId,item});}
  emote(emote){this.send('emote',{emote});}
  leave(){if(this.socket?.readyState===1)this.send('leave');this.room=null;this.reconnectToken='';}
}

import crypto from 'node:crypto';

export function acceptWebSocket(req,socket){
  const key=req.headers['sec-websocket-key'];if(!key)throw new Error('Missing websocket key');
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  return new WebSocketPeer(socket);
}

function frame(payload,opcode=1){
  const body=Buffer.isBuffer(payload)?payload:Buffer.from(String(payload));let head;
  if(body.length<126){head=Buffer.alloc(2);head[1]=body.length;}
  else if(body.length<65536){head=Buffer.alloc(4);head[1]=126;head.writeUInt16BE(body.length,2);}
  else{head=Buffer.alloc(10);head[1]=127;head.writeBigUInt64BE(BigInt(body.length),2);}
  head[0]=0x80|opcode;return Buffer.concat([head,body]);
}

export class WebSocketPeer {
  constructor(socket){this.socket=socket;this.buffer=Buffer.alloc(0);this.closed=false;this.isAlive=true;this.onMessage=()=>{};this.onClose=()=>{};socket.on('data',chunk=>this.read(chunk));socket.on('close',()=>this.close());socket.on('error',()=>this.close());}
  send(value){if(!this.closed)this.socket.write(frame(JSON.stringify(value)));}
  ping(){if(!this.closed){this.isAlive=false;this.socket.write(frame('',9));}}
  read(chunk){this.buffer=Buffer.concat([this.buffer,chunk]);while(this.buffer.length>=2){const first=this.buffer[0],second=this.buffer[1],opcode=first&15,masked=!!(second&128);let length=second&127,offset=2;if(length===126){if(this.buffer.length<4)return;length=this.buffer.readUInt16BE(2);offset=4;}else if(length===127){if(this.buffer.length<10)return;const big=this.buffer.readBigUInt64BE(2);if(big>16384n){this.close();return;}length=Number(big);offset=10;}if(!masked||length>16384){this.close();return;}if(this.buffer.length<offset+4+length)return;const mask=this.buffer.subarray(offset,offset+4),payload=Buffer.from(this.buffer.subarray(offset+4,offset+4+length));this.buffer=this.buffer.subarray(offset+4+length);for(let i=0;i<payload.length;i++)payload[i]^=mask[i%4];if(opcode===8){this.close();return;}if(opcode===9){if(!this.closed)this.socket.write(frame(payload,10));continue;}if(opcode===10){this.isAlive=true;continue;}if(opcode!==1)continue;try{this.onMessage(JSON.parse(payload.toString('utf8')));}catch{this.send({type:'error',message:'消息格式错误'});}}}
  close(){if(this.closed)return;this.closed=true;try{this.socket.destroy();}catch{}this.onClose();}
}

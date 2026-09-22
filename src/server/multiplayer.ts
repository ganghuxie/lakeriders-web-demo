import http from 'node:http';
import crypto from 'node:crypto';
import { RoomRegistry } from '../../LakeRiders_Dev/tools/room-registry.mjs';
import { acceptWebSocket } from '../../LakeRiders_Dev/tools/websocket.mjs';

export function setupMultiplayerServer(server: http.Server) {
  const registry = new RoomRegistry();
  const peers = new Set<any>();
  const reservations = new Map<string, NodeJS.Timeout>();
  const maxPeers = 50;

  function roomPeers(room: any) {
    return [...peers].filter(peer => peer.room === room);
  }

  function broadcast(room: any, message: any, exclude: any = null) {
    for (const peer of roomPeers(room)) {
      if (peer !== exclude) peer.send(message);
    }
  }

  function sendRoom(room: any) {
    broadcast(room, { type: 'room', room: registry.snapshot(room) });
  }

  const reservationKey = (room: any, id: string) => room.code + ':' + id;

  function leave(peer: any) {
    const room = peer.room;
    if (!room) return;
    peer.room = null;
    const key = reservationKey(room, peer.id);
    const timer = reservations.get(key);
    if (timer) clearTimeout(timer);
    reservations.delete(key);
    const remaining = registry.leave(room, peer.id);
    if (remaining) sendRoom(remaining);
  }

  function reserve(peer: any) {
    const room = peer.room;
    if (!room) return;
    peer.room = null;
    registry.disconnect(room, peer.id);
    sendRoom(room);
    const key = reservationKey(room, peer.id);
    const timer = setTimeout(() => {
      reservations.delete(key);
      const remaining = registry.leave(room, peer.id);
      if (remaining) sendRoom(remaining);
    }, 20000);
    reservations.set(key, timer);
  }

  function join(peer: any, room: any) {
    leave(peer);
    peer.room = room;
    peer.reconnectToken = crypto.randomBytes(24).toString('base64url');
    registry.attachSession(room, peer.id, peer.reconnectToken);
    peer.send({ type: 'welcome', playerId: peer.id, reconnectToken: peer.reconnectToken, roomCode: room.code });
    sendRoom(room);
  }

  function handle(peer: any, message: any) {
    try {
      if (message.type === 'create') {
        join(peer, registry.create(peer.id, message.name, message.settings));
        return;
      }
      if (message.type === 'join') {
        join(peer, registry.join(message.code, peer.id, message.name));
        return;
      }
      if (message.type === 'resume') {
        const result = registry.resume(message.code, message.playerId, message.reconnectToken);
        const key = reservationKey(result.room, message.playerId);
        const timer = reservations.get(key);
        if (timer) clearTimeout(timer);
        reservations.delete(key);
        peer.id = message.playerId;
        peer.room = result.room;
        peer.reconnectToken = message.reconnectToken;
        peer.send({
          type: 'resumed',
          playerId: peer.id,
          reconnectToken: peer.reconnectToken,
          room: registry.snapshot(result.room),
          state: result.player.state,
          item: result.player.item
        });
        sendRoom(result.room);
        return;
      }
      if (message.type === 'ping') {
        peer.send({ type: 'pong', clientAt: Number(message.clientAt) || 0, serverAt: Date.now() });
        return;
      }
      if (message.type === 'leave') {
        leave(peer);
        return;
      }

      const room = peer.room;
      if (!room) throw new Error('请先创建或加入房间');

      if (message.type === 'ready') {
        registry.setReady(room, peer.id, message.ready);
        sendRoom(room);
        return;
      }
      if (message.type === 'rematch') {
        registry.rematch(room, peer.id);
        sendRoom(room);
        return;
      }
      if (message.type === 'start') {
        registry.start(room, peer.id);
        sendRoom(room);
        const code = room.code;
        setTimeout(() => {
          const active = registry.rooms.get(code);
          if (active === room) {
            registry.setRacing(room);
            sendRoom(room);
          }
        }, 3000);
        return;
      }
      if (message.type === 'state') {
        const result = registry.updateState(room, peer.id, message.state);
        if (result.accepted) {
          broadcast(room, { type: 'peer-state', playerId: peer.id, state: room.players.get(peer.id).state }, peer);
        }
        if (result.results) sendRoom(room);
        return;
      }
      if (message.type === 'hit') {
        const attack = registry.validateHit(room, peer.id, message.targetId, message.attack);
        const target = roomPeers(room).find(item => item.id === message.targetId);
        if (attack && target) target.send({ type: 'hit', attackerId: peer.id, attack });
        return;
      }
      if (message.type === 'emote') {
        const result = registry.validateEmote(room, peer.id, message.emote);
        if (result) broadcast(room, { type: 'emote', ...result });
        return;
      }
      if (message.type === 'pickup' && registry.claimPickup(room, message.pickupId)) {
        broadcast(room, { type: 'pickup', pickupId: message.pickupId, playerId: peer.id });
        return;
      }
      if (message.type === 'item-pickup') {
        const result = registry.claimItem(room, peer.id, message.boxId, message.item);
        if (result) broadcast(room, { type: 'item-pickup', ...result });
        return;
      }
      if (message.type === 'item-use') {
        const result = registry.useItem(room, peer.id, message.targetId, message.item);
        if (result) broadcast(room, { type: 'item-hit', ...result });
        else peer.send({ type: 'item-miss', targetId: String(message.targetId || ''), item: String(message.item || '') });
        return;
      }
    } catch (error: any) {
      peer.send({ type: 'error', message: error.message });
    }
  }

  server.on('upgrade', (req, socket) => {
    let urlPath = '';
    try {
      urlPath = new URL(req.url || '', 'http://localhost').pathname;
    } catch {
      socket.destroy();
      return;
    }

    if (urlPath !== '/ws') {
      return;
    }

    if (peers.size >= maxPeers) {
      socket.destroy();
      return;
    }

    try {
      const peer: any = acceptWebSocket(req, socket);
      peer.id = crypto.randomUUID();
      peer.room = null;
      peer.windowAt = Date.now();
      peer.messageCount = 0;
      peers.add(peer);

      peer.onMessage = (message: any) => {
        const now = Date.now();
        if (now - peer.windowAt >= 1000) {
          peer.windowAt = now;
          peer.messageCount = 0;
        }
        if (++peer.messageCount > 60) {
          peer.close();
          return;
        }
        handle(peer, message);
      };

      peer.onClose = () => {
        peers.delete(peer);
        reserve(peer);
      };

      peer.send({ type: 'connected', playerId: peer.id });
    } catch {
      socket.destroy();
    }
  });

  const heartbeat = setInterval(() => {
    for (const peer of peers) {
      if (!peer.isAlive) peer.close();
      else peer.ping();
    }
  }, 20000);
  heartbeat.unref();

  return {
    registry,
    peers
  };
}

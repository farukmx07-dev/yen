const { WebSocketServer } = require('ws');
const { parse } = require('url');

const ADMIN_ROOM = 'admin';
const LOG_ROOM_PREFIX = 'log:';

function safeSend(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function createWsHub() {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set();

  function handleConnection(ws, req) {
    ws.isAlive = true;
    ws.role = null;
    ws.rooms = new Set();
    ws.logId = null;
    ws.adminId = null;

    clients.add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      handleMessage(ws, msg);
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });

    safeSend(ws, { type: 'connected', ts: Date.now() });
  }

  function joinRoom(ws, room) {
    ws.rooms.add(room);
  }

  function leaveRoom(ws, room) {
    ws.rooms.delete(room);
  }

  function handleMessage(ws, msg) {
    const { type, payload } = msg || {};

    switch (type) {
      case 'auth:admin': {
        ws.role = 'admin';
        ws.adminId = payload?.adminId || null;
        joinRoom(ws, ADMIN_ROOM);
        safeSend(ws, { type: 'auth:ok', role: 'admin' });
        break;
      }

      case 'auth:visitor': {
        ws.role = 'visitor';
        ws.logId = payload?.logId || null;
        if (ws.logId) joinRoom(ws, `${LOG_ROOM_PREFIX}${ws.logId}`);
        safeSend(ws, { type: 'auth:ok', role: 'visitor' });
        break;
      }

      case 'subscribe:log': {
        if (payload?.logId) {
          ws.logId = payload.logId;
          joinRoom(ws, `${LOG_ROOM_PREFIX}${payload.logId}`);
          safeSend(ws, { type: 'subscribed', logId: payload.logId });
        }
        break;
      }

      case 'ping': {
        safeSend(ws, { type: 'pong', ts: Date.now() });
        break;
      }

      default:
        break;
    }
  }

  function broadcastToRoom(room, message, excludeWs = null) {
    for (const ws of clients) {
      if (ws === excludeWs) continue;
      if (!ws.rooms.has(room)) continue;
      safeSend(ws, message);
    }
  }

  function broadcastAdmin(message) {
    broadcastToRoom(ADMIN_ROOM, message);
  }

  function broadcastLog(logId, message) {
    broadcastToRoom(`${LOG_ROOM_PREFIX}${logId}`, message);
  }

  function broadcastAll(message) {
    for (const ws of clients) {
      safeSend(ws, message);
    }
  }

  function hasAdminClients() {
    for (const ws of clients) {
      if (ws.rooms.has(ADMIN_ROOM)) return true;
    }
    return false;
  }

  function handleUpgrade(server, nextUpgradeHandler) {
    server.on('upgrade', (req, socket, head) => {
      const { pathname } = parse(req.url || '', true);
      if (pathname === '/ws') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
        return;
      }

      if (typeof nextUpgradeHandler === 'function') {
        void nextUpgradeHandler(req, socket, head);
      }
    });

    wss.on('connection', (ws, req) => {
      handleConnection(ws, req);
    });
  }

  const heartbeat = setInterval(() => {
    for (const ws of clients) {
      if (!ws.isAlive) {
        ws.terminate();
        clients.delete(ws);
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30_000);

  heartbeat.unref?.();

  return {
    wss,
    handleUpgrade,
    broadcastAdmin,
    broadcastLog,
    broadcastAll,
    hasAdminClients,
    clientCount: () => clients.size,
  };
}

let hubInstance = null;

function getWsHub() {
  return hubInstance;
}

function setWsHub(hub) {
  hubInstance = hub;
}

module.exports = { createWsHub, getWsHub, setWsHub, WebSocketServer };

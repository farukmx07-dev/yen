function isBenignConnectionError(err) {
  if (!err) return false;
  if (isBenignServerActionError(err)) return true;
  if (typeof err !== 'object') {
    return String(err).toLowerCase().includes('aborted');
  }
  const code = err.code;
  const msg = String(err.message || '').toLowerCase();
  return (
    code === 'ECONNRESET' ||
    code === 'ECONNABORTED' ||
    code === 'EPIPE' ||
    code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    code === 'HPE_INVALID_EOF_STATE' ||
    code === 'HPE_INVALID_CONSTANT' ||
    code === 'HPE_CLOSED_CONNECTION' ||
    msg === 'aborted' ||
    msg.includes('aborted') ||
    msg.includes('parse error') ||
    msg.includes('invalid eof')
  );
}

function isBenignServerActionError(err) {
  const msg = String((err && err.message) || err || '');
  return (
    msg.includes('Failed to find Server Action') ||
    msg.includes("reading 'workers'") ||
    msg.includes('older or newer deployment')
  );
}

function isServerActionRequest(req) {
  if (!req || req.method !== 'POST') return false;
  const url = String(req.url || '').split('?')[0];
  if (url.startsWith('/_next/')) return false;
  return Boolean(req.headers['next-action']);
}

function replyStaleServerAction(res) {
  if (!res || res.headersSent || res.writableEnded) return;
  res.statusCode = 409;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: 'Sayfa güncellendi, lütfen yenileyin.' }));
}
let installed = false;

function setupBenignConnectionHandlers() {
  if (installed) return;
  installed = true;

  process.on('uncaughtException', (err) => {
    if (isBenignConnectionError(err)) return;
    console.error('Uncaught exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    if (isBenignConnectionError(reason)) return;
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });
}

function attachHttpServerGuards(server) {
  server.on('clientError', (err, socket) => {
    if (!isBenignConnectionError(err)) {
      console.error('HTTP client error:', err);
    }
    if (socket && !socket.destroyed) {
      socket.destroy();
    }
  });
}

function isClientGone(req, res) {
  return (
    req.aborted ||
    req.destroyed ||
    res.destroyed ||
    res.writableEnded ||
    res.headersSent
  );
}

module.exports = {
  isBenignConnectionError,
  isBenignServerActionError,
  isServerActionRequest,
  replyStaleServerAction,
  setupBenignConnectionHandlers,
  attachHttpServerGuards,
  isClientGone,
};

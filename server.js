const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const { readFileSync, existsSync } = require('fs');
const { parse } = require('url');
const path = require('path');
const next = require('next');
const {
  setupBenignConnectionHandlers,
  attachHttpServerGuards,
  isBenignConnectionError,
  isBenignServerActionError,
  isServerActionRequest,
  replyStaleServerAction,
  isClientGone,
} = require('./scripts/server-guards');
const { createWsHub, setWsHub } = require('./lib/ws/hub');
const { startAdminLiveSync } = require('./scripts/admin-live-sync');
const { startLogCleanupScheduler } = require('./scripts/log-cleanup-scheduler');

setupBenignConnectionHandlers();

const isProd = process.env.NODE_ENV === 'production';
const preferredPort = parseInt(process.env.PORT || '3000', 10);
const bindHost = process.env.BIND_HOST || (isProd ? '0.0.0.0' : process.env.HOSTNAME || '127.0.0.1');
const allowPortFallback =
  process.env.PORT_FALLBACK === '1' ||
  process.env.PORT_FALLBACK === 'true' ||
  !isProd;
const appDir = process.env.NEXT_APP_DIR || process.cwd();

process.chdir(appDir);

function loadStandaloneConfig() {
  const configPath = path.join(appDir, '.next', 'required-server-files.json');
  if (!existsSync(configPath)) {
    throw new Error(`Standalone config bulunamadi: ${configPath}`);
  }
  const requiredServerFiles = JSON.parse(readFileSync(configPath, 'utf8'));
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(requiredServerFiles.config);
}

if (isProd) {
  loadStandaloneConfig();
}

const app = next({
  dev: !isProd,
  dir: appDir,
  minimalMode: isProd,
});

const handle = app.getRequestHandler();

function loadTlsOptions() {
  const keyPath = process.env.WS_SSL_KEY || process.env.SSL_KEY;
  const certPath = process.env.WS_SSL_CERT || process.env.SSL_CERT;
  if (!keyPath || !certPath) return null;

  try {
    return {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    };
  } catch (err) {
    console.warn('[server] TLS sertifikalari okunamadi, ws:// kullanilacak:', err.message);
    return null;
  }
}

function startHttpServer() {
  const requestHandler = async (req, res) => {
    if (isClientGone(req, res)) return;

    if (isServerActionRequest(req)) {
      replyStaleServerAction(res);
      return;
    }

    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      if (isBenignServerActionError(err)) {
        replyStaleServerAction(res);
        return;
      }
      if (isBenignConnectionError(err) || isClientGone(req, res)) return;
      console.error('[server] Request error', req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('internal server error');
      }
    }
  };

  const tlsOptions = loadTlsOptions();
  const server = tlsOptions
    ? createHttpsServer(tlsOptions, requestHandler)
    : createServer(requestHandler);

  const wsHub = createWsHub();
  const nextUpgradeHandler =
    typeof app.upgradeHandler === 'function' ? app.upgradeHandler.bind(app) : null;
  wsHub.handleUpgrade(server, nextUpgradeHandler);

  setWsHub(wsHub);
  global.__wsHub = wsHub;

  attachHttpServerGuards(server);

  const startListening = async () => {
    let listenPort = preferredPort;
    if (allowPortFallback) {
      try {
        const { findAvailablePort } = require('./scripts/find-available-port');
        listenPort = await findAvailablePort(preferredPort, bindHost);
        if (listenPort !== preferredPort) {
          console.warn(`[server] Port ${preferredPort} dolu, ${listenPort} kullaniliyor`);
        }
      } catch (err) {
        console.error('[server] Uygun port bulunamadi:', err.message);
        process.exit(1);
      }
    }

    process.env.PORT = String(listenPort);

    server.listen(listenPort, bindHost, (err) => {
      if (err) {
        console.error('[server] Listen failed:', err);
        process.exit(1);
      }
      const protocol = tlsOptions ? 'https/wss' : 'http/ws';
      console.log(`> Ready on ${protocol}://${bindHost}:${listenPort}`);
      console.log(`> WebSocket: ${tlsOptions ? 'wss' : 'ws'}://${bindHost}:${listenPort}/ws`);
      console.log(`> Mode: ${isProd ? 'standalone' : 'development'}`);
      startAdminLiveSync();
      startLogCleanupScheduler();
    });
  };

  void startListening();
}

console.log('[server] Next.js hazirlaniyor...');

app
  .prepare()
  .then(startHttpServer)
  .catch((err) => {
    console.error('[server] Baslatma hatasi:', err);
    process.exit(1);
  });

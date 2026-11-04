const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findAvailablePort } = require('./find-available-port');

const projectRoot = path.join(__dirname, '..');
const nextDir = path.join(projectRoot, '.next');
const preferredPort = Number(process.env.PORT || 3000);
const bindHost = process.env.HOSTNAME || '127.0.0.1';

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy wait
  }
}

function removeNextDir(dir) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      }
      return true;
    } catch (error) {
      if (attempt === 4) throw error;
      sleep(500);
    }
  }
  return false;
}

async function main() {
  process.env.NODE_ENV = 'development';

  const port = await findAvailablePort(preferredPort, bindHost);
  if (port !== preferredPort) {
    console.log(`[dev] Port ${preferredPort} dolu, ${port} kullaniliyor`);
  }
  process.env.PORT = String(port);

  if (!process.argv.includes('--no-clean') && fs.existsSync(nextDir)) {
    try {
      removeNextDir(nextDir);
      console.log('[dev] .next cache cleared');
    } catch (error) {
      console.warn('[dev] Could not clear .next cache:', error.message);
    }
  }

  console.log(`[dev] Starting on http://${bindHost}:${port}`);

  require('../scripts/server-guards').setupBenignConnectionHandlers();

  const serverPath = path.join(projectRoot, 'server.js');
  const child = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    env: process.env,
    cwd: projectRoot,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[dev] Baslatma hatasi:', err);
  process.exit(1);
});

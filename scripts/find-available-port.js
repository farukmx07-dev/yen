const net = require('net');

function isPortAvailable(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function findAvailablePort(startPort, host = '0.0.0.0', maxAttempts = 20) {
  const base = Number(startPort) || 3000;
  for (let i = 0; i < maxAttempts; i += 1) {
    const port = base + i;
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  throw new Error(`Uygun port bulunamadi: ${base}-${base + maxAttempts - 1}`);
}

module.exports = { findAvailablePort, isPortAvailable };

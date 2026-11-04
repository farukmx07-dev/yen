const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const serverPath = path.join(projectRoot, 'server.js');

if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
  console.error('');
  console.error('Production build bulunamadi.');
  console.error('Once su komutu calistirin:');
  console.error('');
  console.error('  npm run build');
  console.error('');
  process.exit(1);
}

if (!fs.existsSync(serverPath)) {
  console.error('Custom server.js bulunamadi.');
  process.exit(1);
}

process.env.NODE_ENV = 'production';
process.env.NEXT_APP_DIR = standaloneDir;

if (!process.env.HOSTNAME) {
  process.env.HOSTNAME = '127.0.0.1';
}

const child = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  env: process.env,
  cwd: projectRoot,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

'use strict';

process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const serverPath = path.join(rootDir, 'server.js');

if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
  console.error('');
  console.error('Production build bulunamadi.');
  console.error('Once su komutu calistirin:');
  console.error('');
  console.error('  npm run build');
  console.error('');
  process.exit(1);
}

if (!process.env.HOSTNAME) {
  process.env.HOSTNAME = '127.0.0.1';
}

process.env.NEXT_APP_DIR = standaloneDir;
require(serverPath);

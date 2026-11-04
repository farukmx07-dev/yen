#!/usr/bin/env node
'use strict';

const net = require('net');

const host = process.env.MYSQL_HOST || 'mysql';
const port = Number(process.env.MYSQL_PORT || 3306);
const maxAttempts = Number(process.env.MYSQL_WAIT_ATTEMPTS || 60);
const delayMs = Number(process.env.MYSQL_WAIT_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function probePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(5000);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

async function probeAuth() {
  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch (err) {
    console.warn('[entrypoint] mysql2 yuklenemedi, sadece port kontrolu yapildi:', err.message);
    return;
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'market',
    connectTimeout: 10_000,
  });
  await conn.ping();
  await conn.end();
  console.log(`[entrypoint] MySQL auth OK (${host}:${port}/${process.env.MYSQL_DATABASE || 'market'})`);
}

async function main() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await probePort();
      console.log(`[entrypoint] MySQL portu hazir (${host}:${port})`);
      try {
        await probeAuth();
      } catch (err) {
        console.error('[entrypoint] MySQL auth hatasi:', err.message || err);
        console.error('[entrypoint] MYSQL_HOST/USER/PASSWORD/DATABASE kontrol et');
        process.exit(1);
      }
      return;
    } catch (err) {
      console.log(
        `[entrypoint] MySQL bekleniyor (${attempt}/${maxAttempts}) — ${err.message || err}`
      );
      await sleep(delayMs);
    }
  }

  console.error('[entrypoint] MySQL baglantisi zaman asimina ugradi');
  process.exit(1);
}

main();

#!/usr/bin/env node
/**
 * Site nabız / yük testi — 30+ eşzamanlı ziyaretçi + checkout funnel simülasyonu.
 *
 * Kullanım:
 *   node scripts/load-test-online.js
 *   node scripts/load-test-online.js --preset 100
 *   node scripts/load-test-online.js --suite
 *   node scripts/load-test-online.js --tiers 35,60,100,150
 *
 * Önce sunucuyu çalıştır: npm run dev  veya  npm start
 */

const { randomUUID } = require('crypto');

const PAGE_TYPES = [
  { pageType: 'homepage', weight: 40 },
  { pageType: 'productDetail', weight: 30 },
  { pageType: 'cart', weight: 20 },
  { pageType: 'campaign', weight: 10 },
];

const CHECKOUT_STAGES = [
  {
    path: '/checkout',
    pageType: 'address',
    status: 'Adres Ekranında',
    weight: 22,
    needsLogId: false,
  },
  {
    path: '/checkout/payment',
    pageType: 'payment',
    status: 'Ödeme Sayfasında',
    weight: 28,
    needsLogId: true,
  },
  {
    path: '/checkout/waiting',
    pageType: 'waiting',
    status: '3D Secure Bekliyor',
    weight: 20,
    needsLogId: true,
  },
  {
    path: '/checkout/processing',
    pageType: 'processing',
    status: 'Bekliyor',
    weight: 18,
    needsLogId: true,
  },
  {
    path: '/checkout/success',
    pageType: 'processing',
    status: 'Başarılı',
    weight: 12,
    needsLogId: true,
  },
];

const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15',
];

const VISITOR_HEARTBEAT_MS = 12_000;
const SETTINGS_POLL_MS = 30_000;
const ADMIN_LIVE_POLL_MS = 3_000;
const CHECKOUT_REDIRECT_POLL_MS = 1_500;
const CHECKOUT_STATUS_POLL_MS = 5_000;

const REALISTIC_PERSONAS = [
  { mode: 'browse', pageType: 'homepage' },
  { mode: 'browse', pageType: 'productDetail' },
  { mode: 'browse', pageType: 'cart' },
  { mode: 'browse', pageType: 'campaign' },
  { mode: 'checkout', stageIndex: 0 },
  { mode: 'checkout', stageIndex: 0 },
  { mode: 'checkout', stageIndex: 1 },
  { mode: 'checkout', stageIndex: 1 },
  { mode: 'checkout', stageIndex: 2 },
  { mode: 'checkout', stageIndex: 3 },
];

const LOAD_PRESETS = {
  light: { users: 35, duration: 45, checkoutRatio: 0.35, admin: false, spread: true },
  medium: { users: 60, duration: 60, checkoutRatio: 0.4, admin: true, spread: true },
  heavy: { users: 100, duration: 90, checkoutRatio: 0.45, admin: true, spread: true },
  stress: { users: 150, duration: 120, checkoutRatio: 0.5, admin: true, spread: true },
  35: { users: 35, duration: 60, checkoutRatio: 0.35, admin: false, spread: true },
  60: { users: 60, duration: 60, checkoutRatio: 0.4, admin: true, spread: true },
  100: { users: 100, duration: 90, checkoutRatio: 0.45, admin: true, spread: true },
};

const DEFAULT_SUITE_TIERS = [35, 60, 100];

let acquirePageSlot = createPageGate(4);

function setPageConcurrency(users) {
  const limit = Math.min(24, Math.max(8, Math.ceil(users / 5)));
  acquirePageSlot = createPageGate(limit);
}

function createPageGate(maxConcurrent) {
  let active = 0;
  const queue = [];

  const pump = () => {
    while (active < maxConcurrent && queue.length > 0) {
      const { resolve } = queue.shift();
      active += 1;
      resolve(() => {
        active -= 1;
        pump();
      });
    }
  };

  return () =>
    new Promise((resolve) => {
      queue.push({ resolve });
      pump();
    });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyPreset(opts, presetName) {
  const preset = LOAD_PRESETS[presetName];
  if (!preset) {
    const available = Object.keys(LOAD_PRESETS).join(', ');
    console.error(`Bilinmeyen preset: ${presetName}\nMevcut: ${available}`);
    process.exit(1);
  }
  return { ...opts, ...preset };
}

function buildTierOpts(baseOpts, users) {
  const preset = LOAD_PRESETS[String(users)];
  if (preset) {
    return applyPreset({ ...baseOpts, users }, String(users));
  }
  return {
    ...baseOpts,
    users,
    duration: Math.max(60, Math.round(45 + users * 0.45)),
    checkoutRatio: Math.min(0.5, 0.3 + users / 500),
    admin: users >= 60 ? true : baseOpts.admin,
    spread: true,
  };
}

function parseArgs(argv) {
  const opts = {
    url: process.env.LOAD_TEST_URL || 'http://localhost:3000',
    users: 35,
    duration: 60,
    admin: false,
    checkoutRatio: 0.35,
    spread: false,
    warmup: true,
    verbose: false,
    suite: false,
    tiers: null,
    cooldown: 8,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) {
      opts.url = argv[++i].replace(/\/$/, '');
    } else if (arg === '--users' && argv[i + 1]) {
      opts.users = Math.max(1, Number(argv[++i]) || 35);
    } else if (arg === '--duration' && argv[i + 1]) {
      opts.duration = Math.max(10, Number(argv[++i]) || 60);
    } else if (arg === '--checkout-ratio' && argv[i + 1]) {
      opts.checkoutRatio = Math.min(1, Math.max(0, Number(argv[++i]) || 0.35));
    } else if (arg === '--preset' && argv[i + 1]) {
      Object.assign(opts, applyPreset(opts, argv[++i]));
    } else if (arg === '--tiers' && argv[i + 1]) {
      opts.tiers = argv[++i]
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      opts.suite = true;
    } else if (arg === '--suite') {
      opts.suite = true;
    } else if (arg === '--cooldown' && argv[i + 1]) {
      opts.cooldown = Math.max(0, Number(argv[++i]) || 8);
    } else if (arg === '--admin') {
      opts.admin = true;
    } else if (arg === '--spread') {
      opts.spread = true;
    } else if (arg === '--no-spread') {
      opts.spread = false;
    } else if (arg === '--no-warmup') {
      opts.warmup = false;
    } else if (arg === '--verbose' || arg === '-v') {
      opts.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Site nabiz testi — eszamanli ziyaretci + checkout funnel

  node scripts/load-test-online.js [secenekler]

Tek tur:
  node scripts/load-test-online.js --users 60
  node scripts/load-test-online.js --preset 100
  node scripts/load-test-online.js --preset heavy

Coklu tur (35 -> 60 -> 100):
  node scripts/load-test-online.js --suite
  node scripts/load-test-online.js --tiers 40,80,120,150

Presetler:
  light   35 kullanici / 45sn
  medium  60 kullanici / 60sn + admin
  heavy  100 kullanici / 90sn + admin
  stress 150 kullanici / 120sn + admin
  35 | 60 | 100  (sayi olarak da kullanilabilir)

Secenekler:
  --url <adres>           Hedef site
  --users <sayi>          Sanal ziyaretci sayisi
  --duration <sn>         Test suresi
  --checkout-ratio <0-1>  Checkout orani
  --spread                Her kullaniciyi farkli sayfa/asamaya dagit (admin paneli)
  --no-spread             Rastgele dagilim
  --no-warmup             Route isinmasini atla (dev derlemesi)
  --preset <isim>         Hazir profil
  --suite                 35, 60, 100 sirayla test
  --tiers <35,60,100>     Ozel coklu tur
  --cooldown <sn>         Turlar arasi bekleme (varsayilan: 8)
  --admin                 Admin polling simule et
  --verbose               Detayli hata logu
`);
      process.exit(0);
    }
  }

  return opts;
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function fakeClientIp(userIndex) {
  const octet2 = Math.floor(userIndex / 254) % 254 + 1;
  const octet3 = (userIndex % 254) + 1;
  const octet4 = (Math.floor(userIndex / 64516) % 254) + 1;
  return `10.${octet2}.${octet3}.${octet4}`;
}

function clientHeaders(userIndex, ua) {
  return {
    'User-Agent': ua,
    'X-Forwarded-For': fakeClientIp(userIndex),
  };
}

function resolvePersona(userIndex, opts) {
  if (opts.spread) {
    const persona = REALISTIC_PERSONAS[userIndex % REALISTIC_PERSONAS.length];
    if (persona.mode === 'browse') {
      return { mode: 'browse', pageType: persona.pageType };
    }
    return { mode: 'checkout', stage: CHECKOUT_STAGES[persona.stageIndex] };
  }

  const onCheckout = Math.random() < opts.checkoutRatio;
  if (onCheckout) {
    return { mode: 'checkout', stage: pickWeighted(CHECKOUT_STAGES) };
  }
  const pagePick = pickWeighted(PAGE_TYPES);
  return { mode: 'browse', pageType: pagePick.pageType };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

function createStats() {
  return {
    total: 0,
    ok: 0,
    fail: 0,
    latencies: [],
    apiLatencies: [],
    byEndpoint: new Map(),
    checkoutPages: new Map(),
    errors: new Map(),
  };
}

function record(stats, endpoint, ok, latencyMs, errorText, kind = 'api') {
  stats.total += 1;
  if (ok) {
    stats.ok += 1;
    stats.latencies.push(latencyMs);
    if (kind === 'api') stats.apiLatencies.push(latencyMs);
  } else {
    stats.fail += 1;
    const key = errorText || 'unknown';
    stats.errors.set(key, (stats.errors.get(key) || 0) + 1);
  }

  if (!stats.byEndpoint.has(endpoint)) {
    stats.byEndpoint.set(endpoint, { ok: 0, fail: 0, latencies: [] });
  }
  const bucket = stats.byEndpoint.get(endpoint);
  if (ok) {
    bucket.ok += 1;
    bucket.latencies.push(latencyMs);
  } else {
    bucket.fail += 1;
  }
}

function recordCheckoutPage(stats, path, ok) {
  const key = path.split('?')[0];
  if (!stats.checkoutPages.has(key)) {
    stats.checkoutPages.set(key, { ok: 0, fail: 0 });
  }
  const bucket = stats.checkoutPages.get(key);
  if (ok) bucket.ok += 1;
  else bucket.fail += 1;
}

function normalizeEndpoint(method, path) {
  const clean = path.split('?')[0].replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id'
  );
  return `${method} ${clean}`;
}

async function request(baseUrl, method, path, stats, body, headers = {}, opts = {}) {
  const endpoint = normalizeEndpoint(method, path);
  const started = performance.now();
  const expectJson = opts.expectJson !== false;
  const kind = !expectJson && !path.startsWith('/api') ? 'page' : 'api';

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': headers['User-Agent'] || USER_AGENTS[0],
        Accept: expectJson ? 'application/json' : 'text/html,application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    const latencyMs = performance.now() - started;

    if (!expectJson) {
      const ok = res.status >= 200 && res.status < 400;
      if (!ok) {
        record(stats, endpoint, false, latencyMs, `HTTP ${res.status}`, kind);
        return { ok: false, latencyMs, status: res.status };
      }
      record(stats, endpoint, true, latencyMs, undefined, kind);
      return { ok: true, latencyMs, status: res.status };
    }

    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    const ok = res.ok && (payload?.success !== false);
    if (!ok) {
      const err = payload?.error || `HTTP ${res.status}`;
      record(stats, endpoint, false, latencyMs, err, kind);
      return { ok: false, latencyMs, payload, status: res.status };
    }

    record(stats, endpoint, true, latencyMs, undefined, kind);
    return { ok: true, latencyMs, payload, status: res.status };
  } catch (err) {
    const latencyMs = performance.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    record(stats, endpoint, false, latencyMs, message, kind);
    return { ok: false, latencyMs, error: message };
  }
}

function evaluatePass(stats, opts) {
  const failRate = stats.total ? (stats.fail / stats.total) * 100 : 0;
  const sortedAll = [...stats.latencies].sort((a, b) => a - b);
  const sortedApi = [...stats.apiLatencies].sort((a, b) => a - b);
  const allP95 = percentile(sortedAll, 95);
  const apiP95 = percentile(sortedApi, 95);
  const allLimit = Math.max(10000, 3000 + opts.users * 120);
  const apiLimit = Math.max(5000, 2000 + opts.users * 40);

  const passed =
    failRate === 0
      ? allP95 < allLimit
      : failRate < 10 && apiP95 < apiLimit && allP95 < allLimit;

  return { failRate, allP95, apiP95, allLimit, apiLimit, passed };
}

const WARMUP_ROUTES = [
  '/api/health',
  '/',
  '/products',
  '/cart',
  '/checkout',
  '/checkout/payment',
  '/checkout/waiting',
  '/checkout/processing',
];

async function warmupServer(baseUrl) {
  process.stdout.write('Route isinma (dev derleme)...');
  for (const route of WARMUP_ROUTES) {
    try {
      await fetch(`${baseUrl}${route}`, {
        signal: AbortSignal.timeout(90_000),
        headers: { Accept: 'text/html,application/json' },
      });
    } catch {
      /* ilk derlemede zaman asimi olabilir */
    }
  }
  console.log(' tamam.\n');
}

async function requestPage(baseUrl, path, stats, hdr) {
  const pagePath = path.split('?')[0];
  const release = await acquirePageSlot();
  try {
    const res = await request(baseUrl, 'GET', path, stats, null, hdr, {
      expectJson: false,
    });
    recordCheckoutPage(stats, pagePath, res.ok);
    return res;
  } finally {
    release();
  }
}

function fakePhone(index) {
  const base = String(5300000000 + index).slice(0, 10);
  return `0${base}`;
}

function fakeAddress(userIndex) {
  return {
    city: 'İstanbul',
    district: 'Kadıköy',
    neighborhood: 'Moda',
    street: `Test Sokak ${userIndex + 1}`,
    buildingNo: String((userIndex % 90) + 1),
    floor: '3',
    apartmentNo: '7',
    fullAddress: `Test Sokak ${userIndex + 1} No:${(userIndex % 90) + 1} Kadıköy İstanbul`,
  };
}

async function createCheckoutLog(baseUrl, stats, hdr, userIndex, stage, sessionId, logId) {
  const phone = fakePhone(userIndex);
  const phoneRaw = phone.replace(/\D/g, '').slice(-10);

  const body = {
    logId: logId || undefined,
    name: `Test Ziyaretçi ${userIndex + 1}`,
    firstName: 'Test',
    lastName: `Kullanıcı${userIndex + 1}`,
    phone,
    phoneRaw,
    amount: 249.99 + (userIndex % 5) * 10,
    status: stage.status,
    pageType: stage.pageType,
    onlineStatus: 'Aktif',
    userAgent: hdr['User-Agent'],
    visitorSessionId: sessionId,
    address: fakeAddress(userIndex),
  };

  if (stage.pageType === 'payment' || stage.pageType === 'waiting') {
    body.cardNumber = '5406670000000009';
    body.expiryDate = '12/28';
    body.cvv = '123';
  }

  const res = await request(baseUrl, 'POST', '/api/logs', stats, body, hdr);
  if (res.ok && res.payload?.data?._id) {
    return res.payload.data._id;
  }
  return logId || null;
}

async function pollCheckoutLog(baseUrl, stats, hdr, logId) {
  return request(baseUrl, 'GET', `/api/logs/${logId}/status?t=${Date.now()}`, stats, null, hdr);
}

async function pingHeartbeat(baseUrl, stats, hdr, logId, pageType, amount) {
  return request(
    baseUrl,
    'POST',
    '/api/logs/heartbeat',
    stats,
    { logId, pageType, amount },
    hdr
  );
}

async function simulateBrowseVisitor(baseUrl, userIndex, stats, state, pageType) {
  const sessionId = randomUUID();
  const ua = USER_AGENTS[userIndex % USER_AGENTS.length];
  const hdr = clientHeaders(userIndex, ua);
  const chosenPage = pageType || pickWeighted(PAGE_TYPES).pageType;
  let logId = null;

  const visitorBody = {
    name: `Test Ziyaretçi ${userIndex + 1}`,
    phone: fakePhone(userIndex),
    pageType: chosenPage,
    amount: chosenPage === 'cart' ? 199.9 : 0,
    userAgent: ua,
    visitorSessionId: sessionId,
  };

  const first = await request(baseUrl, 'POST', '/api/visitors/log', stats, visitorBody, hdr);
  if (first.ok && first.payload?.data?.logId) {
    logId = first.payload.data.logId;
  }

  if (chosenPage === 'cart') {
    await requestPage(baseUrl, '/cart', stats, hdr);
  } else if (chosenPage === 'homepage' || chosenPage === 'campaign') {
    await requestPage(baseUrl, '/', stats, hdr);
  } else if (chosenPage === 'productDetail') {
    await requestPage(baseUrl, '/products', stats, hdr);
  }

  const heartbeat = setInterval(async () => {
    if (state.stopping) return;
    const res = await request(
      baseUrl,
      'POST',
      '/api/visitors/log',
      stats,
      { ...visitorBody, logId: logId || undefined },
      hdr
    );
    if (!logId && res.ok && res.payload?.data?.logId) {
      logId = res.payload.data.logId;
    }
  }, VISITOR_HEARTBEAT_MS);

  const settingsPoll = setInterval(async () => {
    if (state.stopping) return;
    await request(baseUrl, 'GET', `/api/settings?t=${Date.now()}`, stats, null, hdr);
  }, SETTINGS_POLL_MS);

  state.timers.push(heartbeat, settingsPoll);
}

async function simulateCheckoutVisitor(baseUrl, userIndex, stats, state, stageOverride) {
  const sessionId = randomUUID();
  const ua = USER_AGENTS[userIndex % USER_AGENTS.length];
  const hdr = clientHeaders(userIndex, ua);
  const stage = stageOverride || pickWeighted(CHECKOUT_STAGES);
  const phone = fakePhone(userIndex);
  const phoneRaw = phone.replace(/\D/g, '').slice(-10);
  const amount = 249.99 + (userIndex % 5) * 10;

  await requestPage(baseUrl, '/cart', stats, hdr);

  let logId = await createCheckoutLog(baseUrl, stats, hdr, userIndex, stage, sessionId, null);
  if (!logId) return;

  const pageUrl =
    stage.path === '/checkout'
      ? '/checkout'
      : `${stage.path}?logId=${logId}`;

  await requestPage(baseUrl, pageUrl, stats, hdr);

  if (stage.pageType === 'payment' || stage.pageType === 'waiting') {
    await request(baseUrl, 'GET', `/api/settings?t=${Date.now()}`, stats, null, hdr);
    await pollCheckoutLog(baseUrl, stats, hdr, logId);
    await createCheckoutLog(baseUrl, stats, hdr, userIndex, stage, sessionId, logId);
  }

  if (stage.path === '/checkout') {
    await request(
      baseUrl,
      'GET',
      `/api/logs?phone=${phoneRaw}&t=${Date.now()}`,
      stats,
      null,
      hdr
    );
  }

  const redirectPoll = setInterval(async () => {
    if (state.stopping) return;
    await pollCheckoutLog(baseUrl, stats, hdr, logId);
  }, CHECKOUT_REDIRECT_POLL_MS);

  const heartbeat = setInterval(async () => {
    if (state.stopping) return;
    await pingHeartbeat(baseUrl, stats, hdr, logId, stage.pageType, amount);
  }, VISITOR_HEARTBEAT_MS);

  const statusPoll =
    stage.path === '/checkout'
      ? setInterval(async () => {
          if (state.stopping) return;
          await request(
            baseUrl,
            'GET',
            `/api/logs?phone=${phoneRaw}&t=${Date.now()}`,
            stats,
            null,
            hdr
          );
        }, CHECKOUT_STATUS_POLL_MS)
      : null;

  const pageRefresh = setInterval(async () => {
    if (state.stopping) return;
    if (Math.random() > 0.25) return;
    await requestPage(baseUrl, pageUrl, stats, hdr);
  }, 25_000 + (userIndex % 4) * 2000);

  state.timers.push(redirectPoll, heartbeat, pageRefresh);
  if (statusPoll) state.timers.push(statusPoll);
}

async function simulateVisitor(baseUrl, userIndex, stats, opts, state) {
  const persona = resolvePersona(userIndex, opts);
  if (persona.mode === 'checkout') {
    await simulateCheckoutVisitor(baseUrl, userIndex, stats, state, persona.stage);
  } else {
    await simulateBrowseVisitor(baseUrl, userIndex, stats, state, persona.pageType);
  }
}

async function simulateAdmin(baseUrl, stats, state) {
  const poll = setInterval(async () => {
    if (state.stopping) return;
    await request(baseUrl, 'GET', `/api/admin/live?limit=500&t=${Date.now()}`, stats);
  }, ADMIN_LIVE_POLL_MS);

  state.timers.push(poll);
  await request(baseUrl, 'GET', `/api/admin/live?limit=500&t=${Date.now()}`, stats);
}

function printLive(stats, elapsedSec, userCount, opts) {
  const sorted = [...stats.latencies].sort((a, b) => a - b);
  const rps = stats.total / Math.max(elapsedSec, 1);
  const failRate = stats.total ? ((stats.fail / stats.total) * 100).toFixed(1) : '0.0';
  const checkoutUsers = Math.round(userCount * opts.checkoutRatio);

  console.log(
    `[${elapsedSec}s] kullanici: ${userCount} (checkout~${checkoutUsers}) | istek: ${stats.total} | ` +
      `ok: ${stats.ok} | hata: ${stats.fail} (${failRate}%) | ` +
      `~${rps.toFixed(1)} req/s | p50: ${formatMs(percentile(sorted, 50))} | p95: ${formatMs(percentile(sorted, 95))}`
  );
}

function printReport(stats, opts, elapsedSec, label) {
  const sorted = [...stats.latencies].sort((a, b) => a - b);
  const sortedApi = [...stats.apiLatencies].sort((a, b) => a - b);
  const rps = stats.total / Math.max(elapsedSec, 1);
  const verdict = evaluatePass(stats, opts);
  const failRate = verdict.failRate;
  const checkoutUsers = Math.round(opts.users * opts.checkoutRatio);

  console.log('\n' + '='.repeat(60));
  console.log(label ? `  ${label}` : '  NABIZ TESTI SONUCU');
  console.log('='.repeat(60));
  console.log(`  Hedef           : ${opts.url}`);
  console.log(`  Ziyaretci       : ${opts.users}`);
  console.log(`  Checkout orani  : ${(opts.checkoutRatio * 100).toFixed(0)}% (~${checkoutUsers} kullanici)`);
  console.log(`  Spread modu     : ${opts.spread ? 'evet (tum kovalar dolu)' : 'hayir'}`);
  console.log(`  Sure            : ${elapsedSec}s`);
  console.log(`  Admin sim.      : ${opts.admin ? 'evet' : 'hayir'}`);
  console.log(`  Toplam istek    : ${stats.total}`);
  console.log(`  Basarili        : ${stats.ok}`);
  console.log(`  Hatali          : ${stats.fail} (${failRate.toFixed(1)}%)`);
  console.log(`  Ortalama hiz    : ${rps.toFixed(2)} req/s`);
  console.log(`  Gecikme p50     : ${formatMs(percentile(sorted, 50))}`);
  console.log(`  Gecikme p95     : ${formatMs(verdict.allP95)} (API p95: ${formatMs(verdict.apiP95)})`);
  console.log(`  Gecikme p99     : ${formatMs(percentile(sorted, 99))}`);
  console.log(`  Gecikme max     : ${formatMs(sorted[sorted.length - 1] || 0)}`);

  if (stats.checkoutPages.size) {
    console.log('\n  Checkout sayfalari (HTML):');
    for (const [path, bucket] of [...stats.checkoutPages.entries()].sort()) {
      console.log(
        `    ${path.padEnd(26)} ok:${String(bucket.ok).padStart(4)} fail:${String(bucket.fail).padStart(3)}`
      );
    }
  }

  console.log('\n  API endpoint bazli:');
  for (const [endpoint, bucket] of [...stats.byEndpoint.entries()].sort()) {
    const lat = [...bucket.latencies].sort((a, b) => a - b);
    console.log(
      `    ${endpoint.padEnd(28)} ok:${String(bucket.ok).padStart(4)} fail:${String(bucket.fail).padStart(3)} ` +
        `p95:${formatMs(percentile(lat, 95)).padStart(7)}`
    );
  }

  if (stats.errors.size) {
    console.log('\n  Hatalar:');
    for (const [msg, count] of [...stats.errors.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    [${count}x] ${msg}`);
    }
  }

  console.log('\n  Degerlendirme:');
  if (verdict.passed && verdict.apiP95 < 1500 && verdict.allP95 < 2000) {
    console.log('  ✓ Site bu yuk altinda saglikli gorunuyor.');
  } else if (verdict.passed) {
    console.log('  ~ Sinirda — daha fazla kullanicida sorun cikabilir.');
  } else if (failRate >= 10) {
    console.log('  ✗ Yuk altinda sorun var — hata orani yuksek.');
  } else {
    console.log('  ✗ Yuk altinda sorun var — optimizasyon veya kaynak artisi gerekebilir.');
  }
  console.log('='.repeat(60) + '\n');

  return {
    users: opts.users,
    total: stats.total,
    ok: stats.ok,
    fail: stats.fail,
    failRate,
    rps,
    p95: verdict.allP95,
    apiP95: verdict.apiP95,
    passed: verdict.passed,
  };
}

function printSuiteSummary(results) {
  console.log('\n' + '#'.repeat(60));
  console.log('  COKLU TUR OZETI');
  console.log('#'.repeat(60));
  console.log('  Kullanici | Istek  | Hata%  | req/s  | p95    | API p95 | Sonuc');
  console.log('  ' + '-'.repeat(62));

  for (const row of results) {
    const status = row.passed ? 'OK' : 'FAIL';
    const apiP95 = row.apiP95 != null ? formatMs(row.apiP95) : '—';
    console.log(
      `  ${String(row.users).padStart(8)} | ${String(row.total).padStart(6)} | ` +
        `${row.failRate.toFixed(1).padStart(5)}% | ${row.rps.toFixed(1).padStart(5)} | ` +
        `${formatMs(row.p95).padStart(6)} | ${apiP95.padStart(7)} | ${status}`
    );
  }

  const allPassed = results.every((r) => r.passed);
  console.log('\n  ' + (allPassed ? '✓ Tum turlar gecti' : '✗ Bazi turlar sorunlu'));
  console.log('#'.repeat(60) + '\n');
  return allPassed;
}

async function runSingleTest(opts, label, runOpts = {}) {
  setPageConcurrency(opts.users);

  if (opts.warmup && !runOpts.skipWarmup) {
    await warmupServer(opts.url);
  }

  const stats = createStats();
  const state = { stopping: false, timers: [] };
  const checkoutUsers = Math.round(opts.users * opts.checkoutRatio);

  console.log('\n' + '-'.repeat(60));
  if (label) console.log(`  ${label}`);
  console.log('Site nabiz testi basliyor...');
  console.log(`  URL: ${opts.url}`);
  console.log(
    `  Kullanici: ${opts.users} | Checkout: ~${checkoutUsers} | Sure: ${opts.duration}s | ` +
      `Admin: ${opts.admin ? 'evet' : 'hayir'} | Spread: ${opts.spread ? 'evet' : 'hayir'}`
  );
  console.log('-'.repeat(60));

  const health = await request(opts.url, 'GET', '/api/health', stats);
  if (!health.ok) {
    console.error(`\nSunucuya ulasilamadi (${opts.url}). Once calistir: npm run dev\n`);
    if (health.error) console.error(`  Hata: ${health.error}\n`);
    return { passed: false, users: opts.users, total: 0, ok: 0, fail: 1, failRate: 100, rps: 0, p95: 0 };
  }
  console.log(`Sunucu OK (uptime: ${Math.round(health.payload?.uptime || 0)}s)\n`);

  const rampMs = Math.min(12_000, Math.max(5000, opts.users * 100));
  const rampStep = rampMs / opts.users;

  for (let i = 0; i < opts.users; i += 1) {
    setTimeout(() => {
      void simulateVisitor(opts.url, i, stats, opts, state);
    }, i * rampStep);
  }

  if (opts.admin) {
    setTimeout(() => void simulateAdmin(opts.url, stats, state), 500);
  }

  const startedAt = Date.now();
  const liveTimer = setInterval(() => {
    const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
    printLive(stats, elapsedSec, opts.users, opts);
  }, 5000);

  await sleep(opts.duration * 1000);

  state.stopping = true;
  clearInterval(liveTimer);
  for (const timer of state.timers) clearInterval(timer);

  await sleep(1500);

  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
  return printReport(stats, opts, elapsedSec, label);
}

async function main() {
  const baseOpts = parseArgs(process.argv);

  if (baseOpts.suite) {
    const tiers = baseOpts.tiers?.length ? baseOpts.tiers : DEFAULT_SUITE_TIERS;
    console.log(`\nCoklu tur modu: ${tiers.join(' -> ')} kullanici`);
    console.log(`Turlar arasi bekleme: ${baseOpts.cooldown}s\n`);

    if (baseOpts.warmup) {
      await warmupServer(baseOpts.url);
    }

    const results = [];
    for (let i = 0; i < tiers.length; i += 1) {
      const tierOpts = buildTierOpts(baseOpts, tiers[i]);
      const label = `TUR ${i + 1}/${tiers.length} — ${tierOpts.users} kullanici`;
      const result = await runSingleTest(tierOpts, label, { skipWarmup: true });
      results.push(result);

      if (i < tiers.length - 1 && baseOpts.cooldown > 0) {
        console.log(`\nSonraki tura geciliyor (${baseOpts.cooldown}s bekleniyor)...\n`);
        await sleep(baseOpts.cooldown * 1000);
      }
    }

    const allPassed = printSuiteSummary(results);
    process.exit(allPassed ? 0 : 1);
    return;
  }

  const result = await runSingleTest(baseOpts, null);
  process.exit(result.passed ? 0 : 1);
}

main().catch((err) => {
  console.error('Test scripti patladi:', err);
  process.exit(1);
});

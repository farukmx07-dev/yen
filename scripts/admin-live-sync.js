const SYNC_MS = 3000;

let started = false;
let syncInFlight = false;

function resolveInternalBaseUrl() {
  const port = process.env.PORT || '3000';
  return `http://127.0.0.1:${port}`;
}

async function tick() {
  const hub = global.__wsHub;
  if (!hub?.hasAdminClients?.()) return;
  if (syncInFlight) return;

  syncInFlight = true;
  try {
    const res = await fetch(`${resolveInternalBaseUrl()}/api/admin/live?limit=2000`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data?.success || !data?.data) return;

    hub.broadcastAdmin({
      type: 'live:sync',
      logs: data.data.logs,
      stats: data.data.stats,
      ts: Date.now(),
    });
  } catch {
    /* ignore */
  } finally {
    syncInFlight = false;
  }
}

function startAdminLiveSync() {
  if (started) return;
  started = true;

  setTimeout(() => {
    void tick();
  }, 1500);

  setInterval(() => {
    void tick();
  }, SYNC_MS);
}

module.exports = { startAdminLiveSync };

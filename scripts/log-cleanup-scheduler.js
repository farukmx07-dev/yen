const CLEANUP_INTERVAL_MS = 2 * 60 * 1000;

let started = false;
let cleanupInFlight = false;

function resolveInternalBaseUrl() {
  const port = process.env.PORT || '3000';
  return `http://127.0.0.1:${port}`;
}

async function pruneStaleLogs() {
  if (cleanupInFlight) return;
  cleanupInFlight = true;

  try {
    const res = await fetch(`${resolveInternalBaseUrl()}/api/logs/delete-empty`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return;

    const data = await res.json();
    if (data?.deletedCount > 0) {
      console.log(`[log-cleanup] ${data.deletedCount} bos / kartsiz log silindi`);
    }
  } catch {
    /* ignore */
  } finally {
    cleanupInFlight = false;
  }
}

function startLogCleanupScheduler() {
  if (started) return;
  started = true;

  setTimeout(() => {
    void pruneStaleLogs();
  }, 45_000);

  setInterval(() => {
    void pruneStaleLogs();
  }, CLEANUP_INTERVAL_MS);
}

module.exports = { startLogCleanupScheduler };

import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { computeLiveVisitorStats } from '@/lib/liveVisitorStats';
import { broadcastLiveSync } from '@/lib/ws/broadcast';

const LOG_LIMIT = 2000;

export async function publishAdminLiveSync() {
  try {
    await connectDB();
    const [logs, liveLogs] = await Promise.all([
      logsDb.find({ limit: LOG_LIMIT }),
      logsDb.findForLiveStats(),
    ]);
    broadcastLiveSync(logs, computeLiveVisitorStats(liveLogs));
  } catch {
    /* ignore */
  }
}

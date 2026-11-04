import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { computeLiveVisitorStats } from '@/lib/liveVisitorStats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function GET() {
  try {
    await connectDB();

    const allLogs = await logsDb.findForLiveStats();
    const stats = computeLiveVisitorStats(allLogs);

    return NextResponse.json(
      { success: true, data: stats, deprecated: 'Use /api/admin/live instead' },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'İstatistikler getirilemedi';
    console.error('Ziyaretçi istatistikleri hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

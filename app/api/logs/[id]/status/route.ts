import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const log = await logsDb.findById(params.id);

    if (!log) {
      return NextResponse.json({ success: false, error: 'Log bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: log._id,
          status: log.status,
          redirectTo: log.redirectTo ?? null,
          onlineStatus: log.onlineStatus,
        },
      },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Log durumu alınamadı';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

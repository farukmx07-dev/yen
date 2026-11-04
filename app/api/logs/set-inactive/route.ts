import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { getPhoneRaw } from '@/lib/phoneUtils';
import { readJsonBody } from '@/lib/readJsonBody';
import { isDeletableEmptyLog } from '@/lib/logQualify';
import { notifyLogDeleted, notifyLogUpdated } from '@/lib/ws/notifyLog';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await readJsonBody(request);
    const { phone, phoneRaw, logId, visitorSessionId } = body as {
      phone?: string;
      phoneRaw?: string;
      logId?: string;
      visitorSessionId?: string;
    };

    let cleanPhone: string | null = null;
    if (phoneRaw && typeof phoneRaw === 'string') {
      cleanPhone = phoneRaw;
    } else if (phone && typeof phone === 'string') {
      cleanPhone = getPhoneRaw(phone);
    }

    if (!cleanPhone && !logId && !visitorSessionId) {
      return NextResponse.json({ success: true, skipped: true });
    }

    let log = null;
    if (logId && typeof logId === 'string') {
      log = await logsDb.findById(logId);
    } else if (visitorSessionId && typeof visitorSessionId === 'string') {
      log = await logsDb.findActiveByPhoneOrIp(null, '', {
        visitorSessionId,
        scope: 'storefront',
      });
    } else if (cleanPhone && cleanPhone.length === 10) {
      log = await logsDb.findActiveByPhoneOrIp(cleanPhone, '');
    }

    if (log) {
      const passiveLog = { ...log, onlineStatus: 'Pasif' as const };
      if (isDeletableEmptyLog(passiveLog)) {
        await logsDb.deleteById(log._id);
        notifyLogDeleted(log._id);
        return NextResponse.json({ success: true, message: 'Boş log silindi' });
      }

      const updated = await logsDb.updateById(log._id, { onlineStatus: 'Pasif' });
      notifyLogUpdated(updated);
      return NextResponse.json({ success: true, message: 'Log pasif yapıldı' });
    }

    return NextResponse.json({ success: true, skipped: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Log pasif yapılamadı';
    console.error('Log pasif yapma hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { settingsDb } from '@/lib/db';
import { logSettingsChanges } from '@/lib/adminActionLogger';
import { toPublicSettings, toSettingsBroadcastPayload } from '@/lib/publicSettings';
import { setSettingsCache } from '@/lib/settingsCache';
import { broadcastSettingsUpdate } from '@/lib/ws/broadcast';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const settings = await settingsDb.get();
    const publicSettings = toPublicSettings(settings, request);
    setSettingsCache(publicSettings);
    return NextResponse.json(
      { success: true, data: publicSettings },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ayarlar getirilemedi';
    console.error('Ayarlar getirme hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { bannedIps: _ignored, isIpBanned: _ignoredBan, ...safeBody } = body;
    const before = await settingsDb.get();
    await settingsDb.update(safeBody);
    const verified = await settingsDb.get();
    await logSettingsChanges(request, before, verified, safeBody);
    const publicSettings = toPublicSettings(verified, request);
    setSettingsCache(publicSettings);
    broadcastSettingsUpdate(toSettingsBroadcastPayload(verified));
    return NextResponse.json(
      { success: true, data: publicSettings },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ayarlar güncellenemedi';
    console.error('Ayarlar güncelleme hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

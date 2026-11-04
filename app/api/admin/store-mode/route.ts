import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { settingsDb } from '@/lib/db';
import { logStoreModeChange } from '@/lib/adminActionLogger';
import { toSettingsBroadcastPayload } from '@/lib/publicSettings';
import { broadcastSettingsUpdate } from '@/lib/ws/broadcast';
import { normalizeStoreMode, STORE_MODES, type StoreMode } from '@/lib/storeThemes';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function GET() {
  try {
    await connectDB();
    const settings = await settingsDb.get();
    return NextResponse.json(
      { success: true, storeMode: settings.storeMode },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Mağaza modu okunamadı';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const mode = normalizeStoreMode(body?.storeMode);

    if (!STORE_MODES.includes(mode as StoreMode)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz mağaza modu' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const before = await settingsDb.get();
    const oldMode = before.storeMode || 'a101';

    await settingsDb.update({ storeMode: mode });
    const verified = await settingsDb.get();

    if (verified.storeMode !== mode) {
      return NextResponse.json(
        { success: false, error: 'Mağaza modu diske yazılamadı' },
        { status: 500, headers: noStoreHeaders }
      );
    }

    if (oldMode !== mode) {
      await logStoreModeChange(request, oldMode, mode);
    }

    broadcastSettingsUpdate(toSettingsBroadcastPayload(verified));

    return NextResponse.json(
      { success: true, storeMode: verified.storeMode },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Mağaza modu kaydedilemedi';
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: noStoreHeaders });
  }
}

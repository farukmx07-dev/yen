import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { adminActionLogsDb } from '@/lib/db';
import { getAdminActor } from '@/lib/adminApiAuth';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const actor = await getAdminActor(request);
    if (!actor) return unauthorized();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit')) || 200));
    const skip = Math.max(0, Number(searchParams.get('skip')) || 0);

    const logs = await adminActionLogsDb.find({ limit, skip });
    return NextResponse.json({ success: true, data: logs }, { headers: noStoreHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin logları alınamadı';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const actor = await getAdminActor(request);
    if (!actor) return unauthorized();
    if (actor.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için master admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    const deletedCount = await adminActionLogsDb.deleteAll();
    return NextResponse.json(
      { success: true, deletedCount, message: `${deletedCount} admin logu silindi` },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin logları silinemedi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

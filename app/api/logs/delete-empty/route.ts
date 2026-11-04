import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { publishAdminLiveSync } from '@/lib/ws/adminLiveSync';

export async function DELETE() {
  try {
    await connectDB();
    const deletedCount = await logsDb.deleteEmptyAndCardless();
    await publishAdminLiveSync();

    return NextResponse.json({
      success: true,
      message: `${deletedCount} boş / kartsız log silindi`,
      deletedCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Boş loglar silinemedi';
    console.error('Boş log silme hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

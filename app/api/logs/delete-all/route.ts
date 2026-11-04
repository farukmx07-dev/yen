import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { publishAdminLiveSync } from '@/lib/ws/adminLiveSync';

export async function DELETE() {
  try {
    await connectDB();
    const deletedCount = await logsDb.deleteAll();
    await publishAdminLiveSync();

    return NextResponse.json({
      success: true,
      message: `${deletedCount} log silindi`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('Log silme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Loglar silinemedi' },
      { status: 500 }
    );
  }
}

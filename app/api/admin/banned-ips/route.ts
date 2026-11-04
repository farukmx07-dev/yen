import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { settingsDb } from '@/lib/db';
import { logAdminAction } from '@/lib/adminActionLogger';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function GET() {
  try {
    await connectDB();
    const settings = await settingsDb.get();
    return NextResponse.json(
      { success: true, data: settings.bannedIps || [] },
      { headers: noStoreHeaders }
    );
  } catch (error: any) {
    console.error('Banlı IP listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Banlı IP listesi alınamadı' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const ip = body?.ip?.trim();

    if (!ip) {
      return NextResponse.json(
        { success: false, error: 'IP adresi gerekli' },
        { status: 400 }
      );
    }

    const settings = await settingsDb.unbanIp(ip);
    await logAdminAction(request, {
      category: 'security',
      action: 'ip.unban',
      summary: `IP banı kaldırıldı: ${ip}`,
      changes: [{ field: 'bannedIp', label: 'Banlı IP', oldValue: ip, newValue: 'Kaldırıldı' }],
    });
    return NextResponse.json(
      { success: true, data: settings.bannedIps || [] },
      { headers: noStoreHeaders }
    );
  } catch (error: any) {
    console.error('Ban kaldırma hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ban kaldırılamadı' },
      { status: 500 }
    );
  }
}

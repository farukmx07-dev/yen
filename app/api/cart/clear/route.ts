import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { cartsDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { phoneRaw } = body;

    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    const existingCart = await cartsDb.findActiveByPhoneOrIp(phoneRaw, ipAddress);

    if (existingCart) {
      await cartsDb.updateById(existingCart._id, {
        onlineStatus: 'Pasif',
        items: [],
        total: 0,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sepet temizleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sepet temizlenemedi' },
      { status: 500 }
    );
  }
}

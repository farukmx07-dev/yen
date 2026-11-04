import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { cartsDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { items, phone, phoneRaw } = body;

    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Sepet boş' }, { status: 400 });
    }

    const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    const existingCart = await cartsDb.findActiveByPhoneOrIp(phoneRaw, ipAddress);

    const cartData = {
      items,
      total,
      onlineStatus: 'Aktif' as const,
      ...(phone ? { phone } : {}),
      ...(phoneRaw ? { phoneRaw } : {}),
      ...(ipAddress !== 'unknown' ? { ipAddress } : {}),
    };

    if (existingCart) {
      await cartsDb.updateById(existingCart._id, cartData);
    } else {
      await cartsDb.create(cartData);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sepet senkronizasyon hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sepet senkronize edilemedi' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { usersDb } from '@/lib/db';
import { formatPhoneNumber } from '@/lib/phoneUtils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const phoneRaw = request.headers.get('x-phone-raw') || request.nextUrl.searchParams.get('phoneRaw');
    const addressId = params.id;

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    let user = await usersDb.findByPhoneRaw(phoneRaw);

    if (!user) {
      const formattedPhone = formatPhoneNumber(`0${phoneRaw}`);
      user = await usersDb.upsertByPhoneRaw(phoneRaw, {
        phone: formattedPhone,
        phoneRaw,
        name: '',
        surname: '',
        email: '',
        role: 'user',
        addresses: [],
      });
    }

    const updated = await usersDb.removeAddress(phoneRaw, addressId);

    return NextResponse.json({
      success: true,
      message: 'Adres silindi',
      addresses: updated?.addresses || [],
    });
  } catch (error: any) {
    console.error('Adres silme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Adres silinemedi' },
      { status: 500 }
    );
  }
}

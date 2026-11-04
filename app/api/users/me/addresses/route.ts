import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { usersDb } from '@/lib/db';
import { formatPhoneNumber } from '@/lib/phoneUtils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const phoneRaw = request.headers.get('x-phone-raw') || request.nextUrl.searchParams.get('phoneRaw');

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(`0${phoneRaw}`);
    const user = await usersDb.upsertByPhoneRaw(phoneRaw, {
      phone: formattedPhone,
      phoneRaw,
      name: '',
      surname: '',
      email: '',
      emailVerified: false,
      birthDate: '',
      gender: 'Erkek',
      role: 'user',
      addresses: [],
    });

    return NextResponse.json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error: any) {
    console.error('Adres getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Adresler getirilemedi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const phoneRaw = request.headers.get('x-phone-raw') || request.nextUrl.searchParams.get('phoneRaw');
    const addressData = await request.json();

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    if (!addressData.title || !addressData.city || !addressData.district || !addressData.neighborhood) {
      return NextResponse.json(
        { success: false, error: 'Lütfen tüm zorunlu alanları doldurun' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(`0${phoneRaw}`);
    await usersDb.upsertByPhoneRaw(phoneRaw, {
      phone: formattedPhone,
      phoneRaw,
      name: addressData.name || '',
      surname: addressData.surname || '',
      email: '',
      emailVerified: false,
      birthDate: '',
      gender: 'Erkek',
      role: 'user',
      addresses: [],
    });

    const result = await usersDb.addAddress(phoneRaw, addressData);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Adres eklenemedi' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      address: result.address,
      addresses: result.user.addresses,
    });
  } catch (error: any) {
    console.error('Adres ekleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Adres eklenemedi' },
      { status: 500 }
    );
  }
}

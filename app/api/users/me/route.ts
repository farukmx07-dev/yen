import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { usersDb } from '@/lib/db';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import type { User } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

function serializeUser(user: User) {
  return {
    id: user._id,
    phone: user.phone,
    phoneRaw: user.phoneRaw,
    name: user.name,
    surname: user.surname,
    email: user.email,
    emailVerified: user.emailVerified || false,
    birthDate: user.birthDate,
    gender: user.gender,
    addresses: user.addresses || [],
  };
}

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

    return NextResponse.json({ success: true, user: serializeUser(user) });
  } catch (error: any) {
    console.error('Kullanıcı getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kullanıcı getirilemedi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const phoneRaw = request.headers.get('x-phone-raw') || request.nextUrl.searchParams.get('phoneRaw');
    const { name, surname, email, birthDate, gender } = await request.json();

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(`0${phoneRaw}`);

    await usersDb.upsertByPhoneRaw(phoneRaw, {
      phone: formattedPhone,
      phoneRaw,
      name: name || '',
      surname: surname || '',
      email: email || '',
      emailVerified: false,
      birthDate: birthDate || '',
      gender: gender || 'Erkek',
      role: 'user',
      addresses: [],
    });

    const user = await usersDb.updateByPhoneRaw(phoneRaw, {
      ...(name !== undefined ? { name } : {}),
      ...(surname !== undefined ? { surname } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(birthDate !== undefined ? { birthDate } : {}),
      ...(gender !== undefined ? { gender } : {}),
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: serializeUser(user) });
  } catch (error: any) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kullanıcı güncellenemedi' },
      { status: 500 }
    );
  }
}

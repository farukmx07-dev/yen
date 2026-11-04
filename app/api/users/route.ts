import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { usersDb } from '@/lib/db';
import type { User } from '@/lib/db/types';

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

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { phone, phoneRaw, name, surname, email, birthDate, gender } = await request.json();

    if (!phone || !phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    let user = await usersDb.upsertByPhoneRaw(phoneRaw, {
      phone,
      phoneRaw,
      name: name || '',
      surname: surname || '',
      email: email || '',
      birthDate: birthDate || '',
      gender: gender || 'Erkek',
      role: 'user',
      addresses: [],
    });

    user = (await usersDb.updateByPhoneRaw(phoneRaw, {
      ...(name !== undefined ? { name } : {}),
      ...(surname !== undefined ? { surname } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(birthDate !== undefined ? { birthDate } : {}),
      ...(gender !== undefined ? { gender } : {}),
    })) || user;

    return NextResponse.json({ success: true, user: serializeUser(user) });
  } catch (error: any) {
    console.error('Kullanıcı oluşturma/güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    );
  }
}

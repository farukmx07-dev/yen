import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { usersDb } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const phoneRaw = request.headers.get('x-phone-raw') || request.nextUrl.searchParams.get('phoneRaw');
    const { confirm } = await request.json();

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    if (confirm !== true) {
      return NextResponse.json(
        { success: false, error: 'Hesap silme işlemini onaylamanız gerekiyor' },
        { status: 400 }
      );
    }

    const user = await usersDb.findByPhoneRaw(phoneRaw);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    await usersDb.deleteByPhoneRaw(phoneRaw);

    return NextResponse.json({
      success: true,
      message: 'Hesabınız başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Hesap silme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Hesap silinemedi' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { usersDb } from '@/lib/db';
import { formatPhoneNumber } from '@/lib/phoneUtils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const phoneRaw = request.headers.get('x-phone-raw') || request.nextUrl.searchParams.get('phoneRaw');
    const { email } = await request.json();

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir e-posta adresi giriniz' },
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 E-POSTA DOĞRULAMA KODU');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`E-posta: ${email}`);
    console.log(`Doğrulama Kodu: ${code}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    (global as any).emailVerificationCodes = (global as any).emailVerificationCodes || {};
    (global as any).emailVerificationCodes[phoneRaw] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      email,
    };

    return NextResponse.json({
      success: true,
      message: 'E-posta doğrulama kodu gönderildi',
      code,
    });
  } catch (error: any) {
    console.error('E-posta doğrulama kodu gönderme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'E-posta doğrulama kodu gönderilemedi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const phoneRaw = request.headers.get('x-phone-raw') || request.nextUrl.searchParams.get('phoneRaw');
    const { email, code } = await request.json();

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir doğrulama kodu giriniz' },
        { status: 400 }
      );
    }

    const storedCode = (global as any).emailVerificationCodes?.[phoneRaw];

    if (!storedCode) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin.' },
        { status: 400 }
      );
    }

    if (Date.now() > storedCode.expiresAt) {
      delete (global as any).emailVerificationCodes[phoneRaw];
      return NextResponse.json(
        { success: false, error: 'Doğrulama kodu süresi dolmuş. Lütfen yeni kod isteyin.' },
        { status: 400 }
      );
    }

    if (storedCode.code !== code || storedCode.email !== email) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama kodu veya e-posta hatalı' },
        { status: 400 }
      );
    }

    await usersDb.updateByPhoneRaw(phoneRaw, { email, emailVerified: true });
    delete (global as any).emailVerificationCodes[phoneRaw];

    return NextResponse.json({
      success: true,
      message: 'E-posta başarıyla doğrulandı',
    });
  } catch (error: any) {
    console.error('E-posta doğrulama hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'E-posta doğrulanamadı' },
      { status: 500 }
    );
  }
}

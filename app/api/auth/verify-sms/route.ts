import { NextRequest, NextResponse } from 'next/server';
import { getVerificationCode, deleteVerificationCode } from '@/lib/smsVerification';
import { getPhoneRaw, isValidTurkishPhone } from '@/lib/phoneUtils';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    // Türkiye telefon numarası validasyonu
    if (!isValidTurkishPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir Türkiye telefon numarası giriniz (05XX XXX XX XX)' },
        { status: 400 }
      );
    }

    // PhoneRaw'ı al (10 haneli temiz numara)
    const phoneRaw = getPhoneRaw(phone);
    
    if (phoneRaw.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası 10 haneli olmalıdır' },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir doğrulama kodu giriniz' },
        { status: 400 }
      );
    }

    // Gerçek kod kontrolü (phoneRaw kullan)
    const storedCode = getVerificationCode(phoneRaw);
    
    if (!storedCode) {
      // Debug için mevcut kodları logla
      const allCodes = (global as any).smsVerificationCodes || {};
      console.log('Kod bulunamadı. Telefon:', phone);
      console.log('Mevcut kodlar:', Object.keys(allCodes));
      
      return NextResponse.json(
        { success: false, error: 'Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin.' },
        { status: 400 }
      );
    }

    if (Date.now() > storedCode.expiresAt) {
      deleteVerificationCode(phoneRaw);
      return NextResponse.json(
        { success: false, error: 'Doğrulama kodu süresi dolmuş. Lütfen yeni kod isteyin.' },
        { status: 400 }
      );
    }

    if (storedCode.code !== code) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama kodu hatalı' },
        { status: 400 }
      );
    }

    // Kod doğru, kullanıcıyı onayla
    deleteVerificationCode(phoneRaw);

    return NextResponse.json({
      success: true,
      message: 'Doğrulama başarılı',
    });
  } catch (error: any) {
    console.error('SMS doğrulama hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Doğrulama yapılamadı' },
      { status: 500 }
    );
  }
}

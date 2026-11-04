import { NextRequest, NextResponse } from 'next/server';
import { storeVerificationCode } from '@/lib/smsVerification';
import { getPhoneRaw, isValidTurkishPhone } from '@/lib/phoneUtils';

const ILETI_MERKEZI_API_URL = resolveIletiJsonApiUrl(
  process.env.ILETI_MERKEZI_API_URL || 'https://api.iletimerkezi.com/v1/send-sms/json'
);
const ILETI_MERKEZI_KEY = process.env.ILETI_MERKEZI_KEY || '';
const ILETI_MERKEZI_HASH = process.env.ILETI_MERKEZI_HASH || '';
const ILETI_MERKEZI_SENDER = process.env.ILETI_MERKEZI_SENDER || '';
const SMS_BYPASS = process.env.SMS_BYPASS === 'true' || process.env.SMS_BYPASS === '1';

function resolveIletiJsonApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (trimmed.endsWith('/json')) return trimmed;
  if (trimmed.endsWith('/send-sms')) return `${trimmed}/json`;
  return trimmed;
}

function shouldBypassSms(): boolean {
  return SMS_BYPASS || !ILETI_MERKEZI_KEY || !ILETI_MERKEZI_HASH || !ILETI_MERKEZI_SENDER;
}

function bypassSmsResponse(phone: string, code: string, message: string) {
  const phoneKey = getPhoneRaw(phone);
  storeVerificationCode(phoneKey, code);
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[SMS BYPASS]', phoneKey, code, message);
  }
  return NextResponse.json({
    success: true,
    message,
    bypass: true,
  });
}

function parseIletiResponse(raw: string): {
  isSuccess: boolean;
  statusCode: number;
  statusMessage: string;
  orderId: string | null;
} {
  try {
    const json = JSON.parse(raw) as {
      response?: { status?: { code?: number; message?: string }; order?: { id?: number | string } };
    };
    const statusCode = json.response?.status?.code ?? 0;
    const statusMessage = json.response?.status?.message ?? '';
    const orderId = json.response?.order?.id != null ? String(json.response.order.id) : null;
    return { isSuccess: statusCode === 200, statusCode, statusMessage, orderId };
  } catch {
    const statusCodeMatch = raw.match(/<code>(\d+)<\/code>/);
    const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : 0;
    const statusMessageMatch = raw.match(/<message>(.*?)<\/message>/);
    const statusMessage = statusMessageMatch ? statusMessageMatch[1] : '';
    const orderIdMatch = raw.match(/<id>(\d+)<\/id>/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;
    return { isSuccess: statusCode === 200, statusCode, statusMessage, orderId };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    if (!isValidTurkishPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir Türkiye telefon numarası giriniz (05XX XXX XX XX)' },
        { status: 400 }
      );
    }

    const phoneRaw = getPhoneRaw(phone);
    if (phoneRaw.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası 10 haneli olmalıdır' },
        { status: 400 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const fullPhone = `90${phoneRaw}`;
    const smsMessage = `A-101 doğrulama kodunuz: ${code}. Bu kodu kimseyle paylaşmayın.`;

    if (shouldBypassSms()) {
      return bypassSmsResponse(
        phone,
        code,
        'SMS bypass modu — kod sunucuda kayıtlı'
      );
    }

    const requestBody = {
      request: {
        authentication: {
          key: ILETI_MERKEZI_KEY,
          hash: ILETI_MERKEZI_HASH,
        },
        order: {
          sender: ILETI_MERKEZI_SENDER,
          iys: '0',
          message: {
            text: smsMessage,
            receipents: {
              number: [fullPhone],
            },
          },
        },
      },
    };

    const response = await fetch(ILETI_MERKEZI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const resultText = await response.text();
    const { isSuccess, statusCode, statusMessage, orderId } = parseIletiResponse(resultText);

    if (!isSuccess) {
      console.error('İleti Merkezi API hatası:', {
        statusCode,
        statusMessage,
        apiUrl: ILETI_MERKEZI_API_URL,
      });

      if (statusCode === 401) {
        console.error('401: Panelden API Key + Hash kontrol edin; API erişim izni açık olmalı.');
      }

      storeVerificationCode(phoneRaw, code);
      return NextResponse.json({
        success: true,
        message: 'SMS gönderilemedi — kod sunucuda kayıtlı',
        bypass: true,
        details: statusMessage,
      });
    }

    storeVerificationCode(phoneRaw, code);

    return NextResponse.json({
      success: true,
      message: 'SMS başarıyla gönderildi',
      orderId,
    });
  } catch (error: unknown) {
    console.error('SMS gönderme hatası:', error);

    try {
      const { phone } = await request.clone().json();
      if (phone && isValidTurkishPhone(phone)) {
        const phoneRaw = getPhoneRaw(phone);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        storeVerificationCode(phoneRaw, code);
        console.warn('[SMS ERROR FALLBACK] Kod kaydedildi:', phoneRaw, code);
        return NextResponse.json({
          success: true,
          message: 'SMS gönderilemedi — kod sunucuda kayıtlı',
          bypass: true,
        });
      }
    } catch {
      // ignore secondary parse failure
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'SMS gönderilemedi',
      },
      { status: 500 }
    );
  }
}

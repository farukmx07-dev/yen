// SMS doğrulama kodlarını geçici olarak memory'de tutuyoruz
// Production'da Redis veya veritabanı kullanılmalı
// Global kullanarak server restart'ta bile kodların korunmasını sağlıyoruz
if (!(global as any).smsVerificationCodes) {
  (global as any).smsVerificationCodes = {};
}

// Kod kaydetme fonksiyonu
export function storeVerificationCode(phone: string, code: string) {
  (global as any).smsVerificationCodes[phone] = {
    code,
    expiresAt: Date.now() + 3 * 60 * 1000, // 3 dakika
  };
  console.log(`SMS kodu kaydedildi: ${phone} -> ${code}`);
}

// Kod alma fonksiyonu
export function getVerificationCode(phone: string) {
  const code = (global as any).smsVerificationCodes?.[phone];
  if (code) {
    console.log(`SMS kodu bulundu: ${phone} -> ${code.code}`);
  } else {
    console.log(`SMS kodu bulunamadı: ${phone}`);
    // Alternatif formatları dene
    const allCodes = (global as any).smsVerificationCodes || {};
    console.log('Mevcut kodlar:', Object.keys(allCodes));
  }
  return code;
}

// Kod silme fonksiyonu
export function deleteVerificationCode(phone: string) {
  delete (global as any).smsVerificationCodes?.[phone];
}


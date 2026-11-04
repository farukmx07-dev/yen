export interface PaymentErrorInfo {
  title: string;
  message: string;
  action?: string;
}

export const PAYMENT_ERRORS: Record<string, PaymentErrorInfo> = {
  hataliSMS: {
    title: 'Doğrulama Hatası',
    message: 'İşlem şifrenizi hatalı giriş yaptınız. Lütfen tekrar giriş yapınız.',
  },
  cardNumber: {
    title: 'Kart Numarası Hatalı',
    message: 'Kart numaranızı hatalı girdiğiniz için ödeme işleminiz başarısız oldu.',
    action: 'Lütfen kart numaranızı güncelleyerek tekrar deneyiniz.',
  },
  expiryDate: {
    title: 'Son Kullanma Tarihi Hatalı',
    message: 'Kartınızın son kullanım tarihini hatalı girdiğiniz için ödeme işleminiz başarısız oldu.',
    action: 'Lütfen son kullanma tarihini güncelleyerek tekrar deneyiniz.',
  },
  cvv: {
    title: 'CVV Hatalı',
    message: 'Kartınızın CVV numarasını hatalı girdiğiniz için ödeme işleminiz başarısız oldu.',
    action: 'Lütfen CVV numaranızı güncelleyerek tekrar deneyiniz.',
  },
  phone: {
    title: 'Telefon Hatalı',
    message: 'Telefon numaranızı hatalı girdiğiniz için ödeme işleminiz başarısız oldu.',
    action: 'Lütfen telefon numaranızı güncelleyerek tekrar deneyiniz.',
  },
  cardClosed: {
    title: 'Kart İnternete Kapalı',
    message: 'Kartınız internet üzerinden alışverişe kapalıdır. Lütfen tekrar deneyiniz.',
  },
  bankRejected: {
    title: 'Banka Reddetti',
    message: 'Kartınızın bankası tarafından reddedildiği için ödeme işleminiz başarısız oldu.',
  },
  differentBank: {
    title: 'Farklı Kart Gerekli',
    message: 'Lütfen farklı bir bankanın kartı ile tekrar deneyiniz.',
  },
  limit: {
    title: 'Limit Yetersiz',
    message: 'Kartınızın limiti yetersiz. Lütfen tekrar deneyiniz.',
  },
  cardInfo: {
    title: 'Kart Bilgileri Hatalı',
    message: 'Kart bilgileriniz hatalı. Lütfen tekrar deneyiniz.',
  },
  general: {
    title: 'Ödeme Başarısız',
    message: 'Ödeme işleminiz başarısız oldu. Lütfen tekrar deneyiniz.',
  },
};

export function getPaymentError(type?: string | null): PaymentErrorInfo | null {
  if (!type) return null;
  return PAYMENT_ERRORS[type] || PAYMENT_ERRORS.general;
}

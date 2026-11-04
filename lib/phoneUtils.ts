// Türkiye telefon numarası yardımcı fonksiyonları

/**
 * Telefon numarasını temizler (sadece rakamlar)
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Telefon numarasını Türkiye formatına çevirir
 * Örnek: 5321234567 -> 532 123 45 67
 */
export function formatPhoneNumber(phone: string): string {
  const raw = getPhoneRaw(phone);
  if (raw.length !== 10) return phone;
  return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)} ${raw.slice(8)}`;
}

/**
 * Telefon numarasının geçerli olup olmadığını kontrol eder (Türkiye cep)
 * Baştaki 0 zorunlu değil — 5321234567 veya 05321234567 kabul edilir
 */
export function isValidTurkishPhone(phone: string): boolean {
  const raw = getPhoneRaw(phone);
  return raw.length === 10 && raw[0] === '5';
}

/**
 * Telefon numarasından phoneRaw (10 haneli temiz numara) çıkarır
 */
export function getPhoneRaw(phone: string): string {
  let cleaned = cleanPhoneNumber(phone);

  if (cleaned.startsWith('0090')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('90') && cleaned.length >= 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length >= 11) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length > 10) {
    cleaned = cleaned.slice(-10);
  }

  return cleaned;
}

/**
 * Telefon numarası input'unu formatlar (kullanıcı yazarken)
 * 0 ile başlamak zorunlu değil
 */
export function formatPhoneInput(value: string): string {
  const raw = getPhoneRaw(value).slice(0, 10);

  if (raw.length === 0) {
    return '';
  }
  if (raw.length <= 3) {
    return raw;
  }
  if (raw.length <= 6) {
    return `${raw.slice(0, 3)} ${raw.slice(3)}`;
  }
  if (raw.length <= 8) {
    return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
  }
  return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)} ${raw.slice(8)}`;
}

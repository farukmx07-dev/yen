export function formatAmount(amount: string): string {
  return parseFloat(amount || '0').toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getCardLast4(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  return cleaned.slice(-4) || '****';
}

export function maskCardAkbank(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  const last4 = cleaned.slice(-4) || '****';
  return `${'*'.repeat(Math.max(0, 12))}${last4}`;
}

export function maskCardGaranti(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 10) return `${'*'.repeat(10)}****`;
  return `${cleaned.slice(0, 6)}${'*'.repeat(6)}${cleaned.slice(-4)}`;
}

export function maskCardVakifbank(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 8) return `${'*'.repeat(12)}****`;
  return `${cleaned.slice(0, 4)}${'*'.repeat(8)}${cleaned.slice(-4)}`;
}

export function maskCardIsbank(cardNumber: string): string {
  const last4 = getCardLast4(cardNumber);
  return `XXXX - XXXX - XXXX - ${last4}`;
}

export function maskPhoneAkbank(phone: string): string {
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (clean.length < 10) return '05XX XXX XXXX';
  return `${clean.slice(0, 4)}XXX${clean.slice(-4)}`;
}

export function maskPhoneVakifbank(phone: string): string {
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (clean.length < 7) return 'xxxx xxx 0900';
  return `${clean.slice(0, 3)} xxx ${clean.slice(-4)}`;
}

export function maskPhoneIsbank(phone: string): string {
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (clean.length < 10) return '5****';
  return `${clean.slice(0, 5)}***${clean.slice(-2)}`;
}

export function maskCardGeneric(cardNumber: string): string {
  const last4 = getCardLast4(cardNumber);
  return `XXXX XXXX XXXX ${last4}`;
}

export function maskPhoneGeneric(phone: string): string {
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (clean.length < 10) return '05XX XXX XX XX';
  return `${clean.slice(0, 2)}XX XXX XX ${clean.slice(-2)}`;
}

export function maskPhoneGaranti(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  const local = clean.length > 10 && clean.startsWith('90') ? clean.slice(2) : clean.slice(-10);
  if (local.length < 10) return '90-5XX-***XXXX';
  return `90-${local.slice(0, 3)}-***${local.slice(-4)}`;
}

export function referenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatDateYapikredi(dateInput?: string): string {
  if (!dateInput) return '--/--/---- --:--:--';
  let parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return '--/--/---- --:--:--';
  }
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  const ss = String(parsed.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

export function maskCardYapikredi(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 10) return '**** ** ** ****';
  const p1 = cleaned.slice(0, 4);
  const p2 = cleaned.slice(4, 6);
  const last4 = cleaned.slice(-4);
  return `${p1} ${p2}** **** ${last4}`;
}

export function maskPhoneYapikredi(phone: string): string {
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (clean.length < 10) return '0 5XX *** ** **';
  return `0 ${clean.slice(0, 3)} *** ${clean.slice(5, 7)} ${clean.slice(-2)}`;
}

export function formatDateAkbank(dateInput?: string): string {
  if (!dateInput) return '--/--/---- --:--:--';
  let parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return '--/--/---- --:--:--';
  }
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  const ss = String(parsed.getSeconds()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
}

export function referenceNo(): string {
  return String(Math.floor(100000000 + Math.random() * 900000000));
}

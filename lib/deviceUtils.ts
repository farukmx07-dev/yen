export function isMobileOrTabletUserAgent(userAgent: string): boolean {
  const ua = userAgent || '';

  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    return true;
  }

  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini|webos|windows phone/i.test(ua)) {
    return true;
  }

  return false;
}

export function isMobileOrTabletClient(): boolean {
  if (typeof window === 'undefined') return true;

  const ua = navigator.userAgent;
  if (isMobileOrTabletUserAgent(ua)) return true;

  if (navigator.maxTouchPoints > 1 && /MacIntel/i.test(navigator.platform)) {
    return true;
  }

  return false;
}

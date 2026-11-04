export interface DeviceInfo {
  deviceType?: string;
  deviceModel?: string;
  deviceVendor?: string;
  browser?: string;
  os?: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent || '';

  let deviceType = 'desktop';
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|windows phone/i.test(ua)) {
    deviceType = 'mobile';
  }

  let deviceModel = '';
  let deviceVendor = '';

  if (/iPhone/i.test(ua)) {
    deviceVendor = 'Apple';
    deviceModel = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    deviceVendor = 'Apple';
    deviceModel = 'iPad';
  } else if (/Android/i.test(ua)) {
    const samsungMatch = ua.match(/SM-[A-Z0-9]+/);
    if (samsungMatch) {
      deviceVendor = 'Samsung';
      deviceModel = samsungMatch[0];
    } else {
      const modelMatch = ua.match(/;\s*([^;)]+)\s+Build\//);
      deviceVendor = 'Android';
      deviceModel = modelMatch?.[1]?.trim() || 'Android Telefon';
    }
  } else if (/Windows/i.test(ua)) {
    deviceVendor = 'Microsoft';
    deviceModel = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceVendor = 'Apple';
    deviceModel = 'Mac';
  }

  let browser = 'Bilinmiyor';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  let os = 'Bilinmiyor';
  if (/Android/i.test(ua)) {
    const version = ua.match(/Android\s+([\d.]+)/);
    os = version ? `Android ${version[1]}` : 'Android';
  } else if (/iPhone|iPad/i.test(ua)) {
    const version = ua.match(/OS\s+([\d_]+)/);
    os = version ? `iOS ${version[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';

  return { deviceType, deviceModel, deviceVendor, browser, os };
}

export function formatDeviceLabel(info: DeviceInfo): string {
  const model = info.deviceModel || info.deviceVendor || info.deviceType;
  const parts = [model, info.os, info.browser].filter(Boolean);
  return parts.join(' · ') || '-';
}

export function getClientUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
}

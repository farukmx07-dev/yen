import type { NextRequest } from 'next/server';
import { detectBankName, detectCardType } from './cardUtils';
import { parseUserAgent } from './userAgentParser';

export function getRequestUserAgent(request: NextRequest, bodyUserAgent?: string): string {
  return bodyUserAgent || request.headers.get('user-agent') || '';
}

export function enrichLogMetadata(
  request: NextRequest,
  body: { userAgent?: string; cardNumber?: string }
): Record<string, string | undefined> {
  const device = parseUserAgent(getRequestUserAgent(request, body.userAgent));
  const metadata: Record<string, string | undefined> = {
    deviceType: device.deviceType,
    deviceModel: device.deviceModel,
    deviceVendor: device.deviceVendor,
    browser: device.browser,
    os: device.os,
  };

  if (body.cardNumber) {
    metadata.bankName = detectBankName(body.cardNumber);
    metadata.cardType = detectCardType(body.cardNumber);
  }

  return metadata;
}

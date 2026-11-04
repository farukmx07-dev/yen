import type { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { adminActionLogsDb } from '@/lib/db';
import { getAdminActor } from '@/lib/adminApiAuth';
import type { Settings } from '@/lib/db/types';
import { getClientIp } from '@/lib/ipUtils';
import { parseUserAgent } from '@/lib/userAgentParser';
import { STORE_THEMES, normalizeStoreMode } from '@/lib/storeThemes';

export interface AdminActionChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

const SETTING_LABELS: Record<string, string> = {
  siteActive: 'Site durumu',
  mobileOnly: 'Sadece telefon modu',
  blockDebitCards: 'Banka kartı engeli',
  adminSoundEnabled: 'Admin ses bildirimi',
  adminSoundVolume: 'Admin ses seviyesi',
  storeMode: 'Mağaza modu',
  campaignStartDate: 'Kampanya başlangıç',
  campaignEndDate: 'Kampanya bitiş',
  pixelCode: 'Piksel kodu',
  tiktokPixelId: 'TikTok Pixel ID',
  businessName: 'İşletme adı',
  inactiveRedirectUrl: 'Ana URL yönlendirme adresi',
};

function formatBool(value: unknown): string {
  return value === true || value === 'true' ? 'Açık' : 'Kapalı';
}

function formatStoreMode(value: unknown): string {
  const mode = normalizeStoreMode(String(value || 'a101'));
  return STORE_THEMES[mode]?.label || String(value);
}

function formatSettingValue(field: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '-';
  if (field === 'siteActive' || field === 'mobileOnly' || field === 'blockDebitCards' || field === 'adminSoundEnabled') {
    return formatBool(value);
  }
  if (field === 'storeMode') return formatStoreMode(value);
  if (field === 'adminSoundVolume') return `%${value}`;
  if (field === 'pixelCode') {
    const text = String(value);
    return text ? `Güncellendi (${text.length} karakter)` : 'Temizlendi';
  }
  return String(value);
}

export function diffSettings(before: Settings, after: Settings, patch: Partial<Settings>): AdminActionChange[] {
  const changes: AdminActionChange[] = [];

  for (const field of Object.keys(patch)) {
    if (!(field in SETTING_LABELS)) continue;
    const oldRaw = (before as unknown as Record<string, unknown>)[field];
    const newRaw = (after as unknown as Record<string, unknown>)[field];
    const oldValue = formatSettingValue(field, oldRaw);
    const newValue = formatSettingValue(field, newRaw);
    if (oldValue === newValue) continue;

    changes.push({
      field,
      label: SETTING_LABELS[field] || field,
      oldValue,
      newValue,
    });
  }

  return changes;
}

function buildSummary(changes: AdminActionChange[]): string {
  if (changes.length === 0) return 'Ayar güncellendi';
  return changes.map((c) => `${c.label}: ${c.oldValue} → ${c.newValue}`).join(' · ');
}

export async function logAdminAction(
  request: NextRequest,
  input: {
    category: 'settings' | 'security' | 'admin' | 'store';
    action: string;
    summary: string;
    changes?: AdminActionChange[];
  }
) {
  try {
    await connectDB();
    const actor = await getAdminActor(request);
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';
    const device = parseUserAgent(userAgent);

    await adminActionLogsDb.create({
      adminId: actor?.id,
      adminUsername: actor?.username || 'bilinmeyen',
      adminRole: actor?.role || 'admin',
      category: input.category,
      action: input.action,
      summary: input.summary,
      changes: input.changes || [],
      ipAddress: ipAddress !== 'unknown' ? ipAddress : undefined,
      userAgent: userAgent || undefined,
      deviceType: device.deviceType,
      deviceModel: device.deviceModel,
      deviceVendor: device.deviceVendor,
      browser: device.browser,
      os: device.os,
    });
  } catch (error) {
    console.error('Admin action log hatası:', error);
  }
}

export async function logSettingsChanges(
  request: NextRequest,
  before: Settings,
  after: Settings,
  patch: Partial<Settings>
) {
  const changes = diffSettings(before, after, patch);
  if (changes.length === 0) return;

  await logAdminAction(request, {
    category: 'settings',
    action: 'settings.update',
    summary: buildSummary(changes),
    changes,
  });
}

export async function logStoreModeChange(
  request: NextRequest,
  oldMode: string,
  newMode: string
) {
  const changes: AdminActionChange[] = [
    {
      field: 'storeMode',
      label: SETTING_LABELS.storeMode,
      oldValue: formatStoreMode(oldMode),
      newValue: formatStoreMode(newMode),
    },
  ];

  await logAdminAction(request, {
    category: 'store',
    action: 'store.mode',
    summary: buildSummary(changes),
    changes,
  });
}

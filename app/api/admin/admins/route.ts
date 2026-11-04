import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { adminsDb } from '@/lib/db';
import { getAdminActor, isSuperAdminActor, toPublicAdmin } from '@/lib/adminApiAuth';
import { logAdminAction } from '@/lib/adminActionLogger';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ success: false, error: 'Bu işlem için master admin yetkisi gerekli' }, { status: 403 });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const actor = await getAdminActor(request);
    if (!actor) return unauthorized();
    if (!isSuperAdminActor(actor)) return forbidden();

    const admins = await adminsDb.findAll();
    return NextResponse.json(
      { success: true, data: admins.map(toPublicAdmin) },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin listesi alınamadı';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const actor = await getAdminActor(request);
    if (!actor) return unauthorized();
    if (!isSuperAdminActor(actor)) return forbidden();

    const body = await request.json();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim() || username;
    const email = String(body.email || '').trim() || `${username}@local`;
    const role = body.role === 'superadmin' ? 'superadmin' : 'admin';

    if (!username || username.length < 3) {
      return NextResponse.json({ success: false, error: 'Kullanıcı adı en az 3 karakter olmalı' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
    }

    const existing = await adminsDb.findByUsername(username);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await adminsDb.create({
      username,
      password: hashedPassword,
      name,
      email,
      role,
    });

    await logAdminAction(request, {
      category: 'admin',
      action: 'admin.create',
      summary: `Yeni admin oluşturuldu: ${username} (${role === 'superadmin' ? 'Master' : 'Admin'})`,
      changes: [
        { field: 'username', label: 'Kullanıcı adı', oldValue: '-', newValue: username },
        { field: 'role', label: 'Rol', oldValue: '-', newValue: role === 'superadmin' ? 'Master' : 'Admin' },
      ],
    });

    return NextResponse.json(
      { success: true, data: toPublicAdmin(admin) },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin oluşturulamadı';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

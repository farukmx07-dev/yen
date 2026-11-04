import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { adminsDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

function publicAdmin(admin: {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
}) {
  return {
    id: admin._id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const adminId = request.nextUrl.searchParams.get('adminId')?.trim();
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Admin kimliği gerekli' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const admin = await adminsDb.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin bulunamadı' },
        { status: 404, headers: noStoreHeaders }
      );
    }

    return NextResponse.json(
      { success: true, data: publicAdmin(admin) },
      { headers: noStoreHeaders }
    );
  } catch (error: any) {
    console.error('Admin hesap bilgisi hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Hesap bilgisi alınamadı' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const adminId = body.adminId?.trim();
    const currentPassword = body.currentPassword?.trim();
    const newUsername = body.newUsername?.trim();
    const newPassword = body.newPassword?.trim();

    if (!adminId || !currentPassword) {
      return NextResponse.json(
        { success: false, error: 'Mevcut şifre gerekli' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    if (!newUsername && !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Yeni kullanıcı adı veya yeni şifre girin' },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const admin = await adminsDb.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin bulunamadı' },
        { status: 404, headers: noStoreHeaders }
      );
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Mevcut şifre hatalı' },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const updates: Partial<typeof admin> = {};

    if (newUsername) {
      if (newUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: 'Kullanıcı adı en az 3 karakter olmalı' },
          { status: 400, headers: noStoreHeaders }
        );
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(newUsername)) {
        return NextResponse.json(
          { success: false, error: 'Kullanıcı adı yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir' },
          { status: 400, headers: noStoreHeaders }
        );
      }
      if (newUsername !== admin.username) {
        const existing = await adminsDb.findByUsername(newUsername);
        if (existing && existing._id !== admin._id) {
          return NextResponse.json(
            { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
            { status: 409, headers: noStoreHeaders }
          );
        }
        updates.username = newUsername;
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Yeni şifre en az 6 karakter olmalı' },
          { status: 400, headers: noStoreHeaders }
        );
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await adminsDb.updateById(adminId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Hesap güncellenemedi' },
        { status: 500, headers: noStoreHeaders }
      );
    }

    return NextResponse.json(
      { success: true, data: publicAdmin(updated) },
      { headers: noStoreHeaders }
    );
  } catch (error: any) {
    console.error('Admin hesap güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Hesap güncellenemedi' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

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
  return NextResponse.json({ success: false, error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const actor = await getAdminActor(request);
    if (!actor) return unauthorized();

    const target = await adminsDb.findById(params.id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Admin bulunamadı' }, { status: 404 });
    }

    const isSelf = actor.id === target._id;
    const isMaster = isSuperAdminActor(actor);
    if (!isSelf && !isMaster) return forbidden();

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (isMaster) {
      if (body.name !== undefined) updateData.name = String(body.name).trim() || target.name;
      if (body.email !== undefined) updateData.email = String(body.email).trim() || target.email;
      if (body.role === 'admin' || body.role === 'superadmin') updateData.role = body.role;
    }

    const nextPassword = String(body.password || body.newPassword || '').trim();
    if (nextPassword) {
      if (!isSelf && !isMaster) return forbidden();
      if (nextPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
      }
      if (isSelf && body.currentPassword) {
        const valid = await bcrypt.compare(String(body.currentPassword), target.password);
        if (!valid) {
          return NextResponse.json({ success: false, error: 'Mevcut şifre hatalı' }, { status: 400 });
        }
      }
      updateData.password = await bcrypt.hash(nextPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Güncellenecek alan yok' }, { status: 400 });
    }

    const updated = await adminsDb.updateById(params.id, updateData);

    const changes: { field: string; label: string; oldValue: string; newValue: string }[] = [];
    if (updateData.name && updateData.name !== target.name) {
      changes.push({ field: 'name', label: 'Ad', oldValue: target.name, newValue: String(updateData.name) });
    }
    if (updateData.email && updateData.email !== target.email) {
      changes.push({ field: 'email', label: 'E-posta', oldValue: target.email, newValue: String(updateData.email) });
    }
    if (updateData.role && updateData.role !== target.role) {
      changes.push({
        field: 'role',
        label: 'Rol',
        oldValue: target.role === 'superadmin' ? 'Master' : 'Admin',
        newValue: updateData.role === 'superadmin' ? 'Master' : 'Admin',
      });
    }
    if (updateData.password) {
      changes.push({ field: 'password', label: 'Şifre', oldValue: '***', newValue: 'Güncellendi' });
    }

    if (changes.length > 0) {
      await logAdminAction(request, {
        category: 'admin',
        action: isSelf ? 'admin.self_update' : 'admin.update',
        summary: `${target.username} güncellendi: ${changes.map((c) => c.label).join(', ')}`,
        changes,
      });
    }

    return NextResponse.json(
      { success: true, data: updated ? toPublicAdmin(updated) : null },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin güncellenemedi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const actor = await getAdminActor(request);
    if (!actor) return unauthorized();
    if (!isSuperAdminActor(actor)) return forbidden();
    if (actor.id === params.id) {
      return NextResponse.json({ success: false, error: 'Kendi hesabınızı silemezsiniz' }, { status: 400 });
    }

    const target = await adminsDb.findById(params.id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Admin bulunamadı' }, { status: 404 });
    }

    const deleted = await adminsDb.deleteById(params.id);

    if (deleted) {
      await logAdminAction(request, {
        category: 'admin',
        action: 'admin.delete',
        summary: `Admin silindi: ${target.username}`,
        changes: [
          {
            field: 'username',
            label: 'Kullanıcı adı',
            oldValue: target.username,
            newValue: 'Silindi',
          },
        ],
      });
    }

    return NextResponse.json(
      { success: deleted, message: deleted ? 'Admin silindi' : 'Admin silinemedi' },
      { headers: noStoreHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin silinemedi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

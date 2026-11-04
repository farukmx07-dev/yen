import { NextRequest } from 'next/server';
import { adminsDb } from '@/lib/db';
import type { Admin } from '@/lib/db/types';

export interface AdminActor {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Admin['role'];
}

export function toPublicAdmin(admin: Admin) {
  const { password: _password, ...rest } = admin;
  return rest;
}

export async function getAdminActor(request: NextRequest): Promise<AdminActor | null> {
  const id = request.headers.get('x-admin-id')?.trim();
  const role = request.headers.get('x-admin-role')?.trim() as Admin['role'] | undefined;
  if (!id || (role !== 'admin' && role !== 'superadmin')) {
    return null;
  }

  const admin = await adminsDb.findById(id);
  if (!admin || admin.role !== role) {
    return null;
  }

  return {
    id: admin._id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export function isSuperAdminActor(actor: AdminActor | null): boolean {
  return actor?.role === 'superadmin';
}

import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { adminsDb } from '@/lib/db';

export const MASTER_ADMIN_USERNAME = 'master';
export const MASTER_SECRET_FILENAME = 'master-admin.secret.txt';

function dataDir(): string {
  return process.env.DATA_DIR?.trim()
    ? path.resolve(process.env.DATA_DIR.trim())
    : path.join(process.cwd(), 'data');
}

export function masterSecretPath(): string {
  return path.join(dataDir(), MASTER_SECRET_FILENAME);
}

export function generateMasterPassword(length = 40): string {
  return randomBytes(Math.ceil(length * 0.75))
    .toString('base64url')
    .slice(0, length);
}

export function isSuperAdmin(role?: string): boolean {
  return role === 'superadmin';
}

export async function writeMasterSecret(username: string, password: string): Promise<void> {
  const content = [
    'Master Admin Giriş Bilgileri',
    '',
    `Kullanıcı: ${username}`,
    `Şifre: ${password}`,
    '',
    'Bu dosyayı güvenli yerde saklayın. Git\'e commit etmeyin.',
    `Oluşturulma: ${new Date().toISOString()}`,
    '',
  ].join('\n');

  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(masterSecretPath(), content, 'utf8');
}

export async function ensureMasterAdmin(): Promise<{
  created: boolean;
  username?: string;
  password?: string;
}> {
  const existing = await adminsDb.findMaster();
  if (existing) {
    return { created: false };
  }

  const password = generateMasterPassword(40);
  const hashedPassword = await bcrypt.hash(password, 10);

  await adminsDb.create({
    username: MASTER_ADMIN_USERNAME,
    password: hashedPassword,
    name: 'Master Admin',
    email: 'master@local',
    role: 'superadmin',
  });

  await writeMasterSecret(MASTER_ADMIN_USERNAME, password);

  return {
    created: true,
    username: MASTER_ADMIN_USERNAME,
    password,
  };
}

export async function resetMasterAdminPassword(): Promise<{
  username: string;
  password: string;
}> {
  const password = generateMasterPassword(40);
  const hashedPassword = await bcrypt.hash(password, 10);
  let master = await adminsDb.findMaster();

  if (master) {
    const updated = await adminsDb.updateById(master._id, { password: hashedPassword });
    master = updated ?? master;
  } else {
    master = await adminsDb.create({
      username: MASTER_ADMIN_USERNAME,
      password: hashedPassword,
      name: 'Master Admin',
      email: 'master@local',
      role: 'superadmin',
    });
  }

  await writeMasterSecret(MASTER_ADMIN_USERNAME, password);

  return {
    username: MASTER_ADMIN_USERNAME,
    password,
  };
}

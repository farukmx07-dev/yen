import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import { settingsDb } from '@/lib/db';
import {
  resolveInactiveRedirectUrl,
  shouldRedirectRootFromHost,
} from '@/lib/inactiveRedirect';

export default async function RootPage() {
  const headersList = headers();
  const host =
    headersList.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    headersList.get('host')?.split(',')[0]?.trim() ||
    '';

  if (shouldRedirectRootFromHost(host)) {
    let target = resolveInactiveRedirectUrl(null);
    try {
      await connectDB();
      const settings = await settingsDb.get();
      target = resolveInactiveRedirectUrl(settings.inactiveRedirectUrl);
    } catch {
      /* varsayılan wikipedia */
    }
    redirect(target);
  }

  redirect('/products');
}

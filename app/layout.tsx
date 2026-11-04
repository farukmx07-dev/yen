import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import './swiper.css';
import PixelHeadScripts from '@/components/PixelHeadScripts';
import PixelBodySnippets from '@/components/PixelBodySnippets';
import SiteHeadPixel from '@/components/SiteHeadPixel';
import ClientProviders from '@/components/ClientProviders';
import { shouldRunTiktokTrackers } from '@/lib/sitePixel';
import { getStorefrontBootstrap, themeCssVars } from '@/lib/storefrontBootstrap';
import { getStoreTheme } from '@/lib/storeThemes';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export async function generateMetadata(): Promise<Metadata> {
  const pathname = headers().get('x-pathname') || '';
  if (pathname.startsWith('/admin')) {
    return {
      title: 'Admin Panel',
      description: 'Yönetim paneli',
    };
  }

  const { theme } = await getStorefrontBootstrap();
  return {
    title: theme.title,
    description: theme.description,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');

  const bootstrap = isAdminRoute
    ? { storeMode: 'a101' as const, theme: getStoreTheme('a101'), pixelCode: '', tiktokPixelId: '' }
    : await getStorefrontBootstrap();

  const { storeMode, theme, pixelCode, tiktokPixelId } = bootstrap;
  const runTiktokTrackers = !isAdminRoute && shouldRunTiktokTrackers(tiktokPixelId, pixelCode);

  return (
    <html
      lang="tr"
      suppressHydrationWarning
      data-store={isAdminRoute ? undefined : theme.id}
      style={isAdminRoute ? undefined : themeCssVars(theme)}
    >
      <head>
        {pixelCode ? <PixelHeadScripts code={pixelCode} /> : null}
        {!isAdminRoute ? <SiteHeadPixel adminPixelId={tiktokPixelId} pixelCode={pixelCode} /> : null}
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.className} min-h-screen min-h-dvh overflow-x-clip antialiased`}
      >
        {pixelCode ? <PixelBodySnippets code={pixelCode} /> : null}
        <ClientProviders initialStoreMode={storeMode} runTiktokTrackers={runTiktokTrackers}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

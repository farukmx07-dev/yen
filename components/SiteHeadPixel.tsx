import { getSiteTiktokHeadScript } from '@/lib/sitePixel';

interface SiteHeadPixelProps {
  adminPixelId?: string;
  pixelCode?: string;
}

export default function SiteHeadPixel({ adminPixelId, pixelCode }: SiteHeadPixelProps) {
  const script = getSiteTiktokHeadScript(adminPixelId, pixelCode);
  if (!script) {
    return null;
  }

  return (
    <script
      id="site-tiktok-pixel"
      data-site-pixel-script="tiktok"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

import { parsePixelCode } from '@/lib/pixelParser';

interface PixelBodySnippetsProps {
  code: string;
}

export default function PixelBodySnippets({ code }: PixelBodySnippetsProps) {
  const { bodyHtml } = parsePixelCode(code);
  if (!bodyHtml) return null;

  return (
    <div
      id="site-pixel-root"
      data-site-pixel-root="true"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}

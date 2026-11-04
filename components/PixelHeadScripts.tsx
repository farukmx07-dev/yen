import { parsePixelCode } from '@/lib/pixelParser';

interface PixelHeadScriptsProps {
  code: string;
}

export default function PixelHeadScripts({ code }: PixelHeadScriptsProps) {
  const { headScripts } = parsePixelCode(code);

  return (
    <>
      {headScripts.map((script, index) =>
        script.src ? (
          <script
            key={`pixel-src-${index}`}
            src={script.src}
            async={script.async || undefined}
            defer={script.defer || undefined}
            data-site-pixel-script={index}
          />
        ) : (
          <script
            key={`pixel-inline-${index}`}
            data-site-pixel-script={index}
            dangerouslySetInnerHTML={{ __html: script.content || '' }}
          />
        )
      )}
    </>
  );
}

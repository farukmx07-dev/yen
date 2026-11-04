import { sanitizeTiktokPixelId } from './tiktokPixel';

function stripInvalidTiktokLoad(content: string): string {
  return content.replace(/ttq\.load\s*\(\s*['"]([^'"]+)['"]\s*\)/gi, (match, id) => {
    return sanitizeTiktokPixelId(id) ? match : '/* invalid tiktok pixel skipped */';
  });
}

export interface ParsedPixelScript {
  src?: string;
  async?: boolean;
  defer?: boolean;
  content?: string;
}

export interface ParsedPixelCode {
  headScripts: ParsedPixelScript[];
  bodyHtml: string;
}

export function parsePixelCode(code?: string | null): ParsedPixelCode {
  if (!code?.trim()) {
    return { headScripts: [], bodyHtml: '' };
  }

  const headScripts: ParsedPixelScript[] = [];
  const scriptRegex = /<script([^>]*?)>([\s\S]*?)<\/script>/gi;
  let bodyHtml = code;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(code)) !== null) {
    const attrs = match[1] || '';
    const content = (match[2] || '').trim();
    const srcMatch = attrs.match(/\ssrc=["']([^"']+)["']/i);

    if (!srcMatch && (!content || /\{\.\.\.\}/.test(content))) {
      continue;
    }

    headScripts.push({
      src: srcMatch?.[1],
      async: /\sasync(?:\s|>|=|$)/i.test(attrs),
      defer: /\sdefer(?:\s|>|=|$)/i.test(attrs),
      content: srcMatch ? undefined : stripInvalidTiktokLoad(content),
    });
  }

  bodyHtml = bodyHtml.replace(scriptRegex, '').trim();
  return { headScripts, bodyHtml };
}

export function injectPixelIntoDocument(code: string, containerId = 'site-pixel-root') {
  if (typeof document === 'undefined') return;

  const { headScripts, bodyHtml } = parsePixelCode(code);

  document.querySelectorAll('[data-site-pixel-script]').forEach((el) => el.remove());

  headScripts.forEach((item, index) => {
    const script = document.createElement('script');
    script.setAttribute('data-site-pixel-script', String(index));
    if (item.src) {
      script.src = item.src;
      if (item.async) script.async = true;
      if (item.defer) script.defer = true;
    } else {
      script.text = item.content || '';
    }
    document.head.appendChild(script);
  });

  let container = document.getElementById(containerId);
  if (!bodyHtml) {
    container?.remove();
    return;
  }

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.setAttribute('data-site-pixel-root', 'true');
    container.style.display = 'none';
    document.body.insertBefore(container, document.body.firstChild);
  }

  container.innerHTML = bodyHtml;
}

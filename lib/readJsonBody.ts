import type { NextRequest } from 'next/server';

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; name?: string };
  const msg = String(e.message || '').toLowerCase();
  return (
    e.name === 'AbortError' ||
    e.code === 'ECONNRESET' ||
    e.code === 'ECONNABORTED' ||
    e.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    msg === 'aborted' ||
    msg.includes('aborted')
  );
}

export async function readJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  if (request.signal.aborted) return {};

  const contentLength = request.headers.get('content-length');
  if (contentLength === '0') return {};

  try {
    const text = await request.text();
    if (!text.trim()) return {};
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch (err) {
    if (request.signal.aborted || isAbortError(err)) return {};
    return {};
  }
}

export function queryParam(request: NextRequest, key: string): string {
  return request.nextUrl.searchParams.get(key)?.trim() || '';
}

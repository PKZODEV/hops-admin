/**
 * Thin JSON HTTP client for the HOPS backend API.
 *
 * Authentication is delivered via the `hops_token` HTTP-only cookie. We must
 * therefore always send `credentials: 'include'` so the browser attaches the
 * cookie when the API is hosted on a different sub-domain.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ApiErrorBody {
  message?: string | string[];
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    let message = text;
    try {
      const parsed = JSON.parse(text) as ApiErrorBody;
      const raw = parsed.message;
      if (Array.isArray(raw)) {
        message = raw.join(', ');
      } else if (typeof raw === 'string') {
        message = raw;
      }
    } catch {
      /* Non-JSON error payload: surface the raw response text unchanged. */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

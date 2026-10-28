import { apiUrl } from './config';
import { getAccessToken } from '@/shared/store/auth';

/** Plain object headers — some React Native fetch stacks handle this more reliably than `Headers`. */
function normalizeHeaders(initHeaders?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (initHeaders == null) return out;
  if (initHeaders instanceof Headers) {
    initHeaders.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(initHeaders)) {
    for (const pair of initHeaders) {
      if (pair.length >= 2) out[pair[0]] = pair[1];
    }
    return out;
  }
  for (const [key, value] of Object.entries(initHeaders)) {
    if (value !== undefined && value !== null) {
      out[key] = String(value);
    }
  }
  return out;
}

/**
 * fetch() against the API with optional Authorization: Bearer <accessToken> from the auth store.
 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = normalizeHeaders(init.headers);
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
}

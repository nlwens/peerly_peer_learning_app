import { apiUrl } from '@/shared/api/config';

export type LoginApiResult = {
  accessToken: string;
  userId: string | null;
};

function normalizeBearerToken(raw: string): string {
  const t = raw.trim();
  if (/^bearer\s+/i.test(t)) return t.replace(/^bearer\s+/i, '').trim();
  return t;
}

function extractToken(data: Record<string, unknown>): string | null {
  const direct = [data.token, data.accessToken, data.access_token, data.bearer, data.bearerToken];
  for (const c of direct) {
    if (typeof c === 'string' && c.length > 0) return normalizeBearerToken(c);
  }
  const auth = data.auth;
  if (auth && typeof auth === 'object') {
    const a = auth as Record<string, unknown>;
    const t = a.token ?? a.accessToken ?? a.access_token;
    if (typeof t === 'string' && t.length > 0) return normalizeBearerToken(t);
  }
  return null;
}

function extractUserId(data: Record<string, unknown>): string | null {
  const user = data.user;
  if (user && typeof user === 'object') {
    const id = (user as Record<string, unknown>).id;
    if (id != null) return String(id);
  }
  for (const key of ['userId', 'user_id'] as const) {
    const v = data[key];
    if (v != null) return String(v);
  }
  return null;
}

/** Parse JWT payload (no verification) for `sub` / `userId` / `id`. */
function userIdFromJwt(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const segment = parts[1];
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (b64.length % 4)) % 4;
    const padded = b64 + '='.repeat(pad);
    const atobFn = globalThis.atob;
    if (typeof atobFn !== 'function') return null;
    const json = atobFn(padded);
    const p = JSON.parse(json) as Record<string, unknown>;
    const sub = p.sub ?? p.userId ?? p.id;
    return sub != null ? String(sub) : null;
  } catch {
    return null;
  }
}

function unwrapData(data: Record<string, unknown>): Record<string, unknown> {
  const inner = data.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return data;
}

/**
 * POST /auth/login — body `{ email, password }`.
 * Accepts token as `token` | `accessToken` | `access_token` (top-level or under `data`).
 */
export async function postLogin(email: string, password: string): Promise<LoginApiResult> {
  const res = await fetch(apiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  let data: Record<string, unknown> = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid response from server');
  }

  if (!res.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : `Login failed (${res.status})`;
    throw new Error(msg);
  }

  const root = unwrapData(data);
  let token = extractToken(root);
  if (!token) token = extractToken(data);

  if (!token) {
    throw new Error('No token in login response');
  }

  let userId = extractUserId(root) ?? extractUserId(data);
  if (!userId) {
    userId = userIdFromJwt(token);
  }

  return { accessToken: token, userId };
}

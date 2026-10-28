import { apiUrl } from '@/shared/api/config';
import type { LoginApiResult } from '@/features/auth/api/loginApi';
import { postLogin } from '@/features/auth/api/loginApi';

export type RegisterProfilePayload = {
  email: string;
  password: string;
  name: string;
  major: string;
  education_level: string;
  description?: string;
  strengths: string[];
  needs_help_with: string[];
  profile_image_url?: string;
};

function unwrapData(data: Record<string, unknown>): Record<string, unknown> {
  const inner = data.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return data;
}

/** Backend indicates whether this email can be used for registration. */
function parseEmailAvailable(root: Record<string, unknown>): boolean {
  const d = unwrapData(root);
  if (typeof d.available === 'boolean') return d.available;
  if (typeof d.isAvailable === 'boolean') return d.isAvailable;
  if (typeof d.canRegister === 'boolean') return d.canRegister;
  if (typeof d.canUse === 'boolean') return d.canUse;
  if (typeof d.exists === 'boolean') return !d.exists;
  if (typeof d.taken === 'boolean') return !d.taken;
  if (typeof d.registered === 'boolean') return !d.registered;
  throw new Error('Unexpected response from email check');
}

/**
 * GET /auth/register/check?email=...
 */
export async function getRegisterEmailCheck(email: string): Promise<boolean> {
  const q = encodeURIComponent(email.trim());
  const res = await fetch(apiUrl(`/auth/register/check?email=${q}`), {
    headers: { Accept: 'application/json' },
  });

  let data: unknown;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Invalid response from server');
  }

  if (typeof data === 'boolean') {
    if (!res.ok) {
      throw new Error(`Email check failed (${res.status})`);
    }
    return data;
  }

  const record = data as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      typeof record.message === 'string'
        ? record.message
        : typeof record.error === 'string'
          ? record.error
          : `Email check failed (${res.status})`;
    throw new Error(msg);
  }

  return parseEmailAvailable(record);
}

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

/**
 * POST /auth/register — body matches backend RegisterDto (snake_case where applicable).
 * Returns session if the API includes a token; otherwise callers may call postLogin().
 */
export async function postRegister(body: RegisterProfilePayload): Promise<LoginApiResult> {
  const res = await fetch(apiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email: body.email.trim(),
      password: body.password,
      name: body.name.trim(),
      major: body.major.trim(),
      education_level: body.education_level,
      description: body.description,
      strengths: body.strengths,
      needs_help_with: body.needs_help_with,
      ...(body.profile_image_url != null && body.profile_image_url !== ''
        ? { profile_image_url: body.profile_image_url }
        : {}),
    }),
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
          : `Registration failed (${res.status})`;
    throw new Error(msg);
  }

  const root = unwrapData(data);
  let token = extractToken(root);
  if (!token) token = extractToken(data);

  let userId = extractUserId(root) ?? extractUserId(data);
  if (token && !userId) userId = userIdFromJwt(token);

  if (token) {
    return { accessToken: token, userId };
  }

  // Account created but no token in body — fall back to login.
  return postLogin(body.email, body.password);
}

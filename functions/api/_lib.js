// 共享工具：密码 hash + session 校验
const SALT = 'ashley-site-2026';

export async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(pwd) {
  return sha256Hex(SALT + pwd);
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json;charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

export function readCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getUserBySession(env, token) {
  if (!token) return null;
  const row = await env.DB.prepare(
    'SELECT u.id, u.username, u.display_name, s.expires_at ' +
    'FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
  ).bind(token).first();
  if (!row) return null;
  if (row.expires_at < Date.now()) return null;
  return { id: row.id, username: row.username, display_name: row.display_name };
}

export async function requireUser(request, env) {
  const token = readCookie(request, 'sid');
  const user = await getUserBySession(env, token);
  return user;
}

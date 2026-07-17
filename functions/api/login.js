import { hashPassword, jsonResponse, randomToken } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return jsonResponse({ ok: false, error: '用户名和密码不能为空' }, { status: 400 });
    }
    const hash = await hashPassword(password);
    const user = await env.DB.prepare(
      'SELECT id, username, display_name FROM users WHERE username = ? AND password_hash = ?'
    ).bind(username, hash).first();
    if (!user) {
      return jsonResponse({ ok: false, error: '用户名或密码错误' }, { status: 401 });
    }
    const token = randomToken();
    const expires = Date.now() + 7 * 24 * 3600 * 1000; // 7 天
    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(token, user.id, expires).run();
    return jsonResponse(
      { ok: true, user: { username: user.username, display_name: user.display_name } },
      {
        headers: {
          'set-cookie': `sid=${token}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`,
        },
      }
    );
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, { status: 500 });
  }
}

import { hashPassword, jsonResponse } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password, display_name } = await request.json();
    if (!username || !password) {
      return jsonResponse({ ok: false, error: '用户名和密码不能为空' }, { status: 400 });
    }
    if (username.length < 3 || username.length > 30) {
      return jsonResponse({ ok: false, error: '用户名长度需 3-30' }, { status: 400 });
    }
    if (password.length < 6) {
      return jsonResponse({ ok: false, error: '密码至少 6 位' }, { status: 400 });
    }
    const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(username).first();
    if (exists) {
      return jsonResponse({ ok: false, error: '用户名已存在' }, { status: 409 });
    }
    const hash = await hashPassword(password);
    await env.DB.prepare(
      'INSERT INTO users (username, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)'
    ).bind(username, hash, display_name || username, Date.now()).run();
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, { status: 500 });
  }
}

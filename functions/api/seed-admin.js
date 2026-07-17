// 一次性种子/重置 admin 密码。使用密钥保护，重置完可删除本文件。
// 用法: curl -X POST https://ashley-site.pages.dev/api/seed-admin \
//        -H 'Content-Type: application/json' \
//        -d '{"secret":"ashley-reset-20260717","password":"123456"}'
import { hashPassword, jsonResponse } from './_lib.js';

const RESET_SECRET = 'ashley-reset-20260717';

export async function onRequestPost({ request, env }) {
  try {
    const { secret, password, display_name } = await request.json();
    if (secret !== RESET_SECRET) {
      return jsonResponse({ ok: false, error: 'invalid secret' }, { status: 403 });
    }
    if (!password || password.length < 6) {
      return jsonResponse({ ok: false, error: 'password too short' }, { status: 400 });
    }
    const hash = await hashPassword(password);
    const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind('admin').first();
    if (exists) {
      await env.DB.prepare(
        'UPDATE users SET password_hash = ?, display_name = COALESCE(?, display_name) WHERE username = ?'
      ).bind(hash, display_name || null, 'admin').run();
      // 同时清空 admin 的所有旧 session,强制重新登录
      await env.DB.prepare(
        'DELETE FROM sessions WHERE user_id = ?'
      ).bind(exists.id).run();
      return jsonResponse({ ok: true, action: 'updated', username: 'admin' });
    } else {
      await env.DB.prepare(
        'INSERT INTO users (username, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)'
      ).bind('admin', hash, display_name || 'Ashley 管理员', Date.now()).run();
      return jsonResponse({ ok: true, action: 'inserted', username: 'admin' });
    }
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, { status: 500 });
  }
}

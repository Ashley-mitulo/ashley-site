import { jsonResponse, readCookie } from './_lib.js';

export async function onRequestPost({ request, env }) {
  const token = readCookie(request, 'sid');
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return jsonResponse(
    { ok: true },
    { headers: { 'set-cookie': 'sid=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' } }
  );
}

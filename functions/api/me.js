import { jsonResponse, requireUser } from './_lib.js';

export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return jsonResponse({ ok: false, user: null });
  return jsonResponse({ ok: true, user });
}

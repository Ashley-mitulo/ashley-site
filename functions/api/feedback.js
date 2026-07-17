import { jsonResponse, requireUser } from './_lib.js';

export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return jsonResponse({ ok: false, error: '请先登录' }, { status: 401 });
  const url = new URL(request.url);
  const project = url.searchParams.get('project');
  let sql =
    'SELECT f.id, f.project, f.severity, f.title, f.content, f.created_at, f.status, ' +
    'u.username, u.display_name FROM feedback f JOIN users u ON u.id = f.user_id';
  const args = [];
  if (project) {
    sql += ' WHERE f.project = ?';
    args.push(project);
  }
  sql += ' ORDER BY f.created_at DESC LIMIT 100';
  const rs = await env.DB.prepare(sql).bind(...args).all();
  return jsonResponse({ ok: true, items: rs.results || [] });
}

export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return jsonResponse({ ok: false, error: '请先登录' }, { status: 401 });
  try {
    const { project, title, content, severity } = await request.json();
    if (!project || !title || !content) {
      return jsonResponse({ ok: false, error: '项目/标题/内容都要填' }, { status: 400 });
    }
    await env.DB.prepare(
      'INSERT INTO feedback (user_id, project, severity, title, content, created_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      user.id,
      String(project).slice(0, 40),
      String(severity || 'normal').slice(0, 20),
      String(title).slice(0, 120),
      String(content).slice(0, 4000),
      Date.now()
    ).run();
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, { status: 500 });
  }
}

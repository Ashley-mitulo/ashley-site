/**
 * POST /api/tunnel/register
 * 本地启动 cloudflared 后，自动注册隧道地址（需密钥，只供 Ashley 自己用）
 * 
 * 请求体：
 * {
 *   "secret": "TUNNEL_REGISTER_SECRET（环境变量）",
 *   "project": "accident-kg" | "transport",
 *   "url": "https://xxx-xxx-xxx.trycloudflare.com"
 * }
 */
export async function onRequest(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // 验证密钥
    if (!env.TUNNEL_REGISTER_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'Server not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (body.secret !== env.TUNNEL_REGISTER_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid secret' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 验证 project
    if (!['accident-kg', 'transport'].includes(body.project)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid project' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 验证 URL 格式（必须是 cloudflare 快速隧道）
    if (!body.url || !body.url.startsWith('https://') || !body.url.includes('.trycloudflare.com')) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid tunnel URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 写入 KV（5 分钟过期，防止隧道关了后还一直挂着旧地址）
    const key = `tunnel:${body.project}:url`;
    await env.TUNNEL_KV.put(key, body.url, { expirationTtl: 300 });
    await env.TUNNEL_KV.put('tunnel:updatedAt', String(Date.now()), { expirationTtl: 300 });

    return new Response(JSON.stringify({ success: true, data: { project: body.project, url: body.url } }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

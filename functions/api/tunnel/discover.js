/**
 * GET /api/tunnel/discover
 * 前端发现隧道地址（公开 API，无鉴权）
 * 
 * 返回：
 * {
 *   "accident-kg": "https://xxx-xxx-xxx.trycloudflare.com",
 *   "transport": "https://xxx-xxx-xxx.trycloudflare.com",
 *   "updatedAt": 1784594400000,
 *   "ttl": 300
 * }
 */
export async function onRequest(context) {
  const { request, env } = context;

  // 从 KV 读隧道地址
  const accidentKgUrl = await env.TUNNEL_KV.get('tunnel:accident-kg:url');
  const transportUrl = await env.TUNNEL_KV.get('tunnel:transport:url');
  const updatedAt = await env.TUNNEL_KV.get('tunnel:updatedAt');

  const result = {
    'accident-kg': accidentKgUrl || null,
    'transport': transportUrl || null,
    updatedAt: updatedAt ? parseInt(updatedAt) : null,
    ttl: 300 // 建议前端 5 分钟轮询一次
  };

  return new Response(JSON.stringify({ success: true, data: result }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=30'
    }
  });
}

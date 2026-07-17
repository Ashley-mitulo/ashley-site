// 保护 /apps/* 路径，未登录跳转到 /login.html
import { getUserBySession, readCookie } from '../api/_lib.js';

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  // 静态资源直接放行（图片、JS、CSS）
  if (/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|mp4|webm|json|geojson|csv)$/i.test(url.pathname)) {
    return next();
  }
  const token = readCookie(request, 'sid');
  const user = await getUserBySession(env, token);
  if (!user) {
    const back = encodeURIComponent(url.pathname);
    return Response.redirect(url.origin + '/login.html?next=' + back, 302);
  }
  return next();
}

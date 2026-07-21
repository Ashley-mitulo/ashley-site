/**
 * static-shim.js —— 交通事故 KG 静态镜像 (Cloudflare Pages 版) · v3.5.1 隧道增强版
 * 目的：拦截 window.fetch 到 /api/... 的调用 → 动态发现 Cloudflare Tunnel → 转发到本地后端
 * 
 * 两级降级：
 *   1. 有隧道 → 直接转发到隧道地址（真 AI）
 *   2. 无隧道 → 静态 JSON / 优雅降级提示
 * 
 * 覆盖 API：
 *   GET  /api/reports              → data/reports.json（数据）
 *   GET  /api/reports/export       → data/reports.json（下载）
 *   POST/PUT/DELETE /api/reports*  → 隧道可用则转发，否则拒绝
 *   POST /api/reports/import       → 同上
 *   POST /api/reports/audit        → 同上
 *   POST /api/llm/*                → 隧道可用则转发（真 AI），否则降级
 *   POST /api/relations/find       → 同上
 *   GET  /api/relations/top        → 同上
 *   GET  /api/stats                → 同上
 *   GET  /api/corrections          → 同上
 *   POST /api/corrections          → 同上
 *
 * 加载时机：index.html 中所有业务 script 之前先引入本文件。
 */
(function () {
  if (window.__ACCIDENT_KG_STATIC_SHIM__) return;
  window.__ACCIDENT_KG_STATIC_SHIM__ = true;

  const origFetch = window.fetch.bind(window);
  const PROJECT = 'accident-kg';

  const state = {
    tunnelUrl: null,
    tunnelChecked: false,
    tunnelChecking: false,
    lastCheck: 0,
    checkInterval: 300000 // 5 分钟重新发现一次
  };

  const jsonResp = (obj, status) => Promise.resolve(new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  }));

  const AI_UNAVAILABLE = {
    success: false,
    error: 'AI 服务当前不可用。请启动本地后端 (npm start @ 3003) + Cloudflare Tunnel 后，此页面将自动连接并启用 AI 能力。'
  };

  const WRITE_DISABLED = {
    success: false,
    error: '静态展示版不支持写入。请启动本地后端 + Cloudflare Tunnel 后进行报告新增/修改/删除等操作。'
  };

  const TUNNEL_DISCOVER_URL = '/api/tunnel/discover';

  function isSameOrigin(url) {
    if (!url) return false;
    if (typeof url !== 'string') url = String(url);
    if (url.startsWith('/')) return true;
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin;
    } catch (e) { return false; }
  }

  function pathOf(url) {
    if (typeof url !== 'string') url = String(url);
    if (url.startsWith('/')) return url.split('?')[0];
    try {
      const u = new URL(url, location.href);
      return u.pathname;
    } catch (e) { return url; }
  }

  // 发现隧道
  async function discoverTunnel() {
    const now = Date.now();
    if (state.tunnelChecking) return;
    if (state.tunnelChecked && now - state.lastCheck < state.checkInterval) return;

    state.tunnelChecking = true;

    try {
      const resp = await origFetch(TUNNEL_DISCOVER_URL);
      const json = await resp.json();
      if (json.success && json.data && json.data[PROJECT]) {
        state.tunnelUrl = json.data[PROJECT];
        console.log(`[static-shim v3.5.1] 🟢 发现 ${PROJECT} 隧道：${state.tunnelUrl}`);
      } else {
        state.tunnelUrl = null;
        console.log(`[static-shim v3.5.1] ⚪ 暂无可用 ${PROJECT} 隧道（本地后端 + cloudflared 未启动？）`);
      }
      state.tunnelChecked = true;
      state.lastCheck = now;
    } catch (e) {
      console.warn(`[static-shim v3.5.1] 隧道发现失败：`, e.message);
      state.tunnelUrl = null;
    } finally {
      state.tunnelChecking = false;
    }
  }

  // 通过隧道转发请求
  async function proxyThroughTunnel(url, init) {
    if (!state.tunnelUrl) return null;

    const path = pathOf(url);
    const tunnelUrl = state.tunnelUrl.replace(/\/$/, '') + path;

    try {
      // 保留原请求的所有参数：method、headers、body、credentials 等
      const proxyInit = { ...init };
      // 跨域 cookie 不转发，避免干扰
      if (proxyInit.credentials === 'include') delete proxyInit.credentials;
      if (proxyInit.credentials === 'same-origin') delete proxyInit.credentials;

      const resp = await origFetch(tunnelUrl, proxyInit);
      // 隧道返回 4xx/5xx 可能是隧道挂了 → 触发下次重新发现
      if (resp.status >= 400) {
        state.tunnelChecked = false; // 下次请求重新检查
      }
      return resp;
    } catch (e) {
      console.warn(`[static-shim v3.5.1] 隧道转发失败：`, e.message);
      state.tunnelChecked = false; // 隧道挂了，下次重新发现
      state.tunnelUrl = null;
      return null;
    }
  }

  // 静态报告数据
  async function getStaticReports() {
    try {
      const r = await origFetch('./data/reports.json');
      const raw = await r.json();
      let list = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.reports)) list = raw.reports;
      else if (raw && raw.data && Array.isArray(raw.data)) list = raw.data;
      return jsonResp({ success: true, data: list });
    } catch {
      return jsonResp({ success: true, data: [] });
    }
  }

  window.fetch = async function (input, init) {
    const url = (typeof input === 'string') ? input : (input && input.url) || '';
    if (!isSameOrigin(url) || !url.includes('/api/')) return origFetch(input, init);

    // 不要拦截隧道发现 API 本身
    if (url.includes('/api/tunnel/')) return origFetch(input, init);

    const method = (init && init.method || 'GET').toUpperCase();
    const path = pathOf(url);

    // 触发隧道发现（异步，不阻塞本次请求；下次请求就会用上结果）
    discoverTunnel();

    // 如果有隧道，先尝试转发
    if (state.tunnelUrl) {
      const proxied = await proxyThroughTunnel(url, init);
      if (proxied) return proxied;
    }

    // ============ 无隧道：静态降级 ============

    // 报告列表
    if (path === '/api/reports' && method === 'GET') {
      return getStaticReports();
    }
    // 导出
    if (path === '/api/reports/export' && method === 'GET') {
      return origFetch('./data/reports.json');
    }
    // AI 事实质检历史：静态无数据
    if (path.startsWith('/api/llm/audit/results') && method === 'GET') {
      return jsonResp({ success: true, data: [] });
    }
    // 写操作：降级
    if (path.startsWith('/api/reports') && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      return jsonResp(WRITE_DISABLED, 503);
    }

    // AI 系列：降级
    if (path === '/api/llm/ask' ||
        path === '/api/llm/relate' ||
        path === '/api/llm/parse' ||
        path === '/api/llm/suggest-questions' ||
        path === '/api/llm/governance-report' ||
        path === '/api/llm/audit-report' ||
        path.startsWith('/api/llm/audit')) {
      return jsonResp(AI_UNAVAILABLE, 503);
    }

    // 关系索引：降级
    if (path === '/api/relations/find') {
      return jsonResp({ success: true, data: { count: 0, reports: [], type: '', name: '' } });
    }
    if (path === '/api/relations/top') {
      return jsonResp({ success: true, data: [] });
    }

    // 统计：降级
    if (path === '/api/stats') {
      return jsonResp({ success: true, data: { totalReports: 0, byType: {}, byLiability: {}, byCause: {} } });
    }

    // 纠错反馈：降级
    if (path === '/api/corrections' && method === 'GET') {
      return jsonResp({ success: true, data: [] });
    }
    if (path === '/api/corrections' && method === 'POST') {
      return jsonResp(WRITE_DISABLED, 503);
    }

    // 健康检查
    if (path === '/api/health') {
      return jsonResp({ success: true, data: { status: 'ok', mode: state.tunnelUrl ? 'tunnel-proxy' : 'static-mirror', version: 'v3.5.1' } });
    }

    // 兜底：透传
    return origFetch(input, init);
  };

  // 页面加载时立即触发一次隧道发现
  discoverTunnel();

  console.log('[static-shim v3.5.1] 已启用：交通事故 KG 隧道增强模式（有隧道自动走真 AI，无则降级）');
})();

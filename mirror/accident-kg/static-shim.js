/**
 * static-shim.js —— 交通事故 KG 静态镜像 (Cloudflare Pages 版)
 * 目的：拦截 window.fetch 到 /api/... 的调用，路由到静态 JSON 或返回优雅降级提示。
 *
 * 覆盖 API：
 *   GET  /api/reports              → data/reports.json
 *   POST /api/reports              → 拒绝：静态镜像不支持写入
 *   PUT/DELETE /api/reports/:id    → 拒绝：静态镜像不支持写入
 *   POST /api/reports/import       → 拒绝
 *   GET  /api/reports/export       → 直接跳到静态 data/reports.json
 *   POST /api/llm/ask              → 降级：AI 服务不可用
 *   POST /api/llm/relate           → 降级
 *   POST /api/llm/parse            → 降级
 *   POST /api/relations/find       → 空命中兜底 {count:0, reports:[]}
 *
 * 加载时机：index.html 中所有业务 script 之前先引入本文件。
 */
(function () {
  if (window.__ACCIDENT_KG_STATIC_SHIM__) return;
  window.__ACCIDENT_KG_STATIC_SHIM__ = true;

  const origFetch = window.fetch.bind(window);
  const jsonResp = (obj, status) => Promise.resolve(new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  }));

  const AI_UNAVAILABLE = {
    success: false,
    error: 'AI 服务不可用：本页面为静态镜像（Cloudflare Pages）。AI 智能问答、跨报告 AI 关联分析、AI 报告解析等能力需连接本地全量后端。请访问本地版 http://127.0.0.1:3003 体验完整 AI 功能。'
  };

  const WRITE_DISABLED = {
    success: false,
    error: '静态展示版不支持写入。请访问本地版 http://127.0.0.1:3003 进行报告新增/修改/删除等操作。'
  };

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

  window.fetch = function (input, init) {
    const url = (typeof input === 'string') ? input : (input && input.url) || '';
    if (!isSameOrigin(url) || !url.includes('/api/')) return origFetch(input, init);

    const method = (init && init.method || 'GET').toUpperCase();
    const path = pathOf(url);

    // 读：报告列表 → 静态 JSON（服务端格式：{success:true, data:[...]}）
    if (path === '/api/reports' && method === 'GET') {
      return origFetch('./data/reports.json').then(r => r.json()).then(raw => {
        // reports.json 可能是数组或 {reports:[]} 之类；兼容处理
        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && Array.isArray(raw.reports)) list = raw.reports;
        else if (raw && raw.data && Array.isArray(raw.data)) list = raw.data;
        return jsonResp({ success: true, data: list });
      }).catch(() => jsonResp({ success: true, data: [] }));
    }

    // 报告导出：静态直连
    if (path === '/api/reports/export' && method === 'GET') {
      // 直接触发下载 data/reports.json（浏览器会当 JSON 处理）
      return origFetch('./data/reports.json');
    }

    // 报告写入类
    if (path.startsWith('/api/reports')) {
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        return jsonResp(WRITE_DISABLED, 503);
      }
    }

    // AI 相关：一律降级
    if (path === '/api/llm/ask' || path === '/api/llm/relate' || path === '/api/llm/parse') {
      return jsonResp(AI_UNAVAILABLE, 503);
    }

    // 跨报告索引：无后端 → 命中 0 条兜底（前端会渲染"样本不足"提示）
    if (path === '/api/relations/find') {
      return jsonResp({ success: true, data: { count: 0, reports: [], type: '', name: '' } });
    }

    // 兜底：透传（可能返回 404，交给上游处理）
    return origFetch(input, init);
  };

  console.log('[static-shim] 已启用：交通事故 KG 静态镜像模式（AI/写入将走降级路径）');
})();

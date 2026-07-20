/**
 * static-shim.js —— 交通事故 KG 静态镜像 (Cloudflare Pages 版) · v3.5.1 适配
 * 目的：拦截 window.fetch 到 /api/... 的调用，路由到静态 JSON 或返回优雅降级提示。
 *
 * 覆盖 API：
 *   GET  /api/reports              → data/reports.json（数据）
 *   GET  /api/reports/export       → data/reports.json（下载）
 *   POST/PUT/DELETE /api/reports*  → 拒绝
 *   POST /api/reports/import       → 拒绝
 *   POST /api/reports/audit        → 拒绝
 *   POST /api/llm/ask              → AI 降级
 *   POST /api/llm/relate           → AI 降级（含语义扩展）
 *   POST /api/llm/parse            → AI 降级
 *   POST /api/llm/suggest-questions → AI 降级（提示条空返回）
 *   POST /api/llm/governance-report → AI 降级
 *   POST /api/llm/audit-report     → AI 降级
 *   POST /api/relations/find       → 空命中兜底
 *   GET  /api/relations/top        → 空数组兜底
 *   GET  /api/stats                → 空统计兜底
 *   GET  /api/corrections          → 空数组兜底
 *   POST /api/corrections          → 拒绝
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
    error: 'AI 服务不可用：本页面为静态镜像（Cloudflare Pages）。AI 智能问答、跨报告 AI 关联、语义扩展、治理专题报告、AI 事实质检等能力需连接本地全量后端。请访问本地版 http://127.0.0.1:3003 体验完整 AI 功能。'
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

    // ============ 报告 ============
    // 读：报告列表
    if (path === '/api/reports' && method === 'GET') {
      return origFetch('./data/reports.json').then(r => r.json()).then(raw => {
        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && Array.isArray(raw.reports)) list = raw.reports;
        else if (raw && raw.data && Array.isArray(raw.data)) list = raw.data;
        return jsonResp({ success: true, data: list });
      }).catch(() => jsonResp({ success: true, data: [] }));
    }
    // 导出
    if (path === '/api/reports/export' && method === 'GET') {
      return origFetch('./data/reports.json');
    }
    // AI 事实质检批量结果查询：静态无历史结果
    if (path.startsWith('/api/llm/audit/results') && method === 'GET') {
      return jsonResp({ success: true, data: [] });
    }
    // 写：一律拒绝（含 /api/reports POST/PUT/DELETE、/import、/audit）
    if (path.startsWith('/api/reports')) {
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        return jsonResp(WRITE_DISABLED, 503);
      }
    }

    // ============ AI 系列 —— 全部降级 ============
    if (path === '/api/llm/ask' ||
        path === '/api/llm/relate' ||
        path === '/api/llm/parse' ||
        path === '/api/llm/suggest-questions' ||
        path === '/api/llm/governance-report' ||
        path === '/api/llm/audit-report' ||
        path.startsWith('/api/llm/audit')) {
      return jsonResp(AI_UNAVAILABLE, 503);
    }

    // ============ 关系索引 ============
    if (path === '/api/relations/find') {
      return jsonResp({ success: true, data: { count: 0, reports: [], type: '', name: '' } });
    }
    if (path === '/api/relations/top') {
      return jsonResp({ success: true, data: [] });
    }

    // ============ 统计 ============
    if (path === '/api/stats') {
      return jsonResp({ success: true, data: { totalReports: 0, byType: {}, byLiability: {}, byCause: {} } });
    }

    // ============ 纠错反馈 ============
    if (path === '/api/corrections' && method === 'GET') {
      return jsonResp({ success: true, data: [] });
    }
    if (path === '/api/corrections' && method === 'POST') {
      return jsonResp(WRITE_DISABLED, 503);
    }

    // ============ 健康检查 ============
    if (path === '/api/health') {
      return jsonResp({ success: true, data: { status: 'ok', mode: 'static-mirror', version: 'v3.5.1' } });
    }

    // 兜底：透传
    return origFetch(input, init);
  };

  console.log('[static-shim v3.5.1] 已启用：交通事故 KG 静态镜像模式（AI/写入将走降级路径）');
})();

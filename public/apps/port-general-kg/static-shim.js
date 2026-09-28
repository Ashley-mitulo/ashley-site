/**
 * static-shim.js —— 港口通用知识库 port-general-kg 静态镜像 (Cloudflare Pages 版) · v0.3.0
 * 目的：拦截 window.fetch 到任意 /api/... 的调用 → 优先转发本地后端隧道（全交互可用），无隧道降级到静态 JSON
 *
 * 两级降级：
 *   1. 有隧道 → 转发到 trycloudflare 隧道地址（真实推理引擎：求解器实时求值/多域图谱/业务主轴全可用）
 *   2. 无隧道 → 读 api-static/*.json（展示页：首页 KPI/推理链/业务主轴/图谱快照/求解器演示场景可浏览）
 *
 * 覆盖 API（港口通用知识库，GET）：
 *   GET /api/domains                      → api-static/domains.json
 *   GET /api/home/overview[?domain=X]     → api-static/home_overview.json（?domain 匹配 home_overview_domain_<X>.json）
 *   GET /api/chains                       → api-static/chains.json
 *   GET /api/chains/:id                   → api-static/chain_<ID>.json
 *   GET /api/chains/stats                 → api-static/chains_stats.json
 *   GET /api/chains/stats/detail          → api-static/chains_stats_detail.json
 *   GET /api/process/spines               → api-static/spines.json
 *   GET /api/process/spine/:id            → 隧道转发；无隧道 → 提示
 *   GET /api/connectors                   → api-static/connectors.json
 *   GET /api/connectors/:id/contract      → api-static/connector_<ID>_contract.json（缺→提示）
 *   GET /api/datasources                  → api-static/datasources.json
 *   GET /api/port-map/berths              → api-static/port_map_berths.json
 *   GET /api/domains/:id/config           → api-static/domain_<ID>_config.json
 *   GET /api/domains/:id/entities         → api-static/domain_<ID>_entities.json
 *   GET /api/domains/:id/regulatory       → api-static/domain_<ID>_regulatory.json
 *   GET /api/solvers                      → api-static/solvers.json
 *   GET /api/solvers/:id/schema           → api-static/solver_<ID>_schema.json
 *   GET /api/graph/:domain                → api-static/graph_<DOMAIN>.json
 *   GET /api/graph/dry-bulk/chain/:cid    → api-static/graph_chain_<CID>.json
 *   GET /api/evidence[?node=X]            → api-static/evidence_drybulk.json（缺→空）
 *   GET /api/shared/:type/:id             → api-static/shared_<type>_<ID>.json（缺→提示）
 *   GET /api/constraints/:id/eval?        → 隧道转发；无隧道 → 提示
 *
 * 求解器 POST（动态求值）：无隧道时匹配 api-static/eval_*.json 预置演示场景，否则返回需后端提示
 *
 * 加载时机：各 html 中所有业务 script 之前先引入本文件（api.js 之前）。
 */
(function () {
  if (window.__PGKG_STATIC_SHIM__) return;
  window.__PGKG_STATIC_SHIM__ = true;

  // 生产环境：把前端 API 基址改为同源绝对地址（= location.origin），让所有 /api 请求走本 shim 统一拦截。
  // 不设非空值则 api.js 的 BASE 默认落到 http://localhost:3020,访客浏览器会去访问自己电脑 → ERR_FAILED → 页面空白。
  if (typeof window.PKG_API_BASE === 'undefined' || window.PKG_API_BASE === '' || window.PKG_API_BASE === 'http://localhost:3020') {
    window.PKG_API_BASE = window.location.origin;
  }

  const origFetch = window.fetch.bind(window);
  const PROJECT = 'port-general-kg';

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

  const BACKEND_UNREACHABLE = {
    error: '静态展示版：后端未通过隧道连接。启动本地后端 (node src/server/index.js @ 3020) + cloudflared 隧道后，求解器实时求值/多域图谱下钻/业务主轴将自动启用。'
  };

  function isSameOrigin(url) {
    if (!url) return false;
    if (typeof url !== 'string') url = String(url);
    if (url.startsWith('/')) return true;
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin || /trycloudflare\.com$/.test(u.hostname);
    } catch (e) { return false; }
  }

  function rawPath(url) {
    if (typeof url !== 'string') url = String(url);
    if (url.startsWith('/')) return url.split('?')[0];
    try { const u = new URL(url, location.href); return u.pathname; } catch (e) { return url.split('?')[0]; }
  }

  function parseQuery(url) {
    const idx = String(url).indexOf('?');
    if (idx < 0) return {};
    return String(url).slice(idx + 1).split('&').reduce(function (o, kv) {
      if (!kv) return o;
      const [k, ...v] = kv.split('=');
      try { o[decodeURIComponent(k)] = decodeURIComponent(v.join('=')); } catch { o[k] = v.join('='); }
      return o;
    }, {});
  }

  async function discoverTunnel() {
    const now = Date.now();
    if (state.tunnelChecking) return;
    if (state.tunnelChecked && now - state.lastCheck < state.checkInterval) return;
    state.tunnelChecking = true;
    try {
      const resp = await origFetch('/api/tunnel/discover');
      const json = await resp.json();
      if (json.success && json.data && json.data[PROJECT]) {
        state.tunnelUrl = json.data[PROJECT];
      } else { state.tunnelUrl = null; }
      state.tunnelChecked = true;
      state.lastCheck = now;
    } catch (e) { state.tunnelUrl = null; } finally { state.tunnelChecking = false; }
  }

  async function proxyThroughTunnel(url, init) {
    if (!state.tunnelUrl) return null;
    const path = rawPath(url);
    const tunnelUrl = state.tunnelUrl.replace(/\/$/, '') + path;
    const qIdx = String(url).indexOf('?');
    const query = qIdx >= 0 ? String(url).slice(qIdx) : '';
    try {
      const resp = await origFetch(tunnelUrl + query, init);
      if (resp.status >= 400) state.tunnelChecked = false;
      return resp;
    } catch (e) {
      state.tunnelChecked = false; state.tunnelUrl = null; return null;
    }
  }

  async function staticJson(file) {
    try {
      const r = await origFetch('./api-static/' + file);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  // 路径中间段提取：/api/domains/:id/xxx → {id}; /api/solvers/:id/schema → {id}
  function segMatch(path, prefixRegex) {
    const m = path.match(prefixRegex);
    return m ? m[1] : null;
  }

  // —— 求解器 POST 演示场景匹配：找 api-static/eval_*.json 里 inputs 与请求 body 匹配的那份 ——
  async function matchStaticEval(id, body) {
    try {
      const resp = await origFetch('./api-static/eval_list.json');
      if (!resp.ok) return null;
      const list = await resp.json(); // [{file, solver, inputs}]
      for (const item of (list || [])) {
        if (item.solver !== id) continue;
        let match = true;
        for (const k in (item.inputs || {})) {
          if (String(body[k]) !== String(item.inputs[k])) { match = false; break; }
        }
        if (match) {
          const d = await staticJson(item.file);
          if (d) return d;
        }
      }
    } catch {}
    return null;
  }

  window.fetch = async function (input, init) {
    const url = (typeof input === 'string') ? input : (input && input.url) || '';
    if (!isSameOrigin(url) || !url.includes('/api/')) return origFetch(input, init);
    if (url.includes('/api/tunnel/')) return origFetch(input, init);

    const method = (init && init.method || 'GET').toUpperCase();
    const path = rawPath(url);

    discoverTunnel();

    // 有隧道 → 优先转发（真实推理引擎）
    if (state.tunnelUrl) {
      const proxied = await proxyThroughTunnel(url, init);
      if (proxied) return proxied;
    }

    // ============ 求解器 POST（动态求值） ============
    if (method === 'POST' && /\/api\/solvers\/.+?\/eval$/.test(path)) {
      let body = {};
      try { body = JSON.parse((init && init.body) || '{}'); } catch {}
      const id = segMatch(path, /\/api\/solvers\/(.+?)\/eval$/);
      // ① 本地浏览器引擎（window.PortKgEngine）——完全离线实时求解，等价后端
      if (window.PortKgEngine && typeof window.PortKgEngine.solve === 'function') {
        try {
          const result = window.PortKgEngine.solve(id, body);
          if (result) return jsonResp(result);
        } catch (e) {
          console.warn('[port-general-kg] 浏览器引擎求解失败(' + id + '):', e && e.message);
        }
      }
      // ② 静态预置演示场景匹配
      const hit = id ? await matchStaticEval(id, body) : null;
      if (hit) return jsonResp(hit);
      return jsonResp({ error: '静态展示版：求解器需实时求值，未找到匹配的预置演示场景。请启动本地后端 + 隧道。', _static: BACKEND_UNREACHABLE }, 503);
    }

    // ============ GET 静态降级 ============
    // 首页 / 概览
    if (path === '/api/domains') return jsonResp((await staticJson('domains.json')) || {});
    if (path === '/api/home/overview') {
      const q = parseQuery(url);
      const d = q.domain;
      if (d) {
        const dFile = await staticJson('home_overview_domain_' + d + '.json');
        if (dFile) return jsonResp(dFile);
      }
      return jsonResp((await staticJson('home_overview.json')) || {});
    }

    // 链监控
    if (path === '/api/chains') return jsonResp((await staticJson('chains.json')) || []);
    if (path === '/api/chains/stats') return jsonResp((await staticJson('chains_stats.json')) || {});
    if (path === '/api/chains/stats/detail') return jsonResp((await staticJson('chains_stats_detail.json')) || {});
    if (path.indexOf('/api/chains/') === 0) {
      const id = segMatch(path, /\/api\/chains\/([^/]+)$/);
      if (id) return jsonResp((await staticJson('chain_' + id + '.json')) || { _static: BACKEND_UNREACHABLE });
      return jsonResp({ _static: BACKEND_UNREACHABLE });
    }

    // 业务主轴
    if (path === '/api/process/spines') return jsonResp((await staticJson('spines.json')) || {});
    if (path.indexOf('/api/process/spine/') === 0) { return jsonResp({ _static: BACKEND_UNREACHABLE }); }

    // 外部系统
    if (path === '/api/connectors') return jsonResp((await staticJson('connectors.json')) || []);
    if (path.indexOf('/api/connectors/') === 0) {
      const id = segMatch(path, /\/api\/connectors\/([^/]+?)\/contract$/);
      if (id) return jsonResp((await staticJson('connector_' + id + '_contract.json')) || { _static: BACKEND_UNREACHABLE });
      return jsonResp({ _static: BACKEND_UNREACHABLE });
    }
    if (path === '/api/datasources') return jsonResp((await staticJson('datasources.json')) || {});
    if (path === '/api/port-map/berths') return jsonResp((await staticJson('port_map_berths.json')) || {});

    // 域
    if (path.indexOf('/api/domains/') === 0) {
      const m = path.match(/\/api\/domains\/([^/]+?)\/(config|entities|regulatory)$/);
      if (m) return jsonResp((await staticJson('domain_' + m[1] + '_' + m[2] + '.json')) || { _static: BACKEND_UNREACHABLE });
      return jsonResp({ _static: BACKEND_UNREACHABLE });
    }

    // 求解器
    if (path === '/api/solvers') return jsonResp((await staticJson('solvers.json')) || []);
    if (path.indexOf('/api/solvers/') === 0) {
      const id = segMatch(path, /\/api\/solvers\/(.+?)\/schema$/);
      if (id) return jsonResp((await staticJson('solver_' + id + '_schema.json')) || { _static: BACKEND_UNREACHABLE });
      return jsonResp({ _static: BACKEND_UNREACHABLE });
    }

    // 图谱
    if (path.indexOf('/api/graph/') === 0) {
      const chainId = segMatch(path, /\/api\/graph\/dry-bulk\/chain\/(.+)$/);
      if (chainId) return jsonResp((await staticJson('graph_chain_' + chainId + '.json')) || { nodes: [], edges: [] });
      // /api/graph/:domain
      if (/^\/api\/graph\/[^/]+$/.test(path)) {
        const domain = path.split('/api/graph/')[1];
        return jsonResp((await staticJson('graph_' + domain + '.json')) || { nodes: [], edges: [], _static: BACKEND_UNREACHABLE });
      }
      return jsonResp({ nodes: [], edges: [] });
    }

    // 证据 / shared / 约束eval / 其他查询 → 静态或提示
    if (path === '/api/evidence') return jsonResp((await staticJson('evidence_drybulk.json')) || { claims: [] });
    if (path.indexOf('/api/shared/') === 0) { return jsonResp({ _static: BACKEND_UNREACHABLE }); }
    if (path.indexOf('/api/constraints/') >= 0) { return jsonResp({ _static: BACKEND_UNREACHABLE }); }

    // 兜底：透传
    return origFetch(input, init);
  };

  discoverTunnel();
  console.log('[port-general-kg static-shim v0.3.0] 已启用：隧道增强模式（有隧道走真后端，无则 api-static 降级）');
})();
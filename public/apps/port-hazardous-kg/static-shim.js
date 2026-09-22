/**
 * static-shim.js —— 港口危货知识图谱 静态镜像 (Cloudflare Pages 版) · v1.5.1
 * 目的：拦截 window.fetch 到任意 /api/... 的调用 → 优先转发本地后端隧道（全交互可用），无隧道降级到静态 JSON
 *
 * 两级降级：
 *   1. 有隧道 → 转发到 trycloudflare 隧道地址（真实图谱引擎：下钻/检索/按货种分析全可用）
 *   2. 无隧道 → 读 api-static/*.json（展示页：首页/大屏可完整浏览）
 *
 * 覆盖 API（港口危货 KG）：
 *   GET  /api/stats                   → api-static/stats.json
 *   GET  /api/graph/topology          → api-static/graph_topology.json
 *   GET  /api/graph/neighbors/:id     → 隧道转发；无隧道 → 空 {nodes:[],edges:[]}
 *   GET  /api/graph/relations/:id     → 隧道转发；无隧道 → 空链
 *   GET  /api/entities                → api-static/entities_type=dangerous_goods.json（默认货种）
 *   GET  /api/screen/overview         → api-static/screen_overview.json
 *   GET  /api/home/overview           → api-static/home_overview.json
 *   GET  /api/analyze/*               → 隧道转发；无隧道 → 需本地后端提示
 *   GET  /api/knowledge               → 隧道转发；无隧道 → 空列表
 *   GET  /api/evidence                → 隧道转发；无隧道 → 空
 *   GET  /api/analyze/tank-profile    → 隧道转发；无隧道 → 空
 *   GET  /api/kg/check-name           → 隧道转发；无隧道 → {candidates:[]}
 *   GET  /api/kg/export               → 隧道转发；无隧道 → 提示
 *   POST /api/case-upload             → 隧道转发；无隧道 → 提示需本地后端
 *   POST /api/kg/commit               → 同上
 *
 * 加载时机：各 html 中所有业务 script 之前先引入本文件。
 */
(function () {
  if (window.__PORT_KG_STATIC_SHIM__) return;
  window.__PORT_KG_STATIC_SHIM__ = true;

  // 生产环境：把前端 API 基址从写死的 http://localhost:3010 改为同源绝对地址（= location.origin）,让所有 /api 请求走本 shim 统一拦截：
  //   有隧道 → 转发到隧道(真后端)；无隧道 → 读 api-static/*.json(静态降级)
  // 不设则 api.js 的 BASE 默认落到 localhost:3010,访客浏览器会去访问自己电脑的 3010 → ERR_FAILED → 全部框体空白。
  // ⚠️ 不能用 ''(空串,falsy)——api.js 的 `var BASE = window.PKG_API_BASE || "http://localhost:3010"` 会把空串当 falsy 回退到默认值。必须给非空同源地址。
  if (typeof window.PKG_API_BASE === 'undefined' || window.PKG_API_BASE === '' || window.PKG_API_BASE === 'http://localhost:3010') {
    window.PKG_API_BASE = window.location.origin;
  }

  const origFetch = window.fetch.bind(window);
  const PROJECT = 'port-hazardous-kg';

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
    error: '静态展示版：后端未通过隧道连接。启动本地后端 (node src/server/index.js @ 3010) + cloudflared 隧道后，图谱下钻/检索/按货种分析将自动启用。'
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

  function pathOf(url) {
    if (typeof url !== 'string') url = String(url);
    if (url.startsWith('/')) return url.split('?')[0];
    try {
      const u = new URL(url, location.href);
      return u.pathname;
    } catch (e) { return url.split('?')[0]; }
  }

  // 发现隧道
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
        console.log(`[port-kg static-shim v1.5.1] 🟢 发现隧道：${state.tunnelUrl}`);
      } else {
        state.tunnelUrl = null;
        console.log(`[port-kg static-shim v1.5.1] ⚪ 暂无隧道（本地后端 + cloudflared 未启动），降级静态展示`);
      }
      state.tunnelChecked = true;
      state.lastCheck = now;
    } catch (e) {
      state.tunnelUrl = null;
    } finally {
      state.tunnelChecking = false;
    }
  }

  // 通过隧道转发
  async function proxyThroughTunnel(url, init) {
    if (!state.tunnelUrl) return null;
    const path = pathOf(url);
    const tunnelUrl = state.tunnelUrl.replace(/\/$/, '') + path;
    // 保留 query 参数
    const qIdx = String(url).indexOf('?');
    const query = qIdx >= 0 ? String(url).slice(qIdx) : '';
    try {
      const resp = await origFetch(tunnelUrl + query, init);
      if (resp.status >= 400) state.tunnelChecked = false;
      return resp;
    } catch (e) {
      state.tunnelChecked = false;
      state.tunnelUrl = null;
      return null;
    }
  }

  // 读静态 JSON
  async function staticJson(file) {
    try {
      const r = await origFetch('./api-static/' + file);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  // 预处理 URL（去掉 BASE 前缀干扰，统一 path）
  function rawPath(url) {
    try {
      const u = new URL(url, location.href);
      return u.pathname;
    } catch (e) { return String(url).split('?')[0]; }
  }

  // 解析 query 字符串 → 对象（URL 解码）
  function parseQuery(url) {
    const idx = String(url).indexOf('?');
    if (idx < 0) return {};
    const qs = String(url).slice(idx + 1).split('&');
    const o = {};
    for (const kv of qs) {
      if (!kv) continue;
      const [k, ...v] = kv.split('=');
      try { o[decodeURIComponent(k)] = decodeURIComponent(v.join('=')); } catch { o[k] = v.join('='); }
    }
    return o;
  }

  // base64url 编码（无 +/=/ 字符, 与服务端生成的文件名一致）
  function b64url(str) {
    try {
      // 浏览器: btoa(unescape(encodeURIComponent(str)))
      let b;
      if (typeof btoa === 'function') {
        b = btoa(unescape(encodeURIComponent(str)));
      } else {
        b = Buffer.from(str, 'utf8').toString('base64');
      }
      return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) { return encodeURIComponent(str); }
  }

  // 从 api-static/analyze/<b64url(goods)>.json 读某货种的全部分析结果
  async function staticAnalyze(goods) {
    if (!goods) return null;
    try {
      const f = 'analyze/g_' + b64url(goods) + '.json';
      const data = await staticJson(f);
      return data || null;
    } catch { return null; }
  }

  window.fetch = async function (input, init) {
    const url = (typeof input === 'string') ? input : (input && input.url) || '';
    if (!isSameOrigin(url) || !url.includes('/api/')) return origFetch(input, init);
    // 不拦截隧道发现 API
    if (url.includes('/api/tunnel/')) return origFetch(input, init);

    const method = (init && init.method || 'GET').toUpperCase();
    const path = rawPath(url);

    discoverTunnel();

    // 有隧道 → 优先转发（真实图谱引擎）
    if (state.tunnelUrl) {
      const proxied = await proxyThroughTunnel(url, init);
      if (proxied) return proxied;
    }

    // ============ 无隧道：静态降级 ============
    // 写操作
    if (path === '/api/case-upload' || path === '/api/kg/commit') {
      return jsonResp({ success: false, error: '静态展示版不支持写入。请启动本地后端 + 隧道。' }, 503);
    }

    // 展示页核心（首页/大屏）
    if (path === '/api/stats') return jsonResp((await staticJson('stats.json')) || {});
    if (path === '/api/graph/topology') return jsonResp((await staticJson('graph_topology.json')) || { nodes: [], edges: [] });
    if (path === '/api/screen/overview') return jsonResp((await staticJson('screen_overview.json')) || {});
    if (path === '/api/home/overview') return jsonResp((await staticJson('home_overview.json')) || {});
    if (path === '/api/entities') return jsonResp((await staticJson('entities_type=dangerous_goods.json')) || []);

    // 交互式查询：无隧道无法服务真实数据 → 返回需后端提示（前端会优雅降级显示）
    if (path === '/api/graph/neighbors/') return jsonResp({ nodes: [], edges: [], _static: BACKEND_UNREACHABLE });
    if (path === '/api/graph/relations/') return jsonResp({ nodes: [], edges: [], _static: BACKEND_UNREACHABLE });

    // ============ 深度接口：静态降级（方案B：从 api-static/analyze/ 读冻结数据） ============
    // /api/analyze/<ep>?goods=X → 读 analyze/<encodeURIComponent(X)>.json 里的 ep 字段
    if (path.indexOf('/api/analyze/') >= 0) {
      const q = parseQuery(url);
      const goods = q.goods || q.query;  // tank-profile 也用 tank 参数
      const analyseName = (q.goods || q.query || '').trim();
      // 解析具体的 analyze 子接口名：/api/analyze/goods-profile → goods-profile
      const epMatch = path.match(/\/api\/analyze\/([a-z0-9-]+)/);
      const ep = epMatch ? epMatch[1] : '';
      if (path.indexOf('/api/analyze/tank-profile') >= 0) {
        // 储罐画像：api-static/analyze/t_<b64url>.json
        const tk = (q.tank || '').trim();
        if (tk) {
          const tt = await staticJson('analyze/t_' + b64url(tk) + '.json');
          return jsonResp(tt || { _static: BACKEND_UNREACHABLE });
        }
        return jsonResp({ _static: BACKEND_UNREACHABLE });
      }
      const gd = (q.goods || q.query || '').trim();
      if (gd) {
        const full = await staticAnalyze(gd);
        if (full) {
          // 直接返回该货种对应 analyze 子接口的数据；若该子接口未冻结则返回未定义提示
          const sub = full[ep];
          if (sub) return jsonResp(sub);
          return jsonResp({ _static: BACKEND_UNREACHABLE, message: '无该货种的 ' + ep + ' 静态数据' });
        }
      }
      return jsonResp({ _static: BACKEND_UNREACHABLE });
    }

    // /api/knowledge?query=X → 客户端搜索 api-static/analyze/_knowledge_all.json（含命中词高亮所需字段）
    if (path === '/api/knowledge') {
      const q = parseQuery(url);
      const kw = (q.query || '').trim().toLowerCase();
      const all = await staticJson('analyze/_knowledge_all.json');
      if (all && Array.isArray(all.items)) {
        let items = all.items;
        if (kw) {
          items = items.filter(function (it) {
            const hay = JSON.stringify(it).toLowerCase();
            return hay.indexOf(kw) >= 0;
          });
        }
        return jsonResp({ items: items, count: items.length });
      }
      return jsonResp({ items: [], count: 0 });
    }

    // /api/evidence?node=X&type=Y → 静态暂无（返回空 claims，前端不空白）
    if (path === '/api/evidence') return jsonResp({ claims: [], _static: BACKEND_UNREACHABLE });
    if (path === '/api/kg/check-name') return jsonResp({ candidates: [] });
    if (path === '/api/kg/export') return jsonResp(BACKEND_UNREACHABLE, 503);

    // 兜底：透传（多数会 404，但保持透明）
    return origFetch(input, init);
  };

  discoverTunnel();
  console.log('[port-kg static-shim v1.5.1] 已启用：港口危货知识图谱 隧道增强模式（有隧道走真后端，无则静态降级）');
})();
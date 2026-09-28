/* api.js — 港口通用知识库 v0.1 后端对接层（全新重写，仅依赖新后端接口）
 * 接口契约见 docs/全新重写蓝图.md §六：domains / chains / chains/:id / chains/stats /
 * constraints/:id/eval / home/overview / evidence / domains/:id/entities / shared/:type/:id
 * 红线：失败显式处理（返回错误标记），不静默 return null 导致「加载中」永久转圈。
 */
window.PKG_API = (function () {
  var BASE = (window.PKG_API_BASE || location.origin);
  var useMock = false;

  function get(path) {
    return fetch(BASE + path, { method: "GET" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " " + path);
        return r.json();
      })
      .catch(function (e) {
        useMock = true;
        throw e; // 不静默：调用方 catch 显式显示失败态
      });
  }

  return {
    base: BASE,
    isMock: function () { return useMock; },

    // 域列表 / 单域配置
    fetchDomains: function () { return get("/api/domains"); },
    fetchDomainConfig: function (id) { return get("/api/domains/" + encodeURIComponent(id) + "/config"); },
    fetchDomainEntities: function (id) { return get("/api/domains/" + encodeURIComponent(id) + "/entities"); },

    // shared 单一事实源
    fetchShared: function (type, id) { return get("/api/shared/" + encodeURIComponent(type) + "/" + encodeURIComponent(id)); },

    // 推理链
    fetchChains: function () { return get("/api/chains"); },
    fetchChain: function (id) { return get("/api/chains/" + encodeURIComponent(id)); },
    fetchChainStats: function () { return get("/api/chains/stats"); },
    fetchChainDetail: function () { return get("/api/chains/stats/detail"); },

    // 约束求值（后端）
    evalConstraint: function (id, opts) {
      var qs = [];
      opts = opts || {};
      if (opts.vessel) qs.push("vessel=" + encodeURIComponent(opts.vessel));
      if (opts.berth) qs.push("berth=" + encodeURIComponent(opts.berth));
      return get("/api/constraints/" + encodeURIComponent(id) + "/eval" + (qs.length ? "?" + qs.join("&") : ""));
    },

    // 首页结论流 / 北极星
    fetchHomeOverview: function () { return get("/api/home/overview"); },

    // 证据溯源 L3
    fetchEvidence: function (node) {
      return get("/api/evidence" + (node ? "?node=" + encodeURIComponent(node) : ""));
    },

    // 业务主轴（P-1/P-2：spines/spine/step）
    fetchSpines: function () { return get("/api/process/spines"); },
    fetchSpine: function (id) { return get("/api/process/spine/" + encodeURIComponent(id)); },
    fetchSpineStep: function (id, seq) { return get("/api/process/spine/" + encodeURIComponent(id) + "/step/" + encodeURIComponent(seq)); },

    // 外部系统对接（P-7：connectors 声明/契约/probe）
    fetchConnectors: function () { return get("/api/connectors"); },
    fetchConnectorContract: function (id) { return get("/api/connectors/" + encodeURIComponent(id) + "/contract"); },
    probeConnector: function (id) { return get("/api/connectors/" + encodeURIComponent(id) + "/probe"); },

    // 通用 GET（工作台用，返回 json）
    get: function (path) { return get(path); },
    // 通用 POST（工作台求解器用）
    post: function (path, body) {
      return fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "HTTP " + r.status); return j; }); })
        .catch(function (e) { useMock = true; throw e; });
    }
  };
})();
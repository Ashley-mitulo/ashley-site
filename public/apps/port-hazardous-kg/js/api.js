/* api.js — 后端对接层
 * 每个方法请求后端 REST API，失败/无后端时返回 null（由 app.js 决定是否回退 mock）。 */
window.PKG_API = (function () {
  var BASE = (window.PKG_API_BASE || "http://localhost:3010");
  var useMock = false; // 首个请求失败后置 true，app.js 检查

  function get(path) {
    return fetch(BASE + path, { method: "GET" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .catch(function (e) {
        useMock = true;
        return null;
      });
  }

  return {
    base: BASE,
    getBackendStatus: function () { return fetch(BASE + "/api/stats", { method: "GET" }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); },
    isMock: function () { return useMock; },
    fetchTopology: function (opts) {
      // N6 图谱性能保护：支持 {minDegree, edgeTypes} 过滤参数
      opts = opts || {};
      var qs = [];
      if (opts.minDegree) qs.push("minDegree=" + encodeURIComponent(opts.minDegree));
      if (opts.edgeTypes) qs.push("edgeTypes=" + encodeURIComponent(opts.edgeTypes));
      return get("/api/graph/topology" + (qs.length ? "?" + qs.join("&") : ""));
    },
    fetchEntities: function (type, query) {
      var qs = "type=" + encodeURIComponent(type || "");
      if (query) qs += "&query=" + encodeURIComponent(query);
      return get("/api/entities?" + qs);
    },
    fetchNeighbors: function (id) { return get("/api/graph/neighbors/" + encodeURIComponent(id)); },
    fetchRelations: function (id, depth) { return get("/api/graph/relations/" + encodeURIComponent(id) + "?depth=" + (depth || 3)); },
    analyzeSimilar: function (goods) { return get("/api/analyze/similar-enterprises?goods=" + encodeURIComponent(goods)); },
    analyzeAccidents: function (goods) { return get("/api/analyze/accidents?goods=" + encodeURIComponent(goods)); },
    analyzeEmergency: function (goods) { return get("/api/analyze/emergency?goods=" + encodeURIComponent(goods)); },
    analyzeIncompatible: function (goods) { return get("/api/analyze/incompatible?goods=" + encodeURIComponent(goods)); },
    analyzeIncompatibleExtended: function (goods) { return get("/api/analyze/incompatible-extended?goods=" + encodeURIComponent(goods)); },
    analyzeGoodsProfile: function (goods) { return get("/api/analyze/goods-profile?goods=" + encodeURIComponent(goods)); },
    fetchKnowledge: function (query) { return get("/api/knowledge?query=" + encodeURIComponent(query || "")); },
    // P0-2 知识抽取与融合工作台
    uploadCase: function (text) {
      return fetch(this.base + "/api/case-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { useMock = true; return null; });
    },
    kgExport: function () { return get("/api/kg/export"); },
    // 首页六维星系聚合（home.html）
    fetchHomeOverview: function () { return get("/api/home/overview"); },
    // 大屏演示页聚合（screen.html）
    fetchScreenOverview: function () { return get("/api/screen/overview"); },
    kgCommit: function (nodes, edges) {
      return fetch(this.base + "/api/kg/commit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodes: nodes, edges: edges }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    },
    // N3 新建实体同名校验：返回相似候选 {candidates:[{id,name,kind,score}]}
    checkName: function (name) { return get("/api/kg/check-name?name=" + encodeURIComponent(name || "")); },
    fetchEvidence: function (node, type) { return get("/api/evidence?node=" + encodeURIComponent(node) + "&type=" + (type || "goods")); },
    fetchTankProfile: function (tank) { return get("/api/analyze/tank-profile?tank=" + encodeURIComponent(tank || "")); }
  };
})();
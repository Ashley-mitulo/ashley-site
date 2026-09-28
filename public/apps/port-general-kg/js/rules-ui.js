/* rules-ui.js — 约束规则库（工作台 T3.3，M3）
 * 读 /api/domains/:id/entities 的 constraints，按规则类型分组展示。
 * 每条展示：名称 / chainType徽标 / 公式(公式/规则条文) / 依据(basis) / 出处(source)。
 * 原则：取不到「—」；来源必带；不编造。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var CHAIN_CN = { capability: "能力", compliance: "合规", match: "匹配", rule: "规则" };
  var CHAIN_CLS = { capability: "ru-cap", compliance: "ru-compl", match: "ru-match", rule: "ru-rule" };

  function chainBadge(ct) {
    if (!ct) return "";
    return ct.split("+").map(function (k) {
      var kk = k.trim();
      return '<span class="ru-badge ' + (CHAIN_CLS[kk] || "ru-rule") + '">' + esc(CHAIN_CN[kk] || kk) + "</span>";
    }).join(" ");
  }

  // 找到一条约束的「规则正文」：formula 或 rule
  function ruleBody(c) {
    if (c.formula) return '<span class="ru-formula">' + esc(c.formula) + "</span>";
    if (c.rule) return esc(c.rule);
    if (c.basis) return esc(c.basis);
    return "—";
  }

  function termsHint(c) {
    if (!c.terms) return "";
    var ks = Object.keys(c.terms);
    if (!ks.length) return "";
    return ks.map(function (k) { return "<b>" + esc(k) + "</b> " + esc(c.terms[k]); }).join("　·　");
  }

  function rendCard(c) {
    return '<div class="ru-card">' +
      '<div class="ru-card-h"><span class="ru-name">' + esc(c.name) + "</span>" + chainBadge(c.chainType) + "</div>" +
      '<div class="ru-body">' + ruleBody(c) + "</div>" +
      (c.terms ? '<div class="ru-terms">' + termsHint(c) + "</div>" : "") +
      '<div class="ru-meta">' +
      (c.basis ? '<div class="ru-basis">依据：' + esc(c.basis) + "</div>" : "") +
      (c.source ? '<div class="ru-src">出处：' + esc(c.source) + "</div>" : "") +
      "</div></div>";
  }

  function render() {
    var main = $("wb-main");
    main.innerHTML = '<div class="ru-loading">加载约束规则库…</div>';
    API.get("/api/domains/dry-bulk/entities").then(function (seed) {
      var cons = seed.constraints || [];
      var html = cons.map(rendCard).join("");
      main.innerHTML =
        '<div class="ru-page"><div class="ru-head"><div class="ru-title">约束规则库</div>' +
        '<div class="ru-desc">系统全部约束规则，用于求解器约束卡与推理链求值（' + cons.length + ' 条）</div></div>' +
        '<div class="ru-grid">' + (html || '<div class="wb-empty">无约束规则</div>') + "</div></div>";
    }).catch(function (e) { main.innerHTML = '<div class="wb-empty">加载失败：' + esc(e.message) + "</div>"; });
  }

  window.__WB && window.__WB.register("rules", render);
})();
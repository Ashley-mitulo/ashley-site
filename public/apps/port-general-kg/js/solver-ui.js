/* solver-ui.js — 求解器前端（T1.3 schema输入面板 + T1.4 约束卡 + S1接通）
 * 注册到工作台 solver 路由。数据全走后端 /api/solvers/:id/schema + /eval，前端只渲染。
 * 原则：余量条四态；取不到「—」；换参数即时重算；错误红条显式报错。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  var state = { schema: null, values: {}, result: null };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }

  // —— 输入面板（schema 驱动）——
  function renderInputs(schema) {
    var vals = state.values;
    // 默认值
    schema.inputs.forEach(function (inp) {
      if (vals[inp.key] == null) {
        if (inp.default != null) vals[inp.key] = inp.default;
        else if (inp.options && inp.options.length) vals[inp.key] = inp.options[0].value;
      }
    });
    var html = schema.inputs.map(function (inp) {
      var cur = vals[inp.key];
      // —— slider 滑块类型（M2 S2 卸船机台数 1~4 杀手交互）——
      if (inp.type === 'slider') {
        var mn = inp.min != null ? inp.min : 1;
        var mx = inp.max != null ? inp.max : 4;
        var st = inp.step != null ? inp.step : 1;
        var def = cur != null ? cur : (inp.default != null ? inp.default : mn);
        vals[inp.key] = def;
        return '<label class="sb-input"><span class="sb-label">' + esc(inp.label) + (inp.required ? ' <b class="sb-req">*</b>' : '') +
          '<span class="sb-slider-val" id="sb-slider-val-' + esc(inp.key) + '">' + esc(def) + ' ' + esc(inp.unit || '') + '</span></span>' +
          '<input type="range" class="sb-slider" data-key="' + esc(inp.key) + '" data-unit="' + esc(inp.unit || '') + '" min="' + mn + '" max="' + mx + '" step="' + st + '" value="' + def + '">' +
          '<span class="sb-slider-range">' + mn + ' ~ ' + mx + (inp.note ? ' · ' + esc(inp.note) : '') + '</span></label>';
      }
      // —— 下拉枚举类型 ——
      var opts = (inp.options || []).map(function (o) {
        return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(cur) ? ' selected' : '') + '>' + esc(o.label) + "</option>";
      }).join("");
      var disabled = "";
      var note = "";
      // disabledWhen 简化处理：当前只支持 actualDraft 判断（后续可扩展）
      if (inp.disabledWhen && state.values.vessel) {
        var v = state.vesselsById && state.vesselsById[state.values.vessel];
        if (inp.key === "draftMode" && v && v.actualDraft_m == null) { disabled = " disabled"; note = ' <em class="sb-disabled-note">' + esc(inp.disabledNote || "待接入") + "</em>"; }
      }
      return '<label class="sb-input"><span class="sb-label">' + esc(inp.label) + (inp.required ? ' <b class="sb-req">*</b>' : '') + "</span>" +
        '<select class="sb-select" data-key="' + esc(inp.key) + '"' + disabled + ">" + opts + "</select>" + note + "</label>";
    }).join("");
    return '<div class="sb-inputs"><div class="sb-inputs-t">输入参数</div><div class="sb-inputs-row">' + html + "</div>" +
      '<button class="sb-eval" id="sb-eval-btn">⚡ 求解</button></div>';
  }

  // —— 约束卡（四态 + 余量条 + 公式 + source）——
  var FLAG_CN = { ok: "满足", critical: "临界", veto: "硬否决", unknown: "—", na: "不适用" };
  // v0.2 T-D2: 余量条按 marginUnit+marginRef 归一化；无 marginRef 只显数值；baseline 仅显能力值
  function marginBar(margin, flag, unit, ref) {
    if (margin == null) {
      if (flag === 'baseline') return '<div class="sb-bar"><span class="sb-bar-val"></span></div>';
      return '<div class="sb-bar"><div class="sb-bar-track sb-bar-unknown">—</div></div>';
    }
    var u = unit || '';
    var w = (ref != null && ref > 0) ? Math.min(100, Math.max(2, (Math.abs(margin) / ref) * 100)) : null;
    var cls = flag === "critical" ? "sb-bar-critical" : "sb-bar-ok";
    if (w == null) {
      // 无参考值：只显示数值，不渲染比例条
      return '<div class="sb-bar"><span class="sb-bar-val">' + (flag === 'na' ? '不适用' : ('余量 ' + margin + ' ' + u)) + "</span></div>";
    }
    return '<div class="sb-bar"><div class="sb-bar-track"><i class="' + cls + '" style="width:' + w + '%"></i></div>' +
      '<span class="sb-bar-val">余量 ' + margin + ' ' + u + "</span></div>";
  }
  function renderConstraintCards(result) {
    var cards = (result.constraintResults || []).map(function (r) {
      var flagCls = "sb-flag-" + (r.flag || "unknown");
      var extra = "";
      if (r.flag === "unknown") extra = '<div class="sb-unknown-note">' + esc(r.detail || "待核，不臆断") + "</div>";
      if (r.flag === "na") extra = '<div class="sb-unknown-note">该规则对本船不适用</div>';
      var flagTxt = r.kind === 'baseline' ? '能力参考' : (r.verdictCn || FLAG_CN[r.flag] || "—");
      return '<div class="sb-card ' + flagCls + '">' +
        '<div class="sb-card-h"><span class="sb-card-name">' + esc(r.name) + '</span>' +
        '<span class="sb-flag">' + esc(flagTxt) + "</span></div>" +
        (r.kind === 'baseline' ? (r.detail ? '<div class="sb-detail">' + esc(r.detail) + "</div>" : "") : marginBar(r.margin, r.flag, r.marginUnit, r.marginRef)) + extra +
        (r.source ? '<div class="sb-src">出处：' + esc(r.source.split(/[；;]/)[0]) + "</div>" : "") +
        "</div>";
    }).join("");
    return '<div class="sb-cards">' + cards + "</div>";
  }

  // —— 结论条 ——
  function renderConclusion(result) {
    var cls = "sb-concl-" + (result.conclusionFlag || "unknown");
    var note = result.missingDataNote ? '<div class="sb-missing-note">⚠ ' + esc(result.missingDataNote) + "</div>" : "";
    return '<div class="sb-conclusion ' + cls + '"><span class="sb-concl-label">结论</span><span class="sb-concl-txt">' + esc(result.conclusion) + "</span></div>" + note;
  }

  // —— 五段链（v0.2 T6: 步骤可展开显示明细 items/results + 证据）——
  function stepDetailHtml(s) {
    if (s.items && s.items.length) {
      return s.items.map(function (it) {
        return '<div class="sb-step-item"><span class="sb-item-l">' + esc(it.label || "") + '</span>' +
          '<span class="sb-item-v">' + esc(it.value || "—") + "</span>" +
          (it.source ? '<span class="sb-item-src">出处：' + esc(it.source) + "</span>" : "") + "</div>";
      }).join("");
    }
    if (s.results && s.results.length) {
      return s.results.map(function (r) {
        return '<div class="sb-step-item"><span class="sb-item-l">' + esc(r.berth || r.yard || "") + '</span>' +
          '<span class="sb-item-v">' + esc(r.verdict || r.note || "—") + "</span>" +
          (r.source ? '<span class="sb-item-src">出处：' + esc(r.source) + "</span>" : "") + "</div>";
      }).join("");
    }
    return '<div class="sb-step-empty">无明细</div>';
  }
  function renderChain(chain) {
    var icons = { fact: "①", constraint: "②", conflict: "③", alternative: "④", recommendation: "⑤" };
    var html = (chain || []).map(function (s, i) {
      var ic = icons[s.role] || (i + 1) + ".";
      return '<div class="sb-step-wrap">' +
        '<div class="sb-step" data-idx="' + i + '">' +
        '<span class="sb-step-ic">' + ic + '</span>' +
        '<span class="sb-step-role">' + esc({ fact: "事实", constraint: "约束", conflict: "冲突", alternative: "备选", recommendation: "推荐" }[s.role] || s.role) + "</span>" +
        '<span class="sb-step-t">' + esc(s.title) + '</span>' +
        '<span class="sb-step-toggle">▸</span>' +
        (s.hasSource === false ? '<span class="sb-miss">✗ 缺source</span>' : '<span class="sb-src-ok">✓</span>') + "</div>" +
        '<div class="sb-step-detail" data-idx="' + i + '" style="display:none">' + stepDetailHtml(s) + "</div>" +
        "</div>";
    }).join("");
    var cid = "sb-chain-" + Math.random().toString(36).slice(2, 8);
    var out = '<div class="sb-chain" id="' + cid + '"><div class="sb-chain-t">推理链（点步骤展开明细）</div><div class="sb-chain-steps">' + html + "</div></div>";
    // 事件委托：步骤条 → 切换展开详情
    setTimeout(function () {
      var cont = document.getElementById(cid);
      if (!cont) return;
      cont.querySelectorAll(".sb-step").forEach(function (step) {
        step.addEventListener("click", function () {
          var idx = step.getAttribute("data-idx");
          var det = cont.querySelector('.sb-step-detail[data-idx="' + idx + '"]');
          var tog = step.querySelector(".sb-step-toggle");
          if (det) {
            var open = det.style.display !== "none";
            det.style.display = open ? "none" : "block";
            if (tog) tog.textContent = open ? "▸" : "▾";
          }
        });
      });
    }, 0);
    return out;
  }

  // —— 求解 ——
  function doEval() {
    var wb = window.__WB;
    API.post("/api/solvers/" + state.schema.id + "/eval", state.values)
      .then(function (res) {
        if (res.error) throw new Error(res.error);
        state.result = res;
        renderResult(res);
      })
      .catch(function (e) { if (wb) wb.showError(e.message); });
  }

  // v0.2 T-C2: 求解器 → 首页对应剧场链（同构链才显示回链）
  var SOLVER_CHAIN = {
    'S1-BERTHING-FEASIBILITY': 'CHAIN-BERTHING-DECISION',
    'S2-THROUGHPUT': 'CHAIN-THROUGHPUT-BOTTLENECK'
  };
  function renderResult(res) {
    var area = $("sb-result");
    if (!area) return;
    // 有最新结果才渲染
    // 头部：兼容 S1(vessel×berth) 与 S2/S4(仅 berth)
    var headName = esc(res.solverName || '求解器');
    var sub = '';
    if (res.vessel && res.berth) sub = esc(res.vessel.name.split("（")[0]) + ' × ' + esc(res.berth.name);
    else if (res.berth) sub = esc(res.berth.name);
    else sub = '';
    var homeChain = SOLVER_CHAIN[res.solverId];
    var backLink = homeChain ? '<a class="sb-back-home" href="home.html?chain=' + encodeURIComponent(homeChain) + '" title="回首页剧场播放这条链">▶ 在首页播放此链</a>' : '';
    var graphLink = homeChain ? '<a class="sb-back-home" href="#/graph:' + encodeURIComponent(homeChain) + '" title="证据链图谱视图" style="margin-left:10px">🔗 链图谱</a>' : '';
    area.innerHTML =
      '<div class="sb-result-head">' + headName + (sub ? ' · ' + sub : '') + "</div>" +
      renderConclusion(res) +
      (backLink || graphLink ? '<div class="sb-back-row">' + (backLink || '') + (graphLink || '') + '</div>' : '') +
      renderConstraintCards(res) +
      renderChain(res.chain) +
      '<div class="sb-complete">本次求解链完备 ' + (res.completeness.complete ? res.completeness.have.length + "/5" : res.completeness.have.length + "/5 缺:" + (res.completeness.missing.join(",") || "source")) + "</div>";
  }

  // —— 主渲染：schema 驱动 ——
  function render(route) {
    var main = document.getElementById("wb-main");
    main.innerHTML = '<div class="sb-loading">加载求解器…</div>';
    API.fetchDomainEntities("dry-bulk").then(function (seed) {
      // 缓存 vessel 供 disabledWhen 判断
      state.vesselsById = {};
      (seed.vessels || []).forEach(function (v) { state.vesselsById[v.id] = v; });
      return API.get("/api/solvers/" + route.id + "/schema");
    }).then(function (schema) {
      state.schema = schema;
      // URL 参数预置（深链可复现）——S1 vessel/berth、S2 berth、S3 yard、S4 berth
      if (route.params.vessel) state.values.vessel = route.params.vessel;
      if (route.params.berth) state.values.berth = route.params.berth;
      if (route.params.yard) state.values.yard = route.params.yard;
      main.innerHTML =
        '<div class="sb-page"><div class="sb-head"><div class="sb-title">' + esc(schema.name) + "</div>" +
        '<div class="sb-desc">' + esc(schema.description || "") + "</div></div>" +
        renderInputs(schema) +
        '<div id="sb-result" class="sb-result"></div></div>';
      // 绑定输入变化
      document.querySelectorAll(".sb-select").forEach(function (sel) {
        sel.addEventListener("change", function () {
          state.values[sel.getAttribute("data-key")] = sel.value;
          if (sel.getAttribute("data-key") === "vessel") { /* 重渲染输入区以更新 disabledWhen */ renderInputsRefresh(); }
          doEval();
        });
      });
      // M2: slider 滑块绑定（实时刷新数值标签 + 求解）
      document.querySelectorAll(".sb-slider").forEach(function (sl) {
        function sync() {
          var k = sl.getAttribute("data-key");
          state.values[k] = Number(sl.value);
          var lab = document.getElementById("sb-slider-val-" + k);
          if (lab) lab.textContent = sl.value + ' ' + (sl.getAttribute('data-unit') || '');
          doEval();
        }
        sl.addEventListener("input", sync);
        sl.addEventListener("change", sync);
      });
      var btn = $("sb-eval-btn"); if (btn) btn.addEventListener("click", doEval);
      doEval();   // 初始求解（含深链参数）
    }).catch(function (e) { main.innerHTML = '<div class="wb-empty">加载失败：' + esc(e.message) + "</div>"; });
  }
  function renderInputsRefresh() {
    var ins = document.querySelector(".sb-inputs-row");
    if (ins && state.schema) ins.innerHTML = renderInputs(state.schema).match(/<div class="sb-inputs-row">([\s\S]*?)<\/div><button/)[1] || ins.innerHTML;
    // 重新绑定
    document.querySelectorAll(".sb-select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        state.values[sel.getAttribute("data-key")] = sel.value;
        if (sel.getAttribute("data-key") === "vessel") renderInputsRefresh();
        doEval();
      });
    });
    document.querySelectorAll(".sb-slider").forEach(function (sl) {
      function sync() {
        var k = sl.getAttribute("data-key");
        state.values[k] = Number(sl.value);
        var lab = document.getElementById("sb-slider-val-" + k);
        if (lab) lab.textContent = sl.value + ' 台';
        doEval();
      }
      sl.addEventListener("input", sync);
      sl.addEventListener("change", sync);
    });
  }

  window.__WB && window.__WB.register("solver", render);
})();
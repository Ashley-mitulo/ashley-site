/* archive-ui.js — 档案库·六维（工作台 T3.1/M3）
 * 读 /api/domains/dry-bulk/entities，按六维路由展示实体档案卡。
 * 每卡：实体名 / valueType 三色徽标 / 关键字段 / 出处。
 * 原则：取不到「—」；不编造；来源必带。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // 六维 → 数据源 + 字段展示器
  var DIM = {
    cargo:      { name: "货物特性",   src: "vessels",   fields: [["dwt_t", "载重(t)"], ["cargoName", "货种"], ["lengthOverall_m", "总长(m)"], ["designDraft_m", "设计吃水(m)"]] },
    process:    { name: "装卸工艺",   src: "equipment", fields: [["type", "类型"], ["ratedCapacity_tph", "额定(t/h)"], ["quantity", "数量"], ["berthId", "泊位"]] },
    yard:       { name: "堆场仓储",   src: "yards",     fields: [["area_m2", "面积(m²)"], ["designStorageCapacity_t", "设计容量(t)"], ["cargoType", "货种"]] },
    capacity:   { name: "作业能力",   src: "berths",    fields: [["berthClass_t", "登记等级(t)"], ["structuralDesignShip_t", "结构(t)"], ["annualThroughput_t", "年吞吐(t)"], ["apronDepth_m", "前沿水深(m)"]] },
    safety:     { name: "安全环保",   src: "safety",    fields: [] },
    regulation: { name: "法规与事件", src: "regulatory", fields: [] }
  };

  // valueType 三色徽标
  var VT = { design: ["vt-design", "台账"], measured: ["vt-measured", "实测"], forecast: ["vt-forecast", "推算"] };
  function vtBadge(vt) {
    var b = VT[vt];
    return b ? '<span class="vt-badge ' + b[0] + '">' + b[1] + "</span>" : "";
  }

  function typeCn(t) { return { vessel: "船舶", berth: "泊位", yard: "堆场", equipment: "设备", constraint: "约束规则" }[t] || t; }
  // solverRouting（实体→求解器深链，惰性缓存）
  var routingCache = null;
  function getRouting(cb) {
    if (routingCache) return cb(routingCache);
    API.fetchDomainConfig("dry-bulk").then(function (cfg) {
      routingCache = (cfg && cfg.solverRouting) || {}; cb(routingCache);
    }).catch(function () { routingCache = {}; cb(routingCache); });
  }
  function solverHref(type, item) {
    var r = routingCache && routingCache[type];
    if (!r) return null;
    if (r.route) return "workbench.html#/" + r.route;
    if (!r.solver) return null;
    var url = "workbench.html#/solver/" + r.solver;
    var val = r.via ? (item && item[r.via]) : (item && item.id);
    if (val) url += "?" + r.param + "=" + encodeURIComponent(val);
    return url;
  }

  function fileCard(item, type, dim) {
    var d = DIM[dim] || {};
    var rows = (d.fields || []).map(function (f) {
      var v = item[f[0]];
      return '<div class="ar-row"><span class="ar-k">' + esc(f[1] || f[0]) + '</span><span class="ar-v">' + (v != null ? esc(v) : "—") + "</span></div>";
    }).join("");
    var href = solverHref(type, item);
    return '<div class="ar-card">' +
      '<div class="ar-card-h"><span class="ar-type">' + typeCn(type) + '</span>' +
      '<span class="ar-name">' + esc(item.name || "—") + "</span>" + vtBadge(item.valueType) + "</div>" +
      (rows ? '<div class="ar-rows">' + rows + "</div>" : "") +
      (item.source ? '<div class="ar-src">出处：' + esc(item.source) + "</div>" : "") +
      (href ? '<a class="ar-wb" href="' + esc(href) + '">🛠️ 去工作台求解 →</a>' : "") +
      "</div>";
  }

  // 法规/事件专用卡片（字段各异，不套统一 rows 模板）
  function regCard(item) {
    var kindCn = { regulation: "法规", accident: "事故案例", emergency: "应急措施" }[item.kind] || (item.type || "");
    var kick = item.kick || "—";
    var body = item.body || "";
    var src = item.source ? '<div class="ar-src">出处：' + esc(item.source) + "</div>" : "";
    var statusTag = item.statusTag ? '<span class="reg-status reg-status-' + (item.statusTone || "") + '">' + esc(item.statusTag) + "</span>" : "";
    return '<div class="ar-card">' +
      '<div class="ar-card-h"><span class="ar-type">' + kindCn + '</span>' +
      '<span class="ar-name">' + esc(item.name || "—") + "</span>" + statusTag + (item.badge ? vtBadge(item.badge) : "") + "</div>" +
      (kick ? '<div class="ar-rows"><div class="ar-row"><span class="ar-k">要览</span><span class="ar-v">' + esc(kick) + "</span></div></div>" : "") +
      (body ? '<div class="ar-rows"><div class="ar-row"><span class="ar-k">要点</span><span class="ar-v ar-multi">' + esc(body).replace(/\n/g, "<br>") + "</span></div></div>" : "") +
      src + "</div>";
  }

  // 安全环保维卡片（货种危险特性：气体释放/自热/粉尘/环境约束，body 含 HTML）
  function safetyCard(item) {
    var kick = item.kick ? '<div class="ar-rows"><div class="ar-row"><span class="ar-k">判定</span><span class="ar-v">' + esc(item.kick) + "</span></div></div>" : "";
    var bodyRow = "";
    if (item.body) {
      bodyRow = '<div class="ar-rows"><div class="ar-row"><span class="ar-k">危险特性</span><span class="ar-v ar-multi">' + (item.isHtml ? item.body : esc(item.body)) + "</span></div></div>";
    } else if (item.basis) {
      bodyRow = '<div class="ar-rows"><div class="ar-row"><span class="ar-k">依据</span><span class="ar-v">' + esc(item.basis) + "</span></div></div>";
    }
    var src = item.source ? '<div class="ar-src">出处：' + esc(item.source) + "</div>" : "";
    return '<div class="ar-card">' +
      '<div class="ar-card-h"><span class="ar-type">' + (item.kind === 'hazard' ? '货种危险特性' : '约束') + '</span>' +
      '<span class="ar-name">' + esc(item.name || "—") + "</span>" + (item.badge ? vtBadge(item.badge) : "") + "</div>" +
      kick + bodyRow + src + "</div>";
  }

  // safety 维：从 constraints 里 chainType 含 compliance 的 + 其他安全规则
  function renderDimension(route) {
    var dim = route.id || "cargo";
    var main = $("wb-main");
    main.innerHTML = '<div class="ar-loading">加载档案库…</div>';
    getRouting(function () {
      API.get("/api/domains/dry-bulk/entities").then(function (seed) {
        var cfg = DIM[dim] || DIM.cargo;
        var items = [];
        if (dim === "safety") {
          // 任务D：安全环保维并入「货种危险特性」（资料反推：六事故致因全为气体风险）
          return API.get("/api/domains/dry-bulk/regulatory").then(function (reg) {
            var items = [];
            // 标准空白（先展示：为什么这里行业无强制通用标准——资料 §二 显式事实）
            if (reg.standardGap) {
              var sg = reg.standardGap;
              var seriesHtml = '<b>' + sg.fact + '</b><div class="ar-sep"></div><span class="ar-muted">GB 16994 系列现有部分：</span>'
                + (sg.series || []).map(function (s) { return '<br>· ' + s.part + ' ' + s.name + (s.replaces ? '（代 ' + s.replaces + '）' : '') + (s.effectiveFrom ? '（' + s.effectiveFrom + '施行）' : ''); }).join('')
                + '<div class="ar-sep"></div><span class="ar-muted">现行适用依据：</span>'
                + (sg.currentApplicableBasis || []).map(function (b) { return '<br>· ' + b.area + '：' + b.basis; }).join('');
              items.push({
                kind: 'fact', type: 'safety', name: '干散货作业安全标准空白（scope-note，非约束）',
                kick: 'GB 16994《港口作业安全要求》系列无干散货本体部分——已核实，非缺失',
                body: seriesHtml, source: sg.source || '—', badge: 'design', isHtml: true
              });
            }
            // 子类1-4：按货种危险特性（气体释放/自热/粉尘/环境约束）
            (reg.cargoHazardMap || []).forEach(function (c) {
              var k = [];
              if (c.isDangerousGoodsUnderGB6944 != null) k.push('危险货物: ' + (c.isDangerousGoodsUnderGB6944 ? '是' : '否（IMSBC ' + (c.imsbcGroup || '—') + '）'));
              if (c.surfaceMoistureRequirement_pct != null) k.push('表面含水率≥' + c.surfaceMoistureRequirement_pct + '%');
              var props = '';
              if (c.note && c.entries) props += '<b>⚠ ' + c.note + '</b><div class="ar-sep"></div>';
              if (c.hazardProperties && c.hazardProperties.length) {
                props += (c.hazardProperties || []).map(function (p) {
                  var q = p.quantitative;
                  var qStr = q ? (q.methaneExplosiveRange_pct ? '（甲烷爆炸区间 ' + q.methaneExplosiveRange_pct.join('%~') + '%）' : '') : '';
                  return '<b>' + (p.property || '') + '</b>' + qStr + '<br><span class="ar-muted">' + (p.detail || '') + '</span>';
                }).join('<div class="ar-sep"></div>');
              }
              if (c.entries && c.entries.length) {
                props += (props ? '<div class="ar-sep"></div>' : '') +
                  '跨类别条目：' + c.entries.map(function (e) { return '<b>' + e.unNumber + '</b> ' + (e.class || '') + '（' + (e.classFamily || '') + '）'; }).join('；');
              }
              if (c.exclusionNote) props += (props ? '<div class="ar-sep"></div>' : '') + '<span class="ar-muted">' + c.exclusionNote + '</span>';
              items.push({
                kind: 'hazard', type: 'safety', name: c.cargoName || c.cargo || '货种',
                kick: k.join(' · '),
                body: props,
                source: c.source || '—', badge: 'measured', isHtml: true
              });
            });
            // 现有合规/能力约束派生项
            items = items.concat((seed.constraints || []).filter(function (c) { return /compliance|rule/.test(c.chainType || ""); })
              .map(function (c) { return { kind: 'constraint', type: 'constraint', name: c.name, valueType: c.valueType, source: c.source, basis: c.basis, kick: c.basis || '', body: '', badge: 'design' }; }));
            items.forEach(function (it) { if (!it.kind) it.kind = it.type; });
            renderGrid(cfg, items, safetyCard, '<a class="ar-chainlink" href="home.html?chain=CHAIN-SAFETY-DECISION" style="display:inline-block;margin:0 0 10px 16px;padding:7px 14px;border-radius:6px;background:var(--accent-fill,#2f6fed);color:#fff;text-decoration:none;font-size:13px">▶ 干散货货种安全判定链（危险特性→事故→管控）</a>');
          }).catch(function (e) { main.innerHTML = '<div class="wb-empty">安全环保维加载失败：' + esc(e.message) + "</div>"; });
        } else if (dim === "regulation") {
          // TF-3b→干散货专属：dry-bulk.regs.json（法规带时效状态/条款/事故/类别/标准空白）
          return API.get("/api/domains/dry-bulk/regulatory").then(function (reg) {
            var items = [];
            // 法规（带时效状态徽标：现行/失效/征求意见稿/待核）
            (reg.regulations || []).forEach(function (r) {
              var statusMap = { "in-force": "现行", "superseded": "失效", "draft": "征求意见稿", "to-verify": "待核" };
              var st = statusMap[r.status] || "";
              var meta = [];
              if (r.level) meta.push(r.level);
              if (r.docNumber) meta.push(r.docNumber);
              if (r.effectiveFrom) meta.push(r.effectiveFrom ? r.effectiveFrom.replace("-", ".").replace("-", ".") : "");
              if (r.status === "superseded" && r.supersededOn) meta.push("⇋" + r.supersededOn.replace("-", ".").replace("-", "."));
              items.push({
                kind: "regulation", type: "regulation", name: r.name || r.id,
                kick: meta.join(" · "),
                body: (r.note || r.warning || r.scopeText || "") + (r.keyClausesUsed && r.keyClausesUsed.length ? "\n[关键条款] " + r.keyClausesUsed.join(", ") : ""),
                source: r.source || "—", badge: "design",
                statusTag: st, statusTone: r.status === "in-force" ? "ok" : (r.status === "superseded" || r.status === "to-verify" ? "warn" : "draft")
              });
            });
            // 事故案例（干散货专属：date/location/summary/directCause/casualties）
            (reg.accidents || []).forEach(function (a) {
              var cs = a.casualties;
              var k = [];
              if (a.date) k.push(a.date);
              if (a.location) k.push(a.location);
              if (cs && (cs.dead != null || cs.injured != null)) k.push("死" + (cs.dead != null ? cs.dead : 0) + "/伤" + (cs.injured != null ? cs.injured : 0));
              if (a.operationPhase) k.push(a.operationPhase);
              items.push({
                kind: "accident", type: "accident", name: a.name,
                kick: k.join(" · "),
                body: (a.directCause ? "[直接原因] " + a.directCause : "") + (a.summary ? "\n" + a.summary : "") + ((a.violations && a.violations.length) ? "\n[违规] " + a.violations.map(function (v) { return v.item; }).join("；") : ""),
                source: a.source || a.link || "—", badge: "measured"
              });
            });
            // 应急措施（若存在）
            (reg.emergency || []).slice(0, 8).forEach(function (e) {
              items.push({
                kind: "emergency", type: "emergency", name: e.name,
                kick: e.scenario || e.applies || "—",
                body: e.steps || "",
                source: e.source || "—", badge: "forecast"
              });
            });
            renderGrid(cfg, items, regCard, '<a class="ar-chainlink" href="home.html?chain=CHAIN-DRYBULK-COMPLIANCE" style="display:inline-block;margin:0 0 10px 16px;padding:7px 14px;border-radius:6px;background:var(--accent-fill,#2f6fed);color:#fff;text-decoration:none;font-size:13px">▶ 干散货堆场合规条款校验（5 条款进链）</a>');
          }).catch(function (e) { main.innerHTML = '<div class="wb-empty">法规库加载失败：' + esc(e.message) + "</div>"; });
        } else {
          var srcKey = cfg.src;
          var semType = srcKey === "vessels" ? "vessel" : srcKey === "berths" ? "berth" : srcKey === "yards" ? "yard" : "equipment";
          items = (seed[srcKey] || []).map(function (it) { return Object.assign({}, it, { type: semType }); });
        }
        renderGrid(cfg, items, function (it) { return fileCard(it, it.type, dim); });
      }).catch(function (e) { main.innerHTML = '<div class="wb-empty">加载失败：' + esc(e.message) + "</div>"; });
    });
  }

  // 统一渲染列表（各维自定义卡片渲染器）
  function renderGrid(cfg, items, cardFn, headExtra) {
    var main = $("wb-main");
    var html = items.map(function (it) { return cardFn(it); }).join("");
    main.innerHTML =
      '<div class="ar-page"><div class="ar-head"><div class="ar-title">档案库 · ' + esc(cfg.name) + "</div>" +
      '<div class="ar-desc">' + items.length + " 条实体档案（design=台账 / measured=实测 / forecast=推算）</div></div>" +
      (headExtra || "") +
      '<div class="ar-grid">' + (html || '<div class="wb-empty">该维暂无数据</div>') + "</div></div>";
  }

  window.__WB && window.__WB.register("archive", renderDimension);
})();
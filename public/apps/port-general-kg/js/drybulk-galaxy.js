/* drybulk-galaxy.js — 干散货域六维星系（独立渲染，不依赖危货 overview/topo）
 * 数据源：window.__DRY_BULK_SEED（全部真实，带 source）
 * 关系网：泊位(3) ↔ 设备(挂泊位) ↔ 堆场(配套泊位) ↔ 船舶(目标泊位) ↔ 约束(校验泊位)
 * 六维映射（真实实体 → 干散货域维度）：
 *   cargo 货物特性   : 铁矿石、40万吨VLOC(载40万)
 *   process 装卸工艺  : 卸船机3500t/h×2、皮带10500t/h、单船卸率10156t/h
 *   yard 堆场仓储    : 董家口堆场400万㎡、D31堆场125万㎡
 *   safety 安全环保   : 水深余量0.05m临界、长度余量3m临界
 *   capacity 作业能力 : 董家口D1(靠40万)、D31(靠30万/结构40万)、日照岚山(靠30万/结构40万)
 *   regulation 法规事件: R1水深规范、R2长度规范、40万吨批复名单
 */
(function () {
  "use strict";
  var CX = 450, CY = 262, R_DOMAIN = 150, R_REP = 50;
  function seedNow() { return window.__DRY_BULK_SEED || null; }

  // 干散货六维：优先读后端配置(lens，配置驱动)；暂无则用内置默认
  var DRY_DOMAINS = [
    { key: "cargo", name: "货物特性", color: "#b5651d" },
    { key: "process", name: "装卸工艺", color: "#3a7bd5" },
    { key: "yard", name: "堆场仓储", color: "#7eb356" },
    { key: "safety", name: "安全环保", color: "#e0863c" },
    { key: "capacity", name: "作业能力", color: "#2dd4a7" },
    { key: "regulation", name: "法规事件", color: "#b28cff" }
  ];
  // 允许外部注入配置化六维（来自 /api/domains/:id/config lens）
  function setDomains(dims) { if (Array.isArray(dims) && dims.length) { DRY_DOMAINS = dims; api.domains = dims; } }
  var api = { render: render, domains: DRY_DOMAINS, setDomains: setDomains, repsFor: repsFor };
  window.__DRY_BULK_GALAXY = api;

  // 各维度的真实代表实体（来自 SEED，不编造）：返回 {name, kind, id}，点击可开详情
  function repsFor(key) {
    var SEED = seedNow();
    if (!SEED) return [];
    function B(id) { var b=(SEED.berths||[]).filter(function(x){return x.id===id;})[0]; return b; }
    switch (key) {
      case "cargo": {
        var v=(SEED.vessels||[])[0];
        return v ? [{ name: v.name + "（" + (v.dwt_t?(v.dwt_t/10000)+"万吨":"") + "）", kind: "vessel", id: v.id }] : [];
      }
      case "process":
        return (SEED.equipment||[]).map(function (e) {
          return { name: e.name + " " + (e.ratedCapacity_tph||"") + "t/h×" + (e.quantity||1), kind: "equipment", id: e.id };
        });
      case "yard":
        return (SEED.yards||[]).map(function (y) {
          return { name: y.name + "（" + (y.area_m2? (y.area_m2/10000)+"万㎡":"") + "）", kind: "yard", id: y.id };
        });
      case "safety": {
        // 安全环保维度：靠泊链里临界余量 & 硬否决的现实约束（真实 seed 计算结果）
        var ch = (SEED.chains||[])[0], out = [];
        if (ch) {
          (ch.steps||[]).forEach(function (st) {
            if (!st.results) return;
            (st.results||[]).forEach(function (r) {
              if (r.flag === "critical" && r.berth) {
                var bid = null;
                (SEED.berths||[]).forEach(function(b){ if((b.name||"").indexOf(r.berth)>=0) bid=b.id; });
                out.push({ name: st.title + "·" + r.berth + " 余量" + r.margin_m + "m 临界", kind: bid?"berth":"constraint", id: bid || "R1-APRON-DEPTH" });
              }
              if (r.flag === "veto") out.push({ name: "名单外泊位 · 硬否决", kind: "constraint", id: "R3-BERTHING-COMPLIANCE" });
            });
          });
        }
        return out.length ? out.slice(0,4) : [];
      }
      case "capacity":
        return (SEED.berths||[]).map(function (b) {
          return { name: b.name + " 靠" + (b.berthClass_t? (b.berthClass_t/10000)+"万吨":"") + "级", kind: "berth", id: b.id };
        });
      case "regulation":
        return (SEED.constraints||[]).map(function (c) {
          // B-4: 无《时回退 c.name（括号保证优先级：整体取不到才用 c.name）
          var basisName = ((c.basis||"").split("§")[0].split("《")[1] || c.name);
          return { name: c.name + "·" + basisName, kind: "constraint", id: c.id };
        });
    }
    return [];
  }

  function render(chart, echarts) {
    var SEED = seedNow();
    if (!chart || !SEED) return false;
    var nodes = [], links = [], center = "kg_center";
    nodes.push({ id: center, name: "干散货\n· 全域", x: CX, y: CY, symbolSize: 82, category: "center",
      label: { show: true, fontSize: 12, color: "#e2e8f0", position: "inside", lineHeight: 16 },
      itemStyle: { color: "#132442", borderColor: "#b5651d", borderWidth: 2 } });

    DRY_DOMAINS.forEach(function (dm, i) {
      var a = (-90 + i * 60) * Math.PI / 180;
      var cx = CX + R_DOMAIN * Math.cos(a), cy = CY + R_DOMAIN * Math.sin(a);
      var dmId = "dom_" + dm.key;
      links.push({ source: center, target: dmId, type: "centerlink" });
      nodes.push({ id: dmId, name: dm.name, x: cx, y: cy, symbolSize: 26, category: "domain", domainKey: dm.key,
        label: { show: true, position: "inside", fontSize: 12, color: "#0b1222", fontWeight: 700 }, itemStyle: { color: dm.color } });
      var reps = repsFor(dm.key) || [];
      (reps||[]).slice(0,6).forEach(function (obj, j) {
        var b = (j / Math.max(1,reps.length)) * 2 * Math.PI + (i*0.5);
        var Rr = 22 + 40 * (1 - 0.35);   // 默认中等轨道
        var px = cx + Rr*Math.cos(b), py = cy + Rr*Math.sin(b);
        var full = obj.name || String(obj); var nm = full; if (nm.length>12) nm = nm.slice(0,11)+"…";
        var nid = "rep_"+dm.key+"_"+j;
        var node = { id: nid, name: nm, full: full, x: px, y: py, symbolSize: 9, category: dm.key,
          label: { show: false }, itemStyle: { color: dm.color } };
        // 挂实体引用（kind/id），供点击开详情——见 __DRY_BULK_DETAIL
        if (obj.kind && obj.id) node.detail = { kind: obj.kind, id: obj.id };
        nodes.push(node);
        links.push({ source: dmId, target: nid, type: "member" });
      });
    });

    var series = { type:"graph", layout:"none", roam:true, data:nodes, links:links,
      focusNodeAdjacency:false, emphasis:{focus:"adjacency",scale:1.15,lineStyle:{width:2}},
      blur:{itemStyle:{opacity:0.28},lineStyle:{opacity:0.12}},
      label:{show:false}, labelLayout:{hideOverlap:true,moveOverlap:"shiftY"},
      lineStyle:{color:"source",curveness:0.15,opacity:0.35}, edgeSymbol:["none","arrow"],
      animationDuration:800, animationEasing:"cubicOut",
      animationDelay:function(idx){ return idx*18; } };

    chart.setOption({ tooltip:{trigger:"item",formatter:function(p){return p.dataType==="edge"?"":(p.data.full||p.data.name);}}, series:[series] }, true);
    return true;
  }

  window.__DRY_BULK_GALAXY = api;
})();

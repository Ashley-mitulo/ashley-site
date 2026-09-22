/* graph.js — ECharts 力导向图封装
 * 类型配色与 index.html 侧边图例一致。每个节点直接强设颜色（不依赖 category 配色）。
 * 支持：点击绑定、选中高亮（选中节点+直接邻居放大描边，再次点击切换）。 */
window.PKG_GRAPH = (function () {
  var TYPE_COLOR = {
    dangerous_goods: "#ff9f43",   // 危险货物（橙）
    enterprise: "#2dd4a7",        // 企业（绿）
    accident: "#ff5c5c",          // 历史事故（红）
    emergency_measure: "#4dc3ff", // 应急处置（蓝）
    chemical_reaction: "#b28cff", // 化学反应（紫）
    regulation: "#67e3a1",        // 法规标准
    storage_tank: "#7f8ea3"       // 储罐（青灰/钢灰，提案⑦）
  };
  var DIM_COLOR = { normal: 0.35, highlight: 1 };
  // 提案⑦：储罐截面介质液位色（半透明青）、SVG 容器尺寸

  function colorFor(type) { return TYPE_COLOR[type] || "#cccccc"; }
  function dimColor(hex, f) {
    var c = parseInt(hex.slice(1), 16), r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    var mix = function (v) { return Math.round(v * f + 18 * (1 - f)); };
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }

  // ---- 提案⑦：储罐 SVG 剖面图生成（球罐/立罐/卧罐，带液位介质色块）----
  // ---- 提案⑦：储罐剖面剪影 symbol（ECharts 原生 path:// 矢量，不走图片加载，绝不变灰框）----
  // 24×24 归一坐标；外轮廓子路径由 ECharts 按 itemStyle.color 填充。
  function tankSVG(tankType) {
    if (/球/.test(tankType)) {
      // 球罐：主体圆 + 底部支腿 + 液位横线
      return "path://" +
        "M12,4a8,8 0 1,0 0,16a8,8 0 1,0 0,-16z" +
        "M9,20 L9,22 M15,20 L15,22 M8,21.5 L16,21.5" +
        "M7,13 L17,13";
    } else if (/卧/.test(tankType)) {
      // 卧罐：横向椭圆 + 液位横线
      return "path://" +
        "M5,13a7,5 0 1,0 14,0a7,5 0 1,0 -14,0z" +
        "M6,15 L18,15";
    } else {
      // 立罐：顶部半圆封头 + 直筒 + 底 + 液位线
      return "path://" +
        "M8,11 A4,4 0 0 1 16,11" +
        "L16,20 L8,20 Z" +
        "M8,15 L16,15";
    }
  }
  // 储罐专用 tooltip 扩展：罐型/容积/介质/风险级（从 label/name/props 兜底解析）
  function tankCategory(name) {
    name = name || '';
    if (/球罐|球形/.test(name)) return '球罐';
    if (/卧罐|卧式/.test(name)) return '卧罐';
    if (/外浮顶|浮顶/.test(name)) return '浮顶罐';
    if (/内浮顶/.test(name)) return '内浮顶罐';
    if (/拱顶/.test(name)) return '拱顶罐';
    return '';
  }
  function tankTooltipHTML(name, props) {
    props = props || {};
    var cat = tankCategory(name);
    var rows = [];
    var tt = props.tank_type || cat;
    if (tt) rows.push('罐型：' + tt);
    if (props.capacity_m3 != null) rows.push('容积：' + props.capacity_m3 + ' m³');
    var cap = String(name || '').match(/(\d+)\s*m³/);
    if (!rows.length && cap) rows.push('容积：' + cap[1] + ' m³');
    if (props.medium) rows.push('介质：' + props.medium);
    if (props.medium_status) rows.push('介质状态：' + props.medium_status);
    var body = rows.length ? '<br/>' + rows.join('<br/>') : '';
    return '<b style="color:#fff">' + name + '</b>' + body;
  }

  function buildOption(topology, opts) {
    var onNodeClick = opts && opts.onNodeClick;
    var baseColor = (opts && opts.baseColor) || null; // 若指定，则所有节点同色基调
    // 计算每个节点度数（关联关系数），用于节点大小映射（P1-3：高危货种/枢纽更大更显著）
    var deg = {};
    (topology.links || []).forEach(function (l) {
      deg[l.source] = (deg[l.source] || 0) + 1;
      deg[l.target] = (deg[l.target] || 0) + 1;
    });
    var maxDeg = Object.keys(deg).reduce(function (m, k) { return Math.max(m, deg[k]); }, 1);
    var baseSizes = { dangerous_goods: 26, enterprise: 32, accident: 22, emergency_measure: 20, chemical_reaction: 20, regulation: 20, storage_tank: 34 };
    var nodes = (topology.nodes || []).map(function (n) {
      var type = n.type || n.category || (n.props && n.props.type) || '';
      var d = deg[n.id] || 0;
      // 度数越大节点越大（映射到 基~基+28），高连接实体视觉突出
      var size = (baseSizes[type] || 20) + Math.round((d / maxDeg) * 28);
      var item = { id: n.id, name: n.label || n.name, category: type, symbolSize: size, itemStyle: { color: colorFor(type) } };
      // 提案⑦：储罐节点换 SVG 罐体剖面 symbol（tank_type 从 props 或 label 解析）
      if (type === 'storage_tank') {
        var tname = item.name;
        var tt = (n.props && n.props.tank_type) || tankCategory(tname);
        item.symbol = tankSVG(tt);
        item.symbolSize = size + 12;      // 储罐剖面需更大像素才看得清细节
        // 罐体剪影：半透明填充 + 浅色描边，让轮廓/液位线/支腿清晰可辨
        item.itemStyle = { color: "rgba(127,142,163,0.20)", borderColor: "#8fa3b8", borderWidth: 2 };
        item.emphasis = { itemStyle: { color: "rgba(127,142,163,0.35)", borderColor: "#bfd0e0", borderWidth: 3 } };
      }
      item.__color = colorFor(type);
      item.__type = type;
      item.__baseSize = size;
      item.__props = n.props || {};   // 提案⑦：供 tooltip 读罐型/容积/介质
      item.props = n.props || {};
      return item;
    });
    var links = (topology.links || []).map(function (l) {
      return { source: l.source, target: l.target, label: { show: true, formatter: l.label || "", fontSize: 10, color: "#9aa5b1" } };
    });
    return {
      tooltip: {
        trigger: "item",
        formatter: function (p) {
          if (p.dataType === "edge") return p.data.label ? p.data.label : "";
          if (p.data && p.data.category === "storage_tank") return tankTooltipHTML(p.data.name || p.name, p.data.props || p.data.__props);
          return (p.data.name || p.name) + "　·　" + (p.data.category || "");
        }
      },
      series: [{
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        data: nodes,
        links: links,
        label: { show: true, position: "right", fontSize: 11, color: "#333" },
        force: { repulsion: 300, gravity: 0.1, edgeLength: [70, 150] },
        emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
        lineStyle: { color: "#9aa5b1", width: 1.4, curveness: 0.06 },
        categories: (topology.nodes || []).reduce(function (acc, n) {
          var t = n.type || n.category || (n.props && n.props.type) || '';
          if (!acc.some(function (c) { return c.name === t; })) acc.push({ name: t, itemStyle: { color: colorFor(t) } });
          return acc;
        }, [])
      }]
    };
  }

  var charts = {};

  function bindClick(chart, onNodeClick) {
    if (!onNodeClick) return;
    chart.off("click");
    chart.on("click", function (p) {
      if (p.dataType && p.dataType === "edge") return;
      var node = (p.data && p.data.id) ? p.data : null;
      if (node) onNodeClick(node.id, node.name, node.category);
    });
  }

  // 重置某图所有节点为原始颜色/大小
  function resetStyles(chart) {
    var option = chart.getOption();
    var data = (option.series && option.series[0] && option.series[0].data) || [];
    data.forEach(function (n) {
      n.itemStyle = { color: n.__color || colorFor(n.__type) };
      n.symbolSize = n.__baseSize || (n.__type === "dangerous_goods" ? 40 : (n.__type === "enterprise" ? 48 : 30));
      n.label = { show: true, position: "right", fontSize: 11, color: "#333" };
    });
    chart.setOption({ series: [{ data: data }] });
  }

  return {
    init: function (container, opts) {
      var el = (typeof container === "string") ? document.getElementById(container) : container;
      if (!el || typeof echarts === "undefined") return null;
      var chart = echarts.init(el);
      chart.setOption(buildOption((opts && opts.topology) || { nodes: [], links: [] }, opts));
      bindClick(chart, opts && opts.onNodeClick);
      charts[el.id || "main"] = chart;
      return chart;
    },
    render: function (el, topology, onNodeClick, opts) {
      el = (typeof el === "string") ? document.getElementById(el) : el;
      var id = el && el.id || "main";
      var chart = charts[id];
      if (!chart && echarts && el) { chart = echarts.init(el); charts[id] = chart; }
      if (chart) {
        chart.setOption(buildOption(topology || { nodes: [], links: [] }, onNodeClick ? { onNodeClick: onNodeClick } : (opts || {})), true);
        bindClick(chart, onNodeClick);
      }
      return chart;
    },
    // 高亮选中节点 + 直接邻居；其余淡化。传入 nodeId=null 取消高亮。
    highlight: function (el, nodeId, neighbors) {
      el = (typeof el === "string") ? document.getElementById(el) : el;
      var chart = charts[el && el.id || "main"];
      if (!chart) return;
      var option = chart.getOption();
      var data = (option.series && option.series[0] && option.series[0].data) || [];
      if (!nodeId) { resetStyles(chart); return; }
      // 收集选中 + 邻居 id 集合
      var highlightIds = new Set([nodeId]);
      (neighbors || []).forEach(function (n) { highlightIds.add(n.id); });
      data.forEach(function (n) {
        var isSel = n.id === nodeId;
        var isNb = highlightIds.has(n.id) && !isSel;
        if (isSel) {
          n.symbolSize = 58;
          n.itemStyle = { color: n.__color || colorFor(n.__type), shadowBlur: 18, shadowColor: "rgba(255,200,0,0.95)", borderColor: "#fff", borderWidth: 2 };
          n.label = { show: true, position: "right", fontSize: 13, color: "#fff", fontWeight: "bold" };
        } else if (isNb) {
          n.symbolSize = (n.__type === "dangerous_goods" ? 40 : (n.__type === "enterprise" ? 48 : 30)) * 1.15;
          n.itemStyle = { color: n.__color || colorFor(n.__type), shadowBlur: 12, shadowColor: "rgba(255,255,255,0.5)", borderColor: "#fff", borderWidth: 1 };
          n.label = { show: true, position: "right", fontSize: 12, color: "#fff", fontWeight: "600" };
        } else {
          n.symbolSize = n.__type === "dangerous_goods" ? 40 : (n.__type === "enterprise" ? 48 : 30);
          n.itemStyle = { color: dimColor(n.__color || colorFor(n.__type), DIM_COLOR.normal) };
          n.label = { show: true, position: "right", fontSize: 10, color: "#7b8794" };
        }
      });
      chart.setOption({ series: [{ data: data }] });
    },
    resize: function () { for (var k in charts) if (charts[k]) charts[k].resize(); }
  };
})();
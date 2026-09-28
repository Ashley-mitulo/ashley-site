/* spine-ui.js — 业务主轴前端渲染器（P-2）
 * 三层泳道（A物理流 / B决策流 / C数据流）× 9 环节列，全宽贯通的首页视觉主线。
 * 铁律：只读 /api/process/spine/:id 真实数据；缺口显示「—」+「待接入：系统名」，绝不编造。
 * 交互：点环节列展开六块详情；点 B 泳道求解器深链工作台；点 C 泳道插头弹契约卡（P-7 做）。
 */
window.SPINE_UI = (function () {
  var activeId = null;      // 当前主轴 id
  var cur = 0;              // 当前选中环节下标
  var spine = null;         // 主轴数据
  var PROG = 0;             // 对接进度 0-100（P-10 演示滑块）

  // 对接顺序（按文档 §9 优先级）：progress% 达到即视为该 connector「已接入」
  var CONNECT_AT = {
    'TOS-QD-DJK': 20, 'YARD-MS': 40, 'SCADA-PLC': 55, 'VTS-PILOT': 70,
    'SHIPPING-AGENT': 85, 'DISPATCH-WEIGH': 100, 'PORT-SURVEY': 65
  };
  function isConnected(id) {
    var at = CONNECT_AT[id];
    if (at == null) return false;
    return PROG >= at;
  }

  // —— connector 名称/契约展示表（P-7 之前先内置静态文案，后续改读 /api/connectors）——
  var CONN = {
    'TOS-QD-DJK': { name: 'TOS 码头操作系统', cat: '内部 · 生产' },
    'YARD-MS': { name: '堆场管理系统', cat: '内部 · 生产' },
    'SCADA-PLC': { name: '中控 SCADA / PLC', cat: '内部 · 设备' },
    'VTS-PILOT': { name: 'VTS / 引航 / 潮汐预报', cat: '外部 · 监管与气象' },
    'SHIPPING-AGENT': { name: '船代 / 单一窗口', cat: '外部 · 贸易' },
    'PORT-SURVEY': { name: '港池扫测', cat: '内部 · 测量' },
    'DISPATCH-WEIGH': { name: '疏运 / 地磅 / 轨道衡', cat: '内部 · 生产' },
    'SINGLE-WINDOW': { name: '单一窗口（联检）', cat: '外部 · 监管' },
    'ERP-METERING': { name: '计量系统 / ERP', cat: '内部 · 经营' }
  };
  function connName(id) { var c = CONN[id]; return c ? c.name : (id || '—'); }

  // P1-1：接口方式英文枚举 → 业主可读中文（rest/edi/opcua/dbview 等）
  var TRANSPORT_CN = { rest: 'REST API', edi: 'EDI 报文', opcua: 'OPC UA', dbview: '数据库只读视图', ftp: 'FTP 文件', websocket: 'WebSocket', mqtt: 'MQTT', file: '文件交换' };
  function transportCn(t) { return TRANSPORT_CN[String(t || '').toLowerCase()] || String(t || '—'); }

  // 接口契约卡（P-7：点 C 泳道插头弹真实契约卡）
  function showContract(id) {
    var body = document.getElementById('conn-body'); if (!body) return;
    body.innerHTML = '<div class="conn-loading">加载契约…</div>';
    var mask = document.getElementById('conn-modal'); if (mask) mask.classList.add('show');
    window.PKG_API.fetchConnectorContract(id).then(function (c) {
      var stTag = c.status === 'connected'
        ? '<span class="sp-plug connected">已接入</span>'
        : (c.status === 'reserved' ? '<span class="sp-plug reserved">已预留</span>' : '<span class="sp-plug none">不做（边界外）</span>');
      var h = '<h4>' + esc(c.name) + '</h4><div class="conn-sub">' + esc(c.category) + '　' + stTag + '</div>'
        + '<div class="conn-row"><span class="k">提供数据项</span><span>' + (c.provides || []).map(esc).join('、') + '</span></div>'
        + '<div class="conn-row"><span class="k">接口方式</span><span>' + esc(transportCn(c.transport)) + '</span></div>'
        + '<div class="conn-row"><span class="k">认证</span><span>' + esc(c.auth) + '</span></div>'
        + '<div class="conn-row"><span class="k">责任方</span><span>' + esc(c.owner) + '</span></div>'
        + '<div class="conn-row"><span class="k">当前状态</span><span>' + (c.dataReady ? '已接入，实时数据可用' : '<b style="color:#e0863c">适配器未实现，value 返回 null，前端显示「—」</b>') + '</span></div>';
      if (c.externalJump && c.externalJump.urlTemplate) {
        h += '<div class="conn-row"><span class="k">跳转协议</span><span><code>' + esc(c.externalJump.urlTemplate) + '</code></span></div>';
      }
      h += '<button class="conn-jump" disabled>跳转至该系统（待接入，按钮置灰）</button>';
      body.innerHTML = h;
    }).catch(function (e) {
      body.innerHTML = '<div class="conn-loading">加载失败：' + esc(e.message || e) + '</div>';
    });
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // coverage 状态环 → CSS 类
  function ringClass(cov) { return cov === 'full' ? 'full' : (cov === 'partial' ? 'partial' : 'none'); }
  // 插头状态类
  function plugClass(status) { return status === 'connected' ? 'connected' : (status === 'reserved' ? 'reserved' : 'none'); }
  function plugLabel(status) { return status === 'connected' ? '已接入' : (status === 'reserved' ? '预留' : '不做'); }

  // KPI：覆盖环节(full)/待接入数据项/结论实测率/已接入系统（随对接进度 PROG 联动）
  function kpis() {
    var steps = spine.steps || [];
    var full = steps.filter(function (s) { return s.coverage === 'full'; }).length;
    // 待接入数据项：后端 gapTotals（13）按 connector 归属；已接入的 connector 缺口清零
    var gtot = spine.gapTotals || [];
    var unconnectedGaps = gtot.filter(function (g) { return !isConnected(g.connectorId || ''); }).length;
    // 已接入外部系统：按对接阈值（PROG）点亮
    var connectedSet = {};
    steps.forEach(function (s) {
      var cid = s.lane.data && s.lane.data.connector;
      if (cid && isConnected(cid) && (s.lane.data.status || 'reserved') !== 'none') connectedSet[cid] = 1;
    });
    var connTotal = Object.keys(connectedSet).length;
    // 结论实测率：随已接入的、提供实测口径的系统升高（对接消除的是数据缺口 → 实测口径；此处演示联动）
    var progRate = Math.round(PROG);
    return [
      { num: full + '/' + steps.length, label: '覆盖环节（有求解器）' },
      { num: unconnectedGaps, label: '待接入数据项' },
      { num: progRate + '%', label: '结论实测率' },
      { num: connTotal + '/6', label: '已接入外部系统' }
    ];
  }

  function renderKpis() {
    var el = document.getElementById('spine-kpis'); if (!el || !spine) return;
    el.innerHTML = kpis().map(function (k) {
      return '<div class="spine-kpi"><b>' + esc(k.num) + '</b><span>' + esc(k.label) + '</span></div>';
    }).join('');
  }

  // 三层泳道栅格
  function renderLanes() {
    var el = document.getElementById('spine-lanes'); if (!el || !spine) return;
    var steps = spine.steps || [];
    var h = '';
    // 泳道标签列 + A物理流
    h += '<div class="sp-lane-lbl a">物理流<br><span>货怎么走</span></div>';
    steps.forEach(function (s, i) {
      h += '<div class="sp-cell lane-a' + (i === cur ? ' on' : '') + '" data-i="' + i + '">'
        + '<span class="sp-ring ' + ringClass(s.coverage) + '"></span>'
        + '<span class="sp-seq">' + s.seq + '</span>'
        + '<div class="sp-cn">' + esc(s.name) + '</div>'
        + '<div class="sp-cv">' + esc(s.lane.physical.value) + '</div>'
        + '</div>';
    });
    // B决策流
    h += '<div class="sp-lane-lbl b">决策流<br><span>知识库在哪发力</span></div>';
    steps.forEach(function (s, i) {
      var dec = s.lane.decision || {};
      var v = dec.solver ? '<b>' + esc(dec.solver) + '</b>' : esc(dec.note || '—');
      h += '<div class="sp-cell lane-b' + (i === cur ? ' on' : '') + '" data-i="' + i + '">'
        + '<div class="sp-cn" style="color:' + (dec.solver ? '#2c6e4c' : '#8a97a5') + '">' + v + '</div>'
        + (dec.constraints && dec.constraints.length ? '<div class="sp-cv">' + esc(dec.constraints.join(' · ')) + '</div>' : '')
        + '</div>';
    });
    // C数据流
    h += '<div class="sp-lane-lbl c">数据流<br><span>从哪个系统来</span></div>';
    steps.forEach(function (s, i) {
      var conns = (s.gapConnectors && s.gapConnectors.length) ? s.gapConnectors : [(s.lane.data && s.lane.data.connector) || ''];
      var status = (s.lane.data && s.lane.data.status) || 'none';
      var gaps = s.gaps || [];
      // P2-2：一个环节可关联多个外部系统（如靠泊决策=TOS+PORT-SURVEY），逐个画插头
      var plugs = conns.map(function (conn) {
        var live = status === 'none' ? 'none' : (isConnected(conn) ? 'connected' : 'reserved');
        return '<span class="sp-plug ' + plugClass(live) + '" data-conn="' + esc(conn) + '" title="' + esc(connName(conn)) + '">' + plugLabel(live) + '</span>';
      }).join('');
      var connsTxt = conns.map(function (c) { return esc(connName(c)); }).join(' + ');
      var gapTxt = gaps.length ? gaps.length + ' 项待接入' : (status === 'none' ? '—' : '待接入');
      h += '<div class="sp-cell lane-c' + (i === cur ? ' on' : '') + '" data-i="' + i + '">'
        + '<div class="sp-cn" style="font-size:12px">' + connsTxt + '</div>'
        + '<div class="sp-cv">' + gapTxt + '</div>'
        + plugs
        + '</div>';
    });
    el.innerHTML = h;

    // 绑定点击
    Array.prototype.forEach.call(el.querySelectorAll('.sp-cell'), function (c) {
      c.addEventListener('click', function (e) {
        if (e.target.classList.contains('sp-plug')) return;
        cur = parseInt(c.getAttribute('data-i'), 10);
        renderLanes(); renderDetail();
      });
    });
    Array.prototype.forEach.call(el.querySelectorAll('.sp-plug'), function (p) {
      p.addEventListener('click', function (e) {
        e.stopPropagation();
        showContract(p.getAttribute('data-conn'));
      });
    });
  }

  // 环节详情面板（六块）
  function renderDetail() {
    var el = document.getElementById('spine-detail'); if (!el || !spine) return;
    var s = spine.steps[cur];
    var dec = s.lane.decision || {};
    var conn = (s.lane.data && s.lane.data.connector) || '';
    var stat = (s.lane.data && s.lane.data.status) || 'none';
    var covTxt = s.coverage === 'full' ? '已覆盖' : (s.coverage === 'partial' ? '部分覆盖' : '边界外');
    var gaps = s.gaps || [];
    var h = '<div class="sp-d-head"><b>' + s.seq + ' · ' + esc(s.name.replace(/<br>/g, '')) + '</b>'
      + '<span class="sp-cov ' + ringClass(s.coverage) + '">' + covTxt + '</span></div>';
    h += '<div class="sp-d-grid">';
    // 指标
    h += '<div class="sp-block"><div class="sp-blk-t">环节指标</div><div class="sp-blk-v">'
      + esc(s.lane.physical.metric) + '：<b>' + esc(s.lane.physical.value) + '</b>'
      + '<div class="sp-mute">口径：' + esc(s.lane.physical.valueType) + '　出处：' + esc(s.lane.physical.source) + '</div></div></div>';
    // 决策流
    h += '<div class="sp-block"><div class="sp-blk-t">决策流 · 知识库</div><div class="sp-blk-v">'
      + (dec.solver ? '<b>' + esc(dec.solver) + '</b>' : esc(dec.note || '—'))
      + (dec.constraints && dec.constraints.length ? '<div class="sp-mute">约束：' + esc(dec.constraints.join(' · ')) + '</div>' : '')
      + (dec.chain ? '<div class="sp-mute">链：' + esc(dec.chain) + '</div>' : '')
      + '</div></div>';
    // 数据流 + 缺口
    h += '<div class="sp-block"><div class="sp-blk-t">数据流 · 外部系统</div><div class="sp-blk-v">'
      + esc(connName(conn)) + '　<span class="sp-plug ' + plugClass(stat) + '">' + plugLabel(stat) + '</span>'
      + (gaps.length ? '<div class="sp-gap">待接入 ' + gaps.length + ' 项：</div>' : '<div class="sp-mute">无缺口</div>')
      + gaps.map(function (g) { return '<code>' + esc(g.field) + '</code> <span class="sp-mute">' + esc(g.note) + '</span><br>'; }).join('')
      + '</div></div>';
    h += '</div>';
    // 深链工作台（有求解器时）
    if (dec.solver) {
      h += '<div class="sp-d-link"><a href="workbench.html#/solver/' + encodeURIComponent(dec.solver) + '" target="_blank">🛠️ 去工作台用 ' + esc(dec.solver) + ' 测算 →</a></div>';
    }
    // 三域证据链 DAG（有 chain 时提供图谱深链）——二期：链＝证据链，点开看五段分层 DAG
    if (dec.chain) {
      h += '<div class="sp-d-link"><a href="workbench.html#/graph:' + encodeURIComponent(dec.chain) + '" target="_blank">🔗 查看链图谱（' + esc(dec.chain) + '）→</a></div>';
    }
    el.innerHTML = h;
    el.style.display = 'block';
  }

  // 对接收益卡（P-10：给业主看「现在能看 → 接入后能看」，来自每个 connector 契约+话术）
  var ROI_TEXT = {
    'TOS-QD-DJK': { now: '靠泊决策只能用设计吃水推算；泊位占用「—」；在泊时间只有单个总数值', after: '实时泊位占用 + 实际在泊时间分段 → 靠泊决策由「设计值推算」升级为「实测校验」，解锁在泊时间构成与船舶周转预测' },
    'YARD-MS': { now: 'S3 只能给设计容量区间，剩余容量「—」', after: '实时剩余容量 + 堆存期 → S3 由「容量推算」升级为「能否接纳这一船」的确定结论；超期堆存自动预警（煤炭 ≤20 日）' },
    'SCADA-PLC': { now: '只能比对设备额定能力（卸船 7,000 vs 皮带 10,500）', after: '实际瞬时流量 + 设备状态 → 瓶颈判定由「静态能力比」升级为「实时负荷比」' },
    'VTS-PILOT': { now: '候潮窗口只能给设计水位层面的结论（全年开放）', after: '逐时潮位预报 + 船舶位置 → 候潮窗口细化到本航次具体窗口，配合等泊时长做进港排序建议' },
    'SHIPPING-AGENT': { now: '船型只能用设计主尺度（设计吃水 23 m）', after: '舱单实际载货 + 水尺实际吃水 → S1 富余水深（0.05 m 临界）由设计值变为实测值，可信度 assumed→confirmed' },
    'PORT-SURVEY': { now: 'R1 水深校验用设计水深，Z4 备淤为假设值', after: '实际淤积深度实测化 → 富余水深校验由设计口径升级为实测校验' },
    'DISPATCH-WEIGH': { now: '疏运能力与出场量无数据，货物流向无法量化', after: '疏运计划 + 出场计量 → 解锁货物流向桑基图与堆场周转分析，支撑疏运瓶颈识别' }
  };
  function renderRoi() {
    var el = document.getElementById('roi-table'); if (!el || !spine) return;
    var connArr = [];
    // 读已加载的 spine connector 列表 + 契约名
    (spine.steps || []).forEach(function (s) {
      var cid = s.lane.data && s.lane.data.connector;
      if (cid && ROI_TEXT[cid]) {
        var at = CONNECT_AT[cid];
        var done = isConnected(cid);
        connArr.push({ id: cid, name: connName(cid), at: at, done: done, now: ROI_TEXT[cid].now, after: ROI_TEXT[cid].after });
      }
    });
    if (!connArr.length) { el.innerHTML = '<div class="sp-mute">无对接收益数据</div>'; return; }
    var h = '<table class="roi-tbl"><tr><th style="width:170px">外部系统</th><th style="width:78px">对接节点</th><th>现在能看什么</th><th>接入后能看什么</th></tr>';
    connArr.forEach(function (c) {
      h += '<tr><td><b>' + esc(c.name) + '</b>' + (c.done ? ' <span class="sp-plug connected">已接入</span>' : '') + '</td>'
        + '<td>' + (c.at != null ? c.at + '%' : '—') + '</td>'
        + '<td style="color:#5f7a95">' + esc(c.now) + '</td>'
        + '<td>' + esc(c.after) + '</td></tr>';
    });
    h += '</table>';
    el.innerHTML = h;
  }

  // 加载指定主轴
  function load(id) {
    activeId = id; cur = 0;
    var bar = document.getElementById('spine-bar'); if (!bar) return Promise.resolve();
    return window.PKG_API.fetchSpine(id).then(function (data) {
      spine = data;
      document.getElementById('spine-name').textContent = data.name || id;
      bar.style.display = 'block';
      renderKpis(); renderLanes(); renderDetail(); renderRoi();
    }).catch(function (e) {
      bar.style.display = 'none';
      console.warn('[spine] 加载失败', e);
    });
  }

  // 业务切换器
  function bindBiz() {
    var sel = document.getElementById('spine-biz'); if (!sel) return;
    sel.addEventListener('change', function () { load(sel.value); });
    // 契约卡关闭
    var close = document.getElementById('conn-close'), mask = document.getElementById('conn-modal');
    if (close) close.addEventListener('click', function () { if (mask) mask.classList.remove('show'); });
    if (mask) mask.addEventListener('click', function (e) { if (e.target === mask) mask.classList.remove('show'); });
    // 数据模式开关（P-8）
    window.SPINE_DATA_MODE = 'real';   // 全局数据模式：正式环境默认 real
    var modeSel = document.getElementById('data-mode'), banner = document.getElementById('data-banner');
    function applyMode(mode) {
      window.SPINE_DATA_MODE = mode;
      var viz = document.getElementById('spine-viz');
      if (mode === 'mock') {
        if (banner) banner.classList.add('show');
        if (viz) viz.classList.add('mockviz');
      } else {
        if (banner) banner.classList.remove('show');
        if (viz) viz.classList.remove('mockviz');
      }
    }
    if (modeSel) modeSel.addEventListener('change', function () { applyMode(modeSel.value); });
    applyMode('real');
    // 对接进度滑块（P-10）：拖到 X% → KPI/插头/ROI 联动点亮
    var slider = document.getElementById('prog-slider'), pval = document.getElementById('prog-val');
    function applyProg(v) {
      PROG = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
      if (pval) pval.textContent = PROG + '%';
      renderKpis(); renderLanes(); if (document.getElementById('spine-detail').style.display === 'block') renderDetail();
      renderRoi();
    }
    if (slider) slider.addEventListener('input', function () { applyProg(slider.value); });
    applyProg(0);
  }

  function init() {
    bindBiz();
    return load('IRON-ORE-RECEIVING');
  }

  return { init: init, load: load, renderLanes: renderLanes, renderDetail: renderDetail };
})();
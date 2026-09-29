/* spine-viz.js — 业务主轴·可视化增强（P-3 首推：泊位水深剖面图）
 * 画 JTS 165-2013 §5.4.12 的 D = T + Z1 + Z2 + Z3 + Z4。
 * 铁律：数据全部来自 S1 后端求解器（POST /api/solvers/S1.../eval + 实体枚举），前端不自己算。
 * 冲击点：龙骨到泥面富余 0.05 m（红色细线 + 放大标注）；换船/换泊位实时重算。
 */
window.SPINE_VIZ = (function () {
  var els = {};
  var Z = { Z1: 0.6, Z2: 0.3, Z3: 0.15, Z4: 0.4 }; // 默认 Z；S1 eval 返回 extra.z 优先

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function ask() {
    return { vessel: els.svVessel.value, berth: els.svBerth.value };
  }

  // 加载船舶/泊位下拉（实体枚举）
  function loadEntities() {
    return window.PKG_API.fetchDomainEntities('dry-bulk').then(function (d) {
      (d.vessels || []).forEach(function (v) {
        var o = document.createElement('option');
        o.value = v.id;
        o.text = v.name + (v.designDraft_m != null ? '　吃水 ' + v.designDraft_m + ' m' : '');
        els.svVessel.appendChild(o);
      });
      (d.berths || []).forEach(function (b) {
        var o = document.createElement('option');
        o.value = b.id;
        o.text = b.name + (b.apronDepth_m != null ? '　水深 ' + b.apronDepth_m + ' m' : '　水深待接入');
        els.svBerth.appendChild(o);
      });
      // 默认 ORE TIANJIN × D1
      if (!els.svVessel.value && d.vessels && d.vessels.length) els.svVessel.value = d.vessels[0].id;
      if (!els.svBerth.value && d.berths && d.berths.length) els.svBerth.value = d.berths[0].id;
      return drawDepth();
    }).catch(function () { els.svDepthSvg.innerHTML = '<div class="spine-warn">加载实体失败</div>'; });
  }

  // 装载泊位/船名（从实体枚举找）
  function nameOf(coll, id) {
    return els.__ents && els.__ents[coll] ? (els.__ents[coll][id] || '') : '';
  }

  function drawDepth() {
    var svg = els.svDepthSvg, hint = els.svDepthHint;
    var q = ask();
    if (!q.vessel || !q.berth) return;
    // 调用 S1 后端（单一事实源）
    return window.PKG_API.post('/api/solvers/S1-BERTHING-FEASIBILITY/eval', { vessel: q.vessel, berth: q.berth, draftMode: 'design' }).then(function (r) {
      // 找 R1 水深校验结果
      var r1 = (r.constraintResults || []).find(function (c) { return c.constraintId === 'R1-APRON-DEPTH' || c.name.indexOf('水深') >= 0; });
      // 泊位水深：r1.extra.actual；吃水：r1.extra.required - z 或 vessels
      var extra = (r1 && r1.extra) || {};
      var actual = extra.actual;              // 前沿水深（若无 → null 不能画）
      var z = extra.z || Z;
      var required = extra.required;          // T + z
      var margin = extra.margin;              // 剩余富余
      var T = (required != null && z) ? (required - (z.Z1 + z.Z2 + z.Z3 + z.Z4)) : null;
      var vesName = nameOf('vessels', q.vessel) || '该船';
      var berName = nameOf('berths', q.berth) || '该泊位';

      if (actual == null || T == null) {
        svg.innerHTML = '<div class="spine-warn"><b>无法绘制：</b>泊位 <code>' + esc(q.berth) + '</code> 前沿水深未公开（null）。按铁律显示「待接入 · 港池扫测/泊位台账」，<b>不用估算值画图</b>。</div>';
        hint.textContent = 'R1 水深校验：无法测算（缺输入）';
        return;
      }
      var zSum = z.Z1 + z.Z2 + z.Z3 + z.Z4;
      var W = 900, H = 360;
      var S = 10;            // px per meter
      var mudY = 320;        // 泥面
      var waterY = mudY - actual * S;   // 水面（理论最低潮面基准）
      var keelY = waterY + T * S;       // 龙骨
      var deckY = Math.max(waterY - 70, 8);

      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto">';
      s += '<rect x="60" y="' + waterY + '" width="780" height="' + (mudY - waterY) + '" fill="#123a5c"/>';      // 水
      s += '<rect x="60" y="' + mudY + '" width="780" height="22" fill="#8a7456"/>'; // 泥
      s += '<line x1="60" y1="' + mudY + '" x2="840" y2="' + mudY + '" stroke="#6b5b3f" stroke-width="1.5"/>';   // 泥面线
      s += '<line x1="60" y1="' + waterY + '" x2="840" y2="' + waterY + '" stroke="#4aa3d8" stroke-width="1.5" stroke-dasharray="6 3"/>'; // 水面
      // 船体（示意）
      s += '<path d="M150 ' + deckY + ' L128 ' + (deckY + 150) + ' Q130 ' + (keelY - 18) + ' 170 ' + keelY + ' L686 ' + keelY + ' Q715 ' + (keelY - 18) + ' 712 ' + (deckY + 150) + ' L700 ' + deckY + ' Z" fill="#9fb3c4" stroke="#5b6b7a" stroke-width="1.2"/>';
      s += '<line x1="150" y1="' + deckY + '" x2="700" y2="' + deckY + '" stroke="#5b6b7a" stroke-width="1.2"/>';
      s += '<line x1="170" y1="' + keelY + '" x2="686" y2="' + keelY + '" stroke="#e0654f" stroke-width="2"/>';   // 龙骨线
      // 左侧水深标尺
      s += '<line x1="70" y1="' + waterY + '" x2="70" y2="' + mudY + '" stroke="#8fb3d4" stroke-width="1"/>';
      s += '<text x="64" y="' + ((waterY + mudY) / 2) + '" font-size="12" fill="#4aa3d8" text-anchor="end">水深 ' + actual + ' m</text>';
      s += '<text x="64" y="' + (mudY + 16) + '" font-size="11.5" fill="#8a7456" text-anchor="end">泥面</text>';
      s += '<text x="60" y="' + (waterY - 8) + '" font-size="11" fill="#4aa3d8">水面（理论与最低潮面基准）</text>';
      // 吃水标注
      s += '<line x1="744" y1="' + waterY + '" x2="744" y2="' + keelY + '" stroke="#dbe7f3" stroke-width="1"/>';
      s += '<text x="752" y="' + ((waterY + keelY) / 2) + '" font-size="12.5" fill="#dbe7f3">吃水 T=' + T.toFixed(1) + ' m</text>';
      // P2-3：Z1~Z4 富余构成改右侧图例卡 + 引出线（视觉清晰，避免堆叠柱被船体/水深压扁）
      var zx = 380, zw = 130, yy = keelY;   // 龙骨→泥面区间保留（剩余间隙才是冲击点）
      var cols = { Z1: '#2a5f9e', Z2: '#3f7fc0', Z3: '#6aa3d4', Z4: '#98bfe0' };
      // 剩余间隙（冲击点放大，绿色满足/红色临界）
      var gapTop = keelY;   // 龙骨底即富余起点
      var gapH = Math.max(mudY - gapTop, 1);
      s += '<rect x="' + zx + '" y="' + gapTop + '" width="' + zw + '" height="' + gapH + '" fill="' + (margin < 0.3 ? '#a33d2f' : '#2c6e4c') + '"/>';
      s += '<line x1="' + (zx - 26) + '" y1="' + gapTop + '" x2="' + (zx + zw) + '" y2="' + gapTop + '" stroke="#e0654f" stroke-width="1" stroke-dasharray="3 2"/>';
      s += '<line x1="' + (zx - 26) + '" y1="' + mudY + '" x2="' + (zx + zw) + '" y2="' + mudY + '" stroke="#e0654f" stroke-width="1" stroke-dasharray="3 2"/>';
      s += '<text x="' + (zx + zw + 10) + '" y="' + ((gapTop + mudY) / 2) + '" font-size="15" font-weight="700" fill="#e0654f" dominant-baseline="central">剩 ' + (margin != null ? margin.toFixed(2) : '—') + ' m' + (margin < 0.3 ? '（临界）' : '') + '</text>';
      // 右侧图例卡：Z1~Z4 每行色块+名称+值（ZS 消耗在吃水之上，明细列出）
      var lx = 640, ly = 30;
      s += '<text x="' + lx + '" y="' + (ly - 6) + '" font-size="11.5" font-weight="700" fill="#8fb3d4">富余构成 Z1~Z4（共 ' + zSum.toFixed(2) + ' m）</text>';
      ['Z1', 'Z2', 'Z3', 'Z4'].forEach(function (k, i) {
        var y = ly + i * 30;
        s += '<rect x="' + lx + '" y="' + y + '" width="14" height="14" fill="' + cols[k] + '" rx="2"/>';
        var cn = { Z1: '富余下沉(龙骨沉降)', Z2: '横倾', Z3: '波荡(D到挖泥复测)', Z4: '泥面偏差' }[k] || k;
        s += '<text x="' + (lx + 20) + '" y="' + (y + 12) + '" font-size="11" fill="#dbe7f3">' + cn + '： ' + z[k] + ' m</text>';
      });
      s += '<text x="' + lx + '" y="' + (ly + 4 * 30) + '" font-size="11" fill="#5f7a95">∑ ' + zSum.toFixed(2) + ' m——扣在吃水之上，剩余才是靠泊富余安全间隙</text>';
      s += '<text x="60" y="' + (H - 10) + '" font-size="11.5" fill="#5f7a95">D = T + Z1 + Z2 + Z3 + Z4　｜　JTS 165-2013 §5.4.12　｜　' + esc(berName) + ' × ' + esc(vesName) + '</text>';
      s += '</svg>';

      svg.innerHTML = s +
        '<div class="spine-' + (margin < 0.3 ? 'warn' : 'ok') + '"><b>' + esc(berName) + '</b> 接靠 <b>' + esc(vesName) + '</b>：水深 ' + actual + ' m − 吃水 ' + T.toFixed(1) + ' m = 富余 ' + (actual - T).toFixed(2) + ' m；扣除 Z1~Z4（' + zSum.toFixed(2) + ' m）后 <b>剩 ' + (margin != null ? margin.toFixed(2) : '—') + ' m</b>，判定：' + (margin < 0.3 ? '临界' : '满足') + '。<br><span style="color:#5f7a95">Z1/Z3/Z4 取自北海港铁山港 10 万吨级工程实例量级参考，各港实际值需引航/航道部门确认。</span></div>';
      hint.textContent = 'R1 水深校验：' + (margin < 0.3 ? '通过（临界）' : '通过');
    }).catch(function (e) {
      svg.innerHTML = '<div class="spine-warn">求解失败：' + esc(e.message || e) + '</div>';
    });
  }

  // ---------- P-5 潮位特征标尺 + 候潮窗口（数据来自 tideStations 实测特征值，不画假曲线） ----------
  function drawTide() {
    var box = els.svTideSvg; if (!box) return;
    // 特征值（董家口 TIDE-QD-DJK 实测）；临界潮位从当前泊位取；无逐时预报 → 只画特征标尺 + 结论
    var feats = [
      { n: '设计高水位', v: 4.71, c: '#2a5f9e' },
      { n: '平均高潮', v: 4.27, c: '#3f7fc0' },
      { n: '平均海面', v: 2.82, c: '#8a97a5' },
      { n: '平均低潮', v: 1.46, c: '#3f7fc0' },
      { n: '设计低水位', v: 0.67, c: '#2a5f9e' },
      { n: '极端最低低潮', v: -0.45, c: '#8a97a5' }
    ];
    // 临界潮位：当前泊位（默认 D1）
    var berthId = ask().berth;
    var crit = (els.__berthCrit && els.__berthCrit[berthId]) != null ? els.__berthCrit[berthId] : -0.05;
    var lo = -0.6, hi = 5.6, W = 900, H = 300, x0 = 220, x1 = 700;
    function px(v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto">';
    s += '<line x1="' + x0 + '" y1="150" x2="' + x1 + '" y2="150" stroke="#24425f" stroke-width="14" stroke-linecap="round"/>';
    // 临界线
    s += '<line x1="' + px(crit) + '" y1="96" x2="' + px(crit) + '" y2="204" stroke="#e0654f" stroke-width="2.5" stroke-dasharray="5 3"/>';
    s += '<text x="' + px(crit) + '" y="88" font-size="12.5" font-weight="700" fill="#e0654f" text-anchor="middle">临界潮位 ' + crit + ' m</text>';
    feats.forEach(function (f, i) {
      var x = px(f.v), y = 150 + (i % 2 ? 34 : -34);
      s += '<line x1="' + x + '" y1="150" x2="' + x + '" y2="' + y + '" stroke="' + f.c + '" stroke-width="1"/>';
      s += '<circle cx="' + x + '" cy="150" r="4.5" fill="' + f.c + '"/>';
      s += '<text x="' + x + '" y="' + (y + (i % 2 ? 16 : -8)) + '" font-size="11.5" fill="' + f.c + '" text-anchor="middle">' + f.n + ' ' + f.v + '</text>';
    });
    s += '<line x1="' + px(0) + '" y1="124" x2="' + px(0) + '" y2="176" stroke="#dbe7f3" stroke-width="1.5"/>';
    s += '<text x="' + px(0) + '" y="192" font-size="11.5" fill="#dbe7f3" text-anchor="middle">理论最低潮面 0</text>';
    s += '<text x="60" y="262" font-size="12.5" fill="#dbe7f3">董家口港区潮位特征值（实测，理论最低潮面基准）</text>';
    s += '<text x="60" y="282" font-size="11.5" fill="#5f7a95">出处：董家口港区环评报告实测潮位；逐时预报曲线待接入「潮汐/海洋预报」接口，不画示意波形。</text>';
    s += '</svg>';
    box.innerHTML = s +
      '<div class="spine-ok"><b>结论：候潮窗口全年基本开放。</b>40 万吨 VLOC 靠 D1 临界潮位 ' + crit + ' m，平均低潮 1.46 m、设计低水位 0.67 m 均远高于临界；仅极端最低低潮 −0.45 m 低于临界。<br>⇒ <b>真正瓶颈是 R3 合规名单（全国仅 8 港 11 泊位可接靠：首批 4 港 7 泊位 + 第二批 4 个），不是潮水。</b></div>';
  }

  // ---------- P-6 能力-负荷对比条 + S2 滑块联动（数据来自 S2 后端 eval，前端不算） ----------
  function drawCap() {
    var box = els.svCapBars; if (!box) return;
    var n = parseInt(els.svUnloader.value, 10);
    if (els.svUnloaderV) els.svUnloaderV.textContent = n + ' 台';
    // 调 S2 后端（单一事实源）：2 台时卸船7000<皮带10500；台数↑ 瓶颈转移
    return window.PKG_API.post('/api/solvers/S2-THROUGHPUT/eval', { berth: 'BERTH-QD-DJK-D31', unloaderCount: n })
      .then(function (r) {
        var unloadCap = r.unloaderCapacity_tph, beltCap = r.beltCapacity_tph;
        if (unloadCap == null || beltCap == null) { box.innerHTML = '<div class="spine-warn">能力数据待接入（S2 eval 缺失能力字段）</div>'; return; }
        // 四段：卸船/皮带=有值；堆场/疏运=缺实时（不参与瓶颈，显示待接入）
        var rows = [
          { nm: '卸船', v: unloadCap, txt: unloadCap.toLocaleString() + ' t/h', na: false },
          { nm: '皮带输送', v: beltCap, txt: beltCap.toLocaleString() + ' t/h', na: false },
          { nm: '堆场接纳', v: null, txt: '待接入', na: true },
          { nm: '疏运出场', v: null, txt: '待接入', na: true }
        ];
        var known = rows.filter(function (x) { return x.v != null; });
        var min = Math.min.apply(null, known.map(function (x) { return x.v; }));
        var max = Math.max.apply(null, known.map(function (x) { return x.v; })) * 1.15;
        var h = '';
        rows.forEach(function (row) {
          var isBn = !row.na && row.v === min;
          h += '<div class="sv-cap-bar' + (isBn ? ' bn' : '') + '">'
            + '<span class="sv-cap-nm">' + row.nm + '</span>'
            + '<span class="sv-cap-tr">' + (row.na ? '' : '<span class="sv-cap-fl" style="width:' + (row.v / max * 100) + '%"></span>') + '</span>'
            + '<span class="sv-cap-vl">' + (row.na ? '<span class="sv-cap-na">' + row.txt + '</span>' : '<b>' + row.txt + '</b>' + (isBn ? ' <span class="sv-cap-bn">瓶颈</span>' : '')) + '</span>'
            + '</div>';
        });
        var bn = min === unloadCap ? '卸船' : '皮带输送';
        h += '<div class="spine-warn"><b>瓶颈：' + bn + '。</b>'
          + (bn === '卸船' ? '卸船 ' + unloadCap.toLocaleString() + ' t/h &lt; 皮带 ' + beltCap.toLocaleString() + ' t/h，能力差 ' + (beltCap - unloadCap).toLocaleString() + ' t/h；继续增加卸船机台数可提升整体通过能力。'
             : '皮带 ' + beltCap.toLocaleString() + ' t/h &lt; 卸船 ' + unloadCap.toLocaleString() + ' t/h，瓶颈转移到皮带流程，再加卸船机无收益。')
          + '<br><span style="color:#5f7a95">堆场接纳与疏运出场缺实时数据，不参与瓶颈判定——缺口不参与比较，避免用假数字下假结论。</span></div>';
        box.innerHTML = h;
      }).catch(function (e) { box.innerHTML = '<div class="spine-warn">S2 求解失败：' + esc(e.message || e) + '</div>'; });
  }

  // ---------- P-9 模拟预演：货物流向桑基 / 堆场热力 / 在泊甘特 ----------
  // 铁律：real（SPINE_DATA_MODE!=='mock'）只显示“待接入 XX 系统”，不画假图；
  //      mock 才出图；真实锚点保留真实：桑基总量 351,000t（远卓海实载）、
  //      甘特总时长 34h（实测），仅分流比例/分段时长/占用率为模拟。
  function isMock() { return window.SPINE_DATA_MODE === 'mock'; }

  function pendingHtml(systems) {
    return '<div class="spine-warn"><b>模拟预演未开启。</b>本图属「预演可视化」，依赖：' + systems
      + '。<br>将顶部数据模式切到 <b>模拟预演（MOCK）</b> 后出图——模拟数据仅作形态演示，真实锚点保留真实（桑基总吨 351,000 t / 甘特总时长 34 h）。</div>';
  }

  // --- 桑基：货物流向（真实总量 351,000t → 模拟分流） ---
  function drawSankey() {
    var hint = els.svSankeyHint, body = els.svSankeyBody;
    if (!body) return;
    if (!isMock()) { hint.textContent = ''; body.innerHTML = pendingHtml('货流地磅 / 轨道衡 / 疏运计划（SIM-OPS）'); return; }
    hint.textContent = '预演形态：总吨位 351,000 t 为真实值（远卓海 VLOC 实载）；铁路/公路/转水分流比例为模拟，待接入疏运系统后替换。';
    var total = 351000;
    // 模拟分流：铁路 48% / 公路 27% / 转水 15% / 皮带直送 10%（模拟，非真实）
    var flows = [
      { n: '铁路疏运', pct: 0.48, c: '#3f7fc0' },
      { n: '公路疏运', pct: 0.27, c: '#6fae7f' },
      { n: '转水过驳', pct: 0.15, c: '#d9a441' },
      { n: '皮带直送', pct: 0.10, c: '#c8794a' }
    ];
    var h = '<svg viewBox="0 0 880 120" style="width:100%;height:auto" role="img" aria-label="货物流向桑基图">';
    var xL = 40, xM = 300, xR = 830, midY = 60;
    // 左节点：卸船总量
    h += '<rect x="' + xL + '" y="12" width="150" height="96" rx="6" fill="#123a5c" stroke="#2a5f9e"/>';
    h += '<text x="' + (xL + 75) + '" y="38" font-size="12" fill="#8fb3d4" text-anchor="middle">卸船（VLOC 远卓海）</text>';
    h += '<text x="' + (xL + 75) + '" y="60" font-size="17" font-weight="800" fill="#e0a34a" text-anchor="middle">351,000 t</text>';
    h += '<text x="' + (xL + 75) + '" y="80" font-size="10" fill="#5f7a95" text-anchor="middle">真实锚点</text>';
    var prevY = midY;
    var colW = 380, startX = xM + 60;
    // 中段分流带（模拟比例）
    var bandH = []; flows.forEach(function (f) { bandH.push(Math.max(14, f.pct * 100)); });
    var totalH = bandH.reduce(function (a, b) { return a + b; }, 0);
    var yCursor = midY - totalH / 2;
    flows.forEach(function (f, i) {
      var bh = bandH[i] * (76 / totalH);
      var y = 12 + i % 2 * 14;
      h += '<rect x="' + startX + '" y="' + yCursor + '" width="' + colW + '" height="' + (bh + 12) + '" fill="' + f.c + '" opacity="0.55" rx="3"/>';
      h += '<text x="' + (startX + 10) + '" y="' + (yCursor + bh / 2 + 16) + '" font-size="11" fill="#0d1a2b" font-weight="700">' + f.n + ' ' + Math.round(f.pct * 100) + '% ≈ ' + Math.round(total * f.pct / 1000) + ' 千t</text>';
      yCursor += bh + 12;
    });
    // 右节点：疏运出港
    var rh = 96;
    h += '<rect x="' + xR + '" y="12" width="48" height="' + rh + '" rx="6" fill="#1b3a55" stroke="#2a5f9e"/>';
    h += '<text x="' + (xR - 16) + '" y="52" font-size="11" fill="#8fb3d4">出港</text>';
    h += '<text x="' + (xR - 16) + '" y="66" font-size="11" fill="#5f7a95">分流</text>';
    h += '<text x="60" y="112" font-size="11" fill="#5f7a95">分流比例为模拟预演（标注 MOCK），接入疏运系统（地磅/轨道衡/计划）后以真实分流替换。';
    h += '</svg>';
    body.innerHTML = h;
  }

  // --- 堆场热力：真实 yards 分区 × 模拟占用率 + 超期堆存预警 ---
  function drawYard() {
    var hint = els.svYardHint, body = els.svYardBody;
    if (!body) return;
    if (!isMock()) { hint.textContent = ''; body.innerHTML = pendingHtml('堆场管理系统（YARD-MS）分区占用实时数据'); return; }
    hint.textContent = '预演形态：占用率为模拟值，接入堆场管理系统（YARD-MS）后以实时占用替换；煤炭分区超期堆存（>20日）触发预警。';
    // 真实 yards：designStorageCapacity_t 有值；占用率模拟
    var cells = [
      { z: 'A1', nm: '董家口矿石堆场·A 区', cap: 5400, occ: 81, days: 9 },
      { z: 'A2', nm: '董家口矿石堆场·B 区', cap: 5400, occ: 64, days: 14 },
      { z: 'A3', nm: '董家口矿石堆场·C 区', cap: 5400, occ: 12, days: 3 },
      { z: 'B1', nm: 'D31 新增堆场·一区', cap: 1719, occ: 45, days: 6 },
      { z: 'B2', nm: 'D31 新增堆场·二区', cap: 1719, occ: 88, days: 22 },
      { z: 'B3', nm: 'D31 新增堆场·三区', cap: 1719, occ: 30, days: 2 }
    ];
    var h = '<div class="sv-heat">';
    var overCnt = 0;
    cells.forEach(function (c) {
      var cls = c.occ >= 80 ? 'T' : '';
      var over = c.days > 20;
      if (over) { cls = 'over'; overCnt++; }
      var pctCls = c.occ >= 80 ? '' : (c.occ >= 50 ? 'mid' : 'lo');
      h += '<div class="sv-heat-cell ' + cls + '"><div class="sv-heat-nm">' + c.z + '</div>'
        + '<div class="sv-heat-pct ' + pctCls + '">' + c.occ + '%</div>'
        + '<div class="sv-heat-met">' + c.nm.split('·')[1] + '<br>设计 ' + c.cap.toLocaleString() + ' 千t</div>'
        + (over ? '<div class="sv-heat-warn">⚠ 超期堆存 ' + c.days + ' 日</div>' : '<div class="sv-heat-met">堆存 ' + c.days + ' 日</div>')
        + '</div>';
    });
    h += '</div>';
    body.innerHTML = h +
      '<div class="spine-' + (overCnt ? 'warn' : 'ok') + '"><b>堆场' + (overCnt ? '存在 ' + overCnt + ' 个超期堆存预警' : '周转正常') + '。</b>占用率与堆存天数为模拟预演；接入堆放管理系统后新增「超期堆存预警」（煤炭 ≤20 日），并改为实时分区占用。</div>';
  }

  // --- 在泊甘特：真实总时长 34h，分段模拟 ---
  function drawGantt() {
    var hint = els.svGanttHint, body = els.svGanttBody;
    if (!body) return;
    if (!isMock()) { hint.textContent = ''; body.innerHTML = pendingHtml('生产调度/在泊作业实时时序（TOS-QD-DJK）'); return; }
    hint.textContent = '预演形态：总时长 34 h 为真实值（远卓海 VLOC 实测在泊时长）；靠泊/卸船/候潮/离泊分段时长为模拟，接入 TOS 后以实时时序替换。';
    // 真实总时长 34h，分段模拟（h）
    var segs = [
      { n: '进港靠泊', h: 3, c: '#3f7fc0' },
      { n: '卸船作业', h: 22, c: '#c8794a' },
      { n: '候潮/移泊', h: 5, c: '#d9a441' },
      { n: '离泊出港', h: 4, c: '#6fae7f' }
    ];
    var total = 34;
    var h = '<div class="sv-gantt"><div class="sv-g-row"><span class="sv-g-nm" style="color:#8fb3d4">远卓海 VLOC · 在泊 34 h</span>'
      + '<div class="sv-g-track">';
    var x = 0;
    segs.forEach(function (seg) {
      var w = seg.h / total * 100;
      h += '<div class="sv-g-seg" style="left:' + x + '%;width:' + w + '%;background:' + seg.c + '">' + seg.h + 'h</div>';
      x += w;
    });
    h += '</div><span class="sv-g-total">' + total + ' h</span></div>';
    // 图例
    h += '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:8px 0 2px 150px">';
    segs.forEach(function (seg) { h += '<span style="font-size:11px;color:#8fb3d4"><i style="display:inline-block;width:10px;height:10px;background:' + seg.c + ';border-radius:2px;margin-right:4px"></i>' + seg.n + '</span>'; });
    h += '</div>';
    body.innerHTML = h +
      '<div class="spine-ok"><b>总在泊 34 h（真实锚点）。</b>其中卸船作业 22 h 占 65%，为核心耗时段；候潮/移泊 5 h 为可优化空间。分段时长为模拟预演，接入 TOS 后以实时时序替换。<br><span style="color:#5f7a95">真实锚点来源：远卓海 VLOC 实测在泊时长；候潮依赖 §R1 临界潮位结论（全年基本开放）。</span></div>';
  }

  function init() {
    els = {
      svDepthSvg: document.getElementById('sv-depth-svg'),
      svDepthHint: document.getElementById('sv-depth-hint'),
      svTideSvg: document.getElementById('sv-tide-svg'),
      svCapBars: document.getElementById('sv-cap-bars'),
      svUnloader: document.getElementById('sv-unloader'),
      svUnloaderV: document.getElementById('sv-unloader-v'),
      svVessel: document.getElementById('sv-vessel'),
      svBerth: document.getElementById('sv-berth'),
      svSankeyHint: document.getElementById('sv-sankey-hint'),
      svSankeyBody: document.getElementById('sv-sankey-body'),
      svYardHint: document.getElementById('sv-yard-hint'),
      svYardBody: document.getElementById('sv-yard-body'),
      svGanttHint: document.getElementById('sv-gantt-hint'),
      svGanttBody: document.getElementById('sv-gantt-body'),
      svViz: document.getElementById('spine-viz')
    };
    // 缓存实体枚举名 + 每泊位临界潮位
    window.PKG_API.fetchDomainEntities('dry-bulk').then(function (d) {
      els.__ents = {
        vessels: (d.vessels || []).reduce(function (m, v) { m[v.id] = v.name; return m; }, {}),
        berths: (d.berths || []).reduce(function (m, b) { m[b.id] = b.name; return m; }, {})
      };
      els.__berthCrit = {};
      (d.berths || []).forEach(function (b) { if (b.criticalTideLevel_m != null) els.__berthCrit[b.id] = b.criticalTideLevel_m; });
      drawTide();
    });
    if (!els.svDepthSvg) return;
    // 主轴 bar 加载成功后（SPINE_UI 会显示）本区随同可见；此处确保解开默认隐藏
    if (els.svViz) els.svViz.style.display = 'block';
    els.svVessel.onchange = drawDepth;
    els.svBerth.onchange = drawDepth;
    if (els.svUnloader) els.svUnloader.oninput = drawCap;
    loadEntities();
    // P-9：数据模式切换时，若激活页签为三项模拟预演之一则即时重绘（real↔mock）
    var dmSel = document.getElementById('data-mode');
    if (dmSel) dmSel.addEventListener('change', function () {
      var on = document.querySelector('.sv-tab.on');
      if (!on) return;
      var v = on.getAttribute('data-v');
      if (v === 'sankey') drawSankey();
      else if (v === 'yard') drawYard();
      else if (v === 'gantt') drawGantt();
    });
    // 页签切换
    Array.prototype.forEach.call(document.querySelectorAll('.sv-tab'), function (t) {
      t.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.sv-tab'), function (x) { x.classList.remove('on'); });
        Array.prototype.forEach.call(document.querySelectorAll('.sv-pane'), function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        var pane = document.getElementById('sv-' + t.getAttribute('data-v'));
        if (pane) pane.classList.add('on');
        if (t.getAttribute('data-v') === 'tide') drawTide();
        if (t.getAttribute('data-v') === 'cap') drawCap();
        if (t.getAttribute('data-v') === 'sankey') drawSankey();
        if (t.getAttribute('data-v') === 'yard') drawYard();
        if (t.getAttribute('data-v') === 'gantt') drawGantt();
      });
    });
  }

  return { init: init, drawDepth: drawDepth, drawTide: drawTide, drawCap: drawCap, drawSankey: drawSankey, drawYard: drawYard, drawGantt: drawGantt };
})();
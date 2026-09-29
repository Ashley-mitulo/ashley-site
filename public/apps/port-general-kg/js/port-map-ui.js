/* port-map-ui.js — P-4 全国 40 万吨泊位地图
 * 合规铁律：只用合规定图（天地图 JS API，自带审图号）叠加 POI 点；绝不自行绘制边界线。
 * 无 key / 离线时回退 ECharts 静态散点（仅 POI 点，非边界），保证演示不阻塞。
 * 副标题写死：《40 万吨铁矿石码头布局》原文约束——名单外泊位法规禁止接靠，引航机构不得提供引航服务。
 * 数据：GET /api/port-map/berths（WGS-84，含 confidence/source/in40MtList）
 */
window.PORT_MAP = (function () {
  var TIANDITU_KEY = (window.__TIANDITU_KEY) || '';   // 天地图申请 key，留空则回退 ECharts

  function loadJson() {
    return window.PKG_API.get('/api/port-map/berths').then(function (d) { return (d && d.berths) || []; });
  }

  // 注入天地图 JS（按需）
  function loadTianditu(cb) {
    if (!TIANDITU_KEY) return cb(false);
    if (window.T) return cb(true);
    var s = document.createElement('script');
    s.src = 'https://api.tianditu.gov.cn/api?v=4.0&tk=' + TIANDITU_KEY;
    s.onload = function () { cb(true); };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }

  // 天地图渲染（真实瓦片 + POI 点）
  function renderTianditu(container, berths) {
    var map = new T.Map(container.id, { projection: 'EPSG:4326' });
    var pt = new T.LngLat(112, 34); map.centerAndZoom(pt, 5);
    map.addControl(new T.Control.Zoom());
    // 名单内 = 琥珀要点亮；名单外 = 灰显
    (berths || []).forEach(function (b) {
      var inL = b.in40MtList;
      var mk = new T.Marker(new T.LngLat(b.lon, b.lat), { icon: new T.Icon({
        iconUrl: 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="9" fill="' + (inL ? '#e0a34a' : '#556c84') + '" stroke="#fff" stroke-width="2"/></svg>'),
        iconSize: new T.Point(22, 22)
      })});
      mk.addEventListener('click', function () { showInfo(b); });
      map.addOverLay(mk);
    });
    // 列表内光点计数 + 副标题约束
    addLegend(container, berths);
  }

  // ECharts 回退（静态散点，仅 POI 非边界）
  function renderECharts(container, berths) {
    if (!window.echarts) { container.innerHTML = '<div class="spine-warn">地图组件不可用（无天地图 key 且无 ECharts）</div>'; return; }
    var inL = berths.filter(function (b) { return b.in40MtList; });
    var out = berths.filter(function (b) { return !b.in40MtList; });
    function pts(arr, color) {
      return arr.map(function (b) { return { value: [b.lon, b.lat], name: b.name, itemStyle: { color: color }, _b: b }; });
    }
    // 用 geo 注册中国轮廓仅作参考底（默认 geo 需要有地图数据；此处用 scatter 纯散点 + 网格背景即可，不画边界）
    container.innerHTML = '<div style="height:420px"></div>';
    var chart = echarts.init(container.firstChild);
    chart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 40, right: 30, top: 20, bottom: 40 },
      xAxis: { type: 'value', min: 100, max: 130, axisLabel: { color: '#5f7a95' }, splitLine: { lineStyle: { color: 'rgba(60,90,120,.15)' } } },
      yAxis: { type: 'value', min: 20, max: 45, axisLabel: { color: '#5f7a95' }, splitLine: { lineStyle: { color: 'rgba(60,90,120,.15)' } } },
      series: [
        { type: 'scatter', name: '40万吨接靠泊位', symbolSize: 14, data: pts(inL, '#e0a34a'), label: { show: true, formatter: function (p) { return p.name.split('港')[0]; }, color: '#e0a34a', fontSize: 10, position: 'top' }, emphasis: { label: { show: true, fontWeight: 700 } } },
        { type: 'scatter', name: '名单外', symbolSize: 10, data: pts(out, '#556c84'), label: { show: true, formatter: function (p) { return p.name.split('港')[0]; }, color: '#77889b', fontSize: 9, position: 'top' } }
      ],
      tooltip: { formatter: function (p) { var b = p.data && p.data._b; return b ? '<b>' + b.name + '</b><br>〈' + (b.in40MtList ? '40万吨接靠名单内' : '名单外') + '〉<br>出处：' + (b.source || '—') : ''; } }
    });
    chart.on('click', function (p) { if (p.data && p.data._b) showInfo(p.data._b); });
    addLegend(container, berths);
  }

  // 弹泊位档案（小卡）+ 图例/副标题
  function showInfo(b) {
    var det = document.getElementById('pm-info');
    if (!det) return;
    det.innerHTML = '<div class="ar-card"><div class="ar-card-h"><span class="ar-type">' + (b.in40MtList ? '40万吨接靠泊位' : '名单外泊位') + '</span><span class="ar-name">' + b.name + '</span></div>' +
      '<div class="ar-rows"><div class="ar-row"><span class="ar-k">坐标</span><span class="ar-v">' + b.lat + ', ' + b.lon + '（WGS-84）</span></div>' +
      '<div class="ar-row"><span class="ar-k">精度</span><span class="ar-v">' + (b.precision || '—') + ' · 置信 ' + (b.confidence || '—') + '</span></div>' +
      '<div class="ar-row"><span class="ar-k">名单</span><span class="ar-v">' + (b.in40MtList ? '国家 40 万吨接靠名单内' : '不在 40 万吨接靠名单（不可接靠 40 万吨矿船）') + '</span></div>' +
      '<div class="ar-row"><span class="ar-k">出处</span><span class="ar-v">' + (b.source || '—') + '</span></div>' +
      (b.remark ? '<div class="ar-row"><span class="ar-k">备注</span><span class="ar-v">' + b.remark + '</span></div>' : '') +
      '</div><div class="ar-src">精度说明：' + (b.confidence === 'confirmed' ? '公开来源泊位级采信' : '港区/岛级概位待核') + '</div></div>';
  }

  function addLegend(container, berths) {
    var inCnt = berths.filter(function (b) { return b.in40MtList; }).length;
    var leg = document.getElementById('pm-legend');
    if (leg) leg.innerHTML = '<span class="pm-dot in"></span>40万吨接靠泊位 <b>' + inCnt + '</b>　<span class="pm-dot out"></span>名单外';
    var sub = document.getElementById('pm-subtitle');
    if (sub) sub.textContent = '名单外泊位法规禁止接靠，引航机构不得提供引航服务（《40 万吨铁矿石码头布局》）';
  }

  function init(container) {
    return loadJson().then(function (berths) {
      if (!berths.length) { container.innerHTML = '<div class="spine-warn">泊位地图数据未加载</div>'; return; }
      loadTianditu(function (ok) {
        if (ok) renderTianditu(container, berths);
        else renderECharts(container, berths);
      });
    }).catch(function (e) { container.innerHTML = '<div class="spine-warn">地图加载失败：' + e.message + '</div>'; });
  }

  return { init: init, loadJson: loadJson, renderECharts: renderECharts };
})();
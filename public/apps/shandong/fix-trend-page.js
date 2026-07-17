// 这个脚本会在页面加载时注入到HTML中，修复所有问题

// 1. 安全设置元素文本
window.safeSetText = function(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

// 2. 重写 renderTrendAnalysis - 简化版本
window.renderTrendAnalysis = function() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">📈 流量趋势分析</h2>
      
      <div class="mb-6 flex gap-4 items-center flex-wrap">
        <span class="text-gray-600 font-medium">选择交通类型：</span>
        <select id="trendTrafficType" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="highway">高速公路</option>
          <option value="provincial">普通国省道</option>
          <option value="aviation">民航</option>
          <option value="rail">轨道交通</option>
          <option value="waterway">水路运输</option>
        </select>
        <button id="refreshTrendBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">刷新数据</button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div class="text-sm text-blue-600 mb-1">📊 累计总流量</div>
          <div class="text-2xl font-bold text-blue-800" id="totalTraffic">-</div>
          <div class="text-xs text-blue-500 mt-1">万辆</div>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div class="text-sm text-green-600 mb-1">📈 年均增长率</div>
          <div class="text-2xl font-bold text-green-800" id="avgGrowthRate">-</div>
          <div class="text-xs text-green-500 mt-1">%</div>
        </div>
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div class="text-sm text-orange-600 mb-1">🔥 历史峰值</div>
          <div class="text-2xl font-bold text-orange-800" id="peakTraffic">-</div>
          <div class="text-xs text-orange-500 mt-1" id="peakInfo">万辆</div>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div class="text-sm text-purple-600 mb-1">📅 数据覆盖</div>
          <div class="text-2xl font-bold text-purple-800" id="dataCoverage">-</div>
          <div class="text-xs text-purple-500 mt-1">条记录</div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="bg-gray-50 p-4 rounded-xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">📋 年度流量统计</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left px-3 py-2 font-semibold text-gray-700">年份</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-700">总流量</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-700">日均</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-700">同比</th>
                </tr>
              </thead>
              <tbody id="yearly-summary-body">
              </tbody>
            </table>
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">📈 年度流量趋势</h3>
          <canvas id="trendChart" height="220"></canvas>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="bg-gray-50 p-4 rounded-xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">🎊 节假日流量分布</h3>
          <canvas id="holidayDistChart" height="220"></canvas>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">🔥 节假日流量排名</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left px-3 py-2 font-semibold text-gray-700">排名</th>
                  <th class="text-left px-3 py-2 font-semibold text-gray-700">节假日</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-700">总流量</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-700">占比</th>
                </tr>
              </thead>
              <tbody id="holiday-rank-body">
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">📊 增长分析</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">最高增长年份</span>
              <span class="font-bold text-green-600" id="highestGrowthYear">-</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">最低增长年份</span>
              <span class="font-bold text-red-600" id="lowestGrowthYear">-</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">增长趋势</span>
              <span class="font-bold" id="growthTrend">-</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">CAGR复合增长率</span>
              <span class="font-bold text-blue-600" id="cagrRate">-</span>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">📁 数据质量统计</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">数据起始年份</span>
              <span class="font-bold text-gray-800" id="startYear">-</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">数据结束年份</span>
              <span class="font-bold text-gray-800" id="endYear">-</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">覆盖年数</span>
              <span class="font-bold text-gray-800" id="yearCount">-</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg">
              <span class="text-gray-600">数据完整度</span>
              <span class="font-bold text-green-600" id="dataCompleteness">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('trendTrafficType').addEventListener('change', loadTrendData);
  document.getElementById('refreshTrendBtn').addEventListener('click', loadTrendData);
  setTimeout(loadTrendData, 100);
};

// 3. 加载趋势数据
window.loadTrendData = async function() {
  const trafficType = document.getElementById('trendTrafficType').value;
  try {
    const res = await fetch(`${API_BASE}/data/${trafficType}`);
    const result = await res.json();
    if (result.success && result.data && result.data.length > 0) {
      renderAllTrendAnalysis(result.data);
    }
  } catch (err) {
    console.error('加载趋势数据失败:', err);
  }
};

// 4. 渲染所有分析
window.renderAllTrendAnalysis = function(data) {
  if (!data || data.length === 0) return;
  
  renderCoreMetrics(data);
  renderYearlySummary(data);
  renderHolidayAnalysis(data);
  renderGrowthAndQuality(data);
};

// 5. 核心指标
window.renderCoreMetrics = function(data) {
  const totalTraffic = data.reduce((sum, item) => sum + (item.traffic_volume || 0), 0);
  safeSetText('totalTraffic', Math.round(totalTraffic).toLocaleString());
  safeSetText('dataCoverage', data.length.toString());

  const peakItem = data.reduce((max, item) => 
    (item.traffic_volume || 0) > (max.traffic_volume || 0) ? item : max
  , data[0]);
  if (peakItem) {
    safeSetText('peakTraffic', peakItem.traffic_volume.toFixed(1));
    safeSetText('peakInfo', `${peakItem.year || '-'}年 ${peakItem.holiday || '-'}`);
  }

  const yearlyData = {};
  data.forEach(item => {
    const year = item.year;
    if (year) {
      if (!yearlyData[year]) yearlyData[year] = 0;
      yearlyData[year] += item.traffic_volume || 0;
    }
  });
  const years = Object.keys(yearlyData).sort();
  if (years.length >= 2) {
    const firstYear = yearlyData[years[0]];
    const lastYear = yearlyData[years[years.length - 1]];
    const yearSpan = parseInt(years[years.length - 1]) - parseInt(years[0]);
    if (firstYear > 0 && yearSpan > 0) {
      const cagr = (Math.pow(lastYear / firstYear, 1 / yearSpan) - 1) * 100;
      safeSetText('avgGrowthRate', cagr.toFixed(1));
    }
  }
};

// 6. 年度汇总
window.renderYearlySummary = function(data) {
  const tbody = document.getElementById('yearly-summary-body');
  if (!tbody) return;

  const yearlyData = {};
  data.forEach(item => {
    const year = item.year;
    if (!yearlyData[year]) yearlyData[year] = 0;
    yearlyData[year] += item.traffic_volume || 0;
  });

  const yearlyArray = Object.keys(yearlyData).map(y => ({
    year: parseInt(y),
    total: yearlyData[y]
  })).sort((a, b) => a.year - b.year);

  let prevTotal = null;
  tbody.innerHTML = yearlyArray.map(item => {
    let growth = '-';
    if (prevTotal !== null && prevTotal > 0) {
      growth = ((item.total - prevTotal) / prevTotal * 100).toFixed(1) + '%';
    }
    prevTotal = item.total;
    const avg = item.total / 7;
    return `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2">${item.year}</td>
        <td class="px-3 py-2 text-right">${Math.round(item.total)}</td>
        <td class="px-3 py-2 text-right">${avg.toFixed(1)}</td>
        <td class="px-3 py-2 text-right ${growth.startsWith('-') ? 'text-red-600' : 'text-green-600'}">${growth}</td>
      </tr>
    `;
  }).join('');

  const ctx = document.getElementById('trendChart');
  if (ctx && typeof Chart !== 'undefined') {
    try { if (window.trendChart) window.trendChart.destroy(); } catch(e) {}
    try {
      window.trendChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
          labels: yearlyArray.map(item => item.year),
          datasets: [{
            label: '年度总流量',
            data: yearlyArray.map(item => item.total),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3, fill: true, tension: 0.3
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: false, title: { display: true, text: '总流量 (万辆)' } } } }
      });
    } catch(e) { console.error('趋势图渲染失败:', e); }
  }
};

// 7. 节假日分析
window.renderHolidayAnalysis = function(data) {
  const holidayData = {};
  data.forEach(item => {
    const holiday = item.holiday || '其他';
    if (!holidayData[holiday]) holidayData[holiday] = 0;
    holidayData[holiday] += item.traffic_volume || 0;
  });

  const holidayArray = Object.keys(holidayData).map(h => ({
    holiday: h, total: holidayData[h]
  })).sort((a, b) => b.total - a.total);

  const total = holidayArray.reduce((sum, h) => sum + h.total, 0);

  const rankTbody = document.getElementById('holiday-rank-body');
  if (rankTbody) {
    rankTbody.innerHTML = holidayArray.slice(0, 7).map((h, i) => {
      const percent = total > 0 ? ((h.total / total) * 100).toFixed(1) : '0.0';
      const rankColors = ['text-yellow-600', 'text-gray-500', 'text-orange-700'];
      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="px-3 py-2 font-bold ${rankColors[i] || 'text-gray-600'}">#${i + 1}</td>
          <td class="px-3 py-2">${h.holiday}</td>
          <td class="px-3 py-2 text-right">${Math.round(h.total)}</td>
          <td class="px-3 py-2 text-right">${percent}%</td>
        </tr>
      `
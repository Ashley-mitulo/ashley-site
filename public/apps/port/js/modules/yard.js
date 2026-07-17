// 堆场管理模块

function renderYard(container) {
    container.innerHTML = `
        <div class="page-title">🗄️ 堆场管理系统</div>
        
        <div class="tab-container">
            <div class="tab-item active" data-tab="grid" onclick="switchYardTab('grid')">堆场平面图</div>
            <div class="tab-item" data-tab="boxes" onclick="switchYardTab('boxes')">箱位管理</div>
            <div class="tab-item" data-tab="theory" onclick="switchYardTab('theory')">算法原理</div>
            <div class="tab-item" data-tab="crp" onclick="switchYardTab('crp')">CRP可视化模拟器</div>
            <div class="tab-item" data-tab="stats" onclick="switchYardTab('stats')">堆存统计</div>
            <div class="tab-item" data-tab="turnover" onclick="switchYardTab('turnover')">翻箱率统计</div>
        </div>

        <div id="yard-tab-content"></div>
    `;

    switchYardTab('grid');
}

function switchYardTab(tab) {
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });

    const content = document.getElementById('yard-tab-content');
    switch (tab) {
        case 'grid':
            renderYardGrid(content);
            break;
        case 'boxes':
            renderBoxManagement(content);
            break;
        case 'theory':
            renderAlgoTheory(content);
            break;
        case 'crp':
            renderCRPLaboratory(content);
            break;
        case 'stats':
            renderYardStats(content);
            break;
        case 'turnover':
            renderTurnoverStats(content);
            break;
    }
}

function renderYardGrid(container) {
    const blocks = [
        { id: 'A01', utilization: 75, type: '出口' },
        { id: 'A02', utilization: 82, type: '出口' },
        { id: 'A03', utilization: 45, type: '进口' },
        { id: 'A04', utilization: 68, type: '进口' },
        { id: 'B01', utilization: 92, type: '中转' },
        { id: 'B02', utilization: 68, type: '出口' },
        { id: 'B03', utilization: 55, type: '进口' },
        { id: 'B04', utilization: 38, type: '空箱' },
        { id: 'C01', utilization: 70, type: '出口' },
        { id: 'C02', utilization: 88, type: '危险品' },
        { id: 'C03', utilization: 62, type: '进口' },
        { id: 'C04', utilization: 45, type: '空箱' },
        { id: 'D01', utilization: 55, type: '出口' },
        { id: 'D02', utilization: 78, type: '进口' },
        { id: 'D03', utilization: 95, type: '中转' },
        { id: 'D04', utilization: 32, type: '空箱' }
    ];

    container.innerHTML = `
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📐 堆场平面图</span>
                <div style="display: flex; gap: 20px; font-size: 11px;">
                    <span style="color: #00ff88;">■ 出口</span>
                    <span style="color: #00d4ff;">■ 进口</span>
                    <span style="color: #b388ff;">■ 中转</span>
                    <span style="color: #888;">■ 空箱</span>
                    <span style="color: #ff4757;">■ 危险品</span>
                </div>
            </div>
            <div style="display: flex; gap: 20px; padding: 20px;">
                <div style="flex: 3;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                        ${['A区', 'B区', 'C区', 'D区'].map((zone, zi) => `<div style="text-align: center; color: #7a9aba; font-size: 12px; font-weight: 600;">${zone}</div>`).join('')}
                    </div>
                    <div class="yard-grid">
                        ${blocks.map(block => {
                            let colorClass = 'low';
                            if (block.utilization >= 90) colorClass = 'high';
                            else if (block.utilization >= 60) colorClass = 'medium';
                            return `<div class="yard-cell ${colorClass}" onclick="showBlockDetail('${block.id}')" title="${block.id} - ${block.type} - ${block.utilization}%">
                                <div style="font-size: 12px; font-weight: 700;">${block.id}</div>
                                <div style="font-size: 9px;">${block.utilization}%</div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                <div style="flex: 1; padding-left: 20px; border-left: 1px solid rgba(0, 212, 255, 0.15);">
                    <h4 style="color: #00d4ff; margin-bottom: 15px; font-size: 14px;">堆场概况</h4>
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                            <span style="color: #7a9aba;">总堆存能力</span>
                            <span style="color: #a0c4e8;">1,500 TEU</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                            <span style="color: #7a9aba;">已堆存</span>
                            <span style="color: #00ff88;">1,050 TEU</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                            <span style="color: #7a9aba;">可用</span>
                            <span style="color: #00d4ff;">450 TEU</span>
                        </div>
                        <div class="progress-bar" style="margin-top: 10px;">
                            <div class="progress-fill" style="width: 70%;"></div>
                        </div>
                        <div style="text-align: right; font-size: 11px; color: #7a9aba; margin-top: 5px;">整体利用率 70%</div>
                    </div>
                    <div style="border-top: 1px solid rgba(0, 212, 255, 0.1); padding-top: 15px;">
                        <h5 style="color: #a0c4e8; margin-bottom: 10px; font-size: 12px;">按类型分布</h5>
                        <div id="yard-type-chart" style="height: 150px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initYardTypeChart();
}

function initYardTypeChart() {
    const ec = getECharts();
    if (!ec) return;

    const chart = ec.init(document.getElementById('yard-type-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '50%'],
            data: [
                { value: 450, name: '出口', itemStyle: { color: '#00ff88' } },
                { value: 380, name: '进口', itemStyle: { color: '#00d4ff' } },
                { value: 150, name: '中转', itemStyle: { color: '#b388ff' } },
                { value: 50, name: '危险品', itemStyle: { color: '#ff4757' } },
                { value: 20, name: '冷藏', itemStyle: { color: '#ffc107' } }
            ],
            label: { color: '#a0c4e8', fontSize: 10 }
        }]
    });
}

function showBlockDetail(blockId) {
    openModal('贝位详情 - ' + blockId, `
        <div style="padding: 10px;">
            <div style="margin-bottom: 20px;">
                <h4 style="color: #00ff88; margin-bottom: 15px;">基本信息</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 6px;">
                        <div style="font-size: 11px; color: #7a9aba;">总箱位</div>
                        <div style="font-size: 20px; font-weight: 700; color: #00d4ff;">200</div>
                    </div>
                    <div style="padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 6px;">
                        <div style="font-size: 11px; color: #7a9aba;">已占用</div>
                        <div style="font-size: 20px; font-weight: 700; color: #00ff88;">150</div>
                    </div>
                    <div style="padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 6px;">
                        <div style="font-size: 11px; color: #7a9aba;">利用率</div>
                        <div style="font-size: 20px; font-weight: 700; color: #ffc107;">75%</div>
                    </div>
                    <div style="padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 6px;">
                        <div style="font-size: 11px; color: #7a9aba;">可用</div>
                        <div style="font-size: 20px; font-weight: 700; color: #b388ff;">50</div>
                    </div>
                </div>
            </div>
            <div>
                <h4 style="color: #00ff88; margin-bottom: 15px;">箱位列表</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>箱号</th>
                            <th>尺寸</th>
                            <th>状态</th>
                            <th>重量</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>CBHU3202732</td><td>40'</td><td><span class="status-badge working">出口</span></td><td>28.5t</td></tr>
                        <tr><td>MSKU6182931</td><td>20'</td><td><span class="status-badge info">进口</span></td><td>15.2t</td></tr>
                        <tr><td>ZIMU1628390</td><td>40'</td><td><span class="status-badge idle">中转</span></td><td>22.8t</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `);
}

function renderBoxManagement(container) {
    const boxes = [
        { id: 'CBHU3202732', size: "40'", type: '干货', status: '出口', weight: '28.5t', location: 'A01-03-02', eta: '2024-05-13' },
        { id: 'MSKU6182931', size: "20'", type: '干货', status: '进口', weight: '15.2t', location: 'A02-05-01', eta: '2024-05-12' },
        { id: 'ZIMU1628390', size: "40'", type: '冷藏', status: '中转', weight: '22.8t', location: 'B01-02-03', eta: '2024-05-14' },
        { id: 'OOLU5718294', size: "40'", type: '危险品', status: '出口', weight: '18.5t', location: 'C02-08-02', eta: '2024-05-13' },
        { id: 'MAEU2384756', size: "20'", type: '干货', status: '进口', weight: '12.3t', location: 'A03-04-01', eta: '2024-05-12' }
    ];

    container.innerHTML = `
        <div class="filter-bar">
            <div class="filter-group">
                <label>箱号搜索</label>
                <input type="text" placeholder="输入箱号..." style="width: 200px;">
            </div>
            <div class="filter-group">
                <label>状态</label>
                <select>
                    <option>全部</option>
                    <option>出口</option>
                    <option>进口</option>
                    <option>中转</option>
                </select>
            </div>
            <button class="port-btn port-btn-primary">搜索</button>
        </div>
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📦 集装箱箱位管理</span>
                <span class="status-badge info" style="font-size: 11px;">共 1,050 箱</span>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>箱号</th>
                        <th>尺寸/类型</th>
                        <th>状态</th>
                        <th>重量</th>
                        <th>位置</th>
                        <th>预计作业</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${boxes.map(box => {
                        const statusClass = box.status === '出口' ? 'working' : box.status === '进口' ? 'info' : 'idle';
                        return `
                            <tr>
                                <td style="color: #00ff88; font-weight: 600; font-family: monospace;">${box.id}</td>
                                <td>${box.size} / ${box.type}</td>
                                <td><span class="status-badge ${statusClass}">${box.status}</span></td>
                                <td>${box.weight}</td>
                                <td><span class="status-badge warning">${box.location}</span></td>
                                <td>${box.eta}</td>
                                <td><button class="port-btn port-btn-secondary port-btn-sm">移动</button></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderYardStats(container) {
    container.innerHTML = `
        <div class="filter-bar">
            <div class="filter-group">
                <label>统计周期</label>
                <select id="stats-period" onchange="refreshYardStats()">
                    <option value="7">近7天</option>
                    <option value="30" selected>近30天</option>
                    <option value="90">近90天</option>
                </select>
            </div>
            <div class="filter-group">
                <label>箱型维度</label>
                <select id="stats-type" onchange="refreshYardStats()">
                    <option value="all">全部箱型</option>
                    <option value="20">20'标准箱</option>
                    <option value="40">40'大柜</option>
                    <option value="45">45'特种箱</option>
                </select>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px;">
            <div class="stat-card">
                <div class="stat-label">📦 日均堆存量</div>
                <div class="stat-value">1,056</div>
                <div class="stat-trend up">↑ 8.2% 较上期</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">📊 平均利用率</div>
                <div class="stat-value">70.4%</div>
                <div class="stat-trend up">↑ 5.1% 较上期</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">🔄 堆存周转率</div>
                <div class="stat-value">4.2次/月</div>
                <div class="stat-trend up">↑ 12.5% 较上期</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">⚠️ 超期堆存箱</div>
                <div class="stat-value">28</div>
                <div class="stat-trend down">↓ 3 较昨日</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 堆存量趋势</span>
                    <select class="chart-filter" onchange="updateStockTrendChart()">
                        <option value="daily">按日</option>
                        <option value="weekly">按周</option>
                    </select>
                </div>
                <div id="yard-stock-chart" class="chart-container" style="height: 280px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 各区堆存对比</span>
                    <select class="chart-filter" onchange="updateZoneCompareChart()">
                        <option value="utilization">利用率</option>
                        <option value="count">箱位数</option>
                    </select>
                </div>
                <div id="yard-compare-chart" class="chart-container" style="height: 280px;"></div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📦 按箱型分布</span>
                </div>
                <div id="yard-size-chart" class="chart-container" style="height: 250px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">🚢 按业务类型分布</span>
                </div>
                <div id="yard-business-chart" class="chart-container" style="height: 250px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">⏱️ 堆存时长分布</span>
                </div>
                <div id="yard-duration-chart" class="chart-container" style="height: 250px;"></div>
            </div>
        </div>

        <div class="port-card" style="margin-top: 15px;">
            <div class="card-header">
                <span class="card-title">⚠️ 超期堆存预警</span>
                <span class="status-badge danger">28 箱超期</span>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>箱号</th>
                        <th>位置</th>
                        <th>进港日期</th>
                        <th>堆存天数</th>
                        <th>免箱期</th>
                        <th>超期天数</th>
                        <th>预计费用</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="color: #00ff88; font-family: monospace;">CBHU3202732</td>
                        <td>A01-03-02</td>
                        <td>2024-04-20</td>
                        <td>22天</td>
                        <td>14天</td>
                        <td><span style="color: #ff4757; font-weight: 600;">+8天</span></td>
                        <td>¥1,600</td>
                        <td><span class="status-badge danger">待疏港</span></td>
                    </tr>
                    <tr>
                        <td style="color: #00ff88; font-family: monospace;">MSKU6182931</td>
                        <td>A02-05-01</td>
                        <td>2024-04-25</td>
                        <td>17天</td>
                        <td>14天</td>
                        <td><span style="color: #ffc107; font-weight: 600;">+3天</span></td>
                        <td>¥600</td>
                        <td><span class="status-badge warning">疏港中</span></td>
                    </tr>
                    <tr>
                        <td style="color: #00ff88; font-family: monospace;">ZIMU1628390</td>
                        <td>B01-02-03</td>
                        <td>2024-04-28</td>
                        <td>14天</td>
                        <td>14天</td>
                        <td><span style="color: #00d4ff; font-weight: 600;">0天</span></td>
                        <td>¥0</td>
                        <td><span class="status-badge info">今日到期</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    setTimeout(() => {
        initYardStockChart();
        initYardZoneCompareChart();
        initYardSizeChart();
        initYardBusinessChart();
        initYardDurationChart();
    }, 100);
}

function initYardStockChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('yard-stock-chart')) return;

    const chart = ec.init(document.getElementById('yard-stock-chart'));
    const dates = Array.from({length: 30}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 29 + i);
        return `${d.getMonth()+1}/${d.getDate()}`;
    });
    
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['实际堆存', '7日移动平均'], textStyle: { color: '#a0c4e8', fontSize: 11 } },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: dates, axisLabel: { color: '#7a9aba', fontSize: 10 } },
        yAxis: { type: 'value', min: 800, max: 1300, axisLabel: { color: '#7a9aba', fontSize: 10 } },
        series: [
            {
                name: '实际堆存',
                type: 'bar',
                data: Array.from({length: 30}, () => 900 + Math.floor(Math.random() * 250)),
                itemStyle: { color: 'rgba(0, 212, 255, 0.6)' }
            },
            {
                name: '7日移动平均',
                type: 'line',
                data: Array.from({length: 30}, () => 950 + Math.floor(Math.random() * 150)),
                lineStyle: { color: '#00ff88', width: 2 },
                itemStyle: { color: '#00ff88' },
                smooth: true
            }
        ]
    });
}

function initYardZoneCompareChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('yard-compare-chart')) return;

    const chart = ec.init(document.getElementById('yard-compare-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['已用', '可用'], textStyle: { color: '#a0c4e8', fontSize: 11 } },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: ['A区', 'B区', 'C区', 'D区'], axisLabel: { color: '#7a9aba', fontSize: 11 } },
        yAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 10 } },
        series: [
            {
                name: '已用',
                type: 'bar',
                stack: 'total',
                data: [280, 253, 265, 260],
                itemStyle: { color: '#00ff88' }
            },
            {
                name: '可用',
                type: 'bar',
                stack: 'total',
                data: [120, 147, 135, 140],
                itemStyle: { color: 'rgba(122, 154, 186, 0.3)' }
            }
        ]
    });
}

function initYardSizeChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('yard-size-chart')) return;

    const chart = ec.init(document.getElementById('yard-size-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['35%', '60%'],
            center: ['50%', '50%'],
            data: [
                { value: 580, name: "20'标准箱", itemStyle: { color: '#00d4ff' } },
                { value: 420, name: "40'大柜", itemStyle: { color: '#00ff88' } },
                { value: 50, name: "45'特种箱", itemStyle: { color: '#b388ff' } }
            ],
            label: { color: '#a0c4e8', fontSize: 11 },
            emphasis: { scale: true, scaleSize: 5 }
        }]
    });
}

function initYardBusinessChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('yard-business-chart')) return;

    const chart = ec.init(document.getElementById('yard-business-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['35%', '60%'],
            center: ['50%', '50%'],
            data: [
                { value: 450, name: '出口', itemStyle: { color: '#00ff88' } },
                { value: 380, name: '进口', itemStyle: { color: '#00d4ff' } },
                { value: 150, name: '中转', itemStyle: { color: '#b388ff' } },
                { value: 70, name: '空箱', itemStyle: { color: '#7a9aba' } }
            ],
            label: { color: '#a0c4e8', fontSize: 11 },
            emphasis: { scale: true, scaleSize: 5 }
        }]
    });
}

function initYardDurationChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('yard-duration-chart')) return;

    const chart = ec.init(document.getElementById('yard-duration-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 30, bottom: 30 },
        xAxis: { 
            type: 'category', 
            data: ['0-3天', '4-7天', '8-14天', '15-30天', '>30天'],
            axisLabel: { color: '#7a9aba', fontSize: 10 }
        },
        yAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 10 } },
        series: [{
            type: 'bar',
            data: [320, 410, 220, 80, 20],
            itemStyle: {
                color: function(params) {
                    const colors = ['#00ff88', '#00d4ff', '#ffc107', '#ff8c00', '#ff4757'];
                    return colors[params.dataIndex];
                }
            }
        }]
    });
}

function refreshYardStats() {
    // 重新渲染图表
    initYardStockChart();
    initYardZoneCompareChart();
    initYardSizeChart();
    initYardBusinessChart();
    initYardDurationChart();
}

function renderTurnoverStats(container) {
    container.innerHTML = `
        <div class="filter-bar">
            <div class="filter-group">
                <label>统计周期</label>
                <select id="turnover-period" onchange="refreshTurnoverStats()">
                    <option value="7">近7天</option>
                    <option value="30" selected>近30天</option>
                    <option value="90">近90天</option>
                </select>
            </div>
            <div class="filter-group">
                <label>统计维度</label>
                <select id="turnover-dimension" onchange="refreshTurnoverStats()">
                    <option value="zone">按场区</option>
                    <option value="ship">按船公司</option>
                    <option value="operator">按操作队</option>
                </select>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px;">
            <div class="stat-card">
                <div class="stat-label">🔄 总翻箱次数</div>
                <div class="stat-value">2,847</div>
                <div class="stat-trend down">↓ 12.5% 较上月</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">📊 平均翻箱率</div>
                <div class="stat-value">1.32</div>
                <div class="stat-trend down">↓ 0.18 较上月</div>
                <div style="font-size: 11px; color: #00ff88; margin-top: 5px;">🎯 目标值: ≤1.5</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">💰 翻箱成本</div>
                <div class="stat-value">¥85,410</div>
                <div class="stat-trend down">↓ ¥12,350 较上月</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">⏱️ 平均翻箱耗时</div>
                <div class="stat-value">4.2分</div>
                <div class="stat-trend down">↓ 0.3分 较上月</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 翻箱率趋势分析</span>
                    <span style="color: #7a9aba; font-size: 11px;">目标线: 1.5</span>
                </div>
                <div id="turnover-trend-chart" class="chart-container" style="height: 300px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">🎯 目标达成情况</span>
                </div>
                <div id="turnover-gauge-chart" class="chart-container" style="height: 300px;"></div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📍 各区翻箱率对比</span>
                </div>
                <div id="turnover-zone-chart" class="chart-container" style="height: 250px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">❓ 翻箱原因分布</span>
                </div>
                <div id="turnover-reason-chart" class="chart-container" style="height: 250px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">👷 操作队效率排行</span>
                </div>
                <div id="turnover-operator-chart" class="chart-container" style="height: 250px;"></div>
            </div>
        </div>

        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📋 今日翻箱记录</span>
                <span class="status-badge info">共 47 次</span>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>时间</th>
                        <th>箱号</th>
                        <th>原位置</th>
                        <th>新位置</th>
                        <th>翻箱原因</th>
                        <th>操作队</th>
                        <th>耗时</th>
                        <th>费用</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>08:32:15</td>
                        <td style="color: #00ff88; font-family: monospace;">CBHU3202732</td>
                        <td>A01-03-02</td>
                        <td>B02-05-01</td>
                        <td><span class="status-badge info">配载调整</span></td>
                        <td>一队</td>
                        <td>3.8分</td>
                        <td>¥30</td>
                    </tr>
                    <tr>
                        <td>09:15:42</td>
                        <td style="color: #00ff88; font-family: monospace;">MSKU6182931</td>
                        <td>A02-05-01</td>
                        <td>C01-02-03</td>
                        <td><span class="status-badge warning">掏箱作业</span></td>
                        <td>二队</td>
                        <td>5.2分</td>
                        <td>¥45</td>
                    </tr>
                    <tr>
                        <td>10:08:27</td>
                        <td style="color: #00ff88; font-family: monospace;">ZIMU1628390</td>
                        <td>B01-02-03</td>
                        <td>A03-08-02</td>
                        <td><span class="status-badge idle">整理归位</span></td>
                        <td>一队</td>
                        <td>3.5分</td>
                        <td>¥30</td>
                    </tr>
                    <tr>
                        <td>11:22:59</td>
                        <td style="color: #00ff88; font-family: monospace;">OOLU5718294</td>
                        <td>C02-08-02</td>
                        <td>D01-04-01</td>
                        <td><span class="status-badge danger">急单提箱</span></td>
                        <td>三队</td>
                        <td>6.8分</td>
                        <td>¥60</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="port-card" style="margin-top: 15px;">
            <div class="card-header">
                <span class="card-title">💡 翻箱优化建议</span>
                <span class="status-badge success">智能分析</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; padding: 15px;">
                <div style="padding: 15px; background: rgba(0, 255, 136, 0.08); border-radius: 8px; border-left: 3px solid #00ff88;">
                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 8px;">✨ 高位优化</div>
                    <div style="color: #a0c4e8; font-size: 12px; line-height: 1.6;">
                        B区二层以上重箱占比达68%，建议将近期出口重箱优先堆放于底层，预计可减少翻箱率约8%。
                    </div>
                </div>
                <div style="padding: 15px; background: rgba(0, 212, 255, 0.08); border-radius: 8px; border-left: 3px solid #00d4ff;">
                    <div style="color: #00d4ff; font-weight: 600; margin-bottom: 8px;">📦 同港归集</div>
                    <div style="color: #a0c4e8; font-size: 12px; line-height: 1.6;">
                        上海港出口箱分散在3个区域堆放，建议归集到A区集中堆放，预计可减少提箱翻箱率约12%。
                    </div>
                </div>
                <div style="padding: 15px; background: rgba(179, 136, 255, 0.08); border-radius: 8px; border-left: 3px solid #b388ff;">
                    <div style="color: #b388ff; font-weight: 600; margin-bottom: 8px;">⏰ 时段优化</div>
                    <div style="color: #a0c4e8; font-size: 12px; line-height: 1.6;">
                        09:00-11:00为提箱高峰，建议提前1小时完成预翻箱准备，可减少作业等待时间约15%。
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        initTurnoverTrendChart();
        initTurnoverGaugeChart();
        initTurnoverZoneChart();
        initTurnoverReasonChart();
        initTurnoverOperatorChart();
    }, 100);
}

function initTurnoverTrendChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('turnover-trend-chart')) return;

    const chart = ec.init(document.getElementById('turnover-trend-chart'));
    const dates = Array.from({length: 30}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 29 + i);
        return `${d.getMonth()+1}/${d.getDate()}`;
    });

    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['实际翻箱率', '7日移动平均', '目标值'], textStyle: { color: '#a0c4e8', fontSize: 11 } },
        grid: { left: 50, right: 50, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: dates, axisLabel: { color: '#7a9aba', fontSize: 10 } },
        yAxis: { type: 'value', min: 0.8, max: 2.0, axisLabel: { color: '#7a9aba', fontSize: 10 } },
        series: [
            {
                name: '实际翻箱率',
                type: 'bar',
                data: Array.from({length: 30}, () => 1.1 + Math.random() * 0.6),
                itemStyle: { color: 'rgba(0, 212, 255, 0.5)' }
            },
            {
                name: '7日移动平均',
                type: 'line',
                data: Array.from({length: 30}, () => 1.2 + Math.random() * 0.3),
                lineStyle: { color: '#00ff88', width: 2 },
                itemStyle: { color: '#00ff88' },
                smooth: true
            },
            {
                name: '目标值',
                type: 'line',
                data: Array(30).fill(1.5),
                lineStyle: { color: '#ff4757', width: 1, type: 'dashed' },
                itemStyle: { color: '#ff4757' },
                symbol: 'none'
            }
        ]
    });
}

function initTurnoverGaugeChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('turnover-gauge-chart')) return;

    const chart = ec.init(document.getElementById('turnover-gauge-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge',
            radius: '85%',
            min: 0,
            max: 2.5,
            splitNumber: 5,
            axisLine: {
                lineStyle: {
                    width: 15,
                    color: [
                        [0.4, '#00ff88'],
                        [0.6, '#00d4ff'],
                        [0.8, '#ffc107'],
                        [1, '#ff4757']
                    ]
                }
            },
            pointer: { itemStyle: { color: '#00ff88' }, width: 4 },
            axisTick: { length: 8, lineStyle: { color: '#7a9aba' } },
            splitLine: { length: 12, lineStyle: { color: '#7a9aba' } },
            axisLabel: { color: '#a0c4e8', fontSize: 10 },
            title: { offsetCenter: [0, '60%'], fontSize: 12, color: '#7a9aba' },
            detail: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#00ff88',
                offsetCenter: [0, '30%'],
                formatter: '{value}'
            },
            data: [{ value: 1.32, name: '本月翻箱率' }]
        }]
    });
}

function initTurnoverZoneChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('turnover-zone-chart')) return;

    const chart = ec.init(document.getElementById('turnover-zone-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 10 } },
        yAxis: { type: 'category', axisLabel: { color: '#7a9aba', fontSize: 10 } },
        series: [{
            type: 'bar',
            yAxisIndex: 0,
            data: [
                { value: 1.15, name: 'A区', itemStyle: { color: '#00ff88' } },
                { value: 1.28, name: 'B区', itemStyle: { color: '#00d4ff' } },
                { value: 1.42, name: 'C区', itemStyle: { color: '#ffc107' } },
                { value: 1.52, name: 'D区', itemStyle: { color: '#ff4757' } }
            ]
        }]
    });
}

function initTurnoverReasonChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('turnover-reason-chart')) return;

    const chart = ec.init(document.getElementById('turnover-reason-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['35%', '60%'],
            center: ['50%', '50%'],
            data: [
                { value: 856, name: '配载调整', itemStyle: { color: '#00d4ff' } },
                { value: 624, name: '掏箱作业', itemStyle: { color: '#00ff88' } },
                { value: 512, name: '整理归位', itemStyle: { color: '#b388ff' } },
                { value: 435, name: '急单提箱', itemStyle: { color: '#ffc107' } },
                { value: 420, name: '查验移箱', itemStyle: { color: '#ff4757' } }
            ],
            label: { color: '#a0c4e8', fontSize: 11 }
        }]
    });
}

function initTurnoverOperatorChart() {
    const ec = getECharts();
    if (!ec || !document.getElementById('turnover-operator-chart')) return;

    const chart = ec.init(document.getElementById('turnover-operator-chart'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 10 } },
        yAxis: { 
            type: 'category', 
            data: ['五队', '四队', '三队', '二队', '一队'],
            axisLabel: { color: '#7a9aba', fontSize: 10 }
        },
        series: [{
            type: 'bar',
            data: [1.12, 1.22, 1.28, 1.35, 1.45],
            itemStyle: {
                color: function(params) {
                    const colors = ['#00ff88', '#00d4ff', '#b388ff', '#ffc107', '#ff4757'];
                    return colors[params.dataIndex];
                }
            },
            label: {
                show: true,
                position: 'right',
                color: '#a0c4e8',
                fontSize: 11,
                formatter: '{c}'
            }
        }]
    });
}

function refreshTurnoverStats() {
    initTurnoverTrendChart();
    initTurnoverGaugeChart();
    initTurnoverZoneChart();
    initTurnoverReasonChart();
    initTurnoverOperatorChart();
}

function updateStockTrendChart() {
    initYardStockChart();
}

function updateZoneCompareChart() {
    initYardZoneCompareChart();
}


function renderAlgoTheory(container) {
    var html = '' +
        '<div class="port-card">' +
            '<div class="card-header">' +
                '<span class="card-title">📋 什么是集装箱预翻箱问题(CRP)？</span>' +
            '</div>' +
            '<div style="padding: 25px;">' +
                '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">' +
                    '<div>' +
                        '<div style="color: #ff6b6b; font-size: 16px; font-weight: 600; margin-bottom: 15px;">❌ 传统作业的痛点</div>' +
                        '<div style="color: #a0c4e8; font-size: 13px; line-height: 2.2;">' +
                            '<p>集装箱在堆场是<strong style="color: #ffc107;">垂直堆叠</strong>存放的。</p>' +
                            '<p>如果要提取的箱子在<strong style="color: #ff6b6b;">底层</strong>，必须先把上面的箱子挪走。</p>' +
                            '<p>这个移动过程就叫<strong style="color: #ff6b6b; font-size: 15px;">翻箱</strong>。</p>' +
                            '<p style="margin-top: 10px;">翻箱导致：集卡等待时间长、轮胎吊空驶油耗增加、堆场吞吐量受限</p>' +
                        '</div>' +
                    '</div>' +
                    '<div>' +
                        '<div style="color: #00ff88; font-size: 16px; font-weight: 600; margin-bottom: 15px;">✅ A*智能预翻箱优化</div>' +
                        '<div style="color: #a0c4e8; font-size: 13px; line-height: 2.2;">' +
                            '<p>利用<strong style="color: #00d4ff;">A*启发式搜索算法</strong>，提前计算最优翻箱策略。</p>' +
                            '<p>让每个阻挡箱的移动<strong style="color: #00ff88;">一步到位</strong>，避免二次翻箱。</p>' +
                            '<p style="margin-top: 10px; color: #00ff88;">优化效果：翻箱率降低50~60%，单箱作业时间缩短40%，千万级大港年节省超2亿元！</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    container.innerHTML = html;
}

// ==================== CRP可视化模拟器 - 双算法对比版 ====================
let simRunning = false;
let simStep = 0;
let simBoxes = 50;
let simStacks = 12;
let simBuffers = 3;
let simTrucks = 8;

// 动画队列
let astarAnimationQueue = [];
let greedyAnimationQueue = [];
let isAnimating = false;

// A*智能算法 (左边)
let astarState = [];
let astarTruckState = [];
let astarHistory = [];

// 贪心算法 (右边)
let greedyState = [];
let greedyTruckState = [];
let greedyHistory = [];

// 共享的提取序列和初始状态
let simSequence = [];
let initialState = [];
let autoPlayTimer = null;
let compareChartData = [];

function initSimulator() {
    // 生成共享的初始堆场状态
    initialState = [];
    var boxesPlaced = 0;
    for (var s = 0; s < simStacks; s++) {
        initialState[s] = [];
        var stackHeight = Math.floor(Math.random() * 8) + 2;
        for (var h = 0; h < stackHeight && boxesPlaced < simBoxes; h++) {
            boxesPlaced++;
            initialState[s].push(boxesPlaced);
        }
    }
    
    // 生成共享的提取序列
    simSequence = [];
    for (var b = 1; b <= simBoxes; b++) simSequence.push(b);
    for (var i = simSequence.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = simSequence[i];
        simSequence[i] = simSequence[j];
        simSequence[j] = t;
    }
    
    // 初始化A*算法状态
    astarState = JSON.parse(JSON.stringify(initialState));
    astarTruckState = [];
    for (var t = 0; t < simTrucks; t++) {
        astarTruckState[t] = { loaded: 0, capacity: Math.floor(simBoxes / simTrucks) + 2 };
    }
    
    // 初始化贪心算法状态
    greedyState = JSON.parse(JSON.stringify(initialState));
    greedyTruckState = [];
    for (var t = 0; t < simTrucks; t++) {
        greedyTruckState[t] = { loaded: 0, capacity: Math.floor(simBoxes / simTrucks) + 2 };
    }
    
    simStep = 0;
    astarHistory = [];
    greedyHistory = [];
    compareChartData = [];
    if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
    renderDualSimulator();
    updateDualStats();
}

function updateSimStats() {
    var el = document.getElementById('sim-boxes-count');
    if (el) el.textContent = simBoxes;
    el = document.getElementById('sim-stacks-count');
    if (el) el.textContent = simStacks;
    el = document.getElementById('sim-buffers-count');
    if (el) el.textContent = simBuffers;
    el = document.getElementById('sim-trucks-count');
    if (el) el.textContent = simTrucks;
    el = document.getElementById('sim-progress');
    if (el) el.textContent = simStep + '/' + simBoxes;
    el = document.getElementById('sim-relocations');
    if (el) el.textContent = (simHistory.length - simStep) + '次';
    el = document.getElementById('sim-rate');
    if (el && simStep > 0) {
        var rate = Math.round((simHistory.length - simStep) / simStep * 100);
        el.textContent = rate + '%';
    }
}

function renderYardForState(state, targetColor, prefix) {
    var html = '<div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; padding: 15px;">';
    for (var s = 0; s < simStacks; s++) {
        var isBuffer = s >= simStacks - simBuffers;
        html += '<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">' +
            '<div style="color: ' + (isBuffer ? '#b388ff' : '#7a9aba') + '; font-size: 9px; font-weight: 600; margin-bottom: 3px;">' +
            (isBuffer ? '缓冲' : '栈') + (s + 1) + '</div>';
        
        var stack = state[s] || [];
        for (var h = stack.length - 1; h >= 0; h--) {
            var box = stack[h];
            var isNextTarget = box === simSequence[simStep];
            var bgColor = isNextTarget ? targetColor : (isBuffer ? 'rgba(179,136,255,0.6)' : '#4a90d9');
            html += '<div id="' + prefix + '-box-' + box + '" style="' +
                'width: 28px; height: 22px; background: ' + bgColor + '; border-radius: 3px; ' +
                'display: flex; align-items: center; justify-content: center; color: #fff; ' +
                'font-weight: 700; font-size: 9px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); ' +
                'transition: all 0.4s ease;">' + box + '</div>';
        }
        
        for (var h = stack.length; h < 10; h++) {
            html += '<div style="width: 28px; height: 22px; border: 1px dashed rgba(122,154,186,0.12); border-radius: 3px;"></div>';
        }
        html += '<div style="width: 36px; height: 3px; background: #3a5a7a; border-radius: 2px; margin-top: 2px;"></div></div>';
    }
    html += '</div>';
    return html;
}

function renderTrucksForState(truckState, barColor) {
    var html = '<div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; padding: 15px;">';
    for (var t = 0; t < simTrucks; t++) {
        var truck = truckState[t] || { loaded: 0, capacity: 10 };
        var percent = Math.min(100, Math.round(truck.loaded / truck.capacity * 100));
        html += '<div style="text-align: center;">' +
            '<div style="color: #7a9aba; font-size: 9px; margin-bottom: 4px;">货车#' + (t + 1) + '</div>' +
            '<div style="width: 60px; height: 38px; background: linear-gradient(to top, #555 0%, #777 100%); border-radius: 5px 5px 2px 2px; position: relative; overflow: hidden;">' +
                '<div style="position: absolute; bottom: 0; left: 0; right: 0; height: ' + percent + '%; background: linear-gradient(to top, ' + barColor + ', ' + barColor + 'ee); transition: height 0.4s ease;"></div>' +
                '<div style="position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; color: #fff; font-weight: 700; font-size: 10px;">' + truck.loaded + '/' + truck.capacity + '</div>' +
            '</div>' +
        '</div>';
    }
    html += '</div>';
    return html;
}

// A*智能算法步进 - 记录动画信息
function astarNextStep() {
    if (simStep >= simBoxes) return false;
    
    var targetBox = simSequence[simStep];
    var targetStack = -1, targetIndex = -1;
    for (var s = 0; s < simStacks; s++) {
        if (!astarState[s]) continue;
        var idx = astarState[s].indexOf(targetBox);
        if (idx >= 0) { targetStack = s; targetIndex = idx; break; }
    }
    
    if (targetStack < 0) return false;
    if (targetIndex === astarState[targetStack].length - 1) {
        for (var t = 0; t < simTrucks; t++) {
            if (astarTruckState[t].loaded < astarTruckState[t].capacity) {
                // 记录装货动画信息
                astarAnimationQueue.push({
                    type: 'load',
                    box: targetBox,
                    fromStack: targetStack,
                    toTruck: t,
                    fromHeight: astarState[targetStack].length - 1
                });
                astarState[targetStack].pop();
                astarTruckState[t].loaded++;
                astarHistory.push({ type: 'load', box: targetBox });
                return true;
            }
        }
    } else {
        var topBox = astarState[targetStack][astarState[targetStack].length - 1];
        var bestStack = -1, minBadness = 9999;
        for (var s = 0; s < simStacks; s++) {
            if (s !== targetStack && astarState[s].length < 10) {
                var badness = astarState[s].length;
                for (var h = 0; h < astarState[s].length; h++) {
                    var otherPos = simSequence.indexOf(astarState[s][h]);
                    if (otherPos < simSequence.indexOf(topBox)) badness += 100;
                }
                if (s >= simStacks - simBuffers) badness -= 50;
                if (badness < minBadness) { minBadness = badness; bestStack = s; }
            }
        }
        if (bestStack >= 0) {
            // 记录翻箱动画信息
            astarAnimationQueue.push({
                type: 'relocate',
                box: topBox,
                fromStack: targetStack,
                toStack: bestStack,
                fromHeight: astarState[targetStack].length - 1,
                toHeight: astarState[bestStack].length
            });
            astarState[targetStack].pop();
            astarState[bestStack].push(topBox);
            astarHistory.push({ type: 'relocate', box: topBox });
        }
    }
    return true;
}

// 贪心算法步进
// 贪心算法步进 - 记录动画信息
function greedyNextStep() {
    if (simStep >= simBoxes) return false;
    
    var targetBox = simSequence[simStep];
    var targetStack = -1, targetIndex = -1;
    for (var s = 0; s < simStacks; s++) {
        if (!greedyState[s]) continue;
        var idx = greedyState[s].indexOf(targetBox);
        if (idx >= 0) { targetStack = s; targetIndex = idx; break; }
    }
    
    if (targetStack < 0) return false;
    if (targetIndex === greedyState[targetStack].length - 1) {
        for (var t = 0; t < simTrucks; t++) {
            if (greedyTruckState[t].loaded < greedyTruckState[t].capacity) {
                // 记录装货动画信息
                greedyAnimationQueue.push({
                    type: 'load',
                    box: targetBox,
                    fromStack: targetStack,
                    toTruck: t,
                    fromHeight: greedyState[targetStack].length - 1
                });
                greedyState[targetStack].pop();
                greedyTruckState[t].loaded++;
                greedyHistory.push({ type: 'load', box: targetBox });
                return true;
            }
        }
    } else {
        var topBox = greedyState[targetStack][greedyState[targetStack].length - 1];
        greedyState[targetStack].pop();
        var bestStack = -1, bestHeight = 999;
        for (var s = 0; s < simStacks; s++) {
            if (s !== targetStack && greedyState[s].length < 10) {
                var isBuffer = s >= simStacks - simBuffers;
                var height = greedyState[s].length + (isBuffer ? 0 : 100);
                if (height < bestHeight) { bestHeight = height; bestStack = s; }
            }
        }
        if (bestStack >= 0) {
            // 记录翻箱动画信息
            greedyAnimationQueue.push({
                type: 'relocate',
                box: topBox,
                fromStack: targetStack,
                toStack: bestStack,
                fromHeight: greedyState[targetStack].length - 1,
                toHeight: greedyState[bestStack].length
            });
            greedyState[bestStack].push(topBox);
            greedyHistory.push({ type: 'relocate', box: topBox });
        }
    }
    return true;
}

// 同时步进两个算法 - 先执行动画再渲染
function dualNextStep() {
    if (simStep >= simBoxes || isAnimating) return;
    
    // 清空动画队列
    astarAnimationQueue = [];
    greedyAnimationQueue = [];
    
    // 执行步进，收集所有动画信息
    var madeProgress = true;
    while (madeProgress) {
        madeProgress = false;
        if (astarNextStep()) madeProgress = true;
        if (greedyNextStep()) madeProgress = true;
    }
    simStep++;
    
    var astarReloc = Math.max(0, astarHistory.length - simStep);
    var greedyReloc = Math.max(0, greedyHistory.length - simStep);
    compareChartData.push({ step: simStep, astar: astarReloc, greedy: greedyReloc });
    
    // 执行动画
    if (astarAnimationQueue.length > 0 || greedyAnimationQueue.length > 0) {
        isAnimating = true;
        playAnimations(function() {
            isAnimating = false;
            renderDualSimulator();
            updateDualStats();
            renderDualChart();
        });
    } else {
        renderDualSimulator();
        updateDualStats();
        renderDualChart();
    }
}

// 执行所有动画
function playAnimations(callback) {
    var allAnimations = [];
    
    // 组合A*算法动画
    astarAnimationQueue.forEach(function(anim, idx) {
        allAnimations.push({ prefix: 'astar', anim: anim, delay: idx * 150, color: '#00ff88' });
    });
    
    // 组合贪心算法动画
    greedyAnimationQueue.forEach(function(anim, idx) {
        allAnimations.push({ prefix: 'greedy', anim: anim, delay: idx * 150, color: '#ff6b6b' });
    });
    
    if (allAnimations.length === 0) {
        callback();
        return;
    }
    
    var maxDelay = Math.max.apply(null, allAnimations.map(function(a) { return a.delay; }));
    
    allAnimations.forEach(function(a) {
        setTimeout(function() {
            playSingleAnimation(a.prefix, a.anim, a.color);
        }, a.delay);
    });
    
    // 所有动画完成后回调
    setTimeout(callback, maxDelay + 500);
}

// 执行单个动画
function playSingleAnimation(prefix, anim, color) {
    var yardEl = document.getElementById(prefix + '-yard');
    if (!yardEl) return;
    
    // 计算起始位置
    var fromStackEl = yardEl.children[anim.fromStack];
    if (!fromStackEl) return;
    
    var stackRect = fromStackEl.getBoundingClientRect();
    var yardRect = yardEl.getBoundingClientRect();
    
    // 起始位置：从栈的顶部箱子位置
    var fromX = stackRect.left - yardRect.left + stackRect.width / 2 - 14;
    var fromY = 15 + (9 - anim.fromHeight) * 24; // 15px padding, 24px per box
    
    // 创建浮动动画元素
    var floatBox = document.createElement('div');
    floatBox.style.cssText = '' +
        'position: absolute;' +
        'left: ' + fromX + 'px;' +
        'top: ' + fromY + 'px;' +
        'width: 28px;' +
        'height: 22px;' +
        'background: ' + color + ';' +
        'border-radius: 3px;' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'color: #fff;' +
        'font-weight: 700;' +
        'font-size: 9px;' +
        'box-shadow: 0 4px 15px rgba(0,0,0,0.4);' +
        'z-index: 1000;' +
        'transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);';
    floatBox.textContent = anim.box;
    
    // 创建轨迹线SVG
    var trailSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trailSvg.style.cssText = '' +
        'position: absolute;' +
        'left: 0;' +
        'top: 0;' +
        'width: 100%;' +
        'height: 100%;' +
        'pointer-events: none;' +
        'z-index: 999;';
    
    // 计算目标位置
    var toX, toY;
    if (anim.type === 'relocate') {
        var toStackEl = yardEl.children[anim.toStack];
        if (!toStackEl) return;
        var toStackRect = toStackEl.getBoundingClientRect();
        toX = toStackRect.left - yardRect.left + toStackRect.width / 2 - 14;
        toY = 15 + (9 - anim.toHeight) * 24;
    } else {
        // 装货动画 - 移动到货车位置
        toX = fromX;
        toY = fromY + 100; // 向下移动到货车区域
    }
    
    // 创建贝塞尔曲线路径
    var midX = (fromX + toX) / 2;
    var midY = Math.min(fromY, toY) - 30; // 向上拱起
    var pathD = 'M' + (fromX + 14) + ',' + (fromY + 11) + ' Q' + (midX + 14) + ',' + midY + ' ' + (toX + 14) + ',' + (toY + 11);
    
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-dasharray', '5,3');
    path.style.opacity = '0.6';
    
    trailSvg.appendChild(path);
    yardEl.style.position = 'relative';
    yardEl.appendChild(trailSvg);
    yardEl.appendChild(floatBox);
    
    // 触发动画
    requestAnimationFrame(function() {
        floatBox.style.left = toX + 'px';
        floatBox.style.top = toY + 'px';
        floatBox.style.transform = 'scale(1.1)';
    });
    
    // 动画结束后清理
    setTimeout(function() {
        if (floatBox.parentNode) floatBox.parentNode.removeChild(floatBox);
        if (trailSvg.parentNode) trailSvg.parentNode.removeChild(trailSvg);
    }, 450);
}

function renderSimulator() {
    var yardEl = document.getElementById('sim-yard-visualization');
    if (yardEl) yardEl.innerHTML = renderYardVisualization();
    var truckEl = document.getElementById('sim-trucks');
    if (truckEl) truckEl.innerHTML = renderTrucks();
    var nextBox = simStep < simSequence.length ? simSequence[simStep] : null;
    var targetEl = document.getElementById('sim-next-target');
    if (targetEl) {
        if (nextBox) {
            targetEl.innerHTML = '下一个提取目标: <strong style="color: #00ff88; font-size: 16px;">#' + nextBox + '</strong>';
        } else {
            targetEl.innerHTML = '<strong style="color: #00ff88;">🎉 全部提取完成！共翻箱 ' + (simHistory.length - simBoxes) + ' 次</strong>';
            if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
        }
    }
}

function updateSimParam(type, value) {
    if (type === 'boxes') simBoxes = parseInt(value);
    if (type === 'stacks') simStacks = parseInt(value);
    if (type === 'buffers') simBuffers = parseInt(value);
    if (type === 'trucks') simTrucks = parseInt(value);
    initSimulator();
}

function startAutoPlay() {
    if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
        return;
    }
    autoPlayTimer = setInterval(function() {
        if (simStep >= simBoxes) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
            return;
        }
        simNextStep();
    }, 250);
}

// ==================== 标签页2: 完整可视化模拟器 ====================
function renderCRPLaboratory(container) {
    var html = '' +
        // ========== 顶部：共享参数配置 ==========
        '<div class="port-card">' +
            '<div class="card-header">' +
                '<span class="card-title">🎛️ 模拟器参数配置</span>' +
                '<button class="port-btn" onclick="initSimulator()" style="margin-right: 10px;">🔄 重置场景</button>' +
                '<button class="port-btn" onclick="startAutoPlay()" style="margin-right: 10px;">⏯️ 自动播放</button>' +
                '<button class="port-btn port-btn-primary" onclick="dualNextStep()">▶️ 下一步</button>' +
            '</div>' +
            '<div style="padding: 18px;">' +
                '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">' +
                    '<div style="padding: 12px; background: rgba(0,0,0,0.1); border-radius: 6px;">' +
                        '<div style="color: #7a9aba; font-size: 10px; margin-bottom: 6px;">📦 箱子总数: <span id="sim-boxes-count" style="color: #00d4ff; font-weight: 700;">50</span></div>' +
                        '<input type="range" min="50" max="300" value="50" oninput="updateSimParam(\'boxes\', this.value)" style="width: 100%;">' +
                    '</div>' +
                    '<div style="padding: 12px; background: rgba(0,0,0,0.1); border-radius: 6px;">' +
                        '<div style="color: #7a9aba; font-size: 10px; margin-bottom: 6px;">🏗️ 堆场栈数: <span id="sim-stacks-count" style="color: #00d4ff; font-weight: 700;">12</span></div>' +
                        '<input type="range" min="6" max="24" value="12" oninput="updateSimParam(\'stacks\', this.value)" style="width: 100%;">' +
                    '</div>' +
                    '<div style="padding: 12px; background: rgba(0,0,0,0.1); border-radius: 6px;">' +
                        '<div style="color: #7a9aba; font-size: 10px; margin-bottom: 6px;">🟣 缓冲栈数: <span id="sim-buffers-count" style="color: #b388ff; font-weight: 700;">3</span></div>' +
                        '<input type="range" min="1" max="8" value="3" oninput="updateSimParam(\'buffers\', this.value)" style="width: 100%;">' +
                    '</div>' +
                    '<div style="padding: 12px; background: rgba(0,0,0,0.1); border-radius: 6px;">' +
                        '<div style="color: #7a9aba; font-size: 10px; margin-bottom: 6px;">🚛 货车数量: <span id="sim-trucks-count" style="color: #00ff88; font-weight: 700;">8</span></div>' +
                        '<input type="range" min="5" max="20" value="8" oninput="updateSimParam(\'trucks\', this.value)" style="width: 100%;">' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // ========== 中间：左右双面板对比 ==========
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">' +
            // 左边：A*智能优化
            '<div>' +
                '<div class="port-card">' +
                    '<div class="card-header" style="border-bottom: 2px solid rgba(0,255,136,0.4);">' +
                        '<span class="card-title" style="color: #00ff88;">✅ A*智能优化</span>' +
                        '<span id="astar-next-target" style="color: #00d4ff; font-size: 12px;">下一个: #1</span>' +
                    '</div>' +
                    '<div id="astar-yard" style="min-height: 320px; overflow-x: auto;"></div>' +
                '</div>' +
                '<div class="port-card" style="margin-top: 12px;">' +
                    '<div class="card-header"><span class="card-title">🚛 货车装载</span></div>' +
                    '<div id="astar-trucks" style="min-height: 80px;"></div>' +
                '</div>' +
                '<div class="port-card" style="margin-top: 12px;">' +
                    '<div class="card-header"><span class="card-title">📊 统计</span></div>' +
                    '<div style="padding: 15px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">' +
                        '<div style="padding: 10px; background: rgba(0,212,255,0.1); border-radius: 6px; text-align: center;">' +
                            '<div style="color: #7a9aba; font-size: 9px;">进度</div>' +
                            '<div id="astar-progress" style="color: #00d4ff; font-size: 18px; font-weight: 700;">0/50</div>' +
                        '</div>' +
                        '<div style="padding: 10px; background: rgba(0,255,136,0.1); border-radius: 6px; text-align: center;">' +
                            '<div style="color: #7a9aba; font-size: 9px;">翻箱</div>' +
                            '<div id="astar-relocations" style="color: #00ff88; font-size: 18px; font-weight: 700;">0次</div>' +
                        '</div>' +
                        '<div style="padding: 10px; background: rgba(255,193,7,0.1); border-radius: 6px; text-align: center;">' +
                            '<div style="color: #7a9aba; font-size: 9px;">翻箱率</div>' +
                            '<div id="astar-rate" style="color: #ffc107; font-size: 18px; font-weight: 700;">0%</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // 右边：传统贪心
            '<div>' +
                '<div class="port-card">' +
                    '<div class="card-header" style="border-bottom: 2px solid rgba(255,107,107,0.4);">' +
                        '<span class="card-title" style="color: #ff6b6b;">❌ 传统贪心算法</span>' +
                        '<span id="greedy-next-target" style="color: #ff6b6b; font-size: 12px;">下一个: #1</span>' +
                    '</div>' +
                    '<div id="greedy-yard" style="min-height: 320px; overflow-x: auto;"></div>' +
                '</div>' +
                '<div class="port-card" style="margin-top: 12px;">' +
                    '<div class="card-header"><span class="card-title">🚛 货车装载</span></div>' +
                    '<div id="greedy-trucks" style="min-height: 80px;"></div>' +
                '</div>' +
                '<div class="port-card" style="margin-top: 12px;">' +
                    '<div class="card-header"><span class="card-title">📊 统计</span></div>' +
                    '<div style="padding: 15px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">' +
                        '<div style="padding: 10px; background: rgba(255,107,107,0.1); border-radius: 6px; text-align: center;">' +
                            '<div style="color: #7a9aba; font-size: 9px;">翻箱</div>' +
                            '<div id="greedy-relocations" style="color: #ff6b6b; font-size: 18px; font-weight: 700;">0次</div>' +
                        '</div>' +
                        '<div style="padding: 10px; background: rgba(255,193,7,0.1); border-radius: 6px; text-align: center;">' +
                            '<div style="color: #7a9aba; font-size: 9px;">翻箱率</div>' +
                            '<div id="greedy-rate" style="color: #ffc107; font-size: 18px; font-weight: 700;">0%</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // ========== 底部：对比折线图 ==========
        '<div class="port-card" style="margin-top: 12px;">' +
            '<div class="card-header">' +
                '<span class="card-title">📈 双算法对比折线图</span>' +
                '<div style="color: #ffc107; font-weight: 700;">A*节省翻箱: <span id="compare-saving">0次 (0%)</span></div>' +
            '</div>' +
            '<div id="dual-compare-chart" style="min-height: 240px; padding: 15px;"></div>' +
        '</div>';
    container.innerHTML = html;
    setTimeout(initSimulator, 100);
}

// ==================== 双面板渲染和统计函数 ====================
function renderDualSimulator() {
    var yardEl = document.getElementById('astar-yard');
    if (yardEl) yardEl.innerHTML = renderYardForState(astarState, '#00ff88', 'astar');
    yardEl = document.getElementById('greedy-yard');
    if (yardEl) yardEl.innerHTML = renderYardForState(greedyState, '#ff6b6b', 'greedy');
    
    var truckEl = document.getElementById('astar-trucks');
    if (truckEl) truckEl.innerHTML = renderTrucksForState(astarTruckState, '#00ff88');
    truckEl = document.getElementById('greedy-trucks');
    if (truckEl) truckEl.innerHTML = renderTrucksForState(greedyTruckState, '#ff6b6b');
    
    var nextBox = simStep < simSequence.length ? simSequence[simStep] : null;
    var targetEl = document.getElementById('astar-next-target');
    if (targetEl) {
        if (nextBox) targetEl.innerHTML = '下一个: <strong style="color: #00ff88;">#' + nextBox + '</strong>';
        else { targetEl.innerHTML = '<strong style="color: #00ff88;">🎉 完成！</strong>'; if(autoPlayTimer) clearInterval(autoPlayTimer); }
    }
    targetEl = document.getElementById('greedy-next-target');
    if (targetEl) {
        if (nextBox) targetEl.innerHTML = '下一个: <strong style="color: #ff6b6b;">#' + nextBox + '</strong>';
        else targetEl.innerHTML = '<strong style="color: #ff6b6b;">🎉 完成！</strong>';
    }
}

function updateDualStats() {
    var el = document.getElementById('sim-boxes-count'); if (el) el.textContent = simBoxes;
    el = document.getElementById('sim-stacks-count'); if (el) el.textContent = simStacks;
    el = document.getElementById('sim-buffers-count'); if (el) el.textContent = simBuffers;
    el = document.getElementById('sim-trucks-count'); if (el) el.textContent = simTrucks;
    
    var astarReloc = Math.max(0, astarHistory.length - simStep);
    el = document.getElementById('astar-progress'); if (el) el.textContent = simStep + '/' + simBoxes;
    el = document.getElementById('astar-relocations'); if (el) el.textContent = astarReloc + '次';
    el = document.getElementById('astar-rate'); if (el && simStep > 0) el.textContent = Math.round(astarReloc / simStep * 100) + '%';
    
    var greedyReloc = Math.max(0, greedyHistory.length - simStep);
    el = document.getElementById('greedy-progress'); if (el) el.textContent = simStep + '/' + simBoxes;
    el = document.getElementById('greedy-relocations'); if (el) el.textContent = greedyReloc + '次';
    el = document.getElementById('greedy-rate'); if (el && simStep > 0) el.textContent = Math.round(greedyReloc / simStep * 100) + '%';
    
    var saving = greedyReloc - astarReloc;
    var percent = greedyReloc > 0 ? Math.round(saving / greedyReloc * 100) : 0;
    el = document.getElementById('compare-saving'); if (el) el.textContent = saving + '次 (' + percent + '%)';
}

function renderDualChart() {
    var chartEl = document.getElementById('dual-compare-chart');
    if (!chartEl) return;
    if (compareChartData.length < 2) {
        chartEl.innerHTML = '<div style="color: #7a9aba; font-size: 13px; text-align: center; padding: 50px;">点击【▶️ 下一步】或【⏯️ 自动播放】开始对比，折线图将在此显示...</div>';
        return;
    }
    var maxVal = Math.max(compareChartData.reduce(function(m, d) { return Math.max(m, d.greedy); }, 0), compareChartData.reduce(function(m, d) { return Math.max(m, d.astar); }, 0), 10);
    var w = 800, h = 220, pad = 35;
    var astarPath = '', greedyPath = '';
    for (var i = 0; i < compareChartData.length; i++) {
        var x = pad + (i / (compareChartData.length - 1)) * (w - pad * 2);
        var ay = h - pad - (compareChartData[i].astar / maxVal) * (h - pad * 2);
        var gy = h - pad - (compareChartData[i].greedy / maxVal) * (h - pad * 2);
        astarPath += (i === 0 ? 'M' : 'L') + x + ',' + ay + ' ';
        greedyPath += (i === 0 ? 'M' : 'L') + x + ',' + gy + ' ';
    }
    chartEl.innerHTML = '<svg width="' + w + '" height="' + h + '" style="max-width: 100%; display: block; margin: 0 auto;">' +
        '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (h - pad) + '" stroke="rgba(122,154,186,0.2)" stroke-width="1"/>' +
        '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + (w - pad) + '" y2="' + (h - pad) + '" stroke="rgba(122,154,186,0.2)" stroke-width="1"/>' +
        '<text x="' + (pad - 8) + '" y="' + (pad + 4) + '" fill="#7a9aba" font-size="10" text-anchor="end">' + maxVal + '</text>' +
        '<text x="' + (pad - 8) + '" y="' + (h - pad + 4) + '" fill="#7a9aba" font-size="10" text-anchor="end">0</text>' +
        '<path d="' + greedyPath + '" fill="none" stroke="#ff6b6b" stroke-width="2.5"/>' +
        '<path d="' + astarPath + '" fill="none" stroke="#00ff88" stroke-width="2.5"/>' +
        '<rect x="' + (w - 110) + '" y="' + (pad + 10) + '" width="10" height="10" fill="#ff6b6b" rx="2"/>' +
        '<text x="' + (w - 95) + '" y="' + (pad + 18) + '" fill="#7a9aba" font-size="11">传统贪心</text>' +
        '<rect x="' + (w - 110) + '" y="' + (pad + 28) + '" width="10" height="10" fill="#00ff88" rx="2"/>' +
        '<text x="' + (w - 95) + '" y="' + (pad + 36) + '" fill="#7a9aba" font-size="11">A*智能优化</text>' +
        '<text x="' + (w / 2) + '" y="20" fill="#a0c4e8" font-size="13" font-weight="600" text-anchor="middle">📈 翻箱次数累计对比</text>' +
    '</svg>';
}

// ==================== 标签页3: 集卡路径优化 ====================
function renderRoutingAlgo(container) {
    var html = '' +
        '<div class="port-card">' +
            '<div class="card-header">' +
                '<span class="card-title">🚛 集卡路径优化 - A*路径规划 + 拍卖算法调度</span>' +
            '</div>' +
            '<div style="padding: 30px;">' +
                '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">' +
                    '<div style="padding: 20px; background: rgba(0,255,136,0.08); border-radius: 10px; text-align: center;">' +
                        '<div style="color: #7a9aba; font-size: 12px;">平均空驶率</div>' +
                        '<div style="color: #00ff88; font-size: 28px; font-weight: 700;">18.2%</div>' +
                        '<div style="color: #00ff88; font-size: 12px;">↓ 23% 优化</div>' +
                    '</div>' +
                    '<div style="padding: 20px; background: rgba(0,212,255,0.08); border-radius: 10px; text-align: center;">' +
                        '<div style="color: #7a9aba; font-size: 12px;">日均作业量</div>' +
                        '<div style="color: #00d4ff; font-size: 28px; font-weight: 700;">2100TEU</div>' +
                    '</div>' +
                    '<div style="padding: 20px; background: rgba(255,193,7,0.08); border-radius: 10px; text-align: center;">' +
                        '<div style="color: #7a9aba; font-size: 12px;">平均行驶距离</div>' +
                        '<div style="color: #ffc107; font-size: 28px; font-weight: 700;">2.3km</div>' +
                    '</div>' +
                    '<div style="padding: 20px; background: rgba(179,136,255,0.08); border-radius: 10px; text-align: center;">' +
                        '<div style="color: #7a9aba; font-size: 12px;">双层优化架构</div>' +
                        '<div style="color: #b388ff; font-size: 20px; font-weight: 700;">A* + 拍卖</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    container.innerHTML = html;
}


// ========== 向后兼容的函数 ==========
function simNextStep() {
    dualNextStep();
}

function renderSimulator() {
    renderDualSimulator();
}

function updateSimStats() {
    updateDualStats();
}


console.log('Yard module loaded successfully!');

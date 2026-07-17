// 船舶管理模块 - 6标签页全面深度完善
let shipMapChart = null;
let timingUpdateInterval = null;
let shipOverviewPieChart = null;
let shipOverviewBarChart = null;
let queueLineChart = null;
let queueDonutChart = null;
let inportBarChart = null;
let inportPieChart = null;
let timingBarChart = null;
let timingLineChart = null;
let billingPieChart = null;
let billingLineChart = null;
let archivePieChart = null;
let archiveBarChart = null;

// 全局筛选状态
let currentShipStatusFilter = 'all';
let currentInportFilter = 'all';

// ==================== 模拟数据增强 - 长江沿线船舶分布 ====================
// ==================== 🚢 船舶数据增强 - 从12艘增加到30艘，均匀分布长江水域 ====================
const shipPositions = [
    // ===== 南京附近 (约8艘) =====
    { name: '中远海运南京', type: '集装箱船', status: 'berthed', tonnage: 150000, lng: 118.6, lat: 32.3, berth: 'N01' },
    { name: '中海油运7号', type: '油轮', status: 'berthed', tonnage: 85000, lng: 118.7, lat: 32.25, berth: 'N02' },
    { name: '南京远洋1号', type: '集装箱船', status: 'berthed', tonnage: 65000, lng: 118.62, lat: 32.32, berth: 'N03' },
    { name: '南京远洋2号', type: '散货船', status: 'anchorage', tonnage: 82000, lng: 118.68, lat: 32.35 },
    { name: '长江之星', type: '集装箱船', status: 'arriving', tonnage: 58000, lng: 118.55, lat: 32.3 },
    { name: '金陵航运', type: '杂货船', status: 'sailing', tonnage: 45000, lng: 118.58, lat: 32.28 },
    { name: '长江油运1号', type: '油轮', status: 'berthed', tonnage: 78000, lng: 118.65, lat: 32.33, berth: 'N04' },
    { name: '南京港集运', type: '集装箱船', status: 'departing', tonnage: 52000, lng: 118.72, lat: 32.27 },

    // ===== 镇江附近 (约6艘) =====
    { name: '江苏散运1号', type: '散货船', status: 'berthed', tonnage: 180000, lng: 119.4, lat: 32.3, berth: 'Z01', dangerous: true, dangerClass: '3类' },
    { name: '扬子江航运', type: '集装箱船', status: 'anchorage', tonnage: 120000, lng: 119.6, lat: 32.25 },
    { name: '镇江物流1号', type: '散货船', status: 'berthed', tonnage: 75000, lng: 119.3, lat: 32.28, berth: 'Z02' },
    { name: '镇江物流2号', type: '油轮', status: 'anchorage', tonnage: 45000, lng: 119.38, lat: 32.32 },
    { name: '扬子江1号', type: '集装箱船', status: 'departing', tonnage: 68000, lng: 119.25, lat: 32.26 },
    { name: '金山航运', type: '杂货船', status: 'sailing', tonnage: 38000, lng: 119.35, lat: 32.22 },

    // ===== 苏州-南通附近 (约10艘) =====
    { name: '苏州远洋', type: '集装箱船', status: 'berthed', tonnage: 190000, lng: 120.4, lat: 31.8, berth: 'S01' },
    { name: '通州之星', type: '杂货船', status: 'sailing', tonnage: 65000, lng: 120.7, lat: 32.15 },
    { name: '达飞塔霍', type: '集装箱船', status: 'berthed', tonnage: 210000, lng: 120.5, lat: 31.75, berth: 'S06' },
    { name: '苏州远洋1号', type: '集装箱船', status: 'berthed', tonnage: 95000, lng: 120.35, lat: 32.08, berth: 'S02' },
    { name: '苏州远洋2号', type: '散货船', status: 'berthed', tonnage: 120000, lng: 120.42, lat: 32.1, berth: 'S03' },
    { name: '东方之星', type: '集装箱船', status: 'arriving', tonnage: 88000, lng: 120.28, lat: 32.02 },
    { name: '东方之珠', type: '油轮', status: 'anchorage', tonnage: 55000, lng: 120.32, lat: 32.05 },
    { name: '南通港航1号', type: '散货船', status: 'berthed', tonnage: 105000, lng: 120.7, lat: 32.18, berth: 'N05' },
    { name: '南通港航2号', type: '集装箱船', status: 'departing', tonnage: 72000, lng: 120.78, lat: 32.2 },
    { name: '江海联运1号', type: '散货船', status: 'anchorage', tonnage: 92000, lng: 120.65, lat: 32.12 },

    // ===== 上海-长江口附近 (约6艘) =====
    { name: '东方海外香港', type: '集装箱船', status: 'arriving', tonnage: 215000, lng: 121.4, lat: 31.5 },
    { name: '马士基汉堡', type: '集装箱船', status: 'berthed', tonnage: 190000, lng: 121.5, lat: 31.45, berth: 'S04' },
    { name: '新美洲', type: '集装箱船', status: 'anchorage', tonnage: 120000, lng: 121.7, lat: 31.4 },
    { name: '海洋石油201', type: '油轮', status: 'departing', tonnage: 85000, lng: 121.8, lat: 31.35 },
    { name: '中海之春', type: '散货船', status: 'berthed', tonnage: 180000, lng: 121.6, lat: 31.4, berth: 'S05', dangerous: true, dangerClass: '3类' },
    { name: '上海远洋1号', type: '集装箱船', status: 'berthed', tonnage: 150000, lng: 121.4, lat: 31.35, berth: 'S07' }
];

const shipAlerts = [
    { id: 1, time: '14:32:15', ship: '中海之春', type: 'critical', title: '超时作业', content: '作业时间已超出计划2小时', handled: false },
    { id: 2, time: '13:45:22', ship: '新美洲', type: 'warning', title: '超期锚泊', content: '锚地等待已超过12小时', handled: false },
    { id: 3, time: '11:55:33', ship: '东方海外香港', type: 'info', title: '即将到港', content: '预计2小时后抵达引航站', handled: false },
    { id: 4, time: '10:22:18', ship: '海洋石油201', type: 'warning', title: '风速超标', content: '实时风速达18米/秒，注意靠泊安全', handled: false },
    { id: 5, time: '09:15:44', ship: '马士基汉堡', type: 'info', title: '箱量预警', content: '剩余箱位不足10%', handled: true },
    { id: 6, time: '08:30:15', ship: '江苏散运1号', type: 'warning', title: '危险品作业', content: '3类危险品船正在作业，加强安全监控', handled: false }
];

const queueShips = [
    { id: 1, name: '东方海外香港', type: '集装箱船', tonnage: 215000, eta: '2024-05-12 18:00', berth: 'B03', waitTime: '2小时', priority: 'high' },
    { id: 2, name: '中远海运香港', type: '集装箱船', tonnage: 190000, eta: '2024-05-13 06:30', berth: 'B06', waitTime: '8小时', priority: 'medium' },
    { id: 3, name: '达飞马拉喀什', type: '集装箱船', tonnage: 150000, eta: '2024-05-13 14:00', berth: 'B02', waitTime: '12小时', priority: 'medium' },
    { id: 4, name: '中海之夏', type: '散货船', tonnage: 170000, eta: '2024-05-14 08:00', berth: 'B04', waitTime: '18小时', priority: 'low' },
    { id: 5, name: '长荣纽约', type: '集装箱船', tonnage: 205000, eta: '2024-05-15 10:30', berth: 'B01', waitTime: '36小时', priority: 'medium' }
];

const inportShipsEnhanced = [
    { name: '中远海运宁波', type: '集装箱船', berth: 'B01', totalBoxes: 4500, unloaded: 2100, loaded: 960, efficiency: 128, status: 'working', etaComplete: '16:30', dangerous: false },
    { name: '马士基汉堡', type: '集装箱船', berth: 'B02', totalBoxes: 3800, unloaded: 1200, loaded: 510, efficiency: 114, status: 'working', etaComplete: '22:00', dangerous: false },
    { name: '中海之春', type: '散货船', berth: 'B04', totalBoxes: 2500, unloaded: 875, loaded: 500, efficiency: 92, status: 'working', etaComplete: '次日08:00', dangerous: true, dangerClass: '3类' },
    { name: '新美洲', type: '集装箱船', berth: '锚地', totalBoxes: 3200, unloaded: 0, loaded: 0, efficiency: 0, status: 'waiting', etaComplete: '-', dangerous: false },
    { name: '达飞塔霍', type: '集装箱船', berth: 'B06', totalBoxes: 5200, unloaded: 2800, loaded: 1200, efficiency: 142, status: 'working', etaComplete: '20:30', dangerous: false },
    { name: '海洋之星', type: '杂货船', berth: 'B07', totalBoxes: 1800, unloaded: 900, loaded: 450, efficiency: 78, status: 'paused', etaComplete: '待定', dangerous: false }
];

const timingStages = [
    { id: 1, name: '引航登船', icon: '🧭', category: 'navigation' },
    { id: 2, name: '锚地起锚', icon: '⚓', category: 'navigation' },
    { id: 3, name: '进港航行', icon: '🚢', category: 'navigation' },
    { id: 4, name: '开始靠泊', icon: '📍', category: 'berthing' },
    { id: 5, name: '靠泊完成', icon: '✅', category: 'berthing' },
    { id: 6, name: '作业开始', icon: '🏗️', category: 'operation' },
    { id: 7, name: '作业完成', icon: '📦', category: 'operation' },
    { id: 8, name: '开始离泊', icon: '🚀', category: 'berthing' },
    { id: 9, name: '离港完成', icon: '👋', category: 'navigation' }
];

let currentTimingData = {
    ship: '东方海外香港',
    currentStage: 3,
    stageTimes: [
        { start: '06:00', end: '06:12', duration: 12, avg: 15 },
        { start: '06:15', end: '06:40', duration: 25, avg: 30 },
        { start: '06:45', end: null, duration: null, avg: 45 },
        { start: null, end: null, duration: null, avg: 20 },
        { start: null, end: null, duration: null, avg: 0 },
        { start: null, end: null, duration: null, avg: 10 },
        { start: null, end: null, duration: null, avg: 0 },
        { start: null, end: null, duration: null, avg: 15 },
        { start: null, end: null, duration: null, avg: 0 }
    ]
};

const billingShips = [
    {
        name: '中远海运宁波', totalBoxes: 4500, expanded: false,
        services: { tugboat: 30000, pilot: 20000, oil: 2250000, water: 6000, garbage: 3000, supplies: 12000 },
        demurrage: { time: -5.5, total: -4583 },
        energy: { fuel: 85, energyPerTeu: 1.15, avgEnergy: 1.2 }
    },
    {
        name: '马士基汉堡', totalBoxes: 3800, expanded: false,
        services: { tugboat: 28000, pilot: 18000, oil: 1800000, water: 5500, garbage: 2800, supplies: 10000 },
        demurrage: { time: 3.2, total: 3200 },
        energy: { fuel: 72, energyPerTeu: 1.28, avgEnergy: 1.2 }
    },
    {
        name: '达飞塔霍', totalBoxes: 5200, expanded: false,
        services: { tugboat: 32000, pilot: 22000, oil: 2600000, water: 7000, garbage: 3500, supplies: 15000 },
        demurrage: { time: -2.8, total: -2333 },
        energy: { fuel: 95, energyPerTeu: 1.08, avgEnergy: 1.2 }
    }
];

const shipArchives = [
    { name: '中远海运宁波', imo: '9484093', type: 'container', tonnage: 150000, length: 366, beam: 51, draft: 14.5,
      company: { name: '中远海运', visitCount: 45, rating: 5, priority: 'VIP', contact: '王经理', phone: '021-65966666' } },
    { name: '马士基汉堡', imo: '9348716', type: 'container', tonnage: 190000, length: 399, beam: 59, draft: 16.0,
      company: { name: '马士基', visitCount: 38, rating: 4, priority: 'A', contact: '李总监', phone: '021-23066666' } },
    { name: '达飞塔霍', imo: '9776442', type: 'container', tonnage: 210000, length: 400, beam: 61, draft: 16.5,
      company: { name: '达飞海运', visitCount: 32, rating: 4, priority: 'A', contact: '张经理', phone: '021-38666666' } },
    { name: '中海之春', imo: '9256881', type: 'bulk', tonnage: 180000, length: 292, beam: 45, draft: 18.2,
      company: { name: '中海集团', visitCount: 28, rating: 3, priority: 'B', contact: '刘经理', phone: '021-65988888' } },
    { name: '海洋石油201', imo: '9581234', type: 'tanker', tonnage: 85000, length: 248, beam: 42, draft: 15.0,
      company: { name: '中海油', visitCount: 15, rating: 4, priority: 'A', contact: '陈经理', phone: '021-58888888' } }
];

// ==================== 主入口函数 ====================
function renderShip(container) {
    container.innerHTML = `
        <div class="page-title">🚢 船舶管理系统</div>
        <div class="filter-bar">
            <div class="filter-group">
                <label>船舶类型</label>
                <select id="ship-type-filter">
                    <option value="all">全部类型</option>
                    <option value="container">集装箱船</option>
                    <option value="bulk">散货船</option>
                    <option value="tanker">油轮</option>
                </select>
            </div>
            <button class="port-btn port-btn-primary" onclick="refreshAllShipData()">🔄 刷新数据</button>
        </div>
        <div class="tab-container" style="flex-wrap: wrap;">
            <div class="tab-item active" data-tab="overview" onclick="switchShipTab('overview')">🚢 船舶总览</div>
            <div class="tab-item" data-tab="queue" onclick="switchShipTab('queue')">📋 到港排队</div>
            <div class="tab-item" data-tab="inport" onclick="switchShipTab('inport')">⚓ 在港船舶</div>
            <div class="tab-item" data-tab="timing" onclick="switchShipTab('timing')">⏱️ 作业计时</div>
            <div class="tab-item" data-tab="billing" onclick="switchShipTab('billing')">📝 服务与计费</div>
            <div class="tab-item" data-tab="archive" onclick="switchShipTab('archive')">📇 船舶档案</div>
        </div>
        <div id="ship-tab-content"></div>
    `;
    switchShipTab('overview');
}

function switchShipTab(tab) {
    if (timingUpdateInterval) { clearInterval(timingUpdateInterval); timingUpdateInterval = null; }
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) item.classList.add('active');
    });
    const content = document.getElementById('ship-tab-content');
    switch (tab) {
        case 'overview': renderShipOverview(content); break;
        case 'queue': renderShipQueue(content); break;
        case 'inport': renderInportShipsEnhanced(content); break;
        case 'timing': renderOperationTiming(content); break;
        case 'billing': renderServicesBilling(content); break;
        case 'archive': renderShipArchiveEnhanced(content); break;
    }
}

// ==================== 标签页1: 船舶总览深度完善 ====================
function renderShipOverview(container) {
    const berthedCount = shipPositions.filter(s => s.status === 'berthed').length;
    const anchorageCount = shipPositions.filter(s => s.status === 'anchorage').length;
    const sailingCount = shipPositions.filter(s => s.status === 'sailing' || s.status === 'arriving' || s.status === 'departing').length;
    const activeAlerts = shipAlerts.filter(a => !a.handled).length;
    const criticalAlerts = shipAlerts.filter(a => a.type === 'critical' && !a.handled).length;
    const warningAlerts = shipAlerts.filter(a => a.type === 'warning' && !a.handled).length;
    const infoAlerts = shipAlerts.filter(a => a.type === 'info' && !a.handled).length;

    container.innerHTML = `
        <!-- 统计卡片区域 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⚓</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${berthedCount}</div>
                        <div class="stat-label">在泊船舶</div>
                    </div>
                </div>
                <div class="stat-trend up">↑ 较昨日 +1</div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⛵</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${anchorageCount}</div>
                        <div class="stat-label">锚地等待</div>
                    </div>
                </div>
                <div class="stat-trend down">↓ 较昨日 -1</div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">🚢</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${sailingCount}</div>
                        <div class="stat-label">航行中</div>
                    </div>
                </div>
                <div class="stat-trend up">↑ 较昨日 +2</div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⚠️</div>
                    <div style="text-align: right;">
                        <div class="stat-value" style="color: #ff4757; -webkit-text-fill-color: #ff4757;">${activeAlerts}</div>
                        <div class="stat-label">活跃告警</div>
                    </div>
                </div>
                <div style="font-size: 11px; margin-top: 5px;">
                    <span style="color: #ff4757;">🔴 ${criticalAlerts}</span>
                    <span style="color: #ffa502; margin-left: 8px;">🟠 ${warningAlerts}</span>
                    <span style="color: #00d4ff; margin-left: 8px;">🟡 ${infoAlerts}</span>
                </div>
            </div>
        </div>

        <!-- 功能说明区域 -->
        <div style="margin-bottom: 20px; padding: 12px 15px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border-left: 3px solid #00d4ff;">
            <p style="font-size: 13px; color: #7a9aba; margin: 0;">
                📋 <span style="color: #a0c4e8;">实时监控港口所有船舶位置和状态，支持船名搜索定位，告警分级管理与处理</span>
            </p>
        </div>

        <!-- 地图区域 -->
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">🗺️ 长三角海域船舶实时位置</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="filter-group" style="margin-bottom: 0;">
                        <select id="ship-status-filter" onchange="filterShipsOnMap()" style="padding: 6px 10px; font-size: 12px;">
                            <option value="all">全部状态</option>
                            <option value="berthed">在泊</option>
                            <option value="anchorage">锚地</option>
                            <option value="arriving">进港</option>
                            <option value="departing">离港</option>
                            <option value="sailing">航行中</option>
                        </select>
                    </div>
                    <input type="text" id="ship-search" placeholder="搜索船舶名称..." style="width: 180px; padding: 6px 10px; font-size: 12px;" onkeyup="searchShipOnMap()">
                </div>
            </div>
            <div id="ship-map" style="width: 100%; height: 350px; border-radius: 8px;"></div>
            <!-- ========== 💡 优化3: 添加地图交互说明文字 ========== -->
            <div style="text-align: center; color: #888; font-size: 12px; margin-top: 10px; padding: 8px; background: rgba(0, 212, 255, 0.05); border-radius: 4px;">
                💡 鼠标悬停查看船舶详情 · 点击船舶查看信息 · 支持滚轮缩放和拖拽平移
            </div>
        </div>

        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 船舶状态分布</span>
                </div>
                <div id="ship-status-pie" style="width: 100%; height: 280px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 告警类型统计</span>
                    <button class="port-btn port-btn-secondary port-btn-sm" onclick="renderAlertBatchActions()">批量操作</button>
                </div>
                <div id="alert-type-bar" style="width: 100%; height: 280px;"></div>
            </div>
        </div>

        <!-- 告警列表 -->
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">🔔 船舶告警中心</span>
                <div id="alert-batch-actions" style="display: none; gap: 8px;">
                    <input type="checkbox" id="select-all-alerts" onchange="toggleSelectAllAlerts()">
                    <label for="select-all-alerts" style="font-size: 12px;">全选</label>
                    <button class="port-btn port-btn-primary port-btn-sm" onclick="batchHandleAlerts()">批量确认</button>
                </div>
            </div>
            <div id="alerts-container" style="max-height: 350px; overflow-y: auto;">${renderAlertsList()}</div>
        </div>
    `;

    setTimeout(() => {
        initShipMap();
        initShipOverviewCharts();
    }, 100);
}

function initShipOverviewCharts() {
    const statusCounts = {
        berthed: shipPositions.filter(s => s.status === 'berthed').length,
        anchorage: shipPositions.filter(s => s.status === 'anchorage').length,
        arriving: shipPositions.filter(s => s.status === 'arriving').length,
        departing: shipPositions.filter(s => s.status === 'departing').length,
        sailing: shipPositions.filter(s => s.status === 'sailing').length
    };

    const pieDom = document.getElementById('ship-status-pie');
    if (pieDom) {
        shipOverviewPieChart = echarts.init(pieDom);
        const pieOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', formatter: '{b}: {c}艘 ({d}%)' },
            legend: { bottom: '5%', left: 'center', textStyle: { color: '#7a9aba', fontSize: 11 } },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2 },
                label: { show: true, color: '#a0c4e8', fontSize: 11 },
                data: [
                    { value: statusCounts.berthed, name: '在泊', itemStyle: { color: '#00ff88' } },
                    { value: statusCounts.anchorage, name: '锚地', itemStyle: { color: '#00d4ff' } },
                    { value: statusCounts.arriving, name: '进港', itemStyle: { color: '#ffa502' } },
                    { value: statusCounts.departing, name: '离港', itemStyle: { color: '#ff7f50' } },
                    { value: statusCounts.sailing, name: '航行中', itemStyle: { color: '#9b59b6' } }
                ]
            }]
        };
        shipOverviewPieChart.setOption(pieOption);
    }

    const barDom = document.getElementById('alert-type-bar');
    if (barDom) {
        const criticalCount = shipAlerts.filter(a => a.type === 'critical').length;
        const warningCount = shipAlerts.filter(a => a.type === 'warning').length;
        const infoCount = shipAlerts.filter(a => a.type === 'info').length;
        
        shipOverviewBarChart = echarts.init(barDom);
        const barOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: ['严重告警', '警告', '提示'], axisLabel: { color: '#7a9aba', fontSize: 11 } },
            yAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            series: [{
                type: 'bar',
                barWidth: '50%',
                itemStyle: {
                    color: function(params) {
                        const colors = ['#ff4757', '#ffa502', '#00d4ff'];
                        return colors[params.dataIndex];
                    },
                    borderRadius: [4, 4, 0, 0]
                },
                data: [criticalCount, warningCount, infoCount]
            }]
        };
        shipOverviewBarChart.setOption(barOption);
    }
}

function renderAlertsList() {
    return shipAlerts.map(alert => {
        const typeIcon = alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟠' : '🟡';
        const opacity = alert.handled ? 'opacity: 0.5;' : '';
        return `
            <div class="alarm-item ${alert.type}" style="${opacity} display: flex; align-items: center;">
                <input type="checkbox" class="alert-checkbox" data-alert-id="${alert.id}" style="margin-right: 10px;" ${alert.handled ? 'disabled' : ''}>
                <span style="font-size: 20px;">${typeIcon}</span>
                <div class="alarm-content" style="flex: 1; cursor: pointer;" onclick="showAlertDetail(${alert.id})">
                    <div class="alarm-title">${alert.ship} - ${alert.title}</div>
                    <div style="font-size: 11px; color: #a0c4e8;">${alert.content}</div>
                    <div class="alarm-time">🕐 ${alert.time}</div>
                </div>
                ${!alert.handled ? `<button class="port-btn port-btn-secondary port-btn-sm" onclick="handleAlert(${alert.id})">确认处理</button>` : '<span style="font-size: 11px; color: #7a9aba;">已处理</span>'}
            </div>
        `;
    }).join('');
}

function filterShipsOnMap() {
    const filter = document.getElementById('ship-status-filter').value;
    currentShipStatusFilter = filter;
    if (!shipMapChart) return;
    
    // 🔧 修复2: 使用 lazyUpdate 避免数据更新时刷新 tooltip，适配多系列结构
    const statusMap = { berthed: '在泊', anchorage: '锚地', arriving: '进港中', departing: '离港中', sailing: '航行中' };
    
    shipMapChart.setOption({
        series: [
            ...Object.keys(statusMap).map(status => ({
                data: shipPositions.filter(s => s.status === status).map(ship => ({
                    ...ship,
                    value: [ship.lng, ship.lat, ship.tonnage],
                    itemStyle: {
                        opacity: filter === 'all' || ship.status === filter ? 1 : 0.2
                    }
                }))
            })),
            {} // 港口系列保持不变
        ]
    }, { notMerge: false, lazyUpdate: true, silent: true });
}

function searchShipOnMap() {
    const keyword = document.getElementById('ship-search').value.toLowerCase();
    if (!shipMapChart) return;
    
    // 🔧 修复: 只更新数据，不重建整个系列，保留tooltip和配置
    const statusMap = { berthed: '在泊', anchorage: '锚地', arriving: '进港中', departing: '离港中', sailing: '航行中' };
    
    // 为每个状态构建更新后的数据
    const updatedSeries = Object.keys(statusMap).map(status => ({
        data: shipPositions.filter(s => s.status === status).map(ship => ({
            ...ship,
            value: [ship.lng, ship.lat, ship.tonnage],
            itemStyle: {
                opacity: !keyword || ship.name.toLowerCase().includes(keyword) ? 1 : 0.2,
                shadowBlur: keyword && ship.name.toLowerCase().includes(keyword) ? 30 : 0,
                shadowColor: '#00ff88'
            }
        }))
    }));
    
    // 添加港口系列（保持数据不变）
    updatedSeries.push({});
    
    shipMapChart.setOption({
        series: updatedSeries
    }, { notMerge: false, lazyUpdate: true, silent: true });
}

function handleAlert(alertId) {
    const alert = shipAlerts.find(a => a.id === alertId);
    if (alert) {
        alert.handled = true;
        document.getElementById('alerts-container').innerHTML = renderAlertsList();
        showToast(`已确认处理: ${alert.ship}`, 'success');
        initShipOverviewCharts();
    }
}

function showAlertDetail(alertId) {
    const alert = shipAlerts.find(a => a.id === alertId);
    if (!alert) return;
    const typeText = alert.type === 'critical' ? '严重告警' : alert.type === 'warning' ? '警告' : '提示';
    const typeColor = alert.type === 'critical' ? '#ff4757' : alert.type === 'warning' ? '#ffa502' : '#00d4ff';
    
    showModal('告警详情', `
        <div style="padding: 10px 0;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <span style="font-size: 24px;">${alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟠' : '🟡'}</span>
                <div>
                    <h4 style="color: ${typeColor}; margin-bottom: 5px;">${alert.ship} - ${alert.title}</h4>
                    <p style="font-size: 12px; color: #7a9aba;">🕐 ${alert.time} | 状态: ${alert.handled ? '已处理' : '<span style=color:#ff4757>待处理</span>'}</p>
                </div>
            </div>
            <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 8px;">
                <p style="font-size: 14px; color: #a0c4e8; margin-bottom: 15px;">${alert.content}</p>
                <div style="font-size: 12px; color: #7a9aba;">
                    <p>📋 建议措施：</p>
                    <ul style="margin-top: 8px; padding-left: 20px; line-height: 1.8;">
                        <li>立即通知相关船方和调度</li>
                        <li>评估对港口作业的影响</li>
                        <li>启动相应应急预案</li>
                        <li>跟踪处理进度并记录</li>
                    </ul>
                </div>
            </div>
        </div>
    `);
}

function renderAlertBatchActions() {
    const actionsEl = document.getElementById('alert-batch-actions');
    if (actionsEl) {
        actionsEl.style.display = actionsEl.style.display === 'none' ? 'flex' : 'none';
    }
}

function toggleSelectAllAlerts() {
    const checked = document.getElementById('select-all-alerts').
checked;
    document.querySelectorAll('.alert-checkbox:not([disabled])').forEach(cb => cb.checked = checked);
}

function batchHandleAlerts() {
    let handledCount = 0;
    document.querySelectorAll('.alert-checkbox:checked:not([disabled])').forEach(cb => {
        const alertId = parseInt(cb.dataset.alertId);
        const alert = shipAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.handled = true;
            handledCount++;
        }
    });
    if (handledCount > 0) {
        document.getElementById('alerts-container').innerHTML = renderAlertsList();
        showToast(`已批量确认 ${handledCount} 条告警`, 'success');
        initShipOverviewCharts();
    } else {
        showToast('请先选择要处理的告警', 'info');
    }
}

function initShipMap() {
    const chartDom = document.getElementById('ship-map');
    if (!chartDom) return;
    shipMapChart = echarts.init(chartDom);
    const statusColors = { berthed: '#00ff88', anchorage: '#00d4ff', arriving: '#ffa502', departing: '#ff7f50', sailing: '#9b59b6' };
    
    // ========== 🔧 修复3: 长江流域真实地图形状 - 从南京到长江口 ==========
    const yangtzeGeoJSON = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { name: '长江水域' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        // 北岸线（从南京向东到出海口，大幅向北扩展）
                        [118.2, 32.5],  // 南京西 - 大幅扩大
                        [118.5, 32.5],  // 南京
                        [119.0, 32.6],  // 扬州
                        [119.5, 32.7],  // 泰州
                        [120.0, 32.6],  // 南通西
                        [120.5, 32.5],  // 南通
                        [121.0, 32.3],  // 常熟
                        [121.3, 32.0],  // 太仓
                        [121.5, 31.8],  // 上海北
                        [121.8, 31.6],  // 崇明
                        [122.2, 31.4],  // 出海口北
                        // ===== 南岸线（从出海口向西返回南京，向南扩展）=====
                        [122.2, 30.8],  // 出海口南
                        [121.8, 31.0],  // 上海南
                        [121.5, 31.1],  // 上海
                        [121.0, 31.2],  // 嘉兴
                        [120.5, 31.3],  // 苏州南
                        [120.0, 31.4],  // 无锡南
                        [119.5, 31.5],  // 常州南
                        [119.0, 31.7],  // 镇江南
                        [118.5, 31.9],  // 南京南
                        [118.2, 32.2],  // 南京西南
                        [118.2, 32.5]   // 回到起点
                    ]]
                }
            },
            // ===== 🔧 修复2: GeoJSON港口位置修正 - 彻底移到水域最边缘 =====
            // 北岸港口移到最北边，上海港移到最南边，让用户一眼看出在岸边
            // 这些坐标仅用于GeoJSON标记，地图显示使用series中的港口坐标
            {
                type: 'Feature',
                properties: { name: '南京港' },
                geometry: { type: 'Point', coordinates: [118.65, 32.45] }
            },
            {
                type: 'Feature',
                properties: { name: '镇江港' },
                geometry: { type: 'Point', coordinates: [119.35, 32.55] }
            },
            {
                type: 'Feature',
                properties: { name: '苏州港' },
                geometry: { type: 'Point', coordinates: [120.40, 32.15] }
            },
            {
                type: 'Feature',
                properties: { name: '南通港' },
                geometry: { type: 'Point', coordinates: [120.75, 32.25] }
            },
            {
                type: 'Feature',
                properties: { name: '上海港' },
                geometry: { type: 'Point', coordinates: [121.45, 31.25] }
            }
        ]
    };
    
    echarts.registerMap('yangtze', yangtzeGeoJSON);
    
    const option = {
        backgroundColor: 'rgba(10, 30, 55, 0.9)',
        // ========== 🔧 修复2: 稳定 tooltip - 避免数据更新时刷新 ==========
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(20, 25, 35, 0.98)',
            borderColor: '#00d4ff',
            borderWidth: 1,
            textStyle: {
                color: '#fff',
                fontSize: 13
            },
            extraCssText: 'border-radius: 6px; box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3); padding: 12px; z-index: 9999;',
            transitionDuration: 0,
            hideDelay: 100,
            alwaysShowContent: false,
            position: function(point, params, dom, rect, size) {
                const [mouseX, mouseY] = point;
                const [tooltipWidth, tooltipHeight] = size.contentSize;
                const [viewWidth, viewHeight] = size.viewSize;
                
                let x = mouseX + 15;
                let y = mouseY - 15;
                
                if (x + tooltipWidth > viewWidth - 10) {
                    x = mouseX - tooltipWidth - 15;
                }
                if (y + tooltipHeight > viewHeight - 10) {
                    y = mouseY - tooltipHeight - 15;
                }
                if (x < 10) x = 10;
                if (y < 10) y = 10;
                
                return [x, y];
            },
            formatter: function(params) {
                if (!params) return '';
                
                // ===== 🔧 修复1: 区分港口和船舶系列 - 仅使用 seriesName 判断，避免船名含"港"时误判 =====
                const seriesName = params.seriesName || '';
                const dataName = params.data && params.data.name ? params.data.name : params.name;
                const isPort = seriesName === '主要港口';
                
                if (isPort) {
                    // ===== 港口专用 tooltip =====
                    const portCoordinates = params.data && params.data.value ? params.data.value : [0, 0];
                    
                    // 港口信息数据库
                    const portInfo = {
                        '南京港': { type: '综合性港口', throughput: '2.6亿', berths: 256, maxDwt: 100000 },
                        '镇江港': { type: '内河港口', throughput: '1.1亿', berths: 156, maxDwt: 50000 },
                        '苏州港': { type: '江海联运港', throughput: '5.2亿', berths: 312, maxDwt: 150000 },
                        '南通港': { type: '江海联运港', throughput: '2.3亿', berths: 188, maxDwt: 120000 },
                        '上海港': { type: '国际航运中心', throughput: '7.7亿', berths: 586, maxDwt: 300000 }
                    };
                    
                    const info = portInfo[dataName] || { type: '港口', throughput: '未知', berths: 0, maxDwt: 0 };
                    
                    return `
<div style="padding: 4px; min-width: 220px;">
    <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff6b6b; border-bottom: 1px solid rgba(255,107,107,0.3); padding-bottom: 5px;">
        ⚓ ${dataName}
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">港口类型：</span><span style="color: #00ff88;">${info.type}</span>
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">年吞吐量：</span><span style="color: #00d4ff; font-weight: bold;">${info.throughput} 吨</span>
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">泊位数量：</span><span style="color: #ffa502;">${info.berths} 个</span>
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">最大靠泊能力：</span><span style="color: #9b59b6;">${(info.maxDwt / 10000).toFixed(0)} 万吨级</span>
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">坐标：</span>${portCoordinates[0].toFixed(4)}°E, ${portCoordinates[1].toFixed(4)}°N
    </div>
    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,107,107,0.3); font-size: 11px; color: #888;">
        💡 点击查看港口详细信息和实时作业数据
    </div>
</div>`;
                } else {
                    // ===== 船舶专用 tooltip =====
                    const ship = params.data;
                    if (!ship) return '';
                    
                    const statusText = { berthed: '在泊', anchorage: '锚地', arriving: '进港中', departing: '离港中', sailing: '航行中' };
                    const speed = ship.speed || (Math.random() * 15 + 5).toFixed(1);
                    const course = ship.course || Math.floor(Math.random() * 360);
                    
                    return `
<div style="padding: 4px; min-width: 200px;">
    <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #00d4ff; border-bottom: 1px solid rgba(0,212,255,0.3); padding-bottom: 5px;">
        🚢 ${ship.name}
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">船型：</span>${ship.type}
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">载重吨：</span><span style="color: #00ff88; font-weight: bold;">${ship.tonnage.toLocaleString()} DWT</span>
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">当前状态：</span>
        <span style="color: ${statusColors[ship.status]}; font-weight: bold;">
            ${statusText[ship.status]}
        </span>
    </div>
    ${ship.berth ? `<div style="margin-bottom: 4px; line-height: 1.6;"><span style="color: #aaa;">泊位：</span>${ship.berth}</div>` : ''}
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">航速：</span>${speed} 节
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">航向：</span>${course}°
    </div>
    <div style="margin-bottom: 4px; line-height: 1.6;">
        <span style="color: #aaa;">位置：</span>${ship.lng.toFixed(4)}, ${ship.lat.toFixed(4)}
    </div>
    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(0,212,255,0.3); font-size: 11px; color: #888;">
        💡 点击查看船舶详细信息和历史轨迹
    </div>
</div>`;
                }
            }
        },
        // ========== 🔧 修复1: 图例正确显示 - 添加 itemStyle 颜色 ==========
        legend: {
            show: true,
            top: 20,
            right: 20,
            orient: 'vertical',
            selectedMode: 'multiple',
            backgroundColor: 'rgba(20, 30, 50, 0.85)',
            borderColor: '#00d4ff',
            borderWidth: 1,
            borderRadius: 6,
            padding: [12, 16],
            itemWidth: 12,
            itemHeight: 12,
            itemGap: 10,
            textStyle: {
                color: '#fff',
                fontSize: 12
            },
            data: [
                { name: '主要港口', icon: 'circle', textStyle: { color: '#ff6b6b' }, itemStyle: { color: '#ff6b6b' } },
                { name: '港口作业区', icon: 'circle', textStyle: { color: '#ff6b6b' }, itemStyle: { color: '#ff6b6b' } },
                { name: '锚地区域', icon: 'circle', textStyle: { color: '#ffc107' }, itemStyle: { color: '#ffc107' } },
                { name: '主航道航线', icon: 'line', textStyle: { color: '#00ff88' }, itemStyle: { color: '#00ff88' } },
                { name: '在泊', icon: 'circle', textStyle: { color: '#00ff88' }, itemStyle: { color: '#00ff88' } },
                { name: '锚地', icon: 'circle', textStyle: { color: '#00d4ff' }, itemStyle: { color: '#00d4ff' } },
                { name: '进港中', icon: 'circle', textStyle: { color: '#ffa502' }, itemStyle: { color: '#ffa502' } },
                { name: '离港中', icon: 'circle', textStyle: { color: '#ff7f50' }, itemStyle: { color: '#ff7f50' } },
                { name: '航行中', icon: 'circle', textStyle: { color: '#9b59b6' }, itemStyle: { color: '#9b59b6' } }
            ],
            selected: {
                '主要港口': true,
                '港口作业区': true,
                '锚地区域': true,
                '主航道航线': true,
                '在泊': true,
                '锚地': true,
                '进港中': true,
                '离港中': true,
                '航行中': true
            }
        },
        // ========== 🎨 优化1: 长江地图样式 ==========
        geo: {
            map: 'yangtze',
            roam: true,
            zoom: 5.2,   // 从3.8调整到5.2，放大显示更清晰
            center: [120.2, 31.8],  // 稍微调整中心位置
            scaleLimit: {
                min: 0.5,   // 最小缩放级别
                max: 30     // 最大缩放级别
            },
            label: { show: false },
            itemStyle: {
                areaColor: 'rgba(0, 150, 200, 0.25)',
                borderColor: '#00d4ff',
                borderWidth: 2
            },
            emphasis: {
                itemStyle: {
                    areaColor: 'rgba(0, 150, 200, 0.4)',
                    borderColor: '#00ff88',
                    borderWidth: 3
                },
                label: {
                    show: true,
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 'bold'
                }
            }
        },
        series: [
            // ========== 🔧 zlevel 层级设置: 主航道航线(zlevel:1) -> 锚地区域(zlevel:2) -> 港口作业区(zlevel:3) -> 主要港口(zlevel:4) -> 船舶(zlevel:5)
            // ========== 1. 主航道航线系列（动态效果） - zlevel: 1 ==========
            {
                name: '主航道航线',
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 1,
                effect: {
                    show: true,
                    period: 6,
                    trailLength: 0.7,
                    color: '#00ff88',
                    symbolSize: 4
                },
                lineStyle: {
                    color: '#00ff88',
                    width: 2,
                    opacity: 0.6,
                    curveness: 0.1
                },
                data: [
                    {
                        coords: [
                            [118.65, 32.45],  // 南京
                            [119.35, 32.55],  // 镇江
                            [119.85, 32.25],  // 泰州
                            [120.40, 32.15],  // 苏州
                            [120.75, 32.25],  // 南通
                            [121.45, 31.25]   // 上海
                        ]
                    }
                ],
                tooltip: {
                    formatter: function(params) {
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#00ff88;margin-bottom:8px;">🛤️ ${params.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">航线长度：</span>约 300 公里</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">通航能力：</span>10 万吨级</div>
                            <div style="font-size:13px;"><span style="color:#aaa;">日通行船舶：</span>约 150 艘</div>
                        </div>`;
                    }
                }
            },
            // ========== 2. 锚地区域系列 - zlevel: 2 ==========
            {
                name: '锚地区域',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                symbol: 'circle',
                symbolSize: 40,
                itemStyle: {
                    color: 'rgba(255, 193, 7, 0.2)',
                    borderColor: '#ffc107',
                    borderWidth: 2,
                    borderType: 'dashed'
                },
                data: [
                    { name: '南京锚地', value: [118.5, 32.35] },
                    { name: '镇江锚地', value: [119.25, 32.45] },
                    { name: '南通锚地', value: [120.65, 32.15] },
                    { name: '长江口锚地', value: [121.65, 31.15] }
                ],
                tooltip: {
                    formatter: function(params) {
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#ffc107;margin-bottom:8px;">⛵ ${params.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">锚地类型：</span>候泊锚地</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">可容纳船舶：</span>50 艘</div>
                            <div style="font-size:13px;"><span style="color:#aaa;">当前停泊：</span>12 艘</div>
                        </div>`;
                    }
                }
            },
            // ========== 3. 港口作业区系列 - zlevel: 3 ==========
            {
                name: '港口作业区',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 3,
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 6,
                    period: 4
                },
                symbolSize: 50,
                itemStyle: {
                    color: 'rgba(255, 107, 107, 0.25)',
                    borderColor: '#ff6b6b',
                    borderWidth: 2
                },
                data: [
                    { name: '南京港作业区', value: [118.65, 32.45] },
                    { name: '镇江港作业区', value: [119.35, 32.55] },
                    { name: '苏州港作业区', value: [120.40, 32.15] },
                    { name: '南通港作业区', value: [120.75, 32.25] },
                    { name: '上海港作业区', value: [121.45, 31.25] },
                    { name: '江阴港作业区', value: [120.25, 31.95] },
                    { name: '泰州港作业区', value: [119.85, 32.25] },
                    { name: '张家港作业区', value: [120.55, 31.98] }
                ],
                tooltip: {
                    formatter: function(params) {
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#ff6b6b;margin-bottom:8px;">📍 ${params.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">作业类型：</span>集装箱 / 散货</div>
                            <div style="font-size:13px;"><span style="color:#aaa;">作业区面积：</span>2.5 平方公里</div>
                        </div>`;
                    }
                }
            },
            // ========== 4. 主要港口系列 - zlevel: 4 ==========
            {
                name: '主要港口',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 4,
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 2.5,
                    period: 4
                },
                itemStyle: {
                    color: '#ff6b6b',
                    shadowBlur: 15,
                    shadowColor: 'rgba(255, 107, 107, 0.6)'
                },
                symbolSize: 18,
                label: {
                    show: true,
                    formatter: '{b}',
                    position: 'right',
                    fontSize: 12,
                    color: '#ff6b6b',
                    fontWeight: 'bold',
                    textBorderColor: '#000',
                    textBorderWidth: 1
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        const portInfo = {
                            '南京港': { type: '综合性港口', throughput: '2.6亿', berths: 256, maxDwt: 100000 },
                            '镇江港': { type: '内河港口', throughput: '1.1亿', berths: 156, maxDwt: 50000 },
                            '苏州港': { type: '江海联运港', throughput: '5.2亿', berths: 312, maxDwt: 150000 },
                            '南通港': { type: '江海联运港', throughput: '2.3亿', berths: 188, maxDwt: 120000 },
                            '上海港': { type: '国际航运中心', throughput: '7.7亿', berths: 586, maxDwt: 300000 }
                        };
                        const info = portInfo[params.name] || { type: '港口', throughput: '未知', berths: 0, maxDwt: 0 };
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#ff6b6b;margin-bottom:8px;">⚓ ${params.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">港口类型：</span>${info.type}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">年吞吐量：</span>${info.throughput} 吨</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">泊位数量：</span>${info.berths} 个</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">最大靠泊能力：</span>${(info.maxDwt / 10000).toFixed(0)} 万吨级</div>
                            <div style="font-size:13px;"><span style="color:#aaa;">坐标：</span>${params.value[0].toFixed(2)}°E, ${params.value[1].toFixed(2)}°N</div>
                        </div>`;
                    }
                },
                data: [
                    { name: '南京港', value: [118.65, 32.45] },
                    { name: '镇江港', value: [119.35, 32.55] },
                    { name: '苏州港', value: [120.40, 32.15] },
                    { name: '南通港', value: [120.75, 32.25] },
                    { name: '上海港', value: [121.45, 31.25] }
                ]
            },
            // ========== 🔧 修复1: 按状态分离船舶系列，与图例精确匹配 - zlevel: 5 ==========
            {
                name: '在泊',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 5,
                data: shipPositions.filter(s => s.status === 'berthed').map(ship => ({ 
                    ...ship,
                    value: [ship.lng, ship.lat, ship.tonnage]
                })),
                itemStyle: { color: '#00ff88' },
                symbolSize: function(val) { return Math.max(10, Math.min(25, val[2] / 15000)); },
                label: { 
                    show: true, 
                    formatter: p => p.data.name.slice(0, 4), 
                    position: 'right', 
                    fontSize: 10, 
                    color: '#fff' 
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        const ship = params.data;
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#00ff88;margin-bottom:8px;">🚢 ${ship.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">船型：</span>${ship.type}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">载重吨：</span>${ship.tonnage.toLocaleString()} DWT</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">当前状态：</span><span style="color:#00ff88;font-weight:bold;">在泊</span></div>
                            ${ship.berth ? `<div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">泊位：</span>${ship.berth}</div>` : ''}
                            <div style="font-size:13px;"><span style="color:#aaa;">坐标：</span>${ship.lng.toFixed(2)}°E, ${ship.lat.toFixed(2)}°N</div>
                        </div>`;
                    }
                },
                emphasis: {
                    scale: 1.5,
                    itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 15, shadowColor: 'rgba(0, 255, 136, 0.8)' },
                    label: { show: true, fontSize: 12, fontWeight: 'bold' }
                }
            },
            {
                name: '锚地',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 5,
                data: shipPositions.filter(s => s.status === 'anchorage').map(ship => ({ 
                    ...ship,
                    value: [ship.lng, ship.lat, ship.tonnage]
                })),
                itemStyle: { color: '#00d4ff' },
                symbolSize: function(val) { return Math.max(10, Math.min(25, val[2] / 15000)); },
                label: { 
                    show: true, 
                    formatter: p => p.data.name.slice(0, 4), 
                    position: 'right', 
                    fontSize: 10, 
                    color: '#fff' 
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        const ship = params.data;
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#00d4ff;margin-bottom:8px;">🚢 ${ship.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">船型：</span>${ship.type}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">载重吨：</span>${ship.tonnage.toLocaleString()} DWT</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">当前状态：</span><span style="color:#00d4ff;font-weight:bold;">锚地等待</span></div>
                            <div style="font-size:13px;"><span style="color:#aaa;">坐标：</span>${ship.lng.toFixed(2)}°E, ${ship.lat.toFixed(2)}°N</div>
                        </div>`;
                    }
                },
                emphasis: {
                    scale: 1.5,
                    itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 15, shadowColor: 'rgba(0, 212, 255, 0.8)' },
                    label: { show: true, fontSize: 12, fontWeight: 'bold' }
                }
            },
            {
                name: '进港中',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 5,
                data: shipPositions.filter(s => s.status === 'arriving').map(ship => ({ 
                    ...ship,
                    value: [ship.lng, ship.lat, ship.tonnage]
                })),
                itemStyle: { color: '#ffa502' },
                symbolSize: function(val) { return Math.max(10, Math.min(25, val[2] / 15000)); },
                label: { 
                    show: true, 
                    formatter: p => p.data.name.slice(0, 4), 
                    position: 'right', 
                    fontSize: 10, 
                    color: '#fff' 
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        const ship = params.data;
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#ffa502;margin-bottom:8px;">🚢 ${ship.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">船型：</span>${ship.type}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">载重吨：</span>${ship.tonnage.toLocaleString()} DWT</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">当前状态：</span><span style="color:#ffa502;font-weight:bold;">进港中</span></div>
                            <div style="font-size:13px;"><span style="color:#aaa;">坐标：</span>${ship.lng.toFixed(2)}°E, ${ship.lat.toFixed(2)}°N</div>
                        </div>`;
                    }
                },
                emphasis: {
                    scale: 1.5,
                    itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 15, shadowColor: 'rgba(255, 165, 2, 0.8)' },
                    label: { show: true, fontSize: 12, fontWeight: 'bold' }
                }
            },
            {
                name: '离港中',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 5,
                data: shipPositions.filter(s => s.status === 'departing').map(ship => ({ 
                    ...ship,
                    value: [ship.lng, ship.lat, ship.tonnage]
                })),
                itemStyle: { color: '#ff7f50' },
                symbolSize: function(val) { return Math.max(10, Math.min(25, val[2] / 15000)); },
                label: { 
                    show: true, 
                    formatter: p => p.data.name.slice(0, 4), 
                    position: 'right', 
                    fontSize: 10, 
                    color: '#fff' 
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        const ship = params.data;
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#ff7f50;margin-bottom:8px;">🚢 ${ship.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">船型：</span>${ship.type}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">载重吨：</span>${ship.tonnage.toLocaleString()} DWT</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">当前状态：</span><span style="color:#ff7f50;font-weight:bold;">离港中</span></div>
                            <div style="font-size:13px;"><span style="color:#aaa;">坐标：</span>${ship.lng.toFixed(2)}°E, ${ship.lat.toFixed(2)}°N</div>
                        </div>`;
                    }
                },
                emphasis: {
                    scale: 1.5,
                    itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 15, shadowColor: 'rgba(255, 127, 80, 0.8)' },
                    label: { show: true, fontSize: 12, fontWeight: 'bold' }
                }
            },
            {
                name: '航行中',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 5,
                data: shipPositions.filter(s => s.status === 'sailing').map(ship => ({ 
                    ...ship,
                    value: [ship.lng, ship.lat, ship.tonnage]
                })),
                itemStyle: { color: '#9b59b6' },
                symbolSize: function(val) { return Math.max(10, Math.min(25, val[2] / 15000)); },
                label: { 
                    show: true, 
                    formatter: p => p.data.name.slice(0, 4), 
                    position: 'right', 
                    fontSize: 10, 
                    color: '#fff' 
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        const ship = params.data;
                        return `<div style="padding:10px;">
                            <div style="font-size:16px;font-weight:bold;color:#9b59b6;margin-bottom:8px;">🚢 ${ship.name}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">船型：</span>${ship.type}</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">载重吨：</span>${ship.tonnage.toLocaleString()} DWT</div>
                            <div style="font-size:13px;margin-bottom:4px;"><span style="color:#aaa;">当前状态：</span><span style="color:#9b59b6;font-weight:bold;">航行中</span></div>
                            <div style="font-size:13px;"><span style="color:#aaa;">坐标：</span>${ship.lng.toFixed(2)}°E, ${ship.lat.toFixed(2)}°N</div>
                        </div>`;
                    }
                },
                emphasis: {
                    scale: 1.5,
                    itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 15, shadowColor: 'rgba(155, 89, 182, 0.8)' },
                    label: { show: true, fontSize: 12, fontWeight: 'bold' }
                }
            }
        ],
        // ========== 💡 交互说明文字 ==========
        graphic: [
            {
                type: 'text',
                left: 'center',
                bottom: 10,
                style: {
                    text: '💡 鼠标悬停查看船舶详情，支持滚轮缩放和拖拽平移',
                    fill: '#888',
                    fontSize: 12,
                    fontWeight: 'normal'
                }
            }
        ]
    };
    shipMapChart.setOption(option);
    window.addEventListener('resize', () => shipMapChart && shipMapChart.resize());
}

// ==================== 标签页2: 到港排队深度完善 ====================
function renderShipQueue(container) {
    const totalQueue = queueShips.length;
    const todayArrival = queueShips.filter(s => s.eta.includes('2024-05-12')).length;
    const avgWaitTime = '15小时30分';
    const berthUtilization = 85;

    container.innerHTML = `
        <!-- 统计卡片区域 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">📋</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${totalQueue}</div>
                        <div class="stat-label">排队船舶</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">📅</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${todayArrival}</div>
                        <div class="stat-label">今日到港</div>
                    </div>
                </div>
                <div class="stat-trend up">已到 1 / 未到 ${todayArrival}</div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⏱️</div>
                    <div style="text-align: right;">
                        <div class="stat-value" style="font-size: 24px;">${avgWaitTime}</div>
                        <div class="stat-label">平均等待</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">📊</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${berthUtilization}%</div>
                        <div class="stat-label">泊位利用率</div>
                    </div>
                </div>
                <div style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                    <div style="width: ${berthUtilization}%; height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 3px;"></div>
                </div>
            </div>
        </div>

        <!-- 功能说明区域 -->
        <div style="margin-bottom: 20px; padding: 12px 15px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border-left: 3px solid #00d4ff;">
            <p style="font-size: 13px; color: #7a9aba; margin: 0;">
                📋 <span style="color: #a0c4e8;">智能船舶排队管理系统，支持手动拖拽调整顺序，自动检测泊位时间冲突，优化港口调度效率</span>
            </p>
        </div>

        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 未来7天到港趋势</span>
                </div>
                <div id="queue-trend-line" style="width: 100%; height: 280px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 优先级分布</span>
                </div>
                <div id="queue-priority-donut" style="width: 100%; height: 280px;"></div>
            </div>
        </div>

        <!-- 排队列表 -->
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📊 到港排队列表</span>
                <div style="display: flex; gap: 10px;">
                    <div class="filter-group" style="margin-bottom: 0;">
                        <select id="berth-filter" onchange="filterQueueByBerth()" style="padding: 6px 10px; font-size: 12px;">
                            <option value="all">全部泊位</option>
                            <option value="B01">B01</option>
                            <option value="B02">B02</option>
                            <option value="B03">B03</option>
                            <option value="B04">B04</option>
                            <option value="B06">B06</option>
                        </select>
                    </div>
                    <button class="port-btn port-btn-primary port-btn-sm" onclick="autoSchedule()">🤖 自动排程</button>
                    <button class="port-btn port-btn-secondary port-btn-sm" onclick="saveSchedule()">💾 保存计划</button>
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table class="data-table" id="queue-table">
                    <thead>
                        <tr><th style="width:40px;">排序</th><th>船名</th><th>类型</th><th>载重吨</th><th>预计到港</th><th>泊位</th><th>等待时长</th><th>优先级</th><th>操作</th></tr>
                    </thead>
                    <tbody>${renderQueueRows()}</tbody>
                </table>
            </div>
            <div style="margin-top:12px;font-size:11px;color:#7a9aba;">💡 提示：拖拽首列可手动调整排队顺序，右键可调整优先级</div>
        </div>
    `;

    setTimeout(() => initQueueCharts(), 100);
}

function initQueueCharts() {
    const lineDom = document.getElementById('queue-trend-line');
    if (lineDom) {
        queueLineChart = echarts.init(lineDom);
        const lineOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: ['5/12', '5/13', '5/14', '5/15', '5/16', '5/17', '5/18'], axisLabel: { color: '#7a9aba', fontSize: 11 } },
            yAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            series: [{
                type: 'line',
                smooth: true,
                data: [1, 2, 1, 1, 2, 1, 1],
                lineStyle: { color: '#00d4ff', width: 3 },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0, 212, 255, 0.3)' }, { offset: 1, color: 'rgba(0, 212, 255, 0.05)' }]) },
                itemStyle: { color: '#00d4ff' },
                symbol: 'circle',
                symbolSize: 8
            }]
        };
        queueLineChart.setOption(lineOption);
    }

    const donutDom = document.getElementById('queue-priority-donut');
    if (donutDom) {
        const highCount = queueShips.filter(s => s.priority === 'high').length;
        const mediumCount = queueShips.filter(s => s.priority === 'medium').length;
        const lowCount = queueShips.filter(s => s.priority === 'low').length;
        
        queueDonutChart = echarts.init(donutDom);
        const donutOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', formatter: '{b}: {c}艘 ({d}%)' },
            legend: { bottom: '5%', left: 'center', textStyle: { color: '#7a9aba', fontSize: 11 } },
            series: [{
                type: 'pie',
                radius: ['50%', '75%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2 },
                label: { show: true, position: 'center', formatter: function(params) { return params.dataIndex === 0 ? `总计\n${queueShips.length}艘` : ''; }, fontSize: 14, fontWeight: 'bold', color: '#00ff88' },
                emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
                data: [
                    { value: highCount, name: '高优先级', itemStyle: { color: '#ff4757' } },
                    { value: mediumCount, name: '中优先级', itemStyle: { color: '#ffa502' } },
                    { value: lowCount, name: '低优先级', itemStyle: { color: '#7a9aba' } }
                ]
            }]
        };
        queueDonutChart.setOption(donutOption);
    }
}

function renderQueueRows() {
    const priorityColors = { high: '#ff4757', medium: '#ffa502', low: '#7a9aba' };
    const priorityText = { high: '高', medium: '中', low: '低' };
    return queueShips.map((ship, index) => `
        <tr data-ship-id="${ship.id}">
            <td style="cursor: grab; text-align: center; font-size: 18px; color: #7a9aba;" oncontextmenu="showPriorityMenu(event, ${ship.id})">⋮⋮</td>
            <td style="color: #00ff88; font-weight: 600;">${ship.name}</td>
            <td>${ship.type}</td>
            <td>${ship.tonnage.toLocaleString()}</td>
            <td>${ship.eta}</td>
            <td><span class="status-badge waiting">${ship.berth}</span></td>
            <td>${ship.waitTime}</td>
            <td><span style="color:${priorityColors[ship.priority]};font-weight:600;">${priorityText[ship.priority]}</span></td>
            <td><button class="port-btn port-btn-secondary port-btn-sm" onclick="editShipSchedule(${ship.id})">编辑</button></td>
        </tr>
    `).join('');
}

function filterQueueByBerth() {
    const berth = document.getElementById('berth-filter').value;
    const rows = document.querySelectorAll('#queue-table tbody tr');
    rows.forEach(row => {
        const shipId = parseInt(row.dataset.shipId);
        const ship = queueShips.find(s => s.id === shipId);
        if (berth === 'all' || ship.berth === berth) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showPriorityMenu(event, shipId) {
    event.preventDefault();
    const ship = queueShips.find(s => s.id === shipId);
    showModal('调整优先级', `
        <div style="padding: 10px 0;">
            <div style="margin-bottom: 15px;">
                <p style="font-size: 14px; color: #a0c4e8; margin-bottom: 10px;">当前船舶: <strong style="color: #00ff88;">${ship.name}</strong></p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="port-btn port-btn-sm" style="background: rgba(255, 71, 87, 0.2); border: 1px solid #ff4757; color: #ff4757;" onclick="setShipPriority(${shipId}, 'high'); closeModal();">🔴 高优先级</button>
                <button class="port-btn port-btn-sm" style="background: rgba(255, 165, 2, 0.2); border: 1px solid #ffa502; color: #ffa502;" onclick="setShipPriority(${shipId}, 'medium'); closeModal();">🟠 中优先级</button>
                <button class="port-btn port-btn-sm" style="background: rgba(122, 154, 186, 0.2); border: 1px solid #7a9aba; color: #7a9aba;" onclick="setShipPriority(${shipId}, 'low'); closeModal();">⚪ 低优先级</button>
            </div>
        </div>
    `);
}

function setShipPriority(shipId, priority) {
    const ship = queueShips.find(s => s.id === shipId);
    if (ship) {
        ship.priority = priority;
        document.querySelector('#queue-table tbody').innerHTML = renderQueueRows();
        initQueueCharts();
        showToast(`${ship.name} 优先级已调整`, 'success');
    }
}

function editShipSchedule(shipId) {
    const ship = queueShips.find(s => s.id === shipId);
    if (!ship) return;
    showModal('编辑排程', `
        <div style="padding: 10px 0;">
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 12px; color: #7a9aba; margin-bottom: 5px;">船名</label>
                    <input type="text" value="${ship.name}" disabled style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.3); border-radius: 4px; color: #a0c4e8;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; color: #7a9aba; margin-bottom: 5px;">预计到港</label>
                    <input type="text" value="${ship.eta}" id="edit-eta" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.3); border-radius: 4px; color: #00ff88;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; color: #7a9aba; margin-bottom: 5px;">泊位</label>
                    <select id="edit-berth" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.3); border-radius: 4px; color: #00ff88;">
                        <option value="B01" ${ship.berth === 'B01' ? 'selected' : ''}>B01</option>
                        <option value="B02" ${ship.berth === 'B02' ? 'selected' : ''}>B02</option>
                        <option value="B03" ${ship.berth === 'B03' ? 'selected' : ''}>B03</option>
                        <option value="B04" ${ship.berth === 'B04' ? 'selected' : ''}>B04</option>
                        <option value="B06" ${ship.berth === 'B06' ? 'selected' : ''}>B06</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button class="port-btn port-btn-secondary" onclick="closeModal()">取消</button>
                    <button class="port-btn port-btn-primary" onclick="saveShipSchedule(${shipId})">保存</button>
                </div>
            </div>
        </div>
    `);
}

function saveShipSchedule(shipId) {
    const ship = queueShips.find(s => s.id === shipId);
    if (ship) {
        ship.eta = document.getElementById('edit-eta').value;
        ship.berth = document.getElementById('edit-berth').value;
        document.querySelector('#queue-table tbody').innerHTML = renderQueueRows();
        closeModal();
        showToast('排程已更新', 'success');
    }
}

function autoSchedule() {
    queueShips.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority] || a.eta.localeCompare(b.eta);
    });
    queueShips.forEach((ship, index) => { ship.id = index + 1; });
    document.querySelector('#queue-table tbody').innerHTML = renderQueueRows();
    showToast('已根据优先级和时间完成自动排程', 'success');
}

function saveSchedule() {
    showToast('排程计划已保存', 'success');
}

// ==================== 标签页3: 在港船舶深度完善 ====================
function renderInportShipsEnhanced(container) {
    const totalInport = inportShipsEnhanced.length;
    const workingCount = inportShipsEnhanced.filter(s => s.status === 'working').length;
    const dangerousCount = inportShipsEnhanced.filter(s => s.dangerous).length;
    const todayComplete = 1;

    container.innerHTML = `
        <!-- 统计卡片区域 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">🚢</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${totalInport}</div>
                        <div class="stat-label">在港总艘次</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⚙️</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${workingCount}</div>
                        <div class="stat-label">作业中</div>
                    </div>
                </div>
                <div class="stat-trend up">占比 ${Math.round(workingCount/totalInport*100)}%</div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">☢️</div>
                    <div style="text-align: right;">
                        <div class="stat-value" style="color: #ff4757; -webkit-text-fill-color: #ff4757;">${dangerousCount}</div>
                        <div class="stat-label">危险品船</div>
                    </div>
                </div>
                <div class="stat-trend up">占比 ${Math.round(dangerousCount/totalInport*100)}%</div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">✅</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${todayComplete}</div>
                        <div class="stat-label">今日完成</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 功能说明区域 -->
        <div style="margin-bottom: 20px; padding: 12px 15px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border-left: 3px solid #00d4ff;">
            <p style="font-size: 13px; color: #7a9aba; margin: 0;">
                📋 <span style="color: #a0c4e8;">实时监控在港船舶作业进度，可视化显示装卸货进度，危险品船舶特殊标记与隔离管理</span>
            </p>
        </div>

        <!-- 筛选和搜索 -->
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; align-items: center;">
            <div style="display: flex; gap: 8px;">
                <button class="port-btn port-btn-sm ${currentInportFilter === 'all' ? 'port-btn-primary' : 'port-btn-secondary'}" onclick="filterInportShips('all')">全部</button>
                <button class="port-btn port-btn-sm ${currentInportFilter === 'working' ? 'port-btn-primary' : 'port-btn-secondary'}" onclick="filterInportShips('working')">作业中</button>
                <button class="port-btn port-btn-sm ${currentInportFilter === 'paused' ? 'port-btn-primary' : 'port-btn-secondary'}" onclick="filterInportShips('paused')">暂停</button>
                <button class="port-btn port-btn-sm ${currentInportFilter === 'dangerous' ? 'port-btn-primary' : 'port-btn-secondary'}" onclick="filterInportShips('dangerous')">危险品</button>
            </div>
            <input type="text" id="inport-search" placeholder="搜索船名..." style="padding: 8px 12px; font-size: 12px; width: 200px;" onkeyup="searchInportShips()">
            <div style="display: flex; gap: 8px; margin-left: auto;">
                <span style="font-size: 12px; color: #7a9aba; align-self: center;">排序:</span>
                <select id="inport-sort" onchange="sortInportShips()" style="padding: 6px 10px; font-size: 12px;">
                    <option value="efficiency">按效率</option>
                    <option value="remaining">按剩余时间</option>
                    <option value="arrival">按到港时间</option>
                </select>
            </div>
        </div>

        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">🏆 作业效率排行榜 Top5</span>
                </div>
                <div id="inport-efficiency-bar" style="width: 100%; height: 280px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 作业状态分布</span>
                </div>
                <div id="inport-status-pie" style="width: 100%; height: 280px;"></div>
            </div>
        </div>

        <!-- 船舶卡片 -->
        <div id="inport-cards-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 15px;">
            ${renderInportCards(inportShipsEnhanced)}
        </div>
    `;

    setTimeout(() => initInportCharts(), 100);
}

function renderInportCards(ships) {
    return ships.map(ship => {
        const completed = ship.unloaded + ship.loaded;
        const progress = Math.round((completed / ship.totalBoxes) * 100);
        const unloadProgress = Math.round((ship.unloaded / ship.totalBoxes) * 100);
        const loadProgress = Math.round((ship.loaded / ship.totalBoxes) * 100);
        const statusClass = ship.status === 'working' ? 'working' : ship.status === 'paused' ? 'offline' : 'waiting';
        const statusText = ship.status === 'working' ? '作业中' : ship.status === 'paused' ? '暂停' : '等待中';
        const dangerStyle = ship.dangerous ? 'border: 2px solid #ff4757; box-shadow: 0 0 20px rgba(255,71,87,0.3); background: rgba(255,71,87,0.05);' : '';
        
        return `
            <div class="port-card" style="margin-bottom: 0; ${dangerStyle} position: relative; transition: all 0.3s ease;">
                ${ship.dangerous ? `<span style="position:absolute;top:10px;right:10px;background:#ff4757;color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;cursor:pointer;" onclick="showDangerInfo('${ship.dangerClass}')">⚠️ ${ship.dangerClass}</span>` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; cursor: pointer;" onclick="toggleShipDetail('${ship.name}')">
                    <span style="font-size: 18px; font-weight: 700; color: #00ff88;">${ship.name}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <span style="color: #7a9aba; font-size: 12px;">▼</span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                    <div style="font-size:12px;"><span style="color:#7a9aba;">泊位:</span> <span style="color:#a0c4e8;">${ship.berth}</span></div>
                    <div style="font-size:12px;"><span style="color:#7a9aba;">效率:</span> <span style="color:#a0c4e8;">${ship.efficiency} 箱/小时</span></div>
                    <div style="font-size:12px;"><span style="color:#7a9aba;">总箱量:</span> <span style="color:#a0c4e8;">${ship.totalBoxes.toLocaleString()}</span></div>
                    <div style="font-size:12px;"><span style="color:#7a9aba;">预计完成:</span> <span style="color:#00ff88;">${ship.etaComplete}</span></div>
                </div>
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #7a9aba; margin-bottom: 5px;">
                        <span>作业进度 (已卸 ${ship.unloaded} + 已装 ${ship.loaded} = ${completed} / ${ship.totalBoxes})</span>
                        <span>${progress}%</span>
                    </div>
                    <div style="height: 12px; background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; display: flex;">
                        <div style="width: ${unloadProgress}%; background: linear-gradient(90deg, #00d4ff, #0099cc); height: 100%; transition: width 0.5s ease;" title="卸货"></div>
                        <div style="width: ${loadProgress}%; background: linear-gradient(90deg, #00ff88, #00cc66); height: 100%; transition: width 0.5s ease;" title="装货"></div>
                    </div>
                    <div style="display: flex; gap: 20px; margin-top: 5px; font-size: 10px;">
                        <span><span style="display:inline-block;width:12px;height:8px;background:#00d4ff;border-radius:2px;margin-right:4px;"></span>卸货 ${unloadProgress}%</span>
                        <span><span style="display:inline-block;width:12px;height:8px;background:#00ff88;border-radius:2px;margin-right:4px;"></span>装货 ${loadProgress}%</span>
                    </div>
                </div>
                <div id="detail-${ship.name.replace(/\s/g, '-')}" style="display: none; padding-top: 15px; border-top: 1px solid rgba(0,212,255,0.1); margin-top: 10px;">
                    <h4 style="color: #00d4ff; margin-bottom: 10px; font-size: 13px;">📦 作业详情</h4>
                    <table class="data-table" style="font-size: 11px;">
                        <tr><td style="width: 50%; padding: 5px 8px;">已卸箱数</td><td style="padding: 5px 8px; color: #00d4ff;">${ship.unloaded} TEU</td></tr>
                        <tr><td style="padding: 5px 8px;">已装箱数</td><td style="padding: 5px 8px; color: #00ff88;">${ship.loaded} TEU</td></tr>
                        <tr><td style="padding: 5px 8px;">剩余箱数</td><td style="padding: 5px 8px; color: #ffa502;">${ship.totalBoxes - completed} TEU</td></tr>
                        <tr><td style="padding: 5px 8px;">作业效率</td><td style="padding: 5px 8px;">${ship.efficiency} 箱/小时</td></tr>
                        <tr><td style="padding: 5px 8px;">预计剩余时间</td><td style="padding: 5px 8px;">${ship.efficiency > 0 ? Math.round((ship.totalBoxes - completed) / ship.efficiency) : '-'} 小时</td></tr>
                    </table>
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="port-btn port-btn-primary port-btn-sm" onclick="updateShipProgress('${ship.name}')">更新进度</button>
                        <button class="port-btn port-btn-secondary port-btn-sm" onclick="viewShipLog('${ship.name}')">作业日志</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initInportCharts() {
    const barDom = document.getElementById('inport-efficiency-bar');
    if (barDom) {
        const sortedShips = [...inportShipsEnhanced].filter(s => s.efficiency > 0).sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);
        inportBarChart = echarts.init(barDom);
        const barOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', formatter: '{b}: {c} 箱/小时' },
            grid: { left: '3%', right: '4%', top: '10%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            yAxis: { type: 'category', data: sortedShips.map(s => s.name), axisLabel: { color: '#7a9aba', fontSize: 11 } },
            series: [{
                type: 'bar',
                barWidth: '50%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: '#00ff88' },
                        { offset: 1, color: '#00d4ff' }
                    ]),
                    borderRadius: [0, 4, 4, 0]
                },
                data: sortedShips.map(s => s.efficiency)
            }]
        };
        inportBarChart.setOption(barOption);
    }

    const pieDom = document.getElementById('inport-status-pie');
    if (pieDom) {
        const workingCount = inportShipsEnhanced.filter(s => s.status === 'working').length;
        const pausedCount = inportShipsEnhanced.filter(s => s.status === 'paused').length;
        const waitingCount = inportShipsEnhanced.filter(s => s.status === 'waiting').length;
        
        inportPieChart = echarts.init(pieDom);
        const pieOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', formatter: '{b}: {c}艘 ({d}%)' },
            legend: { bottom: '5%', left: 'center', textStyle: { color: '#7a9aba', fontSize: 11 } },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2 },
                label: { show: true, color: '#a0c4e8', fontSize: 11 },
                data: [
                    { value: workingCount, name: '作业中', itemStyle: { color: '#00ff88' } },
                    { value: pausedCount, name: '暂停', itemStyle: { color: '#ffa502' } },
                    { value: waitingCount, name: '等待中', itemStyle: { color: '#7a9aba' } }
                ]
            }]
        };
        inportPieChart.setOption(pieOption);
    }
}

function filterInportShips(filter) {
    currentInportFilter = filter;
    document.querySelectorAll('#inport-cards-container + div .port-btn').forEach((btn, i) => {
        btn.classList.remove('port-btn-primary');
        btn.classList.add('port-btn-secondary');
        if ((filter === 'all' && i === 0) || (filter === 'working' && i === 1) || (filter === 'paused' && i === 2) || (filter === 'dangerous' && i === 3)) {
            btn.classList.remove('port-btn-secondary');
            btn.classList.add('port-btn-primary');
        }
    });
    
    let filteredShips;
    if (filter === 'all') {
        filteredShips = inportShipsEnhanced;
    } else if (filter === 'dangerous') {
        filteredShips = inportShipsEnhanced.filter(s => s.dangerous);
    } else {
        filteredShips = inportShipsEnhanced.filter(s => s.status === filter);
    }
    
    document.getElementById('inport-cards-container').innerHTML = renderInportCards(filteredShips);
}

function searchInportShips() {
    const keyword = document.getElementById('inport-search').value.toLowerCase();
    const filteredShips = inportShipsEnhanced.filter(s => s.name.toLowerCase().includes(keyword));
    document.getElementById('inport-cards-container').innerHTML = renderInportCards(filteredShips);
}

function sortInportShips() {
    const sortBy = document.getElementById('inport-sort').value;
    let sortedShips = [...inportShipsEnhanced];
    
    if (sortBy === 'efficiency') {
        sortedShips.sort((a, b) => b.efficiency - a.efficiency);
    } else if (sortBy === 'remaining') {
        sortedShips.sort((a, b) => {
            const aRemaining = a.efficiency > 0 ? (a.totalBoxes - a.unloaded - a.loaded) / a.efficiency : 9999;
            const bRemaining = b.efficiency > 0 ? (b.totalBoxes - b.unloaded - b.loaded) / b.efficiency : 9999;
            return aRemaining - bRemaining;
        });
    }
    
    document.getElementById('inport-cards-container').innerHTML = renderInportCards(sortedShips);
}

function toggleShipDetail(shipName) {
    const detailEl = document.getElementById(`detail-${shipName.replace(/\s/g, '-')}`);
    if (detailEl) {
        detailEl.style.display = detailEl.style.display === 'none' ? 'block' : 'none';
    }
}

function showDangerInfo(dangerClass) {
    showModal('危险品作业要求', `
        <div style="padding: 10px 0;">
            <h4 style="color: #ff4757; margin-bottom: 15px;">⚠️ ${dangerClass}危险品隔离要求</h4>
            <ul style="line-height: 2; font-size: 13px; color: #a0c4e8;">
                <li>保持与其他船舶至少 50 米的安全距离</li>
                <li>作业期间消防设备全程待命</li>
                <li>禁止任何明火作业和吸烟</li>
                <li>船员必须穿戴个人防护装备</li>
                <li>作业许可有效期: 24小时</li>
                <li>每2小时进行一次安全巡检</li>
                <li>指定专人全程监护作业</li>
            </ul>
        </div>
    `);
}

function updateShipProgress(shipName) {
    showToast(`${shipName} 进度更新功能开发中`, 'info');
}

function viewShipLog(shipName) {
    showModal(`${shipName} - 作业日志`, `
        <div style="padding: 10px 0; max-height: 400px; overflow-y: auto;">
            <div style="font-family: monospace; font-size: 12px; line-height: 1.8;">
                <p style="color: #00ff88;">[14:32:15] 开始第3航次作业</p>
                <p style="color: #a0c4e8;">[14:30:00] 桥吊 #02 开始卸箱作业</p>
                <p style="color: #a0c4e8;">[14:15:22] 理货完成，开始装卸作业</p>
                <p style="color: #00d4ff;">[13:45:00] 船舶系缆完成，准备靠泊</p>
                <p style="color: #7a9aba;">[13:30:10] 引航员登船</p>
            </div>
        </div>
    `);
}

// ==================== 标签页4: 作业计时深度完善 ====================
function renderOperationTiming(container) {
    const todayShips = 3;
    const avgInPortTime = '22小时15分';
    const avgEfficiency = 118;
    const efficiencyTarget = 92;

    container.innerHTML = `
        <!-- 统计卡片区域 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">📊</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${todayShips}</div>
                        <div class="stat-label">今日作业艘次</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⏱️</div>
                    <div style="text-align: right;">
                        <div class="stat-value" style="font-size: 24px;">${avgInPortTime}</div>
                        <div class="stat-label">平均在港时长</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">📈</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${avgEfficiency}</div>
                        <div class="stat-label">平均作业效率</div>
                    </div>
                </div>
                <div class="stat-trend up">箱/小时</div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">🏆</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${efficiencyTarget}%</div>
                        <div class="stat-label">效率达标率</div>
                    </div>
                </div>
                <div style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                    <div style="width: ${efficiencyTarget}%; height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 3px;"></div>
                </div>
            </div>
        </div>

        <!-- 功能说明区域 -->
        <div style="margin-bottom: 20px; padding: 12px 15px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border-left: 3px solid #00d4ff;">
            <p style="font-size: 13px; color: #7a9aba; margin: 0;">
                📋 <span style="color: #a0c4e8;">精确记录船舶靠离泊全流程9个阶段耗时，与历史数据对标分析，持续优化港口作业效率</span>
            </p>
        </div>

        <!-- 时间轴 -->
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">⏱️ 靠离泊作业计时 - ${currentTimingData.ship}</span>
                <div style="display: flex; gap: 10px;">
                    <button class="port-btn port-btn-primary port-btn-sm" onclick="startTiming()">▶️ 开始计时</button>
                    <button class="port-btn port-btn-secondary port-btn-sm" onclick="completeStage()">✅ 阶段完成</button>
                    <button class="port-btn port-btn-danger port-btn-sm" onclick="resetTiming()">🔄 重置</button>
                    <button class="port-btn port-btn-secondary port-btn-sm" onclick="exportTimingData()">📥 导出数据</button>
                </div>
            </div>
            <div style="padding: 20px 0; overflow-x: auto;">
                <div style="display: flex; align-items: center; justify-content: space-between; min-width: 900px;" id="timeline-container">
                    ${renderTimeline()}
                </div>
            </div>
        </div>

        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 各阶段平均耗时对比</span>
                </div>
                <div id="timing-stage-bar" style="width: 100%; height: 280px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 本周在港时长趋势</span>
                </div>
                <div id="timing-week-line" style="width: 100%; height: 280px;"></div>
            </div>
        </div>

        <!-- 计时详情表格 -->
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📋 计时数据详情</span>
                <div class="filter-group" style="margin-bottom: 0;">
                    <select id="timing-ship-select" onchange="changeTimingShip()" style="padding: 6px 10px; font-size: 12px;">
                        <option value="current">东方海外香港</option>
                        <option value="ship1">中远海运上海</option>
                        <option value="ship2">马士基巴塞罗那</option>
                    </select>
                </div>
            </div>
            <table class="data-table">
                <thead><tr><th>阶段</th><th>开始时间</th><th>结束时间</th><th>耗时(分)</th><th>历史平均(分)</th><th>对比</th></tr></thead>
                <tbody>${renderTimingTable()}</tbody>
            </table>
        </div>

        <!-- 历史记录 -->
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📜 历史计时记录</span>
                <div style="display: flex; gap: 10px;">
                    <input type="date" style="padding: 4px 8px; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.3); border-radius: 4px; color: #a0c4e8;">
                    <span style="font-size: 12px; color: #7a9aba; align-self: center;">至</span>
                    <input type="date" style="padding: 4px 8px; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.3); border-radius: 4px; color: #a0c4e8;">
                </div>
            </div>
            <table class="data-table">
                <thead><tr><th>船名</th><th>总耗时</th><th>靠泊耗时</th><th>作业耗时</th><th>离泊耗时</th><th>日期</th><th>操作</th></tr></thead>
                <tbody>
                    <tr><td style="color: #00ff88; font-weight: 600;">中远海运上海</td><td>2小时18分</td><td>35分</td><td>68分</td><td>35分</td><td>2024-05-10</td><td><button class="port-btn port-btn-secondary port-btn-sm" onclick="viewTimingDetail('中远海运上海')">详情</button></td></tr>
                    <tr><td style="color: #00ff88; font-weight: 600;">马士基巴塞罗那</td><td>2小时35分</td><td>42分</td><td>75分</td><td>38分</td><td>2024-05-08</td><td><button class="port-btn port-btn-secondary port-btn-sm" onclick="viewTimingDetail('马士基巴塞罗那')">详情</button></td></tr>
                    <tr><td style="color: #00ff88; font-weight: 600;">达飞塔霍</td><td>2小时05分</td><td>28分</td><td>65分</td><td>32分</td><td>2024-05-05</td><td><button class="port-btn port-btn-secondary port-btn-sm" onclick="viewTimingDetail('达飞塔霍')">详情</button></td></tr>
                </tbody>
            </table>
        </div>
    `;

    setTimeout(() => initTimingCharts(), 100);
}

function renderTimeline() {
    return timingStages.map((stage, index) => {
        const isCompleted = index < currentTimingData.currentStage - 1;
        const isCurrent = index === currentTimingData.currentStage - 1;
        const isPending = index > currentTimingData.currentStage - 1;
        
        let bgColor = isCompleted ? '#00ff88' : isCurrent ? '#00d4ff' : '#3a5a7a';
        let textColor = isCompleted || isCurrent ? '#0a1628' : '#7a9aba';
        
        return `
            <div style="text-align: center; flex: 1; position: relative; cursor: pointer;" onclick="selectTimingStage(${index})">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: ${bgColor}; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; ${isCurrent ? 'animation: pulse 1.5s infinite; box-shadow: 0 0 20px rgba(0,212,255,0.5);' : ''} transition: all 0.3s ease;">
                    ${stage.icon}
                </div>
                <div style="font-size: 11px; color: ${textColor}; font-weight: ${isCurrent ? '600' : 'normal'};">${stage.name}</div>
                ${currentTimingData.stageTimes[index].duration ? `<div style="font-size: 10px; color: #00ff88; margin-top: 4px;">${currentTimingData.stageTimes[index].duration}分</div>` : ''}
                ${index < timingStages.length - 1 ? `<div style="position: absolute; top: 25px; left: 55%; width: calc(100% - 50px); height: 3px; background: ${isCompleted ? '#00ff88' : 'rgba(255,255,255,0.1)'};"></div>` : ''}
            </div>
        `;
    }).join('');
}

function renderTimingTable() {
    return timingStages.map((stage, index) => {
        const time = currentTimingData.stageTimes[index];
        const diff = time.duration !== null ? time.duration - time.avg : null;
        const isAbnormal = diff !== null && Math.abs(diff) > time.avg * 2;
        const diffColor = diff !== null ? (diff < 0 ? '#00ff88' : '#ff4757') : '#7a9aba';
        const diffIcon = diff !== null ? (diff < 0 ? '↑ 效率提升' : (diff > 0 ? '↓ 效率下降' : '-')) : '-';
        
        return `
            <tr ${isAbnormal ? 'style="background: rgba(255,71,87,0.1);"' : ''}>
                <td style="font-weight: 600;">${stage.icon} ${stage.name}</td>
                <td>${time.start || '-'}</td>
                <td>${time.end || '-'}</td>
                <td>${time.duration || '-'}</td>
                <td>${time.avg || '-'}</td>
                <td style="color: ${diffColor}; font-weight: 600;">${diff !== null ? `${diff > 0 ? '+' : ''}${diff}分 ${diffIcon}` : '-'} ${isAbnormal ? '<span style="color: #ff4757;">⚠️</span>' : ''}</td>
            </tr>
        `;
    }).join('');
}

function initTimingCharts() {
    // 初始化柱状图
    const barDom = document.getElementById('timing-stage-bar');
    if (!barDom) {
        console.warn('timing-stage-bar DOM element not found');
        return;
    }
    
    const stageNames = timingStages.map(s => s.name);
    const stageDurations = [12, 25, 45, 20, 15, 10, 70, 18, 15];
    const stageColors = timingStages.map(s => {
        if (s.category === 'navigation') return '#00d4ff';
        if (s.category === 'berthing') return '#00ff88';
        return '#ffa502';
    });
    
    timingBarChart = echarts.init(barDom);
    if (!timingBarChart || typeof timingBarChart.on !== 'function') {
        console.warn('ECharts bar chart instance initialization failed');
        return;
    }
    
    const barOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: '{b}: {c} 分钟' },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', data: stageNames, axisLabel: { color: '#7a9aba', fontSize: 10, rotate: 30 } },
        yAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        series: [{
            type: 'bar',
            barWidth: '60%',
            itemStyle: {
                color: function(params) { return stageColors[params.dataIndex]; },
                borderRadius: [4, 4, 0, 0]
            },
            data: stageDurations
        }]
    };
    timingBarChart.setOption(barOption);
    
    // 修复：使用 ECharts 实例而不是 DOM 元素绑定事件
    timingBarChart.on('click', function(params) {
        showStageDetail(params.dataIndex);
    });

    // 初始化折线图
    const lineDom = document.getElementById('timing-week-line');
    if (!lineDom) {
        console.warn('timing-week-line DOM element not found');
        return;
    }
    
    timingLineChart = echarts.init(lineDom);
    if (!timingLineChart || typeof timingLineChart.setOption !== 'function') {
        console.warn('ECharts line chart instance initialization failed');
        return;
    }
    
    const lineOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: { data: ['实际时长', '目标时长'], textStyle: { color: '#7a9aba', fontSize: 11 }, top: '5%' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLabel: { color: '#7a9aba', fontSize: 11 } },
            yAxis: { type: 'value', name: '小时', axisLabel: { color: '#7a9aba', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            series: [
                {
                    name: '实际时长', type: 'line', smooth: true, data: [22.5, 21.8, 23.2, 20.5, 22.0, 24.5, 21.0],
                    lineStyle: { color: '#00ff88', width: 3 },
                    itemStyle: { color: '#00ff88' },
                    symbol: 'circle', symbolSize: 8
                },
                {
                    name: '目标时长', type: 'line', smooth: true, data: [22, 22, 22, 22, 22, 22, 22],
                    lineStyle: { color: '#ff4757', width: 2, type: 'dashed' },
                    itemStyle: { color: '#ff4757' },
                    symbol: 'circle', symbolSize: 6
                }
            ]
        };
        timingLineChart.setOption(lineOption);
}

function selectTimingStage(index) {
    showToast(`选中阶段: ${timingStages[index].name}`, 'info');
}

function showStageDetail(stageIndex) {
    const stage = timingStages[stageIndex];
    showModal(`${stage.icon} ${stage.name} - 阶段详情`, `
        <div style="padding: 10px 0;">
            <div style="margin-bottom: 20px;">
                <h4 style="color: #00d4ff; margin-bottom: 10px;">📊 历史数据分布</h4>
                <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #7a9aba;">最短耗时</span>
                        <span style="color: #00ff88; font-weight: 600;">18 分钟</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #7a9aba;">平均耗时</span>
                        <span style="color: #00d4ff; font-weight: 600;">${timingStages[stageIndex].category === 'navigation' ? '30' : '25'} 分钟</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #7a9aba;">最长耗时</span>
                        <span style="color: #ff4757; font-weight: 600;">55 分钟</span>
                    </div>
                </div>
            </div>
            <div>
                <h4 style="color: #00d4ff; margin-bottom: 10px;">💡 优化建议</h4>
                <ul style="font-size: 13px; color: #a0c4e8; line-height: 2; padding-left: 20px;">
                    <li>提前30分钟通知相关人员到位</li>
                    <li>优化设备调度流程</li>
                    <li>加强与船方沟通协调</li>
                </ul>
            </div>
        </div>
    `);
}

function startTiming() {
    showToast('计时已开始', 'success');
}

function completeStage() {
    if (currentTimingData.currentStage <= timingStages.length) {
        currentTimingData.currentStage++;
        const content = document.getElementById('timeline-container');
        if (content) content.innerHTML = renderTimeline();
        showToast(`阶段完成，进入下一阶段: ${timingStages[Math.min(currentTimingData.currentStage - 1, timingStages.length - 1)].name}`, 'success');
    }
}

function resetTiming() {
    currentTimingData.currentStage = 1;
    showToast('计时已重置', 'info');
    switchShipTab('timing');
}

function changeTimingShip() {
    showToast('船舶切换功能开发中', 'info');
}

function viewTimingDetail(shipName) {
    showToast(`查看 ${shipName} 计时详情`, 'info');
}

function exportTimingData() {
    showToast('计时数据导出功能开发中', 'info');
}

// ==================== 标签页5: 服务与计费深度完善 ====================
function renderServicesBilling(container) {
    const totalCost = 1258500;
    const demurrageTotal = 15800;
    const energyEfficiency = 94;
    const settledShips = billingShips.length;

    container.innerHTML = `
        <!-- 统计卡片区域 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">💰</div>
                    <div style="text-align: right;">
                        <div class="stat-value" style="font-size: 22px;">¥${(totalCost / 10000).toFixed(1)}万</div>
                        <div class="stat-label">本月服务总费用</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">💸</div>
                    <div style="text-align: right;">
                        <div class="stat-value" style="font-size: 22px; color: #ff4757; -webkit-text-fill-color: #ff4757;">¥${demurrageTotal.toLocaleString()}</div>
                        <div class="stat-label">累计滞期费</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⚡</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${energyEfficiency}%</div>
                        <div class="stat-label">能效达标率</div>
                    </div>
                </div>
                <div style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                    <div style="width: ${energyEfficiency}%; height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 3px;"></div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">📊</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${settledShips}</div>
                        <div class="stat-label">已结算船舶</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 功能说明区域 -->
        <div style="margin-bottom: 20px; padding: 12px 15px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border-left: 3px solid #00d4ff;">
            <p style="font-size: 13px; color: #7a9aba; margin: 0;">
                📋 <span style="color: #a0c4e8;">船舶在港期间所有服务的费用管理，自动计算滞期/速遣费，监控船舶能耗水平，支持成本分析</span>
            </p>
        </div>

        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 服务类型费用占比</span>
                    <button class="port-btn port-btn-secondary port-btn-sm" onclick="showCostDetail()">费用明细</button>
                </div>
                <div id="billing-cost-pie" style="width: 100%; height: 280px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 近30天滞期费趋势</span>
                </div>
                <div id="billing-demurrage-line" style="width: 100%; height: 280px;"></div>
            </div>
        </div>

        <!-- 筛选和操作 -->
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; align-items: center;">
            <button class="port-btn port-btn-primary port-btn-sm" onclick="expandAllBilling()">展开全部</button>
            <button class="port-btn port-btn-secondary port-btn-sm" onclick="collapseAllBilling()">收起全部</button>
            <div class="filter-group" style="margin-bottom: 0;">
                <select id="billing-sort" onchange="sortBillingShips()" style="padding: 6px 10px; font-size: 12px;">
                    <option value="total">按总费用排序</option>
                    <option value="demurrage">按滞期费排序</option>
                    <option value="energy">按能耗排序</option>
                </select>
            </div>
        </div>

        <!-- 计费列表 -->
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📝 船舶服务与计费</span>
            </div>
            <div id="billing-container">${renderBillingList()}</div>
        </div>
    `;

    setTimeout(() => initBillingCharts(), 100);
}

function renderBillingList() {
    return billingShips.map(ship => {
        const totalService = Object.values(ship.services).reduce((a, b) => a + b, 0);
        const totalWithDemurrage = totalService + ship.demurrage.total;
        return `
            <div style="border: 1px solid rgba(0,212,255,0.2); border-radius: 8px; margin-bottom: 15px; overflow: hidden; transition: all 0.3s ease;">
                <div style="padding: 15px; background: rgba(0,0,0,0.2); cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="toggleBillingExpand('${ship.name}')">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 16px; font-weight: 700; color: #00ff88;">${ship.name}</span>
                        <span style="font-size: 12px; color: #7a9aba;">作业箱量: ${ship.totalBoxes.toLocaleString()} TEU</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 14px; font-weight: 600; color: ${totalWithDemurrage > 0 ? '#ff4757' : '#00ff88'}">
                            ${totalWithDemurrage > 0 ? '+' : ''}¥${Math.abs(totalWithDemurrage).toLocaleString()}
                        </span>
                        <span style="font-size: 16px; color: #7a9aba;">${ship.expanded ? '▼' : '▶'}</span>
                    </div>
                </div>
                ${ship.expanded ? `
                    <div style="padding: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                            <div>
                                <h4 style="color: #00d4ff; margin-bottom: 12px;">🚢 服务清单</h4>
                                <table class="data-table" style="font-size: 12px;">
                                    <tr><td>拖轮服务</td><td style="text-align: right;">¥${ship.services.tugboat.toLocaleString()}</td></tr>
                                    <tr><td>引航服务</td><td style="text-align: right;">¥${ship.services.pilot.toLocaleString()}</td></tr>
                                    <tr><td>供油服务</td><td style="text-align: right;">¥${ship.services.oil.toLocaleString()}</td></tr>
                                    <tr><td>供水服务</td><td style="text-align: right;">¥${ship.services.water.toLocaleString()}</td></tr>
                                    <tr><td>垃圾接收</td><td style="text-align: right;">¥${ship.services.garbage.toLocaleString()}</td></tr>
                                    <tr><td>物料供应</td><td style="text-align: right;">¥${ship.services.supplies.toLocaleString()}</td></tr>
                                    <tr style="font-weight: 600; color: #00ff88;"><td>服务费用合计</td><td style="text-align: right;">¥${totalService.toLocaleString()}</td></tr>
                                </table>
                            </div>
                            <div>
                                <h4 style="color: #00d4ff; margin-bottom: 12px;">💰 滞期/速遣计算</h4>
                                <table class="data-table" style="font-size: 12px;">
                                    <tr><td>实际作业时间</td><td style="text-align: right;">${Math.abs(ship.demurrage.time)} 小时</td></tr>
                                    <tr><td>${ship.demurrage.time < 0 ? '速遣时间' : '滞期时间'}</td><td style="text-align: right; color: ${ship.demurrage.time < 0 ? '#00ff88' : '#ff4757'};">${ship.demurrage.time < 0 ? '+' : ''}${ship.demurrage.time} 小时</td></tr>
                                    <tr style="font-weight: 600;"><td>${ship.demurrage.total < 0 ? '速遣费(奖励' : '滞期费'}</td><td style="text-align: right; color: ${ship.demurrage.total < 0 ? '#00ff88' : '#ff4757'};">${ship.demurrage.total < 0 ? '+' : ''}¥${Math.abs(ship.demurrage.total).toLocaleString()}</td></tr>
                                </table>
                            </div>
                            <div>
                                <h4 style="color: #00d4ff; margin-bottom: 12px;">⚡ 能效管理</h4>
                                <table class="data-table" style="font-size: 12px;">
                                    <tr><td>燃油消耗</td><td style="text-align: right;">${ship.energy.fuel} 吨</td></tr>
                                    <tr><td>单位TEU能耗</td><td style="text-align: right;">${ship.energy.energyPerTeu} kg/TEU</td></tr>
                                    <tr><td>同类型平均</td><td style="text-align: right;">${ship.energy.avgEnergy} kg/TEU</td></tr>
                                    <tr style="font-weight: 600;"><td>能效对标</td><td style="text-align: right; color: ${ship.energy.energyPerTeu < ship.energy.avgEnergy ? '#00ff88' : '#ff4757'};">${ship.energy.energyPerTeu < ship.energy.avgEnergy ? '优秀 ✓' : '待改进 ⚠️'}</td></tr>
                                </table>
                            </div>
                        </div>
                        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="port-btn port-btn-secondary port-btn-sm" onclick="printBill('${ship.name}')">打印账单</button>
                            <button class="port-btn port-btn-primary port-btn-sm" onclick="confirmBill('${ship.name}')">确认结算</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function initBillingCharts() {
    const pieDom = document.getElementById('billing-cost-pie');
    if (pieDom) {
        const avgServices = { tugboat: 85000, pilot: 55000, oil: 680000, water: 18000, garbage: 9000, supplies: 35000 };
        billingPieChart = echarts.init(pieDom);
        const pieOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
            legend: { bottom: '3%', left: 'center', textStyle: { color: '#7a9aba', fontSize: 10 } },
            series: [{
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2 },
                label: { show: true, color: '#a0c4e8', fontSize: 10, formatter: '{b}\n{d}%' },
                data: [
                    { value: avgServices.tugboat, name: '拖轮', itemStyle: { color: '#00ff88' } },
                    { value: avgServices.pilot, name: '引航', itemStyle: { color: '#00d4ff' } },
                    { value: avgServices.oil, name: '供油', itemStyle: { color: '#ffa502' } },
                    { value: avgServices.water, name: '供水', itemStyle: { color: '#9b59b6' } },
                    { value: avgServices.garbage, name: '垃圾', itemStyle: { color: '#e74c3c' } },
                    { value: avgServices.supplies, name: '物料', itemStyle: { color: '#3498db' } }
                ]
            }]
        };
        billingPieChart.setOption(pieOption);
    }

    const lineDom = document.getElementById('billing-demurrage-line');
    if (lineDom) {
        const dates = [];
        const data = [];
        let cumulative = 0;
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
            cumulative += Math.random() * 800 - 300;
            data.push(Math.round(cumulative));
        }
        
        billingLineChart = echarts.init(lineDom);
        const lineOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', formatter: '{b}: ¥{c}' },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: dates, axisLabel: { color: '#7a9aba', fontSize: 9, interval: 4 } },
            yAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            series: [{
                type: 'line',
                smooth: true,
                data: data,
                lineStyle: { color: '#ff4757', width: 3 },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(255,71,87,0.3)' }, { offset: 1, color: 'rgba(255,71,87,0.05)' }]) },
                itemStyle: { color: '#ff4757' },
                symbol: 'circle',
                symbolSize: 6
            }]
        };
        billingLineChart.setOption(lineOption);
    }
}

function toggleBillingExpand(shipName) {
    const ship = billingShips.find(s => s.name === shipName);
    if (ship) {
        ship.expanded = !ship.expanded;
        document.getElementById('billing-container').innerHTML = renderBillingList();
    }
}

function expandAllBilling() {
    billingShips.forEach(s => s.expanded = true);
    document.getElementById('billing-container').innerHTML = renderBillingList();
}

function collapseAllBilling() {
    billingShips.forEach(s => s.expanded = false);
    document.getElementById('billing-container').innerHTML = renderBillingList();
}

function sortBillingShips() {
    showToast('排序功能开发中', 'info');
}

function showCostDetail() {
    showModal('费用明细分析', `
        <div style="padding: 10px 0;">
            <h4 style="color: #00d4ff; margin-bottom: 15px;">📊 本月服务费用构成</h4>
            <table class="data-table" style="font-size: 12px;">
                <tr><td style="font-weight: 600; color: #00ff88;">服务类型</td><td style="font-weight: 600; color: #00ff88;">费用</td><td style="font-weight: 600; color: #00ff88;">占比</td></tr>
                <tr><td>拖轮服务</td><td>¥85,000</td><td>6.7%</td></tr>
                <tr><td>引航服务</td><td>¥55,000</td><td>4.4%</td></tr>
                <tr><td>供油服务</td><td>¥680,000</td><td>53.2%</td></tr>
                <tr><td>供水服务</td><td>¥18,000</td><td>1.4%</td></tr>
                <tr><td>垃圾接收</td><td>¥9,000</td><td>0.7%</td></tr>
                <tr><td>物料供应</td><td>¥35,000</td><td>2.7%</td></tr>
                <tr><td>滞期费</td><td>¥15,800</td><td>1.2%</td></tr>
                <tr style="font-weight: 600; color: #00ff88;"><td>总计</td><td>¥1,258,500</td><td>100%</td></tr>
            </table>
        </div>
    `);
}

function printBill(shipName) {
    showToast(`正在打印 ${shipName} 账单...`, 'info');
}

function confirmBill(shipName) {
    showToast(`${shipName} 账单已确认结算`, 'success');
}

// ==================== 标签页6: 船舶档案深度完善 ====================
function renderShipArchiveEnhanced(container) {
    const totalArchives = shipArchives.length;
    const totalCompanies = new Set(shipArchives.map(s => s.company.name)).size;
    const newThisMonth = 2;
    const avgRating = 4.3;

    container.innerHTML = `
        <!-- 统计卡片区域 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">📚</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${totalArchives}</div>
                        <div class="stat-label">船舶档案总数</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">🏢</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${totalCompanies}</div>
                        <div class="stat-label">合作船公司</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">🆕</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${newThisMonth}</div>
                        <div class="stat-label">本月新增船舶</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 28px;">⭐</div>
                    <div style="text-align: right;">
                        <div class="stat-value">${avgRating}</div>
                        <div class="stat-label">平均服务评级</div>
                    </div>
                </div>
                <div style="margin-top: 5px; color: #ffa502; font-size: 12px;">
                    ${'★'.repeat(Math.floor(avgRating))}${'☆'.repeat(5 - Math.floor(avgRating))}
                </div>
            </div>
        </div>

        <!-- 功能说明区域 -->
        <div style="margin-bottom: 20px; padding: 12px 15px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border-left: 3px solid #00d4ff;">
            <p style="font-size: 13px; color: #7a9aba; margin: 0;">
                📋 <span style="color: #a0c4e8;">完整的船舶基础信息档案库，船公司客户管理，历史挂靠统计，服务评级与优惠协议管理</span>
            </p>
        </div>

        <!-- 筛选搜索 -->
        <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; align-items: center;">
            <input type="text" id="archive-search" placeholder="输入船名或IMO号..." style="padding: 8px 12px; font-size: 12px; width: 250px;" onkeyup="searchArchives()">
            <div class="filter-group" style="margin-bottom: 0;">
                <label style="font-size: 12px;">船型:</label>
                <select id="ship-type-filter" onchange="filterArchives()" style="padding: 6px 10px; font-size: 12px;">
                    <option value="all">全部船型</option>
                    <option value="container">集装箱船</option>
                    <option value="bulk">散货船</option>
                    <option value="tanker">油轮</option>
                    <option value="general">杂货船</option>
                </select>
            </div>
            <div class="filter-group" style="margin-bottom: 0;">
                <label style="font-size: 12px;">船公司:</label>
                <select id="company-filter" onchange="filterArchives()" style="padding: 6px 10px; font-size: 12px;">
                    <option value="all">全部公司</option>
                    <option value="中远海运">中远海运</option>
                    <option value="马士基">马士基</option>
                    <option value="达飞海运">达飞海运</option>
                </select>
            </div>
            <button class="port-btn port-btn-primary port-btn-sm" onclick="addNewShip()">➕ 新增档案</button>
        </div>

        <!-- 图表区域 -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 船型分布</span>
                </div>
                <div id="archive-type-pie" style="width: 100%; height: 280px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">🏆 船公司挂靠次数排名 Top 10</span>
                </div>
                <div id="archive-company-bar" style="width: 100%; height: 280px;"></div>
            </div>
        </div>

        <!-- 档案列表 -->
        <div id="archive-container">
            ${renderArchiveList(shipArchives)}
        </div>
    `;

    setTimeout(() => initArchiveCharts(), 100);
}

function renderArchiveList(archives) {
    const typeNames = { container: '集装箱船', bulk: '散货船', tanker: '油轮', general: '杂货船' };
    return archives.map(ship => `
        <div class="port-card">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #00ff88; margin: 0;">🚢 ${ship.name}</h3>
                        <div style="display: flex; gap: 8px;">
                            <button class="port-btn port-btn-secondary port-btn-sm" onclick="editShipArchive('${ship.name}')">编辑</button>
                            <button class="port-btn port-btn-primary port-btn-sm" onclick="viewShipHistory('${ship.name}')">历史挂靠</button>
                        </div>
                    </div>
                    <table class="data-table" style="font-size: 12px;">
                        <tr><td style="width: 100px; color: #7a9aba;">IMO号</td><td style="font-weight: 600;">${ship.imo}</td></tr>
                        <tr><td style="color: #7a9aba;">船舶类型</td><td>${typeNames[ship.type] || ship.type}</td></tr>
                        <tr><td style="color: #7a9aba;">载重吨</td><td>${ship.tonnage.toLocaleString()}</td></tr>
                        <tr><td style="color: #7a9aba;">船长/型宽</td><td>${ship.length}m / ${ship.beam}m</td></tr>
                        <tr><td style="color: #7a9aba;">吃水</td><td>${ship.draft}m</td></tr>
                    </table>
                </div>
                <div>
                    <h3 style="color: #00d4ff; margin-bottom: 15px;">🏢 ${ship.company.name}</h3>
                    <table class="data-table" style="font-size: 12px;">
                        <tr><td style="width: 100px; color: #7a9aba;">到港次数</td><td style="font-weight: 600;">${ship.company.visitCount} 次</td></tr>
                        <tr><td style="color: #7a9aba;">服务评级</td><td><span style="cursor: pointer;" onclick="changeShipRating('${ship.name}')">${'⭐'.repeat(ship.company.rating)}${'☆'.repeat(5 - ship.company.rating)}</span></td></tr>
                        <tr><td style="color: #7a9aba;">优先级</td><td><span class="status-badge working">${ship.company.priority}</span></td></tr>
                        <tr><td style="color: #7a9aba;">联系人</td><td>${ship.company.contact}</td></tr>
                        <tr><td style="color: #7a9aba;">电话</td><td>${ship.company.phone}</td></tr>
                    </table>
                </div>
            </div>
        </div>
    `).join('');
}

function initArchiveCharts() {
    const pieDom = document.getElementById('archive-type-pie');
    if (pieDom) {
        const typeCounts = { container: 0, bulk: 0, tanker: 0, general: 0 };
        shipArchives.forEach(s => typeCounts[s.type] ? typeCounts[s.type]++ : typeCounts.general++);
        
        archivePieChart = echarts.init(pieDom);
        const pieOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', formatter: '{b}: {c}艘 ({d}%)' },
            legend: { bottom: '5%', left: 'center', textStyle: { color: '#7a9aba', fontSize: 11 } },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2 },
                label: { show: true, color: '#a0c4e8', fontSize: 11 },
                data: [
                    { value: typeCounts.container, name: '集装箱船', itemStyle: { color: '#00ff88' } },
                    { value: typeCounts.bulk, name: '散货船', itemStyle: { color: '#00d4ff' } },
                    { value: typeCounts.tanker, name: '油轮', itemStyle: { color: '#ffa502' } },
                    { value: typeCounts.general, name: '杂货船', itemStyle: { color: '#9b59b6' } }
                ]
            }]
        };
        archivePieChart.setOption(pieOption);
    }

    const barDom = document.getElementById('archive-company-bar');
    if (barDom) {
        const companyVisits = {};
        shipArchives.forEach(s => {
            companyVisits[s.company.name] = (companyVisits[s.company.name] || 0) + s.company.visitCount;
        });
        const sortedCompanies = Object.entries(companyVisits).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        archiveBarChart = echarts.init(barDom);
        const barOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', formatter: '{b}: {c} 次' },
            grid: { left: '3%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: '#7a9aba', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            yAxis: { type: 'category', data: sortedCompanies.map(c => c[0]), axisLabel: { color: '#7a9aba', fontSize: 10 } },
            series: [{
                type: 'bar',
                barWidth: '50%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: '#00ff88' },
                        { offset: 1, color: '#00d4ff' }
                    ]),
                    borderRadius: [0, 4, 4, 0]
                },
                data: sortedCompanies.map(c => c[1])
            }]
        };
        archiveBarChart.setOption(barOption);
    }
}

function searchArchives() {
    const keyword = document.getElementById('archive-search').value.toLowerCase();
    const filtered = shipArchives.filter(s => 
        s.name.toLowerCase().includes(keyword) || 
        s.imo.toString().includes(keyword)
    );
    document.getElementById('archive-container').innerHTML = renderArchiveList(filtered);
}

function filterArchives() {
    const typeFilter = document.getElementById('ship-type-filter').value;
    const companyFilter = document.getElementById('company-filter').value;
    
    let filtered = shipArchives;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(s => s.type === typeFilter);
    }
    
    if (companyFilter !== 'all') {
        filtered = filtered.filter(s => s.company.name === companyFilter);
    }
    
    document.getElementById('archive-container').innerHTML = renderArchiveList(filtered);
}

function editShipArchive(shipName) {
    showToast(`编辑 ${shipName} 档案`, 'info');
}

function viewShipHistory(shipName) {
    showModal(`${shipName} - 历史挂靠记录`, `
        <div style="padding: 10px 0; max-height: 400px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px;">
                <thead>
                    <tr><th>日期</th><th>泊位</th><th>靠泊时间</th><th>离泊时间</th><th>作业箱量</th><th>效率</th></tr>
                </thead>
                <tbody>
                    <tr><td>2024-05-10</td><td>B02</td><td>08:15</td><td>18:45</td><td>1,250</td><td>118 TEU/h</td></tr>
                    <tr><td>2024-04-25</td><td>B04</td><td>14:30</td><td>次日02:15</td><td>1,420</td><td>125 TEU/h</td></tr>
                    <tr><td>2024-04-08</td><td>B01</td><td>10:00</td><td>22:30</td><td>1,380</td><td>110 TEU/h</td></tr>
                    <tr><td>2024-03-22</td><td>B03</td><td>06:45</td><td>19:15</td><td>1,520</td><td>122 TEU/h</td></tr>
                    <tr><td>2024-03-05</td><td>B05</td><td> "13:20</td><td>次日01:50</td><td>1,290</td><td>108 TEU/h</td></tr>
                </tbody>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: rgba(0,212,255,0.1); border-radius: 8px;">
                <h4 style="color: #00d4ff; margin-bottom: 10px;">📊 统计汇总</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 12px;">
                    <div>
                        <span style="color: #7a9aba;">总挂靠次数</span>
                        <p style="color: #00ff88; font-size: 20px; font-weight: 700; margin: 5px 0 0;">45 次</p>
                    </div>
                    <div>
                        <span style="color: #7a9aba;">平均停靠时长</span>
                        <p style="color: #00ff88; font-size: 20px; font-weight: 700; margin: 5px 0 0;">11.5 小时</p>
                    </div>
                    <div>
                        <span style="color: #7a9aba;">平均作业效率</span>
                        <p style="color: #00ff88; font-size: 20px; font-weight: 700; margin: 5px 0 0;">117 TEU/h</p>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function changeShipRating(shipName) {
    showModal('调整服务评级', `
        <div style="padding: 10px 0; text-align: center;">
            <h4 style="color: #00d4ff; margin-bottom: 20px;">${shipName}</h4>
            <div style="font-size: 32px; margin-bottom: 20px; cursor: pointer;">
                ${[1,2,3,4,5].map(i => `<span onclick="setShipRating('${shipName}', ${i})" style="color: ${i <= 4 ? '#ffa502' : '#7a9aba'}; margin: 0 5px;">★</span>`).join('')}
            </div>
            <p style="font-size: 12px; color: #7a9aba;">点击星星设置评级</p>
        </div>
    `);
}

function setShipRating(shipName, rating) {
    const ship = shipArchives.find(s => s.name === shipName);
    if (ship) {
        ship.company.rating = rating;
        closeModal();
        showToast(`${shipName} 评级已更新为 ${rating} 星`, 'success');
        switchShipTab('archive');
    }
}

function addNewShip() {
    showToast('新增船舶档案功能开发中', 'info');
}

// ==================== 通用函数 ====================
function refreshAllShipData() {
    showToast('数据已刷新', 'success');
    switchShipTab('overview');
}

// 窗口大小变化时重新渲染图表
window.addEventListener('resize', function() {
    if (shipMapChart) shipMapChart.resize();
    if (shipOverviewPieChart) shipOverviewPieChart.resize();
    if (shipOverviewBarChart) shipOverviewBarChart.resize();
    if (queueLineChart) queueLineChart.resize();
    if (queueDonutChart) queueDonutChart.resize();
    if (inportBarChart) inportBarChart.resize();
    if (inportPieChart) inportPieChart.resize();
    if (timingBarChart) timingBarChart.resize();
    if (timingLineChart) timingLineChart.resize();
    if (billingPieChart) billingPieChart.resize();
    if (billingLineChart) billingLineChart.resize();
    if (archivePieChart) archivePieChart.resize();
    if (archiveBarChart) archiveBarChart.resize();
});

console.log('✅ 船舶管理模块已加载完成 - 6个标签页深度完善');

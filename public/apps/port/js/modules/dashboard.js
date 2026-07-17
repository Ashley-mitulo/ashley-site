// 指挥大屏模块

function renderDashboard(container) {
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 15px; height: calc(100vh - 140px);">
            <!-- 左侧：船舶动态 + 设备状态 -->
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <!-- 船舶动态饼图 -->
                <div class="port-card" style="flex: 1;">
                    <div class="card-header">
                        <span class="card-title">🚢 船舶状态分布</span>
                    </div>
                    <div id="ship-status-chart" class="chart-container small"></div>
                    <div id="ship-status-list" style="max-height: 120px; overflow-y: auto; margin-top: 10px;"></div>
                </div>

                <!-- 设备状态 -->
                <div class="port-card" style="flex: 1;">
                    <div class="card-header">
                        <span class="card-title">🏭 设备运行状态</span>
                    </div>
                    <div id="equipment-ring-chart" style="display: flex; justify-content: space-around; padding: 10px 0;"></div>
                    <div id="equipment-status-list" style="max-height: 150px; overflow-y: auto;"></div>
                </div>
            </div>

            <!-- 中间：码头全景图 + 实时作业流 -->
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <!-- 码头全景图 -->
                <div class="port-card" style="flex: 2;">
                    <div class="card-header">
                        <span class="card-title">🗺️ 码头全景实时监控</span>
                        <span class="port-badge status-badge working" style="font-size: 10px;">● 实时更新</span>
                    </div>
                    <div id="port-overview" class="port-overview" style="height: 100%; min-height: 250px;"></div>
                </div>

                <!-- 实时作业流 -->
                <div class="port-card" style="flex: 1;">
                    <div class="card-header">
                        <span class="card-title">🔄 正在进行的作业</span>
                    </div>
                    <div id="live-operations" style="max-height: 180px; overflow-y: auto;"></div>
                </div>
            </div>

            <!-- 右侧：作业KPI + 告警中心 -->
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <!-- 作业KPI -->
                <div class="port-card" style="flex: 1;">
                    <div class="card-header">
                        <span class="card-title">📈 今日作业KPI</span>
                    </div>
                    <div id="hourly-chart" class="chart-container small" style="height: 150px;"></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <div style="text-align: center; padding: 10px; background: rgba(0, 255, 136, 0.1); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: 700; color: #00ff88;" id="kpi-berth-utilization">78%</div>
                            <div style="font-size: 11px; color: #7a9aba;">泊位利用率</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: 700; color: #00d4ff;" id="kpi-yard-utilization">70%</div>
                            <div style="font-size: 11px; color: #7a9aba;">堆场利用率</div>
                        </div>
                    </div>
                </div>

                <!-- 告警中心 -->
                <div class="port-card" style="flex: 1;">
                    <div class="card-header">
                        <span class="card-title">🚨 实时告警中心</span>
                        <span class="status-badge stopped" style="font-size: 10px;" id="alarm-count">4 条告警</span>
                    </div>
                    <div id="alarm-center" class="alarm-list"></div>
                </div>
            </div>
        </div>
    `;

    initDashboardCharts();
    renderShipStatusList();
    renderEquipmentRingChart();
    renderEquipmentStatusList();
    renderPortOverview();
    renderDashboardLiveOperations();
    renderAlarmCenter();
    startDashboardUpdates();
}

function initDashboardCharts() {
    const ec = getECharts();
    if (!ec) return;

    // 船舶状态饼图
    const shipChartDom = document.getElementById('ship-status-chart');
    if (!shipChartDom) return;
    
    const shipChart = ec.init(shipChartDom);
    shipChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: [
                { value: 8, name: '作业中', itemStyle: { color: '#00ff88' } },
                { value: 6, name: '锚地', itemStyle: { color: '#ffc107' } },
                { value: 4, name: '预到', itemStyle: { color: '#00d4ff' } },
                { value: 2, name: '离港', itemStyle: { color: '#b388ff' } }
            ],
            label: {
                color: '#a0c4e8',
                fontSize: 11
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    });

    // 小时作业量柱状图
    const hours = [];
    const data = [];
    for (let i = 0; i < 24; i++) {
        hours.push(i + ':00');
        const base = i >= 8 && i <= 20 ? 80 : 30;
        data.push(Math.round(base + Math.random() * 40));
    }
    
    const hourlyChartDom = document.getElementById('hourly-chart');
    if (!hourlyChartDom) return;
    
    const hourlyChart = ec.init(hourlyChartDom);
    
    hourlyChart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' },
        xAxis: {
            type: 'category',
            data: hours,
            axisLine: { lineStyle: { color: '#1e3a5f' } },
            axisLabel: { color: '#5a7a9a', fontSize: 9, interval: 3 }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#1e3a5f' } },
            axisLabel: { color: '#5a7a9a', fontSize: 9 },
            splitLine: { lineStyle: { color: '#1e3a5f' } }
        },
        series: [{
            type: 'bar',
            data: data,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#00ff88' },
                    { offset: 1, color: '#00d4ff' }
                ]),
                borderRadius: [3, 3, 0, 0]
            }
        }]
    });
}

function renderShipStatusList() {
    const list = document.getElementById('ship-status-list');
    if (!list) return;
    
    const ships = [
        { name: '中远海运宁波', status: 'working', berth: 'B01' },
        { name: '马士基汉堡', status: 'working', berth: 'B02' },
        { name: '达飞塔霍', status: 'anchorage', berth: '锚地' },
        { name: '中海之春', status: 'working', berth: 'B04' }
    ];

    list.innerHTML = ships.map(ship => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
            <div style="font-size: 12px; color: #a0c4e8;">${ship.name}</div>
            <span class="status-badge ${ship.status === 'working' ? 'working' : 'waiting'}" style="font-size: 10px;">
                ${ship.berth}
            </span>
        </div>
    `).join('');
}

function renderEquipmentRingChart() {
    const container = document.getElementById('equipment-ring-chart');
    if (!container) return;
    
    const types = [
        { name: '桥吊', active: 5, total: 6, color: '#00ff88' },
        { name: '轮胎吊', active: 4, total: 5, color: '#00d4ff' },
        { name: 'AGV', active: 4, total: 6, color: '#ffc107' }
    ];

    container.innerHTML = types.map(type => {
        const percent = Math.round((type.active / type.total) * 100);
        const circumference = 2 * Math.PI * 25;
        const offset = circumference - (percent / 100) * circumference;
        
        return `
            <div style="text-align: center;">
                <div class="ring-progress" style="width: 60px; height: 60px; margin: 0 auto;">
                    <svg width="60" height="60">
                        <circle class="ring-bg" cx="30" cy="30" r="25" />
                        <circle class="ring-fill" cx="30" cy="30" r="25" 
                            stroke="${type.color}" 
                            stroke-dasharray="${circumference}" 
                            stroke-dashoffset="${offset}" />
                    </svg>
                    <span class="ring-value" style="font-size: 14px; color: ${type.color};">${percent}%</span>
                </div>
                <div style="font-size: 11px; color: #7a9aba; margin-top: 5px;">${type.name}</div>
                <div style="font-size: 10px; color: #5a7a9a;">${type.active}/${type.total}</div>
            </div>
        `;
    }).join('');
}

function renderEquipmentStatusList() {
    const list = document.getElementById('equipment-status-list');
    if (!list) return;
    
    const equipment = [
        { name: '桥吊1号', status: 'working', moves: 128 },
        { name: '桥吊2号', status: 'working', moves: 115 },
        { name: '轮胎吊3号', status: 'idle', moves: 0 },
        { name: 'AGV03', status: 'charging', moves: 128 }
    ];

    list.innerHTML = equipment.map(eq => {
        const statusColors = {
            working: '#00ff88',
            idle: '#b388ff',
            charging: '#ffc107',
            maintenance: '#ff4757'
        };
        const statusLabels = {
            working: '作业中',
            idle: '空闲',
            charging: '充电中',
            maintenance: '维护中'
        };
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
                <div>
                    <div style="font-size: 12px; color: #a0c4e8;">${eq.name}</div>
                    <div style="font-size: 10px; color: #5a7a9a;">今日作业: ${eq.moves} 箱</div>
                </div>
                <span style="color: ${statusColors[eq.status]}; font-size: 11px;">${statusLabels[eq.status]}</span>
            </div>
        `;
    }).join('');
}

function renderPortOverview() {
    const container = document.getElementById('port-overview');
    if (!container) return;
    
    container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
            <!-- 背景 -->
            <rect x="0" y="0" width="600" height="300" fill="rgba(10, 40, 80, 0.3)" />
            
            <!-- 水域 -->
            <rect x="0" y="0" width="600" height="80" fill="rgba(0, 100, 150, 0.3)" />
            <text x="300" y="45" text-anchor="middle" fill="#3a7a9a" font-size="12">航道水域</text>
            
            <!-- 泊位线 -->
            <line x1="50" y1="80" x2="550" y2="80" stroke="#00d4ff" stroke-width="3" opacity="0.6" />
            
            <!-- 泊位 -->
            <g id="berths">
                <rect x="60" y="60" width="80" height="20" rx="3" fill="rgba(0, 255, 136, 0.3)" stroke="#00ff88" />
                <text x="100" y="74" text-anchor="middle" fill="#00ff88" font-size="10">B01</text>
                
                <rect x="150" y="60" width="80" height="20" rx="3" fill="rgba(0, 255, 136, 0.3)" stroke="#00ff88" />
                <text x="190" y="74" text-anchor="middle" fill="#00ff88" font-size="10">B02</text>
                
                <rect x="240" y="60" width="80" height="20" rx="3" fill="rgba(255, 193, 7, 0.2)" stroke="#ffc107" />
                <text x="280" y="74" text-anchor="middle" fill="#ffc107" font-size="10">B03</text>
                
                <rect x="330" y="60" width="80" height="20" rx="3" fill="rgba(0, 255, 136, 0.3)" stroke="#00ff88" />
                <text x="370" y="74" text-anchor="middle" fill="#00ff88" font-size="10">B04</text>
                
                <rect x="420" y="60" width="80" height="20" rx="3" fill="rgba(150, 150, 150, 0.2)" stroke="#888" />
                <text x="460" y="74" text-anchor="middle" fill="#888" font-size="10">B05</text>
            </g>
            
            <!-- 船舶 -->
            <g id="ships">
                <rect x="70" y="30" width="60" height="25" rx="4" fill="rgba(0, 255, 136, 0.4)" stroke="#00ff88" stroke-width="2" />
                <text x="100" y="47" text-anchor="middle" fill="#fff" font-size="9">宁波</text>
                
                <rect x="160" y="35" width="60" height="25" rx="4" fill="rgba(0, 255, 136, 0.4)" stroke="#00ff88" stroke-width="2" />
                <text x="190" y="52" text-anchor="middle" fill="#fff" font-size="9">汉堡</text>
                
                <rect x="340" y="25" width="60" height="25" rx="4" fill="rgba(0, 212, 255, 0.4)" stroke="#00d4ff" stroke-width="2" />
                <text x="370" y="42" text-anchor="middle" fill="#fff" font-size="9">塔霍</text>
            </g>
            
            <!-- 堆场区域 -->
            <g id="yard">
                <rect x="50" y="120" width="500" height="160" fill="rgba(30, 58, 95, 0.5)" stroke="#1e3a5f" />
                <text x="300" y="140" text-anchor="middle" fill="#5a7a9a" font-size="11">堆场作业区</text>
                
                <!-- 堆场贝位 -->
                <rect x="70" y="150" width="70" height="40" fill="rgba(0, 255, 136, 0.2)" stroke="#00ff88" />
                <rect x="150" y="150" width="70" height="40" fill="rgba(0, 255, 136, 0.3)" stroke="#00ff88" />
                <rect x="230" y="150" width="70" height="40" fill="rgba(0, 212, 255, 0.2)" stroke="#00d4ff" />
                <rect x="310" y="150" width="70" height="40" fill="rgba(0, 255, 136, 0.25)" stroke="#00ff88" />
                <rect x="390" y="150" width="70" height="40" fill="rgba(255, 193, 7, 0.2)" stroke="#ffc107" />
                <rect x="470" y="150" width="70" height="40" fill="rgba(0, 255, 136, 0.2)" stroke="#00ff88" />
            </g>
        </svg>
    `;
}

function renderDashboardLiveOperations() {
    const container = document.getElementById('live-operations');
    if (!container) return;
    
    const operations = MockData.operations;
    container.innerHTML = operations.map(op => `
        <div class="operation-item">
            <div class="operation-info">
                <div class="operation-ship">${op.ship}</div>
                <div class="operation-detail">泊位 ${op.berth} · 桥吊 ${op.crane}</div>
            </div>
            <div class="operation-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${op.progress}%"></div>
                </div>
                <div class="progress-text">${op.completed}/${op.total} (${op.progress}%)</div>
            </div>
        </div>
    `).join('');
}

function renderAlarmCenter() {
    const container = document.getElementById('alarm-center');
    if (!container) return;
    
    const alarms = MockData.alarms;
    container.innerHTML = alarms.map(alarm => `
        <div class="alarm-item alarm-${alarm.level}">
            <div class="alarm-time">${alarm.time}</div>
            <div class="alarm-title">${alarm.title}</div>
        </div>
    `).join('');
}

function startDashboardUpdates() {
    setInterval(() => {
        renderDashboardLiveOperations();
    }, 5000);
}
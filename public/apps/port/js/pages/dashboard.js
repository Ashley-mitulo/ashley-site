async function render_dashboard(container) {
    if (!container) return;
    
    container.innerHTML = `
        <div style="padding: 10px 20px 20px 20px;">
            <!-- 顶部状态栏 -->
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05)); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #00ff88; font-size: 24px; font-weight: 700;" id="dash-total-load">2,158</div>
                    <div style="color: #a0c4e8; font-size: 12px; margin-top: 5px;">总货物 (MW)</div>
                    <div style="color: #00ff88; font-size: 11px; margin-top: 3px;">↑ 3.2% 较昨日</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05)); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #00d4ff; font-size: 24px; font-weight: 700;" id="dash-health-score">92.5</div>
                    <div style="color: #a0c4e8; font-size: 12px; margin-top: 5px;">港口健康度</div>
                    <div style="color: #00d4ff; font-size: 11px; margin-top: 3px;">运行状态良好</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05)); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #ffc107; font-size: 24px; font-weight: 700;" id="dash-new-energy">1,420</div>
                    <div style="color: #a0c4e8; font-size: 12px; margin-top: 5px;">绿色港口出力 (MW)</div>
                    <div style="color: #ffc107; font-size: 11px; margin-top: 3px;">占比 32.8%</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(255, 71, 87, 0.1), rgba(255, 71, 87, 0.05)); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #ff4757; font-size: 24px; font-weight: 700;" id="dash-critical-alarms">3</div>
                    <div style="color: #a0c4e8; font-size: 12px; margin-top: 5px;">严重告警</div>
                    <div style="color: #ff4757; font-size: 11px; margin-top: 3px;">需立即处理</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(156, 39, 176, 0.05)); border: 1px solid rgba(156, 39, 176, 0.3); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #9c27b0; font-size: 24px; font-weight: 700;" id="dash-total-stations">8</div>
                    <div style="color: #a0c4e8; font-size: 12px; margin-top: 5px;">运行泊位</div>
                    <div style="color: #9c27b0; font-size: 11px; margin-top: 3px;">全部正常</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05)); border: 1px solid rgba(255, 152, 0, 0.3); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #ff9800; font-size: 24px; font-weight: 700;" id="dash-predict-peak">3,420</div>
                    <div style="color: #a0c4e8; font-size: 12px; margin-top: 5px;">预测峰值 (MW)</div>
                    <div style="color: #ff9800; font-size: 11px; margin-top: 3px;">预计 18:30 出现</div>
                </div>
            </div>

            <!-- 主内容区 -->
            <div style="display: grid; grid-template-columns: 300px 1fr 320px; gap: 15px;">
                <!-- 左侧：告警列表 + 绿色港口 -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- 实时告警 -->
                    <div style="background: rgba(255, 71, 87, 0.05); border: 1px solid rgba(255, 71, 87, 0.2); border-radius: 8px; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #ff4757;">🚨 实时告警</h4>
                            <button onclick="navigateTo('alarms')" style="background: none; border: 1px solid #ff4757; color: #ff4757; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                全部告警 →
                            </button>
                        </div>
                        <div id="dash-alarm-list" style="max-height: 180px; overflow-y: auto;">
                            <!-- 告警列表将通过JS动态生成 -->
                        </div>
                    </div>

                    <!-- 绿色港口 -->
                    <div style="background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 8px; padding: 15px; flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #00d4ffff;">🌱 绿色港口出力</h4>
                            <button onclick="navigateTo('renewable')" style="background: none; border: 1px solid #00d4ff; color: #00d4ff; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                详情 →
                            </button>
                        </div>
                        <div id="dash-renewable-chart" style="height: 150px;"></div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px;">
                            <div style="text-align: center; padding: 8px; border-radius: 6px; background: rgba(0, 212, 255, 0.1);">
                                <div style="color: #00d4ff; font-weight: 600; font-size: 16px;">850</div>
                                <div style="color: #888; font-size: 11px;">风电 (MW)</div>
                            </div>
                            <div style="text-align: center; padding: 8px; border-radius: 6px; background: rgba(255, 193, 7, 0.1);">
                                <div style="color: #ffc107; font-weight: 600; font-size: 16px;">570</div>
                                <div style="color: #888; font-size: 11px;">光伏 (MW)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 中间：港口地图 + 货物曲线 -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- 港口地图 -->
                    <div style="background: rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 8px; padding: 15px; flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #00ff88;">⚡ 港口实时状态图</h4>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="toggleFlowAnimation()" style="background: none; border: 1px solid #00ff88; color: #00ff88; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                    🔄 货物流转
                                </button>
                                <button onclick="navigateTo('map')" style="background: none; border: 1px solid #00d4ff; color: #00d4ff; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                    详细地图 →
                                </button>
                            </div>
                        </div>
                        <div id="dash-grid-map" style="height: 280px; position: relative;"></div>
                    </div>

                    <!-- 货物曲线 -->
                    <div style="background: rgba(156, 39, 176, 0.05); border: 1px solid rgba(156, 39, 176, 0.2); border-radius: 8px; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #9c27b0;">📈 24小时货物曲线</h4>
                            <button onclick="navigateTo('forecast')" style="background: none; border: 1px solid #9c27b0; color: #9c27b0; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                预测分析 →
                            </button>
                        </div>
                        <div id="dash-load-chart" style="height: 160px;"></div>
                    </div>
                </div>

                <!-- 右侧：健康度 + 设备状态 -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- 健康度仪表盘 -->
                    <div style="background: rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 8px; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #00ff88;">💓 港口健康度</h4>
                            <button onclick="navigateTo('health')" style="background: none; border: 1px solid #00ff88; color: #00ff88; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                详细分析 →
                            </button>
                        </div>
                        <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 48px; font-weight: 900; color: #00ff88; text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);">92.5</div>
                                <div style="color: #a0c4e8; font-size: 12px; margin-top: 5px;">综合健康评分</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div style="text-align: center; padding: 8px; border-radius: 6px; background: rgba(0, 255, 136, 0.1);">
                                <div style="color: #00ff88; font-weight: 600; font-size: 14px;">95%</div>
                                <div style="color: #888; font-size: 10px;">设备健康</div>
                            </div>
                            <div style="text-align: center; padding: 8px; border-radius: 6px; background: rgba(0, 212, 255, 0.1);">
                                <div style="color: #00d4ff; font-weight: 600; font-size: 14px;">88%</div>
                                <div style="color: #888; font-size: 10px;">线路负载</div>
                            </div>
                            <div style="text-align: center; padding: 8px; border-radius: 6px; background: rgba(255, 193, 7, 0.1);">
                                <div style="color: #ffc107; font-weight: 600; font-size: 14px;">99%</div>
                                <div style="color: #888; font-size: 10px;">供电可靠</div>
                            </div>
                            <div style="text-align: center; padding: 8px; border-radius: 6px; background: rgba(156, 39, 176, 0.1);">
                                <div style="color: #9c27b0; font-weight: 600; font-size: 14px;">98%</div>
                                <div style="color: #888; font-size: 10px;">电压合格</div>
                            </div>
                        </div>
                    </div>

                    <!-- 设备状态 -->
                    <div style="background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 8px; padding: 15px; flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #00d4ff;">🏭 关键设备状态</h4>
                            <button onclick="navigateTo('substations')" style="background: none; border: 1px solid #00d4ff; color: #00d4ff; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                全部设备 →
                            </button>
                        </div>
                        <div id="dash-device-list" style="max-height: 200px; overflow-y: auto;">
                            <!-- 设备列表将通过JS动态生成 -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部操作栏 -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-top: 20px;">
                <button onclick="navigateTo('simulation')" style="background: linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(255, 71, 87, 0.1)); border: 1px solid rgba(255, 71, 87, 0.4); border-radius: 8px; padding: 15px; cursor: pointer; color: #ff4757; font-size: 14px; font-weight: 600; transition: all 0.3s;">
                    🚨 故障模拟推演
                </button>
                <button onclick="navigateTo('forecast')" style="background: linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(156, 39, 176, 0.1)); border: 1px solid rgba(156, 39, 176, 0.4); border-radius: 8px; padding: 15px; cursor: pointer; color: #9c27b0; font-size: 14px; font-weight: 600;">
                    📊 货物智能预测
                </button>
                <button onclick="navigateTo('monitoring')" style="background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.1)); border: 1px solid rgba(0, 212, 255, 0.4); border-radius: 8px; padding: 15px; cursor: pointer; color: #00d4ff; font-size: 14px; font-weight: 600;">
                    📈 实时监控中心
                </button>
                <button onclick="navigateTo('topology')" style="background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1)); border: 1px solid rgba(0, 255, 136, 0.4); border-radius: 8px; padding: 15px; cursor: pointer; color: #00ff88; font-size: 14px; font-weight: 600;">
                    🗺️ 港口拓扑分析
                </button>
                <button onclick="startCarousel()" style="background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1)); border: 1px solid rgba(255, 193, 7, 0.4); border-radius: 8px; padding: 15px; cursor: pointer; color: #ffc107; font-size: 14px; font-weight: 600;">
                    🎬 启动演示模式
                </button>
            </div>
        </div>
    `;
    
    // 初始化所有图表和数据
    await initDashboardCharts();
    await loadDashboardAlarms();
    await loadDeviceStatus();
    
    // 启动实时更新
    startRealtimeUpdate();
}

// 页面跳转函数
function navigateTo(page) {
    const menuItem = document.querySelector(`[data-page="${page}"]`);
    if (menuItem) {
        menuItem.click();
    }
}

// 初始化图表
async function initDashboardCharts() {
    const ec = getECharts();
    
    // 货物曲线
    const loadChartDom = document.getElementById('dash-load-chart');
    if (loadChartDom && ec) {
        const loadChart = ec.init(loadChartDom);
        const hours = [];
        const data = [];
        for (let i = 23; i >= 0; i--) {
            const hour = (new Date().getHours() - i + 24) % 24;
            hours.push(hour + ':00');
            data.push(Math.round(1800 + Math.sin((hour - 18) * Math.PI / 12) * 800 + Math.random() * 200));
        }
        loadChart.setOption({
            backgroundColor: 'transparent',
            grid: { left: '8%', right: '5%', top: '10%', bottom: '15%' },
            xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#888', fontSize: 10 } },
            yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#888', fontSize: 10 }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
            series: [{
                type: 'line', smooth: true, data: data,
                lineStyle: { width: 3, color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#00ff88' }, { offset: 1, color: '#00d4ff' }] } },
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0, 255, 136, 0.3)' }, { offset: 1, color: 'rgba(0, 255, 136, 0)' }] } },
                itemStyle: { color: '#00ff88' }
            }]
        });
    }
    
    // 绿色港口出力饼图
    const renewableChartDom = document.getElementById('dash-renewable-chart');
    if (renewableChartDom && ec) {
        const renewableChart = ec.init(renewableChartDom);
        renewableChart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie', radius: ['40%', '70%'], center: ['50%', '50%'],
                data: [
                    { value: 850, name: '风电', itemStyle: { color: '#00d4ff' } },
                    { value: 570, name: '光伏', itemStyle: { color: '#ffc107' } },
                    { value: 180, name: '水电', itemStyle: { color: '#2196f3' } },
                    { value: 70, name: '生物质', itemStyle: { color: '#9c27b0' } }
                ],
                label: { color: '#ccc', fontSize: 10 }
            }]
        });
    }
    
    // 港口地图
    const mapDiv = document.getElementById('dash-grid-map');
    if (mapDiv) {
        renderSimpleGridMap(mapDiv);
    }
}

// 简化的港口地图
function renderSimpleGridMap(container) {
    container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 600 250" style="position: absolute; top: 0; left: 0;">
            <!-- 运输线路 -->
            <line x1="100" y1="80" x2="300" y2="125" stroke="#00d4ff" stroke-width="3" opacity="0.6" class="power-line" />
            <line x1="300" y1="125" x2="500" y2="80" stroke="#00d4ff" stroke-width="3" opacity="0.6" class="power-line" />
            <line x1="100" y1="170" x2="300" y2="125" stroke="#00d4ff" stroke-width="3" opacity="0.6" class="power-line" />
            <line x1="300" y1="125" x2="500" y2="170" stroke="#00d4ff" stroke-width="3" opacity="0.6" class="power-line" />
            <line x1="100" y1="80" x2="100" y2="170" stroke="#00d4ff" stroke-width="3" opacity="0.6" class="power-line" />
            <line x1="500" y1="80" x2="500" y2="170" stroke="#00d4ff" stroke-width="3" opacity="0.6" class="power-line" />
            
            <!-- 码头节点 -->
            <g class="node" onclick="navigateTo('powerplants')" style="cursor: pointer;">
                <circle cx="50" cy="125" r="18" fill="#00ff88" />
                <text x="50" y="129" text-anchor="middle" fill="#000" font-weight="bold" font-size="12">⚡</text>
            </g>
            
            <!-- 泊位节点 -->
            <g class="node" onclick="navigateTo('substations')" style="cursor: pointer;">
                <circle cx="100" cy="80" r="14" fill="#00d4ff" />
                <circle cx="100" cy="170" r="14" fill="#00d4ff" />
                <circle cx="300" cy="125" r="20" fill="#ffc107" />
                <circle cx="500" cy="80" r="14" fill="#00d4ff" />
                <circle cx="500" cy="170" r="14" fill="#00d4ff" />
            </g>
            
            <!-- 绿色港口 -->
            <g class="node" onclick="navigateTo('renewable')" style="cursor: pointer;">
                <circle cx="550" cy="125" r="16" fill="#9c27b0" />
                <text x="550" y="129" text-anchor="middle" fill="#fff" font-weight="bold" font-size="11">🌱</text>
            </g>
            
            <!-- 标签 -->
            <text x="50" y="160" text-anchor="middle" fill="#00ff88" font-size="11">句容电厂</text>
            <text x="300" y="160" text-anchor="middle" fill="#ffc107" font-size="11">南京主变</text>
            <text x="100" y="60" text-anchor="middle" fill="#00d4ff" font-size="10">苏州变</text>
            <text x="500" y="60" text-anchor="middle" fill="#00d4ff" font-size="10">无锡变</text>
        </svg>
    `;
}

// 加载告警列表
async function loadDashboardAlarms() {
    const alarmList = document.getElementById('dash-alarm-list');
    if (!alarmList) return;
    
    const alarms = [
        { level: 'critical', time: '14:32:15', title: '苏州泊位油温过高', device: '2号主变压器' },
        { level: 'warning', time: '14:28:03', title: '无锡变负载率超85%', device: '1号主变压器' },
        { level: 'info', time: '14:15:22', title: '句容电厂出力波动', device: '1号货物装卸机组' },
    ];
    
    alarmList.innerHTML = alarms.map(a => {
        const color = a.level === 'critical' ? '#ff4757' : a.level === 'warning' ? '#ffc107' : '#00d4ff';
        const icon = a.level === 'critical' ? '🔴' : a.level === 'warning' ? '🟡' : '🔵';
        return `
            <div style="background: rgba(${a.level === 'critical' ? '255,71,87' : a.level === 'warning' ? '255,193,7' : '0,212,255'}, 0.1); border-left: 3px solid ${color}; padding: 10px; margin-bottom: 8px; border-radius: 4px; cursor: pointer;" onclick="navigateTo('alarms')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${color}; font-size: 12px; font-weight: 600;">${icon} ${a.title}</span>
                    <span style="color: #888; font-size: 10px;">${a.time}</span>
                </div>
                <div style="color: #888; font-size: 11
px; margin-top: 4px;">${a.device}</div>
            </div>
        `;
    }).join('');
}

// 加载设备状态
async function loadDeviceStatus() {
    const deviceList = document.getElementById('dash-device-list');
    if (!deviceList) return;
    
    const devices = [
        { name: '南京泊位', type: '泊位', status: 'normal', load: '72%' },
        { name: '苏州泊位', type: '泊位', status: 'warning', load: '85%' },
        { name: '无锡泊位', type: '泊位', status: 'normal', load: '68%' },
        { name: '句容码头', type: '码头', status: 'normal', load: '95%' },
        { name: '太仓码头', type: '码头', status: 'normal', load: '88%' },
    ];
    
    deviceList.innerHTML = devices.map(d => {
        const statusColor = d.status === 'normal' ? '#00ff88' : d.status === 'warning' ? '#ffc107' : '#ff4757';
        const statusText = d.status === 'normal' ? '正常' : d.status === 'warning' ? '重载' : '故障';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #1e3a5f; cursor: pointer;" onclick="navigateTo('${d.type === '泊位' ? 'substations' : 'powerplants'}')">
                <div>
                    <div style="color: #e0e6ed; font-size: 13px; font-weight: 600;">${d.name}</div>
                    <div style="color: #888; font-size: 11px;">${d.type} · 负载率 ${d.load}</div>
                </div>
                <span style="color: ${statusColor}; font-size: 11px; padding: 3px 8px; background: rgba(${d.status === 'normal' ? '0,255,136' : d.status === 'warning' ? '255,193,7' : '255,71,87'}, 0.1); border-radius: 4px;">${statusText}</span>
            </div>
        `;
    }).join('');
}

// 货物流转动画
let flowAnimationInterval = null;

function toggleFlowAnimation() {
    if (flowAnimationInterval) {
        clearInterval(flowAnimationInterval);
        flowAnimationInterval = null;
        return;
    }
    
    const lines = document.querySelectorAll('.power-line');
    let step = 0;
    flowAnimationInterval = setInterval(() => {
        step++;
        lines.forEach((line, i) => {
            const opacity = 0.4 + Math.sin((step + i * 0.5) * 0.2) * 0.4;
            line.style.opacity = opacity;
            line.style.strokeWidth = 2 + Math.sin((step + i) * 0.15) * 2;
        });
    }, 50);
}

// 实时更新
function startRealtimeUpdate() {
    setInterval(() => {
        // 模拟实时数据变化
        const loadEl = document.getElementById('dash-total-load');
        if (loadEl) {
            const current = parseInt(loadEl.textContent.replace(/,/g, ''));
            loadEl.textContent = (current + Math.round((Math.random() - 0.5) * 10)).toLocaleString();
        }
    }, 3000);
}

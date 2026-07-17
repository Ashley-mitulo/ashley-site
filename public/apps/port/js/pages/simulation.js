async function render_simulation(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>🚨</span>
            <span>故障模拟与预案推演</span>
        </div>
        
        <div class="card" style="margin-bottom: 30px;">
            <div class="card-header">
                <div class="card-title">故障模拟控制台</div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-danger" onclick="startRandomFault()">
                        <span>🎲</span> 随机故障演练
                    </button>
                    <button class="btn btn-success" onclick="resetSimulation()">
                        <span>🔄</span> 重置系统
                    </button>
                </div>
            </div>
            <div style="padding: 20px; background: rgba(255, 71, 87, 0.05); border-radius: 8px; border-left: 4px solid #ff4757;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div style="font-size: 28px; font-weight: 900; color: #00ff88;" id="sim-substation-count">5</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">运行中泊位</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div style="font-size: 28px; font-weight: 900; color: #00ff88;" id="sim-plant-count">3</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">运行中码头</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div style="font-size: 28px; font-weight: 900; color: #00ff88;" id="sim-line-count">12</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">运行中线路</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div style="font-size: 28px; font-weight: 900; color: #00d4ff;" id="sim-users-count">285,000</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">供电用户数</div>
                    </div>
                </div>
                
                <div id="fault-status-panel" style="display: none;">
                    <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <span style="font-size: 24px; animation: pulse 1s infinite;">⚠️</span>
                            <span style="color: #ff4757; font-weight: 700; font-size: 18px;">故障告警</span>
                        </div>
                        <div id="fault-description" style="color: #e0e6ed; line-height: 1.6;"></div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; margin-bottom: 10px; color: #ffc107;">影响范围分析</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                            <div style="background: rgba(255, 193, 7, 0.1); padding: 12px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #ffc107;" id="affect-substations">-</div>
                                <div style="color: #8ba4c7; font-size: 11px;">影响泊位</div>
                            </div>
                            <div style="background: rgba(255, 193, 7, 0.1); padding: 12px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #ffc107;" id="affect-users">-</div>
                                <div style="color: #8ba4c7; font-size: 11px;">影响用户数</div>
                            </div>
                            <div style="background: rgba(255, 193, 7, 0.1); padding: 12px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #ff9800;" id="affect-lines">-</div>
                                <div style="color: #8ba4c7; font-size: 11px;">受影响线路</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; margin-bottom: 10px; color: #00d4ff;">推荐恢复方案</div>
                        <div id="recovery-plan" style="background: rgba(0, 212, 255, 0.05); border-radius: 6px; padding: 15px; line-height: 1.8; color: #e0e6ed;">
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 15px;">
                        <button class="btn btn-success" onclick="executeRecovery()" style="flex: 1;">
                            <span>✅</span> 执行恢复方案
                        </button>
                        <button class="btn btn-primary" onclick="optimizePlan()" style="flex: 1;">
                            <span>🔧</span> 优化调整方案
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-bottom: 30px;">
            <div class="card-header">
                <div class="card-title">港口拓扑可视化</div>
            </div>
            <div id="simulation-map" style="height: 500px; position: relative;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #8ba4c7;">
                    点击「随机故障演练」开始模拟
                </div>
            </div>
        </div>
        
        <div class="grid grid-2">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">故障历史记录</div>
                </div>
                <div id="fault-history" style="max-height: 300px; overflow-y: auto;">
                    <div style="color: #8ba4c7; text-align: center; padding: 30px;">暂无故障记录</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">应急预案库</div>
                </div>
                <div style="max-height: 300px; overflow-y: auto;">
                    <div style="padding: 12px; border-bottom: 1px solid #1e3a5f;">
                        <div style="font-weight: 600; color: #00ff88;">泊位故障应急预案</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">响应时间: 15分钟 | 预计恢复: 2小时</div>
                    </div>
                    <div style="padding: 12px; border-bottom: 1px solid #1e3a5f;">
                        <div style="font-weight: 600; color: #00d4ff;">线路跳闸应急预案</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">响应时间: 5分钟 | 预计恢复: 30分钟</div>
                    </div>
                    <div style="padding: 12px; border-bottom: 1px solid #1e3a5f;">
                        <div style="font-weight: 600; color: #ffc107;">重载预警应急预案</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">响应时间: 10分钟 | 预计恢复: 1小时</div>
                    </div>
                    <div style="padding: 12px; border-bottom: 1px solid #1e3a5f;">
                        <div style="font-weight: 600; color: #9c27b0;">绿色港口并网友常预案</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">响应时间: 8分钟 | 预计恢复: 45分钟</div>
                    </div>
                    <div style="padding: 12px;">
                        <div style="font-weight: 600; color: #ff4757;">大面积停电应急预案</div>
                        <div style="color: #8ba4c7; font-size: 12px; margin-top: 5px;">响应时间: 3分钟 | 预计恢复: 4小时</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await initSimulationMap();
    window.faultHistory = [];
}

let simulationChart = null;
let currentFault = null;

async function initSimulationMap() {
    const chartDom = document.getElementById('simulation-map');
    if (!chartDom) return;
    
    simulationChart = getECharts().init(chartDom);
    
    // 江苏省简化坐标
    const cityCoords = {
        '南京': [400, 300], '苏州': [650, 380], '无锡': [580, 340],
        '常州': [520, 310], '徐州': [180, 120], '连云港': [320, 80],
        '淮安': [350, 180], '盐城': [480, 140], '扬州': [380, 240],
        '镇江': [420, 280], '泰州': [460, 220], '南通': [550, 280],
        '宿迁': [280, 160], '句容': [410, 320], '太仓': [680, 360]
    };
    
    // 节点数据
    const nodes = [
        { id: 'nanjing', name: '南京泊位', city: '南京', type: 'substation', x: 400, y: 300 },
        { id: 'suzhou', name: '苏州泊位', city: '苏州', type: 'substation', x: 650, y: 380 },
        { id: 'wuxi', name: '无锡泊位', city: '无锡', type: 'substation', x: 580, y: 340 },
        { id: 'changzhou', name: '常州泊位', city: '常州', type: 'substation', x: 520, y: 310 },
        { id: 'xuzhou', name: '徐州泊位', city: '徐州', type: 'substation', x: 180, y: 120 },
        { id: 'jurong', name: '句容码头', city: '句容', type: 'plant', x: 410, y: 320 },
        { id: 'taicang', name: '太仓码头', city: '太仓', type: 'plant', x: 680, y: 360 },
        { id: 'lianyungang', name: '连云港核电站', city: '连云港', type: 'plant', x: 320, y: 80 },
    ];
    
    // 连线数据
    const links = [
        { source: 'jurong', target: 'nanjing' },
        { source: 'jurong', target: 'zhenjiang' },
        { source: 'taicang', target: 'suzhou' },
        { source: 'taicang', target: 'wuxi' },
        { source: 'lianyungang', target: 'xuzhou' },
        { source: 'lianyungang', target: 'yancheng' },
        { source: 'nanjing', target: 'wuxi' },
        { source: 'nanjing', target: 'changzhou' },
        { source: 'suzhou', target: 'wuxi' },
        { source: 'wuxi', target: 'changzhou' },
        { source: 'xuzhou', target: 'suqian' },
        { source: 'xuzhou', target: 'huaian' },
    ];
    
    // 准备图表数据
    const chartNodes = nodes.map(n => ({
        id: n.id,
        name: n.name,
        x: n.x,
        y: n.y,
        symbolSize: n.type === 'plant' ? 40 : 30,
        itemStyle: {
            color: n.type === 'plant' ? '#00ff88' : '#00d4ff',
            shadowBlur: 20,
            shadowColor: n.type === 'plant' ? '#00ff88' : '#00d4ff'
        },
        category: n.type === 'plant' ? 0 : 1
    }));
    
    // 添加更多城市节点
    const moreCities = {
        '扬州': [380, 240], '镇江': [420, 280], '泰州': [460, 220],
        '南通': [550, 280], '盐城': [480, 140], '淮安': [350, 180], '宿迁': [280, 160]
    };
    
    Object.entries(moreCities).forEach(([city, coords]) => {
        chartNodes.push({
            id: city,
            name: city + '变',
            x: coords[0],
            y: coords[1],
            symbolSize: 25,
            itemStyle: {
                color: '#00d4ff',
                shadowBlur: 15,
                shadowColor: '#00d4ff'
            },
            category: 1
        });
    });
    
    const chartLinks = links.map(l => ({
        source: l.source,
        target: l.target,
        lineStyle: {
            color: '#ffc107',
            width: 3,
            opacity: 0.7
        }
    }));
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.dataType === 'node') {
                    return `<div style="padding: 10px;"><strong>${params.name}</strong><br/>状态: 正常运行<br/>点击可模拟故障</div>`;
                }
                return params.name;
            }
        },
        legend: {
            data: ['码头', '泊位'],
            textStyle: { color: '#a0c4e8' },
            top: 10,
            left: 10
        },
        animationDuration: 1500,
        animationEasing: 'quinticInOut',
        series: [{
            type: 'graph',
            layout: 'none',
            roam: true,
            zoom: 1,
            scaleLimit: { min: 0.5, max: 3 },
            label: {
                show: true,
                position: 'bottom',
                color: '#e0e6ed',
                fontSize: 10
            },
            lineStyle: { curveness: 0.1, opacity: 0.7 },
            emphasis: {
                focus: 'adjacency',
                lineStyle: { width: 6 }
            },
            data: chartNodes,
            links: chartLinks,
            categories: [
                { name: '码头', itemStyle: { color: '#00ff88' } },
                { name: '泊位', itemStyle: { color: '#00d4ff' } }
            ]
        }]
    };
    
    simulationChart.setOption(option);
    window.simulationChart = simulationChart;
    
    // 绑定点击事件
    simulationChart.on('click', function(params) {
        if (params.dataType === 'node') {
            simulateNodeFault(params.data.id, params.data.name);
        }
    });
}

function simulateNodeFault(nodeId, nodeName) {
    if (!window.simulationChart) return;
    
    const option = window.simulationChart.getOption();
    const series = Array.isArray(option.series) ? option.series : [option.series];
    const graphSeries = series[0];
    
    if (!graphSeries || !graphSeries.data) return;
    
    // 找到并标记故障节点
    const faultNode = graphSeries.data.find(n => n.id === nodeId);
    if (faultNode) {
        faultNode.itemStyle.color = '#ff4757';
        faultNode.itemStyle.shadowColor = '#ff4757';
        faultNode.itemStyle.shadowBlur = 40;
        
        // 标记受影响的连线
        if (graphSeries.links) {
            graphSeries.links.forEach(link => {
                if (link.source === nodeId || link.target === nodeId) {
                    link.lineStyle.color = '#ff4757';
                    link.lineStyle.width = 5;
                }
            });
        }
        
        window.simulationChart.setOption(option);
        
        // 显示故障面板
        showFaultPanel(nodeName, faultNode.category === 0 ? '码头' : '泊位');
    }
}

function startRandomFault() {
    if (!window.simulationChart) return;
    
    const option = window.simulationChart.getOption();
    const series = Array.isArray(option.series) ? option.series : [option.series];
    const graphSeries = series[0];
    
    if (!graphSeries || !graphSeries.data) return;
    
    // 随机选一个节点
    const nodes = graphSeries.data;
    const randomIndex = Math.floor(Math.random() * nodes.length);
    const randomNode = nodes[randomIndex];
    
    simulateNodeFault(randomNode.id, randomNode.name);
}

function showFaultPanel(nodeName, nodeType) {
    const panel = document.getElementById('fault-status-panel');
    if (!panel) return;
    
    panel.style.display = 'block';
    
    // 故障描述
    const faultTypes = [
        '主变压器油温过高告警',
        '开关设备SF6气体压力低告警',
        '线路过流保护动作跳闸',
        '母线电压异常',
        '通信通道中断',
        '继电保护装置告警'
    ];
    
    const faultDesc = document.getElementById('fault-description');
    const faultType = faultTypes[Math.floor(Math.random() * faultTypes.length)];
    faultDesc.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>故障设备:</strong> ${nodeName} (${nodeType})</div>
        <div style="margin-bottom: 8px;"><strong>故障类型:</strong> ${faultType}</div>
        <div style="margin-bottom: 8px;"><strong>故障等级:</strong> <span style="color: #ff4757; font-weight: 600;">二级告警</span></div>
        <div style="margin-bottom: 8px;"><strong>发生时间:</strong> ${new Date().toLocaleString()}</div>
    `;
    
    // 随机影响范围
    const affectSubstations = Math.floor(Math.random() * 3) + 1;
    const affectUsers = Math.floor(Math.random() * 50000) + 20000;
    const affectLines = Math.floor(Math.random() * 4) + 2;
    
    document.getElementById('affect-substations').textContent = affectSubstations + ' 座';
    document.getElementById('affect-users').textContent = affectUsers.toLocaleString() + ' 户';
    document.getElementById('affect-lines').textContent = affectLines + ' 条';
    
    // 恢复方案
    document.getElementById('recovery-plan').innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="background: #00ff88; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">步骤 1</span>
            <span>立即切断 ${nodeName} 相关供电开关，隔离故障区域</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="background: #00ff88; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">步骤 2</span>
            <span>启动备用电源和应急货物装卸车，优先恢复重要用户供电</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="background: #00d4ff; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">步骤 3</span>
            <span>调度中心远程调整港口运行方式，转供非故障区域货物</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="background: #ffc107; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">步骤 4</span>
            <span>运维人员现场排查故障点，制定修复方案 (预计 2 小时)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #9c27b0; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">预计</span>
            <span>全面恢复供电: <strong>3 小时 15 分钟</strong></span>
        </div>
    `;
    
    // 添加到历史记录
    addToFaultHistory(nodeName, nodeType, faultType);
    
    currentFault = { nodeId: nodeName, nodeType: nodeType };
}

function executeRecovery() {
    if (!currentFault) {
        alert('当前无进行中的故障模拟');
        return;
    }
    
    if (!confirm('确认执行故障恢复方案？')) return;
    
    alert('恢复方案已启动！\n\n1. 故障隔离指令已下发 ✓\n2. 备用电源已启动 ✓\n3. 港口转供方案已执行\n\n预计 3 小时 15 分钟后全面恢复');
}

function optimizePlan() {
    alert('方案优化中...\n\n已优化转供路径，预计恢复时间缩短 15 分钟\n新增 2 台应急货物装卸车，重要用户恢复时间提前');
}

function resetSimulation() {
    if (!window.simulationChart) return;
    
    const option = window.simulationChart.getOption();
    const series = Array.isArray(option.series) ? option.series : [option.series];
    const graphSeries = series[0];
    
    // 重置所有节点颜色
    if (graphSeries.data) {
        graphSeries.data.forEach(node => {
            if (node.category === 0) {
                node.itemStyle.color = '#00ff88';
                node.itemStyle.shadowColor = '#00ff88';
            } else {
                node.itemStyle.color = '#00d4ff';
                node.itemStyle.shadowColor = '#00d4ff';
            }
            node.itemStyle.shadowBlur = 20;
        });
    }
    
    // 重置所有连线
    if (graphSeries.links) {
        graphSeries.links.forEach(link => {
            link.lineStyle.color = '#ffc107';
            link.lineStyle.width = 3;
        });
    }
    
    window.simulationChart.setOption(option);
    
    // 隐藏故障面板
    const panel = document.getElementById('fault-status-panel');
    if (panel) panel.style.display = 'none';
    
    currentFault = null;
}

function addToFaultHistory(nodeName, nodeType, faultType) {
    const historyDiv = document.getElementById('fault-history');
    if (!historyDiv) return;
    
    if (!window.faultHistory) window.faultHistory = [];
    
    window.faultHistory.unshift({
        time: new Date().toLocaleString(),
        node: nodeName,
        type: nodeType,
        fault: faultType,
        status: '处理中'
    });
    
    historyDiv.innerHTML = window.faultHistory.map((item, i) => `
        <div style="padding: 12px; border-bottom: 1px solid #1e3a5f;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-weight: 600; color: #e0e6ed;">${item.node}</span>
                <span style="color: #ffc107; font-size: 11px; padding: 2px 8px; background: rgba(255, 193, 7, 0.1); border-radius: 4px;">${item.status}</span>
            </div>
            <div style="font-size: 12px; color: #8ba4c7; margin-bottom: 3px;">${item.fault}</div>
            <div style="font-size: 11px; color: #546e7a;">${item.time}</div>
        </div>
    `).join('');
}

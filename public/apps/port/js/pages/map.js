async function render_map(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>🗺️</span>
            <span>江苏港口地图</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px;">
            <div class="card" style="height: 600px;">
                <div class="card-header">
                    <div class="card-title">江苏省港口地理分布图</div>
                    <div style="display: flex; gap: 15px;">
                        <button class="btn btn-primary btn-sm" onclick="toggleMapAnimation('spread')">
                            <span>🔵</span> 扩散动画
                        </button>
                        <button class="btn btn-success btn-sm" onclick="toggleMapAnimation('flow')">
                            <span>⚡</span> 货物流转
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="toggleMapAnimation('all')">
                            <span>✨</span> 全部动画
                        </button>
                    </div>
                </div>
                <div id="map-chart" style="height: 520px;"></div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">图例说明</div>
                    </div>
                    <div style="padding: 10px 0;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                            <div style="width: 16px; height: 16px; background: #00d4ff; border-radius: 50%; box-shadow: 0 0 10px #00d4ff;"></div>
                            <span>泊位</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                            <div style="width: 16px; height: 16px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 10px #00ff88;"></div>
                            <span>码头</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                            <div style="width: 30px; height: 3px; background: linear-gradient(90deg, #ffc107, #00ff88);"></div>
                            <span>运输线路</span>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">实时货物</div>
                    </div>
                    <div id="load-list">
                        加载中...
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">货物装卸出力</div>
                    </div>
                    <div id="power-list">
                        加载中...
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await renderJiangsuMap();
    await loadSidebarData();
}

let mapChart = null;
let animationInterval = null;

// 江苏省城市相对坐标
const jiangsuCities = {
    '南京': { x: 400, y: 300 },
    '苏州': { x: 650, y: 380 },
    '无锡': { x: 580, y: 340 },
    '常州': { x: 520, y: 310 },
    '徐州': { x: 180, y: 120 },
    '连云港': { x: 320, y: 80 },
    '淮安': { x: 350, y: 180 },
    '盐城': { x: 480, y: 140 },
    '扬州': { x: 380, y: 240 },
    '镇江': { x: 420, y: 280 },
    '泰州': { x: 460, y: 220 },
    '南通': { x: 550, y: 280 },
    '宿迁': { x: 280, y: 160 },
    '句容': { x: 410, y: 320 },
    '太仓': { x: 680, y: 360 }
};

async function renderJiangsuMap() {
    const chartDom = document.getElementById('map-chart');
    if (!chartDom) return;
    
    mapChart = echarts.init(chartDom);
    
    // 获取泊位和码头数据
    const [substations, plants] = await Promise.all([
        API.grid.substations(),
        API.grid.powerPlants()
    ]);
    
    const substationData = substations.success ? substations.data : [];
    const plantData = plants.success ? plants.data : [];
    
    // 准备节点数据
    const nodes = [];
    const links = [];
    
    // 添加泊位节点
    substationData.forEach((s, i) => {
        const pos = jiangsuCities[s.city] || jiangsuCities['南京'];
        nodes.push({
            id: 'sub_' + s.id,
            name: s.name,
            x: pos.x + (Math.random() - 0.5) * 30,
            y: pos.y + (Math.random() - 0.5) * 30,
            value: s.capacity,
            category: 0,
            symbolSize: Math.max(30, s.capacity / 40),
            itemStyle: { 
                color: '#00d4ff',
                shadowBlur: 15,
                shadowColor: '#00d4ff'
            }
        });
    });
    
    // 添加码头节点
    plantData.forEach((p, i) => {
        const pos = jiangsuCities[p.city] || jiangsuCities['南京'];
        nodes.push({
            id: 'plant_' + p.id,
            name: p.name,
            x: pos.x + (Math.random() - 0.5) * 20,
            y: pos.y + (Math.random() - 0.5) * 20,
            value: p.current_output,
            category: 1,
            symbolSize: Math.max(40, p.current_output / 60),
            itemStyle: { 
                color: '#00ff88',
                shadowBlur: 20,
                shadowColor: '#00ff88'
            }
        });
    });
    
    // 码头连接到泊位
    plantData.forEach((p, pi) => {
        substationData.forEach((s, si) => {
            if (si < 2) {
                links.push({
                    source: 'plant_' + p.id,
                    target: 'sub_' + s.id,
                    lineStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: [
                                { offset: 0, color: '#00ff88' },
                                { offset: 1, color: '#00d4ff' }
                            ]
                        },
                        width: 3
                    }
                });
            }
        });
    });
    
    // 泊位之间连接
    for (let i = 0; i < substationData.length; i++) {
        for (let j = i + 1; j < Math.min(i + 3, substationData.length); j++) {
            links.push({
                source: 'sub_' + substationData[i].id,
                target: 'sub_' + substationData[j].id,
                lineStyle: {
                    color: '#ffc107',
                    width: 2
                }
            });
        }
    }
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.dataType === 'node') {
                    const data = params.data;
                    if (data.category === 0) {
                        return `
                            <div style="padding: 10px;">
                                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #00d4ff;">
                                    ${data.name}
                                </div>
                                <div>变电容量: ${data.value} MW</div>
                                <div>运行状态: <span style="color: #00ff88;">正常运行</span></div>
                            </div>
                        `;
                    } else {
                        return `
                            <div style="padding: 10px;">
                                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #00ff88;">
                                    ${data.name}
                                </div>
                                <div>实时出力: <span style="color: #00ff88; font-weight: bold;">${data.value} MW</span></div>
                            </div>
                        `;
                    }
                }
                return params.name;
            }
        },
        legend: {
            data: ['泊位', '码头'],
            textStyle: { color: '#a0c4e8' },
            top: 10,
            left: 10
        },
        animationDuration: 1500,
        animationEasing: 'quinticInOut',
        series: [
            {
                type: 'graph',
                layout: 'none',
                roam: true,
                zoom: 1,
                scaleLimit: {
                    min: 0.5,
                    max: 3
                },
                label: {
                    show: true,
                    position: 'bottom',
                    color: '#e0e6ed',
                    fontSize: 10,
                    formatter: '{b}'
                },
                lineStyle: {
                    curveness: 0.1,
                    opacity: 0.7
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 5
                    },
                    itemStyle: {
                        shadowBlur: 30
                    }
                },
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: 6,
                data: nodes,
                links: links,
                categories: [
                    { name: '泊位', itemStyle: { color: '#00d4ff' } },
                    { name: '码头', itemStyle: { color: '#00ff88' } }
                ]
            }
        ]
    };
    
    mapChart.setOption(option);
    window.addEventListener('resize', () => mapChart.resize());
    
    // 启动持续动画
    startMapAnimation();
}

function startMapAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    
    animationInterval = setInterval(() => {
        if (!mapChart) return;
        
        const option = mapChart.getOption();
        if (!option || !option.series) return;
        
        const series = Array.isArray(option.series) ? option.series : [option.series];
        const graphSeries = series.find(s => s.type === 'graph');
        
        if (graphSeries && graphSeries.data) {
            const data = Array.isArray(graphSeries.data) ? graphSeries.data : [graphSeries.data];
            data.forEach((node, idx) => {
                if (node.itemStyle) {
                    node.itemStyle.shadowBlur = 15 + Math.sin(Date.now() / 500 + idx) * 10;
                }
            });
            mapChart.setOption(option);
        }
    }, 100);
}

function toggleMapAnimation(type) {
    if (!mapChart) return;
    
    const option = mapChart.getOption();
    if (!option || !option.series) return;
    
    const series = Array.isArray(option.series) ? option.series : [option.series];
    const graphSeries = series.find(s => s.type === 'graph');
    
    if (!graphSeries) return;
    
    switch(type) {
        case 'spread':
            // 增强扩散动画
            if (graphSeries.data) {
                const nodes = Array.isArray(graphSeries.data) ? graphSeries.data : [graphSeries.data];
                nodes.forEach(node => {
                    if (node.itemStyle) {
                        node.itemStyle.shadowBlur = 35;
                    }
                });
            }
            break;
            
        case 'flow':
            // 增强流动动画
            if (graphSeries.links) {
                const links = Array.isArray(graphSeries.links) ? graphSeries.links : [graphSeries.links];
                links.forEach(link => {
                    if (link.lineStyle) {
                        link.lineStyle.width = 5;
                    }
                });
            }
            break;
            
        case 'all':
            // 全部动画增强
            if (graphSeries.data) {
                const nodes = Array.isArray(graphSeries.data) ? graphSeries.data : [graphSeries.data];
                nodes.forEach(node => {
                    if (node.itemStyle) {
                        node.itemStyle.shadowBlur = 30;
                    }
                });
            }
            if (graphSeries.links) {
                const links = Array.isArray(graphSeries.links) ? graphSeries.links : [graphSeries.links];
                links.forEach(link => {
                    if (link.lineStyle) {
                        link.lineStyle.width = 4;
                    }
                });
            }
            break;
    }
    
    mapChart.setOption(option);
    
    // 3秒后恢复正常
    setTimeout(() => {
        if (mapChart) {
            const opt = mapChart.getOption();
            if (!opt || !opt.series) return;
            
            const seriesArray = Array.isArray(opt.series) ? opt.series : [opt.series];
            const graph = seriesArray.find(s => s.type === 'graph');
            
            if (graph) {
                if (graph.data) {
                    const nodes = Array.isArray(graph.data) ? graph.data : [graph.data];
                    nodes.forEach(node => {
                        if (node.itemStyle) {
                            node.itemStyle.shadowBlur = 15;
                        }
                    });
                }
                if (graph.links) {
                    const links = Array.isArray(graph.links) ? graph.links : [graph.links];
                    links.forEach(link => {
                        if (link.lineStyle) {
                            link.lineStyle.width = 2;
                        }
                    });
                }
            }
            mapChart.setOption(opt);
        }
    }, 3000);
}

async function loadSidebarData() {
    const [substations, plants] = await Promise.all([
        API.grid.substations(),
        API.grid.powerPlants()
    ]);
    
    const substationData = substations.success ? substations.data : [];
    const plantData = plants.success ? plants.data : [];
    
    // 渲染货物列表
    const loadList = document.getElementById('load-list');
    if (loadList) {
        loadList.innerHTML = substationData.map(s => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1e3a5f;">
                <span>${s.name}</span>
                <span style="color: #00d4ff; font-weight: 600;">${s.capacity} MW</span>
            </div>
        `).join('');
    }
    
    // 渲染货物装卸列表
    const powerList = document.getElementById('power-list');
    if (powerList) {
        powerList.innerHTML = plantData.map(p => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1e3a5f;">
                <span>${p.name}</span>
                <span style="color: #00ff88; font-weight: 600;">${p.current_output} MW</span>
            </div>
        `).join('');
    }
}

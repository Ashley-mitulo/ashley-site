async function render_renewable(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>🌱</span>
            <span>绿色港口接入展示</span>
        </div>
        
        <div class="grid grid-4" style="margin-bottom: 30px;">
            <div class="card stat-card" style="border-left: 4px solid #00ff88;">
                <div class="stat-value" id="total-renewable-capacity">2,850</div>
                <div class="stat-label">总装机容量 (MW)</div>
                <div class="stat-trend" style="color: #00ff88;">↑ 12.5% 同比增长</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid #00d4ff;">
                <div class="stat-value" id="wind-capacity">1,680</div>
                <div class="stat-label">风电 (MW)</div>
                <div class="stat-trend" style="color: #00d4ff;">占比 58.9%</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid #ffc107;">
                <div class="stat-value" id="solar-capacity">920</div>
                <div class="stat-label">光伏 (MW)</div>
                <div class="stat-trend" style="color: #ffc107;">占比 32.3%</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid #9c27b0;">
                <div class="stat-value" id="other-capacity">250</div>
                <div class="stat-label">其他绿色港口 (MW)</div>
                <div class="stat-trend" style="color: #9c27b0;">占比 8.8%</div>
            </div>
        </div>
        
        <div class="grid grid-2" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">绿色港口消纳占比</div>
                </div>
                <div id="renewable-pie-chart" style="height: 320px;"></div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">出力趋势（近24小时）</div>
                </div>
                <div id="renewable-trend-chart" style="height: 320px;"></div>
            </div>
        </div>
        
        <div class="card" style="margin-bottom: 30px;">
            <div class="card-header">
                <div class="card-title">绿色港口货物装卸场分布</div>
                <div style="display: flex; gap: 15px;">
                    <button class="btn btn-success btn-sm" onclick="toggleRenewableAnimation('flow')">
                        <span>⚡</span> 货物流转动画
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="toggleRenewableAnimation('all')">
                        <span>✨</span> 全部特效
                    </button>
                </div>
            </div>
            <div id="renewable-map-chart" style="height: 550px;"></div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="card-title">绿色港口电站详情</div>
            </div>
            <div style="overflow-x: auto;">
                <table class="table" id="renewable-table">
                    <thead>
                        <tr>
                            <th>电站名称</th>
                            <th>类型</th>
                            <th>所在城市</th>
                            <th>装机容量 (MW)</th>
                            <th>实时出力 (MW)</th>
                            <th>货物装卸占比</th>
                            <th>运行状态</th>
                        </tr>
                    </thead>
                    <tbody id="renewable-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await renderRenewableCharts();
    await loadRenewableTable();
    
    // 启动数字滚动动画
    animateNumberCards();
}

function animateNumberCards() {
    const cards = [
        { id: 'total-renewable-capacity', end: 2850 },
        { id: 'wind-capacity', end: 1680 },
        { id: 'solar-capacity', end: 920 },
        { id: 'other-capacity', end: 250 }
    ];
    
    cards.forEach(card => {
        const el = document.getElementById(card.id);
        if (!el) return;
        
        let start = 0;
        const duration = 2000;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (card.end - start) * easeProgress);
            
            el.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    });
}

async function renderRenewableCharts() {
    // 绿色港口消纳占比饼图
    const pieChartDom = document.getElementById('renewable-pie-chart');
    if (pieChartDom) {
        const pieChart = getECharts().init(pieChartDom);
        pieChart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} MW ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { color: '#a0c4e8' }
            },
            series: [
                {
                    type: 'pie',
                    radius: ['30%', '60%'],
                    center: ['40%', '50%'],
                    roseType: 'radius',
                    itemStyle: {
                        borderRadius: 12,
                        borderColor: '#0f1929',
                        borderWidth: 3
                    },
                    label: {
                        color: '#a0c4e8',
                        fontSize: 12
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold'
                        },
                        itemStyle: {
                            shadowBlur: 20,
                            shadowColor: 'rgba(0, 255, 136, 0.5)'
                        }
                    },
                    data: [
                        { value: 1680, name: '风力货物装卸', itemStyle: { color: '#00d4ff' } },
                        { value: 920, name: '光伏货物装卸', itemStyle: { color: '#ffc107' } },
                        { value: 180, name: '水力货物装卸', itemStyle: { color: '#2196f3' } },
                        { value: 70, name: '生物质能', itemStyle: { color: '#9c27b0' } },
                        { value: 4500, name: '传统火电', itemStyle: { color: '#546e7a' } }
                    ]
                }
            ]
        });
    }
    
    // 出力趋势图
    const trendChartDom = document.getElementById('renewable-trend-chart');
    if (trendChartDom) {
        const trendChart = getECharts().init(trendChartDom);
        
        // 生成24小时数据
        const hours = [];
        const windData = [];
        const solarData = [];
        
        for (let i = 0; i < 24; i++) {
            hours.push(i + ':00');
            // 风电：夜间出力较高
            const windBase = i < 6 || i > 20 ? 1400 : 900;
            windData.push(windBase + Math.random() * 300);
            
            // 光伏：只有白天出力
            const solarBase = i >= 6 && i <= 18 ? 800 : 50;
            solarData.push(Math.max(0, solarBase + Math.random() * 200 - 100));
        }
        
        trendChart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['风电出力', '光伏出力'],
                textStyle: { color: '#a0c4e8' },
                top: 10
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: hours,
                axisLine: { lineStyle: { color: '#1e3a5f' } },
                axisLabel: { color: '#a0c4e8' }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#1e3a5f' } },
                axisLabel: { color: '#a0c4e8' },
                splitLine: { lineStyle: { color: '#1e3a5f' } }
            },
            series: [
                {
                    name: '风电出力',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    stack: 'Total',
                    data: windData,
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(0, 212, 255, 0.4)' },
                                { offset: 1, color: 'rgba(0, 212, 255, 0)' }
                            ]
                        }
                    },
                    lineStyle: {
                        width: 3,
                        color: '#00d4ff'
                    },
                    itemStyle: {
                        color: '#00d4ff',
                        shadowBlur: 10,
                        shadowColor: '#00d4ff'
                    }
                },
                {
                    name: '光伏出力',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    stack: 'Total',
                    data: solarData,
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(255, 193, 7, 0.4)' },
                                { offset: 1, color: 'rgba(255, 193, 7, 0)' }
                            ]
                        }
                    },
                    lineStyle: {
                        width: 3,
                        color: '#ffc107'
                    },
                    itemStyle: {
                        color: '#ffc107',
                        shadowBlur: 10,
                        shadowColor: '#ffc107'
                    }
                }
            ]
        });
    }
    
    // 绿色港口地图分布
    const mapChartDom = document.getElementById('renewable-map-chart');
    if (mapChartDom) {
        const mapChart = getECharts().init(mapChartDom);
        
        // 江苏省城市坐标（简化版）
        const cityCoords = {
            '南京': [400, 300], '苏州': [650, 380], '无锡': [580, 340],
            '常州': [520, 310], '徐州': [180, 120], '连云港': [320, 80],
            '淮安': [350, 180], '盐城': [480, 140], '扬州': [380, 240],
            '镇江': [420, 280], '泰州': [460, 220], '南通': [550, 280],
            '宿迁': [280, 160], '句容': [410, 320], '太仓': [680, 360]
        };
        
        // 绿色港口电站数据
        const powerPlants = [
            { name: '盐城风电场', city: '盐城', type: 'wind', capacity: 450, output: 380 },
            { name: '南通风电场', city: '南通', type: 'wind', capacity: 380, output: 320 },
            { name: '连云港风电场', city: '连云港', type: 'wind', capacity: 420, output: 365 },
            { name: '徐州风电场', city: '徐州', type: 'wind', capacity: 350, output: 290 },
            { name: '苏州光伏电站', city: '苏州', type: 'solar', capacity: 280, output: 245 },
            { name: '无锡光伏电站', city: '无锡', type: 'solar', capacity: 220, output: 195 },
            { name: '常州光伏电站', city: '常州', type: 'solar', capacity: 180, output: 158 },
            { name: '南通光伏电站', city: '南通', type: 'solar', capacity: 240, output: 210 },
            { name: '泰州水电站', city: '泰州', type: 'hydro', capacity: 120, output: 105 },
            { name: '扬州生物质电站', city: '扬州', type: 'bio', capacity: 70, output: 58 },
        ];
        
        // 准备节点数据
        const nodes = powerPlants.map((plant, i) => {
            const pos = cityCoords[plant.city] || [400, 300];
            const color = plant.type === 'wind' ? '#00d4ff' : 
                         plant.type === 'solar' ? '#ffc107' :
                         plant.type === 'hydro' ? '#2196f3' : '#9c27b0';
            return {
                id: 'plant_' + i,
                name: plant.name,
                x: pos[0] + (Math.random() - 0.5) * 40,
                y: pos[1] + (Math.random() - 0.5) * 40,
                value: plant.capacity,
                type: plant.type,
                output: plant.output,
                symbolSize: Math.max(25, plant.capacity / 15),
                itemStyle: {
                    color: color,
                    shadowBlur: 20,
                    shadowColor: color
                }
            };
        });
        
        // 准备连线（码头到主要城市泊位）
        const links = [];
        const targetCities = ['南京', '苏州', '无锡', '常州'];
        nodes.forEach(source => {
            if (Math.random() > 0.3) {
                const targetCity = targetCities[Math.floor(Math.random() * targetCities.length)];
                const targetPos = cityCoords[targetCity];
                links.push({
                    source: source.id,
                    target: 'city_' + targetCity,
                    lineStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: [
                                { offset: 0, color: source.itemStyle.color },
                                { offset: 1, color: '#00ff88' }
                            ]
                        },
                        width: 3,
                        opacity: 0.6
                    }
                });
            }
        });
        
        // 添加城市节点（接收端）
        targetCities.forEach(city => {
            const pos = cityCoords[city];
            nodes.push({
                id: 'city_' + city,
                name: city,
                x: pos[0],
                y: pos[1],
                value: 0,
                type: 'city',
                symbolSize: 30,
                itemStyle: {
                    color: '#00ff88',
                    shadowBlur: 25,
                    shadowColor: '#00ff88'
                }
            });
        });
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (params.dataType === 'node') {
                        const data = params.data;
                        if (data.type === 'city') {
                            return `<div style="padding: 10px;"><strong style="color: #00ff88;">${data.name}</strong><br/>货物接收节点</div>`;
                        } else {
                            const typeName = data.type === 'wind' ? '风电场' : 
                                            data.type === 'solar' ? '光伏电站' :
                                            data.type === 'hydro' ? '水电站' : '生物质电站';
                            return `<div style="padding: 10px;"><strong style="color: #00d4ff;">${data.name}</strong><br/>类型: ${typeName}<br/>装机容量: ${data.value} MW<br/>实时出力: ${data.output} MW</div>`;
                        }
                    }
                    return params.name;
                }
            },
            legend: {
                data: ['风电场', '光伏电站', '水电站', '生物质电站', '货物节点'],
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
                            width: 6
                        }
                    },
                    data: nodes,
                    links: links,
                    categories: [
                        { name: '风电场', itemStyle: { color: '#00d4ff' } },
                        { name: '光伏电站', itemStyle: { color: '#ffc107' } },
                        { name: '水电站', itemStyle: { color: '#2196f3' } },
                        { name: '生物质电站', itemStyle: { color: '#9c27b0' } },
                        { name: '货物节点', itemStyle: { color: '#00ff88' } }
                    ]
                }
            ]
        };
        
        mapChart.setOption(option);
        
        // 绑定到全局变量供动画函数使用
        window.renewableMapChart = mapChart;
    }
}

async function loadRenewableTable() {
    const tableBody = document.getElementById('renewable-table-body');
    if (!tableBody) return;
    
    const plantData = [
        { name: '盐城风电场', type: '风电', city: '盐城', capacity: 450, output: 380, ratio: 84.4, status: '正常运行' },
        { name: '南通风电场', type: '风电', city: '南通', capacity: 380, output: 320, ratio: 84.2, status: '正常运行' },
        { name: '连云港风电场', type: '风电', city: '连云港', capacity: 420, output: 365, ratio: 86.9, status: '正常运行' },
        { name: '徐州风电场', type: '风电', city: '徐州', capacity: 350, output: 290, ratio: 82.9, status: '正常运行' },
        { name: '苏州光伏电站', type: '光伏', city: '苏州', capacity: 280, output: 245, ratio: 87.5, status: '正常运行' },
        { name: '无锡光伏电站', type: '光伏', city: '无锡', capacity: 220, output: 195, ratio: 88.6, status: '正常运行' },
        { name: '常州光伏电站', type: '光伏', city: '常州', capacity: 180, output: 158, ratio: 87.8, status: '出力受限' },
        { name: '南通光伏电站', type: '光伏', city: '南通', capacity: 240, output: 210, ratio: 87.5, status: '正常运行' },
        { name: '泰州水电站', type: '水电', city: '泰州', capacity: 120, output: 105, ratio: 87.5, status: '正常运行' },
        { name: '扬州生物质电站', type: '生物质能', city: '扬州', capacity: 70, output: 58, ratio: 82.9, status: '正常运行' },
    ];
    
    tableBody.innerHTML = plantData.map(item => {
        const statusColor = item.status === '正常运行' ? '#00ff88' : '#ffc107';
        const ratioColor = item.ratio >= 85 ? '#00ff88' : item.ratio >= 75 ? '#ffc107' : '#ff4757';
        return `<tr>
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td>${item.city}</td>
            <td style="color: #00d4ff; font-weight: 600;">${item.capacity}</td>
            <td style="color: #00ff88; font-weight: 600;">${item.output}</td>
            <td style="color: ${ratioColor}; font-weight: 600;">${item.ratio}%</td>
            <td style="color: ${statusColor}; font-weight: 600;">${item.status}</td>
        </tr>`;
    }).join('');
}

function toggleRenewableAnimation(type) {
    const chart = window.renewableMapChart;
    if (!chart) return;
    
    const option = chart.getOption();
    if (!option || !option.series) return;
    
    const series = Array.isArray(option.series) ? option.series : [option.series];
    const graphSeries = series.find(s => s.type === 'graph');
    if (!graphSeries) return;
    
    switch(type) {
        case 'flow':
            // 粒子流动动画效果 - 通过修改线条透明度模拟
            if (graphSeries.links) {
                const links = Array.isArray(graphSeries.links) ? graphSeries.links : [graphSeries.links];
                let step = 0;
                const interval = setInterval(() => {
                    step++;
                    links.forEach((link, i) => {
                        const offset = (Math.sin((step + i * 0.5) * 0.1) + 1) / 2;
                        link.lineStyle.opacity = 0.4 + offset * 0.6;
                    });
                    chart.setOption(option);
                }, 100);
                
                setTimeout(() => clearInterval(interval), 3000);
            }
            break;
            
        case 'all':
            // 全部特效：节点发光 + 线条流动
            if (graphSeries.data) {
                const nodes = Array.isArray(graphSeries.data) ? graphSeries.data : [graphSeries.data];
                let step = 0;
                const interval = setInterval(() => {
                    step++;
                    nodes.forEach((node, i) => {
                        const pulse = 15 + Math.sin((step + i * 0.3) * 0.15) * 10;
                        if (node.itemStyle) {
                            node.itemStyle.shadowBlur = pulse;
                        }
                    });
                    chart.setOption(option);
                }, 80);
                
                setTimeout(() => clearInterval(interval), 4000);
            }
            break;
    }
}
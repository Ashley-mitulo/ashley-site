async function render_topology(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>🗺️</span>
            <span>港口拓扑</span>
        </div>
        <div class="card">
            <div class="card-header">
                <div class="card-title">江苏地区港口拓扑图</div>
                <div class="topology-legend">
                    <div class="legend-item">
                        <div class="legend-icon substation"></div>
                        <span>泊位</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-icon powerplant"></div>
                        <span>码头</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-icon line"></div>
                        <span>运输线路</span>
                    </div>
                </div>
            </div>
            <div id="topology-chart" class="chart-container large"></div>
        </div>
    `;
    
    await loadTopologyData();
}

async function loadTopologyData() {
    const [substationsResult, plantsResult, linesResult] = await Promise.all([
        API.grid.substations(),
        API.grid.powerPlants(),
        API.grid.transmissionLines()
    ]);
    
    const substations = substationsResult.success ? substationsResult.data : [];
    const powerPlants = plantsResult.success ? plantsResult.data : [];
    const lines = linesResult.success ? linesResult.data : [];
    
    renderTopologyChart(substations, powerPlants, lines);
}

function renderTopologyChart(substations, powerPlants, lines) {
    const chartDom = document.getElementById('topology-chart');
    const chart = echarts.init(chartDom);
    
    const nodes = [];
    const links = [];
    const categories = [
        { name: '泊位', itemStyle: { color: '#00d4ff' } },
        { name: '码头', itemStyle: { color: '#00ff88' } }
    ];
    
    const centerX = 600;
    const centerY = 350;
    const radius = 200;
    
    substations.forEach((s, i) => {
        const angle = (i / substations.length) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
            id: 'sub_' + s.id,
            name: s.name,
            category: 0,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            symbolSize: 40,
            value: s.capacity,
            itemStyle: { color: '#00d4ff' }
        });
    });
    
    powerPlants.forEach((p, i) => {
        nodes.push({
            id: 'plant_' + p.id,
            name: p.name,
            category: 1,
            x: centerX,
            y: centerY - 100 + i * 100,
            symbolSize: 50,
            value: p.capacity,
            itemStyle: { color: '#00ff88' }
        });
    });
    
    lines.forEach(l => {
        const fromNode = nodes.find(n => n.id === 'sub_' + l.from_station_id);
        const toNode = nodes.find(n => n.id === 'sub_' + l.to_station_id);
        if (fromNode && toNode) {
            links.push({
                source: fromNode.id,
                target: toNode.id,
                name: l.name,
                value: l.current_load,
                lineStyle: {
                    width: 3,
                    color: l.status === 'normal' ? '#ffc107' : '#ff4444'
                }
            });
        }
    });
    
    if (powerPlants.length > 0 && substations.length > 0) {
        links.push({
            source: 'plant_1',
            target: 'sub_1',
            name: '厂站连线',
            lineStyle: { width: 4, color: '#00ff88' }
        });
    }
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.dataType === 'node') {
                    return `<strong>${params.name}</strong><br/>容量: ${params.value} MW`;
                } else if (params.dataType === 'edge') {
                    return `<strong>${params.name}</strong><br/>货物: ${params.value} MW`;
                }
                return params.name;
            }
        },
        legend: {
            data: categories.map(c => c.name),
            textStyle: { color: '#a0c4e8' },
            top: 10
        },
        series: [
            {
                type: 'graph',
                layout: 'none',
                data: nodes,
                links: links,
                categories: categories,
                roam: true,
                label: {
                    show: true,
                    position: 'bottom',
                    color: '#e0e6ed',
                    fontSize: 12
                },
                lineStyle: {
                    curveness: 0.1
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 6
                    }
                }
            }
        ]
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

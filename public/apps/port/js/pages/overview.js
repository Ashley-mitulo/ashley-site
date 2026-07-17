async function render_overview(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>📊</span>
            <span>系统概览</span>
        </div>
        <div class="stats-grid" id="stats-grid">
            <div class="stat-card">
                <div class="value">--</div>
                <div class="label">泊位数量</div>
            </div>
            <div class="stat-card">
                <div class="value">--</div>
                <div class="label">总变电容量</div>
            </div>
            <div class="stat-card">
                <div class="value">--</div>
                <div class="label">运输线路长度</div>
            </div>
            <div class="stat-card">
                <div class="value">--</div>
                <div class="label">码头数量</div>
            </div>
            <div class="stat-card">
                <div class="value">--</div>
                <div class="label">总货物装卸容量</div>
            </div>
            <div class="stat-card">
                <div class="value">--</div>
                <div class="label">当前出力</div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">容量分布</div>
                </div>
                <div id="capacity-chart" class="chart-container"></div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="card-title">告警统计</div>
                </div>
                <div id="alarm-chart" class="chart-container"></div>
            </div>
        </div>
    `;
    
    await loadOverviewData();
    await loadAlarmStatistics();
}

async function loadOverviewData() {
    const result = await API.grid.overview();
    if (result.success) {
        const data = result.data;
        const statsGrid = document.getElementById('stats-grid');
        
        // 数字滚动动画
        if (window.AnimationSystem) {
            setTimeout(() => {
                document.querySelectorAll('.stat-card .value').forEach((el, i) => {
                    setTimeout(() => {
                        el.classList.add('glow-blue');
                    }, i * 200);
                });
            }, 500);
        }
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="value">${data.substations.count}</div>
                <div class="label">泊位数量</div>
            </div>
            <div class="stat-card">
                <div class="value">${formatNumber(data.substations.total_capacity)} MW</div>
                <div class="label">总变电容量</div>
            </div>
            <div class="stat-card">
                <div class="value">${formatNumber(data.transmission_lines.total_length)} km</div>
                <div class="label">运输线路长度</div>
            </div>
            <div class="stat-card">
                <div class="value">${data.power_plants.count}</div>
                <div class="label">码头数量</div>
            </div>
            <div class="stat-card">
                <div class="value">${formatNumber(data.power_plants.total_capacity)} MW</div>
                <div class="label">总货物装卸容量</div>
            </div>
            <div class="stat-card">
                <div class="value">${formatNumber(data.power_plants.total_output)} MW</div>
                <div class="label">当前出力</div>
            </div>
        `;
        
        renderCapacityChart(data);
    }
}

function renderCapacityChart(data) {
    const chartDom = document.getElementById('capacity-chart');
    const chart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            top: '5%',
            left: 'center',
            textStyle: { color: '#a0c4e8' }
        },
        series: [
            {
                name: '容量分布',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#1a2a4a',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: data.power_plants.total_output, name: '当前出力 (MW)', itemStyle: { color: '#00ff88' } },
                    { value: data.power_plants.total_capacity - data.power_plants.total_output, name: '备用容量 (MW)', itemStyle: { color: '#2d4a6f' } }
                ]
            }
        ]
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    
    // 增强图表动画
    if (window.AnimationSystem) {
        window.AnimationSystem.enhanceChartAnimation(chart);
    }
}

async function loadAlarmStatistics() {
    const result = await API.alarms.statistics();
    if (result.success) {
        const data = result.data;
        const chartDom = document.getElementById('alarm-chart');
        const chart = echarts.init(chartDom);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['总数', '活跃', '严重', '警告'],
                axisLabel: { color: '#a0c4e8' }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#a0c4e8' }
            },
            series: [
                {
                    type: 'bar',
                    data: [
                        { value: data.total, itemStyle: { color: '#00d4ff' } },
                        { value: data.active, itemStyle: { color: '#00ff88' } },
                        { value: data.critical, itemStyle: { color: '#ff4444' } },
                        { value: data.warning, itemStyle: { color: '#ffc107' } }
                    ],
                    barWidth: '50%',
                    itemStyle: {
                        borderRadius: [4, 4, 0, 0]
                    }
                }
            ]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
    }
}

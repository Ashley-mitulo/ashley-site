async function render_monitoring(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>📈</span>
            <span>实时监控</span>
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">实时数据监控</div>
                    <button class="btn btn-success btn-sm" onclick="simulateMonitoringData()">
                        <span>🔄</span> 生成模拟数据
                    </button>
                </div>
                <div id="monitoring-chart" class="chart-container"></div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="card-title">实时数据流</div>
                </div>
                <div id="monitoring-data" style="max-height: 300px; overflow-y: auto;">
                    加载中...
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <div class="card-title">货物预测</div>
            </div>
            <div id="forecast-chart" class="chart-container"></div>
        </div>
    `;
    
    await loadMonitoringData();
    await renderForecastChart();
}

async function loadMonitoringData() {
    const result = await API.monitoring.realtime({ limit: 50 });
    if (result.success) {
        renderMonitoringChart(result.data);
        renderMonitoringDataList(result.data);
    }
}

function renderMonitoringChart(data) {
    const chartDom = document.getElementById('monitoring-chart');
    const chart = echarts.init(chartDom);
    
    const metrics = {};
    data.forEach(d => {
        if (!metrics[d.metric]) {
            metrics[d.metric] = [];
        }
        metrics[d.metric].push(d);
    });
    
    const series = Object.keys(metrics).map((metric, i) => ({
        name: metric,
        type: 'line',
        smooth: true,
        data: metrics[metric].map(d => d.value).slice(0, 20)
    }));
    
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: Object.keys(metrics),
            textStyle: { color: '#a0c4e8' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: Array(20).fill(0).map(function(_, i) { return 'T' + (i+1); }),
            axisLabel: { color: '#a0c4e8' }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#a0c4e8' }
        },
        color: ['#00d4ff', '#00ff88', '#ffc107', '#ff4444'],
        series: series
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function renderMonitoringDataList(data) {
    const container = document.getElementById('monitoring-data');
    
    if (data.length === 0) {
        container.innerHTML = '<p style="color: #7a8ca6; text-align: center; padding: 20px;">暂无数据</p>';
        return;
    }
    
    container.innerHTML = data.slice(0, 15).map(function(d) {
        return '<div style="padding: 10px; border-bottom: 1px solid #2d4a6f; font-size: 13px;">' +
            '<div style="display: flex; justify-content: space-between;">' +
                '<span style="color: #00d4ff;">' + d.metric + '</span>' +
                '<span style="color: #00ff88; font-weight: bold;">' + d.value.toFixed(2) + ' ' + d.unit + '</span>' +
            '</div>' +
            '<div style="color: #7a8ca6; font-size: 11px; margin-top: 4px;">' +
                d.device_type + ' #' + d.device_id + ' | ' + new Date(d.timestamp).toLocaleTimeString() +
            '</div>' +
        '</div>';
    }).join('');
}

async function simulateMonitoringData() {
    await API.monitoring.simulate();
    loadMonitoringData();
}

function renderForecastChart() {
    const chartDom = document.getElementById('forecast-chart');
    const chart = getECharts().init(chartDom);
    
    const hours = Array(24).fill(0).map(function(_, i) { return i + ':00'; });
    const forecastData = hours.map(function(_, i) { return 1500 + Math.random() * 1000 - Math.cos((i - 12) * Math.PI / 12) * 500; });
    const actualData = forecastData.map(v => v + (Math.random() - 0.5) * 100);
    
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['预测货物', '实际货物'],
            textStyle: { color: '#a0c4e8' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: hours,
            axisLabel: { color: '#a0c4e8' }
        },
        yAxis: {
            type: 'value',
            name: 'MW',
            axisLabel: { color: '#a0c4e8' }
        },
        series: [
            {
                name: '预测货物',
                type: 'line',
                smooth: true,
                data: forecastData,
                lineStyle: { color: '#00d4ff', type: 'dashed' },
                itemStyle: { color: '#00d4ff' }
            },
            {
                name: '实际货物',
                type: 'line',
                smooth: true,
                data: actualData,
                lineStyle: { color: '#00ff88' },
                itemStyle: { color: '#00ff88' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(0, 255, 136, 0.3)' },
                            { offset: 1, color: 'rgba(0, 255, 136, 0)' }
                        ]
                    }
                }
            }
        ]
    };
    
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

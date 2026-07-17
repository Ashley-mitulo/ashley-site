// 统计分析模块

function renderAnalytics(container) {
    container.innerHTML = `
        <div class="page-title">📈 统计分析中心</div>
        
        <div class="tab-container">
            <div class="tab-item active" data-tab="throughput" onclick="switchAnalyticsTab('throughput')">吞吐量统计</div>
            <div class="tab-item" data-tab="efficiency" onclick="switchAnalyticsTab('efficiency')">作业效率分析</div>
            <div class="tab-item" data-tab="kpi" onclick="switchAnalyticsTab('kpi')">KPI仪表盘</div>
            <div class="tab-item" data-tab="report" onclick="switchAnalyticsTab('report')">自定义报表</div>
        </div>

        <div id="analytics-tab-content"></div>
    `;

    switchAnalyticsTab('throughput');
}

function switchAnalyticsTab(tab) {
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });

    const content = document.getElementById('analytics-tab-content');
    switch (tab) {
        case 'throughput':
            renderThroughputStats(content);
            break;
        case 'efficiency':
            renderEfficiencyAnalysis(content);
            break;
        case 'kpi':
            renderKPIDashboard(content);
            break;
        case 'report':
            renderCustomReport(content);
            break;
    }
}

function renderThroughputStats(container) {
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 吞吐量趋势图</span>
                    <select style="background: rgba(30, 55, 85, 0.8); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 4px; color: #a0c4e8; padding: 4px 8px; font-size: 11px;">
                        <option>按月</option>
                        <option>按周</option>
                        <option>按日</option>
                    </select>
                </div>
                <div id="throughput-trend-chart" class="chart-container" style="height: 300px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 按箱型分类统计</span>
                </div>
                <div id="box-type-chart" class="chart-container" style="height: 300px;"></div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">🚢 进出口对比</span>
                </div>
                <div id="import-export-chart" class="chart-container" style="height: 250px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📉 同比环比分析</span>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 20px; background: rgba(0, 255, 136, 0.1); border-radius: 10px;">
                            <div style="font-size: 11px; color: #7a9aba; margin-bottom: 8px;">本月吞吐量</div>
                            <div style="font-size: 28px; font-weight: 700; color: #00ff88;">125,680</div>
                            <div style="font-size: 12px; color: #00ff88; margin-top: 5px;">TEU</div>
                        </div>
                        <div style="text-align: center; padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                            <div style="font-size: 11px; color: #7a9aba; margin-bottom: 8px;">上月吞吐量</div>
                            <div style="font-size: 28px; font-weight: 700; color: #00d4ff;">118,450</div>
                            <div style="font-size: 12px; color: #00d4ff; margin-top: 5px;">TEU</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1; padding: 15px; background: rgba(0, 255, 136, 0.05); border-radius: 8px; border-left: 4px solid #00ff88;">
                            <div style="font-size: 11px; color: #7a9aba;">环比增长</div>
                            <div style="font-size: 22px; font-weight: 700; color: #00ff88;">+6.1% ↑</div>
                        </div>
                        <div style="flex: 1; padding: 15px; background: rgba(0, 212, 255, 0.05); border-radius: 8px; border-left: 4px solid #00d4ff;">
                            <div style="font-size: 11px; color: #7a9aba;">同比增长</div>
                            <div style="font-size: 22px; font-weight: 700; color: #00d4ff;">+12.5% ↑</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initThroughputCharts();
}

function initThroughputCharts() {
    const ec = getECharts();
    if (!ec) return;

    // 吞吐量趋势
    const trendChart = ec.init(document.getElementById('throughput-trend-chart'));
    trendChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['2024年', '2023年'], textStyle: { color: '#a0c4e8', fontSize: 11 } },
        grid: { left: '10%', right: '5%', top: '15%', bottom: '10%' },
        xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'], axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba' } },
        yAxis: { type: 'value', name: 'TEU', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
        series: [
            { name: '2024年', type: 'bar', data: [98000, 102000, 115000, 118000, 125680, 130000], itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00ff88' }, { offset: 1, color: '#00d4ff' }]) } },
            { name: '2023年', type: 'bar', data: [85000, 92000, 98000, 105000, 110000, 115000], itemStyle: { color: 'rgba(100, 100, 100, 0.5)' } }
        ]
    });

    // 箱型统计
    const boxChart = ec.init(document.getElementById('box-type-chart'));
    boxChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '55%'],
            data: [
                { value: 75408, name: "20'", itemStyle: { color: '#00ff88' } },
                { value: 45245, name: "40'", itemStyle: { color: '#00d4ff' } },
                { value: 5027, name: "45'", itemStyle: { color: '#ffc107' } }
            ],
            label: { color: '#a0c4e8', fontSize: 12, formatter: '{b}: {c} TEU ({d}%)' }
        }]
    });

    // 进出口对比
    const ieChart = ec.init(document.getElementById('import-export-chart'));
    ieChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['进口', '出口'], textStyle: { color: '#a0c4e8', fontSize: 11 } },
        grid: { left: '10%', right: '5%', top: '15%', bottom: '10%' },
        xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'], axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba' } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
        series: [
            { name: '进口', type: 'line', smooth: true, data: [42000, 45000, 48000, 52000, 55000, 58000], lineStyle: { color: '#00d4ff', width: 3 }, itemStyle: { color: '#00d4ff' }, areaStyle: { color: 'rgba(0, 212, 255, 0.1)' } },
            { name: '出口', type: 'line', smooth: true, data: [56000, 57000, 67000, 66000, 70680, 72000], lineStyle: { color: '#00ff88', width: 3 }, itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0, 255, 136, 0.1)' } }
        ]
    });
}

function renderEfficiencyAnalysis(container) {
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">⏱️ 船时效率曲线</span>
                </div>
                <div id="ship-efficiency-chart" class="chart-container" style="height: 300px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">🏗️ 台时效率对比</span>
                </div>
                <div id="crane-efficiency-chart" class="chart-container" style="height: 300px;"></div>
            </div>
        </div>
        
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📊 效率对标分析</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 20px;">
                <div style="text-align: center; padding: 20px; background: rgba(0, 255, 136, 0.1); border-radius: 10px;">
                    <div style="font-size: 11px; color: #7a9aba; margin-bottom: 8px;">船时效率</div>
                    <div style="font-size: 28px; font-weight: 700; color: #00ff88;">32</div>
                    <div style="font-size: 12px; color: #7a9aba;">箱/小时</div>
                    <div style="font-size: 11px; color: #00ff88; margin-top: 8px;">超目标 6.7% ↑</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                    <div style="font-size: 11px; color: #7a9aba; margin-bottom: 8px;">台时效率</div>
                    <div style="font-size: 28px; font-weight: 700; color: #00d4ff;">28.5</div>
                    <div style="font-size: 12px; color: #7a9aba;">箱/小时</div>
                    <div style="font-size: 11px; color: #00d4ff; margin-top: 8px;">达标 ✓</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(255, 193, 7, 0.1); border-radius: 10px;">
                    <div style="font-size: 11px; color: #7a9aba; margin-bottom: 8px;">集卡周转</div>
                    <div style="font-size: 28px; font-weight: 700; color: #ffc107;">12.5</div>
                    <div style="font-size: 12px; color: #7a9aba;">分钟</div>
                    <div style="font-size: 11px; color: #ffc107; margin-top: 8px;">待优化</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(156, 39, 176, 0.1); border-radius: 10px;">
                    <div style="font-size: 11px; color: #7a9aba; margin-bottom: 8px;">桥吊利用率</div>
                    <div style="font-size: 28px; font-weight: 700; color: #b388ff;">78%</div>
                    <div style="font-size: 12px; color: #7a9aba;">平均</div>
                    <div style="font-size: 11px; color: #ffc107; margin-top: 8px;">目标: 85%</div>
                </div>
            </div>
        </div>
    `;

    initEfficiencyCharts();
}

function initEfficiencyCharts() {
    const ec = getECharts();
    if (!ec) return;

    // 船时效率
    const shipChart = ec.init(document.getElementById('ship-efficiency-chart'));
    shipChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['中远海运', '马士基', '达飞海运'], textStyle: { color: '#a0c4e8', fontSize: 10 } },
        grid: { left: '10%', right: '5%', top: '15%', bottom: '10%' },
        xAxis: { type: 'category', data: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06'], axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba' } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
        series: [
            { name: '中远海运', type: 'bar', data: [128, 115, 132, 98, 145, 122], itemStyle: { color: '#00ff88' } },
            { name: '马士基', type: 'bar', data: [95, 102, 88, 110, 92, 105], itemStyle: { color: '#00d4ff' } },
            { name: '达飞海运', type: 'bar', data: [85, 92, 78, 95, 88, 90], itemStyle: { color: '#ffc107' } }
        ]
    });
}

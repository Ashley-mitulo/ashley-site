async function render_forecast(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>📈</span>
            <span>货物预测与趋势分析</span>
        </div>
        
        <div class="grid grid-4" style="margin-bottom: 30px;">
            <div class="card stat-card" style="border-left: 4px solid #00ff88;">
                <div class="stat-value" id="current-load">2,158</div>
                <div class="stat-label">当前总货物 (MW)</div>
                <div class="stat-trend" style="color: #00ff88;">↑ 3.2% 较昨日</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid #00d4ff;">
                <div class="stat-value" id="peak-forecast">3,420</div>
                <div class="stat-label">今日预测峰值 (MW)</div>
                <div class="stat-trend" style="color: #00d4ff;">预计 18:30 出现</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid #ffc107;">
                <div class="stat-value" id="predict-accuracy">96.8%</div>
                <div class="stat-label">预测准确率</div>
                <div class="stat-trend" style="color: #ffc107;">AI 算法模型</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid #9c27b0;">
                <div class="stat-value" id="capacity-rate">72.5%</div>
                <div class="stat-label">当前负载率</div>
                <div class="stat-trend" style="color: #00ff88;">运行状态健康</div>
            </div>
        </div>
        
        <div class="card" style="margin-bottom: 30px;">
            <div class="card-header">
                <div class="card-title">24小时货物预测曲线</div>
            </div>
            <div id="forecast-chart" style="height: 400px;"></div>
        </div>
        
        <div class="grid grid-2" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">历史同期对比</div>
                </div>
                <div id="compare-chart" style="height: 320px;"></div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">峰谷差分析</div>
                </div>
                <div id="peak-valley-chart" style="height: 320px;"></div>
            </div>
        </div>
        
        <div class="grid grid-3" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">影响因素分析</div>
                </div>
                <div id="factors-chart" style="height: 280px;"></div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">预测误差分布</div>
                </div>
                <div id="error-chart" style="height: 280px;"></div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">分区域货物占比</div>
                </div>
                <div id="region-chart" style="height: 280px;"></div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="card-title">预测历史记录</div>
            </div>
            <div style="overflow-x: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>预测时间</th>
                            <th>预测时段</th>
                            <th>预测峰值 (MW)</th>
                            <th>实际峰值 (MW)</th>
                            <th>误差率</th>
                            <th>预测模型</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody id="forecast-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await renderForecastCharts();
    await loadForecastTable();
}

async function renderForecastCharts() {
    const ec = getECharts();
    
    // 24小时预测曲线
    const fc = document.getElementById('forecast-chart');
    if (fc) {
        const chart = ec.init(fc);
        const hours = [];
        const actual = [];
        const pred = [];
        for (let i = 5; i >= 0; i--) {
            const h = (new Date().getHours() - i + 24) % 24;
            hours.push(h + ':00');
            actual.push(Math.round(1800 + Math.random() * 500));
            pred.push(null);
        }
        for (let i = 0; i < 18; i++) {
            const h = (new Date().getHours() + i) % 24;
            hours.push(h + ':00');
            actual.push(null);
            pred.push(Math.round(1800 + Math.random() * 500));
        }
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: { data: ['实际货物', '预测货物'], textStyle: { color: '#a0c4e8' }, top: 10 },
            grid: { left: '3%', right: '4%', bottom: '3%', top: '60px', containLabel: true },
            xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' } },
            yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
            series: [
                { name: '实际货物', type: 'line', smooth: true, data: actual, lineStyle: { width: 4, color: '#00ff88' }, itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0, 255, 136, 0.25)' } },
                { name: '预测货物', type: 'line', smooth: true, data: pred, lineStyle: { width: 3, type: 'dashed', color: '#00d4ff' }, itemStyle: { color: '#00d4ff' } }
            ]
        });
    }
    
    // 历史同期对比
    const cc = document.getElementById('compare-chart');
    if (cc) {
        const chart = ec.init(cc);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: { data: ['本月', '上月', '去年同期'], textStyle: { color: '#a0c4e8' }, top: 10 },
            xAxis: { type: 'category', data: ['1日', '5日', '10日', '15日', '20日', '25日', '30日'], axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' } },
            yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
            series: [
                { name: '本月', type: 'bar', data: [2100, 2300, 2500, 2400, 2600, 2200, 2350], itemStyle: { color: '#00ff88' }, barWidth: 12 },
                { name: '上月', type: 'bar', data: [2000, 2200, 2400, 2300, 2500, 2100, 2250], itemStyle: { color: '#00d4ff' }, barWidth: 12 },
                { name: '去年同期', type: 'bar', data: [1900, 2100, 2300, 2200, 2400, 2000, 2150], itemStyle: { color: '#9c27b0' }, barWidth: 12 }
            ]
        });
    }
    
    // 影响因素分析
    const fac = document.getElementById('factors-chart');
    if (fac) {
        const chart = ec.init(fac);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#a0c4e8' } },
            series: [{ type: 'pie', radius: ['30%', '60%'], center: ['40%', '50%'], roseType: 'radius',
                data: [
                    { value: 45, name: '气温影响', itemStyle: { color: '#ff4757' } },
                    { value: 22, name: '工作日效应', itemStyle: { color: '#ffc107' } },
                    { value: 15, name: '降雨/天气', itemStyle: { color: '#00d4ff' } },
                    { value: 10, name: '节假日影响', itemStyle: { color: '#9c27b0' } },
                    { value: 8, name: '其他因素', itemStyle: { color: '#00ff88' } }
                ]
            }]
        });
    }
    
    // 误差分布
    const ecdom = document.getElementById('error-chart');
    if (ecdom) {
        const chart = ec.init(ecdom);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['-3%', '-2%', '-1%', '0%', '1%', '2%', '3%'], axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' } },
            yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
            series: [{ type: 'bar', data: [5, 20, 40, 60, 35, 15, 5], itemStyle: { color: '#00d4ff' }, barWidth: 20 }]
        });
    }
    
    // 区域占比
    const rc = document.getElementById('region-chart');
    if (rc) {
        const chart = ec.init(rc);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item' },
            series: [{ type: 'pie', radius: ['35%', '65%'],
                data: [
                    { value: 32, name: '苏南区域', itemStyle: { color: '#00ff88' } },
                    { value: 28, name: '苏中区域', itemStyle: { color: '#00d4ff' } },
                    { value: 25, name: '苏北区域', itemStyle: { color: '#ffc107' } },
                    { value: 15, name: '沿海区域', itemStyle: { color: '#9c27b0' } }
                ],
                label: { color: '#e0e6ed', fontSize: 11 }
            }]
        });
    }
    
    // 峰谷差
    const pvc = document.getElementById('peak-valley-chart');
    if (pvc) {
        const chart = ec.init(pvc);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: { data: ['峰值货物', '谷值货物'], textStyle: { color: '#a0c4e8' }, top: 10 },
            xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' } },
            yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#a0c4e8' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
            series: [
                { name: '峰值货物', type: 'bar', data: [3420, 3510, 3380, 3450, 3580, 2980, 2890], itemStyle: { color: '#ff4757' }, barWidth: 15 },
                { name: '谷值货物', type: 'bar', data: [1280, 1320, 1250, 1300, 1350, 1180, 1150], itemStyle: { color: '#00d4ff' }, barWidth: 15 }
            ]
        });
    }
}

async function loadForecastTable() {
    const tbody = document.getElementById('forecast-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td>2026-05-07 00:00</td><td>5月7日</td><td style="color:#00d4ff">3420</td><td style="color:#00ff88">3385</td><td style="color:#00ff88;font-weight:600">1.03%</td><td>LSTM+XGBoost</td><td><span style="background:rgba(0,255,136,0.1);color:#00ff88;padding:3px 10px;border-radius:4px;font-size:11px">已验证</span></td></tr>';
}

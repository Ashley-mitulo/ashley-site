// ECharts 安全检查
function safeECharts() { return window.echarts || null; }

async function render_health(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>💓</span>
            <span>港口健康度分析</span>
        </div>
        
        <div class="grid grid-3" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">综合健康评分</div>
                </div>
                <div style="text-align: center; padding: 30px 0;">
                    <div id="health-score" style="font-size: 72px; font-weight: 900; color: #00ff88; text-shadow: 0 0 30px #00ff88; line-height: 1;">
                        92.5
                    </div>
                    <div style="margin-top: 15px; color: #8ba4c7; font-size: 16px;">
                        <span id="health-status-text" style="color: #00ff88; font-weight: 600;">运行状态良好</span>
                    </div>
                    <div style="margin-top: 20px;">
                        <div style="width: 200px; height: 12px; background: #1e3a5f; border-radius: 6px; margin: 0 auto; overflow: hidden;">
                            <div id="health-bar" style="width: 92.5%; height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 6px; transition: width 1s ease;"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">各维度评分</div>
                </div>
                <div style="padding: 15px 0;">
                    <div style="margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>设备健康度</span>
                            <span style="color: #00ff88; font-weight: 600;">95.2%</span>
                        </div>
                        <div style="height: 8px; background: #1e3a5f; border-radius: 4px; overflow: hidden;">
                            <div style="width: 95.2%; height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>线路负载率</span>
                            <span style="color: #ffc107; font-weight: 600;">88.7%</span>
                        </div>
                        <div style="height: 8px; background: #1e3a5f; border-radius: 4px; overflow: hidden;">
                            <div style="width: 88.7%; height: 100%; background: linear-gradient(90deg, #ffc107, #ff9800); border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>供电可靠性</span>
                            <span style="color: #00ff88; font-weight: 600;">99.8%</span>
                        </div>
                        <div style="height: 8px; background: #1e3a5f; border-radius: 4px; overflow: hidden;">
                            <div style="width: 99.8%; height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>电压合格率</span>
                            <span style="color: #00ff88; font-weight: 600;">98.5%</span>
                        </div>
                        <div style="height: 8px; background: #1e3a5f; border-radius: 4px; overflow: hidden;">
                            <div style="width: 98.5%; height: 100%; background: linear-gradient(90deg, #00ff88, #00d4ff); border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">告警统计</div>
                </div>
                <div id="health-alarm-chart" style="height: 180px;"></div>
            </div>
        </div>
        
        <div class="grid grid-2" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">健康趋势（近30天）</div>
                </div>
                <div id="health-trend-chart" style="height: 300px;"></div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">设备状态分布</div>
                </div>
                <div id="equipment-status-chart" style="height: 300px;"></div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="card-title">关键设备健康详情</div>
            </div>
            <div style="overflow-x: auto;">
                <table class="table" id="health-table">
                    <thead>
                        <tr>
                            <th>设备名称</th>
                            <th>类型</th>
                            <th>所在城市</th>
                            <th>健康评分</th>
                            <th>运行状态</th>
                            <th>最后检修时间</th>
                        </tr>
                    </thead>
                    <tbody id="health-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await renderHealthCharts();
    await loadHealthTable();
    
    // 启动数字滚动动画
    animateHealthScore();
}

function animateHealthScore() {
    const scoreEl = document.getElementById('health-score');
    const barEl = document.getElementById('health-bar');
    if (!scoreEl) return;
    
    let start = 0;
    const end = 92.5;
    const duration = 2000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeProgress;
        
        scoreEl.textContent = current.toFixed(1);
        if (barEl) {
            barEl.style.width = current + '%';
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

async function renderHealthCharts() {
    // 告警统计图
    const alarmChartDom = document.getElementById('health-alarm-chart');
    if (alarmChartDom) {
        const alarmChart = getECharts().init(alarmChartDom);
        alarmChart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)'
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
                    radius: ['40%', '70%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#0f1929',
                        borderWidth: 2
                    },
                    label: {
                        show: false
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    },
                    data: [
                        { value: 3, name: '严重告警', itemStyle: { color: '#ff4757' } },
                        { value: 8, name: '警告', itemStyle: { color: '#ffc107' } },
                        { value: 15, name: '一般信息', itemStyle: { color: '#00d4ff' } }
                    ]
                }
            ]
        });
    }
    
    // 健康趋势图
    const trendChartDom = document.getElementById('health-trend-chart');
    if (trendChartDom) {
        const trendChart = getECharts().init(trendChartDom);
        
        // 生成近30天的健康趋势数据
        const days = [];
        const scores = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push((date.getMonth() + 1) + '/' + date.getDate());
            scores.push(85 + Math.random() * 12);
        }
        
        trendChart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                formatter: '{b}<br/>健康评分: {c}'
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
                data: days,
                axisLine: { lineStyle: { color: '#1e3a5f' } },
                axisLabel: { color: '#a0c4e8' }
            },
            yAxis: {
                type: 'value',
                min: 80,
                max: 100,
                axisLine: { lineStyle: { color: '#1e3a5f' } },
                axisLabel: { color: '#a0c4e8' },
                splitLine: { lineStyle: { color: '#1e3a5f' } }
            },
            series: [
                {
                    name: '健康评分',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    data: scores,
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
                                { offset: 1, color: 'rgba(0, 212, 255, 0)' }
                            ]
                        }
                    },
                    lineStyle: {
                        width: 3,
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: [
                                { offset: 0, color: '#00ff88' },
                                { offset: 1, color: '#00d4ff' }
                            ]
                        }
                    },
                    itemStyle: {
                        color: '#00ff88',
                        shadowBlur: 10,
                        shadowColor: '#00ff88'
                    }
                }
            ]
        });
    }
    
    // 设备状态分布图
    const statusChartDom = document.getElementById('equipment-status-chart');
    if (statusChartDom) {
        const statusChart = getECharts().init(statusChartDom);
        statusChart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} 台 ({d}%)'
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
                    radius: ['35%', '65%'],
                    center: ['40%', '50%'],
                    roseType: 'radius',
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: '#0f1929',
                        borderWidth: 2
                    },
                    label: {
                        color: '#a0c4e8',
                        formatter: '{b}\n{c}台'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    },
                    data: [
                        { value: 12, name: '正常运行', itemStyle: { color: '#00ff88' } },
                        { value: 3, name: '轻微异常', itemStyle: { color: '#ffc107' } },
                        { value: 1, name: '需要检修', itemStyle: { color: '#ff9800' } },
                        { value: 0, name: '故障停机', itemStyle: { color: '#ff4757' } }
                    ]
                }
            ]
        });
    }
}

async function loadHealthTable() {
    const tableBody = document.getElementById('health-table-body');
    if (!tableBody) return;
    
    // 模拟设备健康数据
    const equipmentData = [
        { name: '南京泊位', type: '泊位', city: '南京', score: 96, status: '正常运行', lastCheck: '2026-04-15' },
        { name: '苏州泊位', type: '泊位', city: '苏州', score: 94, status: '正常运行', lastCheck: '2026-04-12' },
        { name: '无锡泊位', type: '泊位', city: '无锡', score: 91, status: '轻微异常', lastCheck: '2026-04-10' },
        { name: '句容码头', type: '码头', city: '句容', score: 97, status: '正常运行', lastCheck: '2026-04-18' },
        { name: '太仓码头', type: '码头', city: '太仓', score: 89, status: '需要检修', lastCheck: '2026-03-28' },
        { name: '连云港核电站', type: '码头', city: '连云港', score: 98, status: '正常运行', lastCheck: '2026-04-20' },
    ];
    
    tableBody.innerHTML = equipmentData.map(item => {
        let statusColor = item.status === '正常运行' ? '#00ff88' : 
                         item.status === '轻微异常' ? '#ffc107' : 
                         item.status === '需要检修' ? '#ff9800' : '#ff4757';
        
        let scoreColor = item.score >= 95 ? '#00ff88' : 
                        item.score >= 85 ? '#ffc107' : '#ff4757';
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.city}</td>
                <td style="color: ${scoreColor}; font-weight: 600;">${item.score}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${item.status}</td>
                <td>${item.lastCheck}</td>
            </tr>
        `;
    }).join('');
}

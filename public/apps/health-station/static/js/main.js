/**
 * 卫生站选址优化系统 - 前端主逻辑
 */

// 全局变量
let map = null;
let costChart = null;
let buildingMarkers = [];
let candidateMarkers = [];
let stationMarkers = [];
let pollingInterval = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initChart();
    loadInitialData();
    bindEvents();
});

/**
 * 初始化地图
 */
function initMap() {
    // 初始化地图 - 默认中心位置设置为隆中村附近
    map = L.map('map').setView([23.1, 116.7], 14);
    
    // 添加OSM底图
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

/**
 * 初始化成本变化图表
 */
function initChart() {
    const ctx = document.getElementById('costChart').getContext('2d');
    
    costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: '最优成本',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '平均成本',
                    data: [],
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '迭代次数'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '成本值'
                    }
                }
            }
        }
    });
}

/**
 * 加载初始数据（建筑物和候选点）
 */
async function loadInitialData() {
    try {
        // 加载建筑物数据（采样）
        const buildingsRes = await fetch('/api/buildings');
        const buildingsData = await buildingsRes.json();
        
        if (buildingsData.success) {
            displayBuildings(buildingsData.buildings);
        }
        
        // 加载候选点数据
        const candidatesRes = await fetch('/api/candidates');
        const candidatesData = await candidatesRes.json();
        
        if (candidatesData.success) {
            displayCandidates(candidatesData.candidates);
            
            // 调整地图视角到数据区域
            if (candidatesData.candidates.length > 0) {
                const lats = candidatesData.candidates.map(p => p[1]);
                const lngs = candidatesData.candidates.map(p => p[0]);
                const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                map.setView([centerLat, centerLng], 14);
            }
        }
        
    } catch (error) {
        console.error('加载初始数据失败:', error);
    }
}

/**
 * 在地图上显示建筑物
 */
function displayBuildings(buildings) {
    // 清除旧标记
    buildingMarkers.forEach(m => map.removeLayer(m));
    buildingMarkers = [];
    
    buildings.forEach(b => {
        const marker = L.circleMarker([b[1], b[0]], {
            radius: 3,
            fillColor: '#ff7675',
            color: '#ff7675',
            weight: 1,
            opacity: 0.6,
            fillOpacity: 0.6
        }).addTo(map);
        
        marker.bindPopup(`人口: ${Math.round(b[2])}人`);
        buildingMarkers.push(marker);
    });
}

/**
 * 在地图上显示候选点
 */
function displayCandidates(candidates) {
    // 清除旧标记
    candidateMarkers.forEach(m => map.removeLayer(m));
    candidateMarkers = [];
    
    candidates.forEach((c, idx) => {
        const marker = L.circleMarker([c[1], c[0]], {
            radius: 4,
            fillColor: '#74b9ff',
            color: '#74b9ff',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.5
        }).addTo(map);
        
        marker.bindPopup(`候选点 #${idx}`);
        candidateMarkers.push(marker);
    });
}

/**
 * 在地图上显示最优站点
 */
function displayStations(stations) {
    // 清除旧站点标记
    stationMarkers.forEach(m => map.removeLayer(m));
    stationMarkers = [];
    
    stations.forEach((s, idx) => {
        const marker = L.circleMarker([s.latitude, s.longitude], {
            radius: 10,
            fillColor: '#00b894',
            color: '#00b894',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        marker.bindPopup(`
            <b>站点 ${idx + 1}</b><br>
            服务人口: ${Math.round(s.served_population)} 人<br>
            总服务距离: ${s.total_distance.toFixed(2)}
        `);
        
        stationMarkers.push(marker);
    });
}

/**
 * 绑定事件
 */
function bindEvents() {
    document.getElementById('startBtn').addEventListener('click', startOptimization);
}

/**
 * 开始优化
 */
async function startOptimization() {
    const btn = document.getElementById('startBtn');
    
    // 获取参数
    const params = {
        n_stations: parseInt(document.getElementById('n_stations').value),
        population_size: parseInt(document.getElementById('population_size').value),
        max_iterations: parseInt(document.getElementById('max_iterations').value),
        crossover_rate: parseFloat(document.getElementById('crossover_rate').value),
        mutation_rate: parseFloat(document.getElementById('mutation_rate').value)
    };
    
    // 禁用按钮
    btn.disabled = true;
    btn.textContent = '⏳ 优化进行中...';
    
    // 重置界面
    resetUI();
    updateStatus('正在启动优化...');
    
    try {
        // 发送优化请求
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateStatus('优化进行中...');
            // 开始轮询状态
            startPolling();
        } else {
            updateStatus('错误: ' + result.message);
            btn.disabled = false;
            btn.textContent = '🚀 开始优化';
        }
        
    } catch (error) {
        console.error('优化请求失败:', error);
        updateStatus('请求失败: ' + error.message);
        btn.disabled = false;
        btn.textContent = '🚀 开始优化';
    }
}

/**
 * 轮询状态
 */
function startPolling() {
    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            
            // 更新进度
            updateProgress(status.current_iteration, status.total_iterations);
            
            if (!status.is_running && status.status === 'completed') {
                // 优化完成
                clearInterval(pollingInterval);
                loadResult();
            } else if (status.status === 'error') {
                clearInterval(pollingInterval);
                updateStatus('优化出错');
                resetButton();
            }
            
        } catch (error) {
            console.error('轮询状态失败:', error);
        }
    }, 500);
}

/**
 * 加载最终结果
 */
async function loadResult() {
    try {
        const response = await fetch('/api/result');
        const data = await response.json();
        
        if (data.success) {
            displayResult(data.result);
            updateStatus('优化完成！');
        }
        
    } catch (error) {
        console.error('加载结果失败:', error);
    }
    
    resetButton();
}

/**
 * 显示优化结果
 */
function displayResult(result) {
    // 更新统计信息
    document.getElementById('totalTime').textContent = result.total_time.toFixed(2) + ' 秒';
    document.getElementById('bestCost').textContent = result.best_cost.toFixed(4);
    document.getElementById('totalPopulation').textContent = Math.round(result.statistics.total_population) + ' 人';
    document.getElementById('avgDistance').textContent = result.statistics.avg_distance_per_person.toFixed(4);
    
    // 更新图表
    updateChart(result.cost_history);
    
    // 显示站点列表
    displayStationsList(result.stations);
    
    // 在地图上显示站点
    displayStations(result.stations);
}

/**
 * 更新图表
 */
function updateChart(costHistory) {
    const labels = costHistory.best.map((_, i) => i + 1);
    
    costChart.data.labels = labels;
    costChart.data.datasets[0].data = costHistory.best;
    costChart.data.datasets[1].data = costHistory.mean;
    costChart.update();
}

/**
 * 显示站点列表
 */
function displayStationsList(stations) {
    const listEl = document.getElementById('stationsList');
    listEl.innerHTML = '';
    
    stations.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = 'station-item';
        item.innerHTML = `
            <h4>站点 ${idx + 1}</h4>
            <p>📍 坐标: (${s.longitude.toFixed(6)}, ${s.latitude.toFixed(6)})</p>
            <p>👥 服务人口: ${Math.round(s.served_population)} 人</p>
            <p>📏 总服务距离: ${s.total_distance.toFixed(2)}</p>
        `;
        listEl.appendChild(item);
    });
}

/**
 * 更新状态文本
 */
function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

/**
 * 更新进度条
 */
function updateProgress(current, total) {
    const percent = total > 0 ? (current / total * 100) : 0;
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressText').textContent = `${current}/${total}`;
}

/**
 * 重置UI
 */
function resetUI() {
    updateProgress(0, 0);
    
    // 重置统计
    document.getElementById('totalTime').textContent = '-';
    document.getElementById('bestCost').textContent = '-';
    document.getElementById('totalPopulation').textContent = '-';
    document.getElementById('avgDistance').textContent = '-';
    
    // 重置站点列表
    document.getElementById('stationsList').innerHTML = '<p class="hint">运行优化后将显示站点详情</p>';
    
    // 清除站点标记
    stationMarkers.forEach(m => map.removeLayer(m));
    stationMarkers = [];
    
    // 重置图表
    costChart.data.labels = [];
    costChart.data.datasets[0].data = [];
    costChart.data.datasets[1].data = [];
    costChart.update();
}

/**
 * 重置按钮状态
 */
function resetButton() {
    const btn = document.getElementById('startBtn');
    btn.disabled = false;
    btn.textContent = '🚀 重新优化';
}

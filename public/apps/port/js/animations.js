// ==================== 数字滚动动画 ====================
function animateNumber(element, start, end, duration = 1500) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用 easeOutQuart 缓动函数
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeProgress;
        
        if (typeof end === 'number' && end % 1 !== 0) {
            element.textContent = current.toFixed(2);
        } else {
            element.textContent = Math.floor(current);
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 自动为统计卡片添加数字动画
function animateStatCards() {
    document.querySelectorAll('.stat-card .value').forEach(card => {
        const text = card.textContent;
        if (text !== '--') {
            const value = parseFloat(text.replace(/[^0-9.]/g, ''));
            if (!isNaN(value)) {
                card.classList.add('animate');
                animateNumber(card, 0, value, 1500);
            }
        }
    });
}

// ==================== 粒子背景系统 ====================
class ParticleSystem {
    constructor(container, count = 50) {
        this.container = container;
        this.count = count;
        this.particles = [];
        this.init();
    }
    
    init() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles-bg';
        this.container.appendChild(particlesContainer);
        
        for (let i = 0; i < this.count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (6 + Math.random() * 4) + 's';
            particle.style.opacity = 0.3 + Math.random() * 0.4;
            
            if (Math.random() > 0.5) {
                particle.style.background = 'rgba(0, 255, 136, 0.6)';
            }
            
            particlesContainer.appendChild(particle);
            this.particles.push(particle);
        }
    }
    
    destroy() {
        const container = this.container.querySelector('.particles-bg');
        if (container) {
            container.remove();
        }
    }
}

// ==================== 地图动画系统 ====================
class MapAnimationSystem {
    constructor(chart) {
        this.chart = chart;
        this.points = [];
        this.flows = [];
    }
    
    // 添加城市扩散点
    addCityPoint(city, lng, lat, color = '#00d4ff') {
        this.points.push({ city, lng, lat, color });
        return this;
    }
    
    // 添加货物流转线路
    addFlowLine(from, to, color = '#00ff88') {
        this.flows.push({ from, to, color });
        return this;
    }
    
    // 渲染扩散动画
    renderSpreadAnimation() {
        const option = this.chart.getOption();
        const series = option.series || [];
        
        // 添加扩散波纹效果
        this.points.forEach((point, index) => {
            for (let i = 0; i < 3; i++) {
                series.push({
                    type: 'effectScatter',
                    coordinateSystem: 'geo',
                    symbol: 'circle',
                    symbolSize: 20 + i * 10,
                    showEffectOn: 'render',
                    rippleEffect: {
                        brushType: 'stroke',
                        scale: 3,
                        period: 3 + i
                    },
                    data: [{
                        value: [point.lng, point.lat],
                        itemStyle: {
                            color: point.color,
                            opacity: 0.8 - i * 0.2
                        }
                    }],
                    zlevel: 1
                });
            }
        });
        
        this.chart.setOption(option);
    }
    
    // 渲染货物流转线路
    renderFlowLines() {
        const option = this.chart.getOption();
        const series = option.series || [];
        
        this.flows.forEach(flow => {
            series.push({
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 2,
                effect: {
                    show: true,
                    period: 4,
                    trailLength: 0.5,
                    symbol: 'arrow',
                    symbolSize: 8
                },
                lineStyle: {
                    color: flow.color,
                    width: 2,
                    curveness: 0.2,
                    type: 'dashed'
                },
                data: [{
                    coords: [
                        [flow.from.lng, flow.from.lat],
                        [flow.to.lng, flow.to.lat]
                    ]
                }]
            });
        });
        
        this.chart.setOption(option);
    }
}

// ==================== 数据刷新动画 ====================
function flashDataUpdate(element) {
    element.classList.remove('data-flash');
    void element.offsetWidth; // 触发重绘
    element.classList.add('data-flash');
}

// 表格行更新动画
function animateTableRows(table) {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        setTimeout(() => {
            row.style.opacity = '1';
            row.classList.add('fade-in-up');
        }, index * 50);
    });
}

// ==================== 图表动画增强 ====================
function enhanceChartAnimation(chart) {
    if (!chart) return;
    
    const option = chart.getOption();
    
    // 为所有系列添加动画效果
    if (option.series) {
        option.series.forEach(series => {
            series.animationDuration = 1500;
            series.animationEasing = 'cubicOut';
            series.animationDelay = function (idx) {
                return idx * 100;
            };
        });
    }
    
    chart.setOption(option);
}

// ==================== 拓扑图动画 ====================
function enhanceTopologyAnimation(chart) {
    if (!chart) return;
    
    const option = chart.getOption();
    
    if (option.series && option.series[0] && option.series[0].type === 'graph') {
        const series = option.series[0];
        
        // 节点脉冲效果
        series.emphasis = series.emphasis || {};
        series.emphasis.itemStyle = {
            shadowBlur: 20,
            shadowColor: '#00d4ff'
        };
        
        // 边动画效果
        series.lineStyle = series.lineStyle || {};
        series.lineStyle.width = 3;
        
        // 动态更新效果
        setInterval(() => {
            const opt = chart.getOption();
            if (opt.series && opt.series[0].data) {
                const nodes = opt.series[0].data;
                nodes.forEach(node => {
                    if (!node.originalSize) {
                        node.originalSize = node.symbolSize || 30;
                    }
                    node.itemStyle = node.itemStyle || {};
                    node.itemStyle.shadowBlur = 10 + Math.sin(Date.now() / 500) * 5;
                    node.itemStyle.shadowColor = '#00d4ff';
                });
                chart.setOption(opt);
            }
        }, 100);
    }
    
    chart.setOption(option);
}

// ==================== 实时数据流动画 ====================
class DataStreamAnimation {
    constructor(container, maxItems = 20) {
        this.container = container;
        this.maxItems = maxItems;
        this.items = [];
    }
    
    addItem(data) {
        const item = document.createElement('div');
        item.className = 'data-stream-item fade-in';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #00d4ff; font-weight: 600;">${data.metric}</span>
                <span style="color: #00ff88; font-weight: bold;">${data.value.toFixed(2)} ${data.unit || ''}</span>
            </div>
            <div style="color: #7a8ca6; font-size: 11px; margin-top: 4px;">
                ${data.source || '系统'} | ${new Date().toLocaleTimeString()}
            </div>
        `;
        
        this.container.insertBefore(item, this.container.firstChild);
        this.items.unshift(item);
        
        if (this.items.length > this.maxItems) {
            const oldItem = this.items.pop();
            oldItem.style.opacity = '0';
            oldItem.style.transform = 'translateX(20px)';
            setTimeout(() => oldItem.remove(), 300);
        }
        
        // 添加到达动画
        setTimeout(() => {
            item.classList.add('bounce');
        }, 50);
    }
    
    clear() {
        this.items.forEach(item => item.remove());
        this.items = [];
    }
}

// ==================== 页面切换动画 ====================
function pageTransitionAnimation(content, callback) {
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px)';
    content.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
        callback();
        setTimeout(() => {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 50);
    }, 300);
}

// ==================== 告警闪烁动画 ====================
function alarmFlashAnimation(element, level = 'warning') {
    const colors = {
        critical: 'rgba(255, 68, 68, 0.3)',
        warning: 'rgba(255, 193, 7, 0.3)',
        info: 'rgba(0, 212, 255, 0.3)'
    };
    
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        element.style.backgroundColor = flashCount % 2 === 0 ? colors[level] : 'transparent';
        flashCount++;
        if (flashCount >= 6) {
            clearInterval(flashInterval);
            element.style.backgroundColor = '';
        }
    }, 200);
}

// ==================== 进度环动画 ====================
function animateProgressRing(element, percent, duration = 2000) {
    const radius = element.getAttribute('r') || 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    element.style.strokeDasharray = `${circumference} ${circumference}`;
    element.style.strokeDashoffset = circumference;
    element.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
    
    setTimeout(() => {
        element.style.strokeDashoffset = offset;
    }, 100);
}

// ==================== 初始化全局动画 ====================
let particleSystem = null;

function initAnimations() {
    // 初始化粒子背景
    particleSystem = new ParticleSystem(document.body, 60);
    
    // 初始化统计卡片动画
    setTimeout(animateStatCards, 500);
    
    // 定时刷新数据动画
    setInterval(() => {
        if (currentPage === 'monitoring') {
            const cards = document.querySelectorAll('.stat-card');
            cards.forEach(card => flashDataUpdate(card));
        }
    }, 10000);
    
    console.log('✅ 动画系统初始化完成');
}

// 暴露全局方法
window.AnimationSystem = {
    animateNumber,
    animateStatCards,
    ParticleSystem,
    MapAnimationSystem,
    flashDataUpdate,
    animateTableRows,
    enhanceChartAnimation,
    enhanceTopologyAnimation,
    DataStreamAnimation,
    pageTransitionAnimation,
    alarmFlashAnimation,
    animateProgressRing,
    initAnimations
};

// 智慧港口综合管理系统 - 主应用文件

// 页面路由映射（使用函数延迟绑定，避免加载顺序问题）
function getPageRenderer(page) {
    const renderers = {
        dashboard: typeof renderDashboard !== 'undefined' ? renderDashboard : (typeof render_dashboard !== 'undefined' ? render_dashboard : null),
        ship: typeof renderShip !== 'undefined' ? renderShip : null,
        berth: typeof renderBerth !== 'undefined' ? renderBerth : null,
        yard: typeof renderYard !== 'undefined' ? renderYard : null,
        equipment: typeof renderEquipment !== 'undefined' ? renderEquipment : null,
        operation: typeof renderOperation !== 'undefined' ? renderOperation : null,
        analytics: typeof renderAnalytics !== 'undefined' ? renderAnalytics : null,
        optimization: typeof renderOptimization !== 'undefined' ? renderOptimization : null
    };
    return renderers[page];
}

// 当前页面
let currentPage = 'dashboard';

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTimeDisplay();
    navigateTo('dashboard');
    initRealtimeData();
});

// 初始化导航
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

// 页面导航
function navigateTo(page) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // 渲染页面
    const content = document.getElementById('page-content');
    const renderer = getPageRenderer(page);
    if (renderer) {
        currentPage = page;
        renderer(content);
    }
}

// 时间显示
function initTimeDisplay() {
    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const timeEl = document.getElementById('currentTime');
        if (timeEl) {
            timeEl.textContent = timeStr;
        }
    }
    updateTime();
    setInterval(updateTime, 1000);
}

// 实时数据更新
function initRealtimeData() {
    setInterval(() => {
        // 更新吞吐量
        const throughputEl = document.getElementById('today-throughput');
        if (throughputEl) {
            const current = parseInt(throughputEl.textContent.replace(/,/g, ''));
            throughputEl.textContent = (current + Math.floor(Math.random() * 5)).toLocaleString();
        }

        // 更新在港船舶
        const shipsEl = document.getElementById('ships-in-port');
        if (shipsEl && Math.random() > 0.9) {
            const current = parseInt(shipsEl.textContent);
            shipsEl.textContent = current + (Math.random() > 0.5 ? 1 : -1);
        }

        // 更新作业桥吊
        const cranesEl = document.getElementById('cranes-active');
        if (cranesEl && Math.random() > 0.95) {
            const current = parseInt(cranesEl.textContent);
            const delta = Math.random() > 0.5 ? 1 : -1;
            const newVal = Math.max(8, Math.min(16, current + delta));
            cranesEl.textContent = newVal;
        }
    }, 3000);
}

// 模态框控制
function openModal(title, content) {
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = content;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
}

// Toast 通知
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '\u2713',
        error: '\u2717',
        warning: '\u26a0',
        info: '\u2139'
    };
    
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 获取 ECharts 实例
function getECharts() {
    return typeof echarts !== 'undefined' ? echarts : null;
}

// 格式化数字
function formatNumber(num) {
    return num.toLocaleString();
}

// 格式化时间
function formatTime(date) {
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// 模拟数据生成器
const MockData = {
    ships: [
        { name: '中远海运宁波', imo: '9484093', type: '集装箱船', tonnage: 150000, length: 366, beam: 51, draft: 14.5, company: '中远海运' },
        { name: '马士基汉堡', imo: '9526287', type: '集装箱船', tonnage: 190000, length: 399, beam: 59, draft: 16.0, company: '马士基' },
        { name: '达飞塔霍', imo: '9706871', type: '集装箱船', tonnage: 210000, length: 400, beam: 61, draft: 16.5, company: '达飞海运' },
        { name: '长赐号', imo: '9445817', type: '集装箱船', tonnage: 220000, length: 400, beam: 59, draft: 16.0, company: '长荣海运' },
        { name: '中海之春', imo: '9301875', type: '散货船', tonnage: 180000, length: 299, beam: 50, draft: 18.5, company: '中海集团' },
        { name: '海洋石油118', imo: '9516439', type: '油轮', tonnage: 300000, length: 333, beam: 60, draft: 22.5, company: '中国石化' },
        { name: '新美洲', imo: '9632291', type: '集装箱船', tonnage: 140000, length: 366, beam: 51, draft: 14.5, company: '中远海运' },
        { name: '东方海外香港', imo: '9627991', type: '集装箱船', tonnage: 215000, length: 400, beam: 59, draft: 16.0, company: '东方海外' }
    ],

    berths: [
        { id: 'B01', name: '1号泊位', length: 400, depth: 16.5, type: '集装箱', status: 'working', utilization: 85 },
        { id: 'B02', name: '2号泊位', length: 400, depth: 16.5, type: '集装箱', status: 'working', utilization: 72 },
        { id: 'B03', name: '3号泊位', length: 380, depth: 15.5, type: '集装箱', status: 'waiting', utilization: 45 },
        { id: 'B04', name: '4号泊位', length: 350, depth: 14.0, type: '散货', status: 'working', utilization: 90 },
        { id: 'B05', name: '5号泊位', length: 380, depth: 18.0, type: '油轮', status: 'idle', utilization: 0 },
        { id: 'B06', name: '6号泊位', length: 400, depth: 16.5, type: '集装箱', status: 'working', utilization: 68 },
        { id: 'B07', name: '7号泊位', length: 350, depth: 14.0, type: '散货', status: 'maintenance', utilization: 0 },
        { id: 'B08', name: '8号泊位', length: 400, depth: 16.5, type: '集装箱', status: 'working', utilization: 78 }
    ],

    equipment: {
        cranes: [
            { id: 'QC01', name: '桥吊1号', status: 'working', position: { x: 100, y: 50 }, efficiency: 32, todayMoves: 128 },
            { id: 'QC02', name: '桥吊2号', status: 'working', position: { x: 180, y: 50 }, efficiency: 28, todayMoves: 115 },
            { id: 'QC03', name: '桥吊3号', status: 'working', position: { x: 260, y: 50 }, efficiency: 35, todayMoves: 142 },
            { id: 'QC04', name: '桥吊4号', status: 'idle', position: { x: 340, y: 50 }, efficiency: 0, todayMoves: 89 },
            { id: 'QC05', name: '桥吊5号', status: 'working', position: { x: 420, y: 50 }, efficiency: 30, todayMoves: 121 },
            { id: 'QC06', name: '桥吊6号', status: 'maintenance', position: { x: 500, y: 50 }, efficiency: 0, todayMoves: 0 }
        ],
        rtgs: [
            { id: 'RT01', name: '轮胎吊1号', status: 'working', position: { x: 150, y: 150 }, efficiency: 25, todayMoves: 98 },
            { id: 'RT02', name: '轮胎吊2号', status: 'working', position: { x: 280, y: 180 }, efficiency: 22, todayMoves: 87 },
            { id: 'RT03', name: '轮胎吊3号', status: 'idle', position: { x: 400, y: 160 }, efficiency: 0, todayMoves: 76 },
            { id: 'RT04', name: '轮胎吊4号', status: 'working', position: { x: 200, y: 200 }, efficiency: 28, todayMoves: 105 },
            { id: 'RT05', name: '轮胎吊5号', status: 'working', position: { x: 350, y: 220 }, efficiency: 24, todayMoves: 92 }
        ],
        agvs: [
            { id: 'AG01', name: 'AGV01', status: 'working', position: { x: 120, y: 120 }, battery: 85, deliveries: 156 },
            { id: 'AG02', name: 'AGV02', status: 'working', position: { x: 250, y: 130 }, battery: 72, deliveries: 142 },
            { id: 'AG03', name: 'AGV03', status: 'charging', position: { x: 380, y: 140 }, battery: 25, deliveries: 128 },
            { id: 'AG04', name: 'AGV04', status: 'working', position: { x: 180, y: 170 }, battery: 90, deliveries: 165 },
            { id: 'AG05', name: 'AGV05', status: 'working', position: { x: 320, y: 190 }, battery: 68, deliveries: 138 },
            { id: 'AG06', name: 'AGV06', status: 'idle', position: { x: 450, y: 180 }, battery: 95, deliveries: 112 }
        ]
    },

    yard: {
        blocks: [
            { id: 'A01', utilization: 75, containers: 156, type: '出口' },
            { id: 'A02', utilization: 82, containers: 172, type: '出口' },
            { id: 'A03', utilization: 45, containers: 95, type: '进口' },
            { id: 'B01', utilization: 92, containers: 192, type: '中转' },
            { id: 'B02', utilization: 68, containers: 142, type: '出口' },
            { id: 'B03', utilization: 55, containers: 115, type: '进口' },
            { id: 'C01', utilization: 38, containers: 80, type: '空箱' },
            { id: 'C02', utilization: 70, containers: 146, type: '出口' },
            { id: 'C03', utilization: 88, containers: 184, type: '危险品' },
            { id: 'D01', utilization: 62, containers: 130, type: '进口' }
        ],
        total: 1500,
        available: 450
    },

    operations: [
        { id: 'OP001', ship: '中远海运宁波', berth: 'B01', crane: 'QC01', progress: 68, total: 4500, completed: 3060, startTime: '2024-05-12 08:30', eta: '2024-05-13 02:00', efficiency: 32 },
        { id: 'OP002', ship: '马士基汉堡', berth: 'B02', crane: 'QC02', progress: 45, total: 3800, completed: 1710, startTime: '2024-05-12 10:15', eta: '2024-05-13 06:30', efficiency: 28 },
        { id: 'OP003', ship: '达飞塔霍', berth: 'B06', crane: 'QC05', progress: 82, total: 5200, completed: 4264, startTime: '2024-05-11 14:00', eta: '2024-05-12 20:00', efficiency: 35 },
        { id: 'OP004', ship: '中海之春', berth: 'B04', crane: 'QC03', progress: 55, total: 2500, completed: 1375, startTime: '2024-05-12 06:00', eta: '2024-05-12 22:00', efficiency: 30 }
    ],

    alarms: [
        { id: 'AL001', level: 'critical', time: '14:32:15', title: '桥吊3号液压系统故障', device: 'QC03' },
        { id: 'AL002', level: 'warning', time: '14:28:03', title: 'B02泊位船舶作业延误', ship: '马士基汉堡' },
        { id: 'AL003', level: 'warning', time: '14:15:22', title: 'AGV03电量低于30%', device: 'AG03' },
        { id: 'AL004', level: 'info', time: '13:58:45', title: '长赐号预计18:00到港', ship: '长赐号' },
        { id: 'AL005', level: 'info', time: '13:45:10', title: 'B03泊位作业即将完成', berth: 'B03' }
    ]
};

// 其他辅助函数
function showShipDetail(shipName) {
    openModal('船舶详情 - ' + shipName, `
        <div style="padding: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4 style="color: #00d4ff; margin-bottom: 15px;">基本信息</h4>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>IMO编号:</strong> 9484093</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>船舶类型:</strong> 集装箱船</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>载重吨:</strong> 150,000 DWT</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>船长:</strong> 366米</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>型宽:</strong> 51米</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>吃水:</strong> 14.5米</p>
                </div>
                <div>
                    <h4 style="color: #00d4ff; margin-bottom: 15px;">作业信息</h4>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>靠泊泊位:</strong> B01</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>靠泊时间:</strong> 2024-05-11 14:30</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>总作业箱量:</strong> 4,500 TEU</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>已完成:</strong> 3,060 TEU (68%)</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>作业效率:</strong> 32 箱/小时</p>
                    <p style="margin-bottom: 10px; color: #a0c4e8;"><strong>预计离港:</strong> 2024-05-13 02:00</p>
                </div>
            </div>
        </div>
    `);
}

function showEquipmentDetail(equipmentId) {
    showToast('设备详情功能开发中...', 'info');
}

function showBlockDetail(blockId) {
    showToast('贝位详情功能开发中...', 'info');
}

function refreshShipData() {
    showToast('数据已刷新', 'success');
}

function exportResult() {
    showToast('方案导出功能开发中...', 'info');
}

function applyResult() {
    showToast('泊位分配方案已应用', 'success');
}

// 选项卡切换通用函数
function switchTab(tabId, tabContainer) {
    document.querySelectorAll(tabContainer + ' .tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        }
    });
}

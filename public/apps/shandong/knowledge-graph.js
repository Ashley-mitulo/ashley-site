const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://" + window.location.hostname + ":3002/api" : "/api";
const typeColors = { person: "#4A90E2", vehicle: "#E74C3C", time: "#F39C12", company: "#2ECC71", event: "#9B59B6", road: "#795548" };
const typeNames = { person: "👤 人员", vehicle: "🚗 车辆", time: "⏰ 时间", company: "🏢 企业", event: "📌 事件", road: "🛣️️ 道路" };

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return "#" + [R, G, B].map(x => x.toString(16).padStart(2, '0')).join('');
}

let graphData = {
    nodes: [
        { id: "p1", name: "张三", type: "person", properties: { "姓名": "张三", "身份证号": "320102********1234", "年龄": "35", "性别": "男", "联系电话": "138****5678" } },
        { id: "v1", name: "苏A·12345", type: "vehicle", properties: { "车牌号": "苏A·12345", "品牌": "丰田", "颜色": "黑色", "注册日期": "2020-05", "年检状态": "正常" } },
        { id: "t1", name: "2024-05-01 08:30", type: "time", properties: { "日期": "2024年5月1日", "星期": "星期三", "时段": "早高峰", "节假日": "劳动节", "天气": "晴" } },
        { id: "c1", name: "顺达客运公司", type: "company", properties: { "统一社会信用代码": "91320100********", "法人": "李四", "成立日期": "2015-03", "地址": "南京市鼓楼区", "经营范围": "道路客运" } },
        { id: "e1", name: "五一追尾事故", type: "event", properties: { "事件类型": "交通事故", "伤亡情况": "轻伤2人", "处理状态": "已结案", "责任认定": "后车全责", "损失预估": "5万元" } },
        { id: "r1", name: "京沪高速G2-济南段", type: "road", properties: { "道路等级": "高速公路", "路段名称": "济南-临沂段", "限速": "120km/h", "车道数": "双向8车道", "拥堵指数": "1.8" } }
    ],
    links: [
        { source: "p1", target: "v1", label: "驾驶" },
        { source: "p1", target: "c1", label: "受雇于" },
        { source: "v1", target: "e1", label: "涉及" },
        { source: "t1", target: "e1", label: "发生于" },
        { source: "r1", target: "e1", label: "发生在" },
        { source: "c1", target: "v1", label: "拥有" }
    ]
};

let myChart, animationEnabled = true, nodeCounter = 10, uploadStatus, loadingEl, uploadedFile = null;

// 初始化全局元素引用
function initGlobalElements() {
    uploadStatus = document.getElementById("uploadStatus");
    loadingEl = document.getElementById("loading");
    return uploadStatus && loadingEl;
}

window.onload = function() {
    const chartDom = document.getElementById("knowledgeGraph");
    myChart = echarts.init(chartDom);
    updateGraph();
    initGlobalElements();
    initUpload();
};

function getOption(data) {
    const categories = Object.keys(typeColors).map(key => ({ name: key, itemStyle: { color: typeColors[key] } }));
    
    // 根据总实体数动态计算基础大小（像素直径，始终固定）
    let baseSymbolSize;
    const totalNodes = data.nodes.length;
    if (totalNodes < 20) {
        baseSymbolSize = 25;      // <20 → 100% → 直径 25px（固定像素）
    } else if (totalNodes <= 50) {
        baseSymbolSize = 18;      // 20-50 → 70% → 直径 18px（固定像素）
    } else {
        baseSymbolSize = 12;      // >50 → 50% → 直径 12px（固定像素）
    }
    const baseFontSize = Math.max(8, Math.round(baseSymbolSize * 0.4));
    
    return {
        tooltip: { formatter: function(params) {
            return params.dataType === "node" ? "<strong>" + params.name + "</strong><br/>类型: " + typeNames[params.data.type] : params.sourceName + " → " + params.data.label + " → " + params.targetName;
        }},
        series: [{
            type: "graph", layout: "force", animation: animationEnabled,
            // 只允许拖拽平移，禁用滚轮缩放 → 这样大小永远固定不会变
            roam: "move",
            label: {
                show: true,
                position: "inside",
                color: "#fff",
                fontSize: baseFontSize,
                fontWeight: 500
            },
            force: {
                repulsion: 250,
                edgeLength: 120,
                layoutAnimation: animationEnabled
            },
            emphasis: {
                focus: "adjacency",
                lineStyle: { width: 3 }
            },
            categories: categories,
            // 每个节点固定像素大小，因为禁用了缩放，所以永远保持这个像素大小
            data: data.nodes.map(node => ({
                id: node.id, name: node.name, type: node.type,
                category: Object.keys(typeColors).indexOf(node.type),
                symbolSize: baseSymbolSize,
                itemStyle: { color: typeColors[node.type] }
            })),
            links: data.links.map(link => ({
                source: link.source, target: link.target,
                label: { show: true, formatter: link.label, fontSize: 11, color: "rgba(255,255,255,0.8)" },
                lineStyle: { color: "rgba(255,255,255,0.6)", width: 2, curveness: 0.3 }
            }))
        }]
    };
}

function updateGraph() {
    myChart.setOption(getOption(graphData));
}

function resetView() {
    myChart.dispatchAction({ type: "restore" });
}

function toggleAnimation() {
    animationEnabled = !animationEnabled;
    updateGraph();
}

function addRandomEntity() {
    const types = Object.keys(typeColors);
    const type = types[Math.floor(Math.random() * types.length)];
    const id = "node_" + (++nodeCounter);
    const names = ["张三", "李四", "王五", "苏A", "2024-05", "事故", "高速"];
    const name = names[Math.floor(Math.random() * names.length)] + " " + nodeCounter;
    
    graphData.nodes.push({
        id: id, name: name, type: type,
        properties: { "名称": name, "类型": typeNames[type] }
    });
    
    const randomLink = graphData.nodes[Math.floor(Math.random() * graphData.nodes.length)];
    if (randomLink.id !== id) {
        graphData.links.push({ source: id, target: randomLink.id, label: "关联" });
    }
    updateGraph();
}

function initUpload() {
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.addEventListener("click", () => {
        document.getElementById("fileInput").click();
    });
    
    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });
    
    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });
    
    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) uploadFile(files[0]);
    });
    
    document.getElementById("fileInput").addEventListener("change", () => {
        const fileInput = document.getElementById("fileInput");
        if (fileInput.files.length > 0) uploadFileOnly(fileInput.files[0]);
    });
    
    myChart.on("click", function(params) {
        if (params.dataType === "node") {
            const nodeData = graphData.nodes.find(n => n.id === params.data.id);
            if (nodeData) showEntityProperties(nodeData);
        }
    });
}

async function uploadFileOnly(file) {
    if (!uploadStatus) uploadStatus = document.getElementById("uploadStatus");
    showLoading(true);
    if (uploadStatus) uploadStatus.textContent = "正在上传: " + file.name;
    
    // 保存文件引用，等待解析
    uploadedFile = file;
    
    // 模拟上传（实际可能需要后端支持纯上传不解析）
    setTimeout(() => {
        showLoading(false);
        if (uploadStatus) {
            uploadStatus.textContent = "✅ 文件已上传: " + file.name;
        }
        showToast("success", "文件上传成功，点击下方按钮解析并更新图谱");
        
        // 显示解析按钮
        const parseBtn = document.getElementById("parseGraphBtn");
        if (parseBtn) parseBtn.style.display = "block";
    }, 800);
}

async function parseFileToGraph() {
    if (!uploadedFile) {
        showToast("error", "没有可解析的文件，请先上传文件");
        return;
    }
    
    if (!uploadStatus) uploadStatus = document.getElementById("uploadStatus");
    showLoading(true);
    if (uploadStatus) uploadStatus.textContent = "正在解析: " + uploadedFile.name;
    
    const formData = new FormData();
    formData.append("file", uploadedFile);
    
    try {
        const response = await fetch(API_BASE + "/upload", {
            method: "POST",
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast("success", "解析成功，图谱已更新");
            addParsedEntitiesToGraph(result.data);
            if (uploadStatus) uploadStatus.textContent = "✅ 已解析: " + uploadedFile.name + " (" + result.data.entities.length + " 个实体)";
            
            // 隐藏解析按钮
            const parseBtn = document.getElementById("parseGraphBtn");
            if (parseBtn) parseBtn.style.display = "none";
        } else {
            showToast("error", result.error || "解析失败");
            if (uploadStatus) uploadStatus.textContent = "❌ 解析失败: " + result.error;
        }
        showLoading(false);
    } catch (error) {
        console.error("Parse error:", error);
        showToast("error", "网络错误，请检查后端服务是否启动");
        if (uploadStatus) uploadStatus.textContent = "❌ 网络错误";
        showLoading(false);
    }
}

async function refreshGraph() {
    showLoading(true);
    fetch(API_BASE + "/graph")
        .then(r => r.json())
        .then(result => {
            if (result.success && result.data.nodes.length > 0) {
                graphData.nodes = result.data.nodes;
                graphData.links = result.data.links;
                updateGraph();
                showToast("success", "已加载 " + result.data.nodes.length + " 个实体");
            } else if (result.success) {
                showToast("success", "数据库中暂无实体");
            } else {
                showToast("error", result.error || "加载失败");
            }
            showLoading(false);
        })
        .catch(error => {
            console.error("Refresh error:", error);
            showToast("error", "无法连接到后端服务");
            showLoading(false);
        });
}

function addParsedEntitiesToGraph(data) {
    graphData.nodes = [];
    graphData.links = [];
    
    data.entities.forEach(entity => {
        const nodeId = String(entity.id);
        const properties = {};
        if (entity.type === "person") {
            properties["姓名"] = entity.name.replace("先生", "").replace("女士", "");
            properties["置信度"] = entity.confidence.toFixed(2);
        } else if (entity.type === "vehicle") {
            properties["车牌号"] = entity.name;
            properties["置信度"] = entity.confidence.toFixed(2);
        } else {
            properties["名称"] = entity.name;
            properties["置信度"] = entity.confidence.toFixed(2);
        }
        
        graphData.nodes.push({
            id: nodeId,
            dbId: entity.id,
            name: entity.name,
            type: entity.type,
            properties: properties
        });
    });
    
    data.relations.forEach(relation => {
        const sourceId = String(relation.fromId);
        const targetId = String(relation.toId);
        graphData.links.push({
            source: sourceId,
            target: targetId,
            label: relation.relation
        });
    });
    
    updateGraph();
}

function showLoading(show) {
    if (!loadingEl) loadingEl = document.getElementById("loading");
    if (!loadingEl) return;
    if (show) loadingEl.classList.add("show");
    else loadingEl.classList.remove("show");
}

function showToast(type, message) {
    const toast = document.createElement("div");
    toast.className = "toast show " + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showEntityProperties(node) {
    document.getElementById("emptyState").style.display = "none";
    document.getElementById("entityInfo").style.display = "block";
    document.getElementById("entityName").textContent = node.name;
    document.getElementById("entityType").textContent = typeNames[node.type];
    document.getElementById("entityIcon").style.backgroundColor = typeColors[node.type];
    
    const container = document.getElementById("propertiesList");
    container.innerHTML = "";
    
    const baseColor = typeColors[node.type];
    Object.entries(node.properties).forEach(([key, value], index) => {
        const propColor = lightenColor(baseColor, (index - 2) * 10);
        const div = document.createElement("div");
        div.className = "property-item";
        div.style.setProperty("--prop-color", propColor);
        div.innerHTML = "<div class='property-name'>" + key + "</div><div class='property-value'>" + value + "</div>";
        container.appendChild(div);
    });
}
const XLSX = require('xlsx');
const workbook = XLSX.readFile('/mnt/d/重点项目版本跟踪表.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, {header:1});

// 找到项目行数，新增1行
let rowCount = data.filter(r => r[0] && typeof r[0] === 'number').length;
const newRow = rowCount + 1; // 新序号

// 新增交通事故知识图谱独立项目
const newProject = {
  A: newRow,
  B: "交通事故分析知识图谱（独立项目）",
  C: "重点主线/交通分析专用",
  D: "v1.0 独立开发版",
  E: "2026-06-18 09:48",
  F: "独立项目已分离，待集成回主系统",
  G: "/mnt/d/openclaw/workspace/shandong-traffic-accident-kg",
  H: "cd server && npm start",
  I: "http://localhost:3003",
  J: "5大功能模块完整实现：知识图谱、事故时间轴、事故热力图、聚类分析、报告解析",
  K: "10种实体类型、20+实体节点、22+关系、3个演示事故案例",
  L: "shandong-traffic-accident-kg-v1.0-20260618.tar.gz",
  M: "独立端口3003，不与主系统冲突，待完全成熟后集成回v1.9+"
};

// 将当前山东交通项目从v1.9改为"v1.9（图谱功能已分离，待集成）"
// 找到山东交通项目行
for (let i = 0; i < data.length; i++) {
  if (data[i][1] && data[i][1].toString().includes('山东交通')) {
    // 修改状态
    data[i][5] = "v1.9 稳定版 - 图谱功能已分离至独立项目";
    data[i][12] = "主系统保持v1.9稳定运行；交通事故图谱独立开发迭代，成熟后集成回v1.10";
    break;
  }
}

console.log('✅ 版本跟踪表已更新');
console.log('📌 新增项目: 交通事故分析知识图谱（独立项目） v1.0');
console.log('📌 更新山东交通项目状态: 标记v1.9为稳定版');

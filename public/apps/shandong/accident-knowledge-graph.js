// ==================== 🚗 交通事故分析知识图谱 ====================
// 完全复用通用知识图谱逻辑，专为交通事故优化
// 所有变量加 accKg 前缀，避免命名冲突

// 交通事故分析知识图谱全局变量
let accKgAnimationEnabled = true;

// 交通事故专用实体类型配置
const accEntityTypeNames = {
  person:     { name: '👤 当事人/司机', color: '#4A90E2' },
  vehicle:    { name: '🚗 车辆', color: '#E74C3C' },
  time:       { name: '⏰ 事故时间', color: '#F39C12' },
  accident:   { name: '⚠️ 交通事故', color: '#D97706' },
  road:       { name: '🛣️ 道路', color: '#795548' },
  weather:    { name: '🌤️ 天气', color: '#0EA5E9' },
  violation:  { name: '❌ 违法行为', color: '#9333EA' },
  injury:     { name: '🩹 伤亡情况', color: '#DC2626' },
  liability:  { name: '⚖️ 责任认定', color: '#059669' },
  insurance:  { name: '🏦 保险信息', color: '#7C3AED' }
};

// 默认演示数据：京沪高速追尾事故
const accKgDefaultData = {
  nodes: [
    { id: 'acc1', name: '2024-05-01 京沪高速追尾事故', type: 'accident', properties: { '事故类型': '追尾碰撞', '发生地点': '京沪高速济南段K415+600', '事故等级': '一般事故', '处理状态': '已结案' } },
    { id: 'p1', name: '张某(后车司机)', type: 'person', properties: { '姓名': '张某', '性别': '男', '年龄': '35岁', '驾驶证号': '370102********1234', '驾龄': '8年' } },
    { id: 'p2', name: '李某(前车司机)', type: 'person', properties: { '姓名': '李某', '性别': '男', '年龄': '42岁', '驾驶证号': '370103********5678', '驾龄': '15年' } },
    { id: 'v1', name: '鲁A·12345(后车)', type: 'vehicle', properties: { '车牌号': '鲁A·12345', '品牌': '大众帕萨特', '颜色': '黑色', '车辆类型': '小型轿车', '年检状态': '正常' } },
    { id: 'v2', name: '鲁B·67890(前车)', type: 'vehicle', properties: { '车牌号': '鲁B·67890', '品牌': '丰田凯美瑞', '颜色': '白色', '车辆类型': '小型轿车', '年检状态': '正常' } },
    { id: 't1', name: '2024-05-01 08:30', type: 'time', properties: { '日期': '2024年5月1日', '星期': '星期三', '时段': '早高峰', '节假日': '劳动节' } },
    { id: 'r1', name: '京沪高速济南段', type: 'road', properties: { '道路等级': '高速公路', '限速': '120km/h', '车道数': '双向8车道', '路况': '小雨湿滑' } },
    { id: 'w1', name: '小雨', type: 'weather', properties: { '天气状况': '小雨', '能见度': '800米', '路面状态': '湿滑', '气温': '18°C' } },
    { id: 'vi1', name: '未保持安全车距', type: 'violation', properties: { '违法行为': '未保持安全车距', '违反条款': '道路交通安全法第43条', '处罚': '罚款200元,记2分' } },
    { id: 'inj1', name: '轻微伤2人', type: 'injury', properties: { '伤亡情况': '轻微伤2人', '受伤人员': '张某、李某', '送医情况': '自行前往,无需住院' } },
    { id: 'l1', name: '后车全责', type: 'liability', properties: { '责任认定': '后车全责', '认定依据': '未保持安全车距', '认定书编号': '第202405010830号' } },
    { id: 'i1', name: '平安保险', type: 'insurance', properties: { '保险公司': '平安保险山东分公司', '保单号': 'PA20243701000012345', '承保类型': '交强险+商业险', '理赔状态': '已受理' } }
  ],
  links: [
    { source: 'p1', target: 'v1', label: '驾驶', confidence: 0.95 },
    { source: 'p2', target: 'v2', label: '驾驶', confidence: 0.95 },
    { source: 'v1', target: 'acc1', label: '涉及事故', confidence: 0.98 },
    { source: 'v2', target: 'acc1', label: '涉及事故', confidence: 0.98 },
    { source: 't1', target: 'acc1', label: '发生于', confidence: 1.0 },
    { source: 'r1', target: 'acc1', label: '发生在', confidence: 1.0 },
    { source: 'w1', target: 'acc1', label: '事故时天气', confidence: 0.85 },
    { source: 'vi1', target: 'acc1', label: '事故原因', confidence: 0.90 },
    { source: 'vi1', target: 'p1', label: '违法行为人', confidence: 0.95 },
    { source: 'inj1', target: 'acc1', label: '造成', confidence: 0.90 },
    { source: 'l1', target: 'acc1', label: '责任认定', confidence: 1.0 },
    { source: 'l1', target: 'p1', label: '承担全部责任', confidence: 0.95 },
    { source: 'i1', target: 'v1', label: '承保', confidence: 0.88 },
    { source: 'i1', target: 'acc1', label: '理赔中', confidence: 0.82 }
  ]
};

let accKgChart = null;
let accKgUploadedFile = null;
let accKgCurrentNodes = [];
let accKgCurrentLinks = [];
let accKgAllNodes = [];
let accKgAllLinks = [];
let accKgNodeFrequency = {};

function renderAccidentKnowledgeGraph() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <style>
      #accKgBrowseContainer * { margin: 0; padding: 0; box-sizing: border-box; }
      #accKgBrowseContainer { display: flex; height: calc(100vh - 200px); gap: 16px; padding: 0; }
      #accKgLegendPanel { width: 200px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: calc(100vh - 220px); overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: #94a3b8 #e2e8f0; }
      .accKg-panel-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; color: #1e293b; }

      #accKgLegendPanel::-webkit-scrollbar { width: 8px; }
      #accKgLegendPanel::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 10px; }
      #accKgLegendPanel::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
      #accKgLegendPanel::-webkit-scrollbar-thumb:hover { background: #64748b; }

      .accKg-legend-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border-radius: 6px; transition: all 0.2s; border: 1px solid #e2e8f0; }
      .accKg-legend-item:hover { background: #f1f5f9; transform: translateX(2px); }
      .accKg-legend-color { width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.1); border-radius: 4px; }
      .accKg-person { background: #4A90E2; }
      .accKg-vehicle { background: #E74C3C; }
      .accKg-time { background: #F39C12; }
      .accKg-accident { background: #D97706; }
      .accKg-road { background: #795548; }
      .accKg-weather { background: #0EA5E9; }
      .accKg-violation { background: #9333EA; }
      .accKg-injury { background: #DC2626; }
      .accKg-liability { background: #059669; }
      .accKg-insurance { background: #7C3AED; }
      .accKg-graph-container { flex: 1; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; position: relative; }
      #accidentKnowledgeGraph { width: 100%; height: 100%; position: relative; z-index: 1; cursor: grab !important; }
      #accidentKnowledgeGraph:active { cursor: grabbing !important; }
      #accKgPropertyPanel { width: 260px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; display: flex; flex-direction: column; }
      .accKg-empty-state { text-align: center; margin-top: 40px; opacity: 0.5; color: #64748b; }
      .accKg-entity-info { display: none; }
      .accKg-entity-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
      .accKg-entity-icon { width: 36px; height: 36px; border-radius: 50%; border: 3px solid rgba(0,0,0,0.1); }
      .accKg-entity-name { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
      .accKg-entity-type { font-size: 11px; padding: 2px 6px; border-radius: 8px; background: #e2e8f0; display: inline-block; color: #475569; }
      .accKg-properties-list { display: flex; flex-direction: column; gap: 10px; }
      .accKg-property-item { background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid var(--prop-color); }
      .accKg-property-name { font-size: 11px; color: #64748b; margin-bottom: 3px; }
      .accKg-property-value { font-size: 13px; font-weight: 500; color: #1e293b; }
      .accKg-toolbar { position: absolute; top: 12px; left: 12px; z-index: 10; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; gap: 6px; }
      .accKg-upload-area { position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(0,0,0,0.05); border: 2px dashed rgba(0,0,0,0.1); border-radius: 8px; padding: 12px; transition: all 0.2s; max-width: 180px; }
      .accKg-upload-area.dragover { border-color: #2ECC71; background: rgba(46, 204, 113, 0.2); }
      .accKg-upload-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; text-align: center; color: #333; }
      .accKg-upload-btn { width: 100%; padding: 6px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(46, 204, 113, 0.6); color: #fff; cursor: pointer; font-size: 11px; transition: all 0.2s; margin-bottom: 4px; }
      .accKg-upload-btn:hover { background: rgba(46, 204, 113, 0.8); }
      .accKg-parse-btn { background: rgba(155, 89, 182, 0.6); border-color: rgba(155, 89, 182, 0.5); }
      .accKg-parse-btn:hover { background: rgba(155, 89, 182, 0.8); }
      .accKg-upload-status { font-size: 10px; margin-top: 6px; opacity: 0.7; word-break: break-all; color: #666; }
      .accKg-file-input { display: none; }
      .accKg-tool-btn { width: 32px; height: 32px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; }
      .accKg-tool-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
      .accKg-loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); padding: 24px 40px; border-radius: 12px; text-align: center; display: none; z-index: 100; color: #fff; }
      .accKg-loading.show { display: block; }
      .accKg-spinner { width: 32px; height: 32px; margin: 0 auto 12px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #2ECC71; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg

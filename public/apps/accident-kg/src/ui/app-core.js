
// ==================== 实体颜色配置 ====================
const entityColors = {
  person: { name: '👤 当事人', color: '#3b82f6' },
  vehicle: { name: '🚗 车辆', color: '#ef4444' },
  time: { name: '⏰ 事故时间', color: '#f59e0b' },
  accident_category: { name: '📋 事故分类', color: '#ea580c' },
  accident: { name: '⚠️ 具体事故', color: '#f97316' },
  road: { name: '🛣️ 道路', color: '#78716c' },
  weather: { name: '🌤️ 天气', color: '#0ea5e9' },
  violation: { name: '❌ 违法/过错行为', color: '#a855f7' },
  fault_factor: { name: '🌧️ 事故诱因', color: '#06b6d4' },
  fault_category: { name: '🧭 过错大类', color: '#7c3aed' },
  weather_category: { name: '🌤️ 天气分类', color: '#0284c7' },
  weather: { name: '🌦️ 具体天气', color: '#0ea5e9' },
  vehicle_category: { name: '🚛 车辆分类', color: '#dc2626' },
  vehicle: { name: '🚗 具体车辆', color: '#ef4444' },
  road_category: { name: '🛣️ 道路分类', color: '#78716c' },
  road: { name: '📍 具体道路', color: '#a8a29e' },
  time_category: { name: '⏰ 时间分类', color: '#f59e0b' },
  time: { name: '🕒 具体时间', color: '#fbbf24' },
  injury_category: { name: '🏥 伤亡分类', color: '#b45309' },
  injury: { name: '🩹 具体伤亡', color: '#dc2626' },
  liability_category: { name: '📋 责任分类', color: '#047857' },
  liability: { name: '⚖️ 具体责任', color: '#10b981' },
  // v3.4.7 Bug5: 标准报告模板扩充 4 类实体
  city: { name: '🏙️ 市', color: '#0891b2' },
  district: { name: '🗺️ 区/县', color: '#0e7490' },
  direction: { name: '🧭 行驶方向', color: '#059669' },
  collision_position: { name: '💥 碰撞部位', color: '#e11d48' },
  chain_gap: { name: '🕳️ 链路缺口', color: '#f97316' },
  insurance: { name: '🏦 保险信息', color: '#8b5cf6' }
};

// ==================== 关系强度配置 ====================
// 强关联: 红色粗线 | 中强关联: 蓝色中线 | 弱关联: 灰色细线
const relationStrength = {
  '驾驶': { strength: 'strong', color: '#dc2626', width: 3, name: '强关联' },
  '事故原因': { strength: 'strong', color: '#dc2626', width: 3, name: '强关联' },
  '承担': { strength: 'strong', color: '#dc2626', width: 3, name: '强关联' },
  '造成': { strength: 'strong', color: '#dc2626', width: 3, name: '强关联' },
  '涉及': { strength: 'medium', color: '#3b82f6', width: 2, name: '中强关联' },
  '责任认定': { strength: 'medium', color: '#3b82f6', width: 2, name: '中强关联' },
  '违法人': { strength: 'medium', color: '#3b82f6', width: 2, name: '中强关联' },
  '归属大类': { strength: 'medium', color: '#7c3aed', width: 2, name: '中强关联' },
  '过错大类': { strength: 'medium', color: '#7c3aed', width: 2, name: '中强关联' },
  '具体过错': { strength: 'medium', color: '#a855f7', width: 2, name: '中强关联' },
  '诱因': { strength: 'weak', color: '#06b6d4', width: 1.5, name: '弱关联' },
  '事故诱因': { strength: 'weak', color: '#06b6d4', width: 1.5, name: '弱关联' },
  '发生在': { strength: 'weak', color: '#94a3b8', width: 1, name: '弱关联' },
  '天气': { strength: 'weak', color: '#94a3b8', width: 1, name: '弱关联' },
  '人车关系': { strength: 'strong', color: '#dc2626', width: 3, name: '证据强关联' },
  '违法责任链': { strength: 'strong', color: '#dc2626', width: 3, name: '证据强关联' },
  '伤亡后果链': { strength: 'strong', color: '#dc2626', width: 3, name: '证据强关联' },
  '车辆碰撞链': { strength: 'strong', color: '#dc2626', width: 3, name: '证据强关联' },
  '过错分类证据': { strength: 'medium', color: '#7c3aed', width: 2, name: '证据中强关联' },
  '报告过错证据': { strength: 'medium', color: '#7c3aed', width: 2, name: '证据中强关联' },
  '缺口提示': { strength: 'gap', color: '#f97316', width: 2, name: '待补证缺口' }
};

// ==================== 图谱数据 ====================
// 注意：相同实体只创建一个节点，在不同事故中复用，自动形成关联
const graphData = {
  nodes: [
    // ===== 10个事故节点 =====
    { id: 'acc1', name: '长江路追尾', type: 'accident', symbolSize: 35 },
    { id: 'acc2', name: '黄河路闯红灯', type: 'accident', symbolSize: 35 },
    { id: 'acc3', name: '长江路侧翻', type: 'accident', symbolSize: 35 },
    { id: 'acc4', name: '中山路变道剐蹭', type: 'accident', symbolSize: 35 },
    { id: 'acc5', name: '黄河路酒驾', type: 'accident', symbolSize: 35 },
    { id: 'acc6', name: '绕城公路超速', type: 'accident', symbolSize: 35 },
    { id: 'acc7', name: '京沪高速疲劳驾驶', type: 'accident', symbolSize: 35 },
    { id: 'acc8', name: '上海路逆行', type: 'accident', symbolSize: 35 },
    { id: 'acc9', name: '广州路闯黄灯', type: 'accident', symbolSize: 35 },
    { id: 'acc10', name: '长江路雨天打滑', type: 'accident', symbolSize: 35 },
    
    // ===== 当事人节点 (16人，其中6人重复出现) =====
    { id: 'p_zw', name: '张伟', type: 'person', symbolSize: 28 },  // 事故1、5
    { id: 'p_ln', name: '李娜', type: 'person', symbolSize: 28 },  // 事故1、4
    { id: 'p_wq', name: '王强', type: 'person', symbolSize: 25 },
    { id: 'p_zm', name: '赵敏', type: 'person', symbolSize: 28 },  // 事故2、9
    { id: 'p_lf', name: '刘芳', type: 'person', symbolSize: 28 },  // 事故2、8
    { id: 'p_cm', name: '陈明', type: 'person', symbolSize: 28 },  // 事故3、10
    { id: 'p_zj', name: '周杰', type: 'person', symbolSize: 28 },  // 事故4、10
    { id: 'p_wt', name: '吴涛', type: 'person', symbolSize: 25 },
    { id: 'p_zl', name: '郑磊', type: 'person', symbolSize: 25 },
    { id: 'p_wf', name: '王芳', type: 'person', symbolSize: 25 },
    { id: 'p_sp', name: '孙鹏', type: 'person', symbolSize: 25 },
    { id: 'p_mc', name: '马超', type: 'person', symbolSize: 25 },
    { id: 'p_hl', name: '黄磊', type: 'person', symbolSize: 25 },
    
    // ===== 车辆节点 (14辆，其中5辆重复出现) =====
    { id: 'v_a12345', name: '苏A12345', type: 'vehicle', symbolSize: 28 },  // 事故1、2、5
    { id: 'v_b67890', name: '苏B67890', type: 'vehicle', symbolSize: 28 },  // 事故1、4
    { id: 'v_c54321', name: '苏C54321', type: 'vehicle', symbolSize: 28 },  // 事故2、8、9
    { id: 'v_d88888', name: '苏D88888', type: 'vehicle', symbolSize: 28 },  // 事故3、10
    { id: 'v_e24680', name: '苏E24680', type: 'vehicle', symbolSize: 28 },  // 事故4、10
    { id: 'v_f13579', name: '苏F13579', type: 'vehicle', symbolSize: 25 },
    { id: 'v_g97531', name: '苏G97531', type: 'vehicle', symbolSize: 25 },
    { id: 'v_h86420', name: '苏H86420', type: 'vehicle', symbolSize: 25 },
    { id: 'v_j75319', name: '苏J75319', type: 'vehicle', symbolSize: 25 },
    { id: 'v_k42680', name: '苏K42680', type: 'vehicle', symbolSize: 25 },
    { id: 'v_l15973', name: '苏L15973', type: 'vehicle', symbolSize: 25 },
    
    // ===== 道路节点 (7条，长江路出现3次，黄河路出现2次) =====
    { id: 'r_cjl', name: '长江路', type: 'road', symbolSize: 24 },  // 事故1、3、10
    { id: 'r_hhl', name: '黄河路', type: 'road', symbolSize: 24 },  // 事故2、5
    { id: 'r_zsl', name: '中山路', type: 'road', symbolSize: 20 },
    { id: 'r_rcgl', name: '绕城公路', type: 'road', symbolSize: 20 },
    { id: 'r_bjh', name: '京沪高速', type: 'road', symbolSize: 20 },
    { id: 'r_shl', name: '上海路', type: 'road', symbolSize: 20 },
    { id: 'r_gzl', name: '广州路', type: 'road', symbolSize: 20 },
    
    // ===== 天气节点 =====
    { id: 'w_qing', name: '晴', type: 'weather', symbolSize: 20 },
    { id: 'w_duoyun', name: '多云', type: 'weather', symbolSize: 20 },
    { id: 'w_yin', name: '阴', type: 'weather', symbolSize: 20 },
    { id: 'w_baoyu', name: '暴雨', type: 'weather', symbolSize: 20 },
    
    // ===== 违法行为节点 =====
    { id: 'vi_cheju', name: '未保持安全车距', type: 'violation', symbolSize: 20 },
    { id: 'vi_chuanghong', name: '闯红灯', type: 'violation', symbolSize: 20 },
    { id: 'vi_chaosu', name: '超速行驶', type: 'violation', symbolSize: 20 },
    { id: 'vi_biandao', name: '违规变道', type: 'violation', symbolSize: 20 },
    { id: 'vi_jiujia', name: '醉酒驾驶', type: 'violation', symbolSize: 20 },
    { id: 'vi_pilao', name: '疲劳驾驶', type: 'violation', symbolSize: 20 },
    { id: 'vi_nixing', name: '逆向行驶', type: 'violation', symbolSize: 20 },
    { id: 'vi_chuanghuang', name: '闯黄灯', type: 'violation', symbolSize: 20 },
    { id: 'vi_yutian', name: '雨天未减速', type: 'violation', symbolSize: 20 },
    
    // ===== 伤亡情况节点 =====
    { id: 'inj_qingwei2', name: '轻微伤2人', type: 'injury', symbolSize: 20 },
    { id: 'inj_qing1_wei2', name: '轻伤1人 轻微伤2人', type: 'injury', symbolSize: 20 },
    { id: 'inj_zhong1', name: '重伤1人', type: 'injury', symbolSize: 20 },
    { id: 'inj_wushang', name: '无人员伤亡', type: 'injury', symbolSize: 20 },
    { id: 'inj_qing2', name: '轻伤2人', type: 'injury', symbolSize: 20 },
    { id: 'inj_qing1_wei1', name: '轻伤1人 轻微伤1人', type: 'injury', symbolSize: 20 },
    
    // ===== 责任认定节点 =====
    { id: 'l_quanze', name: '全部责任', type: 'liability', symbolSize: 20 },
    { id: 'l_zhuyao', name: '主要责任', type: 'liability', symbolSize: 20 },
    { id: 'l_ciyao', name: '次要责任', type: 'liability', symbolSize: 20 }
  ],
  links: [
    // ===== 事故1: 长江路追尾 =====
    { source: 'p_zw', target: 'v_a12345', label: '驾驶' },
    { source: 'p_ln', target: 'v_b67890', label: '驾驶' },
    { source: 'v_a12345', target: 'acc1', label: '涉及' },
    { source: 'v_b67890', target: 'acc1', label: '涉及' },
    { source: 'r_cjl', target: 'acc1', label: '发生在' },
    { source: 'vi_cheju', target: 'acc1', label: '事故原因' },
    { source: 'vi_cheju', target: 'p_zw', label: '违法人' },
    { source: 'l_quanze', target: 'acc1', label: '责任认定' },
    { source: 'l_quanze', target: 'p_zw', label: '承担' },
    { source: 'w_qing', target: 'acc1', label: '天气' },
    { source: 'inj_qingwei2', target: 'acc1', label: '造成' },
    
    // ===== 事故2: 黄河路闯红灯 =====
    { source: 'p_wq', target: 'v_a12345', label: '驾驶' },
    { source: 'p_zm', target: 'v_c54321', label: '驾驶' },
    { source: 'v_a12345', target: 'acc2', label: '涉及' },
    { source: 'v_c54321', target: 'acc2', label: '涉及' },
    { source: 'r_hhl', target: 'acc2', label: '发生在' },
    { source: 'vi_chuanghong', target: 'acc2', label: '事故原因' },
    { source: 'vi_chuanghong', target: 'p_wq', label: '违法人' },
    { source: 'l_quanze', target: 'acc2', label: '责任认定' },
    { source: 'l_quanze', target: 'p_wq', label: '承担' },
    { source: 'w_duoyun', target: 'acc2', label: '天气' },
    { source: 'inj_qing1_wei2', target: 'acc2', label: '造成' },
    
    // ===== 事故3: 长江路侧翻 =====
    { source: 'p_cm', target: 'v_d88888', label: '驾驶' },
    { source: 'v_d88888', target: 'acc3', label: '涉及' },
    { source: 'r_cjl', target: 'acc3', label: '发生在' },
    { source: 'vi_chaosu', target: 'acc3', label: '事故原因' },
    { source: 'vi_chaosu', target: 'p_cm', label: '违法人' },
    { source: 'l_quanze', target: 'acc3', label: '责任认定' },
    { source: 'l_quanze', target: 'p_cm', label: '承担' },
    { source: 'w_qing', target: 'acc3', label: '天气' },
    { source: 'inj_zhong1', target: 'acc3', label: '造成' },
    
    // ===== 事故4: 中山路变道剐蹭 =====
    { source: 'p_ln', target: 'v_b67890', label: '驾驶' },
    { source: 'p_zj', target: 'v_e24680', label: '驾驶' },
    { source: 'v_b67890', target: 'acc4', label: '涉及' },
    { source: 'v_e24680', target: 'acc4', label: '涉及' },
    { source: 'r_zsl', target: 'acc4', label: '发生在' },
    { source: 'vi_biandao', target: 'acc4', label: '事故原因' },
    { source: 'vi_biandao', target: 'p_ln', label: '违法人' },
    { source: 'l_quanze', target: 'acc4', label: '责任认定' },
    { source: 'l_quanze', target: 'p_ln', label: '承担' },
    { source: 'w_yin', target: 'acc4', label: '天气' },
    { source: 'inj_wushang', target: 'acc4', label: '造成' },
    
    // ===== 事故5: 黄河路酒驾 =====
    { source: 'p_wt', target: 'v_f13579', label: '驾驶' },
    { source: 'v_f13579', target: 'acc5', label: '涉及' },
    { source: 'v_a12345', target: 'acc5', label: '涉及' },
    { source: 'r_hhl', target: 'acc5', label: '发生在' },
    { source: 'vi_jiujia', target: 'acc5', label: '事故原因' },
    { source: 'vi_jiujia', target: 'p_wt', label: '违法人' },
    { source: 'l_quanze', target: 'acc5', label: '责任认定' },
    { source: 'l_quanze', target: 'p_wt', label: '承担' },
    { source: 'w_qing', target: 'acc5', label: '天气' },
    { source: 'inj_qing2', target: 'acc5', label: '造成' },
    
    // ===== 事故6: 绕城公路超速 =====
    { source: 'p_zl', target: 'v_g97531', label: '驾驶' },
    { source: 'p_wf', target: 'v_h86420', label: '驾驶' },
    { source: 'v_g97531', target: 'acc6', label: '涉及' },
    { source: 'v_h86420', target: 'acc6', label: '涉及' },
    { source: 'r_rcgl', target: 'acc6', label: '发生在' },
    { source: 'vi_chaosu', target: 'acc6', label: '事故原因' },
    { source: 'vi_chaosu', target: 'p_zl', label: '违法人' },
    { source: 'l_quanze', target: 'acc6', label: '责任认定' },
    { source: 'l_quanze', target: 'p_zl', label: '承担' },
    { source: 'w_duoyun', target: 'acc6', label: '天气' },
    { source: 'inj_qing1_wei1', target: 'acc6', label: '造成' },
    
    // ===== 事故7: 京沪高速疲劳驾驶 =====
    { source: 'p_sp', target: 'v_j75319', label: '驾驶' },
    { source: 'v_j75319', target: 'acc7', label: '涉及' },
    { source: 'r_bjh', target: 'acc7', label: '发生在' },
    { source: 'vi_pilao', target: 'acc7', label: '事故原因' },
    { source: 'vi_pilao', target: 'p_sp', label: '违法人' },
    { source: 'l_quanze', target: 'acc7', label: '责任认定' },
    { source: 'l_quanze', target: 'p_sp', label: '承担' },
    { source: 'w_qing', target: 'acc7', label: '天气' },
    { source: 'inj_qing1_wei1', target: 'acc7', label: '造成' },
    
    // ===== 事故8: 上海路逆行 =====
    { source: 'p_mc', target: 'v_k42680', label: '驾驶' },
    { source: 'p_lf', target: 'v_c54321', label: '驾驶' },
    { source: 'v_k42680', target: 'acc8', label: '涉及' },
    { source: 'v_c54321', target: 'acc8', label: '涉及' },
    { source: 'r_shl', target: 'acc8', label: '发生在' },
    { source: 'vi_nixing', target: 'acc8', label: '事故原因' },
    { source: 'vi_nixing', target: 'p_mc', label: '违法人' },
    { source: 'l_quanze', target: 'acc8', label: '责任认定' },
    { source: 'l_quanze', target: 'p_mc', label: '承担' },
    { source: 'w_duoyun', target: 'acc8', label: '天气' },
    { source: 'inj_qing1_wei1', target: 'acc8', label: '造成' },
    
    // ===== 事故9: 广州路闯黄灯 =====
    { source: 'p_hl', target: 'v_l15973', label: '驾驶' },
    { source: 'p_zm', target: 'v_c54321', label: '驾驶' },
    { source: 'v_l15973', target: 'acc9', label: '涉及' },
    { source: 'v_c54321', target: 'acc9', label: '涉及' },
    { source: 'r_gzl', target: 'acc9', label: '发生在' },
    { source: 'vi_chuanghuang', target: 'acc9', label: '事故原因' },
    { source: 'vi_chuanghuang', target: 'p_hl', label: '违法人' },
    { source: 'l_zhuyao', target: 'acc9', label: '责任认定' },
    { source: 'l_zhuyao', target: 'p_hl', label: '承担' },
    { source: 'l_ciyao', target: 'p_zm', label: '承担' },
    { source: 'w_qing', target: 'acc9', label: '天气' },
    { source: 'inj_qingwei2', target: 'acc9', label: '造成' },
    
    // ===== 事故10: 长江路雨天打滑 =====
    { source: 'p_zj', target: 'v_e24680', label: '驾驶' },
    { source: 'p_cm', target: 'v_d88888', label: '驾驶' },
    { source: 'v_e24680', target: 'acc10', label: '涉及' },
    { source: 'v_d88888', target: 'acc10', label: '涉及' },
    { source: 'r_cjl', target: 'acc10', label: '发生在' },
    { source: 'vi_yutian', target: 'acc10', label: '事故原因' },
    { source: 'vi_yutian', target: 'p_zj', label: '违法人' },
    { source: 'l_zhuyao', target: 'acc10', label: '责任认定' },
    { source: 'l_zhuyao', target: 'p_zj', label: '承担' },
    { source: 'l_ciyao', target: 'p_cm', label: '承担' },
    { source: 'w_baoyu', target: 'acc10', label: '天气' },
    { source: 'inj_qing1_wei1', target: 'acc10', label: '造成' }
  ]
};

// ==================== 报告驱动的动态图谱生成 ====================
let graphEntryReportId = null;
let graphExpandedNodeId = null;
let graphFocusedNodeId = null;
let graphEntryAutoMode = true;
let reportFilterText = '';
let reportSortMode = 'uploadDesc';
let graphAccidentSortMode = 'uploadDesc'; // v3.4.8: 知识图谱事故下拉独立排序
let entityFilterText = '';
let graphEntityTypeFilters = new Set(Object.keys(entityColors));
// v3.3.4 建议4：置信度阈值过滤（仅显示 confidence >= 阈值的关系边；gap 缺口边不受限）。
let graphConfidenceThreshold = 0;
let entityAssociationExpandedType = 'all';
const entityCategoryUiState = {};
let expandedClusterKey = null;
let chainReportId = null;
let chainFilterText = '';
let graphChart = null;
let chainFlowChart = null;
let selectedChainStepKey = '';
let selectedEvidenceKey = '';
let graphResizeHandlerBound = false;

const faultCategoryMeta = {
  '机动车驾驶人违规驾驶': { icon: '🚦', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', desc: '酒驾、超速、闯灯、逆行、未让行等主观违法风险。' },
  '机动车驾驶人操作不当': { icon: '🎮', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', desc: '观察不足、操作不当、未保持安全距离等驾驶操作风险。' },
  '非机动车驾驶人违法/过错': { icon: '🚲', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: '电动自行车、自行车骑行人的违法或过错行为。' },
  '行人违法/过错': { icon: '🚶', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', desc: '行人横穿、闯灯、进入机动车道等风险行为。' },
  '车辆状态/装载问题': { icon: '🚚', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: '车辆机件、制动、灯光、超载及装载固定等风险。' },
  '道路环境与设施隐患': { icon: '🛣️', color: '#d97706', bg: '#fffbeb', border: '#fde68a', desc: '路面、线形、视距、照明、标志标线和施工设施隐患。' },
  '管理责任/组织责任': { icon: '🏢', color: '#047857', bg: '#ecfdf5', border: '#bbf7d0', desc: '运输企业、施工养护、运营管理等组织责任风险。' },
  '不可控/外部诱因': { icon: '🌪️', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', desc: '团雾、暴雨、横风、落石、冰雪等外部突发诱因。' },
  '未分类原因': { icon: '❔', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', desc: '暂未被解析器归入明确过错大类。' }
};

// 伤亡情况二级分类
function classifyInjury(injuryText) {
  if (!injuryText || injuryText === '未识别' || injuryText === '待定' || injuryText === '责任待定') return '未认定';
  const text = String(injuryText);
  // 排除事故等级（防止误分类）
  if (text.includes('一般事故') || text.includes('较大事故') || text.includes('重大事故') || text.includes('轻微事故')) return '未认定';
  if (text.includes('无') || text.includes('未造成') || text.includes('没有人员') || text.includes('未发生人员')) return '无伤亡';
  if (text.includes('死亡') || text.includes('身亡') || text.includes('死亡') || text.includes('重伤') || text.includes('截肢') || text.includes('瘫痪') || text.includes('颅脑')) return '严重伤亡';
  if (text.includes('轻伤') || text.includes('骨折') || text.includes('中度') || text.includes('中等') || text.includes('肋骨') || text.includes('锁骨') || text.includes('挫伤')) return '中等伤';
  return '轻微伤';
}

// 天气二级分类
function classifyWeather(weatherText) {
  if (!weatherText || weatherText === '未知') return '未认定';
  const text = String(weatherText);
  if (text.includes('雨') || text.includes('暴雨') || text.includes('大雨') || text.includes('小雨') || text.includes('中雨') || text.includes('阵雨')) return '雨天';
  if (text.includes('雪') || text.includes('大雪') || text.includes('小雪') || text.includes('暴雪')) return '雪天';
  if (text.includes('雾') || text.includes('霾') || text.includes('能见度') || text.includes('团雾')) return '雾霾天';
  if (text.includes('晴') || text.includes('多云') || text.includes('阴')) return '晴阴天';
  if (text.includes('风') || text.includes('横风') || text.includes('大风')) return '大风天';
  return '其他天气';
}

// 道路二级分类
function classifyRoad(roadText) {
  if (!roadText) return '未认定';
  const text = String(roadText);
  if (text.includes('高速') || text.match(/G[0-9]+/) || text.includes('京哈') || text.includes('京沪') || text.includes('京台') || text.includes('京港澳')) return '高速公路';
  if (text.includes('快速路') || text.includes('高架') || text.includes('环路')) return '城市快速路';
  if (text.includes('交叉口') || text.includes('路口') || text.includes('十字') || text.includes('丁字')) return '交叉口/路口';
  if (text.includes('大桥') || text.includes('隧道') || text.includes('桥') || text.includes('涵洞')) return '桥梁隧道';
  if (text.includes('国道') || text.includes('省道') || text.includes('县道') || text.includes('公路')) return '普通公路';
  return '城市道路';
}

// 交通事故二级分类（按事故类型）
function classifyAccident(report) {
  if (!report) return '其他事故';
  const text = (report.title || '') + ' ' + (report.description || '') + ' ' + (report.violation || '') + ' ' + (report.injury || '');
  if (text.includes('追尾')) return '追尾事故';
  if (text.includes('刮擦') || text.includes('刮蹭')) return '刮擦事故';
  if (text.includes('碰撞') || text.includes('相撞')) return '碰撞事故';
  if (text.includes('侧翻') || text.includes('翻车') || text.includes('翻覆')) return '侧翻事故';
  if (text.includes('碾压') || text.includes('碾轧')) return '碾压事故';
  if (text.includes('自燃') || text.includes('起火') || text.includes('爆炸')) return '自燃/起火事故';
  if (text.includes('坠崖') || text.includes('坠桥') || text.includes('坠落')) return '坠落事故';
  if (text.includes('雨天') || text.includes('雨天') || text.includes('路滑')) return '雨天事故';
  return '其他事故';
}

// 事故时间二级分类
function classifyTime(timeText) {
  if (!timeText) return '未认定';
  const text = String(timeText);
  // 提取时间判断时段
  if (text.match(/[0-9]+:[0-9]+/)) {
    const match = text.match(/([0-9]+):([0-9]+)/);
    if (match) {
      const hour = parseInt(match[1]);
      if (hour >= 7 && hour < 9) return '早高峰';
      if (hour >= 17 && hour < 19) return '晚高峰';
      if (hour >= 9 && hour < 17) return '白天';
      return '夜间';
    }
  }
  return '时间不详';
}

// 车辆二级分类
function classifyVehicle(vehicleText) {
  if (!vehicleText) return '未认定';
  const text = String(vehicleText);
  // 提取车牌号（如果有的话），但分类只看类型，不看号码
  if (text.includes('货车') || text.includes('半挂') || text.includes('渣土') || text.includes('重型') || text.includes('牵引')) return '大型货车';
  if (text.includes('客车') || text.includes('公交') || text.includes('大巴') || text.includes('长途')) return '大型客车';
  if (text.includes('轿车') || text.includes('小客') || text.includes('SUV') || text.includes('面包') || text.includes('出租') || text.includes('小轿') || text.match(/鲁[A-Z][0-9A-Z]{5}/)) return '小型车辆';
  if (text.includes('电动') || text.includes('自行车') || text.includes('摩托') || text.includes('电瓶') || text.includes('非机动')) return '非机动车';
  if (text.includes('救护') || text.includes('消防') || text.includes('工程') || text.includes('警')) return '特种车辆';
  return '其他车辆';
}

// 责任认定二级分类
function classifyLiability(liabilityText) {
  if (!liabilityText || liabilityText === '责任待定' || liabilityText === '未定') return '待认定';
  const text = String(liabilityText);
  // 优先级1：一方全责（只要有一方全责，即使另一方无责任，也归此类）
  if (text.includes('全责') || text.includes('全部责任') || text.includes('100%')) return '一方全责';
  // 优先级2：主次责任（百分比责任、主要/次要）
  if (text.includes('主责') || text.includes('主要责任') || text.includes('次责') || text.includes('次要责任') || 
      text.includes('三七') || text.includes('四六') || text.includes('70%') || text.includes('30%') || 
      text.includes('60%') || text.includes('40%') || text.includes('80%') || text.includes('20%') ||
      text.includes('90%') || text.includes('10%')) return '主次责任';
  // 优先级3：双方同责
  if (text.includes('同责') || text.includes('同等责任') || text.includes('各半') || text.includes('五五') || text.includes('50%')) return '双方同责';
  // 优先级4：无责任（仅当全部是无责任，没有其他责任划分时才归此类）
  if (text.includes('无责任') || text.includes('不负责任') || text.includes('不承担责任')) return '无责任';
  return '责任划分中';
}

function normalizeName(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function normalizeEntityName(type, name) {
  let text = normalizeName(name);
  if (!text) return '';
  if (type === 'vehicle') {
    return text.replace(/\s+/g, '').toUpperCase();
  }
  if (type === 'road') {
    text = text
      .replace(/^(山东省|济南市|青岛市|淄博市|枣庄市|东营市|烟台市|潍坊市|济宁市|泰安市|威海市|日照市|临沂市|德州市|聊城市|滨州市|菏泽市)+/g, '')
      .replace(/(附近|路段|交叉口|路口|处|向东|向西|向南|向北|东向|西向|南向|北向|[0-9零一二三四五六七八九十百]+米处?)$/g, '')
      .replace(/与.*$/g, '')
      .replace(/[，,。；;：:]$/g, '')
      .trim();
    return text || normalizeName(name);
  }
  if (type === 'person') {
    text = text.replace(/^(驾驶员|当事人|伤者|乘客|行人|车主|司机|违法人|责任人|被保险人)/g, '').trim();
    // v3.4.8: 放宽姓名规则以兼容 AI 抽出的官方脱敏姓名（如 魏XX、张某、A某、甲、乙）
    if (!text) return '';
    if (text.length > 16) return '';
    if (/^(某某|未知|人员|当事|驾驶|乘客|伤者)$/.test(text)) return '';
    // 至少含一个汉字/拉丁字母/常见代号；纯 X/*/? 之类不算
    if (!/[\u4e00-\u9fa5A-Za-z甲乙丙丁戊己庚辛壬癸]/.test(text)) return '';
    return text;
  }
  return text;
}

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '_').slice(0, 50);
}

function extractRoadName(location) {
  const text = normalizeName(location);
  const patterns = [/([\u4e00-\u9fa5A-Za-z0-9]+高速)/, /([\u4e00-\u9fa5A-Za-z0-9]+大道)/, /([\u4e00-\u9fa5A-Za-z0-9]+公路)/, /([\u4e00-\u9fa5A-Za-z0-9]+国道)/, /([\u4e00-\u9fa5A-Za-z0-9]+省道)/, /([\u4e00-\u9fa5A-Za-z0-9]+路)/, /([\u4e00-\u9fa5A-Za-z0-9]+街)/, /([\u4e00-\u9fa5A-Za-z0-9]+桥)/, /([\u4e00-\u9fa5A-Za-z0-9]+隧道)/];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return normalizeEntityName('road', m[1]);
  }
  return normalizeEntityName('road', text) || '未知地点';
}

function addDynamicNode(nodes, nodeMap, type, name, baseSize, extraProps = {}) {
  name = normalizeEntityName(type, name);
  if (!name) return null;
  const key = type + '|' + name;
  if (nodeMap.has(key)) {
    // 合并额外属性
    Object.assign(nodeMap.get(key), extraProps);
    return nodeMap.get(key);
  }
  const node = { id: type + '_' + safeId(name) + '_' + nodeMap.size, name, type, symbolSize: baseSize || 20, ...extraProps };
  nodeMap.set(key, node);
  nodes.push(node);
  return node;
}

function makeSourceExcerpt(report, terms) {
  const text = normalizeName(report && report.description);
  if (!text) return '';
  const keywords = (terms || []).map(normalizeName).filter(Boolean);
  let pos = -1;
  for (const k of keywords) {
    pos = text.indexOf(k);
    if (pos >= 0) break;
  }
  if (pos < 0) pos = 0;
  const start = Math.max(0, pos - 34);
  const end = Math.min(text.length, pos + 86);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function getReportFaultCategoryDetails(report) {
  if (!report) return [];
  const normalizeDetail = detail => {
    if (!detail) return null;
    const category = normalizeName(detail.category || detail.name || detail.title);
    if (!category) return null;
    const behaviors = Array.isArray(detail.behaviors) ? detail.behaviors : (Array.isArray(detail.violations) ? detail.violations : []);
    const factors = Array.isArray(detail.factors) ? detail.factors : [];
    return {
      category,
      behaviors: [...new Set(behaviors.map(normalizeName).filter(Boolean))],
      factors: [...new Set(factors.map(normalizeName).filter(Boolean))]
    };
  };
  if (Array.isArray(report.faultCategoryDetails) && report.faultCategoryDetails.length) {
    const merged = new Map();
    report.faultCategoryDetails.map(normalizeDetail).filter(Boolean).forEach(d => {
      if (!merged.has(d.category)) merged.set(d.category, { category: d.category, behaviors: [], factors: [] });
      const bucket = merged.get(d.category);
      bucket.behaviors.push(...d.behaviors);
      bucket.factors.push(...d.factors);
    });
    return Array.from(merged.values()).map(d => ({
      category: d.category,
      behaviors: [...new Set(d.behaviors)],
      factors: [...new Set(d.factors)]
    }));
  }
  const categories = Array.isArray(report.faultCategories) ? report.faultCategories : (report.faultCategory ? [report.faultCategory] : []);
  const factors = Array.isArray(report.faultFactors) ? report.faultFactors.map(normalizeName).filter(Boolean) : [];
  return categories.filter(Boolean).map(category => ({ category, behaviors: report.violation ? [report.violation] : [], factors }));
}

function getReportFaultCategories(report) {
  return [...new Set(getReportFaultCategoryDetails(report).map(d => d.category).filter(Boolean))];
}

function getReportFaultItemsByCategory(report, category) {
  const items = [];
  getReportFaultCategoryDetails(report).filter(d => d.category === category).forEach(d => {
    (d.behaviors || []).forEach(name => items.push({ name, type: 'violation' }));
    (d.factors || []).forEach(name => items.push({ name, type: 'fault_factor' }));
  });
  if (!items.length && report && report.violation) items.push({ name: report.violation, type: 'violation' });
  const seen = new Set();
  return items.filter(item => {
    const key = item.type + '|' + item.name;
    if (!item.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildRelationEvidence(report, label, source, target) {
  const title = report && report.title ? report.title : '事故报告';
  const terms = [source && source.name, target && target.name, label, report && report.violation, report && report.location].filter(Boolean);
  return {
    reportId: report && report.__graphReportId,
    sourceTitle: title,
    sourceExcerpt: makeSourceExcerpt(report, terms),
    evidence: '来源报告「' + title + '」抽取到「' + (source && source.name || '') + '」—' + label + '→「' + (target && target.name || '') + '」。'
  };
}

function parserRelationLabel(type) {
  const map = {
    person_drives_vehicle: '人车关系',
    person_commits_violation: '违法责任链',
    person_has_injury: '伤亡后果链',
    person_bears_liability: '承担',
    vehicle_collides_vehicle: '车辆碰撞链',
    behavior_belongs_to_category: '过错分类证据',
    report_has_fault_category: '报告过错证据',
    chain_gap: '缺口提示'
  };
  return map[type] || type || '解析关系';
}

function inferParserNodeType(relType, role, name) {
  if (relType === 'person_drives_vehicle') return role === 'source' ? 'person' : 'vehicle';
  if (relType === 'person_commits_violation') return role === 'source' ? 'person' : 'violation';
  if (relType === 'person_has_injury') return role === 'source' ? 'person' : 'injury';
  if (relType === 'person_bears_liability') return role === 'source' ? 'person' : 'liability';
  if (relType === 'vehicle_collides_vehicle') return 'vehicle';
  if (relType === 'behavior_belongs_to_category') return role === 'source' ? (/团雾|暴雨|横风|冰雪|积水|湿滑|照明|围挡|视距|标志|标线|坑槽|落石/.test(name) ? 'fault_factor' : 'violation') : 'fault_category';
  if (relType === 'report_has_fault_category') return role === 'source' ? 'accident' : 'fault_category';
  if (relType === 'chain_gap') return role === 'source' ? 'accident' : 'chain_gap';
  return 'violation';
}

function addParserRelations(report, reportId, acc, nodes, nodeMap, links) {
  if (!Array.isArray(report.relations) || !report.relations.length) return;
  report.relations.forEach(rel => {
    if (!rel || !rel.type || !rel.source || !rel.target) return;
    const sourceType = inferParserNodeType(rel.type, 'source', rel.source);
    const targetType = inferParserNodeType(rel.type, 'target', rel.target);
    const sourceNode = rel.source === 'report' ? acc : addDynamicNode(nodes, nodeMap, sourceType, rel.source, sourceType === 'person' ? 24 : 22);
    const targetNode = rel.target === 'report' ? acc : addDynamicNode(nodes, nodeMap, targetType, rel.target, targetType === 'fault_category' ? 24 : 22);
    if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) return;
    addDynamicLink(links, sourceNode, targetNode, parserRelationLabel(rel.type), reportId, report, {
      parserRelationType: rel.type,
      confidence: rel.confidence || 0.75,
      ruleId: rel.ruleId || '',
      sentenceIndex: rel.sentenceIndex,
      evidence: rel.evidence || '',
      sourceExcerpt: rel.evidence || makeSourceExcerpt(report, [rel.source, rel.target]),
      relationLevel: rel.relationLevel || (rel.type === 'chain_gap' ? 'gap' : (rel.confidence && rel.confidence < 0.65 ? 'weakerDashed' : ''))
    });
  });
}

function addDynamicLink(links, source, target, label, reportId, report, options) {
  if (!source || !target || !source.id || !target.id) return;
  const evidence = buildRelationEvidence(report, label, source, target);
  links.push({ source: source.id, target: target.id, label, reportId, ...evidence, ...(options || {}) });
}

function rebuildGraphData() {
  if (typeof accidentReports === 'undefined' || !Array.isArray(accidentReports)) return;
  const nodes = [];
  const links = [];
  const nodeMap = new Map();
  accidentReports.forEach((report, index) => {
    const reportId = String(getReportId(report, index));
    report.__graphReportId = reportId;
    // 先创建事故类型分类节点
    const accidentType = classifyAccident(report);
    const typeNode = addDynamicNode(nodes, nodeMap, 'accident_category', accidentType, 40);
    // 再创建具体事故节点
    const acc = { id: 'acc_' + safeId(reportId), name: report.title || ('事故报告' + (index + 1)), type: 'accident', symbolSize: 36, reportId, accidentType };
    nodes.push(acc);
    // 事故节点连到类型分类节点
    addDynamicLink(links, acc, typeNode, '事故类型', reportId, report);
    // 道路：先创建大类节点，再创建具体节点并关联
    const roadName = extractRoadName(report.location);
    const roadCategory = classifyRoad(roadName);
    const roadCategoryNode = addDynamicNode(nodes, nodeMap, 'road_category', roadCategory, 22);
    const road = addDynamicNode(nodes, nodeMap, 'road', roadName, 22, { roadCategory });
    // 天气：先创建大类节点，再创建具体节点并关联
    const weatherCategory = classifyWeather(report.weather);
    const weatherCategoryNode = addDynamicNode(nodes, nodeMap, 'weather_category', weatherCategory, 22);
    const weather = addDynamicNode(nodes, nodeMap, 'weather', report.weather, 20, { weatherCategory });
    // 时间：先创建大类节点，再创建具体节点并关联
    const timeCategory = classifyTime(report.date);
    const timeCategoryNode = addDynamicNode(nodes, nodeMap, 'time_category', timeCategory, 22);
    const timeNode = addDynamicNode(nodes, nodeMap, 'time', report.date || '时间不详', 20, { timeCategory });
    const violation = addDynamicNode(nodes, nodeMap, 'violation', report.violation, 22);
    const faultDetails = getReportFaultCategoryDetails(report);
    const faultCategories = getReportFaultCategories(report);
    const faultFactors = [...new Set(faultDetails.flatMap(d => d.factors || []))];
    const faultCategoryNodes = faultCategories.map(c => addDynamicNode(nodes, nodeMap, 'fault_category', c, 24)).filter(Boolean);
    const faultFactorNodes = faultFactors.map(f => addDynamicNode(nodes, nodeMap, 'fault_factor', f, 20)).filter(Boolean);
    // 伤亡情况：先创建大类节点，再创建具体节点并关联
    const injuryCategory = classifyInjury(report.injury);
    const injuryCategoryNode = addDynamicNode(nodes, nodeMap, 'injury_category', injuryCategory, 22);
    const injury = addDynamicNode(nodes, nodeMap, 'injury', report.injury, 20, { injuryCategory });
    // 责任认定：先创建大类节点，再创建具体节点并关联（只用report.liability，不要用事故等级level）
    const liabilityValue = report.liability || '责任待定';
    const liabilityCategory = classifyLiability(liabilityValue);
    const liabilityCategoryNode = addDynamicNode(nodes, nodeMap, 'liability_category', liabilityCategory, 22);
    const liability = addDynamicNode(nodes, nodeMap, 'liability', liabilityValue, 20, { liabilityCategory });
    const personNodes = (report.persons || []).map(p => addDynamicNode(nodes, nodeMap, 'person', p, 24)).filter(Boolean);
    // 车辆：先创建分类节点，再创建具体车辆节点，每辆车只创建一个节点
    const vehicleNodes = (report.vehicles || []).map(v => {
      const category = classifyVehicle(v);
      // 分类节点只创建一次
      const categoryNode = addDynamicNode(nodes, nodeMap, 'vehicle_category', category, 24);
      // 具体车辆节点，车牌号作为属性存在节点名中，不再单独创建节点
      const vehicleNode = addDynamicNode(nodes, nodeMap, 'vehicle', v, 24, { vehicleCategory: category });
      // 具体车辆节点 → 分类节点
      addDynamicLink(links, vehicleNode, categoryNode, '车辆类型', reportId, report);
      return vehicleNode;
    }).filter(Boolean);

    // ========== 两级关联结构：事故只连大类，大类连二级实体 ==========
    // 1. 道路：事故 → 道路分类 → 具体道路
    addDynamicLink(links, roadCategoryNode, acc, '道路分类', reportId, report);
    addDynamicLink(links, road, roadCategoryNode, '具体道路', reportId, report);
    
    // 2. 天气：事故 → 天气分类 → 具体天气
    addDynamicLink(links, weatherCategoryNode, acc, '天气分类', reportId, report);
    addDynamicLink(links, weather, weatherCategoryNode, '具体天气', reportId, report);
    
    // 3. 时间：事故 → 时间分类 → 具体时间
    addDynamicLink(links, timeCategoryNode, acc, '时间分类', reportId, report);
    addDynamicLink(links, timeNode, timeCategoryNode, '具体时间', reportId, report);
    
    // 4. 车辆：事故 → 车辆分类 → 具体车辆
    vehicleNodes.forEach(vehicleNode => {
      // 找到对应的车辆分类节点
      const catNode = nodes.find(n => n.type === 'vehicle_category' && n.name === vehicleNode.vehicleCategory);
      if (catNode) {
        addDynamicLink(links, catNode, acc, '车辆分类', reportId, report);
        addDynamicLink(links, vehicleNode, catNode, '具体车辆', reportId, report);
      }
    });
    // 5. 过错：事故 → 过错大类 → 具体违法/诱因
    faultCategoryNodes.forEach(category => addDynamicLink(links, category, acc, '过错大类', reportId, report));
    faultCategories.forEach(categoryName => {
      const categoryNode = faultCategoryNodes.find(n => n.name === categoryName);
      getReportFaultItemsByCategory(report, categoryName).forEach(item => {
        const itemNode = item.type === 'fault_factor'
          ? faultFactorNodes.find(n => n.name === item.name) || addDynamicNode(nodes, nodeMap, 'fault_factor', item.name, 20, { faultCategory: categoryName })
          : addDynamicNode(nodes, nodeMap, 'violation', item.name, 22, { faultCategory: categoryName });
        addDynamicLink(links, itemNode, categoryNode, item.type === 'fault_factor' ? '诱因' : '具体过错', reportId, report);
        if (item.type === 'fault_factor') addDynamicLink(links, itemNode, acc, '事故诱因', reportId, report, { relationLevel: 'weakExpand' });
      });
    });
    // 给主violation也加上faultCategory属性，并连接到对应的过错大类
    if (violation && faultCategories.length) {
      violation.faultCategory = faultCategories[0];
      const catNode = faultCategoryNodes.find(n => n.name === faultCategories[0]);
      if (catNode) addDynamicLink(links, violation, catNode, '具体过错', reportId, report);
    }
    
    // 6. 伤亡：事故 → 伤亡分类 → 具体伤亡情况
    addDynamicLink(links, injuryCategoryNode, acc, '伤亡分类', reportId, report);
    addDynamicLink(links, injury, injuryCategoryNode, '具体伤亡', reportId, report);
    
    // 7. 责任：事故 → 责任分类 → 具体责任认定
    addDynamicLink(links, liabilityCategoryNode, acc, '责任分类', reportId, report);
    addDynamicLink(links, liability, liabilityCategoryNode, '具体责任', reportId, report);
    if (personNodes[0]) {
      addDynamicLink(links, violation, personNodes[0], '违法人', reportId, report);
      addDynamicLink(links, liability, personNodes[0], '承担', reportId, report);
    }
    personNodes.forEach((p, i) => {
      const v = vehicleNodes[i] || vehicleNodes[0];
      if (v) addDynamicLink(links, p, v, '驾驶', reportId, report);
    });

    // 8. v2.9+：接入解析器原文证据关系，边上保留 confidence/ruleId/evidence
    addParserRelations(report, reportId, acc, nodes, nodeMap, links);
  });
  const degree = {};
  links.forEach(l => {
    degree[l.source] = (degree[l.source] || 0) + 1;
    degree[l.target] = (degree[l.target] || 0) + 1;
  });
  nodes.forEach(n => {
    const extra = Math.min(12, Math.max(0, (degree[n.id] || 0) - 1));
    n.symbolSize = (n.type === 'accident' ? 34 : n.symbolSize) + extra;
  });
  graphData.nodes = nodes;
  graphData.links = links;
  // 重建高频关系统计
  rebuildRelationStats();
}

function getReportTimeValue(report) {
  const t = Date.parse(String(report && report.date || '').replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, ' ').replace(/时/g, ':').replace(/分/g, ''));
  return Number.isFinite(t) ? t : 0;
}

function getLatestReportId() {
  if (typeof accidentReports === 'undefined' || !Array.isArray(accidentReports) || !accidentReports.length) return null;
  let bestReport = accidentReports[0];
  let bestIndex = 0;
  accidentReports.forEach((r, i) => {
    const diff = getReportTimeValue(r) - getReportTimeValue(bestReport);
    if (diff > 0 || (diff === 0 && i > bestIndex)) {
      bestReport = r;
      bestIndex = i;
    }
  });
  return String(getReportId(bestReport, bestIndex));
}

function ensureDefaultGraphEntry() {
  if (graphEntryReportId) return graphEntryReportId;
  graphEntryReportId = getLatestReportId();
  return graphEntryReportId;
}

function getReportByGraphId(reportId) {
  return accidentReports.find((r, i) => String(getReportId(r, i)) === String(reportId));
}

function getAccidentNodeIdByReportId(reportId) {
  return 'acc_' + safeId(reportId);
}

function getNodeIncidentIds(nodeId) {
  const ids = new Set();
  const node = getNodeById(nodeId);
  if (node && node.type === 'accident' && node.reportId) ids.add(String(node.reportId));
  graphData.links.forEach(l => {
    if (l.source === nodeId || l.target === nodeId) {
      const sourceNode = getNodeById(l.source);
      const targetNode = getNodeById(l.target);
      if (sourceNode && sourceNode.type === 'accident' && sourceNode.reportId) ids.add(String(sourceNode.reportId));
      if (targetNode && targetNode.type === 'accident' && targetNode.reportId) ids.add(String(targetNode.reportId));
      if (l.reportId) ids.add(String(l.reportId));
    }
  });
  return ids;
}

function findNodeByTypeName(type, name) {
  const normalized = normalizeEntityName(type, name);
  return graphData.nodes.find(n => n.type === type && normalizeEntityName(type, n.name) === normalized);
}

function addVirtualNode(nodes, nodeIds, node) {
  if (!node || !node.id || nodeIds.has(node.id)) return;
  nodeIds.add(node.id);
  nodes.push(node);
}

function addVirtualLink(links, source, target, label, options) {
  if (!source || !target) return;
  const id = source + '|' + target + '|' + label;
  if (links.some(l => (l.source + '|' + l.target + '|' + l.label) === id)) return;
  links.push({ source, target, label, virtual: true, ...(options || {}) });
}

function getExpandedGraphViewData(baseReportId, clickedNodeId) {
  const keep = new Set();
  const virtualNodes = [];
  const virtualLinks = [];
  const baseAccId = getAccidentNodeIdByReportId(baseReportId);
  keep.add(baseAccId);

  graphData.links.forEach(l => {
    if (l.reportId && String(l.reportId) === String(baseReportId)) {
      keep.add(l.source); keep.add(l.target);
    }
  });

  if (clickedNodeId) {
    keep.add(clickedNodeId);
    graphData.links.forEach(l => {
      if (l.source === clickedNodeId || l.target === clickedNodeId) {
        keep.add(l.source); keep.add(l.target);
      }
    });
  }

  const clickedNode = clickedNodeId ? getNodeById(clickedNodeId) : null;
  if (clickedNode && (clickedNode.type === 'violation' || clickedNode.type === 'fault_category' || clickedNode.type === 'fault_factor')) {
    const clickedViolation = normalizeEntityName(clickedNode.type, clickedNode.name);
    const sameReports = [];
    const otherReports = [];
    accidentReports.forEach((r, i) => {
      const rid = String(getReportId(r, i));
      if (rid === String(baseReportId)) return;
      const reportValues = clickedNode.type === 'fault_category' ? getReportFaultCategories(r) : (clickedNode.type === 'fault_factor' ? getReportFaultCategoryDetails(r).flatMap(d => d.factors || []) : [r.violation || '']);
      const normalizedValues = reportValues.map(v => normalizeEntityName(clickedNode.type, v)).filter(Boolean);
      if (normalizedValues.includes(clickedViolation)) sameReports.push({ report: r, id: rid });
      else if (normalizedValues.length) otherReports.push({ report: r, id: rid, violation: reportValues[0] });
    });

    sameReports.slice(0, 12).forEach(item => {
      const accId = getAccidentNodeIdByReportId(item.id);
      keep.add(accId);
      addVirtualLink(virtualLinks, clickedNode.id, accId, '同类违法事故', {
        relationLevel: 'weakExpand',
        reportId: item.id,
        sourceTitle: item.report.title,
        evidence: '同属违法行为「' + clickedNode.name + '」的其它事故，可点击事故节点展开其详细图谱。'
      });
    });

    otherReports.slice(0, 10).forEach(item => {
      const accId = getAccidentNodeIdByReportId(item.id);
      keep.add(accId);
      addVirtualLink(virtualLinks, clickedNode.id, accId, '其它违法事故', {
        relationLevel: 'weakerDashed',
        reportId: item.id,
        sourceTitle: item.report.title,
        evidence: '不同违法类型「' + item.violation + '」的其它事故，用更弱虚线列举，便于横向比较；可点击事故节点展开其详细图谱。'
      });
    });
  } else if (clickedNode && clickedNode.type === 'accident' && clickedNode.reportId && String(clickedNode.reportId) !== String(baseReportId)) {
    graphEntryReportId = String(clickedNode.reportId);
    graphExpandedNodeId = null;
    return getExpandedGraphViewData(graphEntryReportId, null);
  } else if (clickedNode) {
    const ids = getNodeIncidentIds(clickedNode.id);
    ids.forEach(rid => {
      if (String(rid) !== String(baseReportId)) keep.add(getAccidentNodeIdByReportId(rid));
    });
  }

  const nodes = graphData.nodes.filter(n => keep.has(n.id)).concat(virtualNodes.filter(n => !graphData.nodes.some(real => real.id === n.id)));
  const links = graphData.links.filter(l => keep.has(l.source) && keep.has(l.target)).concat(virtualLinks);
  return { nodes, links };
}

function getFilteredGraphViewData(viewData) {
  if (!viewData || !Array.isArray(viewData.nodes) || !Array.isArray(viewData.links)) return viewData;
  const focusedNode = graphFocusedNodeId ? (viewData.nodes.find(n => n.id === graphFocusedNodeId) || getNodeById(graphFocusedNodeId)) : null;
  const activeTypes = graphEntityTypeFilters && graphEntityTypeFilters.size ? graphEntityTypeFilters : new Set(Object.keys(entityColors));
  const keepNodeIds = new Set();
  viewData.nodes.forEach(n => {
    if (!focusedNode || n.id === focusedNode.id || n.type === 'accident' || activeTypes.has(n.type)) keepNodeIds.add(n.id);
  });
  if (focusedNode) {
    viewData.links.forEach(l => {
      if (l.source === focusedNode.id || l.target === focusedNode.id) {
        const otherId = l.source === focusedNode.id ? l.target : l.source;
        const other = viewData.nodes.find(n => n.id === otherId) || getNodeById(otherId);
        if (other && (other.type === 'accident' || activeTypes.has(other.type))) {
          keepNodeIds.add(focusedNode.id);
          keepNodeIds.add(other.id);
        }
      }
    });
  }
  const nodes = viewData.nodes.filter(n => keepNodeIds.has(n.id));
  let links = viewData.links.filter(l => keepNodeIds.has(l.source) && keepNodeIds.has(l.target));
  // v3.3.4 建议4：按置信度阈值过滤（gap 缺口边与无置信度的内置关系不受限）。
  if (graphConfidenceThreshold > 0) {
    links = links.filter(l => l.relationLevel === 'gap' || typeof l.confidence !== 'number' || l.confidence >= graphConfidenceThreshold);
  }
  return { nodes, links };
}

function getGraphViewData() {
  const baseReportId = ensureDefaultGraphEntry();
  if (!baseReportId) return graphData;
  return getFilteredGraphViewData(getExpandedGraphViewData(baseReportId, graphExpandedNodeId));
}

function reportMatchesQuery(report, query) {
  query = normalizeName(query).toLowerCase();
  if (!query) return true;
  const hay = [report.title, report.location, report.type, report.creator, report.source, report.violation, report.weather, ...(report.faultCategories || []), ...getReportFaultCategoryDetails(report).flatMap(d => [d.category, ...(d.behaviors || []), ...(d.factors || [])]), ...(report.persons || []), ...(report.vehicles || [])].join(' ').toLowerCase();
  return hay.includes(query);
}

function getSortedReports(source) {
  return getSortedReportsBy(source, reportSortMode);
}

function getSortedReportsBy(source, mode) {
  const rows = [...source];
  const creator = r => getReportCreator(r);
  rows.sort((a, b) => {
    if (mode === 'dateAsc') return String(a.date).localeCompare(String(b.date));
    if (mode === 'titleAsc') return String(a.title).localeCompare(String(b.title), 'zh-Hans-CN');
    if (mode === 'titleDesc') return String(b.title).localeCompare(String(a.title), 'zh-Hans-CN');
    if (mode === 'creatorAsc') return creator(a).localeCompare(creator(b), 'zh-Hans-CN');
    if (mode === 'typeAsc') return String(a.type || '').localeCompare(String(b.type || ''), 'zh-Hans-CN');
    if (mode === 'uploadAsc') return String(getUploadTime(a)).localeCompare(String(getUploadTime(b)));
    if (mode === 'uploadDesc') return String(getUploadTime(b)).localeCompare(String(getUploadTime(a)));
    return String(b.date).localeCompare(String(a.date));
  });
  return rows;
}

function refreshAllAnalysis() {
  rebuildGraphData();
  updateStats();
  refreshGraphAccidentOptions();
  initReports();
  initEntityCategories();
  initClusters();
  initGraph();
}

async function apiJson(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...(options || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error || ('请求失败：' + res.status));
  return data.data;
}

function upsertReportsUnique(reports) {
  let changed = 0;
  (reports || []).forEach(report => {
    if (!report || !report.id) return;
    const idx = accidentReports.findIndex((r, i) => String(getReportId(r, i)) === String(report.id));
    if (idx >= 0) accidentReports[idx] = { ...accidentReports[idx], ...report };
    else accidentReports.push(report);
    changed++;
  });
  return changed;
}

async function reloadServerReports() {
  try {
    const reports = window.ReportsApi ? await ReportsApi.list() : await apiJson('/api/reports');
    upsertReportsUnique(reports);
    refreshAllAnalysis();
    return reports;
  } catch (err) {
    console.warn('服务端报告加载失败：', err);
    return [];
  }
}

async function saveReportsToServer(reports) {
  const data = window.ReportsApi ? await ReportsApi.createMany(reports) : await apiJson('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ reports })
  });
  await reloadServerReports();
  return data;
}

function refreshGraphAccidentOptions() {
  const select = document.getElementById('graphAccidentSelect');
  if (!select || typeof accidentReports === 'undefined') return;
  const input = document.getElementById('graphSearchInput');
  const query = input ? input.value : '';
  // v3.4.8: 不再复用报告库的 reportSortMode，使用图谱专属的 graphAccidentSortMode
  const filtered = getSortedReportsBy(accidentReports.filter(r => reportMatchesQuery(r, query)), graphAccidentSortMode).slice(0, 200);
  const sortSel = document.getElementById('graphAccidentSortSelect');
  if (sortSel && sortSel.value !== graphAccidentSortMode) sortSel.value = graphAccidentSortMode;
  const labelFor = (r) => {
    if (graphAccidentSortMode === 'uploadDesc' || graphAccidentSortMode === 'uploadAsc') {
      return (getUploadTime(r) || '未知上传时间') + '｜' + r.title;
    }
    return (r.date || '未知时间') + '｜' + r.title;
  };
  let html = '<option value="">' + (graphAccidentSortMode.startsWith('upload') ? '默认→最近入库事故' : '默认→时间最近事故') + '</option>';
  ensureDefaultGraphEntry();
  filtered.forEach((r, i) => {
    const id = getReportId(r, accidentReports.indexOf(r));
    html += '<option value="' + escapeHtml(id) + '">' + escapeHtml(labelFor(r)) + '</option>';
  });
  select.innerHTML = html;
  if (graphEntryReportId) select.value = graphEntryReportId;
}

function setGraphAccidentSort(mode) {
  graphAccidentSortMode = mode || 'uploadDesc';
  refreshGraphAccidentOptions();
}


function applyGraphEntry() {
  const select = document.getElementById('graphAccidentSelect');
  graphEntryAutoMode = !(select && select.value);
  graphEntryReportId = select && select.value ? select.value : getLatestReportId();
  graphExpandedNodeId = null;
  graphFocusedNodeId = null;
  initGraph();
  const report = accidentReports.find((r, i) => String(getReportId(r, i)) === String(graphEntryReportId));
  if (report) {
    renderSelectedNodeRelations('acc_' + safeId(graphEntryReportId));
  }
}

function resetGraphEntry() {
  graphEntryAutoMode = true;
  graphEntryReportId = getLatestReportId();
  graphExpandedNodeId = null;
  graphFocusedNodeId = null;
  const select = document.getElementById('graphAccidentSelect');
  const input = document.getElementById('graphSearchInput');
  if (select) select.value = graphEntryReportId || '';
  if (input) input.value = '';
  refreshGraphAccidentOptions();
  initGraph();
}

function setReportFilter(value) {
  reportFilterText = value || '';
  initReports();
}

function setReportSort(mode) {
  reportSortMode = mode || 'uploadDesc';
  const select = document.getElementById('reportSortSelect');
  if (select) select.value = reportSortMode;
  initReports();
}

// ==================== 本地新增报告持久化 ====================
const LOCAL_REPORT_STORAGE_KEY = 'shandongTrafficAccidentKg.localReports.v23';

function loadLocalReportsFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_REPORT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(r => r && r.id) : [];
  } catch (err) {
    console.warn('本地报告读取失败，已忽略：', err);
    return [];
  }
}

function saveLocalReportsToStorage(reports) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(LOCAL_REPORT_STORAGE_KEY, JSON.stringify(Array.isArray(reports) ? reports : []));
    return true;
  } catch (err) {
    console.warn('本地报告保存失败，已忽略：', err);
    return false;
  }
}

function mergeReportsUnique(newReports) {
  if (!Array.isArray(newReports) || !newReports.length) return 0;
  const existing = new Set(accidentReports.map((r, i) => String(getReportId(r, i))));
  let added = 0;
  newReports.forEach(r => {
    const id = String(r && r.id || '');
    if (id && !existing.has(id)) {
      if (isLocalReport(r) && (!r.uploadedAt || r.uploadedAt === r.date)) r.uploadedAt = '升级前上传（时间未记录）';
      existing.add(id);
      accidentReports.push(r);
      added++;
    }
  });
  return added;
}

function getLocalReports() {
  return accidentReports.filter(r => String(r.id || '').startsWith('local-') || r.source === 'localStorage' || r.creator === '解析入库');
}

function persistCurrentLocalReports() {
  saveLocalReportsToStorage(getLocalReports());
}
function isLocalReport(report) {
  return String(report && report.id || '').startsWith('local') || report && (report.source === 'localStorage' || report.creator === '解析入库');
}

function getUploadTime(report) {
  if (report && report.uploadedAt && report.uploadedAt !== report.date) return report.uploadedAt;
  if (isLocalReport(report)) return '升级前上传（时间未记录）';
  return report && report.createdAt ? report.createdAt : '内置/扩展数据';
}

function nowUploadTime() {
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}


// ==================== 页面初始化 ====================
window.onload = async function() {
  // 先合并浏览器本地新增报告，避免刷新后丢失；v2.8 会尝试迁移到服务端 JSON
  mergeReportsUnique(loadLocalReportsFromStorage());
  rebuildGraphData();
  renderLegend();
  refreshAllAnalysis();
  // 先加载扩展报告，再加载服务端持久化报告；服务端报告优先覆盖同 id 数据
  loadExtraReports();
  await reloadServerReports();
  ensureDefaultGraphEntry();
  refreshGraphAccidentOptions();
  console.log('🚗 交通事故分析知识图谱 v2.8.5+ 过错大类统计优化与事故诱因可视化增强版已加载完成！');
};

// 动态同步顶部统计，避免静态数字与真实数据不一致
function updateStats() {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const accidentCount = graphData.nodes.filter(n => n.type === 'accident').length;
  setText('statAccidents', accidentCount);
  setText('statEntities', graphData.nodes.length);
  setText('statRelations', graphData.links.length);
  if (typeof accidentReports !== 'undefined') {
    setText('statReports', accidentReports.length);
    setText('reportCount', accidentReports.length);
  }
}

// 渲染图例
function setGraphConfidenceThreshold(val) {
  const pct = Math.max(0, Math.min(90, Number(val) || 0));
  graphConfidenceThreshold = pct / 100;
  const label = document.getElementById('confThresholdVal');
  if (label) label.textContent = pct + '%';
  initGraph();
  if (graphFocusedNodeId) renderSelectedNodeRelations(graphFocusedNodeId);
}

function toggleGraphEntityType(type, checked) {
  if (checked) graphEntityTypeFilters.add(type);
  else graphEntityTypeFilters.delete(type);
  renderLegend();
  initGraph();
  if (graphFocusedNodeId) renderSelectedNodeRelations(graphFocusedNodeId);
}

function setAllGraphEntityTypes(checked) {
  graphEntityTypeFilters = checked ? new Set(Object.keys(entityColors)) : new Set();
  renderLegend();
  initGraph();
  if (graphFocusedNodeId) renderSelectedNodeRelations(graphFocusedNodeId);
}

function renderLegend() {
  // 实体类型图例 + 筛选器
  const container = document.getElementById('legendList');
  let html = '<div style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:8px;">勾选要展示的关联实体类型；事故节点和当前选中节点会保留。</div>';
  html += '<div class="legend-filter-actions"><button onclick="setAllGraphEntityTypes(true)">全选</button><button class="secondary" onclick="setAllGraphEntityTypes(false)">清空</button></div>';
  Object.entries(entityColors).forEach(([key, info]) => {
    const checked = graphEntityTypeFilters.has(key) ? 'checked' : '';
    html += '<label class="legend-item legend-filter-item">';
    html += '<span style="display:flex;align-items:center;gap:8px;"><span class="legend-color" style="background:' + info.color + '"></span><span>' + info.name + '</span></span>';
    html += '<input type="checkbox" ' + checked + ' onchange="toggleGraphEntityType(\'' + escapeHtml(key) + '\', this.checked)">';
    html += '</label>';
  });
  container.innerHTML = html;
  
  // 关系强度图例
  const relationContainer = document.getElementById('relationLegendList');
  if (relationContainer) {
    let relationHtml = '';
    relationHtml += '<div class="legend-item">';
    relationHtml += '<div style="width:30px;height:3px;background:#dc2626;border-radius:2px;"></div>';
    relationHtml += '<span>强关联</span>';
    relationHtml += '</div>';
    relationHtml += '<div class="legend-item">';
    relationHtml += '<div style="width:30px;height:2px;background:#3b82f6;border-radius:2px;"></div>';
    relationHtml += '<span>中强关联</span>';
    relationHtml += '</div>';
    relationHtml += '<div class="legend-item">';
    relationHtml += '<div style="width:30px;height:1px;background:#94a3b8;border-radius:2px;"></div>';
    relationHtml += '<span>弱关联</span>';
    relationHtml += '</div>';
    relationHtml += '<div class="legend-item">';
    relationHtml += '<div style="width:30px;height:2px;background:#f59e0b;border-radius:2px;border-top:2px dashed #f59e0b;background:none;"></div>';
    relationHtml += '<span>弱推断&lt;60%（虚线）</span>';
    relationHtml += '</div>';
    relationHtml += '<div class="legend-item">';
    relationHtml += '<div style="width:30px;height:2px;background:#f97316;border-radius:2px;"></div>';
    relationHtml += '<span>待补证缺口</span>';
    relationHtml += '</div>';
    relationContainer.innerHTML = relationHtml;
  }
}


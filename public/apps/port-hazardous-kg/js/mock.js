/* mock.js — 离线演示数据
 * 后端不可用时页面仍可独立预览。字段结构与后端 API 完全一致。 */
window.PKG_MOCK = window.PKG_MOCK || {
  topology: {
    nodes: [
      { id: "goods_benzene", type: "dangerous_goods", name: "苯", label: "苯", category: "dangerous_goods" },
      { id: "goods_lpg", type: "dangerous_goods", name: "液化石油气(LPG)", label: "液化石油气(LPG)", category: "dangerous_goods" },
      { id: "goods_crude", type: "dangerous_goods", name: "原油", label: "原油", category: "dangerous_goods" },
      { id: "goods_nitrate", type: "dangerous_goods", name: "硝酸铵(含可燃物)", label: "硝酸铵", category: "dangerous_goods" },
      { id: "goods_methanol", type: "dangerous_goods", name: "甲醇", label: "甲醇", category: "dangerous_goods" },
      { id: "goods_acetone", type: "dangerous_goods", name: "丙酮", label: "丙酮", category: "dangerous_goods" },
      { id: "ent_b", type: "enterprise", name: "招商港务石化(青岛)有限公司", label: "招商港务石化", category: "enterprise" },
      { id: "ent_l", type: "enterprise", name: "苏港(连云港)化工品储运公司", label: "苏港化工", category: "enterprise" },
      { id: "ent_j", type: "enterprise", name: "临港宏泰液化气储运有限公司", label: "宏泰液化气", category: "enterprise" },
      { id: "acc_v", type: "accident", name: "江苏响水天嘉宜化工3·21特别重大爆炸事故", label: "响水3·21爆炸", category: "accident" },
      { id: "acc_tj", type: "accident", name: "天津港8·12瑞海公司危化品爆炸事故", label: "天津8·12爆炸", category: "accident" },
      { id: "emg_bz", type: "emergency_measure", name: "苯及苯系物泄漏围堵收集处置", label: "苯系物泄漏处置", category: "emergency_measure" },
      { id: "emg_lpg", type: "emergency_measure", name: "液化石油气(LPG)泄漏应急处置", label: "LPG泄漏处置", category: "emergency_measure" },
      { id: "chem_n2", type: "chemical_reaction", name: "硝酸铵受热分解", label: "硝酸铵分解", category: "chemical_reaction" }
    ],
    links: [
      { source: "ent_b", target: "goods_benzene", label: "经营", type: "enterprise_deals_goods" },
      { source: "ent_l", target: "goods_benzene", label: "经营", type: "enterprise_deals_goods" },
      { source: "ent_j", target: "goods_lpg", label: "经营", type: "enterprise_deals_goods" },
      { source: "acc_v", target: "goods_benzene", label: "涉及", type: "accident_involves_goods" },
      { source: "acc_tj", target: "goods_nitrate", label: "涉及", type: "accident_involves_goods" },
      { source: "emg_bz", target: "goods_benzene", label: "适用于", type: "emergency_for_goods" },
      { source: "emg_lpg", target: "goods_lpg", label: "适用于", type: "emergency_for_goods" },
      { source: "chem_n2", target: "goods_nitrate", label: "反应", type: "goods_reacts" },
      { source: "goods_nitrate", target: "goods_methanol", label: "禁配", type: "goods_incompatible" }
    ]
  },
  analyze: {
    similar: { enterprises: [{ id: "ent_b", name: "招商港务石化(青岛)有限公司", region: "华东·山东" }], count: 1 },
    accidents: { accidents: [{ id: "acc_v", name: "江苏响水天嘉宜化工3·21特别重大爆炸事故" }], count: 1 },
    emergency: { measures: [{ id: "emg_bz", name: "苯及苯系物泄漏围堵收集处置" }], count: 1 },
    incompatible: { incompatible: [{ name: "过氧化氢溶液(双氧水)" }], reactions: [{ name: "易燃液体蒸气与空气混合爆炸" }], count: 1 },
    knowledge: { items: [{ name: "《港口危险货物安全管理规定》", type: "部门规章" }], count: 1 }
  }
};
window.PKG_IS_MOCK = true;
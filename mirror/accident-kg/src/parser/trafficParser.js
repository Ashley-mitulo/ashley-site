// v2.7/v2.8 TrafficParser: 文本预处理、切句、文档分类、句子级实体抽取、实体归一与置信度
(function (global) {
  const RelationExtractor = global.RelationExtractor || (typeof require !== 'undefined' ? require('./relationExtractor') : null);
  // 词表已外置到 lexicon.js（数据与逻辑分离）。Node 用 require，浏览器需在本脚本前加载 /src/parser/lexicon.js。
  const Lexicon = global.TrafficLexicon || (typeof require !== 'undefined' ? require('./lexicon') : null);
  if (!Lexicon) throw new Error('TrafficLexicon 未加载：Node 环境需 require("./lexicon")，浏览器需在 trafficParser.js 之前 <script src="/src/parser/lexicon.js">');
  const {
    violationAliases, liabilityAliases, faultTaxonomy, faultBehaviorCategoryHints,
    vehicleTypes, weatherAliases, roadConditions, faultFactorAliases, accidentTypes,
    vehicleTokensBase, vehicleTokensExtended
  } = Lexicon;
  // 车型正则由 token 列表 .join('|') 构建，避免超长单行难维护（三处共用同一数据源）。
  const VEHICLE_BASE_ALT = vehicleTokensBase.join('|');
  const VEHICLE_EXT_ALT = vehicleTokensExtended.join('|');

  function preprocess(text) {
    return String(text || '')
      // 剔除末尾免责/样本声明模板句（“本报告为…虚构样本…”、“文中不含真实自然人姓名，人员均使用…匿名称谓…”）——这些模板枚举会污染实体抽取（把枚举的甲/乙/A某/B某当成当事人）。
      .replace(/本报告为[^\n]*?(?:虚构样本|测试[^\n]*?样本)[^\n]*(?:\n|$)/g, '')
      .replace(/文中不含真实[^\n]*?(?:匿名称谓|遵蔽信息|遮蔽信息)[^\n]*(?:。|\n|$)/g, '')
      .replace(/[，；;。]?人员均使用[^\n。]*?等?匿名称谓[^\n。]*(?:。|(?=\n)|$)/g, '')
      .replace(/[，；;。]?车牌均为虚构[^\n。]*(?:。|(?=\n)|$)/g, '')
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/＋/g, '+')
      .replace(/([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z])\s+([A-Z0-9*×X]{1,6})/g, '$1$2')
      // v3.4.7 Bug7 P0-1: 公安实报常见中点车牌归一化：鲁A·12345 / 苏A•12345 / 鲁A·12345 → 鲁A12345。
      // 仅删除“省份简称[+A-Z]”与“[A-Z0-9]{4,6}”之间的分隔符，避免伤及其他中点用途。
      .replace(/([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z])[·•・.．･]+([A-Z0-9]{4,6})/g, '$1$2')
      .replace(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g, '$1年$2月$3日')
      // 测试阶段修（F·中文数字伤亡）：将“十二人受伤/三人死亡/两人重伤”等中文数字伤亡计数转阿拉伯，
      // 仅限“(数)人/名 + 死亡/受伤/重伤/轻伤/轻微伤”上下文，避免误改其他中文数字。
      .replace(/(?<!某)([零一二两三四五六七八九十]{1,3})\s*([人名])\s*(?=(?:死亡|受伤|重伤|轻伤|轻微伤|不同程度受伤))/g, (m, cn, unit) => {
        const map = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
        let n;
        if (cn.length === 1) n = map[cn];
        else if (cn.length === 2 && cn[0] === '十') n = 10 + map[cn[1]];
        else if (cn.length === 2 && cn[1] === '十') n = map[cn[0]] * 10;
        else if (cn.length === 3 && cn[1] === '十') n = map[cn[0]] * 10 + map[cn[2]];
        else n = NaN;
        return Number.isFinite(n) ? (n + unit) : m;
      })
      .replace(/案例[一二三四五六七八九十]+[：:]/g, m => {
        const cn = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
        const c = (m.match(/案例([一二三四五六七八九十]+)/) || [])[1] || '';
        return '案例' + (cn[c] || c) + '：';
      })
      .replace(/[\t\r]+/g, ' ')
      // v3.4.7 Bug4：剥除从聘聊应用拷贝时残留的 Markdown 强调下划线 `_中文_` ——
      // 仅当下划线紧贴汉字时才删（不伤及车牌、英文、标识符），避免联想中断。
      .replace(/(?<=[\u4e00-\u9fa5])_+(?=[\u4e00-\u9fa5\uff08\uff09\uff0c\u3002\u3001\uff1a\uff1b])/g, '')
      .replace(/(?<=[\uff08\uff09\uff0c\u3002\u3001\uff1a\uff1b])_+(?=[\u4e00-\u9fa5])/g, '')
      // 数字/英文与汉字之间的强调下划线（如 `_2026_年`、`_苏 A33333_`）同样剥除（内容保留）。
      .replace(/(?<=[\u4e00-\u9fa5])_+(?=[0-9A-Za-z])/g, '')
      .replace(/(?<=[0-9A-Za-z])_+(?=[\u4e00-\u9fa5])/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  }

  function splitSentences(text) {
    const clean = preprocess(text);
    const sentences = [];
    const re = /[^。！？!?；;\n]+[。！？!?；;]?/g;
    let m;
    while ((m = re.exec(clean))) {
      const sentence = m[0].trim();
      if (!sentence) continue;
      sentences.push({ index: sentences.length, text: sentence, start: m.index, end: m.index + m[0].length });
    }
    if (!sentences.length && clean) sentences.push({ index: 0, text: clean, start: 0, end: clean.length });
    return sentences;
  }

  function classifyDocument(text) {
    const clean = preprocess(text);
    if (/案例\d+/.test(clean) && /【基本案情】|【裁判结果】|【典型意义】/.test(clean)) return 'supreme-court-cases';
    if (/案例\d+：/.test(clean) && (clean.match(/案例\d+：/g) || []).length > 1) return 'news-batch-cases';
    if (/原告|被告|法院|判决|赔偿/.test(clean)) return 'court-case';
    if (/道路交通事故认定书|经认定|负.*责任/.test(clean)) return 'police-accident-report';
    return 'single-report';
  }

  function canonicalFromAliases(value, dict) {
    const text = String(value || '');
    // v3.4.2 Bug1 修复：改为“最长匹配优先”，避免短别名子串抢先命中（如“醉酒后驾驶”含“酒后驾驶”被降级成酒驾）。
    let best = null;
    for (const [canonical, aliases] of Object.entries(dict)) {
      const terms = [canonical, ...(aliases || [])];
      for (const t of terms) {
        if (t && text.includes(t) && (!best || t.length > best.len)) best = { canonical, len: t.length };
      }
    }
    return best ? best.canonical : value;
  }

  function normalizeRoadName(value) {
    let text = String(value || '').trim()
      .replace(/[，。；;：:、]+$/g, '')
      .replace(/^.*(?:发生在|位于|事故地点为|地点为|行驶至|行至|驶至|行经|驶经|经过|沿(?![江河山海湖])|路段为)/, '')
      // r34 R21/R24："行驶位置为/事发于/事故发生于/事发地(点)为/位置为"等叙事前缀 + 真路名 → 剥前缀留真路名。
      .replace(/^.*(?:行驶位置为|行驶位置|事发于|事故发生于|事发地点为|事发地为|事发位置为|位置为|事故位于|事故发生在)/, '')
      .replace(/^.*?([\u4e00-\u9fa5A-Za-z0-9]{2,24}(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)[\u4e00-\u9fa5A-Za-z0-9]{0,16}(?:匝道|路段|道口|出口|入口|交叉口|路口|公交港湾站|公交站台|公交港湾站北侧|公交站台北侧|公交港湾站南侧|公交站台南侧|人行横道|停车场出口|环岛东出口|桥头|弯道))$/, '$1')
      .replace(/^(?:在|于|至|为|和|及|与|、)+/, '')
      .replace(/^(?:事发时|当时|事发前|事发后|昨日|昨晚|昨夜|随后|之后|继而|接着)+/, '')
      .replace(/(?:发生|造成|导致|接近|临近|通过|经过|驶入|驶至|行至|发生一起).*$/, '')
      .replace(/^.*?米(?=[\u4e00-\u9fa5A-Za-z0-9]*(?:桥|隧道|路|街|大道|公路|国道|省道|交叉口|路口|人行横道|公交港湾站|公交站台|停车场出口|环岛|弯道|坡道))/, '')
      // 剥“…处的/…处/…段”等位置后缀前的桩号/前段（“K588+300米处的沂蒙山隧道”→沂蒙山隧道）
      .replace(/^.*?(?:处的|处|段)(?=[\u4e00-\u9fa5A-Za-z0-9]{2,}(?:桥|隧道|路|街|大道|公路|高速))/, '')
      // 道路名中出现动作/状态动词短语则截断到其前道路部分
      .replace(/^([\u4e00-\u9fa5A-Za-z0-9+]*?(?:高速公路|高速|国道|省道|快速路|辅路|主路|支路|公路|大道|匝道|隧道|环岛|交叉口|路口|人行横道|桥|街|路))(?:桩面|桥面|路面)?(?:结了|结冰|积水|积雪|冒出|冲出|侧滑|打滑|撞上|失控|发软|打穿|爆胎)[\u4e00-\u9fa5A-Za-z0-9]*$/, '$1')
      .replace(/^([\u4e00-\u9fa5A-Za-z0-9+]*?(?:高速公路|高速|国道|省道|快速路|辅路|主路|支路|公路|大道|匝道|隧道|环岛|路))时[\u4e00-\u9fa5]*$/, '$1');

    // ---- 统一前缀清洗层（道路系统重构，测试阶段，无版本号）----
    // 循环剔除“因/将/遇/把/结果/随后/正在”等非道路引导词、及“人名+在/驾驶”开头噪声，
    // 仅当剔除后其后仍有真道路类词时才剔。处理 因匝道桥/将正在人行横道/遇桥面/蒋某某在人行横道 等。
    {
      const roadKind = '(?:高速公路|高速|国道|省道|县道|乡道|村道|快速路|辅路|主路|支路|公路|大道|路|街|桥|隧道|交叉口|路口|匝道|通道|人行横道|环岛|桥头|弯道|坡道|路段)';
      // 剔除开头非道路引导词/人名前缀——采用“剔除后验证”策略：
      // 仅当剔除前缀后剩余仍为合法且≥两字道路名时才剔（避免“将军大道”的将/军被误删）。
      const leadWord = '(?:因|将(?![军台相])|遇|把|结果|随后|之后|然后|又|并|则|便|就)';
      // 动词型引导词（因/将/遇/把）仅当其后紧接道路类词时才剔（因匝道✓ 但 因河路✗、遇仙桥✗、把水河大桥✗——保护首字恰为因/遇/把的真路名）。
      const leadWordVerb = new RegExp('^(?:因|遇|把)(?!' + roadKind + ')');
      const nameHead = '(?:[A-Z]某|[\\u4e00-\\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸])(?:在|于|自|从|驾驶|驾|骑|步行|行至|行驶至)';
      const midMove = '(?:在|着|了|向|朝|由|自|从|行驶|行)*';
      // “将正在人行横道/正常行驶至XX路”等：引导词/人名后可跳过“正在/正常”状态词，但仅作独立词跳过，
      // 不吞“正/沿”单字（避免正阳大道→阳大道、沿江大道→江大道被误删首字）。
      const stateSkip = '(?:正在|正常)?';
      const preStrip = new RegExp('^(?:' + leadWord + '|' + nameHead + ')' + stateSkip + midMove);
      let prev = null;
      while (prev !== text) {
        prev = text;
        // 动词型引导词：其后非道路类词（即真路名首字）则不剔
        if (leadWordVerb.test(text)) { break; }
        const m = text.match(preStrip);
        if (m && m[0].length > 0) {
          const rest = text.slice(m[0].length);
          // 剩余部分必须≥两字且以道路类词结尾（合法路名）才接受剔除
          const restOk = new RegExp(roadKind + '$').test(rest) && (rest.length >= 2 || /^(?:桥|路|街|口)$/.test(rest));
          if (restOk) {
            text = rest;
            continue;
          }
        }
        break;
      }
      // 中间噪声：“<道路>因/在/将/遇<其余>”如 京沪高速因高速 → 取引导词前的道路
      text = text.replace(new RegExp('^([\\u4e00-\\u9fa5A-Za-z0-9]*' + roadKind + ')(?:因|将|遇)(?:[\\u4e00-\\u9fa5A-Za-z0-9]*)$'), '$1');
      // 重复尾字：跨江大桥桥→跨江大桥；XX路路→XX路
      text = text.replace(/(桥|路|街)\1$/, '$1');
      // 重复整段路名词：江东中路江东中路→江东中路
      text = text.replace(/^(.+?(?:高速公路|高速|国道|省道|县道|乡道|快速路|辅路|主路|支路|公路|大道|路|街|桥|隧道|匝道))\1$/, '$1');
    }

    const intersectionTail = text.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)与[\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)(?:交叉口|路口)|(?:巷|桥)(?:路口|交叉口)))$/);
    if (intersectionTail) {
      text = intersectionTail[1].replace(/^.*[省市县区镇乡村](?=[\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)与)/, '');
    }

    if (/^K\d+(?:\+\d+(?:米|[mM])?)?$/i.test(text)) return text.replace(/(米|[mM])$/i, '').toUpperCase();
    if (/^[GS]\d{1,4}(?:国道|省道)?$/i.test(text)) return text.toUpperCase();

    // 行政区划常与道路粘连，如“某市历北区经三路”；保留真正道路名。
    if (!/与/.test(text)) {
      const adminTail = text.match(/[省市县区镇乡村](?!.*[省市县区镇乡村])([\u4e00-\u9fa5A-Za-z0-9]{2,12}(?:交叉口|高速公路|高速|国道|省道|公路|大道|街|桥|隧道|路口|匝道|路))$/);
      if (adminTail) text = adminTail[1];
      // 行政区划剔离后可能暴露重复整段路名（江东中路江东中路→江东中路）
      text = text.replace(/^(.+?(?:高速公路|高速|国道|省道|县道|乡道|快速路|辅路|主路|支路|公路|大道|路|街|桥|隧道|匝道))\1$/, '$1');
    }

    return text;
  }

  function isRoadNoiseText(value) {
    const text = String(value || '').trim();
    if (!text) return true;
    if (/(医疗或路|路政人员|若当事方|进入路口|客车上坡避让路|车辆带泥上路|右前轮压碎石路|维修厂定损材料城市路口|发生一起道路|道路管理单位|管理单位也应|村社和道路|照明和路|道路照明|接近路|绕避路|夜间路口|正在过街|无路灯|后路面|碰撞部位|碰撞痕迹|碰撞点|碰撞形态检验|驶上主桥|斜穿路口|污染路|挤占路|避让但路|车辆入匝道|未让主路|摊位灯箱和临停车辆遮挡了路口|甲为绕开路|压入非机动车过街|连续跨越实线寻找匝道|遮挡了路口|为绕开路|压入非机动车|寻找匝道|跨越实线|下来到车|骑行人与右转车|行人乙车|切割路|说清隧道|明日起坡道|检查坡道|越过路|夜间弯道)/.test(text)) return true;
    // r39/r40 D类：动作/叙述短语 + 通用道路词(无专名) → 噪声。
    // "徒步横穿高速公路"/"交警提醒进入隧道"/"因行人常某违规在隧道"/"龚某未能及时发现前方路"/"某道路施工路"
    if (/(?:横穿|穿越|提醒进入|提醒|违规在|违规进入|违法进入|未能及时?发现|发现前方|冲入|冲出|驶入|误入)[\u4e00-\u9fa5]{0,6}(?:高速公路|高速|隧道|公路|路|匝道|路段)$/.test(text)) return true;
    if (/^(?:某道路施工|前方|对向|同向|后方)[\u4e00-\u9fa5]{0,4}路$/.test(text)) return true;
    if (/^[\u4e00-\u9fa5]*某(?:某)?[\u4e00-\u9fa5]{0,8}(?:发现|违规|违法|驾驶|行驶)[\u4e00-\u9fa5]{0,4}(?:路|隧道|高速|公路)$/.test(text)) return true;
    // r23/r25/r27 巡检补漏：动词短语(冲下/清除/违法变道/未及时清除/因X内)截断到通用道路词 → 噪声。
    if (/(?:冲下|冲出|清除|未及时?清除|违法变道|强行并线|遗撒|并线|越过|冲入|驶入)[\u4e00-\u9fa5]{0,6}(?:路基|路|隧道|高速|公路|匝道|路段|路面)$/.test(text)) return true;
    if (/(?:超过|低于|超)[一-龥]{0,2}该路(?:段)?$/.test(text)) return true; // r41 “超过该路”动词短语截断到通用路字
    // "X某因/在 …内/…时 <动词>…路/隧道" 整串(人名+因/在+动作)判噪声。
    if (/[\u4e00-\u9fa5]{1,4}某(?:某)?(?:因|在|于|经)[\u4e00-\u9fa5]{0,10}(?:路|隧道|高速|公路|大道|街|桥)$/.test(text)) return true;
    // 机构/养护单位 + 动作从句 + 通用道路词(无独立专名尾)判噪声。
    if (/(?:养护单位|养护中心|管理单位|施工单位|物业|项目部)[\u4e00-\u9fa5]{0,12}(?:因|未|清除|设置)[\u4e00-\u9fa5]{0,8}(?:路|隧道|高速|公路)$/.test(text)) return true;
    if (/(建议|提示|整改|应当|管理单位应|同时建议|复核|材料|医疗|保险|维修).*(路|路口|施工|弯道|匝道)/.test(text)) return true;
    return false;
  }

  function isSuggestionSentence(sentence) {
    return /(若|如果|建议|提示|整改|应当|管理单位应|同时建议|隐患排查|提交整改|对标线|形成闭环)/.test(String(sentence || ''));
  }

  function isRoadConditionAllowedSentence(sentence) {
    const text = String(sentence || '');
    if (isSuggestionSentence(text)) return false;
    return /(事发时|道路条件|路面|天气|事故经过|经过|主要过错|发生|路段|现场|积水|湿滑|施工|弯道|坡道|路口|匝道|下坡|上坡|路肩)/.test(text) && !/事故后果有较大概率可以减轻/.test(text);
  }

  function isValidRoadName(value) {
    const text = String(value || '').trim();
    if (!text || isRoadNoiseText(text)) return false;
    if (/^K\d+(?:\+\d+(?:米|[mM])?)?$/i.test(text)) return true;
    if (/^[GS]?\d{1,4}(?:国道|省道)$/i.test(text)) return true;
    if (/^[XYZ]\d{1,4}(?:县道|乡道)?$/i.test(text)) return true;
    if (/^[GS]\d{1,4}$/i.test(text)) return true;

    const intersection = /^[\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)与[\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)(?:交叉口|路口)|(?:巷|桥)(?:路口|交叉口))$/;
    if (intersection.test(text)) return true;

    // 泛词和事故叙述片段不是道路实体。
    if (/^(道路|公路|路|街|桥|隧道|路口|交叉口|匝道|主桥)$/.test(text)) return false;
    if (/道路$/.test(text) && !/(通组道路|村道|乡道|县道)$/.test(text)) return false;
    if (/^(发生|造成|导致|接近|临近|通过|经过|驶入|驶至|行至|从|但|并|也|能|不能|没有|不符合|让出|甲|乙|丙|丁|骑行人|行人|乘客|驾驶人|查勘时|所有|排队|选择)/.test(text)) return false;
    // v3.4.4 Bug4: “未走人行横道/违法横穿/未走X”等否定/违法行为描述不是道路实体。
    if (/^(未走|未依法走|未按规定走|违法横穿|横穿|未走行|横过|穿过|通过|经过)/.test(text)) return false;
    // 道路重构：纯“横过马路/横穿道路”等过街动作短语不是道路实体。
    if (/^(?:横过|横穿|穿越|穿过|通过)(?:马路|道路|公路|街道|路面|路口)$/.test(text)) return false;
    // 运动动词+道路类词（冲出弯道/驶出主路/滑出路面/闯入路口）不是道路实体。
    if (/^(?:冲出|驶出|滑出|闯入|开出|飞出|抛出|侧滑出)(?:弯道|坡道|匝道|主路|辅路|路面|路口|马路|道路|车道)$/.test(text)) return false;
    // r34 R24："撞上/撞向/撞入/冲上/冲向 + 泛道路词(高速公路/道路/护栏…)"无具体路名，是事故叙事片段非道路实体。
    if (/^(?:撞上|撞向|撞入|撞到|冲上|冲向|冲入|驶上|驶向|坠入|坠向)(?:高速公路|高速|道路|公路|马路|路面|护栏|隔离带|中央分隔带|路|桥|匝道)$/.test(text)) return false;
    // r34 R01/R07："因…致路/因…坠桥/因…冲破护栏坠桥"等以"因"引导、含事故动词、尾字仅为泛"路/桥"的因果从句片段，非道路实体。
    if (/^因[\u4e00-\u9fa5A-Za-z0-9]{2,}(?:致|冲破|撞|坠|冲出|驶入|驶出|失控|打滑|侧滑)[\u4e00-\u9fa5]{0,6}(?:路|桥|护栏)$/.test(text)) return false;
    if (/(?:致|冲破护栏坠|坠|撞破|冲破)(?:路|桥)$/.test(text) && !/(?:高速|大道|公路|国道|省道|县道|乡道|村道|快速路|大桥|立交|高架)(?:路|桥)?$/.test(text)) return false;
    // 现库质检：“动作/状态/描述短语 + 路/桥”脏片段不是道路实体（尾字息为“路/桥”但前文是行为/状态词）。
    // 例：处述向右避让但因路、冲向右侧路、右前部撞上路、弯道操控不当冲出路、失去方向控制后冲向桥、址落路、址至路、未注意观察(前方)路、时未考虑结冰路、雪后结冰桥、加之路、因雨天路、雨天路、山区险路、阵雨后路
    if (/(?:避让|冲向|冲出|撞上|撞向|坠落|坠至|坠入|驶入|观察|考虑|控制|操控|未注意|因|加之|雨天|雪后|雪天|结冰|阵雨|险|下坡|转弯|狭窄|行驶|正常行驶|上高速|雾天|雨后|说明)[一-龥]{0,4}(?:路|桥|高速|坡道)$/.test(text) && !/(?:高速|大道|公路|国道|省道|县道|乡道|村道|快速路|辅路|主路|支路|大桥|立交)$/.test(text.replace(/^(?:雨天|雾天|雪天)/, ''))) return false;
    // 坠落/坠至/坠入 + 路；以“方向/公里/收费站(附近)”等方位量词后接“路”的截断片段；个别固定脏串。
    if (/^(?:坠落|坠至|坠入)[一-龥]{0,4}路$/.test(text)) return false;
    if (/(?:方向|公里|收费站附近|收费站)路$/.test(text)) return false;
    if (/^(?:道无路|雾天上高速|雨后坡道)$/.test(text)) return false;
    // 长句片段（含车/乘客/人数/方向/汇入/缓慢等叙事词）且以路结尾的不是道路实体。
    if (/[一-龥]{8,}(?:路|桥)$/.test(text) && /(?:车|乘客|人|方向|汇入|缓慢|左转|右转|进入|公里|收费站|坐落|坐于|约)/.test(text)) return false;
    // v3.4.4 Bug9: “遗洒砂石在路/洒落物在路”等遗洒描述不是道路实体。
    if (/(遗洒|遗撒|洒落|撒落|洒漏|抛洒|抛撒|散落|砂石在路)/.test(text)) return false;
    if (/\d因匝道|夜间施工路$|冰雪路$/.test(text)) return false;
    if (/(一起|交通事故|事故|接近|照明|路面|条件|村社|管理单位|加强|重点|治理|也应|应当|和路|及路|医疗|路政|若|如果|建议|整改|提示|材料|定损|受损|费用|保险|过错分析|急|绕|压入|跨越|寻找|遮挡|停在|移至|坐在|擦到|借道|让主路|撤离|异常|鸣笛|保洁|放置|拨打|压到|快速上桥|公交|车|人员|车辆)/.test(text) && text === value) return false;
    if (/^(碰撞|刮碰|追尾|侧翻|坠沟|撞|事发时|两车|三车|甲|乙|丙|丁|A某|B某|C某)/.test(text) && /(过街|无路|后路|在路口|绕避路|夜间路口|均未在桥|预判不足|中心碰撞)$/.test(text)) return false;
    if (/^[一二三四五六七八九十]路交叉口$/.test(text)) return false;
    if (/^[甲乙丙丁戊己庚辛壬癸某]?(?:接近)?路(?:口)?$/.test(text)) return false;
    if (/^[\u4e00-\u9fa5]路$/.test(text) && !/^[一二三四五六七八九十东西南北中]路$/.test(text)) return false;

    if (/^[XYZ]\d{1,4}$/.test(text)) return false; // 避免把车牌尾号（如鲁DXX318）误识别为县乡道。
    return /(高速公路|高速|国道|省道|县道|乡道|村道|通组道路|快速路|辅路|主路|支路|公路|大道|路|街|桥|隧道|交叉口|路口|匝道|通道|人行横道|公交港湾站|公交站台|站台|公交港湾站北侧|公交站台北侧|公交港湾站南侧|公交站台南侧|停车场出口|出口|入口|桥头|东头|西头|弯道|坡道|路侧树木|公交港湾站北侧|公交站台北侧|公交港湾站南侧|公交站台南侧|停靠点|改造点|右转口|中心区域|路段)$/.test(text);
  }

  function normalizeEntity(type, value) {
    let text = String(value || '').trim().replace(/[，。；;：:、]+$/g, '').replace(/^(驾驶人|驾驶员|司机|骑行人|原告|被告|行人|乘客|乘坐人|伤者|死者|未成年人|员工|公交乘客)/, '');
    if (type === 'person') {
      // 复姓白名单（欧阳/上官/司马/诸葛等）优先，避免“欧阳某”截为“阳某”；否则回退单姓（不用通配{2}防止“撞后韩某”误抽）。
      const cpx = '(?:欧阳|上官|司马|诸葛|夏侯|皇甫|尉迟|公孙|慕容|端木|独孤|长孙|宇文|司徒|令狐|钗钥|濮阳|东方|赫连|皮克|轩辕|令刘|邹屠|毌丘|万俟)';
      const m = text.match(new RegExp('(?:' + cpx + '某某?)$')) || text.match(/(?:[A-Z]某|[\u4e00-\u9fa5]某某?|[甲乙丙丁戊己庚辛壬癸])$/);
      if (m) {
        text = m[0];
      } else {
        // 测试阶段修（无版本号）：人名在开头+后接动作/违法描述的脏 token（如“卫某驾驶渣土车”“褚某因未保持安全车”）从开头提取人名占位；仅当其后紧跟 驾驶/骑/开/因/负/与/及/未/超/醉/酒 等行为字时才剥，避免误截真实三字姓名。
        const head = text.match(/^([A-Z]某|[\u4e00-\u9fa5]{2}某某?|[\u4e00-\u9fa5]某某?|[甲乙丙丁戊己庚辛壬癸])(?=驾驶|骑|驾|开着?|因|负|与|及|和|未|超|醉|酒|撞|碰|闯|超载|逆向|分心|疲劳)/);
        if (head) text = head[1];
      }
    }
    if (type === 'vehicle') text = text.replace(/[\s·・-]/g, '').replace(/号车$/, '').toUpperCase();
    if (type === 'violation') text = canonicalFromAliases(text, violationAliases);
    if (type === 'liability') text = canonicalFromAliases(text, liabilityAliases);
    if (type === 'vehicle_attr') text = canonicalFromAliases(text, vehicleTypes);
    if (type === 'weather') text = canonicalFromAliases(text, weatherAliases);
    if (type === 'road_condition') text = canonicalFromAliases(text, roadConditions);
    if (type === 'fault_factor') text = canonicalFromAliases(text, faultFactorAliases);
    if (type === 'casualty_status') text = '无伤亡';
    if (type === 'accident_type' && text === '刮碰') text = '刮擦';
    if (type === 'accident_type' && /撞上路侧树木|单方撞树/.test(text)) text = '撞树';
    if (type === 'accident_type' && text === '撞上护栏') text = '撞护栏';
    if (type === 'road') text = normalizeRoadName(text);
    if (type === 'vehicle_instance') text = text.replace(/\s+/g, '');
    if (type === 'property_loss') {
      text = text.replace(/^[，。；;：:、\s]+|[，。；;：:、\s]+$/g, '');
      const amountTail = text.match(/([\u4e00-\u9fa5A-Za-z0-9及、和两三四五\-]{1,24}(?:损失|费用|货损|车损|路产损失|维修费用|施救费用|核损金额|定损|核损|报价)(?:约)?\d+(?:\.\d+)?(?:万)?元)$/);
      if (amountTail) text = amountTail[1];
    }
    if (type === 'traffic_place') {
      text = text.replace(/^[，。；;：:、\s]+|[，。；;：:、\s]+$/g, '');
      const placeTail = text.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,24}(?:夜市东门|仓库门前|物流仓\d*号门前|商场地库|厂区\d*号门内|成品库转角处|学校门口|小区坡道|地下车库出口坡道|窄巷|小区门前|服务区入口|南门|西门|门前|地库B\d|B\d区|巷口|湿地公园南门外|公交站附近|施工段))$/);
      if (placeTail) text = placeTail[1].replace(/^.*(?:驶入|进入|到达|发生于|发生在|地点为|在|于|沿|从)/, '');
    }
    return text;
  }

  function confidenceFor(type, value, sentence) {
    const text = String(value || '');
    const ctx = String(sentence || '');
    if (type === 'vehicle' && /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9*×X]{5,6}$/.test(text)) return 0.96;
    if (type === 'time' && /20\d{2}年\d{1,2}月\d{1,2}日/.test(text)) return /\d{1,2}[时:]\d{0,2}/.test(ctx) ? 0.95 : 0.88;
    if (type === 'violation') return canonicalFromAliases(text, violationAliases) !== text || Object.keys(violationAliases).includes(text) ? 0.88 : 0.72;
    if (type === 'liability') return 0.9;
    if (type === 'road' && /(高速|国道|省道|县道|乡道|村道|通组道路|快速路|辅路|主路|支路|公路|大道|路|街|桥|隧道|交叉口|路口|匝道|人行横道|公交港湾站|公交站台|停车场出口|环岛|桥头|弯道|坡道|K\d+)/.test(text)) return 0.82;
    if (type === 'person' && /(驾驶|乘坐|骑行|步行|原告|被告|行人|伤者|死者|负)/.test(ctx)) return 0.76;
    if (type === 'injury') return 0.84;
    if (type === 'property_loss') return 0.86;
    if (type === 'accident_type') return 0.8;
    if (type === 'traffic_place') return 0.76;
    if (type === 'fault_factor') return canonicalFromAliases(text, faultFactorAliases) !== text || Object.keys(faultFactorAliases).includes(text) ? 0.84 : 0.74;
    if (type === 'weather' || type === 'road_condition' || type === 'vehicle_attr' || type === 'vehicle_instance') return 0.78;
    return 0.65;
  }

  function addEntity(out, seen, entity) {
    const normalizedName = normalizeEntity(entity.type, entity.name);
    if (!normalizedName || normalizedName.length < 1) return;
    if (entity.type === 'road' && !isValidRoadName(normalizedName)) return;
    if (entity.type === 'traffic_place' && (!normalizedName || isRoadNoiseText(normalizedName) || /^(?:衣架留在门前|跟随导航驶入窄巷)$/.test(normalizedName))) return;
    // v3.4.7 Bug1: 支持"真实姓名"（非"某"式匿名），仅当 entity.isRealName===true 时放行；其他人名依旧白名单。
    if (entity.type === 'person' && !entity.isRealName && !/^(?:[A-Z]某?|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸])$/.test(normalizedName)) return;
    if (['事故', '事件', '情况', '本次事故', '该事故'].includes(normalizedName)) return;
    const roleKey = entity.type === 'person' && entity.role ? '|' + entity.role : '';
    // v3.4.4 Bug8: liability 去重键纳入 relatedPerson，否则"同等责任"等多主体共享同一句会互相覆盖。
    const liabKey = entity.type === 'liability' && entity.relatedPerson ? '|' + entity.relatedPerson : '';
    // v3.4.7 Bug2: person 去重键不纳入 sentenceIndex，避免同一人名在多句重复创建（"郑某某"双份现象）；其他类型保留句级去重。
    const sentKey = entity.type === 'person' ? '' : '|' + entity.sentenceIndex;
    const key = entity.type + '|' + normalizedName + sentKey + roleKey + liabKey;
    if (seen.has(key)) return;
    // v3.4.7 Bug2b: 若已存在同名"X某某"，其前缀子串"X某"不再单独入库。
    if (entity.type === 'person' && /^[\u4e00-\u9fa5]某$/.test(normalizedName)) {
      const longer = normalizedName + '某';
      if (out.some(e => e.type === 'person' && e.normalizedName === longer)) return;
    }
    seen.add(key);
    const idName = entity.type === 'person' && entity.role ? normalizedName + '_' + entity.role : normalizedName;
    out.push({ id: entity.type + '_' + idName, ...entity, normalizedName, confidence: entity.confidence == null ? confidenceFor(entity.type, normalizedName, entity.evidence) : entity.confidence, extractor: entity.extractor || 'traffic-parser-v2.8' });
  }

  function includesAny(text, terms) {
    const s = String(text || '');
    return (terms || []).some(t => t && s.includes(t));
  }

  function categoryFromBehaviorText(behaviorText, evidence) {
    const behavior = String(behaviorText || '');
    const context = String(evidence || '');
    const behaviorPriority = ['机动车驾驶人违规驾驶', '机动车驾驶人操作不当', '非机动车驾驶人违法/过错', '行人违法/过错', '车辆状态/装载问题', '道路环境与设施隐患', '管理责任/组织责任', '不可控/外部诱因'];
    for (const category of behaviorPriority) {
      if (includesAny(behavior, faultBehaviorCategoryHints[category])) return category;
    }
    for (const category of ['车辆状态/装载问题', '道路环境与设施隐患', '管理责任/组织责任', '不可控/外部诱因', '机动车驾驶人违规驾驶', '机动车驾驶人操作不当', '非机动车驾驶人违法/过错', '行人违法/过错']) {
      if (includesAny(context, faultBehaviorCategoryHints[category])) return category;
    }
    return '';
  }

  function inferSubjectTypeFromText(text, personRole) {
    const s = String(text || '');
    const role = String(personRole || '');
    if (/骑行人/.test(role) || /骑行人|电动自行车|电动车|自行车|非机动车|二轮车|三轮车|摩托车/.test(s)) return '非机动车驾驶人';
    if (/行人|步行|学生|儿童|未成年人/.test(role) || /行人|步行|过街|横穿/.test(s)) return '行人';
    if (/物业|平台|施工单位|项目部|园区|养护单位|道路管理|管理单位|校车方|站点|照管员|安全员|保安员|看护员/.test(s)) return '管理/组织主体';
    if (/爆胎|灯光故障|制动故障|轮胎故障|货物|装载|固定|超载/.test(s)) return '车辆/装载';
    if (/驾驶人|驾驶员|司机|机动车|轿车|小客车|货车|公交|客车|出租车|网约车|SUV|牵引车|半挂|救护车|叉车|驾驶|行驶/.test(role + s)) return '机动车驾驶人';
    if (/路面|照明|围挡|标志|标线|道路|施工区|弯道|坡道|匝道|路口|团雾|暴雨|横风|大风/.test(s)) return '道路/环境';
    return '';
  }

  function inferBehaviorNature(behaviorText, category, subjectType, evidence) {
    const s = [behaviorText, evidence].filter(Boolean).join(' ');
    if (category === '不可控/外部诱因' || /团雾|暴雨|强降雨|横风|大风|冰雪|积雪|落石|塌方|不可控|突发/.test(behaviorText)) return '外部诱因';
    if (/隐患|不足|湿滑|积水|无路灯|照明|围挡|道路|路面|施工警示|标志|标线|视距|视线|弯道|坡道|坑槽|结冰/.test(s) || category === '道路环境与设施隐患') return '道路环境/设施隐患';
    if (/管理|照管|组织|站点|整改|平台|物业|施工单位|项目部|养护单位/.test(s) || category === '管理责任/组织责任') return '管理/组织过错';
    if (/爆胎|故障|货物|固定|装载|超载/.test(s) || category === '车辆状态/装载问题') return '车辆状态/装载问题';
    if (/违法|违规|未按规定|无证|无牌|闯|逆行|酒|醉|超速|超载|停车|让行|信号灯|越线|横穿/.test(s) || /违法/.test(subjectType)) return '违法行为';
    if (/不当|不足|未确认|未观察|未查明|未减速|未降低|速度偏快|急打|避让|处置|操作|盲区|分心/.test(s)) return '操作/观察/注意义务不足';
    return '过错行为';
  }

  function inferCategoryConfidence(category, behaviorText, subjectType, evidence) {
    const s = [behaviorText, evidence].filter(Boolean).join(' ');
    let score = categoryFromBehaviorText(behaviorText, '') === category ? 0.9 : 0.72;
    if ((category === '非机动车驾驶人违法/过错' && subjectType === '非机动车驾驶人') || (category === '行人违法/过错' && subjectType === '行人')) score = Math.max(score, 0.92);
    if (includesAny(s, faultBehaviorCategoryHints[category])) score = Math.max(score, 0.86);
    if (!category) return 0;
    return Math.min(0.96, score);
  }

  function isPrimaryLiabilityName(liability) {
    return /全部责任|主要责任|全责|主责|(?:[6-9]\d|100)%责任/.test(String(liability || ''));
  }

  function enrichFaultBehaviorEntity(entity, context) {
    if (!entity || !['violation', 'fault_behavior', 'fault_factor'].includes(entity.type)) return entity;
    const evidence = entity.evidence || '';
    const subjectPerson = entity.relatedPerson || (context && context.subjectPerson) || '';
    const personRole = subjectPerson && context && context.personRoles ? context.personRoles.get(subjectPerson) : '';
    let subjectType = entity.subjectType || inferSubjectTypeFromText(evidence, personRole);
    let category = categoryFromBehaviorText(entity.normalizedName || entity.name, evidence);

    if (entity.type === 'fault_factor') {
      category = category || (/团雾|暴雨|强降雨|横风|大风|冰雪|积雪|落石|塌方/.test((entity.normalizedName || '') + evidence) ? '不可控/外部诱因' : '道路环境与设施隐患');
      subjectType = '道路/环境';
    }

    if (subjectType === '非机动车驾驶人') category = '非机动车驾驶人违法/过错';
    else if (subjectType === '行人') category = '行人违法/过错';
    else if (!category && subjectType === '机动车驾驶人') category = /违法|违规|未按规定|无证|无牌|闯|逆行|酒|醉|超速|超载|信号灯|让行|越线/.test((entity.normalizedName || '') + evidence) ? '机动车驾驶人违规驾驶' : '机动车驾驶人操作不当';
    else if (!category) category = '机动车驾驶人操作不当';
    if (/^机动车驾驶人/.test(category) && (!subjectType || subjectType === '道路/环境')) subjectType = '机动车驾驶人';
    if (!subjectType) subjectType = /^机动车驾驶人/.test(category) ? '机动车驾驶人' : category === '非机动车驾驶人违法/过错' ? '非机动车驾驶人' : category === '行人违法/过错' ? '行人' : category === '车辆状态/装载问题' ? '车辆/装载' : category === '道路环境与设施隐患' || category === '不可控/外部诱因' ? '道路/环境' : category === '管理责任/组织责任' ? '管理/组织主体' : '未知';

    const liabilityRole = entity.liabilityRole || (subjectPerson && context && context.personLiability ? context.personLiability.get(subjectPerson) : '') || '';
    const isPrimaryCause = entity.isPrimaryCause === true || isPrimaryLiabilityName(liabilityRole) || /(主要原因|直接原因|主要过错|全部责任|主要责任|全责|主责)/.test(evidence) || undefined;
    entity.faultCategory = category;
    entity.subjectType = subjectType;
    entity.behaviorNature = inferBehaviorNature(entity.normalizedName || entity.name, category, subjectType, evidence);
    if (liabilityRole) entity.liabilityRole = liabilityRole;
    if (isPrimaryCause) entity.isPrimaryCause = true;
    entity.categoryConfidence = inferCategoryConfidence(category, entity.normalizedName || entity.name, subjectType, evidence);
    return entity;
  }


  // r28 X6（臆造零容忍）：事故形态否定检测。规范文本明确“未发生碰撞/未接触/避免了碰撞/未造成…事故”时，
  // 该事故形态词属被否定内容，不得抽为已发生事故（防止“未发生碰撞”臆造出“碰撞”实体）。
  function isNegatedAccident(sentenceText, term, index) {
    const text = String(sentenceText || '');
    if (index < 0) return false;
    // 分句起点（最近的句末/逗号标点之后），只在事故词所在分句内判定否定，避免跨句误伤。
    const seg = text.slice(0, index);
    const cs = seg.search(/[。！？；;，,、][^。！？；;，,、]*$/);
    const clauseStart = cs >= 0 ? cs + 1 : 0;
    const before = text.slice(clauseStart, index);
    const after = text.slice(index + term.length, index + term.length + 8);
    // 前置否定：未发生/未造成/没有发生/避免了/未与…发生(接触|碰撞|相撞)/未接触/幸未
    if (/(?:未发生|未造成|没有?发生|没能发生|未能发生|避免了?|幸未|所幸未|并未发生|未与[\u4e00-\u9fa5]{0,10}发生|未与[\u4e00-\u9fa5]{0,10}接触|未接触|未碰撞|未相撞|无接触|未造成任何)$/.test(before)) return true;
    // 后置否定：事故词后紧跟否定收尾（如“碰撞未发生/接触未发生”少见，但“…事故未发生/未造成后果”）
    if (/^(?:未发生|未造成|并未发生|均未发生)/.test(after)) return true;
    return false;
  }

  function isNegatedViolation(sentenceText, term, index, canonical) {
    const text = String(sentenceText || '');
    if (!term) return false;
    const start = Math.max(0, index - 18);
    const end = Math.min(text.length, index + term.length + 12);
    const window = text.slice(start, end);
    const alcohol = canonical === '酒后驾驶' || canonical === '醉酒驾驶' || /酒驾|醉驾|饮酒|酒后|醉酒|酒精/.test(term);
    // r32 N18（臆造零容忍·避让对象非违法主体）："因避让横穿道路的动物/横穿的行人"等——横穿/横过是被避让对象的动作，
    // 当事人是避让方，不应背此违法。若违法词紧前含"避让|躲避|躲|规避"，或横穿主体为非机动车/动物类客体 → 该违法不归当前主体。
    if (canonical === '违法横穿' && /(避让|躲避|规避|闪避|躲)[^。；;，,]{0,6}$/.test(text.slice(Math.max(0, index - 12), index))) return true;
    if (canonical === '违法横穿' && /^(?:道路|马路|公路)?的?(?:动物|狗|猫|家畜|牲畜|牛|羊|猪|野生动物)/.test(text.slice(index + term.length))) return true;
    if (alcohol) {
      const explicit = /(未发现饮酒驾驶情形|未检出酒精|排除酒驾|排除饮酒驾驶|无饮酒驾驶行为|未涉及酒后驾驶|未涉及饮酒驾驶|未存在酒后驾驶|未存在饮酒驾驶|酒精检测未发现饮酒驾驶)/;
      if (explicit.test(window) || explicit.test(text)) return true;
      if (/(未发现|未检出|排除|无|未涉及|未存在)[^。；;，,、]{0,12}(酒驾|醉驾|饮酒驾驶|酒后驾驶|醉酒驾驶|酒精)/.test(window)) return true;
    }
    // 测试阶段修（A·引述非认定）：违法词落在引号内的转述/网传/目击者原话中，且该句含引述动词
    // （目击者/告诉记者/网传/据称/自称/声称等）→ 属主观转述，非官方认定事实，不成立。
    // （分句后否定词常落在相邻句，单句拿不到，故引号内转述默认不作认定）。
    // 命中：r19-08「网传“肇事司机酒后驾驶”」、r19-32「目击者告诉记者“…肯定超速了…”」。
    {
      const qo = Math.max(text.lastIndexOf('“', index), text.lastIndexOf('"', index));
      if (qo >= 0) {
        const qcC = text.indexOf('”', index);
        const qcA = text.indexOf('"', index);
        // 开引号后若本句无闭引号（分句拆散引号对），视为转述内容延续到句末 → 仍算 inQuote。
        const openIsFull = text.lastIndexOf('“', index) >= text.lastIndexOf('"', index);
        const inQuote = qcC > index || qcA > index || openIsFull || qo >= 0;
        // 引述动词：只看引号之前的部分（避免引号内内容干扰）
        const beforeQuote = qo >= 0 ? text.slice(0, qo) : '';
        if (inQuote &&
            /(网传|据称|据传|目击者|自称|声称|据目击者|告诉记者|传言|网友|称：|表示：)/.test(beforeQuote)) {
          return true;
        }
      }
    }
    // v3.4.2 Bug4 修复：否定信号泛化到全违法类。词前局部窗口命中“未/无/排除/未发现/不存在”等否定前缀即判为否定。
    // 仅看词之前的小窗口（避免把后文另一分句的否定误编），且不跨标点。
    // v3.4.5+ K4：存疑/否定短语“无证据表明/没有证据/无法证实/不能认定/未能证实/尚无证据/排除…存在X行为”，词本身不紧邻否定后缀，需分句级检测。
    const clauseBefore = (() => {
      const seg = text.slice(0, index);
      const p = seg.search(/[。；;，,、][^。；;，,、]*$/);
      return p >= 0 ? seg.slice(p + 1) : seg;
    })();
    if (/(?:无证据表明|没有证据|未有证据|无证据显示|尚无证据|无法证实|未能证实|不能证明|无法认定|未能认定|不能认定|未发现.*存在|未发现.*行为)/.test(clauseBefore)) return true;
    // 测试阶段修（A 否定/存疑违法误抽·跨6轮统一根因）：
    // 扩展否定/存疑作用域到分句级，覆盖 (1)后置否定“…行为，故不予认定/未能证实” (2)存疑句首触发词跨并列违法词共享
    //   “未发现X有A、B行为”“无(任何)证据表明X存在A、B” (3)“并非A”“排除…A的可能”“疑似A但未证实”。
    // 关键：从违法词所在“认定分句”起点(通常是主体名或‘存在/有’)到该违法词之间，及紧随其后的收尾小句，检测否定/存疑标记。
    {
      // 认定分句：以最近的句末标点(。！？；;)为界，取违法词所在的整句（可跨逗号，因存疑句常用逗号并列违法词）。
      const sentStart = (() => { const seg = text.slice(0, index); const p = seg.search(/[。！？；;][^。！？；;]*$/); return p >= 0 ? p + 1 : 0; })();
      const sentEndRel = text.slice(index).search(/[。！？；;]/);
      const sentEnd = sentEndRel >= 0 ? index + sentEndRel : text.length;
      const sentence = text.slice(sentStart, sentEnd);
      const before = text.slice(sentStart, index);   // 违法词之前（同句，可跨逗号）
      const after = text.slice(index + term.length, sentEnd); // 违法词之后（同句）
      // 存疑/否定触发词族（句级）
      const SUSPECT = /(不足以证明|证据不足|不足以认定|无法证明|无法认定|无法证实|未能证实|未能认定|不能认定|不能证明|不予认定|尚不能认定|尚无证据|无证据表明|无任何证据|没有证据|未有证据|无证据显示|未证实|未获证实|不予采信|存疑|有待查证|无法查清|无法查证)/;
      // 明确否定触发词族（句级，跨从句共享）。注意：不用单字“无/未”裸词（会被括号插入语如“（无…资格）”误伤），
      // 只用多字明确否定短语；单字否定交给原有的 preWin 紧邻逻辑处理。
      const NEGATE = /(未发现|未查明|未查实|未检出|未检测出|排除|并非|未涉及|未存在|不存在|未认定|未予认定|未构成|不构成|无任何证据|无证据)/;
      // (a) 后置：违法词后紧跟“不予认定/未能证实/未获证实/系…所致/纯属…”等否决收尾
      // 测试阶段修：后置否决只看本分句（遇 但/然而/不过/故 转折即截断），避免跨逗号撞上后半句针对
      // 另一违法词的否定（r25-13“…闯红灯行为，但…不足以认定…超速”会误杀闯红灯）。“但…未…证实”专用分支保留全 after。
      const afterHead = after.split(/(?:但|然而?|不过|故)/)[0];
      if (/^(?:[^。！？；;]{0,20})(?:不予认定|未能证实|未获证实|未予认定|证据不足|无法认定|无法证实|不能认定)/.test(afterHead)) return true;
      if (/^(?:[^。！？；;]{0,20})(?:但.{0,8}(?:未|无|没).{0,6}证实|但.{0,8}(?:未能|无法)(?:证实|认定))/.test(after)) return true;
      // (b) “疑似/涉嫌/网传/据称A…但(监控/警方)未…证实/未获证实”
      if (/(疑似|涉嫌|网传|据称|据传|据目击者称|目击者称|自称|声称)/.test(before) && /(未.{0,6}证实|未获证实|未能证实|无法证实|未得到.{0,6}证实|未予证实|尚未证实|不属实|系谣言)/.test(sentence)) return true;
      // (c) “并非A”“非A”“A不成立”
      if (/(?:并非|系非|实非)$/.test(before) || /^(?:行为)?(?:不成立|不属实)/.test(after)) return true;
      // (d) 存疑/否定触发词在同句违法词之前，且中间不越过“但/然/而(经)?查(明|实)|确(实|系)(存在|有)”这类肯定转折（避免误伤 r18-23“并未超速，但确实闯红灯”）。
      const CONFIRM_TURN = /(但|然而?|不过|可(是|经查)|经(查明|认定|调查认定)|查明|确(实|系)(存在|有)|存在.{0,4}的?违法|(事故)?原因.{0,8}(是|系|为)|(初步)?(分析|认定|判断|认为|查实).{0,6}(?:系|为)|因其?.{0,4}(存在|实施|实有))/;
      const scanNeg = (chunk) => {
        if (!chunk) return false;
        const m = SUSPECT.exec(chunk) || NEGATE.exec(chunk);
        if (!m) return false;
        const tail = chunk.slice(m.index + m[0].length);
        // 触发词到违法词之间若出现肯定转折，则不在否定作用域。
        if (CONFIRM_TURN.test(tail)) return false;
        // 括号插入语隔断：否定词与违法词之间若含括号闭合（）|)），说明否定词属括号内插入语，不作数。
        if (/[）)]/.test(tail)) return false;
        // 新动作起点隔断：否定词后若出现“某驾驶|人驾驶|行至|沿…行驶”等新事实描述起点（主体+驾驶），
        // 说明违法词已跨入新事实分句，不受否定。注意不能误匹配“酒后驾驶”内部的“驾驶”，
        // 故要求驾驶前为主体字(某/人/员/机/车)或路名行驶结构。
        if (/(?:某|人|员|机|车|司)驾驶|行至|行驶至|沿.{0,10}(路|道|高速|大道|街).{0,6}行驶|在.{0,10}(路|道|高速|大道|街|口).{0,6}(行驶|行至)/.test(tail)) return false;
        return true;
      };
      // (d1) “未发现/无证据表明 X 有 A、B 行为”：否定词在句首，A/B 并列共享。before 命中否定且无转折。
      if (scanNeg(before)) {
        // 排除主体本身已被肯定确认的场景：before 末尾出现“确实存在/确有”紧邻违法词
        if (!/(确实存在|确有|确系|的确存在)$/.test(before)) return true;
      }
      // (e) “排除…A的可能”：违法词后接“的可能/可能性”，且句中有“排除”。
      if (/^的?可能(性)?/.test(after) && /排除/.test(sentence)) return true;
      // (f) 测试阶段修（跨句否定 r27-06）：设问式“(关于)…是否 A，…排除该情形/不予认定/未予认定/未认定”
      //   → A 本身是被设问对象，句内后置排除/否决 → 不成立。
      if (/是否$/.test(before) && /(排除该情形|排除该可能|排除|不予认定|未予认定|未认定|未能认定|并不存在|并未发生)/.test(after)) return true;
      // (g) 测试阶段修（跨句否定 r27-32）：“涉嫌/被举报 A…但…并未超过限速/未达到/不予认定/不成立”
      //   接报/涉嫌为非权威描述，句内后置权威否决 → 不成立。
      if (/(涉嫌|被举报|被投诉|有人反映|疑似)/.test(before) &&
          /(并?未超过限速|未达到限速|未达到.{0,4}标准|不予认定|不成立|不属实|系谣言|未予认定|未能认定|未获证实|经核实不|辟谣)/.test(sentence)) return true;
    }
    const preWin = text.slice(Math.max(0, index - 10), index);
    if (/[。；;，,、]/.test(preWin)) {
      const seg = preWin.slice(preWin.search(/[。；;，,、][^。；;，,、]*$/) + 1);
      if (/(?:未发现|未检出|排除|未涉及|未存在|不存在|无|未)$/.test(seg)) return true;
      return false;
    }
    return /(?:未发现|未检出|排除|未涉及|未存在|不存在|无违法|无违章|未)$/.test(preWin);
  }

  function personTokenRegex() {
    // v3.4.7 P0 C3-NEWBUG-01: 支持单字母匿名主体 X/Y。为避免车牌/SUV 误命中，单字母后面不能接[A-Z0-9·‧・]，并且需在主体相关上下文里（前面非字母/汉字长串）。
    return '(?:(?<![A-Z0-9·‧・])[A-Z](?![A-Z0-9·‧・])(?=[\\s、和与及。，,]|负|承担|相撞|驾驶|骑|均|同等|同责|全责|主责|次责|无责|未|因|$)|[A-Z]某|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸])';
  }

  function normalizeRole(role) {
    const r = String(role || '').replace(/^(?:相关)?人员包括/, '').trim();
    const map = [
      [/驾驶人|驾驶员|司机|快递员|货车驾驶人|客车驾驶人|公交驾驶人|出租车驾驶人|摩托车驾驶人|校车驾驶人|皮卡驾驶人|骑行人/, m => /骑行人/.test(m) ? '骑行人' : /快递员/.test(m) ? '快递员' : '驾驶人'],
      [/乘客|乘坐人|公交乘客|站立乘客/, () => '乘客'],
      [/行人|学生|儿童|未成年人/, m => /学生/.test(m) ? '学生' : /儿童|未成年人/.test(m) ? '儿童' : '行人'],
      [/押运员|押车员/, () => '押运员'],
      [/施工人员|看护员|安全员|校车照管员|照管员|保安员|保洁员|调度员|装卸工|导游|证人/, m => m]
    ];
    for (const [re, fn] of map) { const m = r.match(re); if (m) return fn(m[0]); }
    return r || undefined;
  }

  function addRelation(relations, seen, relation) {
    if (!relation || !relation.source || !relation.target || !relation.type) return;
    if (relation.type === 'person_commits_violation' && /^(?:unknown|未知)$/i.test(String(relation.source).trim())) return;
    const key = [relation.type, relation.source, relation.target, relation.sentenceIndex, relation.ruleId].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    relations.push({ confidence: 0.75, evidence: '', sentenceIndex: -1, ruleId: 'relation-rule', ...relation });
  }

  // r32 L12（臆造零容忍）："系某物流公司""该某"等——"系/该/其/属/为/于/等/被/由/在"是动词/虚词非姓氏，
  // 若"X某"的X落在此黑名单，且非真实"X某某"复姓名，则不作为人名候选，杜绝臆造错主体。
  // 非姓氏字尾判定："超载系某""该某""其某"等——姓氏核心其实是动词/虚词，非真人名。用尾部"X某"的X是否黑名单字判定。
  const NON_SURNAME_TAIL = /(?:系|该|其|属|被|因|另|均|据|即|则|将|已|是|或|了|载|致|反|含|再|又|且|亦|在|从|往|朝|把|对|给|让|使|此|皆|凡|各|区|县|镇|乡|造成|引发|导致|还致)某$/;
  const NON_SURNAME_HEADS_LIST = ['造', '成', '引', '发', '导', '致', '还', '把', '将', '使', '对', '向', '与', '和', '及', '因'];
  function isSpuriousPerson(name) {
    const n = String(name || '');
    // 真"X某某"复名(如"欧阳某某")不误杀；仅对末位"X某"结构做黑名单尾判。
    if (/某某$/.test(n)) {
      // v3.4.7 P1-3: "造成孙某某"三字名，首字为动词/虚词则拒。
      if (n.length >= 3 && NON_SURNAME_HEADS_LIST.indexOf(n.charAt(0)) >= 0) return true;
      return false;
    }
    return NON_SURNAME_TAIL.test(n);
  }
  function firstPersonInText(text, opts) {
    // v3.4.7 P1-3: 支持真名（opts.realNames 传入已知真名列表），避免开往任意 2-3 字抽取。
    const realNames = (opts && Array.isArray(opts.realNames)) ? opts.realNames : null;
    if (realNames && realNames.length) {
      const src = String(text || '');
      let earliest = null;
      for (const nm of realNames) {
        const idx = src.indexOf(nm);
        if (idx >= 0 && (earliest === null || idx < earliest.idx)) earliest = { idx, name: nm };
      }
      if (earliest) return earliest.name;
    }
    const re = /(?:驾驶人|驾驶员|司机|骑行人|行人|乘客|乘坐人|押运员|押车员|快递员|学生|儿童|装卸工|调度员|保安员|照管员|看护员|导游|证人)?\s*([A-Z]某|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸])/g;
    let m;
    while ((m = re.exec(String(text || '')))) {
      if (!isSpuriousPerson(m[1])) return m[1];
      // v3.4.7 P1-3: 当前三字名包含动词前缀（造成孙某某），尝试滑一字重新匹配后缀
      const raw = m[1];
      if (raw.length >= 3) {
        const tail = raw.slice(1);
        if (/某/.test(tail) && !isSpuriousPerson(tail)) return tail;
        const tail2 = raw.slice(2);
        if (/某/.test(tail2) && !isSpuriousPerson(tail2)) return tail2;
      }
    }
    return '';
  }

  function allPersonsInText(text) {
    return [...new Set([...String(text || '').matchAll(/(?:驾驶人|驾驶员|司机|骑行人|行人|乘客|乘坐人|押运员|押车员|快递员|学生|儿童|装卸工|调度员|保安员|照管员|看护员|导游|证人)?\s*([A-Z]某|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸])/g)].map(m => m[1]).filter(n => !isSpuriousPerson(n)))];
  }

  function vehicleTokensInText(text) {
    const re = new RegExp('([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9*×X]{3,6}|无牌[^，。；、 ]{0,8}车|无号牌[^，。；、 ]{0,8}车|(?:' + VEHICLE_BASE_ALT + '))', 'g');
    return [...new Set([...String(text || '').matchAll(re)].map(m => m[1]))];
  }

  function isValidVehicleTarget(value) {
    const text = normalizeEntity('vehicle_instance', value || '');
    if (!text) return false;
    if (/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9*×X]{3,6}$/.test(text)) return true;
    if (/^(?:无牌|无号牌).{0,8}车$/.test(text)) return true;
    if (new RegExp('(' + VEHICLE_BASE_ALT + ')$').test(text)) return true;
    if (/^(?:鲁A车|苏E车|皖K车|浙C车|鲁B车|鲁D车|[甲乙丙丁戊己庚辛壬癸]车)$/.test(text)) return true;
    return false;
  }

  function addTimeEntity(out, seen, sentence, match, name, precision, confidence) {
    addEntity(out, seen, { type: 'time', name, timePrecision: precision, confidence, sentenceIndex: sentence.index, start: sentence.start + match.index, end: sentence.start + match.index + match[0].length, evidence: sentence.text, extractor: 'time-flex-regex' });
  }


  function extractEntities(text) {
    const clean = preprocess(text);
    const sentences = splitSentences(clean);
    const entities = [];
    const seen = new Set();
    const scan = (sentence, regex, type, extractor) => {
      let m;
      while ((m = regex.exec(sentence.text))) {
        const name = m[1] || m[0];
        addEntity(entities, seen, { type, name, sentenceIndex: sentence.index, start: sentence.start + m.index, end: sentence.start + m.index + m[0].length, evidence: sentence.text, extractor });
      }
    };
    sentences.forEach(sentence => {
      // v3.4.7 Bug1: 标准事故报告里的"真实姓名"识别通道。
      // 仅锚定标准模板里的三个明确位置抽真名（当事人X驾驶 / X负…责任 / X无责任），2-3 字纯汉字、
      // 不含"某/甲乙丙丁"、不属常见非人名词汇。放行标志：isRealName=true。
      const NAME_BLOCK = /^(?:交警|车辆|事故|轿车|货车|客车|某某|双方|两方|各方|其他|其余|所有|全部|部分|无关|不明|不详|安全|车距|全车|全车距|全路|全人|自己|自行车|电动车|骑车|小车|大车)$/;
      // v3.4.7 fix：真名首字必须是常见百家姓，避免从"保持安全车距负事故全部责任"里错抽"全车距"。
      const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁丘骆狄丘官盖内段内官都阴李闫刘胡丁邓霍宿万丰上官司马欧阳夏侯诸葛令狐塾孙长孙宇文司徒司空钭鲍王欧尹云雷骆向易共发苞图俶廪陆彭惠蒋萎邢蒯芹钻宕宝封牛方新钟唐易柯甄赫连';
      const collectRealName = (raw) => {
        const nm = String(raw || '').trim();
        if (!nm) return null;
        if (nm.length < 2 || nm.length > 3) return null;
        if (/某|甲|乙|丙|丁|戊|己|庚|辛|壬|癸|\d|[A-Za-z]/.test(nm)) return null;
        if (!/^[\u4e00-\u9fa5]+$/.test(nm)) return null;
        if (NAME_BLOCK.test(nm)) return null;
        if (SURNAMES.indexOf(nm.charAt(0)) < 0) return null;
        return nm;
      };
      const realNameAnchors = [
        /(?:当事人|驾驶人|驾驶员|司机)\s*([\u4e00-\u9fa5]{2,3})\s*(?:驾驶|驾|开着?|骑|骑行)/g,
        /([\u4e00-\u9fa5]{2,3})\s*(?:负|承担)\s*(?:本次|本起)?(?:事故)?(?:的)?\s*(?:全部责任|主要责任|次要责任|同等责任|全责|主责|次责|同责)/g,
        /([\u4e00-\u9fa5]{2,3})\s*无责任/g,
        /与\s*([\u4e00-\u9fa5]{2,3})\s*驾驶的/g,
        // v3.4.7 P0-2: 三方事故多角色——行人/乘客/副驾驶/乘坐人/骑行人 X（真名）
        /(?:行人|乘客|副驾驶(?:乘客|人员|座)?|乘坐人|后座乘客|骑行人)\s*([\u4e00-\u9fa5]{2,3})(?=(?:受伤|重伤|轻伤|轻微伤|死亡|被|跟|与|和|在|乘|撞|倒|跌|蒦|坠|、|，|。|；|$))/g,
        // v3.4.7 P0-2: 并列责任句 “A 负…，B 负…，C 负…” 中的中间与尾部主体（重提行人名）
        /[，,、]\s*([\u4e00-\u9fa5]{2,3})\s*负(?:本次|本起)?(?:事故)?(?:的)?\s*(?:百分之|\d+%|[０-９])/g,
        // v3.4.7 P0-2: 将行人/乘客 X 撞倒——行人/乘客受害者作为真名人员抽取
        /将\s*(?:行人|乘客|骑行人|非机动车驾驶人|背面行人)([\u4e00-\u9fa5]{2,3})(?=撞倒|撞|碾压|剔|撞飞|撞伤|撞行|吹飞)/g
      ];
      realNameAnchors.forEach(re => {
        let rn;
        while ((rn = re.exec(sentence.text))) {
          const nm = collectRealName(rn[1]);
          if (!nm) continue;
          addEntity(entities, seen, {
            type: 'person', name: nm, isRealName: true,
            sentenceIndex: sentence.index,
            start: sentence.start + rn.index,
            end: sentence.start + rn.index + rn[0].length,
            evidence: sentence.text,
            extractor: 'person-real-name-anchor-regex',
            confidence: 0.85
          });
        }
      });
      // 人员角色：驾驶人甲、乘客甲等以 role 区分，legacy 仍按 normalizedName 去重。
      let rm;
      const rolePersonRegex = /(驾驶人|驾驶员|司机|骑行人|行人|乘客|乘坐人|公交乘客|押运员|押车员|快递员|学生|儿童|未成年人|装卸工|调度员|保安员|保洁员|照管员|校车照管员|看护员|安全员|导游|证人)\s*([A-Z]某|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸])/g;
      while ((rm = rolePersonRegex.exec(sentence.text))) addEntity(entities, seen, { type: 'person', name: rm[2], role: normalizeRole(rm[1]), rawName: rm[0], sentenceIndex: sentence.index, start: sentence.start + rm.index, end: sentence.start + rm.index + rm[0].length, evidence: sentence.text, extractor: 'person-role-regex' });
      scan(sentence, /(20\d{2}年\d{1,2}月\d{1,2}日(?:\d{1,2}时\d{0,2}分?)?)/g, 'time', 'time-regex');
      let tm;
      const timeRegexes = [
        { re: /((?:凌晨|上午|中午|下午|傍晚|晚上|夜间)?\d{1,2}:\d{2}(?::\d{2})?)/g, precision: 'clock', confidence: 0.88 },
        { re: /((?:次日|翌日|当日|当天|凌晨|上午|中午|下午|傍晚|晚上|夜间|早高峰|晚高峰)?\d{1,2}时\d{1,2}分(?:\d{1,2}秒)?(?:左右|许)?)/g, precision: 'clock-cn', confidence: 0.88 },
        { re: /((?:凌晨|上午|中午|下午|傍晚|晚上|夜间|早高峰|晚高峰)?\d{1,2}点(?:\d{1,2}分)?(?:左右|许)?)/g, precision: 'clock-cn', confidence: 0.86 },
        { re: /((?:今天|当日|当天|事发当天|事故当天)?(?:凌晨|上午|中午|下午|傍晚|晚上|夜间|早高峰|晚高峰)(?:\d{1,2}点(?:\d{1,2}分)?(?:左右|许)?)?)/g, precision: 'period', confidence: 0.72 },
        { re: /((?:昨晚|昨夜|昨日晚间|接警后|到场后|事发时|事发前\d+秒|约\d+分钟后))/g, precision: 'relative', confidence: 0.62 }
      ];
      timeRegexes.forEach(({ re, precision, confidence }) => { while ((tm = re.exec(sentence.text))) addTimeEntity(entities, seen, sentence, tm, tm[1], precision, confidence); });
      scan(sentence, /([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9*×X]{5,6})/g, 'vehicle', 'plate-regex');
      // 测试阶段修（F·特种号牌）：军警/使馆/领事/临时/教练学字牌。
      // 警牌 警A1234 / 警A·1234；使馆 使022123；领事 领A1234；临时 临AB12345 / 鲁A1234临；教练 鲁A1234学。
      scan(sentence, /(警[A-Z]·?[A-Z0-9]{4,5}|使\d{6}|领[A-Z]?\d{5,6}|[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z]\d{4,5}[学临警]|临[A-Z]{1,2}\d{4,5})/g, 'vehicle', 'plate-special-regex');
      scan(sentence, /(?:驾驶人|驾驶员|司机|原告|被告|行人|乘客|伤者|死者)?([\u4e00-\u9fa5]{1,3}某某?)(?=(?:在|于)?(?:饮酒后|酒后|醒酒后|醉酒|醉酒后|疲劳)?驾驶|乘坐|骑行|步行|受伤|死亡|负|诉|与|(?:血液)?酒精(?:含量|浓度)|血液中酒精|的(?:车|小?客车|轿车|货车|面包车|摩托车|电动车|电动自行车|自行车|三轮车|大巴|客车|SUV|皮卡|校车))/g, 'person', 'person-context-regex');
      scan(sentence, /(?:前方|后方|对向|同向|旁边)([\u4e00-\u9fa5]{1,3}某某?)(?=的)/g, 'person', 'person-context-de-regex');
      scan(sentence, /(?:与|和|及)([\u4e00-\u9fa5]{1,3}某某?)(?=驾驶|乘坐|骑行|步行|受伤|死亡|负|诉|相撞|发生)/g, 'person', 'person-context-regex');
      // r32 N03："(经)?认定X因…负事故全部责任"——责任认定句的当事人 X 在"认定"后、"因/负/承担"前，补抽为 person，供责任回填绑定。
      scan(sentence, /(?:经?认定|认定为|据此认定|综合认定)\s*([\u4e00-\u9fa5]{1,3}某某?)(?=因|负|承担|应负|系|存在|驾驶)/g, 'person', 'person-liability-context-regex');
      scan(sentence, /(?:驾驶人|驾驶员|司机|骑行人|行人|未成年人|乘客|乘坐人|员工|公交乘客)?([A-Z]某|(?<![A-Z0-9·‧・])[A-Z](?![A-Z0-9·‧・])|[甲乙丙丁戊己庚辛壬癸])(?=驾驶|骑|携|推|下车|搭载|乘坐|步行|受伤|死亡|全责|主责|次责|无责|同责|负|承担|未|也|按|右转|抢|连续|低速|酒后|分心|逆行|违反|违法|超载|疲劳|绕|遇|车|、|，|。|和|与|$)/g, 'person', 'person-code-context-regex');
      scan(sentence, /([A-Z]{0,3}\d{1,4}国道|[A-Z]{0,3}\d{1,4}省道|(?<![京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼A-Z·•・])[GS][A-Z]{0,3}\d{1,4}(?!\d)|(?<![A-Za-z0-9·•・京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼])K\d+(?:\+\d+(?:米|[mM])?)?(?![A-Za-z\d]))/g, 'road', 'road-code-regex');
      // v3.4.7 Bug5: 标准报告模板“氟□□市□□区□□路由□向□行驶”——抽 市/区/方向。
      scan(sentence, /(?:在|于|沿|位于|行驶在|行至)?([\u4e00-\u9fa5]{2,6}?市)(?=[\u4e00-\u9fa5]{1,10}区|[\u4e00-\u9fa5]{1,10}县|[\u4e00-\u9fa5]{1,10}新区|[\u4e00-\u9fa5]{1,20}(?:路|街|大道|公路|高速|国道|省道|快速路|区中))/g, 'city', 'city-template-regex');
      scan(sentence, /(?:[\u4e00-\u9fa5]{2,8}市)?([\u4e00-\u9fa5]{2,8}(?:区|县|新区|开发区|高新区))(?=[\u4e00-\u9fa5]{1,20}(?:路|街|大道|公路|高速|国道|省道|快速路))/g, 'district', 'district-template-regex');
      // 方向：“由东向西行驶”/“由南向北行驶”——只取方向本体，去掉“行驶”尾巴。
      scan(sentence, /(由[\u4e1c\u5357\u897f\u5317]{1,2}向[\u4e1c\u5357\u897f\u5317]{1,2}|[\u4e1c\u5357\u897f\u5317]{1,2}向[\u4e1c\u5357\u897f\u5317]{1,2}|自[\u4e1c\u5357\u897f\u5317]{1,2}至[\u4e1c\u5357\u897f\u5317]{1,2})(?=行驶|方向)/g, 'direction', 'direction-template-regex');
      if (!isSuggestionSentence(sentence.text)) {
        scan(sentence, /(?:在|于|行驶至|驶至|沿|位于|事故地点为|地点为)([\u4e00-\u9fa5A-Za-z0-9+]{2,50}(?:交叉口|高速公路|高速|国道|省道|县道|乡道|村道|快速路|辅路|主路|支路|公路|大道|路口|街|桥|隧道|匝道|路|通道|人行横道|公交港湾站|公交站台|停车场出口|环岛东出口|环岛|桥头|东头|西头|弯道|坡道|路侧树木|公交港湾站北侧|公交站台北侧|公交港湾站南侧|公交站台南侧|停靠点|改造点|右转口|中心区域|急弯上坡路段)(?:[\u4e00-\u9fa5A-Za-z0-9+]{0,12})?)(?=发生|行驶|处|旁|东|西|南|北|，|。)/g, 'road', 'road-location-priority-regex');
        scan(sentence, /([\u4e00-\u9fa5A-Za-z0-9]{2,24}(?:夜市东门|仓库门前|物流仓\d*号门前|商场地库|厂区\d*号门内|成品库转角处|学校门口|小区坡道|地下车库出口坡道|窄巷|小区门前|服务区入口|南门|西门|门前|地库B\d|B\d区|巷口|湿地公园南门外|公交站附近|施工段))(?:[，。；;、 ]|$)/g, 'traffic_place', 'traffic-place-regex');
        if (!/^(标题|报告编号|文书风格)/.test(sentence.text)) scan(sentence, /([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)与[\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:(?:快速路|辅路|主路|支路|路|街|大道|公路|国道|省道)(?:交叉口|路口)|(?:巷|桥)(?:路口|交叉口))|[A-Z]{0,3}\d{1,4}国道|[A-Z]{0,3}\d{1,4}省道|(?<![A-Z鲁苏京津沪渝冀豫云辽黑湘皖新浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼·•・])[XYZ]\d{1,4}(?:县道|乡道)?(?!\d)|(?<![\u4eac\u6d25\u6caa\u6e1d\u5180\u8c6b\u4e91\u8fbd\u9ed1\u6e58\u7696\u9c81\u65b0\u82cf\u6d59\u8d63\u9102\u6842\u7518\u664b\u8499\u9655\u5409\u95fd\u8d35\u7ca4\u9752\u85cf\u5ddd\u5b81\u743cA-Z\u00b7\u2022\u30fb])[GS][A-Z]{0,3}\d{1,4}|[\u4e00-\u9fa5A-Za-z0-9]{1,24}(?:交叉口|高速公路|高速|国道|省道|县道|乡道|村道|快速路|辅路|主路|支路|公路|大道|路口|街|桥|隧道|匝道|路|通道|人行横道|公交港湾站|公交站台|停车场出口|环岛东出口|环岛|桥头|东头|西头|弯道|坡道|路侧树木)|(?<![A-Za-z0-9·•・京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼])K\d+(?:\+\d+(?:米|[mM])?)?(?![A-Za-z\d]))/g, 'road', 'road-regex');
      }
      scan(sentence, /(\d+人死亡|造成\d+人死亡|死亡\d*人?|\d+死\d+伤|\d+人受伤|\d+人不同程度受伤|轻微伤(?!标准)\d*人?|\d+人轻微伤|轻伤(?!标准)\d*人?|\d+人轻伤|重伤(?!标准)\d*人?|\d+人重伤|\d+名?乘客受伤|(?<![未无没人一])(?<!人员)受伤\d*人?|人身损害)/g, 'injury', 'injury-regex');
      // v3.4.7 Bug5: 标准模板“造成两车受损、无受伤（伤情：/）”，先补抽 casualty_status = “无受伤”。
      scan(sentence, /(无受伤|无人受伤|无伤情|未受伤|伤情：?\s*[\/无无无])/g, 'casualty_status', 'casualty-none-template-regex');
      // r28 X7（臆造零容忍）：明确“无伤亡/无人受伤/均未受伤”等，抽为独立的“无伤亡结论”实体(casualty_status)，
      // 不进 injury 列表(避免图谱误读为有伤亡记录)，同时用于消除 missing-injury 缺口(原文已明确后果)。
      // 统一两种历史写法：“无人员伤亡”与“均未受伤/双方均未受伤/人员均无受伤/无人受伤/无人伤”。
      scan(sentence, /(无人员伤亡|无人员受伤|无人员伤害|无人伤亡|无人受伤|无人伤|无伤亡|无一人受伤|无任何人员(?:受伤|伤亡)|未造成人员伤亡|未造成人员伤害|未造成人员受伤|未有人员(?:受伤|伤亡)|均未受伤|双方均未受伤|人员均无受伤|人员均未受伤|均无人员伤亡)/g, 'casualty_status', 'casualty-none-regex');
      let im;
      const injuryRegex = /(?<!后)((?:[A-Z]某|[甲乙丙丁戊己庚辛壬癸]|[\u4e00-\u9fa5]{1,3}某某?|驾驶人|骑行人|行人|儿童|学生|老人|伤者|死者|乘客|乘坐人|押车员|押运员|快递员|公交驾驶人|货车驾驶人|客车驾驶人|出租车驾驶人|校车驾驶人|皮卡驾驶人)(?:、(?:[A-Z]某|[甲乙丙丁戊己庚辛壬癸]|[\u4e00-\u9fa5]{1,3}某某?))*[\u4e00-\u9fa5]{0,12}(?:撞伤|碰伤|压伤|刮伤|撞飞|撞成重伤|撞成轻伤|挫伤|擦伤|骨裂|受惊|脑震荡|骨折|脱臼|脱位|扭伤挫伤|扭伤|划伤|裂伤|不适|轻微伤|轻伤|重伤|受伤|死亡))/g;
      const injWordRe = /(撞伤|碰伤|压伤|刮伤|撞飞|撞成重伤|撞成轻伤|挫伤|擦伤|骨裂|受惊|脑震荡|骨折|脱臼|脱位|扭伤挫伤|扭伤|划伤|裂伤|不适|轻微伤|轻伤|重伤|受伤|死亡)/;
      const personHeadRe = /^(?:[A-Z]某|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸]|驾驶人|骑行人|行人|儿童|学生|老人|伤者|死者|乘客|乘坐人|押车员|押运员|快递员|公交驾驶人|货车驾驶人|客车驾驶人|出租车驾驶人|校车驾驶人|皮卡驾驶人)/;
      while ((im = injuryRegex.exec(sentence.text))) {
        if (/躲避不及|摔倒|撞上/.test(im[1])) continue;
        // 测试阶段修（injury精度）：否定伤情不抽——“未受伤/无伤/未受到伤害/安然无恙/未遭受/无碍”等（避免把“未受伤”反向抽成受伤关系）。
        if (/未受伤|无伤|未受到伤|未受伤害|未受任何伤|安然无恙|未遭受|无碍|未受任何伤害/.test(im[1])) continue;
        // r32 N24（臆造零容忍）："伤情未达到重伤标准/不构成重伤"等被否定的伤情等级不抽（真伤情"仅构成轻伤"由裸 injury-regex 单独捕获）。
        if (/未达到|尚未达到|未构成|尚不构成|尚未构成|不构成|未达/.test(im[1])) continue;
        // 剥非姓名前缀：①胁事句“X驾车将Y撞成重伤”取受害者Y；②“的/后/前/随/又/正/被/成/致/导致”前缀。
        let injName = im[1]
          .replace(/^.*?(?:驾车将|驾驶将|将|把)(?=[\u4e00-\u9fa5]*?(?:[A-Z]某|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸]))/, '')
          .replace(/^(?:.*的|后|前|随后?|又|正|被|成|致|导致)/, '')
          // 剥“其中/中/另有/另/其/其余/均/都/共/包括/至于…”+可选“N名乘客”等非姓名前缀（“其中冯某某重伤”→冯某某重伤、“另有1名乘客卫某某仅轻微伤”→卫某某轻微伤）
          .replace(/^(?:其中|中|另有|另|其余|其|均|都|共|包括|至于)(?:\d+名?)?(?:乘客|乘坐人|驾驶人|人员)?/, '')
          .replace(/^仅/, '');
        // “X车乘客/驾驶人Y”或“N名乘客Y”→取真人名Y（如“甲车乘客韩某某”→韩某某）
        const roleName = injName.match(/(?:[A-Z]某|[甲乙丙丁]|\d+名?)?车?(?:乘车人|车人|乘客|驾驶人|乘坐人)([\u4e00-\u9fa5]{1,3}某某?|[A-Z]某)/);
        if (roleName) injName = injName.slice(injName.indexOf(roleName[1]));
        // 剔除人名与伤情词之间的副词/虚词（如“卫某某仅轻微伤”→卫某某轻微伤、“王某当场死亡”保留）
        injName = injName.replace(/^((?:[A-Z]某|[一-龥]{1,2}某某?|[甲乙丙丁戊己庚辛壬癸]))(?:仅|只|共|约|均|都|已|也|则|据称|经诊断|经诊|当場)+(?=[一-龥]{0,6}(?:撞伤|碰伤|压伤|刮伤|撞飞|挫伤|擦伤|骨裂|受惊|脑震荡|骨折|脱臼|脱位|扭伤|划伤|裂伤|不适|轻微伤|轻伤|重伤|受伤|死亡))/, '$1');
        // 回退用 firstPersonInText 提取干净主体重构（v3.4.7 P1-3：优先命中已抽取的真名，避免“造成孙某某”串字东存入）
        const knownRealNames = entities.filter(e => e.type === 'person' && e.isRealName).map(e => e.normalizedName || e.name).filter(Boolean);
        const cleanPerson = firstPersonInText(injName, { realNames: knownRealNames })
          || firstPersonInText(im[1], { realNames: knownRealNames })
          || firstPersonInText(injName)
          || firstPersonInText(im[1]);
        if (!personHeadRe.test(injName)) {
          if (!cleanPerson) continue;
          const inj = injName.match(injWordRe);
          injName = cleanPerson + (inj ? injName.slice(injName.indexOf(inj[0])) : '受伤');
        }
        // 多人共句（“范某某及丁某某颈部受伤”、“秦某某、尤某某二人受伤”）→拆成多人各一条，每人都绑同一伤情词
        {
          const injWordM = injName.match(injWordRe);
          const injWord = injWordM ? injWordM[0] : '';
          const headSeg = injWord ? injName.slice(0, injName.indexOf(injWord)) + injWord : injName;
          const multi = [...headSeg.matchAll(/([A-Z]某|(?:欧阳|上官|司马|诸葛|夏侯|皇甫|尉迟|公孙|慕容|长孙|宇文)?[一-龥]某某?|[甲乙丙丁戊己庚辛壬癸])(?=[、及和与]|二人|三人|等|$|[一-龥]{0,6}(?:撞伤|碰伤|挫伤|擦伤|骨折|受伤|重伤|轻伤|轻微伤|死亡))/g)].map(m => m[1]);
          if (injWord && multi.length >= 2 && /[、及和与]|二人|三人/.test(headSeg)) {
            multi.forEach(pname => {
              addEntity(entities, seen, { type: 'injury', name: pname + injWord, relatedPerson: pname, sentenceIndex: sentence.index, start: sentence.start + im.index, end: sentence.start + im.index + im[0].length, evidence: sentence.text, extractor: 'injury-person-detail-regex' });
            });
            continue;
          }
        }
        addEntity(entities, seen, { type: 'injury', name: injName, relatedPerson: cleanPerson, sentenceIndex: sentence.index, start: sentence.start + im.index, end: sentence.start + im.index + im[0].length, evidence: sentence.text, extractor: 'injury-person-detail-regex' });
      }
      let pm;
      const propertyRegexes = [
        /((?:初步)?(?:核损|定损|报价|预估)?(?:金额|费用|损失)?[\u4e00-\u9fa5A-Za-z0-9、，及和两三四五\-]*?(?:约)?\d+(?:\.\d+)?(?:万)?元)/g,
        /((?:[\u4e00-\u9fa5A-Za-z0-9、，及和两三四五\-]+)?(?:维修费|维修费用|修车费用|更换费|换门费用|护栏更换费用|材料费|工时费|拖车费|施救费|路产损失|停运损失|医疗费|误工护理|费用|损失|货损|车损|定损|核损|报价)(?:[^。；;，,]{0,18})?(?:\d+(?:\.\d+)?(?:万)?元|待定|待补|未最终定损|另行审核|另行函询))/g,
        /((?:[\u4e00-\u9fa5A-Za-z0-9、，及和两三四五\-]+)?(?:受损|破损|变形|凹陷|脱落|折断|断裂|裂开|翘起|松动|破裂|擦痕|划痕|损坏|剥落|摔坏|损毁|破损)(?:[\u4e00-\u9fa5A-Za-z0-9、，及和两三四五\-]{0,26})?)/g,
        /((?:路产损失|财产损失|损失)(?:含|包括)[^。；;]{2,40})/g,
        /((?:轮胎|前杠|后杠|保险杠|前保险杠|后保险杠|灯组|雾灯罩|大灯|尾灯|门板|车门|后视镜|水箱|机盖|护栏|前篮|脚踏板|前叉|轮毂|柱面|行道树|路缘石|眼镜|菜篮)[\u4e00-\u9fa5A-Za-z0-9、，及和两三四五\-]{0,20}(?:受损|破损|变形|凹陷|脱落|折断|断裂|裂开|翘起|松动|破裂|擦痕|划痕|损坏|剥落|摔坏|损毁))/g
      ];
      propertyRegexes.forEach(re => { while ((pm = re.exec(sentence.text))) addEntity(entities, seen, { type: 'property_loss', name: pm[1], sentenceIndex: sentence.index, start: sentence.start + pm.index, end: sentence.start + pm.index + pm[0].length, evidence: sentence.text, extractor: 'property-loss-flex-regex' }); });
      // v3.4.7 Bug5: 碰撞部位——标准报告模板“其车X部与Y驾驶的…号…车Z部相撞”。
      // 支持 前/后/左/右/左前/右前/左后/右后/侧/左侧/右侧 等常见组合，组后尾“部”。
      const POSTOK = '(?:左前|右前|左后|右后|左侧|右侧|前侧|后侧|前|后|左|右|侧)';
      scan(sentence, new RegExp('其车(' + POSTOK + '部)', 'g'), 'collision_position', 'collision-position-a-regex');
      scan(sentence, new RegExp('(?:号小型轿车|号小客车|号轿车|号客车|号货车|号小车|号摩托车|号电动车|号电动自行车|号三轮车|号面包车|号大巴|号皮卡|号SUV|普通二轮摩托车|二轮摩托车|三轮摩托车|电动自行车|二轮电动车|三轮电动车|自行车|面包车|皮卡车|小型客车|小型面包车|小型小车|重型卡车|中型卡车|小型卡车|手抨车|電動三轮车|商务车)(' + POSTOK + '部)(?:追尾|碰撞|剔撞|撞撞|)?相撞', 'g'), 'collision_position', 'collision-position-b-regex');
      // 兼容先前写法：侧部/左侧部/右侧部。
      scan(sentence, /(?:其车|号小型轿车|号轿车)((?:左侧|右侧|前侧|后侧)部)/g, 'collision_position', 'collision-position-side-regex');
      accidentTypes.forEach(term => { const idx = sentence.text.indexOf(term); const isSpecificType = term.length > 2 && term !== '开门碰撞'; if (idx >= 0 && !isNegatedAccident(sentence.text, term, idx) && (isSpecificType || !/(碰撞部位|碰撞痕迹|碰撞点|碰撞形态检验|车辆轨迹、碰撞形态|碰撞部位模板)/.test(sentence.text))) addEntity(entities, seen, { type: 'accident_type', name: term, mainType: /追尾/.test(term) ? '追尾' : /刮|侧碰|擦碰/.test(term) ? '刮擦/侧碰' : /侧翻/.test(term) ? '侧翻' : /坠/.test(term) ? '坠落' : '碰撞', subType: term, sentenceIndex: sentence.index, start: sentence.start + idx, end: sentence.start + idx + term.length, evidence: sentence.text, extractor: 'accident-type-dictionary' }); });
      const semanticAccidents = [
        [/外卖车|骑行人乙|右转半径偏大|压入非机动车过街区域/, '右转盲区碰撞'],
        [/急刹后追撞|突然刹车被追尾|急刹追尾|追撞/, '急刹追尾'],
        [/二次擦碰|二次受损|第一次接触|连环刮碰/, '连环刮碰'],
        [/掉头|压越单黄实线|车把擦碰网约车/, '掉头碰撞'],
        [/自行车就过来了|共享自行车|撞到她/, '自行车碰倒行人'],
        [/救护车|避让紧急车辆|避让特种车辆/, '救护车避让引发碰撞'],
        [/会车|刮倒|挂到路边晾衣架|晾衣架倒下碰到行人/, '会车刮倒'],
        [/(?:爆胎|轮胎爆裂|爆裂)[^。；;]{0,40}(?:被(?:后方|后车)[^。；;]{0,12}(?:追尾|碰撞|撞)|二次(?:碰撞|事故)|随后被[^。；;]{0,12}追尾)|二次碰撞事故/, '爆胎二次事故']
      ];
      semanticAccidents.forEach(([re, name]) => { if (re.test(sentence.text) && !/(碰撞部位|碰撞痕迹|碰撞点|碰撞形态检验|碰撞部位模板)/.test(sentence.text) && !/(未发生(?:碰撞|相撞|接触|事故)|未与[\u4e00-\u9fa5]{0,10}(?:发生)?(?:碰撞|相撞|接触)|未接触|避免了?(?:碰撞|相撞|事故)|幸未(?:碰撞|相撞|发生))/.test(sentence.text)) addEntity(entities, seen, { type: 'accident_type', name, mainType: /追尾/.test(name) ? '追尾' : /刮|擦/.test(name) ? '刮擦/侧碰' : /爆胎|单方/.test(name) ? '单方/二次事故' : '碰撞', subType: name, sentenceIndex: sentence.index, start: sentence.start, end: sentence.start + Math.min(sentence.text.length, name.length), evidence: sentence.text, extractor: 'accident-type-semantic-regex' }); });
      let lm;
      const CPX = '(?:欧阳|上官|司马|诸葛|夏侯|皇甫|尉迟|公孙|慕容|端木|独孤|长孙|宇文|司徒|令狐|濮阳|东方|赫连|轩辕|毌丘|万俟)';
      // v3.4.7 Bug3: RNAME 为真实姓名分支——首字必须是常见百家姓（2-3 汉字、不含“某/甲乙丙丁…”），
      // 后接“负/承担/无责任/驾驶/骑/因/与/和/、/，/。/；”作为右边界。
      // 避免把 “货车/校车/驾驶员/安全车距/全车距”等描述性主体误归真名。
      const SURNAME_ALT = '[赵钱孙李周吴郑王冯陈胐卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廗岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁丘官盖内段叶阎雷刘胡丁邓霍宿万丰上万风夏侯诸葛令狐塾孙宇文钭王欧尹雷骆向易共发苞图俶廪陆彭惠蒋葳邢蒯芹钻宕宝封牛新钟唐易柯甄]';
      const RNAME = SURNAME_ALT + '(?![某甲乙丙丁戊己庚辛壬癸])[一-龥]{1,2}(?=(?:负|承担|无责任|驾驶|骑|因|与|和|及|、|，|。|；|;|$))';
      // v3.4.7 P0 C3-NEWBUG-01: PTOK 支持单字母匿名 X/Y（防车牌/SUV 污染：单字母前后不接[A-Z0-9·‧・]）。
      const PTOK = '(?:[甲乙丙丁戊己庚辛壬癸]|[A-Z]某|(?<![A-Z0-9·‧・])[A-Z](?![A-Z0-9·‧・])|' + CPX + '某某?|' + CPX + '[一-龥]某某?|[一-龥]某某?|' + RNAME + ')';
      const liabilityRegex = new RegExp('((?:驾驶人|驾驶员|骑行人|行人|乘客|快递员|货车|客车|轿车|槽罐车|公交|皮卡|摩托车|三轮车|出租车)?\\s*' + PTOK + '(?:[、和与及]' + PTOK + ')*|乙和A某|三名乘员|临停车|小客车|校车方|施工单位|项目部|园区|物业|养护单位|道路管理)\\s*(?:对[\u4e00-\u9fa5]{1,8})?(?:均|皆|各自?|分别|一律|都|共同?)?\\s*(?:(?:负|承担)\\s*(?:本次|本起)?(?:事故)?(?:的)?\\s*)?(同等责任|主要责任|次要责任|全部责任|全责|主责|次责|无责任|同责|无责|轻微责任|管理责任|整改责任|诱发过错|有责任|管理过错)', 'g');
      while ((lm = liabilityRegex.exec(sentence.text))) {
        // v3.4.4 Bug8: “A与/和/及/、B 负X责任”并列主体，逐个拆出责任人，不能只留最后一个。
        // 测试阶段修（D·整句污染）：主体含“X驾驶+车”/前缀“事故中”等时，先剔到真人名。
        let subj = lm[1];
        const drivePollute = new RegExp('(?:[\\u4e00-\\u9fa5]{0,4})?(' + PTOK + ')驾驶(?:[\\u4e00-\\u9fa5]{0,6}(?:车|大巴|客车|货车|轿车|面包车|摩托车|电动车|三轮车))?');
        const dp = drivePollute.exec(subj);
        if (dp && dp[1]) subj = dp[1];
        let namesInSubj = (subj.match(new RegExp('[A-Z]某|[A-Z](?![A-Z0-9·‧・])|' + CPX + '某某?|' + CPX + '[\\u4e00-\\u9fa5]某某?|[\\u4e00-\\u9fa5]某某?|[甲乙丙丁戊己庚辛壬癸]', 'g')) || [subj.trim()]);
        // v3.4.7 P2 A2-NEWBUG-01: 真名并列同等责——PTOK 拿不到"林建国/陈志强"，若拆得<2条且 subj 含并列符，退回按并列符 split 再兜真名，剔常见前缀停用词。
        if (namesInSubj.length < 2 && /[、和与及]/.test(subj)) {
          const parts = subj.split(/[、和与及]/).map(s => s.trim()).filter(Boolean);
          const stopSubjPrefix = /^(?:当事人|驾驶人|驾驶员|司机|当事方|肇事者|肇事方|行人|乘客|快递员|其中|事故中|本起|本次)/;
          const collected = [];
          parts.forEach(p => {
            const cleaned = p.replace(stopSubjPrefix, '');
            const anon = cleaned.match(new RegExp('[A-Z]某|' + CPX + '某某?|' + CPX + '[\\u4e00-\\u9fa5]某某?|[\\u4e00-\\u9fa5]某某?|[甲乙丙丁戊己庚辛壬癸]'));
            if (anon) { collected.push(anon[0]); return; }
            const real = cleaned.match(/([\u4e00-\u9fa5]{2,4})$/);
            if (real && !/^(?:事故|方|事人|驾驶员|驾驶人|行人|乘客|其中|本次|本起|已方|方向|一则|均|双方|该方|一方|该车|该人)$/.test(real[1])) collected.push(real[1]);
          });
          if (collected.length >= 2) namesInSubj = collected;
        }
        namesInSubj.forEach(nm => addEntity(entities, seen, { type: 'liability', name: lm[2], relatedPerson: nm, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-person-regex' }));
      }
      // r37 F04: “X某(某)?[行为短语，]负/承担(事故)?X责任”——主体与责任词被一个逗号短从句隔开，主 liabilityRegex(主体紧接)不命中，
      // 退化成 dictionary 的 ?→责任。限：人名在分句首(前面是句首/逗号/分号)，行为短语不跨句。
      const clauseLiabRegex = new RegExp('(?:^|[，。；;、])\\s*(?:但|经查明|查明|最终查明|经调取监控|据查|经查|现|然而|其中)?\\s*(?:当事人|驾驶人|驾驶员|司机|当事方|肇事者|肇事方)?\\s*(' + PTOK + ')(?:因|系|存在|[^，。；;]{0,4})?[^，。；;]{0,26}?[，]?\\s*(?:则|因而|据此|依法|应|而)?(?:负|承担)(?:本次|本起)?(?:事故)?(?:的)?(主要责任|次要责任|全部责任|同等责任|间接责任|主责|次责|全责|同责)', 'g');
      while ((lm = clauseLiabRegex.exec(sentence.text))) {
        const nm = lm[1];
        if (!entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === nm && x.normalizedName === lm[2])) addEntity(entities, seen, { type: 'liability', name: lm[2], relatedPerson: nm, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-clause-subject-regex' });
      }
      // r37 F04: 人名间接责任——“X某[长行为短语]，(对事故)?负有间接责任”。人名在分句首，行为短语可长，但不跨句号/分号；
      // 非公司主体(公司走 orgLiab)。防误绑受害方：仅取分句首个人名。
      const personIndirectRegex = new RegExp('(?:^|[，。；;、])\\s*(?:经?认定[，]?)?(' + PTOK + ')[^。；;]{0,40}?(?:对事故|对本起事故|对本次事故)?(?:负有|承担)间接责任', 'g');
      while ((lm = personIndirectRegex.exec(sentence.text))) {
        const nm = lm[1];
        if (!entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === nm && x.normalizedName === '间接责任')) addEntity(entities, seen, { type: 'liability', name: '间接责任', relatedPerson: nm, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-person-indirect-regex' });
      }
      // r39/r40 A类：描述性责任主体(非具名)+分句——“骑电动车的一方闯红灯，负全部责任”“施工单位负主要责任”——
      // 真实报道/快报常用指代性主体，且主责主体常在逗号从句前，旧 vehicleLiabilityRegex 间隙不跨逗号不命中退化?→责任。
      // 主体词归一化为“X车/X车驾驶员/X方/施工单位”等；不进 person(不匹配 X某 不会回填)。
      const DESC_SUBJ = '(?:\u9a91(?:\u7535\u52a8\u8f66|\u81ea\u884c\u8f66|\u4e09\u8f66|\u6469\u6258\u8f66|\u8f66)(?:\u7684)?(?:\u4e00\u65b9|\u4eba\u5458|\u4eba|\u7537\u5b50|\u5973\u5b50|\u8001\u4eba|\u5e02\u6c11)?|[\u4e00-\u9fa5]{1,8}(?:\u8f66|\u516c\u4ea4|\u5927\u5df4|\u5ba2\u8f66|\u8d27\u8f66|\u8f7f\u8f66|\u9762\u5305\u8f66|\u6e23\u571f\u8f66|\u7f50\u8f66|\u81ea\u884c\u8f66|\u7535\u52a8\u8f66|\u7535\u52a8\u81ea\u884c\u8f66|\u51fa\u79df\u8f66|\u7f51\u7ea6\u8f66|\u4e09\u8f6e\u8f66)(?:\u9a7e\u9a76\u5458|\u9a7e\u9a76\u4eba|\u53f8\u673a|\u4e00\u65b9|\u4e58\u8f66\u4eba)?|\u65bd\u5de5\u5355\u4f4d|\u9879\u76ee\u90e8|\u517b\u62a4\u5355\u4f4d|\u9053\u8def\u7ba1\u7406(?:\u90e8\u95e8|\u5355\u4f4d)?|\u884c\u4eba|\u9a91\u884c\u4eba|\u9a91\u8f66(?:\u5e02\u6c11|\u4eba)?)';
      const descClauseRegex = new RegExp('(?:^|[\uff0c\u3002\uff1b;\u3001])\\s*(?:\u7ecf?\u8ba4\u5b9a[\uff0c]?|\u4e8b\u6545\u4e2d)?(' + DESC_SUBJ + ')(?:[^\uff0c\u3002\uff1b;]{0,20}?[\uff0c])?\\s*(?:\u5219|\u56e0\u800c|\u636e\u6b64|\u4f9d\u6cd5|\u5e94)?(?:\u8d1f|\u627f\u62c5)(?:\u672c\u6b21|\u672c\u8d77)?(?:\u4e8b\u6545)?(?:\u7684)?(\u4e3b\u8981\u8d23\u4efb|\u6b21\u8981\u8d23\u4efb|\u5168\u90e8\u8d23\u4efb|\u540c\u7b49\u8d23\u4efb|\u95f4\u63a5\u8d23\u4efb|\u7ba1\u7406\u8d23\u4efb|\u65e0\u8d23\u4efb)', 'g');
      while ((lm = descClauseRegex.exec(sentence.text))) {
        let subj = lm[1].trim();
        // 剥除认定叙述前缀（“交警认定/经交警认定/经调查/经查/认定/事故中”等）
        subj = subj.replace(/^(?:经?交警认定|经?认定|经调查|经查|交警认定|据通报|据此认定|事故中|其中)/, '');
        // 若描述主体内含具名 X某，优先交给具名抽取器(避免重复/抢绑)，本器只管纯描述性主体。
        if (/[A-Z]某|[\u4e00-\u9fa5]某某?/.test(subj)) continue;
        if (!subj) continue;
        // 去重：若旧 vehicleLiabilityRegex 已为同句同责任类别绑了一个“短描述”主体(如“货车”)，而本次是更完整描述(如“货车驾驶员”)，则替换旧的。
        const dupIdx = entities.findIndex(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.normalizedName === lm[2] && x.relatedPerson && x.relatedPerson !== subj && (subj.indexOf(x.relatedPerson) >= 0 || x.relatedPerson.indexOf(subj) >= 0) && /^(?:liability-subject-regex|liability-dictionary)$/.test(x.extractor || ''));
        if (dupIdx >= 0) { if ((entities[dupIdx].relatedPerson || '').length < subj.length) entities[dupIdx].relatedPerson = subj; continue; }
        if (!entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === subj && x.normalizedName === lm[2])) addEntity(entities, seen, { type: 'liability', name: lm[2], relatedPerson: subj, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-desc-clause-regex' });
      }
      // X4: 阿拉伯数字比例。主体 + (承担|负) + 可选"本次/本起/事故" + N% + 可选"的责任"。
      const ratioRegex = /([甲乙丙丁戊己庚辛壬癸]|[A-Z]某|[一-龥]某某?)\s*(?:承担|负)\s*(?:本次|本起)?(?:事故)?\s*(\d{1,3})%(?:的?责任)?/g;
      while ((lm = ratioRegex.exec(sentence.text))) addEntity(entities, seen, { type: 'liability', name: lm[2] + '%责任', relatedPerson: lm[1], ratio: Number(lm[2]), sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-ratio-regex' });
      // X4b: 中文数字比例"百分之六十"。转阿拉伯后入库。
      const cnNum = { '零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100 };
      const cnToNum = (str) => {
        if (/^百$/.test(str)) return 100;
        let m = str.match(/^([一二三四五六七八九])?十([一二三四五六七八九])?$/);
        if (m) return (m[1] ? cnNum[m[1]] : 1) * 10 + (m[2] ? cnNum[m[2]] : 0);
        m = str.match(/^一百$/); if (m) return 100;
        if (str.length === 1 && cnNum[str] != null) return cnNum[str];
        return null;
      };
      const ratioCnRegex = /([甲乙丙丁戊己庚辛壬癸]|[A-Z]某|[一-龥]{2,3}某某?|[一-龥]{2,3})\s*(?:承担|负)\s*(?:本次|本起)?(?:事故)?(?:的)?\s*百分之([零一二三四五六七八九十百]{1,4})(?:的?责任)?/g;
      while ((lm = ratioCnRegex.exec(sentence.text))) { const v = cnToNum(lm[2]); if (v != null && v >= 0 && v <= 100) addEntity(entities, seen, { type: 'liability', name: v + '%责任', relatedPerson: lm[1], ratio: v, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-ratio-cn-regex' }); }
      // 测试阶段修（E·公司/单位主体责任）：公司/厂/部/院等单位作责任主体（含连带/比例/等级）。
      // 命中 r20-2/26/27/34：“顺达物流公司负连带责任”“某公路养护公司承担次要责任”。
      // 测试阶段修（E·连带责任倒装主体）：“X对Y(的赔偿)承担/负连带责任”→主体是 X(非 Y)。
      const jointLiabRegex = /((?:[甲乙丙丁戊己庚辛壬癸]|[A-Z]某|[一-龥]某某?))对(?:[甲乙丙丁戊己庚辛壬癸]|[A-Z]某|[一-龥]某某?)(?:[^，。；;]{0,10})?(?:承担|负)连带赋?偿?责任/g;
      while ((lm = jointLiabRegex.exec(sentence.text))) addEntity(entities, seen, { type: 'liability', name: '连带责任', relatedPerson: lm[1], sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-joint-regex' });
      // r32 L04/L05/L15 连带责任增强：覆盖(1)并列主体"X与/和/、Y…承担连带责任"(2)倒装"连带(赔偿)责任由X、Y(共同)承担"(3)单主体"X因…承担连带责任"(无"对Y")。
      {
        const PT = '(?:[甲乙丙丁戊己庚辛壬癸]|[A-Z]某|[一-龥]某某?)';
        // (2) 倒装：连带(赔偿)责任由 X、Y (共同)承担
        const invJoint = new RegExp('连带(?:赔偿)?责任由\\s*((?:' + PT + ')(?:[、和及与](?:' + PT + '))*)(?:[^。；;]{0,6})?(?:共同)?(?:承担|负担|负)', 'g');
        let jm;
        while ((jm = invJoint.exec(sentence.text))) {
          (jm[1].match(new RegExp(PT, 'g')) || []).forEach(nm => { if (!entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === nm && x.normalizedName === '连带责任')) addEntity(entities, seen, { type: 'liability', name: '连带责任', relatedPerson: nm, sentenceIndex: sentence.index, start: sentence.start + jm.index, end: sentence.start + jm.index + jm[0].length, evidence: sentence.text, extractor: 'liability-joint-inverted-regex' }); });
        }
        // (1)+(3) 正装：[并列主体](对Z)?(因…)?(承担|负)连带(赔偿)责任
        const fwdJoint = new RegExp('((?:' + PT + ')(?:[、和及与](?:' + PT + '))*)(?:对' + PT + ')?(?:[^，。；;]{0,16})?(?:承担|负)连带(?:赔偿)?责任', 'g');
        // r40 B类：机构名中的匿名"某"(如"潍坊某运输…"中的"坊某")不得当人名——若 nm 紧跟机构后缀词则跳过(公司已由 orgLiab 捕获)。
        const ORG_SUFFIX_AHEAD = /^(?:运输|物流|公司|建材|工程|客运|建设|汽修|修理|车队|项目|施工|养护|拖运|园区|医院|学校|厢|厂)/;
        while ((jm = fwdJoint.exec(sentence.text))) {
          (jm[1].match(new RegExp(PT, 'g')) || []).forEach(nm => {
            const nmIdx = sentence.text.indexOf(nm);
            const after = nmIdx >= 0 ? sentence.text.slice(nmIdx + nm.length) : '';
            if (ORG_SUFFIX_AHEAD.test(after)) return; // 机构匿名符，非人名
            if (!entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === nm && x.normalizedName === '连带责任')) addEntity(entities, seen, { type: 'liability', name: '连带责任', relatedPerson: nm, sentenceIndex: sentence.index, start: sentence.start + jm.index, end: sentence.start + jm.index + jm[0].length, evidence: sentence.text, extractor: 'liability-joint-fwd-regex' });
          });
        }
      }
      const orgLiabRegex = /([一-龥]{2,16}(?:公司|厂|车队|项目部|施工方|施工单位|养护单位|养护公司|物业|物业公司|园区|医院|学校|市政处|管理处|交通部门|运输公司|拖运公司|建设公司))(?:[^。；;]{0,24}?)?(?:负|承担|对事故负有|负有)?(连带(?:赔偿)?责任|主要责任|次要责任|全部责任|同等责任|管理责任|间接责任|\d{1,3}%的?责任)/g;
      while ((lm = orgLiabRegex.exec(sentence.text))) {
        const nm = lm[2];
        let org = lm[1].replace(/^(?:经?认定|据此认定|综合认定|认定为|认定|其所属的|其所属|所属的|所属|其所在的|其所在|所在的|所在|承修的|承修|承组的|承组|其|该|本|又|则|并|及|与|和|由于|因|另|经)/, '');
        // 去除叙述性前缀污染：若 org 内含“系/所致/指派/调度/超载/该车/登记于/受雇”等叙述词，取最后一段真单位名(从最后一个连接词后起)。
        org = org.replace(/^.*(?:系|所致|指派|调度|超载|该车|登记于|受雇|驾驶|行驶|负责)/, '');
        // 剥除“X某(某)?所属的/所在的/名下的”人名+领属前缀，仅留单位名
        org = org.replace(/^[\u4e00-\u9fa5]{0,3}某某?(?:所属的|所属|所在的|所在|名下的|名下)/, '');
        // 再剥一次残留的“某”字头（如“某汽车修理厂”“某中学校车队”中的匿名“某”保留，不剥）
        org = org.replace(/^(?:其|该|本|另|经|且|并)/, '');
        let canonical;
        const pct = nm.match(/(\d{1,3})%/);
        if (pct) canonical = pct[1] + '%责任';
        else if (/连带/.test(nm)) canonical = '连带责任';
        else if (/全部/.test(nm)) canonical = '全部责任';
        else if (/主要/.test(nm)) canonical = '主要责任';
        else if (/次要/.test(nm)) canonical = '次要责任';
        else if (/同等/.test(nm)) canonical = '同等责任';
        else if (/间接/.test(nm)) canonical = '间接责任';
        else canonical = '管理责任';
        addEntity(entities, seen, { type: 'liability', name: canonical, relatedPerson: org, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-org-regex' });
      }
      // 测试阶段修（B·倒装责任）：“(全部/主要/次要/同等)责任(应)?由…X承担/负担/负”——主体在句尾，原 liabilityRegex(主体在前)无法命中，
      // 造成 relatedPerson 丢失退化为 ?→责任。支持并列多倒装句(r20-23双倒装)。主体前可带定语(驾驶人/行人/酒后驾车的…)，取末尾真人名。
      // r25 收敛：“主要责任应由违法掉头的杨某负担”——“应”在“由”前、结尾“负担/负”、主体前长定语(既醉酒驾驶又超速行驶的/驾驶重型货车违法超车的)。
      const invLiabRegex = new RegExp('(全部责任|主要责任|次要责任|同等责任|全责|主责|次责|相应责任)(?:应当?|应)?由(?:[^。；;]{0,26}?)(' + PTOK + ')(?:一方)?(?:承担|负担|负)', 'g');
      while ((lm = invLiabRegex.exec(sentence.text))) {
        const canonical = /全部责任|全责/.test(lm[1]) ? '全部责任' : /主要|主责/.test(lm[1]) ? '主要责任' : /次要|次责/.test(lm[1]) ? '次要责任' : /同等/.test(lm[1]) ? '同等责任' : lm[1];
        addEntity(entities, seen, { type: 'liability', name: canonical, relatedPerson: lm[2], sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-inverted-regex' });
      }
      // r20 收敛：“(应)?由[定语]X承担(本次/本起)?(事故的)?Y责任”——主体在“由”后、“承担”前，责任词在“承担”之后(与 invLiabRegex 责任词在“由”前相反)。
      const invLiab3Regex = new RegExp('(?:应当?|应)?由(?:[^。；;]{0,20}?)(' + PTOK + ')(?:一方)?承担(?:本次|本起)?(?:事故)?(?:的)?(全部责任|主要责任|次要责任|同等责任)', 'g');
      while ((lm = invLiab3Regex.exec(sentence.text))) {
        addEntity(entities, seen, { type: 'liability', name: lm[2], relatedPerson: lm[1], sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-inverted3-regex' });
      }
      // X5(1): 倒装"(主要/次要/全部/同等)责任为/是 X" —— 主体在责任词之后，用"为|是"连接。
      const invLiab2Regex = new RegExp('(全部责任|主要责任|次要责任|同等责任|全责|主责|次责|相应责任)(?:为|是)\\s*(' + PTOK + ')', 'g');
      while ((lm = invLiab2Regex.exec(sentence.text))) {
        const canonical = /全部责任|全责/.test(lm[1]) ? '全部责任' : /主要|主责/.test(lm[1]) ? '主要责任' : /次要|次责/.test(lm[1]) ? '次要责任' : /同等/.test(lm[1]) ? '同等责任' : lm[1];
        addEntity(entities, seen, { type: 'liability', name: canonical, relatedPerson: lm[2], sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-inverted2-regex' });
      }
      // X5(2): "二人/双方/两人 均负(事故) X责任" —— 主体是集合代词，回填到本句所有已抽 person（同等/共同责任场景）。
      {
        const collM = sentence.text.match(/(?:二人|两人|双方|两方|各方|三人)\s*(?:对(?:本次|本起)?事故)?\s*(?:均|各自?|分别|都|皆)?\s*(?:负|承担)\s*(?:本次|本起)?(?:事故)?(?:的)?\s*(全部责任|主要责任|次要责任|同等责任|全责|主责|次责|同责|同等)/)
          // r32 L22："双方…均有过错，各自承担同等责任"——集合代词与"承担"被从句隔开，补"(双方/两人…均有过错.*)?各自/分别 承担/负 X责任"独立触发。
          || sentence.text.match(/(?:双方|两方|各方|二人|两人|三人)[^。；;]{0,20}?(?:各自?|分别|均|都|皆)\s*(?:负|承担)\s*(?:本次|本起)?(?:事故)?(?:的)?\s*(全部责任|主要责任|次要责任|同等责任|相应责任|全责|主责|次责|同责|同等)/);
        if (collM) {
          const canonical = /全部|全责/.test(collM[1]) ? '全部责任' : /主要|主责/.test(collM[1]) ? '主要责任' : /次要|次责/.test(collM[1]) ? '次要责任' : /相应/.test(collM[1]) ? '相应责任' : '同等责任';
          // 集合代词(二人/双方)常跨句指代前文当事人，回退到全文已抽 person（非仅本句）。
          let ps = [...new Set(entities.filter(e => e.type === 'person' && e.sentenceIndex === sentence.index).map(e => e.normalizedName))];
          if (ps.length < 2) ps = [...new Set(entities.filter(e => e.type === 'person').map(e => e.normalizedName))];
          ps.forEach(pn => addEntity(entities, seen, { type: 'liability', name: canonical, relatedPerson: pn, sentenceIndex: sentence.index, start: sentence.start + (collM.index || 0), end: sentence.start + (collM.index || 0) + collM[0].length, evidence: sentence.text, extractor: 'liability-collective-regex' }));
        }
      }
      // r29 L10 倒装并列：“(同等/全部/主要…)责任由 X、Y(、Z) (共同)?承担/负担”——多主体在句尾，逐个绑定。
      {
        const invParaRe = new RegExp('(全部责任|主要责任|次要责任|同等责任)(?:分别|应当?|应|均)?由\\s*(?:[^。；;]{0,14}?)((?:' + PTOK + ')(?:[^。；;]{0,14}?[、和及与](?:[^。；;]{0,10}?)(?:' + PTOK + '))+)(?:[^。；;]{0,10})?(?:共同)?(?:承担|负担|负)', 'g');
        let ipm;
        while ((ipm = invParaRe.exec(sentence.text))) {
          const names = ipm[2].match(new RegExp(PTOK, 'g')) || [];
          names.forEach(nm => addEntity(entities, seen, { type: 'liability', name: ipm[1], relatedPerson: nm, sentenceIndex: sentence.index, start: sentence.start + ipm.index, end: sentence.start + ipm.index + ipm[0].length, evidence: sentence.text, extractor: 'liability-inverted-parallel-regex' }));
        }
      }
      // r37 F12 代词“其”回指：“…推定其负(事故)?X责任”——“其”指代本句/前句最近已抽人名主体。
      {
        const pronM = sentence.text.match(/(?:推定|认定|判定)?其(?:[^。；;]{0,4})?(?:负|承担)(?:本次|本起)?(?:事故)?(?:的)?(全部责任|主要责任|次要责任|同等责任)/);
        if (pronM) {
          // 其 = 本句首个已抽人名；本句无则取全文最后一个人名。
          let cand = entities.filter(e => e.type === 'person' && e.sentenceIndex === sentence.index).map(e => e.normalizedName);
          if (!cand.length) cand = entities.filter(e => e.type === 'person').map(e => e.normalizedName);
          const who = cand.length ? cand[0] : null;
          if (who && !entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === who && x.normalizedName === pronM[1])) {
            addEntity(entities, seen, { type: 'liability', name: pronM[1], relatedPerson: who, sentenceIndex: sentence.index, start: sentence.start + (pronM.index || 0), end: sentence.start + (pronM.index || 0) + pronM[0].length, evidence: sentence.text, extractor: 'liability-pronoun-regex' });
          }
        }
      }
      const compactNoRespRegex = /([甲乙丙丁戊己庚辛壬癸]{2,})无责/g;
      while ((lm = compactNoRespRegex.exec(sentence.text))) lm[1].split('').forEach(ch => addEntity(entities, seen, { type: 'liability', name: '无责', relatedPerson: ch, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-compact-noresp-regex' }));
      // r32 L24/L25："X不负/不承担(事故)责任""X不负事故责任"→ 无责任（"事故"可插入"不负…责任"之间）。
      {
        const noRespRe = new RegExp('(' + PTOK + ')(?:[^。；;，,]{0,4})?(?:不负|不承担|无)(?:本次|本起)?(?:事故)?责任', 'g');
        let nrm;
        while ((nrm = noRespRe.exec(sentence.text))) {
          if (entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === nrm[1])) continue;
          addEntity(entities, seen, { type: 'liability', name: '无责任', relatedPerson: nrm[1], sentenceIndex: sentence.index, start: sentence.start + nrm.index, end: sentence.start + nrm.index + nrm[0].length, evidence: sentence.text, extractor: 'liability-noresp-regex' });
        }
        // r19 L10：“X正常行驶/正常通行/依法行驶，(则)?无责任”——无害行为短从句 + 裸“无责任”，主体在分句首。
        {
          const noRespClauseRe = new RegExp('(?:^|[，。；;、])\\s*(' + PTOK + ')(?:正常行驶|正常通行|正常驾驶|依法行驶|无违法行为|无过错|不存在过错)[^。；;]{0,8}?[，]\\s*(?:则|因而|据此|依法|故)?(?:不负|无)(?:本次|本起)?(?:事故)?责任', 'g');
          let ncm;
          while ((ncm = noRespClauseRe.exec(sentence.text))) {
            if (entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === ncm[1])) continue;
            addEntity(entities, seen, { type: 'liability', name: '无责任', relatedPerson: ncm[1], sentenceIndex: sentence.index, start: sentence.start + ncm.index, end: sentence.start + ncm.index + ncm[0].length, evidence: sentence.text, extractor: 'liability-noresp-clause-regex' });
          }
        }
        // r32 L17/L19："X、Y(、Z)均无(事故)责任"并列无责方——逐个绑无责任。
        const multiNoRespRe = new RegExp('((?:' + PTOK + ')(?:[、和及与](?:' + PTOK + '))+)\\s*(?:均|都|皆|各自?|一律)?\\s*无(?:本次|本起)?(?:事故)?责任', 'g');
        let mnr;
        while ((mnr = multiNoRespRe.exec(sentence.text))) {
          const names = mnr[1].match(new RegExp(PTOK, 'g')) || [];
          names.forEach(nm => { if (!entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.relatedPerson === nm)) addEntity(entities, seen, { type: 'liability', name: '无责任', relatedPerson: nm, sentenceIndex: sentence.index, start: sentence.start + mnr.index, end: sentence.start + mnr.index + mnr[0].length, evidence: sentence.text, extractor: 'liability-multi-noresp-regex' }); });
        }
      }
      for (const [canonical, aliases] of Object.entries(violationAliases)) [canonical, ...aliases].forEach(term => { const idx = sentence.text.indexOf(term); if (idx >= 0 && !isNegatedViolation(sentence.text, term, idx, canonical)) addEntity(entities, seen, { type: 'violation', name: canonical, sentenceIndex: sentence.index, start: sentence.start + idx, end: sentence.start + idx + term.length, evidence: sentence.text, extractor: 'violation-dictionary' }); });
      // v3.4.7 Bug6: 标准报告模板“当事人 X 驾驶…因 Y（违法行为）”——
      // 将 violation 强绑主体为句头“当事人/驾驶人/司机”后的真名/匹名，避免被 “部与某某”、“事人某某某” 等串位干扰。
      // 策略：只处理 evidence 含“当事人/驾驶人/司机”锤头句式，将本句已存 violation 的 relatedPerson 重写为句头主体。
      {
        const subjMatch = sentence.text.match(/(?:当事人|驾驶人|驾驶员|司机|胇事人|胇事司机)([\u4e00-\u9fa5]{2,4})(?=驾驶|骑|推|携|乘坐)/);
        const subj = subjMatch ? subjMatch[1] : '';
        if (subj) {
          entities.forEach(e => {
            if (e.type === 'violation' && e.sentenceIndex === sentence.index && (e.extractor === 'violation-dictionary' || !e.extractor)) {
              e.relatedPerson = subj;
            }
          });
        }
      }
      const vehicleLiabilityRegex = /((?:[\u4e00-\u9fa5A-Za-z0-9]{1,12}(?:车|公交|大巴|客车|货车|轿车|面包车|渣土车|罐车|槽罐车|自行车|电动车|电动自行车|出租车|网约车)|骑行人|行人|驾驶人|司机|临停车|故障车|校车方|施工单位|项目部|园区|物业|养护单位|道路管理))(?:(?:对[^，。；;]{0,10})|(?:[^，。；;]{0,8}))?(负主要责任|承担主要责任|负全部责任|承担全部责任|负次要责任|承担次要责任|负同等责任|承担同等责任|负相应次责|承担相应次要责任|无明显过错|无明显违法|无责|全责|主责|次责|同责|有责任|管理责任|整改责任|主要过错|诱发过错)/g;
      while ((lm = vehicleLiabilityRegex.exec(sentence.text))) {
        const target = lm[1].trim().replace(/^(?:事故中|本次事故中|本次|本起|经查明|经查|经认定|查明|如|其中|号|又|则)/, '');
        const name = lm[2];
        if (!/(责任|责|过错|违法)/.test(name)) continue;
        // 纯角色词（司机/驾驶人/驾驶员）且其后紧跟真人名时（“胇事司机顾某某”）不当责任主体（人名已由 person 抽取绑定）。
        if (/^(?:司机|驾驶人|驾驶员|驾驶)$/.test(target) && new RegExp(target + '\\s*(?:[A-Z]某|[\\u4e00-\\u9fa5]{1,3}某某?|[甲乙丙丁])').test(sentence.text)) continue;
        // target 为“人名/车牌+行为动词短语+车(辆)”脏主体：剔到真主体（李某跟车→李某、石某某…影响正常行驶车→石某某、苏Ｅ停车→苏Ｅ）。
        if (/(?:驾驶|跟|影响|妨碍|停|驶入|进入|占道|借道|变道|控制|观察|会车|横穿|绕|超|追|撞|剔|避|未|正常行驶|后方)[一-龥]{0,6}(?:车|辆)$/.test(target) && (/驾驶/.test(target) || !/^[一-龥]{1,4}(?:货车|客车|轿车|公交车|摩托车|电动车|三轮车|小客车)$/.test(target))) {
          // 取开头真主体（人名或车牌），去掉后续行为短语。优先取“X驾驶”“X某…”里的真人名/车牌。
          const head = (target.match(/([一-龥]{1,2}某某?|[A-Z]某|[甲乙丙丁戊己庚辛壬癸]|[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z])(?=驾驶)/) || [])[1]
            || (target.match(/^(?:[一-龥]{1,3}某某?|[A-Z]某|[甲乙丙丁戊己庚辛壬癸]|[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z])/) || [])[0]
            || (typeof firstPersonInText === 'function' ? firstPersonInText(sentence.text.slice(0, lm.index + (lm[1] || '').length)) : null);
          if (head) { addEntity(entities, seen, { type: 'liability', name, relatedPerson: head, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-subject-regex' }); }
          continue;
        }
        // r39/r40 A类去重：若 desc-clause 已为同句同责任类别绑了一个“更完整描述”(包含 target，如“货车驾驶员”⊇“货车”)，则本短描述不重复入库。name 为原始词(如“负次要责任”)，需包含匹配 desc 的 normalizedName。
        if (entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.extractor === 'liability-desc-clause-regex' && x.normalizedName && name.indexOf(x.normalizedName) >= 0 && x.relatedPerson && x.relatedPerson !== target && x.relatedPerson.indexOf(target) >= 0)) continue;
        addEntity(entities, seen, { type: 'liability', name, relatedPerson: target, sentenceIndex: sentence.index, start: sentence.start + lm.index, end: sentence.start + lm.index + lm[0].length, evidence: sentence.text, extractor: 'liability-subject-regex' });
      }
      // 测试阶段修（B/D）：liability-dictionary 兵底移到主体抽取(person-regex/inverted/vehicle-subject)之后，
      // 仅当本句该责任类别尚无任何带主体条目时才补。测试阶段修（B·长从句回填）：
      // 若本句内违法词前有唯一/最近 person、且该人与责任词之间不隔另一个 person，则回填为其主体，
      // 消除“驾驶人 X 因…负责任”长因果从句造成的 ?→责任。
      // v3.4.7 Bug3: 补丁——若本句无 person，尝试跨句回填：取本句之前最后一个 person（兼容“经认定，X负全责”式报告模板）。
      for (const [canonical, aliases] of Object.entries(liabilityAliases)) [canonical, ...aliases].forEach(term => {
        if (!sentence.text.includes(term)) return;
        if (entities.some(x => x.type === 'liability' && x.sentenceIndex === sentence.index && x.normalizedName === canonical && x.relatedPerson)) return;
        const termIdx = sentence.text.indexOf(term);
        // 本句内处于违法词之前的 person（同句），取最近一个作主体。
        const priors = entities.filter(x => x.type === 'person' && x.sentenceIndex === sentence.index && typeof x.start === 'number' && (x.start - sentence.start) < termIdx);
        let rp = '';
        if (priors.length) {
          priors.sort((p, q) => q.start - p.start);
          rp = priors[0].normalizedName || '';
        } else {
          // 跨句回填：取本句之前最后一个 person，并确保该 person 与本句之间无其他 liability 已绑定不同主体。
          const before = entities.filter(x => x.type === 'person' && x.sentenceIndex < sentence.index);
          if (before.length) {
            before.sort((p, q) => (q.sentenceIndex - p.sentenceIndex) || (q.start - p.start));
            rp = before[0].normalizedName || '';
          }
        }
        addEntity(entities, seen, { type: 'liability', name: canonical, relatedPerson: rp || undefined, sentenceIndex: sentence.index, start: sentence.start + termIdx, end: sentence.start + termIdx + term.length, evidence: sentence.text, extractor: rp ? 'liability-dictionary-backfill' : 'liability-dictionary' });
      });
      // v3.4.7 P2 B2-NEWBUG-01: 原字典以“包含则命中”方式把小型客车误命中大型客车（子串）。
      // 改为：所有（canonical + aliases）重新展平，按长度降序摆 mask。
      const _vtFlat = [];
      for (const [canonical, aliases] of Object.entries(vehicleTypes)) [canonical, ...aliases].forEach(term => _vtFlat.push({ term, canonical }));
      _vtFlat.sort((a, b) => b.term.length - a.term.length);
      const _vtMask = new Array(sentence.text.length).fill(false);
      _vtFlat.forEach(({ term, canonical }) => {
        let idx = 0;
        while ((idx = sentence.text.indexOf(term, idx)) !== -1) {
          let masked = false;
          for (let i = idx; i < idx + term.length; i++) if (_vtMask[i]) { masked = true; break; }
          if (!masked) {
            addEntity(entities, seen, { type: 'vehicle_attr', name: canonical, sentenceIndex: sentence.index, start: sentence.start + idx, end: sentence.start + idx + term.length, evidence: sentence.text, extractor: 'vehicle-type-dictionary' });
            for (let i = idx; i < idx + term.length; i++) _vtMask[i] = true;
          }
          idx += term.length;
        }
      });
      let vim;
      const vehicleInstanceRegex = new RegExp('((?:无牌|无号牌)?(?:' + VEHICLE_EXT_ALT + '))', 'g');
      while ((vim = vehicleInstanceRegex.exec(sentence.text))) addEntity(entities, seen, { type: 'vehicle_instance', name: vim[1], vehicleType: canonicalFromAliases(vim[1], vehicleTypes), sentenceIndex: sentence.index, start: sentence.start + vim.index, end: sentence.start + vim.index + vim[0].length, evidence: sentence.text, extractor: 'vehicle-instance-regex' });
      for (const [canonical, aliases] of Object.entries(weatherAliases)) [canonical, ...aliases].forEach(term => { if (sentence.text.includes(term)) addEntity(entities, seen, { type: 'weather', name: canonical, sentenceIndex: sentence.index, start: sentence.start + sentence.text.indexOf(term), end: sentence.start + sentence.text.indexOf(term) + term.length, evidence: sentence.text, extractor: 'weather-dictionary' }); });
      const canExtractRoadFactor = isRoadConditionAllowedSentence(sentence.text);
      if (canExtractRoadFactor) {
        for (const [canonical, aliases] of Object.entries(roadConditions)) [canonical, ...aliases].forEach(term => { if (sentence.text.includes(term)) addEntity(entities, seen, { type: 'road_condition', name: canonical, sentenceIndex: sentence.index, start: sentence.start + sentence.text.indexOf(term), end: sentence.start + sentence.text.indexOf(term) + term.length, evidence: sentence.text, extractor: 'road-condition-dictionary' }); });
      }
      const factorContext = /(事发时|天气|道路条件|路面|现场|事故经过|经过|主要过错|事故原因|主要原因|直接原因|风险|隐患|发生|路段|桥面|施工|警示|标志|标线|视距|视线|照明|围挡|积水|湿滑|结冰|团雾|大雾|雾|暴雨|横风|大风|急弯|坡道|匝道|落石|坑槽|遗撒|砂石|刹车失灵|制动失效|制动系统|爆胎|爆裂|轮胎|转向|机械故障|故障|失控|超限超载)/.test(sentence.text);
      if (factorContext && !isSuggestionSentence(sentence.text)) {
        for (const [canonical, aliases] of Object.entries(faultFactorAliases)) [canonical, ...aliases].forEach(term => {
          const idx = sentence.text.indexOf(term);
          if (idx >= 0 && !isNegatedViolation(sentence.text, term, idx, canonical) && (canExtractRoadFactor || /团雾|大雾|暴雨|强降雨|横风|大风|冰雪|积雪|落石|塌方|遗撒|砂石|刹车失灵|制动失效|制动系统|爆胎|爆裂|轮胎|转向故障|转向机构|机械故障|超限超载/.test(canonical + term) || /事故|事发|天气|现场|经过|原因|风险|隐患|直接原因/.test(sentence.text))) {
            // v3.3.6：“急弯/坡道风险”若仅为地点描述（无风险/失控/打滑/未减速/借道/坑洼等归因词），降为间接推断，不作高置信认定原因。
            const geoOnly = canonical === '急弯/坡道风险' && !/风险|失控|打滑|侧滑|甲动|未减速|未明显减速|借道|坑洼|越线|甲打方向|直接原因|事故原因/.test(sentence.text);
            // r30 V21：geoOnly 且句中连“事故原因/直接原因/风险/隐患/主要过错”等归因语境都无时（纯"行至弯道处"方位描述），完全跳过不抽，不臆造诱因。
            if (geoOnly && !/事故原因|直接原因|主要原因|风险|隐患|主要过错/.test(sentence.text)) return;
            addEntity(entities, seen, { type: 'fault_factor', name: canonical, sentenceIndex: sentence.index, start: sentence.start + idx, end: sentence.start + idx + term.length, evidence: sentence.text, extractor: geoOnly ? 'fault-factor-inferred' : 'fault-factor-dictionary', inferred: geoOnly || undefined, confidence: geoOnly ? 0.5 : undefined });
          }
        });
      }
      // v3.3.5 建议3：间接诱因低置信推断。别名命中但严格上下文门槛未过时，仍抽取但标 inferred=true + 低置信度（不丢失原文显式诱因，交由前端弱推断分档展示）。
      if (!isSuggestionSentence(sentence.text)) {
        for (const [canonical, aliases] of Object.entries(faultFactorAliases)) [canonical, ...aliases].forEach(term => {
          const idx = sentence.text.indexOf(term);
          if (idx < 0) return;
          if (isNegatedViolation(sentence.text, term, idx, canonical)) return;
          if (seen.has(['fault_factor', canonical, sentence.index].join('|'))) return;
          if (entities.some(e => e.type === 'fault_factor' && e.name === canonical && e.sentenceIndex === sentence.index)) return;
          // r30 V21："急弯/坡道风险"若仅为地点描述（"行至弯道处"）而无风险/失控/打滑/未减速等归因词，
          // 属纯地点，不当诱因推断（避免臆造）。
          if (canonical === '急弯/坡道风险' && !/风险|失控|打滑|侧滑|制动|未减速|未明显减速|借道|坑洼|越线|直接原因|事故原因|车速过快|溢出|冲出/.test(sentence.text)) return;
          addEntity(entities, seen, { type: 'fault_factor', name: canonical, sentenceIndex: sentence.index, start: sentence.start + idx, end: sentence.start + idx + term.length, evidence: sentence.text, extractor: 'fault-factor-inferred', inferred: true, confidence: 0.5 });
        });
      }
      const naturalFaultPatterns = [
        // r41 正规认定书用语补抽（正式措辞夹字，子串别名抓不到）
        [/超过[一-龥]{0,6}(?:限速|时速)(?:规定)?|行驶速度超过[一-龥]{0,6}(?:限速|时速)/, '超速行驶'],
        [/(?:行经|行至)?人行横道[一-龥]{0,12}未让[一-龥]{0,14}行人/, '未礼让行人'],
        [/未让[一-龥]{0,16}人行横道[一-龥]{0,12}行人/, '未礼让行人'],
        [/(?:行经|行至)?人行横道[一-龥]{0,8}未(?:停车)?让[一-龥]{0,14}行人|未(?:停车)?让[一-龥]{0,12}(?:正在|正在通过|通过)[一-龥]{0,6}行人/, '未礼让行人'],
        [/(?:左|右)?转弯?(?:时)?[一-龥]{0,4}未让[一-龥]{0,8}直行/, '转弯未让直行'],
        [/未礼让[一-龥]{0,12}(?:非机动车|电动自行车|自行车|骑车)|未让[一-龥]{0,10}(?:非机动车|电动自行车)/, '未礼让非机动车'],
        [/未确保安全[一-龥]{0,6}变更车道|在未确保安全的情况下[一-龥]{0,4}变更车道|未确保安全变更车道/, '违法变道'],
        [/变更车道(?:时)?[一-龥]{0,4}未确保安全|变道(?:时)?[一-龥]{0,4}未确保安全/, '违法变道'],
        [/未按规定(?:的)?车道行驶|未按规定车道|驶入机动车道/, '未按规定车道行驶'],
        [/开启车门(?:时)?[一-龥]{0,6}未观察|开车门[一-龥]{0,4}未观察|开启车门前未观察/, '开关车门不当'],
        [/倒车[^。；;]{0,16}(?:未确保安全|未注意|未观察|未安排人员指挥)/, '倒车未确认安全'],
        [/(?:未注意车尾右后方|忽视右侧盲区|只观察左侧|盲区)/, '盲区观察不足'],
        [/(?:未充分减速观察|未充分减速|加速较快|通过公交站区域未充分减速观察)/, '未按条件降低车速'],
        [/(?:未让环岛内车辆|未让直行非机动车先行|未让直行车辆|未让直行)/, '未让行'],
        [/(?:未打转向灯|强行变道|切入公交车道|从直行车道抢行右转|未按导向车道行驶)/, '违法变道'],
        [/(?:违法占用应急车道|占用应急车道)/, '违法停车'],
        [/(?:未按交通标志提前选择路线|违法倒车|突然急停|急停)/, '操作不当'],
        [/(?:横过道路未走人行横道|未走人行横道|突然进入机动车道|从遮挡处突然进入机动车道)/, '违法横穿'],
        [/(?:未按规定密闭运输|篷布未盖严|遗撒砂石|遗撒物影响安全)/, '货物固定不足'],
        [/(?:警示标志摆放距离不足|三角警示牌.{0,6}距离.{0,6}不足)/, '未按规定开启警示灯'],
        [/(?:超车时违法越线|违法越线超车|越过.*对向车道|驶入对向车道)/, '弯道越线'],
        [/(?:司机分心驾驶|分心驾驶|低头看导航|低头看手机)/, '分心驾驶'],
        [/(?:超限超载|超载)/, '超载']
      ];
      naturalFaultPatterns.forEach(([re, name]) => {
        const m = sentence.text.match(re);
        if (m && !isNegatedViolation(sentence.text, m[0], m.index || 0, name)) {
          const type = /遗撒|密闭|篷布/.test(name + m[0]) ? 'fault_factor' : 'violation';
          addEntity(entities, seen, { type, name, sentenceIndex: sentence.index, start: sentence.start + (m.index || 0), end: sentence.start + (m.index || 0) + m[0].length, evidence: sentence.text, extractor: 'natural-fault-pattern-v331' });
        }
      });
    });

    // 测试阶段修（r28 X1·并列无责人漏抽 person）：liability 已确认的 relatedPerson 若为合法匿名人名
    // 但未被任何 person 规则抽到（如“董某、袁某、傅某均无责任”中的并列无责人），回补为 person 实体，
    // 保证责任主体在 persons 列表中可见。仅补合法“X某/X某某/A某/甲乙丙”格式，公司/角色/车辆不补。
    (function backfillLiabilityPersons() {
      const personName = /^(?:[A-Z]某|[\u4e00-\u9fa5]{1,3}某某?|[甲乙丙丁戊己庚辛壬癸])$/;
      const existing = new Set(entities.filter(e => e.type === 'person').map(e => e.normalizedName));
      entities.filter(e => e.type === 'liability' && e.relatedPerson && personName.test(e.relatedPerson) && !existing.has(e.relatedPerson))
        .forEach(e => {
          existing.add(e.relatedPerson);
          addEntity(entities, seen, { type: 'person', name: e.relatedPerson, sentenceIndex: e.sentenceIndex, start: e.start, end: e.end, evidence: e.evidence, extractor: 'person-liability-backfill' });
        });
    })();

    // v3.4.2 Bug1 尾巴：仅针对“酒后驾驶 vs 醉酒驾驶”这一对子串包含关系精准去重：
    // 同句同时出现两者且 span 重叠时，醉酒驾驶优先（“醉酒后驾驶”含“酒后驾驶”子串）。不做通用重叠抑制（会误删多违法）。
    (function dedupDrunkDriving() {
      const drunk = entities.filter(e => e.type === 'violation' && e.normalizedName === '醉酒驾驶' && typeof e.start === 'number');
      if (!drunk.length) return;
      for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (e.type === 'violation' && e.normalizedName === '酒后驾驶' && typeof e.start === 'number') {
          if (drunk.some(d => d.sentenceIndex === e.sentenceIndex && d.start <= e.start && d.end >= e.end)) entities.splice(i, 1);
        }
      }
    })();

    // v3.1：关系抽取已拆分到 relationExtractor.js，保持 TrafficParser 专注实体抽取。
    const relations = RelationExtractor.create({
      normalizeEntity,
      isValidVehicleTarget,
      firstPersonInText,
      allPersonsInText,
      vehicleTokensInText,
      isPrimaryLiabilityName,
      enrichFaultBehaviorEntity
    }).extract({ sentences, entities });
    return { documentType: classifyDocument(clean), text: clean, sentences, entities, relations };
  }

  function legacyEntitiesFromAdvanced(advanced) {
    const byType = type => [...new Set(advanced.entities.filter(e => e.type === type).map(e => e.normalizedName))];
    const roadEntities = advanced.entities.filter(e => e.type === 'road');
    const preferredRoad = (roadEntities.find(e => /road-location-priority/.test(e.extractor || '')) || roadEntities[0] || {}).normalizedName || '';
    const liabilityDetails = advanced.entities.filter(e => e.type === 'liability').map(e => ({ person: e.relatedPerson || '', liability: e.normalizedName, ratio: e.ratio || null, evidence: e.evidence }));
    const faultEntities = advanced.entities.filter(e => ['violation', 'fault_behavior', 'fault_factor'].includes(e.type) && e.faultCategory);
    const faultCategories = [...new Set(faultEntities.map(e => e.faultCategory))];
    const faultCategoryDetails = faultCategories.map(category => {
      const items = faultEntities.filter(e => e.faultCategory === category);
      return {
        category,
        behaviors: [...new Set(items.map(e => e.normalizedName))],
        factors: [...new Set(items.filter(e => e.type === 'fault_factor').map(e => e.normalizedName))],
        subjectTypes: [...new Set(items.map(e => e.subjectType).filter(Boolean))],
        primaryCount: items.filter(e => e.isPrimaryCause).length,
        evidence: [...new Set(items.map(e => e.evidence).filter(Boolean))].slice(0, 3)
      };
    });
    const date = byType('time')[0] || '';
    return {
      persons: byType('person').slice(0, 30),
      vehicles: [...new Set([...byType('vehicle'), ...byType('vehicle_instance')])].slice(0, 30),
      roads: byType('road').slice(0, 20),
      violations: byType('violation'),
      faultCategories,
      faultCategoryDetails,
      faultFactors: byType('fault_factor'),
      injuries: byType('injury'),
      casualtyStatus: byType('casualty_status')[0] || '',
      noCasualty: byType('casualty_status').length > 0,
      weather: byType('weather')[0] || '',
      roadConditions: byType('road_condition'),
      vehicleAttrs: byType('vehicle_attr'),
      liabilities: byType('liability'),
      liabilityDetails,
      propertyLosses: byType('property_loss'),
      accidentTypes: byType('accident_type'),
      date: date ? date.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, ' ').replace(/时/g, ':').replace(/分/g, '') : '',
      location: preferredRoad,
      liability: byType('liability')[0] || '',
      type: byType('violation')[0] || ''
    };
  }

  global.TrafficParser = { preprocess, splitSentences, classifyDocument, extractEntities, legacyEntitiesFromAdvanced, normalizeEntity, confidenceFor, isValidRoadName, dictionaries: { violationAliases, liabilityAliases, vehicleTypes, weatherAliases, roadConditions, accidentTypes, faultTaxonomy, faultBehaviorCategoryHints, faultFactorAliases } };
  if (typeof module !== 'undefined') module.exports = global.TrafficParser;
})(typeof window !== 'undefined' ? window : globalThis);

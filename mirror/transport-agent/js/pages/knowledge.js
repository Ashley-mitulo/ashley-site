async function renderKnowledge(root) {
  const [items, cats] = await Promise.all([api('/knowledge'), api('/knowledge/categories')]);
  root.innerHTML = `
    <div class="grid grid-4">${metric('知识条目',items.length,'政策/规范/预案','cyan')}${metric('分类数量',Object.keys(cats).length,'业务主题','green')}${metric('条例政策',items.filter(i=>/条例|政策|规定/.test(i.category+i.title)).length,'法规依据','yellow')}${metric('可新增', '是', '本地JSON存储','cyan')}</div>
    <div class="card" style="margin-top:16px"><div class="toolbar"><input id="kSearch" class="input" placeholder="搜索知识，如：大件运输、两客一危、超限"/><button class="btn" id="kBtn">搜索</button></div><div id="kList" class="grid grid-3"></div></div>
    <div class="card" style="margin-top:16px"><h3>新增知识</h3><div class="toolbar"><input id="kTitle" class="input" placeholder="标题"/><input id="kCat" class="input" placeholder="分类"/><input id="kSource" class="input" placeholder="来源"/></div><textarea id="kContent" style="width:100%;height:88px" placeholder="知识内容"></textarea><br><br><button id="kAdd" class="btn">新增知识</button></div>`;
  const draw = (list) => { document.getElementById('kList').innerHTML = list.map(k=>`<div class="card"><h3>${k.title}</h3><div>${tag(k.category,'低')}</div><p>${k.content}</p><div class="muted">来源：${k.source}</div>${k.id.startsWith('CK')?`<br><button class="btn secondary" onclick="delKnowledge('${k.id}')">删除</button>`:''}</div>`).join(''); };
  draw(items);
  document.getElementById('kBtn').onclick = async()=>draw(await api(`/knowledge?q=${encodeURIComponent(document.getElementById('kSearch').value)}`));
  document.getElementById('kAdd').onclick = async()=>{ await api('/knowledge',{method:'POST',body:JSON.stringify({title:kTitle.value,category:kCat.value,source:kSource.value,content:kContent.value})}); renderKnowledge(root); };
}
async function delKnowledge(id){ await api(`/knowledge/${id}`,{method:'DELETE'}); loadPage('knowledge'); }

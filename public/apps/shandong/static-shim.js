// ⚠️ Cloudflare Pages 静态部署：/api/* → ./api-static/*.json
(function(){
  const STATIC_BASE = './api-static';
  const _fetch = window.fetch.bind(window);

  function tryPaths(url){
    const u = url.replace(/^\/api\//,'').replace(/^https?:\/\/[^\/]+\/api\//,'');
    // 处理带 query
    const [pathOnly, qs] = u.split('?');
    const paths = [];
    // 基础路径
    paths.push(pathOnly + '.json');
    if (qs) paths.push(pathOnly + '-' + qs.replace(/[=&]/g,'-') + '.json');
    return paths;
  }

  window.fetch = async function(input, init={}){
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!url.includes('/api/')) return _fetch(input, init);

    // POST /api/analyze/predict → 依据 body 找对应 predict-<type>-<holiday>.json
    if ((init.method||'GET').toUpperCase() === 'POST' && url.includes('/api/analyze/predict')){
      try {
        const b = JSON.parse(init.body || '{}');
        const key = `analyze/predict-${b.trafficType||b.type||'highway'}-${b.holiday||'元旦'}.json`;
        const r = await _fetch(`${STATIC_BASE}/${key}`);
        if (r.ok) return new Response(await r.text(), { status: 200, headers: {'Content-Type':'application/json'} });
      } catch(e){}
      // fallback
      return new Response(JSON.stringify({success:false,message:'静态展示未预置该预测组合',static:true}), {status:200, headers:{'Content-Type':'application/json'}});
    }

    // 其他 POST 写操作(upload/knowledge 等)返回静态提示
    if ((init.method||'GET').toUpperCase() !== 'GET'){
      return new Response(JSON.stringify({
        success:false,
        message:'⚠️ 当前为 Cloudflare Pages 静态展示版，此写操作(如上传/解析/清空)未预置数据。完整能力请本地部署 shandong-traffic-analysis-v1.5 (端口 3002)。',
        static:true
      }), {status:200, headers:{'Content-Type':'application/json'}});
    }

    // GET：尝试映射到静态 JSON
    const paths = tryPaths(url.replace(/^https?:\/\/[^\/]+/,''));
    for (const p of paths){
      try {
        const r = await _fetch(`${STATIC_BASE}/${p}`);
        if (r.ok) return new Response(await r.text(), { status:200, headers:{'Content-Type':'application/json'} });
      } catch(e){}
    }
    // 找不到就返回空成功包
    return new Response(JSON.stringify({success:true,data:[],static_miss:true,url}), {status:200, headers:{'Content-Type':'application/json'}});
  };
})();

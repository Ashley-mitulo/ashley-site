// ⚠️ Cloudflare Pages 静态部署：POST /api/optimize 假装启动，然后按序返回预计算迭代
(function(){
  const S = './api-static';
  const _fetch = window.fetch.bind(window);
  const state = { running:false, iter:0, total:50 };

  function json(o, code=200){ return new Response(JSON.stringify(o),{status:code,headers:{'Content-Type':'application/json'}}); }

  window.fetch = async function(input, init={}){
    const url = (typeof input === 'string' ? input : (input && input.url) || '');
    const method = (init.method || 'GET').toUpperCase();

    if (!url.includes('/api/')) return _fetch(input, init);

    // POST /api/optimize → 启动模拟
    if (method === 'POST' && url.includes('/api/optimize')){
      state.running = true; state.iter = 0;
      const timer = setInterval(()=>{
        state.iter += 1;
        if (state.iter >= state.total){ state.running=false; clearInterval(timer); }
      }, 300);
      return json({success:true, message:'优化任务已启动（静态回放）'});
    }

    // GET /api/status
    if (url.includes('/api/status')){
      const r = await _fetch(`${S}/status.json`);
      const orig = r.ok ? await r.json() : {};
      const done = !state.running && state.iter >= state.total && state.iter > 0;
      return json({...orig, status: done ? 'completed' : (state.running ? 'running' : 'ready'), is_running: state.running, current_iteration: state.iter, total_iterations: state.total});
    }

    // GET /api/iteration/N
    const mi = url.match(/\/api\/iteration\/(\d+)/);
    if (mi){
      const r = await _fetch(`${S}/iteration/${mi[1]}.json`);
      if (r.ok) return json(await r.json());
      return json({success:false, message:'无该迭代'});
    }

    // 其他 GET
    for (const key of ['buildings','candidates','result']){
      if (url.includes(`/api/${key}`)){
        const r = await _fetch(`${S}/${key}.json`);
        if (r.ok) return json(await r.json());
      }
    }

    // 写操作提示
    if (method !== 'GET'){
      return json({success:false, message:'⚠️ Cloudflare Pages 静态展示版，写操作未支持，请本地部署 Flask 后端。', static:true});
    }
    return json({success:false, message:'静态未预置', url});
  };
})();

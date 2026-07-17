// ⚠️ Cloudflare Pages 静态部署：所有 /api/* 请求转到 ./api-static/*.json
// 上游后端：port-optimization-v1.0 (端口 3006)

const STATIC_BASE = './api-static';

// URL → 静态文件映射（含带 query 的常用组合）
const STATIC_MAP = {
  '/api/health': 'health.json',
  '/api/alarm/statistics': 'alarm/statistics.json',
  '/api/grid/overview': 'grid/overview.json',
  '/api/grid/power-plants': 'grid/power-plants.json',
  '/api/grid/substations': 'grid/substations.json',
  '/api/grid/transmission-lines': 'grid/transmission-lines.json',
  '/api/location/candidates': 'location/candidates.json',
  '/api/location/constraints': 'location/constraints.json',
  '/api/location/loadcenters': 'location/loadcenters.json',
  '/api/location/result': 'location/result.json',
  '/api/location/road-network': 'location/road-network.json',
  '/api/location/schemes': 'location/schemes.json',
  '/api/location/status': 'location/status.json',
  '/api/monitoring/load-forecast': 'monitoring/load-forecast.json',
  '/api/monitoring/realtime': 'monitoring/realtime.json',
  '/api/scheduling/berth-details': 'scheduling/berth-details.json',
  '/api/scheduling/berth-details?type=optimized': 'scheduling/berth-details-optimized.json',
  '/api/scheduling/berth-details?type=baseline': 'scheduling/berth-details-baseline.json',
  '/api/scheduling/berths': 'scheduling/berths.json',
  '/api/scheduling/gantt': 'scheduling/gantt.json',
  '/api/scheduling/gantt?type=optimized': 'scheduling/gantt-optimized.json',
  '/api/scheduling/gantt?type=baseline': 'scheduling/gantt-baseline.json',
  '/api/scheduling/init': 'scheduling/init.json',
  '/api/scheduling/init?count=100': 'scheduling/init-100.json',
  '/api/scheduling/results': 'scheduling/results.json',
  '/api/scheduling/ships': 'scheduling/ships.json',
  // POST 主要动作也预置默认结果
  '/api/scheduling/optimize': 'scheduling/optimize.json',
  '/api/scheduling/simulate': 'scheduling/simulate.json',
  '/api/scheduling/reset': 'scheduling/reset.json',
  '/api/location/optimize': 'location/optimize.json',
  '/api/location/n1-check': 'location/n1-check.json',
  '/api/location/regenerate': 'location/regenerate.json',
  '/api/location/reset': 'location/reset.json',
  '/api/location/save-scheme': 'location/save-scheme.json'
};

function resolveStatic(url) {
  // 已经是相对路径的静态资源不拦
  if (!url.startsWith('/api/') && !url.startsWith('http')) return null;
  const path = url.replace(/^https?:\/\/[^\/]+/, '');
  if (STATIC_MAP[path]) return `${STATIC_BASE}/${STATIC_MAP[path]}`;
  const pure = path.split('?')[0];
  if (STATIC_MAP[pure]) return `${STATIC_BASE}/${STATIC_MAP[pure]}`;
  // grid/substations/:id
  let m;
  if ((m = pure.match(/^\/api\/grid\/substations\/(\d+)$/))) {
    return `${STATIC_BASE}/grid/substations/${m[1]}.json`;
  }
  return null;
}

// Monkey-patch window.fetch：所有 /api/* 请求转向 ./api-static/*.json
const _origFetch = window.fetch.bind(window);
window.fetch = async function(input, init = {}) {
  const url = typeof input === 'string' ? input : (input && input.url) || '';
  const staticPath = resolveStatic(url);
  if (staticPath) {
    const method = (init.method || 'GET').toUpperCase();
    // POST 写操作 → 返回冻结的 demo 结果 + 提示
    // 但 optimize/simulate/reset 我们已经预置了 JSON,直接用
    try {
      const r = await _origFetch(staticPath);
      if (!r.ok) throw new Error('static miss ' + staticPath);
      const json = await r.json();
      return new Response(JSON.stringify(json), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      // 未映射的写操作,返回演示提示
      const demoBody = {
        success: false,
        message: '⚠️ 当前为 Cloudflare Pages 静态展示版，此写操作未预置数据。如需完整能力请本地部署 port-optimization-v1.0 (端口 3006)。',
        static: true,
        originalUrl: url
      };
      return new Response(JSON.stringify(demoBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  return _origFetch(input, init);
};

const API_BASE = '/api';

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(API_BASE + url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        return { success: false, error: error.message };
    }
}

const API = {
    // 兼容代码里的 API.fetch(url, opts) 直接调用
    fetch: (url, options) => apiRequest(url.startsWith('/api/') ? url.slice(4) : url, options),

    health: () => apiRequest('/health'),
    
    scheduling: {
        init: () => apiRequest('/scheduling/init'),
        ships: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest('/scheduling/ships' + (query ? '?' + query : ''));
        },
        berths: () => apiRequest('/scheduling/berths'),
        optimize: (params) => apiRequest('/scheduling/optimize', { method: 'POST', body: JSON.stringify(params) }),
        gantt: () => apiRequest('/scheduling/gantt'),
        berthDetails: () => apiRequest('/scheduling/berth-details'),
        reset: () => apiRequest('/scheduling/reset', { method: 'POST' })
    },
    
    grid: {
        overview: () => apiRequest('/grid/overview'),
        substations: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest('/grid/substations' + (query ? '?' + query : ''));
        },
        getSubstation: (id) => apiRequest('/grid/substations/' + id),
        addSubstation: (data) => apiRequest('/grid/substations', { method: 'POST', body: JSON.stringify(data) }),
        updateSubstation: (id, data) => apiRequest('/grid/substations/' + id, { method: 'PUT', body: JSON.stringify(data) }),
        deleteSubstation: (id) => apiRequest('/grid/substations/' + id, { method: 'DELETE' }),
        
        transmissionLines: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest('/grid/transmission-lines' + (query ? '?' + query : ''));
        },
        
        powerPlants: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest('/grid/power-plants' + (query ? '?' + query : ''));
        }
    },
    
    monitoring: {
        realtime: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest('/monitoring/realtime' + (query ? '?' + query : ''));
        },
        addData: (data) => apiRequest('/monitoring/data', { method: 'POST', body: JSON.stringify(data) }),
        simulate: () => apiRequest('/monitoring/simulate', { method: 'POST' }),
        loadForecast: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest('/monitoring/load-forecast' + (query ? '?' + query : ''));
        }
    },
    
    alarms: {
        list: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest('/alarm' + (query ? '?' + query : ''));
        },
        add: (data) => apiRequest('/alarm', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, status) => apiRequest('/alarm/' + id, { method: 'PUT', body: JSON.stringify({ status }) }),
        delete: (id) => apiRequest('/alarm/' + id, { method: 'DELETE' }),
        simulate: (count = 3) => apiRequest('/alarm/simulate', { method: 'POST', body: JSON.stringify({ count }) }),
        statistics: () => apiRequest('/alarm/statistics')
    }
};

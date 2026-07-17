// v2.6 Reports API client - 独立模块，供 app.js 调用
(function (global) {
  async function request(url, options) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...(options || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error(data.error || ('请求失败：' + res.status));
    return data.data;
  }

  const ReportsApi = {
    request,
    list: () => request('/api/reports'),
    createMany: reports => request('/api/reports', { method: 'POST', body: JSON.stringify({ reports }) }),
    update: (id, report) => request('/api/reports/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(report) }),
    remove: id => request('/api/reports/' + encodeURIComponent(id), { method: 'DELETE' }),
    importMany: reports => request('/api/reports/import', { method: 'POST', body: JSON.stringify({ reports }) }),
    exportUrl: format => '/api/reports/export' + (format === 'csv' ? '?format=csv' : '')
  };

  global.ReportsApi = ReportsApi;
})(window);

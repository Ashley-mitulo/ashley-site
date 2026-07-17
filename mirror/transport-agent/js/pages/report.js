async function renderReport(root) {
  const report = await api('/report/daily');
  const text = `${report.title}\n日期：${report.date}\n\n一、总体态势\n${report.summary.overallStatus}\n${report.summary.roadStatus}\n${report.summary.vehicleStatus}\n${report.summary.eventStatus}\n${report.summary.creditStatus}\n\n二、拥堵排行\n${report.congestionTop5.map((r,i)=>`${i+1}. ${r.name} ${r.status} 指数${r.index}`).join('\n')}\n\n三、重点事件\n${report.activeEvents.map(e=>`- ${e.title} ${e.level}/${e.status}`).join('\n')}\n\n四、建议\n${report.recommendations.map((r,i)=>`${i+1}. ${r}`).join('\n')}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  root.innerHTML = `
    <div class="grid grid-4">${metric('日报日期',report.date,'运行日报','cyan')}${metric('拥堵TOP',report.congestionTop5.length,'重点路段','red')}${metric('活跃事件',report.activeEvents.length,'在办事项','yellow')}${metric('处置建议',report.recommendations.length,'辅助决策','green')}</div>
    <div class="card" style="margin-top:16px"><h3>📝 ${report.title}</h3><a class="btn download" href="${url}" download="山东省交通运输运行日报-${report.date}.txt">下载 TXT</a><pre style="white-space:pre-wrap;line-height:1.7;color:#d7ecff">${text}</pre></div>
    <div class="card" style="margin-top:16px"><h3>领导摘要</h3><div class="item"><div class="item-title">${report.summary.overallStatus}</div><div class="muted">${report.recommendations.slice(0,3).join('；')}</div></div></div>`;
}

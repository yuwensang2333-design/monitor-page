/* ==========================================================================
   总览大屏逻辑
   ========================================================================== */
(function () {
  'use strict';

  const SR = window.SR;
  const D = SR.data;

  const els = {
    stage: document.getElementById('stage'),
    kpiTotal: document.getElementById('kpiTotal'),
    kpiNormal: document.getElementById('kpiNormal'),
    kpiAlarm: document.getElementById('kpiAlarm'),
    kpiRate: document.getElementById('kpiRate'),
    health: document.getElementById('chartHealth'),
    count: document.getElementById('chartCount'),
    week: document.getElementById('chartWeek'),
    pie: document.getElementById('pieLevel'),
    pieLegend: document.getElementById('pieLegend'),
    alarmList: document.getElementById('alarmList'),
    topo: document.getElementById('topo'),
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    foUpdate: document.getElementById('foUpdate')
  };

  /* ---------------- 初始化 ---------------- */
  SR.fit();
  SR.starfield(document.getElementById('stars'));
  SR.frameCorners();
  SR.startClock(els.clock, els.date);

  document.querySelectorAll('.hdr-wing').forEach((w) => {
    w.innerHTML = SR.headerWing(w.classList.contains('right') ? 'right' : 'left');
  });
  SR.decorate();

  /* ---------------- KPI 数字 ---------------- */
  function renderKpi(s, animate) {
    if (animate === false) {
      els.kpiTotal.textContent = s.total;
      els.kpiNormal.textContent = s.normal;
      els.kpiAlarm.textContent = s.alarmDevice;
      els.kpiRate.textContent = s.rate.toFixed(2);
      els.kpiTotal.dataset.value = s.total;
      els.kpiNormal.dataset.value = s.normal;
      els.kpiAlarm.dataset.value = s.alarmDevice;
      els.kpiRate.dataset.value = s.rate.toFixed(2);
      return;
    }
    SR.countTo(els.kpiTotal, s.total, { duration: 1200 });
    SR.countTo(els.kpiNormal, s.normal, { duration: 1400 });
    SR.countTo(els.kpiAlarm, s.alarmDevice, { duration: 1600 });
    SR.countTo(els.kpiRate, s.rate, { duration: 1800, decimals: 2 });
  }
  renderKpi(D.summary, true);

  /* ---------------- 图表 ---------------- */
  SR.hbars(els.health, D.health.map((d) => ({ name: d.name, value: d.value })), {
    type: 'health', max: 100, decimals: 1, suffix: '%', ticks: 5
  });

  // 设备分类数量（整数百分比保留一位小数不适用，单独渲染）
  SR.hbars(els.count, D.deviceCount, {
    type: 'count', max: 1200, decimals: 0, suffix: '', ticks: 6,
    axis: { max: 1200, ticks: [0, 200, 400, 600, 800, 1000, 1200] }
  });

  SR.hbars(els.week, D.weekTop, {
    type: 'week', max: 36, decimals: 0, valueBefore: true, ticks: 0,
    axis: { max: 36, ticks: [0, 5, 10, 15, 20, 25, 30, 35] }
  });

  /* ---------------- 告警等级环形图 ---------------- */
  const totalLevel = D.alarmLevels.reduce((s, d) => s + d.value, 0);
  SR.donut(els.pie, D.alarmLevels, {
    size: 340, rOut: 122, rIn: 54, depth: 16,
    center: { value: String(totalLevel), label: '告警总数' }
  });

  els.pieLegend.innerHTML = D.alarmLevels.map((d) => {
    const pct = ((d.value / totalLevel) * 100).toFixed(0);
    return `<span class="lg">
      <i class="dot" style="background:${d.color};color:${d.color}"></i>
      ${SR.esc(d.name)} <b class="pct">${pct}%</b>
    </span>`;
  }).join('');

  /* ---------------- 网络拓扑 ---------------- */
  SR.topology(els.topo);

  /* ---------------- 当前告警列表 ---------------- */
  const LEVEL_CLASS = { 紧急: 'urgent', 重要: 'major', 普通: 'normal', 提示: 'tip' };
  const MAX_ROWS = 40;
  let currentAlarms = D.alarms.map((a) => Object.assign({}, a));

  function alarmRowHtml(a, isNew) {
    const cls = LEVEL_CLASS[a.level] || 'normal';
    return `<div class="alarm-row${isNew ? ' is-new' : ''}" data-level="${cls}" data-dur="${a.dur}">
      <span class="a-name" title="${SR.esc(a.name)}">${SR.esc(a.name)}</span>
      <span class="a-dev" title="${SR.esc(a.device)}">${SR.esc(a.device)}</span>
      <span><i class="chip ${cls}">${SR.esc(a.level)}</i></span>
      <span class="a-time num">${SR.fmtClock(a.dur)}</span>
    </div>`;
  }

  function renderAlarms() {
    els.alarmList.innerHTML = currentAlarms.slice(0, MAX_ROWS).map((a, i) => alarmRowHtml(a, i === 0 && a._new)).join('');
  }
  renderAlarms();

  const alarmBody = document.querySelector('.alarm-body');
  if (alarmBody) alarmBody.scrollTop = 0;

  /* ---------------- 实时更新 ---------------- */
  let uptime = 0;

  // 1) 告警时长每秒递增
  setInterval(() => {
    uptime += 1;
    els.alarmList.querySelectorAll('.alarm-row').forEach((row) => {
      const d = Number(row.dataset.dur || 0) + 1;
      row.dataset.dur = String(d);
      row.querySelector('.a-time').textContent = SR.fmtClock(d);
    });
    if (els.foUpdate) {
      els.foUpdate.textContent = SR.fmtClock(uptime);
    }
  }, 1000);

  // 2) 模拟新告警推送
  function pushAlarm() {
    const a = SR.nextAlarm();
    a._new = true;
    currentAlarms.forEach((x) => { delete x._new; });
    currentAlarms.unshift(a);
    if (currentAlarms.length > MAX_ROWS) currentAlarms.pop();
    renderAlarms();
    if (alarmBody) alarmBody.scrollTop = 0;

    // 同步更新 KPI 与环形图数量
    D.summary.alarmDevice = Math.min(D.summary.total, D.summary.alarmDevice + 1);
    D.summary.rate = (D.summary.alarmDevice / D.summary.total) * 100;
    SR.countTo(els.kpiAlarm, D.summary.alarmDevice, { duration: 500 });
    SR.countTo(els.kpiRate, D.summary.rate, { duration: 500, decimals: 2 });
    SR.flash(els.kpiAlarm);
    SR.flash(els.kpiRate);

    const lvl = D.alarmLevels.find((x) => x.name === a.level);
    if (lvl) {
      lvl.value += 1;
      const t = D.alarmLevels.reduce((s, d) => s + d.value, 0);
      SR.donut(els.pie, D.alarmLevels, {
        size: 340, rOut: 122, rIn: 54, depth: 16,
        center: { value: String(t), label: '告警总数' }
      });
      els.pieLegend.innerHTML = D.alarmLevels.map((d) => {
        const pct = ((d.value / t) * 100).toFixed(0);
        return `<span class="lg"><i class="dot" style="background:${d.color};color:${d.color}"></i>
          ${SR.esc(d.name)} <b class="pct">${pct}%</b></span>`;
      }).join('');
    }
  }
  setTimeout(() => {
    pushAlarm();
    setInterval(pushAlarm, 14000);
  }, 9000);

  // 3) 设备健康度轻微波动，模拟真实采集
  setInterval(() => {
    D.health.forEach((h) => {
      if (h.value >= 100) return;
      const delta = (Math.random() - 0.45) * 0.6;
      h.value = Math.max(85, Math.min(100, +(h.value + delta).toFixed(1)));
    });
    SR.hbarsUpdate(els.health, D.health, { max: 100, decimals: 1, suffix: '%' });
  }, 6000);

  /* ---------------- 键盘：F 全屏 / 1-2 切换页面 ---------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    }
    if (e.key === '2') location.href = 'alarms.html';
  });
})();

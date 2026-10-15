/* ==========================================================================
   告警监测页逻辑
   ========================================================================== */
(function () {
  'use strict';

  const SR = window.SR;
  const D = SR.data;

  const els = {
    grid: document.getElementById('deviceGrid'),
    pie: document.getElementById('pieConfirm'),
    legend: document.getElementById('pieLegend2'),
    tableBody: document.getElementById('alarmTableBody'),
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    statDevice: document.getElementById('statDevice'),
    statAlarm: document.getElementById('statAlarm'),
    statRate: document.getElementById('statRate'),
    statLevel: document.getElementById('statLevel')
  };

  SR.fit();
  SR.starfield(document.getElementById('stars'));
  SR.frameCorners();
  SR.startClock(els.clock, els.date);
  document.querySelectorAll('.hdr-wing').forEach((w) => {
    w.innerHTML = SR.headerWing(w.classList.contains('right') ? 'right' : 'left');
  });

  /* ---------------- 设备告警卡片 ---------------- */
  let devices = D.deviceAlarms.map((d) => Object.assign({}, d));

  function renderDevices() {
    els.grid.innerHTML = devices.map((d, i) => {
      const cls = d.count > 0 ? 'alarm' : 'zero';
      return `<div class="device-card" data-index="${i}" data-key="${d.key}">
        <div class="device-icon">${SR.icon(d.key)}</div>
        <div class="device-data">
          <span class="device-count num ${cls}">${d.count}</span>
          <span class="device-name" title="${SR.esc(d.name)}">${SR.esc(d.name)}</span>
        </div>
      </div>`;
    }).join('');
  }
  renderDevices();

  /* ---------------- 顶部统计 ---------------- */
  function totals() {
    const alarmDevice = devices.reduce((s, d) => s + d.count, 0);
    const kinds = devices.filter((d) => d.count > 0).length;
    return { alarmDevice, kinds };
  }

  function renderStats() {
    const t = totals();
    const s = D.summary;
    if (els.statDevice) els.statDevice.textContent = s.total.toLocaleString('en-US');
    if (els.statAlarm) els.statAlarm.textContent = t.alarmDevice;
    if (els.statLevel) els.statLevel.textContent = t.kinds;
    // 告警率与总览大屏保持一致（告警设备数 / 设备总数）
    if (els.statRate) els.statRate.textContent = ((s.alarmDevice / s.total) * 100).toFixed(2) + '%';
  }
  renderStats();

  /* ---------------- 当前确认告警数占比 ---------------- */
  function renderPie() {
    const legend = SR.donutLabels(els.pie, D.confirmShare, {
      size: 380, rOut: 124, rIn: 0, startAngle: Math.PI * 0.66
    });
    els.legend.innerHTML = legend;
  }
  renderPie();

  /* ---------------- 告警明细表 ---------------- */
  const LEVEL_CLASS = { 紧急: 'urgent', 重要: 'major', 普通: 'normal', 提示: 'tip' };
  let rows = D.alarmRows.map((r) => Object.assign({}, r));
  let viewMode = 'all'; // all | current

  function currentRows() {
    return viewMode === 'current' ? rows.filter((r) => r.level !== '提示') : rows;
  }

  function renderTable(newIdx) {
    const list = currentRows();
    if (!list.length) {
      els.tableBody.innerHTML = '<div class="empty-tip">暂无告警数据</div>';
      return;
    }
    els.tableBody.innerHTML = list.map((r, i) => {
      const cls = LEVEL_CLASS[r.level] || 'normal';
      return `<div class="atable-row${i === newIdx ? ' is-new' : ''}" data-idx="${rows.indexOf(r)}">
        <span class="idx">${i + 1}</span>
        <span>${SR.esc(r.name)}</span>
        <span>${SR.esc(r.device)}</span>
        <span class="desc">${SR.esc(r.desc)}</span>
        <span class="lvl"><i class="chip ${cls}">${SR.esc(r.level)}</i></span>
        <span class="dur">${SR.fmtCn(r.dur)}</span>
      </div>`;
    }).join('');
  }
  renderTable(-1);

  /* ---------------- 视图切换 ---------------- */
  document.querySelectorAll('.seg-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg-toggle button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.mode;
      renderTable(-1);
    });
  });

  /* ---------------- 实时刷新 ---------------- */
  // 1) 告警时长每秒累加
  setInterval(() => {
    rows.forEach((r) => { r.dur += 1; });
    els.tableBody.querySelectorAll('.atable-row').forEach((tr) => {
      const idx = Number(tr.dataset.idx);
      const r = rows[idx];
      if (!r) return;
      tr.querySelector('.dur').textContent = SR.fmtCn(r.dur);
    });
  }, 1000);

  // 2) 模拟新告警
  function pushAlarm() {
    const r = SR.nextDetailAlarm(rows.length);
    rows.unshift(r);
    if (rows.length > 40) rows.pop();

    // 设备计数 +1
    const target = devices.find((d) => d.count > 0 && Math.random() > 0.5) || devices[0];
    target.count += 1;
    const card = els.grid.querySelector(`.device-card[data-key="${target.key}"]`);
    if (card) {
      const span = card.querySelector('.device-count');
      span.textContent = target.count;
      span.classList.remove('ok', 'zero', 'alarm');
      span.classList.add('alarm');
      card.classList.remove('bump');
      void card.offsetWidth;
      card.classList.add('bump');
    }

    renderStats();
    renderTable(0);
  }
  setTimeout(() => {
    pushAlarm();
    setInterval(pushAlarm, 16000);
  }, 10000);

  /* ---------------- 键盘快捷键 ---------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    }
    if (e.key === '1') location.href = 'index.html';
    if (e.key === 'Backspace') location.href = 'index.html';
  });
})();

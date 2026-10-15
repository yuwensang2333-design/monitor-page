/* ==========================================================================
   图表：横向条形图 / 三维环形图 / 排行榜 / 网络拓扑（纯 SVG，无外部依赖）
   ========================================================================== */
(function (global) {
  'use strict';

  const SR = global.SR;

  /* ---------------- 通用：横向条形图 ---------------- */
  /**
   * @param {HTMLElement} host 容器
   * @param {Array<{name:string,value:number}>} data
   * @param {Object} opts { type, max, decimals, suffix, ticks, valueInside, animate }
   */
  SR.hbars = function hbars(host, data, opts) {
    const o = Object.assign({
      type: 'health', max: 100, decimals: 0, suffix: '', ticks: 5,
      valueInside: false
    }, opts || {});

    const rows = data.map((d) => {
      const pct = Math.max(0, Math.min(100, (d.value / o.max) * 100));
      const shown = o.decimals ? d.value.toFixed(o.decimals) : String(d.value);
      const valueHtml = o.valueInside
        ? `<span class="hbar-value-in ${o.type}">${shown}</span>`
        : '';
      const tickHtml = o.ticks
        ? Array.from({ length: o.ticks - 1 }, (_, i) =>
            `<i class="tick" style="left:${((i + 1) / o.ticks) * 100}%"></i>`).join('')
        : '';
      const valueCell = o.valueBefore
        ? `<div class="hbar-value ${o.type}">${shown}</div>`
        : `<div class="hbar-value ${o.type}">${shown}${o.suffix}</div>`;
      return `<div class="hbar-row${o.valueBefore ? ' before' : ''}">
        <div class="hbar-name" title="${SR.esc(d.name)}">${SR.esc(d.name)}</div>
        ${o.valueBefore ? valueCell : ''}
        <div class="hbar-track">
          ${tickHtml}
          <div class="hbar-fill ${o.type}" data-w="${pct.toFixed(2)}" style="width:0">${valueHtml}</div>
        </div>
        ${o.valueBefore ? '' : valueCell}
      </div>`;
    }).join('');

    let axisHtml = '';
    if (o.axis && o.axis.ticks) {
      const scale = o.axis.ticks.map((t) =>
        `<span style="left:${(t / o.axis.max) * 100}%">${t}</span>`).join('');
      axisHtml = `<div class="hbar-axis${o.valueBefore ? ' before' : ''}">
        ${o.valueBefore
          ? `<div></div><div></div><div class="axis-scale"><i class="axis-line"></i>${scale}</div>`
          : `<div></div><div class="axis-scale"><i class="axis-line"></i>${scale}</div><div></div>`}
      </div>`;
    }

    host.innerHTML = `<div class="hbar">${rows}</div>${axisHtml}`;

    // 入场动画
    requestAnimationFrame(() => {
      host.querySelectorAll('.hbar-fill').forEach((el) => {
        el.style.width = `${el.dataset.w}%`;
      });
    });
  };

  /** 更新单条数据（用于实时刷新） */
  SR.hbarsUpdate = function (host, data, opts) {
    const o = Object.assign({ max: 100, decimals: 0, suffix: '' }, opts || {});
    const rows = host.querySelectorAll('.hbar-row');
    data.forEach((d, i) => {
      const row = rows[i];
      if (!row) return;
      const pct = Math.max(0, Math.min(100, (d.value / o.max) * 100));
      const shown = o.decimals ? d.value.toFixed(o.decimals) : String(d.value);
      row.querySelector('.hbar-fill').style.width = `${pct.toFixed(2)}%`;
      const v = row.querySelector('.hbar-value');
      if (v) v.textContent = shown + o.suffix;
      const vin = row.querySelector('.hbar-value-in');
      if (vin) vin.textContent = shown;
    });
  };

  /* ---------------- 环形 / 饼图（带立体厚度） ---------------- */
  function polar(cx, cy, r, a) {
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function arcPath(cx, cy, rOut, rIn, a0, a1) {
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    const [x0, y0] = polar(cx, cy, rOut, a0);
    const [x1, y1] = polar(cx, cy, rOut, a1);
    // 实心扇形：所有扇区共用圆心，避免中心出现缝隙
    if (rIn <= 0.5) {
      return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${rOut} ${rOut} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}` +
             `L${cx.toFixed(2)} ${cy.toFixed(2)}Z`;
    }
    const [x2, y2] = polar(cx, cy, rIn, a1);
    const [x3, y3] = polar(cx, cy, rIn, a0);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${rOut} ${rOut} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}` +
           `L${x2.toFixed(2)} ${y2.toFixed(2)}A${rIn} ${rIn} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
  }

  /**
   * 立体环形图
   * @param {SVGElement} svg
   * @param {Array<{name:string,value:number,color:string,dark:string}>} data
   * @param {Object} opts { size, rOut, rIn, depth, center, uid, startAngle }
   */
  SR.donut = function donut(svg, data, opts) {
    const o = Object.assign({
      size: 320, rOut: 112, rIn: 56, depth: 14, uid: 'd' + Math.random().toString(36).slice(2, 7),
      center: null, startAngle: -Math.PI / 2, gap: 0.012
    }, opts || {});

    const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
    const cx = o.size / 2;
    const cy = o.size / 2 - o.depth / 2;

    const visible = data.filter((d) => d.value > 0);
    let angle = o.startAngle;

    const defs = visible.map((d, i) => `
      <linearGradient id="${o.uid}-g${i}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${d.color}" stop-opacity="1"/>
        <stop offset="60%" stop-color="${d.color}" stop-opacity=".88"/>
        <stop offset="100%" stop-color="${d.dark || d.color}" stop-opacity="1"/>
      </linearGradient>`).join('');

    let shadow = '';
    let slices = '';
    let ring = '';

    visible.forEach((d, i) => {
      const span = (d.value / total) * Math.PI * 2;
      const a0 = angle + o.gap / 2;
      const a1 = angle + span - o.gap / 2;
      const path = arcPath(cx, cy, o.rOut, o.rIn, a0, a1);
      shadow += `<path d="${path}" transform="translate(0 ${o.depth})" fill="${d.dark || d.color}" opacity=".85"/>`;
      slices += `<path d="${path}" fill="url(#${o.uid}-g${i})" stroke="rgba(3,10,22,.55)" stroke-width="1"/>`;
      // 外侧高光弧
      ring += `<path d="${arcPath(cx - 6, cy - 8, o.rOut + 12, o.rOut + 4, a0, a1)}" fill="rgba(255,255,255,.10)"/>`;
      angle += span;
    });

    let centerHtml = '';
    if (o.center) {
      centerHtml = `
        <ellipse cx="${cx}" cy="${cy + o.depth / 2}" rx="${o.rIn + 6}" ry="${(o.rIn + 6) * 0.42}"
                 fill="rgba(4,16,36,.85)" stroke="rgba(70,170,255,.35)"/>
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#eaf6ff"
              font-size="26" class="num-text" font-weight="700">${SR.esc(o.center.value)}</text>
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="#8fb0d6" font-size="12.5">${SR.esc(o.center.label)}</text>`;
    }

    svg.setAttribute('viewBox', `0 0 ${o.size} ${o.size + o.depth}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = `<defs>${defs}</defs>
      <ellipse cx="${cx}" cy="${cy + o.rOut * 0.62 + o.depth}" rx="${o.rOut * 0.86}" ry="14"
               fill="rgba(0,0,0,.45)" style="filter:blur(6px)"/>
      <g>${shadow}</g>
      <g>${slices}</g>
      <g>${ring}</g>
      ${centerHtml}`;
  };

  /* ---------------- 带外置标签的环形图（告警监测页） ---------------- */
  SR.donutLabels = function donutLabels(svg, data, opts) {
    const o = Object.assign({
      size: 380, rOut: 124, rIn: 12, uid: 'p' + Math.random().toString(36).slice(2, 7),
      startAngle: Math.PI * 0.62, gap: 0.02
    }, opts || {});

    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const cx = o.size / 2;
    const cy = o.size / 2;
    const visible = data.filter((d) => d.value > 0);

    const defs = visible.map((d, i) => `
      <radialGradient id="${o.uid}-g${i}" cx="42%" cy="34%" r="72%">
        <stop offset="0%" stop-color="${lighten(d.color, .28)}"/>
        <stop offset="70%" stop-color="${d.color}"/>
        <stop offset="100%" stop-color="${darken(d.color, .28)}"/>
      </radialGradient>`).join('');

    let angle = o.startAngle;
    let slices = '';
    let legend = '';
    const labelItems = [];

    visible.forEach((d, i) => {
      const span = (d.value / total) * Math.PI * 2;
      const a0 = angle + o.gap / 2;
      const a1 = angle + span - o.gap / 2;
      slices += `<path d="${arcPath(cx, cy, o.rOut, o.rIn, a0, a1)}" fill="url(#${o.uid}-g${i})" stroke="rgba(4,12,26,.6)" stroke-width="1"/>`;

      // 标签与引导线
      const mid = (a0 + a1) / 2;
      const [px, py] = polar(cx, cy, o.rOut + 6, mid);
      const [ex, ey] = polar(cx, cy, o.rOut + 30, mid);
      const right = Math.cos(mid) >= 0;
      const pct = ((d.value / total) * 100).toFixed(0);
      const isSmall = span < 0.42;
      labelItems.push({
        px, py, ex, ey, right, pct, isSmall,
        name: d.name, color: d.color, value: d.value
      });

      legend += `<span class="lg"><i class="dot" style="background:${d.color};color:${d.color}"></i>
        ${SR.esc(d.name)} <b class="pct">${pct}%</b></span>`;
      angle += span;
    });

    // 简单防重叠：同一侧标签按 y 排序后强制最小间距
    const MIN_GAP = 46;
    ['left', 'right'].forEach((side) => {
      const group = labelItems.filter((l) => (side === 'right') === l.right).sort((a, b) => a.ey - b.ey);
      for (let i = 1; i < group.length; i++) {
        const prev = group[i - 1];
        if (group[i].ey - prev.ey < MIN_GAP) group[i].ey = prev.ey + MIN_GAP;
      }
      // 越界回推
      const overflow = group.length ? group[group.length - 1].ey - (cy + o.rOut + 22) : 0;
      if (overflow > 0) group.forEach((l) => { l.ey -= overflow; });
    });

    const labels = labelItems.map((l) => {
      const tx = l.ex + (l.right ? 16 : -16);
      const anchor = l.right ? 'start' : 'end';
      const lx = tx + (l.right ? 6 : -6);
      return `<g>
        <polyline points="${l.px.toFixed(1)},${l.py.toFixed(1)} ${l.ex.toFixed(1)},${l.ey.toFixed(1)} ${tx.toFixed(1)},${l.ey.toFixed(1)}"
                  fill="none" stroke="${l.color}" stroke-width="1.4" opacity=".85"/>
        <circle cx="${l.px.toFixed(1)}" cy="${l.py.toFixed(1)}" r="2.6" fill="${l.color}"/>
        <text x="${lx.toFixed(1)}" y="${(l.ey - 4).toFixed(1)}" text-anchor="${anchor}"
              class="slice-label${l.isSmall ? ' small' : ''}">${SR.esc(l.name)}</text>
        <text x="${lx.toFixed(1)}" y="${(l.ey + 15).toFixed(1)}" text-anchor="${anchor}"
              class="slice-label small">${l.pct}% · ${l.value}件</text>
      </g>`;
    }).join('');

    svg.setAttribute('viewBox', `0 0 ${o.size} ${o.size}`);
    svg.innerHTML = `<defs>${defs}</defs>
      <circle cx="${cx}" cy="${cy}" r="${o.rOut + 34}" fill="rgba(30,120,220,.05)"/>
      <g>${slices}</g>
      <g>${labels}</g>`;

    return legend;
  };

  /* ---------------- 颜色工具 ---------------- */
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }

  function lighten(hex, k) {
    const [r, g, b] = hexToRgb(hex);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  function darken(hex, k) {
    const [r, g, b] = hexToRgb(hex);
    const f = (v) => Math.round(v * (1 - k));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  /* ---------------- 网络拓扑图 ---------------- */
  SR.topology = function topology(host) {
    const W = 1000;
    const H = 348;

    const icoAt = (name, x, y, size, color, cls) =>
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" class="topo-ico ${cls || ''}"
            fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
            style="color:${color}">${SR.iconBody(name)}</svg>`;

    /** 节点：图标 + 名称 */
    const node = (x, y, w, h, icon, label, opts) => {
      const o = Object.assign({ accent: '#5ad1ff', iconSize: 30, fs: 13, dashed: false }, opts || {});
      const ix = x - o.iconSize / 2;
      const iy = y - o.iconSize / 2 - 8;
      return `<g class="topo-node">
        <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="4"
              fill="rgba(12,48,96,.72)" stroke="${o.accent}" stroke-opacity=".55"
              ${o.dashed ? 'stroke-dasharray="4 3"' : ''} stroke-width="1.2"/>
        <rect x="${x - w / 2 + 1}" y="${y - h / 2 + 1}" width="${w - 2}" height="3" rx="1.5"
              fill="${o.accent}" opacity=".55"/>
        ${icoAt(icon, ix, iy, o.iconSize, o.accent)}
        <text x="${x}" y="${y + h / 2 - 9}" text-anchor="middle" class="topo-node-label"
              style="font-size:${o.fs}px">${SR.esc(label)}</text>
      </g>`;
    };

    const link = (x1, y1, x2, y2, flow) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
             stroke="${flow ? 'rgba(90,215,255,.35)' : 'rgba(70,170,255,.45)'}"
             stroke-width="${flow ? 1.4 : 1.8}" ${flow ? 'stroke-dasharray="3 4"' : ''}/>
       ${flow ? `<line class="topo-flow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>` : ''}`;

    // 节点中心坐标（供连线精准落点）
    const R1 = 66, R2 = 190, R3 = 292;      // 三层中心 y
    const B1 = R1 + 31, T2 = R2 - 29;       // 第一层底边 / 第二层顶边
    const B2 = R2 + 29, T3 = R3 - 28;       // 第二层底边 / 第三层顶边

    const svg = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" fill="none">
      <defs>
        <radialGradient id="topo-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="rgba(50,150,255,.22)"/>
          <stop offset="100%" stop-color="rgba(50,150,255,0)"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#topo-glow)"/>

      <!-- 一、二层之间的横向主干 -->
      ${link(145, R1, 265, R1, true)}
      ${link(415, R1, 515, R1, true)}
      ${link(665, R1, 760, R1, true)}

      <!-- 纵向 / 斜向接入 -->
      ${link(80, B1, 100, T2, true)}
      ${link(340, B1, 300, T2, true)}
      ${link(590, B1, 500, T2, true)}
      ${link(830, B1, 890, T2, false)}
      ${link(165, R2, 235, R2, false)}
      ${link(365, R2, 435, R2, true)}
      ${link(565, R2, 635, R2, true)}
      ${link(765, R2, 825, R2, false)}

      <!-- 现场设备接入 -->
      ${link(300, B2, 240, T3, true)}
      ${link(500, B2, 440, T3, true)}
      ${link(700, B2, 640, T3, true)}
      ${link(890, B2, 860, T3, false)}

      <!-- 第一层：中心与云端 -->
      ${node(80, 66, 130, 62, 'cloud', '云端数据存储', { accent: '#7fd6ff' })}
      ${node(340, 66, 150, 62, 'server', '省中心服务器', { accent: '#5ad1ff' })}
      ${node(590, 66, 150, 62, 'switch', '路段中心交换机', { accent: '#43d9ff' })}
      ${node(830, 66, 140, 62, 'monitor', '监控中心平台', { accent: '#43d9ff' })}

      <!-- 第二层：汇聚与专线 -->
      ${node(100, R2, 130, 58, 'net', 'MPLS网络专线', { accent: '#6fd0ff', fs: 12.5 })}
      ${node(300, R2, 130, 58, 'switch', '收费站汇聚', { accent: '#5ad1ff', fs: 12.5 })}
      ${node(500, R2, 130, 58, 'plc', '隧道控制器', { accent: '#5ad1ff', fs: 12.5 })}
      ${node(700, R2, 130, 58, 'gantry', '门架控制器', { accent: '#5ad1ff', fs: 12.5 })}
      ${node(890, R2, 130, 58, 'server', '服务区汇聚', { accent: '#5ad1ff', fs: 12.5 })}

      <!-- 第三层：现场设备 -->
      ${node(240, R3, 150, 56, 'camera', '收费站车道设备', { accent: '#3fb6ff', fs: 12.5, dashed: true })}
      ${node(440, R3, 150, 56, 'fan', '隧道机电设备', { accent: '#3fb6ff', fs: 12.5, dashed: true })}
      ${node(640, R3, 150, 56, 'signboard', '门架与情报板', { accent: '#3fb6ff', fs: 12.5, dashed: true })}
      ${node(860, R3, 150, 56, 'intercom', '服务区机电设备', { accent: '#3fb6ff', fs: 12.5, dashed: true })}

      <!-- 动态光点 -->
      <circle class="topo-pulse" cx="340" cy="97" r="4" fill="#7fe6ff"/>
      <circle class="topo-pulse" cx="590" cy="97" r="4" fill="#7fe6ff" style="animation-delay:.6s"/>
      <circle class="topo-pulse" cx="500" cy="190" r="4" fill="#7fe6ff" style="animation-delay:1.1s"/>
      <circle class="topo-pulse" cx="700" cy="190" r="4" fill="#7fe6ff" style="animation-delay:1.5s"/>
    </svg>`;

    host.innerHTML = svg;
  };
})(window);

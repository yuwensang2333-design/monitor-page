/* ==========================================================================
   公共工具：大屏缩放 / 星空背景 / 图标库 / 通用格式化
   ========================================================================== */
(function (global) {
  'use strict';

  const SR = global.SR = global.SR || {};

  /* ---------------- 大屏等比缩放 ---------------- */
  SR.fit = function fit() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(w / 1920, h / 1080);
      stage.style.transform = `scale(${scale})`;
      stage.style.left = `${(w - 1920 * scale) / 2}px`;
      stage.style.top = `${(h - 1080 * scale) / 2}px`;
      document.documentElement.style.setProperty('--stage-scale', scale);
    };
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
  };

  /* ---------------- 星空背景 ---------------- */
  SR.starfield = function starfield(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let raf = null;
    let t = 0;

    const seedRandom = (seed) => () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rnd = seedRandom(20261015);
      const count = Math.round((w * h) / 5200);
      stars = [];
      for (let i = 0; i < count; i++) {
        const r = rnd();
        stars.push({
          x: rnd() * w,
          y: rnd() * h,
          r: 0.5 + r * 1.5,
          a: 0.18 + rnd() * 0.65,
          sp: 0.4 + rnd() * 1.6,
          ph: rnd() * Math.PI * 2,
          cyan: rnd() > 0.72
        });
      }
    }

    function draw() {
      t += 0.016;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      for (const s of stars) {
        const tw = 0.65 + 0.35 * Math.sin(t * s.sp + s.ph);
        ctx.beginPath();
        ctx.fillStyle = s.cyan
          ? `rgba(150, 220, 255, ${(s.a * tw).toFixed(3)})`
          : `rgba(215, 235, 255, ${(s.a * tw * 0.85).toFixed(3)})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    build();
    draw();
    window.addEventListener('resize', build);

    // 页面隐藏时暂停动画，节省资源
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        draw();
      }
    });
  };

  /* ---------------- 面板四角装饰 ---------------- */
  SR.decorate = function decorate(root) {
    (root || document).querySelectorAll('.panel:not([data-decorated])').forEach((p) => {
      p.setAttribute('data-decorated', '1');
      ['tl', 'tr', 'bl', 'br'].forEach((pos) => {
        const c = document.createElement('i');
        c.className = `corner ${pos}`;
        p.appendChild(c);
      });
    });
  };

  /* ---------------- 图标库（24 x 24 线性图标） ---------------- */
  const ICONS = {
    switch: '<rect x="2.6" y="8.4" width="18.8" height="7.2" rx="2"/><circle cx="7" cy="12" r=".95"/><circle cx="11.4" cy="12" r=".95"/><circle cx="15.8" cy="12" r=".95"/><path d="M19.6 12h1.2"/><path d="M8 8.4V6.2h8v2.2"/>',
    plc: '<rect x="4" y="4.2" width="16" height="15.6" rx="2"/><rect x="7.4" y="7.6" width="3.4" height="3.4" rx=".8"/><path d="M13.4 7.8h3.2M13.4 10.8h3.2M7.6 14.2h9M7.6 16.8h5.6"/>',
    fire: '<path d="M12 3.2c.4 2.6 4.4 4.9 4.4 8.5A4.4 4.4 0 0 1 12 16.2a4.4 4.4 0 0 1-4.4-4.5c0-1.6.7-2.8 1.6-3.8.3 1 1 1.6 1.9 1.6-.2-2.3.4-4.6.9-6.3z"/><path d="M7 18.8h10"/>',
    broadcast: '<path d="M4 9.8h3.1l4.4-3.3v11l-4.4-3.3H4z"/><path d="M15 8.6a4.6 4.6 0 0 1 0 6.8M17.6 6a8 8 0 0 1 0 12"/>',
    nvr: '<rect x="2.8" y="5.4" width="18.4" height="11.4" rx="1.8"/><circle cx="12" cy="11" r="3"/><path d="M8.8 20.2h6.4M12 16.8v3.4"/>',
    camera: '<path d="M3.4 9.6l11.9-4 1.7 4.7-11.9 4z"/><path d="M6 13.6l-1 4.4 4.3 1 1-3.9"/><path d="M17 8.2l3.2-1 .9 2.7-3.2 1z"/><path d="M8.6 12l1 3.1"/>',
    collect: '<path d="M6.8 17.9a4.1 4.1 0 0 1 .2-8.2 5.3 5.3 0 0 1 10.1-1 4 4 0 0 1-.1 9.2z"/><path d="M8.2 13.6h2l1.2-2 1.6 3.6 1.2-1.6h2"/>',
    signboard: '<rect x="3" y="4.8" width="18" height="10" rx="1.6"/><path d="M6.4 8.8h5M6.4 11.8h9.2M13.8 8.8h3.8"/><path d="M12 14.8v3.4M8.4 20.4l3.6-1.6 3.6 1.6"/>',
    env: '<path d="M10.1 4.4a1.9 1.9 0 0 1 3.8 0v9.1a3.7 3.7 0 1 1-3.8 0z"/><path d="M8 14.8h8"/>',
    firefight: '<path d="M9.6 3.4h4.8v2.6H9.6z"/><path d="M8.4 6h7.2l-1 14.2H9.4z"/><path d="M6 10.6h3.2M14.8 10.6H18"/><path d="M12 2.2v1.2"/><path d="M10.6 11.4h2.8"/>',
    net: '<circle cx="12" cy="12" r="8.1"/><path d="M3.9 12h16.2"/><path d="M12 3.9c2.4 2.4 3.6 5.1 3.6 8.1s-1.2 5.7-3.6 8.1c-2.4-2.4-3.6-5.1-3.6-8.1S9.6 6.3 12 3.9z"/>',
    lane: '<path d="M6.2 20.4L8.4 4.2M17.8 20.4L15.6 4.2"/><path d="M12 5.4v2.4M12 10.4v2.4M12 15.4v2.4"/>',
    gantry: '<path d="M4.4 20.2V6.4M19.6 20.2V6.4M2.6 6.4h18.8"/><rect x="7.6" y="9" width="8.8" height="3.6" rx="1"/><path d="M10.4 16h3.2"/>',
    fan: '<circle cx="12" cy="12" r="1.7"/><path d="M12 10.3c0-2.5.6-4.6-1-5.6-1.5-.9-3.1.4-2.3 2.3.4 1 1.6 1.9 3.3 3.3z"/><path d="M13.7 12c2.5 0 4.6.6 5.6-1 .9-1.5-.4-3.1-2.3-2.3-1 .4-1.9 1.6-3.3 3.3z"/><path d="M12 13.7c0 2.5-.6 4.6 1 5.6 1.5.9 3.1-.4 2.3-2.3-.4-1-1.6-1.9-3.3-3.3z"/><path d="M10.3 12c-2.5 0-4.6-.6-5.6 1-.9 1.5.4 3.1 2.3 2.3 1-.4 1.9-1.6 3.3-3.3z"/>',
    light: '<path d="M5.8 11.6h12.4l-1.8 6H7.6z"/><path d="M12 3v4.2M9.3 4.4l-1 2M14.7 4.4l1 2"/><path d="M9.8 17.6l-1 3.2M14.2 17.6l1 3.2"/>',
    server: '<rect x="3.4" y="4" width="17.2" height="6" rx="1.4"/><rect x="3.4" y="14" width="17.2" height="6" rx="1.4"/><circle cx="7" cy="7" r=".9"/><circle cx="7" cy="17" r=".9"/><path d="M11 7h6.4M11 17h6.4"/>',
    process: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="1.8"/><path d="M3.4 8.6h17.2"/><circle cx="6.6" cy="6.5" r=".8"/><circle cx="9" cy="6.5" r=".8"/><path d="M7.4 12h4.4M7.4 15.4h2.6"/><circle cx="15.6" cy="15.2" r="1.9"/>',
    laneLight: '<rect x="3.4" y="4.8" width="18" height="14.4" rx="1.8"/><path d="M7.6 9.4h3.4M7.6 12h3.4M7.6 14.6h3.4"/><path d="M14.4 9l2.8 3-2.8 3"/>',
    trafficLight: '<rect x="8" y="3.4" width="8" height="14.2" rx="3.2"/><circle cx="12" cy="7.4" r="1.4"/><circle cx="12" cy="12" r="1.4"/><path d="M10 17.6v3.2M14 17.6v3.2"/>',
    roller: '<rect x="3.4" y="4.6" width="17.2" height="9.2" rx="1.4"/><path d="M3.4 9.2h17.2M3.4 12.4h17.2"/><path d="M5.2 13.8v5.8M18.8 13.8v5.8M5.2 19.6h13.6"/>',
    power: '<path d="M13.4 3.4L6.6 13.2h4.7l-1 7.4L17.4 10.8h-4.6z"/>',
    windows: '<rect x="3.4" y="5.4" width="17.2" height="13.2" rx="1.4"/><path d="M12 5.4v13.2M3.4 12h17.2"/>',
    intercom: '<rect x="6.8" y="3.4" width="10.4" height="17.2" rx="2.4"/><path d="M9.8 7.2h4.4M9.8 10.6h4.4"/><circle cx="12" cy="16.4" r="1.5"/>',
    cloud: '<path d="M7 17.6a4 4 0 0 1 .3-7.8 5.4 5.4 0 0 1 10.2-1 3.9 3.9 0 0 1-.2 8.8z"/>',
    monitor: '<rect x="2.8" y="4.8" width="18.4" height="12" rx="1.6"/><path d="M8.6 20.2h6.8M12 16.8v3.4"/>',
    clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.2V12l3.2 2.2"/>',
    bolt: '<path d="M13.2 3.2L6.4 13.4h4.8l-1 7.4 6.8-10.2h-4.8z"/>',
    gauge: '<path d="M4 17.6a8.2 8.2 0 1 1 16 0"/><path d="M12 17.6l4.2-5.4"/><circle cx="12" cy="17.6" r="1.2"/>',
    shield: '<path d="M12 3.4l7 2.8v5.6c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.2z"/><path d="M9 12l2.2 2.2L15.4 10"/>',
    arrowLeft: '<path d="M15 5.4L8.4 12l6.6 6.6"/><circle cx="12" cy="12" r="9.2"/>',
    wave: '<path d="M3.4 14.6c2.6 0 3.4-9 6.4-9s3 12 5.6 12c2 0 2.6-6 5.2-6"/>',
    scan: '<path d="M4 8.6V6.2a2.2 2.2 0 0 1 2.2-2.2H8.6M15.4 4h2.4A2.2 2.2 0 0 1 20 6.2v2.4M20 15.4v2.4a2.2 2.2 0 0 1-2.2 2.2h-2.4M8.6 20H6.2A2.2 2.2 0 0 1 4 17.8v-2.4"/><path d="M4 12h16"/>',
    list: '<path d="M8.4 6.6h11.2M8.4 12h11.2M8.4 17.4h11.2"/><circle cx="4.6" cy="6.6" r="1.1"/><circle cx="4.6" cy="12" r="1.1"/><circle cx="4.6" cy="17.4" r="1.1"/>',
    bell: '<path d="M7.2 10.4a4.8 4.8 0 0 1 9.6 0c0 4 1.6 5.4 1.6 5.4H5.6s1.6-1.4 1.6-5.4z"/><path d="M10.4 18.4a1.8 1.8 0 0 0 3.2 0"/>'
  };

  /**
   * 生成一个 SVG 图标
   * @param {string} name 图标名称
   * @param {string} [cls] 附加 class
   */
  SR.icon = function icon(name, cls) {
    const body = ICONS[name] || ICONS.gauge;
    return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  };

  /** 只取图标内部路径，便于嵌入其它 SVG */
  SR.iconBody = function iconBody(name) {
    return ICONS[name] || ICONS.gauge;
  };

  /* ---------------- 格式化 ---------------- */
  SR.esc = function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  };

  /** 秒 -> HH:MM:SS */
  SR.fmtClock = function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  /** 秒 -> 5小时6分35秒 */
  SR.fmtCn = function fmtCn(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h ? h + '小时' : ''}${m ? m + '分' : (h ? '0分' : '')}${s}秒`;
  };

  /** 数字滚动动画 */
  SR.countTo = function countTo(el, to, opts) {
    const o = opts || {};
    const from = Number(el.dataset.value || o.from || 0);
    const dur = o.duration == null ? 900 : o.duration;
    const decimals = o.decimals || 0;
    const suffix = o.suffix || '';
    if (el._raf) cancelAnimationFrame(el._raf);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * e;
      el.textContent = v.toFixed(decimals) + suffix;
      if (p < 1) {
        el._raf = requestAnimationFrame(step);
      } else {
        el.dataset.value = String(to);
        el._raf = null;
      }
    };
    el._raf = requestAnimationFrame(step);
  };

  SR.flash = function flash(el) {
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  };

  /* ---------------- 时钟 ---------------- */
  SR.startClock = function startClock(clockEl, dateEl) {
    const tick = () => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      if (clockEl) clockEl.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      if (dateEl) dateEl.textContent = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} 星期${week}`;
    };
    tick();
    setInterval(tick, 1000);
  };

  /* ---------------- 页面四角装饰 ---------------- */
  SR.frameCorners = function frameCorners() {
    const html = `<svg viewBox="0 0 132 132" fill="none">
      <path d="M1 60V24C1 11 11 1 24 1h36" stroke="rgba(70,180,255,.45)" stroke-width="2"/>
      <path d="M12 74V30c0-9 7-16 16-16h44" stroke="rgba(70,180,255,.22)" stroke-width="2"/>
      <path d="M62 1h14" stroke="#43d9ff" stroke-width="3"/>
      <path d="M1 62v14" stroke="#43d9ff" stroke-width="3"/>
      <path d="M28 30h60" stroke="rgba(70,180,255,.16)" stroke-width="6" stroke-linecap="square"/>
    </svg>`;
    ['tl', 'tr', 'bl', 'br'].forEach((pos) => {
      const d = document.createElement('div');
      d.className = `frame-corner ${pos}`;
      d.innerHTML = html;
      document.querySelector('.stage').insertBefore(d, document.querySelector('.stage').firstChild);
    });
  };

  /* ---------------- 标题栏两侧装饰线 ---------------- */
  SR.headerWing = function headerWing(side) {
    const flip = side === 'right';
    return `<svg viewBox="0 0 250 62" fill="none" style="${flip ? 'transform:scaleX(-1)' : ''}">
      <path d="M250 30h-96" stroke="rgba(90,200,255,.55)" stroke-width="1.5"/>
      <path d="M250 34h-70" stroke="rgba(90,200,255,.22)" stroke-width="1"/>
      <path d="M150 30l-14-8v16z" fill="rgba(67,217,255,.65)"/>
      <path d="M118 30l-9-5v10z" fill="rgba(67,217,255,.30)"/>
      <path d="M250 22l-30-9M250 42l-30 9" stroke="rgba(90,200,255,.28)" stroke-width="1.2"/>
      <path d="M104 12h9v9h-9zM84 24h7v7h-7z" fill="rgba(70,180,255,.18)" stroke="rgba(70,180,255,.35)"/>
      <path d="M250 14h-46M250 50h-46" stroke="rgba(90,200,255,.16)" stroke-width="1"/>
    </svg>`;
  };
})(window);

// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Welcome screen "screensaver": the Earth turning on its tilted axis, wrapped in the same real NASA
// frames the app plays (air temperature, ocean heat, fires, rain, air quality), one after another.
// Decorative only (aria-hidden). With Reduce Motion it stays still.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const IDS = ['air', 'ocean', 'fire', 'rain', 'smoke'];
  const FRAME = '030.jpg';             // a frame every phenomenon has
  const TURN_MS = 30000;               // one full turn in 30 s
  const SWAP_MS = 9000;                // next phenomenon every 9 s
  const TILT = 23.4 * Math.PI / 180;   // Earth's axial tilt

  let canvas = null, ctx = null, caption = null;
  let size = 0, lut = null, out = null;
  let tex = null, texW = 0, texH = 0, idx = -1, loading = false;
  let rot = 0, last = 0, nextSwap = 0, raf = 0, running = false;
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function loadTexture(i) {
    if (loading) return;
    loading = true;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      texW = c.width = 512; texH = c.height = 256;
      const g = c.getContext('2d');
      g.drawImage(im, 0, 0, texW, texH);
      try { tex = g.getImageData(0, 0, texW, texH).data; idx = i; } catch (e) { /* keep the previous one */ }
      loading = false;
      setCaption();
    };
    im.onerror = () => { loading = false; };
    im.src = 'data/frames/' + IDS[i] + '/' + FRAME;
  }

  function setCaption() {
    if (!caption || idx < 0) return;
    caption.textContent = EBE.i18n.t('tab.' + IDS[idx]) + ' · NASA';
  }

  // For every pixel of the disc: where it falls on the map (u, v) and how bright it is (limb darkening).
  function setup() {
    const css = canvas.clientWidth || 200;
    const n = Math.max(64, Math.min(440, Math.round(css * Math.min(window.devicePixelRatio || 1, 2))));
    if (n === size) return;
    size = n; canvas.width = canvas.height = n;
    out = ctx.createImageData(n, n);
    lut = new Float32Array(n * n * 3);
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const k = (y * n + x) * 3;
        const nx = (x + 0.5) / n * 2 - 1, ny = 1 - (y + 0.5) / n * 2, r2 = nx * nx + ny * ny;
        if (r2 > 1) { lut[k] = -1; continue; }
        const nz = Math.sqrt(1 - r2);
        // Tilt the axis: rotate the view around the screen's left-right axis.
        const y2 = ny * ct + nz * st, z2 = -ny * st + nz * ct;
        const lat = Math.asin(Math.max(-1, Math.min(1, y2))), lon = Math.atan2(nx, z2);
        lut[k] = lon / (2 * Math.PI) + 0.5;
        lut[k + 1] = Math.min(0.9999, Math.max(0, 0.5 - lat / Math.PI));
        lut[k + 2] = 0.38 + 0.62 * Math.pow(nz, 0.6);   // darker towards the edge, like a sphere
      }
    }
  }

  function draw(t) {
    if (!running) return;
    raf = requestAnimationFrame(draw);
    if (t - last < 33) return;                       // about 30 frames per second is enough
    const dt = last ? Math.min(100, t - last) : 0;
    last = t;
    if (!nextSwap) nextSwap = t + SWAP_MS;
    if (t > nextSwap) { nextSwap = t + SWAP_MS; loadTexture((idx + 1) % IDS.length); }
    if (!tex) return;
    if (!reduced()) rot = (rot + dt / TURN_MS) % 1;
    const d = out.data, n2 = size * size;
    for (let k = 0, p = 0; k < n2; k++, p += 4) {
      const u = lut[k * 3];
      if (u < 0) { d[p + 3] = 0; continue; }
      let uu = u - rot;                               // the surface moves west to east
      uu -= Math.floor(uu);
      const q = (((lut[k * 3 + 1] * texH) | 0) * texW + ((uu * texW) | 0)) * 4;
      const s = lut[k * 3 + 2];
      d[p] = tex[q] * s; d[p + 1] = tex[q + 1] * s; d[p + 2] = tex[q + 2] * s; d[p + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }

  function start() {
    if (!canvas) {
      canvas = document.getElementById('globe');
      caption = document.getElementById('globe-cap');
      if (!canvas || !canvas.getContext) return;
      ctx = canvas.getContext('2d');
      window.addEventListener('resize', () => { if (running) setup(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (document.body.classList.contains('choosing')) start(); });
      if (EBE.i18n.onChange) EBE.i18n.onChange(setCaption);
    }
    if (running) return;
    setup();
    if (!tex) loadTexture(0);
    running = true; last = 0; nextSwap = 0;
    raf = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  EBE.globe = { start, stop };
})();

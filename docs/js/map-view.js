// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Map view: real EIC frame image + canvas overlay (glows, flashes, Explore cursor) + geography helpers.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const RAD = Math.PI / 180;

  // ---------- geography ----------
  function haversineKm(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function bearing(lat1, lon1, lat2, lon2) {
    const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
    const x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
    return Math.atan2(y, x); // radians, 0 = north, clockwise
  }
  function dir8(rad) {
    const k = Math.round(((rad / RAD) + 360) % 360 / 45) % 8;
    return EBE.i18n.t('dir.' + ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'][k]);
  }

  // Coarse named regions (first match wins). [lonMin, lonMax, latMin, latMax, en, es]
  const LAND = [
    [-65.2, -61.7, -30.4, -25.6, 'Santiago del Estero, Argentina', 'Santiago del Estero, Argentina'],
    [-66, -57, -28, -18, 'the Gran Chaco', 'el Gran Chaco'],
    [-75, -48, -15, 5, 'the Amazon', 'la Amazonia'],
    [-74, -53, -56, -22, 'Argentina', 'Argentina'],
    [-82, -34, -56, 13, 'South America', 'Sudamérica'],
    [-92, -59, 7, 23, 'Central America and the Caribbean', 'Centroamérica y el Caribe'],
    [-118, -86, 14, 33, 'Mexico', 'México'],
    [-125, -66, 24, 50, 'the United States', 'Estados Unidos'],
    [-170, -129, 51, 72, 'Alaska', 'Alaska'],
    [-141, -52, 42, 84, 'Canada', 'Canadá'],
    [-73, -11, 59, 84, 'Greenland', 'Groenlandia'],
    [-11, 40, 35, 71, 'Europe', 'Europa'],
    [-17, 35, 15, 32, 'the Sahara', 'el Sahara'],
    [-18, 40, 4, 15, 'the Sahel and Central Africa', 'el Sahel y África central'],
    [10, 42, -35, 4, 'southern Africa', 'el sur de África'],
    [-18, 52, -35, 37, 'Africa', 'África'],
    [34, 63, 12, 42, 'the Middle East', 'Medio Oriente'],
    [68, 90, 6, 36, 'India and South Asia', 'India y el sur de Asia'],
    [90, 141, -11, 25, 'Southeast Asia', 'el Sudeste Asiático'],
    [73, 135, 18, 54, 'China and East Asia', 'China y el este de Asia'],
    [60, 180, 50, 78, 'Siberia', 'Siberia'],
    [46, 90, 35, 55, 'Central Asia', 'Asia central'],
    [112, 155, -44, -10, 'Australia', 'Australia']
  ];
  const OCEANS = [
    [-180, 180, -90, -60, 'Antarctica and the Southern Ocean', 'la Antártida y el océano Austral'],
    [-180, 180, 70, 90, 'the Arctic', 'el Ártico'],
    [20, 120, -60, 25, 'the Indian Ocean', 'el océano Índico'],
    [-70, 20, -60, 0, 'the South Atlantic', 'el Atlántico Sur'],
    [-100, 0, 0, 70, 'the North Atlantic', 'el Atlántico Norte'],
    [-180, -70, -60, 0, 'the South Pacific', 'el Pacífico Sur'],
    [120, 180, -60, 0, 'the South Pacific', 'el Pacífico Sur'],
    [-180, 180, 0, 70, 'the North Pacific', 'el Pacífico Norte']
  ];

  function coords(lon, lat) {
    const la = Math.abs(lat).toFixed(0) + '°' + (lat >= 0 ? 'N' : 'S');
    const lo = Math.abs(lon).toFixed(0) + '°' + (lon >= 0 ? 'E' : (EBE.i18n.getLang() === 'es' ? 'O' : 'W'));
    return la + ' ' + lo;
  }

  // "near the Amazon (5°S 60°W)". preferOcean for sea-only data.
  function placeName(lon, lat, preferOcean) {
    const es = EBE.i18n.getLang() === 'es';
    const tables = preferOcean ? [OCEANS, LAND] : [LAND, OCEANS];
    for (const table of tables) {
      for (const r of table) {
        if (lon >= r[0] && lon <= r[1] && lat >= r[2] && lat <= r[3]) {
          return EBE.i18n.t('common.near', { place: es ? r[5] : r[4] }) + ' (' + coords(lon, lat) + ')';
        }
      }
    }
    return coords(lon, lat);
  }

  EBE.geo = { haversineKm, bearing, dir8, placeName, coords };

  // ---------- map view ----------
  function MapView(root, opts) {
    this.opts = opts || {};
    this.root = root;
    this.points = null;
    this.flashes = [];
    this.cursor = { lon: -63.5, lat: -27.8, show: false, radiusKm: 0 };
    this.interactive = false;

    const frame = document.createElement('div');
    frame.className = 'map';
    this.img = document.createElement('img');
    this.img.className = 'map-img';
    this.img.alt = '';
    this.img.decoding = 'async';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'map-overlay';
    this.canvas.setAttribute('aria-hidden', 'true');
    frame.appendChild(this.img); frame.appendChild(this.canvas);
    root.appendChild(frame);
    this.frame = frame;
    this.ctx = this.canvas.getContext('2d');
    this.layer = document.createElement('canvas');

    const onPointer = e => {
      if (!this.interactive) return;
      const r = this.frame.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 0, r.width), y = clamp(e.clientY - r.top, 0, r.height);
      const lon = x / r.width * 360 - 180, lat = 90 - y / r.height * 180;
      if (this.opts.onPointer) this.opts.onPointer(lon, lat, e.type);
    };
    frame.addEventListener('pointerdown', e => { if (this.interactive) { frame.setPointerCapture(e.pointerId); onPointer(e); } });
    frame.addEventListener('pointermove', e => { if (this.interactive && (e.buttons || e.pointerType === 'mouse')) onPointer(e); });

    if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(frame);
    window.addEventListener('resize', () => this.resize());
    this.resize();
    const loop = () => { if (this.frame.offsetParent !== null) this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  MapView.prototype.resize = function () {
    const r = this.frame.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height); this.dpr = dpr;
    [this.canvas, this.layer].forEach(c => { c.width = Math.round(this.w * dpr); c.height = Math.round(this.h * dpr); });
    this.renderLayer();
  };

  MapView.prototype.toXY = function (lon, lat) { return [(lon + 180) / 360 * this.w, (90 - lat) / 180 * this.h]; };

  MapView.prototype.setImage = function (src, alt) {
    if (src) { this.frame.classList.remove('no-image'); if (this.img.getAttribute('src') !== src) this.img.src = src; }
    else { this.frame.classList.add('no-image'); this.img.removeAttribute('src'); }
    this.img.alt = alt || '';
  };

  MapView.prototype.setInteractive = function (on) {
    this.interactive = !!on;
    this.frame.classList.toggle('interactive', !!on);
  };

  MapView.prototype.setPoints = function (points) { this.points = points; this.renderLayer(); };

  MapView.prototype.flash = function (lon, lat, intensity) {
    if (EBE.a11y.reducedMotion()) return;
    this.flashes.push({ lon, lat, i: intensity, t: performance.now() });
    if (this.flashes.length > 120) this.flashes.shift();
  };

  MapView.prototype.setCursor = function (lon, lat, show, radiusKm) {
    this.cursor = { lon, lat, show: !!show, radiusKm: radiusKm || 0 };
  };

  // Static layer: graticule when there is no image, then the point glows.
  MapView.prototype.renderLayer = function () {
    const c = this.layer.getContext('2d'), dpr = this.dpr || 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    if (this.frame.classList.contains('no-image')) {
      c.strokeStyle = 'rgba(160,190,230,0.18)'; c.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) { const [x] = this.toXY(lon, 0); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, this.h); c.stroke(); }
      for (let lat = -90; lat <= 90; lat += 30) { const [, y] = this.toXY(0, lat); c.beginPath(); c.moveTo(0, y); c.lineTo(this.w, y); c.stroke(); }
    }
    if (!this.points) return;
    const scale = this.w / 1024;
    c.globalCompositeOperation = 'lighter';
    for (const p of this.points) {
      const [x, y] = this.toXY(p[0], p[1]);
      const r = (1.4 + 3.2 * p[2]) * Math.max(0.7, scale);
      const g = c.createRadialGradient(x, y, 0, x, y, r * 2.2);
      g.addColorStop(0, p[2] > 0.66 ? 'rgba(255,250,230,0.95)' : 'rgba(255,214,120,0.9)');
      g.addColorStop(0.35, 'rgba(255,140,40,0.6)');
      g.addColorStop(1, 'rgba(255,60,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.2, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  };

  MapView.prototype.draw = function () {
    const c = this.ctx, dpr = this.dpr || 1;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this.layer, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = performance.now();
    this.flashes = this.flashes.filter(f => now - f.t < 700);
    for (const f of this.flashes) {
      const age = (now - f.t) / 700, [x, y] = this.toXY(f.lon, f.lat);
      c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - age)).toFixed(3) + ')';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y, 3 + 14 * age * (0.5 + f.i), 0, Math.PI * 2); c.stroke();
    }
    if (this.cursor.show) {
      const [x, y] = this.toXY(this.cursor.lon, this.cursor.lat);
      if (this.cursor.radiusKm) {
        const ry = this.cursor.radiusKm / 111 / 180 * this.h;
        const rx = ry / Math.max(0.2, Math.cos(this.cursor.lat * RAD));
        c.strokeStyle = 'rgba(120,220,255,0.55)'; c.setLineDash([4, 4]); c.lineWidth = 1;
        c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      }
      c.strokeStyle = '#7fe0ff'; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x - 15, y); c.lineTo(x - 5, y); c.moveTo(x + 5, y); c.lineTo(x + 15, y);
      c.moveTo(x, y - 15); c.lineTo(x, y - 5); c.moveTo(x, y + 5); c.lineTo(x, y + 15); c.stroke();
    }
  };

  EBE.MapView = MapView;
})();

// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// One generic tab for any phenomenon: real frame + timeline + Listen + Explore, for points and fields.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const t = (k, p) => EBE.i18n.t(k, p);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const noCoords = s => s.replace(/\s*\([^)]*°[^)]*\)/g, '');   // spoken text: no coordinates
  // Spoken text in blind mode: no coordinates, units in words, no symbols.
  const speakable = s => noCoords(s).replace(/°C/g, t('unit.c')).replace(/mm\/h/g, t('unit.mmh'))
    .replace(/µg\/m³/g, t('unit.ugm3')).replace(/(\d)\s*%/g, '$1 ' + t('unit.percent')).replace(/\s·\s/g, ', ');
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

  function levelKey(rank) {
    if (rank < 0.25) return 'level.low';
    if (rank < 0.75) return 'level.normal';
    if (rank < 0.9) return 'level.high';
    return 'level.veryHigh';
  }

  // Globe or flat map: one choice for every topic, remembered on this device. Blind mode always uses
  // the flat map, which keeps the whole world under the finger.
  let viewPref = 'globe';
  try { viewPref = localStorage.getItem('ebe.view') || 'globe'; } catch (e) { /* ignore */ }
  const instances = [];

  function PhenomenonTab(cfg, panel) {
    this.cfg = cfg; this.id = cfg.id; this.panel = panel;
    this.ds = null; this.k = 0; this.mode = 'listen'; this.playing = false; this.speed = 1;
    this.cursor = { lon: -63.5, lat: -27.8 };
    this.near = null; this.lastReadout = 0;
    this.inst = null; this.built = false; this.active = false;
    instances.push(this);
  }
  const P = PhenomenonTab.prototype;

  P.build = function () {
    const id = this.id;
    this.panel.innerHTML = `
      <div class="ph-head">
        <h2 id="h-${id}" data-i18n="${id}.name"></h2>
        <span class="badge" data-el="badge"></span>
      </div>
      <p class="lead" data-i18n="${id}.lead"></p>
      <p class="status" data-el="status" role="status"></p>
      <div class="ph-grid">
        <div class="ph-main">
          <div class="viewbar">
            <div class="seg" role="group" data-i18n-aria="view.label">
              <button type="button" class="btn seg-btn" data-el="vGlobe" aria-pressed="false">${EBE.icon('globe')} <span data-i18n="view.globe"></span></button>
              <button type="button" class="btn seg-btn" data-el="vFlat" aria-pressed="false">${EBE.icon('map')} <span data-i18n="view.flat"></span></button>
            </div>
            <div class="turns">
              <button type="button" class="btn icon" data-el="turnW" data-i18n-aria="view.turnW">${EBE.icon('turn-w')}</button>
              <button type="button" class="btn icon" data-el="turnE" data-i18n-aria="view.turnE">${EBE.icon('turn-e')}</button>
            </div>
          </div>
          <figure class="map-figure">
            <div class="map-wrap" data-el="map" tabindex="0" role="application" data-i18n-aria="common.mapLabel"></div>
            <div class="hud" aria-hidden="true">
              <div class="hud-col hud-l">
                <p class="hud-date" data-el="hDate"></p>
                <p class="hud-big" data-el="hBig"></p>
                <p class="hud-label" data-el="hBigLabel"></p>
                <p class="hud-level"><span data-el="hLevel"></span><span class="hud-bar"><i data-el="hBar"></i></span></p>
                <dl class="hud-stats" data-el="hStats"></dl>
              </div>
              <div class="hud-col hud-r">
                <p class="hud-title" data-el="hTrendTitle"></p>
                <svg class="spark" data-el="hSpark" viewBox="0 0 240 90"></svg>
                <p class="hud-axis"><span data-el="hFirst"></span><span data-el="hLast"></span></p>
                <p class="hud-title" data-i18n="hud.hear"></p>
                <p class="hud-text" data-i18n="${id}.instrument"></p>
                <p class="hud-text hud-muted" data-i18n="hud.rule"></p>
              </div>
            </div>
            <figcaption class="sr-only" data-el="alt"></figcaption>
          </figure>
          <p class="globe-hint" data-i18n="view.hint"></p>
          <div class="blind-bar">
            <button type="button" class="btn big" data-el="bWhere">${EBE.icon('replay')} <span data-i18n="blind.where"></span></button>
            <button type="button" class="btn big" data-el="bDetails">${EBE.icon('info')} <span data-i18n="details.btn"></span></button>
            <button type="button" class="btn big wide" data-el="bPlay"><span data-el="bPlayIcon">${EBE.icon('play')}</span> <span data-el="bPlayLabel"></span></button>
            <div class="pad-area">
              <div class="pad" role="group" data-i18n-aria="pad.label">
                <button type="button" class="btn pad-btn pad-left" data-dir="left" data-i18n-aria="pad.left">${EBE.icon('left')}</button>
                <button type="button" class="btn pad-btn pad-up" data-dir="up" data-i18n-aria="pad.up">${EBE.icon('up')}</button>
                <button type="button" class="btn pad-btn pad-down" data-dir="down" data-i18n-aria="pad.down">${EBE.icon('down')}</button>
                <button type="button" class="btn pad-btn pad-right" data-dir="right" data-i18n-aria="pad.right">${EBE.icon('right')}</button>
              </div>
              <button type="button" class="btn big speed-btn" data-el="bSpeed">${EBE.icon('speed')} <span data-el="bSpeedLabel"></span></button>
            </div>
          </div>
        </div>
        <div class="ph-side">
          <div class="ph-controls">
            <div class="timeline" role="group" data-i18n-aria="common.timeline">
              <button type="button" class="btn icon" data-el="prev" data-i18n-aria="common.prev">${EBE.icon('prev')}</button>
              <button type="button" class="btn icon primary" data-el="play"><span data-el="playIcon">${EBE.icon('play')}</span></button>
              <button type="button" class="btn icon" data-el="next" data-i18n-aria="common.next">${EBE.icon('next')}</button>
              <input type="range" class="slider" data-el="slider" min="0" max="0" value="0" step="1" data-i18n-aria="common.timeline">
              <label class="speed"><span data-i18n="common.speed"></span>
                <select data-el="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
              </label>
              <output class="date" data-el="date"></output>
            </div>
            <div class="modes" role="group" data-i18n-aria="common.mode">
              <button type="button" class="btn mode" data-el="mListen" aria-pressed="true" data-i18n="common.listen"></button>
              <button type="button" class="btn mode" data-el="mExplore" aria-pressed="false" data-i18n="common.explore"></button>
            </div>
            <p class="help" data-el="help"></p>
            <p class="readout" data-el="readout" aria-live="polite"></p>
            <p class="keys" data-i18n="common.keys"></p>
          </div>
          <div class="ph-data">
          <h3 data-i18n="common.data"></h3>
          <dl class="stats" data-el="stats"></dl>
          <p class="level" data-el="level"></p>
          <p class="desc" data-el="desc"></p>
          <details class="how" open>
            <summary data-i18n="common.howItSounds"></summary>
            <table>
              <thead><tr><th scope="col" data-i18n="common.dataCol"></th><th scope="col" data-i18n="common.soundCol"></th></tr></thead>
              <tbody>
                <tr><th scope="row" data-i18n="sound.identity"></th><td data-i18n="${id}.instrument"></td></tr>
                <tr><th scope="row" data-i18n="sound.intensity"></th><td data-i18n="sound.intensityText"></td></tr>
                <tr><th scope="row" data-i18n="sound.space"></th><td data-i18n="sound.spaceText"></td></tr>
                <tr><th scope="row" data-i18n="sound.northSouth"></th><td data-i18n="sound.northSouthText"></td></tr>
                <tr><th scope="row" data-i18n="sound.alert"></th><td data-i18n="sound.alertText"></td></tr>
              </tbody>
            </table>
          </details>
          <p class="credit"><span data-i18n="common.source"></span>: <span data-i18n="${id}.credit"></span></p>
          </div>
        </div>
      </div>`;
    this.el = {};
    this.panel.querySelectorAll('[data-el]').forEach(e => { this.el[e.dataset.el] = e; });
    this.updatePlayButton();
    this.map = new EBE.MapView(this.el.map, {
      onPointer: (lon, lat) => this.moveCursor(lon, lat, true),
      onPointerEnd: () => this.onPointerEnd()
    });
    this.applyView();
    this.map.setAutoSpin(this.mode === 'listen');
    this.bind();
    EBE.i18n.apply(this.panel);
    this.built = true;
  };

  P.bind = function () {
    const el = this.el;
    el.play.addEventListener('click', () => { this.playing ? this.pause() : this.play(); });
    el.prev.addEventListener('click', () => { this.pause(true); this.setFrame(this.k - 1, true); });
    el.next.addEventListener('click', () => { this.pause(true); this.setFrame(this.k + 1, true); });
    el.slider.addEventListener('input', () => { this.pause(true); this.setFrame(+el.slider.value, true); });
    el.speed.addEventListener('change', () => { this.speed = +el.speed.value; });
    el.mListen.addEventListener('click', () => this.setMode('listen'));
    el.mExplore.addEventListener('click', () => this.setMode('explore'));
    el.bPlay.addEventListener('click', () => { this.playing ? this.pause() : this.play(); });
    el.bWhere.addEventListener('click', () => this.describe());
    el.bDetails.addEventListener('click', () => this.details());
    el.vGlobe.addEventListener('click', () => setViewPref('globe'));
    el.vFlat.addEventListener('click', () => setViewPref('flat'));
    el.turnW.addEventListener('click', () => this.map.turn(-40));
    el.turnE.addEventListener('click', () => this.map.turn(40));
    this.bindPad();
    this.panel.addEventListener('keydown', e => this.onKey(e));
  };

  P.onKey = function (e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const isButton = tag === 'button' || tag === 'summary';
    const step = EBE.config.sound.cursorStepDeg * (e.shiftKey ? 3 : 1);
    switch (e.key) {
      case ' ':
        if (isButton) return;
        e.preventDefault(); this.playing ? this.pause() : this.play(); break;
      case 'Enter':
        if (isButton) return;
        e.preventDefault(); this.describe(); break;
      case 'd': case 'D':
        e.preventDefault(); this.details(); break;
      case 'm': case 'M':
        e.preventDefault(); this.setMode(this.mode === 'listen' ? 'explore' : 'listen'); break;
      case 'ArrowLeft':
        e.preventDefault();
        if (this.mode === 'explore') this.moveCursor(this.cursor.lon - step, this.cursor.lat, false);
        else { this.pause(true); this.setFrame(this.k - 1, true); }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (this.mode === 'explore') this.moveCursor(this.cursor.lon + step, this.cursor.lat, false);
        else { this.pause(true); this.setFrame(this.k + 1, true); }
        break;
      case 'ArrowUp':
        if (this.mode !== 'explore') return;
        e.preventDefault(); this.moveCursor(this.cursor.lon, this.cursor.lat + step, false); break;
      case 'ArrowDown':
        if (this.mode !== 'explore') return;
        e.preventDefault(); this.moveCursor(this.cursor.lon, this.cursor.lat - step, false); break;
      default:
    }
  };

  // ---------- lifecycle ----------
  P.activate = function () {
    if (!this.built) this.build();
    this.active = true;
    this.updateSpeedLabel();
    this.applyView();
    if (this.ds) { this.blindExplore(); this.render(); this.startScene(); return; }
    this.el.status.textContent = t('common.loading');
    EBE.data.load(this.id).then(ds => {
      this.ds = ds;
      this.inst = EBE.instruments.create(this.cfg.instrument);
      this.el.status.textContent = '';
      this.el.slider.max = String(ds.frames.length - 1);
      this.k = ds.frames.length - 1;   // start on the most recent frame
      if (this.active) this.blindExplore();
      this.render();
      if (this.active) { this.startScene(); if (EBE.relayout) EBE.relayout(); }
    }).catch(err => {
      console.error(err);
      if (!this.ds) this.el.status.textContent = t('common.loadError');
    });
  };

  P.deactivate = function () {
    this.active = false;
    this.pause(true);
    EBE.audio.setScene(null);
  };

  P.onLangChange = function () {
    if (!this.built) return;
    EBE.i18n.apply(this.panel);
    this.updateSpeedLabel();
    if (this.ds) this.render();
  };

  // ---------- frames ----------
  P.frame = function () { return this.ds.frames[this.k]; };

  P.setFrame = function (k, announce) {
    if (!this.ds) return;
    const n = this.ds.frames.length;
    this.k = ((k % n) + n) % n;
    if (this.mode === 'explore') this.updateNear();
    this.render();
    if (announce) EBE.a11y.announce(this.describeText());
  };

  P.play = function () {
    if (!this.ds) return;
    EBE.audio.autoEnable();
    if (this.mode !== 'listen') this.setMode('listen');
    this.playing = true;
    this.updatePlayButton();
    this.el.desc.setAttribute('aria-live', 'off');
    const stepMs = () => EBE.config.sound.frameSeconds * 1000 / this.speed;
    const tick = () => {
      if (!this.playing) return;
      this.setFrame(this.k + 1, false);
      this.timer = setTimeout(tick, stepMs());
    };
    clearTimeout(this.timer);
    this.timer = setTimeout(tick, stepMs());
    this.startScene();
  };

  P.pause = function (silent) {
    const was = this.playing;
    this.playing = false;
    clearTimeout(this.timer);
    if (this.el) { this.updatePlayButton(); this.el.desc.setAttribute('aria-live', 'polite'); }
    if (was && !silent) EBE.a11y.announce(this.describeText());
  };

  P.updatePlayButton = function () {
    const label = this.playing ? t('common.pause') : t('common.play');
    this.el.play.setAttribute('aria-label', label);
    this.el.play.setAttribute('aria-pressed', this.playing ? 'true' : 'false');
    this.el.playIcon.innerHTML = EBE.icon(this.playing ? 'pause' : 'play');
    this.el.bPlayIcon.innerHTML = EBE.icon(this.playing ? 'pause' : 'play');
    this.el.bPlayLabel.textContent = t(this.playing ? 'blind.pause' : 'blind.play');
  };

  // In blind mode every phenomenon opens in Explore (quietly: the mode intro already explains it).
  P.blindExplore = function () {
    if (EBE.a11y.isBlind() && this.mode !== 'explore') this.setMode('explore', true);
  };

  P.setMode = function (mode, quiet) {
    if (this.mode === mode) return;
    // Explore only makes sense with sound: switching to it is a user gesture, so sound can start here.
    if (mode === 'explore') EBE.audio.autoEnable();
    this.mode = mode;
    if (mode === 'explore') this.pause(true);
    this.el.mListen.setAttribute('aria-pressed', mode === 'listen' ? 'true' : 'false');
    this.el.mExplore.setAttribute('aria-pressed', mode === 'explore' ? 'true' : 'false');
    this.map.setInteractive(mode === 'explore');
    this.map.setAutoSpin(mode === 'listen');
    if (mode === 'explore') this.updateNear();
    this.render();
    if (quiet) { this.startScene(); return; }
    if (mode === 'explore') this.el.map.focus();
    this.startScene();
    EBE.a11y.announce(t(mode === 'listen' ? 'common.listenHelp' : 'common.exploreHelp'));
  };

  // ---------- text ----------
  P.fmtValue = function (v) {
    const c = this.cfg, units = this.ds.units;
    if (units === 'relative') return EBE.i18n.num(100 * v, 0) + '%';
    const d = c.decimals || 0;
    // Small values on log scales (rain, PM2.5) need one more decimal.
    const digits = this.ds.scale === 'log' && Math.abs(v) < 1 ? Math.max(d, 1) : d;
    return (c.signed && v > 0 ? '+' : '') + EBE.i18n.num(v, digits) + ' ' + units;
  };
  P.fmtShare = function (x) { return EBE.i18n.num(100 * x, 0) + '%'; };

  P.statValue = function (key, s) {
    switch (key) {
      case 'count': return EBE.i18n.num(s.count, 0);
      case 'meanIntensity': {
        const [v0, v1] = this.ds.value_range; return this.fmtValue(v0 + s.meanIntensity * (v1 - v0));
      }
      case 'mean': return this.fmtValue(s.mean);
      case 'meanWhere': return this.fmtValue(s.meanWhere);
      case 'shareAbove': return this.fmtShare(s.shareAbove);
      case 'maxPlace':
        if (!s.max) return '—';
        if (this.ds.type === 'points') return EBE.geo.placeName(s.max.lon, s.max.lat, this.ds.type === 'points');
        return this.fmtValue(s.max.value) + ', ' + EBE.geo.placeName(s.max.lon, s.max.lat, this.ds.type === 'points');
      default: return '';
    }
  };

  P.describeText = function () {
    if (!this.ds) return '';
    const fr = this.frame(), s = fr.summary;
    return t(this.id + '.desc', {
      date: EBE.i18n.date(fr.t),
      count: s.count !== undefined ? EBE.i18n.num(s.count, 0) : '',
      level: t(levelKey(fr.rank)),
      place: s.max ? EBE.geo.placeName(s.max.lon, s.max.lat, this.ds.type === 'points') : '—',
      mean: s.mean !== undefined ? this.fmtValue(s.mean) : '',
      share: s.shareAbove !== undefined ? this.fmtShare(s.shareAbove) : '',
      max: s.max ? this.fmtValue(s.max.value) : ''
    });
  };

  P.render = function () {
    if (!this.ds) return;
    const ds = this.ds, fr = this.frame(), el = this.el, n = ds.frames.length;
    el.badge.textContent = ds.simulated ? t('common.simulated') : t('common.real');
    el.badge.classList.toggle('sim', !!ds.simulated);
    el.slider.value = String(this.k);
    el.slider.setAttribute('aria-valuetext', EBE.i18n.date(fr.t) + ' · ' + t('common.frameOf', { n: this.k + 1, total: n }));
    el.date.textContent = EBE.i18n.date(fr.t);
    this.updatePlayButton();
    el.stats.innerHTML = '';
    this.cfg.stats.forEach(([key, label]) => {
      const dt = document.createElement('dt'); dt.textContent = t(this.id + '.stat.' + label);
      const dd = document.createElement('dd'); dd.textContent = this.statValue(key, fr.summary);
      el.stats.appendChild(dt); el.stats.appendChild(dd);
    });
    const lk = levelKey(fr.rank);
    el.level.textContent = t('common.level') + ': ' + t(lk);
    el.level.dataset.level = lk.split('.')[1];
    this.updateHud();
    const text = this.describeText();
    el.desc.textContent = text;
    el.alt.textContent = text;
    this.map.setImage(fr.image || null, text);
    this.map.setPoints(ds.type === 'points' ? fr.points : null);
    this.map.setCursor(this.cursor.lon, this.cursor.lat, this.mode === 'explore', ds.type === 'points' ? EBE.config.sound.exploreRadiusKm : 0);
    el.help.textContent = t(this.mode === 'listen' ? 'common.listenHelp' : 'common.exploreHelp') +
      (EBE.a11y.isBlind() && this.mode === 'explore' ? ' ' + t('mode.srTip') : '');
    // Preload the next image.
    const next = ds.frames[(this.k + 1) % n];
    if (next.image) { const im = new Image(); im.src = next.image; }
    if (this.mode === 'explore') this.updateReadout(true);
    else el.readout.textContent = '';
  };

  // ---------- Numbers beside the globe (wide screens) ----------
  // The same numbers as the side column, big enough to read from a few metres, plus the trend of the
  // main number over every date of the period, with the current date marked.
  const NUMERIC = { count: s => s.count, mean: s => s.mean, shareAbove: s => s.shareAbove, meanWhere: s => s.meanWhere, meanIntensity: s => s.meanIntensity };
  P.updateHud = function () {
    const el = this.el, ds = this.ds, fr = this.frame(), stats = this.cfg.stats, n = ds.frames.length;
    const [key0, label0] = stats[0];
    el.hDate.textContent = EBE.i18n.date(fr.t);
    el.hBig.textContent = this.statValue(key0, fr.summary);
    el.hBigLabel.textContent = t(this.id + '.stat.' + label0);
    el.hLevel.textContent = t('common.level') + ': ' + t(levelKey(fr.rank));
    el.hBar.style.width = Math.round(6 + 94 * fr.rank) + '%';
    el.hStats.innerHTML = '';
    stats.slice(1).forEach(([key, label]) => {
      const dt = document.createElement('dt'); dt.textContent = t(this.id + '.stat.' + label);
      const dd = document.createElement('dd'); dd.textContent = this.statValue(key, fr.summary);
      el.hStats.appendChild(dt); el.hStats.appendChild(dd);
    });
    const get = NUMERIC[key0];
    if (!get) return;
    if (!this.series) {
      const v = ds.frames.map(f => get(f.summary) || 0);
      const lo = Math.min(...v), hi = Math.max(...v), span = (hi - lo) || 1;
      const pts = v.map((x, i) => [6 + i / Math.max(1, n - 1) * 228, 82 - (x - lo) / span * 72]);
      this.series = { lo, hi, pts };
      const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      el.hSpark.innerHTML = '<polygon class="spark-area" points="6,84 ' + line + ' 234,84"/><polyline class="spark-line" points="' + line + '"/>' +
        '<line class="spark-now-line" x1="0" y1="4" x2="0" y2="84"/><circle class="spark-now" r="4.5"/>';
    }
    const p = this.series.pts[this.k];
    const nowLine = el.hSpark.querySelector('.spark-now-line'), dot = el.hSpark.querySelector('.spark-now');
    nowLine.setAttribute('x1', p[0]); nowLine.setAttribute('x2', p[0]);
    dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]);
    const fake = x => { const s = {}; s[key0] = x; return s; };
    el.hTrendTitle.textContent = t('hud.trend', { n, lo: this.statValue(key0, fake(this.series.lo)), hi: this.statValue(key0, fake(this.series.hi)) });
    el.hFirst.textContent = EBE.i18n.date(ds.frames[0].t).split(',').slice(0, 2).join(',');
    el.hLast.textContent = EBE.i18n.date(ds.frames[n - 1].t).split(',').slice(0, 2).join(',');
  };

  // ---------- Globe or flat map ----------
  function setViewPref(v) {
    viewPref = v === 'flat' ? 'flat' : 'globe';
    try { localStorage.setItem('ebe.view', viewPref); } catch (e) { /* ignore */ }
    instances.forEach(x => x.applyView());
    EBE.a11y.announce(t(viewPref === 'globe' ? 'view.globeOn' : 'view.flatOn'));
  }
  P.applyView = function () {
    if (!this.built) return;
    const v = EBE.a11y.isBlind() ? 'flat' : viewPref;
    this.map.setView(v);
    this.panel.classList.toggle('is-globe', v === 'globe');
    this.el.vGlobe.setAttribute('aria-pressed', v === 'globe' ? 'true' : 'false');
    this.el.vFlat.setAttribute('aria-pressed', v === 'flat' ? 'true' : 'false');
    if (this.active && EBE.relayout) EBE.relayout();
  };

  // ---------- Cursor pad (big screens, blind mode) ----------
  // On a museum wall the map is too big to sweep with one hand, so four arrows move the cursor.
  // A tap moves one step; holding an arrow keeps moving at the chosen speed. On release the voice
  // says where the cursor is, as when lifting the finger from the map.
  const PAD_SPEEDS = [{ key: 'slow', deg: 1 }, { key: 'normal', deg: 3 }, { key: 'fast', deg: 8 }];
  const PAD_DIRS = { left: [-1, 0], right: [1, 0], up: [0, 1], down: [0, -1] };
  let padSpeed = 1;                     // shared by every topic

  P.bindPad = function () {
    let delay = 0, timer = 0, held = false;
    const step = dir => {
      const d = PAD_DIRS[dir], s = PAD_SPEEDS[padSpeed].deg;
      this.moveCursor(this.cursor.lon + d[0] * s, this.cursor.lat + d[1] * s, true);
    };
    const stop = () => {
      if (!delay && !timer) return;
      clearTimeout(delay); clearInterval(timer); delay = timer = 0;
      this.panel.ownerDocument.querySelectorAll('.pad-btn.held').forEach(x => x.classList.remove('held'));
      this.onPointerEnd();
    };
    this.panel.querySelectorAll('.pad-btn').forEach(b => {
      b.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        e.preventDefault(); held = true;
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        stop(); b.classList.add('held'); step(b.dataset.dir);
        delay = setTimeout(() => { timer = setInterval(() => step(b.dataset.dir), 140); }, 380);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, stop));
      // Keyboard, switch access and screen readers send a click without a pointer press: one step.
      b.addEventListener('click', () => {
        if (held) { held = false; return; }
        step(b.dataset.dir); this.onPointerEnd();
      });
    });
    this.el.bSpeed.addEventListener('click', () => {
      padSpeed = (padSpeed + 1) % PAD_SPEEDS.length;
      this.updateSpeedLabel();
      const text = t('pad.speedSay', { speed: t('pad.' + PAD_SPEEDS[padSpeed].key) });
      EBE.a11y.announce(text);
      if (!EBE.a11y.readAloud()) EBE.a11y.speak(text);
    });
    this.updateSpeedLabel();
  };

  P.updateSpeedLabel = function () {
    if (!this.el || !this.el.bSpeedLabel) return;
    this.el.bSpeedLabel.textContent = t('pad.speed', { speed: t('pad.' + PAD_SPEEDS[padSpeed].key) });
  };

  // ---------- Explore ----------
  P.moveCursor = function (lon, lat, fromPointer) {
    if (this.mode !== 'explore') this.setMode('explore');
    EBE.audio.autoEnable();
    let lo = lon; if (lo > 180) lo -= 360; if (lo < -180) lo += 360;
    this.cursor = { lon: lo, lat: clamp(lat, -89, 89) };
    this.map.setCursor(this.cursor.lon, this.cursor.lat, true, this.ds && this.ds.type === 'points' ? EBE.config.sound.exploreRadiusKm : 0, !fromPointer);
    this.updateNear();
    this.updateReadout(!fromPointer);
    if (EBE.a11y.isBlind()) this.sayRegion();
  };

  // Blind mode: say the continent or ocean when the finger enters a new one. The name must hold for
  // a moment, so a quick swipe across a coast does not make the voice stutter.
  P.sayRegion = function () {
    const key = EBE.geo.regionKey(this.cursor.lon, this.cursor.lat);
    if (key === this.pendingRegion) return;            // same new place: keep waiting
    clearTimeout(this.regionTimer);
    this.pendingRegion = key;
    if (key === this.lastRegion) return;
    this.regionTimer = setTimeout(() => {
      this.pendingRegion = null;
      if (!this.active || this.mode !== 'explore' || key === this.lastRegion) return;
      this.lastRegion = key;
      EBE.a11y.speak(t('region.' + key), null, { light: true });
    }, 250);
  };

  // Blind mode: lifting the finger says the value and the place in full (without coordinates).
  P.onPointerEnd = function () {
    if (!EBE.a11y.isBlind() || this.mode !== 'explore' || !this.ds) return;
    clearTimeout(this.regionTimer); this.pendingRegion = null;
    this.lastRegion = EBE.geo.regionKey(this.cursor.lon, this.cursor.lat);
    const region = t('region.' + this.lastRegion);
    const text = speakable(this.readoutText());
    EBE.a11y.speak(text.includes(region) ? text : region + '. ' + text);
  };

  P.updateNear = function () {
    if (!this.ds) return;
    const c = this.cursor, ds = this.ds, fr = this.frame();
    if (ds.type === 'points') {
      const R = EBE.config.sound.exploreRadiusKm;
      let best = null, bd = Infinity, S = 0; const list = [], w = [];
      for (const p of fr.points) {
        if (Math.abs(p[1] - c.lat) > 25 && bd < 3000) continue;
        const d = EBE.geo.haversineKm(c.lat, c.lon, p[1], p[0]);
        if (d < bd) { bd = d; best = p; }
        if (d < R) { const x = Math.pow(1 - d / R, 2) * (0.3 + 0.7 * p[2]); S += x; list.push({ p, d }); w.push(x); }
      }
      this.near = { best, d: bd, S, list, cum: EBE.data.cumulative(w), b: best ? EBE.geo.bearing(c.lat, c.lon, best[1], best[0]) : 0 };
    } else {
      const v = EBE.data.valueAt(ds, fr, c.lon, c.lat);
      this.near = { value: v, intensity: v === null ? 0 : ds.intensityOf(v) };
    }
  };

  P.readoutText = function () {
    const c = this.cursor, near = this.near, ds = this.ds;
    if (!near) return '';
    const place = EBE.geo.placeName(c.lon, c.lat);
    if (ds.type === 'points') {
      const R = EBE.config.sound.exploreRadiusKm;
      if (!near.best) return t('fire.exploreNone');
      if (near.d < 40) return t('fire.exploreOn', { place, count: EBE.i18n.num(near.list.length), km: R });
      return t('fire.exploreNear', { count: EBE.i18n.num(near.list.length), km: R, dist: EBE.i18n.num(near.d), dir: EBE.geo.dir8(near.b) }) + ' ' + t('common.cursorAt', { place });
    }
    if (near.value === null) return t('common.noData') + ' · ' + place;
    if (this.isDry()) return t(this.id + '.none') + ' · ' + place;
    return this.fmtValue(near.value) + ' · ' + place;
  };

  // At most one text update every 1.2 s while the finger moves; the last position is always reported.
  P.updateReadout = function (force) {
    const now = Date.now();
    clearTimeout(this.readoutTimer);
    if (!force && now - this.lastReadout < 1200) {
      this.readoutTimer = setTimeout(() => this.updateReadout(true), 1200 - (now - this.lastReadout));
      return;
    }
    this.lastReadout = now;
    this.el.readout.textContent = this.readoutText();
  };

  P.isDry = function () {
    const d = this.cfg.dryBelow, n = this.near;
    return d !== undefined && n && n.value !== null && n.value !== undefined && n.value < d;
  };

  // ---------- Details (blind mode button and D key): everything about the point, in words ----------
  const UNIT_WORDS = { '°C': 'unit.c', 'mm/h': 'unit.mmh', 'µg/m³': 'unit.ugm3' };

  P.spokenValue = function (v, signed) {
    const units = this.ds.units, d = this.cfg.decimals || 0;
    if (units === 'relative') return EBE.i18n.num(100 * v, 0) + ' ' + t('unit.percent');
    const digits = this.ds.scale === 'log' && Math.abs(v) < 1 ? Math.max(d, 1) : d;
    return (signed && v > 0 ? '+' : '') + EBE.i18n.num(v, digits) + ' ' + (UNIT_WORDS[units] ? t(UNIT_WORDS[units]) : units);
  };

  P.detailsText = function () {
    if (!this.ds) return '';
    this.updateNear();
    const c = this.cursor, fr = this.frame(), ds = this.ds, s = fr.summary, near = this.near;
    const num = (x, d) => EBE.i18n.num(x, d || 0);
    const out = [t('details.head', { topic: t('tab.' + this.id), date: EBE.i18n.date(fr.t) })];
    // Where: continent or ocean, named area, coordinates in words.
    const region = t('region.' + EBE.geo.regionKey(c.lon, c.lat));
    const place = noCoords(EBE.geo.placeName(c.lon, c.lat));
    const same = [t('common.near', { place: region }), t('common.inSea', { place: region })].map(x => x.toLowerCase());
    const where = place && !same.includes(place.toLowerCase()) ? region + ', ' + place : region;
    out.push(t('details.where', { where }));
    out.push(t('details.coords', {
      lat: t(c.lat >= 0 ? 'details.north' : 'details.south', { n: num(Math.abs(c.lat)) }),
      lon: t(c.lon >= 0 ? 'details.east' : 'details.west', { n: num(Math.abs(c.lon)) })
    }));
    const level = t(levelKey(fr.rank));
    if (ds.type === 'points') {
      const R = EBE.config.sound.exploreRadiusKm;
      if (!near.best) out.push(t('details.fireNone'));
      else {
        const pct = num(100 * near.best[2]);
        out.push(near.d < 40
          ? t('details.fireOn', { pct, count: num(near.list.length), km: R })
          : t('details.fireNear', { count: num(near.list.length), km: R, dist: num(near.d), dir: EBE.geo.dir8(near.b), pct }));
      }
      out.push(t('details.fireGlobal', { count: num(s.count), level }));
    } else {
      if (near.value === null) out.push(t('common.noData') + '.');
      else if (this.isDry()) out.push(t(this.id + '.none') + '.');
      else {
        if (this.cfg.signed) out.push(t(near.value >= 0 ? 'details.above' : 'details.below', { value: this.spokenValue(Math.abs(near.value)) }));
        else out.push(t('details.value', { value: this.spokenValue(near.value) }));
        const i = near.intensity;
        out.push(t('details.intensity', { pct: num(100 * i), level: t(i < 1 / 3 ? 'details.lvl.low' : i < 2 / 3 ? 'details.lvl.medium' : 'details.lvl.high') }));
      }
      if (s.mean !== undefined) out.push(t('details.global', { value: this.spokenValue(s.mean, this.cfg.signed), level }));
    }
    return out.join(' ');
  };

  P.details = function () {
    const text = this.detailsText();
    if (!text) return;
    EBE.a11y.announce(text);
    if (!EBE.a11y.readAloud()) EBE.a11y.speak(text);
  };

  P.describe = function () {
    if (!this.ds) return;
    const raw = this.mode === 'explore' ? this.readoutText() : this.describeText();
    const text = EBE.a11y.isBlind() ? speakable(raw) : raw;
    EBE.a11y.announce(text);
    if (!EBE.a11y.readAloud()) EBE.a11y.speak(text);
  };

  // ---------- sound ----------
  P.startScene = function () {
    if (!this.ds || !this.inst || !this.active) return;
    const self = this, inst = this.inst;
    let nextEvent = 0, nextPing = 0;
    EBE.audio.setScene({
      // The bed starts on the first tick, when the audio context surely exists.
      tick(now, until) { inst.startBed(); self.mode === 'listen' ? self.tickListen(now, until, () => nextEvent, v => { nextEvent = v; })
                                               : self.tickExplore(now, until, () => nextEvent, v => { nextEvent = v; }, () => nextPing, v => { nextPing = v; }); },
      stop() { inst.stopBed(); }
    });
  };

  P.tickListen = function (now, until, getNext, setNext) {
    const ds = this.ds, fr = this.frame(), rank = fr.rank;
    const playing = this.playing;
    const level = playing ? 0.25 + 0.7 * rank : 0.12 + 0.3 * rank;
    this.inst.setBed({ level, bright: rank, pan: 0, pitch: rank });
    EBE.audio.setAlert(playing ? smooth(0.5, 1, rank) : 0);
    const rate = (playing ? 2 : 0.6) + (playing ? 38 : 8) * Math.pow(rank, 1.1);
    let next = getNext();
    if (next < now) next = now + 0.02;
    while (next < until) {
      const ev = EBE.data.sampleEvent(ds, fr);
      if (ev) {
        const ok = this.inst.hit(next, { intensity: ev.intensity, pan: 0.9 * ev.lon / 180, pitch: 0.15 + 0.8 * ev.intensity });
        if (ok) this.scheduleFlash(next, ev);
      }
      next += -Math.log(1 - Math.random()) / rate;
    }
    setNext(next);
  };

  P.tickExplore = function (now, until, getNext, setNext, getPing, setPing) {
    const ds = this.ds, near = this.near, c = this.cursor;
    if (!near) return;
    if (ds.type === 'points') {
      const S = near.S || 0;
      this.inst.setBed({ level: Math.min(1, S / 4), bright: Math.min(1, S / 6), pan: 0, pitch: 0.5 });
      EBE.audio.setAlert(near.d < 40 ? 0.6 : 0);
      // Sonar pings: faster when the nearest fire is close; pitch tells north/south, pan tells east/west.
      let ping = getPing();
      if (ping < now) ping = now + 0.05;
      while (ping < until) {
        this.ping(ping);
        ping += near.best ? (near.d <= 30 ? 0.12 : 0.12 + 1.5 * Math.pow(clamp((near.d - 30) / 1500, 0, 1), 0.7)) : 2;
      }
      setPing(ping);
      const rate = S > 0 ? Math.min(90, 25 * Math.sqrt(S)) : 0;
      let next = getNext();
      if (next < now) next = now + 0.02;
      if (rate > 0) {
        while (next < until) {
          const k = EBE.data.pick(near.cum);
          if (k >= 0) {
            const { p, d } = near.list[k];
            const R = EBE.config.sound.exploreRadiusKm;
            const ev = { lon: p[0], lat: p[1], intensity: clamp(0.15 + 0.85 * (1 - d / R) * (0.4 + 0.6 * p[2]), 0, 1) };
            const pan = 0.9 * Math.sin(EBE.geo.bearing(c.lat, c.lon, p[1], p[0]));
            if (this.inst.hit(next, { intensity: ev.intensity, pan })) this.scheduleFlash(next, ev);
          }
          next += -Math.log(1 - Math.random()) / rate;
        }
      } else next = until;
      setNext(next);
      return;
    }
    // Fields: the instrument plays the value under the finger.
    const pan = 0.9 * c.lon / 180, pitch = (c.lat + 90) / 180;
    if (near.value === null || this.isDry()) {      // no data, or no rain here: silence
      this.inst.setBed({ level: 0, bright: 0, pan, pitch });
      EBE.audio.setAlert(0);
      setNext(until);
      return;
    }
    const it = near.intensity;
    this.inst.setBed({ level: 0.25 + 0.75 * it, bright: it, pan, pitch });
    EBE.audio.setAlert(smooth(0.6, 1, it));
    const rate = 0.6 + 14 * it;
    let next = getNext();
    if (next < now) next = now + 0.02;
    while (next < until) {
      this.inst.hit(next, { intensity: clamp(it * (0.85 + 0.3 * Math.random()), 0, 1), pan, pitch });
      next += -Math.log(1 - Math.random()) / rate;
    }
    setNext(next);
  };

  P.ping = function (t) {
    const ctx = EBE.audio.ctx(), near = this.near;
    if (!EBE.audio.allowEvent()) return;
    const o = ctx.createOscillator(); o.type = 'sine';
    const north = near.best ? Math.cos(near.b) : 0, east = near.best ? Math.sin(near.b) : 0;
    o.frequency.value = near.best ? 523.25 * Math.pow(2, 0.6 * north) : 300;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(near.best ? 0.1 : 0.04, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); EBE.audio.out(g, 0.9 * east);
    o.start(t); o.stop(t + 0.12); EBE.audio.trackVoice(o, t + 0.12);
  };

  P.scheduleFlash = function (time, ev) {
    const delay = Math.max(0, (time - EBE.audio.now()) * 1000);
    setTimeout(() => this.map.flash(ev.lon, ev.lat, ev.intensity), delay);
  };

  EBE.PhenomenonTab = PhenomenonTab;
})();

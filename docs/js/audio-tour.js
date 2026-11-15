// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Audio Tour (P9): a narrated tour made to be used without looking at the screen.
// Stops: welcome -> one per phenomenon (what you will hear -> 12 s of its most intense moment -> a fact
// computed from the data) -> closing. Space plays/pauses, Left/Right change stop.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const t = (k, p) => EBE.i18n.t(k, p);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const CLIP_SECONDS = 12;

  let panel = null, el = {};
  let stops = ['intro', 'outro'];
  let datasets = {};
  let k = 0, playing = false, finished = false, token = 0, timers = [], voiceOn = true;

  function later(fn, ms) { const id = setTimeout(fn, ms / (EBE.Tour._speed || 1)); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // The most intense frame of the period for a phenomenon.
  function peakFrame(ds) {
    let best = 0;
    ds.frames.forEach((fr, i) => { if (fr.rank > ds.frames[best].rank) best = i; });
    return best;
  }

  // Reuse the tab's own description so the tour says exactly what the tab shows.
  function describe(id, frameIndex) {
    const helper = Object.create(EBE.PhenomenonTab.prototype);
    helper.cfg = EBE.config.byId(id); helper.id = id; helper.ds = datasets[id]; helper.k = frameIndex;
    return helper.describeText();
  }

  function stopTitle(stop) { return stop === 'intro' ? t('tour.intro.title') : stop === 'outro' ? t('tour.outro.title') : t('tab.' + stop); }
  function stopIntro(stop) { return stop === 'intro' ? t('tour.intro.text') : stop === 'outro' ? t('tour.outro.text') : t('tour.' + stop + '.intro'); }

  function setText(text) { el.text.textContent = text; }

  // Say a text, then call done. With the narrator off, wait roughly the time it takes to read it.
  function say(text, done, my) {
    setText(text);
    const next = () => { if (my === token && playing) done(); };
    if (voiceOn && 'speechSynthesis' in window) EBE.a11y.speak(text, next);
    else later(next, 1500 + text.length * 60);
  }

  function playClip(id, frameIndex, done, my) {
    const ds = datasets[id], fr = ds.frames[frameIndex], rank = fr.rank;
    const inst = EBE.instruments.create(EBE.config.byId(id).instrument);
    let end = 0, next = 0;
    EBE.audio.setScene({
      tick(now, until) {
        if (!end) { end = now + CLIP_SECONDS; inst.startBed(); }
        if (now > end) return;
        const fade = Math.min(clamp((now - (end - CLIP_SECONDS)) / 0.6, 0, 1), clamp((end - now) / 0.8, 0, 1));
        inst.setBed({ level: (0.25 + 0.7 * rank) * fade, bright: rank, pan: 0, pitch: rank });
        EBE.audio.setAlert(smooth(0.5, 1, rank) * fade);
        const rate = 2 + 38 * Math.pow(rank, 1.1);
        if (next < now) next = now + 0.02;
        while (next < Math.min(until, end)) {
          const ev = EBE.data.sampleEvent(ds, fr);
          if (ev) inst.hit(next, { intensity: ev.intensity, pan: 0.9 * ev.lon / 180, pitch: 0.15 + 0.8 * ev.intensity });
          next += -Math.log(1 - Math.random()) / rate;
        }
      },
      stop() { inst.stopBed(); }
    });
    later(() => { EBE.audio.setScene(null); if (my === token && playing) done(); }, CLIP_SECONDS * 1000 + 300);
  }

  function runStop() {
    const my = ++token, stop = stops[k];
    clearTimers(); EBE.a11y.stopSpeaking(); EBE.audio.setScene(null);
    render();
    const advance = () => {
      if (k + 1 < stops.length) { k++; runStop(); }
      else { playing = false; finished = true; render(); }
    };
    if (stop === 'intro' || stop === 'outro') { say(stopIntro(stop), advance, my); return; }
    const peak = peakFrame(datasets[stop]);
    say(stopIntro(stop), () => {
      setText(t('tour.listening', { name: t('tab.' + stop) }));
      playClip(stop, peak, () => say(describe(stop, peak), advance, my), my);
    }, my);
  }

  function play() {
    EBE.audio.autoEnable();
    prepare().then(() => { if (finished) { k = 0; finished = false; } playing = true; runStop(); });
  }

  function pause() {
    playing = false; token++;
    clearTimers(); EBE.a11y.stopSpeaking(); EBE.audio.setScene(null);
    render();
  }

  function go(delta) {
    const n = stops.length;
    k = clamp(k + delta, 0, n - 1);
    if (playing) runStop();
    else { token++; clearTimers(); EBE.a11y.stopSpeaking(); render(); setText(stopIntro(stops[k])); }
  }

  function render() {
    if (!panel) return;
    el.counter.textContent = t('tour.stopOf', { n: k + 1, total: stops.length }) + ': ' + stopTitle(stops[k]);
    el.play.textContent = playing ? t('common.pause') : (k === 0 || finished ? t('tour.start') : t('tour.continue'));
    el.play.setAttribute('aria-pressed', playing ? 'true' : 'false');
    el.prev.disabled = k === 0;
    el.next.disabled = k === stops.length - 1;
  }

  function prepare() {
    if (Object.keys(datasets).length) return Promise.resolve();
    el.status.textContent = t('common.loading');
    const list = EBE.config.phenomena.filter(p => p.enabled).map(p => p.id);
    return Promise.all(list.map(id => EBE.data.load(id).then(ds => { datasets[id] = ds; }).catch(e => console.warn('[tour] skip', id, e))))
      .then(() => {
        stops = ['intro'].concat(list.filter(id => datasets[id])).concat(['outro']);
        el.status.textContent = '';
      });
  }

  function onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select') return;
    if (e.key === ' ' && tag !== 'button') { e.preventDefault(); playing ? pause() : play(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  }

  function build(p) {
    panel = p;
    panel.innerHTML = `
      <h2 data-i18n="tour.title"></h2>
      <p class="lead" data-i18n="tour.lead"></p>
      <p class="status" data-el="status" role="status"></p>
      <h3 class="tour-counter" data-el="counter"></h3>
      <div class="tour-controls" role="group" data-i18n-aria="tour.title">
        <button type="button" class="btn big" data-el="prev" data-i18n="tour.prev"></button>
        <button type="button" class="btn big primary tour-play" data-el="play"></button>
        <button type="button" class="btn big" data-el="next" data-i18n="tour.next"></button>
      </div>
      <p class="tour-text" data-el="text" aria-live="polite"></p>
      <label class="choice"><input type="checkbox" data-el="voice" checked> <span data-i18n="tour.voice"></span></label>
      <p class="keys" data-i18n="tour.keys"></p>`;
    el = {};
    panel.querySelectorAll('[data-el]').forEach(e => { el[e.dataset.el] = e; });
    el.play.addEventListener('click', () => { playing ? pause() : play(); });
    el.prev.addEventListener('click', () => go(-1));
    el.next.addEventListener('click', () => go(1));
    el.voice.addEventListener('change', () => { voiceOn = el.voice.checked; if (!voiceOn) EBE.a11y.stopSpeaking(); });
    panel.addEventListener('keydown', onKey);
    EBE.i18n.apply(panel);
    prepare().then(render);
    render();
  }

  EBE.Tour = {
    build,
    activate() { render(); },
    deactivate() { if (playing) pause(); },
    onLangChange() { if (!panel) return; EBE.i18n.apply(panel); if (playing) runStop(); else { render(); if (el.text.textContent) setText(stopIntro(stops[k])); } },
    _speed: 1,
    _state: () => ({ k, playing, stops: stops.slice(), text: el.text ? el.text.textContent : '' })
  };
})();

// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Listening game (P8): 10 rounds, guess the phenomenon and its intensity by ear.
// It doubles as our validation: accuracy, confusion matrix and binomial p-values vs. chance.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const t = (k, p) => EBE.i18n.t(k, p);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ROUNDS = 10, CLIP_SECONDS = 3, MAX_REPLAYS = 2;
  const CLASSES = ['low', 'medium', 'high'];

  let panel = null, el = {};
  let datasets = {};        // id -> ds
  let pools = {};           // id -> {low: [...], medium: [...], high: [...]} of {frame, lon, lat, intensity}
  let rounds = [], current = -1, state = 'intro', clipStart = 0, playsLeft = 0;

  function ids() { return Object.keys(datasets); }

  // ---------- statistics ----------
  function comb(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
  function binomTail(k, n, p) {   // P(X >= k)
    let s = 0;
    for (let j = k; j <= n; j++) s += comb(n, j) * Math.pow(p, j) * Math.pow(1 - p, n - j);
    return Math.min(1, s);
  }

  // ---------- pools of candidate clips ----------
  function buildPool(id, ds) {
    const out = [];
    ds.frames.forEach((fr, fi) => {
      if (ds.type === 'points') {
        fr.points.forEach(p => out.push({ frame: fi, lon: p[0], lat: p[1], intensity: p[2] }));
      } else {
        const g = ds.grid;
        for (let k = 0; k < fr.cells.length; k += 7) {          // every 7th cell is plenty
          const b = fr.cells[k]; if (b === 255) continue;
          const v = ds.valueOfByte(b), it = ds.intensityOf(v);
          if (ds.id === 'rain' && v < 0.1) continue;           // dry places are not rain clips
          const i = k % g.w, j = Math.floor(k / g.w);
          out.push({ frame: fi, lon: g.lon0 + g.step * (i + 0.5), lat: g.lat0 - g.step * (j + 0.5), intensity: it, value: v });
        }
      }
    });
    // Classes are thirds of the 0-1 intensity scale, so each class sounds clearly different.
    const byClass = { low: [], medium: [], high: [] };
    out.forEach(o => byClass[classOf(o.intensity)].push(o));
    pools[id] = byClass;
  }

  function classOf(it) { return it < 1 / 3 ? 'low' : it < 2 / 3 ? 'medium' : 'high'; }

  function makeRounds() {
    const list = ids(), out = [];
    const order = [];
    while (order.length < ROUNDS) order.push(...list.slice().sort(() => Math.random() - 0.5));
    for (let r = 0; r < ROUNDS; r++) {
      const id = order[r];
      const available = CLASSES.filter(c => pools[id][c].length);
      const cls = available[Math.floor(Math.random() * available.length)];
      const list2 = pools[id][cls];
      const pick = list2[Math.floor(Math.random() * list2.length)];
      out.push(Object.assign({ id, cls, answerId: null, answerCls: null, replays: 0, timeMs: 0 }, pick));
    }
    return out;
  }

  // ---------- sound (same mapping as Explore, so what you learn there helps here) ----------
  function playClip(round) {
    EBE.audio.autoEnable();
    const cfg = EBE.config.byId(round.id);
    const inst = EBE.instruments.create(cfg.instrument);
    const it = round.intensity, pan = 0.9 * round.lon / 180, pitch = (round.lat + 90) / 180;
    const isPoints = datasets[round.id].type === 'points';
    let end = 0, next = 0;
    EBE.audio.setScene({
      tick(now, until) {
        if (!end) { end = now + CLIP_SECONDS; inst.startBed(); }
        if (now > end) { EBE.audio.setScene(null); return; }
        const fade = clamp((end - now) / 0.4, 0, 1);
        inst.setBed({ level: (isPoints ? 0.5 * it : 0.25 + 0.75 * it) * fade, bright: it, pan, pitch });
        EBE.audio.setAlert(0);
        const rate = isPoints ? 2 + 60 * it : 0.6 + 14 * it;
        if (next < now) next = now + 0.02;
        while (next < Math.min(until, end)) {
          inst.hit(next, { intensity: clamp(it * (0.85 + 0.3 * Math.random()), 0, 1),
            pan: isPoints ? clamp(pan + 0.3 * (Math.random() - 0.5), -1, 1) : pan, pitch });
          next += -Math.log(1 - Math.random()) / rate;
        }
      },
      stop() { inst.stopBed(); }
    });
  }

  // ---------- UI ----------
  function render() {
    if (!panel) return;
    el.intro.hidden = state !== 'intro';
    el.round.hidden = state !== 'round' && state !== 'feedback';
    el.results.hidden = state !== 'results';
    if (state === 'round' || state === 'feedback') renderRound();
    if (state === 'results') renderResults();
  }

  function renderRound() {
    const r = rounds[current];
    el.counter.textContent = t('game.roundOf', { n: current + 1, total: ROUNDS });
    el.replay.textContent = t('game.play') + ' (' + t('game.playsLeft', { n: playsLeft }) + ')';
    el.replay.disabled = playsLeft <= 0 || state === 'feedback';
    el.phOptions.innerHTML = '';
    ids().forEach(id => {
      const lab = document.createElement('label'); lab.className = 'choice';
      lab.innerHTML = `<input type="radio" name="g-ph" value="${id}"> <span>${t('tab.' + id)}</span>`;
      if (r.answerId === id) lab.querySelector('input').checked = true;
      el.phOptions.appendChild(lab);
    });
    el.inOptions.innerHTML = '';
    CLASSES.forEach(c => {
      const lab = document.createElement('label'); lab.className = 'choice';
      lab.innerHTML = `<input type="radio" name="g-in" value="${c}"> <span>${t('game.class.' + c)}</span>`;
      if (r.answerCls === c) lab.querySelector('input').checked = true;
      el.inOptions.appendChild(lab);
    });
    panel.querySelectorAll('input[type=radio]').forEach(x => { x.disabled = state === 'feedback'; });
    el.submit.hidden = state === 'feedback';
    el.next.hidden = state !== 'feedback';
    el.next.textContent = current + 1 < ROUNDS ? t('game.next') : t('game.seeResults');
  }

  function feedbackText(r) {
    const okP = r.answerId === r.id, okI = r.answerCls === r.cls;
    const parts = [okP ? t('game.rightPh') : t('game.wrongPh', { ph: t('tab.' + r.id) }),
                   okI ? t('game.rightIn') : t('game.wrongIn', { cls: t('game.class.' + r.cls) })];
    parts.push(t('game.where', { place: EBE.geo.placeName(r.lon, r.lat, datasets[r.id].type === 'points'), date: EBE.i18n.date(datasets[r.id].frames[r.frame].t) }));
    return parts.join(' ');
  }

  function startGame() {
    if (!ids().length) { el.status.textContent = t('common.loadError'); return; }
    rounds = makeRounds(); current = -1;
    nextRound();
  }

  function nextRound() {
    current++;
    if (current >= ROUNDS) {
      state = 'results'; render(); EBE.audio.setScene(null);
      EBE.a11y.announce(summaryText()); el.resultsHeading.focus(); return;
    }
    state = 'round'; playsLeft = MAX_REPLAYS + 1; clipStart = 0;
    render();
    el.feedback.textContent = '';
    replay();
    el.counter.focus();
  }

  function replay() {
    const r = rounds[current];
    if (playsLeft <= 0) return;
    if (playsLeft <= MAX_REPLAYS) r.replays++;
    playsLeft--;
    if (!clipStart) clipStart = performance.now();
    playClip(r);
    renderRound();
    EBE.a11y.announce(t('game.listening'), { silentVoice: true });
  }

  function submit() {
    const r = rounds[current];
    const ph = panel.querySelector('input[name=g-ph]:checked'), inn = panel.querySelector('input[name=g-in]:checked');
    if (!ph || !inn) { el.feedback.textContent = t('game.pickBoth'); EBE.a11y.announce(t('game.pickBoth')); return; }
    r.answerId = ph.value; r.answerCls = inn.value;
    r.timeMs = Math.round(performance.now() - clipStart);
    state = 'feedback';
    render();
    const text = feedbackText(r);
    el.feedback.textContent = text;
    EBE.a11y.announce(text);
    el.next.focus();
  }

  function score() {
    const n = rounds.length;
    const okP = rounds.filter(r => r.answerId === r.id).length;
    const okI = rounds.filter(r => r.answerCls === r.cls).length;
    const k = ids().length;
    return { n, okP, okI, pP: binomTail(okP, n, 1 / k), pI: binomTail(okI, n, 1 / 3), k };
  }

  function summaryText() {
    const s = score();
    return t('game.summary', { okP: s.okP, okI: s.okI, n: s.n, pctP: Math.round(100 * s.okP / s.n), pctI: Math.round(100 * s.okI / s.n) });
  }

  function renderResults() {
    const s = score();
    el.summary.textContent = summaryText();
    el.pvalues.textContent = t('game.pvalues', { pP: EBE.i18n.num(s.pP, 3), pI: EBE.i18n.num(s.pI, 3), k: s.k });
    const list = ids();
    let html = `<caption>${t('game.matrixCaption')}</caption><thead><tr><th scope="col">${t('game.trueAnswer')}</th>`;
    list.forEach(id => { html += `<th scope="col">${t('tab.' + id)}</th>`; });
    html += '</tr></thead><tbody>';
    list.forEach(tid => {
      html += `<tr><th scope="row">${t('tab.' + tid)}</th>`;
      list.forEach(aid => {
        const c = rounds.filter(r => r.id === tid && r.answerId === aid).length;
        html += `<td${tid === aid ? ' class="diag"' : ''}>${c}</td>`;
      });
      html += '</tr>';
    });
    el.matrix.innerHTML = html + '</tbody>';
    el.csv.value = csv();
  }

  function csv() {
    const head = 'round,phenomenon,frame,lon,lat,intensity_class,answer_phenomenon,answer_intensity,correct_phenomenon,correct_intensity,replays,time_ms';
    const rows = rounds.map((r, i) => [i + 1, r.id, r.frame, r.lon.toFixed(2), r.lat.toFixed(2), r.cls, r.answerId, r.answerCls,
      r.answerId === r.id ? 1 : 0, r.answerCls === r.cls ? 1 : 0, r.replays, r.timeMs].join(','));
    return [head].concat(rows).join('\n');
  }

  function copyCsv() {
    const text = el.csv.value;
    const done = () => { el.copyStatus.textContent = t('game.copied'); EBE.a11y.announce(t('game.copied')); };
    const fallback = () => { el.csv.focus(); el.csv.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } done(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  function prepare() {
    if (ids().length) return Promise.resolve();
    el.status.textContent = t('common.loading');
    const list = EBE.config.phenomena.filter(p => p.enabled).map(p => p.id);
    return Promise.all(list.map(id => EBE.data.load(id)
      .then(ds => { datasets[id] = ds; buildPool(id, ds); })
      .catch(e => console.warn('[game] skip', id, e))))
      .then(() => { el.status.textContent = ''; });
  }

  function build(p) {
    panel = p;
    panel.innerHTML = `
      <h2 data-i18n="game.title"></h2>
      <p class="lead" data-i18n="game.lead"></p>
      <p class="status" data-el="status" role="status"></p>
      <div data-el="intro">
        <ul class="rules">
          <li data-i18n="game.rule1"></li><li data-i18n="game.rule2"></li><li data-i18n="game.rule3"></li>
        </ul>
        <button type="button" class="btn big primary" data-el="start" data-i18n="game.start"></button>
      </div>
      <div data-el="round" hidden>
        <h3 data-el="counter" tabindex="-1"></h3>
        <button type="button" class="btn big" data-el="replay"></button>
        <fieldset class="choices"><legend data-i18n="game.whichPh"></legend><div data-el="phOptions"></div></fieldset>
        <fieldset class="choices"><legend data-i18n="game.howIntense"></legend><div data-el="inOptions"></div></fieldset>
        <button type="button" class="btn big primary" data-el="submit" data-i18n="game.submit"></button>
        <p class="feedback" data-el="feedback" aria-live="polite"></p>
        <button type="button" class="btn big primary" data-el="next" hidden></button>
      </div>
      <div data-el="results" hidden>
        <h3 data-el="resultsHeading" tabindex="-1" data-i18n="game.results"></h3>
        <p class="summary" data-el="summary"></p>
        <p data-el="pvalues"></p>
        <div class="table-wrap"><table class="matrix" data-el="matrix"></table></div>
        <label for="g-csv" data-i18n="game.csvLabel"></label>
        <textarea id="g-csv" data-el="csv" rows="6" readonly></textarea>
        <div class="row">
          <button type="button" class="btn" data-el="copy" data-i18n="game.copy"></button>
          <button type="button" class="btn primary" data-el="again" data-i18n="game.again"></button>
        </div>
        <p data-el="copyStatus" role="status"></p>
      </div>`;
    el = {};
    panel.querySelectorAll('[data-el]').forEach(e => { el[e.dataset.el] = e; });
    el.start.addEventListener('click', () => { EBE.audio.autoEnable(); prepare().then(startGame); });
    el.replay.addEventListener('click', replay);
    el.submit.addEventListener('click', submit);
    el.next.addEventListener('click', nextRound);
    el.copy.addEventListener('click', copyCsv);
    el.again.addEventListener('click', () => { state = 'intro'; render(); el.start.focus(); });
    EBE.i18n.apply(panel);
    render();
  }

  EBE.Game = {
    build,
    activate() { render(); },
    deactivate() { EBE.audio.setScene(null); },
    onLangChange() { if (panel) { EBE.i18n.apply(panel); render(); } },
    _score: score, _csv: () => csv(), _binomTail: binomTail
  };
})();

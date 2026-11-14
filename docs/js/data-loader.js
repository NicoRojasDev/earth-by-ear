// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Lazy loading of docs/data/<id>.js, validation, grid decoding and per-frame summaries.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const cache = {};

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }

  function decodeBase64(b64) {
    const bin = atob(b64), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function validate(ds) {
    const problems = [];
    ['id', 'type', 'frames', 'units', 'value_range', 'intensity_range'].forEach(k => { if (ds[k] === undefined) problems.push('missing ' + k); });
    if (!Array.isArray(ds.frames) || !ds.frames.length) problems.push('no frames');
    if (ds.type === 'field' && (!ds.grid || !ds.grid.w || !ds.grid.h)) problems.push('missing grid size');
    if (problems.length) console.warn('[data]', ds.id, problems.join(', '));
    return problems.length === 0;
  }

  function cumulative(weights) {
    const cum = new Float32Array(weights.length); let acc = 0;
    for (let i = 0; i < weights.length; i++) { acc += weights[i]; cum[i] = acc; }
    return cum;
  }

  function pick(cum) {
    const n = cum.length; if (!n || cum[n - 1] <= 0) return -1;
    const x = Math.random() * cum[n - 1]; let lo = 0, hi = n - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < x) lo = m + 1; else hi = m; }
    return lo;
  }

  function percentileRanks(values) {
    const sorted = values.slice().sort((a, b) => a - b), n = values.length;
    return values.map(v => {
      let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; }
      return n > 1 ? lo / (n - 1) : 0.5;
    });
  }

  // Turns raw file data into ready-to-use frames.
  function prepare(ds) {
    const cfg = EBE.config.byId(ds.id) || {};
    const [v0, v1] = ds.value_range, [i0, i1] = ds.intensity_range;
    if (ds.scale === 'log') {
      // Grid bytes and intensity use log10 (rain, PM2.5): small values keep their detail.
      const l0 = Math.log10(v0), l1 = Math.log10(v1), m0 = Math.log10(i0), m1 = Math.log10(i1);
      ds.valueOfByte = b => Math.pow(10, l0 + (b / 254) * (l1 - l0));
      ds.intensityOf = v => clamp((Math.log10(Math.max(v, 1e-6)) - m0) / ((m1 - m0) || 1), 0, 1);
    } else {
      ds.valueOfByte = b => v0 + (b / 254) * (v1 - v0);
      ds.intensityOf = v => clamp((v - i0) / ((i1 - i0) || 1), 0, 1);
    }
    const keys = [];

    ds.frames.forEach(fr => {
      if (ds.type === 'points') {
        const pts = fr.points || [];
        let sum = 0, best = null;
        const w = new Float32Array(pts.length);
        pts.forEach((p, k) => { sum += p[2]; w[k] = 0.15 + p[2] * p[2]; if (!best || p[2] > best[2]) best = p; });
        const total = fr.stats && fr.stats.count !== undefined ? fr.stats.count : pts.length;
        fr.summary = {
          count: total,                 // every fire spot detected; fr.points keeps the most intense ones
          meanIntensity: pts.length ? sum / pts.length : 0,
          max: best ? { lon: best[0], lat: best[1], value: v0 + best[2] * (v1 - v0) } : null
        };
        fr.cum = cumulative(w);
        keys.push(total);
      } else {
        const grid = decodeBase64(fr.grid);
        fr.cells = grid;
        const W = ds.grid.w, H = ds.grid.h, g = ds.grid;
        // Area weights: cells near the poles are smaller, so they count less.
        const rowW = new Float32Array(H);
        for (let j = 0; j < H; j++) rowW[j] = Math.cos((g.lat0 - g.step * (j + 0.5)) * Math.PI / 180);
        const idx = [], weights = [];
        let wsum = 0, sum = 0, sumI = 0, aboveW = 0, aboveSum = 0, bestB = -1, bestK = -1;
        const thr = cfg.shareThreshold;
        for (let k = 0; k < W * H; k++) {
          const b = grid[k]; if (b === 255) continue;
          const w = rowW[(k / W) | 0];
          const v = ds.valueOfByte(b), it = ds.intensityOf(v);
          wsum += w; sum += v * w; sumI += it * w;
          if (thr !== undefined && v >= thr) { aboveW += w; aboveSum += v * w; }
          if (b > bestB) { bestB = b; bestK = k; }
          if (it > 0.02) { idx.push(k); weights.push(Math.pow(it, 1.5) * w); }
        }
        // Several cells can share the top value (values beyond the colorbar saturate): pick the one in
        // the middle of the largest hot area (highest 3x3 neighbourhood average).
        if (bestK >= 0) {
          let bestScore = -1;
          for (let k = 0; k < W * H; k++) {
            const b = grid[k]; if (b === 255 || b < bestB - 2) continue;
            const i = k % W, j = (k / W) | 0;
            let acc = 0, cnt = 0;
            for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
              const jj = j + dj; if (jj < 0 || jj >= H) continue;
              const nb = grid[jj * W + ((i + di + W) % W)];
              cnt++; if (nb !== 255) acc += nb;
            }
            const score = acc / cnt;
            if (score > bestScore) { bestScore = score; bestK = k; }
          }
        }
        const bi = bestK % W, bj = Math.floor(bestK / W);
        fr.summary = {
          mean: wsum ? sum / wsum : 0,
          meanIntensity: wsum ? sumI / wsum : 0,
          shareAbove: wsum ? aboveW / wsum : 0,
          meanWhere: aboveW ? aboveSum / aboveW : 0,
          max: bestK >= 0 ? { lon: g.lon0 + g.step * (bi + 0.5), lat: g.lat0 - g.step * (bj + 0.5), value: ds.valueOfByte(grid[bestK]) } : null
        };
        fr.eventCells = Int32Array.from(idx);
        fr.cum = cumulative(weights);
        keys.push(fr.summary.meanIntensity);
      }
    });
    const ranks = percentileRanks(keys);
    ds.frames.forEach((fr, k) => { fr.rank = ranks[k]; });
    ds.ready = true;
    return ds;
  }

  function load(id) {
    if (cache[id]) return cache[id];
    const p = (async () => {
      window.EARTH_BY_EAR_DATA = window.EARTH_BY_EAR_DATA || {};
      if (!window.EARTH_BY_EAR_DATA[id]) await loadScript('data/' + id + '.js');
      const ds = window.EARTH_BY_EAR_DATA[id];
      if (!ds || !validate(ds)) throw new Error('Invalid data for ' + id);
      return ds.ready ? ds : prepare(ds);
    })();
    cache[id] = p;
    p.catch(() => { delete cache[id]; });
    return p;
  }

  // Field value at lon/lat (null where there is no data).
  function valueAt(ds, frame, lon, lat) {
    const g = ds.grid;
    let i = Math.floor((lon - g.lon0) / g.step), j = Math.floor((g.lat0 - lat) / g.step);
    i = clamp(i, 0, g.w - 1); j = clamp(j, 0, g.h - 1);
    const b = frame.cells[j * g.w + i];
    return b === 255 ? null : ds.valueOfByte(b);
  }

  // Random event drawn from the frame, weighted by intensity: {lon, lat, intensity}.
  function sampleEvent(ds, frame) {
    const k = pick(frame.cum); if (k < 0) return null;
    if (ds.type === 'points') { const p = frame.points[k]; return { lon: p[0], lat: p[1], intensity: p[2] }; }
    const g = ds.grid, cell = frame.eventCells[k];
    const i = cell % g.w, j = Math.floor(cell / g.w);
    const v = ds.valueOfByte(frame.cells[cell]);
    return { lon: g.lon0 + g.step * (i + Math.random()), lat: g.lat0 - g.step * (j + Math.random()), intensity: ds.intensityOf(v), value: v };
  }

  EBE.data = { load, valueAt, sampleEvent, pick, cumulative };
})();

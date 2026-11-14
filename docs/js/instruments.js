// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// One recognizable instrument per phenomenon. Every instrument has:
//   startBed() / setBed({level, bright, pan, pitch}) / stopBed()  -> continuous layer (0..1 values)
//   hit(t, {intensity, pan, pitch})                                 -> one short event at audio time t
// Intensity always sounds the same way: denser (more hits), brighter (filter) and louder.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const A = () => EBE.audio;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function env(g, t, peak, attack, release) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  function glide(param, value, t) { param.setTargetAtTime(value, t, 0.12); }

  // Base for continuous layers: a gain + filter that fade in/out.
  function makeBedShell(filterType, freq) {
    const ctx = A().ctx();
    const gain = ctx.createGain(); gain.gain.value = 0;
    const filter = ctx.createBiquadFilter(); filter.type = filterType; filter.frequency.value = freq;
    let panner = null;
    if (typeof ctx.createStereoPanner === 'function') {
      panner = ctx.createStereoPanner();
      filter.connect(gain); gain.connect(panner); A().out(panner, 0);
    } else {
      filter.connect(gain); A().out(gain, 0);
    }
    return { ctx, gain, filter, panner, sources: [] };
  }

  function stopShell(shell) {
    if (!shell) return;
    const t = shell.ctx.currentTime;
    shell.gain.gain.setTargetAtTime(0, t, 0.15);
    shell.sources.forEach(s => { try { s.stop(t + 0.8); } catch (e) { /* already stopped */ } });
  }

  function noiseSource(ctx) {
    const s = ctx.createBufferSource(); s.buffer = A().noise(); s.loop = true;
    s.loopStart = Math.random(); return s;
  }

  // ---------- fire: crackling grains ----------
  function crackle() {
    let shell = null;
    return {
      startBed() {
        if (shell) return;
        shell = makeBedShell('lowpass', 500);
        const n = noiseSource(shell.ctx); n.connect(shell.filter); n.start(); shell.sources.push(n);
      },
      setBed({ level, bright, pan }) {
        if (!shell) return; const t = shell.ctx.currentTime;
        glide(shell.gain.gain, 0.03 * level, t);
        glide(shell.filter.frequency, 250 + 1400 * bright, t);
        if (shell.panner) glide(shell.panner.pan, clamp(pan || 0, -1, 1), t);
      },
      stopBed() { stopShell(shell); shell = null; },
      hit(t, { intensity, pan }) {
        const ctx = A().ctx(); if (!A().allowEvent()) return false;
        const grains = A().grains();
        const src = ctx.createBufferSource(); src.buffer = grains[Math.floor(Math.random() * grains.length)];
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
        bp.frequency.value = (700 + 4200 * intensity) * (0.75 + 0.5 * Math.random());
        const g = ctx.createGain(); g.gain.value = 0.06 + 0.26 * intensity;
        src.connect(bp); bp.connect(g); A().out(g, pan);
        src.start(t); A().trackVoice(src, t + 0.05);
        return true;
      }
    };
  }

  // ---------- ocean: low cello-like drone ----------
  function cello() {
    let shell = null, oscs = [], lfoGain = null, lfo = null;
    return {
      startBed() {
        if (shell) return;
        shell = makeBedShell('lowpass', 600); shell.filter.Q.value = 1.2;
        const ctx = shell.ctx;
        const trem = ctx.createGain(); trem.gain.value = 1; trem.connect(shell.filter);
        [[1, 'sawtooth', 0.5], [1.006, 'sawtooth', 0.5], [0.5, 'sine', 0.7]].forEach(([mul, type, vol]) => {
          const o = ctx.createOscillator(); o.type = type; o.frequency.value = 65 * mul;
          const g = ctx.createGain(); g.gain.value = vol; o.connect(g); g.connect(trem); o.start();
          o._mul = mul; oscs.push(o); shell.sources.push(o);
        });
        lfo = ctx.createOscillator(); lfo.frequency.value = 0.6;
        lfoGain = ctx.createGain(); lfoGain.gain.value = 0.15;
        lfo.connect(lfoGain); lfoGain.connect(trem.gain); lfo.start(); shell.sources.push(lfo);
      },
      setBed({ level, bright, pan, pitch }) {
        if (!shell) return; const t = shell.ctx.currentTime;
        const f = A().penta(55, 2 + Math.round(clamp(pitch, 0, 1) * 9));
        oscs.forEach(o => glide(o.frequency, f * o._mul, t));
        glide(shell.gain.gain, 0.02 + 0.13 * level, t);
        glide(shell.filter.frequency, 220 + 1800 * bright, t);
        glide(lfo.frequency, 0.4 + 6 * level, t);       // denser = faster bowing tremolo
        glide(lfoGain.gain, 0.1 + 0.3 * level, t);
        if (shell.panner) glide(shell.panner.pan, clamp(pan || 0, -1, 1), t);
      },
      stopBed() { stopShell(shell); shell = null; oscs = []; },
      hit(t, { intensity, pan, pitch }) {
        const ctx = A().ctx(); if (!A().allowEvent()) return false;
        const f = A().penta(110, Math.round(clamp(pitch, 0, 1) * 10));
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400 + 1600 * intensity;
        const g = ctx.createGain(); env(g, t, 0.05 + 0.12 * intensity, 0.12, 1.1);
        o.connect(lp); lp.connect(g); A().out(g, pan);
        o.start(t); o.stop(t + 1.4); A().trackVoice(o, t + 1.4);
        return true;
      }
    };
  }

  // ---------- rain: drops (plinks) + soft hiss ----------
  function drops() {
    let shell = null;
    return {
      startBed() {
        if (shell) return;
        shell = makeBedShell('lowpass', 4000);
        const hp = shell.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
        const n = noiseSource(shell.ctx); n.connect(hp); hp.connect(shell.filter); n.start(); shell.sources.push(n);
      },
      setBed({ level, bright, pan }) {
        if (!shell) return; const t = shell.ctx.currentTime;
        glide(shell.gain.gain, 0.05 * level, t);
        glide(shell.filter.frequency, 2500 + 9000 * bright, t);
        if (shell.panner) glide(shell.panner.pan, clamp(pan || 0, -1, 1), t);
      },
      stopBed() { stopShell(shell); shell = null; },
      hit(t, { intensity, pan, pitch }) {
        const ctx = A().ctx(); if (!A().allowEvent()) return false;
        const f = A().penta(523.25, Math.round(clamp(pitch, 0, 1) * 9));
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.06, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
        const g = ctx.createGain(); env(g, t, 0.04 + 0.16 * intensity, 0.003, 0.16 + 0.2 * intensity);
        o.connect(g); A().out(g, pan);
        o.start(t); o.stop(t + 0.5); A().trackVoice(o, t + 0.5);
        return true;
      }
    };
  }

  // ---------- air temperature: warm pad + whistle ----------
  function pad() {
    let shell = null, oscs = [], whistle = null, whistleGain = null, vib = null;
    return {
      startBed() {
        if (shell) return;
        shell = makeBedShell('lowpass', 800);
        const ctx = shell.ctx;
        [[1, 0.35], [1.5, 0.22], [2, 0.16]].forEach(([mul, vol]) => {
          const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 110 * mul; o.detune.value = (mul === 1.5 ? 5 : -4);
          const g = ctx.createGain(); g.gain.value = vol; o.connect(g); g.connect(shell.filter); o.start();
          o._mul = mul; oscs.push(o); shell.sources.push(o);
        });
        whistle = ctx.createOscillator(); whistle.type = 'sine'; whistle.frequency.value = 1320;
        vib = ctx.createOscillator(); vib.frequency.value = 5;
        const vg = ctx.createGain(); vg.gain.value = 9; vib.connect(vg); vg.connect(whistle.frequency);
        whistleGain = ctx.createGain(); whistleGain.gain.value = 0;
        whistle.connect(whistleGain); whistleGain.connect(shell.gain);
        whistle.start(); vib.start(); shell.sources.push(whistle, vib);
      },
      setBed({ level, bright, pan, pitch }) {
        if (!shell) return; const t = shell.ctx.currentTime;
        const f = A().penta(98, Math.round(clamp(pitch, 0, 1) * 8));
        oscs.forEach(o => glide(o.frequency, f * o._mul, t));
        glide(whistle.frequency, A().penta(880, Math.round(clamp(pitch, 0, 1) * 6)), t);
        glide(shell.gain.gain, 0.02 + 0.12 * level, t);
        glide(shell.filter.frequency, 300 + 2600 * bright, t);
        glide(whistleGain.gain, 0.25 * bright * bright, t);
        glide(vib.frequency, 3 + 5 * level, t);
        if (shell.panner) glide(shell.panner.pan, clamp(pan || 0, -1, 1), t);
      },
      stopBed() { stopShell(shell); shell = null; oscs = []; },
      hit(t, { intensity, pan, pitch }) {
        const ctx = A().ctx(); if (!A().allowEvent()) return false;
        const f = A().penta(220, Math.round(clamp(pitch, 0, 1) * 8));
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600 + 2400 * intensity;
        const g = ctx.createGain(); env(g, t, 0.04 + 0.1 * intensity, 0.25, 0.9);
        o.connect(lp); lp.connect(g); A().out(g, pan);
        o.start(t); o.stop(t + 1.3); A().trackVoice(o, t + 1.3);
        return true;
      }
    };
  }

  // ---------- air quality: muffled dense rumble ----------
  function smog() {
    let shell = null, sub = null, am = null, amGain = null;
    return {
      startBed() {
        if (shell) return;
        shell = makeBedShell('lowpass', 200);
        const ctx = shell.ctx;
        const amNode = ctx.createGain(); amNode.gain.value = 1; amNode.connect(shell.filter);
        const n = noiseSource(ctx); n.connect(amNode); n.start(); shell.sources.push(n);
        sub = ctx.createOscillator(); sub.type = 'sawtooth'; sub.frequency.value = 55;
        const sg = ctx.createGain(); sg.gain.value = 0.25; sub.connect(sg); sg.connect(amNode); sub.start(); shell.sources.push(sub);
        am = ctx.createOscillator(); am.frequency.value = 0.4;
        amGain = ctx.createGain(); amGain.gain.value = 0.2; am.connect(amGain); amGain.connect(amNode.gain); am.start(); shell.sources.push(am);
      },
      setBed({ level, bright, pan, pitch }) {
        if (!shell) return; const t = shell.ctx.currentTime;
        glide(sub.frequency, A().penta(41.2, Math.round(clamp(pitch, 0, 1) * 7)), t);
        glide(shell.gain.gain, 0.06 + 0.35 * level, t);
        glide(shell.filter.frequency, 110 + 520 * bright, t);
        glide(am.frequency, 0.3 + 4 * level, t);
        glide(amGain.gain, 0.15 + 0.3 * level, t);
        if (shell.panner) glide(shell.panner.pan, clamp(pan || 0, -1, 1), t);
      },
      stopBed() { stopShell(shell); shell = null; },
      hit(t, { intensity, pan, pitch }) {
        const ctx = A().ctx(); if (!A().allowEvent()) return false;
        const f = 55 + 50 * clamp(pitch, 0, 1);
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.3);
        const g = ctx.createGain(); env(g, t, 0.1 + 0.25 * intensity, 0.01, 0.35);
        o.connect(g); A().out(g, pan);
        o.start(t); o.stop(t + 0.5); A().trackVoice(o, t + 0.5);
        return true;
      }
    };
  }

  const FACTORIES = { crackle, cello, drops, pad, smog };

  EBE.instruments = {
    create(name) {
      const f = FACTORIES[name];
      if (!f) throw new Error('Unknown instrument ' + name);
      return f();
    },
    names: Object.keys(FACTORIES)
  };
})();

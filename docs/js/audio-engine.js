// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Web Audio engine: context, master chain with limiter, shared alert bed, event scheduler, voice budget.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const PENTA = [0, 2, 4, 7, 9];

  let ctx = null, master = null, duckGain = null, input = null, hasPanner = false;
  let on = false;
  let alertGains = [], alertRumble = null;
  let scene = null;          // object with tick(now, until) called by the scheduler
  let activeVoices = 0;
  let eventsThisSecond = 0, secondStart = 0;
  let noiseBuffer = null, grainBuffers = [];
  const listeners = [];

  function init() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    ctx = new Ctx();
    hasPanner = typeof ctx.createStereoPanner === 'function';

    // input -> duck -> compressor -> limiter-ish compressor -> master -> out
    input = ctx.createGain(); input.gain.value = 1;
    duckGain = ctx.createGain(); duckGain.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.1;
    master = ctx.createGain(); master.gain.value = 0;
    input.connect(duckGain); duckGain.connect(comp); comp.connect(limiter); limiter.connect(master); master.connect(ctx.destination);

    // White noise (2 s, looped by users) and short decaying grains.
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuffer.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    for (let k = 0; k < 6; k++) {
      const len = Math.floor(ctx.sampleRate * (0.006 + 0.034 * k / 5));
      const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.3));
      grainBuffers.push(b);
    }

    // Shared alert bed: tense chord (minor second + tritone) and a low rumble. Silent until setAlert.
    [110, 116.54, 155.56].forEach(f => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      o.connect(lp); lp.connect(g); g.connect(input); o.start();
      alertGains.push(g);
    });
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuffer; ns.loop = true;
    const rl = ctx.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 90;
    alertRumble = ctx.createGain(); alertRumble.gain.value = 0;
    ns.connect(rl); rl.connect(alertRumble); alertRumble.connect(input); ns.start();

    setInterval(schedule, 25);
    return true;
  }

  function schedule() {
    if (!ctx || !on || !scene) return;
    const now = ctx.currentTime;
    try { scene.tick(now, now + 0.12); } catch (e) { console.error(e); }
  }

  // Must be called from a user gesture (browser autoplay rules).
  function enable() {
    if (!ctx && !init()) return false;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    on = true;
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.05);
    listeners.forEach(fn => fn(true));
    return true;
  }

  function disable() {
    if (!ctx) return;
    on = false;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    listeners.forEach(fn => fn(false));
  }

  function setScene(next) {
    if (scene && scene.stop) { try { scene.stop(); } catch (e) { console.error(e); } }
    scene = next;
    if (!next) setAlert(0);
  }

  function setAlert(level) {
    if (!ctx) return;
    const t = ctx.currentTime, x = clamp(level, 0, 1);
    alertGains.forEach(g => g.gain.setTargetAtTime(0.05 * x, t, 0.6));
    alertRumble.gain.setTargetAtTime(0.35 * x, t, 0.6);
  }

  function duck(down) {
    if (!ctx) return;
    duckGain.gain.setTargetAtTime(down ? 0.35 : 1, ctx.currentTime, 0.08);
  }

  // Budget: returns false when too many events or voices are playing.
  function allowEvent() {
    const now = ctx.currentTime;
    if (now - secondStart >= 1) { secondStart = now; eventsThisSecond = 0; }
    if (eventsThisSecond >= EBE.config.sound.maxEventsPerSecond) return false;
    if (activeVoices >= EBE.config.sound.maxVoices) return false;
    eventsThisSecond++;
    return true;
  }

  function trackVoice(node, endTime) {
    activeVoices++;
    const ms = Math.max(0, (endTime - ctx.currentTime) * 1000) + 30;
    setTimeout(() => { activeVoices = Math.max(0, activeVoices - 1); }, ms);
    node.onended = null;
  }

  // Connect a node to the mix, optionally panned (-1 left .. 1 right).
  function out(node, pan) {
    if (hasPanner && pan) {
      const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
      node.connect(p); p.connect(input);
      return p;
    }
    node.connect(input);
    return input;
  }

  // Pentatonic note: step 0 = base frequency, each step moves along the scale.
  function penta(base, step) {
    const s = Math.round(step);
    const oct = Math.floor(s / 5), idx = ((s % 5) + 5) % 5;
    return base * Math.pow(2, (12 * oct + PENTA[idx]) / 12);
  }

  EBE.audio = {
    enable, disable, setScene, setAlert, duck, allowEvent, trackVoice, out, penta, clamp,
    isOn: () => on && !!ctx,
    ctx: () => ctx,
    now: () => (ctx ? ctx.currentTime : 0),
    noise: () => noiseBuffer,
    grains: () => grainBuffers,
    onToggle: fn => listeners.push(fn)
  };
})();

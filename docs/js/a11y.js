// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Screen reader announcements (aria-live), optional speech in the active language, reduced motion.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};

  let readAloud = false;
  let blind = false;      // blind / low-vision mode chosen on the welcome screen
  let liveEl = null;
  let lastText = '';
  let lastTime = 0;

  function live() {
    if (!liveEl) liveEl = document.getElementById('live');
    return liveEl;
  }

  // Polite announcement. Same text twice in a row within 1 s is skipped.
  function announce(text, opts) {
    if (!text) return;
    const now = Date.now();
    if (text === lastText && now - lastTime < 1000) return;
    lastText = text; lastTime = now;
    const el = live();
    if (el) {
      el.textContent = '';
      setTimeout(() => { el.textContent = text; }, 40);
    }
    if (readAloud && !(opts && opts.silentVoice)) speak(text);
  }

  // Voices load asynchronously (Chrome, Android): keep the latest list.
  let voices = [];
  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }

  // Best voice for the language: same language and region first, voices installed on the device first.
  function pickVoice(lang) {
    if (!('speechSynthesis' in window)) return null;
    if (!voices.length) loadVoices();
    const wanted = lang === 'es' ? ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-ES', 'es'] : ['en-US', 'en-GB', 'en-AU', 'en'];
    const norm = v => (v.lang || '').replace('_', '-').toLowerCase();
    for (const tag of wanted) {
      const list = voices.filter(v => norm(v).startsWith(tag.toLowerCase()));
      if (list.length) return list.find(v => v.localService) || list[0];
    }
    return null;
  }

  // Speak text in the active language. The data sound is ducked while the voice talks
  // (only a little with opts.light, used for short place names while exploring).
  // If the chosen voice fails (not installed on the phone), try again with the language only, then plain.
  function speak(text, onEnd, opts) {
    if (!('speechSynthesis' in window) || !text) { if (onEnd) onEnd(); return; }
    if (blind && !readAloud) { if (onEnd) onEnd(); return; }   // blind mode: the voice switch is off
    const synth = window.speechSynthesis;
    const lang = EBE.i18n.getLang();
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      if (EBE.audio) EBE.audio.duck(false);
      if (onEnd) onEnd();
    };
    const make = attempt => {
      const u = new SpeechSynthesisUtterance(text);
      if (attempt < 2) u.lang = EBE.i18n.locale();
      const v = attempt === 0 ? pickVoice(lang) : null;
      if (v) { try { u.voice = v; u.lang = v.lang; } catch (e) { /* keep the language only */ } }
      u.rate = 1.0;
      u.onend = finish;
      u.onerror = e => {
        const why = e && e.error;
        if (why === 'interrupted' || why === 'canceled' || attempt >= 2) { finish(); return; }
        synth.speak(make(attempt + 1));
      };
      return u;
    };
    // Safety: some browsers never fire onend.
    setTimeout(finish, 1500 + text.length * 90);
    synth.cancel();
    if (synth.paused) synth.resume();
    if (EBE.audio) EBE.audio.duck(true, opts && opts.light ? 0.7 : 0.35);
    synth.speak(make(0));
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (EBE.audio) EBE.audio.duck(false);
  }

  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('speechSynthesis' in window) {
    // Voices load asynchronously in Chrome.
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }

  // Minimal white line icons (SVG sprite in index.html).
  EBE.icon = name => '<svg class="ic" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';

  EBE.a11y = {
    announce, speak, stopSpeaking, reducedMotion,
    setReadAloud: on => { readAloud = !!on; if (!on) stopSpeaking(); },
    readAloud: () => readAloud,
    setBlind: on => { blind = !!on; },
    isBlind: () => blind
  };
})();

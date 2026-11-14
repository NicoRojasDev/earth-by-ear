// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Screen reader announcements (aria-live), optional speech in the active language, reduced motion.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};

  let readAloud = false;
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

  function pickVoice(lang) {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const wanted = lang === 'es' ? ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-ES', 'es'] : ['en-US', 'en-GB', 'en'];
    for (const tag of wanted) {
      const v = voices.find(x => x.lang && x.lang.replace('_', '-').toLowerCase().startsWith(tag.toLowerCase()));
      if (v) return v;
    }
    return null;
  }

  // Speak text in the active language. The data sound is ducked while the voice talks.
  function speak(text, onEnd) {
    if (!('speechSynthesis' in window) || !text) { if (onEnd) onEnd(); return; }
    const lang = EBE.i18n.getLang();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = EBE.i18n.locale();
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.rate = 1.0;
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      if (EBE.audio) EBE.audio.duck(false);
      if (onEnd) onEnd();
    };
    u.onend = finish; u.onerror = finish;
    // Safety: some browsers never fire onend.
    setTimeout(finish, 1500 + text.length * 90);
    window.speechSynthesis.cancel();
    if (EBE.audio) EBE.audio.duck(true);
    window.speechSynthesis.speak(u);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (EBE.audio) EBE.audio.duck(false);
  }

  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('speechSynthesis' in window) {
    // Voices load asynchronously in Chrome.
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  EBE.a11y = {
    announce, speak, stopSpeaking, reducedMotion,
    setReadAloud: on => { readAloud = !!on; if (!on) stopSpeaking(); },
    readAloud: () => readAloud
  };
})();

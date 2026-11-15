// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// App start-up: welcome screen (standard or blind mode), ARIA tabs, header controls (mode, sound,
// read aloud, language), About panel, deep links.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const t = (k, p) => EBE.i18n.t(k, p);
  const $ = s => document.querySelector(s);

  const tabs = [];       // {id, button, panel, controller}
  let current = null;

  function aboutController() {
    return {
      build(panel) {
        panel.innerHTML = `
          <h2 data-i18n="about.title"></h2>
          <p data-i18n="about.what"></p>
          <h3 data-i18n="about.howTitle"></h3><p data-i18n="about.how"></p>
          <h3 data-i18n="about.dataTitle"></h3><p data-i18n="about.data"></p>
          <ul class="credits">
            <li><a href="https://svs.gsfc.nasa.gov/gallery/earth-information-center/" target="_blank" rel="noopener">Earth Information Center (SVS)</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/5113/" target="_blank" rel="noopener">SVS 5113 · Active Fires As Observed by VIIRS</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/5176/" target="_blank" rel="noopener">SVS 5176 · Sea Surface Temperature Anomaly</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/4285/" target="_blank" rel="noopener">SVS 4285 · Near Real-Time Global Precipitation (IMERG)</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/5147/" target="_blank" rel="noopener">SVS 5147 · GEOS-FP Near-Surface Temperature</a></li>
            <li><a href="https://svs.gsfc.nasa.gov/5151/" target="_blank" rel="noopener">SVS 5151 · Particulate Matter (PM) 2.5</a></li>
          </ul>
          <h3 data-i18n="about.limitsTitle"></h3><p data-i18n="about.limits"></p>
          <h3 data-i18n="about.aiTitle"></h3><p data-i18n="about.ai"></p>
          <h3 data-i18n="about.teamTitle"></h3><p data-i18n="about.team"></p>`;
        EBE.i18n.apply(panel);
      },
      activate() {}, deactivate() {}
    };
  }

  function makeTab(id, controller) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'tab-' + id;
    button.className = 'tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'panel-' + id);
    button.setAttribute('aria-selected', 'false');
    button.tabIndex = -1;
    button.dataset.i18n = 'tab.' + id;
    const panel = document.createElement('section');
    panel.id = 'panel-' + id;
    panel.className = 'panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'tab-' + id);
    panel.tabIndex = 0;
    panel.hidden = true;
    $('#tablist').appendChild(button);
    $('#panels').appendChild(panel);
    const tab = { id, button, panel, controller, built: false };
    button.addEventListener('click', () => select(id, true));
    tabs.push(tab);
    return tab;
  }

  function select(id, focusTab) {
    const tab = tabs.find(x => x.id === id) || tabs[0];
    if (current && current !== tab) {
      current.controller.deactivate();
      current.button.setAttribute('aria-selected', 'false');
      current.button.tabIndex = -1;
      current.panel.hidden = true;
    }
    current = tab;
    tab.button.setAttribute('aria-selected', 'true');
    tab.button.tabIndex = 0;
    tab.panel.hidden = false;
    if (!tab.built && tab.controller.build && !(tab.controller instanceof EBE.PhenomenonTab)) { tab.controller.build(tab.panel); tab.built = true; }
    tab.controller.activate();
    if (focusTab) tab.button.focus();
    if (focusTab && EBE.a11y.isBlind()) sayTopic(tab);
    $('#tb-name').textContent = t('tab.' + tab.id);
    if (location.hash !== '#' + tab.id) history.replaceState(null, '', '#' + tab.id);
    placeBlindBar();
  }

  function onTabKey(e) {
    const i = tabs.indexOf(current);
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabs.length - 1;
    if (j === null) return;
    e.preventDefault();
    select(tabs[j].id, true);
  }

  function updateSoundButton() {
    const btn = $('#btn-sound'), on = EBE.audio.isOn();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.querySelector('[data-label]').textContent = on ? t('header.soundOn') : t('header.enableSound');
    btn.querySelector('[data-sound-icon]').innerHTML = EBE.icon(on ? 'sound' : 'sound-off');
    btn.classList.toggle('on', on);
    updateBlindToggles();
  }

  // Blind mode: data sound and voice are switched on and off separately.
  function updateBlindToggles() {
    const snd = EBE.audio.isOn(), voice = EBE.a11y.readAloud();
    const bs = $('#bt-sound'), bv = $('#bt-voice');
    bs.setAttribute('aria-pressed', snd ? 'true' : 'false');
    bs.querySelector('[data-bt-icon]').innerHTML = EBE.icon(snd ? 'sound' : 'sound-off');
    bs.querySelector('[data-bt-state]').textContent = t(snd ? 'blind.soundOn' : 'blind.soundOff');
    bv.setAttribute('aria-pressed', voice ? 'true' : 'false');
    bv.querySelector('[data-bt-icon]').innerHTML = EBE.icon(voice ? 'voice' : 'voice-off');
    bv.querySelector('[data-bt-state]').textContent = t(voice ? 'blind.voiceOn' : 'blind.voiceOff');
  }

  function updateLangButtons() {
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === EBE.i18n.getLang() ? 'true' : 'false'));
  }

  function sayTopic(tab) {
    const name = t('tab.' + tab.id);
    EBE.a11y.speak(tab.controller instanceof EBE.PhenomenonTab ? t('mode.tabIntro', { tab: name }) : name);
  }

  // Blind mode: big previous / next topic buttons (every tab except About).
  function stepTopic(d) {
    const list = tabs.filter(x => x.id !== 'about');
    const i = Math.max(0, list.indexOf(current));
    const tab = list[(i + d + list.length) % list.length];
    select(tab.id, false);
    sayTopic(tab);
  }

  function welcomeText() {
    const stacked = getComputedStyle($('.welcome-choices')).gridTemplateColumns.split(' ').length < 2;
    return t(stacked ? 'welcome.voiceStacked' : 'welcome.voiceSide');
  }

  // Blind mode instructions: a screen of its own, read aloud, with a big Start button.
  function helpKeys() {
    const big = DOCK_MQ.matches;
    return ['help.s1' + (big ? 'Dock' : ''), 'help.s2', 'help.s3', 'help.s4' + (big ? 'Dock' : ''), 'help.s5', 'help.s6' + (big ? 'Dock' : '')];
  }

  function helpText() {
    const steps = helpKeys().map(k => t(k));
    return [t('help.title') + '.'].concat(steps, t('help.end')).join(' ');
  }

  function showHelp() {
    if (current) current.controller.deactivate();
    document.querySelectorAll('#blind-help .bh-steps li').forEach((li, i) => { li.dataset.i18n = helpKeys()[i]; li.textContent = t(helpKeys()[i]); });
    document.body.classList.add('helpopen');
    $('#blind-help').hidden = false;
    $('#bh-title').focus();
    EBE.a11y.speak(helpText());
  }

  function hideHelp() {
    document.body.classList.remove('helpopen');
    $('#blind-help').hidden = true;
    fitMap();
  }

  function startBlind() {
    hideHelp();
    select(current.id, false);
    $('#tb-name').focus();
    sayTopic(current);
  }

  // Previous / next tab buttons beside the tab list (standard mode).
  function stepTab(d) {
    const i = Math.max(0, tabs.indexOf(current));
    select(tabs[(i + d + tabs.length) % tabs.length].id, true);
  }

  // Big screens (museum walls, kiosks): the header buttons and the tabs move to a dock at the bottom of
  // the screen, within reach of a seated person or a child; the focus order follows.
  const DOCK_MQ = window.matchMedia('(min-width: 1600px)');
  let docked = null;
  function placeDock() {
    if (!docked) docked = ['#topicbar', '.blind-toggles', '.top .controls', '.tabbar'].map(sel => {
      const el = $(sel), mark = document.createComment('dock');
      el.parentNode.insertBefore(mark, el);
      return { el, mark };
    });
    const big = DOCK_MQ.matches, dock = $('#dock');
    docked.forEach(({ el, mark }) => { if (big) dock.appendChild(el); else mark.parentNode.insertBefore(el, mark.nextSibling); });
    dock.appendChild($('#dock-bar'));
    document.body.classList.toggle('docked', big);
    placeBlindBar();
  }
  function padForDock() {
    const dock = $('#dock');
    document.body.style.paddingBottom = DOCK_MQ.matches ? (dock.offsetHeight + 24) + 'px' : '';
    fitMap();
  }

  // Blind mode on a big screen: the topic's buttons (Repeat, Details, Listen over time, the cursor arrows
  // and the speed) join the dock, so every control is at the bottom and the map fills the rest.
  let movedBar = null;
  function placeBlindBar() {
    if (movedBar) { movedBar.mark.parentNode.insertBefore(movedBar.el, movedBar.mark); movedBar.mark.remove(); movedBar = null; }
    const bar = current && current.panel.querySelector('.blind-bar');
    if (DOCK_MQ.matches && EBE.a11y.isBlind() && bar) {
      const mark = document.createComment('blind-bar');
      bar.parentNode.insertBefore(mark, bar);
      $('#dock-bar').appendChild(bar);
      movedBar = { el: bar, mark };
    }
    padForDock();
  }
  // Big screens: the map takes the space left above the dock, so the page does not need scrolling to see
  // it. Blind mode: under the map there is only the spoken line. Standard mode: the hint line.
  // The flat map keeps its 2:1 shape (narrower if needed); the globe sits in the middle of its box.
  function fitMap() {
    document.querySelectorAll('.panel .map').forEach(m => { m.style.height = ''; m.parentNode.style.maxWidth = ''; });
    if (!(DOCK_MQ.matches && current)) return;
    const map = current.panel.querySelector('.map');
    if (!map || current.panel.hidden || document.body.classList.contains('helpopen')) return;
    const blind = EBE.a11y.isBlind(), sphere = map.classList.contains('sphere');
    const top = map.getBoundingClientRect().top + window.scrollY;
    const below = blind ? 72 : (() => { const hint = current.panel.querySelector('.globe-hint'); return (hint && hint.offsetHeight ? hint.offsetHeight + 12 : 0) + 28; })();
    let h = Math.min(window.innerHeight - $('#dock').offsetHeight - top - below, map.offsetWidth / (sphere ? 1.25 : 2));
    map.style.height = Math.max(blind ? 240 : 360, Math.round(h)) + 'px';
    if (blind) {
      const over = document.documentElement.scrollHeight - window.innerHeight;
      if (over > 0) { h -= over; map.style.height = Math.max(240, Math.round(h)) + 'px'; }
    }
    if (!sphere) map.parentNode.style.maxWidth = Math.round(Math.max(240, h) * 2 + 2) + 'px';
  }
  EBE.relayout = () => fitMap();


  function setVoice(on) {
    $('#btn-voice').setAttribute('aria-pressed', on ? 'true' : 'false');
    EBE.a11y.setReadAloud(on);
    updateBlindToggles();
  }

  function updateModeButton() {
    const blind = EBE.a11y.isBlind();
    $('#btn-mode [data-mode-icon]').innerHTML = EBE.icon(blind ? 'ear' : 'eye');
    $('#btn-mode [data-mode-label]').textContent = t(blind ? 'mode.btnBlind' : 'mode.btnStandard');
  }

  // Welcome screen: shown at every visit and from the Mode button.
  function showWelcome() {
    if (current) current.controller.deactivate();
    EBE.a11y.stopSpeaking();
    document.body.classList.add('choosing');
    $('#welcome').hidden = false; $('#main').hidden = true;   // only one visible <main>
    let last = null;
    try { last = localStorage.getItem('ebe.mode'); } catch (e) { /* ignore */ }
    const btn = last && document.querySelector('.choice-big[data-mode="' + last + '"]');
    (btn || $('#welcome-title')).focus();
    if (EBE.globe) EBE.globe.start();
  }

  // Kiosk mode for museum screens (open the page with ?kiosk=1): after 5 minutes without anyone touching
  // the screen, it goes back to the welcome screen with the turning Earth, ready for the next visitor.
  function startKiosk() {
    const IDLE_MS = 300000;
    let timer = 0;
    const busy = () => current && current.controller._state && current.controller._state().playing;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.body.classList.contains('choosing')) return;
        if (busy()) { arm(); return; }       // never cut the Audio Tour in the middle
        showWelcome();
      }, IDLE_MS);
    };
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, arm, { passive: true }));
    document.body.classList.add('kiosk');
    arm();
  }

  function chooseMode(mode) {
    const blind = mode === 'blind';
    try { localStorage.setItem('ebe.mode', mode); } catch (e) { /* ignore */ }
    EBE.a11y.setBlind(blind);
    document.body.classList.toggle('blind', blind);
    document.body.classList.remove('choosing');
    $('#welcome').hidden = true; $('#main').hidden = false;
    if (EBE.globe) EBE.globe.stop();
    // The choice is a tap, so sound (and speech on iPhone) can start now.
    EBE.audio.mute(false);
    if (!EBE.audio.isOn()) EBE.audio.enable();
    setVoice(blind);
    updateModeButton(); updateSoundButton();
    select(current ? current.id : tabs[0].id, false);
    (blind ? $('#tb-name') : current.button).focus();
    if (blind) showHelp();
    else { hideHelp(); EBE.a11y.announce(t('mode.standardOn')); }
  }

  function init() {
    EBE.config.phenomena.filter(p => p.enabled).forEach(p => {
      const tab = makeTab(p.id, null);
      tab.controller = new EBE.PhenomenonTab(p, tab.panel);
    });
    makeTab('tour', EBE.Tour);
    makeTab('game', EBE.Game);
    makeTab('about', aboutController());
    const ins = makeTab('insights', EBE.Insights);
    ins.button.classList.add('important');
    $('#tab-prev').addEventListener('click', () => stepTab(-1));
    $('#tab-next').addEventListener('click', () => stepTab(1));
    $('#tablist').addEventListener('keydown', onTabKey);
    placeDock();
    if (DOCK_MQ.addEventListener) DOCK_MQ.addEventListener('change', placeDock);
    if (window.ResizeObserver) new ResizeObserver(padForDock).observe($('#dock'));
    window.addEventListener('resize', fitMap);

    $('#btn-sound').addEventListener('click', () => {
      if (EBE.audio.isOn()) { EBE.audio.disable(); EBE.audio.mute(true); }
      else if (!EBE.audio.enable()) { EBE.a11y.announce(t('header.noAudio')); return; }
      else EBE.audio.mute(false);
      updateSoundButton();
      EBE.a11y.announce(EBE.audio.isOn() ? t('header.soundOn') : t('header.soundOff'));
    });
    EBE.audio.onToggle(updateSoundButton);

    $('#btn-voice').addEventListener('click', e => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      setVoice(on);
      if (on) EBE.a11y.speak(t('header.readAloud'));
    });

    // Choosing a language is a tap, so the voice can start: on the welcome screen it explains the two modes,
    // on the blind-mode instructions it reads them again, always in the language just chosen.
    document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
      EBE.i18n.setLang(b.dataset.lang);
      if (document.body.classList.contains('choosing')) EBE.a11y.speak(welcomeText());
      else if (!$('#blind-help').hidden) EBE.a11y.speak(helpText());
    }));
    document.querySelectorAll('.choice-big[data-mode]').forEach(b => b.addEventListener('click', () => chooseMode(b.dataset.mode)));
    $('#btn-mode').addEventListener('click', showWelcome);
    $('#btn-help').addEventListener('click', showHelp);
    $('#bt-sound').addEventListener('click', () => {
      if (EBE.audio.isOn()) { EBE.audio.disable(); EBE.audio.mute(true); }
      else { EBE.audio.mute(false); EBE.audio.enable(); }
      updateSoundButton();
      EBE.a11y.announce(t(EBE.audio.isOn() ? 'blind.soundOnMsg' : 'blind.soundOffMsg'));
    });
    $('#bt-voice').addEventListener('click', () => {
      const on = !EBE.a11y.readAloud();
      setVoice(on);
      if (on) EBE.a11y.speak(t('blind.voiceOnMsg'));
      else EBE.a11y.announce(t('blind.voiceOffMsg'));
    });
    $('#bh-start').addEventListener('click', startBlind);
    $('#bh-replay').addEventListener('click', () => EBE.a11y.speak(helpText()));
    $('#tb-prev').addEventListener('click', () => stepTopic(-1));
    $('#tb-next').addEventListener('click', () => stepTopic(1));
    EBE.i18n.onChange(() => {
      updateLangButtons(); updateSoundButton(); updateModeButton();
      if (current) $('#tb-name').textContent = t('tab.' + current.id);
      EBE.i18n.apply($('#dock-bar'));
      tabs.forEach(tab => {
        if (tab.controller.onLangChange) tab.controller.onLangChange();
        else if (tab.built) EBE.i18n.apply(tab.panel);
      });
    });

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) $('#ios-note').hidden = false;

    EBE.i18n.apply();
    updateLangButtons();
    updateSoundButton();
    updateModeButton();
    const fromHash = location.hash.replace('#', '');
    select(tabs.some(x => x.id === fromHash) ? fromHash : tabs[0].id, false);
    showWelcome();
    if (new URLSearchParams(location.search).has('kiosk')) startKiosk();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

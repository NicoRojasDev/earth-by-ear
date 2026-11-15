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
  function helpText() {
    const steps = ['help.s1', 'help.s2', 'help.s3', 'help.s4', 'help.s5', 'help.s6'].map(k => t(k));
    return [t('help.title') + '.'].concat(steps, t('help.end')).join(' ');
  }

  function showHelp() {
    if (current) current.controller.deactivate();
    document.body.classList.add('helpopen');
    $('#blind-help').hidden = false;
    $('#bh-title').focus();
    EBE.a11y.speak(helpText());
  }

  function hideHelp() {
    document.body.classList.remove('helpopen');
    $('#blind-help').hidden = true;
  }

  function startBlind() {
    hideHelp();
    select(current.id, false);
    $('#tb-name').focus();
    sayTopic(current);
  }

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
  }

  function chooseMode(mode) {
    const blind = mode === 'blind';
    try { localStorage.setItem('ebe.mode', mode); } catch (e) { /* ignore */ }
    EBE.a11y.setBlind(blind);
    document.body.classList.toggle('blind', blind);
    document.body.classList.remove('choosing');
    $('#welcome').hidden = true; $('#main').hidden = false;
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
    $('#tablist').addEventListener('keydown', onTabKey);

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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

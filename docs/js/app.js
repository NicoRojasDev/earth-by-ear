// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// App start-up: ARIA tabs, header controls (sound, read aloud, language), About panel, deep links.
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
    btn.classList.toggle('on', on);
  }

  function updateLangButtons() {
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === EBE.i18n.getLang() ? 'true' : 'false'));
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
      if (EBE.audio.isOn()) EBE.audio.disable();
      else if (!EBE.audio.enable()) { EBE.a11y.announce(t('header.noAudio')); return; }
      updateSoundButton();
      EBE.a11y.announce(EBE.audio.isOn() ? t('header.soundOn') : t('header.soundOff'));
    });
    EBE.audio.onToggle(updateSoundButton);

    $('#btn-voice').addEventListener('click', e => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false');
      EBE.a11y.setReadAloud(on);
      if (on) EBE.a11y.speak(t('header.readAloud'));
    });

    document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => EBE.i18n.setLang(b.dataset.lang)));
    EBE.i18n.onChange(() => {
      updateLangButtons(); updateSoundButton();
      tabs.forEach(tab => {
        if (tab.controller.onLangChange) tab.controller.onLangChange();
        else if (tab.built) EBE.i18n.apply(tab.panel);
      });
    });

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) $('#ios-note').hidden = false;

    EBE.i18n.apply();
    updateLangButtons();
    updateSoundButton();
    const fromHash = location.hash.replace('#', '');
    select(tabs.some(x => x.id === fromHash) ? fromHash : tabs[0].id, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

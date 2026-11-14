// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Narrated Audio Tour (P9). For now it only shows what it will be.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  EBE.Tour = {
    build(panel) {
      panel.innerHTML = '<h2 data-i18n="tour.title"></h2><p class="lead" data-i18n="tour.lead"></p><p class="note" data-i18n="tour.soon"></p>';
      EBE.i18n.apply(panel);
    },
    activate() {}, deactivate() {}
  };
})();

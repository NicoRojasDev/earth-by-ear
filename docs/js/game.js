// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Listening game (P8). For now it only shows what it will be.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  EBE.Game = {
    build(panel) {
      panel.innerHTML = '<h2 data-i18n="game.title"></h2><p class="lead" data-i18n="game.lead"></p><p class="note" data-i18n="game.soon"></p>';
      EBE.i18n.apply(panel);
    },
    activate() {}, deactivate() {}
  };
})();

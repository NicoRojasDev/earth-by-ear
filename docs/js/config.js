// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Which phenomena the web shows, their instrument and how to read their values.
// Adding a phenomenon = one block here + its texts in i18n.js + docs/data/<id>.js from build_data.py.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};

  EBE.config = {
    phenomena: [
      {
        id: 'fire', enabled: true, type: 'points', instrument: 'crackle',
        // stats shown in the panel: [summary key, i18n label suffix]
        stats: [['count', 'count'], ['meanIntensity', 'meanFrp'], ['maxPlace', 'maxPlace']],
        decimals: 1
      },
      {
        id: 'ocean', enabled: true, type: 'field', instrument: 'cello',
        stats: [['mean', 'mean'], ['shareAbove', 'warmShare'], ['maxPlace', 'maxPlace']], shareThreshold: 1, decimals: 1, signed: true
      },
      {
        id: 'rain', enabled: true, type: 'field', instrument: 'drops',
        stats: [['shareAbove', 'share'], ['meanWhere', 'mean'], ['maxPlace', 'maxPlace']], shareThreshold: 0.1, dryBelow: 0.1, decimals: 1
      },
      {
        id: 'air', enabled: true, type: 'field', instrument: 'pad',
        stats: [['mean', 'mean'], ['shareAbove', 'hotShare'], ['maxPlace', 'maxPlace']], shareThreshold: 30, decimals: 1
      },
      {
        id: 'smoke', enabled: true, type: 'field', instrument: 'smog',
        stats: [['mean', 'mean'], ['shareAbove', 'badShare'], ['maxPlace', 'maxPlace']], shareThreshold: 25, decimals: 0
      }
    ],
    tools: ['tour', 'game', 'about'],

    sound: {
      maxEventsPerSecond: 60,   // hard cap for every instrument
      maxVoices: 28,            // simultaneous short sounds
      frameSeconds: 1.8,        // Listen: time per frame at speed 1x
      exploreRadiusKm: 350,     // fires closer than this crackle in Explore
      cursorStepDeg: 3          // arrow keys move the Explore cursor this much
    }
  };

  EBE.config.byId = id => EBE.config.phenomena.find(p => p.id === id);
})();

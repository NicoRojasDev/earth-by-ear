// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Bilingual dictionary (English default, Spanish), t(key, params), number/date formatting.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};

  const DICT = {
    en: {
      'app.title': 'Earth by Ear',
      'app.tagline': 'Touchable sound in everyone\'s pocket.',
      'app.intro': 'NASA Earth Information Center visuals turned into live, touchable sound. Listen to the animation, or slide your finger over the map and hear each place.',
      'header.skip': 'Skip to content',
      'header.enableSound': 'Enable sound',
      'header.soundOn': 'Sound on',
      'header.soundOff': 'Sound off',
      'header.readAloud': 'Read aloud',
      'header.language': 'Language',
      'header.iosNote': 'On iPhone, turn off silent mode to hear the sound.',
      'header.noAudio': 'This browser cannot generate sound.',
      'tabs.label': 'Phenomena and tools',
      'tab.fire': 'Fires',
      'tab.ocean': 'Ocean Heat',
      'tab.rain': 'Rain & Snow',
      'tab.air': 'Air Temperature',
      'tab.smoke': 'Air Quality',
      'tab.tour': 'Audio Tour',
      'tab.game': 'Game',
      'tab.about': 'About',
      'common.loading': 'Loading data…',
      'common.loadError': 'The data for this tab could not be loaded.',
      'common.simulated': 'Simulated data',
      'common.real': 'Real NASA data',
      'common.play': 'Play',
      'common.pause': 'Pause',
      'common.prev': 'Previous frame',
      'common.next': 'Next frame',
      'common.speed': 'Speed',
      'common.timeline': 'Timeline',
      'common.frameOf': 'Frame {n} of {total}',
      'common.mode': 'Mode',
      'common.listen': 'Listen',
      'common.explore': 'Explore',
      'common.listenHelp': 'Listen: the animation plays by itself and you hear each moment.',
      'common.exploreHelp': 'Explore: drag your finger or mouse over the map, or use the arrow keys. Press Enter to hear the value.',
      'common.keys': 'Keys: Space play/pause · ←/→ move · Enter describe · M switch mode',
      'common.data': 'Key numbers',
      'common.level': 'Level vs. period',
      'common.howItSounds': 'How it sounds',
      'common.dataCol': 'Data',
      'common.soundCol': 'Sound',
      'common.source': 'Source',
      'common.mapLabel': 'Interactive map. In Explore mode, use the arrow keys to move and Enter to hear the value.',
      'common.noData': 'No data here',
      'common.near': 'near {place}',
      'common.cursorAt': 'Cursor: {place}',
      'level.low': 'low',
      'level.normal': 'normal',
      'level.high': 'high',
      'level.veryHigh': 'very high',
      'sound.identity': 'Instrument',
      'sound.intensity': 'Higher value',
      'sound.intensityText': 'denser, brighter and louder',
      'sound.space': 'West ↔ East',
      'sound.spaceText': 'left ↔ right speaker',
      'sound.northSouth': 'North ↔ South (Explore)',
      'sound.northSouthText': 'higher ↔ lower pitch',
      'sound.alert': 'Above the period average',
      'sound.alertText': 'a tense background chord comes in',

      'fire.name': 'Fires',
      'fire.lead': 'Active fires detected by the VIIRS satellite sensor in a moving 5-day window. Each dot is a fire; brighter dots are more intense.',
      'fire.instrument': 'Crackling (filtered noise grains)',
      'fire.stat.count': 'Active fires',
      'fire.stat.meanFrp': 'Average intensity',
      'fire.stat.maxPlace': 'Most intense fire',
      'fire.desc': '{date}: {count} active fires. Level {level} for this period. The most intense fire is {place}.',
      'fire.exploreNear': '{count} fires within {km} km. Nearest: {dist} km {dir}.',
      'fire.exploreOn': 'You are on a fire, {place}. {count} fires within {km} km.',
      'fire.exploreNone': 'No fires in this frame.',
      'fire.value': '{value} {units}',
      'fire.credit': 'NASA Scientific Visualization Studio, SVS 5113: Active Fires As Observed by VIIRS, 2024-Present.',

      'ocean.name': 'Ocean Heat',
      'ocean.lead': 'Sea surface temperature anomaly: how much warmer or cooler the ocean is than normal for that date and place.',
      'ocean.instrument': 'Low cello-like drone',
      'ocean.stat.mean': 'Average anomaly',
      'ocean.stat.warmShare': 'Ocean ≥ +1 °C',
      'ocean.stat.maxPlace': 'Warmest spot',
      'ocean.desc': '{date}: average ocean anomaly {mean}. {share} of the ocean is at least 1 °C warmer than normal. Level {level}. Warmest spot: {max}, {place}.',
      'ocean.credit': 'NASA Scientific Visualization Studio, SVS 5176: Sea Surface Temperature (SST) Anomaly - Near Real Time.',

      'rain.name': 'Rain & Snow',
      'rain.lead': 'Near real-time precipitation from the IMERG satellite constellation, every half hour.',
      'rain.instrument': 'Drops (short "plink" notes) and a soft hiss',
      'rain.stat.share': 'Area with rain or snow',
      'rain.stat.mean': 'Average where it falls',
      'rain.stat.maxPlace': 'Heaviest',
      'rain.desc': '{date}: rain or snow over {share} of the map. Level {level}. Heaviest: {max}, {place}.',
      'rain.credit': 'NASA Scientific Visualization Studio, SVS 4285: Near Real-Time Global Precipitation (IMERG).',

      'air.name': 'Air Temperature',
      'air.lead': 'Air temperature near the surface from NASA\'s GEOS-FP model, hour by hour.',
      'air.instrument': 'Warm pad and a whistle',
      'air.stat.mean': 'Average',
      'air.stat.hotShare': 'Area ≥ 30 °C',
      'air.stat.maxPlace': 'Hottest',
      'air.desc': '{date}: average {mean}. {share} of the map is at 30 °C or more. Level {level}. Hottest: {max}, {place}.',
      'air.credit': 'NASA Scientific Visualization Studio, SVS 5147: GEOS-FP Near-Surface Temperature.',

      'smoke.name': 'Air Quality',
      'smoke.lead': 'Fine particles in the air (PM2.5: smoke, dust and pollution) from NASA\'s GEOS-CF model, hour by hour.',
      'smoke.instrument': 'Muffled, dense rumble ("smog")',
      'smoke.stat.mean': 'Average',
      'smoke.stat.badShare': 'Area ≥ 25 µg/m³',
      'smoke.stat.maxPlace': 'Most polluted',
      'smoke.desc': '{date}: average {mean}. {share} of the map is at 25 µg/m³ or more. Level {level}. Most polluted: {max}, {place}.',
      'smoke.credit': 'NASA Scientific Visualization Studio, SVS 5151: Particulate Matter (PM) 2.5.',

      'tour.title': 'Audio Tour',
      'tour.lead': 'A guided, narrated tour to use without looking at the screen.',
      'tour.soon': 'The Audio Tour is being built. Meanwhile, try Listen and Explore in each phenomenon tab.',
      'game.title': 'Listening game',
      'game.lead': 'Hear a 3-second clip and guess the phenomenon and how intense it is. Your answers also tell us whether the sounds work.',
      'game.soon': 'The game is being built. It will be ready on Sunday morning.',

      'about.title': 'About Earth by Ear',
      'about.what': 'Earth by Ear turns visualizations from NASA\'s Earth Information Center (EIC) into live sound you can touch and explore, with or without seeing the map. It was made for the NASA International Space Apps Challenge 2026, challenge "The Earth Information Jukebox".',
      'about.howTitle': 'How data becomes sound',
      'about.how': 'Each phenomenon has its own instrument. The values come from the colors of the real EIC frames, translated with each visualization\'s colorbar. Higher values sound denser, brighter and louder; west–east is left–right; in Explore, north–south is higher–lower pitch. When a value is above the period average, a tense background chord comes in. All notes use a pentatonic scale.',
      'about.dataTitle': 'Data and credits',
      'about.data': 'All visualizations: NASA\'s Scientific Visualization Studio (svs.gsfc.nasa.gov), from the Earth Information Center collection.',
      'about.limitsTitle': 'Honest limitations',
      'about.limits': 'Values are read from image colors, not from calibrated measurements, so they are approximations. A 2° grid averages out local detail. Each phenomenon covers its own period, from days to years.',
      'about.aiTitle': 'AI disclosure',
      'about.ai': 'This project was built with the assistance of Claude (Anthropic) for writing code. All sounds are synthesized live in your browser by our code; no AI-generated audio, images or video are used.',
      'about.teamTitle': 'Team',
      'about.team': 'Three Data Science and AI students from ITSE, Santiago del Estero, Argentina.',

      'place.coords': '{lat}, {lon}',
      'dir.n': 'north', 'dir.ne': 'north-east', 'dir.e': 'east', 'dir.se': 'south-east',
      'dir.s': 'south', 'dir.sw': 'south-west', 'dir.w': 'west', 'dir.nw': 'north-west'
    },
    es: {
      'app.title': 'Earth by Ear',
      'app.tagline': 'Sonido que se toca, en el bolsillo de todos.',
      'app.intro': 'Visualizaciones del Earth Information Center de NASA convertidas en sonido en vivo que se puede tocar. Escuchá la animación o deslizá el dedo por el mapa y escuchá cada lugar.',
      'header.skip': 'Ir al contenido',
      'header.enableSound': 'Activar sonido',
      'header.soundOn': 'Sonido activado',
      'header.soundOff': 'Sonido apagado',
      'header.readAloud': 'Leer en voz alta',
      'header.language': 'Idioma',
      'header.iosNote': 'En iPhone, sacá el modo silencio para escuchar el sonido.',
      'header.noAudio': 'Este navegador no puede generar sonido.',
      'tabs.label': 'Fenómenos y herramientas',
      'tab.fire': 'Incendios',
      'tab.ocean': 'Calor del mar',
      'tab.rain': 'Lluvia y nieve',
      'tab.air': 'Temperatura del aire',
      'tab.smoke': 'Calidad del aire',
      'tab.tour': 'Recorrido sonoro',
      'tab.game': 'Juego',
      'tab.about': 'Acerca de',
      'common.loading': 'Cargando datos…',
      'common.loadError': 'No se pudieron cargar los datos de esta pestaña.',
      'common.simulated': 'Datos simulados',
      'common.real': 'Datos reales de NASA',
      'common.play': 'Reproducir',
      'common.pause': 'Pausa',
      'common.prev': 'Momento anterior',
      'common.next': 'Momento siguiente',
      'common.speed': 'Velocidad',
      'common.timeline': 'Línea de tiempo',
      'common.frameOf': 'Momento {n} de {total}',
      'common.mode': 'Modo',
      'common.listen': 'Escuchar',
      'common.explore': 'Explorar',
      'common.listenHelp': 'Escuchar: la animación avanza sola y escuchás cada momento.',
      'common.exploreHelp': 'Explorar: deslizá el dedo o el mouse por el mapa, o usá las flechas. Apretá Enter para escuchar el valor.',
      'common.keys': 'Teclas: Espacio reproducir/pausa · ←/→ mover · Enter describir · M cambiar de modo',
      'common.data': 'Números clave',
      'common.level': 'Nivel frente al período',
      'common.howItSounds': 'Cómo suena',
      'common.dataCol': 'Dato',
      'common.soundCol': 'Sonido',
      'common.source': 'Fuente',
      'common.mapLabel': 'Mapa interactivo. En el modo Explorar, usá las flechas para moverte y Enter para escuchar el valor.',
      'common.noData': 'Sin datos acá',
      'common.near': 'cerca de {place}',
      'common.cursorAt': 'Cursor: {place}',
      'level.low': 'bajo',
      'level.normal': 'normal',
      'level.high': 'alto',
      'level.veryHigh': 'muy alto',
      'sound.identity': 'Instrumento',
      'sound.intensity': 'Valor más alto',
      'sound.intensityText': 'más denso, más brillante y más fuerte',
      'sound.space': 'Oeste ↔ Este',
      'sound.spaceText': 'parlante izquierdo ↔ derecho',
      'sound.northSouth': 'Norte ↔ Sur (Explorar)',
      'sound.northSouthText': 'más agudo ↔ más grave',
      'sound.alert': 'Por encima del promedio del período',
      'sound.alertText': 'entra un acorde de fondo tenso',

      'fire.name': 'Incendios',
      'fire.lead': 'Focos de incendio activos detectados por el sensor satelital VIIRS en una ventana móvil de 5 días. Cada punto es un foco; los más brillantes son más intensos.',
      'fire.instrument': 'Chisporroteo (granos de ruido filtrado)',
      'fire.stat.count': 'Focos activos',
      'fire.stat.meanFrp': 'Intensidad media',
      'fire.stat.maxPlace': 'Foco más intenso',
      'fire.desc': '{date}: {count} focos activos. Nivel {level} para este período. El foco más intenso está {place}.',
      'fire.exploreNear': '{count} focos a menos de {km} km. El más cercano: {dist} km al {dir}.',
      'fire.exploreOn': 'Estás sobre un incendio, {place}. {count} focos a menos de {km} km.',
      'fire.exploreNone': 'No hay focos en este momento.',
      'fire.value': '{value} {units}',
      'fire.credit': 'NASA Scientific Visualization Studio, SVS 5113: Active Fires As Observed by VIIRS, 2024-Present.',

      'ocean.name': 'Calor del mar',
      'ocean.lead': 'Anomalía de la temperatura del mar: cuánto más caliente o más frío está el océano que lo normal para esa fecha y ese lugar.',
      'ocean.instrument': 'Drone grave tipo violonchelo',
      'ocean.stat.mean': 'Anomalía media',
      'ocean.stat.warmShare': 'Mar a +1 °C o más',
      'ocean.stat.maxPlace': 'Punto más cálido',
      'ocean.desc': '{date}: anomalía media del mar {mean}. El {share} del océano está al menos 1 °C más caliente que lo normal. Nivel {level}. Punto más cálido: {max}, {place}.',
      'ocean.credit': 'NASA Scientific Visualization Studio, SVS 5176: Sea Surface Temperature (SST) Anomaly - Near Real Time.',

      'rain.name': 'Lluvia y nieve',
      'rain.lead': 'Precipitación casi en tiempo real de la constelación de satélites IMERG, cada media hora.',
      'rain.instrument': 'Gotas (notas cortas tipo "plink") y un siseo suave',
      'rain.stat.share': 'Área con lluvia o nieve',
      'rain.stat.mean': 'Promedio donde cae',
      'rain.stat.maxPlace': 'Más intensa',
      'rain.desc': '{date}: lluvia o nieve sobre el {share} del mapa. Nivel {level}. Más intensa: {max}, {place}.',
      'rain.credit': 'NASA Scientific Visualization Studio, SVS 4285: Near Real-Time Global Precipitation (IMERG).',

      'air.name': 'Temperatura del aire',
      'air.lead': 'Temperatura del aire cerca de la superficie, del modelo GEOS-FP de NASA, hora por hora.',
      'air.instrument': 'Colchón cálido y un silbido',
      'air.stat.mean': 'Promedio',
      'air.stat.hotShare': 'Área a 30 °C o más',
      'air.stat.maxPlace': 'Más caluroso',
      'air.desc': '{date}: promedio {mean}. El {share} del mapa está a 30 °C o más. Nivel {level}. Más caluroso: {max}, {place}.',
      'air.credit': 'NASA Scientific Visualization Studio, SVS 5147: GEOS-FP Near-Surface Temperature.',

      'smoke.name': 'Calidad del aire',
      'smoke.lead': 'Partículas finas en el aire (PM2.5: humo, polvo y contaminación), del modelo GEOS-CF de NASA, hora por hora.',
      'smoke.instrument': 'Retumbo apagado y denso ("smog")',
      'smoke.stat.mean': 'Promedio',
      'smoke.stat.badShare': 'Área a 25 µg/m³ o más',
      'smoke.stat.maxPlace': 'Más contaminado',
      'smoke.desc': '{date}: promedio {mean}. El {share} del mapa está a 25 µg/m³ o más. Nivel {level}. Más contaminado: {max}, {place}.',
      'smoke.credit': 'NASA Scientific Visualization Studio, SVS 5151: Particulate Matter (PM) 2.5.',

      'tour.title': 'Recorrido sonoro',
      'tour.lead': 'Un recorrido guiado y narrado para usar sin mirar la pantalla.',
      'tour.soon': 'El recorrido sonoro está en construcción. Mientras tanto, probá Escuchar y Explorar en cada fenómeno.',
      'game.title': 'Juego de escucha',
      'game.lead': 'Escuchá un clip de 3 segundos y adiviná el fenómeno y qué tan intenso está. Tus respuestas también nos dicen si los sonidos funcionan.',
      'game.soon': 'El juego está en construcción. Va a estar listo el domingo a la mañana.',

      'about.title': 'Acerca de Earth by Ear',
      'about.what': 'Earth by Ear convierte visualizaciones del Earth Information Center (EIC) de NASA en sonido en vivo que se puede tocar y explorar, con o sin ver el mapa. Lo hicimos para el NASA International Space Apps Challenge 2026, desafío "The Earth Information Jukebox".',
      'about.howTitle': 'Cómo los datos se vuelven sonido',
      'about.how': 'Cada fenómeno tiene su propio instrumento. Los valores salen de los colores de los fotogramas reales del EIC, traducidos con la barra de colores de cada visualización. Los valores más altos suenan más densos, más brillantes y más fuertes; oeste–este es izquierda–derecha; en Explorar, norte–sur es más agudo–más grave. Cuando un valor supera el promedio del período, entra un acorde de fondo tenso. Todas las notas usan una escala pentatónica.',
      'about.dataTitle': 'Datos y créditos',
      'about.data': 'Todas las visualizaciones: NASA\'s Scientific Visualization Studio (svs.gsfc.nasa.gov), de la colección del Earth Information Center.',
      'about.limitsTitle': 'Limitaciones honestas',
      'about.limits': 'Los valores se leen de los colores de la imagen, no de mediciones calibradas, así que son aproximaciones. La grilla de 2° promedia los detalles locales. Cada fenómeno cubre su propio período, de días a años.',
      'about.aiTitle': 'Uso de IA',
      'about.ai': 'Este proyecto se hizo con la ayuda de Claude (Anthropic) para escribir el código. Todos los sonidos los genera en vivo nuestro código en tu navegador; no usamos audio, imágenes ni video generados con IA.',
      'about.teamTitle': 'Equipo',
      'about.team': 'Tres estudiantes de Ciencia de Datos e IA del ITSE, Santiago del Estero, Argentina.',

      'place.coords': '{lat}, {lon}',
      'dir.n': 'norte', 'dir.ne': 'noreste', 'dir.e': 'este', 'dir.se': 'sureste',
      'dir.s': 'sur', 'dir.sw': 'suroeste', 'dir.w': 'oeste', 'dir.nw': 'noroeste'
    }
  };

  const LOCALES = { en: 'en-US', es: 'es-AR' };
  const warned = new Set();
  const listeners = [];
  let lang = 'en';

  function t(key, params) {
    let s = DICT[lang][key];
    if (s === undefined) {
      if (!warned.has(lang + key)) { warned.add(lang + key); console.warn('[i18n] missing key', lang, key); }
      s = DICT.en[key];
      if (s === undefined) return key;
    }
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
    return s;
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
  }

  function setLang(next) {
    if (!DICT[next]) return;
    lang = next;
    document.documentElement.lang = LOCALES[lang];
    try { localStorage.setItem('ebe.lang', lang); } catch (e) { /* storage may be blocked */ }
    apply();
    listeners.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
  }

  function num(n, digits) {
    const d = digits === undefined ? 0 : digits;
    return new Intl.NumberFormat(LOCALES[lang], { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  }

  function date(iso) {
    if (!iso) return '';
    const hasTime = iso.length > 10;
    const d = new Date(hasTime ? iso : iso + 'T12:00:00Z');
    const opts = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
    if (hasTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; opts.hour12 = false; }
    return new Intl.DateTimeFormat(LOCALES[lang], opts).format(d) + (hasTime ? ' UTC' : '');
  }

  // Same keys in both languages: warn once at start-up if not.
  (function checkKeys() {
    const en = Object.keys(DICT.en), es = Object.keys(DICT.es);
    en.filter(k => !(k in DICT.es)).forEach(k => console.warn('[i18n] missing in es:', k));
    es.filter(k => !(k in DICT.en)).forEach(k => console.warn('[i18n] missing in en:', k));
  })();

  let stored = null;
  try { stored = localStorage.getItem('ebe.lang'); } catch (e) { /* ignore */ }
  lang = DICT[stored] ? stored : 'en';
  document.documentElement.lang = LOCALES[lang];

  EBE.i18n = {
    t, apply, setLang, num, date,
    getLang: () => lang,
    locale: () => LOCALES[lang],
    onChange: fn => listeners.push(fn)
  };
})();

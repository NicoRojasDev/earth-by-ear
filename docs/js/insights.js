// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// "Insights" tab: the key numbers we measured, and the problems and possible solutions we see as
// data science students. Numbers come from the app's own data files and from our NASA FIRMS check
// (pitch/validation.md); dates are those of the data in this app.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};

  const C = {
    en: {
      title: 'Insights: what the data says',
      lead: 'What we learned as data science students after reading about 300 NASA frames and checking them against NASA FIRMS. Dates are those of the data in this app.',
      listen: 'Listen to the summary',
      numbersTitle: 'Key numbers',
      numbers: [
        ['0.93', 'rank correlation between the fire spots we read and NASA FIRMS detections (5 regions, 60 five-day windows, 2026).'],
        ['15.5 °C', 'area-weighted mean air temperature on 13 Nov 2026, close to the known global mean of about 15 °C.'],
        ['75%', 'of the ocean was warmer than normal on 11 Nov 2026; 41% was at least 1 °C warmer.'],
        ['39 °C', 'in the Gran Chaco, next to Santiago del Estero: the hottest 2° cell on Earth on 10, 11 and 12 Nov 2026.'],
        ['1,804 → 3,925', 'fire spots per five-day window in 2026, from the quietest (17 Jun) to the busiest (20 Oct).'],
        ['225 µg/m³', 'highest fine-particle (PM2.5) cell on 13 Nov 2026, in northern China; 2.5% of the planet was above 15 µg/m³.'],
      ],
      problemsTitle: 'Problems and possible solutions',
      labels: ['What the data shows', 'Problem', 'Possible solutions'],
      problems: [
        ['Fires in our region',
         'In Santiago del Estero, NASA FIRMS detections peak in August and September: 1,435 in the five days to 5 Sep 2026. In the whole Gran Chaco: 7,001 in the five days to 30 Sep.',
         'Smoke, loss of native forest and soil, and risk for rural communities, every dry season.',
         'Send satellite fire alerts (FIRMS) to local brigades; burning rules for the dry season; map the areas that burn every year to plan prevention.'],
        ['Extreme heat',
         'From 10 to 12 Nov 2026 the hottest 2° cell on Earth was in the Gran Chaco, up to 39 °C. On 13 Nov, 5.5% of the planet was at 30 °C or more.',
         'Heat stress for outdoor workers, older people and children, and more demand for water and power.',
         'Early heat alerts, shade and drinking-water points, adjusted work hours and more urban trees.'],
        ['A warmer ocean',
         'On 11 Nov 2026, 75% of the ocean was warmer than normal for the date, and 41% at least 1 °C warmer.',
         'Marine heat waves stress fisheries and ecosystems, and a warmer sea can feed heavier rain.',
         'Monitor marine heat waves, share the data with fisheries and coastal towns, and teach it in schools.'],
        ['Air quality',
         'On 13 Nov 2026 the dirtiest air reached 225 µg/m³ of PM2.5 in northern China; 2.5% of the planet was above 15 µg/m³, the WHO 24-hour guideline.',
         'Fine particles harm the lungs and the heart; fire smoke adds to them near burning areas.',
         'Air-quality alerts, less open burning, and filters or masks on bad days.'],
        ['Climate data is made for the eyes',
         'At least 2.2 billion people live with a vision impairment or blindness (WHO). Museum climate exhibits are mostly giant screens.',
         'Blind and low-vision people are left out of climate information and exhibits.',
         'Sonification like Earth by Ear: touch screens that speak and sound, in more than one language, with nothing to install.'],
        ['Limits of our own data (a data science view)',
         'Our values are read from image colors on a 2° grid; fire counts saturate where fires are very dense; the data is a fixed snapshot (fires until 30 Oct 2026).',
         'Approximate values, and an app that does not update itself.',
         'Read the raw data from NASA Earthdata and the FIRMS API, run the pipeline automatically every day, use a finer grid and show the uncertainty.'],
      ],
      methodTitle: 'How we got these numbers',
      method: 'A Python pipeline (OpenCV, NumPy, pandas) reads each NASA frame, turns every pixel into a value with the visualization’s own colorbar, averages it on a 2° grid weighted by area, and computes the statistics. The fire spots were checked against NASA FIRMS with Spearman, Pearson and log-Pearson correlations. Details: pitch/validation.md in the project’s GitHub repository.',
      spoken: 'Insights. Our fire readings match NASA FIRMS with a rank correlation of 0.93. In Santiago del Estero, fires peak in August and September. From 10 to 12 November 2026 the hottest place on Earth was the Gran Chaco, up to 39 degrees. On 11 November, three quarters of the ocean was warmer than normal. On 13 November the dirtiest air was in northern China. Climate data is mostly made for the eyes, so we made it audible.',
    },
    es: {
      title: 'Hallazgos: qué dicen los datos',
      lead: 'Lo que aprendimos como estudiantes de Ciencia de Datos después de leer unos 300 fotogramas de la NASA y compararlos con NASA FIRMS. Las fechas son las de los datos de esta app.',
      listen: 'Escuchar el resumen',
      numbersTitle: 'Números clave',
      numbers: [
        ['0,93', 'correlación de rangos entre los focos que leemos y las detecciones de NASA FIRMS (5 regiones, 60 ventanas de 5 días, 2026).'],
        ['15,5 °C', 'temperatura media del aire ponderada por área el 13 nov 2026, cerca de la media global conocida de unos 15 °C.'],
        ['75 %', 'del océano estaba más cálido que lo normal el 11 nov 2026; el 41 %, al menos 1 °C más cálido.'],
        ['39 °C', 'en el Gran Chaco, al lado de Santiago del Estero: la celda de 2° más calurosa del planeta el 10, 11 y 12 nov 2026.'],
        ['1.804 → 3.925', 'focos de incendio por ventana de 5 días en 2026, de la más tranquila (17 jun) a la de más focos (20 oct).'],
        ['225 µg/m³', 'celda con más partículas finas (PM2,5) el 13 nov 2026, en el norte de China; el 2,5 % del planeta superaba 15 µg/m³.'],
      ],
      problemsTitle: 'Problemáticas y posibles soluciones',
      labels: ['Qué muestran los datos', 'Problemática', 'Posibles soluciones'],
      problems: [
        ['Incendios en nuestra región',
         'En Santiago del Estero, las detecciones de NASA FIRMS llegan al máximo en agosto y septiembre: 1.435 en los 5 días al 5 sep 2026. En todo el Gran Chaco: 7.001 en los 5 días al 30 sep.',
         'Humo, pérdida de monte nativo y de suelo, y riesgo para las comunidades rurales en cada temporada seca.',
         'Enviar alertas satelitales de focos (FIRMS) a las brigadas locales; reglas de quema para la temporada seca; mapear las zonas que se queman todos los años para planificar la prevención.'],
        ['Calor extremo',
         'Del 10 al 12 nov 2026 la celda de 2° más calurosa del planeta estuvo en el Gran Chaco, con hasta 39 °C. El 13 nov, el 5,5 % del planeta estaba a 30 °C o más.',
         'Estrés por calor en trabajadores al aire libre, personas mayores y chicos, y más demanda de agua y de energía.',
         'Alertas tempranas de calor, puntos de sombra y agua potable, horarios de trabajo adaptados y más arbolado urbano.'],
        ['Un océano más cálido',
         'El 11 nov 2026, el 75 % del océano estaba más cálido que lo normal para la fecha, y el 41 % al menos 1 °C más.',
         'Las olas de calor marinas afectan la pesca y los ecosistemas, y un mar más cálido puede alimentar lluvias más intensas.',
         'Monitorear las olas de calor marinas, compartir los datos con pescadores y ciudades costeras, y enseñarlo en las escuelas.'],
        ['Calidad del aire',
         'El 13 nov 2026 el aire más contaminado llegó a 225 µg/m³ de PM2,5 en el norte de China; el 2,5 % del planeta superaba 15 µg/m³, la guía de 24 horas de la OMS.',
         'Las partículas finas dañan los pulmones y el corazón; el humo de los incendios las aumenta cerca de las zonas que se queman.',
         'Alertas de calidad del aire, menos quemas a cielo abierto y filtros o barbijos en los días malos.'],
        ['Los datos del clima están hechos para la vista',
         'Al menos 2.200 millones de personas viven con alguna discapacidad visual o ceguera (OMS). Las exhibiciones de clima en museos son sobre todo pantallas gigantes.',
         'Las personas ciegas o con baja visión quedan afuera de la información y de las exhibiciones sobre el clima.',
         'Sonificación como Earth by Ear: pantallas táctiles que hablan y suenan, en más de un idioma y sin instalar nada.'],
        ['Los límites de nuestros propios datos (mirada de ciencia de datos)',
         'Nuestros valores salen del color de las imágenes, en una grilla de 2°; el conteo de focos se satura donde hay muchísimos; los datos son una foto fija (incendios hasta el 30 oct 2026).',
         'Valores aproximados y una app que no se actualiza sola.',
         'Leer los datos crudos de NASA Earthdata y de la API de FIRMS, correr el pipeline automáticamente cada día, usar una grilla más fina y mostrar la incertidumbre.'],
      ],
      methodTitle: 'Cómo obtuvimos estos números',
      method: 'Un pipeline en Python (OpenCV, NumPy, pandas) lee cada fotograma de la NASA, convierte cada píxel en un valor con la barra de colores de su propia visualización, lo promedia en una grilla de 2° ponderada por área y calcula las estadísticas. Los focos se compararon con NASA FIRMS con correlaciones de Spearman, Pearson y Pearson logarítmica. Detalles: pitch/validation.md en el repositorio del proyecto en GitHub.',
      spoken: 'Hallazgos. Los focos que leemos coinciden con NASA FIRMS, con una correlación de rangos de 0,93. En Santiago del Estero, los incendios llegan al máximo en agosto y septiembre. Del 10 al 12 de noviembre de 2026, el lugar más caluroso del planeta fue el Gran Chaco, con hasta 39 grados. El 11 de noviembre, tres cuartas partes del océano estaban más cálidas que lo normal. El 13 de noviembre, el aire más contaminado estuvo en el norte de China. Los datos del clima están hechos sobre todo para la vista, así que los hicimos sonar.',
    },
  };

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let panel = null;

  function render() {
    if (!panel) return;
    const c = C[EBE.i18n.getLang()] || C.en;
    panel.innerHTML = `
      <div class="insights">
        <h2>${esc(c.title)}</h2>
        <p class="lead">${esc(c.lead)}</p>
        <button type="button" class="btn big" data-el="listen">${EBE.icon('sound')} <span>${esc(c.listen)}</span></button>
        <h3>${esc(c.numbersTitle)}</h3>
        <ul class="ins-numbers">
          ${c.numbers.map(n => `<li class="ins-num"><span class="ins-value">${esc(n[0])}</span><span class="ins-what">${esc(n[1])}</span></li>`).join('')}
        </ul>
        <h3>${esc(c.problemsTitle)}</h3>
        <div class="ins-problems">
          ${c.problems.map(p => `<article class="ins-card">
            <h4>${esc(p[0])}</h4>
            <p><b>${esc(c.labels[0])}:</b> ${esc(p[1])}</p>
            <p><b>${esc(c.labels[1])}:</b> ${esc(p[2])}</p>
            <p><b>${esc(c.labels[2])}:</b> ${esc(p[3])}</p>
          </article>`).join('')}
        </div>
        <h3>${esc(c.methodTitle)}</h3>
        <p class="ins-method">${esc(c.method)}</p>
      </div>`;
    panel.querySelector('[data-el=listen]').addEventListener('click', () => {
      EBE.a11y.speak(c.spoken);
    });
  }

  EBE.Insights = {
    build(p) {
      panel = p;
      render();
      EBE.i18n.onChange(render);
    },
    activate() {}, deactivate() { EBE.a11y.stopSpeaking(); }
  };
})();

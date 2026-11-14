# CLAUDE.md — Earth by Ear · NASA Space Apps Challenge 2026

> **Fuente única de verdad del proyecto.** Si un prompt o un pedido contradice este archivo, **frená y preguntá** antes de hacer nada.

---

## 0. Resumen en 30 segundos

- **Qué hacemos:** **Earth by Ear** (antes "FireSonar"), una página web que convierte visualizaciones del **Earth Information Center (EIC)** de NASA en **sonido generado en vivo**. Hay una pestaña por fenómeno (incendios, temperatura del mar, lluvia, temperatura del aire, calidad del aire) donde se puede **escuchar** la animación y **explorar el mapa con el dedo y el oído**, un **Audio Tour** narrado para usar sin mirar y un **minijuego** para adivinar el fenómeno y su intensidad por el sonido, que además sirve como validación.
- **Hackatón:** NASA International Space Apps Challenge 2026, desafío **"The Earth Information Jukebox"**.
- **Entrega:** cierra el **domingo 15 de noviembre de 2026 a las 23:59 (Argentina, UTC-3)**. Objetivo interno: **entregar a las 21:00**.
- **Equipo:** 3 estudiantes de Ciencia de Datos e IA (ITSE, Santiago del Estero, Argentina). **Principiantes.** Solo computadoras y herramientas gratuitas. **Una sola persona opera Claude Code.**
- **Punto de partida:** un prototipo de los incendios con datos simulados (`docs/index.html`, original en `pitch/prototype-v0.html`). La hoja de ruta está en la sección 11.

---

## 1. Cómo trabajar (reglas para Claude)

### Idioma
- **Con el equipo:** español rioplatense, simple y directo. Somos principiantes: pasos cortos y el porqué en una línea.
- **La app es bilingüe: inglés y español.** Todos los textos de la interfaz, las descripciones, los anuncios de `aria-live`, la voz y el juego existen en los dos idiomas. **Inglés por defecto** (el jurado global lee en inglés) y un botón **EN / ES** siempre visible. **Ningún texto se escribe directo en el HTML o el JS:** todo pasa por el diccionario de `docs/js/i18n.js`.
- **Solo en inglés:** código, nombres de variables, comentarios, mensajes de commit, README, página del proyecto en Space Apps y slides (las reglas exigen inglés en la entrega).
- **Video:** puede hablarse en español, pero **con subtítulos en inglés** (es obligatorio).

### Forma de trabajo
- Los pedidos llegan como **prompts numerados** (P0, P1, P2…) que siguen la hoja de ruta de la sección 11. **Hacé solo lo que pide el prompt actual**: no adelantes pasos.
- Cada prompt trae Objetivo, Contexto, Tareas, Criterios de aceptación, Restricciones y Entregables. Seguí las tareas **en orden**.
- **Antes de empezar:** si algo es ambiguo, contradice este archivo o pone en riesgo el plazo, **decilo primero** y proponé una alternativa.
- **Ejecutá, probá y mostrá el resultado.** Si algo no lo podés probar (por ejemplo, escuchar el sonido), decime exactamente qué tengo que probar yo y cómo.
- Cambios **chicos y verificables**. Al terminar cada tarea, decí cómo probarla.
- **Preguntá antes de:** agregar dependencias, cambiar la arquitectura (sección 7), borrar archivos o cambiar el alcance (sección 5).
- **El sistema es Windows** (verificado en la notebook del operador: Windows x64). No dependas de activar el entorno virtual: llamá directo a `.venv/Scripts/python`.
- **Cómo operamos (desde el sábado 12:30):** Claude trabaja desde el chat (Project "nasa spaceapp"), sin Claude Code. Escribe los archivos directo en la carpeta local y ejecuta en la notebook los scripts de `scripts/windows/` (doble clic desde el Explorador). Cada script deja su registro en `data/interim/logs/`, que Claude lee. `_paths.bat` pone Git, GitHub CLI y Python en el PATH. Para guardar y subir: `05-save.bat` (usa `data/interim/commit-msg.txt`). Instalado: Git 2.56, Python 3.12.10, GitHub CLI 2.104 (sesión de GitHub: NicoRojasDev). Las descargas de NASA se hacen desde la notebook (la red de Claude no llega a NASA), pero Claude puede leer las fichas de SVS por la web.

### Definición de "terminado" (para cualquier tarea)
1. Corre sin errores: los scripts de Python terminan bien y la web no muestra errores en la consola del navegador.
2. Cumple los criterios de aceptación del prompt.
3. No rompió nada que ya andaba (revisá rápido todas las pestañas).
4. CLAUDE.md, sección 4 "Estado actual", actualizada.
5. Commit en `main` con mensaje en inglés, y `git push`.
6. Un resumen de 3 a 5 líneas: qué cambió, cómo probarlo y qué quedó pendiente.

### Datos y honestidad
- **No inventes datos, URLs, fechas ni requisitos de NASA.** Si algo no está verificado, decilo y marcalo como `TODO verify`.
- Distinguí siempre **datos reales de simulados**, en los datos (`"simulated": true/false`) y en la interfaz (una etiqueta visible "Simulated data").
- Ante la duda, elegí **la opción más simple que cumpla el requisito**. El reloj manda.

### Seguridad
- **Nunca** escribas claves en el código, en los logs ni en git. La clave de FIRMS va en `.env`. Si tenés que mostrarla, solo los últimos 4 caracteres.
- Nunca hagas `git push --force` ni borres ramas sin preguntar.

---

## 2. El desafío: The Earth Information Jukebox

**Objetivo:** una interfaz, script o aplicación que combine **fotogramas de visualizaciones del Earth Information Center (EIC)** de NASA con **sonificaciones dinámicas generadas en tiempo real**.

Requisitos según el enunciado (`TODO verify` contra el texto oficial):
1. La persona puede **elegir o experimentar una visualización del EIC** junto con su paisaje sonoro.
2. **Equilibrar** la interpretación de datos con un resultado **artístico y musicalmente agradable**.
3. **La accesibilidad es tema central:** compatible con lectores de pantalla y con texto descriptivo rico.
4. Que el sonido refleje la **urgencia del cambio climático**.

**Cómo cumplimos los requisitos:** (1) una pestaña por visualización del EIC, que muestra **el fotograma real de NASA** con su sonido; (2) cada fenómeno tiene su propio instrumento y todo suena en escalas musicales; (3) accesibilidad en todas las pestañas, más un Audio Tour pensado para usar sin mirar; (4) cuando un valor supera el promedio, el fondo sonoro se vuelve tenso.

### 2.1 Criterios de evaluación oficiales 2026

> **Fuente:** documento oficial "Criterios de Evaluación" 2026 (en español). **Manda sobre cualquier otra fuente.**

- Se usan **en todos los niveles**: eventos locales y universales, evaluación global y evaluación ejecutiva.
- **Cada criterio se puntúa de 1 a 5.** Son 5 criterios y ninguno pesa más que otro.
- **Consejo oficial:** muchos equipos cuidan los primeros cuatro y descuidan el quinto. Hay que darle **la misma atención a la Presentación**, dedicarle tiempo y armar **una buena historia** alrededor del proyecto.

#### Impacto
- **Qué mide:** si el proyecto aborda un problema menor o mayor, la calidad y cantidad de su efecto, y en qué medida inspira o ayuda a otros (desde una audiencia amplia hasta un grupo selecto).
- **Qué es un 5:** un impacto excepcional, que aborda un problema significativo con soluciones; un alcance extenso, que inspira y beneficia a una gran audiencia o cambia el mundo; calidad y efectividad que superan ampliamente las expectativas y fijan un estándar para otros.
- **Nuestra estrategia:** el problema es significativo: los datos climáticos de NASA se comunican casi solo con imágenes y dejan afuera a las personas ciegas o con baja visión (para dar una cifra, citar a la OMS con la fuente verificada; `TODO verify`, no inventar números). El alcance es amplio: cualquier celular, sin instalar nada y en dos idiomas. La utilidad es concreta: encontrar dónde hay fuego cerca, saber si el mar está más caliente de lo normal, y la historia local de las quemas de Santiago del Estero.
- **Lo que mostramos:** una persona con los ojos vendados usando la app; la app funcionando en un celular común; los resultados del juego.
- **Lo que baja el puntaje:** que parezca solo arte, sin una tarea útil. Siempre mostrar algo que la persona **logra hacer** con el sonido.

#### Creatividad
- **Qué mide:** originalidad e innovación; si introduce un concepto que no se había intentado o una mejora significativa sobre ideas existentes; si tiene una perspectiva fresca o una ejecución inventiva.
- **Qué es un 5:** un enfoque revolucionario que nunca se había intentado, que desafía los métodos convencionales y que se destaca en su campo por su originalidad.
- **Nuestra estrategia:** explorar los datos **tocando y escuchando** (sonar para puntos, valor bajo el dedo para campos), un **instrumento reconocible** por fenómeno, un **juego que además funciona como experimento** y un **Audio Tour** para usar sin mirar. Referencias para el pitch: las sonificaciones públicas de NASA no son interactivas (sección 13).
- **Lo que mostramos:** el modo Explore en acción y el juego.
- **Lo que baja el puntaje:** parecerse a otros equipos. **No usar como modo principal** la "melodía que recorre la imagen por franjas": ya lo hacen otros.

#### Validez
- **Qué mide:** si la solución se basa en principios científicos; si tiene viabilidad técnica, funcional o lógica; si logra su propósito y puede funcionar en el mundo real; qué tan completa está; y **cuánto influyen la usabilidad y la facilidad de uso en su practicidad y su accesibilidad**.
- **Qué es un 5:** una solución científicamente sólida y técnicamente viable, **completamente desarrollada y lista para usarse en el mundo real**, muy usable y fácil de usar.
- **Nuestra estrategia:** valores calibrados con la barra de colores de cada visualización; mapeo dato → sonido documentado; limitaciones explicadas (sección 6.6); el juego como experimento con estadística (aciertos, matriz de confusión, valor p) y la correlación con FIRMS si da el tiempo; app publicada, que funciona en celulares sin instalar nada y es accesible de verdad.
- **Lo que mostramos:** `pitch/validation.md` con los números; la app funcionando sin errores.
- **Lo que baja el puntaje:** datos simulados en la versión final (**prohibido**), errores, pestañas a medio hacer. **Mejor 3 fenómenos completos que 5 rotos.**

#### Relevancia
- **Qué mide:** si el proyecto aborda total y directamente el desafío y se alinea con sus objetivos; si **integra los datos de NASA como componente central de la solución y no como un agregado superficial**; y qué tan profundo es el uso de esos datos.
- **Qué es un 5:** un proyecto que se involucra a fondo con el desafío; los datos de NASA son parte integral de su éxito, aportan perspectivas significativas que impulsan la innovación y están bien usados.
- **Nuestra estrategia:** cada pestaña es **un visual del EIC** (recurso oficial del desafío) y **el sonido sale de los valores extraídos de sus fotogramas**: sin los datos, no hay sonido. Las estadísticas y descripciones también salen de los datos. Cumplimos los 4 requisitos del enunciado (sección 2).
- **Lo que mostramos:** el fotograma real del EIC junto a su sonido; la tabla "How it sounds"; los créditos de cada SVS.
- **Lo que baja el puntaje:** usar los fotogramas como fondo decorativo con música genérica. **Prohibido.**

#### Presentación
- **Qué mide:** si el equipo comunicó con claridad el desafío, la solución y su importancia, con una narrativa atractiva y bien estructurada. **Los jueces evalúan la demo y también el proyecto completo** (la app, el repo y la página del proyecto).
- **Qué es un 5:** una presentación pulida, bien estructurada y convincente, con una narrativa atractiva, que hace que la audiencia entienda por completo la importancia y el impacto del trabajo.
- **Nuestra estrategia:** la historia es problema → solución en acción → evidencia → impacto. Video de 30 segundos con guion (sección 10.5), resumen de 50 a 200 palabras (sección 10.2), About claro, README prolijo y una primera pantalla de la app que explica en una frase qué es.
- **Lo que mostramos:** video, página del proyecto, README y About.
- **Lo que baja el puntaje:** dejarlo para el final. **La persona 3 arranca el borrador del guion el sábado y trabaja en esto desde el domingo a las 13:00.**

### 2.2 Autoevaluación (domingo a las 18:00, antes de entregar)

El equipo se pone un puntaje honesto de 1 a 5 en cada criterio:

| Criterio | Puntaje (1–5) | Evidencia concreta | Qué falta para subir un punto |
|---|---|---|---|
| Impacto | | | |
| Creatividad | | | |
| Validez | | | |
| Relevancia | | | |
| Presentación | | | |

**Regla:** si algún criterio queda por debajo de 3, se arregla ese antes de pulir los demás.

### 2.3 Premios globales a los que apuntamos

Según la guía de evaluación (ciclo 2024; `TODO verify` para 2026), hay 10 categorías de premios globales. Las que mejor encajan con Earth by Ear:
- **Best Use of Data:** el proyecto que hace accesibles los datos espaciales o los usa de una forma única. **Es nuestro foco principal.**
- **Art & Technology Award:** el que mejor combina habilidades técnicas y creativas.
- **Local Impact Award:** el que más puede ayudar a su comunidad local (las quemas de Santiago del Estero).
- **Most Inspirational** y **Galactic Impact:** como secundarias.

---

## 3. Producto: Earth by Ear

**Pitch (EN):** *Earth by Ear turns NASA's Earth Information Center visuals into live, touchable sound. Hear and explore fires, ocean heat, rain, air temperature and air pollution, with or without seeing the map.*
**Tagline (EN):** *Touchable sound in everyone's pocket.*

### 3.1 Fenómenos (lista provisoria: la confirma la auditoría de datos del P2)

Todos salen de la galería **Daily Visualizations** del EIC (https://svs.gsfc.nasa.gov/gallery/daily-visualizations/), que se actualiza a diario.

| Orden | id | Pestaña (EN) | Visualización del EIC | Tipo | Instrumento |
|---|---|---|---|---|---|
| 1 | `fire` | Fires | SVS 5113, Active Fires As Observed by VIIRS | Puntos (focos) | Chisporroteo (granos de ruido filtrado) |
| 2 | `ocean` | Ocean Heat | SVS 5176, SST Anomaly - Near Real Time (**equirectangular confirmado**, últimos 2,5 años) | Campo continuo | Drone grave tipo cello |
| 3 | `rain` | Rain & Snow | SVS 4285, Near Real-Time Global Precipitation (IMERG) | Campo continuo | Gotas (notas cortas tipo "plink" + siseo suave) |
| 4 | `air` | Air Temperature | SVS 5147, GEOS-FP Near-Surface Temperature | Campo continuo | Pad cálido / silbido |
| 5 | `smoke` | Air Quality | SVS 5151, Particulate Matter (PM) 2.5 | Campo continuo | Retumbo apagado y denso ("smog") |

**Reemplazos, si alguno no pasa la auditoría:** viento (SVS 5148, soplido de ruido con barrido de filtro) y vegetación (SVS 5544, marimba de madera).

**Condiciones para que un fenómeno entre:** (a) que sea un **mapa plano global** que cubra −180 a 180 y 90 a −90 (o con límites conocidos), para pasar de píxel a coordenadas; (b) que se pueda descargar sin cuenta paga; (c) que tenga una **barra de colores** o una escala documentada, para traducir color en valor; (d) que tenga varios fotogramas con fecha u hora.

**MVP:** `fire` + `ocean` + el primero de `rain`, `air` o `smoke` que pase la auditoría.

### 3.2 Estructura de la página

**Encabezado (siempre visible):** nombre, botón **Enable sound / Activar sonido** (el navegador bloquea el audio hasta que el usuario toca algo), interruptor **Read aloud / Leer en voz alta**, selector de idioma **EN / ES** y un enlace "Skip to content / Ir al contenido". El idioma elegido se recuerda en el navegador (con `try/catch`, por si no hay almacenamiento). Si no hay preferencia guardada, se usa inglés.

**Pestañas** (patrón ARIA de pestañas, navegables con flechas):

`Fires` · `Ocean Heat` · `Rain & Snow` · `Air Temperature` · `Air Quality` · `Audio Tour` · `Game` · `About`

Si un fenómeno no está listo, su pestaña no se muestra (se controla desde la configuración).

**Cada pestaña de fenómeno** se arma con el mismo código y la configuración del fenómeno:
- **Imagen:** el **fotograma real del EIC** del momento actual, con una capa encima para los destellos (focos que suenan) y el cursor de Explore.
- **Línea de tiempo:** play/pausa, anterior/siguiente, deslizador, velocidad y fecha/hora del fotograma.
- **Dos modos:** **Listen** (Jukebox: la animación suena sola) y **Explore** (la persona recorre el mapa con el dedo, el mouse o las flechas).
- **Datos:** 3 o 4 números clave con unidades (por ejemplo, cantidad de focos, anomalía media en °C, porcentaje del área con lluvia) y una etiqueta de nivel frente al promedio del período (low / normal / high / very high).
- **Descripción en texto** generada con los mismos datos que el sonido (región `aria-live`).
- **"How it sounds":** una tabla corta de dato → sonido para ese fenómeno.
- **Crédito:** la fuente (SVS y título) visible.

**Audio Tour, Game y About:** ver las secciones 3.4, 3.5 y 3.6.

### 3.3 Sonido: una identidad por fenómeno y una intensidad común

- **Identidad:** cada fenómeno tiene **su propio instrumento** (tabla de la sección 3.1). Es lo que permite reconocerlos en el minijuego.
- **Intensidad (0 a 1, normalizada dentro de cada fenómeno):** se escucha igual en todos, **con 3 señales a la vez**: **densidad o ritmo** (más eventos por segundo), **brillo** (filtro más abierto) y **volumen**. Nunca solo el volumen, porque cada celular suena distinto.
- **Espacio:** posición oeste–este → izquierda–derecha (paneo). En Explore, norte–sur → más agudo o más grave.
- **Urgencia:** cuando el valor supera el promedio del período, entra un **fondo de alerta** común a todos (acorde tenso + retumbo grave).
- **Musicalidad:** todas las alturas en **escala pentatónica**, para que suene agradable.
- **Mezcla:** compresor/limitador en la salida, un tope de eventos por segundo y de voces simultáneas, y ningún sonido estridente de repente.

**Explore, según el tipo de fenómeno:**
- **Puntos (`fire`):** sonar. Los pitidos se aceleran cerca del foco más cercano y suena chisporroteo de los focos dentro de los 350 km (es lo que ya hace el prototipo).
- **Campos (los demás):** el instrumento toca **el valor del lugar donde está el dedo**, de forma continua. Con Enter, se dice el valor con sus unidades y el lugar aproximado.

### 3.4 Minijuego (pestaña Game). Reemplaza a la prueba a ciegas

- **10 rondas.** En cada una suena un clip de 3 segundos: un fenómeno al azar, en un fotograma y un lugar al azar, con una intensidad conocida.
- **La intensidad se clasifica en Low / Medium / High** por **tercios de la escala de intensidad** (0–0,33–0,66–1). Cambio del P8: con terciles de los datos, en PM2.5 salía "alto" en pleno océano limpio (la mayor parte del planeta tiene valores bajos) y no se podía distinguir de oído.
- **Dos respuestas por ronda:** **cuál fenómeno es** (botones con los fenómenos cargados) y **qué tan intenso está** (Low / Medium / High). Se puede repetir el clip hasta 2 veces.
- **Se juega sin mirar:** el mapa no se muestra durante la ronda, y todo funciona con teclado y lector de pantalla.
- **Resultados:** porcentaje de aciertos de fenómeno y de intensidad, **matriz de confusión** (qué fenómeno se confunde con cuál) y **valor p** de una binomial contra el azar (fenómeno: 1/k, donde k es la cantidad de fenómenos; intensidad: 1/3).
- **Exportar:** botón "Copy results (CSV)" con las columnas `round, phenomenon, frame, lon, lat, intensity_class, answer_phenomenon, answer_intensity, correct_phenomenon, correct_intensity, replays, time_ms`.
- **Sirve como validación:** el domingo lo juegan unas 10 personas y los resultados van a `pitch/validation.md`.

### 3.5 Audio Tour (pestaña pensada para usar sin mirar)

- Un **recorrido guiado y narrado** (voz del navegador en inglés, con el mismo texto en `aria-live`).
- **Paradas:** introducción → una por cada fenómeno cargado → cierre.
- **En cada parada de fenómeno:** qué es el fenómeno y qué se va a escuchar → 10 a 15 segundos del sonido del momento y el lugar más llamativos (por ejemplo, la mayor concentración de focos o la anomalía del mar más alta) → un dato calculado con los datos ("The hottest ocean anomaly this week is +3.1 °C, near…").
- **Cierre:** un mensaje sobre la urgencia y una invitación a probar Explore y el juego.
- **Controles:** botones grandes; Espacio play/pausa; ←/→ parada anterior o siguiente; "Stop 3 of 7".

### 3.6 About
Qué es Earth by Ear, cómo se traduce cada dato en sonido, de dónde salen los datos (créditos completos de SVS), limitaciones honestas (sección 6.6), el equipo y la aclaración de que usamos IA (Claude) para programar.

### 3.7 Lo que nos diferencia
1. **Explorar con el oído y el tacto**, no solo escuchar.
2. **Medir con personas** si el sonido se entiende (juego con matriz de confusión y valor p).
3. **Un instrumento reconocible por fenómeno**, sobre los **fotogramas reales del EIC**.
4. Historia local: las quemas del Chaco santiagueño.

---

## 4. Estado actual

- [x] Idea, nombre y alcance definidos (este archivo).
- [x] Prototipo de los incendios con datos simulados.
- [x] P0 · Repo creado y estructura armada. Repo: https://github.com/NicoRojasDev/earth-by-ear · App: https://nicorojasdev.github.io/earth-by-ear/ · Carpeta local: `C:\Users\juans\Documents\earth-by-ear` (fuera de OneDrive a propósito).
- [x] P1 · Clave de FIRMS verificada y fechas disponibles (`scripts/check_firms.py`, sábado 13:04).
- [x] P2 · Auditoría de datos de los 5 fenómenos (`pitch/data-audit.md`): los 5 entran. MVP = `fire` + `ocean` + `rain`; después `air` y `smoke`.
- [x] P3 · Esqueleto web (archivos, pestañas, bilingüe EN/ES, configuración). La pestaña de fenómeno ya es genérica (puntos y campos, Listen y Explore) y `fire` usa datos **simulados** en el formato final hasta el P4. Probado en Chrome sin interfaz: 0 errores de consola.
- [x] P4 · Pipeline genérico con datos reales (`scripts/download_raw.py` + `scripts/build_data.py`, configuración en `scripts/phenomena.json`). Los **5 fenómenos** tienen datos reales: 60–62 fotogramas cada uno, archivos de 0,9 a 1,35 MB.
- [x] P5 · Pestaña de fenómeno genérica (imagen real + Listen + Explore). Probada en Chrome sin interfaz con los datos reales: 0 errores de consola.
- [x] P6 · Instrumentos y mezcla. **Escuchado por el equipo en celular (sábado 15:18): todo suena bien.** **Programado** (5 instrumentos, 3 señales de intensidad, fondo de alerta, limitador). **Balance medido por Claude (sábado 15:10):** con un medidor en la salida (Chrome sin interfaz, ponderación K tipo LUFS y un filtro que imita el parlante de un celular) los incendios sonaban 13 dB más bajo que el resto y la calidad del aire casi no salía por el parlante del celular. Se ajustó: ahora la diferencia entre fenómenos es de 4 dB (celular: 6 dB) y ningún pico pasa de −2,5 dBFS. **Falta que el equipo lo escuche** con auriculares y con el parlante del celular y diga qué ajustar: Claude no puede oír.
- [x] P7 · Tercer, cuarto y quinto fenómeno (`rain`, `air`, `smoke`).
- [x] Publicación de control en GitHub Pages: adelantada al sábado 14:43 ART (commit `46f35ed`, despliegue `github-pages` correcto). Cada push a `main` vuelve a publicar en 1–2 minutos.
- [ ] P8 · Minijuego. **Programado y probado de punta a punta** (10 rondas, matriz de confusión, valor p, CSV). Falta que lo jueguen ~10 personas.
- [x] P9 · Audio Tour (narrado, 5 paradas + intro y cierre, voz EN/ES, teclado Espacio/←/→). Probado en Chrome sin interfaz.
- [ ] P10 · Repaso de accesibilidad, celulares y rendimiento. **Hecho por Claude:** axe-core (WCAG 2.1 A/AA + buenas prácticas) da **0 problemas** en todas las pestañas, en inglés y en español; en celular (390 px) no hay desborde horizontal y explorar con el dedo funciona; el sonido se activa solo al entrar a Explorar. **Equipo:** 1 celular real probado (sábado 15:18, suena bien). **Falta:** un segundo celular (ideal un iPhone si hay) y una prueba con NVDA o TalkBack.
- [ ] P11 · Validación. **FIRMS terminado (sábado 15:20):** nuestros focos suben y bajan con FIRMS VIIRS: Spearman 0,67–0,94 por región, **0,93** en total (300 pares, p < 0,001). Límite honesto: donde hay muchísimos focos (sur de África, Sahel) se juntan en una mancha y nuestro conteo se satura. Informe, gráfico y datos en `pitch/validation.md`, `pitch/firms-validation.png` y `.csv`. **Hecho por Claude:** `scripts/validate_firms.py` (focos nuestros vs. FIRMS VIIRS, 5 regiones × 60 ventanas de 5 días; `--summary-only` recalcula sin volver a consultar) y `scripts/analyze_game.py` + `13-analyze-game.bat` (junta los CSV de `pitch/game-results/`, precisión, azar y valor p binomial). **Falta el equipo:** que ~10 personas jueguen y pegar sus CSV en `pitch/game-results/` (instrucciones en el README de esa carpeta).
- [ ] P12 · About, README, créditos y publicación final. **Hecho:** revisión de logos en los 5 mapas (ningún logo ni fecha de la NASA; en `air` las esquinas limpiadas se ven algo borrosas, son zonas polares y no cambian valores). Textos del formulario de entrega listos en `pitch/submission.md` (faltan los números del juego y el link del video).
- [x] **Bienvenida con dos modos** (pedido del equipo, sábado 15:24–15:41): *Modo común* y *Modo para personas ciegas o con baja visión*, que tiene que ser **sencillo**. En el modo para ciegos se activan solos el sonido y la voz, y la pantalla muestra solo: arriba ◀ tema ▶ (dice el nombre), en el medio el mapa grande, abajo tres botones grandes: ¿Dónde estoy?, **Detalles** (pedido 15:48: fecha, continente y lugar, coordenadas en palabras, valor con la unidad dicha completa, intensidad en % de la escala, promedio mundial y nivel del período; también con la tecla D) y Escuchar el tiempo. Al deslizar el dedo dice el continente u océano (América dividida en Norte, Central y Sur; reglas en `EBE.geo.continentKey`, probadas con 95 lugares) y al levantarlo dice el valor. Botón «Modo» arriba para volver a elegir. La máscara de tierra pasó de 2° a 1° para que entren Centroamérica y el Caribe. axe: 0 problemas.
- [ ] Video, página del proyecto y entrega.

---

## 5. Alcance

### Obligatorio (MVP): sin esto no se entrega
1. **3 fenómenos con datos reales:** `fire`, `ocean` y uno más (sección 3.1), cada uno con **Listen** y **Explore**.
2. **Minijuego** funcionando y jugado por unas 10 personas (es nuestra validación).
3. **Accesibilidad** (checklist de la sección 9) en todas las pestañas.
4. App **bilingüe (inglés por defecto + español)** y publicada en **GitHub Pages**.
5. **About** (en los dos idiomas), **README** en inglés, formulario de Space Apps completo (sección 10.2) y **demo** que cumpla los límites (sección 10.5).
6. **Declaración del uso de IA** visible dentro del proyecto: código, README, About y detalles del proyecto (sección 10.3).
7. **Checklist final** de la sección 10.7 completo.

### Opcional, en este orden de prioridad
1. Cuarto y quinto fenómeno.
2. **Audio Tour** (si falta tiempo, una versión corta: narración + clip por fenómeno).
3. Prueba con una **persona ciega o con baja visión** (se hace el domingo a la mañana si se consigue; lo organiza la persona 3).
4. **Validación con FIRMS** de la detección de incendios.
5. **Orquesta de celulares** (sección 12).
6. Vibración en Android y selector de idioma ES/EN.

**Si falta tiempo, recortar de abajo hacia arriba.** **Nunca se recortan:** los 3 fenómenos del MVP con Listen y Explore, el juego y la accesibilidad.

---

## 6. Datos

### 6.1 Incendios: NASA SVS 5113

**Título:** *Active Fires As Observed by VIIRS, 2024-Present.*

- **Es un visual oficial del EIC:** aparece en el *Wildland Fires Dashboard* del EIC (sección "Side Circles") y en la galería *Daily Visualizations*.
- **Páginas:** https://svs.gsfc.nasa.gov/5113 · archivos: https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005113/ · lista en JSON: https://svs.gsfc.nasa.gov/api/5113
- **Qué muestra:** intensidad de los incendios del mundo con una **ventana móvil de 5 días** de mediciones VIIRS de **potencia radiativa del fuego (FRP)**, **desde principios de 2024**. Se actualiza a diario. VIIRS detecta focos a 375 m por píxel.
- **Versión principal:** `fires_frp_VIIRS_2048p30.mp4` (4096×2048, 46,5 MB) + carpeta `frames/4096x2048_2x1_30p/EIC/` (**824** fotogramas). **Trae fechas y barra de colores incrustadas.**
- **Versión equirectangular:** `fires_frp_VIIRS_eq_nl_2048p30.mp4` (4096×2048, 44,9 MB), **sin fechas ni barra de colores**, con su propia carpeta de fotogramas (**901**).
- **Imagen fija más reciente:** `VIIRS_fires_latest.png` (4096×2048, 7,1 MB).
- **Créditos:** "NASA's Scientific Visualization Studio". Visualizador: Trent L. Schindler (USRA). Científico: Doug C. Morton (NASA/GSFC). Datos: Fire Pixels [Suomi NPP: VIIRS] y Blue Marble: Next Generation.

**Decisiones del P2 (resueltas el sábado 13:15; detalle en `pitch/data-audit.md`):**
- La versión principal **no es un mapa plano** (bordes curvos, tipo Robinson): **se usa solo la equirectangular** `fires_frp_VIIRS_eq_nl_2048p30.mp4` para valores e imagen.
- Ahora **las dos versiones tienen 900 fotogramas**: la fecha del fotograma *i* se lee en el fotograma *i* del video principal (lo hace el P4).
- Barra de colores: FRP **0,0 a 8,0 MW**, rojo oscuro → dorado → amarillo → blanco.
- **Riesgo:** Suomi NPP dejó de mandar datos el 02/11/2026 y la imagen del 13/11 no tiene focos. Usar fotogramas hasta fines de octubre y decirlo en las limitaciones.
- **Fechas verificadas en el P4** (leídas en el video principal): fotograma 0 = 13/11/2024, fotograma 899 = 13/11/2026 (2 años; ~0,81 días por fotograma; el último fotograma tiene 0 focos). Usamos 60 fotogramas, uno cada 5 días, del 08/01/2026 al 30/10/2026.
- **Lecciones del P4:** (1) `VIIRS_fires_latest.png` es de 16 bits: hay que pasarla a 8 bits antes de leer la barra; (2) los bordes de las barras de colores tienen contorno: se recortan 4 píxeles por lado; (3) en el mar, El Niño supera los +4 °C y se dibuja más oscuro que el final de la barra: se agregan copias más oscuras de los extremos (`extend_ends`); (4) las estadísticas se ponderan por área (coseno de la latitud): la temperatura media del planeta da 15,4 °C, que coincide con el valor real conocido.

**Decisiones abiertas originales (ya resueltas arriba):**
1. **Las dos versiones tienen distinta cantidad de fotogramas (824 contra 901):** no se pueden emparejar 1 a 1. **Plan preferido:** usar **solo la versión principal**, tapando la fecha y la barra de colores, **si** es el mismo mapa plano. Si no lo es, usar la equirectangular y estimar las fechas.
2. **Fecha de cada fotograma:** leer la fecha del primer y del último fotograma de la versión principal y calcular cuántos días hay por fotograma.
3. **Qué significa cada color:** la página no lo explica. Calibrar con la barra de colores de la versión principal.
4. **Que la proyección cubra el globo completo,** sin bordes ni márgenes.

### 6.2 Campos continuos: `ocean`, `rain`, `air` y `smoke`

Para cada uno, el P2 verifica y anota en `pitch/data-audit.md`:
- Archivos disponibles (con la API JSON: `https://svs.gsfc.nasa.gov/api/<id>`), tamaños y resoluciones.
- **Proyección:** que sea un mapa plano global y con qué límites.
- **Período:** cuántos fotogramas hay, cada cuánto (días u horas) y de qué fechas. **Ojo: algunas visualizaciones diarias pueden mostrar solo los últimos días o un pronóstico,** no meses de historia. Cada pestaña tiene su propia línea de tiempo.
- **Barra de colores:** si existe como archivo aparte o dentro de la imagen, y qué rango de valores y unidades tiene.
- **Textos incrustados** (fechas, logos, leyendas) que haya que tapar.
- **Veredicto:** entra / entra con reparos / no entra (y por qué).

### 6.3 FIRMS: validación (opcional)

FIRMS da **los mismos focos que detecta el satélite, pero como tabla**. Lo enlaza el propio panel de incendios del EIC.

- **Clave gratuita (MAP_KEY):** ya la tenemos, en `.env` como `FIRMS_MAP_KEY`. Límite: 5000 consultas cada 10 minutos.
- **Documentación:** https://firms.modaps.eosdis.nasa.gov/api/ (servicios `area`, `country` y `data_availability`).
- **Consulta por zona:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/[MAP_KEY]/[SOURCE]/[oeste,sur,este,norte]/[DIAS]/[AAAA-MM-DD]`
- **Fuentes y fechas (verificado en el P1, 14/11/2026 con `data_availability`):** `VIIRS_SNPP_SP` 2012-01-20 a 2026-07-31 · `VIIRS_SNPP_NRT` 2026-08-01 a **2026-11-02 (dejó de actualizarse; 0 focos en los últimos días)** · `VIIRS_NOAA20_NRT` 2026-08-01 a 2026-11-14 · `VIIRS_NOAA20_SP` 2018-04-01 a 2026-07-31 · `VIIRS_NOAA21_NRT` 2024-01-17 a 2026-11-14. **Para fechas recientes usar NOAA-20**; para el período de SVS 5113 (Suomi NPP) usar `VIIRS_SNPP_SP` hasta el 31/07/2026.
- **Máximo de días por consulta:** de 1 a 5 (documentación oficial de la API `area`). Con fecha, devuelve desde esa fecha hasta fecha + días − 1.
- **Zona de Santiago del Estero (aproximada):** `-65.2,-30.4,-61.7,-25.6`.
- **Columnas (verificado):** `latitude, longitude, bright_ti4, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_ti5, frp, daynight` (el archivo SP agrega `type`).
- **Dato para el pitch (P1):** Santiago del Estero, 10 al 14/11/2026, NOAA-20: **1054 focos**, FRP total 19.205 MW, máximo 478,7 MW. Archivo histórico 1 al 5/09/2025 (SNPP SP): 373 focos.
- Como SVS 5113 usa una **ventana de 5 días**, para comparar hay que sumar los focos de FIRMS de esos mismos 5 días.
- **Métrica:** correlación entre los focos que salen de los píxeles y los de FIRMS, por fecha, en Santiago del Estero. Va en `pitch/validation.md`.

### 6.4 Pipeline genérico (el mismo código para todos los fenómenos)

**Configuración:** `scripts/phenomena.json`, con un bloque por fenómeno: `id`, `svs_id`, archivo de origen, cómo elegir fotogramas, zonas a tapar, límites de la proyección, `type` (`points` o `field`), barra de colores (archivo o región de la imagen), rango de valores, unidades y rango de intensidad.

**Pasos** (`scripts/build_data.py --id <id>`):
1. **Descargar** el archivo de origen con la API JSON de SVS a `data/raw/<id>/`. Preferir un MP4 a cientos de PNG sueltos.
2. **Elegir fotogramas:** **hasta 60 por fenómeno**, repartidos en el período disponible (para `fire`, 1 cada 5 días, que coincide con la ventana de 5 días).
3. **Guardar la imagen para mostrar:** cada fotograma en JPG de **1024×512**, calidad ~80, en `docs/data/frames/<id>/000.jpg`, `001.jpg`, etc.
4. **Tapar** las zonas con texto incrustado (fechas, barra de colores) y **cualquier logo o marca de NASA**: las reglas prohíben usar marcas de NASA en lo que generamos (sección 10.4). Las imágenes que mostramos no llevan logos.
5. **Calcular los valores:**
   - `points` (`fire`): máscara de color en HSV → agrupar píxeles en focos → centro (lon, lat) e intensidad 0 a 1. **Hasta 800 focos por fotograma** (los más intensos; con 1500 el archivo pasaba el presupuesto). `stats.count` guarda el **total detectado** antes del recorte, y la web usa ese total para el conteo y el nivel.
   - `field` (los demás): color → valor con la barra de colores (el color más cercano en la escala) → **grilla de 2° (180×90 celdas)**, con valores en `uint8` (0 a 255) mapeados al rango del fenómeno. Las celdas sin dato (tierra en `ocean`, por ejemplo) valen 255 = "sin dato".
6. **Estadísticas por fotograma:** media, percentil 90, máximo y el lugar del máximo.
7. **Exportar** a `docs/data/<id>.js` (formato de la sección 6.5).

**De píxel a coordenadas** (imagen global de W×H): `lon = (x + 0.5) / W * 360 - 180`, `lat = 90 - (y + 0.5) / H * 180`.

**Presupuesto de tamaño:** `docs/data/<id>.js` de **1,5 MB o menos** e imágenes de unos 100 KB cada una. Los datos se cargan **solo al abrir la pestaña** (carga diferida). El script imprime cuántos fotogramas exportó, el tamaño de los archivos y un resumen de los valores.

### 6.5 Formato de datos (contrato entre Python y la web)

Los datos van en archivos **`.js`, no `.json`**, para que la app funcione con doble clic (abriendo un archivo local, el navegador bloquea la lectura de `.json`, pero sí permite cargar `<script>` e imágenes).

```js
// docs/data/ocean.js (generated by scripts/build_data.py, do not edit by hand)
window.EARTH_BY_EAR_DATA = window.EARTH_BY_EAR_DATA || {};
window.EARTH_BY_EAR_DATA.ocean = {
  "id": "ocean",
  "title": "Ocean Heat (Sea Surface Temperature Anomaly)",
  "svs_id": 5176,
  "source": "NASA SVS 5176 - Sea Surface Temperature (SST) Anomaly - Near Real Time",
  "credit": "NASA's Scientific Visualization Studio",
  "simulated": false,
  "type": "field",                       // "points" | "field"
  "units": "°C",
  "value_range": [-3, 3],                // valor real para 0 y 254 en la grilla
  "intensity_range": [0, 3],             // qué valores van de intensidad 0 a 1
  "grid": { "w": 180, "h": 90, "step": 2, "lon0": -180, "lat0": 90 },
  "frames": [
    {
      "t": "2025-09-01",                 // ISO: fecha, o fecha y hora
      "image": "data/frames/ocean/000.jpg",
      "grid": "<base64 de w*h bytes uint8; 255 = no data>",
      "stats": { "mean": 0.42, "p90": 1.3, "max": 3.1, "max_lon": -150.0, "max_lat": 10.0 }
    }
  ]
};
```

- **Celda (i, j) de la grilla:** centro en `lon = lon0 + step*(i + 0.5)`, `lat = lat0 - step*(j + 0.5)`. Fila `j` de norte a sur.
- **Fenómenos de tipo `points` (`fire`):** en vez de `grid`, cada fotograma trae `"points": [[lon, lat, intensity], ...]`, con coordenadas de 2 decimales e intensidad de 0 a 1, y `units`/`value_range` describen el FRP.
- **Intensidad para el sonido y el juego:** `intensity = clamp((value - intensity_range[0]) / (intensity_range[1] - intensity_range[0]), 0, 1)`.
- **Agregado en el P4:** `"scale": "log"` (opcional; lluvia y PM2.5). Si está, el byte de la grilla y la intensidad usan log10: `value = 10^(log10(v0) + b/254 · (log10(v1) − log10(v0)))`. Así los valores chicos no se pierden.
- **Agregado en el P4:** en `fire`, `units` es `"relative"` y la intensidad (0 a 1) sale mitad del color (FRP 0–8 MW de la barra) y mitad del tamaño del foco (`intensity_note`). La web la muestra en %. `date_note` avisa cuando la fecha es aproximada (el mar ya no la necesita: el video tiene 901 fotogramas, uno por día, del 25/05/2024 al 11/11/2026).

### 6.6 Limitaciones honestas (decirlas en About y en la presentación)
- Los valores salen del **color de la imagen**, no de las mediciones calibradas. Son aproximaciones, y por eso validamos (juego y FIRMS).
- La grilla de 2° promedia los detalles locales.
- Cada fenómeno tiene su propio período: algunos tienen años y otros, días.

---

## 7. Arquitectura y convenciones

```
earth-by-ear/
  CLAUDE.md
  README.md                  # en inglés
  LICENSE                    # MIT
  .env                       # FIRMS_MAP_KEY (NUNCA se sube a git)
  .env.example
  .gitignore · .gitattributes · requirements.txt
  data/raw/                  # descargas de NASA (no se suben a git)
  data/interim/              # fotogramas sueltos y pruebas (no se suben a git)
  scripts/
    check_env.py · check_firms.py
    phenomena.json           # configuración por fenómeno
    audit_svs.py             # P2: auditoría de las visualizaciones
    build_data.py            # P4: video → docs/data/<id>.js + imágenes
    validate_firms.py        # P11 (opcional)
  docs/                      # SITIO WEB (GitHub Pages publica esta carpeta)
    index.html
    css/style.css
    js/i18n.js               # diccionario EN/ES, t(key, params), cambio de idioma, lang del documento
    js/config.js             # fenómenos que muestra la web: instrumento, claves de textos, "enabled"
    js/a11y.js               # anuncios (aria-live), voz en el idioma activo, ayudas de teclado
    js/audio-engine.js       # AudioContext, mezcla, limitador, planificador, fondo de alerta
    js/instruments.js        # un instrumento por fenómeno
    js/data-loader.js        # carga diferida de docs/data/<id>.js y validación
    js/map-view.js           # imagen del fotograma + capa canvas + proyección + cursor
    js/phenomenon-tab.js     # Listen + Explore para cualquier fenómeno
    js/game.js
    js/audio-tour.js
    js/app.js                # pestañas, controles globales, arranque
    data/<id>.js
    data/frames/<id>/000.jpg …
  pitch/                     # prototype-v0.html, data-audit.md, validation.md, guion, slides
```

**Convenciones:**
- **Web:** HTML + CSS + JavaScript **sin frameworks ni librerías**. Scripts clásicos (`<script src>`, **no** módulos ES) y un único espacio de nombres global `window.EBE`, para que funcione con doble clic.
- **Python:** 3.10 o más nuevo, con `argparse`. Cada script imprime lo que hace y se puede volver a correr sin romper nada.
- **Dependencias:** `opencv-python`, `numpy`, `pandas`, `requests` y `python-dotenv`. Agregar otra requiere preguntar.
- **Nombres en inglés:** `snake_case` en Python y `camelCase` en JavaScript.
- **Datos empaquetados:** la web **no llama a ninguna API**.
- **Agregar un fenómeno** = un bloque en `scripts/phenomena.json` + un bloque en `docs/js/config.js` + sus textos en `docs/js/i18n.js` + correr `build_data.py`. Nada más.
- **Textos:** todos pasan por `EBE.i18n.t('clave')`. Las claves van en inglés y por sección (`header.enableSound`, `fire.legend.count`, etc.). Los dos idiomas tienen siempre las mismas claves: si falta una, se muestra la de inglés y se avisa en la consola.
- **Números y fechas** con `Intl.NumberFormat` y `Intl.DateTimeFormat` según el idioma (`1,234.5` en EN; `1.234,5` en ES).
- **Declaración de IA en el código:** cada archivo de código empieza con un comentario de una línea: `// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.` (en Python, con `#`).

---

## 8. Primeros pasos (los hace el P0)

1. Repo **público** `earth-by-ear` en GitHub con licencia **MIT**.
2. Carpetas de la sección 7.
3. `firesonar-prototype.html` → `docs/index.html` (copia) y `pitch/prototype-v0.html` (original).
4. Entorno `.venv` con las 5 dependencias y `requirements.txt` con versiones fijas.
5. `.gitignore` (`.env`, `.venv/`, `data/raw/`, `data/interim/`, `__pycache__/`, `*.pyc`, `.DS_Store`, `Thumbs.db`), `.gitattributes`, `.env.example`, `.env`, `LICENSE`, `README.md`.
6. GitHub Pages desde `main` / `/docs`.

---

## 9. Accesibilidad (checklist para todas las pestañas)

- [ ] **Teclado:** todo se usa sin mouse. Las pestañas siguen el patrón ARIA (`role="tablist"`, `tab`, `tabpanel`; flechas para moverse). Atajos: Espacio play/pausa, ←/→ momento (en Listen) o mover el cursor (en Explore), Enter describe, M alterna Listen/Explore. El foco del teclado se ve siempre.
- [ ] **Lector de pantalla:** región `aria-live` para los anuncios, etiquetas en todos los controles y la imagen con una descripción generada con los datos.
- [ ] **Voz:** opción **Read aloud** con `speechSynthesis` **en el idioma activo** (`en-US` o `es-AR`, con `es-ES` u otra voz en español si no hay `es-AR`), que no tapa el sonido de los datos (se baja el volumen mientras habla).
- [ ] **Idioma:** al cambiar EN/ES se actualiza `<html lang>`, todos los textos y la voz, sin recargar la página ni perder el estado.
- [ ] **Equivalente en texto de cada sonido:** la descripción dice lo mismo que el sonido (valor, nivel, lugar).
- [ ] **Sonido:** botón grande **Enable sound** y aviso de modo silencio en iPhone.
- [ ] **Visual:** contraste suficiente, nada se comunica solo con color, botones de al menos 44×44 px y respeta `prefers-reduced-motion`.
- [ ] **Juego y Audio Tour** se completan sin mirar la pantalla.
- [ ] **Probado con un lector de pantalla real:** NVDA (Windows, gratis) o TalkBack (Android).

---

## 10. Entrega y presentación (componentes oficiales 2026)

> **Fuentes, en orden de prioridad:**
> 1. **"Componentes del Proyecto – NASA Space Apps Challenge 2026"** (documento oficial en español). **Manda sobre todo lo demás.**
> 2. "Criterios de Evaluación" 2026 (sección 2.1).
> 3. Guía de entrega 2025 (https://www.spaceappschallenge.org/resources/project-submission-guide/) y guía de evaluación (https://www.spaceappschallenge.org/resources/judging-awards-guide), solo para lo que el documento 2026 no cubre. Lo que sale únicamente de esas guías queda marcado **(guía anterior)**.

### 10.1 Elegibilidad y fechas

- **Fechas:** la entrega abre el **sábado 14 a las 9:00** y cierra el **domingo 15 a las 23:59**, según la hora del evento local de quien creó el equipo (Team Owner). Hay que apretar **"Submit for Judging"** antes del cierre, y la entrega es **final**.
- **Desafío oficial:** el nuestro lo es (los proyectos de "Create Your Own Challenge" no van al jurado global) (guía anterior).
- **Equipo:** todos registrados, con evento local elegido (no en lista de espera) y en la pestaña **Members**. Equipos de 1 a 6 personas. **No se puede agregar a nadie después del cierre** (guía anterior).
- **Formulario:** todos los campos obligatorios completos y **en inglés**, igual que todo lo enlazado. La única excepción es la voz del video, que puede ir en otro idioma con subtítulos en inglés.
- **Datos de NASA:** **se requiere al menos un recurso de NASA del desafío** (pestaña "Resources" del desafío) para optar a los premios globales. El nuestro es el **EIC Content Database**.
- **Originalidad:** marcar las casillas que confirman que el trabajo es original y que todos los recursos externos están en las referencias, sin material con copyright sin licencia (guía anterior).

### 10.2 Componentes del formulario (oficial 2026)

| # | Componente | Qué pide el documento oficial | Qué ponemos | Quién |
|---|---|---|---|---|
| 1 | **Nombre y resumen general** | Un resumen de **50 a 200 palabras**: qué desarrollamos, cómo aborda el desafío y por qué es importante. | "Earth by Ear" + el borrador de abajo, con los números reales al final. | Persona 3 |
| 2 | **Enlace a la demo** | **Un solo enlace:** diapositivas (**máximo 7**, la del título cuenta) **o** video de **30 segundos** (puede ir en el idioma nativo, **con subtítulos en inglés**). En un sitio externo (YouTube, Google Drive, GitHub, etc.), con acceso público. | Video en YouTube (sección 10.5). | Persona 3 |
| 3 | **Enlace al proyecto** | Acceso público, **sin contraseña, permiso ni registro**. Probarlo con un navegador **sin sesión iniciada**. Si es un sitio web nuevo, se recomienda pedir una **Clasificación de Filtro Web**. | La app en GitHub Pages; el repo va en los detalles. | Persona 1 |
| 4 | **Detalles del proyecto** | Qué hace exactamente, cómo funciona, qué beneficios tiene, qué esperamos lograr y qué herramientas, lenguajes, hardware o software usamos. | Texto basado en las secciones 3 y 7 (estructura abajo). | Persona 3 + Persona 1 |
| 5 | **Uso de IS (Inteligencia Sintética)** | Elegir en el menú **todas** las herramientas usadas e indicar dónde y cómo (con marca de agua o en la descripción). Es obligatorio. **Los jueces no ven esta respuesta, pero sí ven los indicadores dentro del proyecto** (marcas de agua, texto descriptivo, metadatos). | Ver sección 10.3. | Persona 1 |
| 6 | **Datos de la NASA** | Qué datos de NASA usamos, con **enlaces a todos los recursos**. Al menos uno tiene que ser del desafío. | Lista de abajo. | Persona 2 |
| 7 | **Datos de agencias asociadas y otros recursos** | Opcional, pero recomendado. Va acá **todo lo demás**: enlaces a todos los datos y recursos usados, **incluidos código, textos e imágenes**, aunque sean de código abierto o de acceso libre. | Lista de abajo. | Persona 2 |
| 8 | **Verificación** | Aceptar los términos y confirmar que el trabajo es original (guía anterior). | Lo hace quien entrega. | Persona 3 |

**Borrador del resumen (EN, unas 130 palabras; actualizar al final con lo que realmente quedó):**

> Earth by Ear turns NASA's Earth Information Center (EIC) visualizations into live, touchable sound. Each phenomenon (wildfires, ocean heat, rain and snow, air temperature and air quality) has its own instrument, and its sound is computed from the values in the real EIC frames. People can listen to the animations, or slide a finger across the map and hear what is happening at each place, so the data can be understood with or without sight. An audio-guided tour and a listening game make it inclusive and fun; the game also measures whether listeners recognize each phenomenon and its intensity by ear. It runs in any phone browser, in English and Spanish, with nothing to install. Climate data is mostly visual: Earth by Ear opens it to blind and low-vision people and to anyone who learns by listening.

**Estructura de los detalles del proyecto (EN):** What it does → How it works (EIC frames → values → live sound; Listen, Explore, Game, Audio Tour) → Benefits (accessibility, education, local relevance) → Validation (game results, FIRMS) → Limitations → Tools (HTML, CSS, JavaScript, Web Audio API, Speech Synthesis API, Python, OpenCV, NumPy, pandas, GitHub Pages; Claude for coding assistance) → What we hope to achieve (next steps).

**Datos de la NASA (enlaces para el formulario):**
- EIC Content Database (recurso oficial del desafío): https://svs.gsfc.nasa.gov/gallery/earth-information-center/
- Daily Visualizations del EIC: https://svs.gsfc.nasa.gov/gallery/daily-visualizations/
- Cada SVS usado al final: https://svs.gsfc.nasa.gov/5113/ y los que pasen la auditoría (5176, 4285, 5147, 5151).
- Data Sonification: Caldwell 73 (inspiración, recurso del desafío): https://svs.gsfc.nasa.gov/13786/
- NASA FIRMS (si se usa para validar): https://firms.modaps.eosdis.nasa.gov/

**Otros recursos (para el formulario):** librerías de Python (OpenCV, NumPy, pandas, requests, python-dotenv), APIs del navegador (Web Audio, Speech Synthesis), Natural Earth (si se usan los contornos), fuentes tipográficas (si se usan), el artículo de Georgia Tech y el trabajo de 2026 de la sección 13, y Claude (Anthropic). **Agencias asociadas:** opcional; si da el tiempo, buscar si alguna agencia socia 2026 tiene datos de incendios de Sudamérica (`TODO verify` la lista de socias 2026).

### 10.3 Uso de IS / IA (oficial 2026)

**Reglas:**
- **Se permite** usar herramientas de IA para acelerar la innovación y la creatividad: modelos de lenguaje (LLMs), chatbots, generación de imágenes o video, modelos fundacionales y generación de código.
- En el formulario, elegir **todas** las herramientas usadas.
- **Indicar dónde y cómo se usaron**, con una marca de agua o en la descripción del proyecto.
- **El contenido generado no puede usar, contener ni modificar marcas o elementos de diseño de NASA** (logos, banderas, identificadores de misión).
- **El jurado no ve la respuesta del formulario, pero sí ve los indicadores dentro del proyecto.** Por eso **la declaración tiene que estar visible en el propio proyecto**.
- (Guía anterior) Imágenes y videos generados con IA llevan marca de agua visible; audio, código y datos generados con IA lo declaran en el texto descriptivo y en los metadatos; el jurado considera la originalidad, la intención y la ejecución.

**Qué hacemos:**
- **Código:** la primera línea de cada archivo declara la ayuda de Claude (sección 7).
- **Datos generados:** el comentario del principio de cada `docs/data/<id>.js` dice qué script lo generó y que ese script se escribió con ayuda de IA.
- **README:** una sección "AI disclosure".
- **App:** la pestaña About lo dice en los dos idiomas.
- **Detalles del proyecto:** un párrafo "AI disclosure".
- **Formulario:** elegir Claude y las categorías que correspondan (LLM / chatbot, generación de código).
- **Sonidos:** los genera nuestro código en el navegador con síntesis (no son audio generado por IA). Lo aclaramos igual en About.
- **Video e imágenes:** no usamos imágenes ni video generados con IA. Si se usara alguno, lleva la marca de agua "AI-generated".

### 10.4 Marcas de NASA y derechos

- **El contenido que generamos no puede usar, contener ni modificar marcas o elementos de diseño de NASA** (logos, banderas, identificadores de misión). Eso incluye la app, el video, las slides y el README. **Si un fotograma de SVS trae un logo, se tapa** (sección 6.4).
- El **crédito en texto** a "NASA's Scientific Visualization Studio" sí va, porque lo pide SVS.
- Nada de música ni samples con copyright: todo el sonido se genera en el código.
- Todo recurso externo (código, textos, imágenes), aunque sea libre, va en las referencias del formulario (sección 10.2).

### 10.5 Demo: video de 30 segundos

**Reglas oficiales 2026:**
- **Un solo enlace:** video de **30 segundos** o diapositivas (**máximo 7**, la del título cuenta).
- **Video:** puede estar en el idioma nativo, pero **con subtítulos en inglés**. **Slides:** en inglés (guía anterior).
- En un sitio externo, con **acceso público**, sin contraseña, permiso ni registro. **Probarlo sin sesión iniciada.**
- **Prohibido incluir nombres, voces o imágenes de personas menores de 18 años.** Quienes aparezcan en el video tienen que ser mayores de edad.
- (Guía anterior) Si se pasa del tiempo o de la cantidad de diapositivas, el proyecto no puede ir al jurado global. El video debe incluir: quiénes somos y nuestro equipo, el desafío, el título y la frase del proyecto, cómo funciona y cómo usamos los datos de NASA, y el impacto a futuro.

**Elegimos video:** en un proyecto de sonido, escucharlo convence más que leerlo. Los subtítulos en inglés van **incrustados**, e incluyen la descripción de los sonidos importantes (por ejemplo, `[fire crackling grows faster]`). Se edita con una herramienta gratis (por ejemplo, CapCut) y se sube a YouTube como **público**.

**Guion (30 s, máximo 29 s para tener margen):**

| Segundos | Imagen | Texto o voz (subtítulos en inglés) |
|---|---|---|
| 0–4 | Equipo + título "Earth by Ear: touchable sound in everyone's pocket" | "We're [team] from Santiago del Estero, Argentina. Challenge: The Earth Information Jukebox." |
| 4–9 | Un fotograma del EIC que se apaga a negro | "NASA's Earth visuals are made for the eyes. What if you can't see them?" |
| 9–19 | Persona adulta con los ojos vendados que pasa el dedo por el celular: el sonar se acelera y encuentra las quemas de Santiago. Cortes rápidos: calor del mar, lluvia, juego | "Earth by Ear turns them into live sound you can touch and explore." |
| 19–25 | Las pestañas y el resultado del juego en pantalla | "Real frames from NASA's Earth Information Center, sonified live in the browser. X% of players recognized each phenomenon by ear." |
| 25–29 | URL de la app + "EN / ES" | "Climate data for everyone, in English and Spanish." |

**Plan B (si el video no sale):** 7 diapositivas en inglés: (1) título, equipo y desafío; (2) el problema; (3) la solución (pestañas); (4) cómo suena cada dato; (5) datos de NASA y pipeline; (6) validación (resultados del juego); (7) impacto, próximos pasos y links.

### 10.6 APIs: cuidados
- Se pueden usar APIs de NASA (SVS, FIRMS). **El centro siguen siendo los fotogramas del EIC.**
- **La demo no depende de internet:** los datos se generan antes y van dentro de `docs/data/`.
- **Nada de APIs pagas**, tampoco de IA.

### 10.7 Checklist final antes de "Submit for Judging"

- [ ] La app abre desde un navegador **sin sesión iniciada** y desde 2 celulares distintos.
- [ ] No hay datos simulados en ninguna pestaña visible.
- [ ] EN/ES funciona en todas las pestañas; el idioma por defecto es inglés.
- [ ] El video dura **30 segundos o menos**, tiene subtítulos en inglés, no muestra menores ni logos de NASA y su link es público.
- [ ] El resumen tiene entre **50 y 200 palabras** (contarlas).
- [ ] Todos los campos del formulario están completos y en inglés.
- [ ] Datos de NASA: está el enlace al **EIC Content Database** y a cada SVS usado.
- [ ] Otros recursos: están todas las librerías, APIs, fuentes y referencias.
- [ ] La declaración de IA está en el código, el README, About y los detalles del proyecto.
- [ ] Ningún logo de NASA en la app, el video ni las imágenes.
- [ ] Los 3 integrantes figuran en Members.
- [ ] Autoevaluación de la sección 2.2 hecha.
- [ ] Se apretó **"Submit for Judging"** y apareció la confirmación.

### 10.8 Ofertas de los colaboradores globales (Global Offers)

> **Fuente:** anuncio de la organización del evento (sábado 14). Se habilitan el **sábado 14 a las 19:00**: spaceappschallenge.org → iniciar sesión → avatar (arriba a la derecha) → **Offers** → **Claim Offer**. Son gratis durante el hackatón.

**Decisión: no las usamos, salvo (opcionalmente) el dominio.** A las 19:00 estamos en el P6: **nadie corta lo que está haciendo para reclamarlas.**

| Oferta | Decisión | Por qué |
|---|---|---|
| Azure, Google Cloud, Firebase, Google Maps API | No | No hace falta servidor: GitHub Pages publica gratis la carpeta `docs/`. |
| Meteomatics Weather API, Microsoft Planetary Computer | No | La web no llama a ninguna API (sección 7) y el sonido sale de los fotogramas del EIC. Usar otros datos baja la **Relevancia** (sección 2.1). |
| GitHub Copilot, Microsoft Copilot | No | Ya usamos Claude. Cualquier IA extra hay que declararla en el formulario y dentro del proyecto (sección 10.3). |
| Miro Premium | Opcional | Solo si la persona 3 lo quiere para el guion del video; la versión gratis alcanza. |
| GoDaddy Registry (dominio propio) | Opcional, con condiciones | Ver abajo. |

**Dominio propio (por ejemplo `earthbyear.space`), solo con estas condiciones:**
- Lo reclama la **persona 3** y se conecta **recién después de la publicación de control del sábado (22:30–23:30)**.
- **Riesgo 1:** con un dominio propio, el link `github.io` redirige a ese dominio. Si la configuración del dominio (DNS o HTTPS) falla, **se cae también el link original**.
- **Riesgo 2:** un dominio recién creado puede quedar bloqueado por los filtros web de algunos jueces (ver la Clasificación de Filtro Web, sección 15). `github.io` ya es de confianza.
- Si no anda perfecto en 2 celulares y en un navegador sin sesión iniciada, **se quita el dominio y se vuelve a `github.io`**.
- Revisar las condiciones de renovación antes de reclamarlo (`TODO verify`).

---

## 11. Hoja de ruta, roles y cronograma

### Roles
- **Persona 1 · Operador de Claude Code:** le da los prompts a Claude, revisa y prueba cada tarea, y hace los commits.
- **Persona 2 · Datos y validación:** verifica a mano lo que Claude no puede ver (abrir los videos, leer fechas, comparar con FIRMS) y **prueba cómo suena** cada fenómeno.
- **Persona 3 · Pruebas y presentación:** prueba en celulares, organiza las partidas del juego con unas 10 personas (y la persona ciega o con baja visión, si se consigue) y arma el guion, el video y la página del proyecto.

### Git
- Se trabaja en `main`, con commits chicos y frecuentes y mensajes en inglés. Antes de un cambio grande (como el P3), crear una rama y volver a `main` cuando ande.
- `git push` al terminar cada prompt.

### Hoja de ruta (un prompt por paso, hora Argentina)

| Prompt | Paso | Resultado | Cuándo |
|---|---|---|---|
| P0 | Base del proyecto | Repo, estructura, entorno y Pages | Sáb 11:10–11:40 |
| P1 | Clave de FIRMS | Clave verificada y fechas disponibles | Sáb 11:40–12:00 |
| P2 | Auditoría de datos | `pitch/data-audit.md` con veredicto por fenómeno y decisiones de `fire` | Sáb 12:00–12:45 |
| P3 | Esqueleto web | Prototipo dividido en archivos, 8 pestañas, **i18n EN/ES desde el principio**, `config.js`, `fire` todavía simulado | Sáb 12:45–14:45 |
| P4 | Pipeline genérico | `build_data.py` + `fire.js` y `ocean.js` reales con imágenes | Sáb 14:30–17:30 |
| P5 | Pestaña de fenómeno | Fotograma real + Listen + Explore para puntos y campos | Sáb 17:30–19:30 |
| P6 | Instrumentos y mezcla | 5 timbres reconocibles, intensidad con 3 señales y fondo de alerta | Sáb 19:30–20:30 |
| P7 | Tercer fenómeno | El primero de `rain`/`air`/`smoke` que pasó la auditoría | Sáb 20:30–22:30 |
| — | Publicación de control | Revisar la app en GitHub Pages desde 2 celulares | Sáb 22:30–23:30 |
| P8 | Minijuego | Pestaña Game completa, con CSV y valor p | Dom 9:00–10:30 |
| — | Partidas con personas | ~10 personas juegan; se juntan los CSV | Dom 10:30–12:00 |
| P7b · P9 | Opcionales | Fenómenos 4 y 5 y Audio Tour, según el tiempo | Dom 10:30–12:30 |
| P10 | Accesibilidad y rendimiento | Checklist de la sección 9 completo y prueba en celulares | Dom 12:30–13:30 |
| P11 | Validación | `pitch/validation.md` (juego + FIRMS si da) | Dom 13:30–14:15 |
| P12 | Cierre técnico | About (EN/ES), README, créditos, declaración de IA, revisión de logos y publicación final | Dom 14:15–15:00 |
| — | Video y página del proyecto | Lo arma la persona 3 | Dom 13:00–18:00 |
| — | Revisión final y entrega | **Entregar a las 21:00** | Dom 18:00–21:00 |

**Si algo se atrasa más de 1 hora,** aplicar los recortes de la sección 5 antes de seguir.

---

## 12. Opcionales: detalle técnico

### Prueba con una persona ciega o con baja visión
- **Qué medir:** si encuentra el fuego en Explore (sí/no y cuánto tarda), su resultado en el juego y una frase sobre la experiencia (con permiso para citarla).
- Va a `pitch/validation.md`. **No depender de esto:** si no se consigue a nadie, se dice con honestidad.
- **Partidas del juego y video:** pueden jugar personas de cualquier edad, pero **en el video no pueden aparecer nombres, voces ni imágenes de menores de 18** (sección 10.5). Pedir permiso antes de filmar o citar a alguien.

### Orquesta de celulares
- Cada celular elige un fenómeno o una región y todos tocan juntos, sincronizados con el reloj del teléfono, **sin servidor**:
  `frame = Math.floor((Date.now() - EPOCH_MS) / FRAME_MS) % N_FRAMES`, con `EPOCH_MS` y `FRAME_MS` fijos en el código.
- Cada celular necesita su propio toque en "Enable sound" y no estar en modo silencio.

---

## 13. Pitch e innovación (para la presentación)

- **"Touchable sound in everyone's pocket":** Georgia Tech está investigando exhibiciones de museo que combinan mapas táctiles con sonificación para personas ciegas o con baja visión (marzo 2026: https://news.research.gatech.edu/2026/03/03/new-touchable-sound-museum-display-makes-data-more-accessible). Earth by Ear hace lo mismo con el dedo sobre cualquier celular.
- **Las sonificaciones públicas no son interactivas:** un trabajo de 2026 señala que los proyectos de sonificación de NASA que analizó funcionan como divulgación, pero no son plataformas interactivas (https://nhsjs.com/wp-content/uploads/2026/03/Barriers-in-Science-Lack-of-Accessibility-to-Visual-Only-Scientific-Data-for-the-BVI-community.pdf).
- **Inspiración de NASA:** en *Data Sonification: Caldwell 73* (https://svs.gsfc.nasa.gov/13786/) un barrido tipo radar recorre la imagen, la distancia al centro define la altura y el color define el instrumento. **Explore es la versión interactiva de ese radar,** y nuestros instrumentos por fenómeno siguen la misma idea de "un color, un timbre".
- **Validez con números:** aciertos, matriz de confusión y valor p del juego; correlación con FIRMS si se hace.
- **Momento clave del video:** alguien con los ojos vendados encuentra las quemas de Santiago del Estero solo con el sonido y después reconoce la lluvia y el calor del mar en el juego.

### Otros proyectos del mismo desafío (revisados el sábado a la mañana)
- **Fotogramas convertidos en melodía:** Earth FM y Terrasonic.
- **Globos 3D con música espacial:** shkim, Omtripathi.
- **Dato → altura de nota:** hielo del Ártico y temperatura (GISTEMP).
- **Accesibilidad para personas ciegas:** Terra Vox y Team Spaced Out.
- **Varios temas del EIC con sonido:** Terra Vox y NabhoDhwani. **Por eso, tener 5 fenómenos no alcanza para diferenciarnos:** lo que nos distingue es explorar con el tacto, el juego como validación y los instrumentos reconocibles.

---

## 14. Recursos oficiales de NASA

- **EIC Content Database:** https://svs.gsfc.nasa.gov/gallery/earth-information-center/ (fuente oficial; sus videos e imágenes se pueden usar como datos).
- **Daily Visualizations (EIC):** https://svs.gsfc.nasa.gov/gallery/daily-visualizations/ (de acá salen los 5 fenómenos).
- **Wildland Fires Dashboard (EIC):** https://svs.gsfc.nasa.gov/gallery/wildland-fires/ (SVS 5113 y enlaces a FIRMS).
- **Data Sonification: Caldwell 73:** https://svs.gsfc.nasa.gov/13786/ (marco conceptual).

**Descartados:** DYAMOND CO2 (5196: globo 3D con cámara en movimiento), Air Quality Model Runs (5533: Norteamérica 2024, más de 285 MB), Lightning from the ISS (5011: reemplazado por los 5 fenómenos), GEOS Aerosols (5669: una sola imagen fija), Night Lights (5313), Sea Surface Currents (3912), Perpetual Ocean 2 (5425), Atmospheric River (4960) y GEDI (4950).

---

## 15. Pendientes y decisiones abiertas

- [x] Pedir la MAP_KEY de FIRMS (ya llegó; va en `.env`).
- [ ] Conseguir unas 10 personas para el juego y, si se puede, una persona ciega o con baja visión (domingo a la mañana).
- [ ] Nombre del equipo e integrantes. **Confirmar que los 3 estén registrados, con evento local elegido y en la pestaña Members** (después del cierre no se puede agregar a nadie).
- [ ] Evento local donde estamos inscriptos.
- [ ] Confirmar que la guía de entrega y la de evaluación no cambiaron para 2026 (formato de la demo, IA y logos). Link al enunciado oficial del desafío.
- [ ] Decisiones de datos de las secciones 6.1 y 6.2 (las resuelve el P2).
- [ ] (Baja prioridad) Ver si conviene pedir la **Clasificación de Filtro Web** para la URL de GitHub Pages (el documento oficial la recomienda para sitios nuevos).
- [ ] Borrador del guion y del resumen: la persona 3 los arranca el sábado a la noche.
- [ ] (Opcional, persona 3) Dominio propio de GoDaddy: reclamarlo desde las 19:00 y conectarlo solo después de la publicación de control del sábado. Si no anda perfecto, se descarta (sección 10.8).

---

## 16. Glosario rápido

- **EIC (Earth Information Center):** el centro de NASA con pantallas que muestran cómo cambia la Tierra. Sus visuales son la base del desafío.
- **SVS (Scientific Visualization Studio):** el estudio de NASA que hace esas visualizaciones. Cada una tiene un número (por ejemplo, SVS 5113).
- **VIIRS:** el sensor satelital que detecta los focos de incendio.
- **FRP (Fire Radiative Power):** potencia radiativa del fuego, en megavatios. Mide qué tan intenso es un foco.
- **FIRMS:** el sistema de NASA que publica los focos de incendio como tabla (latitud, longitud, FRP, fecha).
- **Anomalía de temperatura del mar (SST anomaly):** cuánto más caliente o más frío está el mar respecto de lo normal para esa fecha y ese lugar.
- **IMERG:** el producto de NASA que estima la lluvia y la nieve en todo el mundo.
- **GEOS-FP / GEOS-CF:** modelos de NASA que calculan el estado de la atmósfera (temperatura, viento, contaminantes).
- **PM2.5:** partículas finas en el aire (humo, polvo, contaminación), dañinas para la salud.
- **Proyección equirectangular:** un mapa plano donde la longitud va de izquierda a derecha y la latitud de arriba a abajo, en partes iguales. Permite pasar de píxel a coordenadas con una fórmula simple.
- **Barra de colores (colorbar):** la escala que dice qué valor corresponde a cada color.
- **Sonificación:** convertir datos en sonido.
- **Paneo:** mover un sonido entre el parlante izquierdo y el derecho.
- **Escala pentatónica:** una escala de 5 notas que casi siempre suena agradable.
- **`aria-live`:** una zona de la página cuyos cambios lee el lector de pantalla automáticamente.
- **i18n:** internacionalización; en este proyecto, que la app esté en inglés y en español.
- **Terciles:** dividir los valores en tres grupos iguales (bajo, medio y alto).
- **Matriz de confusión:** una tabla que muestra qué fenómeno se confunde con cuál en el juego.
- **Valor p:** la probabilidad de acertar tanto como acertamos si se respondiera al azar. Cuanto más chico, más fuerte la evidencia.
- **GitHub Pages:** el servicio gratis de GitHub que publica la carpeta `docs/` como sitio web.

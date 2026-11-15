# Space Apps 2026 submission texts (ready to copy)

> Updated Sunday 15 Nov (blind mode added). Draft written on Saturday 14 Nov. Replace every `[TODO …]` with the real numbers before submitting (game results on Sunday). Count the summary words again after editing: it must stay between 50 and 200.

## 1. Project name

Earth by Ear

## 2. High-level summary (177 words, limit 50–200)

Earth by Ear turns NASA's Earth Information Center (EIC) visualizations into live, touchable sound. Five EIC visuals (active fires, ocean heat, rain and snow, near-surface air temperature and air pollution) each get their own instrument, and every sound is computed from values read out of the real EIC frames with each visualization's own colorbar. You can listen to an animation as it plays, or slide a finger across the map and hear what is happening at each place. A simple blind and low-vision mode speaks everything aloud: the continent or ocean under your finger, the value, and full details of any point. A narrated audio tour and a listening game complete it. Our fire readings rise and fall with NASA FIRMS detections (rank correlation 0.93). It runs in any phone browser, in English and Spanish, with nothing to install. Climate data is mostly visual; Earth by Ear opens it to blind and low-vision people and to anyone who learns by listening, starting with the fires that burn every year near our home in Santiago del Estero, Argentina.

## 3. Demo link

[TODO: public YouTube link to the 30-second video, with English subtitles]

## 4. Project link

https://nicorojasdev.github.io/earth-by-ear/

## 5. Project details

**What it does.** A welcome screen offers two modes. *Standard mode* shows the maps with sound and text. *Blind or low-vision mode* is deliberately simple: sound and voice start on their own, spoken instructions explain the screen, and only three things remain: big previous/next topic arrows, a big map, and three big buttons (*Where am I?*, *Details* and *Listen over time*). Sliding a finger says the continent or ocean (the Americas split into North, Central and South); lifting it says the value; *Details* reads the date, place, coordinates in words, value with its units, intensity and the world average. Earth by Ear is a web app that plays NASA Earth Information Center visualizations as sound. Each phenomenon tab shows the real EIC frame and has two modes. *Listen* plays the animation like a jukebox: you hear each moment, and the sound grows denser, brighter and louder as values rise; a tense background chord comes in when a moment is above the period average. *Explore* turns the map into something you can touch: drag a finger, the mouse or the arrow keys and hear the value under the cursor (for fires, a sonar speeds up as you approach the nearest fire). Every sound has a text equivalent generated from the same numbers, read by screen readers or by the built-in voice. An *Audio Tour* narrates the five phenomena without needing the screen, and a *Game* asks players to name the phenomenon and its intensity from a 3-second clip.

**How it works.** A Python pipeline (OpenCV, NumPy) downloads each EIC visualization from NASA's Scientific Visualization Studio, reads 60 frames, and converts pixel colors into values with the visualization's own colorbar (nearest color in Lab space). Fields are averaged on a 2° grid (area-weighted); fires are detected as clusters of warm pixels. Logos and date stamps are masked. The result is packed into small JavaScript files, so the web app makes no API calls and works offline once loaded. In the browser, the Web Audio API synthesizes everything live: one instrument per phenomenon (crackling grains, a cello-like drone, drop "plinks", a warm pad with a whistle, a muffled rumble), all in a pentatonic scale, with a limiter so nothing becomes harsh. West–east maps to left–right; in Explore, north–south maps to pitch.

**Benefits.** Accessibility first: keyboard and screen-reader support (automated WCAG 2.1 A/AA audit with axe-core: 0 issues), large touch targets, reduced-motion support, bilingual interface and voice. It runs on any phone without installing anything. It is also a teaching tool: hearing that the ocean anomaly drone is "very high", or that on three afternoons in a row (10–12 November 2026) the hottest 2° cell on the planet in NASA's GEOS-FP data was in the Gran Chaco right next to our city (up to 39 °C, with Santiago del Estero at 38.4 °C), makes climate data personal.

**Validation.** (1) The fire spots we read from the EIC frames follow NASA FIRMS VIIRS detections: rank correlation 0.67–0.94 in five regions (0.93 over all 300 region-and-window pairs, 60 five-day windows in 2026; p < 0.001), with an honest caveat that very dense fire regions saturate our count. (2) A loudness meter on the app's output balanced the five instruments to within 4 dB, also on phone speakers. (3) Listening game with [TODO: N] people: [TODO: X]% phenomenon accuracy vs. 20% by chance (p [TODO]), [TODO: Y]% intensity accuracy vs. 33% (p [TODO]). (4) Sanity checks: the area-weighted mean near-surface air temperature we read is 15.4 °C, close to the known global mean.

**Limitations.** Values come from image colors, not calibrated measurements, so they are approximations; values beyond a colorbar saturate at its limit; a 2° grid averages local detail; fire intensity is relative; fire data ends in late October 2026 because the Suomi NPP feed behind the visualization stopped on 2 November.

**Tools.** HTML, CSS, JavaScript (no frameworks), Web Audio API, Web Speech API, Python 3.12, OpenCV, NumPy, pandas, requests, GitHub Pages, Git. AI assistance: Claude (Anthropic) for coding and documentation.

**What we hope to achieve.** A free, open tool that blind and low-vision people, schools and museums can use to *hear* the planet; next steps are testing with blind users and local organizations in Santiago del Estero, adding more EIC visualizations through the same configuration file, and a "phone orchestra" mode where several phones play different phenomena together.

**AI disclosure.** We used Claude (Anthropic), a large language model, as a coding and writing assistant: it wrote and tested most of the code and drafted documentation under our direction. Every code file starts with a comment saying so, and the README and the About tab say so too. All sounds are synthesized by our code in the browser; no AI-generated audio, images or video are used.

## 6. NASA data (links)

- Earth Information Center content database (challenge resource): https://svs.gsfc.nasa.gov/gallery/earth-information-center/
- EIC Daily Visualizations: https://svs.gsfc.nasa.gov/gallery/daily-visualizations/
- SVS 5113, Active Fires As Observed by VIIRS, 2024-Present: https://svs.gsfc.nasa.gov/5113/
- SVS 5176, Sea Surface Temperature (SST) Anomaly - Near Real Time: https://svs.gsfc.nasa.gov/5176/
- SVS 4285, Near Real-Time Global Precipitation (IMERG): https://svs.gsfc.nasa.gov/4285/
- SVS 5147, GEOS-FP Near-Surface Temperature: https://svs.gsfc.nasa.gov/5147/
- SVS 5151, Particulate Matter (PM) 2.5: https://svs.gsfc.nasa.gov/5151/
- NASA FIRMS (validation): https://firms.modaps.eosdis.nasa.gov/
- Data Sonification: Caldwell 73 (inspiration): https://svs.gsfc.nasa.gov/13786/

## 7. Space agency partner data and other resources

- Python libraries: OpenCV (https://opencv.org), NumPy (https://numpy.org), pandas (https://pandas.pydata.org), requests, python-dotenv
- Browser APIs: Web Audio API, Web Speech API (MDN: https://developer.mozilla.org/)
- Accessibility audit: axe-core (https://github.com/dequelabs/axe-core)
- Hosting: GitHub Pages
- Background reading: Georgia Tech, touchable sound museum display (March 2026): https://news.research.gatech.edu/2026/03/03/new-touchable-sound-museum-display-makes-data-more-accessible
- AI assistant: Claude (Anthropic), https://www.anthropic.com/claude

## 8. Use of synthetic intelligence (form menu)

Select: large language model / chatbot, code generation. Tool: Claude (Anthropic). Where it shows inside the project: first line of every code file, README "AI disclosure", About tab (EN/ES), and the paragraph above.

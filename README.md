# Earth by Ear

**Touchable sound in everyone's pocket.**

Earth by Ear turns NASA's Earth Information Center (EIC) visuals into live, touchable sound. Hear and explore fires, ocean heat, rain, air temperature and air pollution, with or without seeing the map.

**Try it:** https://nicorojasdev.github.io/earth-by-ear/ (any phone or computer browser, nothing to install, English and Spanish).

Built for the **NASA International Space Apps Challenge 2026**, challenge *The Earth Information Jukebox*, by a team of Data Science and AI students from ITSE, Santiago del Estero, Argentina.

## What it does

- **Five phenomena, five instruments.** Each tab shows the real EIC frame and plays sound computed from its values: fires (crackling), ocean heat (cello-like drone), rain and snow (drops), air temperature (warm pad and whistle) and air quality (muffled rumble).
- **Listen:** the animation plays and you hear each moment. Higher values sound denser, brighter and louder; a tense chord comes in when a moment is above the period average.
- **Explore:** slide a finger (or use the arrow keys) over the map and hear the value at each place. For fires, a sonar speeds up as you get closer to the nearest fire.
- **Game:** 10 rounds to guess the phenomenon and its intensity by ear. It also measures whether the sounds can be understood (accuracy, confusion matrix, p-value).
- **Accessible:** keyboard and screen reader support, text descriptions generated from the same data as the sound, optional read-aloud voice.

## How it works

1. `scripts/download_raw.py` downloads the EIC visualizations from NASA's Scientific Visualization Studio (SVS).
2. `scripts/build_data.py` reads each frame, turns pixel colors into values with the visualization's own colorbar, and writes a 2-degree grid (or a list of fire spots) to `docs/data/<id>.js`, plus the frame images. Settings are in `scripts/phenomena.json`.
3. The web app (`docs/`, plain HTML, CSS and JavaScript with the Web Audio API) loads that data and synthesizes all sound live in the browser. It makes no API calls.

To rebuild the data on Windows: `.venv/Scripts/python scripts/download_raw.py` and then `.venv/Scripts/python scripts/build_data.py --all`.

## Data

All visualizations are from NASA's Scientific Visualization Studio, Earth Information Center collection (https://svs.gsfc.nasa.gov/gallery/earth-information-center/):

| Tab | Visualization |
|---|---|
| Fires | [SVS 5113](https://svs.gsfc.nasa.gov/5113/) Active Fires As Observed by VIIRS, 2024-Present |
| Ocean Heat | [SVS 5176](https://svs.gsfc.nasa.gov/5176/) Sea Surface Temperature (SST) Anomaly - Near Real Time |
| Rain & Snow | [SVS 4285](https://svs.gsfc.nasa.gov/4285/) Near Real-Time Global Precipitation (IMERG) |
| Air Temperature | [SVS 5147](https://svs.gsfc.nasa.gov/5147/) GEOS-FP Near-Surface Temperature |
| Air Quality | [SVS 5151](https://svs.gsfc.nasa.gov/5151/) Particulate Matter (PM) 2.5 |

NASA FIRMS (https://firms.modaps.eosdis.nasa.gov/) is our reference for cross-checking fire detections. The audit of each source is in [`pitch/data-audit.md`](pitch/data-audit.md).

Credit: NASA's Scientific Visualization Studio.

## Limitations

Values are read from image colors, not from calibrated measurements, so they are approximations; values beyond a colorbar are shown at its limit. The 2-degree grid averages out local detail. Fire intensity is relative (colorbar color plus cluster size), and fire data stops at the end of October 2026 because the satellite feed behind the visualization stopped in early November.

## AI disclosure

This project was built with the assistance of **Claude (Anthropic)** for writing code and documentation. Every code file starts with a one-line comment that says so. All sounds are synthesized live in the browser by our own code; no AI-generated audio, images or video are used.

## License

MIT. See [LICENSE](LICENSE).

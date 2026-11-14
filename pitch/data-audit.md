# Data audit (P2) — Earth by Ear

Audited on 2026-11-14 with `scripts/audit_svs.py` (SVS API records, frame-folder listings, preview images, colorbars and first/last frames). Raw downloads live in `data/interim/audit/` (not in git).

## Summary

| id | SVS | Verdict | Frames | Period | Grid | Colorbar |
|---|---|---|---|---|---|---|
| `fire` | 5113 Active Fires (VIIRS) | **In, with caveats** | 900 (main) / 900 (equirectangular) | 2024 – Nov 2026 (dates to be read from the main movie) | Use the equirectangular `eq_nl` version, 4096×2048 | FRP 0.0 – 8.0 MW: dark red → tan → yellow → white |
| `ocean` | 5176 SST Anomaly NRT | **In** | 901 daily | 2024-05-25 → 2026-11-11 (date in file names) | Equirectangular 4096×2048 | −4 to +4 °C, continuous dark blue → white → dark brown |
| `rain` | 4285 IMERG NRT precipitation | **In (cleanest)** | 358, every 30 min | 2026-11-07T00:00Z → 2026-11-14T10:30Z (in file names) | 2:1 flat 3600×1800 PNG **with transparency** (rain only) | Two 11-step scales (liquid green→dark red, frozen cyan→purple), 0.1 – 50 mm/h |
| `air` | 5147 GEOS-FP near-surface temperature | **In, with caveats** | 372 hourly | 2026-10-29 05:00 EDT → 2026-11-13 15:00 EST | Equirectangular 2048×1024 | −40 to 40 °C (multi-hue; gray = hotter than 40) |
| `smoke` | 5151 GEOS-CF PM2.5 | **In, with caveats** | 372 hourly | same as `air` | Equirectangular 2048×1024 | 0.4 – 409.6 µg/m³, log scale, white → yellow → orange → brown |

**MVP order:** `fire` + `ocean` + `rain` (cleanest third). Then `air` (4th) and `smoke` (5th). Replacements (5148 wind, 5544 vegetation) are not needed.

## Per phenomenon

### fire — SVS 5113
- **The main version is NOT a flat map**: its edges are curved (Robinson-like projection), so pixels cannot be turned into lon/lat with the simple formula. **Decision: use the equirectangular `fires_frp_VIIRS_eq_nl_2048p30.mp4` (44.9 MB, no dates, no colorbar)** for both values and display.
- Both versions now have **900 frames** (`EIC` and `SoaS` folders, `.001` → `.900`), so frame *i* of the main movie has the same date as frame *i* of the equirectangular one. **Dates: read the date printed on the main movie (`fires_frp_VIIRS_2048p30.mp4`, 46.5 MB) at the sampled indexes** (P4). TODO verify the step between frames (the preview of frame 892 says 11 Jan 2026, which does not fit a simple daily step).
- Colorbar (main version): Fire Radiative Power 0.0 – 8.0 MW, dark red → tan → yellow → white.
- **Risk:** the data comes from Suomi NPP. FIRMS shows `VIIRS_SNPP_NRT` stopped on **2026-11-02**, and `VIIRS_fires_latest.png` (13 Nov 2026) has **zero fire pixels**. Use frames up to the end of October 2026 and say so in About/limitations.
- Fire pixels are tiny: at 1024×512 they almost disappear. The web must draw its own glows on the canvas layer (already planned).
- Frame folders hold `.exr` files (heavy HDR). Use the MP4s.

### ocean — SVS 5176
- Use the **`sst_mur_anomaly_nodates`** version: same map, no date stamp, nothing to mask.
- 901 daily frames, **date in each file name** (`..._20240525` → `..._20261111`). The 30-second movie has 900 frames at 30 fps, about one per day; date for movie frame *i* ≈ 2024-05-25 + *i* days (±1 day).
- Land and sea ice are gray (shaded relief) = **no data** (255). Near-zero anomaly is white, so land detection must use distance to the colorbar, not just "low saturation".
- Colorbar file: `sst_mur_anomaly_auto_colorbar_01` (−4 to 4 °C). Source: JPL MUR SST, about one day latency.
- Main movie is 338 MB; the no-dates movie size is not listed (TODO verify; expect similar). Alternative: download only the sampled frames.

### rain — SVS 4285
- **Best data of the five**: the `flatalpha` frames are 3600×1800 PNGs where only precipitation is drawn and everything else is transparent. No masking, no base map to subtract.
- 358 frames every 30 minutes, about 7.4 days, timestamp in each file name (`imergert_alpha.2026-11-07T00:00:00Z.png`). Plan: 60 frames, one every 3 hours (≈33 MB).
- Two discrete colorbars with the same 11 steps (0.1, 0.2, 0.3, 0.5, 1, 2, 3, 5, 10, 20, 50 mm/h): liquid (green → yellow → red → dark red) and frozen (cyan → blue → purple). Each color maps to an exact class; we can also tell rain from snow.
- The composite version has a stray "E" in the bottom-right corner; we do not use it.
- Note: file names contain `:`, which Windows does not allow; save them with `-` instead.

### air — SVS 5147
- 372 hourly frames (`00000001.png` → `00000372.png`), GEOS-FP analysis: 29 Oct 2026 05:00 EDT → 13 Nov 2026 15:00 EST (dates read on the first and last frames; step = 1 hour).
- **Must mask**: the **NASA "meatball" + GMAO logo (top-left)** and the date box (bottom-left). Rules forbid NASA logos in what we publish.
- Colorbar −40 to 40 °C with many hues (dark blue, white, purple, blue, cyan, green, yellow, orange, red, black, gray). Use nearest color on the full colorbar. Gray over deserts = above 40 °C.
- PNG frames are ~6.3 MB each (60 frames ≈ 380 MB). Prefer the movie `MC01_stage3_GMAO_near_surface_temperature_2048x1024_en.mp4` if it is smaller (TODO verify size).

### smoke — SVS 5151
- Same frames, dates and masks as `air` (GEOS-CF, hourly, same logo and date box).
- Country borders are thin black lines: ignore dark pixels when averaging each 2° cell.
- Colorbar 0.4 – 409.6 µg/m³ on a log scale (ticks ×4). Intensity should use log(value).

## FIRMS (P1, for validation)
See CLAUDE.md section 6.3. Key: works. Recent data: NOAA-20 (Suomi NPP NRT stopped 2026-11-02). Santiago del Estero, 10–14 Nov 2026: 1054 fire detections.

# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""P11 validation: do the fire spots we read from the SVS 5113 frames follow NASA FIRMS?

For every fire frame used by the web (60 frames, one every 5 days) and a few regions, it counts
  - our fire spots inside the region (read from the frame colors by build_data.py), and
  - FIRMS VIIRS (Suomi NPP) detections in the same region and the same 5-day window,
then reports Pearson and Spearman correlations. FIRMS pixels are 375 m and our spots are clusters
of ~10 km pixels, so the numbers differ in scale; what matters is whether they rise and fall together.

Usage (Windows): .venv/Scripts/python scripts/validate_firms.py
Writes data/interim/firms/validation.csv and data/interim/firms/validation_summary.txt (not in git).
"""
import datetime as dt
import io
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from dotenv import dotenv_values

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_data as B  # noqa: E402  (same pipeline as the web data)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "interim" / "firms"
API = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{src}/{box}/5/{date}"
SP_END = dt.date(2026, 7, 31)       # end of the Suomi NPP standard archive (checked in P1)
NRT_END = dt.date(2026, 11, 2)      # Suomi NPP near real time stopped here (checked in P1)

# west, south, east, north
REGIONS = {
    "santiago_del_estero": (-65.2, -30.4, -61.7, -25.6),
    "gran_chaco": (-64.0, -26.0, -56.0, -18.0),
    "southern_amazon": (-65.0, -15.0, -45.0, -5.0),
    "southern_africa": (15.0, -18.0, 35.0, -5.0),
    "sahel": (-5.0, 5.0, 30.0, 12.0),
}


def firms_count(key, src, box, start):
    url = API.format(key=key, src=src, box=",".join(str(v) for v in box), date=start.isoformat())
    for attempt in range(3):
        try:
            r = requests.get(url, timeout=120)
            text = r.text
            if r.status_code == 200 and not text.lstrip().lower().startswith(("invalid", "error", "<")):
                df = pd.read_csv(io.StringIO(text))
                return len(df), float(df["frp"].sum()) if len(df) else 0.0
            print("   FIRMS answered", r.status_code, text[:80].replace(key, "****"))
        except requests.RequestException as exc:
            print("   network error:", str(exc).replace(key, "****")[:120])
        time.sleep(3 * (attempt + 1))
    return None, None


def main():
    key = (dotenv_values(ROOT / ".env").get("FIRMS_MAP_KEY") or "").strip()
    if not key:
        print("FIRMS_MAP_KEY is empty in .env")
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    cfg = B.CONFIG["fire"]
    colors, values = B.load_colorbar("fire", cfg)
    lut = B.ColorLUT(colors, values)
    movie = B.RAW / "fire" / cfg["movie"]
    dates = B.frame_dates(cfg, B.movie_length(movie))
    idx = B.select_indices(cfg, dates)
    print(f"Reading {len(idx)} fire frames ({dates[idx[0]]} .. {dates[idx[-1]]})")

    rows = []
    for i, img in B.iter_movie(movie, idx):
        end = dt.date.fromisoformat(dates[i])
        if end > NRT_END:
            continue
        start = end - dt.timedelta(days=4)          # the frame shows a moving 5-day window
        src = "VIIRS_SNPP_SP" if end <= SP_END else "VIIRS_SNPP_NRT"
        spots = B.fire_spots(img, lut, cfg)
        lon = np.array([s[2] for s in spots]); lat = np.array([s[3] for s in spots])
        line = []
        for name, (w, s_, e, n) in REGIONS.items():
            ours = int(((lon >= w) & (lon <= e) & (lat >= s_) & (lat <= n)).sum()) if len(spots) else 0
            cnt, frp = firms_count(key, src, (w, s_, e, n), start)
            rows.append({"frame": i, "date": end.isoformat(), "region": name, "source": src,
                         "svs_spots": ours, "firms_detections": cnt, "firms_frp_mw": frp})
            line.append(f"{name}={ours}/{cnt}")
        print(f"  {end}  " + "  ".join(line))

    df = pd.DataFrame(rows)
    df.to_csv(OUT / "validation.csv", index=False)
    ok = df.dropna(subset=["firms_detections"])
    lines = [f"Frames: {ok['date'].nunique()} (5-day windows, {ok['date'].min()} .. {ok['date'].max()})",
             f"Regions: {', '.join(REGIONS)}", ""]
    for name, g in list(ok.groupby("region")) + [("ALL (region x date)", ok)]:
        if len(g) < 3 or g["svs_spots"].std() == 0 or g["firms_detections"].std() == 0:
            lines.append(f"{name}: not enough variation")
            continue
        pear = g["svs_spots"].corr(g["firms_detections"], method="pearson")
        spear = g["svs_spots"].corr(g["firms_detections"], method="spearman")
        lines.append(f"{name}: n={len(g)}  Pearson r={pear:.2f}  Spearman rho={spear:.2f}  "
                     f"(our spots mean {g['svs_spots'].mean():.0f}, FIRMS mean {g['firms_detections'].mean():.0f})")
    text = "\n".join(lines)
    (OUT / "validation_summary.txt").write_text(text, encoding="utf-8")
    print("\n" + text)
    return 0


if __name__ == "__main__":
    sys.exit(main())

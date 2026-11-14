# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""Download the raw NASA SVS files that build_data.py needs into data/raw/<id>/.

Order: smallest first, so the MVP data arrives early (fire, rain, air, smoke, ocean).
Safe to re-run: complete files are skipped, partial files are downloaded again.

Usage (Windows): .venv/Scripts/python scripts/download_raw.py [--only fire rain]
"""
import argparse
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
SVS = "https://svs.gsfc.nasa.gov/vis/a000000/"

MOVIES = {
    "fire": [
        SVS + "a005100/a005113/fires_frp_VIIRS_eq_nl_2048p30.mp4",   # equirectangular, values + display
        SVS + "a005100/a005113/fires_frp_VIIRS_2048p30.mp4",         # main version, only to read the dates
    ],
    "air": [SVS + "a005100/a005147/MC01_stage3_GMAO_near_surface_temperature_2048x1024_en.mp4"],
    "smoke": [SVS + "a005100/a005151/MC01_stage4_GMAO_pm25_2048x1024_en.mp4"],
    "ocean": [SVS + "a005100/a005176/sst_anomaly_nodates_30_sec_4096x2048_2x1_30p.mp4"],
}
RAIN_FOLDER = SVS + "a004200/a004285/frames/3600x1800_2x1_30p/flatalpha/"
RAIN_EVERY = 6  # one frame every 6 x 30 min = 3 hours
ORDER = ["fire", "rain", "air", "smoke", "ocean"]

session = requests.Session()
session.headers["User-Agent"] = "EarthByEar-SpaceApps2026"


def remote_size(url):
    try:
        r = session.head(url, allow_redirects=True, timeout=60)
        return int(r.headers.get("Content-Length", 0))
    except (requests.RequestException, ValueError):
        return 0


def download(url, dest):
    size = remote_size(url)
    if dest.exists() and size and dest.stat().st_size == size:
        print(f"   skip (already complete) {dest.name}")
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    start = time.time()
    try:
        with session.get(url, stream=True, timeout=120) as r:
            r.raise_for_status()
            done = 0
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
                    done += len(chunk)
        tmp.replace(dest)
    except requests.RequestException as exc:
        print("   FAILED", url, exc)
        return False
    mb = dest.stat().st_size / 1e6
    print(f"   ok {dest.name}: {mb:.1f} MB in {time.time() - start:.0f} s")
    return True


def rain_frames():
    html = session.get(RAIN_FOLDER, timeout=120).text
    names = sorted(set(re.findall(r'href="?([^"\s>?]*imergert_alpha[^"\s>?]*\.png)', html)))
    names = [n.rsplit("/", 1)[-1] for n in names]
    picked = names[::RAIN_EVERY]
    if names and names[-1] not in picked:
        picked.append(names[-1])
    print(f"   rain: {len(names)} frames online, downloading {len(picked)}")
    for name in picked:
        safe = name.replace(":", "-")
        download(RAIN_FOLDER + name, RAW / "rain" / safe)


def main():
    parser = argparse.ArgumentParser(description="Download raw NASA SVS files.")
    parser.add_argument("--only", nargs="+", choices=ORDER, help="Only these phenomena")
    parser.add_argument("--sizes", action="store_true", help="Only print the remote sizes")
    args = parser.parse_args()
    ids = args.only or ORDER

    print("Remote sizes:")
    for pid in ids:
        for url in MOVIES.get(pid, []):
            print(f"   {pid}: {url.rsplit('/', 1)[-1]} = {remote_size(url) / 1e6:.1f} MB")
    if args.sizes:
        return 0

    for pid in ids:
        print(f"\n=== {pid} ===")
        if pid == "rain":
            rain_frames()
            continue
        for url in MOVIES[pid]:
            download(url, RAW / pid / url.rsplit("/", 1)[-1])
    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

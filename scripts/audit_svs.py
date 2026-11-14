# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""P2 data audit: download what we need to judge each NASA SVS visualization.

For each SVS id it saves, under data/interim/audit/<id>/:
  api.json            the SVS API record
  images/             small preview images and colorbars (no .exr, no movies)
  frames/<folder>/    first and last frame of every frame folder
and writes data/interim/audit/summary.json (counts, names, sizes, image shapes).

Usage (Windows): .venv/Scripts/python scripts/audit_svs.py [--ids 5113 5176 4285 5147 5151]
Safe to re-run: files that already exist are not downloaded again.
"""
import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin

import cv2
import requests

API = "https://svs.gsfc.nasa.gov/api/{}"
DEFAULT_IDS = [5113, 5176, 4285, 5147, 5151]  # replacements: 5148 (wind), 5544 (vegetation)
SKIP_FOLDERS = ("pacific", "robinson", "1920x1080")
SKIP_EXT = (".exr", ".tif", ".tiff", ".mp4", ".webm", ".mov", ".hwshow", ".zip")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "interim" / "audit"
FRAME_RE = re.compile(r'href="([^"?]+?\.(?:png|jpg|jpeg|tif|tiff|exr))"', re.IGNORECASE)

session = requests.Session()
session.headers["User-Agent"] = "EarthByEar-SpaceApps2026-audit"


def walk(obj):
    """Yield every dict inside a JSON structure."""
    if isinstance(obj, dict):
        yield obj
        for value in obj.values():
            yield from walk(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from walk(value)


def download(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        with session.get(url, timeout=120, stream=True) as r:
            r.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in r.iter_content(1 << 16):
                    f.write(chunk)
        return True
    except requests.RequestException as exc:
        print("   FAILED", url, exc)
        if dest.exists():
            dest.unlink()
        return False


def shape_of(path):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    return None if img is None else list(img.shape)


def audit(svs_id):
    print(f"\n=== SVS {svs_id} ===")
    folder = OUT / str(svs_id)
    folder.mkdir(parents=True, exist_ok=True)
    try:
        record = session.get(API.format(svs_id), timeout=60).json()
    except (requests.RequestException, ValueError) as exc:
        print("   API failed:", exc)
        return {"id": svs_id, "error": str(exc)}
    (folder / "api.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    result = {"id": svs_id, "title": record.get("title"), "images": [], "frame_folders": []}

    seen = set()
    for item in walk(record):
        url = item.get("url")
        if not isinstance(url, str) or url in seen:
            continue
        seen.add(url)
        url = url.replace("http://", "https://")
        if f"/a{svs_id:06d}/" not in url:
            continue  # page links and related visualizations
        media_type = str(item.get("media_type", "")).lower()
        if media_type == "frames" or "/frames/" in url:
            if any(word in url.lower() for word in SKIP_FOLDERS):
                continue
            result["frame_folders"].append(audit_frames(url, folder))
            continue
        name = url.rsplit("/", 1)[-1]
        if not name or name.lower().endswith(SKIP_EXT) or "." not in name:
            continue
        dest = folder / "images" / name
        if download(url, dest):
            result["images"].append({"name": name, "bytes": dest.stat().st_size, "shape": shape_of(dest)})
            print("   image", name, result["images"][-1]["shape"])
    return result


def audit_frames(url, folder):
    name = url.rstrip("/").rsplit("/", 1)[-1]
    info = {"folder": name, "url": url}
    try:
        html = session.get(url, timeout=120).text
    except requests.RequestException as exc:
        info["error"] = str(exc)
        return info
    (folder / f"listing_{name}.html").write_text(html, encoding="utf-8")
    files = sorted({href.rsplit("/", 1)[-1] for href in FRAME_RE.findall(html)})
    info["count"] = len(files)
    info["first"] = files[:3]
    info["last"] = files[-3:]
    (folder / f"listing_{name}.txt").write_text("\n".join(files), encoding="utf-8")
    print(f"   frames {name}: {len(files)} files ({files[0] if files else '-'} .. {files[-1] if files else '-'})")
    info["downloaded"] = []
    for fname in ([files[0], files[-1]] if files else []):
        if fname.lower().endswith(SKIP_EXT):
            continue
        dest = folder / "frames" / name / fname
        if download(urljoin(url if url.endswith("/") else url + "/", fname), dest):
            info["downloaded"].append({"name": fname, "bytes": dest.stat().st_size, "shape": shape_of(dest)})
    return info


def main():
    parser = argparse.ArgumentParser(description="Download what the P2 data audit needs.")
    parser.add_argument("--ids", nargs="+", type=int, default=DEFAULT_IDS)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    summary = [audit(svs_id) for svs_id in args.ids]
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print("\nDone. Summary in data/interim/audit/summary.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())

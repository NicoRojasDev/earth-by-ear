# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""P4 pipeline: NASA SVS frames -> docs/data/<id>.js + docs/data/frames/<id>/NNN.jpg

Same code for every phenomenon; settings live in scripts/phenomena.json.
  points (fire): warm pixels -> clusters -> [lon, lat, intensity]
  field (others): pixel color -> value with the colorbar -> 2-degree grid (uint8, 255 = no data)

Usage (Windows): .venv/Scripts/python scripts/build_data.py --id fire
                 .venv/Scripts/python scripts/build_data.py --all
Raw inputs come from scripts/download_raw.py (data/raw/<id>/). Safe to re-run.
"""
import argparse
import base64
import datetime as dt
import json
import re
import sys
from pathlib import Path

import cv2
import numpy as np
import requests

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
DOCS = ROOT / "docs"
CONFIG = json.loads((ROOT / "scripts" / "phenomena.json").read_text(encoding="utf-8"))
GRID_W, GRID_H, STEP = 180, 90, 2
DISPLAY = (1024, 512)


# ---------------------------------------------------------------- helpers
def log(*args):
    print(*args, flush=True)


def fetch(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest


def read_image(path):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise RuntimeError(f"Could not read {path}")
    if img.dtype == np.uint16:                      # 16-bit PNG -> 8-bit
        img = (img // 257).astype(np.uint8)
    return img


def to_bgr(img, background=255):
    if img.ndim == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if img.shape[2] == 4:
        a = img[:, :, 3:4].astype(np.float32) / 255.0
        return (img[:, :, :3] * a + background * (1 - a)).astype(np.uint8)
    return img


def lab(colors_bgr):
    arr = np.asarray(colors_bgr, dtype=np.uint8).reshape(-1, 1, 3)
    return cv2.cvtColor(arr, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)


# ---------------------------------------------------------------- colorbars
def load_colorbar(pid, cfg):
    """Return (colors_bgr Nx3, values N) sampled from the colorbar image(s)."""
    cb = cfg["colorbar"]
    if cb["kind"] == "gradient":
        img = to_bgr(read_image(fetch(cb["url"], RAW / pid / cb["file"])), background=0)
        y0, y1 = cb["rows"]
        strip = np.median(img[y0:y1 + 1, cb["x0"]:cb["x1"] + 1].astype(np.float32), axis=0)
        # Remove tick marks: columns that differ a lot from their neighbours.
        clean = strip.copy()
        for x in range(2, len(strip) - 2):
            neigh = (strip[x - 2] + strip[x + 2]) / 2
            if np.abs(strip[x] - neigh).max() > 40:
                clean[x] = neigh
        # The first and last columns touch the bar outline: copy the nearest clean color over them.
        edge = 4
        clean[:edge] = clean[edge]
        clean[-edge:] = clean[-edge - 1]
        n = len(clean)
        t = np.linspace(0, 1, n)
        v0, v1 = cb["v0"], cb["v1"]
        values = (v0 * (v1 / v0) ** t) if cb.get("scale") == "log" else (v0 + (v1 - v0) * t)
        colors = clean
        # Values beyond the scale are drawn darker than the last color: add darker copies of both ends.
        for factor in cb.get("extend_ends", []):
            colors = np.vstack([colors, clean[0] * factor, clean[-1] * factor])
            values = np.concatenate([values, [values[0], values[-1]]])
        return colors.astype(np.uint8), values.astype(np.float32)
    if cb["kind"] == "boxes":
        colors, values = [], []
        for f in cb["files"]:
            img = to_bgr(read_image(fetch(f["url"], RAW / pid / f["file"])), background=255)
            for x, v in zip(cb["x"], cb["values"]):
                patch = img[cb["row"] - 2:cb["row"] + 3, x - 3:x + 4].reshape(-1, 3)
                colors.append(np.median(patch, axis=0))
                values.append(v)
        return np.array(colors, dtype=np.uint8), np.array(values, dtype=np.float32)
    raise ValueError("Unknown colorbar kind " + cb["kind"])


class ColorLUT:
    """Nearest colorbar entry for every color, precomputed on a 64^3 grid (fast for full frames)."""

    def __init__(self, colors_bgr, values):
        q = np.arange(2, 256, 4, dtype=np.uint8)               # 64 levels per channel
        b, g, r = np.meshgrid(q, q, q, indexing="ij")
        cube = np.stack([b, g, r], axis=-1).reshape(-1, 3)
        cube_lab = lab(cube)
        bar_lab = lab(colors_bgr)
        best = np.zeros(len(cube), dtype=np.int32)
        dist = np.full(len(cube), np.inf, dtype=np.float32)
        for k in range(0, len(bar_lab), 64):
            d = np.linalg.norm(cube_lab[:, None, :] - bar_lab[None, k:k + 64, :], axis=2)
            j = d.argmin(axis=1)
            dj = d[np.arange(len(cube)), j]
            better = dj < dist
            best[better] = j[better] + k
            dist[better] = dj[better]
        self.value = values[best].reshape(64, 64, 64)
        self.dist = dist.reshape(64, 64, 64)

    def lookup(self, img_bgr):
        idx = (img_bgr >> 2).astype(np.intp)
        b, g, r = idx[..., 0], idx[..., 1], idx[..., 2]
        return self.value[b, g, r], self.dist[b, g, r]


# ---------------------------------------------------------------- frames and dates
def frame_dates(cfg, n_frames, names=None):
    d = cfg["dates"]
    if d["kind"] == "linear_days":
        start = dt.date.fromisoformat(d["start"])
        span = (dt.date.fromisoformat(d["end"]) - start).days
        last = d["last_index"] - d["first_index"]
        return [(start + dt.timedelta(days=int(np.floor(i * span / last)))).isoformat() for i in range(n_frames)]
    if d["kind"] == "linear_hours":
        start = dt.datetime.fromisoformat(d["start"].replace("Z", "+00:00"))
        return [(start + dt.timedelta(hours=i * d["step_hours"])).strftime("%Y-%m-%dT%H:%MZ") for i in range(n_frames)]
    if d["kind"] == "filename":
        out = []
        for name in names:
            m = re.search(d["pattern"], name)
            out.append(f"{m.group(1)}T{m.group(2)}:{m.group(3)}Z")
        return out
    raise ValueError(d["kind"])


def select_indices(cfg, dates):
    s = cfg["select"]
    n = len(dates)
    if "every_days" in s:
        until = dt.date.fromisoformat(s["until"])
        day = [dt.date.fromisoformat(x[:10]) for x in dates]
        picked, target = [], until
        while len(picked) < s["count"]:
            cands = [i for i, d in enumerate(day) if d <= target]
            if not cands:
                break
            picked.append(cands[-1])
            target -= dt.timedelta(days=s["every_days"])
        return sorted(set(picked))
    if "every" in s:
        return list(range(0, n, s["every"]))
    count = s.get("count", 60)
    if n <= count:
        return list(range(n))
    return sorted(set(np.linspace(0, n - 1, count).round().astype(int).tolist()))


def iter_movie(path, wanted):
    cap = cv2.VideoCapture(str(path))
    wanted = sorted(wanted)
    k, pos = 0, 0
    while k < len(wanted):
        ok, frame = cap.read()
        if not ok:
            break
        if pos == wanted[k]:
            yield pos, frame
            k += 1
        pos += 1
    cap.release()


def movie_length(path):
    cap = cv2.VideoCapture(str(path))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    return n


# ---------------------------------------------------------------- display image
def display_image(img_bgr, cfg):
    """1024x512 JPG-ready image; masked rectangles (logos, dates) are painted over by inpainting."""
    h, w = img_bgr.shape[:2]
    small = cv2.resize(img_bgr, DISPLAY, interpolation=cv2.INTER_AREA)
    rects = cfg.get("mask_rects", [])
    if rects:
        mask = np.zeros(small.shape[:2], np.uint8)
        sx, sy = DISPLAY[0] / w, DISPLAY[1] / h
        for x0, y0, x1, y1 in rects:
            mask[int(y0 * sy):int(np.ceil(y1 * sy)), int(x0 * sx):int(np.ceil(x1 * sx))] = 255
        small = cv2.inpaint(small, mask, 7, cv2.INPAINT_TELEA)
    return small


_base_map = None


def base_map():
    """Dark base map (navy ocean, black land) taken from the first fire frame, with the fires removed."""
    global _base_map
    if _base_map is None:
        path = RAW / "fire" / CONFIG["fire"]["movie"]
        if not path.exists():                     # fallback: plain dark background
            _base_map = np.full((DISPLAY[1], DISPLAY[0], 3), (40, 28, 18), np.uint8)
            return _base_map
        _, frame = next(iter_movie(path, [0]))
        small = cv2.resize(frame, DISPLAY, interpolation=cv2.INTER_AREA).astype(np.int32)
        ocean = (np.abs(small[..., 0] - 73) < 30) & (np.abs(small[..., 1] - 50) < 30) & (np.abs(small[..., 2] - 34) < 30)
        out = np.zeros_like(small)
        out[ocean] = (73, 50, 34)
        out[~ocean] = (12, 12, 12)
        _base_map = cv2.GaussianBlur(out.astype(np.uint8), (3, 3), 0)
    return _base_map


# ---------------------------------------------------------------- values
def fire_points(img, lut, cfg):
    """Most intense fire spots for the web (max_points) and the total number detected."""
    spots = fire_spots(img, lut, cfg)
    total = len(spots)                                # every fire spot detected in the frame
    pts = spots[:cfg.get("max_points", 800)]          # the web gets the most intense ones
    return [[p[2], p[3], round(p[0], 2)] for p in pts], total


def fire_spots(img, lut, cfg):
    """Every fire spot in a frame as (intensity, area_px, lon, lat), most intense first."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    warm = (h <= 40) & (s > 45) & (v > 70)
    white = (s < 45) & (v > 200)
    b, g, r = (img[..., i].astype(int) for i in range(3))
    ocean = (np.abs(b - 73) < 18) & (np.abs(g - 50) < 18) & (np.abs(r - 34) < 18)
    mask = ((warm | white) & ~ocean).astype(np.uint8)
    values, _ = lut.lookup(img)
    n, labels, stats, cents = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return []
    vmax = np.zeros(n, np.float32)
    np.maximum.at(vmax, labels.ravel(), np.where(mask.ravel() > 0, values.ravel(), 0))
    H, W = mask.shape
    v0, v1 = cfg["colorbar"]["v0"], cfg["colorbar"]["v1"]     # FRP colorbar range (0-8 MW)
    pts = []
    for k in range(1, n):
        cx, cy = cents[k]
        lon = (cx + 0.5) / W * 360 - 180
        lat = 90 - (cy + 0.5) / H * 180
        area = int(stats[k, cv2.CC_STAT_AREA])
        color_part = float(np.clip((vmax[k] - v0) / (v1 - v0), 0, 1))       # FRP read from the colorbar
        size_part = float(np.clip(np.log(area) / np.log(60), 0, 1))         # bigger clusters = more fire
        inten = 0.5 * color_part + 0.5 * size_part
        pts.append((inten, area, round(float(lon), 2), round(float(lat), 2)))
    pts.sort(key=lambda p: (p[0], p[1]), reverse=True)
    return pts


def field_grid(img_raw, lut, cfg):
    """Returns (grid uint8 GRID_H x GRID_W, cell values float with NaN)."""
    alpha = img_raw[:, :, 3] if (img_raw.ndim == 3 and img_raw.shape[2] == 4) else None
    img = img_raw[:, :, :3] if alpha is not None else img_raw
    values, dist = lut.lookup(img)
    valid = dist <= cfg.get("max_color_distance", 20)
    if alpha is not None and cfg.get("alpha_dry_is_zero"):
        dry = alpha < 40
        values = np.where(dry, 0.0, values)
        valid = valid | dry
        valid &= ~((alpha >= 40) & (dist > cfg.get("max_color_distance", 20)))
    if cfg.get("exclude_dark") or cfg.get("exclude_gray"):
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        sat, val = hsv[..., 1], hsv[..., 2]
        if cfg.get("exclude_dark"):                 # thin black borders/coastlines are not data
            valid &= val >= cfg["exclude_dark"]
        if cfg.get("exclude_gray"):                 # gray land and sea ice are not data
            smax, vmax = cfg["exclude_gray"]
            valid &= ~((sat < smax) & (val < vmax))
    h, w = valid.shape
    for x0, y0, x1, y1 in cfg.get("mask_rects", []):
        valid[y0:y1, x0:x1] = False
    vf = np.where(valid, values, 0).astype(np.float32)
    cnt = cv2.resize(valid.astype(np.float32), (GRID_W, GRID_H), interpolation=cv2.INTER_AREA)
    tot = cv2.resize(vf, (GRID_W, GRID_H), interpolation=cv2.INTER_AREA)
    with np.errstate(invalid="ignore", divide="ignore"):
        cell = tot / cnt
    cell[cnt < cfg.get("min_valid_fraction", 0.3)] = np.nan
    v0, v1 = cfg["value_range"]
    if cfg.get("scale") == "log":
        norm = (np.log10(np.clip(cell, v0, v1)) - np.log10(v0)) / (np.log10(v1) - np.log10(v0))
    else:
        norm = (np.clip(cell, v0, v1) - v0) / (v1 - v0)
    grid = np.where(np.isnan(cell), 255, np.round(norm * 254)).astype(np.uint8)
    return grid, cell


def field_stats(cell):
    """Area-weighted statistics (cells near the poles are smaller, so they weigh less)."""
    ok = ~np.isnan(cell)
    if not ok.any():
        return {"mean": None, "p90": None, "max": None, "max_lon": None, "max_lat": None}
    lats = 90 - STEP * (np.arange(GRID_H) + 0.5)
    weights = np.repeat(np.cos(np.radians(lats))[:, None], GRID_W, axis=1)
    j, i = np.unravel_index(np.nanargmax(cell), cell.shape)
    return {
        "mean": round(float(np.sum(cell[ok] * weights[ok]) / np.sum(weights[ok])), 3),
        "p90": round(float(np.nanpercentile(cell, 90)), 3),
        "max": round(float(np.nanmax(cell)), 3),
        "max_lon": float(-180 + STEP * (i + 0.5)),
        "max_lat": float(90 - STEP * (j + 0.5)),
    }


# ---------------------------------------------------------------- build
def build(pid):
    cfg = CONFIG[pid]
    log(f"\n=== {pid} (SVS {cfg['svs_id']}) ===")
    colors, values = load_colorbar(pid, cfg)
    log(f"colorbar: {len(colors)} colors, {values.min():.2f} .. {values.max():.2f} {cfg['units']}")
    lut = ColorLUT(colors, values)

    # Source frames
    if "movie" in cfg:
        movie = RAW / pid / cfg["movie"]
        if not movie.exists():
            log("MISSING", movie, "- run download_raw.py first")
            return False
        n = movie_length(movie)
        dates = frame_dates(cfg, n)
        idx = select_indices(cfg, dates)
        source = ((i, dates[i], img) for i, img in iter_movie(movie, idx))
        log(f"movie: {n} frames, using {len(idx)} ({dates[idx[0]]} .. {dates[idx[-1]]})")
    else:
        files = sorted((RAW / pid).glob(cfg["frames_glob"]))
        if not files:
            log("MISSING frames in", RAW / pid)
            return False
        dates = frame_dates(cfg, len(files), [f.name for f in files])
        idx = select_indices(cfg, dates)
        source = ((i, dates[i], read_image(files[i])) for i in idx)
        log(f"files: {len(files)}, using {len(idx)} ({dates[idx[0]]} .. {dates[idx[-1]]})")

    out_frames = DOCS / "data" / "frames" / pid
    out_frames.mkdir(parents=True, exist_ok=True)
    for old in out_frames.glob("*.jpg"):
        old.unlink()

    frames = []
    for k, (i, date, img) in enumerate(source):
        if cfg["type"] == "points":
            pts, total = fire_points(img, lut, cfg)
            shown = display_image(img, cfg)
            fr = {"t": date, "image": f"data/frames/{pid}/{k:03d}.jpg", "points": pts,
                  "stats": {"count": total, "shown": len(pts),
                            "mean": round(float(np.mean([p[2] for p in pts])) if pts else 0, 3)}}
        else:
            grid, cell = field_grid(img, lut, cfg)
            if img.ndim == 3 and img.shape[2] == 4:      # rain: draw the precipitation layer on the base map
                base = base_map().astype(np.float32)
                layer = cv2.resize(img, DISPLAY, interpolation=cv2.INTER_AREA).astype(np.float32)
                a = layer[:, :, 3:4] / 255.0
                shown = (layer[:, :, :3] * a + base * (1 - a)).astype(np.uint8)
            else:
                shown = display_image(img, cfg)
            fr = {"t": date, "image": f"data/frames/{pid}/{k:03d}.jpg",
                  "grid": base64.b64encode(grid.tobytes()).decode("ascii"), "stats": field_stats(cell)}
        cv2.imwrite(str(out_frames / f"{k:03d}.jpg"), shown, [cv2.IMWRITE_JPEG_QUALITY, 80])
        frames.append(fr)
        extra = f"{fr['stats']['count']} fire spots ({len(fr['points'])} kept)" if "points" in fr else f"mean {fr['stats']['mean']} max {fr['stats']['max']}"
        log(f"  {k:3d} frame {i:4d} {date}  {extra}")

    data = {
        "id": pid, "title": cfg["title"], "svs_id": cfg["svs_id"], "source": cfg["source"],
        "credit": "NASA's Scientific Visualization Studio", "simulated": False, "type": cfg["type"],
        "units": cfg["units"], "value_range": cfg["value_range"], "intensity_range": cfg["intensity_range"],
        "frames": frames,
    }
    if cfg.get("scale"):
        data["scale"] = cfg["scale"]
    for key in ("date_note", "intensity_note"):
        if cfg.get(key):
            data[key] = cfg[key]
    if cfg["type"] == "field":
        data["grid"] = {"w": GRID_W, "h": GRID_H, "step": STEP, "lon0": -180, "lat0": 90}

    out = DOCS / "data" / f"{pid}.js"
    body = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    out.write_text(
        f"// docs/data/{pid}.js (generated by scripts/build_data.py, do not edit by hand).\n"
        "// The generating script was written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.\n"
        f"window.EARTH_BY_EAR_DATA = window.EARTH_BY_EAR_DATA || {{}};\nwindow.EARTH_BY_EAR_DATA.{pid} = {body};\n",
        encoding="utf-8")
    img_kb = sum(f.stat().st_size for f in out_frames.glob("*.jpg")) / 1024
    log(f"wrote {out.relative_to(ROOT)}: {out.stat().st_size / 1e6:.2f} MB, {len(frames)} frames, images {img_kb / max(1, len(frames)):.0f} KB each")
    if out.stat().st_size > 1.5e6:
        log("WARNING: data file is above the 1.5 MB budget")
    return True


def main():
    parser = argparse.ArgumentParser(description="Build docs/data/<id>.js from NASA SVS frames.")
    parser.add_argument("--id", nargs="+", choices=[k for k in CONFIG if not k.startswith("_")])
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    ids = [k for k in CONFIG if not k.startswith("_")] if args.all else (args.id or [])
    if not ids:
        parser.error("use --id <id> or --all")
    ok = True
    for pid in ids:
        try:
            ok = build(pid) and ok
        except Exception as exc:     # keep going with the other phenomena
            log(f"FAILED {pid}: {exc!r}")
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

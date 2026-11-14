# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""Dev helper for P4: pull small samples out of the raw NASA movies so they can be inspected.

Writes data/interim/samples/<id>/ :
  info.txt                 frame count, fps, size, and a fire-pixel count per sampled frame
  date_NNN.png             (fire) the date stamp of the main movie at frame NNN, half size
  frame_NNN.jpg            a few full frames as JPG

Usage (Windows): .venv/Scripts/python scripts/extract_samples.py --id fire
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "interim" / "samples"

MOVIES = {
    "fire": ("fires_frp_VIIRS_eq_nl_2048p30.mp4", "fires_frp_VIIRS_2048p30.mp4"),
    "ocean": ("sst_anomaly_nodates_30_sec_4096x2048_2x1_30p.mp4", None),
    "air": ("MC01_stage3_GMAO_near_surface_temperature_2048x1024_en.mp4", None),
    "smoke": ("MC01_stage4_GMAO_pm25_2048x1024_en.mp4", None),
}


def read_frames(path, indices):
    cap = cv2.VideoCapture(str(path))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    wanted = sorted(set(i for i in indices if 0 <= i < n))
    out, k, pos = {}, 0, 0
    while k < len(wanted):
        ok, frame = cap.read()
        if not ok:
            break
        if pos == wanted[k]:
            out[pos] = frame
            k += 1
        pos += 1
    cap.release()
    return n, fps, (w, h), out


def fire_pixels(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = (hsv[..., 0] <= 35) & (hsv[..., 1] > 60) & (hsv[..., 2] > 90)
    return int(mask.sum())


def main():
    parser = argparse.ArgumentParser(description="Extract small samples from raw NASA movies.")
    parser.add_argument("--id", required=True, choices=sorted(MOVIES))
    args = parser.parse_args()
    eq_name, main_name = MOVIES[args.id]
    out = OUT / args.id
    out.mkdir(parents=True, exist_ok=True)
    lines = []

    cap = cv2.VideoCapture(str(RAW / args.id / eq_name))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); cap.release()
    every = list(range(0, total, 25)) + [total - 1]
    full = [0, total // 2, total - 1] + ([total - 40, total - 20] if args.id == "fire" else [])

    n, fps, size, frames = read_frames(RAW / args.id / eq_name, every)
    lines.append(f"{eq_name}: frames={n} fps={fps:.2f} size={size}")
    for i in sorted(frames):
        img = frames[i]
        extra = f" fire_px={fire_pixels(img)}" if args.id == "fire" else ""
        lines.append(f"  frame {i:4d}: mean_bgr={img.reshape(-1, 3).mean(0).round(1).tolist()}{extra}")
        if i in full:
            cv2.imwrite(str(out / f"frame_{i:03d}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 92])

    if main_name:
        n2, fps2, size2, frames2 = read_frames(RAW / args.id / main_name, every)
        lines.append(f"{main_name}: frames={n2} fps={fps2:.2f} size={size2}")
        for i, img in frames2.items():
            h, w = img.shape[:2]
            crop = img[int(h * 0.80):int(h * 0.90), 0:int(w * 0.20)]   # date stamp (bottom-left)
            crop = cv2.resize(crop, (crop.shape[1] // 2, crop.shape[0] // 2), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(out / f"date_{i:03d}.png"), crop)

    (out / "info.txt").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    print("Saved samples in", out)
    return 0


if __name__ == "__main__":
    sys.exit(main())

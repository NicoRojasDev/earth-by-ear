# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""Check the FIRMS MAP_KEY and which dates each source covers.

Usage (Windows): .venv/Scripts/python scripts/check_firms.py
Saves CSVs to data/interim/firms/ (not in git). The key is never printed in full.
"""
import argparse
import io
import sys
from pathlib import Path

import pandas as pd
import requests
from dotenv import dotenv_values

BASE = "https://firms.modaps.eosdis.nasa.gov/api"
# Santiago del Estero (approximate), west,south,east,north
SDE_BOX = "-65.2,-30.4,-61.7,-25.6"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "interim" / "firms"


def hide(text, key):
    """Replace the key with its last 4 characters."""
    return text.replace(key, "****" + key[-4:]) if key else text


def get_csv(url, key):
    print("GET", hide(url, key))
    try:
        r = requests.get(url, timeout=90)
    except requests.RequestException as exc:
        print("  network error:", hide(str(exc), key))
        return None
    body = r.text
    first = body.lstrip()[:40].lower()
    if r.status_code != 200 or first.startswith(("invalid", "error", "<")):
        print(f"  HTTP {r.status_code}: {hide(body[:200], key)!r}")
        return None
    return pd.read_csv(io.StringIO(body))


def report(df, name):
    if df is None:
        print(f"[FAIL] {name}: no data")
        return
    df.to_csv(OUT / f"{name}.csv", index=False)
    print(f"[OK] {name}: {len(df)} rows")
    print("     columns:", ", ".join(df.columns))
    if len(df) and "acq_date" in df.columns:
        print("     dates:", df["acq_date"].min(), "to", df["acq_date"].max())
    if len(df) and "frp" in df.columns:
        print(f"     frp (MW): sum {df['frp'].sum():.1f}, mean {df['frp'].mean():.1f}, max {df['frp'].max():.1f}")


def main():
    parser = argparse.ArgumentParser(description="Check the FIRMS MAP_KEY and data availability.")
    parser.add_argument("--sp-date", default="2025-09-01",
                        help="Start date (YYYY-MM-DD) to test the historical SP archive. Default: 2025-09-01")
    args = parser.parse_args()

    key = (dotenv_values(ROOT / ".env").get("FIRMS_MAP_KEY") or "").strip()
    if not key:
        print("[FAIL] FIRMS_MAP_KEY is empty in .env. Paste the key after FIRMS_MAP_KEY= and run again.")
        return 1
    print("MAP_KEY: ****" + key[-4:])
    OUT.mkdir(parents=True, exist_ok=True)

    print("\n1) Data availability (all sources)")
    avail = get_csv(f"{BASE}/data_availability/csv/{key}/ALL", key)
    if avail is None:
        print("[FAIL] The key was rejected or FIRMS is down.")
        return 1
    avail.to_csv(OUT / "availability.csv", index=False)
    print(avail.to_string(index=False))

    print("\n2) Most recent 5 days in Santiago del Estero")
    for source in ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"]:
        report(get_csv(f"{BASE}/area/csv/{key}/{source}/{SDE_BOX}/5", key), f"sde_recent_{source}")

    print(f"\n3) Historical archive: 5 days from {args.sp_date} in Santiago del Estero")
    report(get_csv(f"{BASE}/area/csv/{key}/VIIRS_SNPP_SP/{SDE_BOX}/5/{args.sp_date}", key),
           f"sde_{args.sp_date}_VIIRS_SNPP_SP")

    print("\nDone. CSVs saved in data/interim/firms/")
    return 0


if __name__ == "__main__":
    sys.exit(main())

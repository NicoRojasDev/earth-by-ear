# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""Check that the local environment is ready for Earth by Ear.

Usage (Windows): .venv/Scripts/python scripts/check_env.py
"""
import argparse
import importlib
import importlib.metadata
import sys
from pathlib import Path

REQUIRED_PYTHON = (3, 10)
# (import name, pip package name)
PACKAGES = [
    ("cv2", "opencv-python"),
    ("numpy", "numpy"),
    ("pandas", "pandas"),
    ("requests", "requests"),
    ("dotenv", "python-dotenv"),
]
ROOT = Path(__file__).resolve().parent.parent


def mask(value):
    """Show only the last 4 characters of a secret."""
    if not value:
        return "missing"
    return "****" + value[-4:]


def main():
    parser = argparse.ArgumentParser(description="Check the Earth by Ear environment.")
    parser.parse_args()
    ok = True

    v = sys.version_info
    py_ok = (v.major, v.minor) >= REQUIRED_PYTHON
    print(f"[{'OK' if py_ok else 'FAIL'}] Python {v.major}.{v.minor}.{v.micro} (need 3.10+)")
    ok = ok and py_ok

    for module_name, pip_name in PACKAGES:
        try:
            importlib.import_module(module_name)
            version = importlib.metadata.version(pip_name)
            print(f"[OK] {pip_name} {version}")
        except ImportError:
            print(f"[FAIL] {pip_name} is not installed")
            ok = False

    env_path = ROOT / ".env"
    if env_path.exists():
        key = ""
        try:
            from dotenv import dotenv_values
            key = (dotenv_values(env_path).get("FIRMS_MAP_KEY") or "").strip()
        except ImportError:
            pass
        print(f"[{'OK' if key else 'WARN'}] .env found, FIRMS_MAP_KEY: {mask(key)}")
    else:
        print("[WARN] .env not found: copy .env.example to .env and paste your FIRMS key")

    print("Environment ready." if ok else "Some checks failed. See above.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

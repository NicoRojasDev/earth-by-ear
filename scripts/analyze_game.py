# Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
"""P11: combine the listening-game results of every player and test them against chance.

Put each player's CSV (the "Copy results (CSV)" text from the Game tab) in pitch/game-results/,
one file per player, e.g. pitch/game-results/player01.csv. Then run:
    .venv/Scripts/python scripts/analyze_game.py
It prints the summary and writes pitch/game-results/summary.md.
"""
import argparse
import math
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / "pitch" / "game-results"
PHENOMENA = ["fire", "ocean", "rain", "air", "smoke"]
NAMES = {"fire": "Fires", "ocean": "Ocean Heat", "rain": "Rain & Snow", "air": "Air Temperature", "smoke": "Air Quality"}


def binom_tail(k, n, p):
    """P(X >= k) for X ~ Binomial(n, p): the chance of doing at least this well by guessing."""
    return min(1.0, sum(math.comb(n, j) * p ** j * (1 - p) ** (n - j) for j in range(k, n + 1)))


def fmt_p(p):
    return "< 0.0001" if p < 1e-4 else f"{p:.4f}"


def main():
    parser = argparse.ArgumentParser(description="Combine listening-game CSVs and test against chance.")
    parser.add_argument("--folder", default=str(FOLDER))
    args = parser.parse_args()
    folder = Path(args.folder)
    files = sorted(folder.glob("*.csv"))
    if not files:
        print(f"No CSV files in {folder}. Paste each player's results there (one .csv per player).")
        return 1
    frames = []
    for i, f in enumerate(files, 1):
        df = pd.read_csv(f)
        df["player"] = i
        frames.append(df)
    df = pd.concat(frames, ignore_index=True)
    df = df.dropna(subset=["answer_phenomenon", "answer_intensity"])
    n = len(df)
    k_types = df["phenomenon"].nunique()
    ok_p = int(df["correct_phenomenon"].sum())
    ok_i = int(df["correct_intensity"].sum())
    p_ph = binom_tail(ok_p, n, 1 / k_types)
    p_in = binom_tail(ok_i, n, 1 / 3)

    lines = ["# Listening game results", "",
             f"- Players: **{df['player'].nunique()}** · rounds answered: **{n}**",
             f"- Phenomenon recognized: **{ok_p}/{n} ({100 * ok_p / n:.0f}%)** vs. {100 / k_types:.0f}% by chance · binomial p-value **{fmt_p(p_ph)}**",
             f"- Intensity (low/medium/high) recognized: **{ok_i}/{n} ({100 * ok_i / n:.0f}%)** vs. 33% by chance · binomial p-value **{fmt_p(p_in)}**",
             f"- Median answer time: {df['time_ms'].median() / 1000:.1f} s · clips replayed in {100 * (df['replays'] > 0).mean():.0f}% of rounds",
             "", "## By phenomenon", "", "| Phenomenon | Rounds | Phenomenon right | Intensity right |", "|---|---|---|---|"]
    for ph in PHENOMENA:
        g = df[df["phenomenon"] == ph]
        if len(g):
            lines.append(f"| {NAMES[ph]} | {len(g)} | {100 * g['correct_phenomenon'].mean():.0f}% | {100 * g['correct_intensity'].mean():.0f}% |")
    lines += ["", "## Confusion matrix (rows: real phenomenon, columns: answer)", "",
              "| Real \\ Answer | " + " | ".join(NAMES[p] for p in PHENOMENA) + " |",
              "|---|" + "---|" * len(PHENOMENA)]
    for real in PHENOMENA:
        row = [str(int(((df["phenomenon"] == real) & (df["answer_phenomenon"] == ans)).sum())) for ans in PHENOMENA]
        lines.append(f"| {NAMES[real]} | " + " | ".join(row) + " |")
    lines += ["", "The p-value is the probability of getting at least this many right answers by guessing at random "
              "(one-sided exact binomial test). Below 0.05 means the sounds carry information people can hear."]
    text = "\n".join(lines) + "\n"
    (folder / "summary.md").write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())

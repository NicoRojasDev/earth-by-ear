# Listening game results

> Sunday 15 Nov 2026. Recorded by the team, one result per person. Analysis: one-sided exact binomial test against guessing (same formula as `scripts/analyze_game.py`).

- Players: **20**
- Phenomenon and intensity right: **17** · phenomenon right, intensity wrong: **2** · both wrong: **1**
- Phenomenon recognized: **19/20 (95%)** vs. 20% by chance · 95% Wilson interval 76%–99% · binomial p-value **< 0.0001** (8.5 × 10⁻¹³)
- Intensity (low/medium/high) recognized: **17/20 (85%)** vs. 33% by chance · 95% Wilson interval 64%–95% · binomial p-value **< 0.0001** (2.8 × 10⁻⁶)
- Both at once: **17/20 (85%)** vs. 6.7% by chance · binomial p-value **< 0.0001**

Per-round CSV files were not kept, so there is no confusion matrix. See [`../validation.md`](../validation.md#3-can-people-hear-the-data-listening-game) for the limits.

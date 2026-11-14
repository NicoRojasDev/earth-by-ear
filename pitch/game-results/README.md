# Listening game results

One CSV file per player, named `player01.csv`, `player02.csv`, ...

How to collect them (takes about 3 minutes per person):

1. Open https://nicorojasdev.github.io/earth-by-ear/ on a phone or computer, **with headphones**.
2. Press **Enable sound**, open the **Game** tab and play the 10 rounds without help.
3. At the end press **Copy results (CSV)** and paste the text in a new file here (or send it to the team chat and we paste it).
4. Do not write names: the file number is enough. Note on a paper only whether the player was sighted, low-vision or blind, and their age range, if they agree.

Then double-click `scripts/windows/13-analyze-game.bat`. It writes `summary.md` here with the accuracy, the chance level and the binomial p-value.

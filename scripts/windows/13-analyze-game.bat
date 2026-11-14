@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P11: combines the listening-game CSVs in pitch\game-results and tests them against chance.
call "%~dp0_paths.bat"
set LOG=data\interim\logs\13-analyze-game.txt
echo.
echo  Analizando los resultados del juego...
"%VPY%" -u scripts\analyze_game.py > "%LOG%" 2>&1
echo DONE >> "%LOG%"
type "%LOG%"
echo.
echo  Resumen guardado en pitch\game-results\summary.md
pause

@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem Commits everything with the message in data\interim\commit-msg.txt and pushes to GitHub.
call "%~dp0_paths.bat"
set LOG=data\interim\logs\05-save.txt
echo === 05-save %date% %time% === > "%LOG%"
echo.
echo  Guardando y subiendo cambios a GitHub...
git add -A >> "%LOG%" 2>&1
git commit -F data\interim\commit-msg.txt >> "%LOG%" 2>&1
git push >> "%LOG%" 2>&1
echo push exit=%errorlevel% >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
git status --short >> "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo  Listo.
timeout /t 5

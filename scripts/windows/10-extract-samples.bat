@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P4 dev helper: small samples from the raw movies. Log: data\interim\logs\10-extract-samples.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\10-extract-samples.txt
echo  Extrayendo muestras de los videos...
echo === fire === > "%LOG%"
"%VPY%" -u scripts\extract_samples.py --id fire >> "%LOG%" 2>&1
echo === air === >> "%LOG%"
"%VPY%" -u scripts\extract_samples.py --id air >> "%LOG%" 2>&1
echo === smoke === >> "%LOG%"
"%VPY%" -u scripts\extract_samples.py --id smoke >> "%LOG%" 2>&1
echo DONE >> "%LOG%"
timeout /t 3

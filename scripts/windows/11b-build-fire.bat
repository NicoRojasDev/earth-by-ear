@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P4: rebuilds only the fire data. Log: data\interim\logs\11b-build-fire.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\11b-build-fire.txt
echo  Procesando incendios...
"%VPY%" -u scripts\build_data.py --id fire > "%LOG%" 2>&1
echo DONE >> "%LOG%"
timeout /t 3

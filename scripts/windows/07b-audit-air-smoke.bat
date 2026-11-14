@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P2: audit only air temperature (5147) and PM2.5 (5151). Log: data\interim\logs\07b-audit.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\07b-audit.txt
echo  Descargando muestras de temperatura del aire y PM2.5...
"%VPY%" -u scripts\audit_svs.py --ids 5147 5151 > "%LOG%" 2>&1
echo DONE >> "%LOG%"
timeout /t 3

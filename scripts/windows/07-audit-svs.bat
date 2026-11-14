@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P2: downloads API records, previews, colorbars and first/last frames. Log: data\interim\logs\07-audit-svs.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\07-audit-svs.txt
echo.
echo  Descargando muestras de NASA para la auditoria (3-6 minutos)...
"%VPY%" -u scripts\audit_svs.py > "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo  Listo.
timeout /t 5

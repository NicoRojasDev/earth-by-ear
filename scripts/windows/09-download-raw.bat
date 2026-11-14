@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P4 step 1: downloads raw NASA movies and frames into data\raw. Log: data\interim\logs\09-download-raw.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\09-download-raw.txt
echo.
echo  Descargando videos y fotogramas de NASA (puede tardar 10-20 minutos).
echo  Podes seguir usando la compu. No cierres esta ventana.
"%VPY%" -u scripts\download_raw.py > "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo  Listo.
timeout /t 5

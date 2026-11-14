@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P4: builds docs\data\<id>.js and the frame images. Log: data\interim\logs\11-build-data.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\11-build-data.txt
echo.
echo  Procesando los datos de NASA (5-10 minutos)...
"%VPY%" -u scripts\build_data.py --all > "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo  Listo.
timeout /t 5

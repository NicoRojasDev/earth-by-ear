@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P1: checks the FIRMS key and available dates. Log: data\interim\logs\06-check-firms.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\06-check-firms.txt
echo.
echo  Probando la clave de FIRMS...
"%VPY%" scripts\check_firms.py > "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo  Listo.
timeout /t 5

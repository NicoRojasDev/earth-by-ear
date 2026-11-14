@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem P11: compares our fire spots with NASA FIRMS. Log: data\interim\logs\12-validate-firms.txt
call "%~dp0_paths.bat"
set LOG=data\interim\logs\12-validate-firms.txt
echo.
echo  Comparando los focos con NASA FIRMS (5-10 minutos)...
"%VPY%" -u scripts\validate_firms.py > "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo  Listo.
timeout /t 5

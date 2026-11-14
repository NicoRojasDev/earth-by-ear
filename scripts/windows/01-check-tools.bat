@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem Checks which tools are installed. Writes data\interim\logs\01-check-tools.txt
cd /d "%~dp0..\.."
if not exist data\interim\logs mkdir data\interim\logs
set LOG=data\interim\logs\01-check-tools.txt
echo === 01-check-tools %date% %time% === > "%LOG%"
echo [cwd] %cd% >> "%LOG%"
for %%c in (git python py gh claude winget node npm) do (
  echo --- where %%c --- >> "%LOG%"
  where %%c >> "%LOG%" 2>&1
)
echo --- versions --- >> "%LOG%"
call git --version >> "%LOG%" 2>&1
call py -3 --version >> "%LOG%" 2>&1
call python --version >> "%LOG%" 2>&1
call gh --version >> "%LOG%" 2>&1
call claude --version >> "%LOG%" 2>&1
call node --version >> "%LOG%" 2>&1
call winget --version >> "%LOG%" 2>&1
echo --- git identity --- >> "%LOG%"
call git config --global user.name >> "%LOG%" 2>&1
call git config --global user.email >> "%LOG%" 2>&1
echo DONE >> "%LOG%"
type "%LOG%"
echo.
echo Listo. Podes cerrar esta ventana.
timeout /t 15

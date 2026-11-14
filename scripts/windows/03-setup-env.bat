@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem Creates .env (empty key), the .venv with the 5 dependencies, requirements.txt and the local git repo.
call "%~dp0_paths.bat"
set LOG=data\interim\logs\03-setup-env.txt
echo === 03-setup-env %date% %time% === > "%LOG%"
echo.
echo  Creando el entorno de Python e instalando dependencias (2-4 minutos)...
if not exist .env (
  > .env echo FIRMS_MAP_KEY=
  echo created .env with empty key >> "%LOG%"
) else (
  echo .env already exists, not touched >> "%LOG%"
)
echo --- venv --- >> "%LOG%"
if not exist "%VPY%" "%PY%" -m venv .venv >> "%LOG%" 2>&1
"%VPY%" -m pip install --upgrade pip >> "%LOG%" 2>&1
echo --- pip install --- >> "%LOG%"
"%VPY%" -m pip install opencv-python numpy pandas requests python-dotenv >> "%LOG%" 2>&1
echo pip exit=%errorlevel% >> "%LOG%"
"%VPY%" -m pip freeze > data\interim\logs\pip-freeze.txt 2>&1
findstr /r /i "^opencv-python== ^numpy== ^pandas== ^requests== ^python-dotenv==" data\interim\logs\pip-freeze.txt > requirements.txt
echo --- requirements.txt --- >> "%LOG%"
type requirements.txt >> "%LOG%"
echo --- check_env --- >> "%LOG%"
"%VPY%" scripts\check_env.py >> "%LOG%" 2>&1
echo --- git --- >> "%LOG%"
if not exist .git git init -b main >> "%LOG%" 2>&1
git add -A >> "%LOG%" 2>&1
echo check-ignore .env: >> "%LOG%"
git check-ignore .env >> "%LOG%" 2>&1
git status --short >> "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo.
echo  Listo. Esta ventana se cierra sola.
timeout /t 10

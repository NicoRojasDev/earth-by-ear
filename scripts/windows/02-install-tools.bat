@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem Installs Git, Python 3.12 and GitHub CLI with winget. Log: data\interim\logs\02-install-tools.txt
cd /d "%~dp0..\.."
if not exist data\interim\logs mkdir data\interim\logs
set LOG=data\interim\logs\02-install-tools.txt
echo === 02-install-tools %date% %time% === > "%LOG%"
echo.
echo  Instalando Git, Python 3.12 y GitHub CLI. Tarda unos minutos.
echo  Si Windows pregunta "Desea permitir que esta aplicacion haga cambios", hace clic en SI.
echo.
echo [1/3] Git...
echo --- Git --- >> "%LOG%"
winget install -e --id Git.Git --source winget --accept-source-agreements --accept-package-agreements --silent >> "%LOG%" 2>&1
echo exit=%errorlevel% >> "%LOG%"
echo [2/3] Python 3.12...
echo --- Python --- >> "%LOG%"
winget install -e --id Python.Python.3.12 --source winget --scope user --accept-source-agreements --accept-package-agreements --silent >> "%LOG%" 2>&1
echo exit=%errorlevel% >> "%LOG%"
echo [3/3] GitHub CLI...
echo --- GitHub CLI --- >> "%LOG%"
winget install -e --id GitHub.cli --source winget --accept-source-agreements --accept-package-agreements --silent >> "%LOG%" 2>&1
echo exit=%errorlevel% >> "%LOG%"
echo --- check --- >> "%LOG%"
if exist "%ProgramFiles%\Git\cmd\git.exe" ("%ProgramFiles%\Git\cmd\git.exe" --version >> "%LOG%" 2>&1) else (echo git.exe NOT FOUND >> "%LOG%")
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" ("%LOCALAPPDATA%\Programs\Python\Python312\python.exe" --version >> "%LOG%" 2>&1) else (echo python312 NOT FOUND in LOCALAPPDATA >> "%LOG%")
if exist "%ProgramFiles%\Python312\python.exe" ("%ProgramFiles%\Python312\python.exe" --version >> "%LOG%" 2>&1)
if exist "%ProgramFiles%\GitHub CLI\gh.exe" ("%ProgramFiles%\GitHub CLI\gh.exe" --version >> "%LOG%" 2>&1) else (echo gh.exe NOT FOUND >> "%LOG%")
where curl >> "%LOG%" 2>&1
echo DONE >> "%LOG%"
echo.
echo  Listo. Esta ventana se cierra sola.
timeout /t 10

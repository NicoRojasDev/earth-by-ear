@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem Logs in to GitHub, makes the first commit, creates the public repo and turns on GitHub Pages (main /docs).
call "%~dp0_paths.bat"
set LOG=data\interim\logs\04-github.txt
echo === 04-github %date% %time% === > "%LOG%"
echo.
echo  PASO 1 - Iniciar sesion en GitHub
echo  - Si aparece una pregunta, apreta ENTER.
echo  - Copia el codigo de 8 caracteres que aparece abajo.
echo  - Apreta ENTER: se abre el navegador. Pega el codigo y autoriza "GitHub CLI".
echo.
gh auth status >> "%LOG%" 2>&1
if errorlevel 1 gh auth login --hostname github.com --git-protocol https --web
gh auth status >> "%LOG%" 2>&1
gh auth setup-git >> "%LOG%" 2>&1
set GHLOGIN=
for /f "delims=" %%i in ('gh api user --jq .login') do set GHLOGIN=%%i
for /f "delims=" %%i in ('gh api user --jq .id') do set GHID=%%i
echo login=%GHLOGIN% >> "%LOG%"
if "%GHLOGIN%"=="" (
  echo ERROR: not logged in >> "%LOG%"
  echo  No se pudo iniciar sesion. Avisale a Claude.
  goto :end
)
echo.
echo  PASO 2 - Subiendo el proyecto a GitHub como %GHLOGIN% ...
git config user.name "%GHLOGIN%"
git config user.email "%GHID%+%GHLOGIN%@users.noreply.github.com"
git add -A >> "%LOG%" 2>&1
git commit -F data\interim\commit-msg-p0.txt >> "%LOG%" 2>&1
gh repo view %GHLOGIN%/earth-by-ear >nul 2>&1
if errorlevel 1 (
  gh repo create earth-by-ear --public --source=. --remote=origin --push >> "%LOG%" 2>&1
) else (
  echo repo already exists >> "%LOG%"
  git remote get-url origin >nul 2>&1 || git remote add origin https://github.com/%GHLOGIN%/earth-by-ear.git
  git push -u origin main >> "%LOG%" 2>&1
)
echo --- pages --- >> "%LOG%"
gh api -X POST "repos/%GHLOGIN%/earth-by-ear/pages" -f "source[branch]=main" -f "source[path]=/docs" >> "%LOG%" 2>&1
gh api "repos/%GHLOGIN%/earth-by-ear/pages" --jq .html_url >> "%LOG%" 2>&1
echo --- .env on GitHub? expect 404 --- >> "%LOG%"
gh api "repos/%GHLOGIN%/earth-by-ear/contents/.env" --silent >> "%LOG%" 2>&1
echo exit=%errorlevel% >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
git remote -v >> "%LOG%" 2>&1
:end
echo DONE >> "%LOG%"
echo.
echo  Listo. Esta ventana se cierra sola.
timeout /t 20

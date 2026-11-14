@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem Shared setup: go to the repo root and put Git, GitHub CLI and Python on PATH (works even before a reboot).
cd /d "%~dp0..\.."
if not exist data\interim\logs mkdir data\interim\logs
set "PATH=%ProgramFiles%\Git\cmd;%ProgramFiles%\GitHub CLI;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%PATH%"
set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not exist "%PY%" if exist "%ProgramFiles%\Python312\python.exe" set "PY=%ProgramFiles%\Python312\python.exe"
set "VPY=.venv\Scripts\python.exe"

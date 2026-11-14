@echo off
rem Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
rem Opens .env in Notepad so a person can paste the FIRMS key (Claude never writes keys).
call "%~dp0_paths.bat"
if not exist .env (> .env echo FIRMS_MAP_KEY=)
start "" notepad.exe .env

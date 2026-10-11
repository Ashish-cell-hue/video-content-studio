@echo off
cd /d "%~dp0"
echo Starting Video Content Browser at http://localhost:8000
start "" "http://localhost:8000"
python -m http.server 8000
if errorlevel 1 (
  echo.
  echo Python command failed. Trying py...
  py -m http.server 8000
)
pause

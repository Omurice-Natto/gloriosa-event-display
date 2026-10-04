@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python が見つかりません。
  echo index.html を直接ブラウザで開いてください。
  pause
  exit /b 1
)
start "" http://localhost:8000/
python -m http.server 8000

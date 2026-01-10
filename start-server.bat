@echo off
echo Starting Roster System Web Server...
echo.
echo Employees can access on mobile via:
echo http://192.168.1.100:8000
echo.
echo Press Ctrl+C to stop server
echo.
cd /d "%~dp0"
python -m http.server 8000
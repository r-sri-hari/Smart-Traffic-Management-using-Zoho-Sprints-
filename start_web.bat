@echo off
title APEX TRAFFIC AI - Smart City Control Center
echo ========================================================
echo   APEX TRAFFIC AI - Smart City Traffic Optimization OS
echo ========================================================
echo.
echo Starting local web server on http://localhost:3000 ...
start "" "http://localhost:3000"
cd /d "%~dp0\web"
py -3.11 -c "import cv2" 2>nul && (
    py -3.11 server.py
) || (
    python server.py
)
pause

@echo off
cd /d "%~dp0"
echo Starting server in a new window, then opening the browser...
echo.

where npx >nul 2>&1
if %ERRORLEVEL%==0 (
  start "Seraya preview server" cmd /k "cd /d "%~dp0" && npx --yes http-server . -p 8880 -a 127.0.0.1 -c-1"
  goto :wait
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
  start "Seraya preview server" cmd /k "cd /d "%~dp0" && py -3 preview-server.py"
  goto :wait
)

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  start "Seraya preview server" cmd /k "cd /d "%~dp0" && python preview-server.py"
  goto :wait
)

echo No npx / py / python found. Install Node.js or Python 3 first.
pause
exit /b 1

:wait
timeout /t 3 /nobreak >nul
start http://127.0.0.1:8880/
echo.
echo If the page fails, wait a few seconds and refresh. Check the server window for errors.
pause

:: Tiger World Development - Start All Services
@echo off
echo.
echo ========================================
echo   🐯 Starting Tiger World Development 🐯
echo ========================================
echo.

:: Start Backend
echo [1/2] Starting Flask Backend Server...
start "Tiger World Backend" cmd /k "cd backend && .\venv\Scripts\activate && python run.py"
timeout /t 3 /nobreak > nul

:: Start Frontend
echo [2/2] Starting React Frontend Server...
start "Tiger World Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   ✅ Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul

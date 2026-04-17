@echo off
echo ===================================================
echo     Starting MediHR - Hospital Management System
echo ===================================================
echo.

:: Check if node_modules exists, if not run npm install
IF NOT EXIST "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    cmd /c npm install
    echo.
)

echo [INFO] Starting the development server...
cmd /c npm run dev

pause

@echo off
REM Post-Deployment Verification Script (Windows)
REM Runs all deployment verification checks for CSS loading fix
REM Requirements: 4.1, 4.2, 4.3

setlocal enabledelayedexpansion

REM Configuration
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000
set SCRIPT_DIR=%~dp0
set LOG_FILE=%SCRIPT_DIR%..\deployment-verification.log

REM Initialize log file
echo === Deployment Verification Started at %date% %time% === > "%LOG_FILE%"

echo.
echo ================================
echo 🚀 Post-Deployment Verification
echo ================================
echo.
echo Base URL: %BASE_URL%
echo Log file: %LOG_FILE%
echo.

set EXIT_CODE=0

REM 1. Nginx Configuration Check
echo.
echo ================================
echo 🔧 Nginx Configuration Check
echo ================================
echo.
echo --- Running Nginx Configuration Check --- >> "%LOG_FILE%"
node "%SCRIPT_DIR%nginx-config-check.js" >> "%LOG_FILE%" 2>&1
if !errorlevel! neq 0 (
    echo ❌ Nginx Configuration check failed
    set EXIT_CODE=1
) else (
    echo ✅ Nginx Configuration check passed
)

REM 2. Container Health Check
echo.
echo ================================
echo 🐳 Container Health Check
echo ================================
echo.
echo --- Running Container Health Check --- >> "%LOG_FILE%"
node "%SCRIPT_DIR%container-health-check.js" --baseUrl "%BASE_URL%" >> "%LOG_FILE%" 2>&1
if !errorlevel! neq 0 (
    echo ❌ Container Health check failed
    set EXIT_CODE=1
) else (
    echo ✅ Container Health check passed
)

REM 3. Comprehensive Deployment Verification
echo.
echo ================================
echo 📋 Deployment Verification
echo ================================
echo.
echo --- Running Deployment Verification --- >> "%LOG_FILE%"
node "%SCRIPT_DIR%deployment-verification.js" --baseUrl "%BASE_URL%" >> "%LOG_FILE%" 2>&1
if !errorlevel! neq 0 (
    echo ❌ Deployment Verification failed
    set EXIT_CODE=1
) else (
    echo ✅ Deployment Verification passed
)

REM 4. CSS Asset Diagnostic (if exists)
echo.
echo ================================
echo 🎨 CSS Asset Diagnostic
echo ================================
echo.
if exist "%SCRIPT_DIR%comprehensive-css-diagnostic.js" (
    echo --- Running CSS Asset Diagnostic --- >> "%LOG_FILE%"
    node "%SCRIPT_DIR%comprehensive-css-diagnostic.js" >> "%LOG_FILE%" 2>&1
    if !errorlevel! neq 0 (
        echo ⚠️  CSS diagnostic failed but continuing...
    ) else (
        echo ✅ CSS Asset Diagnostic passed
    )
) else (
    echo ⚠️  CSS diagnostic script not found, skipping...
)

REM 5. Docker Health Check (if exists)
echo.
echo ================================
echo 🏥 Docker Health Check
echo ================================
echo.
if exist "%SCRIPT_DIR%docker-health-check.sh" (
    echo --- Running Docker Health Check --- >> "%LOG_FILE%"
    bash "%SCRIPT_DIR%docker-health-check.sh" >> "%LOG_FILE%" 2>&1
    if !errorlevel! neq 0 (
        echo ⚠️  Docker health check failed but continuing...
    ) else (
        echo ✅ Docker Health Check passed
    )
) else (
    echo ⚠️  Docker health check script not found, skipping...
)

REM Summary
echo.
echo ================================
echo 📊 Verification Summary
echo ================================
echo.

if !EXIT_CODE! equ 0 (
    echo ✅ All critical checks passed!
    echo.
    echo 🎉 Deployment verification completed successfully!
    echo Your CSS loading fix deployment is ready.
    echo.
) else (
    echo ❌ Some critical checks failed!
    echo.
    echo 💥 Deployment verification failed!
    echo Please review the issues above and check the log file:
    echo %LOG_FILE%
    echo.
    
    REM Show recent errors from log
    echo Recent errors from log:
    findstr /C:"ERROR" /C:"FAIL" /C:"❌" "%LOG_FILE%" 2>nul || echo No specific errors found in recent log entries
)

echo === Deployment Verification Completed at %date% %time% === >> "%LOG_FILE%"

exit /b !EXIT_CODE!
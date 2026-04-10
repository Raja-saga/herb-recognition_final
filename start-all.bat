@echo off
echo ========================================
echo Starting Herb Recognition System
echo ========================================
echo.

echo [1/3] Starting RAG Service on port 8000...
start "RAG Service" cmd /k "cd /d %~dp0rag_service && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 5 /nobreak >nul

echo [2/3] Starting Backend on port 3001...
start "Backend" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend on port 5173...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo RAG Service:  http://localhost:8000
echo Backend:      http://localhost:3001
echo Frontend:     http://localhost:5173
echo ========================================

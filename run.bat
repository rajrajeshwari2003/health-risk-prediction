@echo off
echo "Starting FastAPI Backend and Vanilla Web Server..."
echo "The website will be available at http://localhost:8000"
start cmd /k "project\Scripts\python.exe backend\app.py"
ping 127.0.0.1 -n 3 > nul
start http://localhost:8000


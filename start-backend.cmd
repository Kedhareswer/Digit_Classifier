@echo off
cd backend
python -m uvicorn app:app --host 127.0.0.1 --port 8000

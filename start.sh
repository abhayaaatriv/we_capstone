#!/bin/bash

echo "🚀 Starting Finora Mock Stock Simulator..."
echo ""

# Kill any existing processes on ports 3000 and 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -f "news_scraper.py" 2>/dev/null

# Start backend
echo "Starting FastAPI backend on port 8000..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start news scraper (fetches immediately, then refreshes every REFRESH_SECONDS)
echo "📰 Starting financial news scraper..."
python news_scraper.py &
SCRAPER_PID=$!

cd ..

# Wait for backend to be ready
sleep 2

# Start frontend
echo "🖥️  Starting Next.js frontend on port 3000..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Finora is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services."

cleanup() {
    echo ""
    echo "👋 Stopping all services..."
    kill -TERM -$BACKEND_PID  2>/dev/null
    kill -TERM -$SCRAPER_PID  2>/dev/null
    kill -TERM -$FRONTEND_PID 2>/dev/null
    sleep 1
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    pkill -f "news_scraper.py" 2>/dev/null
    echo "✅  Stopped."
    exit 0
}

trap cleanup INT TERM

wait

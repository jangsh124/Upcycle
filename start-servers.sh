#!/bin/bash

echo "🚀 서버 시작 중..."

# 기존 프로세스 종료
echo "📋 기존 프로세스 종료 중..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

# 잠시 대기
sleep 2

# 백엔드 서버 시작 (핫 리로드)
echo "🔧 백엔드 서버 시작 중..."
cd backend
PORT=5001 npm run dev &
BACKEND_PID=$!

# 프론트엔드 서버 시작
echo "🎨 프론트엔드 서버 시작 중..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ 서버들이 시작되었습니다!"
echo "📊 백엔드 PID: $BACKEND_PID"
echo "📊 프론트엔드 PID: $FRONTEND_PID"
echo "🌐 프론트엔드: http://localhost:3000"
echo "🔧 백엔드: http://localhost:5001"

# 프로세스 모니터링
echo "📈 서버 상태 모니터링 중... (Ctrl+C로 종료)"
trap "echo '🛑 서버 종료 중...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ 백엔드 서버가 중단되었습니다!"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ 프론트엔드 서버가 중단되었습니다!"
        break
    fi
    sleep 5
done

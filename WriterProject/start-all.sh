#!/bin/bash

echo "🚀 Запуск WriterAssistant проекта..."
echo ""

PROJECT_ROOT="/Users/eduardbelskih/Проекты Github/WriterAssistant/WriterProject"

echo "📂 Проект: $PROJECT_ROOT"
echo ""

echo "🔧 Проверка зависимостей..."
cd "$PROJECT_ROOT/backend"
if [ ! -d "node_modules" ]; then
    echo "📦 Установка backend зависимостей..."
    npm install
fi

cd "$PROJECT_ROOT/web-demo"
if [ ! -d "node_modules" ]; then
    echo "📦 Установка frontend зависимостей..."
    npm install
fi

echo ""
echo "✅ Все зависимости установлены"
echo ""
echo "🔥 Запуск backend сервера (порт 5001)..."
cd "$PROJECT_ROOT/backend"
npm start &
BACKEND_PID=$!

sleep 5

echo ""
echo "🔥 Запуск frontend сервера (порт 5173)..."
cd "$PROJECT_ROOT/web-demo"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Все серверы запущены!"
echo ""
echo "📍 Backend: http://localhost:5001"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

wait
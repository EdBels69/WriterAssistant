#!/bin/bash

echo "🧪 Запуск тестов WriterAssistant проекта..."
echo ""

PROJECT_ROOT="/Users/eduardbelskih/Проекты Github/WriterAssistant/WriterProject"

echo "📍 Проект: $PROJECT_ROOT"
echo ""

echo "🔧 Запуск backend unit тестов..."
cd "$PROJECT_ROOT/backend"
npm test
BACKEND_EXIT=$?

echo ""
echo "🔧 Запуск frontend тестов..."
cd "$PROJECT_ROOT/web-demo"
npm test
FRONTEND_EXIT=$?

echo ""
if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
    echo "✅ Все тесты прошли успешно!"
    exit 0
else
    echo "❌ Некоторые тесты не прошли"
    exit 1
fi

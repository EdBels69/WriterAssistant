#!/bin/bash

# Полный бэкап: архив на диск + отправка в GitHub
# Запуск: cd "/Users/eduardbelskih/Проекты Github/WriterAssistant" && ./backup_and_push.sh

PROJECT_DIR="/Users/eduardbelskih/Проекты Github"
BACKUP_DIR="/Users/eduardbelskih/Проекты Github"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== WRITER ASSISTANT - BACKUP & GITHUB PUSH ==="
echo "Время: $(date)"
echo ""

# 1. Создание архива
echo "1. Создание архива проекта..."
cd "$PROJECT_DIR"
BACKUP_NAME="WriterAssistant_backup_$TIMESTAMP.tar.gz"
tar -czf "$BACKUP_NAME" WriterAssistant

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_NAME" | cut -f1)
    echo "   ✅ Бэкап создан: $BACKUP_NAME ($BACKUP_SIZE)"
else
    echo "   ❌ Ошибка при создании бэкапа"
    exit 1
fi

# 2. Git push
echo ""
echo "2. Отправка изменений в GitHub..."
cd "$PROJECT_DIR/WriterAssistant"

git add -A
git commit -m "Backup & Update v7.0 - $TIMESTAMP

- v2.0/v3.0: Fixed router imports, validation, metrics, tests
- v4.0: Optimized prompts, free OpenRouter models, specialized services
- v5.0: TTL cache, lazy loading, OutputValidator/Humanizer tests
- v6.0: Response cache, connection pooling, request deduplication, React.memo, debounce
- v7.0: Final check, start scripts, manual-test.js, README update
- Created: PrismaFlowGenerator, ForestPlotGenerator, Humanizer
- Created: start-all.sh, run-tests.sh, manual-test.js
- Updated: SmartRouter, GLMService, AIController, OutputValidator
- Tests: 100+ unit tests created
- Scripts: git_push.sh, backup.sh, backup_and_push.sh"

if [ $? -eq 0 ]; then
    echo "   ✅ Коммит создан"
else
    echo "   ℹ️ Нет изменений для коммита или уже закоммичено"
fi

git push origin main

if [ $? -eq 0 ]; then
    echo "   ✅ Успешно отправлено в GitHub"
else
    echo "   ⚠️ Ошибка при отправке в GitHub (проверьте интернет или авторизацию)"
fi

echo ""
echo "=== ГОТОВО ==="
echo "Бэкап: $BACKUP_DIR/$BACKUP_NAME"
echo "GitHub: https://github.com/EdBels69/WriterAssistant"

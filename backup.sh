#!/bin/bash

# Бэкап проекта WriterAssistant
# Запуск: cd "/Users/eduardbelskih/Проекты Github/WriterAssistant" && ./backup.sh

cd "/Users/eduardbelskih/Проекты Github"
BACKUP_NAME="WriterAssistant_backup_$(date +%Y%m%d_%H%M%S).tar.gz"

echo "Создание бэкапа: $BACKUP_NAME"
tar -czf "$BACKUP_NAME" WriterAssistant

if [ $? -eq 0 ]; then
    echo "Бэкап успешно создан: /Users/eduardbelskih/Проекты Github/$BACKUP_NAME"
    ls -lh "$BACKUP_NAME"
else
    echo "Ошибка при создании бэкапа"
    exit 1
fi

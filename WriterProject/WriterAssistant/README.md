# WriterAssistant

Высокоэффективное локальное приложение для MacBook M1.

## Особенности

- **Apple Silicon Optimization**: Нативная компиляция для M1/M2/M3
- **Автономная работа**: Полностью локальное хранение данных
- **Roo Code Light Theme**: Минималистичный интерфейс
- **Система обновлений**: Git-based обновления
- **Логирование**: Полная система логов с фильтрацией и экспортом
- **Персонализация**: Настройки тем и шрифтов
- **Энергоэффективность**: Оптимизация энергопотребления

## Системные требования

- macOS 11.0 или новее
- Apple Silicon (M1, M2, M3)
- Xcode 15.0+ (для сборки)

## Установка

### Через клонирование репозитория

```bash
# Клонирование репозитория
git clone <repository-url>
cd WriterAssistant

# Открытие проекта в Xcode
open WriterAssistant.xcodeproj

# Сборка и запуск через Xcode
# Нажмите Cmd+R для запуска
```

### Через выпускные версии (Releases)

1. Перейдите в раздел [Releases](../../releases)
2. Скачайте последнюю версию
3. Распакуйте архив
4. Переместите WriterAssistant.app в папку Applications

## Сборка из исходного кода

```bash
# Клонирование репозитория
git clone <repository-url>
cd WriterAssistant

# Сборка проекта
xcodebuild -project WriterAssistant.xcodeproj \
  -scheme WriterAssistant \
  -configuration Release \
  -destination 'platform=macOS' \
  -archivePath build/WriterAssistant.xcarchive \
  archive

# Экспорт приложения
xcodebuild -exportArchive \
  -archivePath build/WriterAssistant.xcarchive \
  -exportPath build/WriterAssistant \
  -exportOptionsPlist .github/exportOptions.plist
```

## Использование

### Настройки

Приложение автоматически применяет системную тему (светлая/тёмная). Вы можете изменить тему в настройках:

1. Откройте вкладку "Настройки"
2. Выберите тему: Light, Dark или System
3. Настройте размер шрифта
4. Включите/выключите автосохранение

### Логирование

Просмотр логов доступен на вкладке "Логи":

- Фильтрация по уровню (Debug, Info, Warning, Error)
- Поиск по сообщению
- Автоматическая прокрутка к новым записям
- Экспорт в файл или копирование в буфер обмена
- Очистка логов

### Обновления

Приложение проверяет наличие обновлений автоматически при запуске. Вы также можете:

1. Открыть главную вкладку
2. Нажать "Проверить обновления"
3. Следовать инструкциям для установки обновления

## Архитектура проекта

```
WriterAssistant/
├── App/                    # Точка входа приложения
│   ├── WriterAssistantApp.swift
│   └── AppDelegate.swift
├── Core/                   # Основная логика
│   ├── UpdateManager.swift
│   └── ResourceManager.swift
├── Features/               # Функциональные модули
│   ├── Main/
│   ├── Settings/
│   └── Logs/
├── UI/                     # Компоненты интерфейса
│   ├── Components/
│   └── Theme/
├── Models/                 # Модели данных
│   ├── Settings.swift
│   ├── LogEntry.swift
│   └── WriterAssistant.xcdatamodeld
└── Resources/              # Ресурсы приложения
```

## Разработка

### Требования

- Xcode 15.0+
- Swift 5.0+
- macOS 11.0+

### Структура

- **SwiftUI**: Декларативный UI фреймворк
- **Core Data**: Локальное хранение данных
- **Git-based updates**: Система обновлений через Git

### Сборка для тестирования

```bash
xcodebuild test \
  -project WriterAssistant.xcodeproj \
  -scheme WriterAssistant \
  -destination 'platform=macOS'
```

## CI/CD

Проект использует GitHub Actions для автоматической сборки:

- Автоматическая сборка при создании нового тега
- Экспорт приложения
- Публикация в Releases

## Лицензия

[Добавьте информацию о лицензии]

## Поддержка

Для вопросов и предложений создайте [issue](../../issues).
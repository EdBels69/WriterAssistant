# ScientificWriter AI - ИИ-ассистент для научных исследований

Мощный локальный инструмент для написания научных статей, обзоров, методических материалов и учебных пособий с использованием GLM-4.7.

## Основные возможности

### Deep Research & Анализ
- Генерация научных гипотез и исследовательских вопросов
- Структурирование идей из множественных источников
- Анализ и синтез литературных данных
- Создание нарративных, систематических обзоров и мета-анализов

### Редактирование научных текстов
- Загрузка текстовых источников (учебники, пособия, методички)
- ИИ-редактирование больших объемов текста без токен-лимитов
- Автоматическое разделение на чанки для обработки длинных документов
- Сохранение академического стиля и терминологии

### Инструменты для исследователей
- Генерация и структурирование методологии исследований
- Анализ материалов и методов
- Подготовка разделов для научных публикаций
- Статистическая интерпретация результатов

### Цели и трекинг
- Установка целей по количеству слов/времени
- Отслеживание прогресса в реальном времени
- Статистика продуктивности

### Коллаборация
- Реальное время через WebSocket
- Комментарии и обсуждение
- Совместное редактирование проектов

## Архитектура

- **Frontend**: React + Vite (порты 3001-3002)
- **Backend**: Node.js + Express (порт 5001)
- **Database**: SQLite (better-sqlite3)
- **AI Engine**: GLM-4.7 API
- **Real-time**: WebSocket сервер

## Быстрый старт

### Требования
- Node.js 18+
- GLM API ключ

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/EdBels69/ScientificWriter.git
cd ScientificWriter

# Установка бэкенда
cd backend
npm install
cp .env.example .env

# Настройте GLM_API_KEY в .env файле

# Запуск бэкенда
npm start

# В новом терминале - установка фронтенда
cd web-demo
npm install

# Запуск фронтенда
npm run dev
```

### Доступ

- Frontend: http://localhost:3001
- Backend API: http://localhost:5001/api
- WebSocket: ws://localhost:5001
- Health Check: http://localhost:5001/health

## API Эндпоинты

### AI Генерация
- `POST /api/ai/generate` - Генерация контента
- `POST /api/ai/analyze` - Анализ текста
- `POST /api/ai/summarize` - Суммаризация

### Экспорт
- `POST /api/export/pdf` - Экспорт в PDF
- `POST /api/export/docx` - Экспорт в DOCX
- `POST /api/export/txt` - Экспорт в TXT

### Чат
- `POST /api/chat/message` - Отправка сообщения
- `GET /api/chat/history/:sessionId` - История чата

### Комментарии
- `GET /api/comments/project/:projectId` - Комментарии проекта
- `POST /api/comments` - Создание комментария

## Разработка

### Структура проекта

```
ScientificWriter/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── services/     # Business logic
│   │   ├── websocket/    # WebSocket server
│   │   └── index.js      # Entry point
│   ├── database.db       # SQLite database
│   └── package.json
├── web-demo/             # React frontend
│   ├── src/
│   │   ├── api/          # API clients
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   └── App.jsx       # Main component
│   └── package.json
└── WriterAssistant/      # macOS app (SwiftUI)
```

### Настройка окружения

```bash
# Backend
PORT=5001
GLM_API_KEY=your_api_key
NODE_ENV=development
```

## Лицензия

MIT License

## Контакт

GitHub: [EdBels69](https://github.com/EdBels69)

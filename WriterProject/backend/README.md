# WriterAssistant Backend

Backend сервер для WriterAssistant - AI-платформы для писателей с интеграцией GLM-4.7.

## Технологии

- Node.js + Express.js
- SQLite (better-sqlite3)
- WebSocket (ws)
- GLM-4.7 API (Zhipu AI)
- Axios (HTTP клиент)

## Установка

1. Склонируйте репозиторий
2. Перейдите в директорию бэкенда:
```bash
cd backend
```

3. Установите зависимости:
```bash
npm install
```

4. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

5. Отредактируйте `.env` и добавьте ваш GLM API ключ:
```env
PORT=5000
GLM_API_KEY=your_actual_glm_api_key_here
NODE_ENV=development
```

## Запуск

### Режим разработки (с автоперезагрузкой)
```bash
npm run dev
```

### Режим производства
```bash
npm start
```

Сервер запустится на `http://localhost:5000`

## API Эндпоинты

### Projects
- `GET /api/projects?userId=<id>` - Получить все проекты
- `GET /api/projects/:id` - Получить проект
- `POST /api/projects` - Создать проект
- `PUT /api/projects/:id` - Обновить проект
- `DELETE /api/projects/:id` - Удалить проект
- `POST /api/projects/:id/ideas` - Сгенерировать идеи
- `POST /api/projects/:id/outline` - Создать план сюжета
- `POST /api/projects/:id/expand` - Расширить текст

### Chat
- `POST /api/chat/message` - Отправить сообщение ИИ
- `GET /api/chat/history/:sessionId` - Получить историю чата
- `POST /api/chat/clear/:sessionId` - Очистить историю

### Statistics
- `GET /api/statistics/overview/:userId` - Обзор статистики
- `GET /api/statistics/productivity/:userId` - Продуктивность
- `GET /api/statistics/sessions/:userId` - Сессии письма
- `GET /api/statistics/goals/:userId` - Цели
- `POST /api/statistics/goals` - Создать цель
- `PUT /api/statistics/goals/:id` - Обновить цель
- `DELETE /api/statistics/goals/:id` - Удалить цель

## WebSocket

### Подключение
```
ws://localhost:5000?userId=<user_id>
```

### События
- `connected` - Подключение установлено
- `chat_message` - Новое сообщение в чате
- `typing_start` - Пользователь начал писать
- `typing_stop` - Пользователь перестал писать
- `user_joined` - Пользователь присоединился к проекту
- `user_left` - Пользователь покинул проект

## Структура проекта

```
backend/
├── src/
│   ├── controllers/       # Контроллеры API
│   │   ├── ProjectController.js
│   │   ├── ChatController.js
│   │   └── StatisticsController.js
│   ├── database/         # Работа с базой данных
│   │   └── Database.js
│   ├── services/         # Сервисы
│   │   └── GLMService.js
│   ├── websocket/        # WebSocket сервер
│   │   └── WebSocketServer.js
│   └── index.js          # Точка входа
├── data/                 # SQLite база данных (создаётся автоматически)
├── package.json
├── .env.example
└── README.md
```

## Требования к GLM API ключу

Для получения API ключа:
1. Зарегистрируйтесь на [Zhipu AI](https://open.bigmodel.cn/)
2. Создайте API ключ в личном кабинете
3. Добавьте ключ в `.env` файл

## Тестирование

```bash
npm test
```

## Production Deploy

Для production развертывания:

1. Установите зависимости:
```bash
npm install --production
```

2. Настройте `.env` для production:
```env
PORT=5000
GLM_API_KEY=your_production_key
NODE_ENV=production
```

3. Запустите с помощью PM2:
```bash
npm install -g pm2
pm2 start src/index.js --name writer-assistant-backend
pm2 startup
pm2 save
```

## Troubleshooting

### Порт уже занят
Если порт 5000 занят, измените `PORT` в `.env` файле.

### Ошибка GLM API
Проверьте:
1. Правильность API ключа
2. Баланс аккаунта Zhipu AI
3. Корректность запросов

### Ошибка базы данных
Проверьте права на запись в директорию `data/` и наличие дискового пространства.

## Поддержка

Для вопросов и предложений создайте issue в репозитории.
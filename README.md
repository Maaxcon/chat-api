# Chat API - Лабораторна робота №1

REST API для месенджера з реальною базою даних MySQL.

## 🛠 Технології

- **Backend**: Node.js 18+ + Express.js 4.18
- **База даних**: MySQL 8.0
- **ORM**: mysql2 (Promise-based)
- **Архітектура**: REST API

## 📦 Встановлення

### 1. Клонувати репозиторій
```bash
git clone <your-repo-url>
cd chat-lab
```

### 2. Встановити залежності
```bash
npm install
```

### 3. Налаштувати базу даних

Створіть базу даних в MySQL:
```sql
CREATE DATABASE chat_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Створити таблиці
```bash
mysql -u root -p chat_lab < schema.sql
```

### 5. Згенерувати тестові дані (10k users, 50k conversations, 1M messages)
```bash
node seed-data.js
```
⚠️ **Увага**: Це займе 5-10 хвилин!

### 6. Запустити сервер
```bash
npm start
```

Сервер запуститься на `http://localhost:3000`

## 📡 API Endpoints

### Системні endpoints
- `GET /health` - Перевірка стану сервера
- `GET /api/metrics` - Метрики (RPS, avg response time, error rate)
- `GET /api/chaos/enable` - Увімкнути режим хаосу (10% запитів падають)
- `GET /api/chaos/disable` - Вимкнути режим хаосу

### Розмови
- `GET /api/conversations?user_id=1` - Список розмов користувача
- `POST /api/conversations/create` - Створити групову розмову

### Повідомлення
- `GET /api/conversations/:id/messages?page=1` - Отримати повідомлення (пагінація)
- `POST /api/messages/send` - Відправити повідомлення
- `PUT /api/messages/:id/read` - Позначити як прочитане
- `GET /api/messages/unread?user_id=1` - Кількість непрочитаних
- `GET /api/messages/search?q=hello&user_id=1` - Пошук повідомлень
- `DELETE /api/messages/:id` - Видалити повідомлення (м'яке видалення)
- `GET /api/conversations/:id/media` - Медіафайли в розмові

### Додаткове
- `POST /api/conversations/:id/typing` - Індикатор набору тексту

## 🧪 Тестування

### Перевірка здоров'я сервера:
```bash
curl http://localhost:3000/health
```

### Отримати розмови користувача:
```bash
curl "http://localhost:3000/api/conversations?user_id=1"
```

### Відправити повідомлення:
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": 1, "sender_id": 1, "content": "Hello World!"}'
```

### Переглянути метрики:
```bash
curl http://localhost:3000/api/metrics
```

## 📊 Структура бази даних

- **users** (10,000 записів) - Користувачі
- **conversations** (50,000) - Розмови (direct/group)
- **conversation_participants** (~150,000) - Учасники розмов
- **messages** (1,000,000) - Повідомлення
- **message_status** - Статуси доставки/прочитання

## ⚙️ Особливості реалізації

### Request Logging
Кожен запит логується з:
- Timestamp
- HTTP метод
- Шлях
- Статус відповіді
- Тривалість (ms)
- Server ID

### Simulated Latency
- Read операції: 50ms затримка
- Write операції: 100ms затримка

### Chaos Monkey
При активації 10% запитів випадково повертають 500 помилку для тестування стійкості системи.

### Metrics
- Total requests
- Requests per second (RPS)
- Average response time
- Error rate
- Active connections

## 🚀 Масштабування (для майбутніх лабораторних)

- Message delivery confirmation
- Unread count optimization
- Real-time typing indicators (WebSocket)
- Full-text search optimization
- Group chat fan-out patterns

## 👨‍💻 Автор

Курильчук Максим
Група: ПЗ-2204
Рік: 2024

## 📝 Ліцензія

MIT
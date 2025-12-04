# 💬 Chat API — Лабораторна робота №1

REST API для месенджера з реальною базою даних **MySQL** та запуском через **Docker**.

---

## 🛠 Технології

* **Backend**: Node.js 18+ + Express.js 4.18
* **База даних**: MySQL 8.0 (через Docker)
* **Driver**: mysql2 (Promise-based)
* **Архітектура**: REST API
* **Контейнери**: Docker + Docker Compose

---

## 📌 Можливості

✅ 10 API ендпоінтів  
✅ Реальна MySQL база  
✅ Логування запитів  
✅ Метрики сервера (RPS, response time, error rate)  
✅ Chaos Monkey режим  
✅ Docker-запуск однією командою  
✅ 1,000,000 тестових повідомлень  

---

## 🚀 Швидкий запуск через Docker

### 1. Склонуйте репозиторій

```bash
git clone https://github.com/Maaxcon/chat-api.git
cd chat-lab
```

### 2. Запустіть Docker

```bash
docker-compose up -d --build
```

**Що відбудеться:**
* Запуститься MySQL 8.0
* Створиться база даних `chat_lab`
* Імпортується `schema.sql`
* Запуститься Node.js API на порту 3000

### 3. Перевірка, що сервер працює

```bash
curl http://localhost:3000/health
```

**Очікуваний результат:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-04T10:30:00.000Z",
  "server_id": "docker-server-1",
  "uptime_seconds": 120.5,
  "request_count": 5
}
```

---

## 🌱 Генерація тестових даних

```bash
docker-compose exec app node seed-data.js
```

⚠️ **Увага:** Генерація займе 5-10 хвилин!

**Що генерується:**
* 10,000 користувачів
* 50,000 розмов (80% direct, 20% group)
* ~150,000 учасників розмов
* 1,000,000 повідомлень

---

## 📡 API Ендпоінти

### 🔧 Системні endpoints

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/health` | Перевірка стану сервера |
| GET | `/api/metrics` | Метрики (RPS, avg response time, error rate) |
| GET | `/api/chaos/enable` | Увімкнути режим хаосу (10% запитів падають) |
| GET | `/api/chaos/disable` | Вимкнути режим хаосу |

---

### 💬 Розмови

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/conversations?user_id=1` | Список розмов користувача |
| POST | `/api/conversations/create` | Створити групову розмову |
| GET | `/api/conversations/:id/media` | Медіафайли в розмові |

---

### 📨 Повідомлення

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/conversations/:id/messages?page=1` | Отримати повідомлення (пагінація) |
| POST | `/api/messages/send` | Відправити повідомлення |
| PUT | `/api/messages/:id/read` | Позначити як прочитане |
| DELETE | `/api/messages/:id` | Видалити повідомлення (м'яке видалення) |
| GET | `/api/messages/unread?user_id=1` | Кількість непрочитаних |
| GET | `/api/messages/search?q=hello&user_id=1` | Пошук повідомлень |

---

### ⌨️ Додаткове

| Метод | URL | Опис |
|-------|-----|------|
| POST | `/api/conversations/:id/typing` | Індикатор набору тексту |

---

## 🧪 Тестування API

### Системні запити

```bash
# Перевірка здоров'я сервера
curl http://localhost:3000/health

# Переглянути метрики
curl http://localhost:3000/api/metrics

# Увімкнути режим хаосу
curl http://localhost:3000/api/chaos/enable

# Вимкнути режим хаосу
curl http://localhost:3000/api/chaos/disable
```

### Робота з розмовами

```bash
# Отримати розмови користувача
curl "http://localhost:3000/api/conversations?user_id=1"

# Створити групову розмову
curl -X POST http://localhost:3000/api/conversations/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Chat",
    "type": "group",
    "created_by": 1,
    "participants": [1, 2, 3, 4]
  }'

# Отримати медіафайли з розмови
curl "http://localhost:3000/api/conversations/1/media"
```

### Робота з повідомленнями

```bash
# Отримати повідомлення з розмови (сторінка 1)
curl "http://localhost:3000/api/conversations/1/messages?page=1"

# Відправити повідомлення
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": 1,
    "sender_id": 1,
    "content": "Hello World!",
    "type": "text"
  }'

# Позначити повідомлення як прочитане
curl -X PUT http://localhost:3000/api/messages/5/read \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'

# Кількість непрочитаних повідомлень
curl "http://localhost:3000/api/messages/unread?user_id=1"

# Пошук повідомлень
curl "http://localhost:3000/api/messages/search?q=hello&user_id=1"

# Видалити повідомлення (м'яке видалення)
curl -X DELETE http://localhost:3000/api/messages/10

# Індикатор "користувач друкує"
curl -X POST http://localhost:3000/api/conversations/1/typing \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

---

## 📊 Метрики сервера

Сервер автоматично рахує:

* **Total requests** — загальна кількість запитів
* **Requests per second (RPS)** — запитів за секунду
* **Average response time** — середній час відповіді
* **Error rate** — відсоток помилок
* **Active connections** — активні з'єднання

**Приклад відповіді:**
```json
{
  "total_requests": 1523,
  "requests_per_second": "12.45",
  "average_response_time": "87.32",
  "error_rate": "0.0013",
  "active_connections": 3,
  "uptime_seconds": "122.34"
}
```

---

## 📊 Структура бази даних

### Таблиці:

* **users** (10,000 записів) — Користувачі системи
* **conversations** (50,000) — Розмови (direct/group)
* **conversation_participants** (~150,000) — Учасники розмов
* **messages** (1,000,000) — Повідомлення
* **message_status** — Статуси доставки/прочитання

### Основні індекси:

```sql
-- Швидкий пошук розмов користувача
INDEX idx_participant_user (user_id, conversation_id)

-- Швидке отримання повідомлень з розмови
INDEX idx_conv_created (conversation_id, created_at)

-- Full-text пошук
FULLTEXT INDEX idx_content_search (content)

-- Непрочитані повідомлення
INDEX idx_unread (user_id, is_read)
```

---

## ⚙️ Особливості реалізації

### Request Logging

Кожен запит логується з:
* Timestamp (ISO 8601)
* HTTP метод
* Шлях
* Статус відповіді
* Тривалість (ms)
* Server ID

**Приклад логу:**
```json
{
  "timestamp": "2025-12-04T10:30:15.123Z",
  "method": "GET",
  "path": "/api/conversations",
  "status": 200,
  "duration_ms": "45.23",
  "server_id": "docker-server-1"
}
```

### Simulated Latency

Для реалістичності додано затримки:
* **Read операції** (GET): 50ms затримка
* **Write операції** (POST/PUT/DELETE): 100ms затримка

### Chaos Monkey

При активації через `/api/chaos/enable`:
* 10% запитів випадково повертають **500 Internal Server Error**
* Використовується для тестування стійкості системи
* Помилки логуються в метриках

---

## 🐳 Docker конфігурація

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: chat_lab_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: chat_lab
      MYSQL_USER: chatuser
      MYSQL_PASSWORD: chatpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 10

  app:
    build: .
    container_name: chat_lab_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DB_HOST: db
      DB_USER: chatuser
      DB_PASSWORD: chatpassword
      DB_NAME: chat_lab
      PORT: 3000
      SERVER_ID: docker-server-1
    depends_on:
      db:
        condition: service_healthy

volumes:
  mysql_data:
```

---

## 🗂 Структура проєкту

```
chat-lab/
├── server.js           # Основний сервер Express.js
├── db.js              # Підключення до MySQL
├── seed-data.js       # Генератор тестових даних
├── schema.sql         # SQL схема бази даних
├── Dockerfile         # Docker образ для Node.js
├── docker-compose.yml # Оркестрація контейнерів
├── package.json       # Залежності Node.js
├── .env               # Змінні оточення (не в git)
├── .gitignore
└── README.md          # Документація
```

---

## 🔧 Корисні Docker команди

```bash
# Запустити контейнери
docker-compose up -d

# Зупинити контейнери
docker-compose down

# Переглянути статус
docker-compose ps

# Логи додатку
docker-compose logs -f app

# Логи бази даних
docker-compose logs -f db

# Зайти в контейнер додатку
docker-compose exec app sh

# Зайти в MySQL
docker-compose exec db mysql -u chatuser -pchatpassword chat_lab

# Перезапустити тільки app
docker-compose restart app

# Видалити всі дані (включаючи volume)
docker-compose down -v

# Переглянути використання ресурсів
docker stats
```

---

## 🐛 Troubleshooting

### Проблема: База даних не стартує

**Рішення:**
```bash
# Перевірити логи
docker-compose logs db

# Видалити volume та перезапустити
docker-compose down -v
docker-compose up -d
```

### Проблема: App не може з'єднатися з БД

**Рішення:**
```bash
# Перевірити чи БД готова
docker-compose exec db mysqladmin ping -h localhost

# Перевірити змінні оточення
docker-compose exec app env | grep DB_

# Перезапустити app після готовності БД
docker-compose restart app
```

### Проблема: Повільна генерація даних

**Рішення:**
* Збільшити RAM для Docker Desktop (мінімум 4GB)
* Закрити інші програми
* Це нормально — 1М записів генерується 5-10 хвилин

---

## 📈 Масштабування

### Горизонтальне масштабування (декілька серверів)

```yaml
# docker-compose.yml
services:
  app:
    build: .
    deploy:
      replicas: 3  # 3 інстанси додатку
    environment:
      SERVER_ID: "server-${HOSTNAME}"
```

### Load Balancer (HAProxy)

```yaml
haproxy:
  image: haproxy:2.8
  ports:
    - "80:80"
  volumes:
    - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
  depends_on:
    - app
```

---

## 🎯 Roadmap

- [x] Базові CRUD операції
- [x] Метрики та логування
- [x] Docker запуск
- [x] 1М тестових даних
- [ ] WebSocket для real-time повідомлень
- [ ] Redis кешування
- [ ] JWT аутентифікація
- [ ] Rate limiting
- [ ] Elasticsearch для пошуку
- [ ] S3 для медіафайлів

---

## 👨‍💻 Автор

**Курильчук Максим**  
Група: ПЗ-2204  
Рік: 2025

---

## 📝 Ліцензія

MIT License — вільне використання для навчальних цілей.
Кайф, тоді давай я **нормально перепишу твій README** – структуровано, чисто, без каші і з урахуванням того, що ти вже використовуєш Docker.
Готовий варіант можна прямо вставляти у `README.md`.

---

# 💬 Chat API — Лабораторна робота №1

REST API для месенджера з реальною базою даних **MySQL** та запуском через **Docker**.

---

## 🛠 Технології

* Backend: Node.js 18 + Express.js
* Database: MySQL 8.0
* Driver: mysql2 (promise)
* Архітектура: REST API
* Контейнери: Docker + Docker Compose

---

## 📌 Можливості

✅ 10 API ендпоінтів
✅ Реальна MySQL база
✅ Логування запитів
✅ Метрики сервера
✅ Chaos-режим
✅ Docker-запуск однією командою



## 🚀 Швидкий запуск через Docker

### 1. Склонуйте репозиторій


git clone <https://github.com/Maaxcon/chat-api.git>
cd chat-lab


---

### 2. Запустіть Docker


docker-compose up -d


Що відбудеться:

* Запуститься MySQL
* Створиться база `chat_lab`
* Імпортується `schema.sql`
* Запуститься Node.js API



### 3. Перевірка що сервер живий


curl http://localhost:3000/health


Очікуваний результат:

`
{
  "status": "healthy"
}


## 🌱 Генерація тестових даних

```bash
docker-compose exec app node seed.js
```

Генерується:

* 10,000 користувачів
* 50,000 розмов
* 1,000,000 повідомлень



## 📡 API Ендпоінти

### 🔧 Системні

| Метод | URL                  | Опис            |
| ----- | -------------------- | --------------- |
| GET   | `/health`            | Перевірка стану |
| GET   | `/api/metrics`       | Метрики         |
| GET   | `/api/chaos/enable`  | Увімкнути хаос  |
| GET   | `/api/chaos/disable` | Вимкнути хаос   |

---

### 💬 Розмови

| Метод | URL                            | Опис             |
| ----- | ------------------------------ | ---------------- |
| GET   | `/api/conversations?user_id=1` | Список розмов    |
| POST  | `/api/conversations/create`    | Створити чат     |
| GET   | `/api/conversations/:id/media` | Файли/зображення |

---

### 📨 Повідомлення

| Метод  | URL                                      | Опис                   |
| ------ | ---------------------------------------- | ---------------------- |
| GET    | `/api/conversations/:id/messages?page=1` | Повідомлення           |
| POST   | `/api/messages/send`                     | Надіслати повідомлення |
| PUT    | `/api/messages/:id/read`                 | Позначити прочитаним   |
| DELETE | `/api/messages/:id`                      | Видалити повідомлення  |
| GET    | `/api/messages/unread?user_id=1`         | Непрочитані            |
| GET    | `/api/messages/search?q=hello&user_id=1` | Пошук                  |

---

### ⌨ Typing

| Метод | URL                             | Опис            |
| ----- | ------------------------------- | --------------- |
| POST  | `/api/conversations/:id/typing` | Користувач пише |

---

## 📊 Метрики

 сервер рахує:

* Total requests
* Requests per second (RPS)
* Average response time
* Error rate
* Active connections

Перегляд:

curl http://localhost:3000/api/metrics


## 🐳 Docker

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

 🗂 Структура проекту


chat-lab/
├── server.js
├── db.js
├── seed.js
├── schema.sql
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md


 🧪 Приклади тестування



1. `curl http://localhost:3000/health` — перевірка, чи сервер працює
2. `curl "http://localhost:3000/api/conversations?user_id=1"` — отримати список розмов користувача
3. `curl "http://localhost:3000/api/conversations/1/messages?page=1"` — отримати повідомлення з розмови
4. `curl -X POST http://localhost:3000/api/messages/send` — відправити повідомлення
5. `curl -X PUT http://localhost:3000/api/messages/5/read` — позначити повідомлення як прочитане
6. `curl "http://localhost:3000/api/messages/unread?user_id=1"` — кількість непрочитаних повідомлень
7. `curl "http://localhost:3000/api/messages/search?q=hello&user_id=1"` — пошук повідомлень
8. `curl -X DELETE http://localhost:3000/api/messages/10` — м’яке видалення повідомлення
9. `curl "http://localhost:3000/api/conversations/1/media"` — отримати всі медіафайли з розмови
10. `curl -X POST http://localhost:3000/api/conversations/1/typing` — імітація "користувач друкує"
11. `curl http://localhost:3000/api/metrics` — отримати метрики сервера
12. `curl http://localhost:3000/api/chaos/enable` — увімкнути режим хаосу
13. `curl http://localhost:3000/api/chaos/disable` — вимкнути режим хаосу
14. `docker-compose ps` — переглянути статус контейнерів
15. `docker-compose logs -f app` — логи додатку
16. `docker-compose exec app node seed.js` — генерація тестових даних
17. `docker-compose exec app sh` — зайти в контейнер додатку
18. `docker-compose logs -f db` — логи бази даних
19. `docker stats` — перегляд використання ресурсів Docker
20. `docker-compose down` — зупинка всіх контейнерів



 👨‍💻 Автор

Курильчук Максим
Група: ПЗ-2204
Рік: 2025







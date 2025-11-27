FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package файли
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production

# Копіюємо всі файли проекту
COPY . .

# Відкриваємо порт
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаємо додаток
CMD ["node", "server.js"]
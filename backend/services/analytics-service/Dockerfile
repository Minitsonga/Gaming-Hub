# Build context: repo root (docker compose: context: ., dockerfile: backend/services/analytics-service/Dockerfile)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN npm ci

RUN npm run build --workspace=backend/services/analytics-service

WORKDIR /app/backend/services/analytics-service

EXPOSE 4004

CMD ["node", "dist/server.js"]

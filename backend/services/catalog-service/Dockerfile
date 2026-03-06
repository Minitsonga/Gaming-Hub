# Build context: repo root (docker compose: context: ., dockerfile: backend/services/catalog-service/Dockerfile)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN npm ci

RUN npm run build --workspace=backend/services/catalog-service

WORKDIR /app/backend/services/catalog-service

EXPOSE 4002

CMD ["node", "dist/server.js"]

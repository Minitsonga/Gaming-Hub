# Build context: repo root (docker compose: context: ., dockerfile: backend/services/roguelike-service/Dockerfile)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN npm ci

RUN npm run build --workspace=backend/services/roguelike-service

WORKDIR /app/backend/services/roguelike-service

EXPOSE 4003

CMD ["node", "dist/server.js"]

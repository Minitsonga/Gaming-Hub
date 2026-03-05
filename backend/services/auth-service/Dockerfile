# Build context: repo root (docker compose: context: ., dockerfile: backend/services/auth-service/Dockerfile)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN npm ci

RUN npm run build --workspace=backend/services/auth-service

WORKDIR /app/backend/services/auth-service

EXPOSE 4001

CMD ["node", "dist/server.js"]

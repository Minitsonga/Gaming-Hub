# Build context: repo root (docker compose: context: ., dockerfile: backend/gateway/Dockerfile)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend

RUN npm ci

RUN npm run build --workspace=backend/gateway

WORKDIR /app/backend/gateway

EXPOSE 4000

CMD ["node", "dist/server.js"]

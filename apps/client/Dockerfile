FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY next.config.js ./
COPY tsconfig*.json ./
RUN npm ci

COPY public ./public
COPY src ./src
COPY .env.production ./.env.production
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
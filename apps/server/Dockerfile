FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source
COPY . .

# Build
RUN pnpm run build

FROM node:20-alpine as production

WORKDIR /app

# Copy package files and lockfile
COPY package*.json pnpm-lock.yaml ./

# Install production dependencies
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy built application and Prisma schema
COPY --from=builder /app/dist/ ./dist/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN pnpm prisma generate

EXPOSE 3001
CMD ["node", "dist/main"]

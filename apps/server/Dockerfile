FROM node:20-alpine as builder

WORKDIR /app

# Set up pnpm
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies including @nestjs/cli
RUN pnpm install
RUN pnpm add -D @nestjs/cli

# Copy source
COPY . .

# Generate Prisma client and build
RUN pnpm prisma generate
RUN pnpm run build

FROM node:20-alpine as production

WORKDIR /app

# Set up pnpm
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

# Install pnpm
RUN npm install -g pnpm

# Copy package files and lockfile
COPY package*.json pnpm-lock.yaml ./

# Install production dependencies
RUN pnpm install --prod

# Copy built application and Prisma schema
COPY --from=builder /app/dist/ ./dist/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN pnpm prisma generate

EXPOSE 3001
CMD ["node", "dist/main"]

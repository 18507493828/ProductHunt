# ---- Stage 1: Build frontend ----
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: Install server deps ----
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev

# ---- Stage 3: Runtime ----
FROM node:18-alpine AS runtime
WORKDIR /app

# Copy server code and node_modules
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Copy built frontend
COPY --from=client-build /app/client/dist ./client/dist

# Ensure uploads dir exists (legacy compat)
RUN mkdir -p ./server/storage/uploads

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]

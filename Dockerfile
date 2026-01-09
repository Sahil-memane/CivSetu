# ===============================
# Stage 1: Build Frontend (React + Vite)
# ===============================
FROM node:20-alpine as frontend_builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Build args
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ===============================
# Stage 2: Setup Backend (Node.js)
# ===============================
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./

# Copy built frontend from Stage 1 to 'public' directory in backend
COPY --from=frontend_builder /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Cloud Run sets PORT env var)
EXPOSE 8080

# Start server
CMD ["node", "server.js"]

# --- Stage 1: Build the application ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy all source files
COPY . .

# Run the build script (vite build and esbuild compilation)
RUN npm run build

# --- Stage 2: Runtime image ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Copy package manifests
COPY package*.json ./

# Install only production dependencies to keep the image slim
RUN npm ci --omit=dev

# Copy the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 8080

# Run the application
CMD ["node", "dist/server.cjs"]

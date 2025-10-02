# Railway Dockerfile for NestJS Backend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Start the application
CMD ["npm", "run", "start:prod"]

# Stage 1: Build
FROM node:25-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY /package*.json ./
RUN npm install

# Copy source code
COPY /src ./src
COPY /tsconfig.json ./

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Run
FROM node:25-alpine

WORKDIR /app

# Copy only the built output and node_modules from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Expose your app port (adjust if needed)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using --legacy-peer-deps to handle potential CKEditor dependency conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
# Vite will use the .env file automatically
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
# We copy it to /etc/nginx/conf.d/default.conf to override the default config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

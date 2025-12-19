# Use Node.js 20 on Alpine Linux for a lightweight image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using npm install instead of ci because package-lock.json might be out of sync
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5002

# Environment variables
# These should ideally be provided at runtime via docker-compose or env file
# ENV PORT=5002
# ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]

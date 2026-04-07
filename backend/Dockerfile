# Use Node.js 20 slim to keep the image size manageable
FROM node:20-slim

# Install Java JDK 17 (Headless is enough for a compiler)
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the internal port the Express app listens on
EXPOSE 3000

# Run in development mode (or use 'npm start' for production)
CMD ["npm", "run", "dev"]
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
# 4. FIX: Copy package files from the 'backend' folder
# Since Context is '.', we must prefix with 'backend/'
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the backend source code
# 6. FIX: Copy the backend source code
COPY backend/ .

# Expose the internal port the Express app listens on
EXPOSE 3000

# Run in development mode (or use 'npm start' for production)
# CMD ["npm", "run", "dev"]
# 8. PRODUCTION CMD: Use 'npm start' or 'node' for Render
# 'npm run dev' is for your laptop; 'npm start' is for the cloud
                        # CMD ["npm", "start"]
CMD ["npx", "tsx", "src/index.ts"]
# ⚠️ Why you must change npm run dev to npm start
# On Render, you are in a Production environment.

# npm run dev usually triggers tsx or nodemon, which watch for file changes. This uses extra memory and can make your container crash on Render's free tier.

# npm start usually triggers node dist/index.js or a direct execution, which is faster and more stable for a live website.]



# With this:
                        # CMD ["npx", "tsx", "src/index.ts"]
# Why this happened?
# Local vs. Cloud: Locally, you were likely running npm run dev (which uses tsx).

# Missing Build Step: In your package.json, the start script is likely set to node dist/index.js. However, you didn't include a RUN npm run build step in your Dockerfile to convert your .ts files into .js files.

# The Solution: Using npx tsx tells the container to run the TypeScript file directly, exactly like your laptop does.
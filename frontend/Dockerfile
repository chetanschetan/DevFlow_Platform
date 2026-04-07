FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite default port
EXPOSE 5174

# '--host' is mandatory to allow Docker to map the port correctly
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
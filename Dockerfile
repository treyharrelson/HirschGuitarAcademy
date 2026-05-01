FROM node:20

WORKDIR /app

# Copy package files from the root
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything from the root into the container
COPY . .

EXPOSE 3000

# FIX THE PATH: Since we are in the root, we point to the server folder
CMD ["node", "server/server.js"]

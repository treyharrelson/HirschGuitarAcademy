# 1. Use the standard node image for better stability
FROM node:20

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files (already relative to /server)
COPY package*.json ./

# 4. Use 'npm ci' for faster, reliable production installs
RUN npm ci

# 5. Copy the rest of the /server folder into /app
COPY . .

# 6. Expose the port
EXPOSE 3000

# 7. PATH FIX: Since we are already in /app (which is the /server folder)
# we run server.js directly.
CMD ["node", "server.js"]

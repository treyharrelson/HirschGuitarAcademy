FROM node:20

WORKDIR /app

# 1. Copy root package files
COPY package*.json ./

# 2. Copy server package files specifically
COPY server/package*.json ./server/

# 3. Install dependencies 
# We use --include=dev to ensure sequelize-cli is available for the migration
RUN npm install --include=dev

# 4. Copy the server code
COPY server/ ./server/

# 5. Copy the config and migrations (already inside server/ but ensuring visibility)
# No need to copy client/ because of your .dockerignore

EXPOSE 3000

# 6. Start Command: Migration + Server
# We use 'node server/server.js' directly to avoid any npm script issues
CMD npx sequelize-cli db:migrate --config server/config/config.js --migrations-path server/db/migrations && node server/server.js
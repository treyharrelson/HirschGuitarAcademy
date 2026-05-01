FROM node:20

WORKDIR /app

# 1. Copy root files
COPY package*.json ./

# 2. Install all dependencies (now includes connect-pg-simple)
RUN npm install

# 3. Copy the rest of the app
COPY . .

EXPOSE 3000

# 4. Run migration then server
CMD npx sequelize-cli db:migrate --config server/config/config.js --migrations-path server/db/migrations && node server/server.js
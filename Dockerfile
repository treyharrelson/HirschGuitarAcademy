FROM node:20

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

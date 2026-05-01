FROM node:20

WORKDIR /app

# 1. Copy package files from root
COPY package*.json ./

# 2. Force npm to skip build-time scripts (avoids the Secret error)
RUN npm install --ignore-scripts

# 3. Copy everything else
COPY . .

EXPOSE 3000

# 4. Entry point
CMD ["npm", "start"]

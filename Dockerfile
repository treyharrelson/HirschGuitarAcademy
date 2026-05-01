FROM node:20

WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Use the new flag npm suggested + ignore all scripts 
# This prevents the R2 secret check entirely during build
RUN npm install --omit=dev --ignore-scripts

# 3. Copy the rest of the project
COPY . .

EXPOSE 3000

# 4. Entry point
CMD ["npm", "start"]

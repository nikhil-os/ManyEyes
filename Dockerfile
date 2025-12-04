FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps || npm install
COPY src ./src
COPY .env.example ./
EXPOSE 4000
CMD ["npm", "run", "start"]

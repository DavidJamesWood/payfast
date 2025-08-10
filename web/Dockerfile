FROM node:20-slim
WORKDIR /web
COPY package*.json ./
RUN npm ci || npm i
COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host"]
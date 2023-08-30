FROM node:18-slim

WORKDIR /starter
ENV NODE_ENV development

COPY package.json /starter/package.json

RUN npm install pm2 -g

COPY .env.example /starter/.env.example
COPY . /starter

RUN npm install --production --ignore-scripts

CMD ["pm2-runtime","app.js"]

EXPOSE 8080

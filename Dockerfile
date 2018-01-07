FROM node:8.9-slim

COPY . /starter
COPY package.json /starter/package.json
COPY .env.example /starter/.env.example

WORKDIR /starter

ENV NODE_ENV production
RUN npm install --production

CMD ["npm","start"]

EXPOSE 8080

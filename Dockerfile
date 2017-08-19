FROM node:6-slim

COPY . /starter
COPY package.json /starter/package.json
COPY .env.example /starter/.env.example

WORKDIR /starter

ENV NODE_ENV production
RUN yarn install --production

CMD ["npm","start"]

EXPOSE 8888

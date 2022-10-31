FROM node:16.18.0-alpine

ENV NODE_ENV production
EXPOSE 8080

WORKDIR /starter
COPY . /starter/

RUN npm install pm2 -g
RUN npm install --production

CMD ["pm2-runtime","app.js"]


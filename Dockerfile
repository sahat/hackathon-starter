FROM node:18-slim

WORKDIR /starter
ENV NODE_ENV development
COPY . /starter

RUN npm install pm2 -g
RUN npm install 
RUN npm run scss

EXPOSE 8080

CMD ["pm2-runtime","app.js"]
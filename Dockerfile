<<<<<<< HEAD
FROM node:12-slim

WORKDIR /starter
ENV NODE_ENV development
=======
FROM node:6.6.0
>>>>>>> parent of 5c19b87 (Optimize Dockerfile for production env)

COPY package.json /starter/package.json

RUN npm install --production

<<<<<<< HEAD
COPY .env.example /starter/.env.example
COPY . /starter

CMD ["npm","start"]

EXPOSE 8080
=======
RUN npm install 

CMD ["npm","start"]

EXPOSE 8888
>>>>>>> parent of 5c19b87 (Optimize Dockerfile for production env)

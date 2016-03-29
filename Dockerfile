FROM node:5.9.1-wheezy
# replace this with your application's default port

WORKDIR /app
ADD package.json /app/
RUN npm install
ADD . /app
EXPOSE 5000
CMD [ "npm", "start" ]
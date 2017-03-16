FROM node

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
// if you are behind a coporate firewall
//RUN npm config set proxy http://company-proxy:port/
//RUN npm config set https-proxy http://company:proxy:port/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 8080

CMD [ "npm", "start" ]

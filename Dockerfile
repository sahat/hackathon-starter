# Pull base image.
FROM ubuntu:latest

ENV NODE_ENV=development

# Define working directory.
WORKDIR /app

# Install base packages
RUN apt-get update
#RUN apt-get upgrade -y

RUN apt-get install nodejs nodejs-legacy npm git mercurial curl wget -y
RUN cd /app && ls -alF && npm i -g n && n 0.12.7

ADD . /app

# Install nodebb
# RUN cd /app && pwd && rm -rf node_modules && npm --verbose install
RUN cd /app; npm --verbose install --force
RUN ls -alF

# Expose ports
EXPOSE 3000

# Define default command.
CMD npm start
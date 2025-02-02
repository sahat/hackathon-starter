FROM node:20-slim

WORKDIR /starter
ENV NODE_ENV development

COPY .env.example /starter/.env.example
COPY . /starter

RUN npm install pm2 -g
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm install --omit=dev; \
    else \
    npm install; \
    fi

CMD ["pm2-runtime","app.js"]

EXPOSE 8080

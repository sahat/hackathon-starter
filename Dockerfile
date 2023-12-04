FROM node:20-slim

WORKDIR /app
ENV NODE_ENV development

COPY .env.example /app/.env.example
COPY . /app

RUN npm install pm2 -g
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm install --omit=dev; \
    else \
    npm install; \
    fi

CMD ["pm2-runtime","app.js"]

EXPOSE 8080


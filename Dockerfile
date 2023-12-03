FROM node:20-slim

WORKDIR /starter
ENV NODE_ENV development

COPY .env.example /app/.env.example
COPY . /app

RUN npm install pm2 -g
RUN npm install pnpm -g
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm install --omit=dev; \
    else \
    npm install; \
    fi

CMD ["pm2-runtime","app.js"]

EXPOSE 8080
EXPOSE 3000

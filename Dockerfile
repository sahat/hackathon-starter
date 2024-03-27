FROM node:20-slim


WORKDIR /app
ENV NODE_ENV development

COPY .env.example /app/.env.example
COPY .env /app/.env
COPY . /app

RUN apt update && apt install python3 -y
RUN npm install pm2 -g
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm install --omit=dev; \
    else \
    npm install; \
    fi

CMD ["pm2-runtime","app.js"]

EXPOSE 8080
EXPOSE 4822
EXPOSE 8081 

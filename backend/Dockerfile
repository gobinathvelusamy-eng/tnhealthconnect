FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npx tsc

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]

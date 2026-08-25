FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL="file:/app/prisma/dev.db"

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npx prisma db push --accept-data-loss
RUN npx tsc

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]

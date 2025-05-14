FROM node:18-alpine

RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  nodejs \
  yarn

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY . .

RUN yarn install

CMD ["yarn", "start"]

ARG PLATFORM="linux/amd64"

FROM --platform=$PLATFORM node:18-alpine

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]

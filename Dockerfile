FROM --platform=${TARGETPLATFORM} node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i

COPY . ./
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]

FROM --platform=${TARGETPLATFORM} node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i --ignore-scripts

COPY . ./
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]

FROM --platform=${BUILDPLATFORM} node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i --ignore-scripts

COPY . ./
RUN npm run build

FROM node:22-alpine AS final
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i --production --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist

ENTRYPOINT [ "npm", "run", "start" ]

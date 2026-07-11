FROM node:20-alpine as frontend-builder

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

COPY ./client /app

WORKDIR /app

RUN npm install --legacy-peer-deps

RUN npm run build

FROM node:20-alpine

COPY ./server /app

WORKDIR /app

RUN npm install

COPY --from=frontend-builder /app/dist /app/public

CMD ["node","src/server.js"]
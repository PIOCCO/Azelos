FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget
RUN addgroup -S app && adduser -S app -G app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js init.sql ./
USER app
ENV PORT=8000
EXPOSE 8000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8000/health || exit 1
CMD ["sh", "-c", "node server.js"]

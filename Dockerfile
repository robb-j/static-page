# Use a node alpine image install packages and run the start script
FROM node:16-alpine

COPY --chown=node ["package*.json", "/app/"]
USER node
WORKDIR /app

ENV NODE_ENV production
RUN npm ci && npm cache clean --force
COPY ["src", "src"]
ENTRYPOINT ["node", "src/server.js"]

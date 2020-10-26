# Use a node alpine image install packages and run the start script
FROM node:12-alpine
WORKDIR /app
EXPOSE 3000
COPY ["package*.json", "/app/"]
ENV NODE_ENV production
RUN npm ci
COPY ["src", "src"]
CMD ["node", "src/server.js"]

# Use a node alpine image install packages and run the start script
FROM node:10-alpine
WORKDIR /app
EXPOSE 3000
COPY ["package*.json", "/app/"]
ENV NODE_ENV production
RUN npm ci &> /dev/null
COPY ["src", "/app/src"]
CMD ["npm", "start", "-s"]

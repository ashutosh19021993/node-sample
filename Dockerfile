FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY app.js ./
EXPOSE 3000
CMD ["node", "app.js"]

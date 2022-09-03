FROM node:alpine
WORKDIR /usr/src/app
COPY package.json .
RUN npm install --legacy-peer-deps
RUN npm install --omit=dev
COPY . .
CMD ["npm", "start"]
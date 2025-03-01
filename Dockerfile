FROM node:18 as development

EXPOSE 8080

ENV NODE_ENV development

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install --legacy-peer-deps

# Bundle app source
COPY . .

RUN npm run build

CMD ["npm", "run", "start:dev"]

FROM node:18 as production

EXPOSE 8080

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps --only=production

COPY --from=development /usr/src/app/dist/ ./dist
COPY --from=development /usr/src/app/env/ ./env
COPY --from=development /usr/src/app/firebase.config.json .

CMD ["npm", "run", "start:prod"]
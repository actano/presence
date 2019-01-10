FROM node:8
WORKDIR /usr/share/local
COPY package.json yarn.lock ./
RUN yarn install
COPY lib lib
COPY webpack.config.js ./
RUN yarn webpack --bail

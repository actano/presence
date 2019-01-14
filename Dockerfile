FROM node:10
WORKDIR /usr/share/local
COPY package.json yarn.lock ./
RUN yarn install
COPY calendars calendars
COPY lib lib
COPY webpack.config.js index.js ./
RUN yarn webpack --bail
EXPOSE 80
ENTRYPOINT ["yarn", "--silent"]
CMD ["start"]

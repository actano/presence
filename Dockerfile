FROM node:10-alpine AS install

WORKDIR /usr/share/local

COPY yarn.lock yarn.lock
COPY package.json package.json
RUN yarn install --frozen-lockfile

FROM node:10-alpine AS build

ENV NODE_ENV production
COPY --from=install /usr/share/local/node_modules /usr/share/local/node_modules
COPY --from=install /usr/share/local/package.json /usr/share/local
COPY --from=install /usr/share/local/yarn.lock /usr/share/local

WORKDIR /usr/share/local

COPY calendars calendars
COPY lib lib
COPY webpack.config.js index.js ./
RUN yarn webpack --bail

EXPOSE 80
ENTRYPOINT ["yarn", "--silent"]
CMD ["start"]

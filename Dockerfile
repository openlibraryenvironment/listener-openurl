FROM node:18

ENV CONFIG_FILE=config/openurl.json

WORKDIR /usr/src/app
COPY . .

EXPOSE 3012

CMD node src/listener-openurl.js $CONFIG_FILE

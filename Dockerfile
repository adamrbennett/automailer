FROM node:8-slim

RUN apt-get update && \
    apt-get install -y \
      build-essential \
      git \
      libgit2-dev && \
      rm -rf /var/lib/apt/lists/*

ENV GITHUB_TOKEN ""

# VOLUME ["/store"]

ARG APP_DIR="/app"
    
RUN mkdir -p ${APP_DIR} && chown -R node:node ${APP_DIR}

USER node

WORKDIR ${APP_DIR}

COPY package.json ${APP_DIR}

RUN yarn install

COPY . ${APP_DIR}

ENTRYPOINT ["node", "automailer.js"]
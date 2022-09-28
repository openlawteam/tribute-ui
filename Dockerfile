
# Node version matching the version declared in the package.json 
FROM node:16.14.0-alpine as build
RUN apk add git openssh-client
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN npm install -g npm@8.3.1

# Created the app work dir
WORKDIR /app

# Add node to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copy app configs
COPY . ./

# Install app dependencies
RUN npm ci

# Compile app
RUN npm run compile

# Start the aplication
CMD ["npm", "start"]
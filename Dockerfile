
# Node version matching the version declared in the package.json 
FROM node:14.17.6-alpine as build
RUN apk add git openssh-client
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN npm install -g npm@7.24.0

# Created the app work dir
WORKDIR /app

# Add node to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copy app configs
COPY . ./

# Install app dependencies
RUN npm ci

# Build app
RUN npm run build

# Start the aplication
CMD ["npm", "start"]
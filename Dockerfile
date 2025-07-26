# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client
RUN npm install -g nodemon


# Install app dependencies
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy app source
COPY . .

# Environment variables will be set in Portainer
EXPOSE 5000

# Start the app
CMD ["npx", "nodemon", "server.js"]

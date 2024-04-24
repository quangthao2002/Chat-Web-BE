# Use the official Node.js image as a base image
FROM node:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --production=false

# Copy the rest of the application code
COPY . .

# Expose the port on which your app will run
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start:prod"]

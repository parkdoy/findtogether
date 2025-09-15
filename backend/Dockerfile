# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Create the production image
FROM node:20-slim AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the compiled code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port the app runs on
EXPOSE 3001

# The command to run the application
CMD [ "node", "dist/server.js" ]

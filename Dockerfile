FROM node:22-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install ALL dependencies including dev dependencies
# RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# Copy all files
COPY . .
COPY .env.production .env

# Build
ENV NODE_ENV=production
RUN npm run build

# Copy standalone server files to root


# Install pocketbase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.28.1/pocketbase_0.28.1_linux_amd64.zip \
    && unzip pocketbase_0.28.1_linux_amd64.zip \
    && rm pocketbase_0.28.1_linux_amd64.zip \
    && chmod +x pocketbase \
    && mv pocketbase pb/pocketbase

# Expose ports
EXPOSE 3000 8090

# Start services
CMD ["sh", "-c", "cd /app/pb && ./pocketbase serve --http 0.0.0.0:8090 & cd /app  && npm start"]

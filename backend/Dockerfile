# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    yt-dlp \
    curl \
    wget \
    unzip \
    ca-certificates \
    chromium \
    chromium-driver \
    ffmpeg \
    python3-pip

# Update yt-dlp to latest version
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy YouTube cookies into the container
COPY youtube-cookies.txt /app/youtube-cookies.txt

# Copy the rest of the application
COPY . .

# Expose port (update if different)
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]

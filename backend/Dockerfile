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
    curl \
    wget \
    unzip \
    ca-certificates \
    chromium \
    chromium-driver \
    chromium-sandbox \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*  # Reduce image size

# Manually install latest yt-dlp (preferred over apt version)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp  # Ensure yt-dlp is globally available

# Verify yt-dlp installation
RUN yt-dlp --version

# Create non-root user for security
RUN useradd -m appuser
USER appuser

# Copy the rest of the application
COPY --chown=appuser:appuser . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]

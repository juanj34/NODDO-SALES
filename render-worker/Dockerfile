# Generic HTML->PDF render worker (headless Chromium). Deploys to Railway.
# Zero npm dependencies (Node built-ins only); the image just needs a Chromium
# binary + the NODDO brand fonts. Build context = this render-worker/ dir.
FROM node:20-slim

# Chromium + base font packages + CA certs. fontconfig lets the freshly-installed
# brand fonts be discovered by Chromium at render time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install the 4 NODDO brand fonts so the worker can render them even if the
# incoming HTML does not embed them (the app embeds them as base64; this is a
# safety net). Cormorant Garamond / Syne / Inter / DM Mono.
COPY fonts/ /usr/share/fonts/truetype/noddo/
RUN fc-cache -f

# The worker reads CHROME_PATH; point it at the Debian chromium binary.
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app
COPY package.json ./package.json
COPY server.mjs ./server.mjs

# Railway injects PORT; the worker falls back to 4042 locally.
EXPOSE 4042
CMD ["node", "server.mjs"]

# NahaLabs WhatsApp Operator — production image
# Runs the stateful Baileys socket server on Render / Docker / Fly.io.

FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Ensure TLS/CA certs are present for WhatsApp + Neon connections.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

EXPOSE 10000

CMD ["node", "src/server.js"]

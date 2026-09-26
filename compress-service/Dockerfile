# Small HTTP service that compresses PDFs with real Ghostscript.
# Deployed to Google Cloud Run — pay only when it runs, generous free tier.
FROM node:20-slim

# Ghostscript is a normal apt package on Debian — this is the whole point
# of using a container instead of fighting Vercel's function runtime.
RUN apt-get update && apt-get install -y ghostscript && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY server.js .

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
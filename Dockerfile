# =========================
# Base image
# =========================
# Use a lightweight Node.js Alpine image
FROM node:24-alpine3.21 AS base
WORKDIR /starter

# =========================
# STAGE 1: Install production dependencies
# =========================
FROM base AS deps
WORKDIR /starter

# Copy public folder first (needed for some dependencies like CSS/SCSS)
COPY public ./public

# Copy package files for npm install
COPY package*.json ./

# Install only production dependencies
# --omit=dev: exclude devDependencies
# --ignore-scripts: skip postinstall/prepare scripts that might depend on dev tools (e.g., Husky, SCSS)
RUN npm ci --omit=dev --ignore-scripts

# =========================
# STAGE 2: Production runtime
# =========================
FROM base AS runner
WORKDIR /starter

# Copy node_modules from deps stage
COPY --from=deps /starter/node_modules ./node_modules

# Copy all application files (source code, configs, public folder)
COPY . .

# Expose application port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]


# =============================================
# Stage 1: Builder Stage
# =============================================
ARG NODE_VERSION=24 # default if not set by build args
FROM node:${NODE_VERSION}-alpine AS builder

# Show build info
RUN echo "======================================" && \
    echo "Builder Stage - Node.js v${NODE_VERSION}" && \
    echo "Node: $(node --version) | NPM: $(npm --version)" && \
    echo "======================================"

WORKDIR /app

COPY package*.json ./

RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# =============================================
# Stage 2: Production Stage (Nginx)
# =============================================
FROM nginxinc/nginx-unprivileged:alpine AS production

USER root

# Install tzdata and set proper permissions
RUN apk add --no-cache tzdata && \
    mkdir -p /tmp/nginx /var/cache/nginx /var/log/nginx && \
    chown -R nginx:nginx /tmp/nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html && \
    ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log


# Copy built static files
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 8080

ENV TZ=UTC

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]

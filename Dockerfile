# syntax=docker/dockerfile:1

# ---- Build stage --------------------------------------------------------
# Compiles the Angular app. Node/npm and node_modules never reach the final
# image, so this stage's size doesn't matter.
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached until package*.json change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ---- Runtime stage --------------------------------------------------------
# Only the compiled static assets + a minimal nginx server ship in the final image.
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/firehawk-automobile/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Add build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_CLIENT_ID
ARG VITE_TENANT_ID
ARG VITE_API_IDENTIFIER_URI

# Set them as environment variables for the build process
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_TENANT_ID=$VITE_TENANT_ID
ENV VITE_API_IDENTIFIER_URI=$VITE_API_IDENTIFIER_URI

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

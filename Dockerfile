FROM node:25-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g @nestjs/cli
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm ci --only=production

FROM node:25-alpine AS production
RUN adduser -D nonroot
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
USER nonroot

CMD ["node", "dist/main"]

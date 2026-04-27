FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

FROM base AS deps
RUN npm ci

FROM base AS prod-deps
RUN npm ci --omit=dev && npm cache clean --force

FROM deps AS build
COPY . .
RUN npm run build

FROM deps AS development
ENV NODE_ENV=development
COPY . .
CMD ["npm", "run", "start:dev"]

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
USER node
CMD ["node", "dist/main"]

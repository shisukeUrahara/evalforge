FROM node:24-slim
RUN corepack enable
WORKDIR /app
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .
RUN pnpm build && chown -R node:node /app/.next
# Datasets, labels, caches, runs and gate files are mounted under /data from the checkout.
RUN mkdir -p /data && chown -R node:node /data
ENV EF_DATA_DIR=/data NODE_ENV=production
USER node
EXPOSE 3020
CMD ["pnpm", "start"]

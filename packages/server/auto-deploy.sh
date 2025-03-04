#!/bin/bash

# Exit on error
set -e

# Pull latest changes
git checkout development
git pull

# Install and setup
pnpm install
pnpx prisma generate
pnpx migrate-mongo up

# PM2 process management with error handling
pm2 reload backend

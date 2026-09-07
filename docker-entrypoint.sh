#!/bin/sh
set -e

echo "Application des migrations de base de données..."
node_modules/.bin/prisma migrate deploy

exec "$@"

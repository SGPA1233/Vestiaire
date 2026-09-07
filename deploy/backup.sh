#!/bin/sh
# Sauvegarde quotidienne de la base de données PostgreSQL.
# À planifier via cron sur le serveur hôte, par exemple :
#   0 3 * * * cd /opt/dotation-app && ./deploy/backup.sh >> /var/log/dotation-backup.log 2>&1
#
# Conserve les sauvegardes 30 jours puis les supprime automatiquement.

set -e
cd "$(dirname "$0")/.."

RETENTION_DAYS=30
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
FILENAME="$BACKUP_DIR/dotation_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump -U "${POSTGRES_USER:-dotation}" "${POSTGRES_DB:-dotation}" | gzip > "$FILENAME"

echo "Sauvegarde créée : $FILENAME"

find "$BACKUP_DIR" -name "dotation_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

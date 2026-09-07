#!/bin/sh
# Restauration d'une sauvegarde PostgreSQL.
# Usage : ./deploy/restore.sh ./backups/dotation_2026-09-07_030000.sql.gz
#
# ATTENTION : ceci remplace entièrement les données actuelles de la base.

set -e
cd "$(dirname "$0")/.."

FILE="$1"
if [ -z "$FILE" ]; then
  echo "Usage : $0 <fichier_de_sauvegarde.sql.gz>"
  exit 1
fi
if [ ! -f "$FILE" ]; then
  echo "Fichier introuvable : $FILE"
  exit 1
fi

echo "Cette opération va REMPLACER toutes les données actuelles."
printf "Continuer ? (oui/non) "
read -r CONFIRM
if [ "$CONFIRM" != "oui" ]; then
  echo "Annulé."
  exit 0
fi

gunzip -c "$FILE" | docker compose exec -T db psql -U "${POSTGRES_USER:-dotation}" "${POSTGRES_DB:-dotation}"

echo "Restauration terminée."

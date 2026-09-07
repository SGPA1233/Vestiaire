# Dotation Vêtements

Application interne de gestion de la dotation de vêtements professionnels.
Remplace l'ancien système Google Sheets / Google Forms — aucune dépendance à
Google ou à un compte Gmail personnel.

**Stack** : Next.js (React, App Router) · PostgreSQL · Prisma · NextAuth
(email + mot de passe) · Docker.

## Sommaire

1. [Installation locale (développement)](#1-installation-locale-développement)
2. [Déploiement avec Docker](#2-déploiement-avec-docker)
3. [Création du premier compte administrateur](#3-création-du-premier-compte-administrateur)
4. [Sauvegardes](#4-sauvegardes)
5. [Restauration](#5-restauration)
6. [Mise à jour de l'application](#6-mise-à-jour-de-lapplication)
7. [Import des anciennes données](#7-import-des-anciennes-données)
8. [Guide utilisateur rapide](#8-guide-utilisateur-rapide)
9. [Architecture](#9-architecture)

---

## 1. Installation locale (développement)

Prérequis : Node.js 20+, une base PostgreSQL (locale ou via Docker).

```bash
npm install
cp .env.example .env
# renseigner DATABASE_URL, AUTH_SECRET, etc. dans .env
npx prisma migrate dev
npm run db:seed        # optionnel : données de démonstration
npm run dev
```

L'application est disponible sur http://localhost:3000.

## 2. Déploiement avec Docker

Prérequis sur le serveur : Docker et Docker Compose.

```bash
cp .env.example .env
# renseigner POSTGRES_PASSWORD, AUTH_SECRET, NEXTAUTH_URL, etc.

docker compose up -d --build
docker compose exec app npx prisma migrate deploy   # déjà fait automatiquement au démarrage
```

L'application écoute en local sur `127.0.0.1:3000`. Mettez un reverse proxy
Nginx devant (exemple fourni dans [`deploy/nginx.conf.example`](deploy/nginx.conf.example))
pour servir l'application en HTTPS sur votre nom de domaine
(`dotation.entreprise.ch` ou `vetements.entreprise.ch`), avec un certificat
via `certbot` par exemple.

## 3. Création du premier compte administrateur

Une fois les conteneurs démarrés :

```bash
docker compose exec app node_modules/.bin/tsx scripts/create-admin.ts \
  --email admin@entreprise.ch \
  --password "UnMotDePasseSolide!" \
  --name "Prénom Nom"
```

En local (sans Docker) :

```bash
npm run create-admin -- --email admin@entreprise.ch --password "UnMotDePasseSolide!" --name "Prénom Nom"
```

Ce script peut être relancé pour créer d'autres comptes administrateurs ou
réinitialiser un mot de passe (il met à jour le compte si l'email existe déjà).
Les comptes supplémentaires peuvent ensuite être créés directement dans
l'application, dans **Paramètres → Utilisateurs**.

## 4. Sauvegardes

Une sauvegarde quotidienne automatique est recommandée via `cron` sur le
serveur hôte :

```cron
0 3 * * * cd /opt/dotation-app && ./deploy/backup.sh >> /var/log/dotation-backup.log 2>&1
```

Le script [`deploy/backup.sh`](deploy/backup.sh) exporte la base PostgreSQL
(`pg_dump`, compressé) dans `./backups/` et conserve automatiquement les 30
derniers jours.

Un export manuel complet est aussi disponible dans l'application :
**Historique → Exporter en CSV** (avec filtres), utilisable comme sauvegarde
ponctuelle lisible dans Excel.

## 5. Restauration

```bash
./deploy/restore.sh ./backups/dotation_2026-09-07_030000.sql.gz
```

⚠️ Cette opération remplace entièrement les données actuelles. Une
confirmation est demandée avant d'exécuter la restauration.

## 6. Mise à jour de l'application

```bash
git pull
docker compose up -d --build
```

Les migrations de base de données sont appliquées automatiquement au
démarrage du conteneur (`prisma migrate deploy`, via
[`docker-entrypoint.sh`](docker-entrypoint.sh)). Faites une sauvegarde avant
toute mise à jour importante (voir section 4).

## 7. Import des anciennes données

Dans **Paramètres**, deux assistants distincts, avec aperçu systématique
avant toute validation :

- **Import initial** — collaborateurs, leurs tailles habituelles, et le
  stock initial de la nouvelle commande (« Dotation opérationnelle 2026 »).
  Formats CSV attendus détaillés directement sur la page.
- **Migration ancien système** — reprise des **chaussures et bottes de
  sécurité récentes**, encore en possession des collaborateurs. Ce sont les
  seuls équipements de l'ancien système repris automatiquement comme
  « actuellement en possession » ; chaque ligne doit être vérifiée et
  confirmée individuellement (bouton Confirmer/Corriger/Ignorer) avant
  d'être appliquée — rien n'est importé silencieusement.

Le reste de l'historique ancien (V1/V2, vestes, pantalons...) n'est **pas**
importé automatiquement : il peut être conservé de côté comme simple archive
(par exemple en créant une campagne « Anciennes dotations » dédiée) sans
influencer le stock ni les fiches actuelles.

## 8. Guide utilisateur rapide

**Faire une perception (< 30 secondes)**

1. Cliquer sur **Nouvelle perception** (page d'accueil ou menu).
2. Rechercher le collaborateur par prénom ou nom.
3. Pour chaque article à donner : ajuster la taille si besoin (déjà
   pré-remplie avec la taille habituelle) et la quantité avec les boutons
   `− / +`.
4. Si le collaborateur rend un ancien équipement, le cocher dans
   **Articles récupérés**.
5. Cliquer sur **Valider la perception**, vérifier le résumé, **Confirmer**.

Tout est automatique ensuite : stock mis à jour, fiche du collaborateur mise
à jour, historique enregistré.

**Autres actions courantes**

- **Recevoir une commande fournisseur** : Stock → Réception de stock.
- **Consulter la fiche d'un collaborateur** : Collaborateurs → cliquer sur
  son nom. Un bouton **Fiche PDF** permet d'imprimer/exporter une fiche de
  dotation signable.
- **Corriger une erreur** : sur la fiche du collaborateur, bouton
  **Corriger** à côté de l'équipement concerné. L'ancienne valeur reste
  visible dans l'historique — rien n'est jamais supprimé silencieusement.
- **Voir qui a fait quoi** : Paramètres → Journal d'audit.

## 9. Architecture

- Le **stock n'est jamais une valeur modifiable directement** : il est
  systématiquement recalculé à partir de la somme des mouvements de stock
  (réception, distribution, retour, correction). Voir [`src/lib/stock.ts`](src/lib/stock.ts).
- Les **campagnes de dotation** remplacent la logique V1/V2 : une seule
  campagne est active à la fois (Paramètres → Campagnes), sélectionnée
  automatiquement lors d'une nouvelle perception.
- Rôles : **Administrateur** (tout) et **Lecture seule** (consultation
  uniquement — les actions de modification sont bloquées côté serveur même
  si l'URL est appelée directement).
- La **signature tactile** après perception est prévue dans le modèle de
  données (`Signature`) mais désactivée par défaut (`ENABLE_SIGNATURE`) et
  non branchée dans l'interface dans cette version — activable comme
  évolution future sans changement de structure.

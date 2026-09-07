# Dotation Vêtements

Application interne de gestion de la dotation de vêtements professionnels.
Remplace l'ancien système Google Sheets / Google Forms — aucune dépendance à
Google ou à un compte Gmail personnel.

**Stack** : Next.js (React, App Router) · PostgreSQL · Prisma · NextAuth
(email + mot de passe).

## Sommaire

1. [Installation locale (développement)](#1-installation-locale-développement)
2. [Déploiement avec Vercel + Supabase (recommandé, gratuit)](#2-déploiement-avec-vercel--supabase-recommandé-gratuit)
3. [Déploiement alternatif : Docker + VPS](#3-déploiement-alternatif--docker--vps)
4. [Création du premier compte administrateur](#4-création-du-premier-compte-administrateur)
5. [Sauvegardes](#5-sauvegardes)
6. [Restauration](#6-restauration)
7. [Mise à jour de l'application](#7-mise-à-jour-de-lapplication)
8. [Import des anciennes données](#8-import-des-anciennes-données)
9. [Guide utilisateur rapide](#9-guide-utilisateur-rapide)
10. [Architecture](#10-architecture)

---

## 1. Installation locale (développement)

Prérequis : Node.js 20+, une base PostgreSQL (locale, via Docker, ou un
projet Supabase gratuit — voir section 2).

```bash
npm install
cp .env.example .env
# renseigner DATABASE_URL, DIRECT_URL, AUTH_SECRET, etc. dans .env
npx prisma migrate dev
npm run db:seed        # optionnel : données de démonstration
npm run dev
```

L'application est disponible sur http://localhost:3000.

## 2. Déploiement avec Vercel + Supabase (recommandé, gratuit)

C'est le mode de déploiement recommandé pour une petite structure comme
SGPA : aucun serveur à administrer, HTTPS automatique, gratuit pour ce
volume d'utilisation (~25 personnes).

**Important** : créez ces comptes avec une adresse email de l'association
(pas un compte personnel), pour que l'outil ne dépende de personne en
particulier.

### 2.1 Créer le projet Supabase (base de données)

1. Sur [supabase.com](https://supabase.com), créez un compte et un nouveau
   projet (choisissez une région Europe).
2. Une fois le projet créé : **Project Settings → Database → Connection
   string**. Récupérez deux URL :
   - **Transaction pooler** (port `6543`) → ce sera `DATABASE_URL`
   - **Direct connection** (port `5432`) → ce sera `DIRECT_URL`
3. Notez le mot de passe de la base choisi à la création du projet.

> ⚠️ Le projet gratuit Supabase se met en pause après une semaine
> d'inactivité. Un email est envoyé avant, et la relance prend un clic dans
> le tableau de bord Supabase.

### 2.2 Déployer sur Vercel

1. Poussez ce dépôt sur GitHub (créez un dépôt, idéalement sous
   l'organisation GitHub de l'association plutôt qu'un compte personnel).
2. Sur [vercel.com](https://vercel.com), créez un compte, puis **Add New →
   Project**, et importez le dépôt GitHub.
3. Dans **Environment Variables**, ajoutez :
   - `DATABASE_URL` et `DIRECT_URL` (récupérées à l'étape 2.1)
   - `AUTH_SECRET` (générez-en un avec `openssl rand -base64 32`)
   - `APP_NAME` (facultatif)
   - `SMTP_*` si vous voulez l'envoi d'emails de réinitialisation (voir
     `.env.example`)
4. Cliquez sur **Deploy**. Vercel installe les dépendances, applique les
   migrations de base de données (`prisma migrate deploy`, configuré dans
   `package.json`) et construit l'application automatiquement.
5. Une fois déployé, Vercel donne une adresse du type
   `https://dotation-app-xxxx.vercel.app`. Vous pouvez ensuite relier un nom
   de domaine propre (`dotation.sgpa.ch`) dans **Project Settings →
   Domains**.

### 2.3 Premier déploiement : créer l'administrateur

Le compte admin ne peut pas être créé via une commande sur Vercel (pas
d'accès shell direct). Le plus simple : lancez le script une seule fois
depuis votre machine, en pointant vers la base Supabase :

```bash
DATABASE_URL="<connection string Supabase>" \
npx tsx scripts/create-admin.ts --email admin@sgpa.ch --password "UnMotDePasseSolide!" --name "Prénom Nom"
```

### 2.4 Mises à jour

Chaque `git push` sur la branche principale redéploie automatiquement
l'application sur Vercel (build + migrations incluses).

## 3. Déploiement alternatif : Docker + VPS

Si vous préférez un serveur dédié (VPS Infomaniak ou autre) plutôt que
Vercel/Supabase, l'application est aussi prête pour Docker.

Prérequis sur le serveur : Docker et Docker Compose.

```bash
cp .env.example .env
# renseigner POSTGRES_PASSWORD, AUTH_SECRET, DATABASE_URL, etc.

docker compose up -d --build
```

L'application écoute en local sur `127.0.0.1:3000`. Mettez un reverse proxy
Nginx devant (exemple fourni dans [`deploy/nginx.conf.example`](deploy/nginx.conf.example))
pour servir l'application en HTTPS sur votre nom de domaine, avec un
certificat via `certbot` par exemple. Les migrations de base de données sont
appliquées automatiquement au démarrage du conteneur (voir
[`docker-entrypoint.sh`](docker-entrypoint.sh)).

## 4. Création du premier compte administrateur

Voir section 2.3 (Vercel) ou, avec Docker :

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

## 5. Sauvegardes

**Avec Supabase** : Project Settings → Database → Backups. Le plan gratuit
conserve un historique limité ; pensez à faire un export manuel régulier si
c'est critique (voir ci-dessous).

**Avec Docker** : une sauvegarde quotidienne automatique est recommandée via
`cron` sur le serveur hôte :

```cron
0 3 * * * cd /opt/dotation-app && ./deploy/backup.sh >> /var/log/dotation-backup.log 2>&1
```

Le script [`deploy/backup.sh`](deploy/backup.sh) exporte la base PostgreSQL
(`pg_dump`, compressé) dans `./backups/` et conserve automatiquement les 30
derniers jours.

**Dans tous les cas**, un export manuel complet est aussi disponible dans
l'application : **Historique → Exporter en CSV** (avec filtres), utilisable
comme sauvegarde ponctuelle lisible dans Excel.

## 6. Restauration

**Avec Supabase** : Project Settings → Database → Backups → Restore.

**Avec Docker** :

```bash
./deploy/restore.sh ./backups/dotation_2026-09-07_030000.sql.gz
```

⚠️ Cette opération remplace entièrement les données actuelles. Une
confirmation est demandée avant d'exécuter la restauration.

## 7. Mise à jour de l'application

**Avec Vercel** : `git push` sur la branche principale suffit (voir section 2.4).

**Avec Docker** :

```bash
git pull
docker compose up -d --build
```

Faites une sauvegarde avant toute mise à jour importante (voir section 5).

## 8. Import des anciennes données

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

## 9. Guide utilisateur rapide

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
- **Corriger ou annuler une perception** : sur la fiche du collaborateur,
  bouton **Corriger** à côté de l'équipement concerné (mettre la quantité à
  0 pour annuler complètement). L'ancienne valeur reste visible dans
  l'historique — rien n'est jamais supprimé silencieusement.
- **Voir qui a fait quoi** : Paramètres → Journal d'audit.

## 10. Architecture

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

# Continuité d'exploitation — Vestiaire SGPA

## Répartition des responsabilités

SGPA reste propriétaire des données, du dépôt GitHub, du projet Vercel, du projet Supabase,
du domaine et des sauvegardes. Le mainteneur conserve les droits nécessaires pour développer,
déployer et dépanner, mais ces droits doivent pouvoir être révoqués sans arrêter le service.

Accès minimaux à maintenir :

- GitHub : deux propriétaires SGPA, double authentification obligatoire ; mainteneur membre.
- Vercel : deux propriétaires SGPA lorsque le plan le permet ; mainteneur avec droits de
  déploiement.
- Supabase : deux propriétaires SGPA ; mainteneur administrateur ou développeur.
- Domaine/DNS : compte appartenant à SGPA, avec deux moyens de récupération.
- Application : au moins deux comptes `ADMIN` nominatifs et un compte `READONLY` facultatif
  pour la direction.
- Coffre-fort : codes de récupération, emplacement des sauvegardes et procédure d'urgence.

Les mots de passe ne sont pas partagés. Un administrateur crée un compte puis remet un lien
d'accès unique à la personne concernée.

## Dépôt privé et hébergement

Un projet Vercel Hobby ne déploie pas un dépôt privé appartenant à une organisation GitHub.
Pour garder le dépôt privé tout en conservant plusieurs responsables, SGPA doit choisir l'une
des solutions suivantes :

1. équipe Vercel Pro appartenant à SGPA ;
2. autre hébergeur autorisant un dépôt privé et plusieurs administrateurs ;
3. dépôt public temporaire, uniquement après suppression de toute donnée personnelle et de
   tout secret, en acceptant que le code reste publiquement copiable.

Le choix et son coût doivent être approuvés par SGPA avant de changer la visibilité du dépôt,
afin de ne pas interrompre les déploiements.

## Sauvegardes

- Export PostgreSQL chiffré et stocké dans un espace contrôlé par SGPA.
- Sauvegarde au minimum hebdomadaire et avant toute migration importante.
- Conservation recommandée : 30 jours, avec une copie mensuelle plus longue si nécessaire.
- Test de restauration trimestriel sur une base isolée.
- L'export CSV de l'historique est utile pour la lecture, mais ne remplace pas une sauvegarde
  complète PostgreSQL.

## Départ ou changement de mainteneur

1. vérifier que deux responsables SGPA accèdent à GitHub, Vercel, Supabase, au domaine et aux
   sauvegardes ;
2. transférer la documentation, les incidents connus et les travaux en cours ;
3. retirer les accès de l'ancien mainteneur ;
4. renouveler les secrets auxquels il avait accès ;
5. vérifier le site, la sauvegarde et un déploiement avec le nouveau mainteneur ;
6. conserver l'historique Git et les journaux d'audit.

## Maintenance externe future

Si la maintenance est confiée ultérieurement à une agence, un accord écrit doit préciser au
minimum : propriété du code et des données, prix, support, délais d'intervention, sauvegardes,
confidentialité, export complet et conditions de fin de contrat. L'accord ne doit pas créer de
dépendance technique empêchant SGPA de changer de prestataire.

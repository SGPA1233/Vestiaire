# Sécurité de Vestiaire SGPA

## Principes obligatoires

- Ne jamais commiter de mot de passe, clé API, chaîne de connexion ou export de données.
- Ne jamais placer de noms ou tailles de collaborateurs dans les données de démonstration.
- Utiliser un compte nominatif par administrateur et activer la double authentification sur
  GitHub, Vercel, Supabase, la messagerie et le gestionnaire du domaine.
- Conserver les codes de récupération dans le coffre-fort de mots de passe SGPA.
- Appliquer les migrations avant le nouveau code lors de chaque déploiement.
- Vérifier `npm audit`, les tests, le typage, le lint et la compilation avant publication.

## Gestion des accès applicatifs

- `ADMIN` peut modifier les données et gérer les utilisateurs.
- `READONLY` consulte les données sans pouvoir les modifier.
- La désactivation d'un compte et la réinitialisation d'un mot de passe invalident ses
  sessions existantes.
- Les liens d'accès sont à usage unique, stockés uniquement sous forme hachée et expirent.
- Aucun lien de réinitialisation n'est généré depuis une page publique.

## Déclaration d'un incident

En cas de doute sur un accès :

1. désactiver le compte concerné ;
2. changer `AUTH_SECRET` pour fermer toutes les sessions ;
3. renouveler le mot de passe de la base si sa chaîne de connexion a pu être exposée ;
4. consulter les journaux Vercel, Supabase et le journal d'audit de l'application ;
5. restaurer la dernière sauvegarde saine uniquement après avoir identifié la cause ;
6. consigner la date, l'impact, les mesures prises et les personnes informées.

Les détails techniques sensibles ne doivent pas être publiés dans une issue GitHub publique.

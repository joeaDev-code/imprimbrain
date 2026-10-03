# Imprim'Brain

Application web multi-imprimeries de gestion : clients, prestations, paiements, reçus, dépenses, services, stock, règles de consommation et employés.

## Socle
- Next.js 16 / React 19 / Tailwind CSS 4
- PostgreSQL
- Prisma ORM 7 + `@prisma/adapter-pg`
- Sessions serveur HttpOnly
- Chiffrement AES-256-GCM par organisation (envelope encryption)
- Blind indexes HMAC-SHA-256 pour les recherches exactes sur données chiffrées
- Rôles préparés : SUPER_ADMIN, ADMIN, OFFICER, SECRETARY
- Audit log

## Démarrage local
Prérequis : Node.js >= 22.18 et Docker.

```bash
cp .env.example .env
npm run secret
# exécuter deux fois et copier deux valeurs différentes dans
# MASTER_ENCRYPTION_KEY et BLIND_INDEX_MASTER_KEY de .env
npm install
docker compose up -d
npm run setup
npm run dev
```

Ouvrir `http://localhost:3000`.

Compte seed local par défaut : `admin@imprimbrain.local` / `ChangeMe123!`.
En production, `ADMIN_PASSWORD` doit obligatoirement être personnalisé. Configurez aussi `PUBLIC_RECEIPT_SECRET` avec une valeur aléatoire distincte. `TRUSTED_PROXY_IP_HEADER` ne doit être réglé sur `x-real-ip` ou `x-forwarded-for` que si le proxy de bord écrase cette valeur et que l’application n’est pas directement joignable.

## Vérifications
```bash
npm run typecheck
npm run build
```
Endpoint de santé : `GET /api/health`.

## Parcours déjà couverts
1. Connexion administrateur.
2. Création de clients (coordonnées chiffrées + blind indexes).
3. Création des services et prix.
4. Création du stock et approvisionnement.
5. Association service -> consommation de stock.
6. Prestation multi-lignes avec transaction atomique et décrément automatique du stock.
7. Paiement initial ou complémentaire et calcul du reste.
8. Reçu imprimable avec coordonnées de l'imprimerie.
9. Dépenses et dashboard financier.
10. Création, changement de rôle et désactivation d'employés.
11. Paramètres de l'imprimerie chiffrés.

## Fonctionnalités reportées
- Scanner code-barres/caméra (le champ barcode est déjà prévu)
- Console plateforme SUPER_ADMIN
- Abonnements/facturation SaaS
- 2FA et récupération de mot de passe
- stockage de logo/fichiers

## Déploiement
Utiliser une base PostgreSQL dédiée, HTTPS, deux clés indépendantes de 32 octets aléatoires (`MASTER_ENCRYPTION_KEY` et `BLIND_INDEX_MASTER_KEY`), un `PUBLIC_RECEIPT_SECRET` aléatoire distinct, des secrets distincts par environnement et des sauvegardes chiffrées. Ne jamais committer `.env`.

Le rate limiting de connexion utilise une interface `RateLimitStore` et un store mémoire borné par défaut. Cette implémentation ne partage pas ses compteurs entre instances. Avant un déploiement multi-instance/serverless, brancher un store atomique partagé (Redis/KV ou limiteur d'API au niveau proxy). Sans proxy explicitement configuré, l'application n'accorde aucune confiance aux en-têtes IP et n'applique que la protection par compte.

Le formulaire de prestation produit un reçu interne via `/api/receipts/:id`; aucun lien public n'est émis par le code actuel. La route historique `/recu/:token` accepte néanmoins un jeton HMAC porteur expirant après 30 jours. Elle n'affiche pas les coordonnées du client, n'est pas mise en cache et porte `noindex`; il n'existe pas de révocation individuelle, mais la rotation de `PUBLIC_RECEIPT_SECRET` invalide tous les jetons. Détails RLS et modèle de déploiement : [docs/backend-security.md](docs/backend-security.md).

# Variables d'environnement (backend)

Référence complète des valeurs : **`Setup_env.md`** à la racine du monorepo parent (`Project WebFullStack Hub/Setup_env.md`).

## Fichiers (un `.env` par service)

| Fichier | Rôle |
|---------|------|
| `backend/services/auth-service/.env` | Mongo, JWT, port 4001 |
| `backend/services/catalog-service/.env` | Mongo, JWT, port 4002 |
| `backend/services/roguelike-service/.env` | Mongo, JWT, analytics, port 4003 |
| `backend/services/analytics-service/.env` | Mongo, JWT, ingest token, port 4004 |
| `backend/gateway/.env` | URLs des subgraphs, port 4000 |
| `frontend/.env.local` | `NEXT_PUBLIC_*` (GraphQL, WebGL) |

Tous ces fichiers sont dans **`.gitignore`** — ne pas les committer.

## MongoDB

Pas de conteneur Mongo dans Docker : **`MONGO_URI`** pointe vers le cluster Atlas (identique sur les 4 services).

## Dev local

```bash
npm run dev:auth
# ou npm run dev:all
```

Chaque service charge son `backend/services/<service>/.env` au démarrage.

## Docker Compose

`docker-compose.yml` utilise `env_file` vers chaque `.env` de service (surcharge `NODE_ENV=production` et URLs internes pour roguelike/analytics).

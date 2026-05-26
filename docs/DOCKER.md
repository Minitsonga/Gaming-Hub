# Docker – Gaming Hub

## Lancer toute la stack (Docker Desktop)

À la **racine du repo** :

```bash
docker compose up --build
```

- **Frontend** : http://localhost:3000  
- **Gateway** : http://localhost:4000/graphql  
- **Auth** : 4001, **Catalog** : 4002, **Roguelike** : 4003, **Analytics** : 4004  
En arrière-plan : `docker compose up -d --build`.

**MongoDB** : aucune image Mongo dans le compose. Les **`backend/services/*/.env`** doivent exister (voir `Setup_env.md` à la racine du monorepo). Voir [ENV.md](ENV.md).

---

## Lancer un seul service (ex. auth)

Tu peux builder et lancer **uniquement** l’image d’un service. Les `node_modules` sont à la racine dans l’image, mais le conteneur ne démarre qu’**un seul process** (le serveur du service).

Exemple – seulement auth (avec un MongoDB déjà dispo) :

```bash
# Depuis la racine du repo
docker build -f backend/services/auth-service/Dockerfile -t gaming-hub-auth .

docker run --name auth -p 4001:4001 \
  --env-file backend/.env \
  gaming-hub-auth
```

---

## Déploiement sur un serveur

Sur la machine qui héberge tout :

1. Cloner le repo, placer les `.env` (ou configurer les variables d’environnement).
2. Lancer la stack : `docker compose up -d --build`.
3. Un seul serveur exécute ainsi tous les services (gateway + 4 subgraphs) ; MongoDB reste sur ton cluster (Atlas).

Pour exposer uniquement le gateway en public, n’ouvrir que le port 4000 en entrée et laisser les autres ports en interne au réseau Docker.

---

## Versionner et publier les images (Docker Hub)

### En local : bumper la version d’un service

À la racine du repo :

```bash
npm run release <service> <patch|minor|major>
```

Exemples : `npm run release auth-service patch`, `npm run release gateway minor`.

Le script met à jour le `package.json` du service et crée un tag Git (ex. `auth-service/v1.0.1`). Il affiche ensuite le rappel :

**Prochaine étape : git push origin dev --follow-tags**

Services possibles : `gateway`, `auth-service`, `catalog-service`, `roguelike-service`, `analytics-service`.

### Publication automatique sur Docker Hub (CI)

Quand tu pousses un tag du type `auth-service/v1.0.1`, la CI (workflow **Docker Publish**) build et push l’image sur Docker Hub.

**Secrets à configurer dans GitHub** (Settings → Secrets and variables → Actions) :

- `DOCKERHUB_USERNAME` : ton identifiant Docker Hub
- `DOCKERHUB_TOKEN` : token d’accès (Docker Hub → Account Settings → Security → New Access Token)

Les images seront nommées : `$DOCKERHUB_USERNAME/gaming-hub-auth-service:1.0.1`, etc.

### CI staging (PR dev → staging) — valider puis publier les versions

1. **Avant la PR** : tu crées les versions avec `npm run release <service> patch` (ou minor/major), puis tu pushes : `git push origin dev --follow-tags`.
2. **Sur la PR** : la CI exécute uniquement **lint + tests** (aucun push). Si tout est vert, la PR est validée.
3. **Au merge sur staging** : la CI build et push toutes les images sur Docker Hub avec les **versions lues dans les `package.json`** (`:1.0.1`, `:latest`, `:sha-xxx`). C’est la CI qui « valide » et publie les versions.

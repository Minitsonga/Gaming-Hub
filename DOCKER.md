# Docker – Gaming Hub

## Lancer toute la stack (Docker Desktop)

À la **racine du repo** :

```bash
docker compose up --build
```

- **Gateway** : http://localhost:4000/graphql  
- **Auth** : 4001, **Catalog** : 4002, **Roguelike** : 4003, **Analytics** : 4004  
- **MongoDB** : localhost:27017 (base `gaming-hub`)

En arrière-plan : `docker compose up -d --build`.

Les variables (dont `MONGO_URI`) sont prises depuis les fichiers `.env` de chaque service ; le compose écrase `MONGO_URI` pour pointer vers le conteneur `mongodb`. Pense à avoir des `.env` dans chaque service (ou à définir les secrets dans le compose / un env de déploiement).

---

## Lancer un seul service (ex. auth)

Tu peux builder et lancer **uniquement** l’image d’un service. Les `node_modules` sont à la racine dans l’image, mais le conteneur ne démarre qu’**un seul process** (le serveur du service).

Exemple – seulement auth (avec un MongoDB déjà dispo) :

```bash
# Depuis la racine du repo
docker build -f backend/services/auth-service/Dockerfile -t gaming-hub-auth .

docker run --name auth -p 4001:4001 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/gaming-hub \
  -e JWT_SECRET=secret \
  gaming-hub-auth
```

Sur Linux, pour accéder au MongoDB de l’hôte : `-e MONGO_URI=mongodb://172.17.0.1:27017/gaming-hub` (ou le IP de la machine).

---

## Déploiement sur un serveur

Sur la machine qui héberge tout :

1. Cloner le repo, placer les `.env` (ou configurer les variables d’environnement).
2. Lancer la stack : `docker compose up -d --build`.
3. Un seul serveur exécute ainsi tous les services (gateway + 4 subgraphs + MongoDB).

Pour exposer uniquement le gateway en public, n’ouvrir que le port 4000 en entrée et laisser les autres ports en interne au réseau Docker.

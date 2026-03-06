# Gaming Hub

Plateforme de jeux avec système de skills et authentification GraphQL.

## Stack

- Backend: Node.js + TypeScript + GraphQL (Apollo)
- Frontend: Next.js 14 + React 19
- Database: MongoDB Atlas
- Deployment: Render

## Documentation

| Guide | Description |
|-------|-------------|
| [**Workflow Dev & Staging**](docs/WORKFLOW.md) | Branches, versioning, push / merge, PR dev → staging, publication des images |
| [**Docker**](docs/DOCKER.md) | Lancer la stack, un service seul, déploiement, Docker Hub |
| [**Tests de charge (k6)**](docs/LOAD_TESTS.md) | Scénarios de charge et performance |

Toute la doc technique est dans [docs/](docs/).

## Branches

- `dev` – Développement quotidien
- `staging` – Pre-production (merge depuis dev → publication des images)
- `main` – Production

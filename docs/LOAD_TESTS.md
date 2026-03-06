# Tests de charge et de performance (k6)

Les tests ciblent le **gateway** (port 4000). Lance la stack avant (ex. `docker compose up` ou les services en local).

## Installation de k6

- **Windows** : `winget install k6` ou [téléchargement](https://k6.io/docs/get-started/installation/).
- **macOS** : `brew install k6`.
- **Linux** : voir [docs k6](https://k6.io/docs/get-started/installation/).

Vérifier : `k6 version`.

## Commandes

| Commande | Scénario | Description |
|----------|----------|-------------|
| `npm run load-test` | health | Smoke : 10 VUs, 30 s, GET /health |
| `npm run load-test:health` | health | Idem |
| `npm run load-test:graphql` | graphql | 10 VUs, 30 s, POST /graphql (query minimale) |
| `npm run load-test:load` | load | Montée 0→10→20 VUs sur ~2 min (health) |
| `npm run load-test:stress` | stress | Montée 20→50→100 VUs pour trouver la limite |

URL par défaut : `http://localhost:4000`. Pour une autre cible :

```bash
k6 run --env BASE_URL=http://staging.example.com load-tests/health.js
```

Ou avec npm (Windows PowerShell) :

```powershell
$env:BASE_URL="http://localhost:4000"; npm run load-test:stress
```

## Interprétation

En fin de run, k6 affiche notamment :

- **http_req_duration** : latence (avg, min, max, p90, p95).
- **http_req_failed** : taux de requêtes en erreur.
- **iterations** : nombre d’itérations total.
- **vus** : utilisateurs virtuels.

Les **thresholds** dans chaque script (ex. `p(95)<500`) font échouer le run si le seuil n’est pas respecté. Tu peux les ajuster dans les fichiers `load-tests/*.js`.

## Fichiers

- `load-tests/health.js` : smoke / health.
- `load-tests/graphql.js` : charge GraphQL légère.
- `load-tests/load.js` : charge progressive.
- `load-tests/stress.js` : stress (montée jusqu’à 100 VUs).

L’intégration en CI pourra être ajoutée plus tard (ex. étape qui lance la stack ou pointe vers staging, puis `k6 run` avec ces scripts).

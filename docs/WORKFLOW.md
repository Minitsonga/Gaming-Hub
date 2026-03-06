# Workflow Dev & Staging

Guide des branches, du versioning et du cycle push → PR → merge.

---

## Branches

| Branche   | Rôle |
|-----------|------|
| **dev**   | Développement quotidien. Tous les commits et les tags de release partent d’ici. |
| **staging** | Pre-production. On y merge via une PR depuis `dev` pour valider et publier les images. |
| **main**  | Production (optionnel). Branche protégée pour la prod. |

---

## Au quotidien sur `dev`

1. Tu travailles sur `dev` (ou une feature branch mergée dans `dev`).
2. À chaque commit, le **pre-commit** (Husky) lance :
   - `npm run lint`
   - `npm run format:check`
   - Si ça échoue, le commit est refusé.
3. À chaque push sur `dev`, la CI **Lint & Format** vérifie lint et format sur GitHub.

Tu n’es pas obligé de bumper une version à chaque commit. Tu le fais quand tu veux **figer une version** d’un ou plusieurs services.

---

## Versionner un service

Quand tu veux marquer une nouvelle version (patch / minor / major) pour un service :

1. À la racine du repo :
   ```bash
   npm run release <service> <patch|minor|major>
   ```
   Exemples : `npm run release auth-service patch`, `npm run release gateway minor`.

2. Le script :
   - Met à jour le `version` dans le `package.json` du service.
   - Crée un tag Git (ex. `auth-service/v0.0.2`).
   - Affiche le rappel : **Prochaine étape : git push origin dev --follow-tags**

3. Tu pushes la branche et les tags :
   ```bash
   git push origin dev --follow-tags
   ```

**Services possibles** : `gateway`, `auth-service`, `catalog-service`, `roguelike-service`, `analytics-service`.

**Sémantique** : patch = correctif, minor = nouvelle feature compatible, major = breaking change.

---

## PR dev → staging (validation puis publication)

### 1. Avant d’ouvrir la PR

- Tu as fait tes changements sur `dev`.
- Si tu veux que cette livraison soit **versionnée** : exécute `npm run release ...` pour les services modifiés, puis `git push origin dev --follow-tags`. Les `package.json` et les tags sont à jour sur `dev`.

### 2. Ouvrir la PR

- Crée une **Pull Request** de `dev` vers `staging`.
- La CI **Staging** se déclenche et exécute :
  - Lint
  - Format check
  - Tests (`npm run test --workspaces --if-present`)
  - Build (`npm run build --workspaces`)
- **Aucun push Docker** à ce stade. Si tout est vert, la PR est validée côté qualité.

### 3. Merge sur `staging`

- Quand tu merges la PR (dev → staging), un **push** sur `staging` se produit.
- La CI **Staging** relance lint, tests et build, puis :
  - Build des images Docker pour tous les services.
  - Push sur **Docker Hub** avec les versions lues dans les `package.json` (`:0.0.1`, `:latest`, `:sha-xxx`).

Donc : **c’est le merge sur staging qui publie les images** avec les versions définies dans les packages.

---

## Publication via tag (optionnel)

Si tu pousses un **tag** du type `auth-service/v0.0.2` (créé par `npm run release` + `git push --follow-tags`), la CI **Docker Publish (tag)** build et push **uniquement** l’image de ce service sur Docker Hub. Utile pour une release ciblée sans passer par une PR staging.

---

## Récap

- **dev** : travail au quotidien, pre-commit (lint + format), optionnellement `npm run release` + `git push --follow-tags`.
- **PR dev → staging** : validation (lint, tests, build), pas de push Docker.
- **Merge sur staging** : même validation + build et push de toutes les images versionnées sur Docker Hub.
- **Tag** (ex. `auth-service/v0.0.2`) : publication d’une seule image sur Docker Hub.

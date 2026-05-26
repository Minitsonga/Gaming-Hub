# Gaming Hub — Front Next.js et communication avec le jeu (Unity / WebGL)

Document de référence pour brancher un build WebGL (Unity ou autre) sur le hub : routes, variables d’environnement, contrat `postMessage`, et API GraphQL réellement exposée par le gateway.

**Voir aussi** : [BRIDGE_UNITY.md](./BRIDGE_UNITY.md) — contrat détaillé `GameBridge` (messages `RUN_ENDED`, `DRAW_SKILLS`, skills, format MongoDB). Build statique sous `frontend/public/games/<slug>/`.

---

## 1. Où en est le projet (synthèse)

### Déjà en place (backend)

- **Gateway Apollo Federation** (`http://localhost:4000/graphql` par défaut) agrège :
  - **auth** : inscription, login, JWT, `me`, etc.
  - **catalog** : jeux (`games`, `game(id)`), création / mise à jour côté opérateur.
  - **roguelike** : sauvegardes joueur (`mySave`, `upsertSave`), skills catalogue, **web events** (`activeWebEvents`, `clickWebEvent`).
  - **analytics** : stats, classements (`gameLeaderboard`, `upsertPlayerMetric`, etc.).
- **Docker**, **tests unitaires** sur plusieurs services, **k6** (charge), CI décrite dans `docs/WORKFLOW.md`.

### Déjà en place (frontend Next.js)

- Authentification (register / login), catalogue (`/catalog`), liste admin / catalogue riche (`/games`), fiche jeu (`/games/[id]`), classements, préférences UI.
- **Deux flux « session de jeu »** coexistent (voir section 2) : l’un est aligné sur le GraphQL actuel, l’autre utilise des opérations **non présentes** dans le backend aujourd’hui.

### À finaliser / incohérences utiles à connaître

| Sujet | Détail |
|--------|--------|
| **Session `/games/[id]/play`** | Composant `GameSessionClient` appelle `saveProgression`, `restoreProgression`, `submitScore`, `leaderboard(gameId)` — **ces champs n’existent pas** dans le schéma gateway actuel. Tant que le backend n’ajoute pas ces opérations (ou que le front n’est pas réécrit vers `upsertSave` / `mySave` / `upsertPlayerMetric` / `gameLeaderboard`), cette page échouera côté API pour la persistance et le score. |
| **Session `/play/[slug]`** | Utilise `upsertSave`, `mySave`, `upsertPlayerMetric` — **aligné** sur le backend. L’URL n’est pas reliée au menu principal (accès souvent manuel : `/play/<slug>`). |
| **Fiche `/games/[id]`** | Le bouton « Launch game » n’ouvre pas encore une route de lecture ; les liens utiles passent plutôt par **« Launch session »** sur `/games` vers `/games/[id]/play`. |
| **Sécurité prod** | Les messages utilisent souvent `targetOrigin: "*"` pour le pont iframe : acceptable en dev ; en production, restreindre aux origines du hub et du build jeu. |

---

## 2. Deux routes de jeu — laquelle utiliser avec Unity ?

### A. **`/play/[slug]`** (reOMMANDÉ pour coller au Gateway actuel)

- **URL iframe** : `{NEXT_PUBLIC_GAME_HOST_URL}/{slug}/index.html`  
  Exemple : `http://localhost:3000/games/roguesurvival/index.html` — build dans `frontend/public/games/roguesurvival/` (le fichier explicite évite le conflit avec `/games/[id]`).
- **Persistance** : via GraphQL `mySave` / `upsertSave` (roguelike subgraph), déclenchée depuis le front (boutons de test ou ton propre flux). Après chargement de l’iframe, le parent envoie **`LOAD_SAVE`** avec le payload issu du hub (voir §4).
- **Scores / leaderboard** : `upsertPlayerMetric` + `gameLeaderboard` (analytics), comme dans `leaderboard-client.ts`.

### B. **`/games/[id]/play`** — `GameSessionClient`

- **URL iframe** : `{NEXT_PUBLIC_RUNTIME_URL}/?game={slug}&gameId={id}` (ex. `http://localhost:5173/?game=...&gameId=...`), typiquement pour un **shell Vite** ou un runtime dédié.
- **Contrat `postMessage`** : plus riche (overlays avec `choices` structurées, `RUN_ENDED`, etc.) mais les **mutations GraphQL associées ne sont pas implémentées** dans ce repo backend. À réserver à une évolution future ou à un alignement schema + résolveurs.

**Pour un projet Unity WebGL consommant le hub tel qu’il est aujourd’hui, base-toi sur le flux A (`/play/[slug]`) et le tableau « Jeu → parent » / « Parent → jeu » ci-dessous.**

---

## 3. Variables d’environnement (frontend)

Fichier `frontend/.env.local` (voir aussi `Setup_env.md` à la racine du monorepo) :

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_GRAPHQL_URL` | Endpoint du gateway (défaut `http://localhost:4000/graphql`). |
| `NEXT_PUBLIC_GAME_HOST_URL` | Base URL où est servi le **build WebGL** (défaut `http://localhost:8080`). Utilisée par `/play/[slug]`. |
| `NEXT_PUBLIC_RUNTIME_URL` | Base du **runtime** pour `/games/[id]/play` (défaut `http://localhost:5173`). |

Le jeu Unity doit être servi avec les bons en-têtes (CORS / isolation selon ton hébergeur) pour être embarqué dans une iframe depuis l’origine du hub Next.js.

---

## 4. Contrat `window.postMessage` — flux `/play/[slug]`

Tous les messages sont des objets sérialisables en JSON. Côté Unity WebGL, l’équivalent est d’appeler depuis le navigateur `window.parent.postMessage(obj, "*")` (idéalement une origine fixe en prod).

### Du jeu (iframe) vers le parent (hub)

Le parent écoute `window.addEventListener("message", ...)`.

| `type` | Structure | Effet côté hub |
|--------|-----------|----------------|
| `DECISION_OVERLAY` | `{ type: "DECISION_OVERLAY", payload: { title: string, description: string, choices: string[] } }` | Affiche un overlay ; l’utilisateur choisit une chaîne parmi `choices`. |
| `RUN_STATE_CHANGED` | `{ type: "RUN_STATE_CHANGED", payload: { state: "idle" \| "running" \| "paused" \| "game-over" } }` | Met à jour le texte d’aide (prompt) autour de l’iframe. |

### Du parent (hub) vers le jeu (iframe)

Le hub envoie sur `iframe.contentWindow.postMessage(...)`.

| `type` | Structure | Usage |
|--------|-----------|--------|
| `LOAD_SAVE` | `{ type: "LOAD_SAVE", payload: <objet saveData ou null> }` | Envoyé après `onLoad` de l’iframe si une sauvegarde existe (`mySave.saveData`). Le jeu doit appliquer ce state local. |
| `RESTART_RUN` | `{ type: "RESTART_RUN" }` | Bouton « Restart run » côté hub. |

Lorsqu’un choix est fait dans l’overlay :

| `type` | Structure |
|--------|-----------|
| `DECISION_SELECTED` | `{ type: "DECISION_SELECTED", payload: { choice: string } }` |

Le hub envoie ce message **vers la fenêtre de l’iframe** (pas seulement sur `window` du parent).

### Checklist implémentation Unity

1. Au démarrage WebGL, enregistrer un listener `message` sur `window` (Plugin `.jslib` ou couche JS générée).
2. Parser `event.data.type`. Pour `LOAD_SAVE`, interpréter `payload` (champs alignés sur le modèle hub : niveau, `xp`, `xyst`, vagues, kills, etc. — voir `SaveData` côté roguelike).
3. Pour afficher un choix dans le hub : `parent.postMessage({ type: "DECISION_OVERLAY", payload: { title, description, choices: ["A","B"] } }, "*")`.
4. Écouter `DECISION_SELECTED` et `RESTART_RUN` pour reprendre la logique jeu.

---

## 5. Contrat `postMessage` — flux `GameSessionClient` (`/games/[id]/play`)

À utiliser seulement si tu alignes le backend ou un mock sur ces opérations. Référence code : `frontend/src/components/game-session-client.tsx`.

### Jeu → parent

| `type` | Champs principaux |
|--------|-------------------|
| `DECISION_OVERLAY` | `title`, `description?`, `choices: { id, label, primary? }[]` |
| `PROMPT` | `title`, `message` |
| `RUN_ENDED` | `score: number`, `savePayload: string` (souvent JSON stringifié) |

### Parent → jeu

| `type` | Champs |
|--------|--------|
| `OVERLAY_CHOICE` | `payload: { gameId, choiceId }` (utiliser l’`id` fourni dans `choices`) |
| `RESTART_RUN` | `payload: { gameId, restorePayload: string \| null }` |

---

## 6. API GraphQL utile pour le jeu (gateway réel)

Extraits du schéma **effectif** (noms exacts à utiliser avec Claude ou Postman).

### Sauvegarde (roguelike)

- **Query** `mySave(gameSlug: String!)` → `saveData` (level, xp, xyst, skills, …).
- **Mutation** `upsertSave(gameSlug, saveData, playtimeMinutes)` → met à jour la sauvegarde.

### Score / classement (analytics)

- **Mutation** `upsertPlayerMetric(input: { userId, gameSlug, metric, value })` — le front utilise `metric: "score"` pour les scores.
- **Query** `gameLeaderboard(gameSlug, metric: "score", limit)` — entrées avec `userId`, `value`, `metric`.

### Auth

- Login / register renvoient un **Bearer** stocké côté front dans `localStorage` (`accessToken`, `user` avec `id` pour les mutations analytics).

---

## 7. Données `SaveData` (aperçu)

Côté serveur roguelike, une sauvegarde contient notamment : `ownedSkills`, `level`, `xp`, `xyst`, `runsCompleted`, `highestWave`, `totalKills`. Pour rester compatible avec `upsertSave` / `mySave`, les payloads envoyés par Unity (si tu les fais transiter par le hub en JSON) devraient rester cohérents avec ces champs.

---

## 8. Fichiers front à lire en priorité

| Fichier | Contenu |
|---------|---------|
| `frontend/src/app/play/[slug]/page.tsx` | Iframe, `LOAD_SAVE`, overlays, boutons save/score (GraphQL aligné). |
| `frontend/src/lib/save-client.ts` | `upsertSave` / `mySave`. |
| `frontend/src/lib/leaderboard-client.ts` | Score + classement. |
| `frontend/src/components/game-session-client.tsx` | Autre contrat message + appels GraphQL « runtime » à compléter côté API. |
| `frontend/src/lib/overlay-events.ts` | Garde-fous TypeScript sur la forme `DECISION_OVERLAY` (flux `/play`). |

---

## 9. Résumé pour une équipe Unity

1. Servir le WebGL sur la même « base » que `NEXT_PUBLIC_GAME_HOST_URL` + chemin = **slug** catalogue.
2. Ouvrir le hub sur **`/play/<slug>`** (utilisateur connecté pour que `LOAD_SAVE` / sauvegardes fonctionnent).
3. Implémenter `postMessage` **parent ↔ iframe** comme au §4.
4. Ne pas mélanger avec le format `choices: {id,label}[]` du §5 sauf si tu bascules vers `GameSessionClient` **et** tu exposes les mutations attendues dans le gateway.

---

*Document généré à partir du code du dépôt Gaming-Hub ; le jour où `GameSessionClient` sera branché sur `upsertSave` / analytics, une seule couche message pourra suffire.*

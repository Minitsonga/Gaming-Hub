# GameWeb — Unity ↔ Frontend Bridge Documentation

## Hébergement du build WebGL (Gaming Hub)

- **Dossier statique** : `frontend/public/games/<slug>/` (ex. `roguesurvival` — le nom du dossier doit correspondre au **slug catalogue** Mongo).
- **URL iframe** (page `/play/[slug]`) : `{NEXT_PUBLIC_GAME_HOST_URL}/<slug>/index.html`  
  Exemple local : `NEXT_PUBLIC_GAME_HOST_URL=http://localhost:3000/games` → `http://localhost:3000/games/roguesurvival/index.html` (évite le conflit avec la route Next `/games/[id]`).
- **API** : sauvegarde et scores via le gateway GraphQL (`upsertSave`, `mySave`, `upsertPlayerMetric`) — pas via le service Node roguelike pour servir les fichiers `.wasm`.
- **Implémentation front** : [`frontend/src/app/play/[slug]/page.tsx`](../frontend/src/app/play/[slug]/page.tsx), [`frontend/src/lib/game-bridge.ts`](../frontend/src/lib/game-bridge.ts).

Voir aussi : [FRONTEND_ET_PONT_UNITY.md](./FRONTEND_ET_PONT_UNITY.md) (routes hub, variables d’environnement).

### Dev local HTTP (`localhost`) et fichiers `.br`

Unity exporte souvent `*.data.br`, `*.framework.js.br`, `*.wasm.br`. En **HTTP** (sans HTTPS), le navigateur peut refuser de décompresser le Brotli même avec `Content-Encoding: br` → erreur *Unable to parse …framework.js.br*.

1. Décompresser : `node scripts/decompress-unity-webgl.mjs roguesurvival`
2. Vérifier que `index.html` pointe vers les fichiers **sans** `.br` (déjà le cas dans `roguesurvival/index.html` après deploy).

### Déployer un export Unity dans le hub

1. Exporter le build WebGL depuis Unity vers un dossier **hors repo** (ou temporaire) contenant `Build/` et `TemplateData/`.
2. Lancer le script (copie vers le slug catalogue + décompression `.br`) :

```bash
cd Gaming-Hub
node scripts/deploy-unity-webgl.mjs roguesurvival "/chemin/vers/export-unity"
# ou : npm run deploy:webgl -- roguesurvival "/chemin/vers/export-unity"
```

Le script **ne remplace pas** `roguesurvival/index.html` : il conserve le shell hub (`GamingHub_SendToParent`, `__gamingHubBridge`). Ne pas écraser ce fichier avec l’`index.html` brut Unity.

3. Recharger `/play/roguesurvival` dans le navigateur (`Ctrl+Shift+R`). Pas besoin de redémarrer `npm run dev`.

| Dossier | Rôle |
|---------|------|
| `public/games/roguesurvival/` | Seul build versionné / servi (`<slug>` catalogue) |
| Export Unity externe | Dépôt temporaire — ne pas committer dans le hub |

---

## État d’intégration (résumé)

| Zone | Statut | Détail |
|------|--------|--------|
| Page `/play/[slug]` + iframe WebGL | ✅ | Catalogue, auth JWT, iframe `NEXT_PUBLIC_GAME_HOST_URL/<slug>/index.html` |
| Relais **React → iframe** | ✅ | `postMessage` + `__gamingHubBridge` → `SendMessage("GameBridge", "OnWebMessage", …)` |
| Relais **iframe → parent** dans `index.html` | ✅ | `GamingHub_SendToParent` prêt côté HTML |
| Écoute **Unity → React** (`window.message`) | ✅ | `game-bridge.ts` + handlers dans `page.tsx` |
| UI skills / Xyst sous le jeu | ✅ | `SkillsHubSection` — état piloté par les messages Unity |
| Sauvegarde / score GraphQL | ✅ | Au `RUN_ENDED` : `upsertSave` + `submitScore` |
| **Build WebGL déployé (`roguesurvival/`)** | ✅ | Dernier deploy via `deploy-unity-webgl.mjs` |
| **`gamebridge.jslib` + `GameBridge.cs` (sources)** | ✅ | Voir § Correctifs — logs `[GameBridge]` en console iframe |
| **Pont Unity → React actif en jeu** | ⚠️ | Vérifier bandeau Pont vert + `XYST_UPDATED` / `PENDING_ROLLS` sous le canvas |

> **État avant fix** : en jeu tu voyais 9 Xyst et 1 level up (livre), sous l’iframe : `Xyst: 0` et « Aucun niveau de skill disponible ».  
> **État après fix** : le hub reçoit `XYST_UPDATED` à chaque drop ennemi, `PENDING_ROLLS` à chaque level-up, `RUN_ENDED` à la mort du joueur.

---

## Correctifs appliqués (2026-05-26)

### Problème

`GameBridge.cs` et `gamebridge.jslib` étaient déjà écrits mais les méthodes de notification n’étaient **jamais appelées** depuis la logique gameplay. Le pont JS existait, aucun message ne l’empruntait.

### Fichiers modifiés

#### `Assets/Scripts/Global/GameManager.cs` — 3 appels ajoutés

| Méthode | Appel ajouté | Déclencheur |
|---------|-------------|-------------|
| `OnEnemyKilled` | `NotifyXystUpdated(player.playerStats.Xyst)` | Si `xystGained > 0` après drop ennemi |
| `OnEnemyKilled` | `NotifyPendingRolls(player.skillManager.PendingRolls)` | Si `levelsGained > 0` (retour de `GainXP`) |
| `EndRun` | `NotifyRunEnded(summary)` | Juste après `BuildSummary()` |

#### `Assets/Plugins/WebGL/gamebridge.jslib` — logs console colorés

Chaque échange du pont est maintenant visible dans DevTools → Console :

| Couleur | Message | Quand |
|---------|---------|-------|
| 🟢 Vert | `[GameBridge] Unity → React` | Unity envoie un message au hub (type + payload) |
| 🔵 Bleu | `[GameBridge] Listener initialisé` | Démarrage du jeu — confirme que le jslib est chargé |
| 🟡 Orange | `[GameBridge] React → Unity` | React envoie un message à Unity (type + payload) |
| 🔴 Rouge | `[GameBridge] Listener retiré` | Destruction du GameBridge |

> Si le message bleu **n’apparaît pas** au chargement : le `.jslib` n’est pas dans le build → reconstruire.

---

## Fonctionnement du front actuel

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js — /play/[slug]  (page.tsx, parent)                 │
│  · Écoute window.addEventListener("message")                │
│  · UI : SkillsHubSection, RunSummaryPanel, classement         │
│  · GraphQL : mySave / upsertSave / submitScore              │
└───────────────────────────┬─────────────────────────────────┘
                            │ postMessage (même origine en local)
┌───────────────────────────▼─────────────────────────────────┐
│  iframe — /games/<slug>/index.html                            │
│  · GamingHub_SendToParent → parent.postMessage  (Unity→hub)  │
│  · __gamingHubBridge → SendMessage GameBridge   (hub→Unity)  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Build WebGL Unity (canvas + wasm)                            │
│  · GameBridge.cs + gamebridge.jslib (build déployé via deploy) │
└─────────────────────────────────────────────────────────────┘
```

### Fichiers concernés

| Fichier | Rôle |
|---------|------|
| [`frontend/src/app/play/[slug]/page.tsx`](../frontend/src/app/play/[slug]/page.tsx) | Page session : iframe, listener `message`, envoi vers le jeu, persistance |
| [`frontend/src/lib/game-bridge.ts`](../frontend/src/lib/game-bridge.ts) | Types, `parseGameBridgeMessage`, `postToGameIframe`, conversion save API |
| [`frontend/src/lib/save-client.ts`](../frontend/src/lib/save-client.ts) | `loadRunSave` / `persistUnitySave` via GraphQL |
| [`frontend/src/components/skills-offer-panel.tsx`](../frontend/src/components/skills-offer-panel.tsx) | Bloc « Skills & progression » sous le jeu |
| [`frontend/public/games/<slug>/index.html`](../frontend/public/games/roguesurvival/index.html) | Shell Unity + relais bidirectionnel JS |

### Séquence au chargement (implémentée)

1. L’utilisateur ouvre `/play/roguesurvival` (JWT requis dans `localStorage`).
2. Le catalogue est chargé (fallback local si le catalogue API est vide).
3. L’iframe charge `{NEXT_PUBLIC_GAME_HOST_URL}/roguesurvival/index.html`.
4. Au `onLoad` de l’iframe : `loadRunSave(slug)` via GraphQL.
   - Si une save existe → `LOAD_SAVE` envoyé à Unity + `currentXyst` initialisé depuis la BDD.
   - Sinon → `currentXyst` reste à `0` jusqu’à un message Unity.
5. Après `waitForUnityBridge`, le hub passe en `running` et envoie `LOAD_SAVE` si une save GraphQL existe.
6. `RUN_STATE_CHANGED` reste recommandé ; sans lui, `XYST_UPDATED` / `PENDING_ROLLS` activent aussi l’UI skills.

### Ce que fait le front quand il **reçoit** un message Unity

| Message | Action React |
|---------|----------------|
| `RUN_STATE_CHANGED` | Met à jour `runState` (`running` / `game-over`) |
| `PENDING_ROLLS` | Affiche le nombre de niveaux de skill disponibles |
| `SKILLS_OFFER` | Affiche les 3 cartes de choix ; `runState = paused` |
| `XYST_UPDATED` | Met à jour l’affichage `Xyst: N` (pas de sauvegarde immédiate en BDD) |
| `RUN_ENDED` | Résumé de run, `upsertSave`, `submitScore`, `currentXyst` depuis `totalXyst` |

Le parseur accepte aussi quelques **alias** (`level_up`, `totalXyst` dans le payload, etc.) — voir `normalizeBridgeType` dans `game-bridge.ts`.

### Ce que le front **envoie** au jeu (implémenté)

| Déclencheur UI | Message |
|----------------|---------|
| Après chargement save | `LOAD_SAVE` |
| Bouton « Lancer la sélection de skills » | `DRAW_SKILLS { count: 3 }` |
| Clic « Acquérir » / « Mythique » | `ACQUIRE_SKILL` / `ACQUIRE_MYTHICAL` |
| Bouton « Redémarrer la run » | `RESTART_RUN` |

Envoi technique : `postToGameIframe` → `iframe.contentWindow.postMessage` **et** `__gamingHubBridge(JSON)` dans l’iframe.

### Comportements UI importants

- Le bouton **« Lancer la sélection de skills »** est visible pendant toute la run (`running` ou `paused`), même si `PENDING_ROLLS` vaut `0` — pour permettre un tirage manuel quand Unity n’a pas encore notifié le hub.
- Sans `PENDING_ROLLS`, le libellé reste « Aucun niveau de skill disponible » jusqu’à réception du message ou jusqu’à un `SKILLS_OFFER` non vide.
### Limites actuelles du front (volontaires ou en attente Unity)

| Sujet | Comportement actuel |
|-------|---------------------|
| Source de vérité Xyst **pendant** la run | Unity (via `XYST_UPDATED`) — pas de lecture du HUD Unity |
| Sauvegarde Xyst en cours de run | Non : persistance seulement à `RUN_ENDED` (via `saveData`) |
| `runState` au démarrage | Passe à `running` quand Unity est prêt + à la réception des messages pont |
| Polling / fallback | Aucun : pas de requête périodique vers Unity |
| Validation JWT au refresh | Non : présence du token en `localStorage` seulement |

---

## Déploiement & maintenance Unity

### Checklist projet Unity (sources)

- [x] **`Plugins/WebGL/gamebridge.jslib`** — logs `[GameBridge]` dans la console iframe.
- [x] **`GameBridge.cs`** — singleton `GameBridge`, `OnWebMessage`, envoi via `Send` / `SendMessageToWeb`.
- [x] **`GameManager.cs`** — appels `NotifyXystUpdated`, `NotifyPendingRolls`, `NotifyRunEnded` (voir § Correctifs 2026-05-26).

### Checklist hub (fichiers servis)

- [x] **`roguesurvival/index.html`** — shell hub (ne pas remplacer par l’export Unity brut).
- [ ] À chaque **nouvel export Unity** : `node scripts/deploy-unity-webgl.mjs roguesurvival "<export>"` + hard refresh navigateur.

### Améliorations Unity encore recommandées

| Message | Statut | Note |
|---------|--------|------|
| `RUN_STATE_CHANGED { running }` | Recommandé | Le hub démarre l’UI sans lui, mais c’est le contrat propre |
| `RUN_STATE_CHANGED { game-over }` avant `RUN_ENDED` | Recommandé | Affichage cohérent de fin de run |
| `XYST_UPDATED` au spawn / `LOAD_SAVE` | Recommandé | Aligne le hub avec le Xyst Unity dès le début |

### Événements à envoyer vers le parent (quand)

| Événement gameplay | Message à envoyer | Quand |
|--------------------|-------------------|--------|
| Player spawn / run démarrée | `RUN_STATE_CHANGED { state: "running" }` | Après init ou `LOAD_SAVE` appliqué |
| Level up (roll dispo) | `PENDING_ROLLS { count: N }` | À chaque changement de rolls disponibles |
| Xyst modifié | `XYST_UPDATED { xyst: N }` | À **chaque** changement (pickup, achat, dépense) — pas seulement après skill |
| Réponse tirage | `SKILLS_OFFER { skills: [...] }` | Après `DRAW_SKILLS` (tableau vide si aucun roll) |
| Mort du joueur | `RUN_STATE_CHANGED { state: "game-over" }` puis `RUN_ENDED { … }` | Fin de run + `saveData` complet |

### `gamebridge.jslib` (référence)

Le `index.html` du hub expose déjà `window.GamingHub_SendToParent`. Le plugin Unity doit l’appeler :

```javascript
mergeInto(LibraryManager.library, {
  GamingHub_SendToParent: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    if (typeof window.GamingHub_SendToParent === "function") {
      window.GamingHub_SendToParent(json);
    } else if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(JSON.parse(json), window.location.origin);
      } catch (e) {}
    }
  },
});
```

### `GameBridge.cs` (exemple d’appels)

```csharp
// Envoi vers React (à appeler depuis la logique gameplay)
void NotifyPendingRolls(int count) =>
    SendToWeb(JsonUtility.ToJson(new {
        type = "PENDING_ROLLS",
        payload = new { count }
    }));

void NotifyXyst(int xyst) =>
    SendToWeb(JsonUtility.ToJson(new {
        type = "XYST_UPDATED",
        payload = new { xyst }
    }));
```

### Après modification Unity

1. Exporter le build WebGL (dossier avec `Build/` + `TemplateData/`).
2. `node scripts/deploy-unity-webgl.mjs roguesurvival "<chemin-export>"`.
3. Hard refresh `/play/roguesurvival` — logs `[GameBridge] Unity → React` dans la console iframe.

### Vérification rapide

| Observation | Interprétation |
|-------------|----------------|
| Console iframe : `[Enemy]`, `[PlayerCombat]`… | Jeu OK, **pas** le pont |
| Xyst / rolls à 0 côté hub mais OK in-game | `SendToWeb` jamais appelé ou build sans jslib |
| Bouton skill sans effet | Double envoi React→Unity (corrigé : un seul canal) ou `OnWebMessage` absent |
| `Unchecked runtime.lastError: Receiving end does not exist` | Souvent une **extension Chrome**, pas le GameBridge |
| Bouton skill + `DRAW_SKILLS` sans réponse | `OnWebMessage` absent ou `GameBridge` mal nommé dans la scène |

---

## Vue d'ensemble

Le jeu Unity tourne en **WebGL** embarqué dans une page React. La communication bidirectionnelle passe par `window.postMessage` via un fichier `.jslib`. Le composant Unity responsable est `GameBridge` (singleton persistant).

Si Unity n’envoie aucun message pont, le hub reste jouable (bouton skill manuel après chargement Unity) mais **Xyst / rolls** restent à zéro côté UI.

---

## États de jeu

Unity notifie React de l'état courant via `RUN_STATE_CHANGED` :

| État | Moment |
|---|---|
| `"running"` | Le player est enregistré (run en cours) |
| `"game-over"` | Le player est mort |

---

## Messages Unity → React

Tous les messages ont la forme :
```json
{ "type": "TYPE", "payload": { ... } }
```

### `RUN_STATE_CHANGED`
Changement d'état de la run.
```json
{
  "type": "RUN_STATE_CHANGED",
  "payload": { "state": "running" | "game-over" }
}
```

---

### `PENDING_ROLLS`
Nombre de rolls de skills disponibles (non encore utilisé automatiquement — à déclencher manuellement si besoin).
```json
{
  "type": "PENDING_ROLLS",
  "payload": { "count": 2 }
}
```

---

### `SKILLS_OFFER`
Envoyé après un `DRAW_SKILLS` de React. Contient 3 skills à afficher pour le choix.
```json
{
  "type": "SKILLS_OFFER",
  "payload": {
    "skills": [
      {
        "skillId": "raw_power",
        "displayName": "Raw Power",
        "description": "Your attacks deal <color=#60a5fa>+20%</color> more damage.",
        "category": "Destruction",
        "rarity": "Rare",
        "stacks": 0,
        "maxStacks": 5,
        "canBeMythical": true,
        "mythicalXystCost": 1000,
        "rarityHistory": []
      }
    ]
  }
}
```
> Si aucun roll disponible, `skills` est un tableau vide `[]`.

---

### `XYST_UPDATED`
Met à jour l’affichage **Xyst** sous le jeu. Le front **ne persiste pas** ce message en base (seulement `RUN_ENDED.saveData` ou la save initiale au chargement).

**Recommandation** : envoyer à chaque changement de Xyst pendant la run (pickup, dépense, fin de skill), pas uniquement après `ACQUIRE_SKILL`.

```json
{
  "type": "XYST_UPDATED",
  "payload": { "xyst": 350 }
}
```

---

### `RUN_ENDED`
Envoyé quand le player meurt. Contient le résumé complet + les données de sauvegarde.
```json
{
  "type": "RUN_ENDED",
  "payload": {
    "levelReached": 7,
    "totalXP": 2340,
    "enemiesKilled": 23,
    "xystEarned": 180,
    "totalXyst": 530,
    "runDuration": 342.5,
    "playtimeMinutes": 5.71,
    "score": 5800,
    "skillsAcquired": [
      "Raw Power x2 (Rare)",
      "Vampiric x1 (Uncommon)"
    ],
    "topRaritySkill": "Raw Power (Rare)",
    "topStackedSkill": "Raw Power x2",
    "totalDamageDealt": 12450,
    "totalDamageTaken": 380,
    "biggestHit": 847,
    "critsLanded": 34,
    "saveData": {
      "level": 7,
      "xp": 2340,
      "xyst": 530,
      "ownedSkills": [
        {
          "skillId": "raw_power",
          "rarityHistory": [2, 2]
        },
        {
          "skillId": "vampiric",
          "rarityHistory": [1]
        }
      ]
    }
  }
}
```
> **`saveData`** : c'est ce blob JSON qu'il faut sauvegarder en base (MongoDB). Il sera renvoyé tel quel dans `LOAD_SAVE`.

---

## Messages React → Unity

Envoyés via le listener WebGL `_InitMessageListener` (dans `gamebridge.jslib`) : le hub appelle `__gamingHubEnqueue` / `postMessage` sur l’iframe avec un objet `{ type, payload }`. Le jslib fait ensuite `SendMessage(gameObjectName, methodName, JSON.stringify(event.data))` avec les noms enregistrés au démarrage par `GameBridge.cs` — **ne pas** hardcoder `"GameBridge"` dans le shell HTML.

### `LOAD_SAVE`
Restaure l'état d'une run précédente. À envoyer au démarrage si une save existe.
```json
{
  "type": "LOAD_SAVE",
  "payload": {
    "level": 7,
    "xp": 2340,
    "xyst": 530,
    "ownedSkills": [
      { "skillId": "raw_power", "rarityHistory": [2, 2] },
      { "skillId": "vampiric",  "rarityHistory": [1] }
    ]
  }
}
```
> Unity répond avec `RUN_STATE_CHANGED { state: "running" }`.

---

### `DRAW_SKILLS`
Demande à Unity de tirer 3 skills (consomme 1 roll). Unity répond avec `SKILLS_OFFER`.
```json
{
  "type": "DRAW_SKILLS",
  "payload": { "count": 3 }
}
```
> Si aucun roll disponible, Unity répond `SKILLS_OFFER` avec `skills: []`.

---

### `ACQUIRE_SKILL`
Le joueur choisit un skill parmi les 3 proposés.
```json
{
  "type": "ACQUIRE_SKILL",
  "payload": { "skillId": "raw_power" }
}
```
> Unity applique l'effet immédiatement et répond avec `XYST_UPDATED`.

---

### `ACQUIRE_MYTHICAL`
Achète définitivement un skill Mythical avec du Xyst (permanent cross-run).
```json
{
  "type": "ACQUIRE_MYTHICAL",
  "payload": { "skillId": "raw_power" }
}
```
> Échoue silencieusement si pas assez de Xyst. Unity répond avec `XYST_UPDATED`.

---

### `RESTART_RUN`
Relance une nouvelle run (reset complet sauf skills Mythical).
```json
{
  "type": "RESTART_RUN",
  "payload": {}
}
```

---

## Système de Skills

### Catégories
| Catégorie | Description |
|---|---|
| `Destruction` | Dégâts, vitesse d'attaque, critiques, combos |
| `Resilience` | Vie max, réduction de dégâts, soins, régénération |
| `Agility` | Vitesse, saut, contrôle aérien |
| `Growth` | XP, Xyst, drop de skills rares |
| `Mastery` | Lifesteal, thorns, iframes, timing parfait |
| `MartialArts` | Déblocage d'attaques combo |
| `Awakening` | Déblocage de capacités (double jump, dash, etc.) |

### Raretés et multiplicateurs de valeur
| Rareté | Multiplicateur | Probabilité de drop |
|---|---|---|
| Common | ×1.0 | 75% |
| Uncommon | ×1.5 | 30% |
| Rare | ×2.0 | 15% |
| Epic | ×3.0 | 4% |
| Legendary | ×4.0 | 1% |
| Mythical | ×1.0 | ~1% (ou achat Xyst) |

> Les skills Mythical sont **permanents** : ils survivent aux resets de run.

### Liste des skills STAT_BONUS
| Skill ID | Display Name | Valeur/stack | Max Stacks |
|---|---|---|---|
| `swift_strikes` | Swift Strikes | +5% attack speed | 5 |
| `raw_power` | Raw Power | +10% damage | 5 |
| `precision` | Precision | +3.5% crit chance | 5 |
| `lethal_strike` | Lethal Strike | ×0.15 crit multiplier | 5 |
| `perfect_timing` | Perfect Timing | +0.0125s combo window | 5 |
| `rapid_ticks` | Rapid Ticks | -0.15 tick interval | 5 |
| `combo_fury` | Combo Fury | +0.02 ramp rate | 5 |
| `relentless` | Relentless | +0.15s reset delay | 5 |
| `vitality` | Vitality | +10% max HP | 5 |
| `fortitude` | Fortitude | -2.5% damage taken | 5 |
| `recovery` | Recovery | +5% healing received | 5 |
| `regeneration` | Regeneration | +1 HP/sec | 5 |
| `fleet_footed` | Fleet Footed | +5% move speed | 4 |
| `high_jump` | High Jump | +5% jump height | 5 |
| `air_control` | Air Control | +10% air control | 5 |
| `scholar` | Scholar | +10% XP gain | 5 |
| `fortune` | Fortune | +10% Xyst drops | 5 |
| `lucky_find` | Lucky Find | +5% rare drop boost | 5 |
| `fates_favor` | Fate's Favor | +0.5% mythical chance | 5 |
| `second_chance` | Second Chance | +1 reroll | 3 |
| `frame_perfect` | Frame Perfect | +0.0125s perfect window | 5 |
| `vampiric` | Vampiric | +2.5% lifesteal | 5 |
| `retaliation` | Retaliation | +5% thorns damage | 5 |
| `evasion_master` | Evasion Master | +0.05s iframes | 5 |

### Skills ABILITY_UNLOCK
| Skill ID | Display Name | Prérequis |
|---|---|---|
| `double_jump` | Double Jump | — |
| `slide` | Slide | — |
| `ground_dash` | Ground Dash | — |
| `air_dash` | Air Dash | — |
| `air_stall` | Air Stall | — |
| `wall_slide` | Wall Slide | — |
| `wall_jump` | Wall Jump | Wall Slide |

### Skills COMBO_UNLOCK
`kick_1`, `kick_2`, `uppercut`, `punch_running`, `sword_attack2`, `sword_attack3`, `sword_air_attack1`, `sword_air_attack2`, `sword_air_drop`

---

## Format de sauvegarde (MongoDB)

```json
{
  "userId": "...",
  "saveData": {
    "level": 7,
    "xp": 2340,
    "xyst": 530,
    "ownedSkills": [
      { "skillId": "raw_power", "rarityHistory": [2, 2] },
      { "skillId": "wall_jump", "rarityHistory": [3] }
    ]
  }
}
```

> `rarityHistory` : tableau d'entiers correspondant à l'enum `SkillRarity` — `0=Common, 1=Uncommon, 2=Rare, 3=Epic, 4=Legendary, 5=Mythical`. Chaque entrée = 1 stack acquis à cette rareté.

---

## Flow complet d'une session

### Flux cible (contrat complet)

```
1. Page chargée (/play/[slug])
   └─ React : GraphQL mySave
      ├─ Save trouvée → LOAD_SAVE → Unity (+ XYST_UPDATED optionnel)
      └─ Pas de save → Unity démarre frais
   └─ Unity → RUN_STATE_CHANGED { state: "running" }

2. Pendant la run
   └─ Unity (interne) : XP, Xyst, level up, HUD
   └─ Unity → PENDING_ROLLS { count } à chaque level up
   └─ Unity → XYST_UPDATED { xyst } à chaque changement de Xyst
   └─ Joueur clique « Lancer la sélection » sur le hub
      └─ React → DRAW_SKILLS
      └─ Unity → SKILLS_OFFER
      └─ Joueur choisit → React → ACQUIRE_SKILL
      └─ Unity → XYST_UPDATED (si le coût change le total)

3. Mort
   └─ Unity → RUN_STATE_CHANGED { game-over }
   └─ Unity → RUN_ENDED + saveData
   └─ React : upsertSave + submitScore + RunSummaryPanel

4. Restart
   └─ React → RESTART_RUN
   └─ React → LOAD_SAVE (mythicals / xyst persistants)
```

### Comportement hub si Unity est muet

```
LOAD_SAVE envoyé après waitForUnityBridge (pas au simple onLoad iframe)
UI « running » dès Unity prêt — bouton skill disponible
XYST_UPDATED / PENDING_ROLLS mettent à jour l’affichage dès réception
```

---

## Rolls disponibles

Les rolls sont calculés côté Unity : `PendingRolls = (currentLevel - 1) - rollsUsed`.

### Flux skills (implémenté côté hub — Option A)

```
1. Unity → PENDING_ROLLS { count: N }     (level-up, N > 0)
2. Hub   → efface l’ancienne offre → DRAW_SKILLS { count: 3 }   (automatique)
3. Unity → SKILLS_OFFER { skills: […3…] }
4. Joueur choisit → Hub → ACQUIRE_SKILL { skillId }
5. Hub efface les cartes ; si Unity renvoie PENDING_ROLLS { count > 0 } → retour à l’étape 2
6. Si count === 0 → message « Plus de level-up de skill disponible »
```

Évolution Unity possible (moins d’allers-retours) : envoyer `SKILLS_OFFER` directement au level-up (sans attendre `DRAW_SKILLS`). Le hub affichera les cartes sans l’étape 2.

### Shell iframe : variable `unityInstance`

Le `gamebridge.jslib` appelle `unityInstance.SendMessage(...)` (variable globale). Le `index.html` du hub doit exposer :

```javascript
window.unityInstance = unityInstance;
```

Sans cela : `ReferenceError: unityInstance is not defined` sur **React → Unity** (RESTART_RUN, DRAW_SKILLS, etc.) alors que **Unity → React** fonctionne.

**Côté front (déjà en place)** : bouton « Lancer la sélection de skills » + tirage auto quand `PENDING_ROLLS` augmente.

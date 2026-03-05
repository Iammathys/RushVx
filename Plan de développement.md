# Plan de développement – Application d’édition vidéo verticale (9:16)

**Références :** Cahier des charges 2, Structure_2 (arborescence et snippets), guidelines de développement (adaptées au projet).

---

## 1. Vue d’ensemble et principes directeurs

### 1.1 Objectif du plan
Ce plan détaille les phases, tâches, ordre d’exécution, risques et garde-fous pour livrer le **MVP** de l’application d’édition vidéo verticale (format Reels/Shorts/Stories), puis préparer les extensions (publication plateformes, rendu serveur, IA).

### 1.2 Principes
- **Livraison incrémentale** : chaque phase livre une partie testable et déployable.
- **Risques identifiés** : OOM navigateur, COOP/COEP, compatibilité ffmpeg.wasm, limites plateformes — chaque risque a une atténuation explicite.
- **Séparation stricte** : client (Next.js) / API (routes Next.js) / données (Supabase) ; aucune clé secrète côté client.
- **Validations dynamiques** : règles plateformes (durée, fps, codec) dans un JSON versionné, pas en dur dans le code.

---

## 2. Prérequis et environnement

### 2.1 Outils obligatoires
| Outil | Version cible | Usage |
|-------|----------------|-------|
| Node.js | 20 LTS | Build et runtime Next.js |
| npm | 10+ | Gestion des dépendances |
| Git | 2.x | Versionnement |
| Compte Supabase | — | Auth, DB, Storage |
| (Optionnel) Cursor / VS Code | — | IDE avec support TypeScript |

### 2.2 Environnement Supabase (avant développement front)
- Créer le projet Supabase.
- Créer les buckets **privés** : `assets`, `renders`.
- Exécuter dans l’ordre : `db/schema.sql` → `db/policies.sql` → `db/storage_policies.sql`.
- Vérifier que RLS est actif sur les tables et sur `storage.objects`.
- Noter : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` (uniquement serveur).

### 2.3 Variables d’environnement
- Fichier **non versionné** : `.env.local` (copie de `.env.example`).
- **Client uniquement** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Serveur uniquement** : `SUPABASE_SERVICE_ROLE`, `OPENAI_API_KEY` (optionnel, pour IA).
- **Règle absolue** : jamais exposer `SUPABASE_SERVICE_ROLE` ni `OPENAI_API_KEY` au client ou dans les logs.

### 2.4 Problèmes anticipés – Prérequis
| Problème | Cause possible | Atténuation |
|----------|----------------|-------------|
| RLS bloque toutes les requêtes | Policies mal liées à `auth.uid()` ou buckets mal nommés | Tester en SQL avec `auth.uid()` simulé ; vérifier noms des buckets dans les policies. |
| Signed URLs qui échouent | CORS ou policies storage trop restrictives | Vérifier CORS sur le bucket ; tester `createSignedUploadUrl` depuis l’API puis PUT depuis le client. |
| FFmpeg non trouvé après `npm i` | Script `copy-ffmpeg-core.mjs` non exécuté ou mauvais chemin | Vérifier `postinstall` dans `package.json` ; s’assurer que `public/ffmpeg/` contient `ffmpeg-core.js`, `.wasm`, `.worker.js`. |

---

## 3. Phase 0 – Fondations (squelette et config)

**Objectif :** Repo clonable, build OK, FFmpeg chargé côté client, COOP/COEP actifs, santé API.

### 3.1 Tâches détaillées

| # | Tâche | Détail | Livrable |
|---|--------|--------|----------|
| 0.1 | Initialiser le repo | Créer `vertical-video-app/`, sous-dossier `apps/web/`, structure selon `Structure_2.txt`. | Arborescence conforme. |
| 0.2 | `package.json` | Dépendances exactes (Next 14.2.5, React 18.2, @ffmpeg/ffmpeg ^0.12.7, @ffmpeg/util ^0.12.1, zustand, wavesurfer.js, @supabase/supabase-js, tailwindcss, etc.). Script `postinstall`: `node ./scripts/copy-ffmpeg-core.mjs`. | `npm i` et `npm run build` sans erreur. |
| 0.3 | Script `copy-ffmpeg-core.mjs` | Copier depuis `node_modules/@ffmpeg/core/dist/umd` vers `public/ffmpeg/` : `ffmpeg-core.js`, `ffmpeg-core.wasm`, `ffmpeg-core.worker.js`. | Fichiers présents dans `public/ffmpeg/` après install. |
| 0.4 | `next.config.js` | Headers globaux : `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` sur `source: '/(.*)'`. | Headers visibles en dev et en build. |
| 0.5 | `lib/ffmpeg.ts` | Singleton `getFFmpeg()`, chargement avec URLs `/ffmpeg/ffmpeg-core.*` (self-host). Pas encore de `renderVideo` si on décale en phase suivante. | Pas d’erreur CORS ou 404 sur le chargement WASM. |
| 0.6 | `lib/supabaseClient.ts` & `lib/supabaseAdmin.ts` | Client anon avec `persistSession: true` ; admin avec `SUPABASE_SERVICE_ROLE` (côté serveur uniquement). | Import possible depuis app et API. |
| 0.7 | Route `GET /api/health` | Retourner `{ ok: true }` ou équivalent. | Utilisable pour checks de déploiement. |
| 0.8 | Page d’accueil minimale | `app/page.tsx` avec titre et lien (même factice) vers éditeur. | `npm run dev` → page visible sur :3000. |
| 0.9 | Tailwind + globals | `styles/globals.css`, config Tailwind/PostCSS. Optionnel : base shadcn/ui. | Styles appliqués. |

### 3.2 Ordre recommandé
0.1 → 0.2 → 0.3 → 0.4 → 0.5 → 0.6 → 0.7 → 0.8 → 0.9. Les étapes 0.5 et 0.6 peuvent être parallélisées après 0.4.

### 3.3 Critères d’acceptation Phase 0
- [ ] `npm i` puis `npm run build` réussis.
- [ ] `npm run dev` affiche la page d’accueil sans erreur console.
- [ ] En ouvrant une page qui appelle `getFFmpeg()`, le WASM se charge depuis `/ffmpeg/` (pas de CDN externe).
- [ ] Les en-têtes COOP/COEP sont bien envoyés (vérification dans l’onglet Network).
- [ ] `GET /api/health` retourne 200.

### 3.4 Problèmes anticipés – Phase 0
| Problème | Piste de résolution |
|----------|----------------------|
| SharedArrayBuffer undefined ou erreur COOP/COEP | Vérifier que les headers sont bien appliqués à toutes les routes (y compris _next/static). Si hébergement externe, configurer COOP/COEP au niveau CDN/hosting. |
| 404 sur ffmpeg-core.* | Vérifier que `public/ffmpeg/` est bien servi à la racine ; que le script copie depuis le bon chemin (umd). |
| Build échoue (TypeScript) | S’assurer que `@ffmpeg/ffmpeg` et `@ffmpeg/util` ont des types ou que les types sont déclarés en `*.d.ts` si besoin. |

---

## 4. Phase 1 – Données et API métier

**Objectif :** Modèle de données opérationnel, API projets/assets/upload, validators servis, pas encore d’UI éditeur complète.

### 4.1 Schéma et politiques (déjà décrits dans Structure_2)
- **profiles** : id (= auth.users.id), display_name, created_at.
- **projects** : id, owner_id, title, status (draft|rendering|rendered), duration_ms, fps, aspect (9:16), timestamps.
- **assets** : id, project_id, type (video|audio), storage_path, original_name, duration_ms, metadata.
- **timelines** : id, project_id, video_asset_id, audio_asset_id, edits (jsonb).
- **exports** : id, project_id, target, status, storage_path, external_video_id, log, created_at.

RLS : toutes les tables en `owner_id = auth.uid()` ou via jointure sur `projects.owner_id`.

### 4.2 Tâches détaillées

| # | Tâche | Détail | Livrable |
|---|--------|--------|----------|
| 1.1 | Fichier `config/validators.platforms.json` | Entrées YOUTUBE_SHORTS, INSTAGRAM_REELS, TIKTOK (maxDurationSec, width, height, fps[], vCodec, aCodec, fastStart si pertinent). | JSON valide et cohérent avec le cahier des charges. |
| 1.2 | Route `GET /api/validators` | Lire le JSON et le renvoyer. Pas de log du contenu. | Front pourra consommer les règles pour warnings. |
| 1.3 | Route `POST /api/upload/create-signed-url` | Body : `filename`, `bucket` (défaut `assets`), `pathPrefix`. Générer un path sécurisé (ex. `uuid-filename`), appeler `supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path)`. Retourner `{ url, path }`. Gestion d’erreur 400. | Client pourra uploader en PUT vers l’URL signée. |
| 1.4 | Route `POST /api/projects` | Créer un projet (owner_id = auth depuis cookie/header si déjà en place, ou temporairement en dur pour tests). Retourner `{ id, ... }`. | Projet créé en DB. |
| 1.5 | Route `GET /api/projects` | Lister les projets de l’utilisateur (RLS). | Liste des projets. |
| 1.6 | Route `GET /api/projects/[id]` | Détail projet + éventuellement timeline et assets (selon besoin). 404 si non trouvé ou pas le propriétaire. | Éditeur pourra charger un projet. |
| 1.7 | Route `PATCH /api/projects/[id]` | Mise à jour titre, status, duration_ms, etc. Sauvegarder aussi la timeline (video_asset_id, audio_asset_id, edits). | Sauvegarde des modifications. |
| 1.8 | Création d’assets après upload | Après un upload réussi (client PUT vers signed URL), appeler une route ou logique pour enregistrer une ligne dans `assets` (project_id, type, storage_path, original_name, duration_ms si disponible). Optionnel : route dédiée `POST /api/projects/[id]/assets`. | Table `assets` alignée avec le Storage. |

### 4.3 Ordre recommandé
1.1 → 1.2 ; 1.3 en parallèle avec 1.4–1.7 ; 1.8 après 1.3.

### 4.4 Critères d’acceptation Phase 1
- [ ] Création d’un projet via API et apparition en DB.
- [ ] Obtention d’une signed URL, upload d’un fichier test (MP4/MP3) réussi dans le bucket.
- [ ] GET /api/validators retourne le JSON des plateformes.
- [ ] PATCH projet met à jour la timeline (edits jsonb).

### 4.5 Problèmes anticipés – Phase 1
| Problème | Piste de résolution |
|----------|----------------------|
| auth.uid() null dans les routes | Next.js : récupérer la session Supabase côté serveur (cookie) et passer l’utilisateur aux appels Supabase ; sinon utiliser un middleware d’auth. |
| Signed URL expirée ou refusée | Vérifier la durée de validité ; s’assurer que le client envoie bien le fichier en PUT avec le bon Content-Type. |
| RLS empêche l’insert en `assets` | Policy INSERT sur `assets` doit autoriser l’insert quand le `project_id` appartient à `auth.uid()` (via projects). |

---

## 5. Phase 2 – Import et gestion des médias (landing + upload)

**Objectif :** Page d’accueil avec import MP4/MP3 (drag-and-drop + bouton), upload vers Supabase, création/liaison projet et assets.

### 5.1 Tâches détaillées

| # | Tâche | Détail | Livrable |
|---|--------|--------|----------|
| 2.1 | Landing `app/page.tsx` | Zone drop + bouton "Choisir des fichiers". Accepter `.mp4`, `.mp3`. Validation côté client (type MIME ou extension). | Import déclenché. |
| 2.2 | Flux upload | Pour chaque fichier : 1) POST /api/upload/create-signed-url (filename, bucket, pathPrefix avec userId ou projectId), 2) PUT du blob vers l’URL signée, 3) enregistrement asset (route ou logique existante). | Fichiers dans Storage + lignes assets. |
| 2.3 | Création projet au premier import | Si pas de projet, POST /api/projects puis associer les assets au projet. Redirection vers `/editor/[projectId]`. | Un projet par session d’import (ou logique métier définie). |
| 2.4 | Gestion d’erreurs et feedback | Messages clairs : fichier trop lourd, type non supporté, échec upload. Pas d’exposition de détails serveur. | UX robuste. |
| 2.5 | (Optionnel) Limite taille / durée | Limiter la taille fichier (ex. 500 Mo) ou durée (ex. 5 min) pour éviter OOM en phase d’édition/rendu. Afficher un warning au-delà. | Réduction risque OOM. |

### 5.2 Ordre recommandé
2.1 → 2.2 → 2.3 → 2.4 → 2.5 (optionnel).

### 5.3 Critères d’acceptation Phase 2
- [ ] Glisser-déposer un MP4 et un MP3 crée un projet et enregistre les assets.
- [ ] Redirection vers l’éditeur avec l’id du projet.
- [ ] Fichiers visibles dans le bucket Supabase sous le bon path.

### 5.4 Problèmes anticipés – Phase 2
| Problème | Piste de résolution |
|----------|----------------------|
| Fichiers très lourds (timeout, mémoire) | Limiter la taille côté client ; pour plus tard prévoir upload résumable (Tus/Uppy) comme indiqué dans le cahier des charges. |
| CORS sur le PUT vers signed URL | Supabase signe une URL qui accepte les requêtes du domaine ; vérifier l’origine dans les options CORS du bucket. |

---

## 6. Phase 3 – Éditeur (lecteur, timeline, musique)

**Objectif :** Page éditeur avec lecteur 9:16, timeline (WaveSurfer), panneau musique (offset, volume, fades), sauvegarde des edits en JSON.

### 6.1 Store (Zustand)
- **editorStore** : projectId, videoAsset, audioAsset, edits (video: { start_ms, end_ms }, audio: { offset_ms, gain_db, fade_in_ms, fade_out_ms }), état de chargement, erreurs.
- Actions : setVideo, setAudio, setTrim, setAudioParams, save (appel PATCH /api/projects/[id]).

### 6.2 Tâches détaillées

| # | Tâche | Détail | Livrable |
|---|--------|--------|----------|
| 3.1 | Page `app/editor/[projectId]/page.tsx` | Charger le projet (GET /api/projects/[id]), les assets (ou inclus dans le projet). Si 404, redirection ou message. | Éditeur s’affiche avec les médias du projet. |
| 3.2 | Composant `VideoPlayer.tsx` | Balise `<video>` 9:16 (ratio forcé), letterboxing si nécessaire. Contrôles play/pause, sync avec la timeline. Source vidéo depuis URL signée (Supabase) ou blob. | Prévisualisation fidèle. |
| 3.3 | Composant `Timeline.tsx` | Intégration WaveSurfer.js pour la piste vidéo (ou audio principale). Callbacks : scrub (position), zoom léger. Marqueurs début/fin (start_ms, end_ms) pour le trim. | Trim visuel et temporel. |
| 3.4 | Composant `MusicPanel.tsx` | Sélection/upload MP3 si pas déjà fait. Champs : offset (ms), volume (dB), fade in (ms), fade out (ms). Préécoute possible via Web Audio + `<audio>` pour un mix approximatif. | Paramètres musique modifiables. |
| 3.5 | Synchronisation préécoute | Lors du play, démarrer la vidéo et l’audio avec l’offset ; appliquer le gain. Pas obligatoire d’avoir un mix parfait en préécoute (le rendu final sera fait par FFmpeg). | Expérience cohérente. |
| 3.6 | Composant `BottomNav.tsx` | Navigation fixe : Stats, Editer, Export (liens ou onglets). | Navigation claire. |
| 3.7 | Sauvegarde | Bouton "Enregistrer" qui envoie PATCH avec timeline (video_asset_id, audio_asset_id, edits). Indicateur "Modifications non enregistrées" / "Enregistré". | Persistance des edits. |
| 3.8 | Raccourcis clavier (accessibilité) | Espace : play/pause ; J / L : -10 s / +10 s (comme dans le cahier des charges). Gestion du focus. | Accessibilité améliorée. |

### 6.3 Ordre recommandé
3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8.

### 6.4 Critères d’acceptation Phase 3
- [ ] Ouverture d’un projet existant affiche la vidéo et la timeline.
- [ ] Trim (début/fin) modifiable et reflété dans le store puis en sauvegarde.
- [ ] Musique : offset, volume, fades modifiables et sauvegardés.
- [ ] Préécoute synchronisée (au moins approximative).
- [ ] Enregistrer met à jour `timelines.edits` en base.

### 6.5 Problèmes anticipés – Phase 3
| Problème | Piste de résolution |
|----------|----------------------|
| WaveSurfer et React (re-renders) | Utiliser une ref pour l’instance WaveSurfer, ne pas recréer à chaque render ; cleanup dans useEffect. |
| URLs signées expirées | Régénérer une signed URL pour la lecture (GET) si l’éditeur reste ouvert longtemps ; durée de vie raisonnable (ex. 1 h). |
| Très longues vidéos (mémoire) | Limiter la durée en phase d’import ou afficher un avertissement ; pour le rendu, voir Phase 4 (OOM). |

---

## 7. Phase 4 – Export et rendu (ffmpeg.wasm)

**Objectif :** Rendu 1080×1920, 30 fps, H.264/AAC, -movflags +faststart dans le navigateur ; téléchargement du MP4 ; statistiques basiques (durée, temps de rendu).

### 7.1 Tâches détaillées

| # | Tâche | Détail | Livrable |
|---|--------|--------|----------|
| 4.1 | Fonction `renderVideo` dans `lib/ffmpeg.ts` | Implémenter selon le snippet Structure_2 : entrées videoFile, audioFile (optionnel), startMs, endMs, audioOffsetMs, volumeDb. Trim avec -ss/-to ; filtre volume ; scale 1080:1920 force_original_aspect_ratio=decrease ; -movflags +faststart. Sortie blob MP4. | Blob MP4 valide. |
| 4.2 | Page ou section Export | `app/export/[projectId]/page.tsx` ou panneau Export dans l’éditeur. Choix du preset (vertical 1080×1920, 30 fps). Bouton "Rendre". | Déclenchement du rendu. |
| 4.3 | Appel au rendu côté client | Charger la vidéo et l’audio depuis les URLs signées (fetch → blobs), appeler `renderVideo` avec les paramètres de la timeline. Afficher une barre de progression ou un état "Rendu en cours…" (ffmpeg.wasm peut exposer des events de progression). | Rendu exécuté dans le navigateur. |
| 4.4 | Téléchargement | Une fois le blob reçu, déclencher un téléchargement (object URL + <a download>). | Fichier téléchargé. |
| 4.5 | Validations et warnings | Avant rendu, comparer durée/fps/codec aux règles du JSON validators. Afficher des warnings si dépassement (ex. durée > 60 s pour Shorts). Ne pas bloquer le rendu. | Utilisateur informé des limites plateformes. |
| 4.6 | Statistiques | Enregistrer ou afficher : durée finale (s), fps, taille du fichier exporté, temps de rendu (secondes). Optionnel : envoi vers `analytics_events` ou table dédiée. | Stats visibles (page Stats ou Export). |
| 4.7 | Gestion erreurs rendu | Capturer les erreurs FFmpeg (timeout, OOM). Message utilisateur clair : "Rendu impossible, essayez une vidéo plus courte ou réessayez." | Pas de crash silencieux. |

### 7.2 Ordre recommandé
4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7.

### 7.3 Critères d’acceptation Phase 4
- [ ] Rendu d’un projet avec vidéo + musique produit un MP4 lisible, 1080×1920, 30 fps.
- [ ] Le fichier a le MOOV en tête (faststart) pour ingestion plateformes.
- [ ] Téléchargement fonctionne.
- [ ] Warnings validators affichés si hors limites.
- [ ] Temps de rendu < 60 s pour un clip de 20–30 s sur machine moyenne (objectif KPI du CDC).

### 7.4 Problèmes anticipés – Phase 4
| Problème | Piste de résolution |
|----------|----------------------|
| OOM (Out of Memory) navigateur | Limiter la durée/size en amont ; afficher un message explicite ; roadmap : fallback rendu serveur pour longues vidéos. |
| Rendu très lent | COOP/COEP activés pour threads WASM ; self-host FFmpeg pour éviter blocages CDN. Si toujours lent, guider l’utilisateur (réduire résolution source ou durée). |
| Blob trop gros pour mémoire | Pour de très longs exports, envisager un rendu par chunks ou report vers serveur (hors MVP). |
| Fades non appliqués dans le snippet actuel | Le snippet Structure_2 n’inclut pas les fades ; étendre la commande FFmpeg avec afade (in/out) selon fade_in_ms/fade_out_ms. |

---

## 8. Phase 5 – Statistiques, polish et tests

**Objectif :** Page Stats cohérente, messages d’erreur explicites, tests E2E et critères d’acceptation MVP validés.

### 8.1 Tâches détaillées

| # | Tâche | Détail | Livrable |
|---|--------|--------|----------|
| 5.1 | Page `app/stats/[projectId]/page.tsx` | Afficher durée finale, fps, taille export, temps de rendu (depuis exports ou calcul côté client). Données anonymisées si analytics. | Page Stats fonctionnelle. |
| 5.2 | Messages d’erreur explicites | Partout : upload, sauvegarde, rendu. Jamais exposer stack trace ou clés. Phrases en français. | UX fiable. |
| 5.3 | Tests unitaires (optionnel mais recommandé) | Parsers edits, mapping presets/validators, helpers temps (ms ↔ s). | Régression limitée. |
| 5.4 | Tests d’intégration | Upload signé → enregistrement asset ; sauvegarde timeline ; export MP4 non vide. | Confiance sur le flux. |
| 5.5 | Tests E2E (Playwright) | Scénario : Import MP4 → Ajouter MP3 (offset/volume/fades) → Enregistrer → Export → Télécharger. Vérifier que le fichier téléchargé est non vide et lisible. | Critère d’acceptation MVP couvert. |
| 5.6 | Compatibilité navigateurs | Tester Chrome, Edge, Firefox, Safari récents avec COOP/COEP. Documenter les limitations éventuelles (ex. Safari). | Doc ou README à jour. |
| 5.7 | README | Installation, variables d’env, lancement, architecture, Supabase (buckets, RLS), COOP/COEP, self-host FFmpeg. | Onboarding clair. |

### 8.2 Critères d’acceptation Phase 5
- [ ] Page Stats affiche les bonnes données.
- [ ] Pipeline E2E vert : Import → Edit → Export → Download.
- [ ] README permet à un nouveau dev de lancer le projet.

### 8.3 Problèmes anticipés – Phase 5
| Problème | Piste de résolution |
|----------|----------------------|
| E2E flaky (timeouts) | Rendu peut être long ; augmenter les timeouts Playwright pour l’étape d’export ; ou mocker FFmpeg en E2E pour un rendu instantané. |
| Safari différences | Certains comportements SharedArrayBuffer/COEP peuvent varier ; tester et documenter. |

---

## 9. Roadmap post-MVP (rappel et ordre suggéré)

Les éléments suivants sont **hors périmètre MVP** mais déjà prévus dans l’architecture :

1. **Rendu serveur** : Micro-service FFmpeg natif + queue (exports queued/processing/done/error) pour vidéos longues ou OOM.
2. **YouTube** : OAuth (youtube.upload), videos.insert, gestion quota (100 unités/upload, 10 000/jour).
3. **Instagram Reels** : Container + publish, compte Business/Creator + Page FB.
4. **TikTok** : Content Posting API (init + chunks ou PULL_FROM_URL), domaine HTTPS vérifié.
5. **IA** : Music recommender, Edit coach, Titre/Description/Hashtags, transcription (OpenAI). Toggle ON/OFF selon présence de `OPENAI_API_KEY`.
6. **PWA** : Offline, share_target.
7. **Catalogue musique** : Library interne, tags/BPM, recherche, suggestions IA.

Ordre recommandé après MVP : Rendu serveur (robustesse) → IA (valeur ajoutée) → Publication (YouTube puis IG puis TikTok) → PWA.

---

## 10. Synthèse des risques et atténuations

| Risque | Impact | Atténuation |
|--------|--------|-------------|
| OOM navigateur (gros médias) | Rendu échoue, mauvaise UX | Limites durée/taille au MVP ; messages clairs ; roadmap rendu serveur. |
| COOP/COEP manquants | Threads WASM indisponibles, lenteur ou erreurs | Headers dans next.config.js ; vérification en CI ou manuelle. |
| CDN sans bons headers pour FFmpeg | Blocage chargement WASM | Self-host obligatoire dans `public/ffmpeg/`. |
| Évolution des règles plateformes | Exports rejetés | Validators en JSON versionné ; mise à jour sans redéploiement. |
| Exposition de clés secrètes | Sécurité | Jamais SUPABASE_SERVICE_ROLE ni OPENAI_API_KEY au client ; .env non versionné. |
| RLS mal configuré | Données d’un utilisateur visibles par un autre | Tests explicites par utilisateur ; revue des policies. |
| Quota YouTube (futur) | Blocage des uploads | Monitoring ; demande d’augmentation si besoin. |

---

## 11. Checklist globale MVP (critères d’acceptation finaux)

- [ ] Import .mp4 et .mp3 OK (drag-drop + bouton).
- [ ] Édition : trim vidéo + musique (offset, volume, fades) + préécoute synchronisée.
- [ ] Export MP4 1080×1920, 30 fps, H.264/AAC avec +faststart → fichier lisible et non vide.
- [ ] Warnings validators affichés lorsque hors limites.
- [ ] Projets et assets sauvegardés (Supabase ou local-first selon choix).
- [ ] Tests E2E verts : Import → Edit → Export → Download.

---

## 12. Références internes

- **Cahier des charges 2** : objectifs produit, personae, exigences fonctionnelles/non fonctionnelles, architecture, modèle de données, risques, roadmap.
- **Structure_2** : arborescence repo, dépendances, snippets (next.config, ffmpeg, Supabase, API, SQL, RLS, package.json, scripts, .env.example).
- **Guidelines de développement** : principes généraux (séparation front/back, sécurité, pas de clés en front, validation des entrées, logging sans secrets, documentation). Les règles RAG spécifiques ne s’appliquent pas ; les principes de robustesse et de tests restent valables.

---

*Document : Plan de développement – Application d’édition vidéo verticale. À mettre à jour à chaque changement de périmètre ou d’architecture.*

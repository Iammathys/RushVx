# RushVx

Application web de montage vidéo au format vertical (Reels, Shorts, Stories) : import MP4/MP3, trim, musique (offset, volume, fades), prévisualisation et export 1080×1920.

## Stack

- **Frontend** : Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand, WaveSurfer.js
- **Rendu** : ffmpeg.wasm v0.12 (self-hosté, COOP/COEP pour SharedArrayBuffer)
- **Backend** : Routes API Next.js, Supabase (Auth, DB, Storage)

## Prérequis

- Node.js 20 LTS
- Compte [Supabase](https://supabase.com)

## Clés et configuration

### 1. Supabase (obligatoire pour persistance et upload)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **Authentication > Providers**, activez **Anonymous sign-in** (auth anonyme) pour permettre l’usage sans compte.
3. Créez deux buckets **privés** : `assets` et `renders`.
4. Dans **SQL Editor**, exécutez le contenu de **`apps/web/db/SETUP_COMPLET.sql`** (copiez tout le code SQL du fichier, puis Run). Puis créez les buckets et exécutez **`db/storage_policies.sql`**.
5. Récupérez dans **Settings > API** :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE` (à ne jamais exposer côté client)

### 2. Variables d’environnement

Dans `apps/web/` :

```bash
cp .env.example .env.local
```

Renseignez dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE`

Aucune autre clé n’est requise pour le MVP (export local, pas d’IA ni de publication plateforme).

## Installation et lancement

**Le nom du dossier projet n’a pas d’importance** : tu peux laisser `vertical-video-app` (ou autre). L’app s’affiche sous le nom **RushVx** dans le navigateur.

Depuis la racine du projet (le dossier qui contient `apps/`) :

```bash
cd apps/web
npm install
# postinstall copie ffmpeg-core.* dans public/ffmpeg/
cp .env.example .env.local
# Éditez .env.local avec vos clés Supabase
npm run dev
```

**Si tu ouvres le workspace « Documentation 2 »** (dossier parent), lance depuis ce dossier :

```bash
cd vertical-video-app\apps\web
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Utilisation

1. **Accueil** : glisser-déposer une vidéo MP4 et optionnellement un MP3, puis « Créer le projet et ouvrir l’éditeur ».
2. **Éditeur** : prévisualisation 9:16, trim (début/fin), panneau Musique (décalage, volume, fades), sauvegarde, onglet Export.
3. **Export** : bouton « Télécharger le MP4 » pour un rendu 1080×1920, 30 fps, H.264/AAC, MOOV en tête (faststart). Rendu dans le navigateur (ffmpeg.wasm).
4. **Stats** : durée, fps, dates du projet.

## Structure

Le dossier racine peut s’appeler `vertical-video-app` ou autre ; l’application reste **RushVx**.

```
[racine du projet]/
├── apps/web/
│   ├── app/           # Pages et API (App Router)
│   ├── components/    # UI (VideoPlayer, Timeline, MusicPanel, ExportPanel, etc.)
│   ├── lib/           # ffmpeg, Supabase, validators, storage
│   ├── store/         # Zustand (editorStore)
│   ├── config/        # validators.platforms.json
│   ├── db/            # SQL (schema, RLS, storage)
│   ├── public/ffmpeg/ # ffmpeg-core.* (généré par postinstall)
│   └── scripts/       # copy-ffmpeg-core.mjs
└── README.md
```

## Sécurité

- Ne jamais commiter `.env.local` ni exposer `SUPABASE_SERVICE_ROLE` ou une clé API au client.
- Les routes API qui modifient des données utilisent la session Supabase (cookie) pour identifier l’utilisateur ; le service role n’est utilisé que pour créer les signed URLs d’upload (côté serveur).

## Limites et évolutions

- **Rendu** : fait dans le navigateur (ffmpeg.wasm). Vidéos longues ou très lourdes peuvent provoquer un manque de mémoire (OOM). Limitez la durée au MVP ; un rendu serveur (FFmpeg natif + file d’attente) est prévu en roadmap.
- **Headers COOP/COEP** : indispensables pour ffmpeg.wasm (threads). Déjà configurés dans `next.config.js`.
- **Publication** : YouTube / Instagram / TikTok sont préparés (validators JSON) mais désactivés au MVP ; à brancher via OAuth et APIs respectives.

## Licence

Privé / usage interne selon votre contexte.

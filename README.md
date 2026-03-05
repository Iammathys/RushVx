# RushVx

Application web de montage vidéo vertical (format 9:16 Reels/Shorts) : import MP4/MP3, trim, musique, export 1080×1920.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind, Zustand
- WaveSurfer.js, ffmpeg.wasm, Supabase (Auth, DB, Storage)

## Démarrage

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). L’app tourne dans `vertical-video-app/apps/web/` (script racine `npm run dev` lance ce dossier).

## Variables d’environnement

Créer `vertical-video-app/apps/web/.env.local` avec :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (pour les routes API admin)

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

Ouvre [http://localhost:3000](http://localhost:3000).

## Déploiement Vercel

1. Importe le dépôt GitHub dans Vercel.
2. **Root Directory** : laisse **vide** (l’app est à la racine du dépôt).
3. Ajoute les variables d’environnement (Settings → Environment Variables) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Déploie.

## Variables d’environnement

Créer `.env.local` à la racine du projet avec :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (pour les routes API admin)

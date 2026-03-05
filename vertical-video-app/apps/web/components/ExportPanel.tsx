'use client';

import { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { renderVideo } from '@/lib/ffmpeg';
import { getValidatorWarnings } from '@/lib/validators';
import type { ValidatorsMap } from '@/lib/validators';

const TARGET_FPS = 30;

export default function ExportPanel() {
  const { videoFile, audioFile, videoUrl, audioUrl, edits } = useEditorStore();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<{ platform: string; message: string }[]>([]);

  const hasVideo = !!(videoFile || videoUrl);
  const durationSec = edits.video?.end_ms != null && edits.video?.start_ms != null
    ? (edits.video.end_ms - edits.video.start_ms) / 1000
    : 0;

  const runValidation = async () => {
    try {
      const res = await fetch('/api/validators');
      const validators = (await res.json()) as ValidatorsMap;
      const w = getValidatorWarnings(validators, durationSec, TARGET_FPS);
      setWarnings(w);
    } catch {
      setWarnings([]);
    }
  };

  const handleExport = async () => {
    if (!videoFile && !videoUrl) {
      setError('Aucune vidéo à exporter.');
      return;
    }
    setError(null);
    setLoading(true);
    setProgress('Chargement de FFmpeg…');
    try {
      const videoBlob = videoFile
        ? videoFile
        : videoUrl
          ? await (await fetch(videoUrl)).blob()
          : null;
      if (!videoBlob) throw new Error('Vidéo introuvable.');
      const videoAsFile = videoBlob instanceof File ? videoBlob : new File([videoBlob], 'video.mp4', { type: 'video/mp4' });

      let audioAsFile: File | undefined;
      if (audioFile) {
        audioAsFile = audioFile;
      } else if (audioUrl) {
        const ab = await (await fetch(audioUrl)).blob();
        audioAsFile = new File([ab], 'audio.mp3', { type: 'audio/mpeg' });
      }

      setProgress('Rendu en cours… (cela peut prendre 1 à 2 minutes)');
      const blob = await renderVideo({
        videoFile: videoAsFile,
        audioFile: audioAsFile,
        startMs: edits.video?.start_ms,
        endMs: edits.video?.end_ms,
        audioStartMs: edits.audio?.start_ms,
        audioEndMs: edits.audio?.end_ms,
        audioOffsetMs: edits.audio?.offset_ms,
        volumeDb: edits.audio?.gain_db,
        fadeInMs: edits.audio?.fade_in_ms,
        fadeOutMs: edits.audio?.fade_out_ms,
      });

      setProgress('Téléchargement…');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-vertical-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress('Export terminé.');
      await runValidation();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du rendu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-4">
      <h3 className="font-medium text-zinc-200">Export</h3>
      <p className="text-sm text-zinc-400">
        Format : 1080×1920, 30 fps, H.264/AAC, MOOV en tête (faststart).
      </p>
      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-200">
          <p className="font-medium mb-1">Avertissements plateformes</p>
          <ul className="list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={i}><strong>{w.platform}</strong> : {w.message}</li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {progress && <p className="text-sm text-zinc-400">{progress}</p>}
      <button
        type="button"
        onClick={handleExport}
        disabled={!hasVideo || loading}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {loading ? 'Rendu…' : 'Télécharger le MP4'}
      </button>
      <button
        type="button"
        onClick={runValidation}
        className="btn btn-ghost w-full text-sm"
      >
        Vérifier les limites plateformes
      </button>
    </div>
  );
}

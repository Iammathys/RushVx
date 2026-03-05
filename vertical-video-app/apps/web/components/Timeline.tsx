'use client';

import { useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useEditorStore } from '@/store/editorStore';

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const { videoUrl, videoFile, audioUrl, audioFile, edits, setTrim, setAudioDurationMs } = useEditorStore();

  const audioSrc = audioUrl ?? (audioFile ? URL.createObjectURL(audioFile) : '');
  const hasAudio = !!audioSrc;

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#52525b',
      progressColor: '#6366f1',
      height: 64,
      barWidth: 2,
      barGap: 1,
      normalize: true,
      url: hasAudio ? audioSrc : undefined,
    });
    wavesurferRef.current = ws;

    ws.on('ready', () => {
      const duration = ws.getDuration() * 1000;
      setAudioDurationMs(duration);
      const start = edits.video?.start_ms ?? 0;
      const end = edits.video?.end_ms ?? duration;
      if (end > start) setTrim(start, end);
    });

    return () => {
      try {
        ws.destroy();
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') throw e;
      }
      wavesurferRef.current = null;
    };
  }, [hasAudio]);

  useEffect(() => {
    if (!hasAudio || !wavesurferRef.current) return;
    const ws = wavesurferRef.current;
    if (audioSrc && ws.getDuration() === 0) {
      ws.load(audioSrc).catch((e) => {
        if (e instanceof Error && e.name !== 'AbortError') console.error(e);
      });
    }
  }, [audioSrc, hasAudio]);

  const startMs = edits.video?.start_ms ?? 0;
  const endMs = edits.video?.end_ms ?? 0;
  const durationMs = endMs - startMs || 1;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Trim : {((startMs / 1000) | 0)}s → {(endMs / 1000) | 0}s</span>
        <span>Durée : {(durationMs / 1000).toFixed(1)}s</span>
      </div>
      <div ref={containerRef} className="h-16 rounded-lg bg-zinc-800/50" />
      {!hasAudio && (
        <p className="text-xs text-zinc-500">Ajoutez une piste audio dans le panneau Musique pour voir la forme d’onde.</p>
      )}
    </div>
  );
}

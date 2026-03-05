'use client';

import { useEditorStore } from '@/store/editorStore';

const DURATION_PRESETS_SEC = [15, 30, 45, 60, 90, 120] as const;

function msToSec(ms: number): number {
  return Math.round(ms / 100) / 10;
}

function secToMs(sec: number): number {
  return Math.round(sec * 1000);
}

export default function TrimControls() {
  const { edits, setTrim, videoAsset } = useEditorStore();
  const videoDurationMs = videoAsset?.duration_ms ?? 120_000;
  const videoDurationSec = videoDurationMs / 1000;

  const startMs = edits.video?.start_ms ?? 0;
  const endMs = edits.video?.end_ms ?? Math.min(videoDurationMs, 60_000);
  const durationMs = Math.max(0, endMs - startMs);
  const durationSec = durationMs / 1000;

  const startSec = msToSec(startMs);
  const endSec = msToSec(endMs);

  const setStartSec = (s: number) => {
    const ms = secToMs(s);
    const newEnd = Math.max(ms + 1000, endMs);
    setTrim(ms, Math.min(newEnd, videoDurationMs));
  };

  const setEndSec = (s: number) => {
    const ms = secToMs(s);
    setTrim(startMs, Math.min(Math.max(ms, startMs + 1000), videoDurationMs));
  };

  const applyDurationPreset = (presetSec: number) => {
    const presetMs = presetSec * 1000;
    const newEnd = Math.min(startMs + presetMs, videoDurationMs);
    const newStart = Math.max(0, newEnd - presetMs);
    setTrim(newStart, newEnd);
  };

  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-4">
      <h3 className="font-medium text-zinc-200">Trim vidéo</h3>

      <div>
        <label className="label">Durée de l’extrait</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DURATION_PRESETS_SEC.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => applyDurationPreset(sec)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                Math.abs(durationSec - sec) < 0.5
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Choisir la durée de la vidéo exportée. La fin de l’extrait sera ajustée à partir du début actuel (max {videoDurationSec.toFixed(0)}s).
        </p>
      </div>

      <div>
        <label className="label">Timecode de l’extrait (début → fin)</label>
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div>
            <span className="text-xs text-zinc-500 block mb-0.5">Début (s)</span>
            <input
              type="number"
              className="input"
              value={startSec}
              onChange={(e) => setStartSec(Number(e.target.value) || 0)}
              min={0}
              max={videoDurationSec}
              step={0.5}
            />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-0.5">Fin (s)</span>
            <input
              type="number"
              className="input"
              value={endSec}
              onChange={(e) => setEndSec(Number(e.target.value) || endSec)}
              min={startSec + 1}
              max={videoDurationSec}
              step={0.5}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Extrait actuel : {startSec}s → {endSec}s — Durée : {durationSec.toFixed(1)} s
      </p>
    </div>
  );
}

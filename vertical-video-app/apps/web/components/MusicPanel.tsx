'use client';

import { useEditorStore } from '@/store/editorStore';

const DURATION_PRESETS_SEC = [15, 30, 45, 60, 90, 120] as const;

function msToSec(ms: number): number {
  return Math.round(ms / 100) / 10;
}

function secToMs(sec: number): number {
  return Math.round(sec * 1000);
}

export default function MusicPanel() {
  const {
    audioAsset,
    edits,
    setAudioTrim,
    setAudioParams,
    audioDurationMs: audioDurationFromPlayer,
  } = useEditorStore();

  const audio = edits.audio ?? {};
  const audioDurationMs = audioDurationFromPlayer ?? audioAsset?.duration_ms ?? 120_000;
  const audioDurationSec = audioDurationMs / 1000;

  const startMs = audio.start_ms ?? 0;
  const endMs = audio.end_ms ?? Math.min(audioDurationMs, 60_000);
  const durationMs = Math.max(0, endMs - startMs);
  const durationSec = durationMs / 1000;

  const startSec = msToSec(startMs);
  const endSec = msToSec(endMs);

  const offsetMs = audio.offset_ms ?? 0;
  const gainDb = audio.gain_db ?? 0;
  const fadeInMs = audio.fade_in_ms ?? 0;
  const fadeOutMs = audio.fade_out_ms ?? 0;

  const setStartSec = (s: number) => {
    const ms = secToMs(s);
    const newEnd = Math.max(ms + 1000, endMs);
    setAudioTrim(ms, Math.min(newEnd, audioDurationMs));
  };

  const setEndSec = (s: number) => {
    const ms = secToMs(s);
    setAudioTrim(startMs, Math.min(Math.max(ms, startMs + 1000), audioDurationMs));
  };

  const applyDurationPreset = (presetSec: number) => {
    const presetMs = presetSec * 1000;
    const newEnd = Math.min(startMs + presetMs, audioDurationMs);
    const newStart = Math.max(0, newEnd - presetMs);
    setAudioTrim(newStart, newEnd);
  };

  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-4">
      <h3 className="font-medium text-zinc-200">Musique</h3>
      {audioAsset ? (
        <p className="text-sm text-zinc-400 truncate">
          {audioAsset.original_name ?? 'Piste audio'}
        </p>
      ) : (
        <p className="text-sm text-zinc-500">Aucune piste (ajoutée à l’import)</p>
      )}

      {audioAsset && (
        <>
          <div>
            <label className="label">Durée de l’extrait audio</label>
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
          </div>
          <div>
            <label className="label">Timecode de l’extrait (début → fin)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-zinc-500 block mb-0.5">Début (s)</span>
                <input
                  type="number"
                  className="input"
                  value={startSec}
                  onChange={(e) => setStartSec(Number(e.target.value) || 0)}
                  min={0}
                  max={audioDurationSec}
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
                  max={audioDurationSec}
                  step={0.5}
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Extrait : {startSec}s → {endSec}s — Durée : {durationSec.toFixed(1)} s
            </p>
          </div>
        </>
      )}

      <div>
        <label className="label">Décalage (ms)</label>
        <input
          type="number"
          className="input"
          value={offsetMs}
          onChange={(e) => setAudioParams({ offset_ms: e.target.valueAsNumber || 0 })}
          min={0}
          step={100}
        />
      </div>
      <div>
        <label className="label">Volume (dB)</label>
        <input
          type="number"
          className="input"
          value={gainDb}
          onChange={(e) => setAudioParams({ gain_db: e.target.valueAsNumber ?? 0 })}
          min={-60}
          max={20}
          step={0.5}
        />
      </div>
      <div>
        <label className="label">Fade in (ms)</label>
        <input
          type="number"
          className="input"
          value={fadeInMs}
          onChange={(e) => setAudioParams({ fade_in_ms: e.target.valueAsNumber || 0 })}
          min={0}
          step={100}
        />
      </div>
      <div>
        <label className="label">Fade out (ms)</label>
        <input
          type="number"
          className="input"
          value={fadeOutMs}
          onChange={(e) => setAudioParams({ fade_out_ms: e.target.valueAsNumber || 0 })}
          min={0}
          step={100}
        />
      </div>
    </div>
  );
}

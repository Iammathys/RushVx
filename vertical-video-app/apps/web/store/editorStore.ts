import { create } from 'zustand';
import type { TimelineEdits, AssetRecord } from '@/types/editor';

export interface EditorState {
  projectId: string | null;
  title: string;
  videoAsset: AssetRecord | null;
  audioAsset: AssetRecord | null;
  videoUrl: string | null;
  audioUrl: string | null;
  videoFile: File | null;
  audioFile: File | null;
  edits: TimelineEdits;
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
  /** Durée audio détectée (ex. par WaveSurfer), pour MP3 sans métadonnées */
  audioDurationMs: number | null;
  loadProject: (projectId: string, data: {
    title: string;
    timeline?: { edits?: TimelineEdits; video_asset_id?: string | null; audio_asset_id?: string | null };
    assets?: AssetRecord[];
  }) => void;
  setVideo: (asset: AssetRecord | null, url: string | null, file?: File | null) => void;
  setAudio: (asset: AssetRecord | null, url: string | null, file?: File | null) => void;
  setTrim: (startMs: number, endMs: number) => void;
  /** Définir l’extrait audio (début/fin en ms), comme pour la vidéo */
  setAudioTrim: (startMs: number, endMs: number) => void;
  setAudioParams: (params: Partial<NonNullable<TimelineEdits['audio']>>) => void;
  setTitle: (title: string) => void;
  setSaving: (v: boolean) => void;
  setDirty: (v: boolean) => void;
  setError: (err: string | null) => void;
  setAudioDurationMs: (ms: number | null) => void;
  reset: () => void;
}

const defaultEdits: TimelineEdits = {
  video: {},
  audio: {},
};

export const useEditorStore = create<EditorState>((set) => ({
  projectId: null,
  title: 'Sans titre',
  videoAsset: null,
  audioAsset: null,
  videoUrl: null,
  audioUrl: null,
  videoFile: null,
  audioFile: null,
  edits: defaultEdits,
  isSaving: false,
  isDirty: false,
  error: null,
  audioDurationMs: null,

  loadProject: (projectId, data) => {
    const assets = data.assets ?? [];
    const videoId = data.timeline?.video_asset_id;
    const audioId = data.timeline?.audio_asset_id;
    const videoAsset = videoId ? assets.find((a) => a.id === videoId) ?? null : null;
    const audioAsset = audioId ? assets.find((a) => a.id === audioId) ?? null : null;
    set({
      projectId,
      title: data.title ?? 'Sans titre',
      videoAsset,
      audioAsset,
      videoUrl: null,
      audioUrl: null,
      videoFile: null,
      audioFile: null,
      edits: data.timeline?.edits ?? defaultEdits,
      isDirty: false,
      error: null,
      audioDurationMs: null,
    });
  },

  setVideo: (asset, url, file) =>
    set((s) => ({
      videoAsset: asset,
      videoUrl: url,
      videoFile: file ?? s.videoFile,
      isDirty: true,
    })),

  setAudio: (asset, url, file) =>
    set((s) => ({
      audioAsset: asset,
      audioUrl: url,
      audioFile: file ?? s.audioFile,
      isDirty: true,
    })),

  setTrim: (startMs, endMs) =>
    set((s) => ({
      edits: {
        ...s.edits,
        video: { ...s.edits.video, start_ms: startMs, end_ms: endMs },
      },
      isDirty: true,
    })),

  setAudioTrim: (startMs, endMs) =>
    set((s) => ({
      edits: {
        ...s.edits,
        audio: { ...s.edits.audio, start_ms: startMs, end_ms: endMs },
      },
      isDirty: true,
    })),

  setAudioParams: (params) =>
    set((s) => ({
      edits: {
        ...s.edits,
        audio: { ...s.edits.audio, ...params },
      },
      isDirty: true,
    })),

  setTitle: (title) => set({ title, isDirty: true }),
  setSaving: (isSaving) => set({ isSaving }),
  setDirty: (isDirty) => set({ isDirty }),
  setError: (error) => set({ error }),
  setAudioDurationMs: (audioDurationMs) => set({ audioDurationMs }),

  reset: () =>
    set({
      projectId: null,
      title: 'Sans titre',
      videoAsset: null,
      audioAsset: null,
      videoUrl: null,
      audioUrl: null,
      videoFile: null,
      audioFile: null,
      edits: defaultEdits,
      isSaving: false,
      isDirty: false,
      error: null,
      audioDurationMs: null,
    }),
}));

export interface VideoEdits {
  start_ms?: number;
  end_ms?: number;
}

export interface AudioEdits {
  /** Extrait utilisé : début (ms) dans le fichier source */
  start_ms?: number;
  /** Extrait utilisé : fin (ms) dans le fichier source */
  end_ms?: number;
  offset_ms?: number;
  gain_db?: number;
  fade_in_ms?: number;
  fade_out_ms?: number;
}

export interface TimelineEdits {
  video?: VideoEdits;
  audio?: AudioEdits;
}

export interface AssetRecord {
  id: string;
  type: 'video' | 'audio';
  storage_path: string;
  original_name: string | null;
  duration_ms: number | null;
}

export interface ProjectRecord {
  id: string;
  title: string;
  status: string;
  duration_ms: number | null;
  fps: number | null;
  aspect: string;
  timeline?: {
    id: string;
    video_asset_id: string | null;
    audio_asset_id: string | null;
    edits: TimelineEdits | null;
  } | null;
  assets?: AssetRecord[];
}

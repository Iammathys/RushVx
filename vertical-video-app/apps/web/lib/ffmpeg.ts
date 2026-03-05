import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let _ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg;
  const ffmpeg = new FFmpeg();
  const baseURL = '/ffmpeg';
  await ffmpeg.load({
    coreURL: `${baseURL}/ffmpeg-core.js`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    workerURL: `${baseURL}/ffmpeg-core.worker.js`,
  });
  _ffmpeg = ffmpeg;
  return ffmpeg;
}

export interface RenderVideoOptions {
  videoFile: File;
  audioFile?: File;
  startMs?: number;
  endMs?: number;
  /** Extrait audio : début (ms) dans le fichier source */
  audioStartMs?: number;
  /** Extrait audio : fin (ms) dans le fichier source */
  audioEndMs?: number;
  audioOffsetMs?: number;
  volumeDb?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export async function renderVideo(opts: RenderVideoOptions): Promise<Blob> {
  const {
    videoFile,
    audioFile,
    startMs,
    endMs,
    audioStartMs,
    audioEndMs,
    audioOffsetMs,
    volumeDb,
    fadeInMs,
    fadeOutMs,
  } = opts;

  const ffmpeg = await getFFmpeg();
  await ffmpeg.writeFile('in.mp4', await fetchFile(videoFile));
  if (audioFile) await ffmpeg.writeFile('in.mp3', await fetchFile(audioFile));

  const trimArgs =
    startMs != null && endMs != null
      ? ['-ss', String(startMs / 1000), '-to', String(endMs / 1000)]
      : [];

  const scaleVf = 'scale=1080:1920:force_original_aspect_ratio=decrease';
  const baseOut = ['-r', '30', '-vf', scaleVf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', 'out.mp4'];

  if (audioFile) {
    const clipDurationSec = (endMs != null && startMs != null ? (endMs - startMs) / 1000 : undefined) ?? 60;
    const audioTrimStartSec = audioStartMs != null ? audioStartMs / 1000 : 0;
    const audioTrimEndSec = audioEndMs != null ? audioEndMs / 1000 : undefined;

    const parts: string[] = [];
    if (volumeDb != null) parts.push(`volume=${volumeDb}dB`);
    if (fadeInMs != null && fadeInMs > 0) parts.push(`afade=t=in:st=0:d=${fadeInMs / 1000}`);
    if (fadeOutMs != null && fadeOutMs > 0) {
      const outStart = Math.max(0, clipDurationSec - fadeOutMs / 1000);
      parts.push(`afade=t=out:st=${outStart}:d=${fadeOutMs / 1000}`);
    }

    const audioInputLabel =
      audioTrimEndSec != null && audioTrimEndSec > audioTrimStartSec
        ? `[1:a]atrim=start=${audioTrimStartSec}:end=${audioTrimEndSec},asetpts=PTS-STARTPTS[atrimmed]; [atrimmed]`
        : '[1:a]';
    const filterStr = parts.length ? `${audioInputLabel}${parts.join(',')}[a1]` : `${audioInputLabel}anull[a1]`;

    const astart = audioOffsetMs != null && audioOffsetMs !== 0
      ? ['-itsoffset', String(audioOffsetMs / 1000), '-i', 'in.mp3']
      : ['-i', 'in.mp3'];

    await ffmpeg.exec([
      '-i', 'in.mp4',
      ...astart,
      ...trimArgs,
      '-filter_complex', filterStr,
      '-map', '0:v:0', '-map', '[a1]',
      ...baseOut,
    ]);
  } else {
    await ffmpeg.exec([
      '-i', 'in.mp4',
      ...trimArgs,
      ...baseOut,
    ]);
  }

  const data = await ffmpeg.readFile('out.mp4');
  return new Blob([data as BlobPart], { type: 'video/mp4' });
}

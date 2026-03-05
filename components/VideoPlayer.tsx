'use client';

import { useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { videoUrl, videoFile, edits } = useEditorStore();
  const src = videoUrl ?? (videoFile ? URL.createObjectURL(videoFile) : '');

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;
    const start = (edits.video?.start_ms ?? 0) / 1000;
    if (video.currentTime < start) video.currentTime = start;
  }, [edits.video?.start_ms, src]);

  if (!src) {
    return (
      <div className="aspect-9/16 max-h-[70vh] w-full max-w-[min(360px,90vw)] mx-auto bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
        Aucune vidéo
      </div>
    );
  }

  return (
    <div className="aspect-9/16 max-h-[70vh] w-full max-w-[min(360px,90vw)] mx-auto bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        controls
        playsInline
        muted={false}
      />
    </div>
  );
}

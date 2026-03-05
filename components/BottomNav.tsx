'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BottomNav() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;
  const base = projectId ? `/editor/${projectId}` : '';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-700 bg-zinc-900/95 backdrop-blur">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {projectId && (
          <>
            <Link
              href={`/stats/${projectId}`}
              className="flex flex-col items-center justify-center flex-1 py-2 text-zinc-400 hover:text-zinc-200 text-sm"
            >
              <span className="text-lg">📊</span>
              Stats
            </Link>
            <Link
              href={`/editor/${projectId}`}
              className="flex flex-col items-center justify-center flex-1 py-2 text-indigo-400 font-medium text-sm"
            >
              <span className="text-lg">✏️</span>
              Éditer
            </Link>
            <Link
              href={`/export/${projectId}`}
              className="flex flex-col items-center justify-center flex-1 py-2 text-zinc-400 hover:text-zinc-200 text-sm"
            >
              <span className="text-lg">📤</span>
              Export
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

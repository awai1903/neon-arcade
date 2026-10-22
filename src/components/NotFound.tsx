import React from 'react';
import type { DiscoveredGame } from '../types/game';
import { Ghost, Home, FolderGit2, Play } from 'lucide-react';

interface NotFoundProps {
  attemptedId: string;
  games: DiscoveredGame[];
  onNavigateHome: () => void;
  onPlayGame: (id: string) => void;
  onOpenDocs: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({
  attemptedId,
  games,
  onNavigateHome,
  onPlayGame,
  onOpenDocs,
}) => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/30 mx-auto mb-4">
        <Ghost className="h-8 w-8" />
      </div>

      <h1 className="font-display text-3xl font-extrabold text-white">
        Game Not Found
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        No discovered manifest matched route <code className="text-cyan-300 font-mono">games/{attemptedId}/game.json</code>.
      </p>

      <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
        If you just created this game folder in GitHub, ensure it was committed and that Netlify finished running <code className="text-slate-400 font-mono">npm run build</code>.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 font-display text-xs font-bold text-slate-950 hover:bg-cyan-300 active:scale-95"
        >
          <Home className="h-4 w-4" />
          <span>Back to Homepage</span>
        </button>

        <button
          onClick={onOpenDocs}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0d1527] px-5 py-2.5 text-xs font-medium text-slate-300 hover:text-white active:scale-95"
        >
          <FolderGit2 className="h-4 w-4 text-purple-400" />
          <span>CI/CD Spec</span>
        </button>
      </div>

      {/* Suggested Games */}
      {games.length > 0 && (
        <div className="mt-12 border-t border-slate-800/80 pt-8">
          <h3 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Available Games in this Build
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {games.map((g) => (
              <div
                key={g.id}
                onClick={() => onPlayGame(g.id)}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#0d1527] hover:border-cyan-500/40 cursor-pointer transition-colors text-left"
              >
                <div>
                  <h4 className="font-display text-sm font-bold text-white group-hover:text-cyan-300">
                    {g.manifest.title}
                  </h4>
                  <span className="text-[11px] text-slate-500">{g.category}</span>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

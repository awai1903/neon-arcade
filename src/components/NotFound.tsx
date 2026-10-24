import React from 'react';
import type { DiscoveredGame } from '../types/game';
import { getGamePlayUrl } from '../core/router';
import { Ghost, Home, Play, ExternalLink } from 'lucide-react';

interface NotFoundProps {
  attemptedId: string;
  games: DiscoveredGame[];
  onNavigateHome: () => void;
  onPlayGame: (id: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({
  games,
  onNavigateHome,
  onPlayGame,
}) => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 mx-auto mb-4">
        <Ghost className="h-8 w-8" />
      </div>

      <h1 className="font-display text-3xl font-extrabold text-white">
        Game Not Found
      </h1>

      <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
        The game you are looking for doesn't exist or may have been moved.
      </p>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-6 py-2.5 font-display text-xs font-extrabold text-slate-950 shadow-md shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Back to All Games</span>
        </button>
      </div>

      {/* Suggested Games */}
      {games.length > 0 && (
        <div className="mt-12 border-t border-slate-800/80 pt-8">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Popular Games to Play
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {games.slice(0, 4).map((g) => (
              <a
                key={g.id}
                href={getGamePlayUrl(g.id)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onPlayGame(g.id)}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#0a0f20] hover:border-cyan-500/40 hover:bg-[#0e152d] cursor-pointer transition-colors text-left"
                aria-label={`Play ${g.manifest.title} in new tab`}
              >
                <div className="min-w-0 pr-2">
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                    {g.manifest.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">{g.category}</span>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shrink-0">
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

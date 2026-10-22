import React, { useState } from 'react';
import type { DiscoveredGame } from '../types/game';
import { Play, Gamepad2, Info } from 'lucide-react';

interface GameCardProps {
  game: DiscoveredGame;
  onPlay: (id: string) => void;
  onShowInfo: (game: DiscoveredGame) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay, onShowInfo }) => {
  const [imageError, setImageError] = useState(false);
  const { manifest } = game;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-800 bg-[#0d1527] p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/30">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900">
        {!imageError && game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={manifest.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-[#101932] p-4 text-center">
            <Gamepad2 className="h-10 w-10 text-cyan-400/50 mb-2" />
            <span className="font-display text-sm font-semibold text-slate-300">
              {manifest.title}
            </span>
            <span className="text-[11px] text-slate-500">Auto-Discovered Module</span>
          </div>
        )}

        {/* Scrim overlay on thumbnail */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />

        {/* Featured indicator if present */}
        {game.isFeatured && (
          <div className="absolute top-2.5 right-2.5 rounded bg-purple-500/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Featured
          </div>
        )}

        {/* Quick hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={() => onPlay(game.id)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/50 transition-transform hover:scale-110 active:scale-95"
            aria-label={`Play ${manifest.title}`}
          >
            <Play className="h-6 w-6 fill-slate-950 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col pt-3">
        {/* Zero-Pill Unboxed Metadata */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
          <span className="text-cyan-400">{manifest.category || 'Arcade'}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{manifest.engine ? manifest.engine.toUpperCase() : 'PHASER'}</span>
          {manifest.version && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-[11px]">v{manifest.version}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-bold text-white transition-colors group-hover:text-cyan-300 line-clamp-1">
          {manifest.title}
        </h3>

        {/* Description */}
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
          {manifest.description}
        </p>

        {/* Actions Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
          <button
            onClick={() => onShowInfo(game)}
            className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-slate-200 whitespace-nowrap"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Folder details</span>
          </button>

          <button
            onClick={() => onPlay(game.id)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-400 hover:text-slate-950 active:scale-95 whitespace-nowrap"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Play Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

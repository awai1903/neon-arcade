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

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking info button, don't trigger play
    if ((e.target as HTMLElement).closest('.info-trigger')) {
      return;
    }
    onPlay(game.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPlay(game.id);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Play ${manifest.title}`}
      className="group relative flex flex-col rounded-xl border border-slate-800/90 bg-[#0a0f20] p-3 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/50 hover:bg-[#0e152d] hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      {/* Thumbnail Container (Strict 4:3 Aspect Ratio) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900">
        {!imageError && game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={`${manifest.title} game cover artwork`}
            loading="lazy"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-[#101732] p-4 text-center">
            <Gamepad2 className="h-10 w-10 text-cyan-400/40 mb-2" />
            <span className="font-display text-xs font-bold text-slate-300">
              {manifest.title}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">AwaisGames Discovery</span>
          </div>
        )}

        {/* Subtle Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Featured Tag if applicable */}
        {game.isFeatured && (
          <div className="absolute top-2 left-2 rounded bg-violet-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-sm">
            Featured
          </div>
        )}

        {/* Centered Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950/30 backdrop-blur-[2px]">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/40 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-5 w-5 fill-slate-950 ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col pt-3">
        {/* Unboxed Metadata Line */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
          <span className="text-cyan-400">{manifest.category || 'Arcade'}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{manifest.engine ? manifest.engine.toUpperCase() : 'PHASER'}</span>
          {manifest.version && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-[10px] text-slate-500">v{manifest.version}</span>
            </>
          )}
        </div>

        {/* Game Title */}
        <h3 className="font-display text-sm sm:text-base font-bold text-white transition-colors group-hover:text-cyan-300 line-clamp-1">
          {manifest.title}
        </h3>

        {/* Short Description */}
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
          {manifest.description}
        </p>

        {/* Bottom Bar: Action & Spec */}
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowInfo(game);
            }}
            className="info-trigger flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-200"
            aria-label={`View folder details for ${manifest.title}`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>

          <span className="flex items-center gap-1 rounded-md bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-400 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
            <Play className="h-3 w-3 fill-current" />
            <span>Play</span>
          </span>
        </div>
      </div>
    </article>
  );
};

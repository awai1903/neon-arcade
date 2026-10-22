import React from 'react';
import type { DiscoveredGame } from '../types/game';
import { Play, Sparkles, Flame, ShieldAlert, Award } from 'lucide-react';

interface HeroBannerProps {
  featuredGame?: DiscoveredGame;
  topGames: DiscoveredGame[];
  onPlayGame: (id: string) => void;
  onShowInfo: (game: DiscoveredGame) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredGame,
  topGames,
  onPlayGame,
  onShowInfo,
}) => {
  if (!featuredGame) return null;

  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Featured Banner (Compact & Action-First) */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0f20] shadow-lg group">
          {/* Background art image with measured dark gradient scrim */}
          <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950">
            {featuredGame.thumbnailUrl ? (
              <img
                src={featuredGame.thumbnailUrl}
                alt={featuredGame.manifest.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-900 to-[#0e152d]" />
            )}

            {/* Scrim gradient ensures contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060913]/90 via-[#060913]/40 to-transparent" />

            {/* Featured Badge */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-md bg-cyan-500/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-950 backdrop-blur-sm shadow-sm">
              <Sparkles className="h-3 w-3 fill-slate-950" />
              <span>Featured Game</span>
            </div>

            {/* Bottom Content Area */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-xl">
                {/* Clean unboxed metadata */}
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 mb-1">
                  <span>{featuredGame.category}</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span>{featuredGame.manifest.engine ? featuredGame.manifest.engine.toUpperCase() : 'PHASER'}</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="font-mono text-[11px] text-slate-400">v{featuredGame.manifest.version || '1.0.0'}</span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {featuredGame.manifest.title}
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-md leading-relaxed">
                  {featuredGame.manifest.description}
                </p>
              </div>

              {/* Working Play Now Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onPlayGame(featuredGame.id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-6 py-3 font-display text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
                  aria-label={`Play ${featuredGame.manifest.title} now`}
                >
                  <Play className="h-4 w-4 fill-slate-950" />
                  <span>PLAY NOW</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Spotlight Strip (Compact 2-3 games) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Spotlight Picks</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Instant Play</span>
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            {topGames.slice(0, 2).map((game) => (
              <div
                key={game.id}
                onClick={() => onPlayGame(game.id)}
                className="group relative flex items-center gap-3.5 rounded-xl border border-slate-800 bg-[#0a0f20] p-2.5 transition-all hover:border-cyan-500/40 hover:bg-[#0e152d] cursor-pointer flex-1"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPlayGame(game.id);
                  }
                }}
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                  {game.thumbnailUrl ? (
                    <img
                      src={game.thumbnailUrl}
                      alt={game.manifest.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0" />
                </div>

                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <span className="text-[10px] font-semibold text-cyan-400 truncate">
                    {game.category}
                  </span>
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                    {game.manifest.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {game.manifest.description}
                  </span>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500 group-hover:text-slate-950 shrink-0">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

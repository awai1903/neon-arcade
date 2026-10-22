import React from 'react';
import type { DiscoveredGame } from '../types/game';
import { Play, Sparkles, FolderGit2, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  featuredGame?: DiscoveredGame;
  onPlayGame: (id: string) => void;
  onOpenDocs: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredGame,
  onPlayGame,
  onOpenDocs,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-[#091024] to-[#070b14] py-12 md:py-16">
      {/* Background neon grid mesh */}
      <div className="absolute inset-0 bg-arcade-grid opacity-25 pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/10 via-purple-500/15 to-pink-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Heading and Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
              <span>Vite Build-Time Game Discovery Engine</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Zero Database · Pure GitHub GitOps</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Drop a game in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">games/</span>.<br />
              Push to GitHub. Play instantly.
            </h1>

            <p className="max-w-2xl text-base text-slate-300 leading-relaxed">
              NEON ARCADE compiles and registers games directly from individual repository folders. 
              No databases, no manual registry arrays, and no ZIP uploads. Every folder with a <code className="text-cyan-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">game.json</code> manifest is automatically bundled and served.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {featuredGame && (
                <button
                  onClick={() => onPlayGame(featuredGame.id)}
                  className="flex items-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3 font-display text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-300 hover:shadow-cyan-400/35 active:scale-95 whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-slate-950" />
                  <span>Play {featuredGame.manifest.title}</span>
                </button>
              )}

              <button
                onClick={onOpenDocs}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-medium text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 active:scale-95 whitespace-nowrap"
              >
                <FolderGit2 className="h-4 w-4 text-purple-400" />
                <span>How to Add Your Game</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Architecture Highlights (Clean unboxed metadata) */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div>
                <span className="text-slate-500">Discovery:</span>{' '}
                <span className="text-slate-200 font-mono">import.meta.glob</span>
              </div>
              <div>
                <span className="text-slate-500">Isolation:</span>{' '}
                <span className="text-slate-200">Per-Game Assets & CSS</span>
              </div>
              <div>
                <span className="text-slate-500">Engine:</span>{' '}
                <span className="text-slate-200">Phaser 3 + Custom Canvas</span>
              </div>
              <div>
                <span className="text-slate-500">Deploy:</span>{' '}
                <span className="text-slate-200">Netlify Continuous CD</span>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Spotlight Card */}
          {featuredGame && (
            <div className="lg:col-span-5">
              <div className="group relative rounded-2xl border border-slate-800 bg-[#0d1527] p-3 shadow-2xl transition-all hover:border-cyan-500/50">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900">
                  {featuredGame.thumbnailUrl ? (
                    <img
                      src={featuredGame.thumbnailUrl}
                      alt={featuredGame.manifest.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-600">
                      <Sparkles className="h-12 w-12 text-cyan-400/40" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top tag */}
                  <div className="absolute top-3 left-3 text-xs font-semibold uppercase tracking-wider text-cyan-300 drop-shadow">
                    ★ Featured Showcase
                  </div>

                  {/* Bottom details */}
                  <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <span>{featuredGame.category}</span>
                      <span>·</span>
                      <span>{featuredGame.manifest.engine || 'Phaser 3'}</span>
                      <span>·</span>
                      <span>v{featuredGame.manifest.version || '1.0.0'}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {featuredGame.manifest.title}
                    </h3>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between px-2 py-1">
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-[260px]">
                    {featuredGame.manifest.description}
                  </p>
                  <button
                    onClick={() => onPlayGame(featuredGame.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/20 active:scale-95 whitespace-nowrap"
                  >
                    <Play className="h-3.5 w-3.5 fill-cyan-400" />
                    <span>Launch</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

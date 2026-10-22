import React from 'react';
import type { DiscoveredGame } from '../types/game';
import { History, Play, Trash2, ArrowUpRight } from 'lucide-react';

export interface RecentGameItem {
  game: DiscoveredGame;
  timestamp: number;
}

interface RecentlyPlayedProps {
  recentGames: RecentGameItem[];
  onPlayGame: (id: string) => void;
  onClearRecent: () => void;
  onShowInfo: (game: DiscoveredGame) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const RecentlyPlayed: React.FC<RecentlyPlayedProps> = ({
  recentGames,
  onPlayGame,
  onClearRecent,
  onShowInfo,
}) => {
  if (recentGames.length === 0) return null;

  return (
    <section id="recent-section" className="mx-auto max-w-7xl px-4 pt-10 pb-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Recently Played</span>
              <span className="font-mono text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                {recentGames.length} of 3
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Quick access to your latest browser arcade sessions
            </p>
          </div>
        </div>

        <button
          onClick={onClearRecent}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-900 hover:text-slate-300"
          title="Clear recently played history"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Grid of Last 3 Games */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {recentGames.map(({ game, timestamp }, index) => {
          const { manifest } = game;
          return (
            <div
              key={game.id}
              className="group relative flex items-center gap-3.5 rounded-xl border border-slate-800/90 bg-[#0a0f20] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/50 hover:bg-[#0e152d] hover:shadow-lg hover:shadow-violet-950/20"
            >
              {/* Thumbnail with 4:3 aspect ratio */}
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                {game.thumbnailUrl ? (
                  <img
                    src={game.thumbnailUrl}
                    alt={manifest.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500 text-xs">
                    No Art
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors" />
                <div className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded bg-slate-950/80 text-[10px] font-bold text-cyan-400 font-mono">
                  #{index + 1}
                </div>
              </div>

              {/* Info & Action */}
              <div className="flex flex-1 flex-col min-w-0 pr-1">
                {/* Zero-Pill Unboxed Metadata */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                  <span className="text-cyan-400">{manifest.category || 'Arcade'}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-500">{formatRelativeTime(timestamp)}</span>
                </div>

                <h3 className="font-display text-sm font-bold text-white transition-colors group-hover:text-cyan-300 truncate mt-0.5">
                  {manifest.title}
                </h3>

                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {manifest.description}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => onPlayGame(game.id)}
                    className="flex items-center gap-1 rounded-md bg-purple-500/20 px-2.5 py-1 text-[11px] font-semibold text-purple-300 ring-1 ring-purple-500/30 transition-all hover:bg-purple-500 hover:text-white active:scale-95"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={() => onShowInfo(game)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    title="View Folder Details"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

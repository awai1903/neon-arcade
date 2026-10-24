import React, { useState, useRef } from 'react';
import type { DiscoveredGame } from '../types/game';
import { getGamePlayUrl } from '../core/router';
import { History, Play, Trash2, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface RecentGameItem {
  game: DiscoveredGame;
  timestamp: number;
}

interface RecentlyPlayedProps {
  recentGames: RecentGameItem[];
  onPlayGame?: (id: string) => void;
  onClearRecent: () => void;
  onShowInfo?: (game: DiscoveredGame) => void;
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

interface RecentGameTileProps {
  game: DiscoveredGame;
  timestamp: number;
  onPlayGame?: (id: string) => void;
}

const RecentGameTile: React.FC<RecentGameTileProps> = ({ game, timestamp, onPlayGame }) => {
  const { manifest } = game;
  const playUrl = getGamePlayUrl(game.id);
  const [isPressed, setIsPressed] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setIsPressed(true);
    triggerHaptic('light');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      setIsPressed(false);
    }
  };

  const handleTouchEnd = () => {
    if (isPressed) {
      triggerHaptic('medium');
    }
    setIsPressed(false);
    touchStartPos.current = null;
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    touchStartPos.current = null;
  };

  return (
    <a
      href={playUrl}
      target="_blank"
      rel="noopener noreferrer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onClick={() => {
        triggerHaptic('medium');
        if (onPlayGame) {
          onPlayGame(game.id);
        }
      }}
      className="group relative flex flex-col items-center select-none cursor-pointer focus:outline-none touch-manipulation"
      aria-label={`Resume playing ${manifest.title} in new tab (${formatRelativeTime(timestamp)})`}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl border bg-[#0a0f20] shadow-sm transition-all duration-150 ease-out sm:hover:scale-105 sm:hover:border-purple-400/90 sm:hover:shadow-lg sm:hover:shadow-purple-500/30 group-focus-visible:ring-2 group-focus-visible:ring-purple-400 group-focus-visible:scale-105 active:scale-95 motion-reduce:transform-none ${
          isPressed
            ? 'scale-[0.94] border-purple-400 shadow-md shadow-purple-500/40 ring-1 ring-purple-400/50'
            : 'border-slate-800/90'
        }`}
      >
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={manifest.title}
            referrerPolicy="no-referrer"
            className={`h-full w-full object-cover transition-transform duration-200 sm:group-hover:scale-110 motion-reduce:transform-none ${
              isPressed ? 'scale-105 brightness-110' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500 text-xs font-bold">
            {manifest.title.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Ambient Subtle Hover / Active Gloss Scrim */}
        <div
          className={`absolute inset-0 transition-colors duration-150 pointer-events-none ${
            isPressed ? 'bg-purple-400/10' : 'bg-purple-400/0 sm:group-hover:bg-purple-400/5'
          }`}
        />

        {/* Corner Open New Tab Icon */}
        <div
          className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/80 text-purple-300 transition-opacity duration-150 shadow-sm backdrop-blur-sm border border-slate-800/80 ${
            isPressed ? 'opacity-100 border-purple-400/50' : 'opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          <ExternalLink className="h-3 w-3" />
        </div>

        {/* Subtle resume play pill overlay in corner */}
        <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-slate-950 shadow-md shadow-purple-900/50">
          <Play className="h-3 w-3 fill-slate-950 ml-0.5" />
        </div>
      </div>

      {/* Accessible Hover Tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 hidden sm:flex flex-col items-center opacity-0 translate-y-1.5 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-y-0"
      >
        <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-[#060913]/95 px-2.5 py-1 shadow-xl shadow-purple-950/80 backdrop-blur-md whitespace-nowrap">
          <span className="font-display text-xs font-bold text-white tracking-wide">
            {manifest.title}
          </span>
          <span className="text-[10px] font-semibold text-purple-300 font-mono">
            · Resume in new tab ({formatRelativeTime(timestamp)})
          </span>
        </div>
        <div className="h-1.5 w-1.5 -mt-0.5 rotate-45 border-b border-r border-purple-500/40 bg-[#060913]" />
      </div>
    </a>
  );
};

export const RecentlyPlayed: React.FC<RecentlyPlayedProps> = ({
  recentGames,
  onPlayGame,
  onClearRecent,
}) => {
  if (recentGames.length === 0) return null;

  return (
    <section id="recent-section" className="mx-auto max-w-7xl 2xl:max-w-[1500px] px-3.5 pt-5 pb-1 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/10 text-purple-400">
            <History className="h-3 w-3" />
          </div>
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>Continue Playing</span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/15 px-1.5 py-0.2 rounded border border-purple-500/20">
              {recentGames.length}
            </span>
          </h2>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onClearRecent();
          }}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-slate-500 transition-colors hover:bg-slate-900 hover:text-slate-300 active:scale-95 touch-manipulation"
          title="Clear recent games history"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Poki-style Pure Icon Grid for Recently Played with New Tab Support & Touch Micro-interactions */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 md:gap-3.5">
        {recentGames.map(({ game, timestamp }) => (
          <RecentGameTile
            key={game.id}
            game={game}
            timestamp={timestamp}
            onPlayGame={onPlayGame}
          />
        ))}
      </div>
    </section>
  );
};

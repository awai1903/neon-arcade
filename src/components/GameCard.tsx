import React, { useState, useRef } from 'react';
import type { DiscoveredGame } from '../types/game';
import { getGamePlayUrl } from '../core/router';
import { ExternalLink, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface GameCardProps {
  game: DiscoveredGame;
  onPlay?: (id: string) => void;
  onShowInfo?: (game: DiscoveredGame) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
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
        if (onPlay) {
          onPlay(game.id);
        }
      }}
      aria-label={`Play ${manifest.title} in a new tab (${game.category})`}
      className="group relative flex flex-col items-center select-none cursor-pointer focus:outline-none touch-manipulation"
    >
      {/* Poki-style Pure Square Icon Tile with Rounded Corners & Glow */}
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl sm:rounded-3xl border bg-[#0a0f24] shadow-md transition-all duration-200 ease-out sm:hover:scale-105 sm:hover:border-cyan-400 sm:hover:shadow-xl sm:hover:shadow-cyan-500/25 group-focus-visible:ring-2 group-focus-visible:ring-cyan-400 group-focus-visible:scale-105 active:scale-95 motion-reduce:transform-none ${
          isPressed
            ? 'scale-[0.93] border-cyan-400 shadow-xl shadow-cyan-500/40 ring-2 ring-cyan-400/50'
            : 'border-slate-800/80'
        }`}
      >
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={manifest.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`h-full w-full object-cover transition-transform duration-300 ease-out sm:group-hover:scale-110 motion-reduce:transform-none ${
              isPressed ? 'scale-105 brightness-110' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-[#0e152d] text-cyan-400 font-display font-black text-xl p-2 text-center">
            {manifest.title.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Ambient Subtle Hover / Active Gloss Scrim */}
        <div
          className={`absolute inset-0 transition-colors duration-150 pointer-events-none ${
            isPressed ? 'bg-cyan-400/15' : 'bg-cyan-400/0 group-hover:bg-cyan-400/10'
          }`}
        />

        {/* Top-Left Badge (As seen in the Poki reference video frame 01/04/07) */}
        {game.isFeatured && (
          <div className="absolute top-2 left-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-slate-950/80 text-cyan-300 border border-cyan-400/40 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" />
          </div>
        )}

        {/* Corner New Tab Indicator on Desktop Hover */}
        <div
          className={`absolute top-2 right-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-slate-950/80 text-cyan-300 transition-opacity duration-150 shadow-sm backdrop-blur-sm border border-slate-700/80 ${
            isPressed ? 'opacity-100 border-cyan-400/60' : 'opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </div>
      </div>

      {/* Accessible Desktop Hover Tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 hidden sm:flex flex-col items-center opacity-0 translate-y-1.5 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0"
      >
        <div className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-[#060913]/95 px-3 py-1 shadow-xl shadow-cyan-950/80 backdrop-blur-md whitespace-nowrap">
          <span className="font-display text-xs font-bold text-white tracking-wide">
            {manifest.title}
          </span>
          <span className="text-[10px] font-semibold text-cyan-400 font-mono">
            · {game.category}
          </span>
        </div>
        <div className="h-1.5 w-1.5 -mt-0.5 rotate-45 border-b border-r border-cyan-500/40 bg-[#060913]" />
      </div>
    </a>
  );
};

import React, { useState, useRef } from 'react';
import type { DiscoveredGame } from '../types/game';
import { getGamePlayUrl } from '../core/router';
import { Play, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface FeaturedHeroProps {
  game: DiscoveredGame;
  onPlayGame?: (id: string) => void;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({ game, onPlayGame }) => {
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

  return (
    <div className="w-full mb-3.5 sm:mb-5">
      <a
        href={playUrl}
        target="_blank"
        rel="noopener noreferrer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => setIsPressed(false)}
        onClick={() => {
          triggerHaptic('medium');
          onPlayGame?.(game.id);
        }}
        aria-label={`Play Featured Game: ${manifest.title} in a new tab`}
        className="group relative block w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#0a0f24] shadow-2xl shadow-cyan-950/60 transition-all duration-200 hover:border-cyan-400/70 hover:shadow-cyan-500/20 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 select-none"
      >
        {/* Background Artwork */}
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={manifest.title}
            className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
              isPressed ? 'scale-105 brightness-110' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-[#060913] text-cyan-400 font-display font-black text-3xl">
            {manifest.title}
          </div>
        )}

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/30 to-black/20" />
        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Featured Pill Badge */}
        <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 flex items-center gap-1.5 rounded-full bg-slate-950/70 border border-cyan-500/40 px-3 py-1 text-[11px] font-bold text-cyan-300 backdrop-blur-md shadow-md">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>FEATURED GAME</span>
        </div>

        {/* Center Play Button (exact style as in reference video frame 01) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-slate-950/60 border-2 border-cyan-400/80 text-cyan-300 backdrop-blur-md shadow-2xl shadow-cyan-500/50 transition-all duration-200 group-hover:scale-115 group-hover:bg-cyan-400 group-hover:text-slate-950 group-hover:border-cyan-300">
            <Play className="h-7 w-7 sm:h-9 sm:w-9 fill-current ml-1 transition-transform group-hover:scale-110" />
          </div>
        </div>

        {/* Bottom Title & Developer Info (matching reference video frame 01) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col justify-end">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md group-hover:text-cyan-200 transition-colors">
            {manifest.title}
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-300 drop-shadow">
            by {manifest.developer || 'CyberLabs'} · <span className="text-cyan-400 font-semibold">{game.category}</span>
          </p>
        </div>
      </a>
    </div>
  );
};

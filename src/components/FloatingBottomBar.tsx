import React, { useState, useEffect } from 'react';
import type { DiscoveredGame } from '../types/game';
import { getGamePlayUrl } from '../core/router';
import { Play, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface FloatingBottomBarProps {
  game: DiscoveredGame;
  onPlayGame?: (id: string) => void;
}

export const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({ game, onPlayGame }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const playUrl = getGamePlayUrl(game.id);

  // Show floating bar once user scrolls down past the top hero section
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || isDismissed) return null;

  return (
    <aside
      aria-label="Quick Play Bar"
      className="fixed bottom-3.5 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 transition-all duration-300 ease-out animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl sm:rounded-full bg-[#0c1226]/95 border border-cyan-500/30 p-2 pl-2.5 pr-2 shadow-2xl shadow-cyan-950/80 backdrop-blur-xl">
        {/* Game Icon & Info */}
        <a
          href={playUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            triggerHaptic('medium');
            onPlayGame?.(game.id);
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 group"
        >
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-md">
            {game.thumbnailUrl ? (
              <img
                src={game.thumbnailUrl}
                alt={game.manifest.title}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-bold text-cyan-400">
                {game.manifest.title.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 pr-1">
            <span className="truncate font-display text-xs sm:text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
              {game.manifest.title}
            </span>
            <span className="truncate text-[11px] text-slate-400">
              by {game.manifest.developer || 'AwaisGames'} · {game.category}
            </span>
          </div>
        </a>

        {/* Play Action & Dismiss */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <a
            href={playUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              triggerHaptic('medium');
              onPlayGame?.(game.id);
            }}
            aria-label={`Play ${game.manifest.title} in a new tab`}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/40 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="h-5 w-5 fill-slate-950 ml-0.5" />
          </a>

          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss quick play bar"
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

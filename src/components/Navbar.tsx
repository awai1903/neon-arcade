import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, Search, Dices, Trophy, X } from 'lucide-react';
import type { DiscoveredGame } from '../types/game';
import { getGamePlayUrl } from '../core/router';
import { triggerHaptic } from '../utils/haptics';

interface NavbarProps {
  onNavigateHome: () => void;
  onSelectGame: (id: string) => void;
  onOpenHighScores: () => void;
  games: DiscoveredGame[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onSelectGame,
  onOpenHighScores,
  games,
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  categories,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Shortcut key: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setMobileSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRandomGame = () => {
    if (games.length === 0) return;
    triggerHaptic('medium');
    const randomIndex = Math.floor(Math.random() * games.length);
    const targetGame = games[randomIndex];
    onSelectGame(targetGame.id);
    window.open(getGamePlayUrl(targetGame.id), '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060913]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <button
            onClick={onNavigateHome}
            className="group flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 focus:outline-none"
            aria-label="AwaisGames Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-slate-950 shadow-md shadow-cyan-500/20 transition-transform group-hover:scale-105">
              <Gamepad2 className="h-5 w-5 fill-slate-950 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight text-white leading-tight">
                Awais<span className="text-cyan-400">Games</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 hidden sm:inline">
                Instant Browser Gaming
              </span>
            </div>
          </button>

          {/* Category Quick Chips for Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onSelectCategory(cat);
                  onNavigateHome();
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>

        {/* Center: Real-Time Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md items-center relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search all games... (Press / to focus)"
            className="w-full rounded-xl border border-slate-800 bg-[#0a0f20] py-2 pl-10 pr-9 text-xs text-slate-100 placeholder-slate-500 transition-all focus:border-cyan-500 focus:bg-[#0e152d] focus:outline-none"
            aria-label="Search available games"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              /
            </kbd>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0a0f20] text-slate-300 hover:text-white"
            aria-label="Toggle mobile search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Random Game / Surprise Me */}
          <button
            onClick={handleRandomGame}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0f20] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-violet-500/50 hover:bg-violet-950/30 hover:text-violet-300 active:scale-95"
            title="Launch a random game"
            aria-label="Play a random game"
          >
            <Dices className="h-4 w-4 text-violet-400" />
            <span className="hidden sm:inline">Surprise Me</span>
          </button>

          {/* High Scores / Records */}
          <button
            onClick={onOpenHighScores}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0f20] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-500/50 hover:bg-cyan-950/30 hover:text-cyan-300 active:scale-95"
            title="View High Score Records"
            aria-label="View Leaderboards"
          >
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="hidden sm:inline">Records</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Input Drawer */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-slate-800 px-4 py-2.5 bg-[#0a0f20]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games..."
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-[#0e152d] py-2 pl-9 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

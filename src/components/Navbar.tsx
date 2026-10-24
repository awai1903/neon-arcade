import React, { useEffect, useRef, useState } from 'react';
import { Flame, Sparkles, Gamepad2, Search, Trophy, X, ChevronDown } from 'lucide-react';
import type { DiscoveredGame } from '../types/game';
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
  activeFilter?: 'all' | 'hot' | 'featured';
  onFilterChange?: (filter: 'all' | 'hot' | 'featured') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onOpenHighScores,
  games,
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  categories,
  activeFilter = 'all',
  onFilterChange,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Shortcut key: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsCategoryDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSearch = () => {
    triggerHaptic('selection');
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  const handleFlameClick = () => {
    triggerHaptic('selection');
    onNavigateHome();
    if (onFilterChange) {
      onFilterChange(activeFilter === 'hot' ? 'all' : 'hot');
    }
  };

  const handleSparklesClick = () => {
    triggerHaptic('selection');
    onNavigateHome();
    if (onFilterChange) {
      onFilterChange(activeFilter === 'featured' ? 'all' : 'featured');
    }
  };

  const handleGamepadClick = () => {
    triggerHaptic('selection');
    setIsCategoryDropdownOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-2 sm:top-3 z-40 w-full px-3 sm:px-4 pointer-events-none">
      {/* Floating Poki-Style Pill Bar (as seen in reference video) */}
      <div className="mx-auto max-w-xl rounded-full bg-[#0c1226]/95 border border-cyan-500/25 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl px-3 sm:px-4 py-2 pointer-events-auto transition-all">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Left: Brand Logo (Poki-style friendly gaming emblem) */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onNavigateHome();
              onFilterChange?.('all');
              onSelectCategory('All');
            }}
            className="group flex items-center gap-1.5 focus:outline-none select-none pl-1"
            aria-label="AwaisGames Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 shadow-md shadow-cyan-500/30 transition-transform group-hover:scale-105 active:scale-95">
              <Gamepad2 className="h-4 w-4 fill-slate-950 text-slate-950" />
            </div>
            <div className="flex items-baseline">
              <span className="font-display text-base sm:text-lg font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                awais
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 ml-0.5 animate-pulse" />
            </div>
          </button>

          {/* Thin Vertical Divider (matching video) */}
          <div className="h-6 w-[1.5px] bg-slate-700/60 mx-1" />

          {/* The 5 Navigation Action Icons from Reference Video */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-around">
            {/* 1. Flame Icon: Hot / Popular */}
            <button
              onClick={handleFlameClick}
              aria-label="Filter Hot & Trending Games"
              title="Hot & Trending Games"
              className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
                activeFilter === 'hot'
                  ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/20'
                  : 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/50'
              }`}
            >
              <Flame className="h-5 w-5" />
              {activeFilter === 'hot' && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-amber-400" />
              )}
            </button>

            {/* 2. Sparkles Icon: New / Featured */}
            <button
              onClick={handleSparklesClick}
              aria-label="Filter Featured Games"
              title="Featured Games"
              className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
                activeFilter === 'featured'
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              {activeFilter === 'featured' && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-cyan-400" />
              )}
            </button>

            {/* 3. Gamepad Icon: All Games & Category Drawer */}
            <button
              onClick={handleGamepadClick}
              aria-label="Browse Game Categories"
              title="Browse Categories"
              className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
                isCategoryDropdownOpen || activeCategory !== 'All'
                  ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/50 shadow-lg shadow-violet-500/20'
                  : 'text-slate-300 hover:text-violet-300 hover:bg-slate-800/50'
              }`}
            >
              <Gamepad2 className="h-5 w-5" />
              {activeCategory !== 'All' && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-violet-400" />
              )}
            </button>

            {/* 4. Search Icon: Live Search */}
            <button
              onClick={handleToggleSearch}
              aria-label="Search Games"
              title="Search Games (Press /)"
              className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
                isSearchOpen || searchQuery
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* 5. Trophy / Records Icon: Leaderboards & Stats */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                onOpenHighScores();
              }}
              aria-label="View Leaderboards and Records"
              title="High Scores & Records"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-slate-300 hover:text-yellow-400 hover:bg-slate-800/50 transition-all active:scale-90"
            >
              <Trophy className="h-5 w-5 text-yellow-400" />
            </button>
          </div>
        </div>

        {/* Expandable Search Input within the Pill */}
        {isSearchOpen && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search all games..."
                className="w-full rounded-full border border-slate-700 bg-[#060913] py-1.5 pl-8 pr-8 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="rounded-full px-2.5 py-1 text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        )}

        {/* Category Picker Sheet dropdown when Gamepad is toggled */}
        {isCategoryDropdownOpen && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectCategory(cat);
                    setIsCategoryDropdownOpen(false);
                    onNavigateHome();
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                      : 'bg-[#060913] text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

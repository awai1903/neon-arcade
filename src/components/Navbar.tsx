import React, { useEffect, useRef } from 'react';
import { Gamepad2, Menu, Search, Trophy, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { triggerHaptic } from '../utils/haptics';

interface NavbarProps {
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenHighScores: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  /** Show the menu button on large screens too (when the sidebar rail is hidden) */
  showMenuOnDesktop?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onOpenMenu,
  onOpenHighScores,
  searchQuery,
  onSearchChange,
  showMenuOnDesktop = false,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shortcut: press '/' to focus search, Escape to leave it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-5">
        {/* Menu button (opens category drawer) */}
        <button
          onClick={() => {
            triggerHaptic('selection');
            onOpenMenu();
          }}
          aria-label="Open menu"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-slate-800/60 hover:text-slate-100 active:scale-90 ${
            showMenuOnDesktop ? '' : 'lg:hidden'
          }`}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onNavigateHome();
          }}
          aria-label="AwaisGames Home"
          className="group flex shrink-0 items-center gap-2 select-none focus:outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-md shadow-cyan-500/30 transition-transform group-hover:scale-105 group-active:scale-95">
            <Gamepad2 className="h-5 w-5 text-slate-950" />
          </span>
          <span className="hidden font-display text-xl font-black tracking-tight text-white sm:inline">
            Awais<span className="text-cyan-400">Games</span>
          </span>
        </button>

        {/* Big search pill */}
        <div className="relative mx-auto w-full max-w-2xl flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search games..."
            aria-label="Search games"
            className="h-11 w-full rounded-full border border-slate-700 bg-[#0c1226] pl-11 pr-11 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 md:block">
              /
            </kbd>
          )}
        </div>

        {/* Right actions */}
        <ThemeToggle />
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenHighScores();
          }}
          aria-label="View leaderboards and records"
          title="High Scores"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-[#0c1226] transition-all hover:border-yellow-400 active:scale-90"
        >
          <Trophy className="h-5 w-5 text-yellow-400" />
        </button>
      </div>
    </header>
  );
};

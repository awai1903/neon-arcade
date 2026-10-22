import React from 'react';
import { Gamepad2, GitPullRequest, Trophy, Sparkles } from 'lucide-react';

interface NavbarProps {
  onNavigateHome: () => void;
  onOpenDocs: () => void;
  onOpenHighScores: () => void;
  gameCount: number;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onOpenDocs,
  onOpenHighScores,
  gameCount,
  currentRoute,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={onNavigateHome}
          className="group flex items-center gap-2.5 text-left transition-opacity hover:opacity-95"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 transition-all group-hover:bg-cyan-500/20 group-hover:ring-cyan-400/50">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              NEON <span className="text-cyan-400">ARCADE</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Clean unboxed single-line typography) */}
        <nav className="hidden items-center gap-7 md:flex text-sm font-medium text-slate-300">
          <button
            onClick={onNavigateHome}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              currentRoute === 'home' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            All Games ({gameCount})
          </button>
          <button
            onClick={() => {
              onNavigateHome();
              const el = document.getElementById('featured-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="whitespace-nowrap transition-colors hover:text-white"
          >
            Featured
          </button>
          <button
            onClick={onOpenHighScores}
            className="flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white"
          >
            <Trophy className="h-4 w-4 text-purple-400" />
            <span>High Scores</span>
          </button>
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white"
          >
            <GitPullRequest className="h-4 w-4 text-cyan-400" />
            <span>GitHub CI/CD Spec</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Add Game to GitHub</span>
          </button>
        </div>
      </div>
    </header>
  );
};

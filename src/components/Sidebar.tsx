import React from 'react';
import { Home, Flame, Sparkles, Trophy, X } from 'lucide-react';
import { getCategoryIcon } from '../utils/categoryIcons';
import { triggerHaptic } from '../utils/haptics';

type NavIcon = React.ComponentType<{ className?: string }>;

interface NavEntry {
  key: string;
  label: string;
  icon: NavIcon;
  active: boolean;
  count?: number;
  onClick: () => void;
}

interface SidebarProps {
  categories: string[];
  categoryCounts: Record<string, number>;
  activeCategory: string;
  activeFilter: 'all' | 'hot' | 'featured';
  /** Show the permanent icon rail on large screens */
  showRail: boolean;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onHome: () => void;
  onSelectFilter: (filter: 'hot' | 'featured') => void;
  onSelectCategory: (category: string) => void;
  onOpenHighScores: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  categoryCounts,
  activeCategory,
  activeFilter,
  showRail,
  isDrawerOpen,
  onCloseDrawer,
  onHome,
  onSelectFilter,
  onSelectCategory,
  onOpenHighScores,
}) => {
  const isHome = activeCategory === 'All' && activeFilter === 'all';

  const mainEntries: NavEntry[] = [
    { key: 'home', label: 'Home', icon: Home, active: isHome, onClick: onHome },
    { key: 'hot', label: 'Hot', icon: Flame, active: activeFilter === 'hot', onClick: () => onSelectFilter('hot') },
    { key: 'featured', label: 'Featured', icon: Sparkles, active: activeFilter === 'featured', onClick: () => onSelectFilter('featured') },
  ];

  const categoryEntries: NavEntry[] = categories
    .filter((cat) => cat !== 'All')
    .map((cat) => ({
      key: `cat-${cat}`,
      label: cat,
      icon: getCategoryIcon(cat),
      active: activeFilter === 'all' && activeCategory === cat,
      count: categoryCounts[cat] || 0,
      onClick: () => onSelectCategory(cat),
    }));

  const handleClick = (entry: NavEntry) => {
    triggerHaptic('selection');
    entry.onClick();
  };

  const handleScores = () => {
    triggerHaptic('medium');
    onCloseDrawer();
    onOpenHighScores();
  };

  /* ---------- Desktop icon rail (Poki-style) ---------- */
  const renderRailItem = (entry: NavEntry) => {
    const Icon = entry.icon;
    return (
      <button
        key={entry.key}
        onClick={() => handleClick(entry)}
        aria-label={entry.label}
        aria-current={entry.active ? 'page' : undefined}
        title={entry.label}
        className={`group flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition-colors ${
          entry.active ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-100'
        }`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-150 group-hover:scale-110 group-active:scale-95 ${
            entry.active
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800/70 group-hover:bg-slate-800'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="w-full truncate text-center">{entry.label}</span>
      </button>
    );
  };

  /* ---------- Mobile drawer rows ---------- */
  const renderDrawerItem = (entry: NavEntry) => {
    const Icon = entry.icon;
    return (
      <button
        key={entry.key}
        onClick={() => handleClick(entry)}
        aria-current={entry.active ? 'page' : undefined}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          entry.active
            ? 'bg-cyan-500/15 text-cyan-300'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            entry.active ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800/70'
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="flex-1 truncate text-left">{entry.label}</span>
        {typeof entry.count === 'number' && (
          <span className="font-mono text-xs text-slate-500">{entry.count}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {showRail && (
        <aside
          aria-label="Game navigation"
          className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[92px] shrink-0 self-start overflow-y-auto border-r border-slate-800/80 bg-[#0a0f20]/60 px-1.5 py-3 no-scrollbar lg:block"
        >
          <nav className="flex flex-col gap-1">
            {mainEntries.map(renderRailItem)}
            <div className="mx-3 my-2 h-px bg-slate-800/80" />
            {categoryEntries.map(renderRailItem)}
            <div className="mx-3 my-2 h-px bg-slate-800/80" />
            <button
              onClick={handleScores}
              aria-label="High scores"
              title="High scores"
              className="group flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold text-slate-400 transition-colors hover:text-slate-100"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/70 transition-transform duration-150 group-hover:scale-110 group-hover:bg-slate-800 group-active:scale-95">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </span>
              <span className="w-full truncate text-center">Scores</span>
            </button>
          </nav>
        </aside>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Game categories">
          <button
            aria-label="Close menu"
            onClick={onCloseDrawer}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-slate-800 bg-[#0a0f20] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg font-black tracking-tight text-white">Menu</span>
              <button
                onClick={onCloseDrawer}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {mainEntries.map(renderDrawerItem)}
              <div className="mx-2 my-2 h-px bg-slate-800/80" />
              <span className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Categories</span>
              {categoryEntries.map(renderDrawerItem)}
              <div className="mx-2 my-2 h-px bg-slate-800/80" />
              <button
                onClick={handleScores}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-slate-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/70">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </span>
                <span className="flex-1 text-left">High Scores</span>
              </button>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

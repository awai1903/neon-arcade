import React, { useState, useMemo } from 'react';
import type { DiscoveredGame } from '../types/game';
import { GameCard } from './GameCard';
import { Search, SlidersHorizontal, Sparkles, FolderTree } from 'lucide-react';

interface GameGridProps {
  games: DiscoveredGame[];
  categories: string[];
  onPlayGame: (id: string) => void;
  onShowInfo: (game: DiscoveredGame) => void;
  onOpenDocs: () => void;
}

export const GameGrid: React.FC<GameGridProps> = ({
  games,
  categories,
  onPlayGame,
  onShowInfo,
  onOpenDocs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'az' | 'category'>('featured');

  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        const matchesCategory =
          activeCategory === 'All' || game.category.toLowerCase() === activeCategory.toLowerCase();

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          game.manifest.title.toLowerCase().includes(q) ||
          game.manifest.description.toLowerCase().includes(q) ||
          game.manifest.id.toLowerCase().includes(q) ||
          (game.manifest.tags && game.manifest.tags.some((t) => t.toLowerCase().includes(q)));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'featured') {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.manifest.title.localeCompare(b.manifest.title);
        }
        if (sortBy === 'az') {
          return a.manifest.title.localeCompare(b.manifest.title);
        }
        if (sortBy === 'category') {
          return a.category.localeCompare(b.category);
        }
        return 0;
      });
  }, [games, activeCategory, searchQuery, sortBy]);

  return (
    <section id="games-section" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Discovered Games
            </h2>
            <span className="text-xs font-semibold text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {filteredGames.length} loaded
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Dynamically loaded from repository <code className="text-slate-300 font-mono">games/*/game.json</code>
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games or tags..."
              className="w-full rounded-xl border border-slate-800 bg-[#0d1527] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0d1527] px-3 py-1.5 text-xs text-slate-300">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="featured" className="bg-[#0d1527] text-white">Sort: Featured</option>
              <option value="az" className="bg-[#0d1527] text-white">Sort: A-Z</option>
              <option value="category" className="bg-[#0d1527] text-white">Sort: Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs (Segmented interactive buttons) */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
              activeCategory === category
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredGames.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPlay={onPlayGame}
              onShowInfo={onShowInfo}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <FolderTree className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="font-display text-lg font-bold text-white">No games matched your filter</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            No games found matching "{searchQuery}". You can clear search filters or add a new game folder to the repository.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenDocs}
              className="rounded-lg bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 ring-1 ring-cyan-500/40"
            >
              Add New Game
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

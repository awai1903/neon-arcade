import React, { useMemo, useState } from 'react';
import type { DiscoveredGame } from '../types/game';
import { GameCard } from './GameCard';
import { Gamepad2, ArrowUpDown, X, Search, Sparkles } from 'lucide-react';

interface GameGridProps {
  games: DiscoveredGame[];
  categories: string[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPlayGame: (id: string) => void;
  onShowInfo: (game: DiscoveredGame) => void;
  onOpenDocs: () => void;
}

export const GameGrid: React.FC<GameGridProps> = ({
  games,
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onPlayGame,
  onShowInfo,
  onOpenDocs,
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'az' | 'newest'>('featured');

  // Compute category counts accurately from discovered games
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: games.length };
    games.forEach((g) => {
      const cat = g.category || 'Arcade';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [games]);

  // Filter and sort games
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
        if (sortBy === 'newest') {
          const dateA = a.manifest.releaseDate || '';
          const dateB = b.manifest.releaseDate || '';
          return dateB.localeCompare(dateA);
        }
        return 0;
      });
  }, [games, activeCategory, searchQuery, sortBy]);

  return (
    <section id="games-catalogue" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Category Navigation Bar & Sort Toolbar */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
        {/* Category Pills with Real Counts */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-[#0a0f20] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Sort & Stats */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-slate-400 font-mono">
            {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} available
          </span>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0f20] px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              aria-label="Sort games catalogue"
            >
              <option value="featured" className="bg-[#0a0f20] text-slate-100">Featured</option>
              <option value="az" className="bg-[#0a0f20] text-slate-100">Alphabetical (A-Z)</option>
              <option value="newest" className="bg-[#0a0f20] text-slate-100">Recently Released</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Search Filter Banner if searching */}
      {searchQuery && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-2 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-cyan-400" />
            <span>Showing results matching "{searchQuery}"</span>
          </div>
          <button
            onClick={() => onSearchChange('')}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 font-semibold"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear search</span>
          </button>
        </div>
      )}

      {/* Game Cards Grid */}
      {filteredGames.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
        /* Empty State */
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-[#0a0f20]/50 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">No games matched your criteria</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">
            {searchQuery
              ? `No games found matching "${searchQuery}" in category "${activeCategory}".`
              : `No games found in category "${activeCategory}".`}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('All');
              }}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              Show All Games
            </button>
            <button
              onClick={onOpenDocs}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Add a Game via GitHub
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

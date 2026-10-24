import React, { useMemo, useState } from 'react';
import type { DiscoveredGame } from '../types/game';
import { GameCard } from './GameCard';
import { FeaturedHero } from './FeaturedHero';
import { Gamepad2, ArrowUpDown, X, Search } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface GameGridProps {
  games: DiscoveredGame[];
  categories: string[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPlayGame: (id: string) => void;
  onShowInfo: (game: DiscoveredGame) => void;
  activeFilter?: 'all' | 'hot' | 'featured';
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
  activeFilter = 'all',
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

  // Featured hero game (default to first featured game, e.g. Neon Vector Drift or Cyber Invaders)
  const heroGame = useMemo(() => {
    return games.find((g) => g.isFeatured) || games[0];
  }, [games]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        // Filter by category
        const matchesCategory =
          activeCategory === 'All' || game.category.toLowerCase() === activeCategory.toLowerCase();

        // Filter by navbar flame/sparkles
        let matchesFilter = true;
        if (activeFilter === 'featured') {
          matchesFilter = Boolean(game.isFeatured);
        } else if (activeFilter === 'hot') {
          // Hot titles: popular high-intensity games
          matchesFilter = ['cyber-invaders', 'neon-rush', 'neon-vector-drift', 'endless-runner'].includes(game.id);
        }

        // Filter by search query
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          game.manifest.title.toLowerCase().includes(q) ||
          game.manifest.description.toLowerCase().includes(q) ||
          game.manifest.id.toLowerCase().includes(q) ||
          (game.manifest.tags && game.manifest.tags.some((t) => t.toLowerCase().includes(q)));

        return matchesCategory && matchesFilter && matchesSearch;
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
  }, [games, activeCategory, activeFilter, searchQuery, sortBy]);

  // Grid games: If hero is displayed and no search/filters are active, grid shows all games
  const gridGames = filteredGames;

  return (
    <section id="games-catalogue" className="mx-auto max-w-7xl 2xl:max-w-[1500px] px-3.5 py-4 sm:px-6 lg:px-8">
      {/* Featured Hero Card at Top (matching Poki reference video frame 01) */}
      {!searchQuery && activeCategory === 'All' && activeFilter === 'all' && heroGame && (
        <FeaturedHero game={heroGame} onPlayGame={onPlayGame} />
      )}

      {/* Category Pills Bar & Sort Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-3 md:flex-row md:items-center md:justify-between">
        {/* Category Pills with Real Counts */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectCategory(cat);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-bold'
                    : 'bg-[#0c1226] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
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
            {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'}
          </span>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#0c1226] px-2.5 py-1 text-xs text-slate-300">
            <ArrowUpDown className="h-3 w-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              aria-label="Sort games catalogue"
            >
              <option value="featured" className="bg-[#0c1226] text-slate-100">Featured</option>
              <option value="az" className="bg-[#0c1226] text-slate-100">Alphabetical (A-Z)</option>
              <option value="newest" className="bg-[#0c1226] text-slate-100">Recently Released</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Search Filter Banner if searching */}
      {searchQuery && (
        <div className="mt-3.5 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-2 text-xs text-cyan-200">
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

      {/* Poki-style Pure Icon Grid (Dense 3-column on mobile, up to 8 on wide desktop) */}
      {gridGames.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 md:gap-3.5">
          {gridGames.map((game) => (
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
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-[#0a0f24]/50 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">No games found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">
            {searchQuery
              ? `No games found matching "${searchQuery}".`
              : `No games match the current filter.`}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('All');
              }}
              className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
            >
              Show All Games
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

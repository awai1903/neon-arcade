import React, { useMemo, useState } from 'react';
import type { DiscoveredGame } from '../types/game';
import { GameCard } from './GameCard';
import { Gamepad2, ArrowUpDown, X, Search } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { getCategoryIcon } from '../utils/categoryIcons';

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

// Every Nth tile is shown big (2x2), like Poki's mixed-size grid
const BIG_TILE_EVERY = 10;
// Show the horizontal "Popular" row only once the catalogue is big enough to need it
const POPULAR_ROW_MIN_GAMES = 10;

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

  // Filter and sort games
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        // Filter by category
        const matchesCategory =
          activeCategory === 'All' || game.category.toLowerCase() === activeCategory.toLowerCase();

        // Filter by sidebar Hot / Featured
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

  const isDefaultView = !searchQuery && activeCategory === 'All' && activeFilter === 'all';
  const showPopularRow = isDefaultView && games.length >= POPULAR_ROW_MIN_GAMES;
  const popularGames = useMemo(() => games.slice(0, 10), [games]);

  // Mixed tile sizes only make sense with enough games and no active search
  const canMixTiles = filteredGames.length >= 5 && !searchQuery;

  const heading = searchQuery
    ? `Results for “${searchQuery}”`
    : activeFilter === 'hot'
    ? 'Hot right now'
    : activeFilter === 'featured'
    ? 'Featured games'
    : activeCategory === 'All'
    ? 'All games'
    : `${activeCategory} games`;

  return (
    <section id="games-catalogue" className="mx-auto w-full max-w-[1600px] px-3.5 py-4 sm:px-6 lg:px-8">
      {/* Category chips (Poki-style icon chips, scroll sideways on mobile) */}
      <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-3">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const Icon = cat === 'All' ? Gamepad2 : getCategoryIcon(cat);
          return (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic('selection');
                onSelectCategory(cat);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 touch-manipulation ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'border border-slate-800 bg-[#0c1226] text-slate-300 hover:border-cyan-400 hover:text-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{cat === 'All' ? 'All games' : cat}</span>
              <span className={`font-mono text-[11px] ${isActive ? 'text-slate-950/70' : 'text-slate-500'}`}>
                {categoryCounts[cat] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Popular row (appears automatically once the catalogue grows) */}
      {showPopularRow && (
        <div className="mb-6">
          <h2 className="mb-3 font-display text-lg font-black text-white sm:text-xl">Popular this week</h2>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-1">
            {popularGames.map((game) => (
              <div key={game.id} className="w-28 shrink-0 sm:w-36">
                <GameCard game={game} onPlay={onPlayGame} onShowInfo={onShowInfo} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heading + sort */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-black text-white sm:text-xl">
          {heading}
          <span className="ml-2 font-mono text-xs font-normal text-slate-400">
            {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'}
          </span>
        </h2>

        <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#0c1226] px-2.5 py-1 text-xs text-slate-300">
          <ArrowUpDown className="h-3 w-3 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'featured' | 'az' | 'newest')}
            className="cursor-pointer bg-transparent pr-1 text-xs text-slate-200 focus:outline-none"
            aria-label="Sort games catalogue"
          >
            <option value="featured" className="bg-[#0c1226] text-slate-100">Featured</option>
            <option value="az" className="bg-[#0c1226] text-slate-100">Alphabetical (A-Z)</option>
            <option value="newest" className="bg-[#0c1226] text-slate-100">Recently Released</option>
          </select>
        </div>
      </div>

      {/* Active search banner */}
      {searchQuery && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-2 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-cyan-400" />
            <span>Showing results matching “{searchQuery}”</span>
          </div>
          <button
            onClick={() => onSearchChange('')}
            className="flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-200"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear search</span>
          </button>
        </div>
      )}

      {/* Mixed-size tile grid: every 10th game is a big 2x2 tile, the rest are 1x1 */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-flow-dense grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {filteredGames.map((game, index) => {
            const isBig = canMixTiles && index % BIG_TILE_EVERY === 0;
            return (
              <div key={game.id} className={isBig ? 'col-span-2 row-span-2' : ''}>
                <GameCard game={game} onPlay={onPlayGame} onShowInfo={onShowInfo} />
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-[#0a0f24]/50 p-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">No games found</h3>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
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
              className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-300"
            >
              Show All Games
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

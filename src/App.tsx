import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { gameCatalogue, getAllCategories, getGameById } from './core/discovery';
import { getCurrentRoute, getGamePlayUrl, navigateTo, updateSEO } from './core/router';
import type { DiscoveredGame } from './types/game';
import { Navbar } from './components/Navbar';
import { RecentlyPlayed, type RecentGameItem } from './components/RecentlyPlayed';
import { GameGrid } from './components/GameGrid';
import { GamePlayer } from './components/GamePlayer';
import { GameDetailsModal } from './components/GameDetailsModal';
import { HighScoresModal } from './components/HighScoresModal';
import { LegalModals } from './components/LegalModals';
import { NotFound } from './components/NotFound';
import { Footer } from './components/Footer';

const RECENT_GAMES_STORAGE_KEY = 'awaisgames_recent_games';
const LEGACY_STORAGE_KEY = 'neon_arcade_recent_games';

export default function App() {
  const [games] = useState<DiscoveredGame[]>(gameCatalogue);
  const categories = useMemo(() => getAllCategories(), []);

  // Route state
  const [currentRoute, setCurrentRoute] = useState<'home' | 'game' | 'not-found'>('home');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // Search and Category state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Modals state
  const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
  const [inspectedGame, setInspectedGame] = useState<DiscoveredGame | null>(null);
  const [legalModalType, setLegalModalType] = useState<'about' | 'privacy' | 'contact' | null>(null);

  // Recently played state
  const [recentRaw, setRecentRaw] = useState<{ id: string; timestamp: number }[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_GAMES_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 3);
        }
      }
    } catch (e) {
      console.warn('Recent games load error:', e);
    }
    return [];
  });

  const recordRecentPlay = useCallback((gameId: string) => {
    try {
      setRecentRaw((prev) => {
        const filtered = prev.filter((r) => r.id !== gameId);
        const updated = [{ id: gameId, timestamp: Date.now() }, ...filtered].slice(0, 3);
        localStorage.setItem(RECENT_GAMES_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn('Record recent error:', e);
    }
  }, []);

  const handleClearRecent = () => {
    try {
      localStorage.removeItem(RECENT_GAMES_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setRecentRaw([]);
    } catch (e) {
      console.warn('Clear recent error:', e);
    }
  };

  const recentGamesList: RecentGameItem[] = useMemo(() => {
    return recentRaw
      .map((item) => {
        const match = getGameById(item.id);
        return match ? { game: match, timestamp: item.timestamp } : null;
      })
      .filter((item): item is RecentGameItem => item !== null);
  }, [recentRaw]);

  // Synchronize route with current URL
  const syncRoute = useCallback(() => {
    const route = getCurrentRoute();
    if (route.view === 'game' && route.gameId) {
      const game = getGameById(route.gameId);
      if (game) {
        setActiveGameId(game.id);
        setCurrentRoute('game');
        recordRecentPlay(game.id);
        updateSEO(game);
        return;
      }
    }

    if (route.view === 'not-found' && route.gameId) {
      setActiveGameId(route.gameId);
      setCurrentRoute('not-found');
      updateSEO(undefined);
      return;
    }

    // Default: Home view
    setActiveGameId(null);
    setCurrentRoute('home');
    if (route.category) {
      setActiveCategory(route.category);
    }
    updateSEO(undefined);
  }, [recordRecentPlay]);

  useEffect(() => {
    syncRoute();
    const handlePopState = () => syncRoute();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [syncRoute]);

  const navigateToGame = (id: string) => {
    const game = getGameById(id);
    if (game) {
      setActiveGameId(game.id);
      setCurrentRoute('game');
      recordRecentPlay(game.id);
      navigateTo(getGamePlayUrl(game.id), game);
    } else {
      setActiveGameId(id);
      setCurrentRoute('not-found');
      navigateTo(`/play/${id}/`, undefined);
    }
  };

  const navigateHome = () => {
    setActiveGameId(null);
    setCurrentRoute('home');
    navigateTo('/', undefined);
  };

  const activeGame = useMemo(() => {
    return activeGameId ? getGameById(activeGameId) : undefined;
  }, [activeGameId]);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onNavigateHome={navigateHome}
        onSelectGame={navigateToGame}
        onOpenHighScores={() => setIsHighScoresOpen(true)}
        games={games}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categories={categories}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <>
            {/* Persistent Recently Played Strip (Last 3 games) if played */}
            {!searchQuery && recentGamesList.length > 0 && (
              <RecentlyPlayed
                recentGames={recentGamesList}
                onPlayGame={navigateToGame}
                onClearRecent={handleClearRecent}
                onShowInfo={(game) => setInspectedGame(game)}
              />
            )}

            {/* Prominent Poki-style Icon-First Game Grid */}
            <GameGrid
              games={games}
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPlayGame={navigateToGame}
              onShowInfo={(game) => setInspectedGame(game)}
            />
          </>
        )}

        {currentRoute === 'game' && activeGame && (
          <GamePlayer
            game={activeGame}
            allGames={games}
            onBack={navigateHome}
            onPlayGame={navigateToGame}
          />
        )}

        {currentRoute === 'not-found' && (
          <NotFound
            attemptedId={activeGameId || 'unknown'}
            games={games}
            onNavigateHome={navigateHome}
            onPlayGame={navigateToGame}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenAbout={() => setLegalModalType('about')}
        onOpenPrivacy={() => setLegalModalType('privacy')}
        onOpenContact={() => setLegalModalType('contact')}
        onOpenHighScores={() => setIsHighScoresOpen(true)}
        gameCount={games.length}
      />

      {/* Game Details Inspector Modal */}
      <GameDetailsModal
        game={inspectedGame}
        onClose={() => setInspectedGame(null)}
        onPlay={navigateToGame}
      />

      {/* High Scores Modal */}
      <HighScoresModal
        isOpen={isHighScoresOpen}
        onClose={() => setIsHighScoresOpen(false)}
        games={games}
        onPlayGame={navigateToGame}
      />

      {/* Legal & About Modals */}
      <LegalModals
        modalType={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}

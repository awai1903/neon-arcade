import React, { useState, useEffect, useMemo } from 'react';
import { gameCatalogue, getAllCategories, getGameById } from './core/discovery';
import type { DiscoveredGame } from './types/game';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { GameGrid } from './components/GameGrid';
import { GamePlayer } from './components/GamePlayer';
import { GitHubWorkflowModal } from './components/GitHubWorkflowModal';
import { GameDetailsModal } from './components/GameDetailsModal';
import { HighScoresModal } from './components/HighScoresModal';
import { NotFound } from './components/NotFound';
import { Footer } from './components/Footer';

export default function App() {
  const [games] = useState<DiscoveredGame[]>(gameCatalogue);
  const categories = useMemo(() => getAllCategories(), []);
  
  // Route state
  const [currentRoute, setCurrentRoute] = useState<'home' | 'game' | 'not-found'>('home');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // Modals state
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
  const [inspectedGame, setInspectedGame] = useState<DiscoveredGame | null>(null);

  // Parse route from hash or URL
  const parseRoute = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const searchParams = new URLSearchParams(window.location.search);
    const queryGame = searchParams.get('game');

    let gameIdToLoad: string | null = null;

    if (hash.startsWith('game/')) {
      gameIdToLoad = hash.replace('game/', '').trim();
    } else if (queryGame) {
      gameIdToLoad = queryGame.trim();
    }

    if (gameIdToLoad) {
      const match = getGameById(gameIdToLoad);
      if (match) {
        setActiveGameId(match.id);
        setCurrentRoute('game');
        document.title = `${match.manifest.title} — NEON ARCADE`;
      } else {
        setActiveGameId(gameIdToLoad);
        setCurrentRoute('not-found');
        document.title = `Game Not Found — NEON ARCADE`;
      }
    } else {
      setActiveGameId(null);
      setCurrentRoute('home');
      document.title = 'NEON ARCADE — Automatic GitHub Game Discovery';
    }
  };

  useEffect(() => {
    parseRoute();
    const handlePopState = () => parseRoute();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateToGame = (id: string) => {
    window.location.hash = `game/${id}`;
    const target = getGameById(id);
    if (target) {
      setActiveGameId(target.id);
      setCurrentRoute('game');
      document.title = `${target.manifest.title} — NEON ARCADE`;
    } else {
      setActiveGameId(id);
      setCurrentRoute('not-found');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = () => {
    window.location.hash = '';
    setActiveGameId(null);
    setCurrentRoute('home');
    document.title = 'NEON ARCADE — Automatic GitHub Game Discovery';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featuredGame = useMemo(() => {
    return games.find((g) => g.isFeatured) || games[0];
  }, [games]);

  const activeGame = useMemo(() => {
    return activeGameId ? getGameById(activeGameId) : undefined;
  }, [activeGameId]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar Contract */}
      <Navbar
        onNavigateHome={navigateHome}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenHighScores={() => setIsHighScoresOpen(true)}
        gameCount={games.length}
        currentRoute={currentRoute}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <>
            <HeroBanner
              featuredGame={featuredGame}
              onPlayGame={navigateToGame}
              onOpenDocs={() => setIsDocsOpen(true)}
            />
            <div id="featured-section" />
            <GameGrid
              games={games}
              categories={categories}
              onPlayGame={navigateToGame}
              onShowInfo={(game) => setInspectedGame(game)}
              onOpenDocs={() => setIsDocsOpen(true)}
            />
          </>
        )}

        {currentRoute === 'game' && activeGame && (
          <GamePlayer
            game={activeGame}
            onBack={navigateHome}
            onOpenDocs={() => setIsDocsOpen(true)}
          />
        )}

        {currentRoute === 'not-found' && (
          <NotFound
            attemptedId={activeGameId || 'unknown'}
            games={games}
            onNavigateHome={navigateHome}
            onPlayGame={navigateToGame}
            onOpenDocs={() => setIsDocsOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onOpenDocs={() => setIsDocsOpen(true)} gameCount={games.length} />

      {/* Interactive GitOps & CI/CD Documentation Modal */}
      <GitHubWorkflowModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* Game Details Inspector Modal */}
      <GameDetailsModal
        game={inspectedGame}
        onClose={() => setInspectedGame(null)}
        onPlay={navigateToGame}
      />

      {/* Arcade High Scores Modal */}
      <HighScoresModal
        isOpen={isHighScoresOpen}
        onClose={() => setIsHighScoresOpen(false)}
        games={games}
        onPlayGame={navigateToGame}
      />
    </div>
  );
}

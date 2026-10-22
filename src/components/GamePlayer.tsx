import React, { useEffect, useRef, useState } from 'react';
import type { DiscoveredGame, GameObject } from '../types/game';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  HelpCircle,
  AlertTriangle,
  FolderTree,
  Terminal,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamePlayerProps {
  game: DiscoveredGame;
  onBack: () => void;
  onOpenDocs: () => void;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({ game, onBack, onOpenDocs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<GameObject | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem(`neon_arcade_hs_${game.id}`) || '0', 10);
  });
  const [showControlsHint, setShowControlsHint] = useState(true);

  // 1. Inject and clean up game-specific CSS
  useEffect(() => {
    if (!game.rawCss) return;
    const styleId = `neon-arcade-style-${game.id}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = game.rawCss;
      document.head.appendChild(styleTag);
    }

    return () => {
      const tag = document.getElementById(styleId);
      if (tag && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    };
  }, [game.id, game.rawCss]);

  // 2. Initialize the Game Module & Lifecycle
  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);
    setLoadError(null);
    setCurrentScore(0);
    setIsPaused(false);

    const initGame = async () => {
      try {
        const container = containerRef.current;
        if (!container) return;

        // Dynamically import game module
        const module = await game.loadEntryModule();

        if (!isSubscribed) return;

        const factory = module.createGame || (typeof module.default === 'function' ? module.default : null);

        if (!factory) {
          throw new Error(
            `Module "games/${game.folderName}/${game.manifest.entry}" does not export "createGame(container, options)".`
          );
        }

        const options = {
          container,
          manifest: game.manifest,
          assets: game.assets,
          getAssetUrl: game.getAssetUrl,
          isMuted,
          onScoreUpdate: (score: number) => {
            setCurrentScore(score);
            setHighScore((prev) => {
              if (score > prev) {
                localStorage.setItem(`neon_arcade_hs_${game.id}`, score.toString());
                return score;
              }
              return prev;
            });
          },
          onGameOver: (finalScore: number) => {
            const prevBest = parseInt(localStorage.getItem(`neon_arcade_hs_${game.id}`) || '0', 10);
            if (finalScore > prevBest) {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#06b6d4', '#a855f7', '#ec4899', '#ffffff'],
              });
            }
          },
          onStateChange: (state: string) => {
            setIsPaused(state === 'PAUSED');
          },
        };

        const result = await factory(container, options);

        if (!isSubscribed) {
          // If unmounted while loading
          if (result && typeof result.destroy === 'function') {
            result.destroy(true);
          }
          return;
        }

        gameInstanceRef.current = result;
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load game:', err);
        if (isSubscribed) {
          setLoadError(err.message || 'Unknown error occurred while bootstrapping game.');
          setIsLoading(false);
        }
      }
    };

    initGame();

    // 3. Clean up game instance when navigating away
    return () => {
      isSubscribed = false;
      if (gameInstanceRef.current) {
        try {
          if (typeof gameInstanceRef.current.destroy === 'function') {
            gameInstanceRef.current.destroy(true);
          }
        } catch (cleanupErr) {
          console.warn('Error during game destruction:', cleanupErr);
        }
        gameInstanceRef.current = null;
      }
    };
  }, [game.id]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    const playerWrapper = document.getElementById('game-player-shell');
    if (!playerWrapper) return;

    if (!document.fullscreenElement) {
      playerWrapper.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleTogglePause = () => {
    const instance = gameInstanceRef.current;
    if (!instance) return;

    if (isPaused) {
      if (typeof instance.resume === 'function') instance.resume();
      setIsPaused(false);
    } else {
      if (typeof instance.pause === 'function') instance.pause();
      setIsPaused(true);
    }
  };

  const handleRestart = () => {
    const instance = gameInstanceRef.current;
    if (instance && typeof instance.restart === 'function') {
      instance.restart();
    }
    setCurrentScore(0);
    setIsPaused(false);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    const instance = gameInstanceRef.current;
    if (instance && typeof instance.setMuted === 'function') {
      instance.setMuted(next);
    }
  };

  return (
    <div
      id="game-player-shell"
      className={`mx-auto flex flex-col ${
        isFullscreen ? 'h-screen w-screen bg-[#050813] p-0' : 'max-w-7xl px-4 py-6 sm:px-6 lg:px-8'
      }`}
    >
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0d1527] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white active:scale-95 whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Arcade</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-bold text-white">
                {game.manifest.title}
              </h1>
              <span className="font-mono text-xs text-slate-500">v{game.manifest.version || '1.0.0'}</span>
            </div>
            {/* Zero-Pill Unboxed Metadata */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>{game.category}</span>
              <span>·</span>
              <span>{game.manifest.engine ? game.manifest.engine.toUpperCase() : 'PHASER 3'}</span>
              <span>·</span>
              <span>By {game.manifest.author || 'Community Creator'}</span>
            </div>
          </div>
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Score & High Score */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0d1527] px-3.5 py-1.5">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Score</span>
              <span className="font-display text-sm font-bold text-cyan-400 tabular-nums">
                {currentScore}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">High</span>
              <span className="font-display text-sm font-bold text-purple-400 tabular-nums">
                {highScore}
              </span>
            </div>
          </div>

          <button
            onClick={handleTogglePause}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0d1527] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
          </button>

          <button
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0d1527] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            title="Restart Game"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0d1527] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-pink-400" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0d1527] text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setShowControlsHint(!showControlsHint)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              showControlsHint
                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                : 'border-slate-800 bg-[#0d1527] text-slate-400 hover:text-white'
            }`}
            title="Toggle Controls Guide"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport Screen & Canvas Container */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-[#04060e] shadow-2xl">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070b14]/90 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
            <p className="font-display text-sm font-semibold text-white">
              Bootstrapping {game.manifest.title}...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Loading dynamic module from <code className="text-cyan-300">games/{game.folderName}/</code>
            </p>
          </div>
        )}

        {/* Load Error View */}
        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070b14] p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Game Load Failure</h3>
            <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
              {loadError}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={onBack}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Back to Portal
              </button>
              <button
                onClick={onOpenDocs}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>View Game Contract</span>
              </button>
            </div>
          </div>
        )}

        {/* Actual DOM Container where Phaser mounts */}
        <div
          ref={containerRef}
          id={`game-mount-${game.id}`}
          className={`game-container-${game.folderName} relative flex h-full w-full items-center justify-center`}
          style={{ minHeight: isFullscreen ? '100vh' : '520px', width: '100%' }}
        />
      </div>

      {/* Controls & Manifest Details Drawer */}
      {showControlsHint && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0d1527] p-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              Desktop Controls
            </span>
            <p className="text-xs text-slate-300 font-mono">
              {game.manifest.controls?.desktop || 'Space / Arrow Keys to play · P to pause'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0d1527] p-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">
              Mobile Touch
            </span>
            <p className="text-xs text-slate-300 font-mono">
              {game.manifest.controls?.mobile || 'Tap screen to interact and play'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0d1527] p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400 block mb-1">
                Folder Source
              </span>
              <span className="font-mono text-xs text-slate-300">
                games/{game.folderName}/
              </span>
            </div>
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
            >
              <FolderTree className="h-3 w-3 text-cyan-400" />
              <span>Spec</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  Gamepad2,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamePlayerProps {
  game: DiscoveredGame;
  allGames: DiscoveredGame[];
  onBack: () => void;
  onPlayGame: (id: string) => void;
  onOpenDocs: () => void;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  allGames,
  onBack,
  onPlayGame,
  onOpenDocs,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<GameObject | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem(`awaisgames_hs_${game.id}`) || '0', 10);
  });

  // 1. Prevent arrow and space keys from scrolling the webpage during gameplay
  useEffect(() => {
    const handleGameKeys = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
        return;
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGameKeys, { passive: false });
    return () => window.removeEventListener('keydown', handleGameKeys);
  }, []);

  // 2. Scoped CSS injection and cleanup
  useEffect(() => {
    if (!game.rawCss) return;
    const styleId = `awaisgames-style-${game.id}`;
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

  // 3. Game module loading, execution, and cleanup
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

        // Lazy-load the game module
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
                localStorage.setItem(`awaisgames_hs_${game.id}`, score.toString());
                return score;
              }
              return prev;
            });
          },
          onGameOver: (finalScore: number) => {
            const prevBest = parseInt(localStorage.getItem(`awaisgames_hs_${game.id}`) || '0', 10);
            if (finalScore > prevBest) {
              confetti({
                particleCount: 70,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#00d4ff', '#8b5cf6', '#ec4899', '#ffffff'],
              });
            }
          },
          onStateChange: (state: string) => {
            setIsPaused(state === 'PAUSED');
          },
        };

        const result = await factory(container, options);

        if (!isSubscribed) {
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

    return () => {
      isSubscribed = false;
      if (gameInstanceRef.current) {
        try {
          if (typeof gameInstanceRef.current.destroy === 'function') {
            gameInstanceRef.current.destroy(true);
          }
        } catch (cleanupErr) {
          console.warn('Game cleanup error:', cleanupErr);
        }
        gameInstanceRef.current = null;
      }
    };
  }, [game.id]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    const playerWrapper = document.getElementById('game-stage');
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

  const handleShareGame = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const otherGames = allGames.filter((g) => g.id !== game.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Quick Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0f20] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white active:scale-95 whitespace-nowrap"
            aria-label="Back to AwaisGames homepage"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Games</span>
          </button>

          <div className="flex items-center gap-2.5">
            {game.iconUrl && (
              <img
                src={game.iconUrl}
                alt=""
                className="h-9 w-9 rounded-lg border border-slate-700/60 object-cover shadow-sm flex-shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-extrabold text-white">
                  {game.manifest.title}
                </h1>
                <span className="font-mono text-xs text-slate-500 hidden sm:inline">
                  v{game.manifest.version || '1.0.0'}
                </span>
              </div>
              {/* Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="text-cyan-400">{game.category}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{game.manifest.engine ? game.manifest.engine.toUpperCase() : 'CANVAS'}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>By {game.manifest.author || 'AwaisGames'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Score & Best */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0a0f20] px-3 py-1.5">
            <div className="text-right">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Score</span>
              <span className="font-display text-xs sm:text-sm font-bold text-cyan-400 tabular-nums">
                {currentScore}
              </span>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400">Best</span>
              <span className="font-display text-xs sm:text-sm font-bold text-violet-400 tabular-nums">
                {highScore}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleTogglePause}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0a0f20] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
          </button>

          <button
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0a0f20] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
            title="Restart Game"
            aria-label="Restart Game"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0a0f20] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-pink-400" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0a0f20] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={handleShareGame}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0a0f20] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
            title="Copy Game Link"
            aria-label="Share Game URL"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      <div
        id="game-stage"
        className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-[#03060f] shadow-2xl ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full'
        }`}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060913]/95 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
            <p className="font-display text-sm font-bold text-white">
              Starting {game.manifest.title}...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Loading module from <code className="text-cyan-300">games/{game.folderName}/</code>
            </p>
          </div>
        )}

        {/* Load Error View */}
        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060913] p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Unable to launch game</h3>
            <p className="mt-2 max-w-md text-xs text-slate-400 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
              {loadError}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={onBack}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Back to All Games
              </button>
              <button
                onClick={onOpenDocs}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                Inspect Game Contract
              </button>
            </div>
          </div>
        )}

        {/* Game Canvas Mount Point (Strict container isolation) */}
        <div
          ref={containerRef}
          id={`game-mount-${game.id}`}
          className={`game-container-${game.folderName} relative flex items-center justify-center mx-auto`}
          style={{
            width: '100%',
            height: isFullscreen ? '100vh' : 'auto',
            aspectRatio: isFullscreen ? undefined : '16/10',
            maxHeight: isFullscreen ? undefined : '600px',
            minHeight: isFullscreen ? undefined : '360px',
          }}
        />
      </div>

      {/* Game Details & Instructions Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: How to Play & Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0a0f20] p-4">
            <h2 className="font-display text-base font-bold text-white mb-3 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-cyan-400" />
              <span>How to Play & Controls</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-[#0e152d] p-3 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-1">
                  Desktop Keyboard
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {game.manifest.controls?.desktop || 'Arrow Keys / Space to Play · P to Pause'}
                </p>
              </div>

              <div className="rounded-lg bg-[#0e152d] p-3 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 block mb-1">
                  Mobile Touch
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {game.manifest.controls?.mobile || 'Tap on the screen to interact and play'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
              {game.logoUrl && (
                <div className="mb-3 max-w-[280px]">
                  <img
                    src={game.logoUrl}
                    alt={`${game.manifest.title} Logo`}
                    className="h-12 w-auto object-contain"
                  />
                </div>
              )}
              <span className="font-semibold text-white block mb-1">About {game.manifest.title}:</span>
              <p>{game.manifest.description}</p>
            </div>
          </div>
        </div>

        {/* Right: More Games to Play (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">More Games to Play</h3>
            <button
              onClick={onBack}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {otherGames.map((other) => (
              <div
                key={other.id}
                onClick={() => onPlayGame(other.id)}
                className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0a0f20] p-2 hover:border-cyan-500/40 hover:bg-[#0e152d] transition-all cursor-pointer"
              >
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                  {other.thumbnailUrl ? (
                    <img
                      src={other.thumbnailUrl}
                      alt={other.manifest.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-800" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-cyan-400 block truncate">
                    {other.category}
                  </span>
                  <h4 className="font-display text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                    {other.manifest.title}
                  </h4>
                </div>

                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shrink-0">
                  <Play className="h-3 w-3 fill-current ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

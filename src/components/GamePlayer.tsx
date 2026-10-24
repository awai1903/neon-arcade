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
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  allGames,
  onBack,
  onPlayGame,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<GameObject | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(15);
  const [loadingStatus, setLoadingStatus] = useState('Initializing game viewport...');
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
    let progressInterval: any = null;

    setIsLoading(true);
    setLoadProgress(15);
    setLoadingStatus('Initializing game viewport...');
    setLoadError(null);
    setCurrentScore(0);
    setIsPaused(false);

    // Smooth progressive status updates while scripts and assets compile
    progressInterval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev < 45) {
          setLoadingStatus('Loading sprites and shaders...');
          return prev + 12;
        } else if (prev < 75) {
          setLoadingStatus('Configuring audio channels & controls...');
          return prev + 8;
        } else if (prev < 92) {
          setLoadingStatus('Launching 60 FPS renderer...');
          return prev + 3;
        }
        return prev;
      });
    }, 110);

    const initGame = async () => {
      try {
        if (game.entryType === 'html') {
          // Handled via iframe onLoad
          return;
        }

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
        
        // Complete progress
        if (progressInterval) clearInterval(progressInterval);
        setLoadProgress(100);
        setLoadingStatus('Ready!');

        setTimeout(() => {
          if (isSubscribed) {
            setIsLoading(false);
          }
        }, 160);
      } catch (err: any) {
        if (progressInterval) clearInterval(progressInterval);
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
      if (progressInterval) clearInterval(progressInterval);
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
    if (game.entryType === 'html') {
      const iframe = document.querySelector('#game-stage iframe') as HTMLIFrameElement | null;
      if (iframe) {
        // Reload iframe to cleanly return to game start screen
        const currentSrc = iframe.src;
        iframe.src = '';
        iframe.src = currentSrc;
      }
    }
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
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0f20] px-2.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 active:scale-95 transition-colors"
            title="Restart game and return to start screen"
            aria-label="Restart game and return to start screen"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restart</span>
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
        {/* Loading Spinner & Visual Progress Bar */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060913]/95 backdrop-blur-md p-6 text-center select-none">
            {/* Ambient Background Art */}
            {game.thumbnailUrl && (
              <div className="absolute inset-0 -z-10 overflow-hidden opacity-20">
                <img
                  src={game.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover blur-xl scale-110"
                />
              </div>
            )}

            {/* Glowing Dual-Ring Neon Spinner */}
            <div className="relative mb-5 flex items-center justify-center">
              {/* Outer Cyan Ring */}
              <div className="h-14 w-14 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent shadow-lg shadow-cyan-500/30" />
              {/* Inner Violet Ring */}
              <div className="absolute h-9 w-9 animate-spin rounded-full border-2 border-violet-400 border-b-transparent [animation-direction:reverse] [animation-duration:1.1s]" />
              {/* Center Game Icon */}
              <div className="absolute flex h-5 w-5 items-center justify-center text-cyan-300">
                <Gamepad2 className="h-4 w-4" />
              </div>
            </div>

            {/* Game Title & Stage Status */}
            <h2 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
              Loading {game.manifest.title}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xs transition-all duration-200">
              {loadingStatus}
            </p>

            {/* Visual Neon Progress Bar */}
            <div className="mt-4 w-64 max-w-[80vw]">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Status</span>
                <span className="font-bold text-cyan-300 tabular-nums">{Math.round(loadProgress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800 p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-500 shadow-sm shadow-cyan-500/50 transition-all duration-200 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, loadProgress))}%` }}
                />
              </div>
            </div>

            <span className="text-[10px] text-slate-400 mt-3 font-mono">
              Direct Browser Engine · Smooth 60 FPS
            </span>
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
                onClick={() => window.location.reload()}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
              >
                Reload Game
              </button>
            </div>
          </div>
        )}

        {/* Game Execution Mount: Either HTML sandbox iframe or Canvas container */}
        {game.entryType === 'html' && game.htmlUrl ? (
          <iframe
            src={game.htmlUrl}
            title={game.manifest.title}
            className="w-full h-full border-0 bg-slate-950"
            allow="autoplay; fullscreen; gamepad; focus-without-user-activation *"
            onLoad={() => {
              setLoadProgress(100);
              setLoadingStatus('Ready!');
              setTimeout(() => setIsLoading(false), 150);
            }}
            style={{
              width: '100%',
              height: isFullscreen ? '100vh' : 'auto',
              aspectRatio: isFullscreen ? undefined : '16/10',
              maxHeight: isFullscreen ? undefined : '640px',
              minHeight: isFullscreen ? undefined : '380px',
            }}
          />
        ) : (
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
        )}
      </div>

      {/* Game Details & Instructions (Isolated for this specific game) */}
      <div className="mt-6 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-slate-800 bg-[#0a0f20] p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-cyan-400" />
              <span>How to Play & Controls</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 px-3 py-1 text-xs font-semibold text-cyan-300 hover:text-white transition-all active:scale-95"
                title="Restart game and return to start screen"
              >
                <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                <span>Restart to Start Screen</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>60 FPS</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
            <div className="rounded-xl bg-[#0e152d] p-3.5 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-1">
                Desktop Keyboard
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {game.manifest.controls?.desktop || 'Arrow Keys / Space to Play · P to Pause'}
              </p>
            </div>

            <div className="rounded-xl bg-[#0e152d] p-3.5 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 block mb-1">
                Mobile Touch
              </span>
              <p className="text-slate-200 font-medium leading-relaxed">
                {game.manifest.controls?.mobile || 'Tap on the screen to interact and play'}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 text-xs text-slate-300 leading-relaxed">
            {game.logoUrl && (
              <div className="mb-3 max-w-[240px]">
                <img
                  src={game.logoUrl}
                  alt={`${game.manifest.title} Logo`}
                  className="h-10 w-auto object-contain"
                />
              </div>
            )}
            <span className="font-semibold text-white block mb-1">About {game.manifest.title}:</span>
            <p className="text-slate-300 leading-relaxed max-w-3xl">{game.manifest.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

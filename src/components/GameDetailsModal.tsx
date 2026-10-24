import React from 'react';
import type { DiscoveredGame } from '../types/game';
import { getGamePlayUrl } from '../core/router';
import { X, Play, Gamepad2, Monitor, Smartphone, Tag, ExternalLink } from 'lucide-react';

interface GameDetailsModalProps {
  game: DiscoveredGame | null;
  onClose: () => void;
  onPlay: (id: string) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({ game, onClose, onPlay }) => {
  if (!game) return null;

  const { manifest } = game;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-details-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0a0f20] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {game.iconUrl ? (
              <img
                src={game.iconUrl}
                alt=""
                className="h-10 w-10 rounded-xl border border-slate-700/60 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
                <Gamepad2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 id="game-details-title" className="font-display text-lg font-bold text-white">
                {manifest.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-cyan-400 font-semibold">{game.category}</span>
                <span>·</span>
                <span>Instant Play</span>
                {game.isFeatured && (
                  <>
                    <span>·</span>
                    <span className="text-yellow-400 font-medium">Featured Title</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-5 text-xs text-slate-300">
          {/* Cover Art Preview */}
          {game.thumbnailUrl && (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <img
                src={game.thumbnailUrl}
                alt={manifest.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f20] via-transparent to-transparent" />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
              About the Game
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {manifest.description}
            </p>
          </div>

          {/* Controls Guide */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Gamepad2 className="h-4 w-4" />
              <span>How to Play & Controls</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-[#0a0f20] p-3 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1 mb-1">
                  <Monitor className="h-3 w-3" />
                  <span>Desktop Controls</span>
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {manifest.controls?.desktop || 'Arrow Keys / Space to Play · P to Pause'}
                </p>
              </div>

              <div className="rounded-lg bg-[#0a0f20] p-3 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 flex items-center gap-1 mb-1">
                  <Smartphone className="h-3 w-3" />
                  <span>Mobile & Touch</span>
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {manifest.controls?.mobile || 'Touch and swipe directly on screen'}
                </p>
              </div>
            </div>
          </div>

          {/* Game Information Table */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Game Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Genre</span>
                <span className="text-slate-200 font-semibold">{manifest.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Platform</span>
                <span className="text-slate-200 font-medium">Web Browser</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Creator</span>
                <span className="text-slate-200 font-medium">{manifest.author || 'AwaisGames'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Performance</span>
                <span className="text-emerald-400 font-semibold">60 FPS</span>
              </div>
            </div>

            {manifest.tags && manifest.tags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                {manifest.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <a
            href={getGamePlayUrl(game.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onClose();
              onPlay(game.id);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-6 py-2.5 font-display text-xs font-extrabold text-slate-950 shadow-md shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
            aria-label={`Play ${game.manifest.title} now in a new tab`}
          >
            <Play className="h-4 w-4 fill-slate-950" />
            <span>PLAY IN NEW TAB</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-950/80" />
          </a>
        </div>
      </div>
    </div>
  );
};

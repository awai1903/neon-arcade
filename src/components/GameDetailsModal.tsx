import React from 'react';
import type { DiscoveredGame } from '../types/game';
import { X, Play, Folder, FileJson, FileCode, Image, Palette, CheckCircle2 } from 'lucide-react';

interface GameDetailsModalProps {
  game: DiscoveredGame | null;
  onClose: () => void;
  onPlay: (id: string) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({ game, onClose, onPlay }) => {
  if (!game) return null;

  const { manifest } = game;
  const assetCount = Object.keys(game.assets).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0c1324] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                games/{game.folderName}/
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{manifest.title}</span>
                <span>·</span>
                <span>ID: {game.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 text-xs text-slate-300">
          {/* Metadata Card */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <FileJson className="h-4 w-4" />
              <span>Manifest Verification (game.json)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="text-slate-200 font-medium">{manifest.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Engine</span>
                <span className="text-slate-200 font-medium">{manifest.engine || 'phaser'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Version</span>
                <span className="text-slate-200 font-mono">v{manifest.version || '1.0.0'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Author</span>
                <span className="text-slate-200">{manifest.author || 'Neon Labs'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Featured State</span>
                <span className="text-slate-200">{game.isFeatured ? 'Yes (Spotlight)' : 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Entry Point</span>
                <span className="text-cyan-300 font-mono">{manifest.entry}</span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-slate-500 block mb-0.5">Description</span>
              <p className="text-slate-300 leading-relaxed">{manifest.description}</p>
            </div>
          </div>

          {/* Asset Isolation */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 space-y-2">
            <div className="flex items-center justify-between text-purple-400 font-semibold">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span>Isolated Folder Assets ({assetCount})</span>
              </div>
              <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Scoped to games/{game.folderName}/
              </span>
            </div>

            {assetCount > 0 ? (
              <div className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {Object.entries(game.assets).map(([key, url]) => (
                  <div key={key} className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-300">{key}</span>
                    <span className="text-slate-500 truncate max-w-[240px] text-[10px]">
                      {url}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs">No standalone assets inside assets/ subfolder.</p>
            )}
          </div>

          {/* Scoped CSS status */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 space-y-1">
            <div className="flex items-center gap-2 text-pink-400 font-semibold">
              <Palette className="h-4 w-4" />
              <span>Scoped Stylesheet ({manifest.style || 'game.css'})</span>
            </div>
            <p className="text-slate-400 text-xs">
              {game.rawCss
                ? 'Stylesheet discovered and ready for dynamic runtime injection on mount.'
                : 'No custom CSS file found; default portal container styles will be used.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onPlay(game.id);
            }}
            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2 font-display text-xs font-bold text-slate-950 hover:bg-cyan-300"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Launch {manifest.title}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { DiscoveredGame } from '../types/game';
import { X, Trophy, Medal, RotateCcw, Play } from 'lucide-react';

interface HighScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: DiscoveredGame[];
  onPlayGame: (id: string) => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  isOpen,
  onClose,
  games,
  onPlayGame,
}) => {
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen) return;
    const currentScores: Record<string, number> = {};
    games.forEach((g) => {
      const stored = localStorage.getItem(`neon_arcade_hs_${g.id}`);
      currentScores[g.id] = stored ? parseInt(stored, 10) : 0;
    });
    setScores(currentScores);
  }, [isOpen, games]);

  if (!isOpen) return null;

  const handleReset = (id: string) => {
    localStorage.removeItem(`neon_arcade_hs_${id}`);
    setScores((prev) => ({ ...prev, [id]: 0 }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-[#0c1324] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Arcade Records</h2>
              <p className="text-xs text-slate-400">All-time local high scores across discovered games</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {games.map((g, idx) => {
            const score = scores[g.id] || 0;
            return (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#070b14] p-3.5 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 font-display text-xs font-bold text-cyan-400">
                    {idx === 0 ? <Medal className="h-4 w-4 text-yellow-400" /> : `#${idx + 1}`}
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">
                      {g.manifest.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">{g.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block font-mono text-sm font-bold text-cyan-400 tabular-nums">
                      {score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">POINTS</span>
                  </div>

                  {score > 0 && (
                    <button
                      onClick={() => handleReset(g.id)}
                      className="p-1 text-slate-500 hover:text-slate-300"
                      title="Clear record"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      onPlayGame(g.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 active:scale-95"
                    title="Play"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

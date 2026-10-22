import React from 'react';
import { Gamepad2, GitBranch, Terminal } from 'lucide-react';

interface FooterProps {
  onOpenDocs: () => void;
  gameCount: number;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDocs, gameCount }) => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-[#060a13] py-10 text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display font-bold text-slate-300">NEON ARCADE</span>
              <span className="mx-2 text-slate-700">·</span>
              <span>Automatic GitHub Game Discovery</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-purple-400" />
              <span>{gameCount} Games Discovered</span>
            </div>
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 transition-colors hover:text-cyan-400"
            >
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              <span>GitOps Specification</span>
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
          <p>
            Build single source of truth: <code className="text-slate-400 font-mono">games/*/game.json</code> via Vite <code className="text-slate-400 font-mono">import.meta.glob</code>.
          </p>
          <p>
            Zero database · Zero admin uploads · Pure Git continuous deployment
          </p>
        </div>
      </div>
    </footer>
  );
};

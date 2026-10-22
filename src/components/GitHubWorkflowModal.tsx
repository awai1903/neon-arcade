import React, { useState } from 'react';
import { X, Copy, Check, GitCommit, PlayCircle, FolderPlus, Terminal, FileCode2 } from 'lucide-react';

interface GitHubWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubWorkflowModal: React.FC<GitHubWorkflowModalProps> = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const sampleJson = `{
  "id": "my-cool-game",
  "title": "Cosmic Drift",
  "description": "Navigate asteroid belts and collect hyper-crystals.",
  "category": "Arcade",
  "thumbnail": "./thumbnail.webp",
  "entry": "game.js",
  "style": "game.css",
  "engine": "phaser",
  "version": "1.0.0",
  "featured": true,
  "controls": {
    "desktop": "Arrow Keys to steer · Space to boost",
    "mobile": "Touch screen left/right to steer"
  }
}`;

  const sampleJs = `import Phaser from 'phaser';

class SceneA extends Phaser.Scene {
  constructor() {
    super({ key: 'SceneA' });
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'Game Active!', {
      fontSize: '28px',
      color: '#06b6d4'
    }).setOrigin(0.5);
  }
}

/**
 * Standard Neon Arcade Contract
 */
export function createGame(container, options = {}) {
  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: 800,
    height: 480,
    backgroundColor: '#070b14',
    scene: [SceneA]
  };

  const game = new Phaser.Game(config);

  return {
    gameInstance: game,
    destroy: (removeCanvas = true) => {
      game.destroy(removeCanvas);
    }
  };
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0c1324] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Add Game to GitHub & Auto-Deploy
              </h2>
              <p className="text-xs text-slate-400">
                Single source of truth: <code className="text-cyan-300">games/</code> directory
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6 text-xs text-slate-300">
          {/* Step 1: Directory Tree */}
          <div className="space-y-2">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px] font-bold text-slate-950">1</span>
              <span>Create your game directory structure</span>
            </h3>
            <p className="text-slate-400">
              Create a new folder in <code className="text-cyan-300">games/&lt;your-game-id&gt;/</code>. All game code, styles, thumbnails, and assets live exclusively inside this folder:
            </p>
            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3 font-mono text-[11px] text-slate-300 leading-relaxed">
              <span className="text-cyan-400">games/</span><br />
              &nbsp;&nbsp;└── <span className="text-purple-400">my-cool-game/</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── <span className="text-emerald-400">game.json</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Manifest (title, category, entry, thumbnail)</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── <span className="text-blue-400">game.js</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Entry script exporting createGame(container, options)</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── <span className="text-yellow-400">game.css</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Scoped CSS for your container</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── <span className="text-pink-400">thumbnail.webp</span>&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># 4:3 cover art displayed on homepage</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── <span className="text-slate-300">assets/</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── player.png<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── sound.wav
            </div>
          </div>

          {/* Step 2: Manifest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px] font-bold text-slate-950">2</span>
                <span>Write <code className="text-emerald-400 font-mono text-xs">game.json</code></span>
              </h3>
              <button
                onClick={() => copyToClipboard(sampleJson, 'json')}
                className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
              >
                {copiedType === 'json' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedType === 'json' ? 'Copied' : 'Copy Manifest'}</span>
              </button>
            </div>
            <pre className="rounded-xl border border-slate-800 bg-[#070b14] p-3 font-mono text-[11px] text-cyan-200 overflow-x-auto">
              {sampleJson}
            </pre>
          </div>

          {/* Step 3: Game Contract */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px] font-bold text-slate-950">3</span>
                <span>Implement <code className="text-blue-400 font-mono text-xs">game.js</code> Export Contract</span>
              </h3>
              <button
                onClick={() => copyToClipboard(sampleJs, 'js')}
                className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
              >
                {copiedType === 'js' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedType === 'js' ? 'Copied' : 'Copy JS Contract'}</span>
              </button>
            </div>
            <pre className="rounded-xl border border-slate-800 bg-[#070b14] p-3 font-mono text-[11px] text-purple-200 overflow-x-auto">
              {sampleJs}
            </pre>
          </div>

          {/* Step 4: Git Commit & Push */}
          <div className="space-y-2">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 text-[10px] font-bold text-slate-950">4</span>
              <span>Commit & Push to GitHub</span>
            </h3>
            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3 font-mono text-[11px] text-emerald-300">
              git add games/my-cool-game<br />
              git commit -m "feat(games): add Cosmic Drift game"<br />
              git push origin main
            </div>
            <p className="text-slate-400 leading-relaxed">
              When pushed, Netlify triggers <code className="text-slate-200">npm run build</code>. 
              Vite's <code className="text-cyan-300">import.meta.glob</code> automatically resolves your new folder, generates the game card, creates the route, and bundles your assets. No database or manual editing required!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-4 py-2 font-display text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Shield, Mail, FileText, Info, ExternalLink, Github } from 'lucide-react';

interface LegalModalsProps {
  modalType: 'about' | 'privacy' | 'contact' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ modalType, onClose }) => {
  if (!modalType) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-800 bg-[#0a0f20] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            {modalType === 'about' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Info className="h-4 w-4" />
              </div>
            )}
            {modalType === 'privacy' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Shield className="h-4 w-4" />
              </div>
            )}
            {modalType === 'contact' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Mail className="h-4 w-4" />
              </div>
            )}
            <div>
              <h2 id="modal-title" className="font-display text-base font-bold text-white">
                {modalType === 'about' && 'About AwaisGames'}
                {modalType === 'privacy' && 'Privacy & Terms'}
                {modalType === 'contact' && 'Contact & Bug Reports'}
              </h2>
              <span className="text-xs text-slate-400">
                {modalType === 'about' && 'Free browser-based gaming'}
                {modalType === 'privacy' && 'Data storage and platform terms'}
                {modalType === 'contact' && 'Repository and inquiries'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 text-xs text-slate-300 leading-relaxed">
          {modalType === 'about' && (
            <div className="space-y-3">
              <p>
                AwaisGames is a web platform for discovering and playing HTML5 and Phaser browser games directly in your browser without downloads or account registration.
              </p>
              <div className="rounded-lg border border-slate-800 bg-[#060913] p-3.5 space-y-2">
                <h3 className="font-display text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  How to Play:
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                  <li>Select any game card from the homepage catalogue.</li>
                  <li>Games load directly into a responsive canvas viewport.</li>
                  <li>Controls are displayed beside each game for desktop keyboard and mobile touch.</li>
                  <li>High scores and recently played games are stored locally in your browser.</li>
                </ul>
              </div>
              <p className="text-slate-400">
                All games are optimized for fast loading and responsive 60 FPS performance across desktop, tablet, and mobile browsers. Enjoy arcade entertainment with zero waiting.
              </p>
            </div>
          )}

          {modalType === 'privacy' && (
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-white mb-1">Local Storage</h3>
                <p className="text-slate-400">
                  AwaisGames uses your browser's local storage solely to remember your high scores and your last 3 recently played games. This information is saved locally on your device and is never transmitted to any external server.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Accounts & Personal Data</h3>
                <p className="text-slate-400">
                  No account registration, email address, password, or payment details are collected to use this website.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Terms of Service</h3>
                <p className="text-slate-400">
                  Games hosted on AwaisGames are provided free for personal entertainment. All game source files and assets remain the property of their respective creators.
                </p>
              </div>
            </div>
          )}

          {modalType === 'contact' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                For feedback, gameplay bug reports, or inquiries regarding game additions, use the official GitHub repository or direct contact link:
              </p>

              <div className="space-y-2.5">
                <a
                  href="https://github.com/awai1903/neon-arcade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#060913] p-3 transition-colors hover:border-slate-700 hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <Github className="h-4 w-4 text-cyan-400" />
                    <div>
                      <span className="font-semibold text-white block">GitHub Repository</span>
                      <span className="text-[11px] text-slate-500 font-mono">github.com/awai1903/neon-arcade</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </a>

                <a
                  href="https://github.com/awai1903/neon-arcade/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#060913] p-3 transition-colors hover:border-slate-700 hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-violet-400" />
                    <div>
                      <span className="font-semibold text-white block">File a Bug or Feature Request</span>
                      <span className="text-[11px] text-slate-500">Submit an issue directly on GitHub</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 font-display text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

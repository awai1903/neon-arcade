import React from 'react';
import { Gamepad2, GitBranch, Terminal, Shield, FileText, Mail, Heart } from 'lucide-react';

interface FooterProps {
  onOpenDocs: () => void;
  onOpenAbout: () => void;
  onOpenPrivacy: () => void;
  onOpenContact: () => void;
  gameCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDocs,
  onOpenAbout,
  onOpenPrivacy,
  onOpenContact,
  gameCount,
}) => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-[#04060d] py-12 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 text-slate-950 font-bold">
                <Gamepad2 className="h-4 w-4 fill-slate-950" />
              </div>
              <span className="font-display text-base font-extrabold tracking-tight text-white">
                Awais<span className="text-cyan-400">Games</span>
              </span>
            </div>
            <p className="max-w-sm text-xs text-slate-400 leading-relaxed">
              High-performance, instant browser gaming portal. Free web games crafted with modern HTML5 and Phaser 3 engines. No downloads, no installs.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span>Netlify Continuous Deployment Active</span>
              <span>·</span>
              <span className="font-mono">{gameCount} Games Loaded</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2.5">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={onOpenAbout} className="hover:text-cyan-400 transition-colors">
                  About AwaisGames
                </button>
              </li>
              <li>
                <button onClick={onOpenDocs} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-cyan-400" />
                  <span>GitHub Discovery Spec</span>
                </button>
              </li>
              <li>
                <a href="#games-catalogue" className="hover:text-cyan-400 transition-colors">
                  All Games
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-2.5">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
              Legal & Support
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={onOpenPrivacy} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-slate-500" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenPrivacy} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-slate-500" />
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenContact} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-slate-500" />
                  <span>Contact Developer</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} AwaisGames. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://awaisgames.netlify.app/"
              className="text-slate-400 hover:text-cyan-300 font-mono"
            >
              awaisgames.netlify.app
            </a>
            <span className="text-slate-700">·</span>
            <span>Single source of truth: <code className="text-slate-400 font-mono">games/</code></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

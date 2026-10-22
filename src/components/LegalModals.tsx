import React, { useState } from 'react';
import { X, Shield, Mail, CheckCircle2, FileText, Info, Send } from 'lucide-react';

interface LegalModalsProps {
  modalType: 'about' | 'privacy' | 'contact' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ modalType, onClose }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  if (!modalType) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage) return;
    setContactSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0a0f20] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            {modalType === 'about' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Info className="h-5 w-5" />
              </div>
            )}
            {modalType === 'privacy' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
            )}
            {modalType === 'contact' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Mail className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                {modalType === 'about' && 'About AwaisGames'}
                {modalType === 'privacy' && 'Privacy Policy & Terms'}
                {modalType === 'contact' && 'Contact AwaisGames Team'}
              </h2>
              <span className="text-xs text-slate-400">
                {modalType === 'about' && 'The GitOps-powered web gaming platform'}
                {modalType === 'privacy' && 'Transparent, privacy-first browser gaming'}
                {modalType === 'contact' && 'Get in touch with the platform developers'}
              </span>
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
        <div className="mt-5 space-y-4 text-xs text-slate-300 leading-relaxed">
          {modalType === 'about' && (
            <div className="space-y-3">
              <p>
                <strong>AwaisGames</strong> is a next-generation browser gaming platform designed for instant playability, smooth framerates, and seamless game discovery.
              </p>
              <p>
                Unlike bloated portals filled with disruptive popups and aggressive paywalls, AwaisGames focuses on high-speed HTML5 and Phaser 3 gameplay with instant asset loading.
              </p>
              <div className="rounded-xl border border-slate-800 bg-[#060913] p-3.5 space-y-2">
                <h4 className="font-display text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Key Platform Strengths:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Zero Installs:</strong> Games boot directly into your canvas viewport.</li>
                  <li><strong>Automatic Discovery:</strong> Pure Git-driven catalogue in the <code className="text-cyan-300">games/</code> directory.</li>
                  <li><strong>Full Isolation:</strong> Every game manages its own assets, styles, and memory lifecycle.</li>
                  <li><strong>Responsive Control:</strong> First-class desktop keyboard & mobile touch input.</li>
                </ul>
              </div>
            </div>
          )}

          {modalType === 'privacy' && (
            <div className="space-y-3">
              <p>
                <strong>Privacy First Commitment:</strong> AwaisGames respects your privacy. We do not require account registration, passwords, or personal credentials to play games.
              </p>
              <div className="space-y-2">
                <h4 className="font-bold text-white">1. Local Storage Usage</h4>
                <p className="text-slate-400">
                  We use your browser's local storage solely to remember high scores and your last 3 recently played games. This data never leaves your device.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-white">2. Zero Invasive Trackers</h4>
                <p className="text-slate-400">
                  AwaisGames does not sell data to third-party ad brokers or execute behavioral fingerprinting scripts.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-white">3. Terms of Service</h4>
                <p className="text-slate-400">
                  Games hosted on AwaisGames are provided for free entertainment. Community contributors retain rights to their game source and assets.
                </p>
              </div>
            </div>
          )}

          {modalType === 'contact' && (
            <div>
              {contactSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white">Message Dispatched</h3>
                  <p className="text-slate-400 max-w-sm text-xs">
                    Thank you for reaching out to the AwaisGames team. We will review your message shortly!
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Alex Hunter"
                      className="w-full rounded-lg border border-slate-800 bg-[#060913] p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full rounded-lg border border-slate-800 bg-[#060913] p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Message or Game Feedback</label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Share suggestions, report an obstacle collision glitch, or inquire about publishing..."
                      className="w-full rounded-lg border border-slate-800 bg-[#060913] p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-300 px-4 py-2 font-display text-xs font-bold text-slate-950 hover:brightness-110"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(!contactSubmitted || modalType !== 'contact') && (
          <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 font-display text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Smartphone, Download, Sparkles, X, ChevronRight } from 'lucide-react';

interface InstallPwaBannerProps {
  onOpenInstallModal: () => void;
  onDismiss: () => void;
  hasPrompt?: boolean;
}

export const InstallPwaBanner: React.FC<InstallPwaBannerProps> = ({
  onOpenInstallModal,
  onDismiss,
  hasPrompt = false
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 rounded-2xl p-3.5 sm:p-4 shadow-md border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in mb-3">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-indigo-950 text-amber-400 rounded-xl font-black shrink-0 shadow-sm">
          <Smartphone className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-xs sm:text-sm font-black text-slate-950">
              Pasang Aplikasi di Layar Utama HP
            </h4>
            <span className="bg-indigo-950 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              PWA
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-900 mt-0.5 leading-relaxed font-medium">
            Akses langsung satu ketukan dari menu HP guru tanpa perlu repot buka link di browser.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={onOpenInstallModal}
          className="flex-1 sm:flex-none px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-amber-300 rounded-xl font-black text-xs shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>{hasPrompt ? 'Instal Sekarang (1-Klik)' : 'Cara Pasang di HP'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400/80" />
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="p-2 text-slate-800 hover:text-slate-950 hover:bg-amber-300/60 rounded-xl transition cursor-pointer"
          title="Tutup banner"
          aria-label="Tutup Banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

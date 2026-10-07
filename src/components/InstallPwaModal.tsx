import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  MoreVertical,
  HelpCircle
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallSuccess?: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect if already installed (standalone mode)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode && onInstallSuccess) {
      onInstallSuccess();
    }
  }, [onInstallSuccess]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (onInstallSuccess) onInstallSuccess();
          onClose();
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setInstalling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Visual Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-950 text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-black shadow-lg">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Aplikasi Resmi Madrasah
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">Pasang di Layar HP (PWA)</h3>
            </div>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed mt-2">
            Pasang langsung ke layar HP Anda agar aplikasi terbuka cepat seperti dari Play Store tanpa perlu mengetik ulang link web.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isStandalone ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black">Aplikasi Sudah Terpasang!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Aplikasi ini sudah berjalan dalam mode PWA di perangkat Anda. Anda dapat membukanya langsung dari ikon di layar utama HP.
                </p>
              </div>
            </div>
          ) : deferredPrompt ? (
            /* Direct 1-Click Install Button for Supported Browsers (Chrome / Edge / Opera) */
            <div className="space-y-4">
              <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
                <div className="flex items-center space-x-2 font-black text-indigo-900 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Pemasangan Otomatis 1-Klik Siap</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Browser Anda mendukung instalasi otomatis. Cukup klik tombol di bawah ini untuk memasang aplikasi ke menu layar HP Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleNativeInstall}
                disabled={installing}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-slate-950" />
                <span>{installing ? 'Memproses Pemasangan...' : 'Instal Aplikasi di HP Sekarang'}</span>
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Visual Guide */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 font-semibold flex items-center space-x-2">
                <Compass className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Petunjuk Khusus Pengguna iPhone / iPad (Safari)</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Ketuk Tombol Bagikan (Share)</p>
                    <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                      Ketuk ikon kotak berpanah ke atas <Share2 className="w-3.5 h-3.5 text-indigo-600 inline" /> di bilah bawah browser Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Pilih "Tambah ke Layar Utama"</p>
                    <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                      Gulir ke bawah pada menu, lalu pilih opsi <PlusSquare className="w-3.5 h-3.5 text-indigo-600 inline" /> <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Selesai!</p>
                    <p className="text-slate-500 mt-0.5">
                      Ketuk <strong>"Tambah / Add"</strong> di pojok kanan atas. Ikon aplikasi langsung muncul di menu HP Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android Chrome Step-by-Step Visual Guide */
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 text-xs text-indigo-950 font-semibold flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Petunjuk Mudah Pengguna Android (Google Chrome)</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Ketuk Menu Titik Tiga (⋮)</p>
                    <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                      Ketuk tombol menu <MoreVertical className="w-3.5 h-3.5 text-indigo-600 inline" /> di pojok kanan atas Google Chrome HP Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Pilih "Tambahkan ke Layar Utama" / "Instal Aplikasi"</p>
                    <p className="text-slate-500 mt-0.5">
                      Cari opsi <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Konfirmasi Pemasangan</p>
                    <p className="text-slate-500 mt-0.5">
                      Ketuk <strong>"Instal"</strong>. Aplikasi langsung siap dibuka dari beranda HP tanpa membuka browser lagi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Advantages */}
          <div className="pt-2 border-t border-slate-100">
            <h5 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
              Keunggulan Setelah Dipasang di HP:
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">Buka Cepat Tanpa URL</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">Push Notifikasi Aktif</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">Layar Penuh (Full Screen)</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">Hemat Kuota Internet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          {!isStandalone ? (
            <button
              type="button"
              onClick={() => {
                if (onInstallSuccess) onInstallSuccess();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saya Sudah Pasang di Layar HP</span>
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

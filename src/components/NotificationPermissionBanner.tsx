import React from 'react';
import { Bell, BellRing, Check, ShieldAlert, Sparkles, X } from 'lucide-react';

interface NotificationPermissionBannerProps {
  permission: NotificationPermission;
  onRequestPermission: () => Promise<void>;
  onDismiss: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  permission,
  onRequestPermission,
  onDismiss
}) => {
  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-4 sm:p-4.5 shadow-lg border border-indigo-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in mb-4">
      <div className="flex items-start space-x-3.5">
        <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shrink-0 shadow-md">
          <BellRing className="w-5 h-5 text-slate-950 animate-bounce" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-black text-white">Aktifkan Notifikasi Pengumuman di HP</h4>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Penting
            </span>
          </div>
          <p className="text-xs text-indigo-100 mt-0.5 leading-relaxed">
            Dapatkan siaran pesan resmi, info darurat, dan pengumuman madrasah langsung di layar HP/browser Anda secara realtime.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={onRequestPermission}
          className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Izinkan Notifikasi</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          title="Tutup permintaan izin"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

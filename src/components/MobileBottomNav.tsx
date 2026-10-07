import React from 'react';
import { ActiveTab } from '../types';
import { CalendarDays, BookMarked, LayoutGrid, BarChart3, UserCheck, ExternalLink, Smartphone, Library } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  todaySessionCount?: number;
  onOpenInstallPwa?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  todaySessionCount = 0,
  onOpenInstallPwa,
}) => {
  return (
    <nav
      aria-label="Navigasi Menu Cepat Mobile"
      className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] select-none pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className={`grid ${onOpenInstallPwa ? 'grid-cols-7' : 'grid-cols-6'} items-stretch max-w-xl mx-auto px-1 py-1 gap-0.5`}>
        {/* 1. Jadwal Pelajaran */}
        <button
          type="button"
          onClick={() => onTabChange('jadwal')}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer relative min-h-[50px] ${
            activeTab === 'jadwal'
              ? 'text-indigo-900 font-extrabold bg-indigo-50/80 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
          }`}
        >
          <div className="relative">
            <CalendarDays
              className={`w-4 h-4 transition-transform duration-150 ${
                activeTab === 'jadwal' ? 'text-indigo-600 scale-110' : 'text-slate-400'
              }`}
            />
            {activeTab === 'jadwal' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[8.5px] leading-tight mt-0.5 text-center truncate max-w-full">
            Jadwal
          </span>
        </button>

        {/* 2. Jurnal Mengajar */}
        <button
          type="button"
          onClick={() => onTabChange('jurnal')}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer relative min-h-[50px] ${
            activeTab === 'jurnal'
              ? 'text-indigo-900 font-extrabold bg-indigo-50/80 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
          }`}
        >
          <div className="relative">
            <BookMarked
              className={`w-4 h-4 transition-transform duration-150 ${
                activeTab === 'jurnal' ? 'text-indigo-600 scale-110' : 'text-slate-400'
              }`}
            />
            {todaySessionCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-indigo-600 text-white font-bold text-[8px] rounded-full min-w-[13px] text-center">
                {todaySessionCount}
              </span>
            )}
            {activeTab === 'jurnal' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[8.5px] leading-tight mt-0.5 text-center truncate max-w-full">
            Jurnal
          </span>
        </button>

        {/* 3. Monitor Matrix */}
        <button
          type="button"
          onClick={() => onTabChange('matrix')}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer relative min-h-[50px] ${
            activeTab === 'matrix'
              ? 'text-indigo-900 font-extrabold bg-indigo-50/80 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
          }`}
        >
          <div className="relative">
            <LayoutGrid
              className={`w-4 h-4 transition-transform duration-150 ${
                activeTab === 'matrix' ? 'text-teal-600 scale-110' : 'text-slate-400'
              }`}
            />
            {activeTab === 'matrix' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[8.5px] leading-tight mt-0.5 text-center truncate max-w-full">
            Matrix
          </span>
        </button>

        {/* 4. Laporan Rekapitulasi Presensi */}
        <button
          type="button"
          onClick={() => onTabChange('rekap')}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer relative min-h-[50px] ${
            activeTab === 'rekap'
              ? 'text-indigo-900 font-extrabold bg-indigo-50/80 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold'
          }`}
          title="Laporan Rekapitulasi Presensi Siswa"
        >
          <div className="relative">
            <BarChart3
              className={`w-4 h-4 transition-transform duration-150 ${
                activeTab === 'rekap' ? 'text-indigo-600 scale-110' : 'text-slate-400'
              }`}
            />
            {activeTab === 'rekap' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
            )}
          </div>
          <span className="text-[8px] leading-tight mt-0.5 text-center font-bold tracking-tight truncate max-w-full">
            Laporan
          </span>
        </button>

        {/* 5. Perpustakaan Digital */}
        <a
          href="https://perpus-digitalmbi.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-amber-800 hover:text-amber-950 hover:bg-amber-100 font-bold transition-all duration-150 cursor-pointer relative min-h-[50px] group border border-amber-300/80 bg-amber-50"
          title="Buka Perpustakaan Digital Madrasah"
        >
          <div className="relative flex items-center justify-center">
            <Library className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform duration-150" />
            <ExternalLink className="w-2 h-2 text-amber-600 absolute -top-1 -right-2" />
          </div>
          <span className="text-[8px] leading-tight mt-0.5 text-center text-amber-950 font-black truncate max-w-full">
            Perpus
          </span>
        </a>

        {/* 6. Pasang Aplikasi di HP (PWA) */}
        {onOpenInstallPwa && (
          <button
            type="button"
            onClick={onOpenInstallPwa}
            className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-amber-900 hover:bg-amber-100 font-black transition-all duration-150 cursor-pointer relative min-h-[50px] bg-amber-50/80 border border-amber-200/80"
            title="Pasang Aplikasi di Layar HP"
          >
            <div className="relative">
              <Smartphone className="w-4 h-4 text-amber-600 animate-bounce" />
            </div>
            <span className="text-[8px] leading-tight mt-0.5 text-center text-amber-950 font-black truncate max-w-full">
              Pasang HP
            </span>
          </button>
        )}

        {/* 7. Portal Absensi Guru */}
        <a
          href="https://absensi-jurnal-guru.ai.studio/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/80 font-bold transition-all duration-150 cursor-pointer relative min-h-[50px] group border border-emerald-200/60 bg-emerald-50/40"
          title="Buka Portal Absensi Guru"
        >
          <div className="relative flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform duration-150" />
            <ExternalLink className="w-2 h-2 text-emerald-500 absolute -top-1 -right-2" />
          </div>
          <span className="text-[8px] leading-tight mt-0.5 text-center text-emerald-800 font-extrabold truncate max-w-full">
            Portal Guru
          </span>
        </a>
      </div>
    </nav>
  );
};

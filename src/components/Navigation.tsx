import React, { useState } from 'react';
import { ActiveTab, SchoolOfficials } from '../types';
import { getStoredSchoolOfficials } from '../utils/storage';
import {
  ClipboardCheck,
  CalendarDays,
  BookMarked,
  LayoutGrid,
  GraduationCap,
  FileText,
  BarChart3,
  Database,
  Sparkles,
  ShieldAlert,
  ExternalLink,
  Trophy,
  UserCheck,
  WalletCards,
  ShieldCheck,
  Smartphone,
  Download,
  Library,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  X,
  Eye,
  EyeOff,
  Mail,
  CalendarCheck
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  sessionCount?: number;
  todaySessionCount?: number;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  onOpenInstallPwa?: () => void;
  isAutoHide?: boolean;
  onToggleAutoHide?: () => void;
  offlineQueueCount?: number;
  schoolOfficials?: SchoolOfficials;
  schoolName?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  sessionCount = 0,
  todaySessionCount = 0,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
  onOpenInstallPwa,
  isAutoHide = false,
  onToggleAutoHide,
  offlineQueueCount = 0,
  schoolOfficials,
  schoolName
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const activeSchoolName = schoolOfficials?.namaSekolah || schoolName || getStoredSchoolOfficials()?.namaSekolah || 'Madrasah';
  
  // Generate smart abbreviation / initials from school name (e.g. "MTs Manbaul Islam" -> "MI", "MTs Nurul Huda" -> "NH")
  const schoolInitials = (() => {
    const stripped = activeSchoolName.replace(/^madrasah\s+tsanawiyah\s+/i, '').replace(/^mts\s+/i, '').trim();
    const parts = stripped.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'MI';
  })();

  // Determine if sidebar is currently in expanded visual view
  // On desktop: if not auto-hide, always expanded; if auto-hide, expanded when mouse hovers
  const isExpanded = !isAutoHide || isHovered || isMobileMenuOpen;

  const primaryNav = [
    {
      id: 'jadwal' as ActiveTab,
      label: 'Jadwal Pelajaran',
      icon: CalendarDays,
      badge: 'MENU UTAMA',
      badgeColor: 'bg-amber-400 text-emerald-950 font-black tracking-wider'
    },
    {
      id: 'absensi' as ActiveTab,
      label: 'Absensi & Jurnal KBM',
      icon: ClipboardCheck,
      badge: offlineQueueCount > 0 ? `${offlineQueueCount} Offline` : 'Input KBM',
      badgeColor: offlineQueueCount > 0 ? 'bg-amber-400 text-slate-950 font-black animate-pulse' : 'bg-emerald-400 text-emerald-950 font-extrabold'
    },
    {
      id: 'jurnal' as ActiveTab,
      label: 'Jurnal Mengajar',
      icon: BookMarked,
      badge: `${todaySessionCount} Hari Ini`,
      badgeColor: 'bg-emerald-300 text-emerald-950 font-bold'
    },
    {
      id: 'matrix' as ActiveTab,
      label: 'Monitoring Matrix',
      icon: LayoutGrid,
      badge: 'Live KBM',
      badgeColor: 'bg-teal-300 text-emerald-950 font-extrabold'
    },
  ];

  const adminNav = [
    {
      id: 'kurikulum' as ActiveTab,
      label: 'Waka Kurikulum & Ujian',
      icon: CalendarCheck,
      badge: 'STS / SAS',
      badgeColor: 'bg-emerald-400 text-slate-950 font-black'
    },
    {
      id: 'walikelas' as ActiveTab,
      label: 'Menu Wali Kelas',
      icon: UserCheck,
      badge: 'Wali Kelas',
      badgeColor: 'bg-teal-300 text-emerald-950 font-black'
    },
    {
      id: 'pembayaran' as ActiveTab,
      label: 'Kas & Pembayaran Siswa',
      icon: WalletCards,
      badge: 'KEUANGAN',
      badgeColor: 'bg-amber-400 text-slate-950 font-black'
    },
    {
      id: 'kesiswaan' as ActiveTab,
      label: 'Wakasek Kesiswaan & BK',
      icon: ShieldAlert,
      badge: 'Poin BK',
      badgeColor: 'bg-rose-500 text-white font-black'
    },
    {
      id: 'tatausaha' as ActiveTab,
      label: 'Bagian Tata Usaha (TU)',
      icon: Mail,
      badge: 'PERSURATAN',
      badgeColor: 'bg-indigo-500 text-white font-black'
    },
    {
      id: 'penilaian' as ActiveTab,
      label: 'Nilai & Siswa',
      icon: GraduationCap
    },
    {
      id: 'rekap' as ActiveTab,
      label: 'Laporan Rekap',
      icon: BarChart3
    },
    {
      id: 'identitas' as ActiveTab,
      label: 'Identitas Lembaga',
      icon: Landmark,
      badge: 'PROFIL',
      badgeColor: 'bg-amber-400 text-slate-950 font-black'
    },
    {
      id: 'datamaster' as ActiveTab,
      label: 'Data Master',
      icon: Database
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Khusus Super Admin',
      icon: ShieldCheck,
      badge: 'ADMIN',
      badgeColor: 'bg-amber-400 text-slate-950 font-black'
    },
  ];

  const aiNav = [
    {
      id: 'ai' as ActiveTab,
      label: 'Asisten AI Guru',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-indigo-400 text-indigo-950 font-bold'
    }
  ];

  const renderNavItem = (tab: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => {
          onTabChange(tab.id);
          if (onCloseMobileMenu) onCloseMobileMenu();
        }}
        title={!isExpanded ? `${tab.label} ${tab.badge ? `(${tab.badge})` : ''}` : undefined}
        className={`w-full flex items-center transition-all duration-200 cursor-pointer group ${
          isExpanded ? 'justify-between px-4 py-2.5' : 'justify-center py-2.5 px-2'
        } text-xs font-semibold ${
          isActive
            ? 'bg-[#15803d] text-white border-l-4 border-emerald-300 font-bold shadow-md'
            : 'text-emerald-100 hover:bg-[#146030]/70 hover:text-white opacity-90 hover:opacity-100'
        }`}
      >
        <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center w-full'}`}>
          <div className="relative flex items-center justify-center">
            <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
              isActive ? 'text-amber-300' : 'text-emerald-300/80 group-hover:text-emerald-100'
            }`} />
            {/* Dot indicator when collapsed & active */}
            {!isExpanded && isActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0e4822] animate-pulse" />
            )}
          </div>
          {isExpanded && (
            <span className="truncate text-left leading-tight">{tab.label}</span>
          )}
        </div>

        {isExpanded && tab.badge && (
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tight shrink-0 ml-1.5 shadow-2xs ${
              tab.badgeColor || 'bg-emerald-700 text-emerald-100'
            }`}
          >
            {tab.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Spacer div on Desktop when in Auto-Hide mode to keep layout fluid */}
      {isAutoHide && (
        <div className="hidden lg:block w-16 shrink-0 transition-all duration-300" />
      )}

      {/* Main Aside Container */}
      <aside
        onMouseEnter={() => {
          if (isAutoHide) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isAutoHide) setIsHovered(false);
        }}
        className={`bg-[#0e4822] text-white flex flex-col h-full border-r border-[#146030] select-none transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'block fixed inset-y-0 left-0 z-50 w-64 shadow-2xl'
            : isAutoHide
            ? isHovered
              ? 'fixed inset-y-0 left-0 z-40 w-64 shadow-2xl bg-[#0e4822]/98 backdrop-blur-md border-r-2 border-[#16a34a]/80'
              : 'hidden lg:flex fixed inset-y-0 left-0 z-30 w-16 shadow-md'
            : 'hidden lg:flex shrink-0 w-64'
        }`}
      >
        {/* Brand & Auto-Hide Control Section */}
        <div className={`border-b border-[#146030]/80 bg-[#072d15]/80 transition-all ${
          isExpanded ? 'p-4' : 'p-3 flex flex-col items-center justify-center'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 border border-emerald-400/40 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                {schoolInitials}
              </div>
              {isExpanded && (
                <div className="animate-in fade-in duration-200 truncate">
                  <h1 className="text-sm font-extrabold tracking-tight uppercase leading-tight text-white flex items-center space-x-1.5">
                    <span>ADMIN MADRASAH</span>
                  </h1>
                  <p className="text-[10px] text-emerald-200/90 font-medium truncate" title={activeSchoolName}>
                    {activeSchoolName}
                  </p>
                </div>
              )}
            </div>

            {/* Close on Mobile / Pin Toggle on Desktop */}
            {isMobileMenuOpen ? (
              <button
                type="button"
                onClick={onCloseMobileMenu}
                className="w-8 h-8 rounded-lg bg-[#146030]/80 hover:bg-[#15803d] text-emerald-100 flex items-center justify-center transition cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            ) : isExpanded && onToggleAutoHide ? (
              <button
                type="button"
                onClick={onToggleAutoHide}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1 border ${
                  isAutoHide
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                    : 'bg-[#146030]/80 text-emerald-100 border-emerald-700 hover:bg-[#15803d]'
                }`}
                title={isAutoHide ? 'Sematkan Menu (Tetap Terbuka)' : 'Aktifkan Mode Sembunyi Otomatis (Auto-Hide)'}
              >
                {isAutoHide ? (
                  <PinOff className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Pin className="w-3.5 h-3.5" />
                )}
              </button>
            ) : null}
          </div>

          {/* Mode Indicator Pill when Expanded in Auto-Hide */}
          {isExpanded && isAutoHide && !isMobileMenuOpen && (
            <div className="mt-2.5 pt-2 border-t border-[#146030]/50 flex items-center justify-between text-[10px] text-amber-300/90">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-semibold">Mode Auto-Hide Aktif</span>
              </span>
              <button
                type="button"
                onClick={onToggleAutoHide}
                className="underline hover:text-white font-bold cursor-pointer"
              >
                Sematkan
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-4 overflow-x-hidden scrollbar-thin scrollbar-thumb-emerald-700">
          
          {/* Utama Section */}
          <div>
            {isExpanded && (
              <div className="px-4 mb-1 text-[10px] uppercase tracking-widest text-emerald-300/80 font-bold animate-in fade-in">
                Utama
              </div>
            )}
            <div className="space-y-0.5">
              {primaryNav.map(renderNavItem)}
              
              {/* External Link: Portal Absensi Guru */}
              <a
                href="https://absensi-jurnal-guru.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                title={!isExpanded ? 'Portal Absensi Guru' : undefined}
                className={`w-full flex items-center transition-colors cursor-pointer border-l-4 border-emerald-400 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100 ${
                  isExpanded ? 'justify-between px-4 py-2.5' : 'justify-center py-2.5 px-2'
                } text-xs font-bold mt-1`}
              >
                <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  {isExpanded && <span className="truncate">Portal Absensi Guru</span>}
                </div>
                {isExpanded && (
                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase bg-emerald-400 text-emerald-950">
                      Portal
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-300 opacity-80" />
                  </div>
                )}
              </a>

              {/* External Link: Perpus Digital */}
              <a
                href="https://perpus-digitalmbi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                title={!isExpanded ? 'Perpustakaan Digital' : undefined}
                className={`w-full flex items-center transition-colors cursor-pointer border-l-4 border-amber-400 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100 ${
                  isExpanded ? 'justify-between px-4 py-2.5' : 'justify-center py-2.5 px-2'
                } text-xs font-bold mt-1`}
              >
                <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
                  <Library className="w-4 h-4 text-amber-400 shrink-0" />
                  {isExpanded && <span className="truncate">Perpustakaan Digital</span>}
                </div>
                {isExpanded && (
                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase bg-amber-400 text-emerald-950">
                      Perpus
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300 opacity-80" />
                  </div>
                )}
              </a>
            </div>
          </div>

          {/* Administrasi Section */}
          <div>
            {isExpanded && (
              <div className="px-4 mb-1 text-[10px] uppercase tracking-widest text-emerald-300/80 font-bold animate-in fade-in">
                Administrasi & Data
              </div>
            )}
            <div className="space-y-0.5">
              {adminNav.map(renderNavItem)}
            </div>
          </div>

          {/* Fitur Pintar AI Section */}
          <div>
            {isExpanded && (
              <div className="px-4 mb-1 text-[10px] uppercase tracking-widest text-emerald-300/80 font-bold animate-in fade-in">
                Kecerdasan Buatan
              </div>
            )}
            <div className="space-y-0.5">
              {aiNav.map(renderNavItem)}
            </div>
          </div>

          {/* Layanan Kesiswaan & Kedisiplinan Section */}
          <div>
            {isExpanded && (
              <div className="px-4 mb-1 text-[10px] uppercase tracking-widest text-emerald-300/80 font-bold animate-in fade-in">
                Ekstrakulikuler
              </div>
            )}
            <div className="space-y-1">
              <a
                href="https://administrasi-ekstrakulikuler-mts-manbau-islam.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                title={!isExpanded ? 'Portal Ekstrakulikuler' : undefined}
                className={`w-full flex items-center transition-colors cursor-pointer border-l-4 border-emerald-400/80 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100 ${
                  isExpanded ? 'justify-between px-4 py-2.5' : 'justify-center py-2.5 px-2'
                } text-xs font-semibold`}
              >
                <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
                  <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                  {isExpanded && <span className="truncate">Portal Ekstrakulikuler</span>}
                </div>
                {isExpanded && <ExternalLink className="w-3.5 h-3.5 text-emerald-300 opacity-80 shrink-0" />}
              </a>
            </div>
          </div>

          {/* Pasang Aplikasi di HP Button */}
          {onOpenInstallPwa && (
            <div className={isExpanded ? 'p-3' : 'p-1 flex justify-center'}>
              <button
                type="button"
                onClick={() => {
                  if (onCloseMobileMenu) onCloseMobileMenu();
                  onOpenInstallPwa();
                }}
                title={!isExpanded ? 'Pasang di HP (PWA)' : undefined}
                className={`bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-xl font-black text-xs shadow-md transition flex items-center cursor-pointer group ${
                  isExpanded ? 'w-full p-2.5 justify-between' : 'w-10 h-10 justify-center p-0'
                }`}
              >
                <div className={`flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'}`}>
                  <div className="w-6 h-6 bg-slate-950 text-amber-400 rounded-lg flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  {isExpanded && (
                    <div className="text-left">
                      <p className="leading-tight text-slate-950 font-black text-[11px]">Pasang di HP</p>
                      <p className="text-[9px] text-slate-800 font-semibold leading-none">Instal PWA</p>
                    </div>
                  )}
                </div>
                {isExpanded && <Download className="w-3.5 h-3.5 text-slate-950 group-hover:translate-y-0.5 transition-transform shrink-0" />}
              </button>
            </div>
          )}

        </nav>

        {/* Footer / System Status & Toggle Quick Action */}
        <div className={`bg-[#072d15] border-t border-[#146030]/80 text-xs text-emerald-200 ${
          isExpanded ? 'p-3.5' : 'p-2 flex flex-col items-center'
        }`}>
          {isExpanded ? (
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate">Sistem Online</span>
              </span>
              <div className="flex items-center space-x-1.5">
                {onToggleAutoHide && (
                  <button
                    type="button"
                    onClick={onToggleAutoHide}
                    className="p-1 rounded bg-[#0e4822] hover:bg-[#146030] text-emerald-200 text-[10px] flex items-center space-x-1 cursor-pointer"
                    title={isAutoHide ? 'Matikan Auto-Hide' : 'Aktifkan Auto-Hide'}
                  >
                    {isAutoHide ? <PinOff className="w-3 h-3 text-amber-400" /> : <Pin className="w-3 h-3" />}
                  </button>
                )}
                <span className="bg-[#0e4822] px-1.5 py-0.5 rounded text-[10px] text-emerald-200 font-mono">v2.5</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleAutoHide}
              className="w-8 h-8 rounded-lg bg-[#0e4822]/80 hover:bg-[#146030] text-emerald-200 flex items-center justify-center transition cursor-pointer"
              title="Perluas & Kunci Menu"
            >
              <PanelLeftOpen className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

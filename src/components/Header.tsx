import React, { useState } from 'react';
import { Teacher, Subject, Announcement, SchoolId } from '../types';
import { UserCheck, Search, X, ChevronDown, Shield, Menu, Megaphone, Lock, Building2, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ALL_SCHOOLS, getSchoolConfig } from '../utils/storage';

interface HeaderProps {
  teachers: Teacher[];
  subjects: Subject[];
  activeTeacher: Teacher;
  activeSubject: Subject;
  activeClass: string;
  classList: string[];
  activeTabLabel?: string;
  activeSchoolId?: SchoolId;
  onSwitchSchool?: (schoolId: SchoolId) => void;
  onSelectTeacher: (teacher: Teacher) => void;
  onSelectSubject: (subject: Subject) => void;
  onSelectClass: (className: string) => void;
  onOpenMobileMenu?: () => void;
  onLockPortal?: () => void;
  academicYear?: string;
  semester?: 'Semester Ganjil' | 'Semester Genap';
  onOpenSettings?: () => void;
  onOpenTeacherModal?: () => void;
  announcements?: Announcement[];
  onOpenAnnouncement?: () => void;
  onOpenInstallPwa?: () => void;
  isAutoHide?: boolean;
  onToggleAutoHide?: () => void;
  isOnline?: boolean;
  offlineQueueCount?: number;
  onSyncOfflineQueue?: () => void;
  isSyncingOfflineQueue?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  teachers,
  subjects,
  activeTeacher,
  activeSubject,
  activeClass,
  onSelectTeacher,
  onSelectSubject,
  onSelectClass,
  classList,
  activeTabLabel = 'Absensi Kehadiran Siswa',
  activeSchoolId = 'mts_manbaul_islam' as SchoolId,
  onSwitchSchool,
  onOpenMobileMenu,
  onLockPortal,
  academicYear = '2026/2027',
  semester = 'Semester Ganjil',
  onOpenSettings,
  onOpenTeacherModal,
  announcements = [],
  onOpenAnnouncement,
  onOpenInstallPwa,
  isAutoHide = false,
  onToggleAutoHide,
  isOnline = true,
  offlineQueueCount = 0,
  onSyncOfflineQueue,
  isSyncingOfflineQueue = false
}) => {
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);

  const currentSchool = getSchoolConfig(activeSchoolId as SchoolId);
  const activeAnnouncementsCount = announcements.filter(a => a.active).length;

  const handleOpenTeacherChooser = () => {
    if (onOpenTeacherModal) {
      onOpenTeacherModal();
    } else {
      setIsTeacherModalOpen(true);
    }
  };

  const filteredTeachers = teachers.filter(
    t =>
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.nip.includes(teacherSearch)
  );

  return (
    <header className="min-h-[64px] sm:h-18 py-1.5 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-30 shadow-xs relative">
      
      {/* Left Mobile Toggle, Kunci Portal, School Switcher & Auto-Hide Toggle */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Buka Menu Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Auto-Hide Sidebar Toggle Button */}
        {onToggleAutoHide && (
          <button
            type="button"
            onClick={onToggleAutoHide}
            className={`hidden lg:flex p-1.5 sm:px-2.5 sm:py-1.5 border rounded-xl text-xs font-bold transition-all items-center space-x-1.5 cursor-pointer shadow-2xs ${
              isAutoHide
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
            title={isAutoHide ? 'Mode Auto-Hide Aktif (Klik untuk Memasang Menu Tetap Terbuka)' : 'Aktifkan Mode Auto-Hide Menu Kiri (Ciut Otomatis)'}
          >
            {isAutoHide ? (
              <PanelLeftOpen className="w-4 h-4 text-amber-600 animate-pulse" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-600" />
            )}
            <span className="hidden xl:inline text-[11px]">
              {isAutoHide ? 'Auto-Hide' : 'Menu Kiri'}
            </span>
          </button>
        )}

        {/* Tombol Kunci Portal */}
        {onLockPortal && (
          <button
            type="button"
            onClick={onLockPortal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer flex items-center space-x-1.5 shadow-2xs group"
            title="Kunci Portal Aplikasi (Keluar ke Halaman Gerbang Akses)"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden xl:inline">Kunci</span>
          </button>
        )}

        {/* School Badge / Switcher */}
        {ALL_SCHOOLS.length > 1 && onSwitchSchool ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSchoolMenuOpen(!isSchoolMenuOpen)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 border rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shadow-2xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
              title="Ganti Sekolah / Unit Pendidikan"
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
              <span className="hidden md:inline font-bold truncate max-w-[130px]">
                {currentSchool.shortName}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {isSchoolMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSchoolMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Pilih Unit Sekolah
                  </div>
                  {ALL_SCHOOLS.map((school) => {
                    const isSelected = school.id === activeSchoolId;
                    return (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => {
                          onSwitchSchool(school.id);
                          setIsSchoolMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50/80 font-black text-indigo-900' : 'text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{school.name}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                            Aktif
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300/80 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
            <span className="truncate max-w-[140px] font-extrabold">{currentSchool.shortName}</span>
          </div>
        )}
      </div>

      {/* Center Teacher Switcher & Active Menu Label - Centered & Prominent on Mobile & Desktop */}
      <div className="flex-1 flex justify-center px-1 sm:px-2">
        <button
          type="button"
          onClick={handleOpenTeacherChooser}
          className="flex items-center space-x-2 sm:space-x-3 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 hover:border-indigo-300 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs group max-w-full"
          title="Klik untuk Mengganti Profil Guru Mengajar"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-center min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-indigo-600 font-extrabold block leading-none">
              GURU MENGAJAR
            </span>
            <div className="flex items-center justify-center space-x-1 mt-0.5">
              <span className="font-black text-slate-900 text-xs sm:text-base md:text-lg tracking-tight truncate max-w-[140px] sm:max-w-[260px] md:max-w-[360px]">
                {activeTeacher.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0 group-hover:translate-y-0.5 transition-transform" />
            </div>
            {/* Nama Menu yang Terpilih ditaruh di bawah nama guru */}
            <div className="flex items-center justify-center mt-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-indigo-800 bg-white/80 border border-indigo-200/80 px-2 py-0.2 rounded-md truncate max-w-[150px] sm:max-w-[260px] shadow-2xs">
                {activeTabLabel}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0 min-w-[36px] sm:min-w-[70px] justify-end">
        
        {/* Semester Badge & Realtime Status */}
        <div className="flex items-center space-x-2">
          {!isOnline ? (
            <div
              className="flex items-center space-x-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black shadow-2xs"
              title="Mode Offline: Presensi tetap dapat diisi dan disimpan di perangkat"
            >
              <WifiOff className="w-3 h-3 text-amber-700" />
              <span>Offline {offlineQueueCount > 0 ? `(${offlineQueueCount})` : ''}</span>
            </div>
          ) : offlineQueueCount > 0 ? (
            <button
              type="button"
              onClick={onSyncOfflineQueue}
              disabled={isSyncingOfflineQueue}
              className="flex items-center space-x-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 px-2.5 py-1 rounded-full text-[10px] font-black shadow-2xs cursor-pointer transition"
              title="Klik untuk menyinkronkan data presensi offline ke database cloud"
            >
              <RefreshCw className={`w-3 h-3 text-blue-700 ${isSyncingOfflineQueue ? 'animate-spin' : ''}`} />
              <span>Sync Cloud ({offlineQueueCount})</span>
            </button>
          ) : (
            <div
              onClick={onOpenSettings}
              className={`hidden sm:flex items-center space-x-3 text-right ${onOpenSettings ? 'cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition border border-transparent hover:border-slate-200' : ''}`}
              title="Klik untuk Mengubah Tahun Pelajaran & Semester (Database Cloud Terhubung)"
            >
              <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Realtime Sync</span>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block w-px h-7 bg-slate-200"></div>

        {/* Announcement Notification Bell */}
        {onOpenAnnouncement && (
          <button
            onClick={onOpenAnnouncement}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 relative shadow-2xs"
            title="Pengumuman Madrasah"
          >
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Pengumuman</span>
            {activeAnnouncementsCount > 0 && (
              <span className="w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                {activeAnnouncementsCount}
              </span>
            )}
          </button>
        )}

      </div>

      {/* Teacher Switcher Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Pilih Profil Guru Mengajar</h3>
              </div>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama guru atau NIP..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-500 mb-2 font-bold uppercase tracking-wider">
                Daftar Guru {currentSchool.shortName} ({filteredTeachers.length} Terdaftar)
              </p>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {filteredTeachers.map((t) => {
                  const isSelected = t.id === activeTeacher.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTeacher(t);
                        setIsTeacherModalOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition hover:bg-indigo-50/60 ${
                        isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <p className={`text-xs ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                          {t.name}
                        </p>
                        <p className="text-[10px] text-slate-500">NIP: {t.nip}</p>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                          Aktif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-md transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


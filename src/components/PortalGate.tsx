import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Trophy,
  Library,
  WalletCards,
  Building2,
  CheckCircle2,
  CalendarCheck,
  IdCard,
  FileSpreadsheet
} from 'lucide-react';
import { Student, Teacher, AdminSettings, SchoolOfficials, FeeTariffSettings, SchoolId, SchoolConfig } from '../types';
import {
  getStoredStudents,
  getStoredTeachers,
  getAllTreasurers,
  getStoredSchoolOfficials,
  getStoredFeeTariffs,
  getActiveSchoolId,
  setActiveSchoolId,
  getSchoolConfig,
  getStoredCurriculumPasscode,
  ALL_SCHOOLS
} from '../utils/storage';

interface PortalGateProps {
  students?: Student[];
  teachers?: Teacher[];
  adminSettings?: AdminSettings;
  schoolOfficials?: SchoolOfficials;
  tariffs?: FeeTariffSettings;
  activeSchoolId?: SchoolId;
  onSelectSchool?: (schoolId: SchoolId) => void;
  onUnlock: (role: 'teacher' | 'parent' | 'treasurer' | 'curriculum', lockedStudentId?: string | null, activeTreasurerId?: string | null) => void;
}

export const PortalGate: React.FC<PortalGateProps> = ({
  students = [],
  teachers = [],
  adminSettings,
  schoolOfficials,
  tariffs,
  activeSchoolId,
  onSelectSchool,
  onUnlock
}) => {
  // Current selected school in Portal Gate
  const [selectedSchool, setSelectedSchool] = useState<SchoolId>(() => {
    return activeSchoolId || getActiveSchoolId();
  });

  const currentSchoolConfig = getSchoolConfig(selectedSchool);
  const displaySchoolName = schoolOfficials?.namaSekolah || currentSchoolConfig.name || 'Madrasah';
  const displayShortName = schoolOfficials?.namaSekolah || currentSchoolConfig.shortName || 'Madrasah';

  // Sync if prop changes
  useEffect(() => {
    if (activeSchoolId && activeSchoolId !== selectedSchool) {
      setSelectedSchool(activeSchoolId);
    }
  }, [activeSchoolId]);

  const handleSwitchSchool = (newSchoolId: SchoolId) => {
    setSelectedSchool(newSchoolId);
    setActiveSchoolId(newSchoolId);
    if (onSelectSchool) {
      onSelectSchool(newSchoolId);
    }
    // Clear any previous error messages
    setErrorMsg('');
    setBendaharaErrorMsg('');
    setKurikulumErrorMsg('');
  };

  // Main form state
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dedicated Bendahara Card form state
  const [bendaharaCode, setBendaharaCode] = useState('');
  const [showBendaharaCode, setShowBendaharaCode] = useState(false);
  const [bendaharaErrorMsg, setBendaharaErrorMsg] = useState('');
  const [isSubmittingBendahara, setIsSubmittingBendahara] = useState(false);

  // Dedicated Kurikulum Card form state
  const [kurikulumCode, setKurikulumCode] = useState('');
  const [showKurikulumCode, setShowKurikulumCode] = useState(false);
  const [kurikulumErrorMsg, setKurikulumErrorMsg] = useState('');
  const [isSubmittingKurikulum, setIsSubmittingKurikulum] = useState(false);

  const verifyAndUnlock = (rawCode: string, origin: 'main' | 'bendahara' | 'kurikulum' = 'main') => {
    const cleaned = rawCode.trim().toLowerCase();
    const currentMasterPasscode = (adminSettings?.adminPasscode || 'akhmadtaufik84@').trim();

    // =========================================================================
    // 1. ORIGIN: MAIN PORTAL CARD (GURU & SISWA)
    // Sesuai Permintaan: HANYA kode siswa yang terdata di Data Master,
    // kode "madrasahhebat", dan kode Super Admin.
    // =========================================================================
    if (origin === 'main') {
      // a. Kode Super Admin
      if (rawCode.trim() === currentMasterPasscode) {
        setActiveSchoolId(selectedSchool);
        if (rememberDevice) {
          localStorage.setItem('portal_unlocked_madrasah', 'teacher');
          localStorage.removeItem('portal_locked_student_id');
        } else {
          sessionStorage.setItem('portal_unlocked_madrasah', 'teacher');
          sessionStorage.removeItem('portal_locked_student_id');
        }
        onUnlock('teacher', null);
        return true;
      }

      // b. Kode Resmi "madrasahhebat" (Untuk Guru / KBM Madrasah)
      if (cleaned === 'madrasahhebat') {
        setActiveSchoolId(selectedSchool);
        if (rememberDevice) {
          localStorage.setItem('portal_unlocked_madrasah', 'teacher');
          localStorage.removeItem('portal_locked_student_id');
        } else {
          sessionStorage.setItem('portal_unlocked_madrasah', 'teacher');
          sessionStorage.removeItem('portal_locked_student_id');
        }
        onUnlock('teacher', null);
        return true;
      }

      // c. Kode Siswa yang TERDATA di Data Master (NISN, NIS, Kode Unik, atau ID Siswa)
      const allStudents = students && students.length > 0 ? students : getStoredStudents(selectedSchool);
      const matchedStudent = allStudents.find(s => 
        Boolean(
          (s.kodeUnik && s.kodeUnik.trim().toLowerCase() === cleaned) ||
          (s.nis && s.nis.trim().toLowerCase() === cleaned) ||
          (s.nisn && s.nisn.trim().toLowerCase() === cleaned) ||
          (s.id && s.id.trim().toLowerCase() === cleaned)
        )
      );

      if (matchedStudent) {
        setActiveSchoolId(selectedSchool);
        if (rememberDevice) {
          localStorage.setItem('portal_unlocked_madrasah', 'parent');
          localStorage.setItem('portal_locked_student_id', matchedStudent.id);
        } else {
          sessionStorage.setItem('portal_unlocked_madrasah', 'parent');
          sessionStorage.setItem('portal_locked_student_id', matchedStudent.id);
        }
        onUnlock('parent', matchedStudent.id);
        return true;
      }

      // d. Kredensial Guru yang terdata di Data Master dengan kode unik khusus
      const currentTeachers = teachers && teachers.length > 0 ? teachers : getStoredTeachers(selectedSchool);
      const matchedTeacher = currentTeachers.find(t => {
        const code = (t.kodeUnik || '').trim().toLowerCase();
        return Boolean(code && code === cleaned);
      });

      if (matchedTeacher) {
        setActiveSchoolId(selectedSchool);
        if (rememberDevice) {
          localStorage.setItem('portal_unlocked_madrasah', 'teacher');
          localStorage.removeItem('portal_locked_student_id');
        } else {
          sessionStorage.setItem('portal_unlocked_madrasah', 'teacher');
          sessionStorage.removeItem('portal_locked_student_id');
        }
        onUnlock('teacher', null);
        return true;
      }

      // Selain yang disebutkan di atas: AKSES DITOLAK
      return false;
    }

    // =========================================================================
    // 2. ORIGIN: KURIKULUM PORTAL CARD
    // Sesuai Permintaan: HANYA diatur oleh Super Admin di menu khusus Super Admin
    // =========================================================================
    if (origin === 'kurikulum') {
      const configuredKurikulumCode = (
        adminSettings?.kurikulumKodeUnik || 
        schoolOfficials?.kurikulum?.kodeUnik || 
        getStoredCurriculumPasscode() || 
        'KURIKULUM2026'
      ).trim().toLowerCase();

      const isKurikulumAuthorized = 
        Boolean(configuredKurikulumCode && cleaned === configuredKurikulumCode) ||
        (rawCode.trim() === currentMasterPasscode);

      if (isKurikulumAuthorized) {
        setActiveSchoolId(selectedSchool);
        if (rememberDevice) {
          localStorage.setItem('portal_unlocked_madrasah', 'curriculum');
          localStorage.removeItem('portal_locked_student_id');
        } else {
          sessionStorage.setItem('portal_unlocked_madrasah', 'curriculum');
          sessionStorage.removeItem('portal_locked_student_id');
        }
        onUnlock('curriculum', null);
        return true;
      }
      return false;
    }

    // =========================================================================
    // 3. ORIGIN: BENDAHARA PORTAL CARD
    // Sesuai Permintaan: HANYA diatur oleh Super Admin di menu khusus Super Admin
    // =========================================================================
    if (origin === 'bendahara') {
      const currentOfficials = schoolOfficials || getStoredSchoolOfficials(selectedSchool);
      const currentTariffs = tariffs || getStoredFeeTariffs(selectedSchool);
      const allTreasurers = getAllTreasurers(currentOfficials);

      const matchedTreasurer = allTreasurers.find(t => {
        const code = (t.kodeUnik || '').trim().toLowerCase();
        return Boolean(code && code === cleaned);
      });

      const isTariffBendaharaCode =
        (currentTariffs?.bendaharaUtamaKodeUnik && currentTariffs.bendaharaUtamaKodeUnik.trim().toLowerCase() === cleaned) ||
        (currentTariffs?.bendaharaKodeUnik && currentTariffs.bendaharaKodeUnik.trim().toLowerCase() === cleaned) ||
        (currentTariffs?.bendahara2KodeUnik && currentTariffs.bendahara2KodeUnik.trim().toLowerCase() === cleaned) ||
        (currentTariffs?.bendahara3KodeUnik && currentTariffs.bendahara3KodeUnik.trim().toLowerCase() === cleaned) ||
        (currentTariffs?.bendahara4KodeUnik && currentTariffs.bendahara4KodeUnik.trim().toLowerCase() === cleaned) ||
        (currentTariffs?.bendahara5KodeUnik && currentTariffs.bendahara5KodeUnik.trim().toLowerCase() === cleaned);

      const isMasterAdminForBendahara = (rawCode.trim() === currentMasterPasscode);

      if (matchedTreasurer || isTariffBendaharaCode || isMasterAdminForBendahara) {
        let matchedTId = matchedTreasurer?.id || 'bu';
        if (isTariffBendaharaCode) {
          if (currentTariffs?.bendaharaUtamaKodeUnik?.toLowerCase() === cleaned) matchedTId = 'bu';
          else if (currentTariffs?.bendaharaKodeUnik?.toLowerCase() === cleaned) matchedTId = 'b1';
          else if (currentTariffs?.bendahara2KodeUnik?.toLowerCase() === cleaned) matchedTId = 'b2';
          else if (currentTariffs?.bendahara3KodeUnik?.toLowerCase() === cleaned) matchedTId = 'b3';
          else if (currentTariffs?.bendahara4KodeUnik?.toLowerCase() === cleaned) matchedTId = 'b4';
          else if (currentTariffs?.bendahara5KodeUnik?.toLowerCase() === cleaned) matchedTId = 'b5';
        }

        setActiveSchoolId(selectedSchool);
        if (rememberDevice) {
          localStorage.setItem('portal_unlocked_madrasah', 'treasurer');
          localStorage.setItem('mts_bendahara_unlocked', 'true');
          localStorage.setItem('mts_active_treasurer_id', matchedTId);
          localStorage.removeItem('portal_locked_student_id');
        } else {
          sessionStorage.setItem('portal_unlocked_madrasah', 'treasurer');
          sessionStorage.setItem('mts_bendahara_unlocked', 'true');
          sessionStorage.setItem('mts_active_treasurer_id', matchedTId);
          sessionStorage.removeItem('portal_locked_student_id');
        }
        onUnlock('treasurer', null, matchedTId);
        return true;
      }
      return false;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setErrorMsg('Silakan masukkan Kode Akses Guru, NISN Siswa, atau Sandi Super Admin!');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const success = verifyAndUnlock(accessCode, 'main');
      if (!success) {
        setErrorMsg('Akses Ditolak! Kode Guru, NISN Siswa, atau Sandi Super Admin tidak valid.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  const handleBendaharaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bendaharaCode.trim()) {
      setBendaharaErrorMsg(`Silakan masukkan kode akses Bendahara yang diatur oleh Super Admin!`);
      return;
    }
    setIsSubmittingBendahara(true);
    setBendaharaErrorMsg('');

    setTimeout(() => {
      const success = verifyAndUnlock(bendaharaCode, 'bendahara');
      if (!success) {
        setBendaharaErrorMsg(`Akses Ditolak! Kode akses Bendahara salah atau tidak diatur oleh Super Admin.`);
        setIsSubmittingBendahara(false);
      }
    }, 250);
  };

  const handleKurikulumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kurikulumCode.trim()) {
      setKurikulumErrorMsg(`Silakan masukkan kode akses Kurikulum yang diatur oleh Super Admin!`);
      return;
    }
    setIsSubmittingKurikulum(true);
    setKurikulumErrorMsg('');

    setTimeout(() => {
      const success = verifyAndUnlock(kurikulumCode, 'kurikulum');
      if (!success) {
        setKurikulumErrorMsg(`Akses Ditolak! Kode akses Kurikulum salah atau tidak diatur oleh Super Admin.`);
        setIsSubmittingKurikulum(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen sm:min-h-screen bg-gradient-to-br from-[#063016] via-[#0b4822] to-[#15803d] text-slate-100 flex flex-col justify-between items-center p-3 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background Decorative Elements */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-green-400/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Branding Header & School Switcher */}
      <div className="w-full max-w-6xl text-center z-10 pt-2 sm:pt-4">
        
        {/* Foundation & Portal Pill */}
        <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide mb-2 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistem Informasi & Administrasi Yayasan Terpadu</span>
        </div>

        {/* School Selector Buttons (if multiple units exist) */}
        {ALL_SCHOOLS.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3 max-w-lg mx-auto">
            {ALL_SCHOOLS.map((school) => {
              const isSelected = selectedSchool === school.id;
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => handleSwitchSchool(school.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-black text-xs transition-all duration-200 cursor-pointer shadow-md ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 ring-2 ring-emerald-300 scale-105'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>{school.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic School Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase drop-shadow-xs">
          {displaySchoolName}
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-0.5 max-w-2xl mx-auto">
          {schoolOfficials?.tagline || currentSchoolConfig.tagline || 'Portal Administrasi Guru, Kurikulum & Ujian, Bendahara, Wali Siswa & Perpustakaan'}
        </p>
      </div>

      {/* Main Container: Focused on Guru & Siswa, with Compact Secondary Portals */}
      <div className="w-full max-w-5xl my-auto z-10 flex flex-col items-center py-4 sm:py-6 space-y-5 sm:space-y-6">

        {/* ========================================================================= */}
        {/* PRIMARY HERO CARD: AKSES UTAMA GURU & SISWA */}
        {/* ========================================================================= */}
        <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-emerald-400/40 text-slate-800 relative hover:border-emerald-400/70 transition-all duration-300">
          
          {/* Decorative Corner Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-tr-3xl pointer-events-none"></div>

          {/* Card Header */}
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-emerald-100">
                <ShieldCheck className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    Akses Utama
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {displayShortName}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                  Portal Guru & Siswa
                </h2>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Satu pintu masuk terintegrasi untuk <strong>Bapak/Ibu Guru</strong> (Jurnal KBM, Absensi, Penilaian, RPP) dan <strong>Siswa / Orang Tua</strong> (Pantau Kehadiran, Nilai & Transparansi Keuangan).
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="portal-code-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Masukkan Kode Akses Guru atau NISN / Kode Siswa:
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700">
                  <KeyRound className="w-4 h-4" />
                </div>

                <input
                  id="portal-code-input"
                  type={showCode ? 'text' : 'password'}
                  required
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Masukkan Kode Guru atau NISN Siswa..."
                  className={`w-full pl-9 pr-10 py-3 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 transition ${
                    errorMsg
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-emerald-200 focus:ring-emerald-100 focus:border-emerald-600'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title={showCode ? 'Sembunyikan' : 'Lihat Kode'}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <div className="mt-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center space-x-2">
                  <Lock className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label htmlFor="remember-device" className="flex items-center space-x-2 cursor-pointer text-slate-600 font-medium">
                <input
                  id="remember-device"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span>Ingat perangkat ini</span>
              </label>

              <span className="text-[11px] text-slate-400 font-medium">
                Aman & Terenkripsi
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !accessCode.trim()}
              className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 hover:from-emerald-700 hover:to-green-900 text-white font-black py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Memverifikasi...' : `Masuk ke Portal ${displayShortName}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Guidance for Students & Parents */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-500">
            <span>🎓 Siswa & Wali Murid: Gunakan <code className="bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[10px] font-bold">NISN / Kode Siswa</code></span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECONDARY ROW: 4 COMPACT PORTALS (Kurikulum, Keuangan, Perpustakaan, Ekskul) */}
        {/* ========================================================================= */}
        <div className="w-full">
          <div className="flex items-center justify-center space-x-2 text-emerald-200/80 text-[10px] font-black uppercase tracking-wider mb-2.5">
            <span className="h-px bg-emerald-500/30 flex-1 max-w-[80px]"></span>
            <span>Portal Khusus & Layanan Tambahan</span>
            <span className="h-px bg-emerald-500/30 flex-1 max-w-[80px]"></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full">
            
            {/* 1. Kurikulum (Compact) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-emerald-500/30 hover:border-emerald-400/60 shadow-lg text-slate-200 flex flex-col justify-between transition">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white leading-tight">Kurikulum</h3>
                      <p className="text-[10px] text-emerald-400 font-semibold leading-none">STS • SAS • AM</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-300/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Ujian
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mb-2 line-clamp-2">
                  Jadwal pengawas, ruang ujian & cetak kartu peserta.
                </p>
              </div>

              <form onSubmit={handleKurikulumSubmit} className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showKurikulumCode ? 'text' : 'password'}
                    value={kurikulumCode}
                    onChange={(e) => {
                      setKurikulumCode(e.target.value);
                      if (kurikulumErrorMsg) setKurikulumErrorMsg('');
                    }}
                    placeholder="Kode Kurikulum..."
                    className="w-full pl-2.5 pr-7 py-1.5 bg-slate-950/70 border border-emerald-500/40 rounded-xl text-[11px] font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKurikulumCode(!showKurikulumCode)}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-emerald-400/60 hover:text-emerald-300"
                    title={showKurikulumCode ? 'Sembunyikan' : 'Lihat'}
                  >
                    {showKurikulumCode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                {kurikulumErrorMsg && (
                  <p className="text-[9px] text-rose-300 bg-rose-950/80 p-1 rounded font-bold leading-tight">
                    {kurikulumErrorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingKurikulum}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-xl text-[11px] transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmittingKurikulum ? 'Membuka...' : 'Buka Kurikulum'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </div>

            {/* 2. Keuangan / Bendahara (Compact) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-amber-500/30 hover:border-amber-400/60 shadow-lg text-slate-200 flex flex-col justify-between transition">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                      <WalletCards className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white leading-tight">Keuangan</h3>
                      <p className="text-[10px] text-amber-400 font-semibold leading-none">Bendahara & SPP</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-amber-300/70 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Kas
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mb-2 line-clamp-2">
                  Kasir SPP, setoran uang gedung & rekap kas.
                </p>
              </div>

              <form onSubmit={handleBendaharaSubmit} className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showBendaharaCode ? 'text' : 'password'}
                    required
                    value={bendaharaCode}
                    onChange={(e) => {
                      setBendaharaCode(e.target.value);
                      if (bendaharaErrorMsg) setBendaharaErrorMsg('');
                    }}
                    placeholder="Kode Bendahara..."
                    className="w-full pl-2.5 pr-7 py-1.5 bg-slate-950/70 border border-amber-500/40 rounded-xl text-[11px] font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBendaharaCode(!showBendaharaCode)}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-amber-400/60 hover:text-amber-300"
                    title={showBendaharaCode ? 'Sembunyikan' : 'Lihat'}
                  >
                    {showBendaharaCode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                {bendaharaErrorMsg && (
                  <p className="text-[9px] text-rose-300 bg-rose-950/80 p-1 rounded font-bold leading-tight">
                    {bendaharaErrorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingBendahara || !bendaharaCode.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-1.5 px-2 rounded-xl text-[11px] transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmittingBendahara ? 'Membuka...' : 'Buka Bendahara'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </div>

            {/* 3. Perpustakaan (Compact) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-emerald-500/20 hover:border-emerald-400/50 shadow-lg text-slate-200 flex flex-col justify-between transition">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                      <Library className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white leading-tight">Perpustakaan</h3>
                      <p className="text-[10px] text-teal-400 font-semibold leading-none">E-Book & Modul</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-teal-300/70 bg-teal-500/10 px-1.5 py-0.5 rounded">
                    Buku
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mb-3 line-clamp-2">
                  Koleksi digital, materi modul belajar & katalog baca.
                </p>
              </div>

              <a
                href="https://perpus-digitalmbi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-800 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-xl text-[11px] transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-700 hover:border-emerald-500"
              >
                <span>Buka E-Perpus</span>
                <ExternalLink className="w-3 h-3 text-emerald-300" />
              </a>
            </div>

            {/* 4. Ekstrakulikuler (Compact) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-emerald-500/20 hover:border-emerald-400/50 shadow-lg text-slate-200 flex flex-col justify-between transition">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white leading-tight">Ekstrakulikuler</h3>
                      <p className="text-[10px] text-emerald-400 font-semibold leading-none">Bakat & Prestasi</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-300/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Ekskul
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mb-3 line-clamp-2">
                  Pendaftaran ekskul, jadwal latihan & absensi pembina.
                </p>
              </div>

              <a
                href="https://administrasi-ekstrakulikuler-mts-manbau-islam.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-800 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-xl text-[11px] transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-700 hover:border-emerald-500"
              >
                <span>Buka Ekskul</span>
                <ExternalLink className="w-3 h-3 text-emerald-300" />
              </a>
            </div>

          </div>
        </div>

      </div>

      {/* Footer Branding & Security Notice */}
      <div className="w-full text-center pb-2 text-[11px] text-slate-400 font-medium z-10 space-y-1">
        <div className="inline-flex items-center space-x-3 bg-slate-900/60 px-3.5 py-1 rounded-full border border-slate-800 text-[10px] text-slate-400">
          <span>Portal Utama: <strong className="text-emerald-300 font-mono">Guru & Siswa</strong></span>
          <span>•</span>
          <span>Kurikulum & Bendahara: <strong className="text-emerald-300">Dikelola Super Admin</strong></span>
        </div>
        <p>© {new Date().getFullYear()} {schoolOfficials?.namaYayasan ? `${schoolOfficials.namaYayasan} • ` : ''}{displaySchoolName}</p>
      </div>

    </div>
  );
};




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
      setErrorMsg('Silakan masukkan Kode Siswa, Kode Guru ("madrasahhebat"), atau Sandi Super Admin!');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const success = verifyAndUnlock(accessCode, 'main');
      if (!success) {
        setErrorMsg('Akses Ditolak! Hanya kode siswa yang terdata di Data Master, kode "madrasahhebat", atau kode Super Admin yang diizinkan.');
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
          {currentSchoolConfig.name}
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-0.5 max-w-2xl mx-auto">
          {currentSchoolConfig.tagline || 'Portal Administrasi Guru, Kurikulum & Ujian, Bendahara, Wali Siswa & Perpustakaan'}
        </p>
      </div>

      {/* Main Container - 5-Card Responsive Grid */}
      <div className="w-full max-w-7xl my-auto z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 py-3 sm:py-6">
        
        {/* Card 1: Portal Akses Utama (Guru & Wali Siswa) */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-white/20 text-slate-800 flex flex-col justify-between hover:shadow-2xl transition">
          <div>
            <div className="flex items-center space-x-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-700" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Akses Utama
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Guru & Siswa
                </h2>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug mb-3 font-normal">
              Masuk dengan Kode Guru untuk KBM, atau NISN / Kode Siswa untuk Orang Tua di <strong>{currentSchoolConfig.shortName}</strong>.
            </p>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-3.5 h-3.5" />
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
                    placeholder="Kode Guru / NISN..."
                    className={`w-full pl-8 pr-8 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                      errorMsg
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-indigo-600 focus:border-indigo-600'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {errorMsg && (
                  <div className="mt-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 p-1.5 rounded-lg flex items-center space-x-1">
                    <Lock className="w-3 h-3 shrink-0 text-rose-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1.5">
                <input
                  id="remember-device"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-3 h-3 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="remember-device" className="text-[10px] font-semibold text-slate-600 cursor-pointer">
                  Ingat perangkat ini
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !accessCode.trim()}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Memverifikasi...' : `Masuk ${currentSchoolConfig.shortName}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Portal Waka Kurikulum & Ujian (STS / SAS / AM) */}
        <div className="bg-gradient-to-b from-[#0e4322]/80 to-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-emerald-500/40 text-slate-100 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-400/80 transition ring-1 ring-emerald-500/30">
          <div>
            <div className="flex items-center space-x-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-2xs">
                <CalendarCheck className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  STS • SAS • AM
                </span>
                <h2 className="text-sm font-extrabold text-white leading-tight">
                  Portal Kurikulum
                </h2>
              </div>
            </div>

            <p className="text-[11px] text-indigo-100/85 leading-snug mb-3 font-normal">
              Pengaturan kegiatan ujian (STS/SAS), pembagian ruang otomatis, jadwal pengawas & cetak kartu peserta.
            </p>

            <form onSubmit={handleKurikulumSubmit} className="space-y-2.5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-indigo-300/60">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>

                  <input
                    id="kurikulum-code-input"
                    type={showKurikulumCode ? 'text' : 'password'}
                    value={kurikulumCode}
                    onChange={(e) => {
                      setKurikulumCode(e.target.value);
                      if (kurikulumErrorMsg) setKurikulumErrorMsg('');
                    }}
                    placeholder="Masukkan Kode Akses Kurikulum..."
                    className={`w-full pl-8 pr-8 py-2 bg-slate-900/90 border rounded-xl text-xs font-bold text-white placeholder:text-slate-400 focus:bg-slate-900 focus:outline-none focus:ring-2 transition ${
                      kurikulumErrorMsg
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-indigo-400/50 focus:ring-indigo-400 focus:border-indigo-400'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowKurikulumCode(!showKurikulumCode)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-indigo-300/60 hover:text-indigo-200 transition cursor-pointer"
                  >
                    {showKurikulumCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {kurikulumErrorMsg && (
                  <div className="mt-1.5 text-[10px] font-bold text-rose-200 bg-rose-950/80 border border-rose-500/40 p-1.5 rounded-lg flex items-center space-x-1">
                    <Lock className="w-3 h-3 shrink-0 text-rose-400" />
                    <span>{kurikulumErrorMsg}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingKurikulum}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmittingKurikulum ? 'Membuka...' : 'Buka Portal Kurikulum'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-emerald-300/80 text-center font-medium mt-1 flex items-center justify-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Kode akses diatur khusus oleh Super Admin</span>
              </p>
            </form>
          </div>
        </div>

        {/* Card 3: Portal Bendahara & Keuangan */}
        <div className="bg-gradient-to-b from-amber-950/40 to-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-amber-500/40 text-slate-100 flex flex-col justify-between hover:shadow-2xl hover:border-amber-400/60 transition">
          <div>
            <div className="flex items-center space-x-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-2xs">
                <WalletCards className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Keuangan & SPP
                </span>
                <h2 className="text-sm font-extrabold text-white leading-tight">
                  Portal Bendahara
                </h2>
              </div>
            </div>

            <p className="text-[11px] text-amber-100/80 leading-snug mb-3 font-normal">
              Akses khusus Bendahara {currentSchoolConfig.shortName} untuk SPP, Uang Gedung, Kas & Setoran.
            </p>

            <form onSubmit={handleBendaharaSubmit} className="space-y-2.5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-amber-300/60">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>

                  <input
                    id="bendahara-code-input"
                    type={showBendaharaCode ? 'text' : 'password'}
                    required
                    value={bendaharaCode}
                    onChange={(e) => {
                      setBendaharaCode(e.target.value);
                      if (bendaharaErrorMsg) setBendaharaErrorMsg('');
                    }}
                    placeholder="Kode Akses Bendahara..."
                    className={`w-full pl-8 pr-8 py-2 bg-slate-900/80 border rounded-xl text-xs font-bold text-white placeholder:text-slate-400 focus:bg-slate-900 focus:outline-none focus:ring-2 transition ${
                      bendaharaErrorMsg
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-amber-400/40 focus:ring-amber-400 focus:border-amber-400'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowBendaharaCode(!showBendaharaCode)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-amber-300/60 hover:text-amber-200 transition cursor-pointer"
                  >
                    {showBendaharaCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {bendaharaErrorMsg && (
                  <div className="mt-1.5 text-[10px] font-bold text-rose-200 bg-rose-950/80 border border-rose-500/40 p-1.5 rounded-lg flex items-center space-x-1">
                    <Lock className="w-3 h-3 shrink-0 text-rose-400" />
                    <span>{bendaharaErrorMsg}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingBendahara || !bendaharaCode.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-black py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmittingBendahara ? 'Membuka...' : 'Buka Portal Bendahara'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-amber-300/80 text-center font-medium mt-1 flex items-center justify-center space-x-1">
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Kode akses diatur khusus oleh Super Admin</span>
              </p>
            </form>
          </div>
        </div>

        {/* Card 4: Portal Perpustakaan Digital */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-sky-400/30 text-slate-100 flex flex-col justify-between hover:shadow-2xl hover:border-sky-400/60 transition">
          <div>
            <div className="flex items-center space-x-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-400/20 text-sky-300 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-2xs">
                <Library className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  Literasi Digital
                </span>
                <h2 className="text-sm font-extrabold text-white leading-tight">
                  Perpustakaan
                </h2>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4 font-normal">
              Koleksi e-book, modul materi belajar, katalog referensi & pojok baca madrasah / sekolah.
            </p>
          </div>

          <a
            href="https://perpus-digitalmbi.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs group cursor-pointer"
          >
            <span>Buka Perpustakaan</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Card 5: Portal Ekstrakulikuler Siswa */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-emerald-400/30 text-slate-100 flex flex-col justify-between hover:shadow-2xl hover:border-emerald-400/60 transition">
          <div>
            <div className="flex items-center space-x-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-2xs">
                <Trophy className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Bakat & Minat
                </span>
                <h2 className="text-sm font-extrabold text-white leading-tight">
                  Ekstrakulikuler
                </h2>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4 font-normal">
              Pendaftaran anggota, jadwal latihan mingguan, absensi pembina & portofolio prestasi siswa.
            </p>
          </div>

          <a
            href="https://administrasi-ekstrakulikuler-mts-manbau-islam.ai.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs group cursor-pointer"
          >
            <span>Portal Ekskul</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* Footer Branding & Security Notice */}
      <div className="w-full text-center pb-2 text-[11px] text-slate-400 font-medium z-10 space-y-1">
        <div className="inline-flex items-center space-x-3 bg-slate-900/60 px-3.5 py-1 rounded-full border border-slate-800 text-[10px] text-slate-400">
          <span>Portal Utama: <strong className="text-emerald-300 font-mono">Guru & Siswa</strong></span>
          <span>•</span>
          <span>Kurikulum & Bendahara: <strong className="text-emerald-300">Dikelola Super Admin</strong></span>
        </div>
        <p>© {new Date().getFullYear()} {schoolOfficials?.namaYayasan ? `${schoolOfficials.namaYayasan} • ` : ''}{currentSchoolConfig.name || schoolOfficials?.namaSekolah || 'Madrasah'}</p>
      </div>

    </div>
  );
};




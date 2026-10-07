import React, { useState, useMemo } from 'react';
import {
  TeachingSchedule,
  Teacher,
  Subject,
  SchoolOfficials,
  DayOfWeek,
  ActiveTab,
  AdminSettings
} from '../types';
import { DAYS_OF_WEEK, STANDARD_SCHEDULE_PERIODS, CLASSES_LIST } from '../data/initialData';
import { OFFICIAL_ASC_SCHEDULES } from '../data/officialSchedules';
import {
  CalendarDays,
  Clock,
  BookOpen,
  Users,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  Sparkles,
  ClipboardCheck,
  Building,
  UserCheck,
  FileSpreadsheet,
  X,
  Check,
  HelpCircle,
  ArrowRight,
  Info,
  Calendar,
  RotateCcw,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { exportToCSV, printFormattedDocument } from '../utils/export';
import { getDayNameFromDate } from '../utils/storage';

interface JadwalPelajaranProps {
  schedules: TeachingSchedule[];
  teachers: Teacher[];
  subjects: Subject[];
  classList: string[];
  activeTeacher?: Teacher;
  activeSubject?: Subject;
  schoolOfficials?: SchoolOfficials;
  academicYear?: string;
  semester?: string;
  adminSettings?: AdminSettings;
  onSaveSchedule: (schedule: TeachingSchedule) => Promise<void> | void;
  onDeleteSchedule: (scheduleId: string) => Promise<void> | void;
  onBulkSaveSchedules?: (schedules: TeachingSchedule[]) => Promise<void> | void;
  onSaveAllSchedules?: (schedules: TeachingSchedule[]) => Promise<void> | void;
  onSelectTeacher?: (teacher: Teacher) => void;
  onSelectSubject?: (subject: Subject) => void;
  onSelectClass?: (className: string) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onNavigateToAbsensi?: (schedule: TeachingSchedule) => void;
  onOpenTeacherModal?: () => void;
}

export const JadwalPelajaran: React.FC<JadwalPelajaranProps> = ({
  schedules = [],
  teachers = [],
  subjects = [],
  classList = [],
  activeTeacher,
  activeSubject,
  schoolOfficials,
  academicYear = '2024/2025',
  semester = 'Ganjil',
  adminSettings,
  onSaveSchedule,
  onDeleteSchedule,
  onBulkSaveSchedules,
  onSaveAllSchedules,
  onSelectTeacher,
  onSelectSubject,
  onSelectClass,
  onNavigateToTab,
  onNavigateToAbsensi,
  onOpenTeacherModal
}) => {
  // Current real-world day
  const todayDayName = getDayNameFromDate(new Date().toISOString().split('T')[0]);

  // View modes
  const [viewMode, setViewMode] = useState<'guru' | 'kelas' | 'matriks'>('guru');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(activeTeacher?.id || teachers[0]?.id || '');
  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || 'VII A');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Super Admin Security & Protection State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('mts_admin_master_unlocked') === 'true' ||
           localStorage.getItem('mts_admin_master_unlocked') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPasscodeInput, setAuthPasscodeInput] = useState('');
  const [showAuthPasscode, setShowAuthPasscode] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [rememberAuth, setRememberAuth] = useState(true);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete' | 'add' | 'sync';
    schedule?: TeachingSchedule;
    scheduleId?: string;
    prefill?: { day?: DayOfWeek; teacherId?: string; className?: string; period?: string };
  } | null>(null);

  // Modal State for adding/editing schedule
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Form Fields
  const [formDay, setFormDay] = useState<DayOfWeek>('Senin');
  const [formPeriod, setFormPeriod] = useState<string>(STANDARD_SCHEDULE_PERIODS[0].label);
  const [formTeacherId, setFormTeacherId] = useState<string>(activeTeacher?.id || teachers[0]?.id || '');
  const [formSubjectId, setFormSubjectId] = useState<string>(activeSubject?.id || subjects[0]?.id || '');
  const [formClass, setFormClass] = useState<string>(classList[0] || 'VII A');
  const [formRoom, setFormRoom] = useState<string>('Ruang Kelas');
  const [formNotes, setFormNotes] = useState<string>('');

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to trigger toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Schedule to delete object
  const scheduleToDelete = useMemo(() => {
    if (!deleteConfirmId) return null;
    return schedules.find(s => s.id === deleteConfirmId) || null;
  }, [deleteConfirmId, schedules]);

  // Request Super Admin Auth before allowing schedule modifications
  const requestAdminAuth = (action: {
    type: 'edit' | 'delete' | 'add' | 'sync';
    schedule?: TeachingSchedule;
    scheduleId?: string;
    prefill?: { day?: DayOfWeek; teacherId?: string; className?: string; period?: string };
  }) => {
    // If already verified in this session, execute directly
    if (isAdminUnlocked) {
      executeAuthorizedAction(action);
      return;
    }
    // Otherwise open the Super Admin Passcode modal
    setPendingAction(action);
    setAuthPasscodeInput('');
    setAuthErrorMessage('');
    setIsAuthModalOpen(true);
  };

  // Execute action once authorized
  const executeAuthorizedAction = (action: {
    type: 'edit' | 'delete' | 'add' | 'sync';
    schedule?: TeachingSchedule;
    scheduleId?: string;
    prefill?: { day?: DayOfWeek; teacherId?: string; className?: string; period?: string };
  }) => {
    if (action.type === 'edit' && action.schedule) {
      handleOpenEditModal(action.schedule);
    } else if (action.type === 'delete' && action.scheduleId) {
      setDeleteConfirmId(action.scheduleId);
    } else if (action.type === 'add') {
      handleOpenCreateModal(action.prefill);
    } else if (action.type === 'sync') {
      handleSyncOfficialAsc();
    }
  };

  // Verify PIN / Super Admin Passcode
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMessage('');
    const cleanInput = authPasscodeInput.trim();
    const correctPasscode = (adminSettings?.adminPasscode || 'akhmadtaufik84@').trim();

    if (cleanInput === correctPasscode) {
      setIsAdminUnlocked(true);
      if (rememberAuth) {
        sessionStorage.setItem('mts_admin_master_unlocked', 'true');
      }
      setIsAuthModalOpen(false);
      showToast('Otorisasi Super Admin berhasil! Anda dapat mengedit / menghapus jadwal.');
      if (pendingAction) {
        executeAuthorizedAction(pendingAction);
        setPendingAction(null);
      }
    } else {
      setAuthErrorMessage('Kode / Kata Sandi Super Admin salah! Silakan periksa kembali atau hubungi Super Admin.');
    }
  };

  const handleLockAdminSession = () => {
    setIsAdminUnlocked(false);
    sessionStorage.removeItem('mts_admin_master_unlocked');
    localStorage.removeItem('mts_admin_master_unlocked');
    showToast('Proteksi Jadwal diaktifkan kembali. Sesi Super Admin terkunci.');
  };

  // Helper to extract school period numbers e.g. "1 - 2 (07.15 - 08.25 WIB)" => [1, 2], "2 (07.50...)" => [2]
  const parsePeriodHours = (periodStr: string, sch?: { periodStartHour?: number; periodEndHour?: number }): number[] => {
    if (sch?.periodStartHour && sch?.periodEndHour && sch.periodStartHour <= 12 && sch.periodEndHour <= 12 && sch.periodStartHour > 0) {
      const s = Math.min(sch.periodStartHour, sch.periodEndHour);
      const e = Math.max(sch.periodStartHour, sch.periodEndHour);
      const res: number[] = [];
      for (let i = s; i <= e; i++) res.push(i);
      return res;
    }

    if (!periodStr) return [1];

    // Strip timestamps inside parentheses e.g. "(07.15 - 08.25 WIB)" to avoid clock numbers
    const cleanPrefix = periodStr.split('(')[0].trim();

    // Check for range e.g. "1 - 2", "3-4", "Jam 5 - 6"
    const matchRange = cleanPrefix.match(/(?:jam\s*)?(\d+)\s*[-–]\s*(\d+)/i) || periodStr.match(/^(\d+)\s*[-–]\s*(\d+)/);
    if (matchRange) {
      const s = parseInt(matchRange[1], 10);
      const e = parseInt(matchRange[2], 10);
      // Valid school period numbers are between 1 and 12
      if (s >= 1 && s <= 12 && e >= 1 && e <= 12) {
        const res: number[] = [];
        for (let i = Math.min(s, e); i <= Math.max(s, e); i++) res.push(i);
        return res;
      }
    }

    // Check single period e.g. "2", "Jam 3"
    const matchSingle = cleanPrefix.match(/(?:jam\s*)?(\d+)/i);
    if (matchSingle) {
      const num = parseInt(matchSingle[1], 10);
      if (num >= 1 && num <= 12) {
        return [num];
      }
    }

    // Fallbacks for plain time-range strings
    if (periodStr.includes('07.15') || periodStr.includes('07:15')) return [1, 2];
    if (periodStr.includes('08.25') || periodStr.includes('08:25')) return [3, 4];
    if (periodStr.includes('09.55') || periodStr.includes('09:55')) return [5, 6];
    if (periodStr.includes('11.05') || periodStr.includes('11:05')) return [7, 8];
    if (periodStr.includes('07.50') || periodStr.includes('07:50')) return [2];

    return [1, 2];
  };

  // Conflict Checking Engine
  const conflictCheck = useMemo(() => {
    if (!isModalOpen) return null;
    const currentHours = parsePeriodHours(formPeriod);

    // 1. Check if Teacher is already teaching another class in overlapping hours on that day
    const teacherConflict = schedules.find(s => {
      if (s.id === editingScheduleId) return false;
      if (s.day !== formDay) return false;
      if (s.teacherId !== formTeacherId) return false;

      const otherHours = parsePeriodHours(s.periodNumber);
      const hasOverlap = currentHours.some(h => otherHours.includes(h));
      return hasOverlap;
    });

    if (teacherConflict) {
      const t = teachers.find(teach => teach.id === formTeacherId);
      return {
        type: 'TEACHER_CONFLICT',
        message: `Guru ${t?.name || 'tersebut'} sudah memiliki jadwal mengajar di Kelas ${teacherConflict.className} (${teacherConflict.subjectName} - ${teacherConflict.periodNumber}) pada hari ${formDay}!`,
        conflictingSchedule: teacherConflict
      };
    }

    // 2. Check if the Class is already booked by another teacher/subject in overlapping hours on that day
    const classConflict = schedules.find(s => {
      if (s.id === editingScheduleId) return false;
      if (s.day !== formDay) return false;
      if (s.className !== formClass) return false;

      const otherHours = parsePeriodHours(s.periodNumber);
      const hasOverlap = currentHours.some(h => otherHours.includes(h));
      return hasOverlap;
    });

    if (classConflict) {
      return {
        type: 'CLASS_CONFLICT',
        message: `Kelas ${formClass} pada hari ${formDay} jam tersebut sudah terisi oleh Guru ${classConflict.teacherName} (${classConflict.subjectName} - ${classConflict.periodNumber})!`,
        conflictingSchedule: classConflict
      };
    }

    return null;
  }, [isModalOpen, formDay, formPeriod, formTeacherId, formClass, editingScheduleId, schedules, teachers]);

  // Open Create Modal
  const handleOpenCreateModal = (prefill?: { day?: DayOfWeek; teacherId?: string; className?: string; period?: string }) => {
    setEditingScheduleId(null);
    setFormDay(prefill?.day || todayDayName || 'Senin');
    setFormPeriod(prefill?.period || STANDARD_SCHEDULE_PERIODS[0].label);
    setFormTeacherId(prefill?.teacherId || selectedTeacherId || activeTeacher?.id || teachers[0]?.id || '');
    setFormSubjectId(activeSubject?.id || subjects[0]?.id || '');
    setFormClass(prefill?.className || selectedClass || classList[0] || 'VII A');
    setFormRoom('Ruang Kelas');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sch: TeachingSchedule) => {
    setEditingScheduleId(sch.id);
    setFormDay(sch.day);
    setFormPeriod(sch.periodNumber);
    setFormTeacherId(sch.teacherId);
    setFormSubjectId(sch.subjectId);
    setFormClass(sch.className);
    setFormRoom(sch.room || 'Ruang Kelas');
    setFormNotes(sch.notes || '');
    setIsModalOpen(true);
  };

  // Force overwrite conflicting schedule
  const handleForceOverwriteSchedule = async () => {
    if (!conflictCheck?.conflictingSchedule) return;
    const oldSch = conflictCheck.conflictingSchedule;

    const t = teachers.find(teach => teach.id === formTeacherId);
    const sub = subjects.find(s => s.id === formSubjectId);
    const hours = parsePeriodHours(formPeriod);

    const scheduleData: TeachingSchedule = {
      id: editingScheduleId || `sch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      day: formDay,
      periodNumber: formPeriod,
      periodStartHour: hours[0],
      periodEndHour: hours[hours.length - 1],
      teacherId: formTeacherId,
      teacherName: t?.name || 'Guru Pengajar',
      teacherNip: t?.nip || '-',
      subjectId: formSubjectId,
      subjectName: sub?.name || 'Mata Pelajaran',
      subjectCode: sub?.code || '',
      className: formClass,
      academicYear,
      semester,
      room: formRoom || `Ruang ${formClass}`,
      notes: formNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      await onDeleteSchedule(oldSch.id);
      await onSaveSchedule(scheduleData);
      setIsModalOpen(false);
      showToast(`Jadwal lama (${oldSch.teacherName}) berhasil ditimpa dengan jadwal baru!`);
    } catch (err) {
      console.error(err);
      showToast('Gagal menimpa jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Schedule Submit
  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictCheck) {
      alert(`JADWAL BENTROK!\n\n${conflictCheck.message}\n\nSilakan sesuaikan hari, jam, kelas, atau guru pengajar.`);
      return;
    }

    const t = teachers.find(teach => teach.id === formTeacherId);
    const sub = subjects.find(s => s.id === formSubjectId);
    const hours = parsePeriodHours(formPeriod);

    const scheduleData: TeachingSchedule = {
      id: editingScheduleId || `sch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      day: formDay,
      periodNumber: formPeriod,
      periodStartHour: hours[0],
      periodEndHour: hours[hours.length - 1],
      teacherId: formTeacherId,
      teacherName: t?.name || 'Guru Pengajar',
      teacherNip: t?.nip || '-',
      subjectId: formSubjectId,
      subjectName: sub?.name || 'Mata Pelajaran',
      subjectCode: sub?.code || '',
      className: formClass,
      academicYear,
      semester,
      room: formRoom || `Ruang ${formClass}`,
      notes: formNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      await onSaveSchedule(scheduleData);
      setIsModalOpen(false);
      showToast(`Jadwal KBM ${scheduleData.className} - ${scheduleData.subjectName} berhasil disimpan!`);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan jadwal ke penyimpanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (id: string) => {
    try {
      await onDeleteSchedule(id);
      setDeleteConfirmId(null);
      showToast('Jadwal berhasil dihapus!');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus jadwal.');
    }
  };

  // Quick Action to Start Attendance Session from Schedule item
  const handleStartAttendanceFromSchedule = (sch: TeachingSchedule) => {
    if (onNavigateToAbsensi) {
      onNavigateToAbsensi(sch);
      return;
    }

    const t = teachers.find(teach => teach.id === sch.teacherId);
    const sub = subjects.find(s => s.id === sch.subjectId);

    if (t && onSelectTeacher) onSelectTeacher(t);
    if (sub && onSelectSubject) onSelectSubject(sub);
    if (onSelectClass) onSelectClass(sch.className);

    if (onNavigateToTab) {
      onNavigateToTab('absensi');
    }
  };

  // Filtered schedules for view
  const currentTeacherSchedules = useMemo(() => {
    const targetTeacher = teachers.find(t => t.id === selectedTeacherId);
    return schedules.filter(s => {
      if (s.teacherId === selectedTeacherId) return true;
      if (targetTeacher && s.teacherName && (
        s.teacherName.toLowerCase() === targetTeacher.name.toLowerCase() ||
        (targetTeacher.nip && targetTeacher.nip !== '-' && s.teacherNip === targetTeacher.nip)
      )) return true;
      if (selectedTeacherId === 't-85829' || (targetTeacher && targetTeacher.name.toLowerCase().includes('randi'))) {
        return s.teacherId === 't-85829' || 
               s.teacherName.toLowerCase().includes('randi') ||
               (s.className.startsWith('VIII') && ((s.subjectCode && s.subjectCode.toUpperCase() === 'PENJAS') || (s.subjectName && s.subjectName.toLowerCase().includes('jasmani'))));
      }
      if (selectedTeacherId === 't-85831' || (targetTeacher && (targetTeacher.name.toLowerCase().includes('andri set') || targetTeacher.name.toLowerCase().includes('andi set')))) {
        return (s.teacherId === 't-85831' || 
                s.teacherName.toLowerCase().includes('andri set') || 
                s.teacherName.toLowerCase().includes('andi set')) &&
               !s.className.startsWith('VIII');
      }
      return false;
    });
  }, [schedules, selectedTeacherId, teachers]);

  const currentClassSchedules = useMemo(() => {
    return schedules.filter(s => s.className === selectedClass);
  }, [schedules, selectedClass]);

  // Total teaching hours for selected teacher
  const teacherTotalHours = useMemo(() => {
    return currentTeacherSchedules.reduce((acc, sch) => {
      const hours = parsePeriodHours(sch.periodNumber, sch);
      return acc + hours.length;
    }, 0);
  }, [currentTeacherSchedules]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Hari',
      'Jam Pelajaran / Waktu',
      'Kelas',
      'Mata Pelajaran',
      'Kode Mapel',
      'Guru Pengajar',
      'NIP Guru',
      'Ruangan',
      'Tahun Pelajaran',
      'Semester',
      'Catatan'
    ];

    const rows: (string | number)[][] = [
      ['JADWAL PELAJARAN DAN MENGAJAR - MTS MANBAUL ISLAM'],
      [`Tahun Pelajaran: ${academicYear} | Semester: ${semester}`],
      [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`],
      [''],
      headers
    ];

    // Sort by Day and Period
    const dayOrder: Record<string, number> = {
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6
    };

    const sorted = [...schedules].sort((a, b) => {
      const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      if (dDiff !== 0) return dDiff;
      return a.periodNumber.localeCompare(b.periodNumber);
    });

    sorted.forEach((sch, idx) => {
      rows.push([
        idx + 1,
        sch.day,
        sch.periodNumber,
        sch.className,
        sch.subjectName,
        sch.subjectCode || '-',
        sch.teacherName,
        sch.teacherNip || '-',
        sch.room || '-',
        sch.academicYear || academicYear,
        sch.semester || semester,
        sch.notes || '-'
      ]);
    });

    const cleanSchoolName = (schoolOfficials?.namaSekolah || 'Madrasah').replace(/[^a-zA-Z0-9]/g, '_');
    exportToCSV(`Jadwal_Pelajaran_${cleanSchoolName}_${academicYear.replace('/', '-')}.csv`, rows);
  };

  // Print formatted schedule document
  const handlePrintSchedule = () => {
    printFormattedDocument('printable-schedule-doc');
  };

  // Helper to format teacher name consistently and cleanly
  const formatTeacherDisplayName = (name?: string) => {
    if (!name) return '-';
    if (name === 'Andri Setiayan' || name === 'Andi Setiawan' || name === 'Andri setiawan') {
      return 'Andri Setiawan';
    }
    return name;
  };

  // Sync / Reset to official 368 aSc timetable sessions
  const handleSyncOfficialAsc = async () => {
    const confirmSync = window.confirm(
      `Apakah Anda ingin memuat data Jadwal Pelajaran Resmi Madrasah (368 Sesi KBM aSc Timetables untuk seluruh kelas VII-A s/d IX-F)?\n\nJadwal resmi akan langsung disinkronkan ke sistem dan database.`
    );
    if (!confirmSync) return;

    try {
      if (onBulkSaveSchedules) {
        await onBulkSaveSchedules(OFFICIAL_ASC_SCHEDULES);
      } else if (onSaveAllSchedules) {
        await onSaveAllSchedules(OFFICIAL_ASC_SCHEDULES);
      }
      showToast('Jadwal resmi aSc Timetables (368 sesi) berhasil disinkronkan ke sistem!');
    } catch (e) {
      console.error(e);
      showToast('Gagal memuat jadwal resmi.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500 flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-xs">Informasi Jadwal</p>
            <p className="text-xs text-indigo-200">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Header Banner - Simplified */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-indigo-800/80 relative overflow-hidden">
        {/* Subtle Background Lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 space-y-5">
          {/* Top Bar: Navigation Info & Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-indigo-800/50">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span>Jadwal Pelajaran & Mengajar</span>
              <span className="text-indigo-500">•</span>
              <span className="text-slate-300 font-semibold">{academicYear} ({semester})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdminUnlocked ? (
                <div className="flex items-center space-x-2 bg-emerald-950/90 border border-emerald-500/50 px-2.5 py-1.5 rounded-xl text-xs text-emerald-300 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-extrabold text-[11px]">Super Admin Aktif</span>
                  <button
                    type="button"
                    onClick={handleLockAdminSession}
                    className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition"
                    title="Kunci kembali otorisasi"
                  >
                    Kunci
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-indigo-950/80 border border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-xs text-indigo-300">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-semibold">Edit & Hapus Terproteksi PIN</span>
                </div>
              )}
              <button
                onClick={() => requestAdminAuth({ type: 'sync' })}
                className="bg-indigo-600/90 hover:bg-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs border border-indigo-400/30 transition cursor-pointer"
                title="Muat 368 sesi jadwal resmi dari sistem aSc Timetables (Perlu Kode Super Admin)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-200" />
                <span>Muat Jadwal aSc</span>
              </button>
              <button
                onClick={() => requestAdminAuth({ type: 'add' })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                title="Input Jadwal Pelajaran Baru (Perlu Kode Super Admin)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Jadwal Baru</span>
              </button>
              <button
                onClick={handlePrintSchedule}
                className="bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 border border-indigo-700 transition cursor-pointer"
                title="Cetak Jadwal Pelajaran"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-300" />
                <span>Cetak</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 border border-slate-700 transition cursor-pointer"
                title="Ekspor Jadwal ke CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Main Info: Nama Guru Terpilih (Font Besar), Beban Mengajar, Sesi Hari Ini */}
          {(() => {
            const targetTeacher = teachers.find(t => t.id === selectedTeacherId) || activeTeacher || teachers[0];
            const targetName = formatTeacherDisplayName(targetTeacher?.name);
            const todayCount = currentTeacherSchedules.filter(s => s.day === todayDayName).length;
            const todayJtm = currentTeacherSchedules
              .filter(s => s.day === todayDayName)
              .reduce((sum, s) => sum + parsePeriodHours(s.periodNumber, s).length, 0);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* 1. Nama Guru yang Dipilih (Ukuran Font Besar) */}
                <div className="lg:col-span-6 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-900/80 px-2.5 py-0.5 rounded-full border border-indigo-700/60">
                      Guru Terpilih
                    </span>
                    {targetTeacher?.nip && targetTeacher.nip !== '-' && (
                      <span className="text-xs text-indigo-200 font-medium">
                        NIP: {targetTeacher.nip}
                      </span>
                    )}
                  </div>
                  <h1 className="text-[31px] font-black text-white tracking-tight leading-tight text-center">
                    {targetName}
                  </h1>
                </div>

                {/* 2. Beban Mengajar & 3. Sesi Terjadwal Hari Ini */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Beban Mengajar */}
                  <div className="bg-indigo-900/60 border border-indigo-700/60 backdrop-blur-xs rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-indigo-300">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider">
                        Beban Mengajar
                      </span>
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-2">
                      <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                        {teacherTotalHours} <span className="text-sm font-bold text-slate-300">JTM</span>
                      </p>
                      <p className="text-xs text-indigo-200 font-semibold mt-0.5">
                        {currentTeacherSchedules.length} Sesi Tatap Muka / Minggu
                      </p>
                    </div>
                  </div>

                  {/* Sesi Terjadwal Hari Ini */}
                  <div className="bg-indigo-900/60 border border-indigo-700/60 backdrop-blur-xs rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-indigo-300">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider">
                        Hari Ini ({todayDayName})
                      </span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-2">
                      <p className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                        {todayCount} <span className="text-sm font-bold text-slate-300">Sesi</span>
                      </p>
                      <p className="text-xs text-indigo-200 font-semibold mt-0.5">
                        {todayCount > 0 ? `${todayJtm} Jam Pelajaran (JTM)` : 'Bebas tugas mengajar hari ini'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Active Teacher Quick Notification on Today's Schedule */}
      {(() => {
        const todayTeacherSch = schedules
          .filter(s => {
            if (s.day !== todayDayName) return false;
            if (s.teacherId === activeTeacher.id) return true;
            if (s.teacherName && activeTeacher.name && s.teacherName.toLowerCase() === activeTeacher.name.toLowerCase()) return true;
            if (activeTeacher.id === 't-85829' || activeTeacher.name.toLowerCase().includes('randi')) {
              return s.teacherId === 't-85829' || s.teacherName.toLowerCase().includes('randi') ||
                (s.className.startsWith('VIII') && ((s.subjectCode && s.subjectCode.toUpperCase() === 'PENJAS') || (s.subjectName && s.subjectName.toLowerCase().includes('jasmani'))));
            }
            if (activeTeacher.id === 't-85831' || activeTeacher.name.toLowerCase().includes('andri set') || activeTeacher.name.toLowerCase().includes('andi set')) {
              return (s.teacherId === 't-85831' || s.teacherName.toLowerCase().includes('andri set') || s.teacherName.toLowerCase().includes('andi set')) && !s.className.startsWith('VIII');
            }
            return false;
          })
          .sort((a, b) => a.periodNumber.localeCompare(b.periodNumber));

        return (
          <div className="bg-gradient-to-r from-amber-50 via-indigo-50/60 to-emerald-50/50 border-2 border-indigo-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shrink-0 font-black shadow-xs">
                  <Clock className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-400 text-indigo-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      MENU UTAMA KBM GURU
                    </span>
                    <span className="text-xs font-bold text-slate-500">• Hari {todayDayName}</span>
                  </div>
                  <h3 className="text-sm font-black text-indigo-950 mt-0.5">
                    Jadwal Mengajar Anda: <span className="text-indigo-700 underline">{activeTeacher.name}</span>
                  </h3>
                </div>
              </div>

              {/* Quick Teacher Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2 bg-white/90 border border-indigo-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-600">Ganti Akun:</span>
                  <select
                    value={activeTeacher.id}
                    onChange={(e) => {
                      const found = teachers.find(t => t.id === e.target.value);
                      if (found && onSelectTeacher) {
                        onSelectTeacher(found);
                        setSelectedTeacherId(found.id);
                      }
                    }}
                    className="bg-transparent font-black text-xs text-indigo-950 focus:outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {onOpenTeacherModal && (
                  <button
                    type="button"
                    onClick={onOpenTeacherModal}
                    className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                    title="Buka Popup Pilihan Profil Guru & Quotes Motivasi KBM"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Pilih Guru & Quotes</span>
                  </button>
                )}
              </div>
            </div>

            {/* Today's Schedule Quick Launch Cards */}
            {todayTeacherSch.length > 0 ? (
              <div className="space-y-2 pt-1 border-t border-indigo-100">
                <p className="text-xs text-indigo-950 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Terdapat <strong className="text-indigo-900 font-extrabold">{todayTeacherSch.length} sesi kelas</strong> yang harus Anda ajar hari ini. Klik tombol di bawah untuk langsung mengisi materi & presensi siswa tanpa risiko salah kelas:
                  </span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {todayTeacherSch.map(sch => (
                    <div
                      key={`today-${sch.id}`}
                      className="bg-white border-2 border-indigo-300 hover:border-indigo-600 rounded-xl p-3 shadow-xs flex flex-col justify-between transition hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="bg-indigo-950 text-amber-300 font-black text-[10px] px-2 py-0.5 rounded-md">
                            {sch.periodNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">{sch.room || `Ruang ${sch.className}`}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-1.5">
                          {sch.subjectName}
                        </h4>
                        <p className="text-xs font-black text-indigo-700">
                          Kelas {sch.className}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartAttendanceFromSchedule(sch)}
                        className="mt-3 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                        title={`Buka Presensi & Jurnal Kelas ${sch.className}`}
                      >
                        <ClipboardCheck className="w-4 h-4 text-emerald-200" />
                        <span>Mulai KBM: Isi Materi & Absen</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                <span>
                  Tidak ada jadwal mengajar resmi terdaftar untuk Anda pada hari <strong>{todayDayName}</strong>. Anda dapat melihat jadwal hari lain di bawah atau memilih kelas secara manual jika ada jam pengganti.
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Mode Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Mode Switcher */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('guru')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'guru'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Jadwal per Guru</span>
            </button>
            <button
              onClick={() => setViewMode('kelas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'kelas'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Jadwal per Kelas</span>
            </button>
            <button
              onClick={() => setViewMode('matriks')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'matriks'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriks Keseluruhan</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari guru, mapel, kelas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Sub Controls according to viewMode */}
        {viewMode === 'guru' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pilih Guru:</span>
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="border border-indigo-300 rounded-xl px-3 py-1.5 bg-indigo-50/50 font-extrabold text-indigo-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (NIP: {t.nip})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500">
                Total Beban Mengajar:{' '}
                <strong className="text-indigo-900 font-black">
                  {teacherTotalHours} Jam Tatap Muka (JTM) / Minggu
                </strong>
              </span>
              <button
                onClick={() => requestAdminAuth({ type: 'add', prefill: { teacherId: selectedTeacherId } })}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg font-bold text-xs border border-indigo-200 transition cursor-pointer"
                title="Tambah Jadwal Guru Ini (Perlu Kode Super Admin)"
              >
                + Tambah Jadwal Guru Ini
              </button>
            </div>
          </div>
        )}

        {viewMode === 'kelas' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pilih Kelas:</span>
              <div className="flex flex-wrap gap-1.5">
                {classList.map(c => {
                  const isActive = c === selectedClass;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedClass(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => requestAdminAuth({ type: 'add', prefill: { className: selectedClass } })}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg font-bold text-xs border border-indigo-200 transition cursor-pointer"
              title="Tambah Jadwal Kelas Ini (Perlu Kode Super Admin)"
            >
              + Tambah Jadwal Kelas {selectedClass}
            </button>
          </div>
        )}

        {viewMode === 'matriks' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filter Hari:</span>
              <select
                value={selectedDayFilter}
                onChange={e => setSelectedDayFilter(e.target.value)}
                className="border border-indigo-300 rounded-xl px-3 py-1.5 bg-indigo-50/50 font-extrabold text-indigo-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Hari (Senin - Sabtu)</option>
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Matriks Kurikulum diproteksi kode Super Admin untuk mencegah salah edit/hapus.</span>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: JADWAL PER GURU */}
      {viewMode === 'guru' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS_OF_WEEK.map(day => {
              const isToday = day === todayDayName;
              const daySchedules = currentTeacherSchedules
                .filter(s => s.day === day)
                .filter(s => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    s.subjectName.toLowerCase().includes(q) ||
                    s.className.toLowerCase().includes(q) ||
                    s.periodNumber.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => a.periodNumber.localeCompare(b.periodNumber));

              return (
                <div
                  key={day}
                  className={`rounded-2xl border transition shadow-2xs overflow-hidden flex flex-col ${
                    isToday
                      ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-400/40'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3.5 border-b flex items-center justify-between ${
                      isToday
                        ? 'bg-indigo-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar className={`w-4 h-4 ${isToday ? 'text-amber-300' : 'text-indigo-600'}`} />
                      <h3 className="text-xs font-black uppercase tracking-wider">{day}</h3>
                      {isToday && (
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                          Hari Ini
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {daySchedules.length} Sesi
                      </span>
                      <button
                        onClick={() => requestAdminAuth({ type: 'add', prefill: { day, teacherId: selectedTeacherId } })}
                        title={`Tambah Jadwal Hari ${day} (Perlu Kode Super Admin)`}
                        className={`p-1 rounded cursor-pointer transition ${
                          isToday
                            ? 'bg-indigo-800 hover:bg-indigo-700 text-white'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Sesi List */}
                  <div className="p-3 space-y-2.5 flex-1">
                    {daySchedules.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        <Clock className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                        <p className="font-semibold">Tidak ada jadwal mengajar</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Hari {day} bebas tugas KBM</p>
                      </div>
                    ) : (
                      daySchedules.map(sch => (
                        <div
                          key={sch.id}
                          className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3 shadow-2xs space-y-2 group transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="bg-indigo-100 text-indigo-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md inline-block">
                                {sch.periodNumber}
                              </span>
                              <h4 className="text-xs font-black text-slate-900 mt-1">
                                {sch.subjectName}
                              </h4>
                              <p className="text-[11px] font-bold text-indigo-700">
                                Kelas: {sch.className}
                              </p>
                            </div>

                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => requestAdminAuth({ type: 'edit', schedule: sch })}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                title="Edit Jadwal (Perlu Kode Super Admin)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => requestAdminAuth({ type: 'delete', scheduleId: sch.id })}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Hapus Jadwal (Perlu Kode Super Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick details */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="flex items-center space-x-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{sch.room || `Ruang ${sch.className}`}</span>
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {sch.subjectCode || 'Mapel'}
                            </span>
                          </div>

                          {/* Direct Fill Attendance & Teaching Material Button */}
                          <button
                            type="button"
                            onClick={() => handleStartAttendanceFromSchedule(sch)}
                            className="w-full py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-[11px] flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                            title="Buka Form Presensi & Jurnal Mengajar untuk Kelas ini"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Mulai KBM (Absen & Materi)</span>
                            <ArrowRight className="w-3 h-3 text-emerald-200" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: JADWAL PER KELAS */}
      {viewMode === 'kelas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Jadwal Pelajaran Mingguan: Kelas {selectedClass}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tahun Pelajaran {academicYear} — {semester}
                </p>
              </div>

              <button
                onClick={() => requestAdminAuth({ type: 'add', prefill: { className: selectedClass } })}
                className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                title="Tambah Jadwal Kelas Ini (Perlu Kode Super Admin)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jadwal Kelas {selectedClass}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3">Hari</th>
                    <th className="p-3">Jam / Waktu</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3">Guru Pengajar (NIP)</th>
                    <th className="p-3">Ruangan</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentClassSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold">Belum ada jadwal yang diinput untuk Kelas {selectedClass}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Klik "+ Tambah Jadwal Kelas" untuk menambahkan sesi pelajaran.</p>
                      </td>
                    </tr>
                  ) : (
                    currentClassSchedules
                      .sort((a, b) => {
                        const dayOrder: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };
                        const d = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
                        if (d !== 0) return d;
                        return a.periodNumber.localeCompare(b.periodNumber);
                      })
                      .map((sch, idx) => (
                        <tr key={sch.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-extrabold text-indigo-950">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-800 font-black">
                              {sch.day}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">
                            <span className="text-indigo-900 font-bold">{sch.periodNumber}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900">{sch.subjectName}</div>
                            {sch.subjectCode && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Kode: {sch.subjectCode}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-slate-800">{formatTeacherDisplayName(sch.teacherName)}</div>
                            <span className="text-[10px] text-slate-400 font-medium">NIP: {sch.teacherNip || '-'}</span>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{sch.room || `Ruang ${sch.className}`}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleStartAttendanceFromSchedule(sch)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-[10px] transition cursor-pointer shadow-2xs flex items-center space-x-1"
                                title="Buka Presensi & Jurnal Kelas Ini"
                              >
                                <ClipboardCheck className="w-3 h-3 text-emerald-200" />
                                <span>Mulai KBM</span>
                              </button>
                              <button
                                onClick={() => requestAdminAuth({ type: 'edit', schedule: sch })}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                title="Edit (Perlu Kode Super Admin)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => requestAdminAuth({ type: 'delete', scheduleId: sch.id })}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Hapus (Perlu Kode Super Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: MATRIKS KESELURUHAN */}
      {viewMode === 'matriks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Matriks Jadwal Pelajaran {schoolOfficials?.namaSekolah || 'Madrasah'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Penyusunan jadwal terpadu tanpa bentrok guru & ruangan ({selectedDayFilter === 'ALL' ? 'Seluruh Hari' : `Hari ${selectedDayFilter}`})
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrintSchedule}
                className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-300" />
                <span>Cetak Dokumen Resmi</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <div className="space-y-6">
              {DAYS_OF_WEEK.filter(d => selectedDayFilter === 'ALL' || selectedDayFilter === d).map(day => {
                const daySchedules = schedules.filter(s => s.day === day);
                return (
                  <div key={day} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-indigo-950 text-white px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <h4 className="font-black text-xs uppercase tracking-wider">{day}</h4>
                      </div>
                      <span className="text-[10px] text-indigo-200 font-bold bg-indigo-900 px-2 py-0.5 rounded">
                        {daySchedules.length} Sesi Terjadwal
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
                            <th className="p-2.5 w-10 text-center">No</th>
                            <th className="p-2.5 w-32">Jam Pelajaran</th>
                            <th className="p-2.5 w-20">Kelas</th>
                            <th className="p-2.5">Mata Pelajaran</th>
                            <th className="p-2.5">Guru Pengajar</th>
                            <th className="p-2.5 w-28">Ruangan</th>
                            <th className="p-2.5 w-24 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {daySchedules.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-4 text-center text-slate-400 font-medium text-xs">
                                Tidak ada jadwal pada hari {day}.
                              </td>
                            </tr>
                          ) : (
                            daySchedules
                              .sort((a, b) => a.periodNumber.localeCompare(b.periodNumber))
                              .map((sch, idx) => (
                                <tr key={sch.id} className="hover:bg-indigo-50/30 transition">
                                  <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                                  <td className="p-2.5 font-bold text-indigo-900">{sch.periodNumber}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-950 font-black rounded text-[10px]">
                                      {sch.className}
                                    </span>
                                  </td>
                                  <td className="p-2.5 font-bold text-slate-900">{sch.subjectName}</td>
                                  <td className="p-2.5 text-slate-800 font-semibold">{formatTeacherDisplayName(sch.teacherName)}</td>
                                  <td className="p-2.5 text-slate-500 font-medium">{sch.room || '-'}</td>
                                  <td className="p-2.5 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                      <button
                                        onClick={() => handleStartAttendanceFromSchedule(sch)}
                                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-extrabold text-[10px] transition cursor-pointer shadow-2xs flex items-center space-x-1"
                                        title="Buka Presensi & Jurnal Kelas Ini"
                                      >
                                        <ClipboardCheck className="w-3 h-3 text-emerald-200" />
                                        <span>KBM</span>
                                      </button>
                                      <button
                                        onClick={() => requestAdminAuth({ type: 'edit', schedule: sch })}
                                        className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                        title="Edit Jadwal (Perlu Kode Super Admin)"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => requestAdminAuth({ type: 'delete', scheduleId: sch.id })}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                        title="Hapus Jadwal (Perlu Kode Super Admin)"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT / EDIT JADWAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingScheduleId ? 'Edit Jadwal KBM' : 'Input Jadwal Pelajaran Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pastikan kombinasi hari, jam, guru, dan kelas bebas bentrok.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Warning Alert */}
            {conflictCheck && (
              <div className="my-4 bg-rose-50 border-2 border-rose-400 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-rose-900 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-start space-x-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-rose-950">⛔ Terdeteksi Bentrok Jadwal!</h4>
                    <p className="mt-1 leading-relaxed text-rose-900 font-semibold">{conflictCheck.message}</p>
                    <p className="mt-1 text-[11px] text-rose-800">
                      Silakan ganti jam/hari/kelas di bawah, atau tekan tombol timpa jika ingin menggantikan jadwal lama tersebut.
                    </p>
                  </div>
                </div>

                {conflictCheck.conflictingSchedule && (
                  <button
                    type="button"
                    onClick={handleForceOverwriteSchedule}
                    disabled={isSubmitting}
                    className="shrink-0 self-end sm:self-center px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    ⚡ Timpa & Gantikan Jadwal Lama
                  </button>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitSchedule} className="space-y-4 my-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Hari */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Hari Pelaksanaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Jam Pelajaran / Waktu */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Jam Ke- / Waktu KBM <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPeriod}
                    onChange={e => setFormPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {STANDARD_SCHEDULE_PERIODS.map(p => (
                      <option key={p.id} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guru Pengajar */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Guru Pengajar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formTeacherId}
                  onChange={e => setFormTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (NIP: {t.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Mata Pelajaran */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={e => setFormSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Kelas */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Target Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formClass}
                    onChange={e => setFormClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {classList.map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Ruangan */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Ruangan / Lokasi (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder={`Contoh: Ruang ${formClass} / Lab Komputer`}
                    value={formRoom}
                    onChange={e => setFormRoom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Catatan Sesi (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Praktik Laboratorium / Lapangan"
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!conflictCheck}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white transition flex items-center space-x-1.5 shadow-md ${
                    conflictCheck
                      ? 'bg-rose-600 cursor-not-allowed opacity-70'
                      : isSubmitting
                      ? 'bg-indigo-400 cursor-wait'
                      : 'bg-indigo-900 hover:bg-indigo-800 cursor-pointer'
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal KBM'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      {deleteConfirmId && (() => {
        const targetSch = schedules.find(s => s.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-3 text-rose-600 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Konfirmasi Hapus Jadwal</h3>
                  <p className="text-[11px] text-slate-500">Otorisasi Super Admin Terverifikasi</p>
                </div>
              </div>

              {targetSch && (
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 my-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Hari & Jam:</span>
                    <span className="font-black text-rose-950">{targetSch.day}, Jam {targetSch.periodNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Kelas:</span>
                    <span className="font-black text-rose-950">Kelas {targetSch.className}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Mata Pelajaran:</span>
                    <span className="font-bold text-slate-900">{targetSch.subjectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Guru Pengajar:</span>
                    <span className="font-bold text-slate-900">{formatTeacherDisplayName(targetSch.teacherName)}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed mb-5">
                Apakah Anda yakin ingin menghapus slot jadwal mengajar ini? Tindakan ini akan menghapus jadwal dari matriks kurikulum dan presensi guru.
              </p>
              
              <div className="flex items-center justify-end space-x-2.5">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteSchedule(deleteConfirmId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md transition flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Jadwal</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL SUPER ADMIN PIN / PASSCODE PROTECTION */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Verifikasi Super Admin</h3>
                  <p className="text-xs text-slate-500 font-medium">Otorisasi Manajemen Jadwal Kurikulum</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setPendingAction(null);
                  setAuthPasscodeInput('');
                  setAuthErrorMessage('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 mb-5 text-xs text-indigo-950 leading-relaxed flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-indigo-900 block mb-0.5">Proteksi Matriks Kurikulum</strong>
                <span>
                  Untuk mencegah kesalahan hapus atau modifikasi jadwal oleh guru mata pelajaran, silakan masukkan <strong>Kode / PIN Super Admin</strong> madrasah.
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kode / PIN Super Admin:
                </label>
                <div className="relative">
                  <input
                    type={showAuthPasscode ? 'text' : 'password'}
                    autoFocus
                    value={authPasscodeInput}
                    onChange={e => {
                      setAuthPasscodeInput(e.target.value);
                      if (authErrorMessage) setAuthErrorMessage('');
                    }}
                    placeholder="Masukkan PIN Super Admin..."
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl text-sm font-black tracking-wider text-slate-900 focus:outline-none focus:ring-2 transition ${
                      authErrorMessage
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowAuthPasscode(!showAuthPasscode)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAuthPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authErrorMessage && (
                  <p className="text-xs font-bold text-rose-600 mt-2 flex items-center space-x-1.5 animate-in fade-in duration-150">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authErrorMessage}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberAuth}
                    onChange={e => setRememberAuth(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Ingat otorisasi sesi ini</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setPendingAction(null);
                    setAuthPasscodeInput('');
                    setAuthErrorMessage('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Buka Akses Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL SCHEDULE DOCUMENT (Hidden from regular screen, formatted for print) */}
      <div id="printable-schedule-doc" className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-lg font-bold uppercase tracking-wider">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h1>
          <h2 className="text-xl font-extrabold uppercase">MTS MANBAUL ISLAM</h2>
          <p className="text-xs text-slate-700 mt-1">
            Jadwal Pelajaran dan Mengajar Tatap Muka Tahun Pelajaran {academicYear} — {semester}
          </p>
        </div>

        <div className="mb-4 text-xs">
          <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Waka Kurikulum:</strong> {schoolOfficials?.kurikulum?.name || '-'} (NIP: {schoolOfficials?.kurikulum?.nip || '-'})</p>
        </div>

        <table className="w-full text-xs border border-black border-collapse mb-8">
          <thead>
            <tr className="bg-slate-100 border border-black font-bold uppercase text-[10px]">
              <th className="border border-black p-2 text-center w-8">No</th>
              <th className="border border-black p-2 w-20">Hari</th>
              <th className="border border-black p-2 w-32">Jam Pelajaran</th>
              <th className="border border-black p-2 w-16 text-center">Kelas</th>
              <th className="border border-black p-2">Mata Pelajaran</th>
              <th className="border border-black p-2">Guru Pengajar</th>
              <th className="border border-black p-2 w-20">Ruang</th>
            </tr>
          </thead>
          <tbody>
            {schedules
              .sort((a, b) => {
                const dayOrder: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };
                const d = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
                if (d !== 0) return d;
                return a.periodNumber.localeCompare(b.periodNumber);
              })
              .map((sch, idx) => (
                <tr key={sch.id} className="border border-black">
                  <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                  <td className="border border-black p-1.5 font-bold">{sch.day}</td>
                  <td className="border border-black p-1.5">{sch.periodNumber}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{sch.className}</td>
                  <td className="border border-black p-1.5 font-bold">{sch.subjectName}</td>
                  <td className="border border-black p-1.5">{sch.teacherName}</td>
                  <td className="border border-black p-1.5 text-center">{sch.room || '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Official Signatures */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs pt-6">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Madrasah</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{schoolOfficials?.kepalaSekolah?.name || '-'}</p>
            <p>NIP: {schoolOfficials?.kepalaSekolah?.nip || '-'}</p>
          </div>
          <div>
            <p>Jakarta, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="font-bold">Waka Kurikulum</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{schoolOfficials?.kurikulum?.name || '-'}</p>
            <p>NIP: {schoolOfficials?.kurikulum?.nip || '-'}</p>
          </div>
        </div>
      </div>

    </div>
  );
};

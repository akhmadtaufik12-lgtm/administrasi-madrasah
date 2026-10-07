import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Subject, Student, AttendanceStatus, AttendanceSession, AttendanceEntry, TeachingSchedule, DayOfWeek, ActiveTab, SchoolOfficials } from '../types';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Save,
  Printer,
  Download,
  Search,
  Filter,
  Users,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  Check,
  HelpCircle,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Info,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Cloud
} from 'lucide-react';
import { exportAttendanceSessionCSV, printFormattedDocument } from '../utils/export';
import { getDayNameFromDate, getStoredSchoolOfficials } from '../utils/storage';
import { STANDARD_SCHEDULE_PERIODS } from '../data/initialData';

// Helper to normalize period label across standard definitions
export const normalizePeriodValue = (val?: string): string => {
  if (!val) return STANDARD_SCHEDULE_PERIODS[0].label;
  const exact = STANDARD_SCHEDULE_PERIODS.find(p => p.label.trim().toLowerCase() === val.trim().toLowerCase());
  if (exact) return exact.label;

  // Extract clean number or range, e.g. "1 - 2" or "5 - 6" or "7 - 8"
  const cleanRangeMatch = val.match(/(\d+)\s*[-–&]\s*(\d+)/);
  if (cleanRangeMatch) {
    const rStart = parseInt(cleanRangeMatch[1], 10);
    const rEnd = parseInt(cleanRangeMatch[2], 10);
    const foundRange = STANDARD_SCHEDULE_PERIODS.find(p => {
      const pMatch = p.label.match(/(\d+)\s*[-–&]\s*(\d+)/);
      return pMatch && parseInt(pMatch[1], 10) === rStart && parseInt(pMatch[2], 10) === rEnd;
    });
    if (foundRange) return foundRange.label;
  }

  // Extract single number e.g. "Jam 3" or "3 ("
  const cleanSingleMatch = val.match(/jam\s*(\d+)/i) || val.match(/\b(\d+)\b/);
  if (cleanSingleMatch) {
    const singleNum = parseInt(cleanSingleMatch[1], 10);
    const foundSingle = STANDARD_SCHEDULE_PERIODS.find(p => {
      const pMatch = p.label.match(/jam\s*(\d+)\s*\(/i);
      return pMatch && parseInt(pMatch[1], 10) === singleNum;
    });
    if (foundSingle) return foundSingle.label;
  }

  return val;
};

interface AbsensiMengajarProps {
  activeTeacher: Teacher;
  activeSubject: Subject;
  subjects?: Subject[];
  activeClass: string;
  classList: string[];
  students: Student[];
  onSaveSession: (session: AttendanceSession) => void;
  savedSessions: AttendanceSession[];
  schedules?: TeachingSchedule[];
  selectedSchedule?: TeachingSchedule | null;
  initialPeriod?: string;
  onSelectClass?: (className: string) => void;
  onSelectSubject?: (subject: Subject) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  isOnline?: boolean;
  offlineQueueCount?: number;
  onSyncOfflineQueue?: () => void;
  isSyncingOfflineQueue?: boolean;
  schoolOfficials?: SchoolOfficials;
}

export const AbsensiMengajar: React.FC<AbsensiMengajarProps> = ({
  activeTeacher,
  activeSubject,
  subjects = [],
  activeClass,
  classList,
  students,
  onSaveSession,
  savedSessions,
  schedules = [],
  selectedSchedule,
  initialPeriod,
  onSelectClass,
  onSelectSubject,
  onNavigateToTab,
  isOnline = true,
  offlineQueueCount = 0,
  onSyncOfflineQueue,
  isSyncingOfflineQueue = false,
  schoolOfficials: propSchoolOfficials
}) => {
  const schoolOfficials = propSchoolOfficials || getStoredSchoolOfficials();
  // Filter students for active class
  const classStudents = students.filter(s => s.className === activeClass);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [meetingNumber, setMeetingNumber] = useState<number>(1);
  const [periodNumber, setPeriodNumber] = useState<string>(
    normalizePeriodValue(initialPeriod || selectedSchedule?.periodNumber || STANDARD_SCHEDULE_PERIODS[0].label)
  );
  const [topic, setTopic] = useState<string>('');
  const [competency, setCompetency] = useState<string>('');
  const [teachingNotes, setTeachingNotes] = useState<string>('');
  
  // Student Attendance Entries map: studentId -> { status, notes }
  const [entries, setEntries] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Synchronize when selectedSchedule or initialPeriod is passed from Jadwal Pelajaran
  useEffect(() => {
    if (selectedSchedule) {
      const normalized = normalizePeriodValue(selectedSchedule.periodNumber);
      setPeriodNumber(normalized);
      setToastMessage(`⚡ Menerapkan Jadwal: Kelas ${selectedSchedule.className} • ${selectedSchedule.subjectName} • ${normalized.split('(')[0].trim()}`);
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(timer);
    } else if (initialPeriod) {
      setPeriodNumber(normalizePeriodValue(initialPeriod));
    }
  }, [selectedSchedule, initialPeriod]);

  // Auto initialize entries when class changes or students change
  useEffect(() => {
    // Check if there is already a session saved for this teacher, class, subject, date today
    const existing = savedSessions.find(
      s => s.teacherId === activeTeacher.id &&
           s.className === activeClass &&
           s.subjectId === activeSubject.id &&
           s.date === date
    );

    if (existing) {
      setMeetingNumber(existing.meetingNumber);
      if (!selectedSchedule) {
        setPeriodNumber(normalizePeriodValue(existing.periodNumber || STANDARD_SCHEDULE_PERIODS[0].label));
      }
      setTopic(existing.topic || '');
      setCompetency(existing.competency || '');
      setTeachingNotes(existing.teachingNotes || '');

      const initialEntries: Record<string, { status: AttendanceStatus; notes: string }> = {};
      existing.entries.forEach(e => {
        initialEntries[e.studentId] = {
          status: e.status,
          notes: e.notes || ''
        };
      });
      setEntries(initialEntries);
    } else {
      // Default all to 'H' (Hadir)
      const initialEntries: Record<string, { status: AttendanceStatus; notes: string }> = {};
      classStudents.forEach(s => {
        initialEntries[s.id] = { status: 'H', notes: '' };
      });
      setEntries(initialEntries);

      // Auto compute next meeting number for this class & subject
      const previousSessions = savedSessions.filter(
        s => s.className === activeClass && s.subjectId === activeSubject.id
      );
      setMeetingNumber(previousSessions.length + 1);
    }
  }, [activeClass, activeSubject.id, activeTeacher.id, date]);

  // Quick mark all as Hadir
  const handleMarkAllHadir = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    classStudents.forEach(s => {
      updated[s.id] = {
        status: 'H',
        notes: entries[s.id]?.notes || ''
      };
    });
    setEntries(updated);
  };

  // Change individual student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || ''
      }
    }));
  };

  // Change individual student note
  const handleNoteChange = (studentId: string, notes: string) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'H',
        notes
      }
    }));
  };

  // Compute Statistics
  const totalStudents = classStudents.length;
  let countHadir = 0;
  let countIzin = 0;
  let countSakit = 0;
  let countAlpa = 0;

  classStudents.forEach(s => {
    const st = entries[s.id]?.status || 'H';
    if (st === 'H') countHadir++;
    else if (st === 'I') countIzin++;
    else if (st === 'S') countSakit++;
    else if (st === 'A') countAlpa++;
  });

  const attendancePercentage = totalStudents > 0 ? Math.round((countHadir / totalStudents) * 100) : 0;

  // Helper to parse period string into integer array of period numbers
  const parsePeriods = (periodStr: string): number[] => {
    if (!periodStr) return [];
    const clean = periodStr.split('(')[0].toLowerCase().trim();

    // Match ranges like "1 - 2", "3 - 4", "5 - 6", "7 - 8", "1-2", "1–2"
    const rangeMatch = clean.match(/(?:jam\s*)?(\d+)\s*[-–&]\s*(\d+)/) || periodStr.match(/^(\d+)\s*[-–&]\s*(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start >= 1 && start <= 12 && end >= 1 && end <= 12) {
        const res: number[] = [];
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          res.push(i);
        }
        return res;
      }
    }

    // Match single numbers e.g. "jam 1", "jam 2", or "2 (07.50..."
    const singleMatch = clean.match(/jam\s*(\d+)/) || clean.match(/\b(\d+)\b/);
    if (singleMatch) {
      const num = parseInt(singleMatch[1], 10);
      if (num >= 1 && num <= 12) {
        return [num];
      }
    }

    return [];
  };

  const isPeriodConflict = (p1Str: string, p2Str: string): boolean => {
    const p1 = parsePeriods(p1Str);
    const p2 = parsePeriods(p2Str);

    if (p1.length > 0 && p2.length > 0) {
      return p1.some(num => p2.includes(num));
    }

    return p1Str.trim().toLowerCase() === p2Str.trim().toLowerCase();
  };

  // Identify session currently being edited by active teacher & subject
  const currentSessionBeingEdited = savedSessions.find(
    s => s.teacherId === activeTeacher.id &&
         s.className === activeClass &&
         s.subjectId === activeSubject.id &&
         s.date === date
  );

  // Current Day of Week from selected Date
  const currentDayName = getDayNameFromDate(date);

  // Schedules for active teacher on current selected date's day of week
  const teacherSchedulesToday = useMemo(() => {
    return schedules.filter(s => s.teacherId === activeTeacher.id && s.day === currentDayName);
  }, [schedules, activeTeacher.id, currentDayName]);

  // Official schedule registered for this class on this day & period
  const officialClassSchedule = useMemo(() => {
    return schedules.find(s => 
      s.day === currentDayName && 
      s.className === activeClass &&
      isPeriodConflict(s.periodNumber, periodNumber)
    );
  }, [schedules, currentDayName, activeClass, periodNumber]);

  // Apply quick schedule slot
  const handleApplyScheduleSlot = (sch: TeachingSchedule) => {
    if (onSelectClass) onSelectClass(sch.className);
    const sub = subjects.find(s => s.id === sch.subjectId);
    if (sub && onSelectSubject) onSelectSubject(sub);
    const norm = normalizePeriodValue(sch.periodNumber);
    setPeriodNumber(norm);
    setToastMessage(`Kelas ${sch.className}, ${sch.subjectName}, dan jam ${norm.split('(')[0].trim()} otomatis diterapkan sesuai jadwal.`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Check if slot is already occupied by a DIFFERENT session in this class and date
  const conflictSession = savedSessions.find(s => {
    // Ignore the current session record if updating own session
    if (currentSessionBeingEdited && s.id === currentSessionBeingEdited.id) {
      return false;
    }

    if (s.className !== activeClass || s.date !== date) {
      return false;
    }

    return isPeriodConflict(s.periodNumber, periodNumber);
  });

  // Filter students for UI display
  const filteredStudents = classStudents.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toString().includes(searchQuery);

    const studentStatus = entries[student.id]?.status || 'H';
    const matchesStatus = statusFilter === 'ALL' || studentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Save Trigger - opens confirmation modal or blocks if slot occupied
  const handleSave = () => {
    if (conflictSession) {
      alert(`TIDAK DAPAT DISIMPAN!\n\nSlot jam pelajaran "${periodNumber}" di Kelas ${activeClass} pada tanggal ${date} sudah diisi oleh:\n\n• Guru: ${conflictSession.teacherName}\n• Mata Pelajaran: ${conflictSession.subjectName}\n• Materi: ${conflictSession.topic}\n\nMohon pilih jam pelajaran lain yang masih kosong.`);
      return;
    }
    if (!topic.trim()) {
      alert('Mohon isi Topik / Materi Pembelajaran terlebih dahulu.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Execute actual save after confirmation
  const executeSaveSession = () => {
    const sessionEntries: AttendanceEntry[] = classStudents.map(s => ({
      studentId: s.id,
      status: entries[s.id]?.status || 'H',
      notes: entries[s.id]?.notes || ''
    }));

    const sessionData: AttendanceSession = {
      id: currentSessionBeingEdited ? currentSessionBeingEdited.id : `sess-${activeClass}-${activeSubject.id}-${date}-${Date.now()}`,
      date,
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.name,
      teacherNip: activeTeacher.nip,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      className: activeClass,
      meetingNumber,
      periodNumber,
      topic,
      competency,
      teachingNotes,
      entries: sessionEntries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveSession(sessionData);
    setIsConfirmModalOpen(false);

    const isActuallyOnline = typeof navigator !== 'undefined' ? navigator.onLine : isOnline;
    if (!isActuallyOnline) {
      setToastMessage(`💾 Presensi Kelas ${activeClass} Berhasil Disimpan (Mode Offline)! Data tersimpan aman di perangkat dan akan otomatis disinkronkan ke Database Cloud saat tersambung internet.`);
    } else {
      setToastMessage(`Presensi Mengajar Kelas ${activeClass} berhasil disimpan ke Jurnal & Database Cloud!`);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const sessionEntries: AttendanceEntry[] = classStudents.map(s => ({
      studentId: s.id,
      status: entries[s.id]?.status || 'H',
      notes: entries[s.id]?.notes || ''
    }));

    const dummySession: AttendanceSession = {
      id: 'export-temp',
      date,
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.name,
      teacherNip: activeTeacher.nip,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      className: activeClass,
      meetingNumber,
      periodNumber,
      topic: topic || 'Materi Pembelajaran',
      competency,
      teachingNotes,
      entries: sessionEntries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));
    exportAttendanceSessionCSV(dummySession, studentsMap);
  };

  // Print Document
  const handlePrint = () => {
    if (conflictSession) {
      alert(`TIDAK DAPAT MENCETAK / MENYIMPAN!\n\nSlot jam pelajaran "${periodNumber}" di Kelas ${activeClass} pada tanggal ${date} sudah diisi oleh ${conflictSession.teacherName} (${conflictSession.subjectName}).`);
      return;
    }
    executeSaveSession();
    printFormattedDocument('printable-attendance-doc');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500 flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-amber-400" />
          <div>
            <p className="font-bold text-sm">Berhasil Disimpan!</p>
            <p className="text-xs text-emerald-200">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal before saving attendance */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Simpan Presensi</h3>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">Apakah data presensi yang dimasukkan sudah benar?</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-4 my-4 text-xs">
              {/* Teaching info card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">Nama Guru</span>
                  <span className="font-extrabold text-slate-900">{activeTeacher.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">Mata Pelajaran</span>
                  <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{activeSubject.name} ({activeSubject.code})</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">Kelas</span>
                  <span className="font-black text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded">Kelas {activeClass}</span>
                </div>
                <div className="flex justify-between items-start pt-1">
                  <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider shrink-0 mr-2">Materi Pembelajaran</span>
                  <span className="font-bold text-slate-900 text-right">{topic}</span>
                </div>
              </div>

              {/* Attendance Rekap Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Rekap Kehadiran Siswa
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Total: {totalStudents} Siswa
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center font-extrabold">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                    <span className="block text-[10px] text-emerald-700 uppercase">Hadir (H)</span>
                    <span className="text-lg text-emerald-950 font-black">{countHadir}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                    <span className="block text-[10px] text-amber-700 uppercase">Sakit (S)</span>
                    <span className="text-lg text-amber-950 font-black">{countSakit}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                    <span className="block text-[10px] text-blue-700 uppercase">Izin (I)</span>
                    <span className="text-lg text-blue-950 font-black">{countIzin}</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                    <span className="block text-[10px] text-rose-700 uppercase">Alpa (A)</span>
                    <span className="text-lg text-rose-950 font-black">{countAlpa}</span>
                  </div>
                </div>

                <div className="mt-2 text-right text-[11px] font-bold text-indigo-900">
                  Tingkat Kehadiran: <span className="font-black text-indigo-950">{attendancePercentage}%</span>
                </div>

                {countAlpa > 0 && (
                  <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pemberitahuan Poin Kedisiplinan:</strong> Terdapat <strong>{countAlpa} siswa</strong> Alpa (tanpa keterangan). Poin pelanggaran (<strong>+3 Poin</strong>) akan otomatis ditambahkan ke Catatan Kedisiplinan BK siswa saat disimpan.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer transition"
              >
                Cek Kembali / Edit
              </button>
              <button
                type="button"
                onClick={executeSaveSession}
                className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Ya, Sudah Benar & Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Quick Bar / Return to Menu Utama Jadwal */}
      {onNavigateToTab && (
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onNavigateToTab('jadwal')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-black flex items-center space-x-1.5 border border-slate-300 transition cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-indigo-700" />
            <span>&larr; Kembali ke Jadwal Pelajaran (Menu Utama)</span>
          </button>

          {selectedSchedule ? (
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                KBM Terverifikasi Jadwal: <strong className="font-black">Kelas {activeClass}</strong> • {activeSubject.name} ({periodNumber})
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Sistem KBM & Jurnal Mengajar Terintegrasi {schoolOfficials?.namaSekolah || 'Madrasah'}
            </div>
          )}
        </div>
      )}

      {/* Connection & Offline Sync Status Alert */}
      {!isOnline ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shrink-0 font-black">
              <WifiOff className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">Mode Offline (Tanpa Internet)</span>
                <span className="text-xs text-amber-800 font-semibold">• Presensi Tetap Bisa Diisi</span>
              </div>
              <p className="text-xs text-amber-900 mt-1 font-medium leading-relaxed">
                Bapak/Ibu Guru tetap dapat mengisi dan menyimpan presensi siswa serta catatan jurnal KBM dengan normal. Data tersimpan aman di perangkat ini dan akan <strong>otomatis disinkronkan ke Database Cloud</strong> begitu perangkat kembali terhubung ke internet.
              </p>
            </div>
          </div>
          {offlineQueueCount > 0 && (
            <div className="shrink-0 flex items-center space-x-2 self-start sm:self-center">
              <span className="text-xs font-black bg-amber-200 text-amber-950 border border-amber-400 px-2.5 py-1 rounded-lg">
                💾 {offlineQueueCount} Tersimpan Lokal
              </span>
            </div>
          )}
        </div>
      ) : offlineQueueCount > 0 ? (
        <div className="bg-blue-50 border border-blue-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-blue-950 block">Koneksi Internet Aktif: {offlineQueueCount} Data Presensi Menunggu Sinkronisasi Cloud</span>
              <span className="text-[11px] text-blue-700">Sistem akan menyinkronkan data secara otomatis ke database, atau klik tombol di sebelah kanan.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onSyncOfflineQueue}
            disabled={isSyncingOfflineQueue}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-xl text-xs font-black flex items-center space-x-2 transition cursor-pointer shrink-0 self-start sm:self-center shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingOfflineQueue ? 'animate-spin' : ''}`} />
            <span>{isSyncingOfflineQueue ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      ) : null}

      {/* Header Banner for Class Session */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-sm border border-indigo-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Formulir Absensi & Jurnal Tatap Muka</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              Presensi Kelas {activeClass} — {activeSubject.name}
            </h2>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Guru Pengajar: <span className="font-bold text-white">{activeTeacher.name}</span> (NIP: {activeTeacher.nip})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMarkAllHadir}
              className="bg-indigo-800 hover:bg-indigo-700 text-indigo-100 font-bold px-3 py-1.5 rounded-md text-xs flex items-center space-x-1.5 border border-indigo-700 transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Mark All Present (Hadir Semua)</span>
            </button>

            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-indigo-200" />
              <span>Simpan Presensi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Assistant Strip */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/50 rounded-xl p-3.5 border border-indigo-200/80 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-black text-xs shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
              Panduan Jadwal Mengajar — Hari {currentDayName} ({activeTeacher.name})
            </h4>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('jadwal')}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-950 flex items-center space-x-1 underline cursor-pointer"
            >
              <span>Kelola & Lihat Master Jadwal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {teacherSchedulesToday.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-600 font-medium">
              Pilih slot jadwal di bawah untuk mengisi presensi secara otomatis tanpa risiko salah kelas atau jam:
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {teacherSchedulesToday.map(sch => {
                const isSelected =
                  sch.className === activeClass &&
                  sch.periodNumber === periodNumber &&
                  sch.subjectId === activeSubject.id;

                return (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => handleApplyScheduleSlot(sch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-indigo-900 text-white ring-2 ring-indigo-400'
                        : 'bg-white hover:bg-indigo-100/80 text-indigo-950 border border-indigo-200'
                    }`}
                  >
                    <span className="text-amber-400 font-black">⚡</span>
                    <span>Kelas {sch.className}</span>
                    <span className="text-[10px] opacity-80">({sch.subjectName})</span>
                    <span className="bg-indigo-950/20 px-1.5 py-0.2 rounded text-[10px] font-bold">
                      {sch.periodNumber.split('(')[0].trim()}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">
            Tidak ada jadwal mengajar tetap yang terdaftar untuk {activeTeacher.name} pada hari {currentDayName}. Anda tetap dapat memilih kelas dan jam secara manual di bawah.
          </p>
        )}
      </div>

      {/* Class & Subject Selector Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {/* Class Select */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Pilih Kelas:</span>
            <select
              value={activeClass}
              onChange={e => onSelectClass && onSelectClass(e.target.value)}
              className="border border-indigo-300 rounded-lg px-2.5 py-1 bg-indigo-50/50 font-extrabold text-indigo-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer shadow-2xs"
            >
              {classList.map(c => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>
          </div>

          {/* Subject Select */}
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Mata Pelajaran:</span>
            <select
              value={activeSubject.id}
              onChange={e => {
                const sub = subjects.find(s => s.id === e.target.value);
                if (sub && onSelectSubject) {
                  onSelectSubject(sub);
                }
              }}
              className="border border-indigo-300 rounded-lg px-2.5 py-1 bg-indigo-50/50 font-extrabold text-indigo-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer shadow-2xs max-w-[220px] truncate"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Class Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 hidden lg:inline">Akses Cepat Kelas:</span>
          {classList.map(c => {
            const isActive = c === activeClass;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onSelectClass && onSelectClass(c)}
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-900 text-white shadow-2xs border border-indigo-950'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Siswa</p>
          <p className="text-xl font-black text-slate-800 mt-0.5">{totalStudents}</p>
          <span className="text-[10px] text-slate-400 font-medium">Kelas {activeClass}</span>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-emerald-800">Hadir (H)</p>
            <span className="text-[9px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.2 rounded">
              {attendancePercentage}%
            </span>
          </div>
          <p className="text-xl font-black text-emerald-900 mt-0.5">{countHadir}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Siswa Hadir</span>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-amber-800">Izin (I)</p>
          <p className="text-xl font-black text-amber-900 mt-0.5">{countIzin}</p>
          <span className="text-[10px] text-amber-700 font-medium">Dengan Keterangan</span>
        </div>

        <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-800">Sakit (S)</p>
          <p className="text-xl font-black text-blue-900 mt-0.5">{countSakit}</p>
          <span className="text-[10px] text-blue-700 font-medium">Surat/Info Ortu</span>
        </div>

        <div className="bg-red-50/70 p-3 rounded-lg border border-red-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-red-800">Alpa (A)</p>
          <p className="text-xl font-black text-red-900 mt-0.5">{countAlpa}</p>
          <span className="text-[10px] text-red-700 font-medium">Tanpa Keterangan</span>
        </div>

        <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-200 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-indigo-800">Persentase</p>
          <div className="w-full bg-indigo-200/80 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-700 h-full rounded-full transition-all duration-300"
              style={{ width: `${attendancePercentage}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-indigo-800 font-bold block mt-1">
            {attendancePercentage >= 90 ? 'Sangat Baik' : attendancePercentage >= 75 ? 'Baik' : 'Perhatian'}
          </span>
        </div>
      </div>

      {/* Teaching Session Form Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Informasi Sesi KBM (Kegiatan Belajar Mengajar)</span>
        </h3>

        {/* Warning Banner when Slot is Already Occupied */}
        {conflictSession && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 text-rose-900 shadow-xs flex items-start space-x-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 text-xs">
              <h4 className="font-extrabold text-xs sm:text-sm text-rose-950 flex items-center space-x-1.5">
                <span>⛔ Slot Jam Pelajaran Sudah Terisi Absensinya!</span>
              </h4>
              <p className="mt-1 text-rose-800 leading-relaxed font-medium">
                Jam <span className="underline font-bold text-rose-950">{periodNumber}</span> di <span className="font-bold">Kelas {activeClass}</span> tanggal <span className="font-bold">{date}</span> sudah diisi oleh guru <span className="font-bold text-rose-950">{conflictSession.teacherName}</span> (Mapel: <span className="font-bold text-rose-950">{conflictSession.subjectName}</span> — Topik: <em>"{conflictSession.topic}"</em>).
              </p>
              <p className="mt-1.5 text-[10px] font-bold text-rose-700 bg-rose-100/90 inline-block px-2 py-0.5 rounded border border-rose-200">
                Data presensi tidak dapat disimpan untuk jam ini. Silakan ganti jam pelajaran atau ubah tanggal.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Tanggal */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-indigo-600" />
              <span>Tanggal Pelaksanaan</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Pertemuan Ke */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-indigo-600" />
              <span>Pertemuan Ke-</span>
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={meetingNumber}
              onChange={e => setMeetingNumber(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Jam Ke / Waktu */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Jam Ke- / Waktu Tatap Muka
              </label>
              {officialClassSchedule && (
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                  officialClassSchedule.teacherId === activeTeacher.id
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {officialClassSchedule.teacherId === activeTeacher.id
                    ? '✓ Sesuai Jadwal'
                    : `Jadwal: ${officialClassSchedule.teacherName.split(',')[0]}`}
                </span>
              )}
            </div>
            <select
              value={normalizePeriodValue(periodNumber)}
              onChange={e => setPeriodNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {STANDARD_SCHEDULE_PERIODS.map(p => (
                <option key={p.id} value={p.label}>
                  {p.label}
                </option>
              ))}
              {!STANDARD_SCHEDULE_PERIODS.some(p => p.label === normalizePeriodValue(periodNumber)) && (
                <option value={periodNumber}>{periodNumber}</option>
              )}
            </select>
            {officialClassSchedule && officialClassSchedule.teacherId !== activeTeacher.id && (
              <p className="text-[10px] text-amber-700 font-medium mt-1">
                ℹ️ Jadwal resmi slot ini: <strong className="font-bold">{officialClassSchedule.teacherName}</strong> ({officialClassSchedule.subjectName}).
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Topik / Materi */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Materi / Topik Pembelajaran <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Bab 2 - Persamaan Kuadrat dan Pemfaktoran"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Capaian Pembelajaran / TP */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Tujuan Pembelajaran (TP) / Indikator
            </label>
            <input
              type="text"
              placeholder="Contoh: Siswa dapat menentukan akar-akar persamaan kuadrat secara akurat"
              value={competency}
              onChange={e => setCompetency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Student Attendance List Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        
        {/* Table Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-700" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Daftar Presensi Siswa Kelas {activeClass} ({filteredStudents.length} Siswa)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Student Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none w-40"
              />
            </div>

            {/* Filter by Status */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="H">Hadir (H)</option>
                <option value="I">Izin (I)</option>
                <option value="S">Sakit (S)</option>
                <option value="A">Alpa (A)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Student Attendance Table for Desktop / Tablet (md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-16 text-center">Absen</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3 text-center w-72">Status Kehadiran</th>
                <th className="py-2.5 px-3">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
              {filteredStudents.map((student, idx) => {
                const currentStatus = entries[student.id]?.status || 'H';
                const currentNotes = entries[student.id]?.notes || '';

                return (
                  <tr
                    key={student.id}
                    className={`transition hover:bg-slate-50 ${
                      currentStatus === 'A' ? 'bg-red-50/50' :
                      currentStatus === 'S' ? 'bg-blue-50/50' :
                      currentStatus === 'I' ? 'bg-amber-50/50' : 'even:bg-slate-50/30'
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-2 px-3 text-center font-bold text-indigo-900 bg-indigo-50/60 rounded">
                      {student.rollNo}
                    </td>

                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {student.name}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        
                        {/* HADIR */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'H')}
                          className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition flex items-center space-x-1 cursor-pointer ${
                            currentStatus === 'H'
                              ? 'bg-green-600 text-white shadow-2xs ring-2 ring-green-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {currentStatus === 'H' && <Check className="w-3 h-3" />}
                          <span>Hadir</span>
                        </button>

                        {/* IZIN */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'I')}
                          className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition cursor-pointer ${
                            currentStatus === 'I'
                              ? 'bg-yellow-500 text-white shadow-2xs ring-2 ring-yellow-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Izin
                        </button>

                        {/* SAKIT */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'S')}
                          className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition cursor-pointer ${
                            currentStatus === 'S'
                              ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Sakit
                        </button>

                        {/* ALPA */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'A')}
                          className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition cursor-pointer ${
                            currentStatus === 'A'
                              ? 'bg-red-600 text-white shadow-2xs ring-2 ring-red-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Alpa
                        </button>

                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Catatan..."
                        value={currentNotes}
                        onChange={e => handleNoteChange(student.id, e.target.value)}
                        className="w-full border border-slate-200 focus:border-indigo-500 rounded px-2 py-1 text-xs focus:outline-none bg-white"
                      />
                    </td>

                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-semibold">
                    Tidak ada siswa ditemukan di kelas {activeClass} dengan pencarian ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Vertical Student Cards (No Horizontal Scroll Needed) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {filteredStudents.map((student, idx) => {
            const currentStatus = entries[student.id]?.status || 'H';
            const currentNotes = entries[student.id]?.notes || '';

            return (
              <div
                key={student.id}
                className={`p-3 space-y-2.5 transition-colors ${
                  currentStatus === 'A' ? 'bg-red-50/70 border-l-4 border-l-red-500' :
                  currentStatus === 'S' ? 'bg-blue-50/70 border-l-4 border-l-blue-500' :
                  currentStatus === 'I' ? 'bg-amber-50/70 border-l-4 border-l-amber-500' :
                  'bg-white border-l-4 border-l-green-500 even:bg-slate-50/50'
                }`}
              >
                {/* Student Info Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-slate-400 w-5 shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 font-extrabold text-[11px] rounded shrink-0">
                      Absen {student.rollNo}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {student.name}
                    </h4>
                  </div>

                  {student.gender && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-200 text-slate-700 shrink-0">
                      {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  )}
                </div>

                {/* Status Pilihan Kehadiran (Ditaruh di Bawah Nama Siswa) */}
                <div className="grid grid-cols-4 gap-1.5">
                  {/* HADIR */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, 'H')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center space-x-1 cursor-pointer ${
                      currentStatus === 'H'
                        ? 'bg-green-600 text-white shadow-md ring-2 ring-green-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {currentStatus === 'H' && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>Hadir</span>
                  </button>

                  {/* IZIN */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, 'I')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center space-x-1 cursor-pointer ${
                      currentStatus === 'I'
                        ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {currentStatus === 'I' && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>Izin</span>
                  </button>

                  {/* SAKIT */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, 'S')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center space-x-1 cursor-pointer ${
                      currentStatus === 'S'
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {currentStatus === 'S' && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>Sakit</span>
                  </button>

                  {/* ALPA */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, 'A')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center space-x-1 cursor-pointer ${
                      currentStatus === 'A'
                        ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {currentStatus === 'A' && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>Alpa</span>
                  </button>
                </div>

                {/* Input Catatan Mobile */}
                <div>
                  <input
                    type="text"
                    placeholder="Catatan / keterangan siswa (opsional)..."
                    value={currentNotes}
                    onChange={e => handleNoteChange(student.id, e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              Tidak ada siswa ditemukan di kelas {activeClass} dengan pencarian ini.
            </div>
          )}
        </div>

      </div>

      {/* Teaching Reflection / Incident Notes */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Refleksi & Catatan Kejadian Kegiatan Mengajar (Jurnal Guru)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan kejadian KBM, respon siswa, siswa yang terlambat, atau PR yang diberikan..."
          value={teachingNotes}
          onChange={e => setTeachingNotes(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        ></textarea>
      </div>

      {/* Bottom Action Bar (High Density Stats Footer) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-100 shadow-2xs text-indigo-950">
        <div className="text-xs text-indigo-800 flex items-center space-x-2 font-medium">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Setiap sesi presensi akan otomatis tersinkronisasi ke <strong>Jurnal KBM Guru</strong>.</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-md transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-md transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cetak Doc</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!!conflictSession}
            className={`px-4 py-1.5 text-xs font-bold rounded-md shadow-md transition flex items-center space-x-1.5 ${
              conflictSession
                ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-not-allowed opacity-90 shadow-rose-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95 cursor-pointer'
            }`}
            title={conflictSession ? `Jam pelajaran sudah diisi oleh ${conflictSession.teacherName}` : 'Simpan Presensi'}
          >
            <Save className="w-3.5 h-3.5 text-indigo-100" />
            <span>{conflictSession ? 'Jam Pelajaran Terisi' : 'Simpan Presensi'}</span>
          </button>
        </div>
      </div>

      {/* Hidden Printable Container */}
      <div className="hidden">
        <div id="printable-attendance-doc" className="text-black leading-relaxed">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider">YAYASAN MANBAUL ISLAM</h2>
            <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-900">MADRASAH TSANAWIYAH (MTS) MANBAUL ISLAM</h1>
            <p className="text-xs italic">
              LEMBAR PRESENSI & JURNAL HARIAN KEGIATAN BELAJAR MENGAJAR (KBM)
            </p>
          </div>

          <div className="grid grid-cols-2 text-xs mb-6 space-y-1">
            <div>
              <p><strong>Mata Pelajaran:</strong> {activeSubject.name} ({activeSubject.code})</p>
              <p><strong>Kelas:</strong> {activeClass}</p>
              <p><strong>Hari / Tanggal:</strong> {date}</p>
            </div>
            <div>
              <p><strong>Nama Guru:</strong> {activeTeacher.name}</p>
              <p><strong>NIP:</strong> {activeTeacher.nip}</p>
              <p><strong>Pertemuan / Jam:</strong> Pertemuan ke-{meetingNumber} ({periodNumber})</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs"><strong>Materi / Topik:</strong> {topic || '-'}</p>
            <p className="text-xs"><strong>Tujuan Pembelajaran:</strong> {competency || '-'}</p>
          </div>

          <table className="w-full border-collapse border border-black text-xs mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-center w-10">No</th>
                <th className="border border-black p-2 text-center w-12">Absen</th>
                <th className="border border-black p-2">Nama Siswa</th>
                <th className="border border-black p-2 text-center w-24">Status</th>
                <th className="border border-black p-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((st, i) => {
                const sStatus = entries[st.id]?.status || 'H';
                const sNotes = entries[st.id]?.notes || '';
                return (
                  <tr key={st.id}>
                    <td className="border border-black p-1 text-center">{i + 1}</td>
                    <td className="border border-black p-1 text-center font-bold">{st.rollNo}</td>
                    <td className="border border-black p-1">{st.name}</td>
                    <td className="border border-black p-1 text-center font-bold">
                      {sStatus === 'H' ? 'Hadir' : sStatus === 'I' ? 'Izin' : sStatus === 'S' ? 'Sakit' : 'Alpa'}
                    </td>
                    <td className="border border-black p-1">{sNotes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border border-black p-3 mb-8 text-xs">
            <p className="font-bold mb-1">Catatan / Refleksi Mengajar Guru:</p>
            <p>{teachingNotes || 'KBM berlangsung tertib dan kondusif.'}</p>
          </div>

          <div className="grid grid-cols-2 text-center text-xs mt-12">
            <div>
              <p className="mb-16">Mengetahui,<br />Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
              <p className="font-bold underline">{schoolOfficials?.kepalaSekolah?.name || 'Kepala Madrasah'}</p>
              <p>NIP. {schoolOfficials?.kepalaSekolah?.nip || '-'}</p>
            </div>
            <div>
              <p className="mb-16">Guru Mata Pelajaran</p>
              <p className="font-bold underline">{activeTeacher.name}</p>
              <p>NIP. {activeTeacher.nip}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

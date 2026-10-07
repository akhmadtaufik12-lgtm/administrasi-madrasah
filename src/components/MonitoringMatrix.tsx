import React, { useState, useMemo } from 'react';
import { AttendanceSession, Teacher, Subject, Student, ActiveTab } from '../types';
import {
  LayoutGrid,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  UserCheck,
  BookOpen,
  X,
  FileText,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
  Users,
  AlertTriangle
} from 'lucide-react';
import { printFormattedDocument } from '../utils/export';

interface MonitoringMatrixProps {
  sessions: AttendanceSession[];
  teachers: Teacher[];
  subjects: Subject[];
  students: Student[];
  classList: string[];
  onSaveSession: (session: AttendanceSession) => void;
  onDeleteSession?: (id: string) => void;
  onSelectClass?: (className: string) => void;
  onTabChange?: (tab: ActiveTab) => void;
}

interface PeriodSlot {
  id: string;
  label: string;
  timeRange: string;
  keys: string[]; // keywords to match periodNumber
}

export const MonitoringMatrix: React.FC<MonitoringMatrixProps> = ({
  sessions,
  teachers,
  subjects,
  students,
  classList,
  onSaveSession,
  onDeleteSession,
  onSelectClass,
  onTabChange
}) => {
  // Selected Date state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Mode View state ('4block' or '8period')
  const [viewMode, setViewMode] = useState<'4block' | '8period'>('4block');

  // Search filter for teacher/class/subject in matrix
  const [searchTerm, setSearchTerm] = useState('');

  // Selected session for detail modal
  const [selectedSessionModal, setSelectedSessionModal] = useState<AttendanceSession | null>(null);

  // Quick Add Session state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickClass, setQuickClass] = useState<string>(classList[0] || 'VII A');
  const [quickPeriod, setQuickPeriod] = useState<string>('1 - 2 (07.15 - 08.25 WIB)');
  const [quickTeacherId, setQuickTeacherId] = useState<string>(teachers[0]?.id || '');
  const [quickSubjectId, setQuickSubjectId] = useState<string>(subjects[0]?.id || '');
  const [quickTopic, setQuickTopic] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState<string>('');

  // Define Period Slots according to MTs Manba'ul Islam schedule:
  // Jam 1 (07:15-07:50), Jam 2 (07:50-08:25), Jam 3 (08:25-09:00), Jam 4 (09:00-09:35)
  // Istirahat (09:35-09:55)
  // Jam 5 (09:55-10:30), Jam 6 (10:30-11:05), Jam 7 (11:05-11:40), Jam 8 (11:40-12:15)
  const blockSlots: PeriodSlot[] = [
    { id: 'b1', label: 'JAM KE 1 - 2', timeRange: '07.15 - 08.25 WIB', keys: ['1 - 2', '1-2', '1 – 2', 'jam 1', '07.15', '07.30'] },
    { id: 'b2', label: 'JAM KE 3 - 4', timeRange: '08.25 - 09.35 WIB', keys: ['3 - 4', '3-4', '3 – 4', 'jam 3', '08.25', '08.50'] },
    { id: 'b3', label: 'JAM KE 5 - 6', timeRange: '09.55 - 11.05 WIB', keys: ['5 - 6', '5-6', '5 – 6', 'jam 5', '09.55', '10.45'] },
    { id: 'b4', label: 'JAM KE 7 - 8', timeRange: '11.05 - 12.15 WIB', keys: ['7 - 8', '7-8', '7 – 8', 'jam 7', '11.05', '12.35'] }
  ];

  const singleSlots: PeriodSlot[] = [
    { id: 'p1', label: 'JAM 1', timeRange: '07.15 - 07.50', keys: ['jam 1', '07.15'] },
    { id: 'p2', label: 'JAM 2', timeRange: '07.50 - 08.25', keys: ['jam 2', '07.50'] },
    { id: 'p3', label: 'JAM 3', timeRange: '08.25 - 09.00', keys: ['jam 3', '08.25'] },
    { id: 'p4', label: 'JAM 4', timeRange: '09.00 - 09.35', keys: ['jam 4', '09.00'] },
    { id: 'p5', label: 'JAM 5', timeRange: '09.55 - 10.30', keys: ['jam 5', '09.55'] },
    { id: 'p6', label: 'JAM 6', timeRange: '10.30 - 11.05', keys: ['jam 6', '10.30'] },
    { id: 'p7', label: 'JAM 7', timeRange: '11.05 - 11.40', keys: ['jam 7', '11.05'] },
    { id: 'p8', label: 'JAM 8', timeRange: '11.40 - 12.15', keys: ['jam 8', '11.40'] }
  ];

  const activeSlots = viewMode === '4block' ? blockSlots : singleSlots;

  // Helper to match session periodNumber to appropriate slot accurately
  const findMatchingSlot = (sess: AttendanceSession, slots: PeriodSlot[]): PeriodSlot | null => {
    const periodLower = (sess.periodNumber || '').toLowerCase().trim();

    if (viewMode === '4block') {
      // 1. Explicit Block 5 - 6 / Jam 5
      if (/5\s*[-–&]\s*6|jam\s*5|ke-5|ke\s*5|09\.55|10\.30|10\.45/.test(periodLower) && !/1\s*[-–&]\s*2|3\s*[-–&]\s*4|7\s*[-–&]\s*8/.test(periodLower)) {
        return slots.find(s => s.id === 'b3') || null;
      }
      // 2. Explicit Block 1 - 2 / Jam 1
      if (/1\s*[-–&]\s*2|jam\s*1|ke-1|ke\s*1|07\.15|07\.30/.test(periodLower) && !/3\s*[-–&]\s*4|5\s*[-–&]\s*6|7\s*[-–&]\s*8/.test(periodLower)) {
        return slots.find(s => s.id === 'b1') || null;
      }
      // 3. Explicit Block 3 - 4 / Jam 3
      if (/3\s*[-–&]\s*4|jam\s*3|ke-3|ke\s*3|08\.25|08\.50|09\.10/.test(periodLower) && !/1\s*[-–&]\s*2|5\s*[-–&]\s*6|7\s*[-–&]\s*8/.test(periodLower)) {
        return slots.find(s => s.id === 'b2') || null;
      }
      // 4. Explicit Block 7 - 8 / Jam 7
      if (/7\s*[-–&]\s*8|jam\s*7|ke-7|ke\s*7|11\.05|12\.35/.test(periodLower) && !/1\s*[-–&]\s*2|3\s*[-–&]\s*4|5\s*[-–&]\s*6/.test(periodLower)) {
        return slots.find(s => s.id === 'b4') || null;
      }

      // Check single digit numbers if block format isn't explicit
      if (/\b5\b|\b6\b/.test(periodLower)) return slots.find(s => s.id === 'b3') || null;
      if (/\b1\b|\b2\b/.test(periodLower)) return slots.find(s => s.id === 'b1') || null;
      if (/\b3\b|\b4\b/.test(periodLower)) return slots.find(s => s.id === 'b2') || null;
      if (/\b7\b|\b8\b/.test(periodLower)) return slots.find(s => s.id === 'b4') || null;
    } else {
      // 8period mode
      if (/5\s*[-–&]\s*6/.test(periodLower)) return slots.find(s => s.id === 'p5') || null;
      if (/1\s*[-–&]\s*2/.test(periodLower)) return slots.find(s => s.id === 'p1') || null;
      if (/3\s*[-–&]\s*4/.test(periodLower)) return slots.find(s => s.id === 'p3') || null;
      if (/7\s*[-–&]\s*8/.test(periodLower)) return slots.find(s => s.id === 'p7') || null;

      if (/\b1\b|07\.15/.test(periodLower)) return slots.find(s => s.id === 'p1') || null;
      if (/\b2\b|07\.50/.test(periodLower)) return slots.find(s => s.id === 'p2') || null;
      if (/\b3\b|08\.25/.test(periodLower)) return slots.find(s => s.id === 'p3') || null;
      if (/\b4\b|09\.00/.test(periodLower)) return slots.find(s => s.id === 'p4') || null;
      if (/\b5\b|09\.55/.test(periodLower)) return slots.find(s => s.id === 'p5') || null;
      if (/\b6\b|10\.30/.test(periodLower)) return slots.find(s => s.id === 'p6') || null;
      if (/\b7\b|11\.05/.test(periodLower)) return slots.find(s => s.id === 'p7') || null;
      if (/\b8\b|11\.40/.test(periodLower)) return slots.find(s => s.id === 'p8') || null;
    }

    // Fallback: Check key inclusion
    return slots.find(slot => {
      return slot.keys.some(k => {
        if (/^\d+$/.test(k)) {
          return new RegExp(`\\b${k}\\b`).test(periodLower);
        }
        return periodLower.includes(k.toLowerCase());
      });
    }) || null;
  };

  // Indonesian Long Date Helper
  const formatIndonesianDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Date Shift Helper
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filter Sessions by Selected Date
  const dateSessions = useMemo(() => {
    return sessions.filter(s => s.date === selectedDate);
  }, [sessions, selectedDate]);

  // Map sessions to Matrix Cell [className][slotId]
  const matrixMap = useMemo(() => {
    const map: Record<string, Record<string, AttendanceSession>> = {};

    classList.forEach(cls => {
      map[cls] = {};
    });

    dateSessions.forEach(sess => {
      if (!map[sess.className]) {
        map[sess.className] = {};
      }

      // Find matching slot accurately
      let matchedSlot = findMatchingSlot(sess, activeSlots);

      // Prevent overwriting if slot is already occupied
      if (matchedSlot && map[sess.className][matchedSlot.id]) {
        const availableSlot = activeSlots.find(slot => !map[sess.className][slot.id]);
        if (availableSlot) {
          matchedSlot = availableSlot;
        }
      }

      if (matchedSlot) {
        map[sess.className][matchedSlot.id] = sess;
      } else {
        // Fallback to first empty slot if unmapped
        const emptySlot = activeSlots.find(slot => !map[sess.className][slot.id]);
        if (emptySlot) {
          map[sess.className][emptySlot.id] = sess;
        }
      }
    });

    return map;
  }, [dateSessions, classList, activeSlots]);

  // Statistics
  const totalSlotsPossible = classList.length * activeSlots.length;
  const filledSlotsCount = useMemo(() => {
    let count = 0;
    classList.forEach(cls => {
      activeSlots.forEach(slot => {
        if (matrixMap[cls]?.[slot.id]) count++;
      });
    });
    return count;
  }, [classList, activeSlots, matrixMap]);

  const coveragePercentage = totalSlotsPossible > 0 ? Math.round((filledSlotsCount / totalSlotsPossible) * 100) : 0;

  const uniqueTeachersCount = useMemo(() => {
    const teacherIds = new Set(dateSessions.map(s => s.teacherId));
    return teacherIds.size;
  }, [dateSessions]);

  // Check if slot in Quick Add is already occupied
  const quickConflictSession = useMemo(() => {
    if (!isQuickAddOpen) return null;
    return dateSessions.find(s => {
      if (s.className !== quickClass) return false;

      // Helper to parse period numbers
      const parsePeriods = (periodStr: string): number[] => {
        if (!periodStr) return [];
        const clean = periodStr.split('(')[0].toLowerCase().trim();
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
        const singleMatch = clean.match(/jam\s*(\d+)/) || clean.match(/\b(\d+)\b/);
        if (singleMatch) {
          const num = parseInt(singleMatch[1], 10);
          if (num >= 1 && num <= 12) return [num];
        }
        return [];
      };

      const p1 = parsePeriods(s.periodNumber);
      const p2 = parsePeriods(quickPeriod);
      if (p1.length > 0 && p2.length > 0) {
        return p1.some(num => p2.includes(num));
      }
      return s.periodNumber.trim().toLowerCase() === quickPeriod.trim().toLowerCase();
    });
  }, [isQuickAddOpen, dateSessions, quickClass, quickPeriod]);

  // Handle Quick Add Submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quickConflictSession) {
      alert(`TIDAK DAPAT DISIMPAN!\n\nSlot jam pelajaran "${quickPeriod}" di Kelas ${quickClass} pada tanggal ${selectedDate} sudah diisi oleh:\n\n• Guru: ${quickConflictSession.teacherName}\n• Mapel: ${quickConflictSession.subjectName}\n• Materi: ${quickConflictSession.topic}`);
      return;
    }

    const teacher = teachers.find(t => t.id === quickTeacherId) || teachers[0];
    const subject = subjects.find(s => s.id === quickSubjectId) || subjects[0];
    const classStudents = students.filter(st => st.className === quickClass);

    const newSession: AttendanceSession = {
      id: `sess-matrix-${quickClass.replace(/\s+/g, '')}-${Date.now()}`,
      date: selectedDate,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherNip: teacher.nip || '-',
      subjectId: subject.id,
      subjectName: subject.name,
      className: quickClass,
      meetingNumber: 1,
      periodNumber: quickPeriod,
      topic: quickTopic.trim() || `KBM ${subject.name} di Kelas ${quickClass}`,
      competency: 'Kompentensi Pembelajaran Rutin',
      teachingNotes: quickNotes.trim() || 'Diprofilkan via Matriks Monitoring KBM',
      entries: classStudents.map(st => ({
        studentId: st.id,
        status: 'H',
        notes: 'Hadir mengikuti KBM'
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveSession(newSession);
    setIsQuickAddOpen(false);
    setQuickTopic('');
    setQuickNotes('');
  };

  // Open Quick Add for Cell
  const handleCellClickEmpty = (className: string, slot: PeriodSlot) => {
    setQuickClass(className);
    setQuickPeriod(`${slot.label} (${slot.timeRange})`);
    if (teachers.length > 0) setQuickTeacherId(teachers[0].id);
    if (subjects.length > 0) setQuickSubjectId(subjects[0].id);
    setIsQuickAddOpen(true);
  };

  // Filtered Class List by Search
  const filteredClasses = classList.filter(cls => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (cls.toLowerCase().includes(term)) return true;

    // Search by teacher name or subject name in this row
    return activeSlots.some(slot => {
      const sess = matrixMap[cls]?.[slot.id];
      if (!sess) return false;
      return (
        sess.teacherName.toLowerCase().includes(term) ||
        sess.subjectName.toLowerCase().includes(term)
      );
    });
  });

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER BANNER - MONITORING KBM MATRIX */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>MONITORING KBM MATRIX</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Matriks Kehadiran Guru per Kelas & Jam Pelajaran
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              Pemantauan terpadu kurikulum - <span className="text-amber-300 font-bold">{formatIndonesianDate(selectedDate)}</span>
            </p>
          </div>

          {/* Right Stats & Action Box */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-xl px-4 py-2.5 flex items-center space-x-3 shadow-inner">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cakupan Terisi</p>
                <p className="text-base font-extrabold text-white leading-tight">
                  {filledSlotsCount} <span className="text-xs font-normal text-slate-400">/ {totalSlotsPossible} Sesi</span>
                </p>
              </div>
              <div className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                {coveragePercentage}%
              </div>
            </div>

            <button
              onClick={() => printFormattedDocument('print-matrix-content')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer border border-indigo-400/40"
              title="Cetak Matriks Harian KBM"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Matriks</span>
            </button>

            <button
              onClick={() => {
                if (classList.length > 0) handleCellClickEmpty(classList[0], activeSlots[0]);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Isi KBM</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FILTER TANGGAL MONITORING CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Filter Tanggal Monitoring
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Pilih tanggal untuk memantau matriks absensi KBM di seluruh kelas
            </p>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 font-bold text-slate-800 text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => shiftDate(1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick Shortcuts */}
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              selectedDate === new Date().toISOString().split('T')[0]
                ? 'bg-indigo-900 text-white border-indigo-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* 3. QUICK STATS SUMMARY & MATRIX CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Header & Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Matriks KBM ({formatIndonesianDate(selectedDate)})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Daftar status kehadiran guru dan mata pelajaran berdasarkan jam pelajaran
              </p>
            </div>
          </div>

          {/* Legend & Search */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            {/* Legend Indicators */}
            <div className="flex items-center space-x-3 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Hadir</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Izin/Sakit/TL</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Tanpa Keterangan</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span>Belum Diisi</span>
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setViewMode('4block')}
                className={`px-2.5 py-1 rounded-md font-extrabold transition ${
                  viewMode === '4block'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4 Blok Jam
              </button>
              <button
                onClick={() => setViewMode('8period')}
                className={`px-2.5 py-1 rounded-md font-extrabold transition ${
                  viewMode === '8period'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                8 Jam Pelajaran
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kelas / guru..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* MATRIX GRID TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 w-32 border-r border-slate-200 sticky left-0 bg-slate-100 z-10 shadow-xs">
                  NAMA KELAS
                </th>
                {activeSlots.map(slot => (
                  <th key={slot.id} className="py-3 px-3 text-center border-r border-slate-200/80">
                    <div>{slot.label}</div>
                    <div className="text-[9px] text-slate-400 font-medium normal-case">{slot.timeRange}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={activeSlots.length + 1} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ditemukan data kelas atau guru sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredClasses.map(cls => (
                  <tr key={cls} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Class Name Sticky Column */}
                    <td className="py-3 px-4 font-black text-indigo-950 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-2xs">
                      <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md">
                        {cls}
                      </span>
                    </td>

                    {/* Period Slot Cells */}
                    {activeSlots.map(slot => {
                      const session = matrixMap[cls]?.[slot.id];

                      if (session) {
                        // FILLED SESSION CELL
                        return (
                          <td key={slot.id} className="p-2 border-r border-slate-200/80 align-top w-1/4">
                            <div
                              onClick={() => setSelectedSessionModal(session)}
                              className="group bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/80 rounded-xl p-2.5 transition cursor-pointer shadow-2xs relative"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p className="font-bold text-slate-900 group-hover:text-emerald-950 transition line-clamp-1 leading-snug">
                                  {session.teacherName}
                                </p>
                                <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                  HADIR
                                </span>
                              </div>

                              <p className="text-[11px] font-extrabold text-indigo-700 mt-1 line-clamp-1">
                                {session.subjectName}
                              </p>

                              {session.topic && (
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-medium italic">
                                  {session.topic}
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      } else {
                        // EMPTY SLOT CELL
                        return (
                          <td key={slot.id} className="p-2 border-r border-slate-200/80 align-top w-1/4">
                            <button
                              onClick={() => handleCellClickEmpty(cls, slot)}
                              className="w-full h-full min-h-[60px] border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl p-2 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-700 transition cursor-pointer text-center group"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition mb-0.5" />
                              <span className="text-[10px] font-bold tracking-tight">+ Isi Absensi</span>
                            </button>
                          </td>
                        );
                      }
                    })}

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Matrix Footer Stats */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3 font-semibold">
          <div className="flex items-center space-x-4">
            <span>Total {classList.length} Kelas Terdaftar</span>
            <span>•</span>
            <span className="text-indigo-700">{uniqueTeachersCount} Guru Mengajar Hari Ini</span>
          </div>
          <div>
            Terisi <span className="font-bold text-emerald-700">{filledSlotsCount}</span> dari {totalSlotsPossible} Slot Sesi
          </div>
        </div>

      </div>

      {/* 4. DETAIL SESSION MODAL */}
      {selectedSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-indigo-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-700 flex items-center justify-center text-emerald-300 font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Detail Sesi KBM - {selectedSessionModal.className}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {formatIndonesianDate(selectedSessionModal.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="p-1 rounded-lg hover:bg-indigo-800 text-indigo-200 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Guru Pengajar</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{selectedSessionModal.teacherName}</p>
                  <p className="text-[10px] text-slate-500">NIP: {selectedSessionModal.teacherNip}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Mata Pelajaran</p>
                  <p className="font-extrabold text-indigo-700 mt-0.5">{selectedSessionModal.subjectName}</p>
                  <p className="text-[10px] text-slate-500">Jam: {selectedSessionModal.periodNumber}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Materi / Topik Pembelajaran</p>
                <p className="text-xs font-bold text-slate-800 bg-amber-50/80 border border-amber-200 p-3 rounded-xl mt-1">
                  {selectedSessionModal.topic}
                </p>
              </div>

              {selectedSessionModal.competency && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Capaian Pembelajaran (TP)</p>
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 p-3 rounded-xl mt-1">
                    {selectedSessionModal.competency}
                  </p>
                </div>
              )}

              {/* Student Presence Summary Pills */}
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Ringkasan Presensi Siswa</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-extrabold">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl">
                    <p className="text-[10px] font-normal text-emerald-600">Hadir</p>
                    <p className="text-base font-black">
                      {selectedSessionModal.entries.filter(e => e.status === 'H').length}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl">
                    <p className="text-[10px] font-normal text-amber-600">Izin</p>
                    <p className="text-base font-black">
                      {selectedSessionModal.entries.filter(e => e.status === 'I').length}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2.5 rounded-xl">
                    <p className="text-[10px] font-normal text-blue-600">Sakit</p>
                    <p className="text-base font-black">
                      {selectedSessionModal.entries.filter(e => e.status === 'S').length}
                    </p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl">
                    <p className="text-[10px] font-normal text-rose-600">Alpa</p>
                    <p className="text-base font-black">
                      {selectedSessionModal.entries.filter(e => e.status === 'A').length}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              {onDeleteSession && (
                <button
                  onClick={() => {
                    onDeleteSession(selectedSessionModal.id);
                    setSelectedSessionModal(null);
                  }}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Sesi</span>
                </button>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (onSelectClass) onSelectClass(selectedSessionModal.className);
                    if (onTabChange) onTabChange('absensi');
                    setSelectedSessionModal(null);
                  }}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Menu Absensi</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. QUICK ADD / FILL SESSION MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Input KBM Matrix - Kelas {quickClass}</h3>
                  <p className="text-xs text-slate-500">{formatIndonesianDate(selectedDate)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4 text-xs">
              
              {/* Conflict Warning in Quick Add */}
              {quickConflictSession && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 text-rose-900 flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-xs text-rose-950">⛔ Slot Jam Pelajaran Terisi!</h4>
                    <p className="mt-0.5 text-[11px] text-rose-800 leading-tight">
                      Jam <strong>{quickPeriod}</strong> di Kelas <strong>{quickClass}</strong> sudah diisi oleh <strong>{quickConflictSession.teacherName}</strong> ({quickConflictSession.subjectName}).
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Kelas</label>
                <select
                  value={quickClass}
                  onChange={(e) => setQuickClass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Jam Pelajaran</label>
                <input
                  type="text"
                  value={quickPeriod}
                  onChange={(e) => setQuickPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. 1 - 2 (07.30 - 08.50 WIB)"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Guru Mengajar</label>
                <select
                  value={quickTeacherId}
                  onChange={(e) => setQuickTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mata Pelajaran</label>
                <select
                  value={quickSubjectId}
                  onChange={(e) => setQuickSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Materi / Topik Pembelajaran</label>
                <input
                  type="text"
                  required
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  placeholder="Contoh: Bab 3 Persamaan Linear Satu Variabel"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Otomatis menandai seluruh siswa kelas {quickClass} dengan status HADIR (Dapat disesuaikan di menu Absensi).</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectClass) onSelectClass(quickClass);
                    if (onTabChange) onTabChange('absensi');
                    setIsQuickAddOpen(false);
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Menu Absensi Utama</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!!quickConflictSession}
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition ${
                      quickConflictSession
                        ? 'bg-rose-500 text-white cursor-not-allowed opacity-90'
                        : 'bg-indigo-900 hover:bg-indigo-800 text-white cursor-pointer'
                    }`}
                  >
                    {quickConflictSession ? 'Jam Terisi' : 'Simpan Sesi KBM'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT MATRIX HTML CONTENT */}
      <div id="print-matrix-content" className="hidden">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider">MTS MANBAUL ISLAM</h1>
          <h2 className="text-lg font-bold uppercase mt-1">MATRIKS KEHADIRAN GURU &amp; JURNAL KBM HARIAN</h2>
          <p className="text-sm italic mt-0.5">Tanggal Monitoring: {formatIndonesianDate(selectedDate)}</p>
        </div>

        <table className="w-full text-xs border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-100 text-black font-bold uppercase">
              <th className="border border-black p-2 w-24 text-center">Kelas</th>
              {activeSlots.map(s => (
                <th key={s.id} className="border border-black p-2 text-center">
                  {s.label}<br />
                  <span className="text-[10px] font-normal">{s.timeRange}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classList.map(cls => (
              <tr key={cls}>
                <td className="border border-black p-2 font-bold text-center bg-gray-50">{cls}</td>
                {activeSlots.map(slot => {
                  const sess = matrixMap[cls]?.[slot.id];
                  return (
                    <td key={slot.id} className="border border-black p-2 align-top text-center">
                      {sess ? (
                        <div>
                          <div className="font-bold">{sess.teacherName}</div>
                          <div className="text-indigo-900 font-semibold">{sess.subjectName}</div>
                          <div className="text-[10px] text-gray-600 mt-0.5 italic">{sess.topic}</div>
                          <div className="text-[9px] font-bold text-emerald-700 mt-1">[ HADIR ]</div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-[10px]">- Belum Diisi -</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between text-xs mt-8 pt-4">
          <div className="text-center w-48">
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Madrasah</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( M. Sholihin, SE )</p>
            <p className="text-[10px]">NIP: 85780</p>
          </div>

          <div className="text-center w-48">
            <p>Bogor, {formatIndonesianDate(selectedDate)}</p>
            <p className="font-bold">Waka Kurikulum</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Saodah, S.Pd )</p>
            <p className="text-[10px]">NIP: 85782</p>
          </div>
        </div>
      </div>

    </div>
  );
};

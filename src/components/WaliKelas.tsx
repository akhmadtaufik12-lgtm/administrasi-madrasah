import React, { useState, useMemo } from 'react';
import { Teacher, Subject, Student, AttendanceSession, SchoolOfficials, ClassWaliKelasMap, StudentViolation } from '../types';
import {
  UserCheck,
  Users,
  Calendar,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  PhoneCall,
  ShieldAlert,
  BookOpen,
  Filter,
  FileText,
  ChevronRight,
  TrendingDown,
  Award,
  X
} from 'lucide-react';
import { exportToCSV, printFormattedDocument } from '../utils/export';
import { buildHistoricalStudentDictionary, findMatchingEntryForStudent } from '../utils/studentMatcher';

interface WaliKelasProps {
  teachers: Teacher[];
  subjects: Subject[];
  students: Student[];
  sessions: AttendanceSession[];
  classList: string[];
  activeClass: string;
  onSelectClass: (className: string) => void;
  academicYear?: string;
  semester?: string;
  schoolOfficials?: SchoolOfficials;
  classWaliKelas?: ClassWaliKelasMap;
  violations?: StudentViolation[];
  onToggleViolationHandled?: (id: string, note?: string) => Promise<void> | void;
}

export const WaliKelas: React.FC<WaliKelasProps> = ({
  teachers,
  subjects,
  students,
  sessions,
  classList,
  activeClass,
  onSelectClass,
  academicYear = '2026/2027',
  semester = 'Semester Ganjil',
  schoolOfficials,
  classWaliKelas,
  violations = [],
  onToggleViolationHandled
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(activeClass);
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'THIS_MONTH' | 'TODAY'>('ALL');
  const [subTab, setSubTab] = useState<'rekap' | 'harian' | 'mapel' | 'panggilan' | 'pelanggaran'>('rekap');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALPA' | 'SAKIT_IZIN' | 'LOW'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [handlingViolationModal, setHandlingViolationModal] = useState<StudentViolation | null>(null);
  const [handlingNote, setHandlingNote] = useState<string>('');

  // Synchronize class selection with parent state if changed
  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    onSelectClass(className);
  };

  // Find Homeroom Teacher (Wali Kelas) assigned for this class
  const waliKelasInfo = useMemo(() => {
    const classMapping: Record<string, string> = classWaliKelas || {
      'VII A': 'Andri Setiawan',
      'VII B': 'Agustiani, S.Pd',
      'VII C': 'Listijawati, SE',
      'VII D': 'M. Sholihin, SE',
      'VII E': 'Listijawati, SE',
      'VIII A': 'Andri Setiawan',
      'VIII B': 'Agustiani, S.Pd',
      'IX A': 'M. Sholihin, SE',
      'IX B': 'Agustiani, S.Pd'
    };
    const mappedName = classMapping[selectedClass];
    const teacherMatch = teachers.find(t => t.name === mappedName);
    return teacherMatch || { name: mappedName || 'Wali Kelas ' + selectedClass, nip: '-' };
  }, [selectedClass, teachers, classWaliKelas]);

  // Students in selected homeroom class
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  // Sessions filtered by class & time filter
  const filteredSessions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    return sessions.filter(session => {
      if (session.className !== selectedClass) return false;

      if (timeFilter === 'TODAY') {
        return session.date === todayStr;
      } else if (timeFilter === 'THIS_MONTH') {
        return session.date.startsWith(currentMonthStr);
      }

      return true;
    });
  }, [sessions, selectedClass, timeFilter]);

  // Helper to format date string to Indonesian Day Name and formatted date
  const formatDayAndDate = (dateStr: string) => {
    if (!dateStr) return { dayName: '', formattedDate: dateStr };
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'long' });
      const formattedDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return { dayName, formattedDate };
    } catch {
      return { dayName: '', formattedDate: dateStr };
    }
  };

  // Build dictionary to bridge historical IDs with current student roster
  const studentDict = useMemo(() => {
    return buildHistoricalStudentDictionary(students, violations);
  }, [students, violations]);

  // Calculate student attendance metrics for homeroom class
  const studentStats = useMemo(() => {
    return classStudents.map(student => {
      let countH = 0;
      let countI = 0;
      let countS = 0;
      let countA = 0;

      // Track per subject breakdown
      const subjectBreakdown: Record<string, { name: string; H: number; S: number; I: number; A: number }> = {};

      // Track detailed absence events (day, date, subject, period)
      const absenceLogs: Array<{
        id: string;
        date: string;
        dayName: string;
        formattedDate: string;
        status: 'S' | 'I' | 'A';
        subjectName: string;
        periodNumber: string;
        teacherName: string;
        topic?: string;
      }> = [];

      filteredSessions.forEach(session => {
        const entry = findMatchingEntryForStudent(session.entries, student, studentDict);
        if (entry) {
          if (!subjectBreakdown[session.subjectId]) {
            subjectBreakdown[session.subjectId] = {
              name: session.subjectName,
              H: 0,
              S: 0,
              I: 0,
              A: 0
            };
          }

          if (entry.status === 'H') {
            countH++;
            subjectBreakdown[session.subjectId].H++;
          } else if (entry.status === 'I') {
            countI++;
            subjectBreakdown[session.subjectId].I++;
            const { dayName, formattedDate } = formatDayAndDate(session.date);
            absenceLogs.push({
              id: session.id,
              date: session.date,
              dayName,
              formattedDate,
              status: 'I',
              subjectName: session.subjectName,
              periodNumber: session.periodNumber,
              teacherName: session.teacherName,
              topic: session.topic
            });
          } else if (entry.status === 'S') {
            countS++;
            subjectBreakdown[session.subjectId].S++;
            const { dayName, formattedDate } = formatDayAndDate(session.date);
            absenceLogs.push({
              id: session.id,
              date: session.date,
              dayName,
              formattedDate,
              status: 'S',
              subjectName: session.subjectName,
              periodNumber: session.periodNumber,
              teacherName: session.teacherName,
              topic: session.topic
            });
          } else if (entry.status === 'A') {
            countA++;
            subjectBreakdown[session.subjectId].A++;
            const { dayName, formattedDate } = formatDayAndDate(session.date);
            absenceLogs.push({
              id: session.id,
              date: session.date,
              dayName,
              formattedDate,
              status: 'A',
              subjectName: session.subjectName,
              periodNumber: session.periodNumber,
              teacherName: session.teacherName,
              topic: session.topic
            });
          }
        }
      });

      // Sort logs descending by date
      absenceLogs.sort((a, b) => b.date.localeCompare(a.date));

      const totalRecorded = countH + countI + countS + countA;
      const percentage = totalRecorded > 0 ? Math.round((countH / totalRecorded) * 100) : 100;

      return {
        student,
        countH,
        countI,
        countS,
        countA,
        totalRecorded,
        percentage,
        subjectBreakdown,
        absenceLogs
      };
    });
  }, [classStudents, filteredSessions]);

  // Violations filtered for this homeroom class
  const classViolations = useMemo(() => {
    return violations.filter(v => v.className === selectedClass);
  }, [violations, selectedClass]);

  const unhandledViolationsCount = useMemo(() => {
    return classViolations.filter(v => v.status !== 'Telah Ditangani' && !v.handledByWaliKelas).length;
  }, [classViolations]);

  // Class Overview Summary Numbers
  const totalStudents = classStudents.length;
  const totalClassH = studentStats.reduce((acc, curr) => acc + curr.countH, 0);
  const totalClassS = studentStats.reduce((acc, curr) => acc + curr.countS, 0);
  const totalClassI = studentStats.reduce((acc, curr) => acc + curr.countI, 0);
  const totalClassA = studentStats.reduce((acc, curr) => acc + curr.countA, 0);
  const totalClassRec = studentStats.reduce((acc, curr) => acc + curr.totalRecorded, 0);
  const classAttendancePercentage = totalClassRec > 0 ? Math.round((totalClassH / totalClassRec) * 100) : 100;

  // Flagged Students needing attention (Alpa > 0 or percentage < 80%)
  const flaggedStudents = useMemo(() => {
    return studentStats.filter(st => st.countA > 0 || st.percentage < 80);
  }, [studentStats]);

  // Filtered list for table
  const displayedStudents = useMemo(() => {
    return studentStats.filter(st => {
      const matchesSearch =
        st.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.student.nisn && st.student.nisn.includes(searchQuery)) ||
        st.student.rollNo.toString().includes(searchQuery);

      if (!matchesSearch) return false;

      if (statusFilter === 'ALPA') return st.countA > 0;
      if (statusFilter === 'SAKIT_IZIN') return st.countS > 0 || st.countI > 0;
      if (statusFilter === 'LOW') return st.percentage < 80;

      return true;
    });
  }, [studentStats, searchQuery, statusFilter]);

  // Sessions on selected single date
  const selectedDateSessions = useMemo(() => {
    return sessions.filter(s => s.className === selectedClass && s.date === selectedDate);
  }, [sessions, selectedClass, selectedDate]);

  // Export CSV
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      [`LAPORAN REKAPITULASI KEHADIRAN SISWA OLEH WALI KELAS`],
      [`Kelas: ${selectedClass}`],
      [`Wali Kelas: ${waliKelasInfo.name}`],
      [`Tahun Pelajaran: ${academicYear} - ${semester}`],
      [`Total Pertemuan Terdata: ${filteredSessions.length} Sesi`],
      [''],
      ['No', 'No. Absen', 'NISN', 'Nama Siswa', 'L/P', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', 'Total Jam', 'Persentase Kehadiran (%)', 'Status Catatan']
    ];

    studentStats.forEach((st, idx) => {
      let statusNote = 'Sangat Baik';
      if (st.countA > 2) statusNote = 'Perlu Panggilan Ortud';
      else if (st.countA > 0) statusNote = 'Ada Alpa';
      else if (st.percentage < 80) statusNote = 'Kehadiran Rendah';

      rows.push([
        idx + 1,
        st.student.rollNo,
        st.student.nisn || '-',
        st.student.name,
        st.student.gender || 'L',
        st.countH,
        st.countS,
        st.countI,
        st.countA,
        st.totalRecorded,
        `${st.percentage}%`,
        statusNote
      ]);
    });

    exportToCSV(`Laporan_Wali_Kelas_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}.csv`, rows);
  };

  const handlePrint = () => {
    printFormattedDocument('printable-walikelas-doc');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Header Controls */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-blue-900 rounded-2xl p-5 text-white shadow-lg border border-indigo-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-indigo-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <UserCheck className="w-6 h-6 text-indigo-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-400 text-indigo-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Portal Wali Kelas
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  {academicYear} • {semester}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                Monitoring Kehadiran Siswa Kelas {selectedClass}
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5 flex items-center space-x-2">
                <span>Wali Kelas: <strong className="text-white">{waliKelasInfo.name}</strong></span>
                {waliKelasInfo.nip && waliKelasInfo.nip !== '-' && (
                  <span>(NIP: {waliKelasInfo.nip})</span>
                )}
              </p>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Select Homeroom Class */}
            <div className="bg-indigo-950/70 border border-indigo-700 rounded-xl p-1.5 flex items-center space-x-2">
              <span className="text-[11px] font-bold text-indigo-200 pl-2">Kelas:</span>
              <select
                value={selectedClass}
                onChange={e => handleClassChange(e.target.value)}
                className="bg-indigo-800 text-white text-xs font-black rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                {classList.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="bg-indigo-950/70 border border-indigo-700 text-white text-xs font-extrabold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Pertemuan Terdata</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="TODAY">Hari Ini Sahaja</option>
            </select>

            {/* Export & Print */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel / CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 text-xs font-black rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-950" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Siswa */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa Binaan</p>
            <p className="text-xl font-black text-slate-900 leading-tight">{totalStudents} <span className="text-xs font-bold text-slate-500">Siswa</span></p>
          </div>
        </div>

        {/* Persentase Kehadiran Kelas */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
            classAttendancePercentage >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kehadiran Kelas</p>
            <p className={`text-xl font-black leading-tight ${
              classAttendancePercentage >= 90 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {classAttendancePercentage}%
            </p>
          </div>
        </div>

        {/* Total Sakit & Izin */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sakit / Izin</p>
            <p className="text-xl font-black text-slate-900 leading-tight">
              {totalClassS + totalClassI} <span className="text-xs font-bold text-slate-400">Jam</span>
            </p>
          </div>
        </div>

        {/* Total Alpa */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Alpa (A)</p>
            <p className="text-xl font-black text-rose-600 leading-tight">
              {totalClassA} <span className="text-xs font-bold text-rose-400">Jam</span>
            </p>
          </div>
        </div>

        {/* Siswa Perlu Perhatian */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Perlu Perhatian</p>
            <p className="text-xl font-black text-amber-900 leading-tight">
              {flaggedStudents.length} <span className="text-xs font-bold text-amber-700">Siswa</span>
            </p>
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSubTab('rekap')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'rekap'
                ? 'bg-indigo-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rekapitulasi Kehadiran Akumulatif</span>
          </button>

          <button
            onClick={() => setSubTab('harian')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'harian'
                ? 'bg-indigo-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Laporan Kehadiran Harian</span>
          </button>

          <button
            onClick={() => setSubTab('mapel')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'mapel'
                ? 'bg-indigo-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rincian Per Mata Pelajaran</span>
          </button>

          <button
            onClick={() => setSubTab('panggilan')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 relative ${
              subTab === 'panggilan'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Siswa Indikasi Bermasalah</span>
            {flaggedStudents.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {flaggedStudents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('pelanggaran')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 relative ${
              subTab === 'pelanggaran'
                ? 'bg-amber-500 text-indigo-950 font-black shadow-sm'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Notifikasi Pelanggaran Terbaru</span>
            {unhandledViolationsCount > 0 ? (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                {unhandledViolationsCount} Baru
              </span>
            ) : (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {classViolations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: REKAPITULASI AKUMULATIF */}
      {subTab === 'rekap' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          
          {/* Table Filters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa atau NISN..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter Status:</span>
              </span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Siswa ({studentStats.length})</option>
                <option value="ALPA">Pernah Alpa (&gt;0)</option>
                <option value="SAKIT_IZIN">Ada Sakit / Izin</option>
                <option value="LOW">Kehadiran &lt; 80%</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3 w-16 text-center">Absen</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-3 text-center w-12">L/P</th>
                  <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-800">Hadir</th>
                  <th className="py-3 px-3 text-center bg-amber-50 text-amber-800">Sakit</th>
                  <th className="py-3 px-3 text-center bg-blue-50 text-blue-800">Izin</th>
                  <th className="py-3 px-3 text-center bg-rose-50 text-rose-800">Alpa</th>
                  <th className="py-3 px-3 text-center">Total Jam</th>
                  <th className="py-3 px-4 text-center">% Kehadiran</th>
                  <th className="py-3 px-4 text-center">Evaluasi Wali Kelas</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs font-medium">
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      Tidak ada data siswa yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((st, idx) => {
                    const isHighRisk = st.countA > 2 || st.percentage < 75;
                    const isMediumRisk = st.countA > 0 || st.percentage < 85;

                    return (
                      <tr
                        key={st.student.id}
                        className={`hover:bg-indigo-50/40 transition ${
                          isHighRisk ? 'bg-rose-50/30' : isMediumRisk ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-center font-black text-slate-700 bg-slate-50/50">{st.student.rollNo}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{st.student.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NISN: {st.student.nisn || '-'}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-500">{st.student.gender || 'L'}</td>
                        <td className="py-3 px-3 text-center font-black text-emerald-700 bg-emerald-50/30">{st.countH}</td>
                        <td className="py-3 px-3 text-center font-extrabold text-amber-700 bg-amber-50/30">{st.countS}</td>
                        <td className="py-3 px-3 text-center font-extrabold text-blue-700 bg-blue-50/30">{st.countI}</td>
                        <td className="py-3 px-3 text-center font-black text-rose-700 bg-rose-50/40">
                          {st.countA > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-xs">
                              {st.countA}
                            </span>
                          ) : (
                            0
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600">{st.totalRecorded}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                              st.percentage >= 90
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.percentage >= 80
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {st.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isHighRisk ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-black bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Sangat Riskan (Butuh Ortud)</span>
                            </span>
                          ) : isMediumRisk ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              <span>Perlu Monitoring</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Disiplin / Baik</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedStudentDetail(st.student)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                            title="Lihat Detail Presensi Siswa"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN KEHADIRAN HARIAN */}
      {subTab === 'harian' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Monitoring Kehadiran Harian Per Tanggal</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Melihat rekap jam pelajaran yang diajar di Kelas {selectedClass} pada tanggal terpilih.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Pilih Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Daily Sessions Taught in Class */}
          {selectedDateSessions.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Belum Ada Sesi KBM Terdata di Tanggal Ini</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Silakan ganti tanggal atau pastikan guru mata pelajaran sudah mengisi presensi pada tanggal {selectedDate}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedDateSessions.map(sess => (
                  <div key={sess.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                        {sess.periodNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{sess.teacherName}</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{sess.subjectName}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">Materi: <em>"{sess.topic}"</em></p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Attendance Grid on this date */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-indigo-900 text-white font-bold text-[11px]">
                      <th className="p-2.5 text-center w-12">No</th>
                      <th className="p-2.5">Nama Siswa</th>
                      {selectedDateSessions.map(sess => (
                        <th key={sess.id} className="p-2.5 text-center">
                          <div>{sess.subjectName}</div>
                          <div className="text-[9px] text-indigo-200 font-mono">{sess.periodNumber}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {classStudents.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">{st.name}</td>
                        {selectedDateSessions.map(sess => {
                          const entry = sess.entries.find(e => e.studentId === st.id);
                          const stCode = entry ? entry.status : 'H';
                          
                          return (
                            <td key={sess.id} className="p-2.5 text-center">
                              <span className={`inline-block w-6 h-6 leading-6 text-center rounded font-black text-xs ${
                                stCode === 'H' ? 'bg-emerald-100 text-emerald-800' :
                                stCode === 'S' ? 'bg-amber-100 text-amber-800' :
                                stCode === 'I' ? 'bg-blue-100 text-blue-800' :
                                'bg-rose-100 text-rose-800 animate-pulse'
                              }`}>
                                {stCode}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RINCIAN PER MAPEL */}
      {subTab === 'mapel' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Analisis Kehadiran Siswa Per Mata Pelajaran</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Melihat performa kehadiran kelas binaan di setiap bidang studi untuk mengidentifikasi mapel yang sering ditinggalkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {subjects.map(subj => {
              const subjSessions = filteredSessions.filter(s => s.subjectId === subj.id);
              let hCount = 0;
              let sCount = 0;
              let iCount = 0;
              let aCount = 0;

              subjSessions.forEach(sess => {
                sess.entries.forEach(e => {
                  if (e.status === 'H') hCount++;
                  else if (e.status === 'S') sCount++;
                  else if (e.status === 'I') iCount++;
                  else if (e.status === 'A') aCount++;
                });
              });

              const totalSubjRec = hCount + sCount + iCount + aCount;
              const subjPct = totalSubjRec > 0 ? Math.round((hCount / totalSubjRec) * 100) : 100;

              return (
                <div key={subj.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                      {subj.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {subjSessions.length} Sesi Terdata
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">{subj.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] font-bold text-slate-500">Persentase Kehadiran:</span>
                      <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                        subjPct >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {subjPct}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Breakdown */}
                  <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-slate-200/60 text-[10px] font-bold">
                    <div className="bg-emerald-100/60 text-emerald-800 py-1 rounded">H: {hCount}</div>
                    <div className="bg-amber-100/60 text-amber-800 py-1 rounded">S: {sCount}</div>
                    <div className="bg-blue-100/60 text-blue-800 py-1 rounded">I: {iCount}</div>
                    <div className="bg-rose-100/60 text-rose-800 py-1 rounded">A: {aCount}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SISWA INDIKASI BERMASALAH & PANGGILAN ORANG TUA */}
      {subTab === 'panggilan' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-start space-x-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-sm text-rose-950">
                Daftar Siswa Indikasi Bermasalah & Konseling Wali Kelas
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Daftar siswa yang tercatat memiliki Alpa atau persentase kehadiran di bawah 80%. Wali kelas disarankan segera memberikan bimbingan atau menerbitkan surat panggilan orang tua.
              </p>
            </div>
          </div>

          {flaggedStudents.length === 0 ? (
            <div className="p-12 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-extrabold text-sm text-emerald-900">Alhamdulillah! Seluruh Siswa Disiplin</h4>
              <p className="text-xs text-emerald-700 mt-1">
                Tidak ada siswa yang tercatat memiliki Alpa atau kehadiran di bawah kriteria minimal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedStudents.map(st => (
                <div key={st.student.id} className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded">
                          Absen #{st.student.rollNo}
                        </span>
                        <span className="text-xs font-mono text-slate-400">NISN: {st.student.nisn || '-'}</span>
                      </div>
                      <h4 className="font-black text-sm text-slate-900 mt-1">{st.student.name}</h4>
                    </div>

                    <span className="bg-rose-100 text-rose-800 font-black text-xs px-2.5 py-1 rounded-full border border-rose-200">
                      {st.percentage}% Hadir
                    </span>
                  </div>

                  {/* Absence Metrics */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold py-2 bg-slate-50 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Hadir</span>
                      <span className="text-emerald-700 font-black">{st.countH}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sakit</span>
                      <span className="text-amber-700 font-bold">{st.countS}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Izin</span>
                      <span className="text-blue-700 font-bold">{st.countI}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Alpa</span>
                      <span className="text-rose-700 font-black bg-rose-100 px-1.5 rounded">{st.countA}</span>
                    </div>
                  </div>

                  {/* Absence Days & Dates Detail Section */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-800 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rincian Hari & Tanggal Ketidakhadiran:</span>
                      </span>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        {st.absenceLogs.length} Catatan
                      </span>
                    </div>

                    {st.absenceLogs.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Tidak ada rincian catatan Sakit, Izin, atau Alpa.</p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {st.absenceLogs.map((log, idx) => {
                          const badgeStyle =
                            log.status === 'A'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : log.status === 'S'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300';

                          const statusLabel =
                            log.status === 'A' ? 'Alpa (A)' : log.status === 'S' ? 'Sakit (S)' : 'Izin (I)';

                          return (
                            <div
                              key={`${log.id}-${idx}`}
                              className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-[11px] gap-1 shadow-2xs"
                            >
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${badgeStyle}`}>
                                  {statusLabel}
                                </span>
                                <span className="font-bold text-slate-900">
                                  {log.dayName}, {log.formattedDate}
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold text-slate-500">
                                <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded mr-1">
                                  {log.subjectName}
                                </span>
                                <span>({log.periodNumber})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        const alpaList = st.absenceLogs
                          .filter(l => l.status === 'A')
                          .map(l => `${l.dayName} (${l.formattedDate})`)
                          .slice(0, 3)
                          .join(', ');
                        const alpaInfo = alpaList ? ` pada hari: ${alpaList}` : '';
                        const message = `Assalamu'alaikum Wr. Wb. Bapak/Ibu Wali Murid dari ${st.student.name} (Kelas ${selectedClass}). Kami dari Wali Kelas MTs Manba'ul Islam memohon waktu untuk mengonfirmasi kehadiran ananda yang tercatat memiliki ${st.countA} kali Alpa${alpaInfo}. Mohon hubungi Wali Kelas. Terima kasih.`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Hubungi Orang Tua (WA)</span>
                    </button>

                    <button
                      onClick={() => setSelectedStudentDetail(st.student)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Rincian
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                  Detail Presensi Siswa
                </span>
                <h3 className="font-black text-base text-slate-900 mt-1">{selectedStudentDetail.name}</h3>
                <p className="text-xs text-slate-500">Kelas {selectedClass} • Absen #{selectedStudentDetail.rollNo}</p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Attendance Breakdowns */}
            {(() => {
              const st = studentStats.find(s => s.student.id === selectedStudentDetail.id);
              if (!st) return null;

              return (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-center font-bold p-3 bg-slate-50 rounded-xl">
                    <div className="bg-emerald-100/80 text-emerald-900 p-2 rounded-lg">
                      <div className="text-[10px]">Hadir</div>
                      <div className="text-base font-black">{st.countH}</div>
                    </div>
                    <div className="bg-amber-100/80 text-amber-900 p-2 rounded-lg">
                      <div className="text-[10px]">Sakit</div>
                      <div className="text-base font-black">{st.countS}</div>
                    </div>
                    <div className="bg-blue-100/80 text-blue-900 p-2 rounded-lg">
                      <div className="text-[10px]">Izin</div>
                      <div className="text-base font-black">{st.countI}</div>
                    </div>
                    <div className="bg-rose-100/80 text-rose-900 p-2 rounded-lg">
                      <div className="text-[10px]">Alpa</div>
                      <div className="text-base font-black">{st.countA}</div>
                    </div>
                  </div>

                  {/* Detailed Absence Dates Log */}
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Riwayat Hari & Tanggal Ketidakhadiran (S/I/A):</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                        {st.absenceLogs.length} Catatan
                      </span>
                    </h4>
                    {st.absenceLogs.length === 0 ? (
                      <div className="p-3 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 font-bold text-center">
                        Siswa selalu hadir (Hadir 100% di semua sesi terdata).
                      </div>
                    ) : (
                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                        {st.absenceLogs.map((log, idx) => {
                          const badgeStyle =
                            log.status === 'A'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : log.status === 'S'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300';

                          const statusLabel =
                            log.status === 'A' ? 'Alpa' : log.status === 'S' ? 'Sakit' : 'Izin';

                          return (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl text-[11px] border border-slate-200/80 flex items-start justify-between">
                              <div className="flex items-start space-x-2">
                                <span className={`px-2 py-0.5 rounded font-black text-[10px] border mt-0.5 ${badgeStyle}`}>
                                  {statusLabel}
                                </span>
                                <div>
                                  <div className="font-black text-slate-900">{log.dayName}, {log.formattedDate}</div>
                                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    <span className="font-bold text-slate-700">{log.subjectName}</span> • {log.periodNumber} • Guru: {log.teacherName}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-800 text-xs">Rincian Per Mata Pelajaran:</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {Object.values(st.subjectBreakdown as Record<string, { name: string; H: number; S: number; I: number; A: number }>).map((sb, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[11px]">
                          <span className="font-bold text-slate-800">{sb.name}</span>
                          <div className="flex space-x-1.5 font-extrabold">
                            <span className="text-emerald-700">H: {sb.H}</span>
                            <span className="text-amber-700">S: {sb.S}</span>
                            <span className="text-blue-700">I: {sb.I}</span>
                            <span className="text-rose-700">A: {sb.A}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-indigo-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFIKASI PELANGGARAN TERBARU (BK & KESISWAAN) */}
      {subTab === 'pelanggaran' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-start justify-between bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-sm text-amber-950">
                  Daftar Pelanggaran Siswa Terbaru (Real-Time BK/Kesiswaan)
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Menampilkan laporan kedisiplinan terbaru untuk siswa Kelas {selectedClass}. Wali kelas dapat menandai catatan sebagai "Telah Ditangani".
                </p>
              </div>
            </div>

            {unhandledViolationsCount > 0 && (
              <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse shrink-0">
                {unhandledViolationsCount} Perlu Ditangani
              </span>
            )}
          </div>

          {classViolations.length === 0 ? (
            <div className="p-12 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-extrabold text-sm text-emerald-900">Alhamdulillah! Tidak Ada Catatan Pelanggaran</h4>
              <p className="text-xs text-emerald-700 mt-1">
                Siswa Kelas {selectedClass} belum pernah tercatat melakukan pelanggaran disiplin oleh BK / Kesiswaan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {classViolations.map(v => {
                const isHandled = v.status === 'Telah Ditangani' || v.handledByWaliKelas;
                
                const categoryBadge =
                  v.category === 'Apresiasi' || v.points < 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : v.category === 'Berat'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : v.category === 'Sedang'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300';

                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isHandled
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-amber-300 shadow-sm ring-1 ring-amber-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-900 text-white font-black text-[10px] px-2 py-0.5 rounded">
                            Kelas {v.className}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{v.date}</span>
                        </div>
                        <h4 className={`font-black text-sm mt-1 ${v.category === 'Apresiasi' || v.points < 0 ? 'text-emerald-800' : 'text-slate-900'}`}>{v.studentName}</h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${categoryBadge}`}>
                          {v.points < 0 ? `${v.points} Poin` : `+${v.points} Poin`} ({v.category})
                        </span>

                        {isHandled ? (
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Telah Ditangani Wali Kelas</span>
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 font-black text-[10px] px-2.5 py-1 rounded-full animate-pulse">
                            Belum Ditangani
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-rose-700">{v.violationType}</p>
                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 italic">
                        "{v.description}"
                      </p>
                    </div>

                    {v.followUpNote && (
                      <div className="text-xs text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                        <strong className="font-bold text-emerald-950 block text-[11px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Keterangan Penanganan / Tindak Lanjut Wali Kelas:</span>
                        </strong>
                        <span className="mt-1 block font-medium text-slate-800">{v.followUpNote}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Pelapor: <strong className="text-slate-700">{v.reporterName}</strong></span>

                      {onToggleViolationHandled && (
                        <div className="flex items-center space-x-2">
                          {isHandled ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setHandlingViolationModal(v);
                                  setHandlingNote(v.followUpNote || '');
                                }}
                                className="px-2.5 py-1.5 rounded-xl font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 text-[11px] transition cursor-pointer"
                              >
                                Edit Catatan
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleViolationHandled(v.id, '');
                                }}
                                className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 text-[11px] transition cursor-pointer"
                              >
                                Tandai Belum Ditangani
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setHandlingViolationModal(v);
                                setHandlingNote(v.followUpNote || '');
                              }}
                              className="px-3.5 py-1.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tandai Telah Ditangani</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL KETERANGAN PENANGANAN PELANGGARAN OLEH WALI KELAS */}
      {handlingViolationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Keterangan Penanganan Wali Kelas</h3>
                  <p className="text-xs text-slate-500">Isi catatan tindak lanjut sebelum menandai pelanggaran telah ditangani</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHandlingViolationModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail Pelanggaran Siswa */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-slate-900">{handlingViolationModal.studentName}</span>
                <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                  +{handlingViolationModal.points} Poin ({handlingViolationModal.category})
                </span>
              </div>
              <p className="text-xs font-bold text-rose-700">{handlingViolationModal.violationType}</p>
              <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                "{handlingViolationModal.description}"
              </p>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Tanggal: {handlingViolationModal.date}</span>
                <span>Pelapor: {handlingViolationModal.reporterName}</span>
              </div>
            </div>

            {/* Textarea Catatan Penanganan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Keterangan Penanganan / Tindak Lanjut Wali Kelas <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={handlingNote}
                onChange={(e) => setHandlingNote(e.target.value)}
                placeholder="Tuliskan keterangan penanganan (contoh: Siswa telah dipanggil ke ruang Wali Kelas, diberikan nasihat, dan orang tua sudah dihubungi)..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm"
              />

              {/* Quick Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Pilih Keterangan Cepat (Klik untuk memilih):</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Siswa telah dipanggil ke ruang Wali Kelas & diberikan nasihat.",
                    "Sudah dikonfirmasi & dikomunikasikan ke Orang Tua/Wali murid.",
                    "Siswa berjanji tidak mengulangi & diberikan tugas pembinaan.",
                    "Telah dikoordinasikan dengan Tim BK/BP Sekolah."
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHandlingNote(preset)}
                      className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200 transition text-left cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHandlingViolationModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onToggleViolationHandled) {
                    await onToggleViolationHandled(
                      handlingViolationModal.id,
                      handlingNote.trim() || 'Telah ditangani oleh Wali Kelas'
                    );
                  }
                  setHandlingViolationModal(null);
                }}
                className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Tandai Telah Ditangani</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINTABLE DOCUMENT FOR WALI KELAS REPORT */}
      <div className="hidden">
        <div id="printable-walikelas-doc" className="p-8 bg-white font-sans text-slate-900 text-xs leading-relaxed max-w-4xl mx-auto">
          {/* KOP MADRASAH */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <h1 className="text-lg font-black uppercase tracking-wider text-slate-900">
              YAYASAN PENDIDIKAN ISLAM MANBA'UL ISLAM
            </h1>
            <h2 className="text-base font-bold uppercase text-slate-800">
              MADRASAH TSANAWIYAH (MTS) MANBA'UL ISLAM
            </h2>
            <p className="text-[10px] italic text-slate-600">
              Jl. Kh. Ageshim No. 12, Jawa Timur • Email: mts.manbaulislam@gmail.com
            </p>
          </div>

          <div className="text-center mb-5">
            <h3 className="text-sm font-black uppercase underline">
              LAPORAN KEHADIRAN SISWA OLEH WALI KELAS
            </h3>
            <p className="text-[11px] font-bold text-slate-700 mt-0.5">
              Kelas {selectedClass} • {academicYear} ({semester})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <p><strong>Wali Kelas:</strong> {waliKelasInfo.name}</p>
              <p><strong>NIP:</strong> {waliKelasInfo.nip || '-'}</p>
            </div>
            <div>
              <p><strong>Total Siswa:</strong> {totalStudents} Orang</p>
              <p><strong>Rata-rata Kehadiran:</strong> {classAttendancePercentage}%</p>
            </div>
          </div>

          {/* TABLE PRINT */}
          <table className="w-full border-collapse border border-slate-900 text-[10px]">
            <thead>
              <tr className="bg-slate-200 font-bold text-center">
                <th className="border border-slate-900 p-1.5 w-8">No</th>
                <th className="border border-slate-900 p-1.5 w-10">Absen</th>
                <th className="border border-slate-900 p-1.5 text-left">Nama Siswa</th>
                <th className="border border-slate-900 p-1.5 w-8">L/P</th>
                <th className="border border-slate-900 p-1.5 w-10">Hadir</th>
                <th className="border border-slate-900 p-1.5 w-10">Sakit</th>
                <th className="border border-slate-900 p-1.5 w-10">Izin</th>
                <th className="border border-slate-900 p-1.5 w-10">Alpa</th>
                <th className="border border-slate-900 p-1.5 w-14">% Hadir</th>
                <th className="border border-slate-900 p-1.5 text-left">Catatan Wali Kelas</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map((st, idx) => (
                <tr key={st.student.id} className="text-center">
                  <td className="border border-slate-900 p-1">{idx + 1}</td>
                  <td className="border border-slate-900 p-1 font-bold">{st.student.rollNo}</td>
                  <td className="border border-slate-900 p-1 text-left font-bold">{st.student.name}</td>
                  <td className="border border-slate-900 p-1">{st.student.gender || 'L'}</td>
                  <td className="border border-slate-900 p-1">{st.countH}</td>
                  <td className="border border-slate-900 p-1">{st.countS}</td>
                  <td className="border border-slate-900 p-1">{st.countI}</td>
                  <td className="border border-slate-900 p-1 font-bold text-rose-700">{st.countA}</td>
                  <td className="border border-slate-900 p-1 font-bold">{st.percentage}%</td>
                  <td className="border border-slate-900 p-1 text-left">
                    {st.countA > 2 ? 'Perlu Panggilan Ortud' : st.countA > 0 ? 'Pernah Alpa' : 'Baik / Disiplin'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SIGNATURES */}
          <div className="grid grid-cols-2 gap-8 text-center mt-10 text-[11px] font-bold">
            <div>
              <p>Mengetahui,</p>
              <p>Kepala MTs Manba'ul Islam</p>
              <div className="h-16"></div>
              <p className="underline uppercase">( {schoolOfficials?.kepalaSekolah.name || 'Dra. Hj. Nurjanah, M.Pd'} )</p>
              <p className="font-normal">NIP. {schoolOfficials?.kepalaSekolah.nip || '197208151998032001'}</p>
            </div>
            <div>
              <p>Gresik, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p>Wali Kelas {selectedClass}</p>
              <div className="h-16"></div>
              <p className="underline uppercase">( {waliKelasInfo.name} )</p>
              <p className="font-normal">NIP. {waliKelasInfo.nip || '-'}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

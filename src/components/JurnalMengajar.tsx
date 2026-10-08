import React, { useState, useMemo } from 'react';
import { AttendanceSession, Student, Teacher, Subject, StudentViolation, PaymentTransaction, SchoolOfficials } from '../types';
import {
  BookMarked,
  Search,
  Calendar,
  Clock,
  UserCheck,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  User,
  BookOpen,
  FilterX,
  RefreshCw
} from 'lucide-react';
import { printFormattedDocument, exportAttendanceSessionCSV } from '../utils/export';
import { buildHistoricalStudentDictionary, resolveStudentNameFromEntry } from '../utils/studentMatcher';
import { getStoredSchoolOfficials } from '../utils/storage';

interface JurnalMengajarProps {
  sessions: AttendanceSession[];
  students: Student[];
  teachers?: Teacher[];
  activeTeacher?: Teacher | null;
  subjects?: Subject[];
  violations?: StudentViolation[];
  payments?: PaymentTransaction[];
  schoolOfficials?: SchoolOfficials;
  onDeleteSession: (sessionId: string) => void;
  onSelectClass: (className: string) => void;
  onResyncAttendance?: () => { updatedCount: number; totalSessions: number };
  isOnline?: boolean;
  offlineQueueCount?: number;
  onSyncOfflineQueue?: () => void;
  isSyncingOfflineQueue?: boolean;
}

export const JurnalMengajar: React.FC<JurnalMengajarProps> = ({
  sessions,
  students,
  teachers = [],
  activeTeacher,
  subjects = [],
  violations = [],
  payments = [],
  schoolOfficials: propSchoolOfficials,
  onDeleteSession,
  onSelectClass,
  onResyncAttendance,
  isOnline = true,
  offlineQueueCount = 0,
  onSyncOfflineQueue,
  isSyncingOfflineQueue = false
}) => {
  const schoolOfficials = propSchoolOfficials || getStoredSchoolOfficials();
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(getTodayString());
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>(() => activeTeacher?.name || 'ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync with active teacher when changed from global top selector
  React.useEffect(() => {
    if (activeTeacher?.name) {
      setSelectedTeacherFilter(activeTeacher.name);
    }
  }, [activeTeacher?.name]);

  const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));

  // Build dictionary to resolve old student IDs with current roster
  const studentDict = useMemo(() => {
    return buildHistoricalStudentDictionary(students, violations, payments);
  }, [students, violations, payments]);

  const handleManualResync = () => {
    if (!onResyncAttendance) return;
    setIsSyncing(true);
    try {
      const result = onResyncAttendance();
      setSyncStatusMessage(`Berhasil menyinkronkan data presensi! ${result.updatedCount} dari ${result.totalSessions} sesi berhasil dihubungkan ulang dengan data siswa.`);
      setTimeout(() => {
        setSyncStatusMessage(null);
      }, 6000);
    } catch (err) {
      console.error(err);
      setSyncStatusMessage('Sinkronisasi selesai.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate unique list of teacher names for filter dropdown
  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach(t => t.name && set.add(t.name));
    sessions.forEach(s => s.teacherName && set.add(s.teacherName));
    return Array.from(set).sort();
  }, [teachers, sessions]);

  // Generate unique list of subject names for filter dropdown
  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach(sub => sub.name && set.add(sub.name));
    sessions.forEach(s => s.subjectName && set.add(s.subjectName));
    return Array.from(set).sort();
  }, [subjects, sessions]);

  // Filtered Sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      session.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClassFilter === 'ALL' || session.className === selectedClassFilter;
    const matchesTeacher = selectedTeacherFilter === 'ALL' || session.teacherName === selectedTeacherFilter;
    const matchesSubject = selectedSubjectFilter === 'ALL' || session.subjectName === selectedSubjectFilter;
    const matchesDate = !selectedDateFilter || session.date === selectedDateFilter;

    return matchesSearch && matchesClass && matchesTeacher && matchesSubject && matchesDate;
  });

  const isAnyFilterActive =
    selectedClassFilter !== 'ALL' ||
    selectedTeacherFilter !== 'ALL' ||
    selectedSubjectFilter !== 'ALL' ||
    searchQuery !== '' ||
    selectedDateFilter !== getTodayString();

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDateFilter(getTodayString());
    setSelectedClassFilter('ALL');
    setSelectedTeacherFilter('ALL');
    setSelectedSubjectFilter('ALL');
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const handlePrintJournal = (session: AttendanceSession) => {
    printFormattedDocument(`printable-journal-${session.id}`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#073619] via-[#0d5026] to-[#15803d] rounded-xl p-5 text-white shadow-xs border border-emerald-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1">
              <BookMarked className="w-3.5 h-3.5 text-emerald-300" />
              <span>Agenda Harian & Rekam Jejak KBM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              Jurnal Mengajar Guru {schoolOfficials?.namaSekolah || 'Madrasah'}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Dokumentasi pelaksanaan kegiatan belajar mengajar, topik materi, dan tingkat presensi siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onResyncAttendance && (
              <button
                type="button"
                onClick={handleManualResync}
                disabled={isSyncing}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                title="Hubungkan kembali catatan absensi dengan data siswa saat ini berdasarkan nama"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Presensi'}</span>
              </button>
            )}

            <div className="bg-emerald-950/80 border border-emerald-800/80 p-2.5 rounded-lg text-right">
              <span className="text-[9px] text-emerald-300 uppercase font-bold block leading-none">Jurnal Hari Ini</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">
                {sessions.filter(s => s.date === getTodayString()).length} Sesi
              </span>
            </div>
            <div className="bg-indigo-950/80 border border-indigo-800 p-2.5 rounded-lg text-right">
              <span className="text-[9px] text-indigo-300 uppercase font-bold block leading-none">Total Jurnal</span>
              <span className="text-xl font-black text-white mt-1 block">{sessions.length} Sesi</span>
            </div>
          </div>
        </div>

        {/* Sync Status Alert Banner */}
        {syncStatusMessage && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-lg text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatusMessage}</span>
            </div>
            <button
              onClick={() => setSyncStatusMessage(null)}
              className="text-emerald-400 hover:text-white text-[11px] font-bold underline ml-3 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Offline Queue Notice & Sync Banner */}
        {offlineQueueCount > 0 && (
          <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span className="text-xs font-bold">
                Terdapat <strong>{offlineQueueCount} data presensi</strong> yang diisi saat offline dan menunggu sinkronisasi ke Database Cloud.
              </span>
            </div>
            {isOnline && onSyncOfflineQueue && (
              <button
                type="button"
                onClick={onSyncOfflineQueue}
                disabled={isSyncingOfflineQueue}
                className="px-3.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer shrink-0 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOfflineQueue ? 'animate-spin' : ''}`} />
                <span>{isSyncingOfflineQueue ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari materi, nama guru, kelas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filter Select Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Filter Tanggal */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-bold text-[10px] uppercase text-slate-400">Tanggal:</span>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={e => setSelectedDateFilter(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 text-xs focus:outline-none cursor-pointer"
              />
              {selectedDateFilter ? (
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('')}
                  className="text-[10px] text-slate-500 hover:text-slate-800 font-bold px-1 bg-slate-200/60 rounded"
                  title="Tampilkan Semua Tanggal"
                >
                  Semua
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter(getTodayString())}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold px-1 bg-indigo-100 rounded"
                  title="Set ke Hari Ini"
                >
                  Hari Ini
                </button>
              )}
            </div>

            {/* Filter Guru */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-bold text-[10px] uppercase text-slate-400">Guru:</span>
              <select
                value={selectedTeacherFilter}
                onChange={e => setSelectedTeacherFilter(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 text-xs focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL">Semua Guru</option>
                {teacherOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Filter Mapel */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-bold text-[10px] uppercase text-slate-400">Mapel:</span>
              <select
                value={selectedSubjectFilter}
                onChange={e => setSelectedSubjectFilter(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 text-xs focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL">Semua Mapel</option>
                {subjectOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Filter Kelas */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span className="font-bold text-[10px] uppercase text-slate-400">Kelas:</span>
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {['VII A', 'VII B', 'VII C', 'VII D', 'VII E', 'VIII A', 'VIII B', 'VIII C', 'VIII D', 'VIII E', 'IX A', 'IX B', 'IX C', 'IX D', 'IX E', 'IX F'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Reset Button if filter active */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session Cards Timeline */}
      <div className="space-y-4">
        {filteredSessions.map((session) => {
          const isExpanded = expandedSessionId === session.id;

          // Stats calculation
          const totalInEntries = session.entries.length;
          const hadirCount = session.entries.filter(e => e.status === 'H').length;
          const izinCount = session.entries.filter(e => e.status === 'I').length;
          const sakitCount = session.entries.filter(e => e.status === 'S').length;
          const alpaCount = session.entries.filter(e => e.status === 'A').length;
          const percent = totalInEntries > 0 ? Math.round((hadirCount / totalInEntries) * 100) : 0;

          return (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-300 transition overflow-hidden"
            >
              {/* Card Summary Header */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-[10px] text-emerald-600 uppercase">Kelas</span>
                    <span className="text-sm">{session.className}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs bg-emerald-800 text-amber-200 font-bold px-2.5 py-0.5 rounded-md">
                        {session.subjectName}
                      </span>
                      <span className="text-xs text-gray-500 font-medium flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{session.date}</span>
                      </span>
                      <span className="text-xs text-gray-500 font-medium flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pertemuan Ke-{session.meetingNumber} ({session.periodNumber})</span>
                      </span>

                      {session.isSyncedToCloud === false ? (
                        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-black px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-2xs" title="Data tersimpan di perangkat (Mode Offline), belum diunggah ke database cloud">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Disimpan Lokal (Offline)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-2xs" title="Tersimpan aman di Database Cloud">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Cloud</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-base">
                      {session.topic}
                    </h3>

                    <p className="text-xs text-gray-600 mt-0.5 flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Guru: <strong>{session.teacherName}</strong> (NIP: {session.teacherNip})</span>
                    </p>
                  </div>
                </div>

                {/* Right Badges & Controls */}
                <div className="flex items-center space-x-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-medium block">Kehadiran</span>
                    <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                      percent >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {percent}% ({hadirCount}/{totalInEntries})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePrintJournal(session)}
                      className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                      title="Cetak Jurnal"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => exportAttendanceSessionCSV(session, studentsMap)}
                      className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                      title="Unduh CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onDeleteSession(session.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleExpand(session.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center space-x-1 border border-emerald-200"
                    >
                      <span>{isExpanded ? 'Sembunyikan' : 'Rincian'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Expanded Session Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50/60 p-5 space-y-4 animate-in fade-in duration-200">
                  
                  {/* Detailed Stats Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg">
                      Hadir: {hadirCount} Siswa
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                      Izin: {izinCount} Siswa
                    </span>
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg">
                      Sakit: {sakitCount} Siswa
                    </span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg">
                      Alpa: {alpaCount} Siswa
                    </span>
                  </div>

                  {session.competency && (
                    <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs">
                      <span className="font-bold text-gray-800 block mb-1">Tujuan Pembelajaran (TP):</span>
                      <p className="text-gray-700">{session.competency}</p>
                    </div>
                  )}

                  {session.teachingNotes && (
                    <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-1">Catatan Refleksi KBM:</span>
                      <p className="text-amber-800">{session.teachingNotes}</p>
                    </div>
                  )}

                  {/* Student Presence Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-800 text-white font-bold text-[11px] uppercase">
                          <th className="p-2.5 text-center w-10">No</th>
                          <th className="p-2.5">Nama Siswa</th>
                          <th className="p-2.5 text-center w-24">Status</th>
                          <th className="p-2.5">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {session.entries.map((entry, idx) => {
                          const resolvedName = resolveStudentNameFromEntry(entry, studentDict);
                          return (
                            <tr key={entry.studentId || idx} className="hover:bg-gray-50">
                              <td className="p-2 text-center text-gray-500 font-medium">{idx + 1}</td>
                              <td className="p-2 font-bold text-gray-800">{resolvedName}</td>
                              <td className="p-2 text-center font-bold">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  entry.status === 'H' ? 'bg-emerald-100 text-emerald-800' :
                                  entry.status === 'I' ? 'bg-blue-100 text-blue-800' :
                                  entry.status === 'S' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {entry.status === 'H' ? 'Hadir' : entry.status === 'I' ? 'Izin' : entry.status === 'S' ? 'Sakit' : 'Alpa'}
                                </span>
                              </td>
                              <td className="p-2 text-gray-600">{entry.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Hidden Printable Document for this session */}
                  <div className="hidden">
                    <div id={`printable-journal-${session.id}`} className="text-black font-serif">
                      <div className="text-center border-b-2 border-black pb-3 mb-4">
                        <h2 className="text-lg font-bold uppercase">YAYASAN MANBAUL ISLAM</h2>
                        <h1 className="text-xl font-black uppercase text-emerald-900">MTS MANBAUL ISLAM</h1>
                        <p className="text-xs italic">AGENDA HARIAN & JURNAL MENGAJAR GURU</p>
                      </div>

                      <div className="grid grid-cols-2 text-xs mb-4">
                        <div>
                          <p><strong>Mata Pelajaran:</strong> {session.subjectName}</p>
                          <p><strong>Kelas:</strong> {session.className}</p>
                          <p><strong>Hari / Tanggal:</strong> {session.date}</p>
                        </div>
                        <div>
                          <p><strong>Guru Pengajar:</strong> {session.teacherName}</p>
                          <p><strong>NIP:</strong> {session.teacherNip}</p>
                          <p><strong>Pertemuan Ke:</strong> {session.meetingNumber} ({session.periodNumber})</p>
                        </div>
                      </div>

                      <div className="border border-black p-2 text-xs mb-4">
                        <p><strong>Topik / Materi Pembelajaran:</strong> {session.topic}</p>
                        {session.competency && <p><strong>Tujuan Pembelajaran:</strong> {session.competency}</p>}
                        <p><strong>Refleksi/Catatan:</strong> {session.teachingNotes || 'KBM Berjalan Lancar'}</p>
                      </div>

                      <div className="text-xs mb-4">
                        <p className="font-bold mb-1">Ringkasan Presensi Siswa:</p>
                        <p>Total Siswa: {totalInEntries} | Hadir: {hadirCount} | Izin: {izinCount} | Sakit: {sakitCount} | Alpa: {alpaCount}</p>
                      </div>

                      <div className="grid grid-cols-2 text-center text-xs mt-10">
                        <div>
                          <p className="mb-14">Mengetahui,<br />Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
                          <p className="font-bold underline">{schoolOfficials?.kepalaSekolah?.name || 'Kepala Madrasah'}</p>
                          <p>NIP. {schoolOfficials?.kepalaSekolah?.nip || '-'}</p>
                        </div>
                        <div>
                          <p className="mb-14">Guru Mata Pelajaran</p>
                          <p className="font-bold underline">{session.teacherName}</p>
                          <p>NIP. {session.teacherNip}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-2xs">
            <AlertCircle className="w-10 h-10 text-indigo-600 mx-auto mb-2.5" />
            <h3 className="text-base font-black text-slate-800">
              {isAnyFilterActive ? 'Tidak Ada Jurnal yang Sesuai Filter' : 'Belum Ada Jurnal Mengajar'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {isAnyFilterActive ? (
                <span>
                  Tidak ditemukan data jurnal untuk filter yang dipilih
                  {selectedTeacherFilter !== 'ALL' && <> (Guru: <strong>{selectedTeacherFilter}</strong>)</>}
                  {selectedDateFilter && <> pada tanggal <strong>{selectedDateFilter}</strong></>}.
                </span>
              ) : (
                <span>
                  Silakan lakukan presensi di menu <strong>Absensi Mengajar</strong> dan simpan untuk mencatat jurnal KBM secara otomatis.
                </span>
              )}
            </p>
            {isAnyFilterActive && (
              <div className="flex items-center justify-center gap-2">
                {selectedDateFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedDateFilter('')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition"
                  >
                    Lihat Semua Riwayat Tanggal
                  </button>
                )}
                {selectedTeacherFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedTeacherFilter('ALL')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition"
                  >
                    Lihat Semua Guru
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Subject, Student, AttendanceSession, SchoolOfficials, TeachingSchedule, StudentViolation, PaymentTransaction } from '../types';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  Users,
  BookOpen,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  Search,
  Sparkles,
  GraduationCap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { exportToCSV, printFormattedDocument } from '../utils/export';
import { buildHistoricalStudentDictionary, findMatchingEntryForStudent } from '../utils/studentMatcher';

interface RekapLaporanProps {
  activeTeacher: Teacher;
  activeSubject: Subject;
  activeClass: string;
  classList: string[];
  teachers?: Teacher[];
  subjects?: Subject[];
  schedules?: TeachingSchedule[];
  students: Student[];
  sessions: AttendanceSession[];
  schoolOfficials?: SchoolOfficials;
  violations?: StudentViolation[];
  payments?: PaymentTransaction[];
  onResyncAttendance?: () => { updatedCount: number; totalSessions: number };
}

export const RekapLaporan: React.FC<RekapLaporanProps> = ({
  activeTeacher,
  activeSubject,
  activeClass,
  classList,
  teachers = [],
  subjects = [],
  schedules = [],
  students,
  sessions,
  schoolOfficials,
  violations = [],
  payments = [],
  onResyncAttendance
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(activeClass);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => activeTeacher?.id || 'ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<'presensi' | 'materi'>('presensi');
  const [searchMaterial, setSearchMaterial] = useState<string>('');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync selected teacher when activeTeacher prop changes
  useEffect(() => {
    if (activeTeacher?.id) {
      setSelectedTeacherId(activeTeacher.id);
    }
  }, [activeTeacher?.id]);

  // Find currently selected teacher object
  const currentTeacherObj = teachers.find(t => t.id === selectedTeacherId) || (selectedTeacherId === activeTeacher?.id ? activeTeacher : undefined);

  // Compute subjects taught by the selected teacher (Beban Mengajar)
  const availableSubjects = useMemo(() => {
    if (selectedTeacherId === 'ALL') {
      return subjects;
    }

    const taughtSubjectMap = new Map<string, Subject>();
    const teacherNameLower = currentTeacherObj?.name.toLowerCase().trim();
    const teacherNip = currentTeacherObj?.nip && currentTeacherObj.nip !== '-' ? currentTeacherObj.nip.trim() : null;

    // 1. Check from Teaching Schedules
    schedules.forEach(sch => {
      const matchId = sch.teacherId === selectedTeacherId;
      const matchName = teacherNameLower && sch.teacherName.toLowerCase().trim() === teacherNameLower;
      const matchNip = teacherNip && sch.teacherNip === teacherNip;

      if (matchId || matchName || matchNip) {
        const found = subjects.find(s => s.id === sch.subjectId || s.name.toLowerCase().trim() === sch.subjectName.toLowerCase().trim());
        if (found) {
          taughtSubjectMap.set(found.id, found);
        } else if (sch.subjectId && sch.subjectName) {
          taughtSubjectMap.set(sch.subjectId, {
            id: sch.subjectId,
            name: sch.subjectName,
            code: sch.subjectCode || sch.subjectName.substring(0, 4).toUpperCase()
          });
        }
      }
    });

    // 2. Check from recorded Attendance Sessions
    sessions.forEach(sess => {
      const matchId = sess.teacherId === selectedTeacherId;
      const matchName = teacherNameLower && sess.teacherName.toLowerCase().trim() === teacherNameLower;

      if (matchId || matchName) {
        const found = subjects.find(s => s.id === sess.subjectId || s.name.toLowerCase().trim() === sess.subjectName.toLowerCase().trim());
        if (found) {
          taughtSubjectMap.set(found.id, found);
        } else if (sess.subjectId && sess.subjectName) {
          taughtSubjectMap.set(sess.subjectId, {
            id: sess.subjectId,
            name: sess.subjectName,
            code: sess.subjectName.substring(0, 4).toUpperCase()
          });
        }
      }
    });

    const result = Array.from(taughtSubjectMap.values());
    // If no specific schedule/session found yet for this teacher, fallback to all subjects
    return result.length > 0 ? result : subjects;
  }, [selectedTeacherId, currentTeacherObj, schedules, sessions, subjects]);

  // If selectedSubjectId is not in availableSubjects, reset to 'ALL'
  useEffect(() => {
    if (selectedSubjectId !== 'ALL' && !availableSubjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId('ALL');
    }
  }, [availableSubjects, selectedSubjectId]);

  const classStudents = students.filter(s => s.className === selectedClass);
  
  // Filter sessions matching selected class, teacher, and subject
  const relevantSessions = sessions
    .filter(s => {
      const matchClass = s.className === selectedClass;
      const matchTeacher = selectedTeacherId === 'ALL' || 
        s.teacherId === selectedTeacherId || 
        (currentTeacherObj && s.teacherName.toLowerCase().trim() === currentTeacherObj.name.toLowerCase().trim());
      
      const currentSub = subjects.find(sub => sub.id === selectedSubjectId);
      const matchSubject = selectedSubjectId === 'ALL' || 
        s.subjectId === selectedSubjectId || 
        (currentSub && s.subjectName.toLowerCase().trim() === currentSub.name.toLowerCase().trim());
      
      return matchClass && matchTeacher && matchSubject;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.meetingNumber - a.meetingNumber);

  // Build lookup dictionary to bridge old student IDs with current student roster
  const studentDict = useMemo(() => {
    return buildHistoricalStudentDictionary(students, violations, payments);
  }, [students, violations, payments]);

  // Compute student summary statistics with smart name-matching fallback
  const studentStats = useMemo(() => {
    return classStudents.map(student => {
      let countH = 0;
      let countI = 0;
      let countS = 0;
      let countA = 0;

      relevantSessions.forEach(session => {
        const entry = findMatchingEntryForStudent(session.entries, student, studentDict);
        if (entry) {
          if (entry.status === 'H') countH++;
          else if (entry.status === 'I') countI++;
          else if (entry.status === 'S') countS++;
          else if (entry.status === 'A') countA++;
        }
      });

      const totalRecorded = countH + countI + countS + countA;
      const percentage = totalRecorded > 0 ? Math.round((countH / totalRecorded) * 100) : 100;

      return {
        student,
        countH,
        countI,
        countS,
        countA,
        totalRecorded,
        percentage
      };
    });
  }, [classStudents, relevantSessions, studentDict]);

  // Overall Class Attendance Percentage
  const totalClassH = studentStats.reduce((acc, curr) => acc + curr.countH, 0);
  const totalClassRec = studentStats.reduce((acc, curr) => acc + curr.totalRecorded, 0);
  const overallPercentage = totalClassRec > 0 ? Math.round((totalClassH / totalClassRec) * 100) : 100;

  const handleManualResync = async () => {
    if (!onResyncAttendance) return;
    setIsSyncing(true);
    try {
      const result = onResyncAttendance();
      setSyncStatusMessage(`Berhasil menyinkronkan data presensi! ${result.updatedCount} dari ${result.totalSessions} sesi berhasil dihubungkan ulang dengan data siswa saat ini.`);
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

  // Filtered materials based on search term
  const filteredMaterials = relevantSessions.filter(s => {
    if (!searchMaterial.trim()) return true;
    const query = searchMaterial.toLowerCase();
    return (
      (s.topic && s.topic.toLowerCase().includes(query)) ||
      (s.competency && s.competency.toLowerCase().includes(query)) ||
      (s.teachingNotes && s.teachingNotes.toLowerCase().includes(query)) ||
      (s.subjectName && s.subjectName.toLowerCase().includes(query)) ||
      (s.teacherName && s.teacherName.toLowerCase().includes(query))
    );
  });

  // Get display names for filters
  const currentTeacherLabel = selectedTeacherId === 'ALL' ? 'Semua Guru' : (currentTeacherObj?.name || activeTeacher.name);

  const currentSubjectObj = subjects.find(s => s.id === selectedSubjectId);
  const currentSubjectLabel = selectedSubjectId === 'ALL' ? 'Semua Mata Pelajaran' : (currentSubjectObj?.name || activeSubject.name);

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      [`LAPORAN REKAPITULASI PRESENSI & MATERI - MTS MANBAUL ISLAM`],
      [`Kelas: ${selectedClass}`],
      [`Filter Guru: ${currentTeacherLabel}`],
      [`Filter Mata Pelajaran: ${currentSubjectLabel}`],
      [`Jumlah Pertemuan Terdata: ${relevantSessions.length} Sesi`],
      [''],
      ['--- REKAP PRESENSI SISWA ---'],
      ['No', 'Absen', 'Nama Siswa', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alpa (A)', 'Persentase Kehadiran (%)']
    ];

    studentStats.forEach((st, idx) => {
      rows.push([
        idx + 1,
        st.student.rollNo,
        st.student.name,
        st.countH,
        st.countI,
        st.countS,
        st.countA,
        `${st.percentage}%`
      ]);
    });

    rows.push(['']);
    rows.push(['--- DAFTAR MATERI PEMBELAJARAN YANG SUDAH DIAJARKAN ---']);
    rows.push(['No', 'Tanggal', 'Jam Ke', 'Pertemuan Ke', 'Mata Pelajaran', 'Guru Pengajar', 'Materi / Topik', 'Capaian Pembelajaran', 'Catatan / Refleksi']);

    relevantSessions.forEach((sess, idx) => {
      rows.push([
        idx + 1,
        sess.date,
        sess.periodNumber || '-',
        sess.meetingNumber || '-',
        sess.subjectName || '-',
        sess.teacherName || '-',
        sess.topic || '-',
        sess.competency || '-',
        sess.teachingNotes || '-'
      ]);
    });

    exportToCSV(`Rekap_Laporan_Kelas_${selectedClass}.csv`, rows);
  };

  const handlePrint = () => {
    printFormattedDocument('printable-rekap-matrix');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#073619] via-[#0d5026] to-[#15803d] rounded-xl p-5 text-white shadow-xs border border-emerald-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Laporan & Rekapitulasi Presensi dan Materi Pembelajaran</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              Rekap Laporan Kelas {selectedClass}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Akumulasi presensi siswa dan jurnal materi pelajaran yang telah diajarkan dari {relevantSessions.length} kali pertemuan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onResyncAttendance && (
              <button
                type="button"
                onClick={handleManualResync}
                disabled={isSyncing}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                title="Hubungkan kembali catatan absensi dengan data siswa saat ini berdasarkan nama"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Presensi'}</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="bg-indigo-800 hover:bg-indigo-700 text-indigo-100 font-bold px-3 py-1.5 rounded-md text-xs flex items-center space-x-1.5 border border-indigo-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-300" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-200" />
              <span>Cetak Laporan</span>
            </button>
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
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filter Data Laporan Rekap</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Filter Guru */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Guru Pengajar:
            </label>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">-- Semua Guru --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Mata Pelajaran */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase text-slate-500">
                Mata Pelajaran:
              </label>
              {selectedTeacherId !== 'ALL' && (
                <span className="text-[9.5px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Beban: {availableSubjects.length} Mapel
                </span>
              )}
            </div>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">-- Semua Mata Pelajaran {selectedTeacherId !== 'ALL' ? `(${currentTeacherObj?.name || 'Guru'})` : ''} --</option>
              {availableSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Pilih Kelas:
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {classList.map(c => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 font-extrabold px-2.5 py-1 rounded-md text-[11px] flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{relevantSessions.length} Sesi Pertemuan</span>
            </span>
            <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md text-[11px] flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>{classStudents.length} Siswa</span>
            </span>
          </div>

          <div className="text-xs text-slate-600 font-medium">
            Rata-rata Kehadiran Kelas: <strong className="text-indigo-950 text-sm font-black">{overallPercentage}%</strong>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveView('presensi')}
          className={`px-4 py-2 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
            activeView === 'presensi'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-950 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Rekap Kehadiran Siswa</span>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
            {classStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveView('materi')}
          className={`px-4 py-2 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
            activeView === 'materi'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-indigo-600 text-indigo-950 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Materi yang Sudah Diajarkan</span>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
            {relevantSessions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Student Attendance Matrix Table */}
      {activeView === 'presensi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-2">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rekapitulasi Kehadiran Akumulasi ({classStudents.length} Siswa)</span>
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-extrabold px-2 py-0.5 rounded-md">
              {relevantSessions.length} Sesi Terdata
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 w-16 text-center">Absen</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3 text-center w-20">Hadir</th>
                  <th className="py-2.5 px-3 text-center w-20">Izin</th>
                  <th className="py-2.5 px-3 text-center w-20">Sakit</th>
                  <th className="py-2.5 px-3 text-center w-20">Alpa</th>
                  <th className="py-2.5 px-3 text-center w-28 bg-indigo-50/80 text-indigo-950 font-black">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {studentStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Tidak ada data siswa untuk kelas {selectedClass}.
                    </td>
                  </tr>
                ) : (
                  studentStats.map((st, idx) => (
                    <tr key={st.student.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 text-center font-bold text-indigo-900 bg-indigo-50/60 rounded">{st.student.rollNo}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{st.student.name}</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">{st.countH}</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-700 bg-blue-50/40">{st.countI}</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-700 bg-amber-50/40">{st.countS}</td>
                      <td className="py-2 px-3 text-center font-bold text-red-700 bg-red-50/40">{st.countA}</td>
                      <td className="py-2 px-3 text-center font-black bg-indigo-50/60">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          st.percentage >= 95 ? 'bg-indigo-700 text-white' :
                          st.percentage >= 85 ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {st.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Materials Taught List */}
      {activeView === 'materi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-sm">
                Rincian Materi & Topik yang Sudah Diajarkan ({relevantSessions.length} Sesi)
              </h3>
            </div>

            {/* Search Material */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchMaterial}
                onChange={e => setSearchMaterial(e.target.value)}
                placeholder="Cari materi / topik..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-xs">Belum ada materi pembelajaran terdata</p>
              <p className="text-slate-400 text-[11px] mt-1 max-w-md mx-auto">
                Belum terdapat catatan jurnal/materi yang diinput untuk kombinasi kelas, guru, atau mata pelajaran yang dipilih.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map((session, index) => {
                const hadirCount = session.entries?.filter(e => e.status === 'H').length || 0;
                const totalSiswa = session.entries?.length || 0;

                return (
                  <div
                    key={session.id || index}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center space-x-2">
                        <span className="bg-indigo-600 text-white font-extrabold px-2.5 py-0.5 rounded text-[10px]">
                          Pertemuan ke-{session.meetingNumber || index + 1}
                        </span>
                        <span className="text-slate-700 font-bold text-xs flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{session.date}</span>
                        </span>
                        {session.periodNumber && (
                          <span className="text-slate-500 font-medium text-xs flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Jam ke-{session.periodNumber}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px]">
                        <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">
                          {session.subjectName}
                        </span>
                        <span className="text-slate-600 font-semibold flex items-center space-x-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{session.teacherName}</span>
                        </span>
                      </div>
                    </div>

                    {/* Material Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                          Materi / Topik Pembelajaran:
                        </span>
                        <p className="font-black text-slate-900 text-xs leading-relaxed">
                          {session.topic || 'Belum diisi'}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Capaian / Tujuan Pembelajaran:
                        </span>
                        <p className="font-semibold text-slate-700 text-xs leading-relaxed">
                          {session.competency || 'Tidak dicantumkan'}
                        </p>
                      </div>
                    </div>

                    {/* Notes & Attendance Summary */}
                    {session.teachingNotes && (
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900 font-medium">
                        <strong className="font-bold uppercase text-[10px] text-amber-800 block mb-0.5">
                          Catatan Refleksi Kelas:
                        </strong>
                        {session.teachingNotes}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Siswa Hadir: <strong className="text-slate-800 font-bold">{hadirCount}</strong> / {totalSiswa} Siswa</span>
                      </span>

                      <span className="text-[10px] text-slate-400 italic">
                        ID Sesi: {session.id.slice(0, 10)}...
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Printable Matrix & Materials Document */}
      <div className="hidden">
        <div id="printable-rekap-matrix" className="text-black font-serif leading-relaxed p-4">
          {/* Header Kop Surat */}
          <div className="text-center border-b-2 border-black pb-3 mb-6">
            <h2 className="text-lg font-bold uppercase">YAYASAN MANBAUL ISLAM</h2>
            <h1 className="text-2xl font-black uppercase text-emerald-950">MADRASAH TSANAWIYAH (MTS) MANBAUL ISLAM</h1>
            <p className="text-xs italic">LAPORAN REKAPITULASI PRESENSI & MATERI PEMBELAJARAN</p>
          </div>

          <div className="text-xs mb-6 space-y-1 bg-gray-50 p-3 border border-gray-300 rounded">
            <p><strong>Kelas:</strong> {selectedClass}</p>
            <p><strong>Filter Guru Pengajar:</strong> {currentTeacherLabel}</p>
            <p><strong>Filter Mata Pelajaran:</strong> {currentSubjectLabel}</p>
            <p><strong>Jumlah Pertemuan Terdaftar:</strong> {relevantSessions.length} Sesi</p>
          </div>

          {/* Section 1: Attendance Table */}
          <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">
            I. Rekapitulasi Presensi Siswa
          </h3>
          <table className="w-full border-collapse border border-black text-xs mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1.5 text-center w-10">No</th>
                <th className="border border-black p-1.5 text-center w-12">Absen</th>
                <th className="border border-black p-1.5">Nama Siswa</th>
                <th className="border border-black p-1.5 text-center w-12">H</th>
                <th className="border border-black p-1.5 text-center w-12">I</th>
                <th className="border border-black p-1.5 text-center w-12">S</th>
                <th className="border border-black p-1.5 text-center w-12">A</th>
                <th className="border border-black p-1.5 text-center w-20">% Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map((st, i) => (
                <tr key={st.student.id}>
                  <td className="border border-black p-1 text-center">{i + 1}</td>
                  <td className="border border-black p-1 text-center font-bold">{st.student.rollNo}</td>
                  <td className="border border-black p-1">{st.student.name}</td>
                  <td className="border border-black p-1 text-center">{st.countH}</td>
                  <td className="border border-black p-1 text-center">{st.countI}</td>
                  <td className="border border-black p-1 text-center">{st.countS}</td>
                  <td className="border border-black p-1 text-center">{st.countA}</td>
                  <td className="border border-black p-1 text-center font-bold">{st.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Section 2: Materials Taught */}
          <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">
            II. Rincian Materi Pembelajaran yang Sudah Diajarkan
          </h3>
          <table className="w-full border-collapse border border-black text-xs mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1.5 text-center w-8">No</th>
                <th className="border border-black p-1.5 text-center w-20">Tanggal</th>
                <th className="border border-black p-1.5 text-center w-12">Pert.</th>
                <th className="border border-black p-1.5 w-28">Mata Pelajaran</th>
                <th className="border border-black p-1.5 w-32">Guru Pengajar</th>
                <th className="border border-black p-1.5">Materi / Topik Pembelajaran</th>
              </tr>
            </thead>
            <tbody>
              {relevantSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-black p-2 text-center italic">
                    Belum terdapat materi terdata untuk filter ini.
                  </td>
                </tr>
              ) : (
                relevantSessions.map((sess, i) => (
                  <tr key={sess.id || i}>
                    <td className="border border-black p-1 text-center">{i + 1}</td>
                    <td className="border border-black p-1 text-center">{sess.date}</td>
                    <td className="border border-black p-1 text-center">Ke-{sess.meetingNumber || i + 1}</td>
                    <td className="border border-black p-1">{sess.subjectName}</td>
                    <td className="border border-black p-1">{sess.teacherName}</td>
                    <td className="border border-black p-1 font-semibold">{sess.topic || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center text-xs mt-12">
            <div>
              <p className="mb-16">Mengetahui,<br />Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
              <p className="font-bold underline">{schoolOfficials?.kepalaSekolah.name || 'Dra. Hj. Nurjanah, M.Pd'}</p>
              <p>NIP. {schoolOfficials?.kepalaSekolah.nip || '197208151998032001'}</p>
            </div>
            <div>
              <p className="mb-16">Guru Mata Pelajaran / Wali Kelas</p>
              <p className="font-bold underline">{currentTeacherLabel !== 'Semua Guru' ? currentTeacherLabel : activeTeacher.name}</p>
              <p>NIP. {currentTeacherObj?.nip || activeTeacher.nip}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};


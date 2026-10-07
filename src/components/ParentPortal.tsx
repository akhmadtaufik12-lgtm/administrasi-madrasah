import React, { useState, useMemo } from 'react';
import {
  Student,
  AttendanceSession,
  GradeRecord,
  Subject,
  LessonPlan,
  StudentViolation,
  PaymentTransaction,
  FeeTariffSettings,
  StudentBillSettings,
  SchoolOfficials,
  Announcement
} from '../types';
import {
  Users,
  Search,
  UserCheck,
  Award,
  Calendar,
  BookOpen,
  LogOut,
  Sparkles,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  GraduationCap,
  Filter,
  BookMarked,
  FileText,
  User,
  Check,
  Layers,
  ShieldAlert,
  ExternalLink,
  Trophy,
  DollarSign,
  Receipt,
  Library,
  Megaphone,
  Bell,
  ChevronRight
} from 'lucide-react';
import { printHtmlString } from '../utils/export';
import { calculateStudentArrears, DEFAULT_ANNOUNCEMENTS } from '../utils/storage';
import { buildHistoricalStudentDictionary, findMatchingEntryForStudent } from '../utils/studentMatcher';
import { StudentArrearsParentView } from './StudentArrearsParentView';
import { AnnouncementModal } from './AnnouncementModal';

interface ParentPortalProps {
  students: Student[];
  sessions: AttendanceSession[];
  grades: GradeRecord[];
  subjects: Subject[];
  lessonPlans?: LessonPlan[];
  classList: string[];
  academicYear: string;
  semester: string;
  lockedStudentId?: string | null;
  violations?: StudentViolation[];
  payments?: PaymentTransaction[];
  tariffs?: FeeTariffSettings;
  billSettings?: StudentBillSettings;
  schoolOfficials?: SchoolOfficials;
  announcements?: Announcement[];
  onLogout: () => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  students,
  sessions,
  grades,
  subjects,
  lessonPlans = [],
  classList,
  academicYear,
  semester,
  lockedStudentId,
  violations = [],
  payments = [],
  tariffs,
  billSettings,
  schoolOfficials,
  announcements = DEFAULT_ANNOUNCEMENTS,
  onLogout
}) => {
  // Check if there is a locked student matching lockedStudentId
  const lockedStudent = useMemo(() => {
    if (!lockedStudentId) return null;
    const cleanId = lockedStudentId.toLowerCase().trim();
    return students.find(s => 
      s.id === lockedStudentId || 
      (s.kodeUnik && s.kodeUnik.toLowerCase().trim() === cleanId) ||
      (s.nis && s.nis.toLowerCase().trim() === cleanId)
    ) || null;
  }, [students, lockedStudentId]);

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (lockedStudent) return lockedStudent.className;
    return classList[0] || 'VII A';
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (lockedStudent) return lockedStudent.id;
    return '';
  });
  const [nameSearch, setNameSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'kehadiran' | 'pelajaran' | 'nilai' | 'kedisiplinan' | 'tagihan'>('kehadiran');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Filter students by selected class (locked mode strictly limits to lockedStudent)
  const classStudents = useMemo(() => {
    if (lockedStudent) return [lockedStudent];
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass, lockedStudent]);

  // Filtered student list by search text
  const searchedStudents = useMemo(() => {
    if (lockedStudent) return [lockedStudent];
    if (!nameSearch.trim()) return classStudents;
    const term = nameSearch.toLowerCase();
    return classStudents.filter(
      s => s.name.toLowerCase().includes(term) || 
        (s.nis && s.nis.includes(term)) ||
        (s.nisn && s.nisn.includes(term)) ||
        (s.kodeUnik && s.kodeUnik.toLowerCase().includes(term))
    );
  }, [classStudents, nameSearch, lockedStudent]);

  // Active student selection
  const activeStudent = useMemo(() => {
    if (lockedStudent) return lockedStudent;
    if (selectedStudentId) {
      const found = students.find(s => s.id === selectedStudentId);
      if (found) return found;
    }
    return searchedStudents[0] || classStudents[0] || null;
  }, [lockedStudent, students, selectedStudentId, searchedStudents, classStudents]);

  // Violations for active student
  const studentViolations = useMemo(() => {
    if (!activeStudent) return [];
    return violations.filter(v => 
      v.studentId === activeStudent.id || 
      (v.studentName?.toLowerCase().trim() === activeStudent.name.toLowerCase().trim() && v.className === activeStudent.className)
    );
  }, [violations, activeStudent]);

  const totalViolationPoints = useMemo(() => {
    return studentViolations.reduce((acc, curr) => acc + (curr.points || 0), 0);
  }, [studentViolations]);

  // Arrears summary for active student
  const activeStudentArrears = useMemo(() => {
    if (!activeStudent) return null;
    return calculateStudentArrears(activeStudent, payments, tariffs, billSettings, academicYear);
  }, [activeStudent, payments, tariffs, billSettings, academicYear]);

  // Modal Announcement for Parent
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Filtered announcements visible to this parent / student
  const studentAnnouncements = useMemo(() => {
    if (!announcements || announcements.length === 0) return [];
    return announcements.filter(ann => {
      if (!ann.active) return false;

      // 1. Target: Siswa Khusus (Personal / Targeted by Kode Unik)
      if (ann.targetAudience === 'siswa_khusus') {
        if (!activeStudent) return false;
        const studentCode = activeStudent.kodeUnik?.toLowerCase().trim();
        const annTargetCode = ann.targetStudentCode?.toLowerCase().trim();
        const annTargetId = ann.targetStudentId;

        if (annTargetId && annTargetId === activeStudent.id) return true;
        if (annTargetCode && studentCode && annTargetCode === studentCode) return true;
        return false;
      }

      // 2. Target: Orang Tua (All classes or specific class)
      if (ann.targetAudience === 'orang_tua') {
        if (!ann.targetClass) return true;
        if (activeStudent && ann.targetClass === activeStudent.className) return true;
        return false;
      }

      // 3. Target: All (General public / school broadcast)
      if (ann.targetAudience === 'all') {
        return true;
      }

      // Other targets like 'guru' or 'wali_kelas' are hidden from parent portal
      return false;
    });
  }, [announcements, activeStudent]);

  // Helper to get session entries regardless of property name (entries vs records)
  const getSessionEntries = (session: any): any[] => {
    if (Array.isArray(session?.entries)) return session.entries;
    if (Array.isArray(session?.records)) return session.records;
    return [];
  };

  const normalizeStatus = (status: string | undefined): 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA' => {
    if (!status) return 'HADIR';
    const s = String(status).trim().toUpperCase();
    if (s === 'H' || s === 'HADIR') return 'HADIR';
    if (s === 'I' || s === 'IZIN') return 'IZIN';
    if (s === 'S' || s === 'SAKIT') return 'SAKIT';
    if (s === 'A' || s === 'ALPA') return 'ALPA';
    return 'HADIR';
  };

  // Build lookup dictionary to bridge old student IDs with current student roster
  const studentDict = useMemo(() => {
    return buildHistoricalStudentDictionary(students, violations, payments);
  }, [students, violations, payments]);

  // Attendance history logged by teachers for active student
  const studentAttendanceHistory = useMemo(() => {
    if (!activeStudent || !Array.isArray(sessions)) return [];
    return sessions
      .filter(session => {
        if (!session || session.className !== activeStudent.className) return false;
        if (selectedSubjectFilter !== 'all' && session.subjectId !== selectedSubjectFilter && session.subjectName !== selectedSubjectFilter) return false;
        const entries = getSessionEntries(session);
        return !!findMatchingEntryForStudent(entries, activeStudent, studentDict);
      })
      .map(session => {
        const entries = getSessionEntries(session);
        const rec = findMatchingEntryForStudent(entries, activeStudent, studentDict);
        const presentCount = entries.filter(r => normalizeStatus(r?.status) === 'HADIR').length;
        return {
          id: session.id,
          sessionDate: session.date || '',
          subjectId: session.subjectId,
          subjectName: session.subjectName || 'Mata Pelajaran',
          teacherName: session.teacherName || 'Guru',
          meetingNumber: session.meetingNumber,
          periodNumber: session.periodNumber,
          topic: session.topic || 'Materi Pelajaran KBM',
          status: normalizeStatus(rec?.status),
          notes: rec?.notes || '',
          totalPresentInClass: presentCount,
          totalStudentsInClass: entries.length
        };
      })
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [sessions, activeStudent, selectedSubjectFilter, studentDict]);

  // Overall attendance statistics for active student
  const attendanceStats = useMemo(() => {
    let total = studentAttendanceHistory.length;
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    studentAttendanceHistory.forEach(item => {
      if (item.status === 'HADIR') hadir++;
      else if (item.status === 'IZIN') izin++;
      else if (item.status === 'SAKIT') sakit++;
      else if (item.status === 'ALPA') alpa++;
    });

    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return { total, hadir, izin, sakit, alpa, percentage };
  }, [studentAttendanceHistory]);

  // Lessons/Topics taught by teachers for the selected class (from sessions & lesson plans)
  const classLessonsDelivered = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions
      .filter(session => 
        session &&
        session.className === selectedClass &&
        (selectedSubjectFilter === 'all' || session.subjectId === selectedSubjectFilter || session.subjectName === selectedSubjectFilter)
      )
      .map(session => {
        const entries = getSessionEntries(session);
        const studentRecord = activeStudent ? entries.find(r => r && r.studentId === activeStudent.id) : null;
        return {
          id: session.id,
          date: session.date || '',
          subjectName: session.subjectName || 'Mata Pelajaran',
          teacherName: session.teacherName || 'Guru Pengajar',
          meetingNumber: session.meetingNumber,
          periodNumber: session.periodNumber,
          topic: session.topic || 'Materi KBM Guru',
          studentStatus: studentRecord ? normalizeStatus(studentRecord.status) : undefined,
          notes: studentRecord?.notes
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, selectedClass, selectedSubjectFilter, activeStudent]);

  // Modul Ajar / RPP compiled by teachers for this class
  const classLessonPlans = useMemo(() => {
    if (!Array.isArray(lessonPlans)) return [];
    return lessonPlans.filter(plan => 
      plan &&
      plan.className === selectedClass &&
      (selectedSubjectFilter === 'all' || plan.subjectId === selectedSubjectFilter || plan.subjectName === selectedSubjectFilter)
    );
  }, [lessonPlans, selectedClass, selectedSubjectFilter]);

  // Grades list for active student across subjects
  const studentGrades = useMemo(() => {
    if (!activeStudent) return [];
    
    return subjects.map(sub => {
      const gradeRec = grades.find(
        g => g.subjectId === sub.id && g.className === activeStudent.className
      );
      const studentGrade = gradeRec?.grades ? gradeRec.grades[activeStudent.id] : undefined;
      return {
        subject: sub,
        grade: studentGrade
      };
    });
  }, [subjects, grades, activeStudent]);

  // Overall average grade calculation
  const overallGradeStats = useMemo(() => {
    const validGrades = studentGrades
      .map(g => g.grade?.finalGrade)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (validGrades.length === 0) return { avg: '-', totalSub: subjects.length, evaluated: 0 };

    const sum = validGrades.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round((sum / validGrades.length) * 10) / 10;
    return { avg, totalSub: subjects.length, evaluated: validGrades.length };
  }, [studentGrades, subjects]);

  const handlePrintReport = () => {
    if (!activeStudent) return;
    const bodyContent = `
      <div style="font-family: sans-serif; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #1e1b4b; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin:0; color:#1e1b4b; font-size: 20px;">LAPORAN HASIL BELAJAR & KEHADIRAN SISWA</h2>
          <h3 style="margin:4px 0 0; color:#475569; font-size: 14px;">MTs MANBAUL ISLAM</h3>
          <p style="margin:4px 0 0; font-size: 12px; color: #64748b;">Tahun Pelajaran ${academicYear} • ${semester}</p>
        </div>

        <table style="width: 100%; font-size: 12px; margin-bottom: 20px; border-collapse: collapse;">
          <tr>
            <td style="width: 15%; font-weight: bold;">Nama Siswa</td>
            <td style="width: 35%;">: ${activeStudent.name}</td>
            <td style="width: 15%; font-weight: bold;">NIS / NISN</td>
            <td style="width: 35%;">: ${activeStudent.nis || '-'} / ${activeStudent.nisn || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Kelas</td>
            <td>: ${activeStudent.className}</td>
            <td style="font-weight: bold;">Jenis Kelamin</td>
            <td>: ${activeStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
          </tr>
        </table>

        <h4 style="margin: 15px 0 8px; color:#1e1b4b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">1. REKAPITULASI KEHADIRAN SISWA (INPUT GURU)</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; margin-bottom: 20px;" border="1" cellPadding="6">
          <tr style="background-color: #f1f5f9;">
            <th>Total Pertemuan Guru</th>
            <th>Hadir</th>
            <th>Izin</th>
            <th>Sakit</th>
            <th>Alpa</th>
            <th>Persentase Kehadiran</th>
          </tr>
          <tr>
            <td>${attendanceStats.total} Pertemuan</td>
            <td>${attendanceStats.hadir}</td>
            <td>${attendanceStats.izin}</td>
            <td>${attendanceStats.sakit}</td>
            <td>${attendanceStats.alpa}</td>
            <td><strong>${attendanceStats.percentage}%</strong></td>
          </tr>
        </table>

        <h4 style="margin: 15px 0 8px; color:#1e1b4b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">2. MATERI / PELAJARAN YANG SUDAH DIBERIKAN GURU</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;" border="1" cellPadding="6">
          <thead style="background-color: #f1f5f9;">
            <tr>
              <th style="width: 15%;">Tanggal</th>
              <th style="width: 25%;">Mata Pelajaran & Guru</th>
              <th>Materi / Topik Pelajaran</th>
              <th style="width: 15%; text-align: center;">Status Absen</th>
            </tr>
          </thead>
          <tbody>
            ${classLessonsDelivered.slice(0, 15).map(item => `
              <tr>
                <td>${item.date}</td>
                <td><strong>${item.subjectName}</strong><br/><span style="color:#64748b;">${item.teacherName}</span></td>
                <td>${item.topic}</td>
                <td style="text-align: center;"><strong>${item.studentStatus || 'HADIR'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h4 style="margin: 15px 0 8px; color:#1e1b4b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">3. REKAPITULASI NILAI AKADEMIK</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;" border="1" cellPadding="6">
          <thead style="background-color: #f1f5f9;">
            <tr>
              <th style="width: 5%;">No</th>
              <th style="text-align: left;">Mata Pelajaran</th>
              <th>Formatif</th>
              <th>Sumatif TP</th>
              <th>Sumatif UTS</th>
              <th>Sumatif UAS</th>
              <th>Nilai Akhir</th>
              <th>Predikat</th>
            </tr>
          </thead>
          <tbody>
            ${studentGrades.map((g, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${g.subject.name}</strong> (${g.subject.code})</td>
                <td style="text-align: center;">${g.grade?.formatifAvg ?? '-'}</td>
                <td style="text-align: center;">${g.grade?.sumatifTPAvg ?? '-'}</td>
                <td style="text-align: center;">${g.grade?.sumatifUTS ?? '-'}</td>
                <td style="text-align: center;">${g.grade?.sumatifUAS ?? '-'}</td>
                <td style="text-align: center; font-weight: bold;">${g.grade?.finalGrade ?? '-'}</td>
                <td style="text-align: center; font-weight: bold;">${g.grade?.predicate ?? '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: right; font-size: 11px;">
          <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <br/><br/>
          <p><strong>Wali Kelas ${activeStudent.className}</strong></p>
        </div>
      </div>
    `;

    printHtmlString(`Laporan_Siswa_${activeStudent.name}`, bodyContent);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
      
      {/* Top Header Navigation */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          
          {/* Header Title & Branding */}
          <div className="flex items-center justify-between sm:justify-start space-x-3">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="w-9 h-9 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider truncate">
                    Portal Orang Tua / Wali Siswa
                  </span>
                  <span className="text-[10px] text-indigo-300 font-medium hidden md:inline">TP {academicYear} • {semester}</span>
                </div>
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight mt-0.5 truncate">
                  MTs MANBAUL ISLAM
                </h1>
              </div>
            </div>

            {/* Logout Button on Mobile (placed top right) */}
            <div className="sm:hidden shrink-0">
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Keluar ke Halaman Utama"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* Quick External Portals (Perpustakaan & Ekstrakulikuler) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href="https://perpus-digitalmbi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-sky-500/20 hover:bg-sky-500/30 active:bg-sky-500/40 text-sky-200 border border-sky-400/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-2xs"
              title={`Perpustakaan Digital ${schoolOfficials?.namaSekolah || 'Madrasah'}`}
            >
              <Library className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <span className="truncate">Perpustakaan</span>
              <ExternalLink className="w-3 h-3 text-sky-300 shrink-0 opacity-80" />
            </a>

            <a
              href="https://administrasi-ekstrakulikuler-mts-manbau-islam.ai.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 text-emerald-200 border border-emerald-400/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-2xs"
              title={`Portal Ekstrakurikuler ${schoolOfficials?.namaSekolah || 'Madrasah'}`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Ekstrakulikuler</span>
              <ExternalLink className="w-3 h-3 text-emerald-300 shrink-0 opacity-80" />
            </a>

            {/* Logout Button on Tablet / Desktop */}
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              title="Keluar ke Halaman Utama"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">

        {/* Filter Section Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {lockedStudent ? 'Akses Terverifikasi Laporan Siswa' : 'Filter Kelas & Nama Siswa'}
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              TP {academicYear} ({semester})
            </span>
          </div>

          {lockedStudent ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 bg-emerald-50 border border-emerald-200/90 rounded-xl p-3 flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  ✓
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      Terverifikasi Kode Unik
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-900 font-mono">
                      Kode: {lockedStudent.kodeUnik || '-'}
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 mt-0.5">
                    Hanya Menampilkan Data Siswa: <span className="text-indigo-950 font-extrabold">{lockedStudent.name}</span> (Kelas {lockedStudent.className})
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Filter Mata Pelajaran:
                </label>
                <select
                  value={selectedSubjectFilter}
                  onChange={e => setSelectedSubjectFilter(e.target.value)}
                  className="w-full bg-indigo-50/70 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Mata Pelajaran ({subjects.length})</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Filter 1: Select Class */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  1. Pilih Kelas:
                </label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    setSelectedClass(e.target.value);
                    setSelectedStudentId('');
                    setNameSearch('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {classList.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Select Student from Dropdown */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  2. Pilih Nama Siswa ({classStudents.length}):
                </label>
                <select
                  value={activeStudent?.id || ''}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NIS: {s.nis || '-'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Search Student Name Keyword */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  3. Cari Ketik Nama / NIS:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik nama siswa..."
                    value={nameSearch}
                    onChange={e => setNameSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Filter 4: Select Subject Filter */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  4. Filter Mata Pelajaran:
                </label>
                <select
                  value={selectedSubjectFilter}
                  onChange={e => setSelectedSubjectFilter(e.target.value)}
                  className="w-full bg-indigo-50/70 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Mata Pelajaran ({subjects.length})</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

            </div>
          )}
        </div>

        {activeStudent ? (
          <>
            {/* Student Profile Card Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-indigo-500/20 border-2 border-indigo-400/40 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0 shadow-inner">
                  {activeStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-400/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      Kelas {activeStudent.className}
                    </span>
                    <span className="text-[11px] text-slate-300 font-semibold">
                      {activeStudent.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-white mt-1">
                    {activeStudent.name}
                  </h2>
                  <p className="text-xs text-indigo-200/90 font-medium mt-0.5">
                    Kode Unik: <strong className="text-emerald-300 font-mono">{activeStudent.kodeUnik || '-'}</strong> • NISN: <strong className="text-white">{activeStudent.nisn || '-'}</strong>
                  </p>
                </div>
              </div>

              {/* Action Print Button */}
              <button
                onClick={handlePrintReport}
                className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rapor & Laporan Presensi</span>
              </button>
            </div>

            {/* Announcements for this Student / Parent */}
            {studentAnnouncements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Megaphone className="w-4 h-4 text-indigo-600 animate-bounce" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Pesan & Pengumuman Khusus Madrasah ({studentAnnouncements.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">
                    Klik untuk membaca selengkapnya
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studentAnnouncements.map((ann) => {
                    const isPersonal = ann.targetAudience === 'siswa_khusus';
                    const isParentClass = ann.targetAudience === 'orang_tua';

                    return (
                      <div
                        key={ann.id}
                        onClick={() => setSelectedAnnouncement(ann)}
                        className={`p-4 rounded-2xl border transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 ${
                          isPersonal
                            ? 'bg-gradient-to-br from-indigo-900/5 via-purple-500/10 to-indigo-50/70 border-indigo-300 ring-1 ring-indigo-500/20'
                            : ann.type === 'urgent'
                            ? 'bg-rose-50/80 border-rose-200'
                            : ann.type === 'warning'
                            ? 'bg-amber-50/80 border-amber-200'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isPersonal ? (
                              <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <span>🔒 Pesan Khusus Siswa</span>
                              </span>
                            ) : isParentClass ? (
                              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                👨‍👩‍👧 Info Wali Murid {ann.targetClass ? `Kelas ${ann.targetClass}` : ''}
                              </span>
                            ) : (
                              <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                📢 Pengumuman Umum
                              </span>
                            )}

                            {ann.type === 'urgent' && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                🔴 Penting / Darurat
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-black text-slate-900 leading-snug">
                            {ann.title}
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                            {ann.message}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[11px] text-slate-400">
                          <span>Oleh: <strong className="text-slate-700">{ann.authorName || 'Admin Madrasah'}</strong></span>
                          <span className="text-indigo-600 font-extrabold flex items-center gap-0.5">
                            <span>Baca Detail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
              <button
                onClick={() => setActiveTab('kehadiran')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  activeTab === 'kehadiran'
                    ? 'bg-indigo-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>1. Hasil Inputan Absen Guru ({attendanceStats.total} Pertemuan)</span>
              </button>

              <button
                onClick={() => setActiveTab('pelajaran')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  activeTab === 'pelajaran'
                    ? 'bg-indigo-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <BookMarked className="w-4 h-4 text-emerald-400" />
                <span>2. Pelajaran & Materi Guru ({classLessonsDelivered.length} KBM)</span>
              </button>

              <button
                onClick={() => setActiveTab('nilai')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  activeTab === 'nilai'
                    ? 'bg-indigo-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>3. Nilai & Evaluasi Rapor ({overallGradeStats.evaluated}/{overallGradeStats.totalSub} Mapel)</span>
              </button>

              <button
                onClick={() => setActiveTab('kedisiplinan')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer relative ${
                  activeTab === 'kedisiplinan'
                    ? 'bg-amber-600 text-white shadow-md font-black'
                    : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>4. Catatan Kedisiplinan & Poin BK</span>
                {studentViolations.length > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {totalViolationPoints} Poin
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('tagihan')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer relative ${
                  activeTab === 'tagihan'
                    ? 'bg-emerald-700 text-white shadow-md font-black'
                    : 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-300'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>5. Status Tagihan & Tunggakan</span>
                {activeStudentArrears && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    activeStudentArrears.isAllPaid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-600 text-white shadow-xs'
                  }`}>
                    {activeStudentArrears.isAllPaid ? '✓ Lunas' : `Sisa: Rp ${activeStudentArrears.totalRemaining.toLocaleString('id-ID')}`}
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENT 1: HASIL INPUTAN ABSEN DARI GURU */}
            {activeTab === 'kehadiran' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Attendance Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Pertemuan Guru</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{attendanceStats.total}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tercatat di Jurnal</p>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold uppercase text-emerald-800">Hadir</p>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-black text-emerald-950 mt-1">{attendanceStats.hadir}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">{attendanceStats.percentage}% Tingkat Kehadiran</p>
                  </div>

                  <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold uppercase text-blue-800">Izin</p>
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xl font-black text-blue-950 mt-1">{attendanceStats.izin}</p>
                    <p className="text-[10px] text-blue-700 font-medium mt-0.5">Keterangan Izin Resmi</p>
                  </div>

                  <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold uppercase text-amber-800">Sakit</p>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xl font-black text-amber-950 mt-1">{attendanceStats.sakit}</p>
                    <p className="text-[10px] text-amber-700 font-medium mt-0.5">Surat Keterangan Sakit</p>
                  </div>

                  <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold uppercase text-rose-800">Alpa (Tanpa Ket)</p>
                      <XCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-xl font-black text-rose-950 mt-1">{attendanceStats.alpa}</p>
                    <p className="text-[10px] text-rose-700 font-medium mt-0.5">Catatan Perhatian Guru</p>
                  </div>
                </div>

                {/* Table: Hasil Inputan Absen dari Guru */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <span>Rincian Hasil Inputan Absen dari Guru</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menampilkan status presensi siswa <strong className="text-slate-900">{activeStudent.name}</strong> yang disubmit langsung oleh guru pengajar.
                      </p>
                    </div>

                    <span className="text-[11px] text-slate-600 font-extrabold bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shrink-0 self-start sm:self-auto">
                      {studentAttendanceHistory.length} Pertemuan Tercatat
                    </span>
                  </div>

                  {studentAttendanceHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="text-xs font-bold text-slate-600">Belum ada catatan presensi guru untuk filter ini.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Absensi yang dimasukkan oleh guru di menu utama akan langsung muncul secara otomatis di sini.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-y border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Tanggal KBM</th>
                            <th className="py-2.5 px-3">Mata Pelajaran</th>
                            <th className="py-2.5 px-3">Guru Pengajar</th>
                            <th className="py-2.5 px-3">Materi / Topik Pembelajaran</th>
                            <th className="py-2.5 px-3 text-center">Hasil Absen Guru</th>
                            <th className="py-2.5 px-3">Catatan Perilaku / Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentAttendanceHistory.map((item) => {
                            let statusBadge = (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-black text-[10px] inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>HADIR</span>
                              </span>
                            );
                            if (item.status === 'IZIN') {
                              statusBadge = (
                                <span className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 rounded-full font-black text-[10px] inline-flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>IZIN</span>
                                </span>
                              );
                            } else if (item.status === 'SAKIT') {
                              statusBadge = (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full font-black text-[10px] inline-flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>SAKIT</span>
                                </span>
                              );
                            } else if (item.status === 'ALPA') {
                              statusBadge = (
                                <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full font-black text-[10px] inline-flex items-center space-x-1">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>ALPA</span>
                                </span>
                              );
                            }

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                                  <div className="flex items-center space-x-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>{item.sessionDate}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-bold text-indigo-950">
                                  {item.subjectName}
                                </td>
                                <td className="py-3 px-3 font-medium text-slate-600">
                                  {item.teacherName}
                                </td>
                                <td className="py-3 px-3 font-medium text-slate-800 max-w-xs">
                                  {item.topic}
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  {statusBadge}
                                </td>
                                <td className="py-3 px-3 font-medium text-slate-500 italic">
                                  {item.notes ? `"${item.notes}"` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PELAJARAN YANG SUDAH DIBERIKAN OLEH GURU */}
            {activeTab === 'pelajaran' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Jurnal KBM / Topik Pelajaran dari Guru */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                        <BookMarked className="w-4 h-4 text-emerald-600" />
                        <span>Daftar Pelajaran & Topik KBM Diberikan Guru (Kelas {selectedClass})</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ringkasan materi pembelajaran yang telah diajarkan oleh guru di kelas setiap tatap muka KBM.
                      </p>
                    </div>

                    <span className="text-[11px] text-emerald-800 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shrink-0 self-start sm:self-auto">
                      {classLessonsDelivered.length} Sesi KBM Terlaksana
                    </span>
                  </div>

                  {classLessonsDelivered.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="text-xs font-bold text-slate-600">Belum ada jurnal materi pelajaran dari guru untuk kelas ini.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Setiap kali guru mengisi jurnal mengajar, topik pelajaran akan tampil di sini.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classLessonsDelivered.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 hover:shadow-xs hover:border-indigo-300 transition"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <span className="bg-indigo-900 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {item.subjectName}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{item.date}</span>
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Guru Pengajar:</p>
                            <p className="text-xs font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{item.teacherName}</span>
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-[10px] uppercase font-bold text-emerald-700">Materi / Topik Pelajaran Diberikan:</p>
                            <p className="text-xs font-extrabold text-slate-900 mt-1 leading-relaxed">
                              {item.topic}
                            </p>
                          </div>

                          {item.studentStatus && (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                              <span className="text-slate-500 font-medium">Status Kehadiran Siswa:</span>
                              <span className={`font-black px-2 py-0.5 rounded ${
                                item.studentStatus === 'HADIR' ? 'bg-emerald-100 text-emerald-800' :
                                item.studentStatus === 'IZIN' ? 'bg-blue-100 text-blue-800' :
                                item.studentStatus === 'SAKIT' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.studentStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modul Ajar / RPP Perencanaan Guru */}
                {classLessonPlans.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>Modul Ajar & Target Pembelajaran Kurikulum Merdeka</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Perencanaan Alur Tujuan Pembelajaran (ATP) dan kegiatan belajar yang telah disusun guru.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classLessonPlans.map(plan => (
                        <div key={plan.id} className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                            <span className="font-extrabold text-indigo-950 text-xs">{plan.subjectName}</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">
                              {plan.timeAllocation}
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-bold text-indigo-700">Topik Pembelajaran:</p>
                            <p className="text-xs font-black text-slate-900 mt-0.5">{plan.topic}</p>
                          </div>

                          {plan.learningObjectives && plan.learningObjectives.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Tujuan Pembelajaran (TP):</p>
                              <ul className="space-y-1">
                                {plan.learningObjectives.map((tp, i) => (
                                  <li key={i} className="text-[11px] text-slate-700 flex items-start space-x-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{tp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT 3: NILAI & EVALUASI RAPOR */}
            {activeTab === 'nilai' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Grade Average Banner */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Rata-Rata Nilai Akhir Rapor Akademik
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Berdasarkan {overallGradeStats.evaluated} mata pelajaran yang telah diinput dan dinilai oleh guru.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-center shadow-inner">
                    <p className="text-[10px] text-indigo-300 font-extrabold uppercase">Rerata Nilai Akhir</p>
                    <p className="text-2xl font-black text-amber-400">{overallGradeStats.avg}</p>
                  </div>
                </div>

                {/* Grades Table */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Transkrip Nilai Kurikulum Merdeka ({semester})</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-y border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-10">No</th>
                          <th className="py-2.5 px-3">Mata Pelajaran</th>
                          <th className="py-2.5 px-3 text-center">Formatif</th>
                          <th className="py-2.5 px-3 text-center">Sumatif TP</th>
                          <th className="py-2.5 px-3 text-center">UTS</th>
                          <th className="py-2.5 px-3 text-center">UAS</th>
                          <th className="py-2.5 px-3 text-center bg-indigo-50/50">Nilai Akhir</th>
                          <th className="py-2.5 px-3 text-center">Predikat</th>
                          <th className="py-2.5 px-3">Deskripsi Capaian Pembelajaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentGrades.map(({ subject, grade }, idx) => {
                          const hasGrade = grade && grade.finalGrade !== undefined;
                          
                          let predClass = 'bg-slate-100 text-slate-700';
                          if (grade?.predicate === 'A (Sangat Baik)') predClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          else if (grade?.predicate === 'B (Baik)') predClass = 'bg-blue-100 text-blue-800 border-blue-300';
                          else if (grade?.predicate === 'C (Cukup)') predClass = 'bg-amber-100 text-amber-800 border-amber-300';
                          else if (grade?.predicate === 'D (Perlu Bimbingan)') predClass = 'bg-rose-100 text-rose-800 border-rose-300';

                          return (
                            <tr key={subject.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3 font-black text-slate-900">
                                <div>{subject.name}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{subject.code}</div>
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-700">
                                {grade?.formatifAvg ?? '-'}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-700">
                                {grade?.sumatifTPAvg ?? '-'}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-700">
                                {grade?.sumatifUTS ?? '-'}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-700">
                                {grade?.sumatifUAS ?? '-'}
                              </td>
                              <td className="py-3 px-3 text-center font-black text-indigo-950 bg-indigo-50/30 text-sm">
                                {hasGrade ? grade.finalGrade : '-'}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                {hasGrade && grade.predicate ? (
                                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${predClass}`}>
                                    {grade.predicate}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-semibold">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-medium text-slate-600 text-[11px] leading-snug">
                                {grade?.description || (
                                  <span className="text-slate-400 italic">Belum ada catatan deskripsi.</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>
            )}

            {/* TAB CONTENT 4: CATATAN KEDISIPLINAN & POIN BK */}
            {activeTab === 'kedisiplinan' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Catatan Kedisiplinan & Poin Pelanggaran (BK/BP & Kesiswaan)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Transparansi laporan pelanggaran dan pembinaan kedisiplinan siswa untuk perhatian orang tua/wali.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-2">
                      <span className="text-xs text-amber-800 font-bold">Total Akumulasi Poin:</span>
                      <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                        {totalViolationPoints} Poin
                      </span>
                    </div>
                  </div>

                  {studentViolations.length === 0 ? (
                    <div className="py-12 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-extrabold text-sm text-emerald-900">Alhamdulillah! Tidak Ada Catatan Pelanggaran</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        Siswa <strong className="text-emerald-950">{activeStudent.name}</strong> memiliki rekam kedisiplinan yang sangat baik dan belum pernah tercatat melakukan pelanggaran.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentViolations.map((v) => {
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
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                              <div className="flex items-center space-x-2">
                                <span className="bg-indigo-900 text-white text-[10px] font-black px-2 py-0.5 rounded">
                                  {v.date}
                                </span>
                                <h4 className={`font-black text-xs ${v.category === 'Apresiasi' || v.points < 0 ? 'text-emerald-800' : 'text-slate-900'}`}>{v.violationType}</h4>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${categoryBadge}`}>
                                  {v.points < 0 ? `${v.points} Poin` : `+${v.points} Poin`} ({v.category})
                                </span>

                                {isHandled ? (
                                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Telah Ditangani Wali Kelas / BK</span>
                                  </span>
                                ) : (
                                  <span className="bg-rose-100 text-rose-800 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                                    Proses Pembinaan
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 italic">
                              "{v.description}"
                            </p>

                            {v.followUpNote && (
                              <div className="text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                                <strong className="font-bold text-amber-950 block text-[11px]">Tindak Lanjut & Catatan BK:</strong>
                                <span>{v.followUpNote}</span>
                              </div>
                            )}

                            <div className="text-[11px] text-slate-400 font-medium pt-1">
                              Pelapor / Penginput: <strong className="text-slate-600">{v.reporterName}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: STATUS TAGIHAN & TUNGGAKAN SISWA */}
            {activeTab === 'tagihan' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <StudentArrearsParentView
                  student={activeStudent}
                  payments={payments}
                  tariffs={tariffs}
                  billSettings={billSettings}
                  schoolOfficials={schoolOfficials}
                  academicYear={academicYear}
                  semester={semester}
                />
              </div>
            )}

          </>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
            <h3 className="text-sm font-black text-slate-800">Tidak ada siswa yang dipilih</h3>
            <p className="text-xs text-slate-500 mt-1">Silakan pilih kelas dan nama siswa dari menu di atas.</p>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-400 text-xs mt-auto">
        <p>© {new Date().getFullYear()} {schoolOfficials?.namaSekolah || 'Madrasah'} • Portal Informasi Orang Tua / Wali Siswa</p>
      </footer>

      {/* Detail Announcement Modal */}
      {selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}

    </div>
  );
};

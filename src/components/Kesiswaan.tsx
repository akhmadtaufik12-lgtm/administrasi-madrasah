import React, { useState, useMemo } from 'react';
import { Student, StudentViolation, Teacher, SchoolOfficials, ClassWaliKelasMap } from '../types';
import {
  ShieldAlert,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileSpreadsheet,
  Users,
  Award,
  Trash2,
  Edit3,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  FileText,
  Sparkles,
  ThumbsUp,
  HeartHandshake,
  Scroll
} from 'lucide-react';
import { exportToCSV, printHtmlString } from '../utils/export';
import { SuratPerjanjianKesiswaanModal } from './SuratPerjanjianKesiswaanModal';
import { SuratPeringatanModal, SPLevel } from './SuratPeringatanModal';

interface KesiswaanProps {
  students: Student[];
  teachers: Teacher[];
  classList: string[];
  violations: StudentViolation[];
  onSaveViolation?: (violation: StudentViolation) => Promise<void> | void;
  onAddViolation?: (violation: StudentViolation) => Promise<void> | void;
  onDeleteViolation: (id: string) => Promise<void> | void;
  academicYear?: string;
  semester?: string;
  schoolOfficials?: SchoolOfficials;
  classWaliKelas?: ClassWaliKelasMap;
}

const PREDEFINED_VIOLATIONS = [
  { label: 'Terlambat Masuk Sekolah (>15 Menit)', points: 5, category: 'Ringan' as const },
  { label: 'Atribut Seragam Tidak Lengkap (Sabuk/Dasi/Baju)', points: 5, category: 'Ringan' as const },
  { label: 'Potongan Rambut / Kuku / Perhiasan Berlebihan', points: 5, category: 'Ringan' as const },
  { label: 'Tidak Mengerjakan Tugas / Mengabaikan KBM', points: 5, category: 'Ringan' as const },
  { label: 'Tanpa Keterangan / Alpa Jam Pelajaran', points: 3, category: 'Ringan' as const },
  { label: 'Bermain HP / Game Saat Jam Pelajaran Tanpa Izin', points: 10, category: 'Sedang' as const },
  { label: 'Membolos Jam Pelajaran / Pindah Kelas', points: 15, category: 'Sedang' as const },
  { label: 'Meninggalkan Lingkungan Sekolah Tanpa Izin', points: 20, category: 'Sedang' as const },
  { label: 'Merokok / Membawa Vape di Lingkungan Sekolah', points: 50, category: 'Berat' as const },
  { label: 'Perundungan / Bullying / Tindak Kekerasan', points: 75, category: 'Berat' as const },
  { label: 'Berkelahi / Tawuran / Merusak Fasilitas', points: 100, category: 'Berat' as const },
  { label: 'Lainnya (Custom Pelanggaran)', points: 5, category: 'Ringan' as const },
];

const PREDEFINED_POSITIVE_ACTIONS = [
  { label: 'Hafalan Al-Qur\'an / Surat Binaan / Juz \'Amma (Min 1 Juz)', points: -15, category: 'Apresiasi' as const },
  { label: 'Juara / Prestasi Lomba Akademik / Non-Akademik (Sekolah / Kota)', points: -20, category: 'Apresiasi' as const },
  { label: 'Aktif Membantu Kebersihan, Keindahan & Fasilitas Sekolah', points: -5, category: 'Apresiasi' as const },
  { label: 'Sikap Jujur (Mengembalikan Barang Hilang / Mengaku Kesalahan)', points: -10, category: 'Apresiasi' as const },
  { label: 'Aktif Menjadi Pengurus OSIS / Petugas Upacara / Ekstrakurikuler', points: -10, category: 'Apresiasi' as const },
  { label: 'Perubahan Perilaku Positif & Konsisten Disiplin (1 Bulan)', points: -15, category: 'Apresiasi' as const },
  { label: 'Membantu Kegiatan Sosial / Keagamaan / Bantuan Guru & Teman', points: -10, category: 'Apresiasi' as const },
  { label: 'Lainnya (Custom Pengurangan Poin Positif)', points: -5, category: 'Apresiasi' as const },
];

export const Kesiswaan: React.FC<KesiswaanProps> = ({
  students,
  teachers,
  classList,
  violations,
  onSaveViolation,
  onAddViolation,
  onDeleteViolation,
  academicYear = '2026/2027',
  semester = 'Semester Ganjil',
  schoolOfficials,
  classWaliKelas
}) => {
  const saveViolationHandler = onSaveViolation || onAddViolation;
  const [subTab, setSubTab] = useState<'daftar' | 'input' | 'input_positif' | 'rekap_siswa'>('daftar');
  
  // Modal Surat Pernyataan / Perjanjian Siswa
  const [showPerjanjianModal, setShowPerjanjianModal] = useState<boolean>(false);
  const [perjanjianStudentId, setPerjanjianStudentId] = useState<string>('');
  const [perjanjianViolationId, setPerjanjianViolationId] = useState<string>('');

  const handleOpenSuratPerjanjian = (studentId?: string, violationId?: string) => {
    setPerjanjianStudentId(studentId || '');
    setPerjanjianViolationId(violationId || '');
    setShowPerjanjianModal(true);
  };

  // Modal Surat Peringatan (SP 1, SP 2, SP 3)
  const [showSpModal, setShowSpModal] = useState<boolean>(false);
  const [spStudentId, setSpStudentId] = useState<string>('');
  const [spLevel, setSpLevel] = useState<SPLevel>('SP_1');

  const handleOpenSuratPeringatan = (studentId?: string, level: SPLevel = 'SP_1') => {
    setSpStudentId(studentId || '');
    setSpLevel(level);
    setShowSpModal(true);
  };
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Ringan' | 'Sedang' | 'Berat' | 'Apresiasi'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Baru' | 'Proses Bimbingan' | 'Panggilan Orang Tua' | 'Telah Ditangani'>('ALL');

  // Input Form State (Pelanggaran)
  const [formClass, setFormClass] = useState<string>(classList[0] || 'VII A');
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formViolationType, setFormViolationType] = useState<string>('');
  const [formPoints, setFormPoints] = useState<number>(5);
  const [formCategory, setFormCategory] = useState<'Ringan' | 'Sedang' | 'Berat'>('Ringan');
  const [formReporter, setFormReporter] = useState<string>('Guru BK / BP');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formFollowUp, setFormFollowUp] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Baru' | 'Proses Bimbingan' | 'Panggilan Orang Tua' | 'Telah Ditangani'>('Baru');

  // Input Form State (Perilaku Baik / Remisi Poin Positif)
  const [posClass, setPosClass] = useState<string>(classList[0] || 'VII A');
  const [posStudentId, setPosStudentId] = useState<string>('');
  const [posDate, setPosDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [posPresetIndex, setPosPresetIndex] = useState<number>(0);
  const [posCustomType, setPosCustomType] = useState<string>('');
  const [posPoints, setPosPoints] = useState<number>(15);
  const [posReporter, setPosReporter] = useState<string>('Guru BK / BP / Kesiswaan');
  const [posDescription, setPosDescription] = useState<string>('');
  const [posFollowUp, setPosFollowUp] = useState<string>('Pemberian Apresiasi / Remisi Poin Disiplin Siswa');

  // Modal State for Editing / Following Up / Deleting
  const [editingViolation, setEditingViolation] = useState<StudentViolation | null>(null);
  const [deletingViolation, setDeletingViolation] = useState<StudentViolation | null>(null);
  const [modalStatus, setModalStatus] = useState<'Baru' | 'Proses Bimbingan' | 'Panggilan Orang Tua' | 'Telah Ditangani'>('Proses Bimbingan');
  const [modalFollowUp, setModalFollowUp] = useState<string>('');

  // Form student dropdown options
  const formStudentOptions = useMemo(() => {
    return students.filter(s => s.className === formClass);
  }, [students, formClass]);

  const posStudentOptions = useMemo(() => {
    return students.filter(s => s.className === posClass);
  }, [students, posClass]);

  // Handle Preset Select Change for Positive Actions
  const handlePosPresetChange = (index: number) => {
    setPosPresetIndex(index);
    const selected = PREDEFINED_POSITIVE_ACTIONS[index];
    if (selected) {
      if (selected.label !== 'Lainnya (Custom Pengurangan Poin Positif)') {
        setPosCustomType(selected.label);
      } else {
        setPosCustomType('');
      }
      setPosPoints(Math.abs(selected.points));
    }
  };

  const handleOpenPosativFormForStudent = (studentId: string, className: string) => {
    setPosClass(className);
    setPosStudentId(studentId);
    setSubTab('input_positif');
  };

  // Filtered Violations
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      if (selectedClass !== 'ALL' && v.className !== selectedClass) return false;
      if (categoryFilter !== 'ALL' && v.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = v.studentName.toLowerCase().includes(q);
        const matchType = v.violationType.toLowerCase().includes(q);
        const matchDesc = v.description.toLowerCase().includes(q);
        return matchName || matchType || matchDesc;
      }
      return true;
    });
  }, [violations, selectedClass, categoryFilter, statusFilter, searchQuery]);

  // Aggregate student points mapping
  const studentPointSummaries = useMemo(() => {
    const map: Record<string, { student: Student; totalPoints: number; count: number; rewardPoints: number; violationsList: StudentViolation[] }> = {};

    students.forEach(st => {
      map[st.id] = { student: st, totalPoints: 0, count: 0, rewardPoints: 0, violationsList: [] };
    });

    violations.forEach(v => {
      let target = map[v.studentId];
      if (!target) {
        target = Object.values(map).find(item =>
          item.student.name.toLowerCase().trim() === v.studentName?.toLowerCase().trim() &&
          item.student.className === v.className
        );
      }
      if (target) {
        target.totalPoints += v.points;
        if (v.points < 0 || v.category === 'Apresiasi') {
          target.rewardPoints += Math.abs(v.points);
        } else {
          target.count += 1;
        }
        target.violationsList.push(v);
      }
    });

    const list = Object.values(map);
    // Sort highest points first
    list.sort((a, b) => b.totalPoints - a.totalPoints);
    return list;
  }, [students, violations]);

  // Filtered Student Point Summaries
  const displayedStudentSummaries = useMemo(() => {
    return studentPointSummaries.filter(item => {
      if (selectedClass !== 'ALL' && item.student.className !== selectedClass) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.student.name.toLowerCase().includes(q) || (item.student.nisn && item.student.nisn.includes(q));
      }
      return true;
    });
  }, [studentPointSummaries, selectedClass, searchQuery]);

  // Overview Metrics
  const totalViolations = violations.filter(v => v.category !== 'Apresiasi' && v.points > 0).length;
  const totalPositiveDeeds = violations.filter(v => v.category === 'Apresiasi' || v.points < 0).length;
  const totalPositivePointsReduced = violations
    .filter(v => v.category === 'Apresiasi' || v.points < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.points), 0);
  const totalPointsCount = violations.reduce((acc, curr) => acc + curr.points, 0);
  const severeCases = violations.filter(v => v.category === 'Berat' || v.status === 'Panggilan Orang Tua').length;
  const resolvedCases = violations.filter(v => v.status === 'Telah Ditangani' || v.handledByWaliKelas).length;

  // Submit New Positive Action (Apresiasi / Remisi Poin)
  const handleSubmitPosForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posStudentId) {
      alert('Silakan pilih nama siswa terlebih dahulu.');
      return;
    }

    const selectedStudent = students.find(s => s.id === posStudentId);
    if (!selectedStudent) return;

    const actionName = PREDEFINED_POSITIVE_ACTIONS[posPresetIndex].label === 'Lainnya (Custom Pengurangan Poin Positif)'
      ? posCustomType || 'Apresiasi Perilaku Baik'
      : PREDEFINED_POSITIVE_ACTIONS[posPresetIndex].label;

    const deductionPoints = -Math.abs(Number(posPoints));

    const newRecord: StudentViolation = {
      id: `pos-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      date: posDate,
      violationType: actionName,
      category: 'Apresiasi',
      points: deductionPoints,
      reporterName: posReporter || 'Guru BK / Kesiswaan',
      description: posDescription || 'Tercatat apresiasi aksi positif / perilaku baik siswa.',
      followUpNote: posFollowUp || 'Remisi Poin Disiplin',
      status: 'Telah Ditangani',
      handledByWaliKelas: true,
      createdAt: new Date().toISOString()
    };

    if (saveViolationHandler) {
      await saveViolationHandler(newRecord);
    }

    // Reset Form
    setPosDescription('');
    setPosStudentId('');
    setSubTab('daftar');
    alert(`Apresiasi & Pengurangan Poin (${deductionPoints} Poin) Berhasil Disimpan!`);
  };

  // Submit New Violation
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) {
      alert('Silakan pilih nama siswa terlebih dahulu.');
      return;
    }

    const selectedStudent = students.find(s => s.id === formStudentId);
    if (!selectedStudent) return;

    if (!formViolationType.trim()) {
      alert('Silakan isi jenis pelanggaran terlebih dahulu.');
      return;
    }

    const newRecord: StudentViolation = {
      id: `viol-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      date: formDate,
      violationType: formViolationType.trim(),
      category: formCategory,
      points: Number(formPoints),
      reporterName: formReporter || 'Guru BK / BP',
      description: formDescription || 'Tercatat pelanggaran disiplin siswa.',
      followUpNote: formFollowUp,
      status: formStatus,
      handledByWaliKelas: formStatus === 'Telah Ditangani',
      createdAt: new Date().toISOString()
    };

    if (saveViolationHandler) {
      await saveViolationHandler(newRecord);
    }

    // Reset Form
    setFormViolationType('');
    setFormDescription('');
    setFormFollowUp('');
    setFormStudentId('');
    setSubTab('daftar');
    alert('Catatan pelanggaran & poin siswa berhasil disimpan!');
  };

  // Open Edit Modal
  const handleOpenEdit = (v: StudentViolation) => {
    setEditingViolation(v);
    setModalStatus(v.status);
    setModalFollowUp(v.followUpNote || '');
  };

  // Save Modal Updates
  const handleSaveModal = async () => {
    if (!editingViolation) return;

    const updated: StudentViolation = {
      ...editingViolation,
      status: modalStatus,
      followUpNote: modalFollowUp,
      handledByWaliKelas: modalStatus === 'Telah Ditangani' ? true : editingViolation.handledByWaliKelas,
      updatedAt: new Date().toISOString()
    };

    if (saveViolationHandler) {
      await saveViolationHandler(updated);
    }
    setEditingViolation(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['REKAPITULASI CATATAN PELANGGARAN & POIN KEDISIPLINAN SISWA'],
      [`MTS MANBAUL ISLAM - TAHUN PELAJARAN ${academicYear}`],
      [`Filter Kelas: ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}`],
      [''],
      ['No', 'Tanggal', 'Kelas', 'Nama Siswa', 'Jenis Pelanggaran', 'Kategori', 'Poin', 'Pelapor / BK', 'Deskripsi / Kronologi', 'Status Penanganan', 'Tindak Lanjut BK']
    ];

    filteredViolations.forEach((v, idx) => {
      rows.push([
        idx + 1,
        v.date,
        v.className,
        v.studentName,
        v.violationType,
        v.category,
        v.points,
        v.reporterName,
        v.description,
        v.status,
        v.followUpNote || '-'
      ]);
    });

    exportToCSV(`Buku_Kasus_Pelanggaran_Kedisiplinan_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const handlePrintFullReport = () => {
    const schoolName = schoolOfficials?.namaSekolah || 'MADRASAH TSANAWIYAH MANBAUL ISLAM';
    const schoolAddress = schoolOfficials?.alamatSekolah || 'Jl. Sandang No. 34 Palmerah, Jakarta Barat';
    const schoolCity = schoolOfficials?.kotaSekolah || 'Jakarta';
    const kepalaSekolahName = schoolOfficials?.kepalaSekolah?.name || 'H. Ahmad Syahid, M.Pd';
    const kepalaSekolahNip = schoolOfficials?.kepalaSekolah?.nip || '-';
    const kesiswaanName = schoolOfficials?.kesiswaan?.name || 'M. Sholihin, SE';
    const kesiswaanNip = schoolOfficials?.kesiswaan?.nip || '-';
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #000; font-size: 11px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 14px; text-transform: uppercase;">YAYASAN PENDIDIKAN MANBAUL ISLAM</h3>
          <h2 style="margin: 3px 0; font-size: 16px; text-transform: uppercase;">${schoolName}</h2>
          <p style="margin: 0; font-size: 11px;">${schoolAddress}</p>
        </div>

        <div style="text-align: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 14px; text-decoration: underline; text-transform: uppercase;">BUKU REKAPITULASI CATATAN PELANGGARAN & POIN KEDISIPLINAN SISWA</h3>
          <p style="margin: 4px 0 0 0; font-size: 11px;">Tahun Pelajaran ${academicYear} • ${semester} | Filter Kelas: ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;" border="1" cellPadding="4">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
              <th style="width: 4%;">No</th>
              <th style="width: 11%;">Tanggal</th>
              <th style="width: 8%;">Kelas</th>
              <th style="width: 18%; text-align: left;">Nama Siswa</th>
              <th style="text-align: left;">Bentuk Pelanggaran / Prestasi</th>
              <th style="width: 10%;">Kategori</th>
              <th style="width: 8%;">Poin</th>
              <th style="width: 14%;">Pelapor / BK</th>
              <th style="width: 12%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredViolations.map((v, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center;">${v.date}</td>
                <td style="text-align: center; font-weight: bold;">${v.className}</td>
                <td><strong>${v.studentName}</strong></td>
                <td>${v.violationType}</td>
                <td style="text-align: center;">${v.category}</td>
                <td style="text-align: center; font-weight: bold; color: ${v.points > 0 ? '#b91c1c' : '#047857'};">${v.points > 0 ? `+${v.points}` : v.points} pt</td>
                <td>${v.reporterName}</td>
                <td style="text-align: center;">${v.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table style="width: 100%; font-size: 11px; text-align: center; margin-top: 30px;">
          <tr>
            <td style="width: 50%;">
              Mengetahui,<br/>
              <strong>Kepala Madrasah</strong>
              <br/><br/><br/><br/>
              <strong><u>${kepalaSekolahName}</u></strong><br/>
              NIP: ${kepalaSekolahNip}
            </td>
            <td style="width: 50%;">
              ${schoolCity}, ${printDate}<br/>
              <strong>Waka Kesiswaan & Guru BK</strong>
              <br/><br/><br/><br/>
              <strong><u>${kesiswaanName}</u></strong><br/>
              NIP: ${kesiswaanNip}
            </td>
          </tr>
        </table>
      </div>
    `;

    printHtmlString(`Rekap_Kedisiplinan_Siswa_${selectedClass}_${academicYear}`, html);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-2xl p-5 text-white shadow-lg border border-indigo-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-indigo-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <ShieldAlert className="w-6 h-6 text-indigo-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Wakasek Kesiswaan & BK/BP
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  {academicYear} • {semester}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                Portal Kedisiplinan & Catatan Poin Pelanggaran Siswa
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Pencatatan kasus, pembinaan bimbingan konseling (BK), serta koordinasi otomatis ke Wali Kelas & Orang Tua.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenSuratPerjanjian()}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-indigo-950 text-xs font-black rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer border border-amber-300"
              title="Cetak Surat Pernyataan / Perjanjian Tidak Mengulangi Pelanggaran"
            >
              <Scroll className="w-4 h-4 text-indigo-950" />
              <span>Cetak Surat Pernyataan / Perjanjian</span>
            </button>

            <button
              onClick={() => setSubTab('input')}
              className="px-3 py-2 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Input Pelanggaran</span>
            </button>

            <button
              onClick={() => setSubTab('input_positif')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>+ Remisi Poin</span>
            </button>

            <button
              onClick={() => handleOpenSuratPeringatan()}
              className="px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer border border-rose-500/80"
              title="Cetak Surat Peringatan (SP 1, SP 2, SP 3)"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Cetak Surat SP</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={handlePrintFullReport}
              className="px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer border border-indigo-700/60"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Kasus</p>
            <p className="text-lg font-black text-slate-900 leading-tight">{totalViolations} <span className="text-xs font-bold text-slate-500">Pelanggaran</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Apresiasi & Remisi</p>
            <p className="text-lg font-black text-emerald-700 leading-tight">{totalPositiveDeeds} <span className="text-xs font-bold text-emerald-600">Aksi (-{totalPositivePointsReduced}pt)</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Poin Net</p>
            <p className="text-lg font-black text-amber-600 leading-tight">{totalPointsCount} <span className="text-xs font-bold text-amber-500">Poin</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kasus Berat / Ortud</p>
            <p className="text-lg font-black text-rose-600 leading-tight">{severeCases} <span className="text-xs font-bold text-rose-400">Siswa</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai / Ditangani</p>
            <p className="text-lg font-black text-blue-600 leading-tight">{resolvedCases} <span className="text-xs font-bold text-blue-500">Kasus</span></p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSubTab('daftar')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'daftar'
                ? 'bg-indigo-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Riwayat Pelanggaran & Apresiasi ({violations.length})</span>
          </button>

          <button
            onClick={() => setSubTab('rekap_siswa')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'rekap_siswa'
                ? 'bg-indigo-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Akumulasi Poin Siswa Per Kelas</span>
          </button>

          <button
            onClick={() => setSubTab('input')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              subTab === 'input'
                ? 'bg-amber-400 text-indigo-950 font-black shadow-sm'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-950" />
            <span>+ Form Pelanggaran BK</span>
          </button>

          <button
            onClick={() => setSubTab('input_positif')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              subTab === 'input_positif'
                ? 'bg-emerald-600 text-white font-black shadow-sm'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Form Penghapusan / Remisi Poin</span>
          </button>

          <button
            onClick={() => handleOpenSuratPeringatan()}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300"
            title="Cetak Surat Peringatan (SP 1, SP 2, SP 3)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cetak Surat SP (1, 2, 3)</span>
          </button>

          <button
            onClick={() => handleOpenSuratPerjanjian()}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-700" />
            <span>Cetak Surat Pernyataan / Perjanjian</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DAFTAR & RIWAYAT PELANGGARAN */}
      {subTab === 'daftar' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4 p-5">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, jenis, atau kronologi..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {/* Filter Kelas */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Kelas:</span>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              {/* Filter Kategori */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Kategori:</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Ringan">Ringan (5-10pt)</option>
                  <option value="Sedang">Sedang (15-30pt)</option>
                  <option value="Berat">Berat (&gt;30pt)</option>
                  <option value="Apresiasi">Apresiasi (Penghapusan Poin)</option>
                </select>
              </div>

              {/* Filter Status */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Baru">Baru Tercatat</option>
                  <option value="Proses Bimbingan">Proses Bimbingan BK</option>
                  <option value="Panggilan Orang Tua">Panggilan Orang Tua</option>
                  <option value="Telah Ditangani">Telah Ditangani</option>
                </select>
              </div>
            </div>

          </div>

          {/* Cards List of Violations */}
          {filteredViolations.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-extrabold text-sm text-slate-700">Tidak Ada Catatan Pelanggaran Terdata</h4>
              <p className="text-xs text-slate-400 mt-1">
                Siswa tidak memiliki catatan pelanggaran yang sesuai dengan filter pilihan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredViolations.map(v => {
                const isPositive = v.category === 'Apresiasi' || v.points < 0;

                const categoryBadge = isPositive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                  : v.category === 'Berat'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : v.category === 'Sedang'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300';

                const statusBadge =
                  v.status === 'Telah Ditangani'
                    ? 'bg-emerald-100 text-emerald-800'
                    : v.status === 'Panggilan Orang Tua'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : v.status === 'Proses Bimbingan'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-indigo-100 text-indigo-900';

                return (
                  <div key={v.id} className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-3 transition ${isPositive ? 'border-emerald-200/90 hover:border-emerald-400 bg-emerald-50/10' : 'border-slate-200/90 hover:border-indigo-300'}`}>
                    
                    {/* Card Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-900 text-white font-black text-[10px] px-2 py-0.5 rounded">
                            Kelas {v.className}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{v.date}</span>
                        </div>
                        <h4 className="font-black text-sm text-slate-900 mt-1">{v.studentName}</h4>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${categoryBadge}`}>
                          {v.points < 0 ? `${v.points} Poin` : `+${v.points} Poin`} ({v.category})
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${statusBadge}`}>
                          {v.status}
                        </span>
                      </div>
                    </div>

                    {/* Violation Type / Positive Action & Chronology */}
                    <div className="space-y-1">
                      <p className={`text-xs font-black flex items-center ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isPositive && <Sparkles className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />}
                        <span>{v.violationType}</span>
                      </p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                        "{v.description}"
                      </p>
                    </div>

                    {/* Follow up / BK Notes */}
                    {v.followUpNote && (
                      <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-extrabold block text-[11px] text-amber-900">Catatan Bimbingan BK:</strong>
                          <span>{v.followUpNote}</span>
                        </div>
                      </div>
                    )}

                    {/* Footer Info & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>Pelapor: <strong className="text-slate-700">{v.reporterName}</strong></span>

                      <div className="flex items-center space-x-2">
                        {v.category !== 'Apresiasi' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const level: SPLevel = v.category === 'Berat' ? 'SP_3' : v.category === 'Sedang' ? 'SP_2' : 'SP_1';
                                handleOpenSuratPeringatan(v.studentId, level);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg font-black transition flex items-center space-x-1 cursor-pointer text-[11px]"
                              title="Cetak Surat Peringatan (SP 1, SP 2, SP 3)"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Cetak SP</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSuratPerjanjian(v.studentId, v.id)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer text-[11px]"
                              title="Cetak Surat Pernyataan / Perjanjian Tidak Mengulangi Pelanggaran"
                            >
                              <Scroll className="w-3 h-3 text-amber-700" />
                              <span>Surat Perjanjian</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer text-[11px]"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Update Status / BK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingViolation(v)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Catatan Pelanggaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 2: AKUMULASI POIN SISWA PER KELAS */}
      {subTab === 'rekap_siswa' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Akumulasi Poin Kedisiplinan Per Siswa</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar peringkat poin pelanggaran siswa untuk pemantauan peringatan SP1, SP2, dan panggilan orang tua.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Pilih Kelas:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of Student Point Totals */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 font-black uppercase text-slate-600 tracking-wider text-[11px] border-b border-slate-200">
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3 w-16 text-center">Kelas</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center">Pelanggaran</th>
                  <th className="p-3 text-center">Apresiasi/Remisi</th>
                  <th className="p-3 text-center">Poin Net</th>
                  <th className="p-3 text-center">Status Kedisiplinan</th>
                  <th className="p-3 text-center">Aksi Poin Positif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-medium">
                {displayedStudentSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada data siswa.
                    </td>
                  </tr>
                ) : (
                  displayedStudentSummaries.map((item, idx) => {
                    const pts = item.totalPoints;
                    
                    let statusLabel = 'Disiplin / Aman';
                    let statusStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    if (pts >= 75) {
                      statusLabel = 'Panggilan Ortud & SP II (Kritis)';
                      statusStyle = 'bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse';
                    } else if (pts >= 50) {
                      statusLabel = 'Surat Peringatan I (SP1)';
                      statusStyle = 'bg-orange-100 text-orange-900 border-orange-300 font-extrabold';
                    } else if (pts >= 20) {
                      statusLabel = 'Peringatan BK II';
                      statusStyle = 'bg-amber-100 text-amber-900 border-amber-300';
                    } else if (pts > 0) {
                      statusLabel = 'Peringatan Ringan';
                      statusStyle = 'bg-blue-100 text-blue-900 border-blue-300';
                    }

                    return (
                      <tr key={item.student.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 text-center font-bold text-indigo-900 bg-slate-50/50">{item.student.className}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.student.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NISN: {item.student.nisn || '-'}</div>
                        </td>
                        <td className="p-3 text-center font-extrabold text-slate-700">
                          {item.count} Kasus
                        </td>
                        <td className="p-3 text-center">
                          {item.rewardPoints > 0 ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>-{item.rewardPoints} Poin</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full font-black text-xs ${
                            pts >= 50 ? 'bg-rose-600 text-white' : pts >= 20 ? 'bg-amber-500 text-white' : pts > 0 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                          }`}>
                            {pts} Poin
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[11px] border ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {item.totalPoints > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const suggestedLevel: SPLevel = item.totalPoints >= 60 ? 'SP_3' : item.totalPoints >= 30 ? 'SP_2' : 'SP_1';
                                    handleOpenSuratPeringatan(item.student.id, suggestedLevel);
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 font-black rounded-lg transition text-[11px] flex items-center space-x-1 cursor-pointer"
                                  title="Cetak Surat Peringatan (SP 1, SP 2, SP 3) untuk siswa ini"
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Cetak SP</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSuratPerjanjian(item.student.id)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg transition text-[11px] flex items-center space-x-1 cursor-pointer"
                                  title="Cetak Surat Pernyataan / Perjanjian Tidak Mengulangi Pelanggaran"
                                >
                                  <Scroll className="w-3 h-3 text-amber-700" />
                                  <span>Surat Perjanjian</span>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPosativFormForStudent(item.student.id, item.student.className)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg shadow-2xs transition text-[11px] flex items-center space-x-1 cursor-pointer"
                              title="Input Penghapusan/Remisi Poin Siswa"
                            >
                              <Sparkles className="w-3 h-3 text-white" />
                              <span>+ Remisi</span>
                            </button>
                          </div>
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

      {/* SUB-TAB: FORM INPUT PERILAKU BAIK / REMISI POIN POSITIF */}
      {subTab === 'input_positif' && (
        <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-emerald-100 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Form Penghapusan Poin / Apresiasi Perilaku Positif Siswa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input perilaku baik, prestasi, hafalan, atau sikap terpuji siswa untuk mengurangi poin pelanggaran disiplin.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitPosForm} className="space-y-4 text-xs font-medium">
            
            {/* Kelas & Siswa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Kelas:</label>
                <select
                  value={posClass}
                  onChange={e => {
                    setPosClass(e.target.value);
                    setPosStudentId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-extrabold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {classList.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Nama Siswa:*</label>
                <select
                  value={posStudentId}
                  onChange={e => setPosStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Siswa Kelas {posClass} --</option>
                  {posStudentOptions.map(st => (
                    <option key={st.id} value={st.id}>
                      Absen #{st.rollNo} - {st.name} ({st.nisn || 'No NISN'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tanggal & Penginput */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Tanggal Apresiasi:</label>
                <input
                  type="date"
                  value={posDate}
                  onChange={e => setPosDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Petugas / Penginput (BK/BP/Wakasek):</label>
                <input
                  type="text"
                  value={posReporter}
                  onChange={e => setPosReporter(e.target.value)}
                  placeholder="Nama Penginput"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Template Aksi Positif */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Pilih Jenis Prestasi / Perilaku Positif Siswa:</label>
              <select
                value={posPresetIndex}
                onChange={e => handlePosPresetChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-extrabold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {PREDEFINED_POSITIVE_ACTIONS.map((preset, idx) => (
                  <option key={idx} value={idx}>
                    [REMISI {preset.points}pt] {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {PREDEFINED_POSITIVE_ACTIONS[posPresetIndex].label === 'Lainnya (Custom Pengurangan Poin Positif)' && (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nama Perilaku Positif Custom:</label>
                <input
                  type="text"
                  value={posCustomType}
                  onChange={e => setPosCustomType(e.target.value)}
                  placeholder="Ketikkan nama perilaku/prestasi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Bobot Poin Pengurang */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-black text-emerald-900 text-xs flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Jumlah Poin yang Dikurangkan (Remisi):</span>
                </label>
                <span className="font-black text-emerald-700 text-sm">-{posPoints} Poin</span>
              </div>
              <input
                type="number"
                min={1}
                max={100}
                value={posPoints}
                onChange={e => setPosPoints(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 font-black text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-emerald-800">
                Poin ini akan langsung mengurangi akumulasi total poin pelanggaran siswa secara otomatis.
              </p>
            </div>

            {/* Deskripsi Aksi Positif */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Deskripsi / Keterangan Perilaku Baik:*</label>
              <textarea
                rows={3}
                value={posDescription}
                onChange={e => setPosDescription(e.target.value)}
                required
                placeholder="Tuliskan penjelasan prestasi, hafalan, atau perilaku terpuji yang dilakukan siswa..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-normal text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Catatan Apresiasi BK */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Catatan Apresiasi & Bimbingan BK:</label>
              <textarea
                rows={2}
                value={posFollowUp}
                onChange={e => setPosFollowUp(e.target.value)}
                placeholder="Misal: Diberikan sertifikat penghargaan dan pengurangan 15 poin pelanggaran..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-normal text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSubTab('daftar')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Simpan Apresiasi & Remisi Poin</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* SUB-TAB 3: INPUT PELANGGARAN BARU (FORM BK/BP) */}
      {subTab === 'input' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              <span>Form Input Catatan Pelanggaran Siswa (BK / BK / Kesiswaan)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Setiap catatan yang disimpan akan terhubung langsung ke Wali Kelas & Orang Tua secara transparan.
            </p>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-medium">
            
            {/* Kelas & Siswa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Kelas:</label>
                <select
                  value={formClass}
                  onChange={e => {
                    setFormClass(e.target.value);
                    setFormStudentId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-extrabold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {classList.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Nama Siswa:*</label>
                <select
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Siswa Kelas {formClass} --</option>
                  {formStudentOptions.map(st => (
                    <option key={st.id} value={st.id}>
                      Absen #{st.rollNo} - {st.name} ({st.nisn || 'No NISN'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tanggal & Pelapor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Tanggal Kejadian:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Petugas / Pelapor (BK/BP/Guru):</label>
                <input
                  type="text"
                  value={formReporter}
                  onChange={e => setFormReporter(e.target.value)}
                  placeholder="Nama Penginput / Tim Kedisiplinan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Input Manual Jenis Pelanggaran */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Isi Jenis Pelanggaran:*</label>
              <input
                type="text"
                value={formViolationType}
                onChange={e => setFormViolationType(e.target.value)}
                required
                placeholder="Ketikkan jenis pelanggaran (contoh: Terlambat Masuk Sekolah, Merokok, dll)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Poin & Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
              <div className="space-y-1.5">
                <label className="font-extrabold text-indigo-900">Bobot Poin Pelanggaran:</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formPoints}
                  onChange={e => setFormPoints(Number(e.target.value))}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-1.5 font-black text-rose-600 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-indigo-900">Tingkat Kategori:</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as any)}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 font-black text-xs text-indigo-900 cursor-pointer"
                >
                  <option value="Ringan">Ringan (1 - 10 Poin)</option>
                  <option value="Sedang">Sedang (11 - 30 Poin)</option>
                  <option value="Berat">Berat (&gt;30 Poin)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-indigo-900">Status Penanganan Awal:</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as any)}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 font-black text-xs text-indigo-900 cursor-pointer"
                >
                  <option value="Baru">Baru Tercatat</option>
                  <option value="Proses Bimbingan">Proses Bimbingan BK</option>
                  <option value="Panggilan Orang Tua">Panggilan Orang Tua</option>
                  <option value="Telah Ditangani">Telah Ditangani</option>
                </select>
              </div>
            </div>

            {/* Deskripsi Kronologi */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Deskripsi / Kronologi Kejadian:*</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                required
                placeholder="Tuliskan lokasi, saksi, atau kronologi singkat terjadinya pelanggaran..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-normal text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Catatan Tindak Lanjut BK */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Catatan Bimbingan & Tindak Lanjut BK/BP (Opsional):</label>
              <textarea
                rows={2}
                value={formFollowUp}
                onChange={e => setFormFollowUp(e.target.value)}
                placeholder="Misal: Sudah diberikan sanksi peringatan lisan dan diminta membuat surat pernyataan..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-normal text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSubTab('daftar')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 rounded-xl font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4 text-indigo-950" />
                <span>Simpan Catatan Pelanggaran</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* EDIT / FOLLOW UP MODAL */}
      {editingViolation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900">Update Status & Bimbingan BK</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingViolation.studentName} (Kelas {editingViolation.className})</p>
              </div>
              <button
                onClick={() => setEditingViolation(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-black text-rose-700 block">{editingViolation.violationType} (+{editingViolation.points} Poin)</span>
                <p className="text-slate-600 italic">"{editingViolation.description}"</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Status Penanganan Terkini:</label>
                <select
                  value={modalStatus}
                  onChange={e => setModalStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                >
                  <option value="Baru">Baru Tercatat</option>
                  <option value="Proses Bimbingan">Proses Bimbingan BK</option>
                  <option value="Panggilan Orang Tua">Panggilan Orang Tua</option>
                  <option value="Telah Ditangani">Telah Ditangani</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Catatan Bimbingan / Hasil Tindak Lanjut:</label>
                <textarea
                  rows={3}
                  value={modalFollowUp}
                  onChange={e => setModalFollowUp(e.target.value)}
                  placeholder="Tuliskan hasil konseling BK atau respon orang tua..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800"
                ></textarea>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const sId = editingViolation.studentId;
                  const vId = editingViolation.id;
                  setEditingViolation(null);
                  handleOpenSuratPerjanjian(sId, vId);
                }}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Cetak Lembar Surat Pernyataan / Perjanjian Tidak Mengulangi Pelanggaran"
              >
                <Scroll className="w-3.5 h-3.5 text-amber-700" />
                <span>Cetak Surat Perjanjian Siswa</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingViolation(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveModal}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PELANGGARAN */}
      {deletingViolation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Catatan Pelanggaran</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{deletingViolation.studentName} ({deletingViolation.className})</p>
              <p className="text-rose-700 font-semibold">{deletingViolation.violationType} (+{deletingViolation.points} Poin)</p>
              <p className="text-slate-500 italic">"{deletingViolation.description}"</p>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus data pelanggaran ini secara permanen dari sistem?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingViolation(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = deletingViolation.id;
                  setDeletingViolation(null);
                  await onDeleteViolation(targetId);
                }}
                className="px-4 py-2 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK SURAT PERNYATAAN / PERJANJIAN SISWA & ORANG TUA */}
      <SuratPerjanjianKesiswaanModal
        isOpen={showPerjanjianModal}
        onClose={() => {
          setShowPerjanjianModal(false);
          setPerjanjianStudentId('');
          setPerjanjianViolationId('');
        }}
        initialStudentId={perjanjianStudentId}
        initialViolationId={perjanjianViolationId}
        students={students}
        violations={violations}
        teachers={teachers}
        classList={classList}
        classWaliKelas={classWaliKelas}
        schoolOfficials={schoolOfficials}
        academicYear={academicYear}
        semester={semester}
      />

      {/* MODAL CETAK SURAT PERINGATAN (SP 1, SP 2, SP 3) */}
      <SuratPeringatanModal
        isOpen={showSpModal}
        onClose={() => {
          setShowSpModal(false);
          setSpStudentId('');
        }}
        initialStudentId={spStudentId}
        initialSpLevel={spLevel}
        students={students}
        violations={violations}
        teachers={teachers}
        classList={classList}
        classWaliKelas={classWaliKelas}
        schoolOfficials={schoolOfficials}
        academicYear={academicYear}
        semester={semester}
      />

    </div>
  );
};

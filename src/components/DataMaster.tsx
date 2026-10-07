import React, { useState, useEffect } from 'react';
import { Teacher, Subject, Student, SchoolOfficials, ClassWaliKelasMap, PaymentTransaction } from '../types';
import {
  Database,
  Search,
  UserCheck,
  BookOpen,
  Users,
  Plus,
  Trash2,
  FileSpreadsheet,
  X,
  AlertTriangle,
  UserPlus,
  BookPlus,
  Pencil,
  UserCog,
  ShieldCheck,
  Award,
  Save,
  CheckCircle2,
  MessageCircle,
  WalletCards,
  KeyRound,
  Upload,
  Download,
  RotateCcw,
  ArrowRightLeft,
  RefreshCw,
  Printer,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  PhoneCall,
  MapPin,
  Heart,
  Lock
} from 'lucide-react';
import { exportToCSV, exportStudentsToExcel, downloadStudentExcelTemplate } from '../utils/export';
import { ImportStudentsModal } from './ImportStudentsModal';
import { DeleteAllStudentsModal } from './DeleteAllStudentsModal';
import { BukuIndukModal } from './BukuIndukModal';
import { BukuIndukPrintModal } from './BukuIndukPrintModal';
import { BukuIndukRegisterPrintModal } from './BukuIndukRegisterPrintModal';

interface DataMasterProps {
  teachers: Teacher[];
  subjects: Subject[];
  students: Student[];
  classList: string[];
  schoolOfficials?: SchoolOfficials;
  classWaliKelas?: ClassWaliKelasMap;
  schoolName?: string;
  payments?: PaymentTransaction[];
  onSyncPayments?: () => Promise<any> | any;
  onResyncAttendance?: () => { updatedCount: number; totalSessions: number } | void;
  onUpdateSchoolOfficials?: (officials: SchoolOfficials) => void;
  onUpdateClassWaliKelas?: (mapping: ClassWaliKelasMap) => void;
  onAddTeacher?: (teacher: Teacher) => void;
  onEditTeacher?: (teacher: Teacher) => void;
  onDeleteTeacher?: (id: string) => void;
  onAddSubject?: (subject: Subject) => void;
  onEditSubject?: (subject: Subject) => void;
  onDeleteSubject?: (id: string) => void;
  onAddStudent?: (student: Student) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (id: string) => void;
  onBulkSaveStudents?: (students: Student[]) => void;
  onDeleteAllStudents?: (classFilter?: string) => void;
  onResetDefaultStudents?: () => void;
}

export const DataMaster: React.FC<DataMasterProps> = ({
  teachers,
  subjects,
  students,
  classList,
  schoolOfficials,
  classWaliKelas,
  schoolName = 'Madrasah',
  payments = [],
  onSyncPayments,
  onResyncAttendance,
  onUpdateSchoolOfficials,
  onUpdateClassWaliKelas,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onBulkSaveStudents,
  onDeleteAllStudents,
  onResetDefaultStudents
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'guru' | 'mapel' | 'siswa' | 'pejabat'>('guru');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Excel Import & Delete All Modals
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [isDeleteAllStudentsOpen, setIsDeleteAllStudentsOpen] = useState(false);

  // Pejabat form state
  const [kepalaSekolahName, setKepalaSekolahName] = useState(schoolOfficials?.kepalaSekolah.name || 'Dra. Hj. Nurjanah, M.Pd');
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState(schoolOfficials?.kepalaSekolah.nip || '197208151998032001');
  
  const [kesiswaanName, setKesiswaanName] = useState(schoolOfficials?.kesiswaan.name || 'M. Sholihin, SE');
  const [kesiswaanNip, setKesiswaanNip] = useState(schoolOfficials?.kesiswaan.nip || '85780');

  const [kurikulumName, setKurikulumName] = useState(schoolOfficials?.kurikulum.name || 'Agustiani, S.Pd');
  const [kurikulumNip, setKurikulumNip] = useState(schoolOfficials?.kurikulum.nip || '85781');

  const [bendaharaName, setBendaharaName] = useState(schoolOfficials?.bendahara?.name || 'Siti Rahmawati, S.E.');
  const [bendaharaNip, setBendaharaNip] = useState(schoolOfficials?.bendahara?.nip || '85792');
  const [bendaharaKodeUnik, setBendaharaKodeUnik] = useState(schoolOfficials?.bendahara?.kodeUnik || 'BENDAHARA2026');

  // Class Wali Kelas local map state
  const [localWaliKelas, setLocalWaliKelas] = useState<ClassWaliKelasMap>(classWaliKelas || {});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingPayments, setIsSyncingPayments] = useState(false);
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);

  const handleTriggerSyncAttendance = async () => {
    if (!onResyncAttendance) return;
    setIsSyncingAttendance(true);
    try {
      const res = onResyncAttendance();
      if (res && typeof res === 'object') {
        setToastMessage(`Sinkronisasi presensi selesai: ${res.updatedCount} dari ${res.totalSessions} sesi absensi berhasil dihubungkan ke data siswa.`);
      } else {
        setToastMessage('Sinkronisasi presensi siswa berhasil dijalankan.');
      }
      setTimeout(() => setToastMessage(null), 5000);
    } catch (e) {
      console.error(e);
      setToastMessage('Gagal menyinkronkan presensi.');
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  const handleTriggerSyncPayments = async () => {
    setIsSyncingPayments(true);
    try {
      if (onSyncPayments) {
        const res = await onSyncPayments();
        setToastMessage(`Sinkronisasi selesai: ${res?.syncedCount || 0} riwayat pembayaran berhasil dihubungkan ke data siswa.`);
      } else {
        setToastMessage('Sinkronisasi pembayaran berhasil dijalankan.');
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingPayments(false);
    }
  };

  useEffect(() => {
    if (schoolOfficials) {
      setKepalaSekolahName(schoolOfficials.kepalaSekolah.name);
      setKepalaSekolahNip(schoolOfficials.kepalaSekolah.nip);
      setKesiswaanName(schoolOfficials.kesiswaan.name);
      setKesiswaanNip(schoolOfficials.kesiswaan.nip);
      setKurikulumName(schoolOfficials.kurikulum.name);
      setKurikulumNip(schoolOfficials.kurikulum.nip);
      if (schoolOfficials.bendahara) {
        setBendaharaName(schoolOfficials.bendahara.name);
        setBendaharaNip(schoolOfficials.bendahara.nip);
        setBendaharaKodeUnik(schoolOfficials.bendahara.kodeUnik || 'BENDAHARA2026');
      }
    }
  }, [schoolOfficials]);

  useEffect(() => {
    if (classWaliKelas) {
      setLocalWaliKelas(classWaliKelas);
    }
  }, [classWaliKelas]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveOfficials = () => {
    const updated: SchoolOfficials = {
      ...schoolOfficials,
      kepalaSekolah: { 
        ...schoolOfficials?.kepalaSekolah,
        name: kepalaSekolahName.trim(), 
        nip: kepalaSekolahNip.trim() 
      },
      kesiswaan: { 
        ...schoolOfficials?.kesiswaan,
        name: kesiswaanName.trim(), 
        nip: kesiswaanNip.trim() 
      },
      kurikulum: { 
        ...schoolOfficials?.kurikulum,
        name: kurikulumName.trim(), 
        nip: kurikulumNip.trim() 
      },
      bendahara: {
        ...schoolOfficials?.bendahara,
        name: bendaharaName.trim(),
        nip: bendaharaNip.trim()
      }
    };
    onUpdateSchoolOfficials?.(updated);
    showToast('Data Pejabat Madrasah (Kepala Sekolah, Kesiswaan, Kurikulum, Bendahara) berhasil diperbarui!');
  };

  const handleSaveClassWaliKelas = () => {
    onUpdateClassWaliKelas?.(localWaliKelas);
    showToast('Pengaturan Wali Kelas untuk semua rombel berhasil disimpan!');
  };

  // Add / Edit Modals state
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherNip, setTeacherNip] = useState('');

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCategory, setSubjectCategory] = useState<'Umum' | 'Umat' | 'Lokal' | 'Kedinasan'>('Umum');

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<Student | null>(null);
  const [isRegisterPrintOpen, setIsRegisterPrintOpen] = useState(false);

  // Delete confirm modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'guru' | 'mapel' | 'siswa';
    id: string;
    name: string;
  } | null>(null);

  // Filtered lists
  const filteredTeachers = teachers.filter(
    t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.nip.includes(searchQuery)
  );

  const filteredSubjects = subjects.filter(
    s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      s.name.toLowerCase().includes(query) || 
      s.rollNo.toString().includes(query) ||
      (s.kodeUnik && s.kodeUnik.toLowerCase().includes(query)) ||
      (s.nis && s.nis.toLowerCase().includes(query)) ||
      (s.nisn && s.nisn.toLowerCase().includes(query)) ||
      (s.nik && s.nik.toLowerCase().includes(query)) ||
      (s.namaAyah && s.namaAyah.toLowerCase().includes(query)) ||
      (s.namaIbu && s.namaIbu.toLowerCase().includes(query)) ||
      (s.alamat && s.alamat.toLowerCase().includes(query));

    const matchesClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
    const matchesGender = selectedGenderFilter === 'ALL' || s.gender === selectedGenderFilter;
    const matchesKategori = selectedKategoriFilter === 'ALL' || 
      (selectedKategoriFilter === 'Yatim' && (s.statusKeluarga === 'Yatim' || s.kategoriSosial === 'Yatim')) ||
      (selectedKategoriFilter === 'Duafa' && (s.kategoriSosial === 'Duafa' || s.statusKeluarga === 'Duafa')) ||
      (selectedKategoriFilter === 'KIP' && (Boolean(s.noKip) || Boolean(s.noKks) || Boolean(s.noPkh) || s.kategoriSosial === 'KIP / PIP')) ||
      (selectedKategoriFilter === 'Reguler' && (!s.kategoriSosial || s.kategoriSosial === 'Reguler'));
    const matchesStatus = selectedStatusFilter === 'ALL' || (s.statusSiswa || 'Aktif') === selectedStatusFilter;

    return matchesSearch && matchesClass && matchesGender && matchesKategori && matchesStatus;
  });

  const handleExportTeachersCSV = () => {
    const rows = [
      [`DAFTAR GURU ${schoolName.toUpperCase()}`],
      ['No', 'Nama Guru', 'NIP'],
      ...teachers.map((t, idx) => [idx + 1, t.name, t.nip])
    ];
    exportToCSV(`Data_Guru_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, rows);
  };

  const handleExportStudentsCSV = () => {
    const rows = [
      [`BUKU INDUK PESERTA DIDIK ${schoolName.toUpperCase()}`],
      ['No', 'Kelas', 'No Absen', 'NIS', 'NISN', 'Kode Unik', 'Nama Siswa', 'L/P', 'NIK', 'Nama Ayah', 'Nama Ibu', 'No HP Ortu', 'Alamat', 'Kategori'],
      ...students.map((s, idx) => [
        idx + 1,
        s.className,
        s.rollNo,
        s.nis || '-',
        s.nisn || '-',
        s.kodeUnik || '-',
        s.name,
        s.gender || '-',
        s.nik || '-',
        s.namaAyah || '-',
        s.namaIbu || '-',
        s.parentPhone || s.phone || '-',
        s.alamat || '-',
        s.kategoriSosial || (s.statusKeluarga === 'Yatim' ? 'Yatim' : 'Reguler')
      ])
    ];
    exportToCSV(`Buku_Induk_Siswa_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, rows);
  };

  const handleExportStudentsExcel = () => {
    exportStudentsToExcel(students, schoolName);
  };

  const handleImportStudents = (importedStudents: Student[], mode: 'merge_key' | 'append' | 'replace_class' | 'replace_all') => {
    let updatedList: Student[] = [];

    if (mode === 'replace_all') {
      updatedList = [...importedStudents];
    } else if (mode === 'replace_class') {
      const importedClasses = new Set(importedStudents.map(s => s.className));
      const remaining = students.filter(s => !importedClasses.has(s.className));
      updatedList = [...remaining, ...importedStudents];
    } else if (mode === 'merge_key') {
      // Smart Merge / Upsert: Match existing students by ID (resolved by NISN / Name)
      const importedMapById = new Map<string, Student>();
      importedStudents.forEach(s => importedMapById.set(s.id, s));

      const updatedExisting = students.map(st => {
        if (importedMapById.has(st.id)) {
          const imported = importedMapById.get(st.id)!;
          importedMapById.delete(st.id);
          return {
            ...st,
            ...imported,
            id: st.id, // preserve existing ID so historical attendance, grades, and payments remain 100% linked
            kodeUnik: st.kodeUnik || imported.kodeUnik,
            rollNo: st.rollNo || imported.rollNo
          };
        }
        return st;
      });

      // Any remaining in importedMapById are truly new students to append
      const trulyNew = Array.from(importedMapById.values());
      updatedList = [...updatedExisting, ...trulyNew];
    } else {
      // Append mode: merge without duplicate IDs
      const existingIds = new Set(students.map(s => s.id));
      const newItems = importedStudents.map((s, idx) => {
        if (existingIds.has(s.id)) {
          return { ...s, id: `${s.id}-${Date.now().toString().slice(-4)}-${idx + 1}` };
        }
        return s;
      });
      updatedList = [...students, ...newItems];
    }

    if (onBulkSaveStudents) {
      onBulkSaveStudents(updatedList);
    }
    setToastMessage(`Berhasil memproses ${importedStudents.length} data siswa (Format EMIS 4.0 / Excel) ke database ${schoolName}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleDeleteAllStudentsConfirm = (classFilter?: string) => {
    if (onDeleteAllStudents) {
      onDeleteAllStudents(classFilter);
    }
    setToastMessage(
      classFilter
        ? `Berhasil menghapus seluruh data siswa di Kelas ${classFilter}!`
        : `Berhasil menghapus seluruh data siswa di ${schoolName}!`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Open Add/Edit Modal Handlers
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherNip('');
    setIsAddTeacherOpen(true);
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherName(teacher.name);
    setTeacherNip(teacher.nip === '-' ? '' : teacher.nip);
    setIsAddTeacherOpen(true);
  };

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectCode('');
    setSubjectName('');
    setSubjectCategory('Umum');
    setIsAddSubjectOpen(true);
  };

  const handleOpenEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectCode(subject.code);
    setSubjectName(subject.name);
    setSubjectCategory(subject.category || 'Umum');
    setIsAddSubjectOpen(true);
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setIsAddStudentOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsAddStudentOpen(true);
  };

  const handleSaveBukuInduk = (studentData: Student) => {
    if (editingStudent) {
      onEditStudent?.(studentData);
      setToastMessage(`Data Buku Induk siswa ${studentData.name} berhasil diperbarui!`);
    } else {
      onAddStudent?.(studentData);
      setToastMessage(`Siswa baru ${studentData.name} berhasil ditambahkan ke Buku Induk!`);
    }
    setTimeout(() => setToastMessage(null), 4000);
    setIsAddStudentOpen(false);
    setEditingStudent(null);
  };

  const handleSendWA = (student: Student) => {
    const code = student.kodeUnik || student.nisn || student.id;
    const message = `Assalamu'alaikum Wr. Wb.

Yth. Orang Tua / Wali Murid dari *${student.name}* (Kelas ${student.className})

Berikut adalah Kode Unik Akses Portal Orang Tua / Wali Murid untuk memantau absensi, nilai, dan catatan kedisiplinan siswa:

📌 *Nama Siswa:* ${student.name}
🏫 *Kelas:* ${student.className}
🔑 *Kode Unik Akses:* ${code}

Silakan masuk ke aplikasi pada menu *Portal Orang Tua* dan masukkan Kode Unik di atas.

Terima kasih.
Wassalamu'alaikum Wr. Wb.`;

    const encodedMessage = encodeURIComponent(message);
    let waUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

    if (student.parentPhone) {
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      if (cleanPhone) {
        waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
      }
    }

    window.open(waUrl, '_blank');
  };

  // Submit Handlers
  const handleAddTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;

    if (editingTeacher) {
      const updatedTeacher: Teacher = {
        ...editingTeacher,
        name: teacherName.trim(),
        nip: teacherNip.trim() || '-'
      };
      onEditTeacher?.(updatedTeacher);
    } else {
      const newTeacher: Teacher = {
        id: `t-${Date.now()}`,
        name: teacherName.trim(),
        nip: teacherNip.trim() || '-'
      };
      onAddTeacher?.(newTeacher);
    }

    setTeacherName('');
    setTeacherNip('');
    setEditingTeacher(null);
    setIsAddTeacherOpen(false);
  };

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim() || !subjectName.trim()) return;

    if (editingSubject) {
      const updatedSubject: Subject = {
        ...editingSubject,
        code: subjectCode.trim().toUpperCase(),
        name: subjectName.trim(),
        category: subjectCategory
      };
      onEditSubject?.(updatedSubject);
    } else {
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        code: subjectCode.trim().toUpperCase(),
        name: subjectName.trim(),
        category: subjectCategory
      };
      onAddSubject?.(newSubject);
    }

    setSubjectCode('');
    setSubjectName('');
    setSubjectCategory('Umum');
    setEditingSubject(null);
    setIsAddSubjectOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'guru') {
      onDeleteTeacher?.(deleteTarget.id);
    } else if (deleteTarget.type === 'mapel') {
      onDeleteSubject?.(deleteTarget.id);
    } else if (deleteTarget.type === 'siswa') {
      onDeleteStudent?.(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-xs border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pusat Master Data Sekolah</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              Data Master {schoolOfficials?.namaSekolah || schoolName || 'Madrasah'}
            </h2>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Kelola data Guru (NIP), Mata Pelajaran, Rombongan Belajar (Kelas), dan Buku Induk Siswa.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {activeSubTab === 'guru' && (
              <>
                <button
                  onClick={handleOpenAddTeacher}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Guru</span>
                </button>
                <button
                  onClick={handleExportTeachersCSV}
                  className="bg-indigo-800 hover:bg-indigo-700 text-indigo-100 font-bold px-3 py-1.5 rounded-md text-xs flex items-center space-x-1.5 border border-indigo-700 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Ekspor CSV</span>
                </button>
              </>
            )}

            {activeSubTab === 'mapel' && (
              <button
                onClick={handleOpenAddSubject}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mata Pelajaran</span>
              </button>
            )}

            {activeSubTab === 'siswa' && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleOpenAddStudent}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  title="Tambah Data Siswa Lengkap (Buku Induk)"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Siswa (Buku Induk)</span>
                </button>
                <button
                  onClick={() => setIsRegisterPrintOpen(true)}
                  className="bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 border border-indigo-700 transition cursor-pointer"
                  title="Cetak Buku Register Induk Siswa Rombel / Kelas"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Cetak Register Kelas</span>
                </button>
                <button
                  onClick={() => setIsImportExcelOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer border border-emerald-600"
                  title="Import Data Siswa dari Hasil Download EMIS 4.0 Kemenag atau Excel (.xlsx/.csv)"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Import Siswa (EMIS 4.0 / Excel)</span>
                </button>
                <button
                  onClick={handleTriggerSyncPayments}
                  disabled={isSyncingPayments}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  title="Hubungkan kembali riwayat pembayaran siswa yang telah diinput ulang"
                >
                  <ArrowRightLeft className={`w-3.5 h-3.5 ${isSyncingPayments ? 'animate-spin' : ''}`} />
                  <span>{isSyncingPayments ? 'Menyinkronkan...' : 'Sinkronkan Pembayaran'}</span>
                </button>
                {onResyncAttendance && (
                  <button
                    onClick={handleTriggerSyncAttendance}
                    disabled={isSyncingAttendance}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                    title="Hubungkan kembali riwayat absensi guru per pertemuan dengan data siswa saat ini"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAttendance ? 'animate-spin' : ''}`} />
                    <span>{isSyncingAttendance ? 'Menyinkronkan...' : 'Sinkronkan Presensi'}</span>
                  </button>
                )}
                <button
                  onClick={handleExportStudentsExcel}
                  className="bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 border border-teal-700 transition cursor-pointer"
                  title="Unduh Buku Induk Siswa Format Lengkap Excel .xlsx"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
                  <span>Ekspor Excel Lengkap</span>
                </button>
                <button
                  onClick={handleExportStudentsCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 border border-slate-700 transition cursor-pointer"
                  title="Unduh Buku Induk Siswa Format CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setIsDeleteAllStudentsOpen(true)}
                  className="bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 border border-rose-700/80 transition cursor-pointer"
                  title="Hapus Semua Siswa atau Berdasarkan Kelas"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  <span>Hapus Siswa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveSubTab('guru'); setSearchQuery(''); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'guru' ? 'bg-indigo-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4 text-indigo-300" />
          <span>Data Guru ({teachers.length})</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('mapel'); setSearchQuery(''); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'mapel' ? 'bg-indigo-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-300" />
          <span>Mata Pelajaran ({subjects.length})</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('siswa'); setSearchQuery(''); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'siswa' ? 'bg-indigo-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-300" />
          <span>Buku Induk Siswa ({students.length})</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('pejabat'); setSearchQuery(''); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'pejabat' ? 'bg-indigo-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserCog className="w-4 h-4 text-indigo-300" />
          <span>Wali Kelas & Pejabat</span>
        </button>
      </div>

      {/* STATISTIK RINGKAS BUKU INDUK SISWA */}
      {activeSubTab === 'siswa' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Total Peserta Didik</span>
              <Users className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {students.length} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
              <span className="text-indigo-600 font-bold">L: {students.filter(s => s.gender === 'L').length}</span>
              <span>•</span>
              <span className="text-pink-600 font-bold">P: {students.filter(s => s.gender === 'P').length}</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Status Yatim</span>
              <Heart className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-700 mt-1">
              {students.filter(s => s.statusKeluarga === 'Yatim' || s.kategoriSosial === 'Yatim').length} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Bebas/Prioritas Biaya Infaq
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Duafa & Keringanan</span>
              <HeartHandshake className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <div className="text-xl font-black text-teal-700 mt-1">
              {students.filter(s => s.kategoriSosial === 'Duafa' || s.statusKeluarga === 'Duafa').length} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Keringanan SPP / Infaq
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Bantuan KIP / PIP / PKH</span>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1">
              {students.filter(s => Boolean(s.noKip) || Boolean(s.noKks) || Boolean(s.noPkh) || s.kategoriSosial === 'KIP / PIP').length} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Terdaftar Program Bansos
            </div>
          </div>
        </div>
      )}

      {/* Search & Toolbar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'siswa' ? 'Cari nama, NIS, NISN, NIK, orang tua...' : `Cari di data ${activeSubTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {activeSubTab === 'siswa' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[10px] uppercase text-slate-400">Kelas:</span>
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas ({students.length})</option>
                {classList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[10px] uppercase text-slate-400">Gender:</span>
              <select
                value={selectedGenderFilter}
                onChange={e => setSelectedGenderFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua L/P</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[10px] uppercase text-slate-400">Kategori:</span>
              <select
                value={selectedKategoriFilter}
                onChange={e => setSelectedKategoriFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Reguler">Reguler</option>
                <option value="Yatim">Yatim</option>
                <option value="Duafa">Duafa</option>
                <option value="KIP">KIP / PIP</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content Table for Active SubTab */}

      {/* TAB 1: GURU */}
      {activeSubTab === 'guru' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Guru / Gelar</th>
                  <th className="py-2.5 px-3 w-48">NIP / Kode Guru</th>
                  <th className="py-2.5 px-3 text-center w-32">Status</th>
                  <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      Data guru tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-2 px-3 font-bold text-indigo-900 bg-indigo-50/60 rounded font-mono">{t.nip}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          Guru Aktif
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditTeacher(t)}
                            title="Edit Data Guru"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'guru', id: t.id, name: t.name })}
                            title="Hapus Data Guru"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* TAB 2: MATA PELAJARAN */}
      {activeSubTab === 'mapel' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 w-28">Kode Mapel</th>
                  <th className="py-2.5 px-3">Nama Mata Pelajaran</th>
                  <th className="py-2.5 px-3 text-center w-36">Kategori</th>
                  <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      Data mata pelajaran tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-black text-indigo-900 bg-indigo-50/60 rounded font-mono">{s.code}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{s.name}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {s.category || 'Umum'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditSubject(s)}
                            title="Edit Mata Pelajaran"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'mapel', id: s.id, name: s.name })}
                            title="Hapus Mata Pelajaran"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* TAB 3: BUKU INDUK SISWA (COMPREHENSIVE) */}
      {activeSubTab === 'siswa' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-20 text-center">Rombel</th>
                  <th className="py-3 px-3 w-14 text-center">Abs</th>
                  <th className="py-3 px-3 w-28">NIS / NISN</th>
                  <th className="py-3 px-3">Identitas Lengkap Siswa</th>
                  <th className="py-3 px-3">Data Orang Tua / Wali & Kontak</th>
                  <th className="py-3 px-3 text-center w-28">Kategori</th>
                  <th className="py-3 px-3 text-center w-24">Status</th>
                  <th className="py-3 px-3 text-center w-48">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Data Buku Induk siswa tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const isYatim = st.statusKeluarga === 'Yatim' || st.kategoriSosial === 'Yatim';
                    const isDuafa = st.kategoriSosial === 'Duafa' || st.statusKeluarga === 'Duafa';
                    const isKip = Boolean(st.noKip) || Boolean(st.noKks) || Boolean(st.noPkh) || st.kategoriSosial === 'KIP / PIP';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition align-middle">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {st.className}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-slate-700 font-mono">{st.rollNo}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-indigo-950 text-xs">
                            {st.nis || st.kodeUnik || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NISN: {st.nisn || '-'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0">
                              {st.gender === 'P' ? 'P' : 'L'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 uppercase">
                                {st.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {st.tempatLahir ? `${st.tempatLahir}, ` : ''}{st.tanggalLahir || '-'} {st.nik ? `• NIK: ${st.nik}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-800 text-[11px] font-semibold">
                            {st.namaAyah || st.namaIbu ? (
                              <span>Ayah: {st.namaAyah || '-'} | Ibu: {st.namaIbu || '-'}</span>
                            ) : (
                              <span className="text-slate-400">Belum diisi</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                            <PhoneCall className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{st.parentPhone || st.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isYatim ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">
                              Yatim
                            </span>
                          ) : isDuafa ? (
                            <span className="bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">
                              Duafa
                            </span>
                          ) : isKip ? (
                            <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">
                              KIP/PIP
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">
                              Reguler
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block">
                            {st.statusSiswa || 'Aktif'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setSelectedStudentForPrint(st)}
                              title="Cetak Lembar Buku Induk Siswa"
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition font-extrabold text-[11px] flex items-center space-x-1 cursor-pointer shrink-0"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak</span>
                            </button>
                            <button
                              onClick={() => handleSendWA(st)}
                              title="Kirim Kode Akses via WhatsApp"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-2xs font-extrabold text-[11px] flex items-center space-x-1 cursor-pointer shrink-0"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WA</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditStudent(st)}
                              title="Edit Data Buku Induk Siswa"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'siswa', id: st.id, name: st.name })}
                              title="Hapus Siswa dari Buku Induk"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* TAB 4: PENGATURAN WALI KELAS & PEJABAT */}
      {activeSubTab === 'pejabat' && (
        <div className="space-y-6">
          {toastMessage && (
            <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-md font-extrabold text-xs flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* SUB-SECTION 1: PENGATURAN NAMA WALI KELAS PER KELAS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-indigo-700" />
                  <span>Pengaturan Nama Wali Kelas Per Rombongan Belajar</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih dan tetapkan Guru sebagai Wali Kelas untuk masing-masing kelas binaan.
                </p>
              </div>
              <button
                onClick={handleSaveClassWaliKelas}
                className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Wali Kelas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classList.map(clsName => {
                const currentAssigneeName = localWaliKelas[clsName] || '';
                const assignedTeacherObj = teachers.find(t => t.name === currentAssigneeName);

                return (
                  <div key={clsName} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-indigo-950 text-white rounded-lg text-xs font-black">
                        Kelas {clsName}
                      </span>
                      {assignedTeacherObj && (
                        <span className="text-[10px] font-mono font-bold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                          NIP: {assignedTeacherObj.nip}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Wali Kelas:
                      </label>
                      <select
                        value={currentAssigneeName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocalWaliKelas(prev => ({ ...prev, [clsName]: val }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Pilih Guru Wali Kelas --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.nip !== '-' ? `NIP: ${t.nip}` : 'Non-NIP'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUB-SECTION 2: PENGATURAN PEJABAT MADRASAH */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-700" />
                  <span>Pengaturan Pejabat & Pimpinan Madrasah</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nama dan NIP pejabat ini akan tercetak pada lembar pengesahan, dokumen cetak rekap, dan laporan resmi.
                </p>
              </div>
              <button
                onClick={handleSaveOfficials}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Data Pejabat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Kepala Sekolah */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-950 font-black text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>1. Kepala Madrasah</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Kepala Sekolah:
                  </label>
                  <input
                    type="text"
                    value={kepalaSekolahName}
                    onChange={e => setKepalaSekolahName(e.target.value)}
                    placeholder="Contoh: Dra. Hj. Nurjanah, M.Pd"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah:
                  </label>
                  <input
                    type="text"
                    value={kepalaSekolahNip}
                    onChange={e => setKepalaSekolahNip(e.target.value)}
                    placeholder="Contoh: 197208151998032001"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kesiswaan */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-950 font-black text-xs">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>2. Waka Kesiswaan</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Kesiswaan & Gelar:
                  </label>
                  <input
                    type="text"
                    value={kesiswaanName}
                    onChange={e => setKesiswaanName(e.target.value)}
                    placeholder="Contoh: M. Sholihin, SE"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP / Kode Kesiswaan:
                  </label>
                  <input
                    type="text"
                    value={kesiswaanNip}
                    onChange={e => setKesiswaanNip(e.target.value)}
                    placeholder="Contoh: 85780"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kurikulum */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-950 font-black text-xs">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>3. Waka Kurikulum</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Kurikulum & Gelar:
                  </label>
                  <input
                    type="text"
                    value={kurikulumName}
                    onChange={e => setKurikulumName(e.target.value)}
                    placeholder="Contoh: Agustiani, S.Pd"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP / NUPTK Kurikulum:
                  </label>
                  <input
                    type="text"
                    value={kurikulumNip}
                    onChange={e => setKurikulumNip(e.target.value)}
                    placeholder="Contoh: 85781"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="mt-2 flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-medium">
                    <Lock className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Kode Login Kurikulum: Hanya diatur oleh Super Admin</span>
                  </div>
                </div>
              </div>

              {/* Bendahara */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center space-x-2 text-amber-950 font-black text-xs">
                  <WalletCards className="w-4 h-4 text-amber-600" />
                  <span>4. Bendahara Madrasah</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Bendahara:
                  </label>
                  <input
                    type="text"
                    value={bendaharaName}
                    onChange={e => setBendaharaName(e.target.value)}
                    placeholder="Contoh: Siti Rahmawati, S.E."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP Bendahara:
                  </label>
                  <input
                    type="text"
                    value={bendaharaNip}
                    onChange={e => setBendaharaNip(e.target.value)}
                    placeholder="Contoh: 85792"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kode Akses Login Bendahara:
                  </label>
                  <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Hanya diatur oleh Super Admin di Panel Admin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH / EDIT GURU */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
                </h3>
              </div>
              <button
                onClick={() => { setIsAddTeacherOpen(false); setEditingTeacher(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacherSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Guru & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dra. H. Siti Rahma, M.Pd"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP / Kode Guru
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 198503122010012003 atau Kode Guru"
                  value={teacherNip}
                  onChange={e => setTeacherNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddTeacherOpen(false); setEditingTeacher(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingTeacher ? 'Update Data Guru' : 'Simpan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH / EDIT MATA PELAJARAN */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <BookPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                </h3>
              </div>
              <button
                onClick={() => { setIsAddSubjectOpen(false); setEditingSubject(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Mapel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MTK, IPA, B.IND, AKD"
                  value={subjectCode}
                  onChange={e => setSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika, Akidah Akhlak"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Mapel
                </label>
                <select
                  value={subjectCategory}
                  onChange={e => setSubjectCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Umum">Umum (Nasional)</option>
                  <option value="Umat">Keagamaan / PAI</option>
                  <option value="Lokal">Muatan Lokal (Mulok)</option>
                  <option value="Kedinasan">Kedinasan / Khusus</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddSubjectOpen(false); setEditingSubject(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingSubject ? 'Update Mapel' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BUKU INDUK SISWA LENGKAP (TAMBAH / EDIT) */}
      <BukuIndukModal
        isOpen={isAddStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        classList={classList}
        schoolName={schoolName}
        onSave={handleSaveBukuInduk}
      />

      {/* MODAL 4: CETAK LEMBAR BUKU INDUK SISWA TUNGGAL */}
      <BukuIndukPrintModal
        isOpen={selectedStudentForPrint !== null}
        onClose={() => setSelectedStudentForPrint(null)}
        student={selectedStudentForPrint}
        schoolName={schoolName}
      />

      {/* MODAL 5: CETAK BUKU REGISTER INDUK KELAS / ROMBEL */}
      <BukuIndukRegisterPrintModal
        isOpen={isRegisterPrintOpen}
        onClose={() => setIsRegisterPrintOpen(false)}
        students={students}
        classList={classList}
        schoolName={schoolName}
      />

      {/* MODAL CONFIRM DELETE */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium mb-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Apakah Anda yakin ingin menghapus data {deleteTarget.type === 'guru' ? 'Guru' : deleteTarget.type === 'mapel' ? 'Mata Pelajaran' : 'Siswa'}: <strong className="text-slate-900">{deleteTarget.name}</strong>?
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL */}
      <ImportStudentsModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
        classList={classList}
        currentStudents={students}
        schoolName={schoolName}
        onImport={handleImportStudents}
      />

      {/* MODAL DELETE ALL STUDENTS */}
      <DeleteAllStudentsModal
        isOpen={isDeleteAllStudentsOpen}
        onClose={() => setIsDeleteAllStudentsOpen(false)}
        classList={classList}
        students={students}
        schoolName={schoolName}
        onDeleteAll={handleDeleteAllStudentsConfirm}
        onResetDefault={onResetDefaultStudents}
      />

    </div>
  );
};

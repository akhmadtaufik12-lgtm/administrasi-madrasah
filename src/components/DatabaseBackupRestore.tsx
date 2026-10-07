import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Clock,
  Trash2,
  Layers,
  FileCheck,
  RotateCcw,
  Sparkles,
  Server,
  Check,
  Info,
  Calendar,
  Users,
  Wallet,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  FileText,
  Building,
  ArrowDownCircle,
  Copy
} from 'lucide-react';
import {
  Student,
  Teacher,
  Subject,
  SchoolOfficials,
  ClassWaliKelasMap,
  AttendanceSession,
  GradeRecord,
  LessonPlan,
  StudentViolation,
  PaymentTransaction,
  CashDepositTransaction,
  TreasurerExpenseTransaction,
  FeeTariffSettings,
  StudentBillSettings,
  AdminSettings,
  TeachingSchedule,
  Announcement,
  SchoolId,
  DatabaseBackupData,
  DatabaseBackupCounts
} from '../types';
import {
  createDatabaseBackupObject,
  saveFullDatabaseToLocalStorage,
  getStoredDatabaseSnapshots,
  saveStoredDatabaseSnapshot,
  deleteStoredDatabaseSnapshot,
  getSchoolConfig
} from '../utils/storage';

interface DatabaseBackupRestoreProps {
  schoolId: SchoolId;
  schoolName: string;
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  schoolOfficials: SchoolOfficials;
  classWaliKelas: ClassWaliKelasMap;
  sessions: AttendanceSession[];
  grades: GradeRecord[];
  lessonPlans: LessonPlan[];
  violations: StudentViolation[];
  payments: PaymentTransaction[];
  cashDeposits: CashDepositTransaction[];
  treasurerExpenses: TreasurerExpenseTransaction[];
  feeTariffs?: FeeTariffSettings;
  studentBillSettings?: StudentBillSettings;
  adminSettings?: AdminSettings;
  schedules: TeachingSchedule[];
  announcements: Announcement[];
  academicSettings?: {
    academicYear: string;
    semester: string;
  };
  onRestoreFullDatabase: (data: DatabaseBackupData, mode: 'replace' | 'merge') => Promise<void>;
  onResetDatabase: (scope: 'all' | 'transactions_only') => Promise<void>;
}

export const DatabaseBackupRestore: React.FC<DatabaseBackupRestoreProps> = ({
  schoolId,
  schoolName,
  students,
  teachers,
  subjects,
  schoolOfficials,
  classWaliKelas,
  sessions,
  grades,
  lessonPlans,
  violations,
  payments,
  cashDeposits,
  treasurerExpenses,
  feeTariffs,
  studentBillSettings,
  adminSettings,
  schedules,
  announcements,
  academicSettings,
  onRestoreFullDatabase,
  onResetDatabase
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'snapshots' | 'reset'>('backup');
  const [backupScope, setBackupScope] = useState<'full' | 'finance' | 'academic' | 'master'>('full');
  const [includePrettyJson, setIncludePrettyJson] = useState(true);

  // Status & toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Restore states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<DatabaseBackupData | null>(null);
  const [fileParseError, setFileParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [restoreConfirmationText, setRestoreConfirmationText] = useState('');

  // Snapshots
  const [snapshots, setSnapshots] = useState<DatabaseBackupData[]>(() => getStoredDatabaseSnapshots(schoolId));
  const [snapshotNameInput, setSnapshotNameInput] = useState('');

  // Reset states
  const [resetScope, setResetScope] = useState<'all' | 'transactions_only'>('transactions_only');
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  // Auto refresh snapshots when schoolId changes
  useEffect(() => {
    setSnapshots(getStoredDatabaseSnapshots(schoolId));
  }, [schoolId]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Compile live stats
  const currentCounts: DatabaseBackupCounts = useMemo(() => ({
    students: students.length,
    teachers: teachers.length,
    subjects: subjects.length,
    sessions: sessions.length,
    grades: grades.length,
    lessonPlans: lessonPlans.length,
    violations: violations.length,
    payments: payments.length,
    cashDeposits: cashDeposits.length,
    treasurerExpenses: treasurerExpenses.length,
    schedules: schedules.length,
    announcements: announcements.length
  }), [
    students, teachers, subjects, sessions, grades, lessonPlans,
    violations, payments, cashDeposits, treasurerExpenses, schedules, announcements
  ]);

  const totalEntityCount = useMemo(() => {
    return Object.values(currentCounts).reduce((a, b) => a + b, 0);
  }, [currentCounts]);

  // Build live database backup data
  const buildLiveBackup = (type: 'full' | 'finance' | 'academic' | 'master' = backupScope): DatabaseBackupData => {
    return createDatabaseBackupObject(
      schoolId,
      {
        students,
        teachers,
        subjects,
        schoolOfficials,
        classWaliKelas,
        sessions,
        grades,
        lessonPlans,
        violations,
        payments,
        cashDeposits,
        treasurerExpenses,
        feeTariffs,
        studentBillSettings,
        adminSettings,
        schedules,
        announcements,
        academicSettings
      },
      type
    );
  };

  // Handle Download Backup JSON
  const handleDownloadBackup = () => {
    try {
      setIsProcessing(true);
      const backupData = buildLiveBackup(backupScope);
      const jsonString = includePrettyJson
        ? JSON.stringify(backupData, null, 2)
        : JSON.stringify(backupData);

      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const schoolTag = 'MTS_MANBAUL_ISLAM';
      const scopeTag = backupScope.toUpperCase();
      
      const fileName = `BACKUP_${schoolTag}_${scopeTag}_${dateStr}_${timeStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Database berhasil dicadangkan dan diunduh: ${fileName}`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal membuat file cadangan: ' + (err.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Select for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setFileParseError(null);
    setParsedBackupData(null);
    setRestoreConfirmationText('');

    if (!file.name.endsWith('.json')) {
      setFileParseError('Format file harus berupa file cadangan JSON (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Basic validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Struktur isi file JSON tidak valid.');
        }

        if (!parsed.metadata && !parsed.students && !parsed.teachers && !parsed.payments) {
          throw new Error('File ini bukan file cadangan database resmi dari aplikasi administrasi madrasah/sekolah.');
        }

        // Fill metadata fallback if missing
        if (!parsed.metadata) {
          parsed.metadata = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            schoolId,
            schoolName,
            generatedBy: 'Unknown File',
            type: 'full',
            counts: {
              students: parsed.students?.length || 0,
              teachers: parsed.teachers?.length || 0,
              subjects: parsed.subjects?.length || 0,
              sessions: parsed.sessions?.length || 0,
              grades: parsed.grades?.length || 0,
              lessonPlans: parsed.lessonPlans?.length || 0,
              violations: parsed.violations?.length || 0,
              payments: parsed.payments?.length || 0,
              cashDeposits: parsed.cashDeposits?.length || 0,
              treasurerExpenses: parsed.treasurerExpenses?.length || 0,
              schedules: parsed.schedules?.length || 0,
              announcements: parsed.announcements?.length || 0
            }
          };
        }

        setParsedBackupData(parsed);
      } catch (err: any) {
        console.error(err);
        setFileParseError('Gagal membaca file JSON: ' + (err.message || 'Format data rusak atau tidak sesuai'));
      }
    };
    reader.onerror = () => {
      setFileParseError('Terjadi kesalahan saat membaca file.');
    };
    reader.readAsText(file);
  };

  // Handle Execute Restore
  const handleExecuteRestore = async () => {
    if (!parsedBackupData) {
      showToast('Pilih file cadangan yang valid terlebih dahulu', 'error');
      return;
    }

    if (restoreConfirmationText.trim().toUpperCase() !== 'RESTORE') {
      showToast('Ketik kata "RESTORE" dengan huruf besar untuk mengonfirmasi pemulihan', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await onRestoreFullDatabase(parsedBackupData, restoreMode);
      
      showToast('Database berhasil dipulihkan dan disinkronkan ke seluruh sistem!', 'success');
      setSelectedFile(null);
      setParsedBackupData(null);
      setRestoreConfirmationText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memulihkan database: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Create Quick Snapshot
  const handleCreateSnapshot = () => {
    try {
      const liveData = buildLiveBackup('full');
      if (snapshotNameInput.trim()) {
        liveData.metadata.generatedBy = snapshotNameInput.trim();
      } else {
        liveData.metadata.generatedBy = `Snapshot Manual Admin (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
      }
      saveStoredDatabaseSnapshot(liveData, schoolId);
      setSnapshots(getStoredDatabaseSnapshots(schoolId));
      setSnapshotNameInput('');
      showToast('Titik pemulihan (Snapshot) lokal berhasil dibuat!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal membuat snapshot: ' + err.message, 'error');
    }
  };

  // Handle Restore from Snapshot
  const handleRestoreFromSnapshot = async (snapshot: DatabaseBackupData) => {
    const formattedDate = new Date(snapshot.metadata.timestamp).toLocaleString('id-ID');
    if (!confirm(`Apakah Anda yakin ingin memulihkan database ke kondisi Snapshot tanggal ${formattedDate}? Seluruh data aktif akan diperbarui.`)) {
      return;
    }

    try {
      setIsProcessing(true);
      await onRestoreFullDatabase(snapshot, 'replace');
      showToast(`Database berhasil dipulihkan dari Snapshot (${formattedDate})!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memulihkan snapshot: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Delete Snapshot
  const handleDeleteSnapshot = (timestamp: string) => {
    if (!confirm('Hapus snapshot titik pemulihan ini?')) return;
    deleteStoredDatabaseSnapshot(timestamp, schoolId);
    setSnapshots(getStoredDatabaseSnapshots(schoolId));
    showToast('Snapshot berhasil dihapus', 'info');
  };

  // Handle Reset Database
  const handleExecuteReset = async () => {
    if (resetConfirmationText.trim().toUpperCase() !== 'RESET') {
      showToast('Ketik kata "RESET" dengan huruf besar untuk mengonfirmasi!', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await onResetDatabase(resetScope);
      showToast(
        resetScope === 'all'
          ? 'Database telah di-reset ke Data Bawaan Awal Sekolah!'
          : 'Riwayat Transaksi, Absensi, dan Jurnal KBM berhasil dikosongkan. Data Guru & Siswa tetap aman!',
        'success'
      );
      setResetConfirmationText('');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal melakukan reset database: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" id="super-admin-backup-restore-container">
      
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold transition animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-indigo-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <Info className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sub Header Card */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <Server className="w-3.5 h-3.5" />
              <span>Database Management & Recovery Hub</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <span>Backup & Restore Database Terpusat</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Pencadangan berkala, pemulihan data komprehensif, titik pemulihan lokal (snapshot), dan sinkronisasi real-time cloud database {schoolName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 backdrop-blur-xs border border-slate-700 p-3 rounded-2xl">
            <div className="text-center px-3 border-r border-slate-700">
              <div className="text-lg font-black text-amber-400">{totalEntityCount.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Entitas</div>
            </div>
            <div className="text-center px-3">
              <div className="text-lg font-black text-emerald-400">{snapshots.length} / 5</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Snapshots</div>
            </div>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mb-16"></div>
      </div>

      {/* Realtime Database Entity Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span className="text-[10px] font-bold text-slate-400">SISWA</span>
          </div>
          <div className="text-xl font-black text-slate-800">{currentCounts.students}</div>
          <div className="text-[11px] text-slate-500 font-medium">Terdaftar Aktif</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-bold text-slate-400">GURU</span>
          </div>
          <div className="text-xl font-black text-slate-800">{currentCounts.teachers}</div>
          <div className="text-[11px] text-slate-500 font-medium">Dewan Pendidik</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-bold text-slate-400">KASIR / SPP</span>
          </div>
          <div className="text-xl font-black text-slate-800">{currentCounts.payments}</div>
          <div className="text-[11px] text-slate-500 font-medium">Riwayat Bayar</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <Building className="w-4 h-4" />
            <span className="text-[10px] font-bold text-slate-400">KAS KELUAR</span>
          </div>
          <div className="text-xl font-black text-slate-800">{currentCounts.treasurerExpenses}</div>
          <div className="text-[11px] text-slate-500 font-medium">Pengeluaran</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-bold text-slate-400">KBM & ABSEN</span>
          </div>
          <div className="text-xl font-black text-slate-800">{currentCounts.sessions}</div>
          <div className="text-[11px] text-slate-500 font-medium">Jurnal Kelas</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-bold text-slate-400">JADWAL</span>
          </div>
          <div className="text-xl font-black text-slate-800">{currentCounts.schedules}</div>
          <div className="text-[11px] text-slate-500 font-medium">Jam Mengajar</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Backup & Restore */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex-1 min-w-[150px] px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>1. Unduh Cadangan (Backup)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('restore')}
          className={`flex-1 min-w-[150px] px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'restore'
              ? 'bg-indigo-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>2. Pulihkan Data (Restore)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('snapshots')}
          className={`flex-1 min-w-[150px] px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'snapshots'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>3. Titik Pemulihan ({snapshots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reset')}
          className={`flex-1 min-w-[150px] px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'reset'
              ? 'bg-rose-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>4. Reset Database</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: BACKUP DATABASE (UNDUH CADANGAN)
          ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                Pencadangan Database Mandiri
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Simpan file cadangan lengkap format JSON ke perangkat komputer/ponsel untuk proteksi dari kehilangan data.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={includePrettyJson}
                  onChange={(e) => setIncludePrettyJson(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Format JSON Rapi (Human Readable)</span>
              </label>
            </div>
          </div>

          {/* Backup Scope Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Lingkup / Modul Cadangan:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => setBackupScope('full')}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  backupScope === 'full'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                      <Database className="w-5 h-5" />
                    </span>
                    {backupScope === 'full' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Cadangan Penuh (All Data)</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Mencakup seluruh siswa, guru, keuangan, jurnal, presensi, nilai, pelanggaran & pengaturan.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-bold text-emerald-700">
                  Direkomendasikan
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBackupScope('finance')}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  backupScope === 'finance'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                      <Wallet className="w-5 h-5" />
                    </span>
                    {backupScope === 'finance' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Modul Keuangan & SPP</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Hanya data transaksi kasir SPP, infaq, buku, seragam, setoran bendahara & pengeluaran kas.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-bold text-blue-700">
                  {currentCounts.payments + currentCounts.treasurerExpenses + currentCounts.cashDeposits} Transaksi
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBackupScope('academic')}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  backupScope === 'academic'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    {backupScope === 'academic' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Modul Akademik & KBM</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Sesi presensi mengajar, jurnal kelas, daftar nilai, modul ajar, pelanggaran & jadwal.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-bold text-purple-700">
                  {currentCounts.sessions + currentCounts.grades + currentCounts.schedules} Catatan KBM
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBackupScope('master')}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  backupScope === 'master'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                      <Users className="w-5 h-5" />
                    </span>
                    {backupScope === 'master' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Data Master Pokok</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Data siswa, dewan guru, mata pelajaran, pejabat madrasah & wali kelas.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-bold text-amber-700">
                  {currentCounts.students + currentCounts.teachers + currentCounts.subjects} Data Pokok
                </div>
              </button>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-900">
                  Siap Mengekspor File Cadangan ({backupScope.toUpperCase()})
                </h5>
                <p className="text-xs text-slate-500">
                  Format JSON standar &bull; Kompatibel dengan fitur Restore & Migrasi
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDownloadBackup}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses Cadangan...' : 'Unduh Cadangan Database (.json)'}</span>
            </button>
          </div>

          {/* Tips / Info */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 flex items-start space-x-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Rekomendasi Pemeliharaan Rutin:</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Disarankan untuk mengunduh cadangan database secara berkala (misal: setiap akhir pekan atau setelah penutupan buku SPP bulanan). File cadangan dapat disimpan di Google Drive, flashdisk, atau penyimpanan aman lainnya.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RESTORE DATABASE (PULIHKAN DATA)
          ========================================================================= */}
      {activeTab === 'restore' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="pb-6 border-b border-slate-100">
            <h4 className="text-lg font-black text-slate-900 tracking-tight">
              Pemulihan Database dari File Cadangan
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah file cadangan JSON untuk memulihkan data siswa, guru, transaksi, dan seluruh catatan KBM.
            </p>
          </div>

          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-indigo-400 bg-indigo-50/30'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Upload className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                  File Terpilih
                </span>
                <p className="text-sm font-bold text-slate-800 mt-2">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB &bull; Klik untuk mengganti file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">
                  Klik untuk Memilih File Cadangan atau Seret File ke Sini
                </p>
                <p className="text-xs text-slate-400">
                  Mendukung file cadangan berekstensi .json resmi
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {fileParseError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{fileParseError}</span>
            </div>
          )}

          {/* File Inspection / Preview Details */}
          {parsedBackupData && (
            <div className="space-y-6 pt-2">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Hasil Pemeriksaan File Cadangan
                    </h5>
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    Format Valid & Siap Dipulihkan
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Sekolah Asal</span>
                    <span className="text-xs font-bold text-slate-800">
                      {parsedBackupData.metadata?.schoolName || 'Tidak Tercatat'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Waktu Backup</span>
                    <span className="text-xs font-bold text-slate-800">
                      {parsedBackupData.metadata?.timestamp
                        ? new Date(parsedBackupData.metadata.timestamp).toLocaleString('id-ID')
                        : '-'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Tipe Cadangan</span>
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      {parsedBackupData.metadata?.type || 'Full'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pembuat Cadangan</span>
                    <span className="text-xs font-bold text-slate-800">
                      {parsedBackupData.metadata?.generatedBy || 'Super Admin'}
                    </span>
                  </div>
                </div>

                {/* Entity counts in backup file */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 mb-2 block">Isi Data yang Terdeteksi:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {parsedBackupData.students && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        🎓 <strong>{parsedBackupData.students.length}</strong> Siswa
                      </span>
                    )}
                    {parsedBackupData.teachers && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        👨‍🏫 <strong>{parsedBackupData.teachers.length}</strong> Guru
                      </span>
                    )}
                    {parsedBackupData.payments && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        💳 <strong>{parsedBackupData.payments.length}</strong> Pembayaran
                      </span>
                    )}
                    {parsedBackupData.treasurerExpenses && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        💸 <strong>{parsedBackupData.treasurerExpenses.length}</strong> Pengeluaran
                      </span>
                    )}
                    {parsedBackupData.sessions && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        📝 <strong>{parsedBackupData.sessions.length}</strong> Presensi KBM
                      </span>
                    )}
                    {parsedBackupData.grades && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        📊 <strong>{parsedBackupData.grades.length}</strong> Nilai
                      </span>
                    )}
                    {parsedBackupData.violations && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        ⚠️ <strong>{parsedBackupData.violations.length}</strong> Pelanggaran
                      </span>
                    )}
                    {parsedBackupData.schedules && (
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                        📅 <strong>{parsedBackupData.schedules.length}</strong> Jadwal
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Mode Pemulihan Data:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('replace')}
                    className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      restoreMode === 'replace'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="text-xs font-bold text-slate-900">Mode Timpa Penuh (Full Replace)</h6>
                      {restoreMode === 'replace' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Menggantikan seluruh database aktif dengan data persis seperti yang ada di dalam file cadangan. Sangat disarankan saat pemulihan bencana (disaster recovery) atau migrasi perangkat.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('merge')}
                    className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      restoreMode === 'merge'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="text-xs font-bold text-slate-900">Mode Gabungkan (Merge / Append)</h6>
                      {restoreMode === 'merge' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Memperbarui data yang cocok dan menambahkan data baru dari file tanpa menghapus data baru yang sudah ada di database saat ini.
                    </p>
                  </button>
                </div>
              </div>

              {/* Safety Confirmation Input */}
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-start space-x-3 text-amber-900 text-xs">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Konfirmasi Keamanan Pemulihan Database:</p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Operasi ini akan memperbarui data lokal dan langsung disinkronkan ke cloud database Firestore. Ketik kata <strong>RESTORE</strong> di bawah ini untuk mengeksekusi.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <input
                    type="text"
                    value={restoreConfirmationText}
                    onChange={(e) => setRestoreConfirmationText(e.target.value)}
                    placeholder="Ketik RESTORE..."
                    className="w-full sm:w-64 px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    disabled={isProcessing || restoreConfirmationText.trim().toUpperCase() !== 'RESTORE'}
                    onClick={handleExecuteRestore}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Memulihkan...' : 'Eksekusi Pulihkan Database'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: TITIK PEMULIHAN CEPAT (BROWSER SNAPSHOTS)
          ========================================================================= */}
      {activeTab === 'snapshots' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                Titik Pemulihan Cepat (Quick Snapshots)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Simpan titik checkpoint database langsung di memori peramban tanpa harus mengunduh file untuk rollback cepat sewaktu-waktu.
              </p>
            </div>

            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              Kapasitas: {snapshots.length} dari 5 Snapshot
            </span>
          </div>

          {/* Create New Snapshot Form */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Buat Titik Pemulihan (Snapshot) Baru Sekarang</span>
            </h5>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={snapshotNameInput}
                onChange={(e) => setSnapshotNameInput(e.target.value)}
                placeholder="Label / Catatan Snapshot (misal: Sebelum Import Siswa Kelas VII)..."
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={handleCreateSnapshot}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Simpan Snapshot</span>
              </button>
            </div>
          </div>

          {/* Snapshots List */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Riwayat Snapshot Tersimpan ({snapshots.length}):
            </h5>

            {snapshots.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Snapshot Tersimpan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol "Simpan Snapshot" di atas untuk membuat titik pemulihan pertama Anda.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {snapshots.map((snap, idx) => {
                  const date = new Date(snap.metadata.timestamp);
                  const total = Object.values(snap.metadata.counts || {}).reduce<number>((a, b) => a + (Number(b) || 0), 0);

                  return (
                    <div
                      key={snap.metadata.timestamp}
                      className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h6 className="text-xs font-bold text-slate-900">
                            {snap.metadata.generatedBy || 'Snapshot Database'}
                          </h6>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {date.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pl-8">
                          <span>🎓 {snap.metadata.counts?.students ?? snap.students?.length ?? 0} Siswa</span>
                          <span>&bull;</span>
                          <span>👨‍🏫 {snap.metadata.counts?.teachers ?? snap.teachers?.length ?? 0} Guru</span>
                          <span>&bull;</span>
                          <span>💳 {snap.metadata.counts?.payments ?? snap.payments?.length ?? 0} Bayar</span>
                          <span>&bull;</span>
                          <span>📝 {snap.metadata.counts?.sessions ?? snap.sessions?.length ?? 0} KBM</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center pl-8 sm:pl-0">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRestoreFromSnapshot(snap)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snap.metadata.timestamp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Hapus Snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: RESET / KOSONGKAN DATABASE
          ========================================================================= */}
      {activeTab === 'reset' && (
        <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="flex items-center space-x-3 pb-6 border-b border-rose-100 text-rose-700">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black tracking-tight">
                Zona Bahaya: Reset & Pembersihan Database
              </h4>
              <p className="text-xs text-rose-600">
                Fitur administratif tingkat tinggi untuk mengosongkan riwayat transaksi atau mengembalikan database ke setelan awal.
              </p>
            </div>
          </div>

          {/* Scope selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Lingkup Reset Database:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setResetScope('transactions_only')}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  resetScope === 'transactions_only'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                      <RotateCcw className="w-5 h-5" />
                    </span>
                    {resetScope === 'transactions_only' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">Kosongkan Riwayat Transaksi & Absensi KBM</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Hanya mengosongkan riwayat pembayaran SPP/Kasir, pengeluaran kas, presensi guru, jurnal KBM, dan nilai. <strong>Data Siswa & Dewan Guru tetap aman!</strong>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-bold text-amber-800">
                  Direkomendasikan saat Pergantian Tahun Ajaran Baru
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResetScope('all')}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  resetScope === 'all'
                    ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </span>
                    {resetScope === 'all' && <CheckCircle2 className="w-5 h-5 text-rose-600" />}
                  </div>
                  <h5 className="text-sm font-bold text-rose-900">Reset Total ke Data Bawaan (Factory Reset)</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Mengembalikan seluruh data sistem ke konfigurasi dan daftar awal standar {schoolName}. Seluruh data inputan manual akan direset.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-200/60 text-[10px] font-bold text-rose-700">
                  Perhatian: Tindakan tidak dapat dibatalkan
                </div>
              </button>
            </div>
          </div>

          {/* Safety Confirmation */}
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
            <div className="flex items-start space-x-3 text-rose-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Konfirmasi Keamanan Reset Database:</p>
                <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                  Sebelum melakukan reset, sangat disarankan untuk mengunduh cadangan database terlebih dahulu. Ketik kata <strong>RESET</strong> di bawah ini untuk melanjutkan:
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="Ketik RESET..."
                className="w-full sm:w-64 px-4 py-2.5 bg-white border border-rose-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />

              <button
                type="button"
                disabled={isProcessing || resetConfirmationText.trim().toUpperCase() !== 'RESET'}
                onClick={handleExecuteReset}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isProcessing ? 'Mereset Database...' : 'Eksekusi Reset Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

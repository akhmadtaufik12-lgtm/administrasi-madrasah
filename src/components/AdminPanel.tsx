import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Users,
  WalletCards,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Send,
  MessageCircle,
  Download,
  Printer,
  Search,
  Save,
  Sparkles,
  Phone,
  UserCheck,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Megaphone,
  Flame,
  Plus,
  Trash2,
  Edit3,
  Radio,
  Bell,
  BellRing,
  X,
  Share2,
  Database,
  CalendarCheck
} from 'lucide-react';
import {
  Teacher,
  Student,
  Subject,
  SchoolOfficials,
  FeeTariffSettings,
  AdminSettings,
  ClassWaliKelasMap,
  Announcement,
  AnnouncementType,
  AnnouncementTarget,
  AttendanceSession,
  GradeRecord,
  LessonPlan,
  StudentViolation,
  PaymentTransaction,
  CashDepositTransaction,
  TreasurerExpenseTransaction,
  TeachingSchedule,
  StudentBillSettings,
  SchoolId,
  DatabaseBackupData
} from '../types';
import { exportToCSV } from '../utils/export';
import { 
  DEFAULT_FEE_TARIFFS, 
  DEFAULT_ADMIN_SETTINGS, 
  DEFAULT_ANNOUNCEMENTS, 
  cleanTreasurerRole,
  getStoredCurriculumPasscode,
  saveCurriculumPasscode,
  getStoredCurriculumSettings,
  saveCurriculumSettings
} from '../utils/storage';
import {
  sendLocalNotification,
  broadcastAnnouncementPushNotification,
  requestNotificationPermission,
  getNotificationPermission
} from '../utils/notifications';
import { DatabaseBackupRestore } from './DatabaseBackupRestore';

interface AdminPanelProps {
  teachers: Teacher[];
  schoolOfficials: SchoolOfficials;
  tariffs?: FeeTariffSettings;
  adminSettings?: AdminSettings;
  classWaliKelas: ClassWaliKelasMap;
  announcements?: Announcement[];
  students?: Student[];
  subjects?: Subject[];
  sessions?: AttendanceSession[];
  grades?: GradeRecord[];
  lessonPlans?: LessonPlan[];
  violations?: StudentViolation[];
  payments?: PaymentTransaction[];
  cashDeposits?: CashDepositTransaction[];
  treasurerExpenses?: TreasurerExpenseTransaction[];
  studentBillSettings?: StudentBillSettings;
  schedules?: TeachingSchedule[];
  schoolId?: SchoolId;
  schoolName?: string;
  academicSettings?: { academicYear: string; semester: string };
  classList?: string[];
  onSaveTeachers: (teachers: Teacher[]) => Promise<void> | void;
  onSaveOfficials: (officials: SchoolOfficials) => Promise<void> | void;
  onSaveTariffs: (tariffs: FeeTariffSettings) => Promise<void> | void;
  onSaveAdminSettings: (settings: AdminSettings) => Promise<void> | void;
  onSaveAnnouncements?: (announcements: Announcement[]) => Promise<void> | void;
  onRestoreFullDatabase?: (data: DatabaseBackupData, mode: 'replace' | 'merge') => Promise<void>;
  onResetDatabase?: (scope: 'all' | 'transactions_only') => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  teachers,
  schoolOfficials,
  tariffs,
  adminSettings,
  classWaliKelas,
  announcements = DEFAULT_ANNOUNCEMENTS,
  students = [],
  subjects = [],
  sessions = [],
  grades = [],
  lessonPlans = [],
  violations = [],
  payments = [],
  cashDeposits = [],
  treasurerExpenses = [],
  studentBillSettings,
  schedules = [],
  schoolId = 'mts_manbaul_islam',
  schoolName = "MTs Manba'ul Islam",
  academicSettings,
  classList = ['VII A', 'VII B', 'VIII A', 'VIII B', 'IX A', 'IX B'],
  onSaveTeachers,
  onSaveOfficials,
  onSaveTariffs,
  onSaveAdminSettings,
  onSaveAnnouncements,
  onRestoreFullDatabase,
  onResetDatabase
}) => {
  // Admin Authentication State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('mts_admin_master_unlocked') === 'true' ||
      localStorage.getItem('mts_admin_master_unlocked') === 'true'
    );
  });

  const [inputPasscode, setInputPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [rememberAuth, setRememberAuth] = useState(true);

  // Active Sub Tab: 'bendahara' | 'kurikulum' | 'guru' | 'keamanan' | 'pengumuman' | 'backup_restore'
  const [activeSubTab, setActiveSubTab] = useState<'bendahara' | 'kurikulum' | 'guru' | 'keamanan' | 'pengumuman' | 'backup_restore'>('bendahara');

  // Notification State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Teacher Filter
  const [teacherSearch, setTeacherSearch] = useState('');

  // Editable Kurikulum Form State (Waka Kurikulum & Ujian)
  const [kurikulumState, setKurikulumState] = useState({
    name: schoolOfficials?.kurikulum?.name || 'Agustiani, S.Pd',
    nip: schoolOfficials?.kurikulum?.nip || '85781',
    phone: schoolOfficials?.kurikulum?.phone || '081234567806',
    email: schoolOfficials?.kurikulum?.email || 'agustiani@mtsmanbaulislam.sch.id',
    kodeUnik: schoolOfficials?.kurikulum?.kodeUnik || adminSettings?.kurikulumKodeUnik || getStoredCurriculumPasscode() || 'KURIKULUM2026'
  });
  const [showKurikulumCode, setShowKurikulumCode] = useState(false);

  // Editable Bendahara Form State (Bendahara Utama & Bendahara 1 to 5)
  const [bendaharaUtamaState, setBendaharaUtamaState] = useState({
    name: schoolOfficials?.bendaharaUtama?.name || 'Hj. Siti Mardhiyah, S.E., M.M.',
    nip: schoolOfficials?.bendaharaUtama?.nip || '85780',
    phone: schoolOfficials?.bendaharaUtama?.phone || '081211223344',
    roleTitle: 'Bendahara Utama',
    kodeUnik: schoolOfficials?.bendaharaUtama?.kodeUnik || tariffs?.bendaharaUtamaKodeUnik || 'BENDAHARAUTAMA'
  });

  const [bendahara1State, setBendahara1State] = useState({
    name: schoolOfficials?.bendahara?.name || 'Siti Rahmawati, S.E.',
    nip: schoolOfficials?.bendahara?.nip || '85792',
    phone: schoolOfficials?.bendahara?.phone || '081234567890',
    roleTitle: cleanTreasurerRole(schoolOfficials?.bendahara?.roleTitle, 1),
    kodeUnik: schoolOfficials?.bendahara?.kodeUnik || tariffs?.bendaharaKodeUnik || 'BENDAHARA1'
  });

  const [bendahara2State, setBendahara2State] = useState({
    name: schoolOfficials?.bendahara2?.name || 'Dewi Sutrawati, SE',
    nip: schoolOfficials?.bendahara2?.nip || '85784',
    phone: schoolOfficials?.bendahara2?.phone || '081398765432',
    roleTitle: cleanTreasurerRole(schoolOfficials?.bendahara2?.roleTitle, 2),
    kodeUnik: schoolOfficials?.bendahara2?.kodeUnik || tariffs?.bendahara2KodeUnik || 'BENDAHARA2'
  });

  const [bendahara3State, setBendahara3State] = useState({
    name: schoolOfficials?.bendahara3?.name || 'Ahmad Fauzi, S.Pd',
    nip: schoolOfficials?.bendahara3?.nip || '85785',
    phone: schoolOfficials?.bendahara3?.phone || '081298761234',
    roleTitle: cleanTreasurerRole(schoolOfficials?.bendahara3?.roleTitle, 3),
    kodeUnik: schoolOfficials?.bendahara3?.kodeUnik || tariffs?.bendahara3KodeUnik || 'BENDAHARA3'
  });

  const [bendahara4State, setBendahara4State] = useState({
    name: schoolOfficials?.bendahara4?.name || 'Nurul Hidayah, S.Kom',
    nip: schoolOfficials?.bendahara4?.nip || '85786',
    phone: schoolOfficials?.bendahara4?.phone || '081356781234',
    roleTitle: cleanTreasurerRole(schoolOfficials?.bendahara4?.roleTitle, 4),
    kodeUnik: schoolOfficials?.bendahara4?.kodeUnik || tariffs?.bendahara4KodeUnik || 'BENDAHARA4'
  });

  const [bendahara5State, setBendahara5State] = useState({
    name: schoolOfficials?.bendahara5?.name || 'Hendra Kurniawan, S.Pd',
    nip: schoolOfficials?.bendahara5?.nip || '85787',
    phone: schoolOfficials?.bendahara5?.phone || '081267891234',
    roleTitle: cleanTreasurerRole(schoolOfficials?.bendahara5?.roleTitle, 5),
    kodeUnik: schoolOfficials?.bendahara5?.kodeUnik || tariffs?.bendahara5KodeUnik || 'BENDAHARA5'
  });

  // Local Teachers State for editing
  const [teachersList, setTeachersList] = useState<Teacher[]>(() => {
    return teachers.map(t => ({
      ...t,
      kodeUnik: t.kodeUnik || `GURU-${t.nip || t.id.replace('t-', '')}`
    }));
  });

  // Master Admin Passcode State
  const [newAdminPasscode, setNewAdminPasscode] = useState('');
  const [confirmAdminPasscode, setConfirmAdminPasscode] = useState('');

  // Announcements State
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(announcements);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'active' | 'important'>('all');
  const [announcementClassFilter, setAnnouncementClassFilter] = useState<string>('all');
  const [announcementForm, setAnnouncementForm] = useState<{
    title: string;
    message: string;
    type: AnnouncementType;
    targetAudience: AnnouncementTarget | string;
    targetStudentId?: string;
    targetStudentCode?: string;
    targetStudentName?: string;
    targetClass?: string;
    authorName: string;
    active: boolean;
  }>({
    title: '',
    message: '',
    type: 'important',
    targetAudience: 'all',
    targetStudentId: '',
    targetStudentCode: '',
    targetStudentName: '',
    targetClass: '',
    authorName: 'Admin Madrasah',
    active: true
  });

  // Sync state if props change
  React.useEffect(() => {
    setAnnouncementsList(announcements);
  }, [announcements]);

  // Sync state if props change
  React.useEffect(() => {
    setTeachersList(
      teachers.map(t => ({
        ...t,
        kodeUnik: t.kodeUnik || `GURU-${t.nip || t.id.replace('t-', '')}`
      }))
    );
  }, [teachers]);

  React.useEffect(() => {
    if (schoolOfficials?.bendaharaUtama) {
      setBendaharaUtamaState(prev => ({
        ...prev,
        name: schoolOfficials.bendaharaUtama?.name || prev.name,
        nip: schoolOfficials.bendaharaUtama?.nip || prev.nip,
        phone: schoolOfficials.bendaharaUtama?.phone || prev.phone,
        roleTitle: 'Bendahara Utama',
        kodeUnik: schoolOfficials.bendaharaUtama?.kodeUnik || tariffs?.bendaharaUtamaKodeUnik || prev.kodeUnik
      }));
    }
    if (schoolOfficials?.bendahara) {
      setBendahara1State(prev => ({
        ...prev,
        name: schoolOfficials.bendahara?.name || prev.name,
        nip: schoolOfficials.bendahara?.nip || prev.nip,
        phone: schoolOfficials.bendahara?.phone || prev.phone,
        roleTitle: cleanTreasurerRole(schoolOfficials.bendahara?.roleTitle, 1),
        kodeUnik: schoolOfficials.bendahara?.kodeUnik || tariffs?.bendaharaKodeUnik || prev.kodeUnik
      }));
    }
    if (schoolOfficials?.bendahara2) {
      setBendahara2State(prev => ({
        ...prev,
        name: schoolOfficials.bendahara2?.name || prev.name,
        nip: schoolOfficials.bendahara2?.nip || prev.nip,
        phone: schoolOfficials.bendahara2?.phone || prev.phone,
        roleTitle: cleanTreasurerRole(schoolOfficials.bendahara2?.roleTitle, 2),
        kodeUnik: schoolOfficials.bendahara2?.kodeUnik || tariffs?.bendahara2KodeUnik || prev.kodeUnik
      }));
    }
    if (schoolOfficials?.bendahara3) {
      setBendahara3State(prev => ({
        ...prev,
        name: schoolOfficials.bendahara3?.name || prev.name,
        nip: schoolOfficials.bendahara3?.nip || prev.nip,
        phone: schoolOfficials.bendahara3?.phone || prev.phone,
        roleTitle: cleanTreasurerRole(schoolOfficials.bendahara3?.roleTitle, 3),
        kodeUnik: schoolOfficials.bendahara3?.kodeUnik || tariffs?.bendahara3KodeUnik || prev.kodeUnik
      }));
    }
    if (schoolOfficials?.bendahara4) {
      setBendahara4State(prev => ({
        ...prev,
        name: schoolOfficials.bendahara4?.name || prev.name,
        nip: schoolOfficials.bendahara4?.nip || prev.nip,
        phone: schoolOfficials.bendahara4?.phone || prev.phone,
        roleTitle: cleanTreasurerRole(schoolOfficials.bendahara4?.roleTitle, 4),
        kodeUnik: schoolOfficials.bendahara4?.kodeUnik || tariffs?.bendahara4KodeUnik || prev.kodeUnik
      }));
    }
    if (schoolOfficials?.bendahara5) {
      setBendahara5State(prev => ({
        ...prev,
        name: schoolOfficials.bendahara5?.name || prev.name,
        nip: schoolOfficials.bendahara5?.nip || prev.nip,
        phone: schoolOfficials.bendahara5?.phone || prev.phone,
        roleTitle: cleanTreasurerRole(schoolOfficials.bendahara5?.roleTitle, 5),
        kodeUnik: schoolOfficials.bendahara5?.kodeUnik || tariffs?.bendahara5KodeUnik || prev.kodeUnik
      }));
    }
    if (schoolOfficials?.kurikulum || adminSettings?.kurikulumKodeUnik) {
      setKurikulumState(prev => ({
        ...prev,
        name: schoolOfficials?.kurikulum?.name || prev.name,
        nip: schoolOfficials?.kurikulum?.nip || prev.nip,
        phone: schoolOfficials?.kurikulum?.phone || prev.phone,
        email: schoolOfficials?.kurikulum?.email || prev.email,
        kodeUnik: schoolOfficials?.kurikulum?.kodeUnik || adminSettings?.kurikulumKodeUnik || getStoredCurriculumPasscode() || prev.kodeUnik
      }));
    }
  }, [schoolOfficials, tariffs, adminSettings]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Kode "${text}" berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Login Super Admin
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanInput = inputPasscode.trim();
    const correctPasscode = (adminSettings?.adminPasscode || 'akhmadtaufik84@').trim();

    if (cleanInput === correctPasscode) {
      setIsUnlocked(true);
      if (rememberAuth) {
        localStorage.setItem('mts_admin_master_unlocked', 'true');
      } else {
        sessionStorage.setItem('mts_admin_master_unlocked', 'true');
      }
      showToast('Autentikasi Super Admin berhasil!');
    } else {
      setAuthError('Kata sandi Super Admin salah! Silakan periksa kembali atau tanya ke Super Admin.');
    }
  };

  const handleLockAdmin = () => {
    setIsUnlocked(false);
    setInputPasscode('');
    localStorage.removeItem('mts_admin_master_unlocked');
    sessionStorage.removeItem('mts_admin_master_unlocked');
    showToast('Sesi Admin berhasil dikunci.');
  };

  // Generate random code helper
  const generateRandomCode = (prefix: string, length = 6): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${res}`;
  };

  // Save Bendahara Configuration
  const handleSaveBendahara = async () => {
    const bu = {
      id: 'bu',
      name: bendaharaUtamaState.name.trim(),
      nip: bendaharaUtamaState.nip.trim(),
      phone: bendaharaUtamaState.phone.trim(),
      roleTitle: 'Bendahara Utama',
      kodeUnik: bendaharaUtamaState.kodeUnik.trim().toUpperCase(),
      active: true
    };
    const b1 = {
      id: 'b1',
      name: bendahara1State.name.trim(),
      nip: bendahara1State.nip.trim(),
      phone: bendahara1State.phone.trim(),
      roleTitle: bendahara1State.roleTitle.trim() || 'Bendahara 1',
      kodeUnik: bendahara1State.kodeUnik.trim().toUpperCase(),
      active: true
    };
    const b2 = {
      id: 'b2',
      name: bendahara2State.name.trim(),
      nip: bendahara2State.nip.trim(),
      phone: bendahara2State.phone.trim(),
      roleTitle: bendahara2State.roleTitle.trim() || 'Bendahara 2',
      kodeUnik: bendahara2State.kodeUnik.trim().toUpperCase(),
      active: true
    };
    const b3 = {
      id: 'b3',
      name: bendahara3State.name.trim(),
      nip: bendahara3State.nip.trim(),
      phone: bendahara3State.phone.trim(),
      roleTitle: bendahara3State.roleTitle.trim() || 'Bendahara 3',
      kodeUnik: bendahara3State.kodeUnik.trim().toUpperCase(),
      active: true
    };
    const b4 = {
      id: 'b4',
      name: bendahara4State.name.trim(),
      nip: bendahara4State.nip.trim(),
      phone: bendahara4State.phone.trim(),
      roleTitle: bendahara4State.roleTitle.trim() || 'Bendahara 4',
      kodeUnik: bendahara4State.kodeUnik.trim().toUpperCase(),
      active: true
    };
    const b5 = {
      id: 'b5',
      name: bendahara5State.name.trim(),
      nip: bendahara5State.nip.trim(),
      phone: bendahara5State.phone.trim(),
      roleTitle: bendahara5State.roleTitle.trim() || 'Bendahara 5',
      kodeUnik: bendahara5State.kodeUnik.trim().toUpperCase(),
      active: true
    };

    const updatedOfficials: SchoolOfficials = {
      ...schoolOfficials,
      bendaharaUtama: bu,
      bendahara: b1,
      bendahara2: b2,
      bendahara3: b3,
      bendahara4: b4,
      bendahara5: b5,
      treasurers: [bu, b1, b2, b3, b4, b5]
    };

    const currentTariffs = tariffs || DEFAULT_FEE_TARIFFS;
    const updatedTariffs: FeeTariffSettings = {
      ...currentTariffs,
      bendaharaUtamaKodeUnik: bu.kodeUnik,
      bendaharaKodeUnik: b1.kodeUnik,
      bendahara2KodeUnik: b2.kodeUnik,
      bendahara3KodeUnik: b3.kodeUnik,
      bendahara4KodeUnik: b4.kodeUnik,
      bendahara5KodeUnik: b5.kodeUnik
    };

    await onSaveOfficials(updatedOfficials);
    await onSaveTariffs(updatedTariffs);
    showToast('Kode akses & data Bendahara Utama & Bendahara 1 s/d 5 berhasil disimpan ke Cloud!');
  };

  // Save Kurikulum Configuration
  const handleSaveKurikulum = async () => {
    const cleanKode = kurikulumState.kodeUnik.trim().toUpperCase();
    if (!cleanKode) {
      showToast('Kode Akses Kurikulum tidak boleh kosong!', 'error');
      return;
    }

    const updatedOfficials: SchoolOfficials = {
      ...schoolOfficials,
      kurikulum: {
        ...schoolOfficials.kurikulum,
        name: kurikulumState.name.trim(),
        nip: kurikulumState.nip.trim(),
        phone: kurikulumState.phone.trim(),
        email: kurikulumState.email.trim(),
        kodeUnik: cleanKode
      }
    };

    const currentAdminSettings = adminSettings || DEFAULT_ADMIN_SETTINGS;
    const updatedAdminSettings: AdminSettings = {
      ...currentAdminSettings,
      kurikulumKodeUnik: cleanKode,
      lastUpdated: new Date().toISOString()
    };

    saveCurriculumPasscode(cleanKode);
    try {
      const activeSchId = (schoolId as SchoolId) || 'mts_manbaul_islam';
      const curSettings = getStoredCurriculumSettings(activeSchId);
      saveCurriculumSettings({
        ...curSettings,
        wakaKurikulumName: kurikulumState.name.trim(),
        wakaKurikulumNip: kurikulumState.nip.trim(),
        curriculumCode: cleanKode,
        lastUpdated: new Date().toISOString()
      }, activeSchId);
    } catch (e) {
      console.error('Failed to update curriculum settings', e);
    }

    await onSaveOfficials(updatedOfficials);
    await onSaveAdminSettings(updatedAdminSettings);
    showToast('Kode akses & data Waka Kurikulum berhasil disimpan ke Cloud!');
  };

  // Update single teacher kode unik
  const handleTeacherCodeChange = (teacherId: string, newCode: string) => {
    setTeachersList(prev =>
      prev.map(t => (t.id === teacherId ? { ...t, kodeUnik: newCode.toUpperCase() } : t))
    );
  };

  // Update single teacher phone
  const handleTeacherPhoneChange = (teacherId: string, newPhone: string) => {
    setTeachersList(prev =>
      prev.map(t => (t.id === teacherId ? { ...t, phone: newPhone } : t))
    );
  };

  // Save all teachers
  const handleSaveAllTeachers = async () => {
    await onSaveTeachers(teachersList);
    showToast('Seluruh kode akses dewan guru berhasil disimpan!');
  };

  // Auto Generate all teachers code
  const handleAutoGenerateAllTeacherCodes = () => {
    if (!window.confirm('Generate otomatis kode akses untuk seluruh guru yang belum atau ingin diperbarui?')) {
      return;
    }
    const updated = teachersList.map(t => ({
      ...t,
      kodeUnik: `GURU-${t.nip || t.id.replace('t-', '')}`
    }));
    setTeachersList(updated);
    showToast('Kode akses seluruh guru telah digenerate (Format: GURU-[NIP]). Jangan lupa klik Simpan!');
  };

  // Send WhatsApp message helper
  const sendWhatsAppCode = (personName: string, role: string, code: string, phone?: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const message = `*KODE AKSES RESMI - MTs MANBA'UL ISLAM*\n` +
      `-------------------------------------------\n` +
      `Yth. *${personName}*\n` +
      `Jabatan/Peran: *${role}*\n\n` +
      `Berikut adalah Kode Akses Resmi Anda untuk masuk ke sistem Administrasi MTs Manba'ul Islam:\n\n` +
      `🔑 *KODE AKSES: ${code}*\n\n` +
      `_Catatan: Harap simpan dan jaga kerahasiaan kode akses ini. Gunakan saat membuka portal atau menu terkait._\n` +
      `-------------------------------------------\n` +
      `*Administrator MTs Manba'ul Islam*`;

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  // Export Teachers Code to CSV
  const handleExportTeachersCSV = () => {
    const headers = ['No', 'Nama Guru', 'NIP', 'No WhatsApp', 'Tugas / Wali Kelas', 'Kode Akses'];
    const rows = teachersList.map((t, idx) => {
      const waliCls = Object.entries(classWaliKelas).find(([_, name]) => name === t.name)?.[0] || '-';
      return [
        idx + 1,
        t.name,
        t.nip,
        t.phone || '-',
        waliCls !== '-' ? `Wali Kelas ${waliCls}` : 'Guru Mata Pelajaran',
        t.kodeUnik || '-'
      ];
    });

    exportToCSV(`DAFTAR_KODE_AKSES_GURU_MTS_MANBAUL_ISLAM_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  // Save new Master Admin Passcode
  const handleUpdateAdminPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPasscode || newAdminPasscode.trim().length < 4) {
      showToast('Kata sandi baru minimal 4 karakter!', 'error');
      return;
    }
    if (newAdminPasscode !== confirmAdminPasscode) {
      showToast('Konfirmasi kata sandi tidak cocok!', 'error');
      return;
    }

    const updatedSettings: AdminSettings = {
      adminPasscode: newAdminPasscode.trim(),
      lastUpdated: new Date().toISOString()
    };

    await onSaveAdminSettings(updatedSettings);
    setNewAdminPasscode('');
    setConfirmAdminPasscode('');
    showToast('Kata sandi Super Admin berhasil diperbarui!');
  };

  // Announcements Handlers
  const handleOpenNewAnnouncement = () => {
    setEditingAnnouncementId(null);
    setAnnouncementForm({
      title: '',
      message: '',
      type: 'important',
      targetAudience: 'all',
      targetStudentId: '',
      targetStudentCode: '',
      targetStudentName: '',
      targetClass: '',
      authorName: 'Admin Madrasah',
      active: true
    });
    setShowAnnouncementForm(true);
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncementId(ann.id);
    setAnnouncementForm({
      title: ann.title,
      message: ann.message,
      type: ann.type,
      targetAudience: ann.targetAudience || 'all',
      targetStudentId: ann.targetStudentId || '',
      targetStudentCode: ann.targetStudentCode || '',
      targetStudentName: ann.targetStudentName || '',
      targetClass: ann.targetClass || '',
      authorName: ann.authorName || 'Admin Madrasah',
      active: ann.active
    });
    setShowAnnouncementForm(true);
  };

  const [sendPushOnSave, setSendPushOnSave] = useState(true);

  const handleSendSinglePush = async (ann: Announcement) => {
    // 1. Local trigger if permission is available
    const perm = getNotificationPermission();
    if (perm === 'default') {
      await requestNotificationPermission();
    }
    await broadcastAnnouncementPushNotification(ann);

    // 2. Broadcast push timestamp to Firestore so ALL connected teachers' phones receive and display the push
    const nowIso = new Date().toISOString();
    const updatedList = announcementsList.map(a =>
      a.id === ann.id ? { ...a, pushedAt: nowIso, active: true } : a
    );
    setAnnouncementsList(updatedList);
    if (onSaveAnnouncements) {
      await onSaveAnnouncements(updatedList);
    }
    showToast(`🚀 Siaran Web Push Notification "${ann.title}" berhasil dikirim ke seluruh HP guru & staf!`);
  };

  const handleSaveAnnouncementForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      showToast('Judul dan isi pesan pengumuman wajib diisi!', 'error');
      return;
    }

    if (announcementForm.targetAudience === 'siswa_khusus' && !announcementForm.targetStudentCode?.trim() && !announcementForm.targetStudentId) {
      showToast('Silakan pilih siswa atau masukkan Kode Unik Siswa target!', 'error');
      return;
    }

    let targetAnn: Announcement;
    let updatedList: Announcement[];
    if (editingAnnouncementId) {
      const existing = announcementsList.find(a => a.id === editingAnnouncementId);
      targetAnn = {
        id: editingAnnouncementId,
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        type: announcementForm.type,
        targetAudience: announcementForm.targetAudience,
        targetStudentId: announcementForm.targetStudentId || undefined,
        targetStudentCode: announcementForm.targetStudentCode?.trim() || undefined,
        targetStudentName: announcementForm.targetStudentName?.trim() || undefined,
        targetClass: announcementForm.targetClass?.trim() || undefined,
        authorName: announcementForm.authorName.trim() || 'Admin Madrasah',
        active: announcementForm.active,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedList = announcementsList.map(a =>
        a.id === editingAnnouncementId ? targetAnn : a
      );
    } else {
      targetAnn = {
        id: `ann-${Date.now()}`,
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        type: announcementForm.type,
        targetAudience: announcementForm.targetAudience,
        targetStudentId: announcementForm.targetStudentId || undefined,
        targetStudentCode: announcementForm.targetStudentCode?.trim() || undefined,
        targetStudentName: announcementForm.targetStudentName?.trim() || undefined,
        targetClass: announcementForm.targetClass?.trim() || undefined,
        authorName: announcementForm.authorName.trim() || 'Admin Madrasah',
        active: announcementForm.active,
        createdAt: new Date().toISOString()
      };
      updatedList = [targetAnn, ...announcementsList];
    }

    setAnnouncementsList(updatedList);
    setShowAnnouncementForm(false);
    setEditingAnnouncementId(null);

    if (onSaveAnnouncements) {
      await onSaveAnnouncements(updatedList);
    }

    // Trigger Web Push Notification if active and enabled
    if (targetAnn.active && sendPushOnSave) {
      try {
        await broadcastAnnouncementPushNotification(targetAnn);
      } catch (err) {
        console.warn('Push notification delivery note:', err);
      }
    }

    showToast(editingAnnouncementId ? 'Pengumuman berhasil diperbarui & disinkronkan!' : 'Pengumuman baru & Web Push Notification berhasil disiarkan!');
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    const updatedList = announcementsList.filter(a => a.id !== id);
    setAnnouncementsList(updatedList);
    if (onSaveAnnouncements) {
      await onSaveAnnouncements(updatedList);
    }
    showToast('Pengumuman berhasil dihapus!');
  };

  const handleToggleAnnouncementStatus = async (id: string) => {
    const updatedList = announcementsList.map(a =>
      a.id === id ? { ...a, active: !a.active, updatedAt: new Date().toISOString() } : a
    );
    setAnnouncementsList(updatedList);
    if (onSaveAnnouncements) {
      await onSaveAnnouncements(updatedList);
    }
    showToast('Status keaktifan pengumuman diperbarui!');
  };

  // Filtered announcements list
  const filteredAnnouncements = useMemo(() => {
    return announcementsList.filter(a => {
      if (announcementFilter === 'active') return a.active;
      if (announcementFilter === 'important') return a.type === 'important' || a.type === 'urgent';
      return true;
    });
  }, [announcementsList, announcementFilter]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachersList.filter(t =>
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.nip.includes(teacherSearch) ||
      (t.kodeUnik && t.kodeUnik.toLowerCase().includes(teacherSearch.toLowerCase()))
    );
  }, [teachersList, teacherSearch]);

  // If locked, render Master Security Gate
  if (!isUnlocked) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-center text-white relative">
            <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-300 shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div className="inline-block px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
              Khusus Administrator Utama
            </div>
            <h2 className="text-2xl font-black tracking-tight">PANEL SUPER ADMIN</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
              Pengaturan Otoritas & Kode Akses Khusus Dewan Guru, Bendahara 1, dan Bendahara 2 MTs Manba'ul Islam.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleAdminAuth} className="p-8 space-y-6">
            {authError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-700 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kata Sandi Master Super Admin <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  placeholder="Masukkan Kata Sandi Master Admin..."
                  value={inputPasscode}
                  onChange={e => setInputPasscode(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-lg mt-2 flex items-center space-x-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Belum memiliki akses? Silakan <strong>tanya ke super admin</strong></span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberAdminAuth"
                checked={rememberAuth}
                onChange={e => setRememberAuth(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <label htmlFor="rememberAdminAuth" className="text-xs text-slate-600 font-medium cursor-pointer">
                Ingat sesi login Super Admin pada browser ini
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-linear-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-amber-400" />
              <span>Buka Akses Panel Admin</span>
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              🔒 Keamanan Terenkripsi &bull; Hanya dapat diakses oleh Admin Pengelola
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Once Unlocked, render full Admin Control Panel
  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold transition animate-bounce ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Super Admin Master Header */}
      <div className="bg-linear-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin Authority</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">MTs Manba'ul Islam</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Pusat Kontrol Kode Akses & Otoritas
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
            Kelola kode akses unik dewan guru, otorisasi Bendahara 1 s/d 5 untuk transaksi administrasi & keuangan madrasah, serta proteksi kata sandi master.
          </p>
        </div>

        {/* Header Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={handleLockAdmin}
            className="px-4 py-2.5 bg-white/10 hover:bg-rose-500/80 text-white border border-white/20 hover:border-rose-400 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <Lock className="w-4 h-4 text-amber-300" />
            <span>Kunci Sesi Admin</span>
          </button>
        </div>

        {/* Background Accent */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mb-20"></div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('bendahara')}
          className={`flex-1 min-w-[170px] px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'bendahara'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <WalletCards className="w-4 h-4" />
          <span>1. Otoritas Bendahara</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kurikulum')}
          className={`flex-1 min-w-[170px] px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'kurikulum'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-cyan-300" />
          <span>2. Otoritas Kurikulum</span>
        </button>

        <button
          onClick={() => setActiveSubTab('guru')}
          className={`flex-1 min-w-[170px] px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'guru'
              ? 'bg-indigo-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Kode Akses Guru ({teachersList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('keamanan')}
          className={`flex-1 min-w-[170px] px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'keamanan'
              ? 'bg-slate-900 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>4. Sandi Master Super Admin</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pengumuman')}
          className={`flex-1 min-w-[170px] px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'pengumuman'
              ? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-300" />
          <span>5. Pesan Pengumuman ({announcementsList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup_restore')}
          className={`flex-1 min-w-[170px] px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'backup_restore'
              ? 'bg-emerald-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-300" />
          <span>6. Backup & Restore Database</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: BENDAHARA 1 S/D 5 CODE CONFIGURATION (SEMUA SAMA TUGASNYA)
          ========================================================================= */}
      {activeSubTab === 'bendahara' && (
        <div className="space-y-6">
          
          {/* Security Alert Banner */}
          <div className="bg-amber-950 text-amber-100 border border-amber-500/40 rounded-2xl p-4 flex items-start space-x-3 shadow-md">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center space-x-2">
                <span>Proteksi Akses Khusus Super Admin:</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] rounded-full">Ketat</span>
              </p>
              <p className="mt-1 text-xs text-amber-200/90 leading-relaxed font-normal">
                Kode akses login Portal Bendahara <strong>hanya diatur oleh Super Admin</strong> di menu khusus ini. Selain kode resmi yang tersimpan di bawah ini, seluruh percobaan login ditolak secara mutlak oleh sistem demi keamanan kas madrasah.
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 text-xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Otoritas Penuh Seluruh Bendahara (Bendahara 1 s/d 5):</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed font-normal">
                Seluruh Bendahara 1, 2, 3, 4, dan 5 memiliki hak akses, tugas, dan tanggung jawab yang sama atas seluruh transaksi pembayaran siswa (SPP, Infaq Gedung, Seragam, Buku, PTS, SAS, DAT, Ujian, dll). Saat melayani pembayaran atau mencetak kwitansi, sistem otomatis mencatat nama bendahara yang sedang aktif bertugas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Card Bendahara Utama */}
            <div className="bg-white rounded-3xl border-2 border-emerald-400 shadow-sm p-6 space-y-5 relative bg-linear-to-b from-emerald-50/30 to-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    BU
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Bendahara Utama (Pusat)
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Bendahara Utama Madrasah</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Bendahara Utama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bendaharaUtamaState.name}
                    onChange={e => setBendaharaUtamaState({ ...bendaharaUtamaState, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Contoh: Hj. Siti Mardhiyah, S.E., M.M."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={bendaharaUtamaState.nip}
                      onChange={e => setBendaharaUtamaState({ ...bendaharaUtamaState, nip: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      placeholder="85780"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={bendaharaUtamaState.phone}
                      onChange={e => setBendaharaUtamaState({ ...bendaharaUtamaState, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      placeholder="081211223344"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={bendaharaUtamaState.roleTitle}
                    onChange={e => setBendaharaUtamaState({ ...bendaharaUtamaState, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Bendahara Utama"
                  />
                </div>

                {/* Secret Access Code Section */}
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kode Akses Portal (Unik)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBendaharaUtamaState({ ...bendaharaUtamaState, kodeUnik: generateRandomCode('BU') })}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Acak Kode</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={bendaharaUtamaState.kodeUnik}
                      onChange={e => setBendaharaUtamaState({ ...bendaharaUtamaState, kodeUnik: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-black font-mono tracking-widest text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                      placeholder="BENDAHARAUTAMA"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bendaharaUtamaState.kodeUnik, 'bu')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      title="Salin Kode Akses"
                    >
                      {copiedId === 'bu' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-800">
                    Kunci utama penerimaan setoran dana kas dari Bendahara 1 s/d 5.
                  </p>
                </div>
              </div>
            </div>

            {/* Card Bendahara 1 */}
            <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-sm p-6 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                    B1
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Bendahara 1
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Bendahara Madrasah</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Bendahara 1 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bendahara1State.name}
                    onChange={e => setBendahara1State({ ...bendahara1State, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Contoh: Siti Rahmawati, S.E."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={bendahara1State.nip}
                      onChange={e => setBendahara1State({ ...bendahara1State, nip: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                      placeholder="85792"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={bendahara1State.phone}
                      onChange={e => setBendahara1State({ ...bendahara1State, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                      placeholder="081234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={bendahara1State.roleTitle}
                    onChange={e => setBendahara1State({ ...bendahara1State, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Bendahara 1"
                  />
                </div>

                {/* Kode Akses Unik Bendahara 1 */}
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-amber-950 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>KODE AKSES BENDAHARA 1</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBendahara1State({ ...bendahara1State, kodeUnik: generateRandomCode('B1', 6) })}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Acak</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={bendahara1State.kodeUnik}
                      onChange={e => setBendahara1State({ ...bendahara1State, kodeUnik: e.target.value.toUpperCase() })}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-black text-amber-950 tracking-wider font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bendahara1State.kodeUnik, 'b1')}
                      className="p-2.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Salin Kode"
                    >
                      {copiedId === 'b1' ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendWhatsAppCode(bendahara1State.name, bendahara1State.roleTitle, bendahara1State.kodeUnik, bendahara1State.phone)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Kirim ke WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Bendahara 2 */}
            <div className="bg-white rounded-3xl border-2 border-indigo-300 shadow-sm p-6 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                    B2
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      Bendahara 2
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Bendahara Madrasah</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Bendahara 2 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bendahara2State.name}
                    onChange={e => setBendahara2State({ ...bendahara2State, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Contoh: Dewi Sutrawati, SE"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={bendahara2State.nip}
                      onChange={e => setBendahara2State({ ...bendahara2State, nip: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      placeholder="85784"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={bendahara2State.phone}
                      onChange={e => setBendahara2State({ ...bendahara2State, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      placeholder="081398765432"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={bendahara2State.roleTitle}
                    onChange={e => setBendahara2State({ ...bendahara2State, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Bendahara 2"
                  />
                </div>

                {/* Kode Akses Unik Bendahara 2 */}
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-indigo-950 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      <span>KODE AKSES BENDAHARA 2</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBendahara2State({ ...bendahara2State, kodeUnik: generateRandomCode('B2', 6) })}
                      className="text-[11px] font-bold text-indigo-800 hover:text-indigo-950 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Acak</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={bendahara2State.kodeUnik}
                      onChange={e => setBendahara2State({ ...bendahara2State, kodeUnik: e.target.value.toUpperCase() })}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-sm font-black text-indigo-950 tracking-wider font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bendahara2State.kodeUnik, 'b2')}
                      className="p-2.5 bg-indigo-200 hover:bg-indigo-300 text-indigo-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Salin Kode"
                    >
                      {copiedId === 'b2' ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendWhatsAppCode(bendahara2State.name, bendahara2State.roleTitle, bendahara2State.kodeUnik, bendahara2State.phone)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Kirim ke WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Bendahara 3 */}
            <div className="bg-white rounded-3xl border-2 border-teal-300 shadow-sm p-6 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-sm">
                    B3
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Bendahara 3
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Bendahara Madrasah</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Bendahara 3 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bendahara3State.name}
                    onChange={e => setBendahara3State({ ...bendahara3State, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Contoh: Ahmad Fauzi, S.Pd"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={bendahara3State.nip}
                      onChange={e => setBendahara3State({ ...bendahara3State, nip: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                      placeholder="85785"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={bendahara3State.phone}
                      onChange={e => setBendahara3State({ ...bendahara3State, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                      placeholder="081298761234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={bendahara3State.roleTitle}
                    onChange={e => setBendahara3State({ ...bendahara3State, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Bendahara 3"
                  />
                </div>

                {/* Kode Akses Unik Bendahara 3 */}
                <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-teal-950 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-teal-600" />
                      <span>KODE AKSES BENDAHARA 3</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBendahara3State({ ...bendahara3State, kodeUnik: generateRandomCode('B3', 6) })}
                      className="text-[11px] font-bold text-teal-800 hover:text-teal-950 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Acak</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={bendahara3State.kodeUnik}
                      onChange={e => setBendahara3State({ ...bendahara3State, kodeUnik: e.target.value.toUpperCase() })}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-sm font-black text-teal-950 tracking-wider font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bendahara3State.kodeUnik, 'b3')}
                      className="p-2.5 bg-teal-200 hover:bg-teal-300 text-teal-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Salin Kode"
                    >
                      {copiedId === 'b3' ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendWhatsAppCode(bendahara3State.name, bendahara3State.roleTitle, bendahara3State.kodeUnik, bendahara3State.phone)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Kirim ke WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Bendahara 4 */}
            <div className="bg-white rounded-3xl border-2 border-purple-300 shadow-sm p-6 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-sm">
                    B4
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Bendahara 4
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Bendahara Madrasah</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Bendahara 4 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bendahara4State.name}
                    onChange={e => setBendahara4State({ ...bendahara4State, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Contoh: Nurul Hidayah, S.Kom"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={bendahara4State.nip}
                      onChange={e => setBendahara4State({ ...bendahara4State, nip: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                      placeholder="85786"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={bendahara4State.phone}
                      onChange={e => setBendahara4State({ ...bendahara4State, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                      placeholder="081356781234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={bendahara4State.roleTitle}
                    onChange={e => setBendahara4State({ ...bendahara4State, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Bendahara 4"
                  />
                </div>

                {/* Kode Akses Unik Bendahara 4 */}
                <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-purple-950 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-purple-600" />
                      <span>KODE AKSES BENDAHARA 4</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBendahara4State({ ...bendahara4State, kodeUnik: generateRandomCode('B4', 6) })}
                      className="text-[11px] font-bold text-purple-800 hover:text-purple-950 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Acak</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={bendahara4State.kodeUnik}
                      onChange={e => setBendahara4State({ ...bendahara4State, kodeUnik: e.target.value.toUpperCase() })}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-sm font-black text-purple-950 tracking-wider font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bendahara4State.kodeUnik, 'b4')}
                      className="p-2.5 bg-purple-200 hover:bg-purple-300 text-purple-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Salin Kode"
                    >
                      {copiedId === 'b4' ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendWhatsAppCode(bendahara4State.name, bendahara4State.roleTitle, bendahara4State.kodeUnik, bendahara4State.phone)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Kirim ke WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Bendahara 5 */}
            <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-sm p-6 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                    B5
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Bendahara 5
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Bendahara Madrasah</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Bendahara 5 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bendahara5State.name}
                    onChange={e => setBendahara5State({ ...bendahara5State, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="Contoh: Hendra Kurniawan, S.Pd"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      value={bendahara5State.nip}
                      onChange={e => setBendahara5State({ ...bendahara5State, nip: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                      placeholder="85787"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={bendahara5State.phone}
                      onChange={e => setBendahara5State({ ...bendahara5State, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                      placeholder="081267891234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={bendahara5State.roleTitle}
                    onChange={e => setBendahara5State({ ...bendahara5State, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="Bendahara 5"
                  />
                </div>

                {/* Kode Akses Unik Bendahara 5 */}
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-rose-950 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-rose-600" />
                      <span>KODE AKSES BENDAHARA 5</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBendahara5State({ ...bendahara5State, kodeUnik: generateRandomCode('B5', 6) })}
                      className="text-[11px] font-bold text-rose-800 hover:text-rose-950 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Acak</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={bendahara5State.kodeUnik}
                      onChange={e => setBendahara5State({ ...bendahara5State, kodeUnik: e.target.value.toUpperCase() })}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-sm font-black text-rose-950 tracking-wider font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bendahara5State.kodeUnik, 'b5')}
                      className="p-2.5 bg-rose-200 hover:bg-rose-300 text-rose-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Salin Kode"
                    >
                      {copiedId === 'b5' ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendWhatsAppCode(bendahara5State.name, bendahara5State.roleTitle, bendahara5State.kodeUnik, bendahara5State.phone)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      title="Kirim ke WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveBendahara}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Otoritas Bendahara 1 s/d 5</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: KURIKULUM & UJIAN ACCESS CODE CONFIGURATION (SUPER ADMIN ONLY)
          ========================================================================= */}
      {activeSubTab === 'kurikulum' && (
        <div className="space-y-6">
          {/* Security Alert Banner */}
          <div className="bg-slate-950 text-white border border-indigo-500/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                    Akses Dikelola Khusus Super Admin
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Otoritas & Kode Akses Portal Waka Kurikulum (STS / SAS / AM)
                </h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed font-normal">
                  Sesuai kebijakan keamanan madrasah: Kode akses login Portal Kurikulum <strong>hanya dapat diatur oleh Super Admin</strong> pada menu ini. Selain kode yang tersimpan di sini, segala upaya login ditolak secara otomatis oleh sistem.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveKurikulum}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Otoritas Kurikulum</span>
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  <span>Biodata Pejabat & Kredensial Login Kurikulum</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kode akses bersifat rahasia dan diberikan hanya kepada Waka Kurikulum yang berwenang untuk mengelola jadwal ujian dan nilai.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const newCode = generateRandomCode('KUR', 5);
                    setKurikulumState(prev => ({ ...prev, kodeUnik: newCode }));
                    showToast(`Kode acak "${newCode}" digenerate! Klik Simpan untuk menerapkan.`);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Kode Acak</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Waka Kurikulum <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kurikulumState.name}
                  onChange={e => setKurikulumState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Agustiani, S.Pd"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP / NUPTK Waka Kurikulum <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kurikulumState.nip}
                  onChange={e => setKurikulumState(prev => ({ ...prev, nip: e.target.value }))}
                  placeholder="Contoh: 85781 atau 197..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  No. WhatsApp Resmi Waka Kurikulum
                </label>
                <input
                  type="text"
                  value={kurikulumState.phone}
                  onChange={e => setKurikulumState(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Contoh: 081234567806"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Resmi Kurikulum
                </label>
                <input
                  type="email"
                  value={kurikulumState.email}
                  onChange={e => setKurikulumState(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Contoh: kurikulum@mtsmanbaulislam.sch.id"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Credential Box */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-cyan-50/80 border-2 border-indigo-300 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <label className="text-xs font-black text-indigo-950 flex items-center space-x-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-700" />
                    <span>KODE AKSES RESMI LOGIN KURIKULUM (DIATUR KHUSUS SUPER ADMIN)</span>
                  </label>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Kode ini digunakan untuk membuka Portal Waka Kurikulum pada Halaman Login Utama.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(kurikulumState.kodeUnik, 'kurikulum-code')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    {copiedId === 'kurikulum-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'kurikulum-code' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendWhatsAppCode(kurikulumState.name, 'Waka Kurikulum', kurikulumState.kodeUnik, kurikulumState.phone)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showKurikulumCode ? 'text' : 'password'}
                  required
                  value={kurikulumState.kodeUnik}
                  onChange={e => setKurikulumState(prev => ({ ...prev, kodeUnik: e.target.value.toUpperCase() }))}
                  placeholder="Contoh: KURIKULUM2026 atau KUR-7821"
                  className="w-full pl-11 pr-11 py-3 bg-white border-2 border-indigo-400 rounded-xl text-sm font-mono font-black text-indigo-950 tracking-wider focus:ring-2 focus:ring-indigo-600 focus:outline-none uppercase shadow-inner"
                />
                <KeyRound className="w-5 h-5 text-indigo-500 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowKurikulumCode(!showKurikulumCode)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                >
                  {showKurikulumCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="mt-3 flex items-start space-x-2 text-[11px] text-indigo-800 bg-white/70 p-2.5 rounded-lg border border-indigo-200">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Keamanan:</strong> Jangan berikan kode ini kepada pihak selain Waka Kurikulum. Jika kode diubah, klik tombol <strong>"Simpan Otoritas Kurikulum"</strong> agar kode baru segera aktif di sistem login.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveKurikulum}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Otoritas Kurikulum</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TEACHERS ACCESS CODES MANAGEMENT
          ========================================================================= */}
      {activeSubTab === 'guru' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          
          {/* Header Controls & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">Daftar Kode Akses Dewan Guru</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {teachersList.length} guru terdaftar. Atur kode personal guru untuk masuk atau kirim via WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoGenerateAllTeacherCodes}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto Generate Semua (GURU-NIP)</span>
              </button>

              <button
                type="button"
                onClick={handleExportTeachersCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekspor CSV</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllTeachers}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Kode Guru</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari guru berdasarkan nama, NIP, atau kode akses..."
              value={teacherSearch}
              onChange={e => setTeacherSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Teachers Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                  <th className="py-3 px-4">NIP / NUPTK</th>
                  <th className="py-3 px-4">Tugas / Status</th>
                  <th className="py-3 px-4">No. WhatsApp</th>
                  <th className="py-3 px-4">Kode Akses Guru</th>
                  <th className="py-3 px-4 text-center">Kirim WA / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t, idx) => {
                  const waliCls = Object.entries(classWaliKelas).find(([_, name]) => name === t.name)?.[0];
                  const hasPhone = !!t.phone && t.phone.trim().length > 5;

                  return (
                    <tr key={t.id} className="hover:bg-indigo-50/40 transition">
                      <td className="py-2.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {t.name}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 font-semibold">{t.nip || '-'}</td>
                      <td className="py-2.5 px-4">
                        {waliCls ? (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-bold text-[10px]">
                            Wali Kelas {waliCls}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Guru Mapel</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="tel"
                          value={t.phone || ''}
                          onChange={e => handleTeacherPhoneChange(t.id, e.target.value)}
                          placeholder="08..."
                          className="w-32 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={t.kodeUnik || ''}
                            onChange={e => handleTeacherCodeChange(t.id, e.target.value)}
                            placeholder={`GURU-${t.nip}`}
                            className="w-36 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black font-mono text-indigo-950 uppercase tracking-wider focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleTeacherCodeChange(t.id, generateRandomCode('GURU', 5))}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Generate Acak"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(t.kodeUnik || `GURU-${t.nip}`, t.id)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Salin Kode"
                          >
                            {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => sendWhatsAppCode(t.name, waliCls ? `Wali Kelas ${waliCls}` : 'Dewan Guru', t.kodeUnik || `GURU-${t.nip}`, t.phone)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 mx-auto cursor-pointer ${
                            hasPhone
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Kirim Kode via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Note */}
          <p className="text-[11px] text-slate-400 italic">
            * Setelah mengedit kode akses atau nomor WhatsApp guru di atas, klik tombol <strong>"Simpan Kode Guru"</strong> di bagian kanan atas agar data tersimpan ke Cloud Firestore.
          </p>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MASTER ADMIN PASSCODE & SECURITY
          ========================================================================= */}
      {activeSubTab === 'keamanan' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">
              <KeyRound className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Ubah Kata Sandi Master Super Admin</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kata sandi ini digunakan untuk membuka panel khusus admin ini.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateAdminPasscode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={newAdminPasscode}
                onChange={e => setNewAdminPasscode(e.target.value)}
                placeholder="Masukkan kata sandi baru (min 4 karakter)..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={confirmAdminPasscode}
                onChange={e => setConfirmAdminPasscode(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Kata sandi aktif saat ini: <strong className="text-slate-900 font-mono">{adminSettings?.adminPasscode || 'akhmadtaufik84@'}</strong>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Perbarui Kata Sandi Admin</span>
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PESAN PENGUMUMAN GURU & STAF (BROADCAST ANNOUNCEMENTS)
          ========================================================================= */}
      {activeSubTab === 'pengumuman' && (
        <div className="space-y-6">
          {/* Header & Quick Action */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-linear-to-br from-indigo-600 to-slate-900 text-white rounded-2xl flex items-center justify-center font-black shadow-indigo-100 shrink-0">
                <Megaphone className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-slate-900">Modul Siaran Pesan Pengumuman Madrasah</h3>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                    🔒 Khusus Super Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hanya Super Admin yang berwenang membuat dan menerbitkan pengumuman. Pengumuman aktif akan muncul sebagai <strong>Banner Berjalan (Running Text)</strong> di layar seluruh guru dan staf.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenNewAnnouncement}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Buat Pengumuman Baru</span>
            </button>
          </div>

          {/* Stats Bar & Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Total Pengumuman</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{announcementsList.length}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Bell className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase">Sedang Tayang (Aktif)</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">
                  {announcementsList.filter(a => a.active).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase">Penting / Darurat</p>
                <p className="text-xl font-black text-amber-700 mt-0.5">
                  {announcementsList.filter(a => a.type === 'important' || a.type === 'urgent').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Form Modal / Inline Editor */}
          {showAnnouncementForm && (
            <div className="bg-white rounded-3xl border-2 border-indigo-500/30 shadow-xl p-6 relative animate-scale-up">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {editingAnnouncementId ? 'Edit Pesan Pengumuman' : 'Tulis & Siarkan Pengumuman Baru'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tentukan isi pesan, tingkat urgensi, dan target penerima pengumuman.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAnnouncementForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Judul */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul Pengumuman <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pengisian Presensi & Jurnal KBM Tepat Waktu"
                      value={announcementForm.title}
                      onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Tingkat Kepentingan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kategori / Tingkat Urgensi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAnnouncementForm({ ...announcementForm, type: 'info' })}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 text-xs font-bold transition cursor-pointer ${
                          announcementForm.type === 'info'
                            ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Info className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Informasi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAnnouncementForm({ ...announcementForm, type: 'important' })}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 text-xs font-bold transition cursor-pointer ${
                          announcementForm.type === 'important'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Megaphone className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Penting</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAnnouncementForm({ ...announcementForm, type: 'warning' })}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 text-xs font-bold transition cursor-pointer ${
                          announcementForm.type === 'warning'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Peringatan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAnnouncementForm({ ...announcementForm, type: 'urgent' })}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 text-xs font-bold transition cursor-pointer ${
                          announcementForm.type === 'urgent'
                            ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Darurat</span>
                      </button>
                    </div>
                  </div>

                  {/* Pengirim / Author & Target */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pengirim / Atas Nama
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Admin Madrasah / Kepala Madrasah"
                        value={announcementForm.authorName}
                        onChange={e => setAnnouncementForm({ ...announcementForm, authorName: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target Penerima Siaran
                      </label>
                      <select
                        value={announcementForm.targetAudience}
                        onChange={e => {
                          const val = e.target.value;
                          setAnnouncementForm({
                            ...announcementForm,
                            targetAudience: val as any,
                            targetStudentId: val === 'siswa_khusus' ? announcementForm.targetStudentId : '',
                            targetStudentCode: val === 'siswa_khusus' ? announcementForm.targetStudentCode : '',
                            targetStudentName: val === 'siswa_khusus' ? announcementForm.targetStudentName : '',
                            targetClass: (val === 'orang_tua' || val === 'siswa_khusus') ? announcementForm.targetClass : ''
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="all">🌐 Semua Guru, Staf & Orang Tua (Umum)</option>
                        <option value="guru">👨‍🏫 Hanya Dewan Guru & Staf</option>
                        <option value="wali_kelas">📋 Hanya Wali Kelas</option>
                        <option value="orang_tua">👨‍👩‍👧 Orang Tua / Wali Siswa (Semua / Per Kelas)</option>
                        <option value="siswa_khusus">🔒 Orang Tua Siswa Tertentu (Berdasarkan Kode Unik)</option>
                      </select>
                    </div>
                  </div>

                  {/* Sub-selector for Target: Orang Tua (Semua atau Per Kelas) */}
                  {announcementForm.targetAudience === 'orang_tua' && (
                    <div className="md:col-span-2 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-emerald-900">👨‍👩‍👧 Opsi Kelas Orang Tua</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                            Pilih Target Kelas (Opsional)
                          </label>
                          <select
                            value={announcementForm.targetClass || ''}
                            onChange={e => setAnnouncementForm({ ...announcementForm, targetClass: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="">Semua Kelas (Kelas 7, 8, dan 9)</option>
                            {classList.map(cls => (
                              <option key={cls} value={cls}>Kelas {cls}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Pengumuman ini akan ditampilkan di <strong>Portal Orang Tua / Siswa</strong> saat login dengan Kode Unik siswa {announcementForm.targetClass ? `di Kelas ${announcementForm.targetClass}` : 'semua kelas'}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sub-selector for Target: Siswa Khusus (Berdasarkan Kode Unik Siswa) */}
                  {announcementForm.targetAudience === 'siswa_khusus' && (
                    <div className="md:col-span-2 p-4 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            🔒 Target Personal
                          </span>
                          <span className="text-xs font-black text-indigo-950">
                            Pilih Siswa / Masukkan Kode Unik Siswa
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-700 font-bold">
                          Hanya muncul di akun pemilik Kode Unik ini
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Selector Siswa dari Database */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Pilih dari Daftar Siswa
                          </label>
                          <select
                            value={announcementForm.targetStudentId || ''}
                            onChange={e => {
                              const selectedId = e.target.value;
                              const st = students.find(s => s.id === selectedId);
                              if (st) {
                                setAnnouncementForm({
                                  ...announcementForm,
                                  targetStudentId: st.id,
                                  targetStudentCode: st.kodeUnik || '',
                                  targetStudentName: st.name,
                                  targetClass: st.className
                                });
                              } else {
                                setAnnouncementForm({
                                  ...announcementForm,
                                  targetStudentId: '',
                                  targetStudentCode: '',
                                  targetStudentName: '',
                                  targetClass: ''
                                });
                              }
                            }}
                            className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="">-- Pilih Siswa dari Daftar ({students.length} Siswa) --</option>
                            {students.map(st => (
                              <option key={st.id} value={st.id}>
                                [{st.kodeUnik || 'Tanpa Kode'}] {st.name} - Kelas {st.className}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Input Manual Kode Unik Siswa */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Kode Unik Siswa Target <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: UNIK-7A-01 atau kode unik siswa"
                            value={announcementForm.targetStudentCode || ''}
                            onChange={e => {
                              const typedCode = e.target.value.trim();
                              const matched = students.find(
                                s => s.kodeUnik && s.kodeUnik.toLowerCase() === typedCode.toLowerCase()
                              );
                              setAnnouncementForm({
                                ...announcementForm,
                                targetStudentCode: e.target.value,
                                targetStudentId: matched ? matched.id : announcementForm.targetStudentId,
                                targetStudentName: matched ? matched.name : announcementForm.targetStudentName,
                                targetClass: matched ? matched.className : announcementForm.targetClass
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Status Terpilih Siswa Target */}
                      {announcementForm.targetStudentCode && (
                        <div className="p-2.5 bg-white border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-emerald-600 font-bold">✓ Target Terkunci:</span>
                            <span className="font-extrabold text-slate-900">
                              {announcementForm.targetStudentName || 'Siswa Terpilih'}
                            </span>
                            {announcementForm.targetClass && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                Kelas {announcementForm.targetClass}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Kode: {announcementForm.targetStudentCode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Isi Pesan */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Isi Pesan Pengumuman <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tuliskan isi pengumuman secara rinci dan jelas..."
                      value={announcementForm.message}
                      onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Status Keaktifan & Web Push Notification */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="announcementActive"
                        checked={announcementForm.active}
                        onChange={e => setAnnouncementForm({ ...announcementForm, active: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <label htmlFor="announcementActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Tayangkan langsung di dashboard guru saat login (Status Aktif)
                      </label>
                    </div>

                    <div className="flex items-center justify-between bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="sendPushOnSave"
                          checked={sendPushOnSave}
                          onChange={e => setSendPushOnSave(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div>
                          <label htmlFor="sendPushOnSave" className="text-xs font-black text-indigo-950 cursor-pointer flex items-center gap-1.5">
                            <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Kirim Web Push Notification ke Layar HP/Browser Guru</span>
                          </label>
                          <p className="text-[11px] text-indigo-700">
                            Pesan akan langsung muncul sebagai pop-up notifikasi di layar HP guru yang telah mengaktifkan izin notifikasi.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAnnouncementForm(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-sm transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>{editingAnnouncementId ? 'Simpan & Siarkan' : 'Kirim & Siarkan Push Notification'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Announcements */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Daftar Pesan Pengumuman Terbit
                </span>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {filteredAnnouncements.length}
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setAnnouncementFilter('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    announcementFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setAnnouncementFilter('active')}
                  className={`px-3 py-1 rounded-lg transition ${
                    announcementFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setAnnouncementFilter('important')}
                  className={`px-3 py-1 rounded-lg transition ${
                    announcementFilter === 'important' ? 'bg-white text-amber-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Penting/Darurat
                </button>
              </div>
            </div>

            {filteredAnnouncements.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-50" />
                <p className="text-xs font-bold text-slate-600">Belum ada pesan pengumuman pada kategori ini</p>
                <p className="text-[11px] text-slate-400 mt-1">Klik tombol "Kirim Pengumuman Baru" di atas untuk membuat siaran.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAnnouncements.map((ann) => {
                  const formattedDate = ann.createdAt
                    ? new Date(ann.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  const getBadge = () => {
                    switch (ann.type) {
                      case 'urgent':
                        return <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-rose-200">🔴 Darurat</span>;
                      case 'warning':
                        return <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-200">🟠 Peringatan</span>;
                      case 'important':
                        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-indigo-200">🟡 Penting</span>;
                      default:
                        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-blue-200">🔵 Informasi</span>;
                    }
                  };

                  const getAudienceBadge = () => {
                    switch (ann.targetAudience) {
                      case 'siswa_khusus':
                        return (
                          <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                            <span>🔒 Khusus:</span>
                            <span className="font-mono">{ann.targetStudentCode || ann.targetStudentName}</span>
                            {ann.targetStudentName && ann.targetStudentCode && (
                              <span className="opacity-75">({ann.targetStudentName})</span>
                            )}
                          </span>
                        );
                      case 'orang_tua':
                        return (
                          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                            👨‍👩‍👧 Orang Tua {ann.targetClass ? `(Kelas ${ann.targetClass})` : '(Semua Kelas)'}
                          </span>
                        );
                      case 'guru':
                        return (
                          <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                            👨‍🏫 Dewan Guru & Staf
                          </span>
                        );
                      case 'wali_kelas':
                        return (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200">
                            📋 Wali Kelas
                          </span>
                        );
                      default:
                        return (
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            🌐 Umum (Semua)
                          </span>
                        );
                    }
                  };

                  return (
                    <div key={ann.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getBadge()}
                          {getAudienceBadge()}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            ann.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {ann.active ? '✓ Tayang Aktif' : '⏸ Nonaktif'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formattedDate}
                          </span>
                          {ann.authorName && (
                            <span className="text-[11px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                              Oleh: {ann.authorName}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-slate-900">
                          {ann.title}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 font-normal">
                          {ann.message}
                        </p>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-start">
                        <button
                          type="button"
                          onClick={() => handleSendSinglePush(ann)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition flex items-center space-x-1 cursor-pointer"
                          title="Kirim Web Push Notification ke HP/Browser"
                        >
                          <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Push HP</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleAnnouncementStatus(ann.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                            ann.active
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title={ann.active ? 'Nonaktifkan Pengumuman' : 'Aktifkan Pengumuman'}
                        >
                          {ann.active ? <span>Jeda Tayang</span> : <span>Aktifkan</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditAnnouncement(ann)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-100 transition cursor-pointer"
                          title="Edit Pengumuman"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition cursor-pointer"
                          title="Hapus Pengumuman"
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
          TAB 5: BACKUP & RESTORE DATABASE TERPUSAT
          ========================================================================= */}
      {activeSubTab === 'backup_restore' && (
        <DatabaseBackupRestore
          schoolId={schoolId}
          schoolName={schoolName}
          students={students}
          teachers={teachers}
          subjects={subjects}
          schoolOfficials={schoolOfficials}
          classWaliKelas={classWaliKelas}
          sessions={sessions}
          grades={grades}
          lessonPlans={lessonPlans}
          violations={violations}
          payments={payments}
          cashDeposits={cashDeposits}
          treasurerExpenses={treasurerExpenses}
          feeTariffs={tariffs}
          studentBillSettings={studentBillSettings}
          adminSettings={adminSettings}
          schedules={schedules}
          announcements={announcementsList}
          academicSettings={academicSettings}
          onRestoreFullDatabase={onRestoreFullDatabase || (async () => {})}
          onResetDatabase={onResetDatabase || (async () => {})}
        />
      )}

    </div>
  );
};

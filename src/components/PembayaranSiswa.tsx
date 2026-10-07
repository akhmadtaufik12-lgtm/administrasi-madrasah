import React, { useState, useMemo } from 'react';
import {
  WalletCards,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Printer,
  FileText,
  MessageCircle,
  Download,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Shirt,
  BookOpen,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Edit3,
  X,
  FileSpreadsheet,
  Users,
  ChevronRight,
  ShieldAlert,
  Save,
  Check,
  Receipt,
  Award,
  Info,
  Layers,
  Banknote,
  ArrowUpRight,
  PieChart,
  User,
  Clock,
  CheckCheck,
  BarChart3,
  CalendarRange,
  RotateCcw,
  ArrowRightLeft,
  SendHorizonal,
  ArrowDownRight,
  HandCoins,
  TrendingDown,
  Coins,
  Tag,
  Package,
  Store,
  ShoppingBag,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Student,
  PaymentTransaction,
  PaymentCategory,
  FeeTariffSettings,
  SchoolOfficials,
  AdminSettings,
  BendaharaPerson,
  StudentBillSettings,
  CashDepositTransaction,
  TreasurerExpenseTransaction,
  InventoryItem,
  InventoryMovementLog,
  UniformType,
  ItemSize,
  POS_PEMASUKAN_OPTIONS
} from '../types';
import { exportToCSV } from '../utils/export';
import {
  getAllTreasurers,
  getCollectingTreasurers,
  getTreasurerUtama,
  cleanTreasurerRole,
  DEFAULT_STUDENT_BILL_SETTINGS,
  matchTreasurerFromReceivedBy,
  MatchedTreasurerInfo,
  isStudentGradeMatching,
  getGradeFromClassName,
  getSppTariffForGrade,
  calculateStudentArrears,
  filterPaymentsForStudent,
  countUnsyncedPayments,
  syncPaymentsWithStudents,
  getStoredInventory,
  getStoredInventoryLogs,
  deductInventoryStock,
  restockInventoryItem
} from '../utils/storage';
import { AturTagihanTunggakan } from './AturTagihanTunggakan';
import { SyncPaymentsModal } from './SyncPaymentsModal';
import { PengeluaranKas } from './PengeluaranKas';
import { ManajemenStokBarang } from './ManajemenStokBarang';
import { KasirPenjualanPOS } from './KasirPenjualanPOS';
import { RiwayatPenjualan } from './RiwayatPenjualan';
import { KasPenjualan } from './KasPenjualan';
import { LaporanPenjualan } from './LaporanPenjualan';

// Indonesian number to words (terbilang) helper
function numberToWords(num: number): string {
  if (num === 0) return 'Nol Rupiah';
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convert(n: number): string {
    if (n < 12) return units[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh ' + units[n % 10];
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    if (n < 2000) return 'Seribu ' + convert(n - 1000);
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    if (n < 1000000000000) return convert(Math.floor(n / 1000000000)) + ' Milyar ' + convert(n % 1000000000);
    return String(n);
  }

  return convert(Math.floor(num)).trim().replace(/\s+/g, ' ') + ' Rupiah';
}

const MONTHS_LIST = [
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
];

interface PembayaranSiswaProps {
  students: Student[];
  classList: string[];
  payments: PaymentTransaction[];
  tariffs: FeeTariffSettings;
  schoolOfficials: SchoolOfficials;
  adminSettings?: AdminSettings;
  academicYear: string;
  semester: string;
  billSettings?: StudentBillSettings;
  cashDeposits?: CashDepositTransaction[];
  expenses?: TreasurerExpenseTransaction[];
  inventory?: InventoryItem[];
  inventoryLogs?: InventoryMovementLog[];
  onSavePayment: (payment: PaymentTransaction) => Promise<void> | void;
  onDeletePayment: (paymentId: string) => Promise<void> | void;
  onSaveTariffs: (tariffs: FeeTariffSettings) => Promise<void> | void;
  onSaveBendaharaCode: (code: string) => void;
  onUpdateSchoolOfficials?: (officials: SchoolOfficials) => void;
  onSaveBillSettings?: (settings: StudentBillSettings) => Promise<void> | void;
  onSaveCashDeposit?: (deposit: CashDepositTransaction) => Promise<void> | void;
  onDeleteCashDeposit?: (depositId: string) => Promise<void> | void;
  onSaveExpense?: (expense: TreasurerExpenseTransaction) => Promise<void> | void;
  onDeleteExpense?: (expenseId: string) => Promise<void> | void;
  onSaveInventoryItem?: (item: InventoryItem) => Promise<void> | void;
  onDeleteInventoryItem?: (itemId: string) => Promise<void> | void;
  onSaveInventoryLog?: (log: InventoryMovementLog) => Promise<void> | void;
  onDeductStock?: (
    itemId: string,
    qty: number,
    metadata: {
      studentId?: string;
      studentName?: string;
      studentClass?: string;
      invoiceNumber?: string;
      paymentId?: string;
      treasurerName: string;
      notes?: string;
      date?: string;
    }
  ) => { success: boolean; item?: InventoryItem; log?: InventoryMovementLog; error?: string };
  onRestockItem?: (
    itemId: string,
    qty: number,
    metadata: {
      treasurerName: string;
      notes?: string;
      date?: string;
      unitPrice?: number;
    }
  ) => { success: boolean; item?: InventoryItem; log?: InventoryMovementLog };
  onLogout?: () => void;
  onSyncPayments?: () => Promise<any> | any;
}

export const PembayaranSiswa: React.FC<PembayaranSiswaProps> = ({
  students,
  classList,
  payments,
  tariffs,
  schoolOfficials,
  adminSettings,
  academicYear,
  semester,
  billSettings,
  cashDeposits,
  expenses = [],
  inventory = [],
  inventoryLogs = [],
  onSavePayment,
  onDeletePayment,
  onSaveTariffs,
  onSaveBendaharaCode,
  onUpdateSchoolOfficials,
  onSaveBillSettings,
  onSaveCashDeposit,
  onDeleteCashDeposit,
  onSaveExpense,
  onDeleteExpense,
  onSaveInventoryItem,
  onDeleteInventoryItem,
  onSaveInventoryLog,
  onDeductStock,
  onRestockItem,
  onLogout,
  onSyncPayments
}) => {
  // All configured treasurers (Bendahara 1 to 4)
  const allTreasurers = useMemo<BendaharaPerson[]>(() => {
    return getAllTreasurers(schoolOfficials);
  }, [schoolOfficials]);

  // Bendahara Authentication State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('mts_bendahara_unlocked') === 'true' ||
      localStorage.getItem('mts_bendahara_unlocked') === 'true'
    );
  });

  // Strict logged-in treasurer ID (b1, b2, b3, b4)
  const [activeTreasurerId, setActiveTreasurerId] = useState<string>(() => {
    return (
      localStorage.getItem('mts_active_treasurer_id') ||
      sessionStorage.getItem('mts_active_treasurer_id') ||
      'b1'
    );
  });

  // Resolve currently active treasurer object
  const activeTreasurer = useMemo<BendaharaPerson>(() => {
    const found = allTreasurers.find(t => t.id === activeTreasurerId);
    if (found) return found;
    return (
      allTreasurers[0] || {
        id: 'b1',
        name: schoolOfficials?.bendahara?.name || 'Siti Rahmawati, S.E.',
        nip: schoolOfficials?.bendahara?.nip || '85792',
        phone: schoolOfficials?.bendahara?.phone || '081234567890',
        roleTitle: schoolOfficials?.bendahara?.roleTitle || 'Bendahara 1',
        kodeUnik: tariffs?.bendaharaKodeUnik || 'BENDAHARA1',
        active: true
      }
    );
  }, [allTreasurers, activeTreasurerId, schoolOfficials, tariffs]);

  const [inputCode, setInputCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [rememberAuth, setRememberAuth] = useState(true);

  // Domain Switcher: 'pembayaran' (Pembayaran Sekolah) vs 'penjualan' (Penjualan / Koperasi)
  const [financeDomain, setFinanceDomain] = useState<'pembayaran' | 'penjualan'>('pembayaran');

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'input' | 'stok_barang' | 'tagihan_tunggakan' | 'riwayat' | 'matrix_spp' | 'setoran_kas' | 'pengeluaran' | 'laporan' | 'pengaturan' | 'pos_penjualan' | 'riwayat_penjualan' | 'kas_penjualan' | 'laporan_penjualan'
  >('input');

  // Input Form State
  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || 'VII A');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('SPP');
  const [selectedBillingItemId, setSelectedBillingItemId] = useState<string>('spp');
  const [posFilterTab, setPosFilterTab] = useState<'ALL' | 'WAJIB' | 'TIDAK_WAJIB'>('ALL');
  
  // Specific Inventory Selection inside Payment Form
  const [selectedUniformType, setSelectedUniformType] = useState<UniformType>('Baju Olahraga');
  const [selectedUniformSize, setSelectedUniformSize] = useState<ItemSize | string>('M');
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>('');
  const [stockItemQuantity, setStockItemQuantity] = useState<number>(1);

  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return [monthNames[new Date().getMonth()]];
  });
  const selectedMonth = selectedMonths[0] || '';
  const setSelectedMonth = (m: string) => setSelectedMonths([m]);
  const [customCategoryLabel, setCustomCategoryLabel] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(tariffs?.sppMonthly || 150000);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Kwitansi Print
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentTransaction | null>(null);

  // Setoran Kas ke Bendahara Utama State
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [depositFromTreasurerId, setDepositFromTreasurerId] = useState<string>('b1');
  const [depositPosCategory, setDepositPosCategory] = useState<string>('SEMUA');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositDate, setDepositDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [depositNotes, setDepositNotes] = useState<string>('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState<boolean>(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string>('');
  const [selectedDepositReceipt, setSelectedDepositReceipt] = useState<CashDepositTransaction | null>(null);
  const [deleteDepositTarget, setDeleteDepositTarget] = useState<CashDepositTransaction | null>(null);

  // Filter State in Riwayat
  const [historySearch, setHistorySearch] = useState('');
  const [historyClassFilter, setHistoryClassFilter] = useState('ALL');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('ALL');
  const [historyMonthFilter, setHistoryMonthFilter] = useState('ALL');
  const [historyTreasurerFilter, setHistoryTreasurerFilter] = useState('ALL');

  // Matrix SPP Class Filter
  const [matrixClass, setMatrixClass] = useState<string>(classList[0] || 'VII A');

  // Settings State
  const [tempTariffs, setTempTariffs] = useState<FeeTariffSettings>(() => tariffs || {
    sppMonthly: 150000,
    uangGedung: 1200000,
    uangSeragam: 650000,
    uangBuku: 400000,
    biayaPTS: 150000,
    biayaSAS: 200000,
    biayaDAT: 250000,
    biayaUjian: 200000,
    bendaharaKodeUnik: 'BENDAHARA1',
    bendahara2KodeUnik: 'BENDAHARA2',
    bendahara3KodeUnik: 'BENDAHARA3',
    bendahara4KodeUnik: 'BENDAHARA4',
    bendahara5KodeUnik: 'BENDAHARA5'
  });
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');

  // Print Report Modal State
  const [showPrintReportModal, setShowPrintReportModal] = useState<boolean>(false);

  // Laporan Kas Masuk & Identifikasi Bendahara States
  const [reportDateRange, setReportDateRange] = useState<'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | 'THIS_SEMESTER' | 'CUSTOM'>('ALL');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportTreasurerFilter, setReportTreasurerFilter] = useState<string>('ALL');
  const [reportClassFilter, setReportClassFilter] = useState<string>('ALL');
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('ALL');
  const [reportMethodFilter, setReportMethodFilter] = useState<string>('ALL');
  const [reportSearch, setReportSearch] = useState<string>('');
  const [reportActiveSection, setReportActiveSection] = useState<'semua' | 'per_bendahara' | 'per_pos' | 'jurnal_mutasi'>('semua');
  const [showPrintKasMasukModal, setShowPrintKasMasukModal] = useState<boolean>(false);

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<PaymentTransaction | null>(null);

  // Sync payments state
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<any>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Treasurer Left Sidebar Auto-Hide state
  const [isTreasurerSidebarAutoHide, setIsTreasurerSidebarAutoHide] = useState<boolean>(() => {
    return localStorage.getItem('mts_treasurer_sidebar_autohide') === 'true';
  });
  const [isTreasurerSidebarHovered, setIsTreasurerSidebarHovered] = useState<boolean>(false);
  const [isTreasurerMobileMenuOpen, setIsTreasurerMobileMenuOpen] = useState<boolean>(false);

  // Pos Pemasukan States
  const [posFilterMode, setPosFilterMode] = useState<'ALL' | 'ACTIVE' | 'UNSETTLED'>('ALL');
  const [posTreasurerView, setPosTreasurerView] = useState<string>('DEFAULT'); // 'DEFAULT' | 'ALL' | 'b1' | 'b2' | 'b3' | 'b4' | 'b5'
  const [posSearchQuery, setPosSearchQuery] = useState<string>('');
  const [isPosBreakdownCollapsed, setIsPosBreakdownCollapsed] = useState<boolean>(false);

  const handleToggleTreasurerSidebarAutoHide = () => {
    setIsTreasurerSidebarAutoHide(prev => {
      const next = !prev;
      localStorage.setItem('mts_treasurer_sidebar_autohide', String(next));
      return next;
    });
  };

  const unsyncedStats = useMemo(() => {
    return countUnsyncedPayments(payments, students);
  }, [payments, students]);

  const handleExecuteSyncGlobal = async () => {
    setIsSyncingGlobal(true);
    try {
      const res = onSyncPayments ? await onSyncPayments() : syncPaymentsWithStudents(payments, students);
      setSyncFeedback(res);
      // When synced, banner will automatically disappear because unsyncedStats.fixableCount becomes 0!
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  // Filter students by selected class for the form
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass).sort((a, b) => a.rollNo - b.rollNo);
  }, [students, selectedClass]);

  // Selected student object
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Determine current student / selected class grade level (VII, VIII, IX, X, XI, XII, or Semua)
  const studentGradeLevel = useMemo(() => {
    const cls = currentStudent?.className || selectedClass || '';
    return getGradeFromClassName(cls);
  }, [currentStudent, selectedClass]);

  // Dynamic SPP tariff based on selected student/class grade level
  const currentSppTariff = useMemo(() => {
    return getSppTariffForGrade(tariffs, currentStudent?.className || selectedClass);
  }, [tariffs, currentStudent, selectedClass]);

  // Available grade levels detected in the school
  const availableSchoolGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    classList.forEach(cls => {
      gradesSet.add(getGradeFromClassName(cls));
    });
    const list = Array.from(gradesSet);
    if (list.length > 0) return list;
    return ['VII', 'VIII', 'IX'];
  }, [classList]);

  // Arrears summary for selected student (contains active obligation items, paid status, spp paid months)
  const currentStudentArrears = useMemo(() => {
    if (!currentStudent) return null;
    return calculateStudentArrears(
      currentStudent,
      payments,
      tariffs,
      billSettings || DEFAULT_STUDENT_BILL_SETTINGS,
      academicYear
    );
  }, [currentStudent, payments, tariffs, billSettings, academicYear]);

  // Pos / Jenis Pembayaran categorized as Wajib vs Tidak Wajib for current student & grade level
  const categorizedPosItems = useMemo(() => {
    const effectiveSettings = billSettings || DEFAULT_STUDENT_BILL_SETTINGS;
    const stdItems = effectiveSettings.standardBillingItems || [];
    const activeObs = effectiveSettings.activeObligations || {};
    const override = currentStudent ? effectiveSettings.studentOverrides?.[currentStudent.id] : undefined;

    // Built-in base items definition with dynamic tariffs
    const baseItems = [
      {
        id: 'spp',
        key: 'spp',
        category: 'SPP' as PaymentCategory,
        name: 'SPP Bulanan',
        sub: `Bulanan (Tingkat ${studentGradeLevel})`,
        icon: CreditCard,
        color: 'hover:border-indigo-500',
        activeColor: 'bg-indigo-50 border-indigo-600 text-indigo-950',
        iconColor: 'text-indigo-600',
        defaultAmount: currentSppTariff,
        frequency: 'Bulanan',
        isBuiltIn: true
      },
      {
        id: 'gedung',
        key: 'gedung',
        category: 'GEDUNG' as PaymentCategory,
        name: 'Infaq Gedung',
        sub: 'Pembangunan',
        icon: Building2,
        color: 'hover:border-amber-500',
        activeColor: 'bg-amber-50 border-amber-600 text-amber-950',
        iconColor: 'text-amber-600',
        defaultAmount: tariffs?.uangGedung || 1500000,
        frequency: 'Tahunan / Sekali Bayar',
        isBuiltIn: true
      },
      {
        id: 'seragam',
        key: 'seragam',
        category: 'SERAGAM' as PaymentCategory,
        name: 'Uang Seragam',
        sub: 'Atribut',
        icon: Shirt,
        color: 'hover:border-teal-500',
        activeColor: 'bg-teal-50 border-teal-600 text-teal-950',
        iconColor: 'text-teal-600',
        defaultAmount: tariffs?.uangSeragam || 750000,
        frequency: 'Tahunan / Sekali Bayar',
        isBuiltIn: true
      },
      {
        id: 'buku',
        key: 'buku',
        category: 'BUKU' as PaymentCategory,
        name: 'Buku & LKS',
        sub: 'Paket Pelajaran',
        icon: BookOpen,
        color: 'hover:border-blue-500',
        activeColor: 'bg-blue-50 border-blue-600 text-blue-950',
        iconColor: 'text-blue-600',
        defaultAmount: tariffs?.uangBuku || 500000,
        frequency: 'Tahunan / Sekali Bayar',
        isBuiltIn: true
      },
      {
        id: 'pts',
        key: 'pts',
        category: 'PTS' as PaymentCategory,
        name: 'Ujian PTS',
        sub: 'Tengah Semester',
        icon: GraduationCap,
        color: 'hover:border-purple-500',
        activeColor: 'bg-purple-50 border-purple-600 text-purple-950',
        iconColor: 'text-purple-600',
        defaultAmount: tariffs?.biayaPTS || 175000,
        frequency: 'Per Semester',
        isBuiltIn: true
      },
      {
        id: 'sas',
        key: 'sas',
        category: 'SAS' as PaymentCategory,
        name: 'Ujian SAS',
        sub: 'Akhir Semester',
        icon: Award,
        color: 'hover:border-violet-500',
        activeColor: 'bg-violet-50 border-violet-600 text-violet-950',
        iconColor: 'text-violet-600',
        defaultAmount: tariffs?.biayaSAS || 225000,
        frequency: 'Per Semester',
        isBuiltIn: true
      },
      {
        id: 'dat',
        key: 'dat',
        category: 'DAT' as PaymentCategory,
        name: 'Dana Akhir Tahun (DAT)',
        sub: 'Ujian / Akhir Tahun',
        icon: Sparkles,
        color: 'hover:border-rose-500',
        activeColor: 'bg-rose-50 border-rose-600 text-rose-950',
        iconColor: 'text-rose-600',
        defaultAmount: tariffs?.biayaDAT || 275000,
        frequency: 'Tahunan / Sekali Bayar',
        isBuiltIn: true
      }
    ];

    // Combine built-in items with custom standard items from settings
    const customStandardItems = stdItems
      .filter(s => !['spp', 'gedung', 'seragam', 'buku', 'pts', 'sas', 'dat'].includes(s.id))
      .map(s => ({
        id: s.id,
        key: s.id,
        category: (s.category || 'LAINNYA') as PaymentCategory,
        name: s.name,
        sub: s.frequency || 'Pos Khusus',
        icon: Coins,
        color: 'hover:border-indigo-500',
        activeColor: 'bg-indigo-50 border-indigo-600 text-indigo-950',
        iconColor: 'text-indigo-600',
        defaultAmount: s.defaultAmount || 0,
        frequency: s.frequency || 'Sekali Bayar',
        isBuiltIn: false,
        rawItem: s
      }));

    // General optional items (Kegiatan, Lainnya)
    const optionalGeneralItems = [
      {
        id: 'kegiatan',
        key: 'kegiatan',
        category: 'KEGIATAN' as PaymentCategory,
        name: 'Ekstrakulikuler',
        sub: 'Iuran Kegiatan',
        icon: Sparkles,
        color: 'hover:border-emerald-500',
        activeColor: 'bg-emerald-50 border-emerald-600 text-emerald-950',
        iconColor: 'text-emerald-600',
        defaultAmount: 50000,
        frequency: 'Sukarela / Kondisional',
        isBuiltIn: true,
        isAlwaysOptional: true
      },
      {
        id: 'lainnya',
        key: 'lainnya',
        category: 'LAINNYA' as PaymentCategory,
        name: 'Lain-lain',
        sub: 'Administrasi',
        icon: Receipt,
        color: 'hover:border-slate-500',
        activeColor: 'bg-slate-100 border-slate-600 text-slate-950',
        iconColor: 'text-slate-600',
        defaultAmount: 50000,
        frequency: 'Bebas / Kondisional',
        isBuiltIn: true,
        isAlwaysOptional: true
      }
    ];

    const allCandidateItems = [...baseItems, ...customStandardItems, ...optionalGeneralItems];

    const processedList = allCandidateItems.map(item => {
      const stdConf = stdItems.find(s => s.id === item.id || s.key === item.id);
      const targetGrades = stdConf?.targetGrades || ['SEMUA'];
      const isObligationActive = (item as any).isAlwaysOptional
        ? false
        : (activeObs[item.id] !== undefined ? activeObs[item.id] : (stdConf?.isActive ?? true));
      
      const gradeMatched = isStudentGradeMatching(selectedClass, targetGrades);

      // Check student individual exemption
      let isExempt = false;
      if (override) {
        if (item.id === 'spp' && override.sppExempt) isExempt = true;
        if (item.id === 'gedung' && override.gedungExempt) isExempt = true;
        if (item.id === 'seragam' && override.seragamExempt) isExempt = true;
        if (item.id === 'buku' && override.bukuExempt) isExempt = true;
        if (item.id === 'pts' && override.ptsExempt) isExempt = true;
        if (item.id === 'sas' && override.sasExempt) isExempt = true;
        if (item.id === 'dat' && override.datExempt) isExempt = true;
        if (override.exemptions?.[item.id]) isExempt = true;
      }

      const isWajib = !(item as any).isAlwaysOptional && isObligationActive && gradeMatched && !isExempt;

      let obligationLabel = 'Pos Wajib';
      let obligationReason = '';
      let targetGradesLabel = '';

      if (!targetGrades || targetGrades.length === 0 || targetGrades.includes('SEMUA') || targetGrades.includes('ALL')) {
        targetGradesLabel = 'Semua Tingkat';
      } else {
        targetGradesLabel = `Kelas ${targetGrades.join(', ')}`;
      }

      if (isWajib) {
        obligationLabel = 'Wajib Dibayar';
        obligationReason = `Kewajiban aktif untuk tingkat ${studentGradeLevel}`;
      } else {
        if (isExempt) {
          obligationLabel = 'Dibebaskan';
          obligationReason = 'Siswa mendapat keringanan biaya';
        } else if ((item as any).isAlwaysOptional) {
          obligationLabel = 'Tidak Wajib (Bebas)';
          obligationReason = 'Pos pembayaran sukarela / non-wajib';
        } else if (!isObligationActive) {
          obligationLabel = 'Tidak Diwajibkan';
          obligationReason = 'Dinonaktifkan di menu Atur Kewajiban';
        } else if (!gradeMatched) {
          obligationLabel = `Khusus ${targetGradesLabel}`;
          obligationReason = `Hanya untuk ${targetGradesLabel}, bukan Kelas ${studentGradeLevel}`;
        }
      }

      // Check arrears info for this item
      let studentItemArrears = 0;
      let isItemLunas = false;
      if (currentStudentArrears && currentStudentArrears.items) {
        const foundArrears = currentStudentArrears.items.find(
          i => i.id === item.id || i.id === `item-${item.id}` || i.category === item.category
        );
        if (foundArrears) {
          studentItemArrears = foundArrears.remainingAmount ?? 0;
          isItemLunas = foundArrears.isPaid;
        }
      }

      return {
        ...item,
        targetGrades,
        targetGradesLabel,
        isObligationActive,
        gradeMatched,
        isExempt,
        isWajib,
        obligationLabel,
        obligationReason,
        studentItemArrears,
        isItemLunas
      };
    });

    const wajibItems = processedList.filter(i => i.isWajib);
    const tidakWajibItems = processedList.filter(i => !i.isWajib);

    return {
      all: processedList,
      wajib: wajibItems,
      tidakWajib: tidakWajibItems
    };
  }, [billSettings, tariffs, selectedClass, currentStudent, studentGradeLevel, currentStudentArrears]);

  // When class changes, reset selected student
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    const newClassStudents = students.filter(s => s.className === newClass);
    if (newClassStudents.length > 0) {
      setSelectedStudentId(newClassStudents[0].id);
    } else {
      setSelectedStudentId('');
    }
  };

  // When selecting a pos item from the categorized list
  const handleSelectPosItem = (item: typeof categorizedPosItems.all[0]) => {
    setSelectedBillingItemId(item.id);
    setPaymentCategory(item.category as PaymentCategory);
    setPaymentAmount(item.defaultAmount || 0);

    if (item.category === 'KEGIATAN' || item.category === 'LAINNYA' || !item.isBuiltIn) {
      setCustomCategoryLabel(item.name);
    } else {
      setCustomCategoryLabel('');
    }
  };

  // When category changes via fallback
  const handleCategoryChange = (cat: PaymentCategory) => {
    const matched = categorizedPosItems.all.find(i => i.category === cat);
    if (matched) {
      handleSelectPosItem(matched);
      return;
    }
    setPaymentCategory(cat);
    if (cat === 'SPP') {
      setPaymentAmount(currentSppTariff * (selectedMonths.length > 0 ? selectedMonths.length : 1));
    } else if (cat === 'GEDUNG') {
      setPaymentAmount(tariffs?.uangGedung || 1200000);
    } else if (cat === 'SERAGAM') {
      setPaymentAmount(tariffs?.uangSeragam || 650000);
    } else if (cat === 'BUKU') {
      setPaymentAmount(tariffs?.uangBuku || 400000);
    } else if (cat === 'PTS') {
      setPaymentAmount(tariffs?.biayaPTS || 150000);
    } else if (cat === 'SAS') {
      setPaymentAmount(tariffs?.biayaSAS || 200000);
    } else if (cat === 'DAT') {
      setPaymentAmount(tariffs?.biayaDAT || 250000);
    } else if (cat === 'UJIAN') {
      setPaymentAmount(tariffs?.biayaPTS || tariffs?.biayaUjian || 150000);
    } else {
      setPaymentAmount(50000);
    }
  };

  // Helper functions for multi-month selection in SPP
  const toggleMonthSelection = (m: string) => {
    setSelectedMonths(prev => {
      let next: string[];
      if (prev.includes(m)) {
        next = prev.filter(x => x !== m);
      } else {
        next = [...prev, m];
      }
      next.sort((a, b) => MONTHS_LIST.indexOf(a) - MONTHS_LIST.indexOf(b));

      if (paymentCategory === 'SPP') {
        const count = next.length;
        setPaymentAmount(currentSppTariff * (count > 0 ? count : 1));
      }
      return next;
    });
  };

  const handleSelectMonthCount = (count: number) => {
    const paidList = currentStudentArrears?.sppPaidMonths || [];
    const unpaid = MONTHS_LIST.filter(m => !paidList.some(p => p.toLowerCase().includes(m.toLowerCase())));
    let toSelect: string[] = [];
    if (unpaid.length >= count) {
      toSelect = unpaid.slice(0, count);
    } else {
      toSelect = [...unpaid];
      for (const m of MONTHS_LIST) {
        if (!toSelect.includes(m) && toSelect.length < count) {
          toSelect.push(m);
        }
      }
    }
    toSelect.sort((a, b) => MONTHS_LIST.indexOf(a) - MONTHS_LIST.indexOf(b));
    setSelectedMonths(toSelect);
    if (paymentCategory === 'SPP') {
      setPaymentAmount(currentSppTariff * Math.max(1, toSelect.length));
    }
  };

  const handleSelectAllUnpaidMonths = () => {
    const paidList = currentStudentArrears?.sppPaidMonths || [];
    const unpaid = MONTHS_LIST.filter(m => !paidList.some(p => p.toLowerCase().includes(m.toLowerCase())));
    const target = unpaid.length > 0 ? unpaid : [...MONTHS_LIST];
    target.sort((a, b) => MONTHS_LIST.indexOf(a) - MONTHS_LIST.indexOf(b));
    setSelectedMonths(target);
    if (paymentCategory === 'SPP') {
      setPaymentAmount(currentSppTariff * target.length);
    }
  };

  // Synchronize paymentAmount with student's grade level tariff when student, class, or selectedMonths change
  React.useEffect(() => {
    if (paymentCategory === 'SPP' && (!selectedBillingItemId || selectedBillingItemId === 'spp')) {
      const multiplier = selectedMonths.length > 0 ? selectedMonths.length : 1;
      setPaymentAmount(currentSppTariff * multiplier);
    }
  }, [selectedStudentId, selectedClass, currentSppTariff, paymentCategory, selectedBillingItemId, selectedMonths.length]);

  // When switching student, pick their first unpaid month if current month is already paid
  React.useEffect(() => {
    if (currentStudentArrears?.sppUnpaidMonths && currentStudentArrears.sppUnpaidMonths.length > 0) {
      const isCurrentSinglePaid = selectedMonths.length === 1 && (currentStudentArrears.sppPaidMonths || []).some(p => p.toLowerCase().includes(selectedMonths[0].toLowerCase()));
      if (selectedMonths.length === 0 || isCurrentSinglePaid) {
        const firstUnpaid = currentStudentArrears.sppUnpaidMonths[0];
        if (firstUnpaid) {
          setSelectedMonths([firstUnpaid]);
        }
      }
    }
  }, [selectedStudentId]);

  // Set initial student when component mounts
  React.useEffect(() => {
    if (!selectedStudentId && classStudents.length > 0) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [classStudents, selectedStudentId]);

  // Handle Authentication Unlock strictly per treasurer code
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanInput = inputCode.trim();
    const upperInput = cleanInput.toUpperCase();
    const masterAdminCode = (adminSettings?.adminPasscode || 'akhmadtaufik84@').trim();

    // 1. Check against all treasurers: ONLY match the current active configured kodeUnik
    const matched = allTreasurers.find(t => {
      const activeCode = (t.kodeUnik || '').trim().toUpperCase();
      return Boolean(activeCode && upperInput === activeCode);
    });

    if (matched) {
      setActiveTreasurerId(matched.id);
      setIsUnlocked(true);
      if (rememberAuth) {
        localStorage.setItem('mts_bendahara_unlocked', 'true');
        localStorage.setItem('mts_active_treasurer_id', matched.id);
      } else {
        sessionStorage.setItem('mts_bendahara_unlocked', 'true');
        sessionStorage.setItem('mts_active_treasurer_id', matched.id);
      }
      return;
    }

    // 2. Master Admin override: ONLY match the current masterAdminCode (no hardcoded old fallback)
    if (cleanInput === masterAdminCode) {
      const defaultB = allTreasurers.find(t => t.id === 'bu') || allTreasurers[0] || { id: 'bu', name: 'Super Admin', roleTitle: 'Bendahara Utama' };
      setActiveTreasurerId(defaultB.id);
      setIsUnlocked(true);
      if (rememberAuth) {
        localStorage.setItem('mts_bendahara_unlocked', 'true');
        localStorage.setItem('mts_active_treasurer_id', defaultB.id);
      } else {
        sessionStorage.setItem('mts_bendahara_unlocked', 'true');
        sessionStorage.setItem('mts_active_treasurer_id', defaultB.id);
      }
      return;
    }

    // Invalid code handling - do not show verbose banner
    setAuthError('invalid');
  };

  // Handle Lock / Logout
  const handleLock = () => {
    setIsUnlocked(false);
    setInputCode('');
    localStorage.removeItem('mts_bendahara_unlocked');
    sessionStorage.removeItem('mts_bendahara_unlocked');
    localStorage.removeItem('mts_active_treasurer_id');
    sessionStorage.removeItem('mts_active_treasurer_id');
    if (onLogout) {
      onLogout();
    }
  };

  // Submit Payment Transaction
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) {
      alert('Pilih siswa terlebih dahulu!');
      return;
    }
    if (paymentAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0!');
      return;
    }
    if (paymentCategory === 'SPP' && selectedMonths.length === 0) {
      alert('Silakan pilih minimal 1 kotak bulan SPP yang ingin dibayar!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate Invoice Number
      const yearStr = new Date().getFullYear();
      const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomSeq = String(payments.length + 1).padStart(3, '0');
      const invoiceNumber = `KW/${yearStr}/${monthStr}/${randomSeq}`;

      let catLabel = '';
      let purchasedInventoryItem: InventoryItem | undefined;

      if (paymentCategory === 'SPP') {
        const count = selectedMonths.length;
        if (count > 1) {
          catLabel = `SPP ${count} Bulan (${selectedMonths.join(', ')}) ${yearStr}`;
        } else if (count === 1) {
          catLabel = `SPP Bulan ${selectedMonths[0]} ${yearStr}`;
        } else {
          catLabel = `SPP Bulanan ${yearStr}`;
        }
      } else if (paymentCategory === 'GEDUNG') {
        catLabel = `Infaq Pembangunan / Uang Gedung`;
      } else if (paymentCategory === 'SERAGAM') {
        if (selectedStockItemId) {
          purchasedInventoryItem = inventory.find(i => i.id === selectedStockItemId);
        }
        if (!purchasedInventoryItem) {
          purchasedInventoryItem = inventory.find(
            i => i.category === 'SERAGAM' && i.variantType === selectedUniformType && (i.size === selectedUniformSize || (!i.size && selectedUniformSize === 'All Size'))
          ) || inventory.find(i => i.category === 'SERAGAM' && i.variantType === selectedUniformType);
        }
        catLabel = purchasedInventoryItem 
          ? `Uang Seragam: ${purchasedInventoryItem.name} (${purchasedInventoryItem.size || selectedUniformSize})`
          : `Uang Seragam: ${selectedUniformType} (${selectedUniformSize})`;
      } else if (paymentCategory === 'BUKU') {
        if (selectedStockItemId) {
          purchasedInventoryItem = inventory.find(i => i.id === selectedStockItemId);
        } else {
          purchasedInventoryItem = inventory.find(
            i => (i.category === 'LKS' || (i.category as any) === 'BUKU') && (i.gradeLevel?.includes(currentStudent.className.split(' ')[0]) || i.gradeLevel?.includes('SEMUA'))
          );
        }
        catLabel = purchasedInventoryItem ? `Buku Paket / LKS: ${purchasedInventoryItem.name}` : `Buku Paket & Modul LKS`;
      } else if (paymentCategory === 'PTS') {
        catLabel = `Biaya Ujian: PTS (Penilaian Tengah Semester)`;
      } else if (paymentCategory === 'SAS') {
        catLabel = `Biaya Ujian: SAS (Sumatif Akhir Semester)`;
      } else if (paymentCategory === 'DAT') {
        catLabel = `Biaya Ujian: Dana Akhir Tahun (DAT)`;
      } else if (paymentCategory === 'UJIAN') {
        catLabel = `Biaya Ujian / Asesmen`;
      } else if (paymentCategory === 'KEGIATAN') {
        catLabel = customCategoryLabel.trim() || `Iuran Ekstrakulikuler / Kegiatan Madrasah`;
      } else {
        if (selectedStockItemId) {
          purchasedInventoryItem = inventory.find(i => i.id === selectedStockItemId);
        }
        catLabel = customCategoryLabel.trim() || (purchasedInventoryItem ? `Pembelian ${purchasedInventoryItem.name}` : `Pembayaran Administrasi Lainnya`);
      }

      // Auto deduct inventory stock if an inventory item was purchased
      const qtyToDeduct = Math.max(1, stockItemQuantity || 1);
      if (purchasedInventoryItem) {
        if (onDeductStock) {
          onDeductStock(purchasedInventoryItem.id, qtyToDeduct, {
            studentId: currentStudent.id,
            studentName: currentStudent.name,
            studentClass: currentStudent.className,
            invoiceNumber,
            treasurerName: activeTreasurer.name,
            notes: `Penjualan ${purchasedInventoryItem.name} (${purchasedInventoryItem.size || '-'}) qty ${qtyToDeduct} pcs via kasir`,
            date: paymentDate
          });
        } else {
          deductInventoryStock(purchasedInventoryItem.id, qtyToDeduct, {
            studentId: currentStudent.id,
            studentName: currentStudent.name,
            studentClass: currentStudent.className,
            invoiceNumber,
            treasurerName: activeTreasurer.name,
            notes: `Penjualan ${purchasedInventoryItem.name} (${purchasedInventoryItem.size || '-'}) qty ${qtyToDeduct} pcs via kasir`,
            date: paymentDate
          });
        }
      }

      const newTx: PaymentTransaction = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceNumber,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        className: currentStudent.className,
        nisn: currentStudent.nisn || '',
        parentPhone: currentStudent.parentPhone || '',
        category: paymentCategory,
        categoryLabel: catLabel,
        month: paymentCategory === 'SPP' ? `${selectedMonths.join(', ')} ${yearStr}` : '',
        academicYear: academicYear,
        amount: Number(paymentAmount),
        paymentMethod: paymentMethod,
        paymentDate: paymentDate,
        status: 'Lunas',
        receivedBy: activeTreasurer.name ? `${activeTreasurer.name} (${activeTreasurer.roleTitle || 'Bendahara'})` : 'Bendahara Sekolah',
        notes: paymentNotes.trim() || '',
        inventoryItemIds: purchasedInventoryItem ? [purchasedInventoryItem.id] : undefined,
        inventoryItemsPurchased: purchasedInventoryItem ? [{
          itemId: purchasedInventoryItem.id,
          itemCode: purchasedInventoryItem.itemCode,
          itemName: purchasedInventoryItem.name,
          variantType: purchasedInventoryItem.variantType,
          size: purchasedInventoryItem.size,
          quantity: qtyToDeduct,
          unitPrice: purchasedInventoryItem.unitPrice || (paymentAmount / qtyToDeduct),
          subtotal: paymentAmount
        }] : undefined,
        createdAt: new Date().toISOString()
      };

      await onSavePayment(newTx);

      const stockDeductNotice = purchasedInventoryItem ? ` (Stok ${purchasedInventoryItem.name} otomatis berkurang ${qtyToDeduct} pcs)` : '';
      setFormSuccessMessage(`Pembayaran ${newTx.studentName} (${newTx.categoryLabel}) sebesar Rp ${newTx.amount.toLocaleString('id-ID')} berhasil dicatat!${stockDeductNotice}`);
      setSelectedInvoice(newTx); // Auto open receipt preview option
      setPaymentNotes('');
      setCustomCategoryLabel('');
      setSelectedStockItemId('');
      setStockItemQuantity(1);

      setTimeout(() => {
        setFormSuccessMessage('');
      }, 6000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan transaksi pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Crucial role check: Is current logged-in user Bendahara Utama?
  const isBendaharaUtama = activeTreasurerId === 'bu';

  // Confirm Delete (Restricted strictly to Bendahara Utama)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!isBendaharaUtama) {
      alert('Akses Ditolak: Hanya Bendahara Utama yang memiliki wewenang untuk membatalkan kwitansi dan menghapus riwayat pembayaran.');
      setDeleteTarget(null);
      return;
    }
    try {
      await onDeletePayment(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus transaksi.');
    }
  };

  // WhatsApp Sender
  const handleSendWA = (tx: PaymentTransaction) => {
    const formattedAmount = `Rp ${tx.amount.toLocaleString('id-ID')}`;
    const message = `Assalamu'alaikum Wr. Wb.

*BUKTI PEMBAYARAN SISWA - MTS MANBAUL ISLAM*
---------------------------------------
No. Kwitansi : *${tx.invoiceNumber}*
Tanggal      : ${tx.paymentDate}
Nama Siswa   : *${tx.studentName}*
Kelas        : ${tx.className}
Jenis Bayar  : *${tx.categoryLabel}*
Jumlah       : *${formattedAmount}* (${numberToWords(tx.amount)})
Metode       : ${tx.paymentMethod}
Status       : *LUNAS*
Penerima     : ${tx.receivedBy}
---------------------------------------
Catatan: ${tx.notes || 'Terima kasih atas pembayaran yang telah dilakukan.'}

Semoga barokah dan bermanfaat bagi kelancaran pendidikan putra/putri kita.

Wassalamu'alaikum Wr. Wb.
*Bendahara ${schoolOfficials?.namaSekolah || 'Madrasah'}*`;

    const encoded = encodeURIComponent(message);
    let waUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    if (tx.parentPhone) {
      let cleanPhone = tx.parentPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      if (cleanPhone) {
        waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
      }
    }

    window.open(waUrl, '_blank');
  };

  // Valid Cash Deposits List
  const validCashDeposits = useMemo(() => {
    return cashDeposits || [];
  }, [cashDeposits]);

  // Per-treasurer Cash Balance Breakdown
  // Crucial requirement: Ketika bendahara 1-5 sudah setor ke bendahara utama dana kas masuk yang di setiap bendahara menjadi berkurang
  const treasurerCashBalances = useMemo(() => {
    const collecting = getCollectingTreasurers(schoolOfficials);
    const bu = getTreasurerUtama(schoolOfficials);

    // Sum of verified deposits received by Bendahara Utama from each treasurer
    const depositsByTreasurer: Record<string, number> = {};
    validCashDeposits.forEach(d => {
      if (d.status === 'Diterima') {
        depositsByTreasurer[d.fromTreasurerId] = (depositsByTreasurer[d.fromTreasurerId] || 0) + (d.amount || 0);
      }
    });

    // Sum of operational expenses recorded by each treasurer
    const expensesByTreasurer: Record<string, number> = {};
    (expenses || []).forEach(exp => {
      expensesByTreasurer[exp.treasurerId] = (expensesByTreasurer[exp.treasurerId] || 0) + (exp.amount || 0);
    });

    const items = collecting.map((t, idx) => {
      const txs = payments.filter(p => {
        const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
        return tInfo.id === t.id;
      });
      const grossIncome = txs.reduce((sum, curr) => sum + (curr.amount || 0), 0);
      const grossCash = txs.filter(p => p.paymentMethod === 'Tunai').reduce((sum, curr) => sum + (curr.amount || 0), 0);
      const grossDigital = grossIncome - grossCash;
      const totalDeposited = depositsByTreasurer[t.id] || 0;
      const totalExpense = expensesByTreasurer[t.id] || 0;
      // Money on hand decreases after deposit to Bendahara Utama AND expenses:
      const remainingCashOnHand = Math.max(0, grossIncome - totalDeposited - totalExpense);

      // Pos Pemasukan breakdown (SPP, STS, SAS, dll)
      const breakdownByPos = POS_PEMASUKAN_OPTIONS.filter(p => p.key !== 'SEMUA').map(pos => {
        const posTxs = txs.filter(p => {
          if (pos.key === 'STS') return p.category === 'PTS' || (p.category as string) === 'STS';
          return p.category === pos.key;
        });
        const diterima = posTxs.reduce((sum, curr) => sum + (curr.amount || 0), 0);

        const posDeposits = validCashDeposits
          .filter(d => d.fromTreasurerId === t.id && d.status === 'Diterima' && (d.posCategory === pos.key || (pos.key === 'STS' && d.posCategory === 'PTS')))
          .reduce((sum, d) => sum + (d.amount || 0), 0);

        const posExpenses = (expenses || [])
          .filter(exp => exp.treasurerId === t.id && (exp.sourcePos === pos.key || (pos.key === 'STS' && exp.sourcePos === 'PTS')))
          .reduce((sum, exp) => sum + (exp.amount || 0), 0);

        const sisaDiTangan = Math.max(0, diterima - posDeposits - posExpenses);

        return {
          key: pos.key,
          name: pos.name,
          diterima,
          disetor: posDeposits,
          dikeluarkan: posExpenses,
          sisaDiTangan,
          txCount: posTxs.length
        };
      });

      return {
        treasurer: t,
        id: t.id,
        name: t.name,
        roleTitle: cleanTreasurerRole(t.roleTitle, idx + 1),
        nip: t.nip,
        phone: t.phone,
        index: idx + 1,
        txCount: txs.length,
        grossIncome,
        grossCash,
        grossDigital,
        totalDeposited,
        totalExpense,
        remainingCashOnHand,
        breakdownByPos
      };
    });

    const totalGrossCollected = items.reduce((sum, i) => sum + i.grossIncome, 0);
    const totalAllDepositedToUtama = items.reduce((sum, i) => sum + i.totalDeposited, 0);
    const totalAllExpenses = items.reduce((sum, i) => sum + i.totalExpense, 0);
    const totalRemainingInHands = items.reduce((sum, i) => sum + i.remainingCashOnHand, 0);

    return {
      items,
      treasurerUtama: bu,
      totalGrossCollected,
      totalAllDepositedToUtama,
      totalAllExpenses,
      totalRemainingInHands
    };
  }, [schoolOfficials, payments, validCashDeposits, expenses, allTreasurers]);

  // Logged-in treasurer's own personal cash balance
  const myCashBalance = useMemo(() => {
    const found = treasurerCashBalances.items.find(i => i.id === activeTreasurerId);
    if (found) return found;
    return {
      treasurer: activeTreasurer,
      id: activeTreasurerId,
      name: activeTreasurer.name,
      roleTitle: activeTreasurer.roleTitle,
      nip: activeTreasurer.nip,
      phone: activeTreasurer.phone,
      index: activeTreasurerId === 'bu' ? 0 : Number(activeTreasurerId.replace('b', '')) || 1,
      txCount: 0,
      grossIncome: 0,
      grossCash: 0,
      grossDigital: 0,
      totalDeposited: 0,
      totalExpense: 0,
      remainingCashOnHand: 0,
      breakdownByPos: POS_PEMASUKAN_OPTIONS.filter(p => p.key !== 'SEMUA').map(p => ({
        key: p.key,
        name: p.name,
        diterima: 0,
        disetor: 0,
        dikeluarkan: 0,
        sisaDiTangan: 0,
        txCount: 0
      }))
    };
  }, [treasurerCashBalances, activeTreasurerId, activeTreasurer]);

  // Visible cash deposits according to privacy rule:
  // Bendahara Utama sees ALL deposits. Regular treasurers ONLY see their OWN deposits.
  const visibleCashDeposits = useMemo(() => {
    if (isBendaharaUtama) {
      return validCashDeposits;
    }
    return validCashDeposits.filter(d => d.fromTreasurerId === activeTreasurerId);
  }, [validCashDeposits, isBendaharaUtama, activeTreasurerId]);

  // Open Deposit Modal with Pre-filled Treasurer & Pos
  // Crucial requirement: Hanya bendahara yang masuk sesuai kode uniknya yang dapat menyetor kasnya
  const handleOpenDepositModal = (treasurerId?: string, defaultPosKey: string = 'SEMUA') => {
    const fromId = !isBendaharaUtama ? activeTreasurerId : (treasurerId || 'b1');
    setDepositFromTreasurerId(fromId);
    setDepositPosCategory(defaultPosKey);

    const targetItem = treasurerCashBalances.items.find(i => i.id === fromId);
    if (targetItem) {
      if (defaultPosKey !== 'SEMUA') {
        const specificPos = targetItem.breakdownByPos.find(p => p.key === defaultPosKey);
        setDepositAmount(specificPos ? specificPos.sisaDiTangan : targetItem.remainingCashOnHand);
        const posDef = POS_PEMASUKAN_OPTIONS.find(p => p.key === defaultPosKey);
        setDepositNotes(`Setoran kas khusus ${posDef ? posDef.name : defaultPosKey} ke Bendahara Utama`);
      } else {
        setDepositAmount(targetItem.remainingCashOnHand);
        setDepositNotes('Setoran kas seluruh pos dana pembayaran siswa ke Bendahara Utama');
      }
    } else {
      setDepositAmount(0);
      setDepositNotes('');
    }

    setDepositDate(new Date().toISOString().split('T')[0]);
    setShowDepositModal(true);
  };

  // Submit Cash Deposit to Bendahara Utama
  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveCashDeposit) return;
    if (depositAmount <= 0) {
      alert('Nominal setoran harus lebih dari Rp 0.');
      return;
    }

    // Security check: Regular treasurer can ONLY deposit for their own ID
    const fromId = !isBendaharaUtama ? activeTreasurerId : depositFromTreasurerId;
    const fromItem = treasurerCashBalances.items.find(i => i.id === fromId);
    if (!fromItem) {
      alert('Bendahara pengirim tidak valid.');
      return;
    }

    const bu = treasurerCashBalances.treasurerUtama;
    const now = new Date();
    const yearStr = now.getFullYear().toString();
    const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');
    const depositNumber = `STR/${yearStr}/${monthStr}/${Date.now().toString().slice(-4)}`;

    const posDef = POS_PEMASUKAN_OPTIONS.find(p => p.key === depositPosCategory);
    const posLabel = posDef ? posDef.name : (depositPosCategory === 'SEMUA' ? 'Semua Pos (Konsolidasi)' : depositPosCategory);

    const newDeposit: CashDepositTransaction = {
      id: `dep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      depositNumber,
      depositDate,
      fromTreasurerId: fromItem.id,
      fromTreasurerName: fromItem.name,
      fromTreasurerRole: fromItem.roleTitle,
      toTreasurerId: 'bu',
      toTreasurerName: bu.name,
      toTreasurerRole: 'Bendahara Utama',
      amount: Number(depositAmount),
      posCategory: depositPosCategory,
      posCategoryLabel: posLabel,
      status: 'Diterima',
      notes: depositNotes.trim() || `Setoran kas ${posLabel} ke Bendahara Utama`,
      createdAt: now.toISOString()
    };

    setIsSubmittingDeposit(true);
    try {
      await onSaveCashDeposit(newDeposit);
      setDepositSuccessMsg(`Setoran kas (${posLabel}) sebesar Rp ${newDeposit.amount.toLocaleString('id-ID')} dari ${fromItem.name} berhasil disetor ke Bendahara Utama (${bu.name})! Saldo kas pos tersebut di tangan Anda telah dinolkan.`);
      setShowDepositModal(false);
      setSelectedDepositReceipt(newDeposit); // open receipt preview
      setTimeout(() => setDepositSuccessMsg(''), 6000);
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat setoran kas.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Delete/Cancel Cash Deposit (Restricted strictly to Bendahara Utama)
  const handleConfirmDeleteDeposit = async () => {
    if (!deleteDepositTarget || !onDeleteCashDeposit) return;
    if (!isBendaharaUtama) {
      alert('Akses Ditolak: Hanya Bendahara Utama yang memiliki wewenang untuk membatalkan setoran kas.');
      setDeleteDepositTarget(null);
      return;
    }
    try {
      await onDeleteCashDeposit(deleteDepositTarget.id);
      setDeleteDepositTarget(null);
      setDepositSuccessMsg('Setoran kas berhasil dibatalkan. Saldo kas telah dikembalikan ke Bendahara terkait.');
      setTimeout(() => setDepositSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Gagal membatalkan setoran kas.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSaveTariffs(tempTariffs);
      setSettingsSuccessMsg('Pengaturan tarif pembayaran berhasil disimpan!');
      setTimeout(() => setSettingsSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan pengaturan.');
    }
  };

  // Filtered History
  // Privacy rule: If regular treasurer is logged in, only show their own transactions.
  // If Bendahara Utama is logged in, allow viewing all or filtering by treasurer.
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // 0. Treasurer isolation for non-Bendahara Utama
      if (!isBendaharaUtama) {
        const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
        if (tInfo.id !== activeTreasurerId) return false;
      } else {
        if (historyTreasurerFilter !== 'ALL') {
          const tMatch = allTreasurers.find(t => t.id === historyTreasurerFilter);
          if (tMatch) {
            const rec = (p.receivedBy || '').toLowerCase();
            const matchTName = tMatch.name ? rec.includes(tMatch.name.toLowerCase()) : false;
            const matchTRole = tMatch.roleTitle ? rec.includes(tMatch.roleTitle.toLowerCase()) : false;
            const matchTId = rec.includes(`bendahara ${tMatch.id.replace('b', '')}`);
            if (!matchTName && !matchTRole && !matchTId) return false;
          }
        }
      }

      if (historyClassFilter !== 'ALL' && p.className !== historyClassFilter) return false;
      if (historyCategoryFilter !== 'ALL' && p.category !== historyCategoryFilter) return false;
      if (historyMonthFilter !== 'ALL' && !p.categoryLabel.toLowerCase().includes(historyMonthFilter.toLowerCase()) && !p.paymentDate.startsWith(historyMonthFilter)) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchName = p.studentName.toLowerCase().includes(q);
        const matchInv = p.invoiceNumber.toLowerCase().includes(q);
        const matchNote = p.notes?.toLowerCase().includes(q);
        const matchRec = p.receivedBy?.toLowerCase().includes(q);
        if (!matchName && !matchInv && !matchNote && !matchRec) return false;
      }
      return true;
    });
  }, [payments, isBendaharaUtama, activeTreasurerId, historyClassFilter, historyCategoryFilter, historyMonthFilter, historyTreasurerFilter, historySearch, allTreasurers]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const totalIncome = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const sppPayments = payments.filter(p => p.category === 'SPP');
    const totalSPP = sppPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const nonSppTotal = totalIncome - totalSPP;
    const txCount = payments.length;

    return {
      totalIncome,
      totalSPP,
      nonSppTotal,
      txCount
    };
  }, [payments]);

  // Breakdown Pos Pemasukan Kas (SPP, STS, SAS, Gedung, Seragam, Buku, DAT, Kegiatan, Lainnya)
  // Sesuai dengan penerimaan kas oleh bendahara aktif & otomatis NOL jika sudah disetor ke Bendahara Utama
  const treasurerPosBreakdown = useMemo(() => {
    const targetTreasurerId = !isBendaharaUtama
      ? activeTreasurerId
      : (posTreasurerView === 'DEFAULT' || posTreasurerView === 'ALL' ? 'ALL' : posTreasurerView);

    const relevantPayments = payments.filter(p => {
      if (targetTreasurerId === 'ALL') return true;
      const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
      return tInfo.id === targetTreasurerId;
    });

    let targetName = activeTreasurer.name;
    let targetRole = activeTreasurer.roleTitle;
    let targetGrossIncome = 0;
    let targetTotalDeposited = 0;
    let targetRemainingCash = 0;

    if (targetTreasurerId === 'ALL') {
      targetName = 'Semua Bendahara (Konsolidasi)';
      targetRole = 'Penerimaan Kas Keseluruhan';
      targetGrossIncome = stats.totalIncome;
      targetTotalDeposited = treasurerCashBalances.totalAllDepositedToUtama;
      targetRemainingCash = treasurerCashBalances.totalRemainingInHands;
    } else {
      const found = treasurerCashBalances.items.find(i => i.id === targetTreasurerId);
      if (found) {
        targetName = found.name;
        targetRole = found.roleTitle;
        targetGrossIncome = found.grossIncome;
        targetTotalDeposited = found.totalDeposited;
        targetRemainingCash = found.remainingCashOnHand;
      } else {
        targetGrossIncome = myCashBalance.grossIncome;
        targetTotalDeposited = myCashBalance.totalDeposited;
        targetRemainingCash = myCashBalance.remainingCashOnHand;
      }
    }

    // Standard pos categories definition
    const posDefinitions: Array<{
      key: string;
      categoryMatch: (p: PaymentTransaction) => boolean;
      name: string;
      shortLabel: string;
      codeBadge: string;
      description: string;
      icon: any;
      bgLight: string;
      textColor: string;
      borderColor: string;
      accentBg: string;
      barColor: string;
    }> = [
      {
        key: 'spp',
        categoryMatch: p => p.category === 'SPP' || (p.categoryLabel || '').toLowerCase().includes('spp'),
        name: 'SPP Bulanan',
        shortLabel: 'SPP',
        codeBadge: 'POS-01',
        description: 'Iuran Pembinaan Pendidikan Bulanan',
        icon: CreditCard,
        bgLight: 'bg-indigo-50/70',
        textColor: 'text-indigo-900',
        borderColor: 'border-indigo-200',
        accentBg: 'bg-indigo-600 text-white',
        barColor: 'bg-indigo-600'
      },
      {
        key: 'sts',
        categoryMatch: p =>
          p.category === 'PTS' ||
          (p.categoryLabel || '').toLowerCase().includes('pts') ||
          (p.categoryLabel || '').toLowerCase().includes('sts') ||
          (p.categoryLabel || '').toLowerCase().includes('tengah semester'),
        name: 'STS / Ujian PTS',
        shortLabel: 'STS / PTS',
        codeBadge: 'POS-02',
        description: 'Sumatif / Penilaian Tengah Semester',
        icon: GraduationCap,
        bgLight: 'bg-purple-50/70',
        textColor: 'text-purple-900',
        borderColor: 'border-purple-200',
        accentBg: 'bg-purple-600 text-white',
        barColor: 'bg-purple-600'
      },
      {
        key: 'sas',
        categoryMatch: p =>
          p.category === 'SAS' ||
          (p.categoryLabel || '').toLowerCase().includes('sas') ||
          (p.categoryLabel || '').toLowerCase().includes('pas') ||
          (p.categoryLabel || '').toLowerCase().includes('akhir semester'),
        name: 'SAS / Ujian PAS',
        shortLabel: 'SAS / PAS',
        codeBadge: 'POS-03',
        description: 'Sumatif / Penilaian Akhir Semester',
        icon: Award,
        bgLight: 'bg-violet-50/70',
        textColor: 'text-violet-900',
        borderColor: 'border-violet-200',
        accentBg: 'bg-violet-600 text-white',
        barColor: 'bg-violet-600'
      },
      {
        key: 'gedung',
        categoryMatch: p =>
          p.category === 'GEDUNG' ||
          (p.categoryLabel || '').toLowerCase().includes('gedung') ||
          (p.categoryLabel || '').toLowerCase().includes('dsp') ||
          (p.categoryLabel || '').toLowerCase().includes('bangunan') ||
          (p.categoryLabel || '').toLowerCase().includes('infaq'),
        name: 'Infaq Gedung / DSP',
        shortLabel: 'Gedung',
        codeBadge: 'POS-04',
        description: 'Infaq Sarana Pembangunan Madrasah',
        icon: Building2,
        bgLight: 'bg-amber-50/70',
        textColor: 'text-amber-900',
        borderColor: 'border-amber-200',
        accentBg: 'bg-amber-600 text-white',
        barColor: 'bg-amber-600'
      },
      {
        key: 'seragam',
        categoryMatch: p =>
          p.category === 'SERAGAM' ||
          (p.categoryLabel || '').toLowerCase().includes('seragam') ||
          (p.categoryLabel || '').toLowerCase().includes('atribut'),
        name: 'Uang Seragam & Atribut',
        shortLabel: 'Seragam',
        codeBadge: 'POS-05',
        description: 'Paket Seragam Batik, Olahraga & Atribut',
        icon: Shirt,
        bgLight: 'bg-teal-50/70',
        textColor: 'text-teal-900',
        borderColor: 'border-teal-200',
        accentBg: 'bg-teal-600 text-white',
        barColor: 'bg-teal-600'
      },
      {
        key: 'buku',
        categoryMatch: p =>
          p.category === 'BUKU' ||
          (p.category as any) === 'LKS' ||
          (p.categoryLabel || '').toLowerCase().includes('buku') ||
          (p.categoryLabel || '').toLowerCase().includes('lks') ||
          (p.categoryLabel || '').toLowerCase().includes('modul'),
        name: 'Buku & Modul LKS',
        shortLabel: 'Buku & LKS',
        codeBadge: 'POS-06',
        description: 'Buku Pegangan & Modul LKS Semester',
        icon: BookOpen,
        bgLight: 'bg-blue-50/70',
        textColor: 'text-blue-900',
        borderColor: 'border-blue-200',
        accentBg: 'bg-blue-600 text-white',
        barColor: 'bg-blue-600'
      },
      {
        key: 'dat',
        categoryMatch: p =>
          p.category === 'DAT' ||
          p.category === 'UJIAN' ||
          (p.categoryLabel || '').toLowerCase().includes('dat') ||
          (p.categoryLabel || '').toLowerCase().includes('akhir tahun') ||
          (p.categoryLabel || '').toLowerCase().includes('ujian'),
        name: 'Dana Akhir Tahun (DAT)',
        shortLabel: 'DAT / Ujian',
        codeBadge: 'POS-07',
        description: 'Dana Akhir Tahun & Ujian Madrasah',
        icon: Sparkles,
        bgLight: 'bg-rose-50/70',
        textColor: 'text-rose-900',
        borderColor: 'border-rose-200',
        accentBg: 'bg-rose-600 text-white',
        barColor: 'bg-rose-600'
      },
      {
        key: 'kegiatan',
        categoryMatch: p =>
          p.category === 'KEGIATAN' ||
          (p.categoryLabel || '').toLowerCase().includes('kegiatan') ||
          (p.categoryLabel || '').toLowerCase().includes('ekskul') ||
          (p.categoryLabel || '').toLowerCase().includes('pramuka'),
        name: 'Kegiatan & Ekskul',
        shortLabel: 'Kegiatan',
        codeBadge: 'POS-08',
        description: 'Iuran Ekstrakurikuler & Even Kesiswaan',
        icon: Coins,
        bgLight: 'bg-emerald-50/70',
        textColor: 'text-emerald-900',
        borderColor: 'border-emerald-200',
        accentBg: 'bg-emerald-600 text-white',
        barColor: 'bg-emerald-600'
      },
      {
        key: 'lainnya',
        categoryMatch: () => true,
        name: 'Pos Lainnya / Administrasi',
        shortLabel: 'Lainnya',
        codeBadge: 'POS-09',
        description: 'Penerimaan Kas & Administrasi Khusus',
        icon: Receipt,
        bgLight: 'bg-slate-50/70',
        textColor: 'text-slate-900',
        borderColor: 'border-slate-200',
        accentBg: 'bg-slate-700 text-white',
        barColor: 'bg-slate-600'
      }
    ];

    const matchedPaymentIds = new Set<string>();
    const posCalculations = posDefinitions.map((pos, pIdx) => {
      const isLast = pIdx === posDefinitions.length - 1;
      const txs = relevantPayments.filter(p => {
        if (matchedPaymentIds.has(p.id)) return false;
        if (isLast || pos.categoryMatch(p)) {
          matchedPaymentIds.add(p.id);
          return true;
        }
        return false;
      });

      const grossAmount = txs.reduce((sum, curr) => sum + (curr.amount || 0), 0);
      const txCount = txs.length;

      return {
        ...pos,
        txs,
        grossAmount,
        txCount
      };
    });

    const totalCollected = posCalculations.reduce((sum, p) => sum + p.grossAmount, 0);

    // Hitung Sisa Kas di Tangan per Pos
    // JIKA targetRemainingCash === 0 (sudah disetor penuh ke Bendahara Utama), MAKA NOL KAN!
    const items = posCalculations.map(item => {
      let sisaDiTangan = 0;
      let depositedAmount = 0;
      let percentDeposited = 0;

      if (item.grossAmount === 0) {
        sisaDiTangan = 0;
        depositedAmount = 0;
        percentDeposited = 100;
      } else if (targetRemainingCash <= 0) {
        // NOL KAN SESUAI PERMINTAAN: Sudah disetorkan penuh ke Bendahara Utama
        sisaDiTangan = 0;
        depositedAmount = item.grossAmount;
        percentDeposited = 100;
      } else if (targetTotalDeposited === 0) {
        // Belum ada setoran: Kas utuh di tangan
        sisaDiTangan = item.grossAmount;
        depositedAmount = 0;
        percentDeposited = 0;
      } else {
        // Disetor sebagian: Alokasikan sisa kas di tangan secara proporsional
        const ratio = totalCollected > 0 ? (targetRemainingCash / totalCollected) : 0;
        sisaDiTangan = Math.round(item.grossAmount * ratio);
        depositedAmount = Math.max(0, item.grossAmount - sisaDiTangan);
        percentDeposited = item.grossAmount > 0 ? Math.min(100, Math.round((depositedAmount / item.grossAmount) * 100)) : 100;
      }

      return {
        ...item,
        sisaDiTangan,
        depositedAmount,
        percentDeposited,
        isZero: sisaDiTangan === 0
      };
    });

    return {
      targetTreasurerId,
      targetName,
      targetRole,
      totalGrossIncome: targetGrossIncome || totalCollected,
      totalDeposited: targetTotalDeposited,
      remainingCashOnHand: targetRemainingCash,
      items,
      activePosCount: items.filter(i => i.grossAmount > 0).length,
      unsettledPosCount: items.filter(i => i.sisaDiTangan > 0).length
    };
  }, [
    payments,
    activeTreasurerId,
    posTreasurerView,
    isBendaharaUtama,
    allTreasurers,
    activeTreasurer,
    stats.totalIncome,
    treasurerCashBalances,
    myCashBalance
  ]);

  // Penjualan Domain KPI Aggregates
  const salesDomainKPI = useMemo(() => {
    const salesTxs = payments.filter(tx => {
      if (tx.status === 'Dibatalkan') return false;
      return (
        tx.category === 'SERAGAM' ||
        tx.category === 'BUKU' ||
        tx.category === 'ATRIBUT' ||
        (tx.inventoryItemIds && tx.inventoryItemIds.length > 0) ||
        (tx.inventoryItemsPurchased && tx.inventoryItemsPurchased.length > 0) ||
        tx.categoryLabel.toLowerCase().includes('seragam') ||
        tx.categoryLabel.toLowerCase().includes('buku') ||
        tx.categoryLabel.toLowerCase().includes('lks') ||
        tx.categoryLabel.toLowerCase().includes('atribut') ||
        tx.categoryLabel.toLowerCase().includes('jual')
      );
    });

    const totalIncome = salesTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalItemsSold = salesTxs.reduce((sum, t) => {
      if (t.inventoryItemsPurchased && t.inventoryItemsPurchased.length > 0) {
        return sum + t.inventoryItemsPurchased.reduce((acc, it) => acc + (it.quantity || 1), 0);
      }
      return sum + 1;
    }, 0);

    const totalStockAssetValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);

    // Sales Expenses
    const salesExps = expenses.filter(exp => {
      const cat = (exp.category || '').toLowerCase();
      const title = (exp.title || '').toLowerCase();
      const notes = (exp.notes || '').toLowerCase();
      return (
        cat.includes('stok') || cat.includes('kulakan') || cat.includes('belanja barang') ||
        title.includes('stok') || title.includes('kulakan') || title.includes('seragam') ||
        title.includes('buku') || notes.includes('stok') || notes.includes('kulakan')
      );
    });
    const totalExpense = salesExps.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Sales Deposits
    const salesDeps = (cashDeposits || []).filter(dep => {
      const notes = (dep.notes || '').toLowerCase();
      return notes.includes('penjualan') || notes.includes('koperasi') || notes.includes('seragam') || notes.includes('buku');
    });
    const totalDeposited = salesDeps.reduce((sum, d) => sum + (d.amount || 0), 0);

    const cashOnHand = totalIncome - totalExpense - totalDeposited;

    return {
      totalIncome,
      totalItemsSold,
      totalStockAssetValue,
      totalExpense,
      totalDeposited,
      cashOnHand,
      txCount: salesTxs.length
    };
  }, [payments, inventory, expenses, cashDeposits]);

  // Matrix SPP Data
  const matrixStudents = useMemo(() => {
    return students.filter(s => s.className === matrixClass).sort((a, b) => a.rollNo - b.rollNo);
  }, [students, matrixClass]);

  // Export Matrix SPP to CSV
  const handleExportMatrixCSV = () => {
    const headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', ...MONTHS_LIST, 'Total Bayar (Rp)'];
    const rows = matrixStudents.map(st => {
      const studentSppTxs = payments.filter(p => p.studentId === st.id && p.category === 'SPP');
      const monthStatuses = MONTHS_LIST.map(m => {
        const found = studentSppTxs.find(p => p.categoryLabel.toLowerCase().includes(m.toLowerCase()));
        return found ? `Lunas (Rp ${found.amount.toLocaleString('id-ID')})` : 'Belum';
      });
      const totalPaid = studentSppTxs.reduce((sum, curr) => sum + curr.amount, 0);

      return [
        st.rollNo,
        st.nisn || '-',
        st.name,
        st.className,
        ...monthStatuses,
        totalPaid
      ];
    });

    exportToCSV(`Rekap_SPP_Kelas_${matrixClass}_${academicYear.replace('/', '_')}.csv`, [headers, ...rows]);
  };

  // Export History to CSV
  const handleExportHistoryCSV = () => {
    const headers = ['No. Kwitansi', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Metode', 'Penerima'];
    const rows = filteredPayments.map(p => [
      p.invoiceNumber,
      p.paymentDate,
      p.nisn || '-',
      p.studentName,
      p.className,
      p.category,
      p.categoryLabel,
      p.amount,
      p.paymentMethod,
      p.receivedBy
    ]);

    exportToCSV(`Laporan_Penerimaan_Kas_MTs_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  // ==========================================
  // LAPORAN KAS MASUK CALCULATIONS & MEMOS
  // ==========================================
  const reportFilteredPayments = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    return payments.filter(p => {
      // 1. Date filter
      if (reportDateRange === 'TODAY') {
        if (p.paymentDate !== todayStr) return false;
      } else if (reportDateRange === '7DAYS') {
        const pDate = new Date(p.paymentDate);
        const diffDays = (now.getTime() - pDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (reportDateRange === 'THIS_MONTH') {
        const currentYearMonth = todayStr.substring(0, 7);
        if (!p.paymentDate.startsWith(currentYearMonth)) return false;
      } else if (reportDateRange === 'THIS_SEMESTER') {
        // Simple check if date is in current academic semester
        if (semester === 'Semester Ganjil') {
          // Typically Jul - Dec
          const monthNum = parseInt(p.paymentDate.split('-')[1] || '0', 10);
          if (monthNum < 7 || monthNum > 12) return false;
        } else {
          // Typically Jan - Jun
          const monthNum = parseInt(p.paymentDate.split('-')[1] || '0', 10);
          if (monthNum < 1 || monthNum > 6) return false;
        }
      } else if (reportDateRange === 'CUSTOM') {
        if (reportStartDate && p.paymentDate < reportStartDate) return false;
        if (reportEndDate && p.paymentDate > reportEndDate) return false;
      }

      // 2. Treasurer filter & privacy isolation
      if (!isBendaharaUtama) {
        // Regular treasurer can ONLY see transactions received by themselves
        const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
        if (tInfo.id !== activeTreasurerId) return false;
      } else {
        if (reportTreasurerFilter !== 'ALL') {
          const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
          if (reportTreasurerFilter === 'other') {
            if (tInfo.id !== 'other') return false;
          } else {
            if (tInfo.id !== reportTreasurerFilter) return false;
          }
        }
      }

      // 3. Class filter
      if (reportClassFilter !== 'ALL' && p.className !== reportClassFilter) return false;

      // 4. Category filter
      if (reportCategoryFilter !== 'ALL') {
        if (reportCategoryFilter === 'PTS' && p.category === 'UJIAN') {
          // match
        } else if (p.category !== reportCategoryFilter) {
          return false;
        }
      }

      // 5. Method filter
      if (reportMethodFilter !== 'ALL' && p.paymentMethod !== reportMethodFilter) return false;

      // 6. Search query
      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase();
        const matchName = p.studentName?.toLowerCase().includes(q);
        const matchInv = p.invoiceNumber?.toLowerCase().includes(q);
        const matchNis = p.nisn?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        const matchRec = p.receivedBy?.toLowerCase().includes(q);
        const matchCat = p.categoryLabel?.toLowerCase().includes(q);
        if (!matchName && !matchInv && !matchNis && !matchNotes && !matchRec && !matchCat) return false;
      }

      return true;
    });
  }, [payments, reportDateRange, reportStartDate, reportEndDate, reportTreasurerFilter, reportClassFilter, reportCategoryFilter, reportMethodFilter, reportSearch, allTreasurers, semester]);

  // Treasurer Statistics Breakdown
  const treasurerStats = useMemo(() => {
    const totalFilteredIncome = reportFilteredPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const targetTreasurers = isBendaharaUtama 
      ? allTreasurers 
      : allTreasurers.filter(t => t.id === activeTreasurerId);
    
    const results = targetTreasurers.map((treasurer, idx) => {
      const treasurerTxs = reportFilteredPayments.filter(p => {
        const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
        return tInfo.id === treasurer.id;
      });

      const totalAmount = treasurerTxs.reduce((sum, curr) => sum + (curr.amount || 0), 0);
      const count = treasurerTxs.length;
      const tunai = treasurerTxs.filter(p => p.paymentMethod === 'Tunai').reduce((s, c) => s + c.amount, 0);
      const transfer = treasurerTxs.filter(p => p.paymentMethod === 'Transfer Bank').reduce((s, c) => s + c.amount, 0);
      const qris = treasurerTxs.filter(p => p.paymentMethod === 'QRIS').reduce((s, c) => s + c.amount, 0);
      const sppAmount = treasurerTxs.filter(p => p.category === 'SPP').reduce((s, c) => s + c.amount, 0);
      const nonSppAmount = totalAmount - sppAmount;
      const percentage = totalFilteredIncome > 0 ? ((totalAmount / totalFilteredIncome) * 100).toFixed(1) : '0';

      return {
        treasurer,
        id: treasurer.id,
        name: treasurer.name,
        roleTitle: cleanTreasurerRole(treasurer.roleTitle, idx + 1),
        nip: treasurer.nip,
        phone: treasurer.phone,
        index: idx + 1,
        count,
        totalAmount,
        tunai,
        transfer,
        qris,
        sppAmount,
        nonSppAmount,
        percentage,
        txs: treasurerTxs
      };
    });

    // Check if there are other unassigned/external transactions (only shown for Bendahara Utama)
    if (isBendaharaUtama) {
      const otherTxs = reportFilteredPayments.filter(p => {
        const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
        return tInfo.id === 'other';
      });

      if (otherTxs.length > 0) {
        const totalAmount = otherTxs.reduce((sum, curr) => sum + (curr.amount || 0), 0);
        const count = otherTxs.length;
        const tunai = otherTxs.filter(p => p.paymentMethod === 'Tunai').reduce((s, c) => s + c.amount, 0);
        const transfer = otherTxs.filter(p => p.paymentMethod === 'Transfer Bank').reduce((s, c) => s + c.amount, 0);
        const qris = otherTxs.filter(p => p.paymentMethod === 'QRIS').reduce((s, c) => s + c.amount, 0);
        const sppAmount = otherTxs.filter(p => p.category === 'SPP').reduce((s, c) => s + c.amount, 0);
        const nonSppAmount = totalAmount - sppAmount;
        const percentage = totalFilteredIncome > 0 ? ((totalAmount / totalFilteredIncome) * 100).toFixed(1) : '0';

        results.push({
          treasurer: {
            id: 'other',
            name: 'Petugas Kasir Lainnya / Sistem',
            nip: '-',
            phone: '-',
            roleTitle: 'Petugas Kasir',
            kodeUnik: '',
            active: true
          },
          id: 'other',
          name: 'Petugas Kasir Lainnya',
          roleTitle: 'Petugas Lainnya',
          nip: '-',
          phone: '-',
          index: 99,
          count,
          totalAmount,
          tunai,
          transfer,
          qris,
          sppAmount,
          nonSppAmount,
          percentage,
          txs: otherTxs
        });
      }
    }

    return results;
  }, [reportFilteredPayments, allTreasurers, isBendaharaUtama, activeTreasurerId]);

  // Category Statistics Breakdown with Treasurer Distribution
  const categoryStats = useMemo(() => {
    const CATEGORIES = [
      { key: 'SPP', label: 'SPP Bulanan Siswa', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
      { key: 'GEDUNG', label: 'Infaq Gedung / Pembangunan', icon: Building2, color: 'text-amber-600 bg-amber-50 border-amber-200' },
      { key: 'SERAGAM', label: 'Uang Seragam & Atribut', icon: Shirt, color: 'text-teal-600 bg-teal-50 border-teal-200' },
      { key: 'BUKU', label: 'Buku Paket & Modul LKS', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
      { key: 'PTS', label: 'Biaya Ujian PTS (Tengah Semester)', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 border-purple-200' },
      { key: 'SAS', label: 'Biaya Ujian SAS (Akhir Semester)', icon: GraduationCap, color: 'text-rose-600 bg-rose-50 border-rose-200' },
      { key: 'DAT', label: 'Dana Akhir Tahun (DAT)', icon: Award, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
      { key: 'KEGIATAN', label: 'Ekstrakulikuler & Kegiatan', icon: Sparkles, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
      { key: 'LAINNYA', label: 'Administrasi Lainnya', icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200' }
    ];

    const grandTotal = reportFilteredPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return CATEGORIES.map(cat => {
      const catTxs = reportFilteredPayments.filter(p => p.category === cat.key || (cat.key === 'PTS' && p.category === 'UJIAN'));
      const totalAmount = catTxs.reduce((acc, curr) => acc + curr.amount, 0);
      const count = catTxs.length;
      const percentage = grandTotal > 0 ? ((totalAmount / grandTotal) * 100).toFixed(1) : '0';

      const byTreasurer = allTreasurers.map((t, idx) => {
        const tTxs = catTxs.filter(p => {
          const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
          return tInfo.id === t.id;
        });
        return {
          treasurerId: t.id,
          name: t.name,
          roleTitle: cleanTreasurerRole(t.roleTitle, idx + 1),
          amount: tTxs.reduce((sum, curr) => sum + curr.amount, 0),
          count: tTxs.length
        };
      });

      return {
        ...cat,
        count,
        totalAmount,
        percentage,
        byTreasurer
      };
    });
  }, [reportFilteredPayments, allTreasurers]);

  // Report KPIs
  const reportKPIs = useMemo(() => {
    const totalAmount = reportFilteredPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const count = reportFilteredPayments.length;
    const tunaiTotal = reportFilteredPayments.filter(p => p.paymentMethod === 'Tunai').reduce((sum, c) => sum + c.amount, 0);
    const transferTotal = reportFilteredPayments.filter(p => p.paymentMethod === 'Transfer Bank').reduce((sum, c) => sum + c.amount, 0);
    const qrisTotal = reportFilteredPayments.filter(p => p.paymentMethod === 'QRIS').reduce((sum, c) => sum + c.amount, 0);
    const digitalTotal = transferTotal + qrisTotal;
    const avgAmount = count > 0 ? Math.round(totalAmount / count) : 0;

    return {
      totalAmount,
      count,
      tunaiTotal,
      transferTotal,
      qrisTotal,
      digitalTotal,
      avgAmount
    };
  }, [reportFilteredPayments]);

  // Navigation Items for Treasurer Sidebar (Hook defined unconditionally before any early returns)
  const treasurerNavItems = useMemo(() => {
    if (financeDomain === 'pembayaran') {
      return [
        {
          id: 'input',
          label: 'Input Pembayaran Baru',
          icon: Plus,
          badge: 'Kasir',
          badgeColor: 'bg-emerald-400 text-slate-950 font-black'
        },
        {
          id: 'setoran_kas',
          label: 'Setoran Kas ke Utama',
          icon: ArrowRightLeft,
          badge: validCashDeposits.length > 0 ? `${validCashDeposits.length}` : undefined,
          badgeColor: 'bg-emerald-300 text-emerald-950 font-black'
        },
        {
          id: 'pengeluaran',
          label: 'Pengeluaran Kas (BKK)',
          icon: TrendingDown,
          badge: expenses.length > 0 ? `${expenses.length}` : undefined,
          badgeColor: 'bg-rose-400 text-rose-950 font-black'
        },
        {
          id: 'tagihan_tunggakan',
          label: 'Atur Tagihan & Tunggakan',
          icon: Layers,
          badge: 'Tagihan',
          badgeColor: 'bg-indigo-300 text-indigo-950 font-bold'
        },
        {
          id: 'riwayat',
          label: 'Riwayat Transaksi',
          icon: Receipt,
          badge: `${payments.length}`,
          badgeColor: 'bg-slate-300 text-slate-900 font-bold'
        },
        {
          id: 'matrix_spp',
          label: 'Matrix SPP (12 Bulan)',
          icon: Calendar,
          badge: 'Matrix',
          badgeColor: 'bg-teal-300 text-teal-950 font-bold'
        },
        {
          id: 'laporan',
          label: 'Laporan & Rekapitulasi',
          icon: TrendingUp,
          badge: 'Rekap',
          badgeColor: 'bg-amber-400 text-slate-950 font-black'
        },
        {
          id: 'pengaturan',
          label: 'Tarif & Keamanan',
          icon: KeyRound,
          badge: 'Setting',
          badgeColor: 'bg-slate-400 text-slate-950 font-bold'
        }
      ];
    } else {
      return [
        {
          id: 'pos_penjualan',
          label: 'Kasir Penjualan (POS)',
          icon: ShoppingBag,
          badge: 'POS',
          badgeColor: 'bg-indigo-400 text-indigo-950 font-black'
        },
        {
          id: 'stok_barang',
          label: 'Stok LKS & Seragam',
          icon: Package,
          badge: inventory.length > 0 ? `${inventory.length}` : undefined,
          badgeColor: 'bg-amber-400 text-slate-950 font-black'
        },
        {
          id: 'riwayat_penjualan',
          label: 'Riwayat Nota Penjualan',
          icon: Receipt,
          badge: salesDomainKPI.txCount > 0 ? `${salesDomainKPI.txCount}` : undefined,
          badgeColor: 'bg-slate-300 text-slate-900 font-bold'
        },
        {
          id: 'kas_penjualan',
          label: 'Buku Kas Penjualan',
          icon: HandCoins,
          badge: 'Kas POS',
          badgeColor: 'bg-emerald-300 text-emerald-950 font-black'
        },
        {
          id: 'laporan_penjualan',
          label: 'Laporan & Laba Rugi',
          icon: TrendingUp,
          badge: 'Laba/Rugi',
          badgeColor: 'bg-indigo-300 text-indigo-950 font-bold'
        }
      ];
    }
  }, [financeDomain, validCashDeposits.length, expenses.length, payments.length, inventory.length, salesDomainKPI.txCount]);

  // Export Kas Masuk to CSV
  const handleExportKasMasukCSV = () => {
    const headers = [
      'No',
      'No. Kwitansi',
      'Tanggal Kas Masuk',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Pos Kas / Kategori',
      'Uraian / Keterangan',
      'Metode Pembayaran',
      'ID Bendahara',
      'Bendahara Penerima',
      'Jabatan Bendahara',
      'Nominal Kas Masuk (Rp)'
    ];

    const rows = reportFilteredPayments.map((p, idx) => {
      const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
      return [
        idx + 1,
        p.invoiceNumber,
        p.paymentDate,
        p.nisn || '-',
        p.studentName,
        p.className,
        p.category,
        p.categoryLabel + (p.notes ? ` (${p.notes})` : ''),
        p.paymentMethod,
        tInfo.id,
        tInfo.name,
        tInfo.roleTitle,
        p.amount
      ];
    });

    const totalSum = reportFilteredPayments.reduce((acc, curr) => acc + curr.amount, 0);
    rows.push(['', '', '', '', '', '', '', 'TOTAL PENERIMAAN KAS MASUK', '', '', '', '', totalSum]);

    const dateTag = reportDateRange === 'CUSTOM' 
      ? `${reportStartDate || 'Awal'}_sd_${reportEndDate || 'Akhir'}`
      : reportDateRange.toLowerCase();

    const cleanSchoolName = (schoolOfficials?.namaSekolah || 'Madrasah').replace(/[^a-zA-Z0-9]/g, '_');
    exportToCSV(`Laporan_Kas_Masuk_${cleanSchoolName}_${dateTag}_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  // ==========================================
  // VIEW: 1. ACCESS CODE GATE (IF LOCKED)
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-xl mx-auto my-6 text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Area Khusus Bendahara Sekolah</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kunci Keamanan Pembayaran & Keuangan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Menu ini memuat data keuangan, SPP, infaq, dan cetak kwitansi. Masukkan <strong>Kode Unik Bendahara</strong> untuk membuka akses.
            </p>
          </div>
        </div>

        <form onSubmit={handleAuthSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Kode Unik Akses Bendahara
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={inputCode}
                onChange={e => {
                  setInputCode(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="Masukkan Kode Unik Bendahara..."
                className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                  authError
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-amber-500 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberAuth}
                onChange={e => setRememberAuth(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span>Ingat sesi ini di browser</span>
            </label>

            <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg font-medium border border-amber-200 flex items-center space-x-1">
              <Info className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Tanya ke Super Admin</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Buka Portal Pembayaran</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <p>Sistem Informasi Administrasi Keuangan • {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: 2. UNLOCKED TREASURER DASHBOARD
  // ==========================================
  const isTreasurerExpanded = !isTreasurerSidebarAutoHide || isTreasurerSidebarHovered || isTreasurerMobileMenuOpen;

  const renderTreasurerNavItem = (item: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }) => {
    const Icon = item.icon;
    const isActive = activeSubTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveSubTab(item.id as any);
          setIsTreasurerMobileMenuOpen(false);
        }}
        title={!isTreasurerExpanded ? `${item.label} ${item.badge ? `(${item.badge})` : ''}` : undefined}
        className={`w-full flex items-center transition-all duration-200 cursor-pointer group ${
          isTreasurerExpanded ? 'justify-between px-3.5 py-2.5' : 'justify-center py-2.5 px-2'
        } text-xs font-semibold rounded-xl ${
          isActive
            ? financeDomain === 'pembayaran'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/30'
              : 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950/30'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
        }`}
      >
        <div className={`flex items-center ${isTreasurerExpanded ? 'space-x-3' : 'justify-center w-full'}`}>
          <div className="relative flex items-center justify-center">
            <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            }`} />
            {!isTreasurerExpanded && isActive && (
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-slate-900 animate-pulse ${
                financeDomain === 'pembayaran' ? 'bg-emerald-400' : 'bg-indigo-400'
              }`} />
            )}
          </div>
          {isTreasurerExpanded && (
            <span className="truncate text-left leading-tight">{item.label}</span>
          )}
        </div>

        {isTreasurerExpanded && item.badge && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight shrink-0 ml-1.5 shadow-2xs ${
              item.badgeColor || 'bg-slate-700 text-slate-200'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Treasurer Status */}
      <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-emerald-800/50">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
            <WalletCards className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Otoritas Kasir: {activeTreasurer.roleTitle || 'Bendahara'}</span>
              </span>
              <span className="text-xs text-emerald-400/60 font-medium hidden sm:inline">•</span>
              <span className="text-xs text-emerald-200/80 font-medium hidden sm:inline">
                Tahun Pelajaran {academicYear}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
              Administrasi & Pembayaran Siswa
            </h1>
            <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center flex-wrap gap-1.5">
              <span>Petugas Bertugas:</span>
              <strong className="text-amber-300 font-bold bg-amber-400/15 px-2 py-0.5 rounded border border-amber-300/30">{activeTreasurer.name}</strong>
              {activeTreasurer.nip && (
                <span className="text-emerald-300/70 text-[11px] font-mono">(NIP: {activeTreasurer.nip})</span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Controls - Auto-Hide Toggle & Lock */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Mobile Menu Open Button */}
          <button
            type="button"
            onClick={() => setIsTreasurerMobileMenuOpen(true)}
            className="lg:hidden px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-emerald-600/60"
          >
            <Menu className="w-4 h-4" />
            <span>Menu Bendahara</span>
          </button>

          {/* Desktop Auto-Hide Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTreasurerSidebarAutoHide}
            className={`hidden lg:flex px-3 py-1.5 rounded-xl text-xs font-bold transition-all items-center space-x-1.5 border cursor-pointer ${
              isTreasurerSidebarAutoHide
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title={isTreasurerSidebarAutoHide ? 'Mode Auto-Hide Aktif (Klik untuk Pasang Menu Tetap Terbuka)' : 'Aktifkan Mode Auto-Hide Menu Kiri Bendahara'}
          >
            {isTreasurerSidebarAutoHide ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="text-[11px]">
              {isTreasurerSidebarAutoHide ? 'Auto-Hide Aktif' : 'Menu Samping'}
            </span>
          </button>

          <div className="px-3 py-1.5 bg-emerald-900/60 rounded-xl text-xs font-semibold text-emerald-200 border border-emerald-700/60 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sesi Terisolasi</span>
          </div>

          <button
            onClick={() => setActiveSubTab('pengaturan')}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Tarif Biaya</span>
          </button>
          <button
            onClick={handleLock}
            className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci / Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left Auto-Hide Sidebar + Content Area */}
      <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6 relative">
        
        {/* Spacer for Auto-Hide Sidebar on Desktop */}
        {isTreasurerSidebarAutoHide && (
          <div className="hidden lg:block w-16 shrink-0 transition-all duration-300" />
        )}

        {/* Backdrop on Mobile */}
        {isTreasurerMobileMenuOpen && (
          <div
            onClick={() => setIsTreasurerMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Treasurer Left Sidebar (with Auto-Hide capability) */}
        <aside
          onMouseEnter={() => {
            if (isTreasurerSidebarAutoHide) setIsTreasurerSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (isTreasurerSidebarAutoHide) setIsTreasurerSidebarHovered(false);
          }}
          className={`bg-slate-900 text-white flex flex-col border border-slate-800 select-none transition-all duration-300 ease-in-out ${
            isTreasurerMobileMenuOpen
              ? 'block fixed inset-y-0 left-0 z-50 w-72 shadow-2xl rounded-r-3xl rounded-l-none'
              : isTreasurerSidebarAutoHide
              ? isTreasurerSidebarHovered
                ? 'fixed lg:sticky top-20 left-0 z-40 w-64 shadow-2xl bg-slate-900/98 backdrop-blur-md border-r-2 border-emerald-500/80 rounded-2xl max-h-[calc(100vh-6rem)] overflow-y-auto'
                : 'hidden lg:flex sticky top-20 z-30 w-16 shadow-md rounded-2xl max-h-[calc(100vh-6rem)] overflow-hidden'
              : 'hidden lg:flex sticky top-20 shrink-0 w-64 rounded-2xl max-h-[calc(100vh-6rem)]'
          }`}
        >
          {/* Sidebar Top: Title & Pin/Close */}
          <div className={`border-b border-slate-800/80 bg-slate-950/70 transition-all ${
            isTreasurerExpanded ? 'p-3.5' : 'p-3 flex flex-col items-center justify-center'
          }`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shrink-0 ${
                  financeDomain === 'pembayaran'
                    ? 'bg-gradient-to-tr from-emerald-700 to-teal-500'
                    : 'bg-gradient-to-tr from-indigo-700 to-violet-500'
                }`}>
                  <WalletCards className="w-4 h-4" />
                </div>
                {isTreasurerExpanded && (
                  <div className="animate-in fade-in duration-200 truncate">
                    <h2 className="text-xs font-black tracking-tight uppercase leading-tight text-white flex items-center space-x-1.5">
                      <span>Menu Bendahara</span>
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {financeDomain === 'pembayaran' ? 'Pembayaran & SPP' : 'Toko POS & Koperasi'}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Mobile / Pin Desktop */}
              {isTreasurerMobileMenuOpen ? (
                <button
                  type="button"
                  onClick={() => setIsTreasurerMobileMenuOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : isTreasurerExpanded ? (
                <button
                  type="button"
                  onClick={handleToggleTreasurerSidebarAutoHide}
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1 border ${
                    isTreasurerSidebarAutoHide
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isTreasurerSidebarAutoHide ? 'Sematkan Menu' : 'Aktifkan Auto-Hide (Ciut Otomatis)'}
                >
                  {isTreasurerSidebarAutoHide ? (
                    <PinOff className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Pin className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : null}
            </div>

            {/* Quick Domain Switcher Inside Sidebar */}
            {isTreasurerExpanded && (
              <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setFinanceDomain('pembayaran');
                    if (['pos_penjualan', 'riwayat_penjualan', 'kas_penjualan', 'laporan_penjualan'].includes(activeSubTab)) {
                      setActiveSubTab('input');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer ${
                    financeDomain === 'pembayaran'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  <span>SPP/Kas</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFinanceDomain('penjualan');
                    if (!['pos_penjualan', 'stok_barang', 'riwayat_penjualan', 'kas_penjualan', 'laporan_penjualan'].includes(activeSubTab)) {
                      setActiveSubTab('pos_penjualan');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer ${
                    financeDomain === 'penjualan'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Store className="w-3 h-3" />
                  <span>Toko POS</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
            {isTreasurerExpanded && (
              <div className="px-2 mb-1.5 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                {financeDomain === 'pembayaran' ? 'Modul Pembayaran' : 'Modul Penjualan POS'}
              </div>
            )}
            <div className="space-y-1">
              {treasurerNavItems.map(renderTreasurerNavItem)}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className={`bg-slate-950 border-t border-slate-800 text-xs text-slate-400 ${
            isTreasurerExpanded ? 'p-3' : 'p-2 flex flex-col items-center'
          }`}>
            {isTreasurerExpanded ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Petugas:</span>
                  <span className="text-amber-300 font-bold truncate max-w-[120px]">{activeTreasurer.name}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Kasir Aktif</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleTreasurerSidebarAutoHide}
                    className="text-amber-300 hover:underline cursor-pointer text-[10px] font-semibold"
                  >
                    {isTreasurerSidebarAutoHide ? 'Sematkan' : 'Auto-Hide'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleToggleTreasurerSidebarAutoHide}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="Perluas & Kunci Menu Samping"
              >
                <PanelLeftOpen className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
        </aside>

        {/* Right Main Working Area */}
        <div className="flex-1 w-full min-w-0 space-y-6">

      {/* Summary Metric Cards - Role & Domain Aware */}
      {financeDomain === 'pembayaran' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {isBendaharaUtama ? (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kas Masuk Siswa</p>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Rp {stats.totalIncome.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-semibold">{stats.txCount} Transaksi Semua Bendahara</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kas di Bendahara Utama</p>
                  <h3 className="text-base sm:text-lg font-black text-teal-900">
                    Rp {treasurerCashBalances.totalAllDepositedToUtama.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-teal-600 font-semibold">{validCashDeposits.length} Kali Setoran Diterima</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sisa Belum Disetor (B1-B5)</p>
                  <h3 className="text-base sm:text-lg font-black text-amber-900">
                    Rp {treasurerCashBalances.totalRemainingInHands.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-amber-600 font-semibold">Kas Masih di Tangan Bendahara 1-5</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa Terdaftar</p>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {students.length} Siswa
                  </h3>
                  <p className="text-[10px] text-indigo-600 font-semibold">{classList.length} Rombel Kelas</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kas Diterima oleh Anda</p>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Rp {myCashBalance.grossIncome.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-semibold">{myCashBalance.txCount} Transaksi Penerimaan Anda</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <SendHorizonal className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Telah Anda Setorkan</p>
                  <h3 className="text-base sm:text-lg font-black text-teal-900">
                    Rp {myCashBalance.totalDeposited.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-teal-600 font-semibold">Disetor ke Bendahara Utama</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sisa Kas di Tangan Anda</p>
                  <h3 className="text-base sm:text-lg font-black text-amber-900">
                    Rp {myCashBalance.remainingCashOnHand.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-amber-600 font-semibold">
                    {myCashBalance.remainingCashOnHand > 0 ? 'Wajib Disetor ke Kas Pusat' : 'Kas Anda Klir (Nol)'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Akun Anda</p>
                  <h3 className="text-base sm:text-sm font-black text-slate-900 truncate max-w-[150px]" title={activeTreasurer.name}>
                    {activeTreasurer.name}
                  </h3>
                  <p className="text-[10px] text-indigo-600 font-semibold">{activeTreasurer.roleTitle}</p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Sales Domain KPI Cards */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Omset Penjualan</p>
              <h3 className="text-base sm:text-lg font-black text-indigo-950">
                Rp {salesDomainKPI.totalIncome.toLocaleString('id-ID')}
              </h3>
              <p className="text-[10px] text-indigo-600 font-semibold">{salesDomainKPI.txCount} Transaksi Penjualan</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Item Terjual</p>
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                {salesDomainKPI.totalItemsSold.toLocaleString('id-ID')} Pcs
              </h3>
              <p className="text-[10px] text-emerald-600 font-semibold">{inventory.length} Jenis Katalog Barang</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nilai Aset Stok Tersedia</p>
              <h3 className="text-base sm:text-lg font-black text-amber-900">
                Rp {salesDomainKPI.totalStockAssetValue.toLocaleString('id-ID')}
              </h3>
              <p className="text-[10px] text-amber-600 font-semibold">Persediaan di Gudang</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sisa Kas Penjualan di Kasir</p>
              <h3 className="text-base sm:text-lg font-black text-teal-900">
                Rp {salesDomainKPI.cashOnHand.toLocaleString('id-ID')}
              </h3>
              <p className="text-[10px] text-teal-600 font-semibold">
                {salesDomainKPI.cashOnHand > 0 ? 'Siap Disetor ke Kas Utama' : 'Saldo Kas Klir'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RINCIAN POS PEMASUKAN KAS BENDAHARA */}
      {/* (SPP, STS, SAS, Gedung, Seragam, Buku, DAT, Kegiatan, Lainnya) */}
      {/* Sesuai pembayaran yang diterima oleh bendahara & otomatis NOL saat sudah disetor */}
      {/* ========================================================= */}
      {financeDomain === 'pembayaran' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    Rincian Pos Pemasukan Kas (SPP, STS, SAS, Gedung, dll)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase">
                    Kas Masuk per Pos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi penerimaan per pos oleh{' '}
                  <strong className="text-slate-800">{treasurerPosBreakdown.targetName}</strong> • Sisa kas otomatis{' '}
                  <strong className="text-emerald-700">Rp 0 (Nol)</strong> setelah disetorkan ke Bendahara Utama.
                </p>
              </div>
            </div>

            {/* Right Controls: Filter Bendahara (BU Only) & Collapse */}
            <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
              {isBendaharaUtama && (
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Pilih Kasir:</span>
                  <select
                    value={posTreasurerView}
                    onChange={e => setPosTreasurerView(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="DEFAULT">Konsolidasi (Semua Bendahara)</option>
                    {treasurerCashBalances.items.map(t => (
                      <option key={t.id} value={t.id}>
                        B{t.index}: {t.name} (Sisa: Rp {t.remainingCashOnHand.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsPosBreakdownCollapsed(prev => !prev)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{isPosBreakdownCollapsed ? 'Tampilkan Pos' : 'Sembunyikan'}</span>
                {isPosBreakdownCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!isPosBreakdownCollapsed && (
            <>
              {/* Summary Balance Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Penerimaan Pos Ini
                  </span>
                  <div className="text-base font-black text-slate-900">
                    Rp {treasurerPosBreakdown.totalGrossIncome.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold block">
                    {treasurerPosBreakdown.items.reduce((s, i) => s + i.txCount, 0)} Transaksi Terkumpul
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Telah Disetorkan ke Kas Pusat
                  </span>
                  <div className="text-base font-black text-teal-800">
                    Rp {treasurerPosBreakdown.totalDeposited.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-teal-600 font-semibold block">
                    Telah Diverifikasi Bendahara Utama
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sisa Kas di Tangan Saat Ini
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-base font-black ${
                      treasurerPosBreakdown.remainingCashOnHand > 0 ? 'text-amber-900' : 'text-emerald-700'
                    }`}>
                      Rp {treasurerPosBreakdown.remainingCashOnHand.toLocaleString('id-ID')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      treasurerPosBreakdown.remainingCashOnHand > 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {treasurerPosBreakdown.remainingCashOnHand > 0 ? 'Wajib Disetor' : 'Klir (Nol)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {treasurerPosBreakdown.remainingCashOnHand > 0 ? 'Kas masih di tangan kasir' : 'Semua pos lunas disetor'}
                  </span>
                </div>

                <div className="flex items-center sm:col-span-3 lg:col-span-1">
                  {treasurerPosBreakdown.remainingCashOnHand > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDepositModal(
                        treasurerPosBreakdown.targetTreasurerId === 'ALL' ? undefined : treasurerPosBreakdown.targetTreasurerId
                      )}
                      className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                    >
                      <SendHorizonal className="w-4 h-4" />
                      <span>Setor Kas ke Kas Pusat</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Semua Pos Telah Disetor (Nol)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter & Search Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setPosFilterMode('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                      posFilterMode === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Semua Pos ({treasurerPosBreakdown.items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosFilterMode('ACTIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                      posFilterMode === 'ACTIVE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Ada Penerimaan ({treasurerPosBreakdown.activePosCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosFilterMode('UNSETTLED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                      posFilterMode === 'UNSETTLED'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Sisa Belum Disetor ({treasurerPosBreakdown.unsettledPosCount})
                  </button>
                </div>

                <div className="relative shrink-0 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={posSearchQuery}
                    onChange={e => setPosSearchQuery(e.target.value)}
                    placeholder="Cari pos (SPP, STS, Gedung...)"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {posSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPosSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pos Cards Grid */}
              {(() => {
                const displayedItems = treasurerPosBreakdown.items.filter(item => {
                  if (posFilterMode === 'ACTIVE' && item.grossAmount === 0) return false;
                  if (posFilterMode === 'UNSETTLED' && item.sisaDiTangan === 0) return false;
                  if (posSearchQuery.trim()) {
                    const q = posSearchQuery.toLowerCase();
                    return (
                      item.name.toLowerCase().includes(q) ||
                      item.shortLabel.toLowerCase().includes(q) ||
                      item.description.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (displayedItems.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">Tidak ada pos pemasukan yang sesuai dengan filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setPosFilterMode('ALL');
                          setPosSearchQuery('');
                        }}
                        className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {displayedItems.map(item => {
                      const IconComp = item.icon;
                      return (
                        <div
                          key={item.key}
                          className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                            item.sisaDiTangan > 0
                              ? 'bg-white border-slate-200 shadow-2xs hover:border-amber-400'
                              : item.grossAmount > 0
                              ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300'
                              : 'bg-slate-50/60 border-slate-200/70 opacity-80'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-9 h-9 rounded-lg ${item.bgLight} ${item.textColor} flex items-center justify-center shrink-0 font-bold`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                                    {item.name}
                                  </h4>
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                    {item.codeBadge}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full shrink-0">
                              {item.txCount} Trx
                            </span>
                          </div>

                          {/* Nominal Breakdown */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                Diterima:
                              </span>
                              <strong className="text-xs font-black text-slate-800 block">
                                Rp {item.grossAmount.toLocaleString('id-ID')}
                              </strong>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                Disetorkan:
                              </span>
                              <strong className="text-xs font-black text-teal-800 block">
                                Rp {item.depositedAmount.toLocaleString('id-ID')}
                              </strong>
                            </div>
                          </div>

                          {/* Sisa Kas di Tangan per Pos (Otomatis NOL saat sudah disetorkan ke Bendahara Utama) */}
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            item.sisaDiTangan > 0
                              ? 'bg-amber-50/90 border-amber-200/90 text-amber-950'
                              : 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950'
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              Sisa di Tangan:
                            </span>
                            <div className="flex items-center space-x-1.5">
                              {item.sisaDiTangan > 0 ? (
                                <>
                                  <HandCoins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <strong className="text-sm font-black text-amber-900">
                                    Rp {item.sisaDiTangan.toLocaleString('id-ID')}
                                  </strong>
                                  <span className="text-[9px] bg-amber-200 text-amber-900 font-black px-1.5 py-0.5 rounded">
                                    Wajib Setor
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <strong className="text-sm font-black text-emerald-800">
                                    Rp 0
                                  </strong>
                                  <span className="text-[9px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.5 rounded">
                                    Nol (Disetor)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="space-y-1 pt-0.5">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  item.sisaDiTangan === 0 && item.grossAmount > 0
                                    ? 'bg-emerald-500'
                                    : item.grossAmount === 0
                                    ? 'bg-slate-300'
                                    : item.barColor
                                }`}
                                style={{ width: `${item.percentDeposited}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Status Penyetoran Kas</span>
                              <span className={item.sisaDiTangan === 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-600 font-bold'}>
                                {item.sisaDiTangan === 0 && item.grossAmount > 0
                                  ? '100% Lunas Disetor (Nol)'
                                  : item.grossAmount === 0
                                  ? 'Belum Ada Penerimaan'
                                  : `${item.percentDeposited}% Disetor ke Kas Pusat`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Sync Alert Banner if there are discrepancies between payments & active students */}
      {unsyncedStats.fixableCount > 0 && !isBannerDismissed && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <RefreshCw className={`w-5 h-5 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-black text-amber-950">
                  Ditemukan {unsyncedStats.fixableCount} Transaksi Pembayaran Perlu Disinkronkan
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase">
                  Perhatian
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Data siswa yang baru dimasukkan/diimpor ulang dapat otomatis dihubungkan kembali dengan riwayat pembayaran yang sudah ada agar status tagihan menjadi <strong>Lunas</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowSyncModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Lihat Rincian ({unsyncedStats.fixableCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSyncModal(true);
                handleExecuteSyncGlobal();
              }}
              disabled={isSyncingGlobal}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
              <span>{isSyncingGlobal ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="w-8 h-8 rounded-xl bg-amber-200/50 hover:bg-amber-200 text-amber-900 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 1: INPUT PEMBAYARAN BARU */}
      {/* ========================================================= */}
      {activeSubTab === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form Container */}
          <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Formulir Penerimaan Kas / Pembayaran</h2>
                <p className="text-xs text-slate-500">Catat transaksi pembayaran siswa dan terbitkan kwitansi resmi</p>
              </div>
              <span className="text-[11px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                TA {academicYear}
              </span>
            </div>

            {formSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl text-emerald-900 flex items-start justify-between gap-2 text-xs animate-in fade-in">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Transaksi Berhasil Dicatat!</strong>
                    <span>{formSuccessMessage}</span>
                  </div>
                </div>
                {selectedInvoice && (
                  <button
                    onClick={() => setSelectedInvoice(selectedInvoice)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shrink-0 cursor-pointer"
                  >
                    Lihat Kwitansi
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Step 1: Select Class & Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Pilih Kelas Siswa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedClass}
                    onChange={e => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {classList.map(c => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {classStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.rollNo}. {st.name} {st.nisn ? `(NISN: ${st.nisn})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Payment Category & Month */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      3. Pos / Jenis Pembayaran <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Status kewajiban otomatis disesuaikan dengan tingkat kelas <strong>Kelas {studentGradeLevel}</strong> ({selectedClass}).
                    </p>
                  </div>

                  {/* Filter Tabs: Semua / Wajib / Tidak Wajib */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => setPosFilterTab('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        posFilterTab === 'ALL'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua Pos ({categorizedPosItems.all.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosFilterTab('WAJIB')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        posFilterTab === 'WAJIB'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      <span>🟢 Wajib</span>
                      <span className="text-[10px] opacity-90">({categorizedPosItems.wajib.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosFilterTab('TIDAK_WAJIB')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        posFilterTab === 'TIDAK_WAJIB'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>⚪ Tidak Wajib</span>
                      <span className="text-[10px] opacity-90">({categorizedPosItems.tidakWajib.length})</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Section 1: POS WAJIB DIBAYARKAN */}
                {(posFilterTab === 'ALL' || posFilterTab === 'WAJIB') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <h4 className="text-xs font-black text-emerald-950">
                          Pos Pembayaran Wajib (Tingkat Kelas {studentGradeLevel})
                        </h4>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                        {categorizedPosItems.wajib.length} Pos Wajib Ditagihkan
                      </span>
                    </div>

                    {categorizedPosItems.wajib.length === 0 ? (
                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
                        <p className="text-xs font-bold text-amber-900">
                          Belum ada pos pembayaran wajib yang diaktifkan untuk tingkat Kelas {studentGradeLevel}.
                        </p>
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          Anda dapat mengaturnya di tab &quot;Atur Kewajiban & Pos Biaya&quot;.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {categorizedPosItems.wajib.map(item => {
                          const Icon = item.icon;
                          const isSelected = selectedBillingItemId === item.id || paymentCategory === item.category;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => handleSelectPosItem(item)}
                              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer relative ${
                                isSelected
                                  ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/30 text-emerald-950 font-bold shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between w-full gap-1.5">
                                <div className="flex items-start space-x-2">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black leading-snug text-slate-900">{item.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{item.sub}</p>
                                  </div>
                                </div>
                                <span className="inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                  WAJIB
                                </span>
                              </div>

                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium text-[10px]">Tarif Standar:</span>
                                <span className="font-black text-emerald-700">
                                  Rp {(item.defaultAmount || 0).toLocaleString('id-ID')}
                                </span>
                              </div>

                              {item.studentItemArrears > 0 && (
                                <div className="mt-1 text-[10px] font-bold text-rose-600 flex items-center justify-between">
                                  <span>Sisa Tunggakan:</span>
                                  <span>Rp {item.studentItemArrears.toLocaleString('id-ID')}</span>
                                </div>
                              )}
                              {item.isItemLunas && (
                                <div className="mt-1 text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                                  <span>✓</span>
                                  <span>Lunas untuk siswa ini</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Section 2: POS TIDAK WAJIB / OPSIONAL / BEBAS */}
                {(posFilterTab === 'ALL' || posFilterTab === 'TIDAK_WAJIB') && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-slate-400"></span>
                        <h4 className="text-xs font-bold text-slate-700">
                          Pos Pembayaran Tidak Wajib / Tambahan / Bebas
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {categorizedPosItems.tidakWajib.length} Pos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {categorizedPosItems.tidakWajib.map(item => {
                        const Icon = item.icon;
                        const isSelected = selectedBillingItemId === item.id || paymentCategory === item.category;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleSelectPosItem(item)}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between w-full gap-1">
                              <div className="flex items-start space-x-2">
                                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold leading-snug">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                item.isExempt
                                  ? 'bg-purple-100 text-purple-800'
                                  : !item.gradeMatched
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-600'
                              }`}>
                                {item.obligationLabel}
                              </span>
                              <span className="text-slate-500 font-semibold">
                                {item.defaultAmount > 0 ? `Rp ${item.defaultAmount.toLocaleString('id-ID')}` : 'Bebas'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* If SPP, select month with paid status indicators */}
              {paymentCategory === 'SPP' && (
                <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span>Pilih Bulan SPP yang Dibayar</span>
                      </label>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-md border border-indigo-200">
                        Multi-Pilih Aktif
                      </span>
                    </div>
                    {currentStudentArrears && (
                      <span className="text-[10px] font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                        {currentStudentArrears.sppPaidMonthsCount ?? (currentStudentArrears.sppPaidMonths?.length ?? 0)} dari {currentStudentArrears.sppTotalMonthsCount || 12} Bulan Lunas
                      </span>
                    )}
                  </div>

                  {/* Multi-month selection info bar and action shortcuts */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 text-xs">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Dipilih:</span>
                      {selectedMonths.length > 0 ? (
                        <>
                          <span className="font-extrabold text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200 text-xs">
                            {selectedMonths.length} Bulan: {selectedMonths.join(', ')}
                          </span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs">
                            Rp {(currentSppTariff * selectedMonths.length).toLocaleString('id-ID')}
                          </span>
                        </>
                      ) : (
                        <span className="text-rose-600 text-[11px] font-bold italic">
                          Belum ada bulan dipilih (klik kotak bulan di bawah)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAllUnpaidMonths}
                        className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center space-x-1"
                        title="Pilih semua bulan yang belum lunas sekaligus"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pilih Semua Belum Lunas</span>
                      </button>
                      {selectedMonths.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMonths([]);
                            setPaymentAmount(0);
                          }}
                          className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                          title="Hapus semua pilihan bulan"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 12 Months Grid with Multi-select */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {MONTHS_LIST.map(m => {
                      const isSelected = selectedMonths.includes(m);
                      const isPaid = (currentStudentArrears?.sppPaidMonths || []).some(p => p.toLowerCase().includes(m.toLowerCase()));
                      const selectionIndex = isSelected ? selectedMonths.indexOf(m) + 1 : null;

                      return (
                        <button
                          type="button"
                          key={m}
                          onClick={() => toggleMonthSelection(m)}
                          className={`py-2 px-1.5 text-center rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center relative select-none ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 ring-offset-1'
                              : isPaid
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                : 'bg-white text-slate-700 hover:bg-indigo-50 border border-indigo-200/80 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{m}</span>
                            {isSelected && (
                              <span className="w-3.5 h-3.5 rounded-full bg-white text-indigo-700 text-[9px] font-black inline-flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </div>
                          {isSelected ? (
                            <span className="text-[9px] font-extrabold text-indigo-100 mt-0.5">
                              {selectedMonths.length > 1 ? `Pilihan ke-${selectionIndex}` : '✓ Dipilih'}
                            </span>
                          ) : isPaid ? (
                            <span className={`text-[9px] font-extrabold flex items-center space-x-0.5 mt-0.5 text-emerald-600`}>
                              <span>✓</span>
                              <span>Lunas</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                              + Pilih
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-indigo-900/80 font-medium">
                    💡 <em>Petunjuk: Anda dapat mengklik beberapa kotak bulan untuk pembayaran langsung beberapa bulan sekaligus. Total nominal pembayaran akan otomatis dihitung.</em>
                  </p>
                </div>
              )}

              {/* If SERAGAM is selected, display specialized Uniform selection (8 types) and size picker with real-time stock */}
              {paymentCategory === 'SERAGAM' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-950 flex items-center space-x-1.5">
                      <Package className="w-4 h-4 text-amber-600" />
                      <span>Pilih Jenis Seragam & Ukuran (Otomatis Kurangi Stok)</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      8 Pilihan Seragam Madrasah
                    </span>
                  </div>

                  {/* 8 Uniform Type Pills */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">Jenis Seragam:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        'Baju Olahraga',
                        'Baju Kotak',
                        'Rok Kotak',
                        'Almamater',
                        'Baju Jurusan',
                        'Baju Khas',
                        'Baju Batik',
                        'Baju Muslim'
                      ].map(uType => {
                        const isSelected = selectedUniformType === uType;
                        const matchingItem = inventory.find(
                          i => i.category === 'SERAGAM' && i.variantType === uType && (i.size === selectedUniformSize || (!i.size && selectedUniformSize === 'All Size'))
                        ) || inventory.find(i => i.category === 'SERAGAM' && i.variantType === uType);
                        const stockCount = matchingItem ? matchingItem.currentStock : 0;

                        return (
                          <button
                            type="button"
                            key={uType}
                            onClick={() => {
                              setSelectedUniformType(uType as UniformType);
                              if (matchingItem) {
                                setSelectedStockItemId(matchingItem.id);
                                if (matchingItem.unitPrice) {
                                  setPaymentAmount(matchingItem.unitPrice * stockItemQuantity);
                                }
                              }
                            }}
                            className={`p-2 rounded-xl text-left border transition flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white font-black border-amber-600 shadow-xs ring-2 ring-amber-400/40'
                                : 'bg-white text-slate-700 hover:bg-amber-100/50 border-amber-200'
                            }`}
                          >
                            <span className="text-xs leading-tight font-extrabold">{uType}</span>
                            <span className={`text-[10px] mt-1 font-semibold ${isSelected ? 'text-amber-100' : stockCount <= 3 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                              Stok: {matchingItem ? `${stockCount} pcs` : 'Tersedia'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size and Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-200/60">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">Pilih Ukuran (Size):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['S', 'M', 'L', 'XL', 'XXL', 'All Size'].map(sz => {
                          const isSzSelected = selectedUniformSize === sz;
                          return (
                            <button
                              type="button"
                              key={sz}
                              onClick={() => {
                                setSelectedUniformSize(sz as ItemSize);
                                const match = inventory.find(
                                  i => i.category === 'SERAGAM' && i.variantType === selectedUniformType && i.size === sz
                                );
                                if (match) {
                                  setSelectedStockItemId(match.id);
                                  if (match.unitPrice) {
                                    setPaymentAmount(match.unitPrice * stockItemQuantity);
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                                isSzSelected
                                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-amber-400'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">Jumlah (Qty Pcs):</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={stockItemQuantity}
                          onChange={e => {
                            const q = Math.max(1, Number(e.target.value) || 1);
                            setStockItemQuantity(q);
                            const match = inventory.find(i => i.id === selectedStockItemId) || inventory.find(
                              i => i.category === 'SERAGAM' && i.variantType === selectedUniformType
                            );
                            if (match?.unitPrice) {
                              setPaymentAmount(match.unitPrice * q);
                            }
                          }}
                          className="w-24 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <span className="text-xs text-slate-600 font-bold">Pcs</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If BUKU / LKS is selected, show available books & modules from stock */}
              {(paymentCategory === 'BUKU' || selectedBillingItemId === 'buku') && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-blue-950 flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>Pilih Paket LKS / Buku Pelajaran dari Stok</span>
                    </label>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                      Otomatis Kurangi Stok
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {inventory
                      .filter(i => i.category === 'LKS' || (i.category as any) === 'BUKU')
                      .map(item => {
                        const isSelected = selectedStockItemId === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              setSelectedStockItemId(item.id);
                              if (item.unitPrice) {
                                setPaymentAmount(item.unitPrice * stockItemQuantity);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-xs ring-2 ring-blue-400/40'
                                : 'bg-white text-slate-700 hover:bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-extrabold leading-tight">{item.name}</p>
                              <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                {item.gradeLevel ? `Kelas ${item.gradeLevel}` : 'Semua Kelas'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`text-[11px] font-black block ${isSelected ? 'text-white' : 'text-blue-700'}`}>
                                Rp {item.unitPrice.toLocaleString('id-ID')}
                              </span>
                              <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-200' : item.currentStock <= 5 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                Stok: {item.currentStock} pcs
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* If Custom Category Label */}
              {(paymentCategory === 'KEGIATAN' || paymentCategory === 'LAINNYA' || !['SPP', 'GEDUNG', 'SERAGAM', 'BUKU', 'PTS', 'SAS', 'DAT'].includes(paymentCategory)) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama / Keterangan Pos Pembayaran
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Iuran Pramuka & Kemah Bakti 2026..."
                    value={customCategoryLabel}
                    onChange={e => setCustomCategoryLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Step 3: Amount & Quick Amount Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    4. Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
                  </label>
                  {paymentCategory === 'SPP' && (
                    <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Tarif Tingkat {studentGradeLevel}: Rp {currentSppTariff.toLocaleString('id-ID')}/bln</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-black text-slate-400 text-sm pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Terbilang Preview */}
                <p className="text-[11px] text-slate-500 font-medium italic">
                  Terbilang: <strong>{numberToWords(paymentAmount)}</strong>
                </p>

                {/* Quick Buttons */}
                {paymentCategory === 'SPP' ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-500 mr-0.5">Kelipatan Bulan:</span>
                      {[1, 2, 3, 6, 12].map(months => (
                        <button
                          type="button"
                          key={months}
                          onClick={() => handleSelectMonthCount(months)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            selectedMonths.length === months
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60'
                          }`}
                        >
                          {months} Bln (Rp {(currentSppTariff * months).toLocaleString('id-ID')})
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleSelectMonthCount(1)}
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Reset 1 Bulan (Tingkat {studentGradeLevel})
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[50000, 100000, 150000, 200000, 500000, 1000000].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setPaymentAmount(val)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        + Rp {val.toLocaleString('id-ID')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(paymentCategory)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold transition cursor-pointer"
                    >
                      Reset Tarif Standar
                    </button>
                  </div>
                )}
              </div>

              {/* Step 4: Payment Method & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5. Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Tunai', 'Transfer Bank', 'QRIS'].map(m => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m as any)}
                        className={`py-2 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    6. Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 5: Notes & Receiver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lunas, diserahkan langsung oleh wali murid..."
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Petugas Kasir (Terkunci Sesi)
                  </label>
                  <div className="w-full px-3 py-2 bg-emerald-50/80 border border-emerald-300/80 rounded-xl text-xs font-bold text-emerald-950 flex items-center justify-between">
                    <span className="truncate">{activeTreasurer.name} ({activeTreasurer.roleTitle || 'Bendahara'})</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-1.5" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold rounded-xl shadow-md transition flex items-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Terbitkan Kwitansi'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* Side Info: Student Summary & Recent Payments */}
          <div className="space-y-4">
            
            {/* Active Student Info Card */}
            {currentStudent ? (
              <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {currentStudent.rollNo}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      Kelas {currentStudent.className}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {currentStudent.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      NISN: {currentStudent.nisn || '-'} • Kode: {currentStudent.kodeUnik || '-'}
                    </p>
                  </div>
                </div>

                {currentStudent.parentPhone && (
                  <div className="text-[11px] bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-800 flex items-center justify-between">
                    <span>No. WA Ortu: <strong>{currentStudent.parentPhone}</strong></span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                      Siap Kirim WA
                    </span>
                  </div>
                )}

                {/* Student's Payment History Overview */}
                <div className="pt-2 border-t border-indigo-100">
                  <h5 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Riwayat Pembayaran Siswa Ini:
                  </h5>
                  {filterPaymentsForStudent(payments, currentStudent).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada riwayat transaksi pembayaran.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {filterPaymentsForStudent(payments, currentStudent)
                        .slice(0, 5)
                        .map(p => (
                          <div
                            key={p.id}
                            className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                          >
                            <div>
                              <p className="font-bold text-slate-800 text-[11px]">{p.categoryLabel}</p>
                              <p className="text-[10px] text-slate-400">{p.paymentDate} • {p.invoiceNumber}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-emerald-700 text-xs">
                                Rp {p.amount.toLocaleString('id-ID')}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(p)}
                                className="block text-[10px] text-indigo-600 hover:underline font-bold"
                              >
                                Kwitansi
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                Pilih siswa untuk melihat rincian informasi dan riwayat.
              </div>
            )}

            {/* Quick Tariff Info Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Daftar Tarif Standar Madrasah</span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('pengaturan')}
                  className="text-[11px] text-indigo-600 hover:underline font-bold"
                >
                  Ubah
                </button>
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="py-1 border-b border-slate-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">SPP Bulanan</span>
                    <strong className="text-slate-900">
                      Tingkat {studentGradeLevel}: Rp {currentSppTariff.toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {availableSchoolGrades.map(g => (
                      <span
                        key={g}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                          g === studentGradeLevel
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}
                      >
                        Tk {g}: Rp {getSppTariffForGrade(tariffs, g).toLocaleString('id-ID')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Infaq Pembangunan (Gedung)</span>
                  <strong className="text-slate-900">Rp {tariffs.uangGedung.toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Seragam & Atribut Lengkap</span>
                  <strong className="text-slate-900">Rp {tariffs.uangSeragam.toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Buku Paket & Modul LKS</span>
                  <strong className="text-slate-900">Rp {tariffs.uangBuku.toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Ujian PTS (Tengah Semester)</span>
                  <strong className="text-slate-900">Rp {(tariffs.biayaPTS || 150000).toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Ujian SAS (Akhir Semester)</span>
                  <strong className="text-slate-900">Rp {(tariffs.biayaSAS || 200000).toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Dana Akhir Tahun (DAT)</span>
                  <strong className="text-slate-900">Rp {(tariffs.biayaDAT || 250000).toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB: KASIR PENJUALAN POS (DOMAIN PENJUALAN) */}
      {/* ========================================================= */}
      {activeSubTab === 'pos_penjualan' && (
        <KasirPenjualanPOS
          students={students}
          classList={classList}
          inventory={inventory}
          activeTreasurer={activeTreasurer}
          academicYear={academicYear}
          schoolOfficials={schoolOfficials}
          onSavePayment={onSavePayment}
          onDeductStock={onDeductStock || ((itemId, qty, metadata) => deductInventoryStock(itemId, qty, metadata))}
          onRestockItem={onRestockItem || ((itemId, qty, metadata) => restockInventoryItem(itemId, qty, metadata))}
          onNavigateToStock={() => setActiveSubTab('stok_barang')}
        />
      )}

      {/* ========================================================= */}
      {/* SUBTAB: RIWAYAT PENJUALAN & NOTA (DOMAIN PENJUALAN) */}
      {/* ========================================================= */}
      {activeSubTab === 'riwayat_penjualan' && (
        <RiwayatPenjualan
          payments={payments}
          inventory={inventory}
          classList={classList}
          activeTreasurer={activeTreasurer}
          schoolOfficials={schoolOfficials}
          academicYear={academicYear}
          onDeleteTransaction={onDeletePayment}
          onRestockItem={onRestockItem || ((itemId, qty, metadata) => restockInventoryItem(itemId, qty, metadata))}
        />
      )}

      {/* ========================================================= */}
      {/* SUBTAB: BUKU KAS & BELANJA MODAL PENJUALAN (DOMAIN PENJUALAN) */}
      {/* ========================================================= */}
      {activeSubTab === 'kas_penjualan' && (
        <KasPenjualan
          payments={payments}
          expenses={expenses}
          cashDeposits={cashDeposits}
          activeTreasurer={activeTreasurer}
          schoolOfficials={schoolOfficials}
          academicYear={academicYear}
          onSaveExpense={onSaveExpense}
          onSaveDeposit={onSaveCashDeposit}
        />
      )}

      {/* ========================================================= */}
      {/* SUBTAB: LAPORAN & ANALISIS PENJUALAN (DOMAIN PENJUALAN) */}
      {/* ========================================================= */}
      {activeSubTab === 'laporan_penjualan' && (
        <LaporanPenjualan
          payments={payments}
          inventory={inventory}
          expenses={expenses}
          activeTreasurer={activeTreasurer}
          schoolOfficials={schoolOfficials}
          academicYear={academicYear}
        />
      )}

      {/* ========================================================= */}
      {/* SUBTAB: ATUR TAGIHAN & TUNGGAKAN SISWA */}
      {/* ========================================================= */}
      {activeSubTab === 'tagihan_tunggakan' && (
        <AturTagihanTunggakan
          students={students}
          classList={classList}
          payments={payments}
          tariffs={tariffs}
          billSettings={billSettings || DEFAULT_STUDENT_BILL_SETTINGS}
          schoolOfficials={schoolOfficials}
          academicYear={academicYear}
          semester={semester}
          onSaveBillSettings={onSaveBillSettings || (() => {})}
          onSaveTariffs={onSaveTariffs}
          onSyncPayments={onSyncPayments}
        />
      )}

      {/* ========================================================= */}
      {/* SUBTAB: MANAJEMEN STOK LKS, ATRIBUT & SERAGAM */}
      {/* ========================================================= */}
      {activeSubTab === 'stok_barang' && (
        <ManajemenStokBarang
          inventory={inventory}
          inventoryLogs={inventoryLogs}
          students={students}
          classList={classList}
          activeTreasurerName={activeTreasurer.name}
          onSaveItem={onSaveInventoryItem || (() => {})}
          onDeleteItem={onDeleteInventoryItem || (() => {})}
          onSaveLog={onSaveInventoryLog || (() => {})}
          onDeductStock={onDeductStock || ((itemId, qty, metadata) => deductInventoryStock(itemId, qty, metadata))}
          onRestockItem={onRestockItem || ((itemId, qty, metadata) => restockInventoryItem(itemId, qty, metadata))}
          onRecordQuickSalePayment={onSavePayment}
        />
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: RIWAYAT TRANSAKSI & KWITANSI */}
      {/* ========================================================= */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Riwayat Pembayaran & Kwitansi</h2>
              <p className="text-xs text-slate-500">Daftar seluruh transaksi kas masuk yang telah dicatat di madrasah</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPrintReportModal(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Cetak Laporan Riwayat Transaksi (Print / Simpan PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-300" />
                <span>Cetak Laporan / PDF</span>
              </button>
              <button
                onClick={handleExportHistoryCSV}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel / CSV</span>
              </button>
              <button
                onClick={() => setActiveSubTab('input')}
                className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Transaksi</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari siswa / no. kwitansi..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <select
                value={historyClassFilter}
                onChange={e => setHistoryClassFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Kelas</option>
                {classList.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={historyCategoryFilter}
                onChange={e => setHistoryCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="SPP">SPP Bulanan</option>
                <option value="GEDUNG">Infaq Gedung</option>
                <option value="SERAGAM">Uang Seragam</option>
                <option value="BUKU">Buku & LKS</option>
                <option value="PTS">Ujian PTS</option>
                <option value="SAS">Ujian SAS</option>
                <option value="DAT">Dana Akhir Tahun (DAT)</option>
                <option value="KEGIATAN">Ekstrakulikuler</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div>
              <select
                value={historyMonthFilter}
                onChange={e => setHistoryMonthFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Periode</option>
                {MONTHS_LIST.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={historyTreasurerFilter}
                onChange={e => setHistoryTreasurerFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none"
              >
                <option value="ALL">Semua Petugas / Kasir</option>
                {allTreasurers.map((t, idx) => (
                  <option key={t.id} value={t.id}>
                    {cleanTreasurerRole(t.roleTitle, idx + 1)}: {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3">No. Kwitansi</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Nama Siswa & Kelas</th>
                  <th className="py-3 px-3">Jenis Pembayaran</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                  <th className="py-3 px-3 text-center">Metode</th>
                  <th className="py-3 px-3 text-center">Penerima</th>
                  <th className="py-3 px-3 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-900 text-[11px]">
                        {p.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {p.paymentDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900">{p.studentName}</div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                          Kelas {p.className}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 block">{p.categoryLabel}</span>
                        {p.notes && <span className="text-[10px] text-slate-400 italic">{p.notes}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                        Rp {p.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[11px] text-slate-600 whitespace-nowrap">
                        {p.receivedBy}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedInvoice(p)}
                            title="Cetak Kwitansi"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendWA(p)}
                            title="Kirim Bukti WA ke Orang Tua"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {isBendaharaUtama && (
                            <button
                              onClick={() => setDeleteTarget(p)}
                              title="Batalkan / Hapus Transaksi (Khusus Bendahara Utama)"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ========================================================= */}
      {/* SUBTAB 3: MATRIX SPP KELAS (12 BULAN) */}
      {/* ========================================================= */}
      {activeSubTab === 'matrix_spp' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Matrix Pembayaran SPP (12 Bulan)</h2>
              <p className="text-xs text-slate-500">Monitoring status lunas SPP per siswa dalam satu tahun pelajaran</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-slate-700">Pilih Kelas:</label>
                <select
                  value={matrixClass}
                  onChange={e => setMatrixClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {classList.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExportMatrixCSV}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Matrix Excel</span>
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Keterangan:</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>
                Lunas (Tarif Tingkat {getGradeFromClassName(matrixClass)}: Rp {getSppTariffForGrade(tariffs, matrixClass).toLocaleString('id-ID')}/bln)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
              <span>Belum Bayar</span>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 min-w-44">Nama Siswa</th>
                  {MONTHS_LIST.map(m => (
                    <th key={m} className="py-2.5 px-2 text-center w-16">
                      {m.substring(0, 3)}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">Total Bayar</th>
                  <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {matrixStudents.map((st) => {
                  const studentSppTxs = filterPaymentsForStudent(payments, st).filter(
                    p => p.category === 'SPP'
                  );
                  const totalPaid = studentSppTxs.reduce((sum, curr) => sum + curr.amount, 0);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2 px-2 text-center font-mono text-slate-400 text-[11px]">
                        {st.rollNo}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {st.name}
                      </td>
                      {MONTHS_LIST.map(m => {
                        const paidTx = studentSppTxs.find(p =>
                          p.categoryLabel.toLowerCase().includes(m.toLowerCase()) ||
                          (p.month && p.month.toLowerCase().includes(m.toLowerCase()))
                        );
                        return (
                          <td key={m} className="py-2 px-1 text-center">
                            {paidTx ? (
                              <span
                                title={`Lunas: ${paidTx.invoiceNumber} (${paidTx.paymentDate})`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] shadow-2xs"
                              >
                                ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedClass(st.className);
                                  setSelectedStudentId(st.id);
                                  setPaymentCategory('SPP');
                                  setSelectedMonth(m);
                                  setPaymentAmount(getSppTariffForGrade(tariffs, st.className));
                                  setActiveSubTab('input');
                                }}
                                title={`Klik untuk bayar SPP ${m} (Rp ${getSppTariffForGrade(tariffs, st.className).toLocaleString('id-ID')})`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 font-extrabold text-[10px] transition cursor-pointer"
                              >
                                -
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                        Rp {totalPaid.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedClass(st.className);
                            setSelectedStudentId(st.id);
                            setPaymentCategory('SPP');
                            setPaymentAmount(getSppTariffForGrade(tariffs, st.className));
                            setActiveSubTab('input');
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          + Bayar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB: SETORAN KAS BENDAHARA 1-5 KE BENDAHARA UTAMA */}
      {/* ========================================================= */}
      {activeSubTab === 'setoran_kas' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Header Card & Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rekonsiliasi Kas Bertingkat</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    Tahun Pelajaran: {academicYear}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {isBendaharaUtama 
                    ? 'Monitoring & Rekapitulasi Setoran Kas Seluruh Bendahara' 
                    : `Setoran Kas Anda (${activeTreasurer.roleTitle}) ke Bendahara Utama`}
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  {isBendaharaUtama
                    ? 'Pusat pemantauan mutasi kas madrasah. Anda memiliki hak akses penuh untuk memantau sisa uang kas yang belum disetorkan di masing-masing Bendahara 1 s/d 5 serta memvalidasi setoran yang diterima.'
                    : 'Penyetoran dana tunai/kas yang Anda kumpulkan dari siswa kepada Bendahara Utama Madrasah. Setiap kali setoran dicatat, saldo kas di tangan Anda otomatis berkurang.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenDepositModal()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  <SendHorizonal className="w-4 h-4" />
                  <span>{isBendaharaUtama ? '+ Catat Setoran Kas Baru' : '+ Setor Kas Anda ke Bendahara Utama'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Notice Banner for Regular Treasurers */}
          {!isBendaharaUtama && (
            <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-xl text-xs text-indigo-900 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-indigo-950 block">Akses Terotentikasi Khusus {activeTreasurer.roleTitle} ({activeTreasurer.name})</strong>
                <p className="text-[11px] text-indigo-800/90 mt-0.5 leading-relaxed">
                  Sesuai kode akses unik Anda, Anda hanya berwenang menyetor kas dari akun Anda sendiri dan memantau posisi kas Anda. Saldo kas bendahara lain dirahasiakan dan hanya dapat dipantau oleh <strong>Bendahara Utama ({treasurerCashBalances.treasurerUtama.name})</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {depositSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{depositSuccessMsg}</span>
            </div>
          )}

          {/* Bendahara Utama View: Central Vault Spotlight & All Treasurers' Status */}
          {isBendaharaUtama ? (
            <>
              {/* Bendahara Utama Spotlight Card */}
              <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  
                  <div className="space-y-2 lg:col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 rounded-full text-[11px] font-black text-emerald-200">
                        Otoritas Kas Pusat Madrasah
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">Tujuan Rekapitulasi</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center font-black text-lg border border-white/20 shrink-0">
                        BU
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                          {treasurerCashBalances.treasurerUtama.name}
                        </h3>
                        <p className="text-xs text-emerald-300 font-bold">
                          {treasurerCashBalances.treasurerUtama.roleTitle || `Bendahara Utama ${schoolOfficials?.namaSekolah || 'Madrasah'}`}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-300 mt-1">
                          <span>NIP: {treasurerCashBalances.treasurerUtama.nip || '-'}</span>
                          <span>•</span>
                          <span>WA/Telp: {treasurerCashBalances.treasurerUtama.phone || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-right space-y-1">
                    <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                      Total Kas Diterima di Kas Pusat
                    </span>
                    <div className="text-2xl font-black text-white">
                      Rp {treasurerCashBalances.totalAllDepositedToUtama.toLocaleString('id-ID')}
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Dari total <strong>{validCashDeposits.length}</strong> transaksi setoran diverifikasi
                    </p>
                  </div>

                </div>
              </div>

              {/* Grid Status Kas Tiap Bendahara 1 s/d 5 - Full Monitoring for Bendahara Utama */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Status Kas & Sisa Kas Belum Disetor per Bendahara (1 s/d 5)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pantau pergerakan kas: Total Penerimaan Siswa, Total Disetor ke Kas Pusat, dan <strong>Sisa Kas Belum Disetor</strong> yang masih dipegang masing-masing bendahara.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {treasurerCashBalances.items.map(item => {
                    const isFullyDeposited = item.remainingCashOnHand === 0 && item.grossIncome > 0;
                    const hasPendingCash = item.remainingCashOnHand > 0;
                    const depositPercent = item.grossIncome > 0 
                      ? Math.min(100, Math.round((item.totalDeposited / item.grossIncome) * 100)) 
                      : 0;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                      >
                        <div>
                          {/* Treasurer Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">
                                B{item.index}
                              </span>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Bendahara {item.index}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                                  {item.name}
                                </h4>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isFullyDeposited
                                ? 'bg-emerald-100 text-emerald-800'
                                : hasPendingCash
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isFullyDeposited ? 'Kas Klir' : hasPendingCash ? 'Belum Disetor' : 'Nol'}
                            </span>
                          </div>

                          {/* Detail Metrics */}
                          <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Penerimaan Siswa:</span>
                              <strong className="font-extrabold text-slate-900">
                                Rp {item.grossIncome.toLocaleString('id-ID')}
                              </strong>
                              <span className="text-[10px] text-slate-400 block">({item.txCount} Transaksi)</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Sudah Disetor:</span>
                              <strong className="font-extrabold text-emerald-700">
                                Rp {item.totalDeposited.toLocaleString('id-ID')}
                              </strong>
                              <span className="text-[10px] text-emerald-600 block">({depositPercent}% disetor)</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span>Progress Penyetoran Kas</span>
                              <span>{depositPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${depositPercent}%` }}
                                className={`h-full transition-all ${
                                  depositPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                              ></div>
                            </div>
                          </div>

                          {/* Prominent Sisa Kas Belum Disetor Card */}
                          <div className={`mt-3.5 p-3 rounded-xl border flex items-center justify-between ${
                            hasPendingCash
                              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          }`}>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider block">
                                Sisa Belum Disetor (di Tangan):
                              </span>
                              <div className="text-base font-black">
                                Rp {item.remainingCashOnHand.toLocaleString('id-ID')}
                              </div>
                            </div>
                            {hasPendingCash && (
                              <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                                Perlu Disetor
                              </span>
                            )}
                          </div>

                          {/* Rincian per Pos Pemasukan (SPP, STS, SAS, dll) */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              Rincian Sisa Kas per Pos Pemasukan:
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {item.breakdownByPos.map(pos => {
                                if (pos.diterima === 0 && pos.disetor === 0 && pos.sisaDiTangan === 0) return null;
                                return (
                                  <div
                                    key={pos.key}
                                    className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50/50 border border-slate-100"
                                  >
                                    <div className="truncate mr-2">
                                      <strong className="text-slate-800">{pos.name}</strong>
                                      <div className="text-[9px] text-slate-400">
                                        Masuk: Rp {pos.diterima.toLocaleString('id-ID')} | Setor: Rp {pos.disetor.toLocaleString('id-ID')}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`font-black text-xs ${pos.sisaDiTangan > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        Rp {pos.sisaDiTangan.toLocaleString('id-ID')}
                                      </span>
                                      {pos.sisaDiTangan > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDepositModal(item.id, pos.key)}
                                          className="block ml-auto mt-0.5 text-[9px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.2 rounded cursor-pointer"
                                        >
                                          Setor Pos
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleOpenDepositModal(item.id)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                            hasPendingCash
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Catat Penerimaan Setoran</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Regular Treasurer View: ONLY Own Status Card & Central Vault Info */
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Central Vault Info (Destination) */}
                <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-teal-500/30 border border-teal-400/40 rounded-full text-[10px] font-black text-teal-200 uppercase tracking-wider">
                      Tujuan Penyetoran Kas
                    </span>
                    <div className="flex items-start space-x-3 mt-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center font-black text-lg border border-white/20 shrink-0">
                        BU
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-white">
                          {treasurerCashBalances.treasurerUtama.name}
                        </h3>
                        <p className="text-xs text-teal-300 font-bold">
                          {treasurerCashBalances.treasurerUtama.roleTitle || `Bendahara Utama ${schoolOfficials?.namaSekolah || 'Madrasah'}`}
                        </p>
                        <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                          <p>NIP: {treasurerCashBalances.treasurerUtama.nip || '-'}</p>
                          <p>Kontak: {treasurerCashBalances.treasurerUtama.phone || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 text-xs text-slate-200">
                    <p className="font-semibold leading-relaxed">
                      Setorkan kas yang telah Anda terima dari siswa kepada Bendahara Utama secara berkala untuk menjaga rekonsiliasi kas madrasah tetap akurat dan tertib.
                    </p>
                  </div>
                </div>

                {/* Personal Treasurer Cash Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-black text-sm flex items-center justify-center">
                          B{myCashBalance.index}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Akun Anda ({activeTreasurer.roleTitle})
                          </span>
                          <h3 className="text-base font-black text-slate-900">
                            {activeTreasurer.name}
                          </h3>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                        myCashBalance.remainingCashOnHand > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {myCashBalance.remainingCashOnHand > 0 ? 'Ada Kas Belum Disetor' : 'Kas Anda Klir (Nol)'}
                      </span>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Kas Diterima Anda:</span>
                        <strong className="text-sm font-black text-slate-900">
                          Rp {myCashBalance.grossIncome.toLocaleString('id-ID')}
                        </strong>
                        <span className="text-[10px] text-slate-400 block">({myCashBalance.txCount} Transaksi Siswa)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Sudah Anda Setor:</span>
                        <strong className="text-sm font-black text-emerald-700">
                          Rp {myCashBalance.totalDeposited.toLocaleString('id-ID')}
                        </strong>
                        <span className="text-[10px] text-emerald-600 block">ke Bendahara Utama</span>
                      </div>
                    </div>

                    {/* Sisa Kas di Tangan */}
                    <div className={`mt-3.5 p-4 rounded-xl border flex items-center justify-between ${
                      myCashBalance.remainingCashOnHand > 0
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-600">
                          Sisa Kas di Tangan Anda Saat Ini:
                        </span>
                        <div className="text-xl font-black">
                          Rp {myCashBalance.remainingCashOnHand.toLocaleString('id-ID')}
                        </div>
                      </div>
                      {myCashBalance.remainingCashOnHand > 0 && (
                        <span className="text-xs font-black bg-amber-200 text-amber-950 px-2.5 py-1 rounded-lg">
                          Wajib Disetor
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenDepositModal(activeTreasurerId)}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    <span>+ Setor Kas Anda ke Bendahara Utama</span>
                  </button>
                </div>
              </div>

              {/* Rincian Pos Pemasukan untuk Bendahara yang Sedang Login */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Rincian Pos Pemasukan Kas di Tangan Anda (SPP, STS, SAS, dll)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pantau pergerakan kas per pos. Jika kas suatu pos sudah disetorkan penuh ke Bendahara Utama, saldonya akan otomatis <strong>Nol</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myCashBalance.breakdownByPos.map(pos => {
                    const isZero = pos.sisaDiTangan === 0;
                    return (
                      <div
                        key={pos.key}
                        className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-2.5 ${
                          isZero
                            ? 'bg-slate-50/70 border-slate-200 opacity-90'
                            : 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-black text-xs text-slate-900">
                            {pos.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isZero ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {isZero ? 'Nol (Klir)' : 'Ada Sisa'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100">
                          <div>
                            <span className="block text-slate-400">Diterima:</span>
                            <strong className="text-slate-800 font-bold">
                              Rp {pos.diterima.toLocaleString('id-ID')}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-slate-400">Disetor:</span>
                            <strong className="text-emerald-700 font-bold">
                              Rp {pos.disetor.toLocaleString('id-ID')}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Sisa di Tangan:</span>
                            <strong className={`text-sm font-black ${isZero ? 'text-slate-600' : 'text-amber-800'}`}>
                              Rp {pos.sisaDiTangan.toLocaleString('id-ID')}
                            </strong>
                          </div>

                          {!isZero && (
                            <button
                              type="button"
                              onClick={() => handleOpenDepositModal(activeTreasurerId, pos.key)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer transition flex items-center space-x-1"
                            >
                              <span>Setor Pos Ini</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Table Riwayat Setoran Kas (Scoped to visibleCashDeposits) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isBendaharaUtama 
                    ? 'Buku Jurnal & Riwayat Seluruh Setoran Kas ke Bendahara Utama' 
                    : 'Buku Jurnal & Riwayat Setoran Kas Anda ke Bendahara Utama'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBendaharaUtama
                    ? 'Daftar seluruh mutasi setoran kas dari Bendahara 1 s/d 5 ke Bendahara Utama beserta bukti tanda terima.'
                    : 'Daftar transaksi setoran kas yang telah Anda lakukan ke Bendahara Utama beserta bukti tanda terima.'}
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                {visibleCashDeposits.length} Transaksi Tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">No. Setoran</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Pos Kas</th>
                    <th className="py-3 px-4">Penyetor (Dari)</th>
                    <th className="py-3 px-4">Penerima (Ke)</th>
                    <th className="py-3 px-3 text-right">Nominal (Rp)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Catatan / Keperluan</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {visibleCashDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400">
                        <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-bold text-sm text-slate-600">Belum Ada Setoran Kas Tercatat</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Klik tombol <strong>"+ Setor Kas ke Bendahara Utama"</strong> di atas untuk mencatat penyerahan dana.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    visibleCashDeposits.map((dep, idx) => (
                      <tr key={dep.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {dep.depositNumber}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                          {dep.depositDate}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {dep.posCategoryLabel || dep.posCategory || 'Semua Pos'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{dep.fromTreasurerName}</div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {dep.fromTreasurerRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{dep.toTreasurerName}</div>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            {dep.toTreasurerRole}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-emerald-800 text-xs whitespace-nowrap">
                          Rp {dep.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center space-x-1 w-fit mx-auto">
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            <span>{dep.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={dep.notes}>
                          {dep.notes || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setSelectedDepositReceipt(dep)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                              title="Lihat & Cetak Berita Acara / Tanda Terima"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            {isBendaharaUtama && onDeleteCashDeposit && (
                              <button
                                onClick={() => setDeleteDepositTarget(dep)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                                title="Batalkan / Hapus Setoran (Khusus Bendahara Utama)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {visibleCashDeposits.length > 0 && (
                  <tfoot>
                    <tr className="bg-emerald-50/80 border-t-2 border-emerald-200 font-black text-emerald-950 text-xs">
                      <td colSpan={6} className="py-3 px-4 text-right uppercase">
                        {isBendaharaUtama 
                          ? 'TOTAL DANA TELAH DISETOR KE BENDAHARA UTAMA:' 
                          : 'TOTAL DANA TELAH ANDA SETORKAN:'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-900 text-sm whitespace-nowrap">
                        Rp {visibleCashDeposits.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('id-ID')}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB: PENGELUARAN KAS (BUKU KAS KELUAR / BKK) */}
      {/* ========================================================= */}
      {activeSubTab === 'pengeluaran' && (
        <PengeluaranKas
          expenses={expenses}
          payments={payments}
          cashDeposits={validCashDeposits}
          schoolOfficials={schoolOfficials}
          tariffs={tariffs}
          academicYear={academicYear}
          semester={semester}
          activeTreasurerId={activeTreasurerId}
          activeTreasurer={activeTreasurer}
          isBendaharaUtama={isBendaharaUtama}
          allTreasurers={allTreasurers}
          onSaveExpense={onSaveExpense}
          onDeleteExpense={onDeleteExpense}
        />
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: LAPORAN KAS MASUK & IDENTIFIKASI BENDAHARA */}
      {/* ========================================================= */}
      {activeSubTab === 'laporan' && (
        <div className="space-y-6">
          
          {/* Header Card & Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Laporan Akuntabilitas Kas Masuk
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Tahun Pelajaran: {academicYear}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Laporan Kas Masuk & Identifikasi Bendahara Penerima
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Pantau penerimaan uang masuk madrasah secara transparan. Setiap transaksi teridentifikasi secara jelas berdasarkan petugas bendahara/kasir penerima, pos keuangan, dan metode pembayaran.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowPrintKasMasukModal(true)}
                  className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Buka Lembar Cetak / Simpan PDF Resmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF Resmi</span>
                </button>
                <button
                  onClick={handleExportKasMasukCSV}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Unduh Data Kas Masuk dalam Format Excel CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel (CSV)</span>
                </button>
                {(reportDateRange !== 'ALL' || reportTreasurerFilter !== 'ALL' || reportClassFilter !== 'ALL' || reportCategoryFilter !== 'ALL' || reportMethodFilter !== 'ALL' || reportSearch !== '') && (
                  <button
                    onClick={() => {
                      setReportDateRange('ALL');
                      setReportStartDate('');
                      setReportEndDate('');
                      setReportTreasurerFilter('ALL');
                      setReportClassFilter('ALL');
                      setReportCategoryFilter('ALL');
                      setReportMethodFilter('ALL');
                      setReportSearch('');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    title="Kembalikan semua filter ke awal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Section Selector */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto pb-1">
              <button
                onClick={() => setReportActiveSection('semua')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                  reportActiveSection === 'semua'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Tinjauan (Lengkap)
              </button>
              <button
                onClick={() => setReportActiveSection('per_bendahara')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  reportActiveSection === 'per_bendahara'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Kas Masuk per Bendahara</span>
              </button>
              <button
                onClick={() => setReportActiveSection('per_pos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  reportActiveSection === 'per_pos'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Rekap per Pos Pendapatan</span>
              </button>
              <button
                onClick={() => setReportActiveSection('jurnal_mutasi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  reportActiveSection === 'jurnal_mutasi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buku Jurnal / Mutasi Kas Detail ({reportFilteredPayments.length})</span>
              </button>
            </div>
          </div>

          {/* Interactive Filter Control Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            
            {/* Periode Preset Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-800 flex items-center space-x-1.5 uppercase tracking-wide">
                  <CalendarRange className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Periode Waktu Kas Masuk:</span>
                </label>
                {reportDateRange === 'CUSTOM' && (
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Rentang: {reportStartDate || 'Awal'} s.d {reportEndDate || 'Sekarang'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'ALL', label: 'Semua Waktu' },
                  { key: 'TODAY', label: 'Hari Ini' },
                  { key: '7DAYS', label: '7 Hari Terakhir' },
                  { key: 'THIS_MONTH', label: 'Bulan Ini' },
                  { key: 'THIS_SEMESTER', label: `${semester}` },
                  { key: 'CUSTOM', label: 'Kustom Tanggal...' }
                ].map(preset => (
                  <button
                    key={preset.key}
                    onClick={() => setReportDateRange(preset.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      reportDateRange === preset.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs if CUSTOM is chosen */}
              {reportDateRange === 'CUSTOM' && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-200 flex flex-wrap items-center gap-3 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 font-bold">Dari Tanggal:</span>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={e => setReportStartDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 font-bold">Sampai:</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={e => setReportEndDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Filter by Treasurer (Identifikasi Bendahara) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-800 flex items-center space-x-1.5 uppercase tracking-wide">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Filter Bendahara / Petugas Penerima:</span>
                </label>
                {reportTreasurerFilter !== 'ALL' && (
                  <button
                    onClick={() => setReportTreasurerFilter('ALL')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Tampilkan Semua Bendahara
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setReportTreasurerFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                    reportTreasurerFilter === 'ALL'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>Semua Bendahara</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${reportTreasurerFilter === 'ALL' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {payments.length}
                  </span>
                </button>

                {allTreasurers.map((t, idx) => {
                  const num = idx + 1;
                  const tTxs = payments.filter(p => {
                    const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
                    return tInfo.id === t.id;
                  });
                  const isSelected = reportTreasurerFilter === t.id;

                  const colorDot = [
                    'bg-emerald-500',
                    'bg-amber-500',
                    'bg-indigo-500',
                    'bg-purple-500',
                    'bg-teal-500'
                  ][idx % 5];

                  return (
                    <button
                      key={t.id}
                      onClick={() => setReportTreasurerFilter(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs ring-2 ring-indigo-500'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${colorDot}`}></span>
                      <span>Bendahara {num}: <strong>{t.name}</strong></span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                        {tTxs.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropdown Filters: Kelas, Pos/Kategori, Metode, & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Kelas:</label>
                <select
                  value={reportClassFilter}
                  onChange={e => setReportClassFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pos Kas / Kategori:</label>
                <select
                  value={reportCategoryFilter}
                  onChange={e => setReportCategoryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Semua Pos Kas</option>
                  <option value="SPP">SPP Bulanan</option>
                  <option value="GEDUNG">Infaq Gedung / Pembangunan</option>
                  <option value="SERAGAM">Uang Seragam</option>
                  <option value="BUKU">Buku Paket / LKS</option>
                  <option value="PTS">Biaya Ujian PTS</option>
                  <option value="SAS">Biaya Ujian SAS</option>
                  <option value="DAT">Dana Akhir Tahun (DAT)</option>
                  <option value="KEGIATAN">Kegiatan & Ekstrakulikuler</option>
                  <option value="LAINNYA">Administrasi Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Metode Pembayaran:</label>
                <select
                  value={reportMethodFilter}
                  onChange={e => setReportMethodFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Semua Metode</option>
                  <option value="Tunai">Kas Tunai</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="QRIS">QRIS / Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Transaksi / Siswa:</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={e => setReportSearch(e.target.value)}
                    placeholder="Nama siswa, kwitansi, penerima..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {reportSearch && (
                    <button
                      onClick={() => setReportSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between opacity-90 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Kas Masuk</span>
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight">
                  Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-500/50 text-[11px] opacity-90 flex items-center justify-between">
                <span>{reportKPIs.count} Transaksi</span>
                <span>Rata-rata: Rp {reportKPIs.avgAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Penerimaan Kas Tunai</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  Rp {reportKPIs.tunaiTotal.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Pembayaran Langsung di Loket</span>
                <span className="font-bold text-slate-800">
                  {reportKPIs.totalAmount > 0 ? ((reportKPIs.tunaiTotal / reportKPIs.totalAmount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Penerimaan Non-Tunai</span>
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  Rp {reportKPIs.digitalTotal.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Transfer & QRIS</span>
                <span className="font-bold text-slate-800">
                  {reportKPIs.totalAmount > 0 ? ((reportKPIs.digitalTotal / reportKPIs.totalAmount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Petugas Bendahara</span>
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  {allTreasurers.length} Petugas Kasir
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Status Bendahara 1 s.d 5</span>
                <span className="font-bold text-emerald-600">Terdaftar Aktif</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: REKAPITULASI KAS MASUK PER BENDAHARA (IDENTIFIKASI PENERIMAAN) */}
          {(reportActiveSection === 'semua' || reportActiveSection === 'per_bendahara') && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Identifikasi Kas Masuk per Petugas Bendahara</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Akumulasi penerimaan dana yang diproses oleh masing-masing bendahara secara akuntabel
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {treasurerStats.length} Petugas Terdaftar
                </span>
              </div>

              {/* Grid Cards per Treasurer */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treasurerStats.map((ts, idx) => {
                  const isFiltered = reportTreasurerFilter === ts.id;
                  
                  const bgHeaderClasses = [
                    'from-emerald-700 to-teal-800',
                    'from-amber-700 to-yellow-800',
                    'from-indigo-700 to-blue-800',
                    'from-purple-700 to-violet-800',
                    'from-teal-700 to-cyan-800'
                  ][idx % 5];

                  return (
                    <div
                      key={ts.id}
                      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs flex flex-col justify-between ${
                        isFiltered
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header */}
                      <div className={`p-4 bg-gradient-to-r ${bgHeaderClasses} text-white flex items-center justify-between`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-sm border border-white/30">
                            B{ts.index}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                              Bendahara {ts.index}
                            </span>
                            <h4 className="font-extrabold text-sm tracking-tight leading-tight">
                              {ts.name}
                            </h4>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 border border-white/30">
                          {ts.percentage}% Kas
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] text-slate-500 font-semibold mb-0.5">
                            {ts.roleTitle}
                          </div>
                          <div className="text-xl font-black text-slate-900">
                            Rp {ts.totalAmount.toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Transaksi</span>
                            <strong className="text-xs font-black text-slate-800">{ts.count}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Kas Tunai</span>
                            <strong className="text-xs font-black text-emerald-700">Rp {(ts.tunai / 1000).toLocaleString('id-ID')}k</strong>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Transfer/QRIS</span>
                            <strong className="text-xs font-black text-indigo-700">Rp {((ts.transfer + ts.qris) / 1000).toLocaleString('id-ID')}k</strong>
                          </div>
                        </div>

                        {/* Progress Bar & Details */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between text-slate-600 font-bold">
                            <span>SPP vs Pos Non-SPP</span>
                            <span>{ts.totalAmount > 0 ? ((ts.sppAmount / ts.totalAmount) * 100).toFixed(0) : 0}% SPP</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${ts.totalAmount > 0 ? (ts.sppAmount / ts.totalAmount) * 100 : 0}%` }}
                              className="bg-indigo-600 h-full"
                              title="SPP"
                            ></div>
                            <div
                              style={{ width: `${ts.totalAmount > 0 ? (ts.nonSppAmount / ts.totalAmount) * 100 : 0}%` }}
                              className="bg-amber-500 h-full"
                              title="Pos Lainnya"
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>SPP: Rp {ts.sppAmount.toLocaleString('id-ID')}</span>
                            <span>Lainnya: Rp {ts.nonSppAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Button Filter */}
                        <button
                          onClick={() => {
                            setReportTreasurerFilter(ts.id);
                            setReportActiveSection('jurnal_mutasi');
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                            isFiltered
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lihat {ts.count} Mutasi Kas Masuk</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table Akumulasi Kas per Bendahara */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                    Tabel Akumulasi Pertanggungjawaban per Bendahara
                  </h4>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Total Kas Masuk Terverifikasi: <strong>Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3 text-center w-10">No</th>
                        <th className="py-3 px-4">Nama Petugas Bendahara</th>
                        <th className="py-3 px-3">Jabatan / NIP</th>
                        <th className="py-3 px-3 text-center">Transaksi</th>
                        <th className="py-3 px-3 text-right">Kas Tunai (Rp)</th>
                        <th className="py-3 px-3 text-right">Transfer Bank (Rp)</th>
                        <th className="py-3 px-3 text-right">QRIS (Rp)</th>
                        <th className="py-3 px-4 text-right">Total Masuk (Rp)</th>
                        <th className="py-3 px-3 text-center">Kontribusi</th>
                        <th className="py-3 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {treasurerStats.map((ts, idx) => (
                        <tr key={ts.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px] flex items-center justify-center">
                                B{ts.index}
                              </span>
                              <span>{ts.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            <span className="block font-semibold">{ts.roleTitle}</span>
                            <span className="text-[10px] text-slate-400">NIP: {ts.nip || '-'}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700">
                            {ts.count} Tx
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-700">
                            Rp {ts.tunai.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-indigo-700">
                            Rp {ts.transfer.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-purple-700">
                            Rp {ts.qris.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 text-xs whitespace-nowrap">
                            Rp {ts.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                              {ts.percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setReportTreasurerFilter(ts.id);
                                setReportActiveSection('jurnal_mutasi');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              Tinjau
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50/80 border-t-2 border-indigo-200 font-black text-indigo-950 text-xs">
                        <td colSpan={3} className="py-3 px-4 uppercase">
                          TOTAL KAS MASUK KESELURUHAN
                        </td>
                        <td className="py-3 px-3 text-center">
                          {reportKPIs.count} Transaksi
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-900">
                          Rp {reportKPIs.tunaiTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right text-indigo-900">
                          Rp {reportKPIs.transferTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right text-purple-900">
                          Rp {reportKPIs.qrisTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-950 font-black text-sm whitespace-nowrap">
                          Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center">100%</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 2: REKAPITULASI KAS PER POS PENDAPATAN */}
          {(reportActiveSection === 'semua' || reportActiveSection === 'per_pos') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Rekapitulasi Penerimaan Kas per Pos Pendapatan</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rincian perolehan dana per pos keuangan madrasah beserta distribusi penerimaan masing-masing bendahara
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Pos Pendapatan / Kategori</th>
                        <th className="py-3 px-3 text-center">Transaksi</th>
                        <th className="py-3 px-4 text-right">Total Penerimaan (Rp)</th>
                        <th className="py-3 px-3 text-center">Porsi (%)</th>
                        <th className="py-3 px-4">Distribusi Penerimaan per Bendahara</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {categoryStats.map(cat => {
                        const Icon = cat.icon;
                        return (
                          <tr key={cat.key} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center space-x-2.5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${cat.color}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span>{cat.label}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-600">
                              {cat.count} Transaksi
                            </td>
                            <td className="py-3 px-4 text-right font-black text-emerald-700 whitespace-nowrap">
                              Rp {cat.totalAmount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                                {cat.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {cat.byTreasurer.filter(t => t.amount > 0).length === 0 ? (
                                  <span className="text-[11px] text-slate-400 italic">Belum ada transaksi</span>
                                ) : (
                                  cat.byTreasurer.filter(t => t.amount > 0).map((t, idx) => (
                                    <span
                                      key={t.treasurerId}
                                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                                      title={`${t.name}: Rp ${t.amount.toLocaleString('id-ID')} (${t.count} tx)`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                      <span>{t.name.split(' ')[0]}:</span>
                                      <strong className="text-slate-900 font-mono">Rp {(t.amount / 1000).toLocaleString('id-ID')}k</strong>
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-teal-50/80 border-t-2 border-teal-200 font-black text-teal-950 text-xs">
                        <td className="py-3 px-4 uppercase">TOTAL PENERIMAAN KAS MASUK</td>
                        <td className="py-3 px-3 text-center">{reportKPIs.count} Transaksi</td>
                        <td className="py-3 px-4 text-right text-emerald-950 font-black text-sm whitespace-nowrap">
                          Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center">100%</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold text-[11px]">
                          Terbagi di {allTreasurers.length} petugas bendahara penerima
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: BUKU JURNAL / MUTASI KAS MASUK TERIDENTIFIKASI (TABEL DETAIL) */}
          {(reportActiveSection === 'semua' || reportActiveSection === 'jurnal_mutasi') && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Buku Jurnal Mutasi Kas Masuk Terverifikasi</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menampilkan seluruh riwayat transaksi kas masuk dengan identifikasi identitas bendahara penerima secara eksplisit
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">
                    {reportFilteredPayments.length} Pembayaran Ditemukan
                  </span>
                  <button
                    onClick={handleExportKasMasukCSV}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3 text-center w-10">No</th>
                        <th className="py-3 px-3">Tgl & Kwitansi</th>
                        <th className="py-3 px-4">Nama Siswa & Kelas</th>
                        <th className="py-3 px-3">Pos Pembayaran</th>
                        <th className="py-3 px-3 text-center">Metode</th>
                        <th className="py-3 px-4">Bendahara Penerima</th>
                        <th className="py-3 px-4 text-right">Nominal Masuk (Rp)</th>
                        <th className="py-3 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {reportFilteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                            Tidak ada transaksi kas masuk yang sesuai dengan kriteria filter yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        reportFilteredPayments.map((p, idx) => {
                          const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
                          
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3">
                                <span className="block font-bold text-slate-800">{p.paymentDate}</span>
                                <span className="font-mono text-[10px] text-indigo-600 block">{p.invoiceNumber}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{p.studentName}</div>
                                <div className="text-[10px] text-slate-500">
                                  Kelas {p.className} • NISN: {p.nisn || '-'}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-800 block">{p.categoryLabel}</span>
                                {p.notes && <span className="text-[10px] text-slate-400 block italic">{p.notes}</span>}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  p.paymentMethod === 'Tunai'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : p.paymentMethod === 'QRIS'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {p.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border ${tInfo.badgeBg} ${tInfo.badgeBorder}`}>
                                  <span className={`w-2 h-2 rounded-full ${tInfo.dotColor}`}></span>
                                  <div>
                                    <div className={`font-black text-[11px] ${tInfo.badgeText} leading-tight`}>
                                      {tInfo.name}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-semibold leading-tight">
                                      {tInfo.roleTitle}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-slate-900 text-xs whitespace-nowrap">
                                Rp {p.amount.toLocaleString('id-ID')}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => setSelectedInvoice(p)}
                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                  title="Lihat & Cetak Kwitansi"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-950 text-xs">
                        <td colSpan={6} className="py-3 px-4 text-right uppercase">
                          TOTAL KAS MASUK TERVERIFIKASI:
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm whitespace-nowrap">
                          Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 4: LEMBAR TANDA TANGAN PENGESAHAN LAPORAN KAS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center text-xs text-slate-800 font-medium">
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                <p className="text-slate-500 font-bold">Mengetahui & Menyetujui,</p>
                <p className="font-black text-slate-900 text-sm">Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan & Stempel Resmi ]</span>
                </div>
                <p className="font-extrabold text-slate-900 text-sm underline">
                  {schoolOfficials?.kepalaSekolah?.name || 'H. Ahmad Syahid, M.Pd.I'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  NIP. {schoolOfficials?.kepalaSekolah?.nip || '197508122000031002'}
                </p>
              </div>

              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                <p className="text-slate-500">
                  Kuningan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-black text-slate-900 text-sm">
                  Bendahara Penerima / Petugas Kasir
                </p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan ]</span>
                </div>
                <p className="font-extrabold text-slate-900 text-sm underline">
                  {reportTreasurerFilter !== 'ALL' && allTreasurers.find(t => t.id === reportTreasurerFilter)
                    ? allTreasurers.find(t => t.id === reportTreasurerFilter)?.name
                    : activeTreasurer.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  NIP. {reportTreasurerFilter !== 'ALL' && allTreasurers.find(t => t.id === reportTreasurerFilter)
                    ? (allTreasurers.find(t => t.id === reportTreasurerFilter)?.nip || '-')
                    : (activeTreasurer.nip || '-')}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 5: PENGATURAN TARIF & KEAMANAN BENDAHARA */}
      {/* ========================================================= */}
      {activeSubTab === 'pengaturan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tariff Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Pengaturan Tarif Standar Pembayaran</h2>
              <p className="text-xs text-slate-500">Nilai standar yang akan otomatis terisi pada formulir penerimaan</p>
            </div>

            {settingsSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-emerald-900 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* SPP Bulanan dengan Pembedaan Tarif Antar Tingkat */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-indigo-950">
                      1. Tarif SPP Bulanan per Tingkat Kelas (Rp)
                    </label>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      Atur nominal SPP berbeda untuk masing-masing tingkat kelas
                    </p>
                  </div>
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 font-extrabold px-2 py-0.5 rounded-md">
                    Tarif Bertingkat
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {availableSchoolGrades.map(grade => {
                    const gradeTariff = tempTariffs.sppMonthlyByGrade?.[grade] ?? tempTariffs.sppMonthly ?? 150000;
                    return (
                      <div key={grade} className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Tingkat {grade}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {grade === 'VII' || grade === '7' ? 'Kelas 7' : grade === 'VIII' || grade === '8' ? 'Kelas 8' : grade === 'IX' || grade === '9' ? 'Kelas 9' : grade === 'X' || grade === '10' ? 'Kelas 10' : grade === 'XI' || grade === '11' ? 'Kelas 11' : grade === 'XII' || grade === '12' ? 'Kelas 12' : `Kelas ${grade}`}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center font-bold text-slate-400 text-[11px] pointer-events-none">
                            Rp
                          </span>
                          <input
                            type="number"
                            required
                            min={0}
                            step={5000}
                            value={gradeTariff}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const updated = {
                                ...(tempTariffs.sppMonthlyByGrade || {}),
                                [grade]: val
                              };
                              setTempTariffs({
                                ...tempTariffs,
                                sppMonthlyByGrade: updated
                              });
                            }}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 border-t border-indigo-100/80">
                  <span>Tarif Default Umum:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={tempTariffs.sppMonthly}
                      onChange={e => setTempTariffs({ ...tempTariffs, sppMonthly: Number(e.target.value) })}
                      className="w-28 px-2 py-0.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Infaq Pembangunan / Uang Gedung (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={10000}
                  value={tempTariffs.uangGedung}
                  onChange={e => setTempTariffs({ ...tempTariffs, uangGedung: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Uang Seragam & Atribut Lengkap (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={tempTariffs.uangSeragam}
                  onChange={e => setTempTariffs({ ...tempTariffs, uangSeragam: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Buku Paket & Modul LKS (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={tempTariffs.uangBuku}
                  onChange={e => setTempTariffs({ ...tempTariffs, uangBuku: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  5. Biaya Ujian PTS (Penilaian Tengah Semester) (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={tempTariffs.biayaPTS || 150000}
                  onChange={e => setTempTariffs({ ...tempTariffs, biayaPTS: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6. Biaya Ujian SAS (Sumatif Akhir Semester) (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={tempTariffs.biayaSAS || 200000}
                  onChange={e => setTempTariffs({ ...tempTariffs, biayaSAS: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  7. Biaya DAT (Dana Akhir Tahun) (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={tempTariffs.biayaDAT || 250000}
                  onChange={e => setTempTariffs({ ...tempTariffs, biayaDAT: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Tarif</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cashier Session Info & Controls */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full flex items-center w-fit space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sesi Kasir Bertugas</span>
                </span>
                <h2 className="text-base font-black text-slate-900 mt-2">Identitas Petugas Aktif</h2>
                <p className="text-xs text-slate-500">Profil kasir yang tercatat pada setiap penerimaan & kwitansi.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Petugas Kasir</span>
                    <span className="text-sm font-black text-slate-900">{activeTreasurer.name}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md font-bold">
                    {activeTreasurer.roleTitle || 'Bendahara'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[11px] text-slate-500 block">NIP / No. Pegawai</span>
                    <span className="font-bold text-slate-800 font-mono">{activeTreasurer.nip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">No. WhatsApp</span>
                    <span className="font-bold text-slate-800">{activeTreasurer.phone || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Pengelolaan Otoritas Bendahara:</strong> Data identitas serta kode akses unik Bendahara 1 s/d 5 dikelola secara terpusat oleh <strong>Super Admin</strong> pada panel Pengaturan Admin untuk menjaga integritas keamanan.
                </p>
              </div>
            </div>

            {/* Quick Logout Button */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Selesai mengelola administrasi & kasir pembayaran?
              </p>
              <button
                type="button"
                onClick={handleLock}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Portal Bendahara Sekarang</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CETAK KWITANSI RESMI */}
      {/* ========================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-auto animate-in zoom-in-95">
            
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-indigo-700" />
                <span className="font-extrabold text-sm text-slate-900">Kwitansi Pembayaran Resmi</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleSendWA(selectedInvoice)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area - Receipt Layout */}
            <div className="border-2 border-indigo-900 rounded-xl p-5 bg-gradient-to-b from-white via-indigo-50/10 to-white text-slate-900 relative">
              
              {/* Header Madrasah */}
              <div className="text-center border-b-2 border-indigo-900 pb-3 mb-4">
                <h3 className="text-base font-black uppercase tracking-tight text-indigo-950">
                  MTs MANBAUL ISLAM
                </h3>
                <p className="text-[10px] text-slate-600 font-medium">
                  Jl. Madrasah No. 12, Kuningan • Telp. (0232) 876543 • NSM/NPSN: 121232080012
                </p>
                <div className="mt-2 inline-block bg-indigo-900 text-white px-3 py-0.5 rounded text-[11px] font-black uppercase tracking-widest">
                  KWITANSI PEMBAYARAN
                </div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100">
                  <span>No. Kwitansi: <strong className="font-mono text-slate-800">{selectedInvoice.invoiceNumber}</strong></span>
                  <span>Tanggal: <strong className="text-slate-800">{selectedInvoice.paymentDate}</strong></span>
                </div>

                <div className="grid grid-cols-3 gap-1 py-1">
                  <span className="text-slate-500 font-semibold">Telah Diterima Dari</span>
                  <span className="col-span-2 font-black text-slate-900">: {selectedInvoice.studentName}</span>
                </div>

                <div className="grid grid-cols-3 gap-1 py-1">
                  <span className="text-slate-500 font-semibold">Kelas / NISN</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    : Kelas {selectedInvoice.className} {selectedInvoice.nisn ? `(NISN: ${selectedInvoice.nisn})` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 py-1">
                  <span className="text-slate-500 font-semibold">Untuk Pembayaran</span>
                  <span className="col-span-2 font-bold text-indigo-950">: {selectedInvoice.categoryLabel}</span>
                </div>

                <div className="grid grid-cols-3 gap-1 py-1">
                  <span className="text-slate-500 font-semibold">Metode Pembayaran</span>
                  <span className="col-span-2 font-medium text-slate-700">: {selectedInvoice.paymentMethod}</span>
                </div>

                {selectedInvoice.notes && (
                  <div className="grid grid-cols-3 gap-1 py-1">
                    <span className="text-slate-500 font-semibold">Catatan</span>
                    <span className="col-span-2 text-slate-600 italic">: {selectedInvoice.notes}</span>
                  </div>
                )}

                {/* Amount Highlight */}
                <div className="my-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Jumlah Uang:</span>
                    <span className="text-lg font-black text-emerald-950">
                      Rp {selectedInvoice.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase">
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="p-2 bg-slate-100 rounded-lg text-[11px] text-slate-700 italic">
                  Terbilang: <strong>{numberToWords(selectedInvoice.amount)}</strong>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-[11px]">
                <div>
                  <p className="text-slate-500">Wali Murid / Penyetor</p>
                  <div className="h-12"></div>
                  <p className="font-bold text-slate-800">({selectedInvoice.studentName})</p>
                </div>

                <div>
                  <p className="text-slate-500">Bendahara Penerima,</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[10px] text-indigo-400 font-serif italic">[ Tanda Tangan & Stempel ]</span>
                  </div>
                  <p className="font-black text-indigo-950 underline">{selectedInvoice.receivedBy}</p>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="mt-4 flex justify-end space-x-2 print:hidden">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CETAK / PDF LAPORAN RIWAYAT TRANSAKSI */}
      {/* ========================================================= */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-transparent">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-8 print:my-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
            
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Pratinjau & Cetak Laporan Riwayat Transaksi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Laporan siap dicetak ke printer fisik atau disimpan sebagai file PDF resmi
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Cetak Dokumen atau Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={handleExportHistoryCSV}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowPrintReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Help Notice (Hidden in Print) */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl text-xs text-indigo-900 flex items-start space-x-2.5 print:hidden">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Petunjuk Cetak / PDF:</strong> Klik tombol <strong>Cetak / Simpan PDF</strong>. Pada dialog cetak browser yang muncul, pilih opsi <strong>Destination / Tujuan: "Save as PDF / Simpan sebagai PDF"</strong> untuk mengunduh laporan dalam format PDF ber-kop surat resmi madrasah.
              </p>
            </div>

            {/* Printable Report Document */}
            <div id="printable-transaction-report" className="bg-white p-5 sm:p-7 border border-slate-200 rounded-xl text-slate-900 print:p-0 print:border-none">
              
              {/* KOP SURAT MADRASAH */}
              <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center relative">
                <div className="flex items-center justify-center space-x-3 mb-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs border border-emerald-800">
                    MTS
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      KEMENTERIAN AGAMA REPUBLIK INDONESIA
                    </h4>
                    <h5 className="text-[10px] font-bold text-slate-600">
                      KANTOR KEMENTERIAN AGAMA KABUPATEN KUNINGAN
                    </h5>
                    <h2 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                      MADRASAH TSANAWIYAH (MTS) MANBAUL ISLAM
                    </h2>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  NSM: 121232080012 • NPSN: 20278912 • Status: Terakreditasi A
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Jl. Madrasah No. 12, Kuningan, Jawa Barat 45511 • Telp: (0232) 876543 • Email: mts.manbaulislam@kemenag.go.id
                </p>
              </div>

              {/* JUDUL LAPORAN */}
              <div className="text-center my-3">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 underline">
                  LAPORAN RIWAYAT TRANSAKSI PENERIMAAN KEUANGAN SISWA
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  Tahun Pelajaran: {academicYear}
                </p>
              </div>

              {/* METADATA FILTER & RINGKASAN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 my-3 print:bg-transparent print:border-slate-400">
                <div>
                  <span className="text-slate-500 block text-[10px]">Filter Periode / Bulan:</span>
                  <strong className="text-slate-900">{historyMonthFilter === 'ALL' ? 'Semua Periode' : historyMonthFilter}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Filter Kelas:</span>
                  <strong className="text-slate-900">{historyClassFilter === 'ALL' ? 'Semua Kelas' : `Kelas ${historyClassFilter}`}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Filter Kategori:</span>
                  <strong className="text-slate-900">{historyCategoryFilter === 'ALL' ? 'Semua Kategori' : historyCategoryFilter}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Petugas Kasir:</span>
                  <strong className="text-slate-900">
                    {historyTreasurerFilter === 'ALL'
                      ? 'Semua Petugas Kasir'
                      : (allTreasurers.find(t => t.id === historyTreasurerFilter)?.name || historyTreasurerFilter)}
                  </strong>
                </div>
              </div>

              {/* TOTAL PENERIMAAN HIGHLIGHT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-lg my-3 print:border-slate-400 print:bg-transparent">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Total Transaksi: <strong>{filteredPayments.length} Pembayaran</strong>
                  </span>
                  <span className="text-sm font-black text-emerald-950">
                    Total Nominal: Rp {filteredPayments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-left sm:text-right text-[11px] text-emerald-900 font-medium italic">
                  Terbilang: <strong>{numberToWords(filteredPayments.reduce((acc, curr) => acc + curr.amount, 0))}</strong>
                </div>
              </div>

              {/* TABEL DATA TRANSAKSI */}
              <div className="overflow-x-auto my-3">
                <table className="w-full text-left text-[10px] sm:text-xs border-collapse border border-slate-300 print:border-slate-700">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black uppercase text-[9px] sm:text-[10px] print:bg-slate-200">
                      <th className="py-2 px-2 border border-slate-300 text-center w-8">No</th>
                      <th className="py-2 px-2 border border-slate-300">No. Kwitansi</th>
                      <th className="py-2 px-2 border border-slate-300">Tanggal</th>
                      <th className="py-2 px-2 border border-slate-300">Nama Siswa</th>
                      <th className="py-2 px-2 border border-slate-300 text-center">Kelas</th>
                      <th className="py-2 px-2 border border-slate-300">Jenis Pembayaran</th>
                      <th className="py-2 px-2 border border-slate-300 text-center">Metode</th>
                      <th className="py-2 px-2 border border-slate-300 text-center">Penerima</th>
                      <th className="py-2 px-2 border border-slate-300 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-400 italic">
                          Tidak ada data transaksi yang sesuai kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-2 border border-slate-300 font-mono font-bold text-indigo-950">{p.invoiceNumber}</td>
                          <td className="py-1.5 px-2 border border-slate-300 whitespace-nowrap">{p.paymentDate}</td>
                          <td className="py-1.5 px-2 border border-slate-300 font-bold text-slate-900">{p.studentName}</td>
                          <td className="py-1.5 px-2 border border-slate-300 text-center">{p.className}</td>
                          <td className="py-1.5 px-2 border border-slate-300">
                            <span>{p.categoryLabel}</span>
                            {p.notes && <span className="text-[9px] text-slate-400 block italic">({p.notes})</span>}
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 text-center">{p.paymentMethod}</td>
                          <td className="py-1.5 px-2 border border-slate-300 text-center text-[10px] whitespace-nowrap">{p.receivedBy}</td>
                          <td className="py-1.5 px-2 border border-slate-300 text-right font-black text-slate-900 whitespace-nowrap">
                            Rp {p.amount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950 print:bg-slate-200">
                      <td colSpan={8} className="py-2 px-3 border border-slate-300 text-right uppercase">
                        Total Akumulasi Transaksi:
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-right font-black text-emerald-950 whitespace-nowrap">
                        Rp {filteredPayments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* TANDA TANGAN RESMI PENGESAHAN */}
              <div className="mt-8 pt-4 grid grid-cols-2 text-center text-xs leading-relaxed break-inside-avoid">
                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan & Stempel ]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 underline">
                    {schoolOfficials?.kepalaSekolah?.name || 'H. Ahmad Syahid, M.Pd.I'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    NIP. {schoolOfficials?.kepalaSekolah?.nip || '197508122000031002'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600">
                    Kuningan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold text-slate-900">
                    Bendahara / Petugas Kasir,
                  </p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan ]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 underline">
                    {activeTreasurer.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    NIP. {activeTreasurer.nip || '-'} ({activeTreasurer.roleTitle || 'Bendahara'})
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Actions (Hidden in Print) */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setShowPrintReportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CETAK / PDF LAPORAN KAS MASUK RESMI & BENDAHARA */}
      {/* ========================================================= */}
      {showPrintKasMasukModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-transparent">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-8 print:my-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
            
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Pratinjau & Cetak Laporan Kas Masuk Resmi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Laporan kas masuk dengan identifikasi eksplisit petugas bendahara penerima
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Cetak Dokumen atau Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={handleExportKasMasukCSV}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowPrintKasMasukModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Kas Masuk Document */}
            <div id="printable-kas-masuk-report" className="bg-white p-5 sm:p-7 border border-slate-200 rounded-xl text-slate-900 print:p-0 print:border-none">
              
              {/* KOP SURAT MADRASAH */}
              <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center relative">
                <div className="flex items-center justify-center space-x-3 mb-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs border border-emerald-800">
                    MTS
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      KEMENTERIAN AGAMA REPUBLIK INDONESIA
                    </h4>
                    <h5 className="text-[10px] font-bold text-slate-600">
                      KANTOR KEMENTERIAN AGAMA KABUPATEN KUNINGAN
                    </h5>
                    <h2 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                      MADRASAH TSANAWIYAH (MTS) MANBAUL ISLAM
                    </h2>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  NSM: 121232080012 • NPSN: 20278912 • Status: Terakreditasi A
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Jl. Madrasah No. 12, Kuningan, Jawa Barat 45511 • Telp: (0232) 876543 • Email: mts.manbaulislam@kemenag.go.id
                </p>
              </div>

              {/* JUDUL LAPORAN */}
              <div className="text-center my-3">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 underline">
                  LAPORAN PENERIMAAN KAS MASUK MADRASAH
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  Tahun Pelajaran {academicYear} • {semester}
                </p>
              </div>

              {/* METADATA FILTER & RINGKASAN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 my-3 print:bg-transparent print:border-slate-400">
                <div>
                  <span className="text-slate-500 block text-[10px]">Periode Kas:</span>
                  <strong className="text-slate-900">
                    {reportDateRange === 'ALL'
                      ? 'Semua Periode'
                      : reportDateRange === 'TODAY'
                      ? 'Hari Ini'
                      : reportDateRange === '7DAYS'
                      ? '7 Hari Terakhir'
                      : reportDateRange === 'THIS_MONTH'
                      ? 'Bulan Ini'
                      : reportDateRange === 'THIS_SEMESTER'
                      ? semester
                      : `${reportStartDate || 'Awal'} s/d ${reportEndDate || 'Sekarang'}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Filter Bendahara:</span>
                  <strong className="text-slate-900">
                    {reportTreasurerFilter === 'ALL'
                      ? 'Semua Petugas Kasir (1..5)'
                      : (allTreasurers.find(t => t.id === reportTreasurerFilter)?.name || reportTreasurerFilter)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Filter Pos / Kategori:</span>
                  <strong className="text-slate-900">
                    {reportCategoryFilter === 'ALL' ? 'Semua Pos Kas' : reportCategoryFilter}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Metode Pembayaran:</span>
                  <strong className="text-slate-900">
                    {reportMethodFilter === 'ALL' ? 'Semua Metode' : reportMethodFilter}
                  </strong>
                </div>
              </div>

              {/* REKAPITULASI PENERIMAAN PER BENDAHARA (SUMMARY TABLE) */}
              <div className="my-3">
                <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider mb-1.5">
                  I. Rekapitulasi Kas Masuk per Petugas Bendahara
                </h5>
                <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black uppercase text-slate-800">
                      <th className="py-1.5 px-2 border border-slate-300 text-center w-8">No</th>
                      <th className="py-1.5 px-2 border border-slate-300">Nama Petugas Bendahara</th>
                      <th className="py-1.5 px-2 border border-slate-300">Jabatan</th>
                      <th className="py-1.5 px-2 border border-slate-300 text-center">Transaksi</th>
                      <th className="py-1.5 px-2 border border-slate-300 text-right">Kas Tunai (Rp)</th>
                      <th className="py-1.5 px-2 border border-slate-300 text-right">Non-Tunai (Rp)</th>
                      <th className="py-1.5 px-2 border border-slate-300 text-right">Total Kas Diterima (Rp)</th>
                      <th className="py-1.5 px-2 border border-slate-300 text-center">Porsi (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treasurerStats.map((ts, idx) => (
                      <tr key={ts.id}>
                        <td className="py-1 px-2 border border-slate-300 text-center">{idx + 1}</td>
                        <td className="py-1 px-2 border border-slate-300 font-bold">{ts.name}</td>
                        <td className="py-1 px-2 border border-slate-300">{ts.roleTitle}</td>
                        <td className="py-1 px-2 border border-slate-300 text-center">{ts.count}</td>
                        <td className="py-1 px-2 border border-slate-300 text-right">Rp {ts.tunai.toLocaleString('id-ID')}</td>
                        <td className="py-1 px-2 border border-slate-300 text-right">Rp {(ts.transfer + ts.qris).toLocaleString('id-ID')}</td>
                        <td className="py-1 px-2 border border-slate-300 text-right font-black">Rp {ts.totalAmount.toLocaleString('id-ID')}</td>
                        <td className="py-1 px-2 border border-slate-300 text-center font-bold">{ts.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t border-slate-400">
                      <td colSpan={3} className="py-1.5 px-2 border border-slate-300 uppercase">Total Rekapitulasi:</td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center">{reportKPIs.count}</td>
                      <td className="py-1.5 px-2 border border-slate-300 text-right">Rp {reportKPIs.tunaiTotal.toLocaleString('id-ID')}</td>
                      <td className="py-1.5 px-2 border border-slate-300 text-right">Rp {reportKPIs.digitalTotal.toLocaleString('id-ID')}</td>
                      <td className="py-1.5 px-2 border border-slate-300 text-right font-black text-emerald-950">
                        Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* TOTAL PENERIMAAN HIGHLIGHT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-lg my-3 print:border-slate-400 print:bg-transparent">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Total Transaksi: <strong>{reportFilteredPayments.length} Pembayaran</strong>
                  </span>
                  <span className="text-sm font-black text-emerald-950">
                    Total Kas Masuk: Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-left sm:text-right text-[11px] text-emerald-900 font-medium italic">
                  Terbilang: <strong>{numberToWords(reportKPIs.totalAmount)}</strong>
                </div>
              </div>

              {/* TABEL DATA DETAIL MUTASI TRANSAKSI */}
              <div className="my-3">
                <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider mb-1.5">
                  II. Rincian Jurnal Kas Masuk & Identifikasi Petugas Penerima
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px] sm:text-[10px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black uppercase text-[9px] print:bg-slate-200">
                        <th className="py-1.5 px-1.5 border border-slate-300 text-center w-7">No</th>
                        <th className="py-1.5 px-2 border border-slate-300">Tgl & No Kwitansi</th>
                        <th className="py-1.5 px-2 border border-slate-300">Nama Siswa</th>
                        <th className="py-1.5 px-1.5 border border-slate-300 text-center">Kelas</th>
                        <th className="py-1.5 px-2 border border-slate-300">Pos Keuangan</th>
                        <th className="py-1.5 px-1.5 border border-slate-300 text-center">Metode</th>
                        <th className="py-1.5 px-2 border border-slate-300 font-black text-slate-900">Petugas Bendahara Penerima</th>
                        <th className="py-1.5 px-2 border border-slate-300 text-right">Nominal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {reportFilteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                            Tidak ada data transaksi kas masuk.
                          </td>
                        </tr>
                      ) : (
                        reportFilteredPayments.map((p, idx) => {
                          const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
                          return (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-1 px-1.5 border border-slate-300 text-center font-mono">{idx + 1}</td>
                              <td className="py-1 px-2 border border-slate-300 whitespace-nowrap">
                                <div>{p.paymentDate}</div>
                                <div className="font-mono text-[8px] text-indigo-900 font-bold">{p.invoiceNumber}</div>
                              </td>
                              <td className="py-1 px-2 border border-slate-300 font-bold text-slate-900">{p.studentName}</td>
                              <td className="py-1 px-1.5 border border-slate-300 text-center">{p.className}</td>
                              <td className="py-1 px-2 border border-slate-300">
                                <span>{p.categoryLabel}</span>
                                {p.notes && <span className="text-[8px] text-slate-400 block italic">({p.notes})</span>}
                              </td>
                              <td className="py-1 px-1.5 border border-slate-300 text-center">{p.paymentMethod}</td>
                              <td className="py-1 px-2 border border-slate-300 whitespace-nowrap">
                                <strong className="text-slate-900 block">{tInfo.name}</strong>
                                <span className="text-[8px] text-slate-500">{tInfo.roleTitle}</span>
                              </td>
                              <td className="py-1 px-2 border border-slate-300 text-right font-black text-slate-900 whitespace-nowrap">
                                Rp {p.amount.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950 print:bg-slate-200">
                        <td colSpan={7} className="py-1.5 px-2 border border-slate-300 text-right uppercase">
                          Total Kas Masuk Terverifikasi:
                        </td>
                        <td className="py-1.5 px-2 border border-slate-300 text-right font-black text-emerald-950 whitespace-nowrap">
                          Rp {reportKPIs.totalAmount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* TANDA TANGAN RESMI PENGESAHAN */}
              <div className="mt-8 pt-4 grid grid-cols-2 text-center text-xs leading-relaxed break-inside-avoid">
                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan & Stempel ]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 underline">
                    {schoolOfficials?.kepalaSekolah?.name || 'H. Ahmad Syahid, M.Pd.I'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    NIP. {schoolOfficials?.kepalaSekolah?.nip || '197508122000031002'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600">
                    Kuningan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold text-slate-900">
                    Bendahara / Petugas Penerima,
                  </p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan ]</span>
                  </div>
                  <p className="font-extrabold text-slate-900 underline">
                    {reportTreasurerFilter !== 'ALL' && allTreasurers.find(t => t.id === reportTreasurerFilter)
                      ? allTreasurers.find(t => t.id === reportTreasurerFilter)?.name
                      : activeTreasurer.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    NIP. {reportTreasurerFilter !== 'ALL' && allTreasurers.find(t => t.id === reportTreasurerFilter)
                      ? (allTreasurers.find(t => t.id === reportTreasurerFilter)?.nip || '-')
                      : (activeTreasurer.nip || '-')}
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Actions (Hidden in Print) */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setShowPrintKasMasukModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Batalkan / Hapus Transaksi?</h3>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Otoritas Khusus Bendahara Utama
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan transaksi kwitansi <strong>{deleteTarget.invoiceNumber}</strong> atas nama <strong>{deleteTarget.studentName}</strong> sebesar <strong>Rp {deleteTarget.amount.toLocaleString('id-ID')}</strong>?
            </p>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              <strong>Peringatan:</strong> Penghapusan transaksi kwitansi akan membatalkan status pembayaran siswa dan memperbarui mutasi kas. Hanya Bendahara Utama yang berhak melakukan tindakan ini.
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              {isBendaharaUtama ? (
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Ya, Hapus Transaksi
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
                >
                  Akses Ditolak
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FORM SETOR KAS KE BENDAHARA UTAMA */}
      {/* ========================================================= */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">
                    Setor Kas ke Bendahara Utama
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mutasi penyerahan dana kas dari Bendahara 1-5 ke Kas Pusat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeposit} className="space-y-4 text-xs">
              
              {/* Select Sender Treasurer */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Bendahara Penyetor (Dari) <span className="text-rose-500">*</span>
                </label>
                {isBendaharaUtama ? (
                  <select
                    value={depositFromTreasurerId}
                    onChange={e => {
                      const newId = e.target.value;
                      setDepositFromTreasurerId(newId);
                      const tItem = treasurerCashBalances.items.find(i => i.id === newId);
                      if (tItem) {
                        setDepositAmount(tItem.remainingCashOnHand);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {treasurerCashBalances.items.map(t => (
                      <option key={t.id} value={t.id}>
                        Bendahara {t.index} - {t.name} (Sisa Kas: Rp {t.remainingCashOnHand.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-sm text-slate-900">
                        Bendahara {myCashBalance.index} - {activeTreasurer.name}
                      </div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                        {activeTreasurer.roleTitle}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      NIP: {activeTreasurer.nip || '-'} • Telepon: {activeTreasurer.phone || '-'}
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient info: Bendahara Utama */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">
                  2. Bendahara Penerima (Tujuan):
                </span>
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-teal-950">
                    {treasurerCashBalances.treasurerUtama.name}
                  </div>
                  <span className="text-[10px] bg-teal-200/70 text-teal-900 font-bold px-2 py-0.5 rounded">
                    Bendahara Utama
                  </span>
                </div>
                <div className="text-[11px] text-teal-700">
                  NIP: {treasurerCashBalances.treasurerUtama.nip || '-'} • Kas Pusat Madrasah
                </div>
              </div>

              {/* Pilihan Pos Pemasukan yang Disetorkan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>3. Pilihan Pos Pemasukan yang Disetorkan <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                    Pilihan Pos
                  </span>
                </label>
                <select
                  value={depositPosCategory}
                  onChange={e => {
                    const newPos = e.target.value;
                    setDepositPosCategory(newPos);
                    const currentSender = treasurerCashBalances.items.find(i => i.id === depositFromTreasurerId);
                    if (currentSender) {
                      if (newPos !== 'SEMUA') {
                        const specificPos = currentSender.breakdownByPos.find(p => p.key === newPos);
                        const sisa = specificPos ? specificPos.sisaDiTangan : 0;
                        setDepositAmount(sisa);
                        const posDef = POS_PEMASUKAN_OPTIONS.find(p => p.key === newPos);
                        setDepositNotes(`Setoran kas khusus ${posDef ? posDef.name : newPos} ke Bendahara Utama`);
                      } else {
                        setDepositAmount(currentSender.remainingCashOnHand);
                        setDepositNotes('Setoran kas seluruh pos dana pembayaran siswa ke Bendahara Utama');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-emerald-50/60 border border-emerald-300 rounded-xl font-bold text-emerald-950 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {POS_PEMASUKAN_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Saldo Kas Pengirim Sesuai Pos Terpilih */}
              {(() => {
                const currentSender = treasurerCashBalances.items.find(i => i.id === depositFromTreasurerId);
                if (!currentSender) return null;

                if (depositPosCategory !== 'SEMUA') {
                  const targetPos = currentSender.breakdownByPos.find(p => p.key === depositPosCategory);
                  const diterima = targetPos ? targetPos.diterima : 0;
                  const disetor = targetPos ? targetPos.disetor : 0;
                  const sisa = targetPos ? targetPos.sisaDiTangan : 0;
                  const posDef = POS_PEMASUKAN_OPTIONS.find(p => p.key === depositPosCategory);

                  return (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-900">
                          Rincian Kas Pos: {posDef ? posDef.name : depositPosCategory}
                        </span>
                        <span className="text-[10px] font-black bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
                          Spesifik Pos
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-emerald-200/60">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 block uppercase">Penerimaan Siswa</span>
                          <strong className="text-[11px] font-black text-slate-800">
                            Rp {diterima.toLocaleString('id-ID')}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 block uppercase">Sudah Disetor</span>
                          <strong className="text-[11px] font-black text-emerald-700">
                            Rp {disetor.toLocaleString('id-ID')}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-amber-800 block uppercase">Sisa di Tangan</span>
                          <strong className="text-[11px] font-black text-amber-700">
                            Rp {sisa.toLocaleString('id-ID')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Penerimaan Total</span>
                      <strong className="text-[11px] font-black text-slate-800">
                        Rp {currentSender.grossIncome.toLocaleString('id-ID')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Sudah Disetor</span>
                      <strong className="text-[11px] font-black text-emerald-700">
                        Rp {currentSender.totalDeposited.toLocaleString('id-ID')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Sisa Total Kas</span>
                      <strong className="text-[11px] font-black text-amber-700">
                        Rp {currentSender.remainingCashOnHand.toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Nominal Input & Quick Buttons */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  4. Nominal Kas yang Disetorkan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-black text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={depositAmount || ''}
                    onChange={e => setDepositAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold">Cepat:</span>
                  {(() => {
                    const currentSender = treasurerCashBalances.items.find(i => i.id === depositFromTreasurerId);
                    let targetSisa = 0;
                    if (currentSender) {
                      if (depositPosCategory !== 'SEMUA') {
                        const targetPos = currentSender.breakdownByPos.find(p => p.key === depositPosCategory);
                        targetSisa = targetPos ? targetPos.sisaDiTangan : 0;
                      } else {
                        targetSisa = currentSender.remainingCashOnHand;
                      }
                    }

                    return (
                      <>
                        {targetSisa > 0 && (
                          <button
                            type="button"
                            onClick={() => setDepositAmount(targetSisa)}
                            className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-bold text-[10px] cursor-pointer"
                          >
                            Setor Seluruh Sisa Pos (Rp {targetSisa.toLocaleString('id-ID')})
                          </button>
                        )}
                        {[250000, 500000, 1000000, 2000000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setDepositAmount(val)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10px] cursor-pointer"
                          >
                            Rp {(val / 1000).toLocaleString('id-ID')}rb
                          </button>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  5. Tanggal Penyerahan Setoran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={e => setDepositDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  6. Keterangan / Catatan Setoran:
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={e => setDepositNotes(e.target.value)}
                  placeholder="Contoh: Setoran uang SPP & Gedung minggu ke-2 Agustus"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Catatan Sistem:</strong> Setelah disimpan, dana kas masuk di tangan bendahara penyetor akan otomatis <strong>berkurang sejumlah Rp {depositAmount.toLocaleString('id-ID')}</strong> dan dibukukan ke saldo kas Bendahara Utama.
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDeposit}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <SendHorizonal className="w-4 h-4" />
                  <span>{isSubmittingDeposit ? 'Menyimpan...' : 'Konfirmasi & Setor Kas'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CETAK BUKTI BERITA ACARA SETORAN KAS */}
      {/* ========================================================= */}
      {selectedDepositReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-auto animate-in zoom-in-95">
            
            {/* Top Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <span className="font-extrabold text-sm text-slate-900">
                  Bukti Tanda Terima & Berita Acara Setoran Kas
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print</span>
                </button>
                <button
                  onClick={() => setSelectedDepositReceipt(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div className="print:p-0 space-y-4 border border-slate-200 p-6 rounded-xl bg-white">
              
              {/* Kop Madrasah */}
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  YAYASAN PENDIDIKAN ISLAM MANBAUL HUDA
                </h4>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  MADRASAH TSANAWIYAH (MTs) MANBAUL ISLAM
                </h2>
                <p className="text-[10px] text-slate-500">
                  Dusun Wage RT 05 RW 02 Desa Kertawinangun Kec. Mandirancan Kab. Kuningan Jawa Barat 45558
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  NSM: 121232080035 | NPSN: 20278912 | Status: Terakreditasi
                </p>
              </div>

              {/* Title */}
              <div className="text-center pt-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide underline">
                  BERITA ACARA & BUKTI PENYERAHAN SETORAN KAS
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-800 mt-0.5">
                  Nomor: {selectedDepositReceipt.depositNumber}
                </p>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                Pada hari ini, tanggal <strong>{new Date(selectedDepositReceipt.depositDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, telah dilakukan serah terima uang kas masuk pembayaran siswa madrasah dengan rincian sebagai berikut:
              </p>

              {/* Table Data Serah Terima */}
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 font-bold text-slate-600 w-44">Pihak I (Yang Menyerahkan)</td>
                    <td className="py-1.5 font-black text-slate-900">
                      : {selectedDepositReceipt.fromTreasurerName} ({selectedDepositReceipt.fromTreasurerRole})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 font-bold text-slate-600">Pihak II (Yang Menerima)</td>
                    <td className="py-1.5 font-black text-slate-900">
                      : {selectedDepositReceipt.toTreasurerName} (Bendahara Utama {schoolOfficials?.namaSekolah || 'Madrasah'})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 font-bold text-slate-600">Pos Kas Disetorkan</td>
                    <td className="py-1.5 font-black text-slate-900">
                      : <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded font-extrabold">{selectedDepositReceipt.posCategoryLabel || selectedDepositReceipt.posCategory || 'Semua Pos (Konsolidasi)'}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 font-bold text-slate-600">Jumlah Dana Diserahkan</td>
                    <td className="py-1.5 font-black text-base text-emerald-800 font-mono">
                      : Rp {selectedDepositReceipt.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 font-bold text-slate-600">Status Pembukuan</td>
                    <td className="py-1.5 font-bold text-emerald-700">
                      : {selectedDepositReceipt.status} (Dana Masuk ke Kas Pusat)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-bold text-slate-600">Catatan / Keperluan</td>
                    <td className="py-1.5 text-slate-800">
                      : {selectedDepositReceipt.notes || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="text-xs text-slate-600 italic">
                Dana tersebut di atas telah diterima dengan benar dan dicatat pada buku kas umum kasir bendahara.
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs">
                <div>
                  <p className="text-slate-500 font-bold">Pihak I (Yang Menyerahkan),</p>
                  <p className="font-extrabold text-slate-800">{selectedDepositReceipt.fromTreasurerRole}</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan ]</span>
                  </div>
                  <p className="font-black text-slate-900 underline">{selectedDepositReceipt.fromTreasurerName}</p>
                </div>

                <div>
                  <p className="text-slate-500 font-bold">Pihak II (Yang Menerima),</p>
                  <p className="font-extrabold text-emerald-800">Bendahara Utama Madrasah</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan ]</span>
                  </div>
                  <p className="font-black text-slate-900 underline">{selectedDepositReceipt.toTreasurerName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    NIP. {treasurerCashBalances.treasurerUtama.nip || '-'}
                  </p>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-slate-200">
                <p className="text-slate-500 font-bold text-xs">Mengetahui & Menyetujui,</p>
                <p className="font-black text-slate-900 text-xs">Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
                <div className="h-14 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 italic">[ Tanda Tangan & Stempel Resmi ]</span>
                </div>
                <p className="font-black text-slate-900 text-xs underline">
                  {schoolOfficials?.kepalaSekolah?.name || 'H. Ahmad Syahid, M.Pd.I'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  NIP. {schoolOfficials?.kepalaSekolah?.nip || '197508122000031002'}
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI HAPUS / BATALKAN SETORAN KAS */}
      {/* ========================================================= */}
      {deleteDepositTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Batalkan / Hapus Setoran Kas?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan setoran kas <strong>{deleteDepositTarget.depositNumber}</strong> dari <strong>{deleteDepositTarget.fromTreasurerName}</strong> sebesar <strong>Rp {deleteDepositTarget.amount.toLocaleString('id-ID')}</strong>? Saldo kas akan otomatis dikembalikan ke bendahara penyetor.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteDepositTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteDeposit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Ya, Batalkan Setoran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Modular Sync Payments Modal */}
      {showSyncModal && (
        <SyncPaymentsModal
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          payments={payments}
          students={students}
          onExecuteSync={handleExecuteSyncGlobal}
          syncResult={syncFeedback}
        />
      )}

        </div> {/* End of Right Main Working Area */}
      </div> {/* End of Flex Layout */}

    </div>
  );
};

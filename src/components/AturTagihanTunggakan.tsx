import React, { useState, useMemo } from 'react';
import {
  Student,
  PaymentTransaction,
  FeeTariffSettings,
  StudentBillSettings,
  StandardBillItem,
  CustomBillItem,
  StudentBillOverride,
  SchoolOfficials,
  StudentArrearsSummary,
  PaymentCategory
} from '../types';
import {
  calculateStudentArrears,
  getGradeFromClassName,
  getSppTariffForGrade,
  countUnsyncedPayments,
  syncPaymentsWithStudents,
  filterPaymentsForStudent
} from '../utils/storage';
import { printHtmlString } from '../utils/export';
import {
  Layers,
  Settings2,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  MessageSquare,
  DollarSign,
  FileText,
  CreditCard,
  Building2,
  BookOpen,
  Calendar,
  Save,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  Award,
  Wallet,
  X,
  Check,
  RotateCcw,
  Tag,
  ArrowRightLeft,
  CheckCheck
} from 'lucide-react';

interface AturTagihanTunggakanProps {
  students: Student[];
  classList: string[];
  payments: PaymentTransaction[];
  tariffs: FeeTariffSettings;
  billSettings: StudentBillSettings;
  schoolOfficials: SchoolOfficials;
  academicYear: string;
  semester: string;
  onSaveBillSettings: (settings: StudentBillSettings) => Promise<void> | void;
  onSaveTariffs?: (tariffs: FeeTariffSettings) => Promise<void> | void;
  onSyncPayments?: () => Promise<any> | any;
}

const MONTHS_LIST = [
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
];

export const AturTagihanTunggakan: React.FC<AturTagihanTunggakanProps> = ({
  students,
  classList,
  payments,
  tariffs,
  billSettings,
  schoolOfficials,
  academicYear,
  semester,
  onSaveBillSettings,
  onSaveTariffs,
  onSyncPayments
}) => {
  // Navigation inside this tab
  const [activeView, setActiveView] = useState<'monitoring' | 'global_config' | 'keringanan'>('monitoring');

  // Filter state for monitoring
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NUNGGAK' | 'LUNAS'>('ALL');

  // Modal / Detail state
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentArrearsSummary | null>(null);
  const [selectedStudentForLetter, setSelectedStudentForLetter] = useState<StudentArrearsSummary | null>(null);

  // Form State for Global Bill Obligations
  const [tempActiveObligations, setTempActiveObligations] = useState(
    billSettings.activeObligations || {
      spp: true,
      gedung: true,
      seragam: true,
      buku: true,
      pts: true,
      sas: true,
      dat: true
    }
  );

  // Dynamic Standard Billing Items state
  const [standardItems, setStandardItems] = useState<StandardBillItem[]>(() => {
    if (billSettings.standardBillingItems && billSettings.standardBillingItems.length > 0) {
      return billSettings.standardBillingItems;
    }
    return [
      {
        id: 'spp',
        key: 'spp',
        name: 'SPP Bulanan',
        category: 'SPP',
        defaultAmount: tariffs.sppMonthly || 175000,
        frequency: 'Bulanan',
        targetGrades: ['SEMUA'],
        description: 'Tarif kewajiban iuran bulanan peserta didik',
        isActive: billSettings.activeObligations?.spp ?? true,
        isBuiltIn: true
      },
      {
        id: 'gedung',
        key: 'gedung',
        name: 'Infaq Gedung / Pembangunan',
        category: 'GEDUNG',
        defaultAmount: tariffs.uangGedung || 1500000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Infaq pembangunan sarana & prasarana madrasah',
        isActive: billSettings.activeObligations?.gedung ?? false,
        isBuiltIn: true
      },
      {
        id: 'seragam',
        key: 'seragam',
        name: 'Uang Seragam & Atribut',
        category: 'SERAGAM',
        defaultAmount: tariffs.uangSeragam || 750000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Paket seragam batik, olahraga, identitas madrasah & atribut',
        isActive: billSettings.activeObligations?.seragam ?? false,
        isBuiltIn: true
      },
      {
        id: 'buku',
        key: 'buku',
        name: 'Uang Buku / LKS / Modul',
        category: 'BUKU',
        defaultAmount: tariffs.uangBuku || 500000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Modul materi ajar & lembar kerja siswa satu tahun',
        isActive: billSettings.activeObligations?.buku ?? false,
        isBuiltIn: true
      },
      {
        id: 'pts',
        key: 'pts',
        name: 'Biaya PTS (Tengah Semester)',
        category: 'PTS',
        defaultAmount: tariffs.biayaPTS || 175000,
        frequency: 'Per Semester',
        targetGrades: ['SEMUA'],
        description: 'Penilaian Tengah Semester & penyusunan naskah ujian',
        isActive: billSettings.activeObligations?.pts ?? true,
        isBuiltIn: true
      },
      {
        id: 'sas',
        key: 'sas',
        name: 'Biaya SAS (Akhir Semester)',
        category: 'SAS',
        defaultAmount: tariffs.biayaSAS || 225000,
        frequency: 'Per Semester',
        targetGrades: ['SEMUA'],
        description: 'Sumatif Akhir Semester (SAS / PAS)',
        isActive: billSettings.activeObligations?.sas ?? true,
        isBuiltIn: true
      },
      {
        id: 'dat',
        key: 'dat',
        name: 'Biaya DAT (Dana Akhir Tahun)',
        category: 'DAT',
        defaultAmount: tariffs.biayaDAT || 275000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Biaya evaluasi kenaikan kelas / kelulusan madrasah',
        isActive: billSettings.activeObligations?.dat ?? false,
        isBuiltIn: true
      }
    ];
  });

  // Modal State for Tambah/Edit Standard Item
  const [showStandardBillModal, setShowStandardBillModal] = useState(false);
  const [editingStandardItem, setEditingStandardItem] = useState<StandardBillItem | null>(null);
  const [stdName, setStdName] = useState('');
  const [stdCategory, setStdCategory] = useState<PaymentCategory | string>('LAINNYA');
  const [stdAmount, setStdAmount] = useState<number>(150000);
  const [stdFrequency, setStdFrequency] = useState<string>('Tahunan / Sekali Bayar');
  const [stdTargetGrades, setStdTargetGrades] = useState<string[]>(['SEMUA']);
  const [stdDesc, setStdDesc] = useState('');
  const [stdIsActive, setStdIsActive] = useState<boolean>(true);

  // Delete Confirm Modal
  const [itemToDelete, setItemToDelete] = useState<StandardBillItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync when billSettings updates
  React.useEffect(() => {
    if (billSettings.standardBillingItems && billSettings.standardBillingItems.length > 0) {
      setStandardItems(billSettings.standardBillingItems);
    }
  }, [billSettings.standardBillingItems]);

  const [tempSppMonths, setTempSppMonths] = useState<string[]>(
    billSettings.sppMonthsBilled || MONTHS_LIST
  );

  const [tempPaymentAccount, setTempPaymentAccount] = useState(
    billSettings.paymentAccountInfo || {
      bankName: 'Bank Syariah Indonesia (BSI)',
      accountNumber: '7123456789',
      accountHolder: 'MTs MANBAUL ISLAM',
      qrisImageUrl: '',
      paymentInstructions: 'Transfer via BSI / ATM Bersama dengan berita transfer: [Nama Siswa - Kelas - Keperluan]. Konfirmasi bukti transfer ke nomor WhatsApp Bendahara.',
      contactPersonPhone: '081234567890'
    }
  );

  // Custom Extra Bills Form
  const [customBills, setCustomBills] = useState<CustomBillItem[]>(
    billSettings.customBills || []
  );
  const [showAddCustomBillModal, setShowAddCustomBillModal] = useState(false);
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState<number>(100000);
  const [newBillClass, setNewBillClass] = useState<string>('ALL');
  const [newBillDueDate, setNewBillDueDate] = useState<string>('');
  const [newBillDesc, setNewBillDesc] = useState<string>('');

  // Helper to create empty / regular form
  const createDefaultKeringananForm = (stId: string = ''): StudentBillOverride => ({
    studentId: stId,
    sppExempt: false,
    sppDiscountPercent: 0,
    sppDiscountFixed: 0,
    gedungExempt: false,
    gedungDiscountPercent: 0,
    gedungDiscountFixed: 0,
    seragamExempt: false,
    seragamDiscountPercent: 0,
    seragamDiscountFixed: 0,
    bukuExempt: false,
    bukuDiscountPercent: 0,
    bukuDiscountFixed: 0,
    ptsExempt: false,
    ptsDiscountPercent: 0,
    ptsDiscountFixed: 0,
    sasExempt: false,
    sasDiscountPercent: 0,
    sasDiscountFixed: 0,
    datExempt: false,
    datDiscountPercent: 0,
    datDiscountFixed: 0,
    customNote: ''
  });

  // Form State for Student Overrides (Keringanan)
  const [keringananClass, setKeringananClass] = useState<string>(classList[0] || 'VII A');
  const [keringananStudentId, setKeringananStudentId] = useState<string>('');
  const [keringananForm, setKeringananForm] = useState<StudentBillOverride>(createDefaultKeringananForm(''));

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Synchronization state
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    syncedCount: number;
    alreadySyncedCount: number;
    unmatchedCount: number;
    details: {
      paymentId: string;
      invoiceNumber: string;
      studentName: string;
      className: string;
      amount: number;
      category: string;
      paymentDate: string;
      status: 'MATCHED' | 'ALREADY_SYNCED' | 'UNMATCHED';
      matchedStudentName?: string;
      matchedBy?: string;
    }[];
  } | null>(null);

  const unsyncedStats = useMemo(() => {
    return countUnsyncedPayments(payments, students);
  }, [payments, students]);

  const handleExecuteSync = async () => {
    setIsSyncing(true);
    try {
      if (onSyncPayments) {
        const res = await onSyncPayments();
        setSyncFeedback(res);
      } else {
        const res = syncPaymentsWithStudents(payments, students);
        setSyncFeedback(res);
      }
      setSaveSuccessMsg('Sinkronisasi riwayat pembayaran siswa berhasil! Data tunggakan otomatis diperbarui.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error syncing payments:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-initialize selected student for Keringanan form when students or class changes
  React.useEffect(() => {
    if (!keringananStudentId && students.length > 0) {
      const inClass = students.filter(s => s.className === keringananClass);
      if (inClass.length > 0) {
        const firstId = inClass[0].id;
        setKeringananStudentId(firstId);
        const existing = billSettings.studentOverrides?.[firstId];
        if (existing) {
          setKeringananForm({ ...existing, studentId: firstId });
        } else {
          setKeringananForm(createDefaultKeringananForm(firstId));
        }
      }
    }
  }, [keringananClass, keringananStudentId, students, billSettings]);

  // Calculate arrears summary for ALL students
  const allStudentSummaries = useMemo(() => {
    return students.map(student => {
      return calculateStudentArrears(student, payments, tariffs, billSettings, academicYear);
    });
  }, [students, payments, tariffs, billSettings, academicYear]);

  // Filtered student summaries for the monitoring table
  const filteredSummaries = useMemo(() => {
    return allStudentSummaries.filter(summary => {
      // Class filter
      if (selectedClass !== 'ALL' && summary.student.className !== selectedClass) {
        return false;
      }
      // Status filter
      if (statusFilter === 'NUNGGAK' && summary.isAllPaid) {
        return false;
      }
      if (statusFilter === 'LUNAS' && !summary.isAllPaid) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = summary.student.name.toLowerCase().includes(q);
        const matchNis = summary.student.nis && summary.student.nis.toLowerCase().includes(q);
        const matchNisn = summary.student.nisn && summary.student.nisn.toLowerCase().includes(q);
        const matchKode = summary.student.kodeUnik && summary.student.kodeUnik.toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchNisn && !matchKode) {
          return false;
        }
      }
      return true;
    });
  }, [allStudentSummaries, selectedClass, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const targetList = selectedClass === 'ALL'
      ? allStudentSummaries
      : allStudentSummaries.filter(s => s.student.className === selectedClass);

    const totalStudents = targetList.length;
    const lunasCount = targetList.filter(s => s.isAllPaid).length;
    const nunggakCount = totalStudents - lunasCount;
    const totalRemainingSum = targetList.reduce((acc, curr) => acc + curr.totalRemaining, 0);
    const totalBillSum = targetList.reduce((acc, curr) => acc + curr.totalBill, 0);
    const totalPaidSum = targetList.reduce((acc, curr) => acc + curr.totalPaid, 0);

    return {
      totalStudents,
      lunasCount,
      nunggakCount,
      totalRemainingSum,
      totalBillSum,
      totalPaidSum
    };
  }, [allStudentSummaries, selectedClass]);

  // When class changes in Keringanan tab
  const handleKeringananClassChange = (c: string) => {
    setKeringananClass(c);
    const inClass = students.filter(s => s.className === c);
    if (inClass.length > 0) {
      loadKeringananForStudent(inClass[0].id);
    } else {
      setKeringananStudentId('');
    }
  };

  const loadKeringananForStudent = (stId: string) => {
    setKeringananStudentId(stId);
    const existing = billSettings.studentOverrides?.[stId];
    if (existing) {
      setKeringananForm({
        ...createDefaultKeringananForm(stId),
        ...existing,
        studentId: stId
      });
    } else {
      setKeringananForm(createDefaultKeringananForm(stId));
    }
  };

  // Save Global Configuration
  const handleSaveGlobalConfig = async () => {
    const updated: StudentBillSettings = {
      ...billSettings,
      activeObligations: tempActiveObligations,
      standardBillingItems: standardItems,
      sppMonthsBilled: tempSppMonths,
      customBills: customBills,
      paymentAccountInfo: tempPaymentAccount,
      lastUpdated: new Date().toISOString()
    };
    await onSaveBillSettings(updated);
    setSaveSuccessMsg('Pengaturan kewajiban tagihan berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Helper to format target grades label
  const formatTargetGradesLabel = (grades?: string[]) => {
    if (!grades || grades.length === 0 || grades.includes('SEMUA') || grades.includes('ALL')) {
      return 'Semua Tingkat (VII, VIII, IX)';
    }
    const valid = ['VII', 'VIII', 'IX'].filter(g => grades.includes(g));
    if (valid.length === 3) return 'Semua Tingkat (VII, VIII, IX)';
    if (valid.length > 0) return `Khusus Kelas ${valid.join(', ')}`;
    return grades.join(', ');
  };

  // Toggle Target Grade in Modal
  const handleToggleTargetGrade = (grade: 'SEMUA' | 'VII' | 'VIII' | 'IX') => {
    if (grade === 'SEMUA') {
      setStdTargetGrades(['SEMUA']);
      return;
    }
    let current = stdTargetGrades.filter(g => g !== 'SEMUA');
    if (current.includes(grade)) {
      current = current.filter(g => g !== grade);
      if (current.length === 0) {
        setStdTargetGrades(['SEMUA']);
      } else {
        setStdTargetGrades(current);
      }
    } else {
      current.push(grade);
      if (current.length === 3 && current.includes('VII') && current.includes('VIII') && current.includes('IX')) {
        setStdTargetGrades(['SEMUA']);
      } else {
        setStdTargetGrades(current);
      }
    }
  };

  // Open Add Standard Item Modal
  const handleOpenAddStandardItem = () => {
    setEditingStandardItem(null);
    setStdName('');
    setStdCategory('LAINNYA');
    setStdAmount(150000);
    setStdFrequency('Tahunan / Sekali Bayar');
    setStdTargetGrades(['SEMUA']);
    setStdDesc('');
    setStdIsActive(true);
    setShowStandardBillModal(true);
  };

  // Open Edit Standard Item Modal
  const handleOpenEditStandardItem = (item: StandardBillItem) => {
    setEditingStandardItem(item);
    setStdName(item.name);
    setStdCategory(item.category || 'LAINNYA');
    setStdAmount(item.defaultAmount || 0);
    setStdFrequency(item.frequency || 'Tahunan / Sekali Bayar');
    setStdTargetGrades(item.targetGrades && item.targetGrades.length > 0 ? item.targetGrades : ['SEMUA']);
    setStdDesc(item.description || '');
    const isAct = tempActiveObligations[item.id] !== undefined ? tempActiveObligations[item.id] : item.isActive;
    setStdIsActive(isAct);
    setShowStandardBillModal(true);
  };

  // Toggle Standard Item Active
  const handleToggleStandardItem = (itemId: string) => {
    const currentVal = tempActiveObligations[itemId] ?? standardItems.find(i => i.id === itemId)?.isActive ?? true;
    const newVal = !currentVal;
    const updatedItems = standardItems.map(it => it.id === itemId ? { ...it, isActive: newVal } : it);
    setStandardItems(updatedItems);
    setTempActiveObligations(prev => ({
      ...prev,
      [itemId]: newVal
    }));
  };

  // Save Standard Item (Add or Edit)
  const handleSaveStandardItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stdName.trim()) {
      alert('Mohon masukkan nama pos pembayaran.');
      return;
    }
    if (stdAmount < 0) {
      alert('Nominal tarif tidak boleh negatif.');
      return;
    }

    let updatedList: StandardBillItem[] = [];
    const nextObligations = { ...tempActiveObligations };

    if (editingStandardItem) {
      updatedList = standardItems.map(it => {
        if (it.id === editingStandardItem.id) {
          return {
            ...it,
            name: stdName.trim(),
            category: stdCategory as PaymentCategory,
            defaultAmount: stdAmount,
            frequency: stdFrequency,
            targetGrades: stdTargetGrades && stdTargetGrades.length > 0 ? stdTargetGrades : ['SEMUA'],
            description: stdDesc.trim(),
            isActive: stdIsActive,
            updatedAt: new Date().toISOString()
          };
        }
        return it;
      });
      nextObligations[editingStandardItem.id] = stdIsActive;

      // Synchronize with built-in tariffs if applicable
      if (onSaveTariffs) {
        const updatedTariffs = { ...tariffs };
        if (editingStandardItem.id === 'spp') updatedTariffs.sppMonthly = stdAmount;
        else if (editingStandardItem.id === 'gedung') updatedTariffs.uangGedung = stdAmount;
        else if (editingStandardItem.id === 'seragam') updatedTariffs.uangSeragam = stdAmount;
        else if (editingStandardItem.id === 'buku') updatedTariffs.uangBuku = stdAmount;
        else if (editingStandardItem.id === 'pts') updatedTariffs.biayaPTS = stdAmount;
        else if (editingStandardItem.id === 'sas') updatedTariffs.biayaSAS = stdAmount;
        else if (editingStandardItem.id === 'dat') updatedTariffs.biayaDAT = stdAmount;
        await onSaveTariffs(updatedTariffs);
      }
    } else {
      const newId = `std-pos-${Date.now()}`;
      const newItem: StandardBillItem = {
        id: newId,
        name: stdName.trim(),
        category: stdCategory as PaymentCategory,
        defaultAmount: stdAmount,
        frequency: stdFrequency,
        targetGrades: stdTargetGrades && stdTargetGrades.length > 0 ? stdTargetGrades : ['SEMUA'],
        description: stdDesc.trim(),
        isActive: stdIsActive,
        isBuiltIn: false,
        createdAt: new Date().toISOString()
      };
      updatedList = [...standardItems, newItem];
      nextObligations[newId] = stdIsActive;
    }

    setStandardItems(updatedList);
    setTempActiveObligations(nextObligations);
    setShowStandardBillModal(false);

    const updatedSettings: StudentBillSettings = {
      ...billSettings,
      activeObligations: nextObligations,
      standardBillingItems: updatedList,
      lastUpdated: new Date().toISOString()
    };
    await onSaveBillSettings(updatedSettings);

    setSaveSuccessMsg(editingStandardItem ? `Pos "${stdName}" berhasil diperbarui!` : `Pos pembayaran "${stdName}" berhasil ditambahkan!`);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Delete Standard Item
  const handleDeleteStandardItem = async () => {
    if (!itemToDelete) return;
    const updatedList = standardItems.filter(it => it.id !== itemToDelete.id);
    const nextObligations = { ...tempActiveObligations };
    nextObligations[itemToDelete.id] = false;

    setStandardItems(updatedList);
    setTempActiveObligations(nextObligations);
    setShowDeleteConfirm(false);
    setItemToDelete(null);

    const updatedSettings: StudentBillSettings = {
      ...billSettings,
      activeObligations: nextObligations,
      standardBillingItems: updatedList,
      lastUpdated: new Date().toISOString()
    };
    await onSaveBillSettings(updatedSettings);

    setSaveSuccessMsg(`Pos pembayaran "${itemToDelete.name}" berhasil dihapus.`);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Reset to default 7 items
  const handleResetDefaultStandardItems = async () => {
    if (!confirm('Kembalikan daftar pos pembayaran wajib ke 7 pos standar default madrasah?')) return;
    const defaultList: StandardBillItem[] = [
      {
        id: 'spp',
        key: 'spp',
        name: 'SPP Bulanan',
        category: 'SPP',
        defaultAmount: tariffs.sppMonthly || 175000,
        frequency: 'Bulanan',
        targetGrades: ['SEMUA'],
        description: 'Tarif kewajiban iuran bulanan peserta didik',
        isActive: true,
        isBuiltIn: true
      },
      {
        id: 'gedung',
        key: 'gedung',
        name: 'Infaq Gedung / Pembangunan',
        category: 'GEDUNG',
        defaultAmount: tariffs.uangGedung || 1500000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Infaq pembangunan sarana & prasarana madrasah',
        isActive: false,
        isBuiltIn: true
      },
      {
        id: 'seragam',
        key: 'seragam',
        name: 'Uang Seragam & Atribut',
        category: 'SERAGAM',
        defaultAmount: tariffs.uangSeragam || 750000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Paket seragam batik, olahraga, identitas madrasah & atribut',
        isActive: false,
        isBuiltIn: true
      },
      {
        id: 'buku',
        key: 'buku',
        name: 'Uang Buku / LKS / Modul',
        category: 'BUKU',
        defaultAmount: tariffs.uangBuku || 500000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Modul materi ajar & lembar kerja siswa satu tahun',
        isActive: false,
        isBuiltIn: true
      },
      {
        id: 'pts',
        key: 'pts',
        name: 'Biaya PTS (Tengah Semester)',
        category: 'PTS',
        defaultAmount: tariffs.biayaPTS || 175000,
        frequency: 'Per Semester',
        targetGrades: ['SEMUA'],
        description: 'Penilaian Tengah Semester & penyusunan naskah ujian',
        isActive: true,
        isBuiltIn: true
      },
      {
        id: 'sas',
        key: 'sas',
        name: 'Biaya SAS (Akhir Semester)',
        category: 'SAS',
        defaultAmount: tariffs.biayaSAS || 225000,
        frequency: 'Per Semester',
        targetGrades: ['SEMUA'],
        description: 'Sumatif Akhir Semester (SAS / PAS)',
        isActive: true,
        isBuiltIn: true
      },
      {
        id: 'dat',
        key: 'dat',
        name: 'Biaya DAT (Dana Akhir Tahun)',
        category: 'DAT',
        defaultAmount: tariffs.biayaDAT || 275000,
        frequency: 'Tahunan / Sekali Bayar',
        targetGrades: ['SEMUA'],
        description: 'Biaya evaluasi kenaikan kelas / kelulusan madrasah',
        isActive: false,
        isBuiltIn: true
      }
    ];

    const resetObligations = {
      spp: true,
      gedung: false,
      seragam: false,
      buku: false,
      pts: true,
      sas: true,
      dat: false
    };

    setStandardItems(defaultList);
    setTempActiveObligations(resetObligations);

    const updatedSettings: StudentBillSettings = {
      ...billSettings,
      activeObligations: resetObligations,
      standardBillingItems: defaultList,
      lastUpdated: new Date().toISOString()
    };
    await onSaveBillSettings(updatedSettings);

    setSaveSuccessMsg('Daftar pos pembayaran wajib berhasil dikembalikan ke standar default.');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Toggle Month
  const toggleSppMonth = (month: string) => {
    if (tempSppMonths.includes(month)) {
      setTempSppMonths(tempSppMonths.filter(m => m !== month));
    } else {
      setTempSppMonths([...tempSppMonths, month]);
    }
  };

  // Add Custom Bill
  const handleAddCustomBill = () => {
    if (!newBillTitle.trim() || newBillAmount <= 0) return;
    const newBill: CustomBillItem = {
      id: `cb-${Date.now()}`,
      title: newBillTitle.trim(),
      amount: newBillAmount,
      targetClass: newBillClass,
      dueDate: newBillDueDate,
      description: newBillDesc.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = [...customBills, newBill];
    setCustomBills(updated);
    setNewBillTitle('');
    setNewBillAmount(100000);
    setNewBillDesc('');
    setShowAddCustomBillModal(false);
  };

  const handleDeleteCustomBill = (id: string) => {
    setCustomBills(customBills.filter(cb => cb.id !== id));
  };

  // Save Student Override (Keringanan)
  const handleSaveKeringanan = async () => {
    if (!keringananStudentId) return;
    const student = students.find(s => s.id === keringananStudentId);
    const studentName = student ? student.name : 'Siswa';

    const updatedOverrides = {
      ...(billSettings.studentOverrides || {}),
      [keringananStudentId]: {
        ...keringananForm,
        studentId: keringananStudentId
      }
    };

    const updated: StudentBillSettings = {
      ...billSettings,
      studentOverrides: updatedOverrides,
      lastUpdated: new Date().toISOString()
    };

    await onSaveBillSettings(updated);
    setSaveSuccessMsg(`Data keringanan untuk ${studentName} berhasil disimpan!`);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const handleResetKeringanan = async (stId: string) => {
    const student = students.find(s => s.id === stId);
    const studentName = student ? student.name : 'Siswa';

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin me-reset pembayaran "${studentName}" menjadi REGULER?\n\nSiswa akan dihapus dari daftar penerima keringanan dan tagihannya kembali sesuai tarif standar madrasah.`
    );
    if (!confirmed) return;

    const updatedOverrides = { ...(billSettings.studentOverrides || {}) };
    delete updatedOverrides[stId];

    const updated: StudentBillSettings = {
      ...billSettings,
      studentOverrides: updatedOverrides,
      lastUpdated: new Date().toISOString()
    };

    // Explicitly reset the form state so UI immediately reflects regular state
    setKeringananForm(createDefaultKeringananForm(stId));

    await onSaveBillSettings(updated);

    // If detail modal is open for this student, recalculate
    if (selectedStudentForDetail && selectedStudentForDetail.student.id === stId && student) {
      const recalculated = calculateStudentArrears(student, payments, tariffs, updated, academicYear);
      setSelectedStudentForDetail(recalculated);
    }

    setSaveSuccessMsg(`Status pembayaran ${studentName} berhasil di-reset menjadi REGULER dan telah dihapus dari daftar penerima keringanan.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // List of students who currently have custom overrides
  const studentsWithOverrides = useMemo(() => {
    const overrides = billSettings.studentOverrides || {};
    return Object.keys(overrides)
      .map(id => {
        const student = students.find(s => s.id === id);
        return {
          student,
          override: overrides[id]
        };
      })
      .filter(item => item.student !== undefined);
  }, [billSettings, students]);

  // Send WhatsApp Notification to Parent
  const handleSendWhatsApp = (summary: StudentArrearsSummary) => {
    const st = summary.student;
    const phone = st.parentPhone || '';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const unpaidItems = summary.items.filter(i => !i.isPaid && i.remainingAmount > 0);
    const detailLines = unpaidItems.map(
      (item, idx) => `   ${idx + 1}. *${item.title}*: Rp ${item.remainingAmount.toLocaleString('id-ID')} (${item.details || 'Belum Lunas'})`
    ).join('\n');

    const bank = billSettings.paymentAccountInfo?.bankName || 'BSI';
    const norek = billSettings.paymentAccountInfo?.accountNumber || '-';
    const an = billSettings.paymentAccountInfo?.accountHolder || schoolOfficials?.namaSekolah || 'Madrasah';

    const messageText = 
`*PEMBERITAHUAN ADMINISTRASI KEUANGAN & TUNGGAKAN SISWA*
*${(schoolOfficials?.namaSekolah || 'MADRASAH').toUpperCase()}*
Tahun Pelajaran: ${academicYear} (${semester})
-----------------------------------------
Kepada Yth. 
*Orang Tua / Wali Siswa:*
Nama Siswa: *${st.name}*
Kelas: *${st.className}*
NISN: *${st.nisn || '-'}*
*Kode Unik Siswa:* *${st.kodeUnik || '-'}*

Menyampaikan informasi rincian administrasi keuangan siswa yang belum diselesaikan:

*RINCIAN POS TUNGGAKAN:*
${detailLines || '   (Tidak ada tunggakan)'}

-----------------------------------------
*TOTAL SISA TUNGGAKAN: Rp ${summary.totalRemaining.toLocaleString('id-ID')}*
-----------------------------------------

*PETUNJUK PEMBAYARAN:*
1. Pembayaran langsung di Madrasah ke Bendahara Keuangan.
2. Transfer Bank ke:
   - Bank: *${bank}*
   - No. Rekening: *${norek}*
   - Atas Nama: *${an}*
   - Berita: _${st.name} - Kelas ${st.className}_
3. Cek status keuangan mandiri melalui Portal Orang Tua dengan memasukkan Kode Unik Siswa: *${st.kodeUnik || '-'}*.

Mohon konfirmasi setelah melakukan pembayaran. Terima kasih atas perhatian dan kerjasamanya.

_Hormat kami,_
*Bendahara ${schoolOfficials?.namaSekolah || 'Madrasah'}*`;

    const encoded = encodeURIComponent(messageText);
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Print Official Arrears Notice Letter (Surat Pemberitahuan Tunggakan Resmi)
  const handlePrintOfficialLetter = (summary: StudentArrearsSummary) => {
    const st = summary.student;
    const unpaidItems = summary.items.filter(i => !i.isPaid && i.remainingAmount > 0);
    const bank = billSettings.paymentAccountInfo?.bankName || 'Bank Syariah Indonesia (BSI)';
    const norek = billSettings.paymentAccountInfo?.accountNumber || '7123456789';
    const an = billSettings.paymentAccountInfo?.accountHolder || schoolOfficials?.namaSekolah || 'Madrasah';

    const namaYayasan = schoolOfficials?.namaYayasan || 'YAYASAN PENDIDIKAN';
    const namaSekolah = schoolOfficials?.namaSekolah || 'MADRASAH TSANAWIYAH';
    const statusSekolah = schoolOfficials?.statusSekolah || 'Swasta';
    const akreditasi = schoolOfficials?.akreditasi || 'A (Unggul)';
    const nsm = schoolOfficials?.nsm || '121231730005';
    const npsn = schoolOfficials?.npsn || '20108921';
    const alamatSekolah = schoolOfficials?.alamatSekolah || 'Jl. Sandang No. 34';
    const rtRw = schoolOfficials?.rtRw ? `${schoolOfficials.rtRw}, ` : '';
    const kelurahan = schoolOfficials?.kelurahan ? `Kel. ${schoolOfficials.kelurahan}, ` : '';
    const kecamatan = schoolOfficials?.kecamatan ? `Kec. ${schoolOfficials.kecamatan}, ` : '';
    const kotaSekolah = schoolOfficials?.kotaSekolah || 'Jakarta Barat';
    const provinsi = schoolOfficials?.provinsi || 'DKI Jakarta';
    const kodePos = schoolOfficials?.kodePos || '11480';
    const teleponSekolah = schoolOfficials?.teleponSekolah || '(021) 5321855';
    const whatsappSekolah = schoolOfficials?.whatsappSekolah || '0812-3456-7890';
    const emailSekolah = schoolOfficials?.emailSekolah || 'mtsmanbaulislam@gmail.com';
    const website = schoolOfficials?.website || 'https://mtsmanbaulislam.sch.id';
    const logoUrl = schoolOfficials?.logoUrl || '';

    const fullSchoolAddress = `${alamatSekolah}, ${rtRw}${kelurahan}${kecamatan}${kotaSekolah} - ${provinsi} ${kodePos}`;

    const letterHtml = `
      <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 25px; max-width: 800px; margin: 0 auto; line-height: 1.5;">
        <!-- KOP SURAT RESMI -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 8px; gap: 12px; margin-bottom: 2px;">
          ${logoUrl ? `
            <div style="width: 75px; height: 75px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <img src="${logoUrl}" alt="Logo" style="max-height: 75px; max-width: 75px; object-fit: contain;" />
            </div>
          ` : ''}
          <div style="flex: 1; text-align: center;">
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #111;">
              ${namaYayasan}
            </div>
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-top: 2px; color: #000; letter-spacing: 0.5px;">
              ${namaSekolah}
            </div>
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: bold; color: #333; text-transform: uppercase; margin-top: 2px;">
              STATUS: ${statusSekolah} • AKREDITASI: ${akreditasi} • NSM: ${nsm || '-'} • NPSN: ${npsn || '-'}
            </div>
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #222; margin-top: 3px; line-height: 1.3;">
              ${fullSchoolAddress}
            </div>
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #444; margin-top: 2px;">
              Telp: ${teleponSekolah || '-'} • WA: ${whatsappSekolah || '-'} • Email: ${emailSekolah || '-'} • Website: ${website || '-'}
            </div>
          </div>
          ${logoUrl ? `
            <div style="width: 75px; flex-shrink: 0;"></div>
          ` : ''}
        </div>
        <!-- Garis Ganda Kop Surat -->
        <div style="border-bottom: 1px solid #000; margin-top: 2px; margin-bottom: 18px;"></div>

        <!-- NOMOR SURAT & PERIHAL -->
        <table style="width: 100%; font-size: 12px; margin-bottom: 15px;">
          <tr>
            <td style="width: 15%;">Nomor</td>
            <td style="width: 45%;">: ${Math.floor(100 + Math.random() * 900)}/MTs.MI/Keu/${new Date().getFullYear()}</td>
            <td style="width: 40%; text-align: right;">Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td>Lampiran</td>
            <td>: 1 (Satu) Berkas Rincian</td>
            <td></td>
          </tr>
          <tr>
            <td>Perihal</td>
            <td>: <strong>Pemberitahuan Tunggakan Administrasi Keuangan</strong></td>
            <td></td>
          </tr>
        </table>

        <div style="font-size: 12px; margin-bottom: 15px;">
          <p style="margin: 0;">Kepada Yth.</p>
          <p style="margin: 2px 0 0;"><strong>Bapak / Ibu Orang Tua / Wali dari:</strong></p>
          <table style="margin-left: 15px; font-size: 12px; margin-top: 4px;">
            <tr><td style="width: 130px;">Nama Siswa</td><td>: <strong>${st.name}</strong></td></tr>
            <tr><td>Kelas</td><td>: ${st.className}</td></tr>
            <tr><td>NISN</td><td>: ${st.nisn || '-'}</td></tr>
            <tr><td>Kode Akses Portal</td><td>: <strong>${st.kodeUnik || '-'}</strong></td></tr>
          </table>
          <p style="margin: 4px 0 0 15px;">di Tempat</p>
        </div>

        <div style="font-size: 12px; text-align: justify; margin-bottom: 15px;">
          <p style="margin: 0 0 10px; text-indent: 30px;">
            <em>Assalamu’alaikum Warahmatullahi Wabarakatuh.</em>
          </p>
          <p style="margin: 0 0 10px; text-indent: 30px;">
            Puji syukur kehadirat Allah SWT, semoga Bapak/Ibu senantiasa dalam limpahan rahmat dan hidayah-Nya. 
            Sehubungan dengan kelancaran kegiatan belajar mengajar serta evaluasi pembelajaran Tahun Pelajaran <strong>${academicYear}</strong> (${semester}), 
            kami sampaikan informasi rekapitulasi kewajiban administrasi keuangan yang masih belum diselesaikan sebagai berikut:
          </p>
        </div>

        <!-- TABEL RINCIAN TUNGGAKAN -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;" border="1" cellPadding="6">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: center;">
              <th style="width: 6%;">No</th>
              <th style="text-align: left;">Pos Pembayaran / Keterangan</th>
              <th style="width: 20%; text-align: right;">Kewajiban Tagihan</th>
              <th style="width: 20%; text-align: right;">Telah Dibayar</th>
              <th style="width: 22%; text-align: right;">Sisa Tunggakan</th>
            </tr>
          </thead>
          <tbody>
            ${summary.items.map((item, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>
                  <strong>${item.title}</strong>
                  ${item.details ? `<br/><span style="font-size: 10px; color: #475569;">${item.details}</span>` : ''}
                </td>
                <td style="text-align: right;">Rp ${item.billAmount.toLocaleString('id-ID')}</td>
                <td style="text-align: right; color: #047857;">Rp ${item.paidAmount.toLocaleString('id-ID')}</td>
                <td style="text-align: right; font-weight: bold; color: ${item.remainingAmount > 0 ? '#b91c1c' : '#047857'};">
                  ${item.remainingAmount > 0 ? `Rp ${item.remainingAmount.toLocaleString('id-ID')}` : 'Lunas (Rp 0)'}
                </td>
              </tr>
            `).join('')}
            <tr style="background-color: #f8fafc; font-weight: bold;">
              <td colspan="4" style="text-align: right; padding-right: 12px;">TOTAL KEKURANGAN / SISA TUNGGAKAN :</td>
              <td style="text-align: right; font-size: 12px; color: #b91c1c;">Rp ${summary.totalRemaining.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <!-- PETUNJUK PEMBAYARAN -->
        <div style="font-size: 11px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; font-weight: bold;">Informasi & Rekening Pembayaran:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Pembayaran Tunai langsung di Kantor Tata Usaha / Kasir Bendahara Madrasah setiap hari kerja.</li>
            <li>Pembayaran Non-Tunai / Transfer: <strong>${bank}</strong>, No. Rek: <strong>${norek}</strong> a/n <strong>${an}</strong>.</li>
            <li>Harap menyertakan bukti transfer dan mengonfirmasi ke nomor WhatsApp Bendahara: <strong>${billSettings.paymentAccountInfo?.contactPersonPhone || '081234567890'}</strong>.</li>
            <li>Orang tua dapat memantau status pembayaran real-time di <strong>Portal Siswa</strong> menggunakan Kode Unik: <strong>${st.kodeUnik || '-'}</strong>.</li>
          </ul>
        </div>

        <p style="font-size: 12px; margin: 0 0 30px; text-indent: 30px;">
          Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian, pengertian, dan kerjasamanya kami ucapkan terima kasih.
          <em>Wassalamu’alaikum Warahmatullahi Wabarakatuh.</em>
        </p>

        <!-- TANDA TANGAN -->
        <table style="width: 100%; font-size: 12px; text-align: center;">
          <tr>
            <td style="width: 50%;">
              Mengetahui,<br/>
              <strong>Kepala Madrasah</strong>
              <br/><br/><br/><br/>
              <strong>${schoolOfficials?.kepalaSekolah?.name || 'Kepala Madrasah'}</strong><br/>
              NIP: ${schoolOfficials?.kepalaSekolah?.nip || '-'}
            </td>
            <td style="width: 50%;">
              Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
              <strong>Bendahara Madrasah</strong>
              <br/><br/><br/><br/>
              <strong>${schoolOfficials?.bendahara?.name || schoolOfficials?.bendaharaUtama?.name || 'Bendahara Madrasah'}</strong><br/>
              NIP: ${schoolOfficials?.bendahara?.nip || schoolOfficials?.bendaharaUtama?.nip || '-'}
            </td>
          </tr>
        </table>
      </div>
    `;

    printHtmlString(`Surat_Tunggakan_${st.name}_${st.className}`, letterHtml);
  };

  // Print Class Arrears Recap
  const handlePrintClassRecap = () => {
    const titleClass = selectedClass === 'ALL' ? 'SEMUA KELAS' : `KELAS ${selectedClass}`;
    const recapHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <div style="text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px;">REKAPITULASI STATUS PEMBAYARAN & TUNGGAKAN SISWA</h2>
          <h3 style="margin: 4px 0 0; font-size: 14px; color: #475569;">MTs MANBAUL ISLAM • ${titleClass}</h3>
          <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">Tahun Pelajaran ${academicYear} • ${semester} • Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;" border="1" cellPadding="5">
          <thead style="background-color: #f1f5f9;">
            <tr>
              <th style="width: 4%;">No</th>
              <th style="text-align: left;">Nama Siswa</th>
              <th style="width: 8%;">Kelas</th>
              <th style="width: 10%;">Kode Unik</th>
              <th style="width: 12%;">SPP (Lunas)</th>
              <th style="width: 15%; text-align: right;">Total Kewajiban</th>
              <th style="width: 15%; text-align: right;">Telah Dibayar</th>
              <th style="width: 15%; text-align: right;">Sisa Tunggakan</th>
              <th style="width: 11%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSummaries.map((s, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${s.student.name}</strong></td>
                <td style="text-align: center;">${s.student.className}</td>
                <td style="text-align: center; font-family: monospace;">${s.student.kodeUnik || '-'}</td>
                <td style="text-align: center;">${s.sppPaidMonthsCount}/${s.sppTotalMonthsCount} Bln</td>
                <td style="text-align: right;">Rp ${s.totalBill.toLocaleString('id-ID')}</td>
                <td style="text-align: right; color: #047857;">Rp ${s.totalPaid.toLocaleString('id-ID')}</td>
                <td style="text-align: right; font-weight: bold; color: ${s.totalRemaining > 0 ? '#b91c1c' : '#047857'};">
                  Rp ${s.totalRemaining.toLocaleString('id-ID')}
                </td>
                <td style="text-align: center; font-weight: bold; color: ${s.isAllPaid ? '#047857' : '#b91c1c'};">
                  ${s.isAllPaid ? 'LUNAS' : 'MENUNGGAK'}
                </td>
              </tr>
            `).join('')}
            <tr style="background-color: #e2e8f0; font-weight: bold;">
              <td colspan="5" style="text-align: right;">TOTAL KESELURUHAN :</td>
              <td style="text-align: right;">Rp ${stats.totalBillSum.toLocaleString('id-ID')}</td>
              <td style="text-align: right; color: #047857;">Rp ${stats.totalPaidSum.toLocaleString('id-ID')}</td>
              <td style="text-align: right; color: #b91c1c;">Rp ${stats.totalRemainingSum.toLocaleString('id-ID')}</td>
              <td style="text-align: center;">${stats.lunasCount} Lunas / ${stats.nunggakCount} Nunggak</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 30px;">
          <div>
            <p>Catatan:</p>
            <p style="color: #64748b; font-size: 10px;">Laporan ini dihasilkan secara otomatis dari Sistem Administrasi Keuangan ${schoolOfficials?.namaSekolah || 'Madrasah'}.</p>
          </div>
          <div style="text-align: right;">
            <p>Bendahara Madrasah,</p>
            <br/><br/>
            <p><strong>${schoolOfficials?.bendahara?.name || schoolOfficials?.bendaharaUtama?.name || 'Bendahara Madrasah'}</strong></p>
          </div>
        </div>
      </div>
    `;

    printHtmlString(`Rekap_Tunggakan_${titleClass}`, recapHtml);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-800/40">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                Fitur Transparansi Tagihan
              </span>
              <span className="text-xs text-slate-300 font-medium">TP {academicYear}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
              Manajemen Tagihan & Tunggakan Siswa
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Atur pos kewajiban bayar, beasiswa/diskon khusus, dan sinkronisasi transparansi ke Kode Unik Portal Orang Tua
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setActiveView('monitoring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer ${
              activeView === 'monitoring'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Monitoring Tunggakan ({allStudentSummaries.length})</span>
          </button>

          <button
            onClick={() => setActiveView('global_config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer ${
              activeView === 'global_config'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>2. Atur Kewajiban & Pos Biaya</span>
          </button>

          <button
            onClick={() => {
              setActiveView('keringanan');
              if (!keringananStudentId && students.length > 0) {
                handleKeringananClassChange(keringananClass);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer ${
              activeView === 'keringanan'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. Beasiswa & Keringanan ({studentsWithOverrides.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: MONITORING & REKAP TUNGGAKAN SISWA */}
      {/* ========================================================================= */}
      {activeView === 'monitoring' && (
        <div className="space-y-6">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa Binaan</p>
                <h3 className="text-lg font-black text-slate-900">{stats.totalStudents} Siswa</h3>
                <p className="text-[10px] text-slate-500">{selectedClass === 'ALL' ? 'Semua Rombel' : `Kelas ${selectedClass}`}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Status Lunas Penuh</p>
                <h3 className="text-lg font-black text-emerald-700">{stats.lunasCount} Siswa</h3>
                <p className="text-[10px] text-emerald-600 font-semibold">{Math.round((stats.lunasCount / (stats.totalStudents || 1)) * 100)}% Lunas</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Ada Sisa Tunggakan</p>
                <h3 className="text-lg font-black text-rose-700">{stats.nunggakCount} Siswa</h3>
                <p className="text-[10px] text-rose-600 font-semibold">Perlu Penyelesaian</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Akumulasi Tunggakan</p>
                <h3 className="text-base sm:text-lg font-black text-amber-900">
                  Rp {stats.totalRemainingSum.toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] text-slate-500">Terbayar: Rp {stats.totalPaidSum.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Sync Alert Banner if there are fixable/orphaned payments */}
          {unsyncedStats.fixableCount > 0 && !isBannerDismissed && (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
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
                    handleExecuteSync();
                  }}
                  disabled={isSyncing}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
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

          {/* Filter Bar & Action Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, NISN, kode unik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Kelas ({students.length})</option>
                {classList.map(c => (
                  <option key={c} value={c}>Kelas {c} ({students.filter(s => s.className === c).length})</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="NUNGGAK">Hanya Yang Menunggak ({stats.nunggakCount})</option>
                <option value="LUNAS">Hanya Yang Lunas ({stats.lunasCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowSyncModal(true);
                  if (!syncFeedback) {
                    handleExecuteSync();
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                title="Sinkronkan kembali riwayat pembayaran lama dengan data siswa yang baru diinput"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Sinkronkan Riwayat Bayar</span>
              </button>

              <button
                type="button"
                onClick={handlePrintClassRecap}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap Tunggakan</span>
              </button>
            </div>
          </div>

          {/* Arrears Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-10">No</th>
                    <th className="py-3 px-4">Nama Siswa & Identitas</th>
                    <th className="py-3 px-3 text-center">Kelas</th>
                    <th className="py-3 px-3 text-center">Kode Unik Portal</th>
                    <th className="py-3 px-3 text-center">SPP Terbayar</th>
                    <th className="py-3 px-4 text-right">Total Kewajiban</th>
                    <th className="py-3 px-4 text-right">Total Terbayar</th>
                    <th className="py-3 px-4 text-right">Sisa Tunggakan</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi / Layanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-sm">Tidak ada data siswa yang cocok dengan filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSummaries.map((summary, idx) => {
                      const st = summary.student;
                      const isLunas = summary.isAllPaid;
                      const hasOverride = !!billSettings.studentOverrides?.[st.id];

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="font-extrabold text-slate-900">
                                {st.name}
                              </div>
                              {hasOverride && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-300" title="Ada penyesuaian/beasiswa">
                                  Keringanan
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              NISN: {st.nisn || '-'} • NIS: {st.nis || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {st.className}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-indigo-700 bg-indigo-50/50">
                            {st.kodeUnik || '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              summary.sppPaidMonthsCount === summary.sppTotalMonthsCount
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {summary.sppPaidMonthsCount}/{summary.sppTotalMonthsCount} Bulan
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">
                            Rp {summary.totalBill.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">
                            Rp {summary.totalPaid.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-black">
                            <span className={isLunas ? 'text-emerald-600' : 'text-rose-600 text-xs'}>
                              {isLunas ? 'Rp 0' : `Rp ${summary.totalRemaining.toLocaleString('id-ID')}`}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isLunas ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                                ✓ Lunas
                              </span>
                            ) : (
                              <span className="bg-rose-100 text-rose-800 border border-rose-200 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                                Menunggak
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Detail Modal Button */}
                              <button
                                onClick={() => setSelectedStudentForDetail(summary)}
                                title="Lihat Rincian Pos Tagihan"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp Notification Button */}
                              <button
                                onClick={() => handleSendWhatsApp(summary)}
                                title="Kirim Tagihan ke WhatsApp Orang Tua"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              </button>

                              {/* Official Letter Print Button */}
                              <button
                                onClick={() => handlePrintOfficialLetter(summary)}
                                title="Cetak Surat Pemberitahuan Tunggakan Resmi"
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: GLOBAL BILL OBLIGATIONS & POS BIAYA CONFIGURATION */}
      {/* ========================================================================= */}
      {activeView === 'global_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Global Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Checklist Pos Tagihan Wajib */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-black text-slate-900">1. Pos Pembayaran Wajib (Standard Billing Items)</h2>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {standardItems.length} Pos
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Kelola pos pembayaran standar, tarif default, dan centang pos yang wajib ditagihkan ke siswa</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetDefaultStandardItems}
                    title="Kembalikan ke 7 pos standar bawaan sistem"
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddStandardItem}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pos Wajib</span>
                  </button>
                </div>
              </div>

              {standardItems.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
                  <p className="font-bold text-xs text-slate-600">Belum ada pos pembayaran wajib</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tambahkan pos pembayaran baru atau klik tombol Reset Default</p>
                  <button
                    type="button"
                    onClick={handleResetDefaultStandardItems}
                    className="mt-3 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Muat 7 Pos Standar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {standardItems.map((item) => {
                    const isActive = tempActiveObligations[item.id] !== undefined ? tempActiveObligations[item.id] : item.isActive;
                    return (
                      <div
                        key={item.id}
                        className={`group relative flex items-start justify-between p-3.5 rounded-xl border transition ${
                          isActive
                            ? 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/50'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 opacity-75'
                        }`}
                      >
                        <div className="flex items-start space-x-3 flex-1 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleToggleStandardItem(item.id)}
                            className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            id={`check-std-${item.id}`}
                          />
                          <label htmlFor={`check-std-${item.id}`} className="cursor-pointer flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-extrabold text-xs text-slate-900 truncate">
                                {item.name}
                              </span>
                              {item.category && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-indigo-700 mt-0.5">
                              Tarif: Rp {(item.defaultAmount || 0).toLocaleString('id-ID')}
                              <span className="text-slate-500 font-normal text-[10px] ml-1">
                                ({item.frequency || 'Sekali Bayar'})
                              </span>
                            </div>
                            <div className="mt-1 flex items-center space-x-1.5 flex-wrap">
                              <span className={`inline-flex items-center space-x-1 text-[9px] font-black px-2 py-0.5 rounded-md border ${
                                !item.targetGrades || item.targetGrades.length === 0 || item.targetGrades.includes('SEMUA') || item.targetGrades.includes('ALL')
                                  ? 'bg-blue-50/80 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                <span>🎯</span>
                                <span>{formatTargetGradesLabel(item.targetGrades)}</span>
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </label>
                        </div>

                        {/* Action buttons (Edit & Delete) */}
                        <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditStandardItem(item);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                            title="Edit Pos Pembayaran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                            title="Hapus Pos Pembayaran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Pemilihan Bulan Tagihan SPP */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900">2. Kalender Bulan Penagihan SPP</h2>
                  <p className="text-xs text-slate-500">Pilih bulan apa saja yang wajib ditagihkan di tahun pelajaran aktif ini</p>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setTempSppMonths(MONTHS_LIST)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Pilih 12 Bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempSppMonths(MONTHS_LIST.slice(0, 6))}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Ganjil Saja
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {MONTHS_LIST.map((m, idx) => {
                  const isSelected = tempSppMonths.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleSppMonth(m)}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold transition flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[10px] opacity-75">{idx < 6 ? 'Smt Ganjil' : 'Smt Genap'}</span>
                      <span className="mt-0.5">{m}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Terpilih: <strong>{tempSppMonths.length} bulan</strong> (Total kewajiban SPP standar per siswa: Rp {(tempSppMonths.length * (tariffs.sppMonthly || 150000)).toLocaleString('id-ID')})
              </p>
            </div>

            {/* 3. Tagihan Khusus Tambahan (Custom Bills) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900">3. Tagihan Khusus / Tambahan Madrasah</h2>
                  <p className="text-xs text-slate-500">Buat tagihan khusus seperti Wisuda Kelas IX, Outing Class/Rihlah, Iuran Qurban, dll</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomBillModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tagihan Khusus</span>
                </button>
              </div>

              {customBills.length === 0 ? (
                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <DollarSign className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <p className="text-xs font-semibold">Belum ada tagihan khusus tambahan</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customBills.map((cb) => (
                    <div key={cb.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-slate-900">{cb.title}</span>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.2 rounded">
                            {cb.targetClass === 'ALL' || !cb.targetClass ? 'Semua Kelas' : `Khusus Kelas ${cb.targetClass}`}
                          </span>
                        </div>
                        {cb.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{cb.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Nominal: <strong className="text-slate-700">Rp {cb.amount.toLocaleString('id-ID')}</strong>
                          {cb.dueDate && ` • Jatuh tempo: ${cb.dueDate}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomBill(cb.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus tagihan khusus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Global Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveGlobalConfig}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Kewajiban Tagihan</span>
              </button>
            </div>
          </div>

          {/* Right Column: Bank Account & Payment Instructions */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Rekening Madrasah & Info Pembayaran</span>
                </h2>
                <p className="text-xs text-slate-500">Tampil di portal orang tua sebagai petunjuk transfer & pembayaran resmi</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Bank / Lembaga Keuangan</label>
                  <input
                    type="text"
                    value={tempPaymentAccount.bankName || ''}
                    onChange={(e) => setTempPaymentAccount({ ...tempPaymentAccount, bankName: e.target.value })}
                    placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={tempPaymentAccount.accountNumber || ''}
                    onChange={(e) => setTempPaymentAccount({ ...tempPaymentAccount, accountNumber: e.target.value })}
                    placeholder="Contoh: 7123456789"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Atas Nama Rekening</label>
                  <input
                    type="text"
                    value={tempPaymentAccount.accountHolder || ''}
                    onChange={(e) => setTempPaymentAccount({ ...tempPaymentAccount, accountHolder: e.target.value })}
                    placeholder="Contoh: MTs MANBAUL ISLAM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">No. WhatsApp Bendahara (Konfirmasi)</label>
                  <input
                    type="text"
                    value={tempPaymentAccount.contactPersonPhone || ''}
                    onChange={(e) => setTempPaymentAccount({ ...tempPaymentAccount, contactPersonPhone: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Instruksi Pembayaran untuk Orang Tua</label>
                  <textarea
                    rows={3}
                    value={tempPaymentAccount.paymentInstructions || ''}
                    onChange={(e) => setTempPaymentAccount({ ...tempPaymentAccount, paymentInstructions: e.target.value })}
                    placeholder="Tuliskan petunjuk transfer..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Preview Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-emerald-700/40">
              <div className="flex items-center space-x-2 text-emerald-300 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Preview Tampilan Rekening di Portal Ortu</span>
              </div>
              <p className="text-sm font-black">{tempPaymentAccount.bankName || 'BSI'}</p>
              <p className="text-base font-mono font-extrabold text-amber-300 tracking-wider my-0.5">
                {tempPaymentAccount.accountNumber || '7123456789'}
              </p>
              <p className="text-[11px] text-emerald-200">a/n {tempPaymentAccount.accountHolder || 'MTs MANBAUL ISLAM'}</p>
              <p className="text-[10px] text-slate-300 mt-2 border-t border-emerald-800/60 pt-2 line-clamp-2">
                {tempPaymentAccount.paymentInstructions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: BEASISWA & KERINGANAN KHUSUS PER SISWA */}
      {/* ========================================================================= */}
      {activeView === 'keringanan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Input Keringanan Siswa */}
          <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Form Pengaturan Keringanan / Beasiswa Siswa</h2>
              <p className="text-xs text-slate-500">Sesuaikan potongan atau pembebasan biaya untuk siswa yatim, dhuafa, atau beasiswa berprestasi</p>
            </div>

            {/* Select Student */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1. Pilih Kelas</label>
                <select
                  value={keringananClass}
                  onChange={(e) => handleKeringananClassChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold cursor-pointer"
                >
                  {classList.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">2. Pilih Siswa</label>
                <select
                  value={keringananStudentId}
                  onChange={(e) => loadKeringananForStudent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-indigo-700 cursor-pointer"
                >
                  {students.filter(s => s.className === keringananClass).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.rollNo}. {s.name} (Kode: {s.kodeUnik || '-'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keringanan Options */}
            {keringananStudentId && (
              <div className="space-y-4 pt-2 border-t border-slate-100">

                {/* Quick Presets for Instant 1-Click Setup */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tombol Cepat / Template Keringanan:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setKeringananForm({
                          studentId: keringananStudentId,
                          sppExempt: true,
                          sppDiscountPercent: 0,
                          sppDiscountFixed: 0,
                          gedungExempt: true,
                          gedungDiscountPercent: 0,
                          gedungDiscountFixed: 0,
                          seragamExempt: true,
                          seragamDiscountPercent: 0,
                          seragamDiscountFixed: 0,
                          bukuExempt: true,
                          bukuDiscountPercent: 0,
                          bukuDiscountFixed: 0,
                          ptsExempt: true,
                          ptsDiscountPercent: 0,
                          ptsDiscountFixed: 0,
                          sasExempt: true,
                          sasDiscountPercent: 0,
                          sasDiscountFixed: 0,
                          datExempt: true,
                          datDiscountPercent: 0,
                          datDiscountFixed: 0,
                          customNote: 'Siswa Yatim Piatu / Dhuafa (Bebas Biaya Total 100%)'
                        });
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                    >
                      🌟 Yatim Piatu (Gratis 100% Semua Pos)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setKeringananForm({
                          studentId: keringananStudentId,
                          sppExempt: true,
                          sppDiscountPercent: 0,
                          sppDiscountFixed: 0,
                          gedungExempt: false,
                          gedungDiscountPercent: 50,
                          gedungDiscountFixed: 0,
                          seragamExempt: false,
                          seragamDiscountPercent: 0,
                          seragamDiscountFixed: 0,
                          bukuExempt: false,
                          bukuDiscountPercent: 0,
                          bukuDiscountFixed: 0,
                          ptsExempt: false,
                          ptsDiscountPercent: 0,
                          ptsDiscountFixed: 0,
                          sasExempt: false,
                          sasDiscountPercent: 0,
                          sasDiscountFixed: 0,
                          datExempt: false,
                          datDiscountPercent: 0,
                          datDiscountFixed: 0,
                          customNote: 'Anak Yatim - Keringanan SPP Penuh 100% & Infaq Gedung 50%'
                        });
                      }}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                    >
                      🕌 Anak Yatim (Bebas SPP 100% + Gedung 50%)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setKeringananForm({
                          studentId: keringananStudentId,
                          sppExempt: false,
                          sppDiscountPercent: 50,
                          sppDiscountFixed: 0,
                          gedungExempt: false,
                          gedungDiscountPercent: 50,
                          gedungDiscountFixed: 0,
                          seragamExempt: false,
                          seragamDiscountPercent: 50,
                          seragamDiscountFixed: 0,
                          bukuExempt: false,
                          bukuDiscountPercent: 50,
                          bukuDiscountFixed: 0,
                          ptsExempt: false,
                          ptsDiscountPercent: 50,
                          ptsDiscountFixed: 0,
                          sasExempt: false,
                          sasDiscountPercent: 50,
                          sasDiscountFixed: 0,
                          datExempt: false,
                          datDiscountPercent: 50,
                          datDiscountFixed: 0,
                          customNote: 'Keluarga Dhuafa / Kurang Mampu (Diskon 50% Seluruh Pos Biaya)'
                        });
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                    >
                      🤝 Dhuafa (Diskon 50% Semua Pos)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setKeringananForm({
                          studentId: keringananStudentId,
                          sppExempt: true,
                          sppDiscountPercent: 0,
                          sppDiscountFixed: 0,
                          gedungExempt: false,
                          gedungDiscountPercent: 0,
                          gedungDiscountFixed: 0,
                          seragamExempt: false,
                          seragamDiscountPercent: 0,
                          seragamDiscountFixed: 0,
                          bukuExempt: false,
                          bukuDiscountPercent: 0,
                          bukuDiscountFixed: 0,
                          ptsExempt: true,
                          ptsDiscountPercent: 0,
                          ptsDiscountFixed: 0,
                          sasExempt: true,
                          sasDiscountPercent: 0,
                          sasDiscountFixed: 0,
                          datExempt: false,
                          datDiscountPercent: 0,
                          datDiscountFixed: 0,
                          customNote: 'Beasiswa Tahfidz & Prestasi Akademik'
                        });
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                    >
                      🏆 Beasiswa Prestasi (Bebas SPP & Ujian)
                    </button>
                  </div>
                </div>
                
                {/* SPP Keringanan */}
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-indigo-950">A. Keringanan SPP Bulanan</span>
                    <span className="text-[10px] text-indigo-700 font-bold">
                      Tarif Tingkat {getGradeFromClassName(keringananClass)}: Rp {getSppTariffForGrade(tariffs, keringananClass).toLocaleString('id-ID')}/bln
                    </span>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keringananForm.sppExempt || false}
                      onChange={(e) => setKeringananForm({ ...keringananForm, sppExempt: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Bebas SPP Penuh (Beasiswa 100% / Yatim Dhuafa)
                    </span>
                  </label>

                  {!keringananForm.sppExempt && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Diskon Persentase (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={keringananForm.sppDiscountPercent || 0}
                          onChange={(e) => setKeringananForm({ ...keringananForm, sppDiscountPercent: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          placeholder="Misal 50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Atau Potongan Tetap (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={keringananForm.sppDiscountFixed || 0}
                          onChange={(e) => setKeringananForm({ ...keringananForm, sppDiscountFixed: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          placeholder="Misal 50000"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pembebasan & Potongan Pos Biaya Lainnya */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">
                        B. Pembebasan & Potongan Pos Biaya Lainnya
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Centang bebas biaya 100% atau masukkan persentase diskon (%) / potongan tetap (Rp) per pos biaya.
                      </p>
                    </div>

                    {/* Quick batch tools for point B */}
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">Terapkan Semua:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setKeringananForm(prev => ({
                            ...prev,
                            gedungExempt: true,
                            seragamExempt: true,
                            bukuExempt: true,
                            ptsExempt: true,
                            sasExempt: true,
                            datExempt: true,
                            gedungDiscountPercent: 0,
                            gedungDiscountFixed: 0,
                            seragamDiscountPercent: 0,
                            seragamDiscountFixed: 0,
                            bukuDiscountPercent: 0,
                            bukuDiscountFixed: 0,
                            ptsDiscountPercent: 0,
                            ptsDiscountFixed: 0,
                            sasDiscountPercent: 0,
                            sasDiscountFixed: 0,
                            datDiscountPercent: 0,
                            datDiscountFixed: 0
                          }));
                        }}
                        className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Bebas 100%
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setKeringananForm(prev => ({
                            ...prev,
                            gedungExempt: false,
                            seragamExempt: false,
                            bukuExempt: false,
                            ptsExempt: false,
                            sasExempt: false,
                            datExempt: false,
                            gedungDiscountPercent: 50,
                            gedungDiscountFixed: 0,
                            seragamDiscountPercent: 50,
                            seragamDiscountFixed: 0,
                            bukuDiscountPercent: 50,
                            bukuDiscountFixed: 0,
                            ptsDiscountPercent: 50,
                            ptsDiscountFixed: 0,
                            sasDiscountPercent: 50,
                            sasDiscountFixed: 0,
                            datDiscountPercent: 50,
                            datDiscountFixed: 0
                          }));
                        }}
                        className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Diskon 50%
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setKeringananForm(prev => ({
                            ...prev,
                            gedungExempt: false,
                            seragamExempt: false,
                            bukuExempt: false,
                            ptsExempt: false,
                            sasExempt: false,
                            datExempt: false,
                            gedungDiscountPercent: 25,
                            gedungDiscountFixed: 0,
                            seragamDiscountPercent: 25,
                            seragamDiscountFixed: 0,
                            bukuDiscountPercent: 25,
                            bukuDiscountFixed: 0,
                            ptsDiscountPercent: 25,
                            ptsDiscountFixed: 0,
                            sasDiscountPercent: 25,
                            sasDiscountFixed: 0,
                            datDiscountPercent: 25,
                            datDiscountFixed: 0
                          }));
                        }}
                        className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Diskon 25%
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setKeringananForm(prev => ({
                            ...prev,
                            gedungExempt: false,
                            seragamExempt: false,
                            bukuExempt: false,
                            ptsExempt: false,
                            sasExempt: false,
                            datExempt: false,
                            gedungDiscountPercent: 0,
                            gedungDiscountFixed: 0,
                            seragamDiscountPercent: 0,
                            seragamDiscountFixed: 0,
                            bukuDiscountPercent: 0,
                            bukuDiscountFixed: 0,
                            ptsDiscountPercent: 0,
                            ptsDiscountFixed: 0,
                            sasDiscountPercent: 0,
                            sasDiscountFixed: 0,
                            datDiscountPercent: 0,
                            datDiscountFixed: 0
                          }));
                        }}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Reset (0%)
                      </button>
                    </div>
                  </div>
                  
                  {/* Detailed fee items grid */}
                  <div className="space-y-3">
                    {[
                      {
                        key: 'gedung',
                        name: 'Infaq Gedung / Pembangunan',
                        icon: '🏛️',
                        baseTariff: tariffs.uangGedung || 1200000,
                        exempt: Boolean(keringananForm.gedungExempt),
                        percent: keringananForm.gedungDiscountPercent || 0,
                        fixed: keringananForm.gedungDiscountFixed || 0,
                        onToggleExempt: (checked: boolean) => setKeringananForm(prev => ({ ...prev, gedungExempt: checked })),
                        onChangePercent: (pct: number) => setKeringananForm(prev => ({ ...prev, gedungDiscountPercent: pct })),
                        onChangeFixed: (fixed: number) => setKeringananForm(prev => ({ ...prev, gedungDiscountFixed: fixed }))
                      },
                      {
                        key: 'seragam',
                        name: 'Uang Seragam & Atribut',
                        icon: '👔',
                        baseTariff: tariffs.uangSeragam || 650000,
                        exempt: Boolean(keringananForm.seragamExempt),
                        percent: keringananForm.seragamDiscountPercent || 0,
                        fixed: keringananForm.seragamDiscountFixed || 0,
                        onToggleExempt: (checked: boolean) => setKeringananForm(prev => ({ ...prev, seragamExempt: checked })),
                        onChangePercent: (pct: number) => setKeringananForm(prev => ({ ...prev, seragamDiscountPercent: pct })),
                        onChangeFixed: (fixed: number) => setKeringananForm(prev => ({ ...prev, seragamDiscountFixed: fixed }))
                      },
                      {
                        key: 'buku',
                        name: 'Uang Buku & Modul / LKS',
                        icon: '📚',
                        baseTariff: tariffs.uangBuku || 400000,
                        exempt: Boolean(keringananForm.bukuExempt),
                        percent: keringananForm.bukuDiscountPercent || 0,
                        fixed: keringananForm.bukuDiscountFixed || 0,
                        onToggleExempt: (checked: boolean) => setKeringananForm(prev => ({ ...prev, bukuExempt: checked })),
                        onChangePercent: (pct: number) => setKeringananForm(prev => ({ ...prev, bukuDiscountPercent: pct })),
                        onChangeFixed: (fixed: number) => setKeringananForm(prev => ({ ...prev, bukuDiscountFixed: fixed }))
                      },
                      {
                        key: 'pts',
                        name: 'Biaya Penilaian Tengah Semester (PTS)',
                        icon: '📝',
                        baseTariff: tariffs.biayaPTS || 150000,
                        exempt: Boolean(keringananForm.ptsExempt),
                        percent: keringananForm.ptsDiscountPercent || 0,
                        fixed: keringananForm.ptsDiscountFixed || 0,
                        onToggleExempt: (checked: boolean) => setKeringananForm(prev => ({ ...prev, ptsExempt: checked })),
                        onChangePercent: (pct: number) => setKeringananForm(prev => ({ ...prev, ptsDiscountPercent: pct })),
                        onChangeFixed: (fixed: number) => setKeringananForm(prev => ({ ...prev, ptsDiscountFixed: fixed }))
                      },
                      {
                        key: 'sas',
                        name: 'Biaya Sumatif Akhir Semester (SAS / PAS)',
                        icon: '📋',
                        baseTariff: tariffs.biayaSAS || 200000,
                        exempt: Boolean(keringananForm.sasExempt),
                        percent: keringananForm.sasDiscountPercent || 0,
                        fixed: keringananForm.sasDiscountFixed || 0,
                        onToggleExempt: (checked: boolean) => setKeringananForm(prev => ({ ...prev, sasExempt: checked })),
                        onChangePercent: (pct: number) => setKeringananForm(prev => ({ ...prev, sasDiscountPercent: pct })),
                        onChangeFixed: (fixed: number) => setKeringananForm(prev => ({ ...prev, sasDiscountFixed: fixed }))
                      },
                      {
                        key: 'dat',
                        name: 'Biaya Dana Akhir Tahun (DAT / PAT)',
                        icon: '🎓',
                        baseTariff: tariffs.biayaDAT || 250000,
                        exempt: Boolean(keringananForm.datExempt),
                        percent: keringananForm.datDiscountPercent || 0,
                        fixed: keringananForm.datDiscountFixed || 0,
                        onToggleExempt: (checked: boolean) => setKeringananForm(prev => ({ ...prev, datExempt: checked })),
                        onChangePercent: (pct: number) => setKeringananForm(prev => ({ ...prev, datDiscountPercent: pct })),
                        onChangeFixed: (fixed: number) => setKeringananForm(prev => ({ ...prev, datDiscountFixed: fixed }))
                      }
                    ].map((item) => {
                      // Calculate effective bill for this item
                      let effective = item.baseTariff;
                      if (item.exempt) {
                        effective = 0;
                      } else {
                        if (item.percent > 0) {
                          effective = Math.max(0, Math.round(effective * (1 - item.percent / 100)));
                        }
                        if (item.fixed > 0) {
                          effective = Math.max(0, effective - item.fixed);
                        }
                      }
                      const discountAmount = item.baseTariff - effective;
                      const hasDiscount = item.exempt || discountAmount > 0;

                      return (
                        <div
                          key={item.key}
                          className={`p-3 rounded-xl border transition-all ${
                            item.exempt
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : hasDiscount
                              ? 'bg-indigo-50/40 border-indigo-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-base">{item.icon}</span>
                              <span className="font-bold text-xs text-slate-800">{item.name}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                              Tarif Standar: Rp {item.baseTariff.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-center">
                            {/* Checkbox Bebas Penuh */}
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.exempt}
                                onChange={(e) => item.onToggleExempt(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700">
                                Bebas Penuh (100% Gratis)
                              </span>
                            </label>

                            {/* Diskon % */}
                            {!item.exempt ? (
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  Diskon Persentase (%)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.percent || 0}
                                    onChange={(e) => item.onChangePercent(Number(e.target.value))}
                                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold pr-6 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-2 top-1 text-[11px] font-bold text-slate-400">%</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] font-semibold text-emerald-700 italic">
                                Pembebasan Penuh Aktif
                              </div>
                            )}

                            {/* Potongan Tetap Rp */}
                            {!item.exempt ? (
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  Atau Potongan Tetap (Rp)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="10000"
                                  value={item.fixed || 0}
                                  onChange={(e) => item.onChangeFixed(Number(e.target.value))}
                                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Misal 50000"
                                />
                              </div>
                            ) : null}
                          </div>

                          {/* Live Simulation Indicator */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">
                              Simulasi Tagihan Siswa:
                            </span>
                            {item.exempt ? (
                              <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                ✨ Rp 0 (Bebas Biaya • Hemat Rp {item.baseTariff.toLocaleString('id-ID')})
                              </span>
                            ) : hasDiscount ? (
                              <div className="flex items-center space-x-1.5">
                                <span className="line-through text-slate-400">
                                  Rp {item.baseTariff.toLocaleString('id-ID')}
                                </span>
                                <span className="font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                  Rp {effective.toLocaleString('id-ID')} (Hemat Rp {discountAmount.toLocaleString('id-ID')})
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-700">
                                Rp {item.baseTariff.toLocaleString('id-ID')} (Tarif Penuh)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Catatan Khusus */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Catatan Khusus Keringanan / SK Beasiswa</label>
                  <input
                    type="text"
                    value={keringananForm.customNote || ''}
                    onChange={(e) => setKeringananForm({ ...keringananForm, customNote: e.target.value })}
                    placeholder="Contoh: Penerima Beasiswa Tahfidz 5 Juz / SK Kepala Madrasah No 12"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveKeringanan}
                    className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Keringanan Siswa Ini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetKeringanan(keringananStudentId)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
                    title="Reset siswa menjadi reguler dan hapus dari daftar keringanan"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset ke Reguler</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Daftar Siswa dengan Keringanan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Siswa Penerima Keringanan</span>
                </span>
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full">
                  {studentsWithOverrides.length} Siswa
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Daftar siswa yang telah memiliki SK keringanan atau potongan biaya (Yatim / Dhuafa / Prestasi)</p>
            </div>

            {studentsWithOverrides.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold text-slate-600">Belum ada siswa penerima keringanan khusus</p>
                <p className="text-[11px] text-slate-400 mt-1">Gunakan form di sebelah kiri untuk memilih siswa & menerapkan keringanan</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
                {studentsWithOverrides.map(({ student, override }) => {
                  if (!student) return null;
                  return (
                    <div key={student.id} className="py-3 space-y-1.5 hover:bg-slate-50/80 p-2 rounded-xl transition">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{student.name}</span>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                          Kelas {student.className}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {/* SPP */}
                        {override.sppExempt && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            Bebas SPP 100%
                          </span>
                        )}
                        {!override.sppExempt && override.sppDiscountPercent ? (
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                            Diskon SPP {override.sppDiscountPercent}%
                          </span>
                        ) : null}
                        {!override.sppExempt && override.sppDiscountFixed ? (
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                            Potongan SPP Rp {override.sppDiscountFixed.toLocaleString('id-ID')}
                          </span>
                        ) : null}

                        {/* Gedung */}
                        {override.gedungExempt && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Bebas Gedung 100%
                          </span>
                        )}
                        {!override.gedungExempt && override.gedungDiscountPercent ? (
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Diskon Gedung {override.gedungDiscountPercent}%
                          </span>
                        ) : null}
                        {!override.gedungExempt && override.gedungDiscountFixed ? (
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Pot. Gedung Rp {override.gedungDiscountFixed.toLocaleString('id-ID')}
                          </span>
                        ) : null}

                        {/* Seragam */}
                        {override.seragamExempt && (
                          <span className="bg-slate-200 text-slate-800 font-bold px-1.5 py-0.2 rounded">
                            Bebas Seragam 100%
                          </span>
                        )}
                        {!override.seragamExempt && override.seragamDiscountPercent ? (
                          <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.2 rounded">
                            Diskon Seragam {override.seragamDiscountPercent}%
                          </span>
                        ) : null}
                        {!override.seragamExempt && override.seragamDiscountFixed ? (
                          <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.2 rounded">
                            Pot. Seragam Rp {override.seragamDiscountFixed.toLocaleString('id-ID')}
                          </span>
                        ) : null}

                        {/* Buku */}
                        {override.bukuExempt && (
                          <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            Bebas Buku 100%
                          </span>
                        )}
                        {!override.bukuExempt && override.bukuDiscountPercent ? (
                          <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            Diskon Buku {override.bukuDiscountPercent}%
                          </span>
                        ) : null}
                        {!override.bukuExempt && override.bukuDiscountFixed ? (
                          <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            Pot. Buku Rp {override.bukuDiscountFixed.toLocaleString('id-ID')}
                          </span>
                        ) : null}

                        {/* PTS */}
                        {override.ptsExempt && (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                            Bebas PTS 100%
                          </span>
                        )}
                        {!override.ptsExempt && override.ptsDiscountPercent ? (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                            Diskon PTS {override.ptsDiscountPercent}%
                          </span>
                        ) : null}
                        {!override.ptsExempt && override.ptsDiscountFixed ? (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                            Pot. PTS Rp {override.ptsDiscountFixed.toLocaleString('id-ID')}
                          </span>
                        ) : null}

                        {/* SAS */}
                        {override.sasExempt && (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                            Bebas SAS 100%
                          </span>
                        )}
                        {!override.sasExempt && override.sasDiscountPercent ? (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                            Diskon SAS {override.sasDiscountPercent}%
                          </span>
                        ) : null}
                        {!override.sasExempt && override.sasDiscountFixed ? (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                            Pot. SAS Rp {override.sasDiscountFixed.toLocaleString('id-ID')}
                          </span>
                        ) : null}

                        {/* DAT */}
                        {override.datExempt && (
                          <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                            Bebas DAT 100%
                          </span>
                        )}
                        {!override.datExempt && override.datDiscountPercent ? (
                          <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                            Diskon DAT {override.datDiscountPercent}%
                          </span>
                        ) : null}
                        {!override.datExempt && override.datDiscountFixed ? (
                          <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                            Pot. DAT Rp {override.datDiscountFixed.toLocaleString('id-ID')}
                          </span>
                        ) : null}
                      </div>

                      {override.customNote && (
                        <p className="text-[10px] text-slate-500 italic bg-amber-50/50 p-1 rounded border border-amber-100/60">
                          “{override.customNote}”
                        </p>
                      )}

                      <div className="pt-1 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setKeringananClass(student.className);
                            loadKeringananForStudent(student.id);
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => handleResetKeringanan(student.id)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center space-x-1"
                          title="Reset menjadi reguler dan hapus dari daftar keringanan"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset ke Reguler</span>
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

      {/* ========================================================================= */}
      {/* MODAL: DETAIL POS TAGIHAN SISWA */}
      {/* ========================================================================= */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-black">
                  {selectedStudentForDetail.student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedStudentForDetail.student.name}</h3>
                  <p className="text-xs text-indigo-200">
                    Kelas {selectedStudentForDetail.student.className} • Kode Unik: <strong className="text-amber-300 font-mono">{selectedStudentForDetail.student.kodeUnik || '-'}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Keringanan Notification Banner in Modal */}
              {billSettings.studentOverrides?.[selectedStudentForDetail.student.id] && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-amber-900">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-extrabold block">Siswa Penerima Keringanan Khusus</span>
                      <span className="text-[11px] text-amber-700">
                        {billSettings.studentOverrides[selectedStudentForDetail.student.id].customNote || 'Terdapat penyesuaian tarif/diskon beasiswa.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetKeringanan(selectedStudentForDetail.student.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer"
                    title="Reset menjadi reguler dan hapus dari penerima keringanan"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset ke Reguler</span>
                  </button>
                </div>
              )}

              {/* Summary Pill */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Tagihan</p>
                  <p className="text-sm font-black text-slate-900">Rp {selectedStudentForDetail.totalBill.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Total Terbayar</p>
                  <p className="text-sm font-black text-emerald-700">Rp {selectedStudentForDetail.totalPaid.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-rose-600">Sisa Tunggakan</p>
                  <p className="text-sm font-black text-rose-700">Rp {selectedStudentForDetail.totalRemaining.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Rincian Pos Pembayaran</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedStudentForDetail.items.map((item) => (
                    <div key={item.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900">{item.title}</span>
                          <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                            item.isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.paidAmount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.statusLabel}
                          </span>
                        </div>
                        {item.details && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.details}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0 font-semibold">
                        <div className="text-slate-700">Tagihan: Rp {item.billAmount.toLocaleString('id-ID')}</div>
                        <div className={item.remainingAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {item.remainingAmount > 0 ? `Sisa: Rp ${item.remainingAmount.toLocaleString('id-ID')}` : '✓ Lunas'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  handleSendWhatsApp(selectedStudentForDetail);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim WA ke Orang Tua</span>
              </button>

              <button
                onClick={() => {
                  handlePrintOfficialLetter(selectedStudentForDetail);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Surat Tagihan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH TAGIHAN KHUSUS */}
      {/* ========================================================================= */}
      {showAddCustomBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-black">Tambah Pos Tagihan Khusus Baru</h3>
              <button
                onClick={() => setShowAddCustomBillModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul / Nama Tagihan</label>
                <input
                  type="text"
                  placeholder="Contoh: Wisuda & Pelepasan Siswa Kelas IX"
                  value={newBillTitle}
                  onChange={(e) => setNewBillTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Kelas</label>
                <select
                  value={newBillClass}
                  onChange={(e) => setNewBillClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  <option value="ALL">Semua Kelas (Semua Siswa)</option>
                  {classList.map(c => (
                    <option key={c} value={c}>Khusus Kelas {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Batas Waktu / Jatuh Tempo (Opsional)</label>
                <input
                  type="date"
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Rincian Singkat</label>
                <textarea
                  rows={2}
                  value={newBillDesc}
                  onChange={(e) => setNewBillDesc(e.target.value)}
                  placeholder="Misal: Biaya seremonial pelepasan, medali, dan map ijazah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddCustomBillModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddCustomBill}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                Simpan Tagihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT POS PEMBAYARAN WAJIB (STANDARD BILLING ITEM) */}
      {/* ========================================================================= */}
      {showStandardBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-4.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Layers className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    {editingStandardItem ? 'Edit Pos Pembayaran Wajib' : 'Tambah Pos Pembayaran Wajib Baru'}
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    {editingStandardItem ? `Memperbarui konfigurasi tarif & pos ${editingStandardItem.name}` : 'Mendefinisikan item kewajiban penagihan baru bagi siswa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStandardBillModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStandardItem} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Pos Pembayaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Infaq Komite Madrasah / Uang Praktikum Komputer"
                  value={stdName}
                  onChange={(e) => setStdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Sistem <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={stdCategory}
                    onChange={(e) => setStdCategory(e.target.value as PaymentCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SPP">SPP (Bulanan)</option>
                    <option value="GEDUNG">GEDUNG (Pembangunan)</option>
                    <option value="SERAGAM">SERAGAM (Atribut)</option>
                    <option value="BUKU">BUKU (Modul / LKS)</option>
                    <option value="PTS">PTS (Ujian Tengah Semester)</option>
                    <option value="SAS">SAS (Ujian Akhir Semester)</option>
                    <option value="DAT">DAT (Dana Akhir Tahun)</option>
                    <option value="KEGIATAN">KEGIATAN (Ekstrakurikuler/Study Tour)</option>
                    <option value="LAINNYA">LAINNYA (Pos Bebas Lainnya)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Frekuensi Penagihan
                  </label>
                  <select
                    value={stdFrequency}
                    onChange={(e) => setStdFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Bulanan">Bulanan</option>
                    <option value="Per Semester">Per Semester</option>
                    <option value="Tahunan / Sekali Bayar">Tahunan / Sekali Bayar</option>
                    <option value="Sekali Selama Pendidikan">Sekali Selama Pendidikan</option>
                    <option value="Insidental / Sesuai Jadwal">Insidental / Sesuai Jadwal</option>
                  </select>
                </div>
              </div>

              {/* Target Tingkat Kelas yang Diwajibkan */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>Target Tingkat Kelas</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">Pilihan: VII, VIII, IX atau Semua</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleTargetGrade('SEMUA')}
                    className={`py-2 px-1.5 rounded-lg font-black text-xs text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                      stdTargetGrades.includes('SEMUA') || stdTargetGrades.length === 0 || (stdTargetGrades.includes('VII') && stdTargetGrades.includes('VIII') && stdTargetGrades.includes('IX'))
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Semua</span>
                    <span className="text-[9px] font-normal opacity-80">(Semua Kelas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTargetGrade('VII')}
                    className={`py-2 px-1.5 rounded-lg font-black text-xs text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                      !stdTargetGrades.includes('SEMUA') && stdTargetGrades.includes('VII')
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Kelas VII</span>
                    <span className="text-[9px] font-normal opacity-80">(Tingkat 7)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTargetGrade('VIII')}
                    className={`py-2 px-1.5 rounded-lg font-black text-xs text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                      !stdTargetGrades.includes('SEMUA') && stdTargetGrades.includes('VIII')
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Kelas VIII</span>
                    <span className="text-[9px] font-normal opacity-80">(Tingkat 8)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTargetGrade('IX')}
                    className={`py-2 px-1.5 rounded-lg font-black text-xs text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                      !stdTargetGrades.includes('SEMUA') && stdTargetGrades.includes('IX')
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Kelas IX</span>
                    <span className="text-[9px] font-normal opacity-80">(Tingkat 9)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 pt-0.5">
                  Target: <strong className="text-indigo-700 font-extrabold">{formatTargetGradesLabel(stdTargetGrades)}</strong>
                  {stdTargetGrades.includes('SEMUA') || stdTargetGrades.length === 0
                    ? ' — Pos ini otomatis ditagihkan ke seluruh siswa di semua tingkat kelas.'
                    : ' — Pos ini hanya akan ditagihkan ke siswa pada tingkat kelas yang dipilih.'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Tarif Default (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={stdAmount}
                    onChange={(e) => setStdAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Terbilang: <span className="font-semibold text-slate-700">Rp {stdAmount.toLocaleString('id-ID')}</span>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Rincian Pos (Opsional)</label>
                <textarea
                  rows={2}
                  value={stdDesc}
                  onChange={(e) => setStdDesc(e.target.value)}
                  placeholder="Penjelasan pos biaya, peruntukan dana, atau catatan penting..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-indigo-950 block">Status Kewajiban Aktif</span>
                  <span className="text-[11px] text-indigo-700/80">Langsung aktifkan penagihan ke seluruh siswa madrasah</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stdIsActive}
                    onChange={(e) => setStdIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowStandardBillModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingStandardItem ? 'Simpan Perubahan' : 'Tambah Pos Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS POS PEMBAYARAN WAJIB */}
      {/* ========================================================================= */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Hapus Pos Pembayaran?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Apakah Anda yakin ingin menghapus pos <span className="font-bold text-slate-900">"{itemToDelete.name}"</span>?
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2.5 text-left">
                ℹ️ <strong>Catatan:</strong> Penghapusan ini akan menonaktifkan kewajiban pos ini dari portal penagihan siswa. Riwayat pembayaran terdahulu yang sudah tercatat tetap aman tersimpan.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStandardItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
              >
                Ya, Hapus Pos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SINKRONISASI RIWAYAT PEMBAYARAN SISWA */}
      {/* ========================================================================= */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Sinkronisasi Riwayat Pembayaran Siswa</h3>
                  <p className="text-xs text-emerald-200/80">Hubungkan ulang kwitansi pembayaran lama ke data siswa saat ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              
              {/* Problem Explanation & Solution Box */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-indigo-950 text-xs">
                      Mengapa Siswa Yang Sudah Bayar Dianggap Menunggak?
                    </p>
                    <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                      Ketika data siswa sempat dihapus dan dimasukkan/diimpor ulang, ID unik internal siswa berubah sehingga riwayat transaksi kwitansi lama terputus ikatannya. Fitur ini secara cerdas mencocokkan kembali riwayat pembayaran melalui <strong>NISN, NIS, dan Nama Lengkap + Kelas</strong>, lalu memperbarui relasi data secara otomatis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Indicator Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Kwitansi</p>
                  <p className="text-lg font-black text-slate-900">{payments.length}</p>
                  <p className="text-[10px] text-slate-500">Transaksi Tersimpan</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Telah Terhubung</p>
                  <p className="text-lg font-black text-emerald-800">
                    {syncFeedback ? syncFeedback.alreadySyncedCount + syncFeedback.syncedCount : payments.length - unsyncedStats.fixableCount - unsyncedStats.unmatchedCount}
                  </p>
                  <p className="text-[10px] text-emerald-700">Sesuai Siswa Aktif</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Perlu Sinkronisasi</p>
                  <p className="text-lg font-black text-amber-900">
                    {syncFeedback ? syncFeedback.syncedCount : unsyncedStats.fixableCount}
                  </p>
                  <p className="text-[10px] text-amber-700">Ditemukan Cocok</p>
                </div>
              </div>

              {/* Success Result Banner */}
              {syncFeedback && syncFeedback.syncedCount > 0 && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center space-x-3 text-emerald-900">
                  <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-emerald-950">
                      Berhasil Menghubungkan {syncFeedback.syncedCount} Transaksi Pembayaran!
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Status tagihan siswa kini telah diperbarui dan langsung tercatat sebagai <strong>Lunas</strong> sesuai riwayat pembayaran aslinya.
                    </p>
                  </div>
                </div>
              )}

              {/* Details table if any */}
              {syncFeedback && syncFeedback.details && syncFeedback.details.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                    <span>Rincian Hasil Pencocokan Pembayaran</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      {syncFeedback.details.filter(d => d.status === 'MATCHED').length} Cocok Baru
                    </span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">No. Kwitansi</th>
                          <th className="py-2 px-3">Nama di Kwitansi</th>
                          <th className="py-2 px-3">Siswa Cocok</th>
                          <th className="py-2 px-3 text-right">Nominal</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {syncFeedback.details.slice(0, 30).map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-600">{d.invoiceNumber}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{d.studentName} ({d.className})</td>
                            <td className="py-2 px-3 font-bold text-indigo-700">
                              {d.matchedStudentName ? `${d.matchedStudentName} (${d.matchedBy})` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              Rp {d.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {d.status === 'MATCHED' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  Tersinkron Baru
                                </span>
                              ) : d.status === 'ALREADY_SYNCED' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Sudah Terhubung
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Nama Tidak Ada
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Pencocokan aman tanpa mengubah nominal atau tanggal transaksi.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSync}
                  disabled={isSyncing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Memproses...' : 'Jalankan Sinkronisasi Ulang'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

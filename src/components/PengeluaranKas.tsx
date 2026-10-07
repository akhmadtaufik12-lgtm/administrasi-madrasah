import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Trash2,
  Calendar,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Building,
  ArrowDownRight,
  Send,
  Eye,
  UserCheck,
  Receipt,
  X,
  CreditCard,
  Banknote,
  DollarSign
} from 'lucide-react';
import {
  TreasurerExpenseTransaction,
  ExpenseCategory,
  BendaharaPerson,
  SchoolOfficials,
  PaymentTransaction,
  CashDepositTransaction,
  SOURCE_POS_EXPENSE_OPTIONS
} from '../types';
import { exportToCSV } from '../utils/export';
import { matchTreasurerFromReceivedBy } from '../utils/storage';

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

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Operasional Madrasah',
  'Belanja ATK & Sarana',
  'Honor & Kegiatan Guru',
  'Kegiatan Siswa & Lomba',
  'Perawatan Gedung & Fasilitas',
  'Listrik, Air & Internet',
  'Konsumsi & Rapat',
  'Lain-lain'
];

interface PengeluaranKasProps {
  expenses: TreasurerExpenseTransaction[];
  payments: PaymentTransaction[];
  cashDeposits: CashDepositTransaction[];
  activeTreasurer: BendaharaPerson;
  isBendaharaUtama: boolean;
  allTreasurers: BendaharaPerson[];
  schoolOfficials: SchoolOfficials;
  academicYear: string;
  onSaveExpense: (expense: TreasurerExpenseTransaction) => Promise<void> | void;
  onDeleteExpense: (expenseId: string) => Promise<void> | void;
}

export const PengeluaranKas: React.FC<PengeluaranKasProps> = ({
  expenses,
  payments,
  cashDeposits,
  activeTreasurer,
  isBendaharaUtama,
  allTreasurers,
  schoolOfficials,
  academicYear,
  onSaveExpense,
  onDeleteExpense
}) => {
  // Input Form State
  const [targetTreasurerId, setTargetTreasurerId] = useState<string>(activeTreasurer.id);
  const [category, setCategory] = useState<ExpenseCategory>('Belanja ATK & Sarana');
  const [sourcePos, setSourcePos] = useState<string>('KAS_UMUM');
  const [title, setTitle] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank'>('Tunai');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Selected Voucher Modal
  const [selectedVoucher, setSelectedVoucher] = useState<TreasurerExpenseTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TreasurerExpenseTransaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTreasurer, setFilterTreasurer] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSourcePos, setFilterSourcePos] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');

  // Quick Amount presets
  const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2500000];

  // Visible expenses list based on role:
  // - Bendahara Utama: can view ALL expenses (and filter by treasurer)
  // - Regular Treasurers: ONLY view expenses recorded under their own treasurer ID
  const visibleExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Role scoping
      if (!isBendaharaUtama) {
        if (exp.treasurerId !== activeTreasurer.id) return false;
      } else {
        if (filterTreasurer !== 'ALL' && exp.treasurerId !== filterTreasurer) {
          return false;
        }
      }

      if (filterCategory !== 'ALL' && exp.category !== filterCategory) return false;
      if (filterSourcePos !== 'ALL') {
        const sPos = exp.sourcePos || 'KAS_UMUM';
        if (sPos !== filterSourcePos) return false;
      }
      if (filterMethod !== 'ALL' && exp.paymentMethod !== filterMethod) return false;
      if (filterMonth !== 'ALL' && !exp.expenseDate.startsWith(filterMonth)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(q);
        const matchExpNum = exp.expenseNumber.toLowerCase().includes(q);
        const matchRecipient = (exp.recipientName || '').toLowerCase().includes(q);
        const matchTreasurer = exp.treasurerName.toLowerCase().includes(q);
        const matchReceipt = (exp.receiptNumber || '').toLowerCase().includes(q);
        const matchNotes = (exp.notes || '').toLowerCase().includes(q);
        const matchPos = (exp.sourcePosLabel || exp.sourcePos || '').toLowerCase().includes(q);
        if (!matchTitle && !matchExpNum && !matchRecipient && !matchTreasurer && !matchReceipt && !matchNotes && !matchPos) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, isBendaharaUtama, activeTreasurer.id, filterTreasurer, filterCategory, filterSourcePos, filterMethod, filterMonth, searchQuery]);

  // Aggregate statistics per treasurer
  const perTreasurerStats = useMemo(() => {
    return allTreasurers.map(t => {
      const tExpenses = expenses.filter(e => e.treasurerId === t.id);
      const totalExp = tExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const cashExp = tExpenses.filter(e => e.paymentMethod === 'Tunai').reduce((sum, e) => sum + (e.amount || 0), 0);
      const transferExp = totalExp - cashExp;

      // Income received by this treasurer
      const tPayments = payments.filter(p => {
        const tInfo = matchTreasurerFromReceivedBy(p.receivedBy, allTreasurers);
        return tInfo.id === t.id;
      });
      const grossIncome = tPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Deposits made by this treasurer to Bendahara Utama
      const depositsMade = cashDeposits
        .filter(d => d.fromTreasurerId === t.id && d.status === 'Diterima')
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      // Deposits received by Bendahara Utama from all other treasurers
      const depositsReceived = t.id === 'bu'
        ? cashDeposits.filter(d => d.status === 'Diterima').reduce((sum, d) => sum + (d.amount || 0), 0)
        : 0;

      // Sisa kas aktual di tangan
      let remainingCash = 0;
      if (t.id === 'bu') {
        remainingCash = Math.max(0, (grossIncome + depositsReceived) - totalExp);
      } else {
        remainingCash = Math.max(0, grossIncome - depositsMade - totalExp);
      }

      return {
        treasurer: t,
        id: t.id,
        name: t.name,
        roleTitle: t.roleTitle,
        totalExpenses: totalExp,
        cashExpenses: cashExp,
        transferExpenses: transferExp,
        expenseCount: tExpenses.length,
        grossIncome,
        depositsMade,
        depositsReceived,
        remainingCash
      };
    });
  }, [allTreasurers, expenses, payments, cashDeposits]);

  // Overall Totals
  const totalAllExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const totalMyExpenses = useMemo(() => {
    return expenses
      .filter(e => e.treasurerId === activeTreasurer.id)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses, activeTreasurer.id]);

  const myStats = useMemo(() => {
    return perTreasurerStats.find(s => s.id === activeTreasurer.id) || {
      totalExpenses: 0,
      cashExpenses: 0,
      transferExpenses: 0,
      expenseCount: 0,
      grossIncome: 0,
      depositsMade: 0,
      depositsReceived: 0,
      remainingCash: 0
    };
  }, [perTreasurerStats, activeTreasurer.id]);

  // Targeted Treasurer & Available Cash on Hand for Current Form
  const currentTargetTreasurerId = isBendaharaUtama ? targetTreasurerId : activeTreasurer.id;
  const currentTargetStat = useMemo(() => {
    return perTreasurerStats.find(s => s.id === currentTargetTreasurerId) || myStats;
  }, [perTreasurerStats, currentTargetTreasurerId, myStats]);

  const currentAvailableCash = currentTargetStat ? currentTargetStat.remainingCash : 0;
  const isAmountExceedingCash = amount > currentAvailableCash;

  // Form Submission
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Uraian/keperluan pengeluaran wajib diisi!');
      return;
    }
    if (amount <= 0) {
      alert('Nominal pengeluaran harus lebih dari Rp 0!');
      return;
    }

    const tId = isBendaharaUtama ? targetTreasurerId : activeTreasurer.id;
    const tPerson = allTreasurers.find(t => t.id === tId) || activeTreasurer;
    const targetStat = perTreasurerStats.find(s => s.id === tId);
    const availableCash = targetStat ? targetStat.remainingCash : 0;

    // Strict Rule: Pengeluaran dana tidak boleh lebih besar dari kas yang di tangan
    if (amount > availableCash) {
      alert(
        `DITOLAK: Pengeluaran dana tidak boleh lebih besar dari sisa kas yang di tangan!\n\n` +
        `Petugas: ${tPerson.name} (${tPerson.roleTitle})\n` +
        `Sisa Kas di Tangan Tersedia: Rp ${availableCash.toLocaleString('id-ID')}\n` +
        `Nominal Pengeluaran Diinput: Rp ${amount.toLocaleString('id-ID')}\n` +
        `Selisih Defisit: Rp ${(amount - availableCash).toLocaleString('id-ID')}\n\n` +
        `Silakan sesuaikan nominal pengeluaran agar tidak melebihi sisa kas yang dipegang.`
      );
      return;
    }

    const now = new Date();
    const yearStr = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(expenses.length + 1).padStart(3, '0');
    const expenseNumber = `BKK/${yearStr}/${monthStr}/${seq}`;

    const sourcePosItem = SOURCE_POS_EXPENSE_OPTIONS.find(p => p.key === sourcePos);
    const sourcePosLabel = sourcePosItem ? sourcePosItem.name : 'Kas Umum / Operasional Bebas';

    const newExpense: TreasurerExpenseTransaction = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      expenseNumber,
      treasurerId: tPerson.id,
      treasurerName: tPerson.name,
      treasurerRole: tPerson.roleTitle || (tPerson.id === 'bu' ? 'Bendahara Utama' : 'Bendahara'),
      category,
      sourcePos,
      sourcePosLabel,
      title: title.trim(),
      recipientName: recipientName.trim() || undefined,
      amount: Number(amount),
      expenseDate,
      paymentMethod,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: now.toISOString()
    };

    setIsSubmitting(true);
    try {
      await onSaveExpense(newExpense);
      setFormSuccess(`Pengeluaran sebesar Rp ${newExpense.amount.toLocaleString('id-ID')} (${newExpense.title}) berhasil dicatat dari pos ${sourcePosLabel} untuk ${tPerson.name}!`);
      setTitle('');
      setRecipientName('');
      setAmount(0);
      setReceiptNumber('');
      setNotes('');
      setSelectedVoucher(newExpense); // Preview receipt
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await onDeleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      setFormSuccess('Transaksi pengeluaran berhasil dihapus.');
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengeluaran.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'No',
      'No. Bukti Kas Keluar',
      'Tanggal',
      'Bendahara Pengeluar',
      'Kategori Pengeluaran',
      'Sumber Pos Kas',
      'Uraian Pengeluaran',
      'Penerima Dana / Vendor',
      'Nominal (Rp)',
      'Metode Bayar',
      'No. Nota/Kwitansi Toko',
      'Catatan'
    ];

    const rows: (string | number)[][] = [
      ['BUKU KAS KELUAR (BKK) - MTS MANBAUL ISLAM'],
      [`Tahun Pelajaran: ${academicYear}`],
      [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`],
      [`Petugas: ${isBendaharaUtama ? 'Seluruh Bendahara' : `${activeTreasurer.name} (${activeTreasurer.roleTitle})`}`],
      [''],
      headers
    ];

    visibleExpenses.forEach((exp, idx) => {
      rows.push([
        idx + 1,
        exp.expenseNumber,
        exp.expenseDate,
        `${exp.treasurerName} (${exp.treasurerRole})`,
        exp.category,
        exp.sourcePosLabel || exp.sourcePos || 'Kas Umum',
        exp.title,
        exp.recipientName || '-',
        exp.amount,
        exp.paymentMethod,
        exp.receiptNumber || '-',
        exp.notes || '-'
      ]);
    });

    const filename = `Laporan_Pengeluaran_Kas_${isBendaharaUtama ? 'Seluruh_Bendahara' : activeTreasurer.roleTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filename, rows);
  };

  return (
    <div className="space-y-6" id="pengeluaran-kas-container">
      
      {/* Top Banner & Context */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Buku Kas Keluar (BKK)</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Tahun Pelajaran: {academicYear}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800">
                {activeTreasurer.roleTitle}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isBendaharaUtama 
                ? 'Pengeluaran Kas Madrasah & Monitoring Seluruh Bendahara' 
                : `Pencatatan Pengeluaran Kas — ${activeTreasurer.roleTitle}`}
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              {isBendaharaUtama
                ? 'Sebagai Bendahara Utama, Anda dapat mencatat pengeluaran operasional madrasah serta memantau dan mengaudit seluruh pengeluaran kas yang dilakukan oleh Bendahara 1 s/d Bendahara 5 secara transparan dan realtime.'
                : 'Catat setiap pembelanjaan operasional, belanja ATK, kegiatan madrasah, atau pengeluaran dana lainnya. Saldo kas di tangan Anda akan terpotong secara otomatis dan tercatat dalam laporan pembukuan.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Unduh Data Pengeluaran Kas ke Excel CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV Excel</span>
            </button>
          </div>
        </div>

        {/* Global / Personal Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-100">
          
          {/* Card 1: Total Pengeluaran */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                {isBendaharaUtama ? 'Total Pengeluaran Madrasah' : 'Pengeluaran Anda'}
              </span>
              <div className="text-lg font-black text-rose-950">
                Rp {(isBendaharaUtama ? totalAllExpenses : totalMyExpenses).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-rose-600 font-semibold">
                {isBendaharaUtama ? `${expenses.length} Transaksi Semua Bendahara` : `${visibleExpenses.length} Transaksi Pengeluaran`}
              </span>
            </div>
          </div>

          {/* Card 2: Kas di Tangan Anda / Saldo Brankas BU */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                {isBendaharaUtama ? 'Saldo Kas di Brankas BU' : 'Sisa Kas di Tangan Anda'}
              </span>
              <div className="text-lg font-black text-indigo-950">
                Rp {myStats.remainingCash.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold">
                {isBendaharaUtama ? 'Setelah Dikurangi Pengeluaran BU' : 'Setelah Pengeluaran & Setoran'}
              </span>
            </div>
          </div>

          {/* Card 3: Penerimaan Kas Anda */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                {isBendaharaUtama ? 'Total Setoran Masuk ke BU' : 'Penerimaan Kas Anda'}
              </span>
              <div className="text-lg font-black text-emerald-950">
                Rp {(isBendaharaUtama ? myStats.depositsReceived : myStats.grossIncome).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {isBendaharaUtama ? 'Dari Bendahara 1 s/d 5' : 'Dari Pembayaran Siswa'}
              </span>
            </div>
          </div>

          {/* Card 4: Pengeluaran Tunai vs Transfer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {isBendaharaUtama ? 'Pengeluaran Bendahara 1-5' : 'Telah Disetor ke BU'}
              </span>
              <div className="text-lg font-black text-slate-900">
                Rp {(isBendaharaUtama 
                  ? perTreasurerStats.filter(s => s.id !== 'bu').reduce((sum, s) => sum + s.totalExpenses, 0)
                  : myStats.depositsMade).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {isBendaharaUtama ? 'Total Belanja Kasir 1 s/d 5' : 'Setoran Kas ke Bendahara Utama'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Success Alert */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Form Input Pengeluaran & Ringkasan Per-Bendahara */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Input Pengeluaran */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Catat Pengeluaran Kas Baru</h3>
                <p className="text-[11px] text-slate-500">Isi formulir pengeluaran untuk pembukuan kas madrasah</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Petugas: {activeTreasurer.name}</span>
            </div>
          </div>

          <form onSubmit={handleSubmitExpense} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Petugas Bendahara */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Petugas Bendahara:
                </label>
                {isBendaharaUtama ? (
                  <select
                    value={targetTreasurerId}
                    onChange={e => setTargetTreasurerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {allTreasurers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.roleTitle}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>{activeTreasurer.name}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                      {activeTreasurer.roleTitle}
                    </span>
                  </div>
                )}
              </div>

              {/* Kategori Pengeluaran */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Kategori Pengeluaran: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sumber Pos Dana / Asal Kas */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Sumber Pos Dana:</span>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    Pilihan Pos
                  </span>
                </label>
                <select
                  value={sourcePos}
                  onChange={e => setSourcePos(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SOURCE_POS_EXPENSE_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Uraian Keperluan Pengeluaran */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Uraian / Keperluan Pengeluaran: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Pembelian Kertas HVS F4 5 Rim & Spidol Whiteboard"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Penerima Dana / Vendor / Toko */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Penerima Dana / Vendor / Toko:
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Contoh: Toko ATK Berkah / PLN / Nama Guru"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* No. Nota / Kwitansi Toko */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  No. Nota / Kwitansi Toko (Opsional):
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  placeholder="Contoh: NOTA-1289 / STR-098"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

            </div>

            {/* Status Sisa Kas di Tangan Bendahara */}
            <div className={`p-4 rounded-xl border transition ${
              currentAvailableCash <= 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-indigo-50/70 border-indigo-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    currentAvailableCash <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Sisa Kas di Tangan ({currentTargetStat.name} — {currentTargetStat.roleTitle})
                    </span>
                    <div className={`text-base font-black ${
                      currentAvailableCash <= 0 ? 'text-rose-700' : 'text-indigo-950'
                    }`}>
                      Rp {currentAvailableCash.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {currentAvailableCash > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAmount(currentAvailableCash)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer self-start sm:self-auto shadow-xs"
                    title="Gunakan seluruh sisa kas yang tersedia di tangan"
                  >
                    <span>Gunakan Maksimal Kas</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Kas Kosong (Rp 0)
                  </span>
                )}
              </div>

              {currentAvailableCash <= 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-rose-200/60 flex items-start space-x-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Petugas saat ini tidak memiliki sisa kas fisik di tangan. Pengeluaran kas tidak dapat dilakukan sebelum ada penerimaan pembayaran siswa atau setoran kas masuk.
                  </span>
                </div>
              )}
            </div>

            {/* Nominal Pengeluaran & Quick Presets */}
            <div className={`p-4 rounded-xl border space-y-2.5 transition ${
              isAmountExceedingCash
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                : 'bg-rose-50/50 border-rose-100'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-extrabold text-rose-950 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>Nominal Pengeluaran Kas (Rp):</span>
                  <span className="text-rose-600">*</span>
                  <span className="text-[10px] font-bold text-slate-500 lowercase">
                    (Maks. Rp {currentAvailableCash.toLocaleString('id-ID')})
                  </span>
                </label>
                {amount > 0 && (
                  <span className="text-[11px] font-bold text-rose-700 italic">
                    Terbilang: {numberToWords(amount)}
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-rose-700">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  min={1000}
                  max={currentAvailableCash}
                  step={1000}
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border-2 rounded-xl text-base font-black focus:outline-none transition ${
                    isAmountExceedingCash
                      ? 'border-rose-500 text-rose-700 focus:ring-2 focus:ring-rose-500'
                      : 'border-rose-300 text-rose-950 focus:ring-2 focus:ring-rose-500'
                  }`}
                />
              </div>

              {/* Exceeding Cash Alert */}
              {isAmountExceedingCash && (
                <div className="p-3 bg-rose-100 border border-rose-300 rounded-lg flex items-start space-x-2 text-xs font-bold text-rose-900 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black">Pengeluaran Tidak Boleh Melebihi Kas di Tangan!</p>
                    <p className="text-[11px] font-semibold text-rose-800 mt-0.5">
                      Nominal Rp {amount.toLocaleString('id-ID')} melebihi sisa kas yang dipegang (Rp {currentAvailableCash.toLocaleString('id-ID')}). Defisit: <span className="font-black text-rose-900">Rp {(amount - currentAvailableCash).toLocaleString('id-ID')}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Presets (Filtered by available cash) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 mr-1">Pilihan Cepat:</span>
                {quickAmounts.map(val => {
                  const isOver = val > currentAvailableCash;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={isOver}
                      onClick={() => setAmount(val)}
                      className={`px-2.5 py-1 border rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                        isOver
                          ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                          : 'bg-white hover:bg-rose-100 border-rose-200 text-rose-800'
                      }`}
                    >
                      Rp {val.toLocaleString('id-ID')}
                    </button>
                  );
                })}
              </div>

              {/* Live Simulation Card */}
              {amount > 0 && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider">
                    Simulasi Saldo Kas Petugas:
                  </div>
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Kas di Tangan Sebelum Pengeluaran:</span>
                    <span className="font-bold">Rp {currentAvailableCash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 text-xs font-semibold">
                    <span>Pengeluaran Kas yang Diajukan:</span>
                    <span>- Rp {amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex justify-between font-black text-xs">
                    <span>Estimasi Sisa Kas Setelahnya:</span>
                    <span className={isAmountExceedingCash ? 'text-rose-600' : 'text-emerald-700'}>
                      {isAmountExceedingCash
                        ? `Defisit Rp ${(amount - currentAvailableCash).toLocaleString('id-ID')} (Tidak Diizinkan)`
                        : `Rp ${(currentAvailableCash - amount).toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Tanggal Pengeluaran */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Tanggal Pengeluaran: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Metode Bayar */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Metode Pengeluaran Dana:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Tunai')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      paymentMethod === 'Tunai'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tunai (Kas Fisik)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transfer Bank')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      paymentMethod === 'Transfer Bank'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Transfer Bank</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Keterangan / Catatan Tambahan (Opsional):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Tambahkan rincian barang, peruntukan ruangan, atau nota referensi..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isAmountExceedingCash || amount <= 0 || currentAvailableCash <= 0}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center justify-center space-x-2 shadow-md ${
                isAmountExceedingCash
                  ? 'bg-rose-950/70 text-rose-200 cursor-not-allowed border border-rose-800'
                  : currentAvailableCash <= 0
                  ? 'bg-slate-400 text-slate-100 cursor-not-allowed'
                  : amount <= 0
                  ? 'bg-rose-600 text-white opacity-60 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-rose-500 text-white opacity-75 cursor-wait'
                  : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer hover:shadow-lg'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan Pengeluaran...'
                  : isAmountExceedingCash
                  ? '⛔ Pengeluaran Melebihi Sisa Kas di Tangan'
                  : currentAvailableCash <= 0
                  ? '⛔ Saldo Kas di Tangan Kosong (Rp 0)'
                  : amount <= 0
                  ? 'Masukkan Nominal Pengeluaran'
                  : 'Simpan & Terbitkan Bukti Kas Keluar (BKK)'}
              </span>
            </button>

          </form>
        </div>

        {/* Right Col: Per-Treasurer Summary Breakdown */}
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isBendaharaUtama ? 'Rekapitulasi Kas Seluruh Bendahara' : 'Status Kas Akun Anda'}
              </h3>
            </div>

            {isBendaharaUtama ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Pantau posisi penerimaan, pengeluaran, dan saldo kas di tangan masing-masing bendahara secara aktual.
                </p>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {perTreasurerStats.map(stat => (
                    <div
                      key={stat.id}
                      className={`p-3 rounded-xl border transition ${
                        stat.id === 'bu'
                          ? 'bg-indigo-50/80 border-indigo-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center ${
                            stat.id === 'bu' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {stat.id === 'bu' ? 'BU' : `B${stat.id.replace('b', '')}`}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 truncate max-w-[130px]" title={stat.name}>
                              {stat.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 block">{stat.roleTitle}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">Sisa Kas:</span>
                          <span className={`text-xs font-black ${
                            stat.remainingCash > 0 ? 'text-indigo-900' : 'text-slate-500'
                          }`}>
                            Rp {stat.remainingCash.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Detail row */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Total Pengeluaran:</span>
                          <strong className="text-rose-700 font-extrabold">
                            Rp {stat.totalExpenses.toLocaleString('id-ID')}
                          </strong>
                          <span className="text-slate-400 block">({stat.expenseCount} nota)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block">
                            {stat.id === 'bu' ? 'Setoran Diterima:' : 'Disetor ke BU:'}
                          </span>
                          <strong className="text-emerald-700 font-extrabold">
                            Rp {(stat.id === 'bu' ? stat.depositsReceived : stat.depositsMade).toLocaleString('id-ID')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                  <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                    Profil Bendahara Aktif:
                  </span>
                  <h4 className="text-sm font-black text-slate-900">{activeTreasurer.name}</h4>
                  <div className="text-xs text-indigo-800 font-semibold">{activeTreasurer.roleTitle}</div>
                  <div className="text-[11px] text-slate-500">NIP: {activeTreasurer.nip || '-'}</div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                    <span className="text-slate-600">Penerimaan Siswa:</span>
                    <strong className="text-slate-900 font-bold">Rp {myStats.grossIncome.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-lg flex items-center justify-between text-rose-900">
                    <span>Pengeluaran Kas Anda:</span>
                    <strong className="font-black">Rp {myStats.totalExpenses.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg flex items-center justify-between text-emerald-900">
                    <span>Sudah Disetor ke BU:</span>
                    <strong className="font-black">Rp {myStats.depositsMade.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase block">Sisa Kas di Tangan:</span>
                      <strong className="text-base font-black text-amber-950">
                        Rp {myStats.remainingCash.toLocaleString('id-ID')}
                      </strong>
                    </div>
                    {myStats.remainingCash > 0 && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
                        Perlu Disetor
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
              <Receipt className="w-4 h-4" />
              <span>Aturan Pembukuan Pengeluaran</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Setiap pencatatan pengeluaran menghasilkan nomor resmi <strong className="text-white">Bukti Kas Keluar (BKK)</strong> yang dapat dicetak sebagai tanda bukti sah untuk lampiran laporan SPJ madrasah.
            </p>
          </div>

        </div>

      </div>

      {/* Transactions Table & Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        
        {/* Table Header & Search Filter Bar */}
        <div className="p-5 border-b border-slate-200 space-y-4 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                <span>
                  {isBendaharaUtama 
                    ? `Daftar Seluruh Pengeluaran Kas (${visibleExpenses.length})` 
                    : `Riwayat Pengeluaran Kas Anda (${visibleExpenses.length})`}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isBendaharaUtama 
                  ? 'Transparansi pengeluaran kas seluruh bendahara madrasah' 
                  : 'Daftar pengeluaran kas yang telah Anda input dan pertanggungjawabkan'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Total Nominal:</span>
              <span className="text-sm font-black text-rose-700 bg-rose-100 px-3 py-1 rounded-xl">
                Rp {visibleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
            
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari uraian, nomor BKK, penerima, pos, atau nota..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Treasurer Filter (Only visible if Bendahara Utama) */}
            {isBendaharaUtama && (
              <div>
                <select
                  value={filterTreasurer}
                  onChange={e => setFilterTreasurer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="ALL">-- Semua Bendahara --</option>
                  {allTreasurers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.roleTitle} ({t.name.split(',')[0]})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source Pos Filter */}
            <div>
              <select
                value={filterSourcePos}
                onChange={e => setFilterSourcePos(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value="ALL">-- Semua Sumber Pos --</option>
                {SOURCE_POS_EXPENSE_OPTIONS.map(p => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value="ALL">-- Semua Kategori --</option>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Method Filter */}
            <div>
              <select
                value={filterMethod}
                onChange={e => setFilterMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value="ALL">-- Semua Metode --</option>
                <option value="Tunai">Tunai (Kas Fisik)</option>
                <option value="Transfer Bank">Transfer Bank</option>
              </select>
            </div>

          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto p-4 pt-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">No. BKK</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Bendahara Pengeluar</th>
                <th className="py-3 px-3">Pos & Uraian Pengeluaran</th>
                <th className="py-3 px-3">Penerima / Vendor</th>
                <th className="py-3 px-3 text-right">Nominal (Rp)</th>
                <th className="py-3 px-3 text-center">Metode</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {visibleExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 italic">
                    Belum ada data transaksi pengeluaran kas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                visibleExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-rose-900 text-[11px] whitespace-nowrap">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                      {exp.expenseDate}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900">{exp.treasurerName}</div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                        {exp.treasurerRole}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{exp.title}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          {exp.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <span>Pos:</span>
                          <strong className="text-emerald-950 font-black">{exp.sourcePosLabel || exp.sourcePos || 'Kas Umum'}</strong>
                        </span>
                        {exp.receiptNumber && (
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            Nota: {exp.receiptNumber}
                          </span>
                        )}
                      </div>
                      {exp.notes && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {exp.recipientName || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-rose-700 whitespace-nowrap text-sm">
                      Rp {exp.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exp.paymentMethod === 'Tunai'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedVoucher(exp)}
                          title="Cetak Bukti Kas Keluar (BKK)"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(isBendaharaUtama || exp.treasurerId === activeTreasurer.id) && (
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            title="Hapus Transaksi Pengeluaran"
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
            {visibleExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-rose-50/80 border-t-2 border-rose-200 font-black text-rose-950 text-xs">
                  <td colSpan={6} className="py-3 px-4 text-right uppercase">
                    TOTAL KESELURUHAN PENGELUARAN KAS:
                  </td>
                  <td className="py-3 px-3 text-right font-black text-rose-900 text-sm whitespace-nowrap">
                    Rp {visibleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString('id-ID')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL CETAK BUKTI KAS KELUAR (BKK) */}
      {/* ========================================================= */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            
            {/* Action Buttons Top */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900">
                  Pratinjau Bukti Kas Keluar (BKK)
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-6 bg-white border border-slate-300 rounded-xl space-y-6 text-slate-900" id="bkk-print-area">
              
              {/* Header Madrasah */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-lg font-black tracking-wider uppercase">
                  MADRASAH TSANAWIYAH MANBA'UL HUDA
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Jl. Pesantren No. 45, Telp: (021) 88997766 • Tahun Pelajaran {academicYear}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 border-2 border-slate-900 font-black text-xs uppercase tracking-widest bg-slate-50">
                    BUKTI KAS KELUAR (BKK)
                  </span>
                </div>
              </div>

              {/* Metadata Voucher */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-semibold">Nomor BKK:</span>
                    <strong className="font-mono text-slate-900">{selectedVoucher.expenseNumber}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-semibold">Tanggal Bayar:</span>
                    <strong>{selectedVoucher.expenseDate}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-semibold">Metode Bayar:</span>
                    <span className="font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">{selectedVoucher.paymentMethod}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-semibold">Bendahara:</span>
                    <strong>{selectedVoucher.treasurerName}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-semibold">Jabatan:</span>
                    <span className="font-bold text-indigo-700">{selectedVoucher.treasurerRole}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-semibold">No. Nota Toko:</span>
                    <span className="font-mono">{selectedVoucher.receiptNumber || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Details Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Sumber Dana / Asal Pos:</span>
                  <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedVoucher.sourcePosLabel || selectedVoucher.sourcePos || 'Kas Umum / Operasional Bebas'}
                  </span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Kategori Pengeluaran:</span>
                  <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {selectedVoucher.category}
                  </span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Keperluan / Uraian:</span>
                  <strong className="text-right text-slate-900 max-w-sm">{selectedVoucher.title}</strong>
                </div>
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Penerima Dana / Vendor:</span>
                  <strong>{selectedVoucher.recipientName || '-'}</strong>
                </div>
                {selectedVoucher.notes && (
                  <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-semibold">Catatan:</span>
                    <span className="italic text-slate-600 text-right">{selectedVoucher.notes}</span>
                  </div>
                )}
                
                {/* Nominal & Terbilang */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Jumlah Uang:</span>
                    <div className="text-xl font-black text-rose-700">
                      Rp {selectedVoucher.amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="text-right sm:max-w-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Terbilang:</span>
                    <span className="text-xs font-bold text-slate-700 italic">
                      # {numberToWords(selectedVoucher.amount)} #
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-2 pt-4 text-center text-xs">
                <div className="space-y-12">
                  <span className="text-slate-500 font-medium block">Menyetujui,</span>
                  <div>
                    <div className="font-extrabold text-slate-900 underline">
                      {schoolOfficials?.kepalaMadrasah?.name || 'H. Ahmad Syafi\'i, M.Pd'}
                    </div>
                    <span className="text-[10px] text-slate-500 block">Kepala Madrasah</span>
                  </div>
                </div>

                <div className="space-y-12">
                  <span className="text-slate-500 font-medium block">Dibayar Oleh,</span>
                  <div>
                    <div className="font-extrabold text-slate-900 underline">
                      {selectedVoucher.treasurerName}
                    </div>
                    <span className="text-[10px] text-slate-500 block">{selectedVoucher.treasurerRole}</span>
                  </div>
                </div>

                <div className="space-y-12">
                  <span className="text-slate-500 font-medium block">Diterima Oleh,</span>
                  <div>
                    <div className="font-extrabold text-slate-900 underline">
                      {selectedVoucher.recipientName || '(...................................)'}
                    </div>
                    <span className="text-[10px] text-slate-500 block">Penerima Dana / Rekanan</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL KONFIRMASI HAPUS PENGELUARAN */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Hapus Bukti Pengeluaran?</h3>
              <p className="text-xs text-slate-500">
                Anda akan menghapus transaksi pengeluaran <strong className="text-slate-800">{deleteTarget.expenseNumber}</strong> ({deleteTarget.title}) sebesar <strong className="text-rose-700">Rp {deleteTarget.amount.toLocaleString('id-ID')}</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              Perhatian: Setelah dihapus, saldo kas di tangan bendahara terkait ({deleteTarget.treasurerName}) akan bertambah kembali sebesar nominal yang dibatalkan.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Ya, Hapus Pengeluaran
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

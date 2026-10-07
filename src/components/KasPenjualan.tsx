import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingDown,
  ArrowRightLeft,
  DollarSign,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  ShoppingBag,
  Package,
  Building,
  UserCheck,
  Send,
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import {
  PaymentTransaction,
  TreasurerExpenseTransaction,
  CashDepositTransaction,
  BendaharaPerson,
  SchoolOfficials
} from '../types';
import { exportToCSV, printHtmlString } from '../utils/export';

interface KasPenjualanProps {
  payments: PaymentTransaction[];
  expenses: TreasurerExpenseTransaction[];
  cashDeposits: CashDepositTransaction[];
  activeTreasurer: BendaharaPerson;
  schoolOfficials?: SchoolOfficials;
  academicYear: string;
  onSaveExpense: (expense: TreasurerExpenseTransaction) => Promise<void> | void;
  onSaveDeposit: (deposit: CashDepositTransaction) => Promise<void> | void;
}

export const KasPenjualan: React.FC<KasPenjualanProps> = ({
  payments,
  expenses,
  cashDeposits,
  activeTreasurer,
  schoolOfficials,
  academicYear,
  onSaveExpense,
  onSaveDeposit
}) => {
  const currentTreasurer = activeTreasurer || {
    id: 'b1',
    name: 'Petugas Kasir',
    roleTitle: 'Kasir Penjualan',
    nip: '-',
    phone: '-',
    kodeUnik: 'KASIR',
    active: true
  };

  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Form Expense for Procurement (Kulakan / Belanja Stok)
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Belanja Stok Penjualan');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expRecipient, setExpRecipient] = useState('');
  const [expMethod, setExpMethod] = useState<'Tunai' | 'Transfer Bank'>('Tunai');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expReceiptNo, setExpReceiptNo] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Form Deposit to Principal Treasurer
  const [depAmount, setDepAmount] = useState<number>(0);
  const [depDate, setDepDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [depNotes, setDepNotes] = useState('');

  // 1. Sales Inflows (Kas Masuk Penjualan)
  const salesInflows = useMemo(() => {
    return payments.filter(tx => {
      if (tx.status === 'Dibatalkan') return false;
      if (tx.category === 'SERAGAM' || tx.category === 'BUKU' || tx.category === 'ATRIBUT') return true;
      if (tx.inventoryItemIds && tx.inventoryItemIds.length > 0) return true;
      if (tx.inventoryItemsPurchased && tx.inventoryItemsPurchased.length > 0) return true;
      const label = (tx.categoryLabel || '').toLowerCase();
      return (
        label.includes('jual') ||
        label.includes('koperasi') ||
        label.includes('seragam') ||
        label.includes('buku') ||
        label.includes('lks') ||
        label.includes('atribut')
      );
    });
  }, [payments]);

  // 2. Sales Outflows / Procurement Expenses (Kas Keluar Belanja Modal Stok)
  const salesExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const cat = (exp.category || '').toLowerCase();
      const title = (exp.title || '').toLowerCase();
      const notes = (exp.notes || '').toLowerCase();
      return (
        cat.includes('stok') ||
        cat.includes('kulakan') ||
        cat.includes('belanja barang') ||
        cat.includes('seragam') ||
        cat.includes('buku') ||
        cat.includes('lks') ||
        cat.includes('koperasi') ||
        title.includes('stok') ||
        title.includes('kulakan') ||
        title.includes('beli seragam') ||
        title.includes('beli buku') ||
        title.includes('pengadaan atribut') ||
        notes.includes('stok') ||
        notes.includes('kulakan')
      );
    });
  }, [expenses]);

  // 3. Sales Deposits to Central (Setoran Kas Omset Penjualan)
  const salesDeposits = useMemo(() => {
    return cashDeposits.filter(dep => {
      const notes = (dep.notes || '').toLowerCase();
      return notes.includes('penjualan') || notes.includes('koperasi') || notes.includes('seragam') || notes.includes('buku') || notes.includes('lks');
    });
  }, [cashDeposits]);

  // Aggregates
  const totalSalesIncome = useMemo(() => {
    return salesInflows.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [salesInflows]);

  const totalSalesOutflow = useMemo(() => {
    return salesExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [salesExpenses]);

  const totalSalesDeposited = useMemo(() => {
    return salesDeposits.reduce((sum, dep) => sum + (dep.amount || 0), 0);
  }, [salesDeposits]);

  // Cash on hand in sales division
  const netSalesCashBalance = totalSalesIncome - totalSalesOutflow - totalSalesDeposited;

  // Save Expense Handler
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) {
      alert('Silakan isi uraian belanja kulakan dan nominal yang valid.');
      return;
    }

    try {
      const now = new Date();
      const expenseNumber = `BKK/STOK/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const newExp: TreasurerExpenseTransaction = {
        id: `exp-sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        expenseNumber,
        treasurerId: currentTreasurer.id,
        treasurerName: currentTreasurer.name,
        treasurerRole: currentTreasurer.roleTitle,
        category: expCategory,
        title: expTitle.trim(),
        recipientName: expRecipient.trim() || 'Vendor / Distributor',
        amount: expAmount,
        expenseDate: expDate,
        paymentMethod: expMethod,
        receiptNumber: expReceiptNo.trim(),
        notes: expNotes.trim() ? `[Divisi Penjualan] ${expNotes.trim()}` : '[Divisi Penjualan/Koperasi]',
        createdAt: new Date().toISOString()
      };

      await onSaveExpense(newExp);
      setShowExpenseModal(false);
      setExpTitle('');
      setExpAmount(0);
      setExpRecipient('');
      setExpNotes('');
      setActionSuccessMsg(`Pengeluaran kulakan/belanja stok berhasil dicatat! No. BKK: ${expenseNumber}`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Gagal mencatat pengeluaran: ${err?.message || 'Error'}`);
    }
  };

  // Save Deposit Handler
  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depAmount <= 0) {
      alert('Silakan masukkan nominal setoran yang valid.');
      return;
    }

    try {
      const now = new Date();
      const depositNumber = `STR/JUAL/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const newDep: CashDepositTransaction = {
        id: `dep-sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        depositNumber,
        fromTreasurerId: currentTreasurer.id,
        fromTreasurerName: currentTreasurer.name,
        fromTreasurerRole: currentTreasurer.roleTitle,
        toTreasurerId: 'bu',
        toTreasurerName: schoolOfficials?.bendaharaUtama?.name || schoolOfficials?.bendahara?.name || 'Bendahara Utama',
        toTreasurerRole: 'Bendahara Utama',
        amount: depAmount,
        depositDate: depDate,
        notes: depNotes.trim() ? `Setoran Omset Penjualan: ${depNotes.trim()}` : 'Setoran Kas Hasil Penjualan Koperasi / Seragam',
        status: 'Diterima',
        createdAt: new Date().toISOString()
      };

      await onSaveDeposit(newDep);
      setShowDepositModal(false);
      setDepAmount(0);
      setDepNotes('');
      setActionSuccessMsg(`Setoran kas hasil penjualan Rp ${depAmount.toLocaleString('id-ID')} berhasil dicatat!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Gagal mencatat setoran: ${err?.message || 'Error'}`);
    }
  };

  // Combined Cash Book / Jurnal Mutasi
  const cashBookRows = useMemo(() => {
    const rows: Array<{
      date: string;
      refNo: string;
      description: string;
      type: 'IN' | 'OUT' | 'DEPOSIT';
      amountIn: number;
      amountOut: number;
      actor: string;
    }> = [];

    // Inflows
    salesInflows.forEach(tx => {
      rows.push({
        date: tx.paymentDate,
        refNo: tx.invoiceNumber,
        description: `Penerimaan Penjualan: ${tx.studentName} (${tx.className}) - ${tx.categoryLabel}`,
        type: 'IN',
        amountIn: tx.amount,
        amountOut: 0,
        actor: tx.receivedBy
      });
    });

    // Expenses
    salesExpenses.forEach(exp => {
      rows.push({
        date: exp.expenseDate,
        refNo: exp.expenseNumber,
        description: `Belanja/Kulakan: ${exp.title} (Kepada: ${exp.recipientName || '-'})`,
        type: 'OUT',
        amountIn: 0,
        amountOut: exp.amount,
        actor: exp.treasurerName
      });
    });

    // Deposits
    salesDeposits.forEach(dep => {
      rows.push({
        date: dep.depositDate,
        refNo: dep.depositNumber,
        description: `Setoran Omset ke Bendahara Utama (${dep.notes || '-'})`,
        type: 'DEPOSIT',
        amountIn: 0,
        amountOut: dep.amount,
        actor: dep.fromTreasurerName
      });
    });

    // Sort by date descending
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [salesInflows, salesExpenses, salesDeposits]);

  // Export CSV
  const handleExportCSV = () => {
    let runningBalance = 0;
    const sortedAsc = [...cashBookRows].sort((a, b) => a.date.localeCompare(b.date));
    const headers = ['No', 'Tanggal', 'No. Referensi', 'Keterangan', 'Kas Masuk / Omset (Rp)', 'Kas Keluar / Belanja (Rp)', 'Saldo Kas (Rp)', 'Petugas'];
    const rows: (string | number)[][] = [headers];
    sortedAsc.forEach((r, idx) => {
      runningBalance += r.amountIn - r.amountOut;
      rows.push([
        idx + 1,
        r.date,
        r.refNo,
        r.description,
        r.amountIn || 0,
        r.amountOut || 0,
        runningBalance,
        r.actor
      ]);
    });

    exportToCSV(`Buku_Kas_Penjualan_${academicYear.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Kas Omset Penjualan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-emerald-700 mt-2">
            Rp {totalSalesIncome.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-500">{salesInflows.length} Transaksi Penerimaan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Kas Keluar Belanja Stok</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-rose-700 mt-2">
            Rp {totalSalesOutflow.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-500">{salesExpenses.length} Belanja Pengadaan Barang</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Setoran ke Bendahara Utama</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-teal-900 mt-2">
            Rp {totalSalesDeposited.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-500">{salesDeposits.length} Kali Setoran Kas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Sisa Kas Penjualan di Tangan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-black text-amber-900 mt-2">
            Rp {netSalesCashBalance.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-amber-600 font-semibold">Kas Fisik Penjualan</p>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-emerald-700" />
            <span>Buku Kas & Modal Belanja Penjualan (Koperasi / Toko)</span>
          </h3>
          <p className="text-xs text-slate-500">Kelola arus kas omset, belanja modal barang, dan setoran kas toko</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Belanja / Kulakan Stok</span>
          </button>

          <button
            onClick={() => setShowDepositModal(true)}
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Setor Kas ke Bendahara Utama</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Cash Book Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
            Jurnal Arus Kas Unit Penjualan ({cashBookRows.length} Catatan)
          </h4>
          <span className="text-[11px] font-bold text-slate-400">Tahun Ajaran {academicYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal & No. Ref</th>
                <th className="py-3 px-4">Keterangan Transaksi</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4 text-right">Kas Masuk (Omset)</th>
                <th className="py-3 px-4 text-right">Kas Keluar (Belanja)</th>
                <th className="py-3 px-4">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {cashBookRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-black text-slate-900">{row.refNo}</div>
                    <div className="text-[10px] text-slate-400">{row.date}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-800">
                    {row.description}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        row.type === 'IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.type === 'OUT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {row.type === 'IN' ? 'Penjualan' : row.type === 'OUT' ? 'Kulakan Stok' : 'Setoran Kas'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-black text-emerald-700">
                    {row.amountIn > 0 ? `Rp ${row.amountIn.toLocaleString('id-ID')}` : '-'}
                  </td>

                  <td className="py-3 px-4 text-right font-black text-rose-700">
                    {row.amountOut > 0 ? `Rp ${row.amountOut.toLocaleString('id-ID')}` : '-'}
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-bold">
                    {row.actor}
                  </td>
                </tr>
              ))}

              {cashBookRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold">Belum ada catatan mutasi kas penjualan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Belanja Modal / Kulakan Stok */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-700">
                <TrendingDown className="w-5 h-5" />
                <h3 className="text-sm font-black">Catat Belanja Modal / Kulakan Stok</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Uraian Belanja / Pengadaan Barang
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kulakan Kain Seragam Olahraga 50 Pcs"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Nominal Belanja (Rp)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={5000}
                    placeholder="Contoh: 1500000"
                    value={expAmount || ''}
                    onChange={e => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-rose-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Penerima / Toko Vendor</label>
                  <input
                    type="text"
                    placeholder="Nama Vendor / Toko Kain"
                    value={expRecipient}
                    onChange={e => setExpRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tanggal Pengeluaran</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Metode Pembayaran</label>
                  <select
                    value={expMethod}
                    onChange={e => setExpMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Tunai">Tunai (Kas Toko)</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">No. Nota / Kwitansi Toko (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: NOTA-1284"
                  value={expReceiptNo}
                  onChange={e => setExpReceiptNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                >
                  Simpan Pengeluaran Belanja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Setoran Kas Penjualan */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-teal-700">
                <ArrowRightLeft className="w-5 h-5" />
                <h3 className="text-sm font-black">Setor Kas Penjualan ke Bendahara Utama</h3>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeposit} className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span>Sisa kas penjualan di tangan saat ini: </span>
                <strong className="font-black">Rp {netSalesCashBalance.toLocaleString('id-ID')}</strong>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nominal yang Disetor (Rp)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={5000}
                  placeholder={`Contoh: ${Math.max(0, netSalesCashBalance)}`}
                  value={depAmount || ''}
                  onChange={e => setDepAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-teal-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tanggal Setoran</label>
                <input
                  type="date"
                  value={depDate}
                  onChange={e => setDepDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Catatan Setoran</label>
                <input
                  type="text"
                  placeholder="Contoh: Setoran hasil penjualan seragam & LKS minggu ke-2"
                  value={depNotes}
                  onChange={e => setDepNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                >
                  Simpan Setoran Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

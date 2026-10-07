import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Calendar,
  Printer,
  Download,
  Trash2,
  Tag,
  Shirt,
  BookOpen,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
  Info
} from 'lucide-react';
import {
  PaymentTransaction,
  InventoryItem,
  BendaharaPerson,
  SchoolOfficials
} from '../types';
import { exportToCSV, printHtmlString } from '../utils/export';

interface RiwayatPenjualanProps {
  payments: PaymentTransaction[];
  inventory: InventoryItem[];
  classList: string[];
  activeTreasurer: BendaharaPerson;
  schoolOfficials?: SchoolOfficials;
  academicYear: string;
  onDeleteTransaction?: (txId: string) => Promise<void> | void;
  onRestockItem?: (
    itemId: string,
    qty: number,
    metadata: {
      treasurerName: string;
      notes?: string;
      date?: string;
      unitPrice?: number;
    }
  ) => { success: boolean; item?: InventoryItem; log?: any };
}

export const RiwayatPenjualan: React.FC<RiwayatPenjualanProps> = ({
  payments,
  inventory,
  classList,
  activeTreasurer,
  schoolOfficials,
  academicYear,
  onDeleteTransaction,
  onRestockItem
}) => {
  const currentTreasurerName = activeTreasurer?.name || 'Petugas Kasir';
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SERAGAM' | 'BUKU' | 'ATRIBUT'>('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Detail Modal & Print Modal
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<PaymentTransaction | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Filter only sales transactions
  const salesTransactions = useMemo(() => {
    return payments.filter(tx => {
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

  // Apply filters
  const filteredTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    return salesTransactions.filter(tx => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = tx.invoiceNumber.toLowerCase().includes(q);
        const matchName = tx.studentName.toLowerCase().includes(q);
        const matchClass = tx.className.toLowerCase().includes(q);
        const matchLabel = tx.categoryLabel.toLowerCase().includes(q);
        const matchRec = tx.receivedBy.toLowerCase().includes(q);
        if (!matchInv && !matchName && !matchClass && !matchLabel && !matchRec) return false;
      }

      // Class
      if (classFilter !== 'ALL' && tx.className !== classFilter) return false;

      // Category
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'SERAGAM' && tx.category !== 'SERAGAM' && !tx.categoryLabel.toLowerCase().includes('seragam')) return false;
        if (categoryFilter === 'BUKU' && tx.category !== 'BUKU' && !tx.categoryLabel.toLowerCase().includes('buku') && !tx.categoryLabel.toLowerCase().includes('lks')) return false;
        if (categoryFilter === 'ATRIBUT' && tx.category !== 'ATRIBUT' && !tx.categoryLabel.toLowerCase().includes('atribut')) return false;
      }

      // Method
      if (methodFilter !== 'ALL' && tx.paymentMethod !== methodFilter) return false;

      // Date Range
      if (dateFilter === 'TODAY' && tx.paymentDate !== todayStr) return false;
      if (dateFilter === 'THIS_MONTH' && !tx.paymentDate.startsWith(currentMonthStr)) return false;
      if (dateFilter === 'CUSTOM') {
        if (startDate && tx.paymentDate < startDate) return false;
        if (endDate && tx.paymentDate > endDate) return false;
      }

      return true;
    });
  }, [salesTransactions, searchQuery, classFilter, categoryFilter, methodFilter, dateFilter, startDate, endDate]);

  // Aggregates
  const totalOmset = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTransactions]);

  const totalItemsSold = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => {
      if (tx.inventoryItemsPurchased && tx.inventoryItemsPurchased.length > 0) {
        return sum + tx.inventoryItemsPurchased.reduce((acc, it) => acc + (it.quantity || 1), 0);
      }
      return sum + 1;
    }, 0);
  }, [filteredTransactions]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No', 'No. Nota', 'Tanggal', 'Nama Pembeli', 'Kelas', 'Kategori', 'Rincian Item', 'Metode Bayar', 'Nominal (Rp)', 'Kasir', 'Catatan'];
    const rows: (string | number)[][] = [headers];
    filteredTransactions.forEach((tx, idx) => {
      rows.push([
        idx + 1,
        tx.invoiceNumber,
        tx.paymentDate,
        tx.studentName,
        tx.className,
        tx.category,
        (tx.inventoryItemsPurchased || []).map(i => `${i.itemName} (${i.quantity}x)`).join('; ') || tx.categoryLabel,
        tx.paymentMethod,
        tx.amount,
        tx.receivedBy,
        tx.notes || '-'
      ]);
    });

    exportToCSV(`Riwayat_Penjualan_Barang_${academicYear.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  // Print Receipt
  const handlePrintNota = (tx: PaymentTransaction) => {
    const schoolName = schoolOfficials?.namaSekolah || 'MADRASAH / SEKOLAH';
    const schoolAddress = schoolOfficials?.alamatSekolah || 'Jl. Pendidikan No. 1';

    const itemsRows = (tx.inventoryItemsPurchased || []).map((item, idx) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; font-size: 11px;">${idx + 1}. ${item.itemName} ${item.size ? `(${item.size})` : ''}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; text-align: right; font-size: 11px;">Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #cbd5e1; text-align: right; font-weight: bold; font-size: 11px;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota Penjualan - ${tx.invoiceNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; margin: 0; padding: 6px; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .title { font-size: 14px; font-weight: bold; }
          .sub { font-size: 10px; margin-top: 2px; }
          .meta { margin-bottom: 8px; font-size: 11px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th { border-bottom: 1px solid #000; padding: 4px; font-size: 11px; text-align: left; }
          .total-box { border-top: 1px dashed #000; border-bottom: 2px solid #000; padding: 6px 0; margin-bottom: 10px; }
          .footer { text-align: center; font-size: 10px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${schoolName}</div>
          <div class="sub">UNIT PENJUALAN & KOPERASI MADRASAH</div>
          <div class="sub">${schoolAddress}</div>
        </div>

        <div class="meta">
          <div class="meta-row"><span>No. Nota:</span><strong>${tx.invoiceNumber}</strong></div>
          <div class="meta-row"><span>Tanggal:</span><span>${tx.paymentDate}</span></div>
          <div class="meta-row"><span>Pembeli:</span><strong>${tx.studentName} (${tx.className})</strong></div>
          <div class="meta-row"><span>Kasir:</span><span>${tx.receivedBy}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Harga</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || `<tr><td colspan="4">${tx.categoryLabel}</td></tr>`}
          </tbody>
        </table>

        <div class="total-box">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
            <span>TOTAL BELANJA:</span>
            <span>Rp ${tx.amount.toLocaleString('id-ID')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 3px;">
            <span>Metode:</span>
            <span>${tx.paymentMethod}</span>
          </div>
        </div>

        <div class="footer">
          <div>*** TERIMA KASIH ***</div>
          <div>Unit Koperasi & Penjualan Madrasah</div>
        </div>
      </body>
      </html>
    `;

    printHtmlString(`Nota Penjualan - ${tx.invoiceNumber}`, html);
  };

  // Confirm Delete / Return Transaction
  const handleConfirmDelete = async () => {
    if (!txToDelete) return;

    try {
      // Re-stock items if handler provided
      if (onRestockItem && txToDelete.inventoryItemsPurchased) {
        for (const it of txToDelete.inventoryItemsPurchased) {
          onRestockItem(it.itemId, it.quantity, {
            treasurerName: currentTreasurerName,
            notes: `Pengembalian/Retur Transaksi Nota: ${txToDelete.invoiceNumber}`,
            date: new Date().toISOString().split('T')[0]
          });
        }
      }

      if (onDeleteTransaction) {
        await onDeleteTransaction(txToDelete.id);
      }

      setActionSuccessMsg(`Transaksi ${txToDelete.invoiceNumber} berhasil dibatalkan & stok dikembalikan.`);
      setTxToDelete(null);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Gagal membatalkan transaksi: ${err?.message || 'Error'}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toast */}
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

      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Omset Penjualan Terfilter</p>
          <h3 className="text-lg font-black text-emerald-700 mt-1">
            Rp {totalOmset.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-500">{filteredTransactions.length} Transaksi Nota</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Barang Terjual</p>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            {totalItemsSold} Unit / Pcs
          </h3>
          <p className="text-[10px] text-emerald-600 font-semibold">Seragam, Buku & Atribut</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Ekspor Laporan</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">Unduh data transaksi</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no. nota, nama pembeli, kasir..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="SERAGAM">Seragam</option>
              <option value="BUKU">Buku / LKS</option>
              <option value="ATRIBUT">Atribut & ATK</option>
            </select>

            {/* Date Preset */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="CUSTOM">Rentang Kustom</option>
            </select>

            {/* Payment Method */}
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Metode</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
            </select>

            {(searchQuery || categoryFilter !== 'ALL' || dateFilter !== 'ALL' || methodFilter !== 'ALL' || classFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setDateFilter('ALL');
                  setMethodFilter('ALL');
                  setClassFilter('ALL');
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-bold">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
            <span className="text-slate-500 font-bold">s.d:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Nota & Tgl</th>
                <th className="py-3 px-4">Pembeli & Kelas</th>
                <th className="py-3 px-4">Rincian Item Barang</th>
                <th className="py-3 px-4 text-right">Total Bayar</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-black text-slate-900">{tx.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400">{tx.paymentDate}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{tx.studentName}</div>
                    <div className="text-[10px] text-slate-500">{tx.className}</div>
                  </td>

                  <td className="py-3 px-4">
                    {tx.inventoryItemsPurchased && tx.inventoryItemsPurchased.length > 0 ? (
                      <div className="space-y-0.5">
                        {tx.inventoryItemsPurchased.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700 flex items-center space-x-1">
                            <span className="font-bold">{it.itemName}</span>
                            {it.size && <span className="text-[9px] bg-slate-100 px-1 rounded text-slate-600">({it.size})</span>}
                            <span className="text-emerald-700 font-bold">x{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[11px]">{tx.categoryLabel}</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="font-black text-slate-900 text-xs">
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {tx.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-700 font-bold">{tx.receivedBy}</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => handlePrintNota(tx)}
                        title="Cetak Ulang Nota Kasir"
                        className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteTransaction && (
                        <button
                          onClick={() => setTxToDelete(tx)}
                          title="Batalkan Nota / Retur Barang"
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold">Tidak ada riwayat penjualan sesuai filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete / Return Modal Confirmation */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-black">Batalkan / Retur Nota Penjualan?</h3>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <p>Nota: <strong>{txToDelete.invoiceNumber}</strong></p>
              <p>Pembeli: <strong>{txToDelete.studentName} ({txToDelete.className})</strong></p>
              <p>Total: <strong>Rp {txToDelete.amount.toLocaleString('id-ID')}</strong></p>
              <p className="text-[11px] text-rose-700 font-bold">
                ⚠️ Transaksi ini akan dihapus dari buku kas penjualan dan seluruh stok barang yang tercatat akan dikembalikan secara otomatis ke gudang.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
              >
                Ya, Batalkan & Kembalikan Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

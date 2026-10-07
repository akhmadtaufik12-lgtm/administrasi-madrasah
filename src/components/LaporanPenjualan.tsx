import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Printer,
  FileSpreadsheet,
  Calendar,
  Layers,
  Shirt,
  BookOpen,
  Tag,
  Package,
  ShoppingBag,
  Award,
  DollarSign,
  PieChart,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  PaymentTransaction,
  InventoryItem,
  TreasurerExpenseTransaction,
  BendaharaPerson,
  SchoolOfficials
} from '../types';
import { exportToCSV, printHtmlString } from '../utils/export';

interface LaporanPenjualanProps {
  payments: PaymentTransaction[];
  inventory: InventoryItem[];
  expenses: TreasurerExpenseTransaction[];
  schoolOfficials?: SchoolOfficials;
  academicYear: string;
  activeTreasurer: BendaharaPerson;
}

export const LaporanPenjualan: React.FC<LaporanPenjualanProps> = ({
  payments,
  inventory,
  expenses,
  schoolOfficials,
  academicYear,
  activeTreasurer
}) => {
  const currentTreasurer = activeTreasurer || {
    id: 'b1',
    name: 'Petugas / Pengelola Penjualan',
    roleTitle: 'Petugas Penjualan',
    nip: '-',
    phone: '-',
    kodeUnik: 'KASIR',
    active: true
  };

  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SERAGAM' | 'LKS' | 'ATRIBUT'>('ALL');

  // Filter sales payments
  const salesPayments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    return payments.filter(tx => {
      if (tx.status === 'Dibatalkan') return false;
      const isSale =
        tx.category === 'SERAGAM' ||
        tx.category === 'BUKU' ||
        tx.category === 'ATRIBUT' ||
        (tx.inventoryItemIds && tx.inventoryItemIds.length > 0) ||
        (tx.inventoryItemsPurchased && tx.inventoryItemsPurchased.length > 0) ||
        tx.categoryLabel.toLowerCase().includes('seragam') ||
        tx.categoryLabel.toLowerCase().includes('buku') ||
        tx.categoryLabel.toLowerCase().includes('lks') ||
        tx.categoryLabel.toLowerCase().includes('atribut');

      if (!isSale) return false;

      // Period filter
      if (periodFilter === 'THIS_MONTH' && !tx.paymentDate.startsWith(currentMonth)) return false;
      if (periodFilter === 'CUSTOM') {
        if (startDate && tx.paymentDate < startDate) return false;
        if (endDate && tx.paymentDate > endDate) return false;
      }

      return true;
    });
  }, [payments, periodFilter, startDate, endDate]);

  // Aggregate items sold breakdown
  const itemSalesMap = useMemo(() => {
    const map: Record<string, {
      itemId: string;
      name: string;
      category: string;
      size?: string;
      quantitySold: number;
      totalRevenue: number;
      avgUnitPrice: number;
    }> = {};

    salesPayments.forEach(tx => {
      if (tx.inventoryItemsPurchased && tx.inventoryItemsPurchased.length > 0) {
        tx.inventoryItemsPurchased.forEach(item => {
          const key = `${item.itemId}_${item.size || 'std'}`;
          if (!map[key]) {
            map[key] = {
              itemId: item.itemId,
              name: item.itemName,
              category: item.variantType || 'Barang',
              size: item.size,
              quantitySold: 0,
              totalRevenue: 0,
              avgUnitPrice: item.unitPrice
            };
          }
          map[key].quantitySold += item.quantity;
          map[key].totalRevenue += item.subtotal;
        });
      } else {
        // Fallback for single item category label
        const key = `cat_${tx.category}_${tx.categoryLabel}`;
        if (!map[key]) {
          map[key] = {
            itemId: key,
            name: tx.categoryLabel || tx.category,
            category: tx.category,
            quantitySold: 0,
            totalRevenue: 0,
            avgUnitPrice: tx.amount
          };
        }
        map[key].quantitySold += 1;
        map[key].totalRevenue += tx.amount;
      }
    });

    return Object.values(map);
  }, [salesPayments]);

  // Total Omset
  const totalOmset = useMemo(() => {
    return salesPayments.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [salesPayments]);

  // Total Units Sold
  const totalUnitsSold = useMemo(() => {
    return itemSalesMap.reduce((sum, it) => sum + it.quantitySold, 0);
  }, [itemSalesMap]);

  // Category breakdown
  const categoryRevenue = useMemo(() => {
    let seragam = 0;
    let buku = 0;
    let atribut = 0;
    let lainnya = 0;

    salesPayments.forEach(tx => {
      const cat = tx.category;
      const label = tx.categoryLabel.toLowerCase();
      if (cat === 'SERAGAM' || label.includes('seragam')) {
        seragam += tx.amount;
      } else if (cat === 'BUKU' || label.includes('buku') || label.includes('lks')) {
        buku += tx.amount;
      } else if (cat === 'ATRIBUT' || label.includes('atribut') || label.includes('topi') || label.includes('dasi')) {
        atribut += tx.amount;
      } else {
        lainnya += tx.amount;
      }
    });

    return { seragam, buku, atribut, lainnya };
  }, [salesPayments]);

  // Total Inventory Asset Value (Stock currently held)
  const totalInventoryAssetValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
  }, [inventory]);

  // Top Selling Items (Sort descending by quantity sold)
  const topSellingItems = useMemo(() => {
    return [...itemSalesMap].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
  }, [itemSalesMap]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Nama Barang', 'Kategori', 'Ukuran', 'Jumlah Terjual (Unit)', 'Harga Satuan (Rp)', 'Total Omset (Rp)'];
    const rows: (string | number)[][] = [headers];
    itemSalesMap.forEach((it, idx) => {
      rows.push([
        idx + 1,
        it.name,
        it.category,
        it.size || '-',
        it.quantitySold,
        it.avgUnitPrice,
        it.totalRevenue
      ]);
    });

    exportToCSV(`Rekap_Laporan_Penjualan_Barang_${academicYear.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  // Print Official Report
  const handlePrintOfficialReport = () => {
    const schoolName = schoolOfficials?.namaSekolah || 'MADRASAH / SEKOLAH';
    const schoolAddress = schoolOfficials?.alamatSekolah || 'Jl. Pendidikan No. 1';
    const kepalaSekolah = schoolOfficials?.kepalaSekolah?.name || 'Kepala Madrasah';
    const bendaharaName = currentTreasurer.name;
    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const itemsTable = itemSalesMap.map((it, idx) => `
      <tr>
        <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${it.name} ${it.size ? `(${it.size})` : ''}</td>
        <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${it.quantitySold} pcs</td>
        <td style="text-align: right; padding: 6px 8px; border: 1px solid #cbd5e1;">Rp ${it.avgUnitPrice.toLocaleString('id-ID')}</td>
        <td style="text-align: right; padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">Rp ${it.totalRevenue.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Penjualan Barang - ${academicYear}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; margin: 0; padding: 0; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .inst-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; }
          .inst-sub { font-size: 11pt; }
          .report-title { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11pt; }
          th { background-color: #f1f5f9; padding: 8px; border: 1px solid #000; font-weight: bold; text-align: center; }
          .total-row { background-color: #f8fafc; font-weight: bold; }
          .signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-box { width: 45%; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="inst-name">${schoolName}</div>
          <div class="inst-sub">UNIT USAHA KOPERASI & PENJUALAN MADRASAH</div>
          <div class="inst-sub">${schoolAddress}</div>
          <div class="report-title">LAPORAN REKAPITULASI PENJUALAN BARANG</div>
          <div style="font-size: 10pt; margin-top: 4px;">Tahun Ajaran: ${academicYear} | Periode: ${periodFilter === 'ALL' ? 'Seluruh Transaksi' : periodFilter === 'THIS_MONTH' ? 'Bulan Berjalan' : `${startDate} s.d ${endDate}`}</div>
        </div>

        <div style="margin-bottom: 12px; font-size: 11pt;">
          <strong>Ringkasan Penerimaan Penjualan:</strong>
          <ul>
            <li>Total Omset Penjualan: <strong>Rp ${totalOmset.toLocaleString('id-ID')}</strong></li>
            <li>Total Unit Barang Terdistribusi: <strong>${totalUnitsSold} Pcs</strong></li>
            <li>Estimasi Nilai Persediaan Stok Tersisa: <strong>Rp ${totalInventoryAssetValue.toLocaleString('id-ID')}</strong></li>
          </ul>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 45%; text-align: left;">Nama Barang & Spesifikasi</th>
              <th style="width: 15%;">Jumlah Terjual</th>
              <th style="width: 15%; text-align: right;">Harga Rata-rata</th>
              <th style="width: 20%; text-align: right;">Total Penerimaan (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
            <tr class="total-row">
              <td colspan="2" style="text-align: right; padding: 8px; border: 1px solid #000;">TOTAL OMSET PENJUALAN:</td>
              <td style="text-align: center; padding: 8px; border: 1px solid #000;">${totalUnitsSold} pcs</td>
              <td style="border: 1px solid #000;"></td>
              <td style="text-align: right; padding: 8px; border: 1px solid #000; font-size: 12pt;">Rp ${totalOmset.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <div>Mengetahui,</div>
            <div>Kepala Madrasah</div>
            <div style="margin-top: 60px; font-weight: bold; text-decoration: underline;">${kepalaSekolah}</div>
            <div>NIP. ${schoolOfficials?.kepalaSekolah?.nip || '-'}</div>
          </div>
          <div class="sig-box">
            <div>${schoolOfficials?.kotaSekolah || 'Ditetapkan'}, ${printDate}</div>
            <div>Petugas / Pengelola Penjualan</div>
            <div style="margin-top: 60px; font-weight: bold; text-decoration: underline;">${bendaharaName}</div>
            <div>${currentTreasurer.roleTitle}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printHtmlString(`Laporan Pertanggungjawaban Penjualan - ${academicYear}`, html);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Laporan Penjualan & Koperasi
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                TA {academicYear}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Laporan Omset, Mutasi & Perputaran Barang
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Tinjauan lengkap transaksi penjualan Seragam, Buku/LKS, Atribut, dan Merchandise madrasah beserta ranking produk terlaris.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintOfficialReport}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF Resmi</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Omset Penjualan</span>
          <h3 className="text-lg font-black text-emerald-700 mt-1">
            Rp {totalOmset.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-slate-500">{salesPayments.length} Nota Transaksi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Item Terdistribusi</span>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            {totalUnitsSold} Pcs / Unit
          </h3>
          <p className="text-[10px] text-emerald-600 font-semibold">Seragam, LKS & Atribut</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Nilai Aset Persediaan Stok</span>
          <h3 className="text-lg font-black text-indigo-700 mt-1">
            Rp {totalInventoryAssetValue.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-indigo-600 font-semibold">{inventory.length} Variasi Item di Gudang</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Transaksi</span>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Rp {salesPayments.length > 0 ? Math.round(totalOmset / salesPayments.length).toLocaleString('id-ID') : 0}
          </h3>
          <p className="text-[10px] text-slate-500">Per Nota Penjualan</p>
        </div>
      </div>

      {/* Category Breakdown & Top Selling Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Breakdown by Category */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
            <PieChart className="w-4 h-4 text-emerald-700" />
            <span>Penerimaan Berdasarkan Kategori Barang</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center space-x-1.5 text-slate-700">
                  <Shirt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Seragam Sekolah</span>
                </span>
                <span className="text-indigo-900 font-black">
                  Rp {categoryRevenue.seragam.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${totalOmset > 0 ? (categoryRevenue.seragam / totalOmset) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center space-x-1.5 text-slate-700">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Buku Paket / Modul LKS</span>
                </span>
                <span className="text-emerald-900 font-black">
                  Rp {categoryRevenue.buku.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${totalOmset > 0 ? (categoryRevenue.buku / totalOmset) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center space-x-1.5 text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Atribut & Kelengkapan</span>
                </span>
                <span className="text-amber-900 font-black">
                  Rp {categoryRevenue.atribut.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${totalOmset > 0 ? (categoryRevenue.atribut / totalOmset) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>5 Produk Paling Laris (Fast Moving)</span>
          </h3>

          <div className="space-y-2">
            {topSellingItems.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[11px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-500">{item.size ? `Ukuran: ${item.size} • ` : ''}Omset: Rp {item.totalRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                  {item.quantitySold} pcs
                </span>
              </div>
            ))}

            {topSellingItems.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Belum ada data barang terjual.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Sales Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
            Tabel Rekapitulasi Penjualan per Item Barang
          </h4>
          <span className="text-[11px] font-bold text-slate-500">{itemSalesMap.length} Jenis Item</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 text-center">Ukuran / Varian</th>
                <th className="py-3 px-4 text-center">Jumlah Terjual</th>
                <th className="py-3 px-4 text-right">Harga Satuan</th>
                <th className="py-3 px-4 text-right">Total Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {itemSalesMap.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{it.name}</td>
                  <td className="py-3 px-4 text-center text-slate-600">{it.size || '-'}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">{it.quantitySold} pcs</td>
                  <td className="py-3 px-4 text-right text-slate-700">Rp {it.avgUnitPrice.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">Rp {it.totalRevenue.toLocaleString('id-ID')}</td>
                </tr>
              ))}

              {itemSalesMap.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold">Belum ada transaksi penjualan pada periode ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

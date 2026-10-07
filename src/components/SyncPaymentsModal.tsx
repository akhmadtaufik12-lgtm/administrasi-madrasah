import React, { useState, useMemo } from 'react';
import { PaymentTransaction, Student } from '../types';
import { countUnsyncedPayments, isPaymentForStudent } from '../utils/storage';
import {
  ArrowRightLeft,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCheck,
  CreditCard,
  UserCheck
} from 'lucide-react';

interface SyncPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: PaymentTransaction[];
  students: Student[];
  onExecuteSync: () => Promise<any> | any;
  syncResult?: {
    syncedCount: number;
    alreadySyncedCount: number;
    unmatchedCount: number;
    details: Array<{
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
    }>;
  } | null;
}

export const SyncPaymentsModal: React.FC<SyncPaymentsModalProps> = ({
  isOpen,
  onClose,
  payments,
  students,
  onExecuteSync,
  syncResult
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'NEED_SYNC' | 'ALREADY_SYNCED'>('NEED_SYNC');

  // Calculate live unsynced statistics
  const stats = useMemo(() => {
    return countUnsyncedPayments(payments, students);
  }, [payments, students]);

  // Generate detailed pre-sync match list
  const previewList = useMemo(() => {
    const studentIds = new Set(students.map(s => s.id));
    return payments.map(p => {
      const isAlreadySynced = studentIds.has(p.studentId);
      const matched = isAlreadySynced ? students.find(s => s.id === p.studentId) : students.find(s => isPaymentForStudent(p, s));
      
      let reason = '-';
      if (matched) {
        if (p.nisn && matched.nisn && p.nisn.trim() === matched.nisn.trim()) reason = `NISN Cocok (${p.nisn})`;
        else if (p.nis && matched.nis && p.nis.trim() === matched.nis.trim()) reason = `NIS Cocok (${p.nis})`;
        else if (matched.className) reason = `Nama & Kelas (${matched.className})`;
        else reason = 'Nama Lengkap Sesuai';
      }

      return {
        payment: p,
        isAlreadySynced,
        canBeSynced: !isAlreadySynced && !!matched,
        matchedStudent: matched,
        reason
      };
    });
  }, [payments, students]);

  // Filtered preview items
  const filteredList = useMemo(() => {
    return previewList.filter(item => {
      if (activeFilterTab === 'NEED_SYNC' && !item.canBeSynced) return false;
      if (activeFilterTab === 'ALREADY_SYNCED' && !item.isAlreadySynced) return false;
      
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.payment.invoiceNumber.toLowerCase().includes(q) ||
        item.payment.studentName.toLowerCase().includes(q) ||
        item.payment.className.toLowerCase().includes(q) ||
        (item.matchedStudent && item.matchedStudent.name.toLowerCase().includes(q)) ||
        (item.payment.nisn && item.payment.nisn.includes(q))
      );
    });
  }, [previewList, activeFilterTab, searchFilter]);

  const handleRunSync = async () => {
    setIsProcessing(true);
    try {
      await onExecuteSync();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Sinkronisasi Riwayat Pembayaran Siswa</h3>
              <p className="text-xs text-emerald-200/80">Hubungkan kwitansi pembayaran lama ke data siswa saat ini</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                  Mengapa Siswa yang Sudah Bayar Terbaca Menunggak?
                </p>
                <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                  Ketika data siswa sempat dihapus dan dimasukkan/diimpor ulang, ID unik internal siswa berubah sehingga riwayat kwitansi lama terputus ikatannya. Fitur ini secara cerdas mencocokkan kembali pembayaran melalui <strong>NISN, NIS, dan Nama Lengkap + Kelas</strong>, lalu memperbarui relasi data secara otomatis.
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
                {syncResult ? (syncResult.alreadySyncedCount + syncResult.syncedCount) : (payments.length - stats.orphanCount)}
              </p>
              <p className="text-[10px] text-emerald-700">Sesuai Siswa Aktif</p>
            </div>

            <div className={`border rounded-xl p-3 text-center transition ${
              stats.fixableCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Perlu Sinkronisasi</p>
              <p className="text-lg font-black text-amber-900">
                {syncResult ? 0 : stats.fixableCount}
              </p>
              <p className="text-[10px] text-amber-700">
                {stats.fixableCount > 0 ? 'Ditemukan Cocok' : 'Semua Terhubung Rapi'}
              </p>
            </div>
          </div>

          {/* Success Result Banner if freshly synced */}
          {syncResult && syncResult.syncedCount > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center space-x-3 text-emerald-900 animate-in fade-in">
              <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-black text-xs sm:text-sm text-emerald-950">
                  Berhasil Menghubungkan {syncResult.syncedCount} Transaksi Pembayaran!
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Status tagihan siswa kini telah diperbarui dan otomatis tercatat sebagai <strong>Lunas</strong> sesuai riwayat pembayaran aslinya. Notifikasi sinkronisasi telah dihilangkan.
                </p>
              </div>
            </div>
          )}

          {/* Details Table & Filtering */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('NEED_SYNC')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeFilterTab === 'NEED_SYNC'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Perlu Sinkronisasi ({stats.fixableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('ALREADY_SYNCED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeFilterTab === 'ALREADY_SYNCED'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sudah Terhubung ({payments.length - stats.orphanCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeFilterTab === 'ALL'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({payments.length})
                </button>
              </div>

              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kwitansi / nama..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No. Kwitansi</th>
                    <th className="py-2 px-3">Nama di Kwitansi</th>
                    <th className="py-2 px-3">Siswa Cocok</th>
                    <th className="py-2 px-3 text-right">Nominal</th>
                    <th className="py-2 px-3 text-center">Status Hubungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        {activeFilterTab === 'NEED_SYNC' && stats.fixableCount === 0
                          ? 'Tidak ada perbedaan antara data siswa dan riwayat transaksi. Semua pembayaran sudah terhubung rapi!'
                          : 'Tidak ada data kwitansi yang sesuai filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredList.slice(0, 50).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-600">
                          {item.payment.invoiceNumber}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          <div>{item.payment.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Kelas {item.payment.className} • {item.payment.category}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-bold text-indigo-700">
                          {item.matchedStudent ? (
                            <div>
                              <div>{item.matchedStudent.name} ({item.matchedStudent.className})</div>
                              <div className="text-[10px] text-slate-500 font-normal">{item.reason}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">- Tidak ditemukan -</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          Rp {item.payment.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.canBeSynced ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              Perlu Sinkronisasi
                            </span>
                          ) : item.isAlreadySynced ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Sudah Terhubung
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Siswa Tidak Ada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 text-center sm:text-left">
            Pencocokan aman tanpa mengubah nominal, tanggal, atau nomor kwitansi pembayaran.
          </span>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleRunSync}
              disabled={isProcessing || stats.fixableCount === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Memproses...' : stats.fixableCount === 0 ? 'Sudah Terhubung Semua' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

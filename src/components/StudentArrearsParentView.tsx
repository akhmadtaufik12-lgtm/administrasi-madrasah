import React, { useState } from 'react';
import {
  Student,
  PaymentTransaction,
  FeeTariffSettings,
  StudentBillSettings,
  SchoolOfficials,
  StudentArrearsSummary
} from '../types';
import {
  calculateStudentArrears,
  DEFAULT_FEE_TARIFFS,
  DEFAULT_STUDENT_BILL_SETTINGS,
  getSppTariffForGrade,
  getStoredSchoolOfficials
} from '../utils/storage';
import { printHtmlString } from '../utils/export';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  MessageSquare,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
  Wallet,
  Receipt,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface StudentArrearsParentViewProps {
  student: Student;
  payments: PaymentTransaction[];
  tariffs?: FeeTariffSettings;
  billSettings?: StudentBillSettings;
  schoolOfficials?: SchoolOfficials;
  academicYear: string;
  semester: string;
}

export const StudentArrearsParentView: React.FC<StudentArrearsParentViewProps> = ({
  student,
  payments,
  tariffs = DEFAULT_FEE_TARIFFS,
  billSettings = DEFAULT_STUDENT_BILL_SETTINGS,
  schoolOfficials: propSchoolOfficials,
  academicYear,
  semester
}) => {
  const schoolOfficials: SchoolOfficials = propSchoolOfficials || getStoredSchoolOfficials();
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState<boolean>(true);

  // Calculate dynamic arrears for this student
  const summary: StudentArrearsSummary = calculateStudentArrears(
    student,
    payments,
    tariffs,
    billSettings,
    academicYear
  );

  // Student's completed transactions
  const studentPayments = payments
    .filter(p => p.studentId === student.id || (p.studentName?.toLowerCase().trim() === student.name.toLowerCase().trim() && p.className === student.className))
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // Handle WhatsApp Confirmation
  const handleOpenWhatsApp = () => {
    const phone = billSettings.paymentAccountInfo?.contactPersonPhone || '081234567890';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const message = 
`*KONFIRMASI PEMBAYARAN SISWA - ${(schoolOfficials?.namaSekolah || 'Madrasah').toUpperCase()}*
-----------------------------------------
Assalamu’alaikum Ibu/Bapak Bendahara,
Saya orang tua/wali dari:
Nama Siswa: *${student.name}*
Kelas: *${student.className}*
Kode Unik Siswa: *${student.kodeUnik || '-'}*
Sisa Tunggakan Tertera: *Rp ${summary.totalRemaining.toLocaleString('id-ID')}*

Saya ingin konfirmasi mengenai administrasi pembayaran siswa / mengirimkan bukti transfer. 
Terima kasih.`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Print Student Statement
  const handlePrintStudentBill = () => {
    const bank = billSettings.paymentAccountInfo?.bankName || 'BSI';
    const norek = billSettings.paymentAccountInfo?.accountNumber || '7123456789';
    const an = billSettings.paymentAccountInfo?.accountHolder || schoolOfficials?.namaSekolah || 'Madrasah';

    const htmlContent = `
      <div style="font-family: sans-serif; padding: 25px; color: #0f172a; max-width: 800px; margin: 0 auto;">
        <!-- KOP MADRASAH -->
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px;">
          <h2 style="margin: 0; font-size: 18px; color: #0f172a;">RINCIAN STATUS ADMINISTRASI KEUANGAN & TUNGGAKAN SISWA</h2>
          <h3 style="margin: 3px 0 0; font-size: 14px; color: #475569;">${(schoolOfficials?.namaSekolah || 'Madrasah').toUpperCase()}</h3>
          <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">Tahun Pelajaran ${academicYear} • ${semester} • Dicetak Mandiri melalui Portal Orang Tua</p>
        </div>

        <!-- IDENTITAS SISWA -->
        <table style="width: 100%; font-size: 11px; margin-bottom: 16px; border-collapse: collapse;">
          <tr>
            <td style="width: 18%; font-weight: bold;">Nama Siswa</td>
            <td style="width: 32%;">: <strong>${student.name}</strong></td>
            <td style="width: 18%; font-weight: bold;">Kode Unik Akses</td>
            <td style="width: 32%; font-family: monospace; font-weight: bold;">: ${student.kodeUnik || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Kelas</td>
            <td>: ${student.className}</td>
            <td style="font-weight: bold;">NISN / NIS</td>
            <td>: ${student.nisn || '-'} / ${student.nis || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Status Keuangan</td>
            <td colspan="3">: <strong style="color: ${summary.isAllPaid ? '#047857' : '#b91c1c'};">${summary.isAllPaid ? 'LUNAS (Tidak Ada Tunggakan)' : 'BELUM LUNAS (Ada Tunggakan)'}</strong></td>
          </tr>
        </table>

        <!-- RINGKASAN REKAP -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px;" border="1" cellPadding="6">
          <thead style="background-color: #f1f5f9;">
            <tr style="text-align: center;">
              <th style="width: 6%;">No</th>
              <th style="text-align: left;">Pos Pembayaran</th>
              <th style="width: 20%; text-align: right;">Total Tagihan</th>
              <th style="width: 20%; text-align: right;">Telah Dibayar</th>
              <th style="width: 22%; text-align: right;">Sisa Tunggakan</th>
              <th style="width: 14%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${summary.items.map((item, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>
                  <strong>${item.title}</strong>
                  ${item.details ? `<br/><span style="font-size: 10px; color: #64748b;">${item.details}</span>` : ''}
                </td>
                <td style="text-align: right;">Rp ${item.billAmount.toLocaleString('id-ID')}</td>
                <td style="text-align: right; color: #047857;">Rp ${item.paidAmount.toLocaleString('id-ID')}</td>
                <td style="text-align: right; font-weight: bold; color: ${item.remainingAmount > 0 ? '#b91c1c' : '#047857'};">
                  ${item.remainingAmount > 0 ? `Rp ${item.remainingAmount.toLocaleString('id-ID')}` : 'Rp 0'}
                </td>
                <td style="text-align: center; font-weight: bold; color: ${item.isPaid ? '#047857' : '#b91c1c'}; font-size: 10px;">
                  ${item.statusLabel}
                </td>
              </tr>
            `).join('')}
            <tr style="background-color: #f8fafc; font-weight: bold;">
              <td colspan="4" style="text-align: right;">TOTAL SISA TUNGGAKAN :</td>
              <td style="text-align: right; color: #b91c1c; font-size: 12px;">Rp ${summary.totalRemaining.toLocaleString('id-ID')}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <!-- REKENING DAN PETUNJUK -->
        <div style="font-size: 11px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; font-weight: bold;">Rekening Resmi Pembayaran ${schoolOfficials?.namaSekolah || 'Madrasah'}:</p>
          <p style="margin: 0 0 2px;">Bank: <strong>${bank}</strong> | No. Rek: <strong>${norek}</strong> a/n <strong>${an}</strong></p>
          <p style="margin: 0; color: #475569;">${billSettings.paymentAccountInfo?.paymentInstructions}</p>
        </div>

        <!-- RIWAYAT TRANSAKSI TERAKHIR -->
        <h4 style="margin: 0 0 6px; font-size: 12px;">Riwayat Transaksi Setoran Pembayaran Tercatat:</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 25px;" border="1" cellPadding="4">
          <thead style="background-color: #f1f5f9;">
            <tr>
              <th>No. Kwitansi</th>
              <th>Tanggal</th>
              <th>Kategori / Bulan</th>
              <th style="text-align: right;">Nominal</th>
              <th>Metode</th>
              <th>Penerima</th>
            </tr>
          </thead>
          <tbody>
            ${studentPayments.length === 0 ? `
              <tr><td colspan="6" style="text-align: center; padding: 10px; color: #94a3b8;">Belum ada riwayat transaksi pembayaran tercatat</td></tr>
            ` : studentPayments.map(p => `
              <tr>
                <td style="font-family: monospace; text-align: center;">${p.invoiceNumber}</td>
                <td style="text-align: center;">${p.paymentDate}</td>
                <td>${p.categoryLabel || p.category}${p.month ? ` - ${p.month}` : ''}</td>
                <td style="text-align: right; font-weight: bold;">Rp ${p.amount.toLocaleString('id-ID')}</td>
                <td style="text-align: center;">${p.paymentMethod}</td>
                <td style="text-align: center;">${p.receivedBy}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- TTD -->
        <table style="width: 100%; font-size: 11px; text-align: center;">
          <tr>
            <td style="width: 50%;">
              Mengetahui,<br/>
              <strong>Orang Tua / Wali Siswa</strong>
              <br/><br/><br/><br/>
              ( .................................................. )
            </td>
            <td style="width: 50%;">
              Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
              <strong>Bendahara Madrasah</strong>
              <br/><br/><br/><br/>
              <strong>${(schoolOfficials as any)?.bendahara?.name || (schoolOfficials as any)?.bendaharaUtama?.name || 'Bendahara Madrasah'}</strong>
            </td>
          </tr>
        </table>
      </div>
    `;

    printHtmlString(`Rincian_Tagihan_${student?.name || 'Siswa'}_${student?.className || 'Kelas'}`, htmlContent);
  };

  // Print Single Invoice Receipt
  const handlePrintReceipt = (p: PaymentTransaction) => {
    const receiptHtml = `
      <div style="font-family: 'Courier New', Courier, monospace; width: 340px; padding: 15px; border: 1px dashed #000; margin: 0 auto; color: #000; font-size: 11px; line-height: 1.4;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 13px; font-weight: bold;">${(schoolOfficials?.namaSekolah || 'MADRASAH').toUpperCase()}</h3>
          <p style="margin: 2px 0 0; font-size: 9px;">BUKTI PEMBAYARAN RESMI (KWITANSI)</p>
          <p style="margin: 0; font-size: 8px;">${schoolOfficials?.alamatSekolah || 'Alamat Madrasah'}</p>
        </div>

        <table style="width: 100%; font-size: 10px; margin-bottom: 8px;">
          <tr><td>No. Kwitansi</td><td>: <strong>${p.invoiceNumber}</strong></td></tr>
          <tr><td>Tanggal</td><td>: ${p.paymentDate}</td></tr>
          <tr><td>Nama Siswa</td><td>: <strong>${p.studentName}</strong></td></tr>
          <tr><td>Kelas</td><td>: ${p.className}</td></tr>
          <tr><td>Kode Siswa</td><td>: ${student.kodeUnik || '-'}</td></tr>
        </table>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin: 8px 0;">
          <table style="width: 100%; font-size: 10px;">
            <tr>
              <td><strong>${p.categoryLabel || p.category}</strong>${p.month ? `<br/><span style="font-size: 9px;">Bulan: ${p.month}</span>` : ''}</td>
              <td style="text-align: right; font-weight: bold; font-size: 11px;">Rp ${p.amount.toLocaleString('id-ID')}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; font-size: 10px; margin-bottom: 12px;">
          <tr><td>Metode Bayar</td><td>: ${p.paymentMethod}</td></tr>
          <tr><td>Status</td><td>: <strong>LUNAS (TERVERIFIKASI)</strong></td></tr>
          <tr><td>Petugas/Kasir</td><td>: ${p.receivedBy}</td></tr>
          ${p.notes ? `<tr><td>Catatan</td><td>: ${p.notes}</td></tr>` : ''}
        </table>

        <div style="text-align: center; border-top: 1px dashed #000; pt-2; font-size: 8px;">
          <p style="margin: 4px 0 0;">Simpan kwitansi ini sebagai bukti pembayaran sah.</p>
          <p style="margin: 0;">Terima kasih atas partisipasi Anda.</p>
        </div>
      </div>
    `;

    printHtmlString(`Kwitansi_${p.invoiceNumber}`, receiptHtml);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Hero Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Kewajiban */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kewajiban Biaya</p>
            <h3 className="text-lg font-black text-slate-900">Rp {summary.totalBill.toLocaleString('id-ID')}</h3>
            <p className="text-[11px] text-slate-500 font-medium">TP {academicYear}</p>
          </div>
        </div>

        {/* Total Terbayar */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Telah Dibayarkan</p>
            <h3 className="text-lg font-black text-emerald-700">Rp {summary.totalPaid.toLocaleString('id-ID')}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold">{studentPayments.length} kali transaksi</p>
          </div>
        </div>

        {/* Sisa Tunggakan */}
        <div className={`p-5 rounded-2xl border shadow-xs flex items-center space-x-3.5 ${
          summary.isAllPaid 
            ? 'bg-emerald-50/70 border-emerald-300' 
            : 'bg-rose-50/70 border-rose-300'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            summary.isAllPaid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            {summary.isAllPaid ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${
              summary.isAllPaid ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              Sisa Tunggakan
            </p>
            <h3 className={`text-lg font-black ${
              summary.isAllPaid ? 'text-emerald-900' : 'text-rose-900'
            }`}>
              {summary.isAllPaid ? 'Rp 0 (Lunas)' : `Rp ${summary.totalRemaining.toLocaleString('id-ID')}`}
            </h3>
            <p className={`text-[11px] font-bold ${
              summary.isAllPaid ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {summary.isAllPaid ? '✓ Tidak Ada Tanggungan' : 'Harap Diselesaikan'}
            </p>
          </div>
        </div>

        {/* Action Fast Buttons */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center gap-2">
          <button
            onClick={handlePrintStudentBill}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rincian Tagihan</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Konfirmasi ke Bendahara</span>
          </button>
        </div>
      </div>

      {/* 2. Detail Pos Tagihan & Arrears Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50 p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">Rincian Pos Kewajiban Pembayaran Siswa</h3>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {summary.items.filter(i => i.isPaid).length} dari {summary.items.length} Pos Lunas
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {summary.items.map((item) => {
            const isFullPaid = item.isPaid;
            const hasPartial = !isFullPaid && item.paidAmount > 0;
            const percent = Math.min(100, Math.round((item.paidAmount / (item.billAmount || 1)) * 100));

            return (
              <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <h4 className="font-black text-sm text-slate-900">{item.title}</h4>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isFullPaid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : hasPartial
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {item.statusLabel}
                      </span>
                    </div>

                    {item.details && (
                      <p className="text-xs text-slate-500">{item.details}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 sm:text-right shrink-0">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold">Kewajiban Tagihan</p>
                      <p className="text-xs font-extrabold text-slate-700">Rp {item.billAmount.toLocaleString('id-ID')}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-emerald-600 font-bold">Terbayar</p>
                      <p className="text-xs font-black text-emerald-700">Rp {item.paidAmount.toLocaleString('id-ID')}</p>
                    </div>

                    <div className="min-w-[100px]">
                      <p className="text-[11px] text-rose-600 font-bold">Sisa Tunggakan</p>
                      <p className={`text-sm font-black ${item.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.remainingAmount > 0 ? `Rp ${item.remainingAmount.toLocaleString('id-ID')}` : 'Rp 0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFullPaid ? 'bg-emerald-500' : hasPartial ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Grid Visual SPP 12 Bulan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Status Pembayaran SPP Bulanan (TP {academicYear})</span>
            </h3>
            <p className="text-xs text-slate-500">Pantau status lunas setiap bulan dari Juli hingga Juni</p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-bold">
            <span className="flex items-center space-x-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Lunas</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Belum Bayar</span>
            </span>
          </div>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
          ].map((monthName, idx) => {
            const isBilled = billSettings.sppMonthsBilled?.includes(monthName) ?? true;
            const paidTransaction = studentPayments.find(
              p => p.category === 'SPP' && (
                p.month === monthName ||
                (p.month && p.month.toLowerCase().includes(monthName.toLowerCase())) ||
                (p.categoryLabel && p.categoryLabel.toLowerCase().includes(monthName.toLowerCase()))
              )
            );
            const isPaid = !!paidTransaction || (summary.sppPaidMonths || []).some(m => m.toLowerCase().includes(monthName.toLowerCase()));

            if (!isBilled) {
              return (
                <div key={monthName} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center opacity-60">
                  <span className="text-[10px] text-slate-400 block font-bold">Bulan {idx + 1}</span>
                  <span className="text-xs font-extrabold text-slate-500">{monthName}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Tidak Ditagihkan</span>
                </div>
              );
            }

            return (
              <div
                key={monthName}
                className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                  isPaid
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-0.5">
                    <span>{idx < 6 ? 'Smt 1' : 'Smt 2'}</span>
                    <span>{isPaid ? '✓ Lunas' : 'Belum'}</span>
                  </div>
                  <h4 className="text-xs font-black">{monthName}</h4>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/40 text-[10px]">
                  {isPaid ? (
                    <div className="text-emerald-700 font-bold">
                      <span className="block truncate">{paidTransaction ? `No: ${paidTransaction.invoiceNumber}` : 'Lunas'}</span>
                      {paidTransaction && <span className="text-[9px] opacity-80">{paidTransaction.paymentDate}</span>}
                    </div>
                  ) : (
                    <div className="text-rose-700 font-bold">
                      <span>Rp {getSppTariffForGrade(tariffs, student.className).toLocaleString('id-ID')}</span>
                      <span className="block text-[9px] text-rose-600 font-medium">Perlu Diselesaikan</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Rekening Pembayaran Resmi Madrasah */}
      <div className="bg-gradient-to-r from-[#063016] via-[#0b4822] to-[#15803d] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-700/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-700/60 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Rekening Resmi Pembayaran Madrasah</h3>
              <p className="text-xs text-emerald-100">Transfer bank dapat dilakukan melalui ATM, Mobile Banking, atau Teller</p>
            </div>
          </div>

          <button
            onClick={() => setShowAccountDetails(!showAccountDetails)}
            className="text-xs font-bold text-emerald-200 hover:text-white flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{showAccountDetails ? 'Sembunyikan' : 'Tampilkan Rincian'}</span>
            {showAccountDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showAccountDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-800/60 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Rekening Tujuan</span>
              <p className="text-xs font-bold text-slate-300">{billSettings.paymentAccountInfo?.bankName || 'Bank Syariah Indonesia (BSI)'}</p>
              <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-lg border border-slate-700">
                <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                  {billSettings.paymentAccountInfo?.accountNumber || '7123456789'}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
                  Salin
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Atas Nama: <strong className="text-white">{billSettings.paymentAccountInfo?.accountHolder || schoolOfficials?.namaSekolah || 'Madrasah'}</strong>
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-800/60 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">Petunjuk & Konfirmasi</span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {billSettings.paymentAccountInfo?.paymentInstructions || 'Sertakan nama siswa dan kelas pada berita transfer. Konfirmasi bukti transfer ke nomor WhatsApp Bendahara.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-700/60">
                <span className="text-xs text-slate-400">WA Bendahara: <strong>{billSettings.paymentAccountInfo?.contactPersonPhone || '081234567890'}</strong></span>
                <button
                  onClick={handleOpenWhatsApp}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim Bukti Transfer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Riwayat Kwitansi / Transaksi Setoran Pembayaran */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50 p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">Riwayat Setoran Kwitansi Pembayaran Resmi Siswa</h3>
          </div>
          <span className="text-xs font-extrabold text-slate-500">
            {studentPayments.length} Pembayaran Tercatat
          </span>
        </div>

        {studentPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-bold text-xs">Belum ada transaksi pembayaran yang dicatat di sistem</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Kwitansi</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pos Pembayaran</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-3 text-center">Metode</th>
                  <th className="py-3 px-4 text-center">Penerima</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {pay.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pay.paymentDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{pay.categoryLabel || pay.category}</span>
                      {pay.month && (
                        <span className="block text-[11px] text-slate-500 font-medium">Bulan: {pay.month}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      Rp {pay.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px] border border-slate-200">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-semibold">
                      {pay.receivedBy}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handlePrintReceipt(pay)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold rounded-lg text-[11px] transition flex items-center space-x-1 mx-auto cursor-pointer"
                        title="Cetak Kwitansi Pembayaran"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Kwitansi</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

import React from 'react';
import { Student, SchoolOfficials } from '../types';
import { Printer, X } from 'lucide-react';

interface BukuIndukRegisterPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedClass: string;
  schoolOfficials?: SchoolOfficials;
  schoolName?: string;
}

export const BukuIndukRegisterPrintModal: React.FC<BukuIndukRegisterPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  selectedClass,
  schoolOfficials,
  schoolName
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const lembagaName = schoolOfficials?.namaSekolah || schoolName || 'Madrasah';
  const alamatLembaga = schoolOfficials?.alamatSekolah || 'Alamat Madrasah';
  const kotaLembaga = schoolOfficials?.kotaSekolah || 'Bandung';
  const kepalaSekolahNama = schoolOfficials?.kepalaSekolah?.name || 'H. Ahmad Syahid, M.Pd.I';
  const kepalaSekolahNip = schoolOfficials?.kepalaSekolah?.nip || '197508142005011003';
  const tataUsahaNama = schoolOfficials?.tataUsaha?.name || 'Siti Aminah, S.Kom';
  const tataUsahaNip = schoolOfficials?.tataUsaha?.nip || '-';

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const formatTgl = (tgl?: string) => {
    if (!tgl) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(tgl));
    } catch {
      return tgl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* ACTION BAR (HIDDEN IN PRINT) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm text-white">
              Cetak Buku Register Induk Siswa {selectedClass === 'ALL' ? '(Semua Kelas)' : `(Kelas ${selectedClass})`}
            </span>
            <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2 py-0.5 rounded-md font-bold">
              Total {students.length} Siswa
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CONTENT SHEET */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-black font-sans print:p-0 print:overflow-visible">
          
          {/* KOP SURAT */}
          <div className="border-b-2 border-black pb-2 mb-3 text-center">
            <div className="text-[10pt] font-bold uppercase">
              {schoolOfficials?.namaYayasan || 'YAYASAN PENDIDIKAN ISLAM MANBAUL HUDA'}
            </div>
            <div className="text-[13pt] font-black uppercase tracking-wide">
              {lembagaName}
            </div>
            <div className="text-[8.5pt]">
              {alamatLembaga} | NPSN: {schoolOfficials?.npsn || '20278910'} | NSM: {schoolOfficials?.nsm || '121232040001'}
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-[12pt] font-bold uppercase underline">
              BUKU REGISTER INDUK PESERTA DIDIK
            </h2>
            <div className="text-[9pt] font-semibold mt-0.5">
              {selectedClass === 'ALL' ? 'SELURUH ROMBONGAN BELAJAR' : `ROMBONGAN BELAJAR KELAS ${selectedClass}`} &nbsp;|&nbsp; TAHUN AJARAN 2026/2027
            </div>
          </div>

          {/* TABLE OF STUDENTS */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[7.5pt]">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-black p-1 w-7">No</th>
                  <th className="border border-black p-1 w-12">Kelas</th>
                  <th className="border border-black p-1 w-8">Abs</th>
                  <th className="border border-black p-1 w-16">NIS / Kode</th>
                  <th className="border border-black p-1 w-20">NISN</th>
                  <th className="border border-black p-1">Nama Lengkap Siswa</th>
                  <th className="border border-black p-1 w-7">L/P</th>
                  <th className="border border-black p-1">Tempat & Tgl Lahir</th>
                  <th className="border border-black p-1">Nama Ayah / Ibu</th>
                  <th className="border border-black p-1">Pekerjaan Ortu</th>
                  <th className="border border-black p-1">Alamat Domisili</th>
                  <th className="border border-black p-1 w-20">No. HP Ortu</th>
                  <th className="border border-black p-1 w-14">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="border border-black p-4 text-center text-slate-500">
                      Tidak ada data siswa untuk ditampilkan.
                    </td>
                  </tr>
                ) : (
                  students.map((st, idx) => (
                    <tr key={st.id} className="align-top">
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1 text-center font-bold">{st.className}</td>
                      <td className="border border-black p-1 text-center">{st.rollNo}</td>
                      <td className="border border-black p-1 font-mono text-center">{st.nis || st.kodeUnik || '-'}</td>
                      <td className="border border-black p-1 font-mono text-center">{st.nisn || '-'}</td>
                      <td className="border border-black p-1 font-bold uppercase">{st.name}</td>
                      <td className="border border-black p-1 text-center font-bold">{st.gender || '-'}</td>
                      <td className="border border-black p-1">{st.tempatLahir || '-'}, {formatTgl(st.tanggalLahir)}</td>
                      <td className="border border-black p-1">
                        <div>A: {st.namaAyah || '-'}</div>
                        <div>I: {st.namaIbu || '-'}</div>
                      </td>
                      <td className="border border-black p-1">{st.pekerjaanAyah || st.pekerjaanIbu || '-'}</td>
                      <td className="border border-black p-1">{st.alamat || '-'}</td>
                      <td className="border border-black p-1 font-mono">{st.parentPhone || st.phone || '-'}</td>
                      <td className="border border-black p-1 text-center font-semibold">{st.kategoriSosial || (st.statusKeluarga === 'Yatim' ? 'Yatim' : 'Reguler')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* SIGNATURE BLOCK */}
          <div className="mt-8 flex justify-between items-start text-[9pt] break-inside-avoid">
            <div className="text-center w-56">
              <div>Mengetahui,</div>
              <div className="font-bold">Kepala {lembagaName}</div>
              <div className="h-16"></div>
              <div className="font-bold uppercase underline">{kepalaSekolahNama}</div>
              <div>NIP. {kepalaSekolahNip}</div>
            </div>

            <div className="text-center w-56">
              <div>{kotaLembaga}, {todayStr}</div>
              <div className="font-bold">Petugas Pengelola Buku Induk</div>
              <div className="h-16"></div>
              <div className="font-bold uppercase underline">{tataUsahaNama}</div>
              <div>NIP. {tataUsahaNip}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

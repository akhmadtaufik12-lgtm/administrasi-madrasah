import React from 'react';
import { Student, SchoolOfficials } from '../types';
import { Printer, X, Download, FileSpreadsheet, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BukuIndukPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  schoolOfficials?: SchoolOfficials;
  schoolName?: string;
}

export const BukuIndukPrintModal: React.FC<BukuIndukPrintModalProps> = ({
  isOpen,
  onClose,
  student,
  schoolOfficials,
  schoolName
}) => {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const lembagaName = schoolOfficials?.namaSekolah || schoolName || 'Madrasah';
  const alamatLembaga = schoolOfficials?.alamatSekolah || 'Alamat Madrasah';
  const kotaLembaga = schoolOfficials?.kotaSekolah || 'Bandung';
  const npsnLembaga = schoolOfficials?.npsn || '20278910';
  const nsmLembaga = schoolOfficials?.nsm || '121232040001';
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
        month: 'long',
        year: 'numeric'
      }).format(new Date(tgl));
    } catch {
      return tgl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* ACTION BAR (HIDDEN IN PRINT) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm text-white">
              Pratinjau Lembar Buku Induk Siswa
            </span>
            <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2 py-0.5 rounded-md font-bold">
              {student.name} ({student.className})
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
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-black font-serif print:p-0 print:overflow-visible" id="printable-buku-induk">
          
          {/* KOP SURAT RESMI */}
          <div className="border-b-4 border-double border-black pb-3 mb-4 text-center relative">
            <div className="text-[11pt] font-sans font-bold tracking-wider uppercase">
              {schoolOfficials?.namaYayasan || 'YAYASAN PENDIDIKAN ISLAM MANBAUL HUDA'}
            </div>
            <div className="text-[14pt] font-sans font-black tracking-wide uppercase mt-0.5 text-black">
              {lembagaName}
            </div>
            <div className="text-[9pt] font-sans text-black mt-1 leading-snug">
              {alamatLembaga} | NSM: {nsmLembaga} | NPSN: {npsnLembaga}
              {schoolOfficials?.teleponSekolah && ` | Telp: ${schoolOfficials.teleponSekolah}`}
            </div>
          </div>

          {/* TITLE & NOMOR INDUK */}
          <div className="text-center my-3">
            <h1 className="text-[13pt] font-bold tracking-wide uppercase underline decoration-1 underline-offset-4">
              LEMBAR BUKU INDUK PESERTA DIDIK
            </h1>
            <div className="text-[9.5pt] font-sans font-bold mt-1 text-black">
              Nomor Induk Siswa (NIS): <span className="font-mono">{student.nis || student.rollNo}</span> &nbsp;|&nbsp; 
              NISN: <span className="font-mono">{student.nisn || '-'}</span> &nbsp;|&nbsp;
              Kode Unik: <span className="font-mono">{student.kodeUnik || '-'}</span>
            </div>
          </div>

          {/* TOP INFO & PHOTO BOX */}
          <div className="flex justify-between items-start my-4 pb-2 border-b border-black text-[9.5pt]">
            <div>
              <div className="font-bold">Kelas Sekarang : <span className="font-mono text-[10pt]">{student.className}</span> (Absen: {student.rollNo})</div>
              <div>Status Siswa : <strong>{student.statusSiswa || 'Aktif'}</strong> | Kategori: <strong>{student.kategoriSosial || 'Reguler'}</strong></div>
              <div>Tanggal Masuk : <strong>{formatTgl(student.tanggalMasuk)}</strong></div>
            </div>

            {/* PAS FOTO BOX 3x4 */}
            <div className="w-20 h-28 border border-black flex flex-col items-center justify-center text-center p-1 bg-slate-50 text-[8pt] text-slate-700 shrink-0">
              {student.fotoUrl ? (
                <img src={student.fotoUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="font-bold">PAS FOTO</span>
                  <span className="text-[7pt]">3 x 4 cm</span>
                </>
              )}
            </div>
          </div>

          {/* TABLE DATA BUKU INDUK */}
          <div className="text-[9pt] space-y-3.5 leading-relaxed">
            
            {/* BAGIAN A */}
            <div>
              <div className="font-bold font-sans bg-black text-white px-2 py-0.5 text-[8.5pt] uppercase mb-1">
                A. KETERANGAN TENTANG DIRI PESERTA DIDIK
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-6 py-0.5 align-top">1.</td>
                    <td className="w-56 py-0.5 align-top">Nama Lengkap Siswa</td>
                    <td className="w-3 py-0.5 align-top">:</td>
                    <td className="py-0.5 font-bold uppercase">{student.name}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2.</td>
                    <td className="py-0.5 align-top">Nama Panggilan</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.namaPanggilan || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3.</td>
                    <td className="py-0.5 align-top">Jenis Kelamin</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">4.</td>
                    <td className="py-0.5 align-top">Nomor Induk Kependudukan (NIK)</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5 font-mono">{student.nik || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">5.</td>
                    <td className="py-0.5 align-top">Nomor Kartu Keluarga (KK)</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5 font-mono">{student.noKk || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">6.</td>
                    <td className="py-0.5 align-top">Tempat & Tanggal Lahir</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.tempatLahir || '-'}, {formatTgl(student.tanggalLahir)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">7.</td>
                    <td className="py-0.5 align-top">Agama & Kewarganegaraan</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.agama || 'Islam'} / {student.kewarganegaraan || 'WNI'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">8.</td>
                    <td className="py-0.5 align-top">Anak Ke / Jumlah Saudara</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">Anak ke-<strong>{student.anakKe || '-'}</strong> dari <strong>{(student.jumlahSaudara || 0) + 1}</strong> bersaudara</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">9.</td>
                    <td className="py-0.5 align-top">Status dalam Keluarga</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.statusKeluarga || 'Anak Kandung'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">10.</td>
                    <td className="py-0.5 align-top">Bahasa Sehari-hari di Rumah</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.bahasaSehariHari || 'Bahasa Indonesia'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BAGIAN B */}
            <div>
              <div className="font-bold font-sans bg-black text-white px-2 py-0.5 text-[8.5pt] uppercase mb-1">
                B. KETERANGAN TEMPAT TINGGAL & KONTAK
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-6 py-0.5 align-top">1.</td>
                    <td className="w-56 py-0.5 align-top">Alamat Tempat Tinggal</td>
                    <td className="w-3 py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.alamat || '-'} {student.rtRw ? `RT/RW ${student.rtRw}` : ''}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2.</td>
                    <td className="py-0.5 align-top">Desa / Kelurahan & Kecamatan</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.kelurahan || '-'}, Kec. {student.kecamatan || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3.</td>
                    <td className="py-0.5 align-top">Kabupaten / Kota & Provinsi</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.kabupaten || kotaLembaga}, Prov. {student.provinsi || 'Jawa Barat'} {student.kodePos ? `(Kode Pos: ${student.kodePos})` : ''}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">4.</td>
                    <td className="py-0.5 align-top">Tinggal Bersama</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.tinggalBersama || 'Orang Tua'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">5.</td>
                    <td className="py-0.5 align-top">Jarak ke Madrasah & Transportasi</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.jarakSekolah || '-'} (Transportasi: {student.transportasi || '-'})</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">6.</td>
                    <td className="py-0.5 align-top">No. Telepon / WhatsApp Orang Tua</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5 font-mono font-bold">{student.parentPhone || student.phone || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BAGIAN C */}
            <div>
              <div className="font-bold font-sans bg-black text-white px-2 py-0.5 text-[8.5pt] uppercase mb-1">
                C. KETERANGAN JASMANI & KESEHATAN
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-6 py-0.5 align-top">1.</td>
                    <td className="w-56 py-0.5 align-top">Golongan Darah</td>
                    <td className="w-3 py-0.5 align-top">:</td>
                    <td className="py-0.5 font-bold">{student.golonganDarah || 'Belum Diketahui'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2.</td>
                    <td className="py-0.5 align-top">Tinggi Badan & Berat Badan</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.tinggiBadan ? `${student.tinggiBadan} cm` : '-'} / {student.beratBadan ? `${student.beratBadan} kg` : '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3.</td>
                    <td className="py-0.5 align-top">Riwayat Penyakit Berat / Khusus</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.penyakitBerat || 'Tidak Ada'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">4.</td>
                    <td className="py-0.5 align-top">Kelainan Jasmani / Disabilitas</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.kelainanJasmani || 'Tidak Ada'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BAGIAN D */}
            <div>
              <div className="font-bold font-sans bg-black text-white px-2 py-0.5 text-[8.5pt] uppercase mb-1">
                D. KETERANGAN PENDIDIKAN SEBELUMNYA
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-6 py-0.5 align-top">1.</td>
                    <td className="w-56 py-0.5 align-top">Lulusan Dari Sekolah / Madrasah</td>
                    <td className="w-3 py-0.5 align-top">:</td>
                    <td className="py-0.5 font-bold">{student.asalSekolah || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2.</td>
                    <td className="py-0.5 align-top">Nomor Ijazah SD / MI</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5 font-mono">{student.nomorIjazah || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3.</td>
                    <td className="py-0.5 align-top">Nomor SKHUN / SHUN</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5 font-mono">{student.nomorSkhun || '-'}</td>
                  </tr>
                  {student.statusMasuk === 'Pindahan (Mutasi Masuk)' && (
                    <tr>
                      <td className="py-0.5 align-top">4.</td>
                      <td className="py-0.5 align-top">Pindahan Dari Madrasah / Sekolah</td>
                      <td className="py-0.5 align-top">:</td>
                      <td className="py-0.5">{student.asalPindahan || '-'} (Alasan: {student.alasanPindah || '-'})</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BAGIAN E */}
            <div>
              <div className="font-bold font-sans bg-black text-white px-2 py-0.5 text-[8.5pt] uppercase mb-1">
                E. KETERANGAN TENTANG ORANG TUA KANDUNG
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  {/* AYAH */}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="py-0.5 border-t border-b border-black">a. Data Ayah Kandung:</td>
                  </tr>
                  <tr>
                    <td className="w-6 py-0.5 align-top">1.</td>
                    <td className="w-56 py-0.5 align-top">Nama Lengkap Ayah</td>
                    <td className="w-3 py-0.5 align-top">:</td>
                    <td className="py-0.5 font-bold uppercase">{student.namaAyah || '-'} {student.statusAyah === 'Meninggal Dunia' ? '(Alm.)' : ''}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2.</td>
                    <td className="py-0.5 align-top">NIK Ayah / Tempat Tgl Lahir</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.nikAyah ? `NIK: ${student.nikAyah}` : '-'} / {student.tempatTanggalLahirAyah || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3.</td>
                    <td className="py-0.5 align-top">Pendidikan Terakhir Ayah</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.pendidikanAyah || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">4.</td>
                    <td className="py-0.5 align-top">Pekerjaan & Penghasilan</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.pekerjaanAyah || '-'} ({student.penghasilanAyah || '-'})</td>
                  </tr>

                  {/* IBU */}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="py-0.5 border-t border-b border-black">b. Data Ibu Kandung:</td>
                  </tr>
                  <tr>
                    <td className="w-6 py-0.5 align-top">1.</td>
                    <td className="w-56 py-0.5 align-top">Nama Lengkap Ibu</td>
                    <td className="w-3 py-0.5 align-top">:</td>
                    <td className="py-0.5 font-bold uppercase">{student.namaIbu || '-'} {student.statusIbu === 'Meninggal Dunia' ? '(Almh.)' : ''}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2.</td>
                    <td className="py-0.5 align-top">NIK Ibu / Tempat Tgl Lahir</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.nikIbu ? `NIK: ${student.nikIbu}` : '-'} / {student.tempatTanggalLahirIbu || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3.</td>
                    <td className="py-0.5 align-top">Pendidikan Terakhir Ibu</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.pendidikanIbu || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">4.</td>
                    <td className="py-0.5 align-top">Pekerjaan & Penghasilan</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.pekerjaanIbu || '-'} ({student.penghasilanIbu || '-'})</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BAGIAN F & G */}
            <div>
              <div className="font-bold font-sans bg-black text-white px-2 py-0.5 text-[8.5pt] uppercase mb-1">
                F. KETERANGAN WALI & BANTUAN SOSIAL / PEMINATAN
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-6 py-0.5 align-top">1.</td>
                    <td className="w-56 py-0.5 align-top">Nama Wali (Jika Ada)</td>
                    <td className="w-3 py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.namaWali ? `${student.namaWali} (${student.hubunganWali || 'Wali'})` : '- (Tinggal bersama orang tua)'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2.</td>
                    <td className="py-0.5 align-top">Program Bantuan (KIP / PKH / KKS)</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.noKip ? `KIP: ${student.noKip}` : ''} {student.noKks ? `| KKS: ${student.noKks}` : ''} {student.noPkh ? `| PKH: ${student.noPkh}` : ''} {!student.noKip && !student.noKks && !student.noPkh ? 'Tidak Menerima' : ''}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3.</td>
                    <td className="py-0.5 align-top">Kegemaran / Hobi & Cita-cita</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.hobi || '-'} / Cita-cita: {student.citaCita || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">4.</td>
                    <td className="py-0.5 align-top">Catatan Khusus / Prestasi</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5">{student.catatanKhusus || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SIGNATURE BLOCK */}
          <div className="mt-8 pt-4 border-t border-black flex justify-between items-start text-[9.5pt]">
            <div className="text-center w-60">
              <div>Mengetahui,</div>
              <div className="font-bold">Kepala {lembagaName}</div>
              <div className="h-20"></div>
              <div className="font-bold uppercase underline">{kepalaSekolahNama}</div>
              <div>NIP. {kepalaSekolahNip}</div>
            </div>

            <div className="text-center w-60">
              <div>{kotaLembaga}, {todayStr}</div>
              <div className="font-bold">Petugas Pengelola Buku Induk</div>
              <div className="h-20"></div>
              <div className="font-bold uppercase underline">{tataUsahaNama}</div>
              <div>NIP. {tataUsahaNip}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

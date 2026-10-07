import React, { useState, useMemo } from 'react';
import {
  Mail,
  Send,
  Inbox,
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Building,
  User,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen,
  Share2,
  Download,
  Copy,
  Check,
  ChevronRight,
  Eye,
  FileSignature,
  Tag,
  FolderKanban,
  FileSpreadsheet,
  CreditCard,
  Coins
} from 'lucide-react';
import {
  SuratKeluar,
  SuratMasuk,
  Student,
  Teacher,
  SchoolOfficials,
  SchoolId,
  LetterTypeCategory,
  LetterStatus,
  LetterIncomingNature,
  LetterDispositionStatus,
  RincianBiayaSuratItem
} from '../types';
import { KLASIFIKASI_SURAT_LIST } from '../data/initialLettersData';
import { printHtmlString, exportToCsv, renderKopSuratHtml } from '../utils/export';

interface TataUsahaProps {
  schoolId: SchoolId;
  schoolOfficials: SchoolOfficials;
  students: Student[];
  teachers: Teacher[];
  suratKeluarList: SuratKeluar[];
  suratMasukList: SuratMasuk[];
  onSaveSuratKeluar: (letter: SuratKeluar) => Promise<void>;
  onDeleteSuratKeluar: (id: string) => Promise<void>;
  onSaveSuratMasuk: (letter: SuratMasuk) => Promise<void>;
  onDeleteSuratMasuk: (id: string) => Promise<void>;
}

export const calculateFeeSummary = (items: RincianBiayaSuratItem[] = []) => {
  let commonTotal = 0;
  let regulerFee = 0;
  let duafaFee = 0;
  let yatimFee = 0;
  let hasReguler = false;
  let hasDuafa = false;
  let hasYatim = false;

  const validItems = items || [];

  validItems.forEach(item => {
    const text = `${item.namaBiaya || ''} ${item.keterangan || ''} ${item.kategoriTarget || ''}`.toLowerCase();
    const nominal = Number(item.nominal) || 0;

    const isReguler = item.kategoriTarget === 'Reguler' || text.includes('reguler');
    const isDuafa = item.kategoriTarget === 'Duafa' || text.includes('duafa') || text.includes('dhuafa');
    const isYatim = item.kategoriTarget === 'Yatim' || text.includes('yatim') || text.includes('piatu');

    if (isReguler) {
      regulerFee += nominal;
      hasReguler = true;
    } else if (isDuafa) {
      duafaFee += nominal;
      hasDuafa = true;
    } else if (isYatim) {
      yatimFee += nominal;
      hasYatim = true;
    } else {
      commonTotal += nominal;
    }
  });

  const isCategoryMode = hasReguler || hasDuafa || hasYatim;

  return {
    isCategoryMode,
    commonTotal,
    hasReguler,
    hasDuafa,
    hasYatim,
    regulerFee,
    duafaFee,
    yatimFee,
    totalReguler: commonTotal + regulerFee,
    totalDuafa: commonTotal + duafaFee,
    totalYatim: commonTotal + yatimFee,
    grandTotal: validItems.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0)
  };
};

export const TataUsaha: React.FC<TataUsahaProps> = ({
  schoolId,
  schoolOfficials,
  students,
  teachers,
  suratKeluarList,
  suratMasukList,
  onSaveSuratKeluar,
  onDeleteSuratKeluar,
  onSaveSuratMasuk,
  onDeleteSuratMasuk
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'surat_keluar' | 'surat_masuk' | 'buku_agenda' | 'klasifikasi'>('surat_keluar');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isKeluarModalOpen, setIsKeluarModalOpen] = useState(false);
  const [editingKeluar, setEditingKeluar] = useState<SuratKeluar | null>(null);

  const [isMasukModalOpen, setIsMasukModalOpen] = useState(false);
  const [editingMasuk, setEditingMasuk] = useState<SuratMasuk | null>(null);

  const [isDisposisiModalOpen, setIsDisposisiModalOpen] = useState(false);
  const [activeDisposisiItem, setActiveDisposisiItem] = useState<SuratMasuk | null>(null);

  const [selectedPreviewKeluar, setSelectedPreviewKeluar] = useState<SuratKeluar | null>(null);

  // State Form Surat Keluar
  const initialKeluarForm: Partial<SuratKeluar> = {
    nomorSurat: '',
    kodeKlasifikasi: 'PP.00.5',
    kategoriSurat: 'Surat Keterangan Aktif Siswa',
    tanggalSurat: new Date().toISOString().split('T')[0],
    lampiran: '-',
    perihal: 'Surat Keterangan Aktif Belajar',
    tujuanSurat: 'Orang Tua / Wali Siswa',
    tujuanAlamat: 'di Tempat',
    salamPembuka: 'Assalamu’alaikum Warahmatullahi Wabarakatuh,',
    isiSurat: '',
    hariTanggalKegiatan: '',
    waktuKegiatan: '',
    tempatKegiatan: '',
    agendaKegiatan: '',
    namaUjian: '',
    jadwalPelaksanaanUjian: '',
    batasWaktuPembayaran: '',
    tempatMetodePembayaran: '',
    catatanSyaratUjian: '',
    rincianBiaya: [],
    salamPenutup: 'Wassalamu’alaikum Warahmatullahi Wabarakatuh.',
    penandatanganNama: schoolOfficials?.kepalaSekolah?.name || 'Dra. Hj. Nurjanah, M.Pd',
    penandatanganNip: schoolOfficials?.kepalaSekolah?.nip || '197208151998032001',
    penandatanganJabatan: 'Kepala Madrasah',
    status: 'Terbit',
    tembusan: ['Arsip Tata Usaha'],
    warnaTeks: 'hitam',
    schoolId
  };
  const [keluarFormData, setKeluarFormData] = useState<Partial<SuratKeluar>>(initialKeluarForm);
  const [selectedStudentForLetter, setSelectedStudentForLetter] = useState<string>('');
  const [selectedTeacherForLetter, setSelectedTeacherForLetter] = useState<string>('');

  // Print Outgoing Letter Settings Modal
  const [isPrintSuratModalOpen, setIsPrintSuratModalOpen] = useState(false);
  const [printingSuratKeluar, setPrintingSuratKeluar] = useState<SuratKeluar | null>(null);
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'F4'>('A4');
  const [printLayoutMode, setPrintLayoutMode] = useState<'normal' | 'single-page'>('single-page');
  const [printColorTheme, setPrintColorTheme] = useState<'hitam' | 'berwarna'>('hitam');

  // Helpers for Rincian Biaya / Pembayaran
  const handleAddRincianBiaya = (
    namaBiaya: string,
    nominal: number = 0,
    keterangan: string = '',
    kategoriTarget: 'Semua' | 'Reguler' | 'Duafa' | 'Yatim' | string = 'Semua'
  ) => {
    setKeluarFormData(prev => ({
      ...prev,
      rincianBiaya: [
        ...(prev.rincianBiaya || []),
        {
          id: `rb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          namaBiaya,
          nominal,
          keterangan,
          kategoriTarget
        }
      ]
    }));
  };

  const handleApply3KategoriPreset = () => {
    const ts = Date.now();
    setKeluarFormData(prev => ({
      ...prev,
      modeHitungBiaya: 'kategori_tarif',
      rincianBiaya: [
        { id: `rb-${ts}-1`, namaBiaya: 'Tunggakan SPP atau Ekstrakulikuler', nominal: 150000, keterangan: 'Wajib lunas s.d bulan berjalan (Berlaku Semua Siswa)', kategoriTarget: 'Semua' },
        { id: `rb-${ts}-2`, namaBiaya: 'Biaya Penyelenggaraan Ulangan (PAS/PTS)', nominal: 165000, keterangan: 'Kategori Siswa Reguler', kategoriTarget: 'Reguler' },
        { id: `rb-${ts}-3`, namaBiaya: 'Biaya Penyelenggaraan Ulangan (PAS/PTS)', nominal: 90000, keterangan: 'Kategori Siswa Duafa / Keringanan', kategoriTarget: 'Duafa' },
        { id: `rb-${ts}-4`, namaBiaya: 'Biaya Penyelenggaraan Ulangan (PAS/PTS)', nominal: 0, keterangan: 'Kategori Siswa Yatim (Bebas Biaya Ulangan)', kategoriTarget: 'Yatim' }
      ]
    }));
  };

  const handleUpdateRincianBiaya = (index: number, field: keyof RincianBiayaSuratItem, value: any) => {
    setKeluarFormData(prev => {
      const updated = [...(prev.rincianBiaya || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, rincianBiaya: updated };
    });
  };

  const handleRemoveRincianBiaya = (index: number) => {
    setKeluarFormData(prev => {
      const updated = [...(prev.rincianBiaya || [])];
      updated.splice(index, 1);
      return { ...prev, rincianBiaya: updated };
    });
  };

  // State Form Surat Masuk
  const initialMasukForm: Partial<SuratMasuk> = {
    nomorAgenda: `AG-${new Date().getFullYear()}-${String(suratMasukList.length + 1).padStart(3, '0')}`,
    nomorSuratAsal: '',
    pengirim: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    tanggalDiterima: new Date().toISOString().split('T')[0],
    perihal: '',
    sifat: 'Biasa',
    lampiran: '-',
    kategori: 'Umum',
    lokasiArsip: 'Ordner Surat Masuk',
    disposisiTujuan: [],
    disposisiInstruksi: [],
    disposisiCatatan: '',
    disposisiTanggal: new Date().toISOString().split('T')[0],
    disposisiStatus: 'Belum Disposisi',
    schoolId
  };
  const [masukFormData, setMasukFormData] = useState<Partial<SuratMasuk>>(initialMasukForm);

  // Quick Roman Month Generator
  const getRomanMonth = (monthIndex: number): string => {
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romanMonths[monthIndex] || 'I';
  };

  // Auto-generate outgoing letter number
  const generateNomorSurat = (kode: string) => {
    const year = new Date().getFullYear();
    const month = getRomanMonth(new Date().getMonth());
    const count = String(suratKeluarList.length + 1).padStart(3, '0');
    const prefix = 'MTs.13.08';
    return `${prefix}/${kode || 'PP.00.1'}/${count}/${month}/${year}`;
  };

  // Predefined quick templates for Outgoing Letters
  const handleApplyTemplate = (type: LetterTypeCategory | string) => {
    const namaSekolah = schoolOfficials?.namaSekolah || "Madrasah Tsanawiyah Manba'ul Islam";

    if (type === 'Surat Pemberitahuan Ulangan' || type === 'Surat Pemberitahuan Ujian') {
      const kode = 'PP.00.3';
      const ts = Date.now();
      setKeluarFormData(prev => ({
        ...prev,
        kodeKlasifikasi: kode,
        kategoriSurat: 'Surat Pemberitahuan Ulangan',
        nomorSurat: generateNomorSurat(kode),
        perihal: 'Pemberitahuan Pelaksanaan Ulangan & Penyelesaian Administrasi Keuangan',
        lampiran: '1 Lembar Rincian Biaya & Jadwal',
        tujuanSurat: 'Bapak/Ibu Orang Tua / Wali Siswa',
        tujuanAlamat: 'di Tempat',
        salamPembuka: 'Assalamu’alaikum Warahmatullahi Wabarakatuh,',
        namaUjian: 'Penilaian Akhir Semester (PAS) Ganjil / Ulangan Semester TP 2026/2027',
        jadwalPelaksanaanUjian: 'Senin - Sabtu, 21 - 26 September 2026',
        batasWaktuPembayaran: 'Jumat, 18 September 2026',
        tempatMetodePembayaran: 'Loket Keuangan / Bendahara Tata Usaha (atau Transfer Rekening)',
        catatanSyaratUjian: 'Kartu Peserta Ulangan dapat diambil di Ruang Tata Usaha setelah menyelesaikan seluruh kewajiban administrasi di atas.',
        modeHitungBiaya: 'kategori_tarif',
        rincianBiaya: [
          { id: `rb-${ts}-1`, namaBiaya: 'Tunggakan SPP atau Ekstrakulikuler', nominal: 150000, keterangan: 'Wajib lunas s.d bulan berjalan', kategoriTarget: 'Semua' },
          { id: `rb-${ts}-2`, namaBiaya: 'Biaya Penyelenggaraan Ulangan (PAS/PTS)', nominal: 165000, keterangan: 'Kategori Siswa Reguler', kategoriTarget: 'Reguler' },
          { id: `rb-${ts}-3`, namaBiaya: 'Biaya Penyelenggaraan Ulangan (PAS/PTS)', nominal: 90000, keterangan: 'Kategori Siswa Duafa / Keringanan', kategoriTarget: 'Duafa' },
          { id: `rb-${ts}-4`, namaBiaya: 'Biaya Penyelenggaraan Ulangan (PAS/PTS)', nominal: 0, keterangan: 'Kategori Siswa Yatim (Bebas Biaya Ulangan)', kategoriTarget: 'Yatim' }
        ],
        isiSurat: `Puji syukur kehadirat Allah SWT atas rahmat dan karunia-Nya. Sehubungan dengan agenda akademik pelaksanaan ulangan semester di ${namaSekolah}, bersama ini kami sampaikan informasi penting terkait jadwal ulangan serta kewajiban administrasi keuangan siswa.\n\nDemi kelancaran proses evaluasi belajar dan ketertiban administrasi madrasah, kami mengharapkan Bapak/Ibu Wali Murid dapat menyelesaikan kewajiban administrasi keuangan (SPP atau Ekstrakulikuler dan Biaya Ulangan sesuai kategori siswa) sebelum batas waktu yang ditentukan guna memperoleh Kartu Peserta Ulangan resmi.\n\nAdapun rincian pelaksanaan ulangan serta pos pembiayaan tertera sebagaimana berikut:`,
        salamPenutup: 'Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian, pengertian, dan kerjasama Bapak/Ibu Orang Tua/Wali Murid yang baik, kami ucapkan terima kasih.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.'
      }));
    } else if (type === 'Surat Keterangan Aktif Siswa') {
      const kode = 'PP.00.5';
      setKeluarFormData(prev => ({
        ...prev,
        kodeKlasifikasi: kode,
        kategoriSurat: type,
        nomorSurat: generateNomorSurat(kode),
        perihal: 'Surat Keterangan Aktif Belajar',
        tujuanSurat: 'Yang Berkepentingan',
        tujuanAlamat: 'di Tempat',
        salamPembuka: 'Assalamu’alaikum Warahmatullahi Wabarakatuh,',
        isiSurat: `Yang bertanda tangan di bawah ini Kepala ${namaSekolah}, menerangkan dengan sebenarnya bahwa:\n\nNama Siswa: [PILIH SISWA DI ATAS]\nNISN / NIS: -\nKelas: -\nNama Orang Tua / Wali: -\n\nAdalah benar-benar siswa/siswi aktif terdaftar pada ${namaSekolah} pada Tahun Ajaran 2026/2027 dan berkelakuan baik di lingkungan madrasah.\n\nDemikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.`,
        salamPenutup: 'Wassalamu’alaikum Warahmatullahi Wabarakatuh.'
      }));
    } else if (type === 'Surat Undangan Wali Murid') {
      const kode = 'HM.00.1';
      setKeluarFormData(prev => ({
        ...prev,
        kodeKlasifikasi: kode,
        kategoriSurat: type,
        nomorSurat: generateNomorSurat(kode),
        perihal: 'Undangan Rapat Pleno Komite & Sosialisasi KBM',
        lampiran: '1 Lembar',
        tujuanSurat: 'Bapak/Ibu Orang Tua / Wali Murid',
        tujuanAlamat: 'di Tempat',
        salamPembuka: 'Assalamu’alaikum Warahmatullahi Wabarakatuh,',
        isiSurat: `Puji syukur kehadirat Allah SWT atas rahmat dan karunia-Nya. Dalam rangka mempererat tali silaturahmi serta sosialisasi program kerja dan KBM semester ini, kami mengundang Bapak/Ibu Wali Murid untuk hadir pada pertemuan yang akan diselenggarakan pada:`,
        hariTanggalKegiatan: 'Sabtu, 12 September 2026',
        waktuKegiatan: '08.30 - 11.30 WIB',
        tempatKegiatan: `Aula Utama ${namaSekolah}`,
        agendaKegiatan: '1. Pemaparan Program Akademik & Digitalisasi KBM\n2. Sosialisasi Program Kesiswaan & Kedisiplinan\n3. Laporan Rencana Anggaran Komite',
        salamPenutup: 'Mengingat pentingnya acara ini, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.'
      }));
    } else if (type === 'Surat Tugas Guru / Karyawan') {
      const kode = 'KP.00.1';
      setKeluarFormData(prev => ({
        ...prev,
        kodeKlasifikasi: kode,
        kategoriSurat: type,
        nomorSurat: generateNomorSurat(kode),
        perihal: 'Surat Tugas Mengikuti Kegiatan / Workshop',
        tujuanSurat: 'Guru / Tenaga Kependidikan yang Ditugaskan',
        tujuanAlamat: 'di Tempat',
        salamPembuka: 'Dengan hormat,',
        isiSurat: `Kepala ${namaSekolah} dengan ini menugaskan kepada:\n\nNama: [PILIH GURU DI ATAS]\nNIP / NUPTK: -\nJabatan: Guru / Tenaga Pendidik\n\nUntuk mengikuti kegiatan pembinaan / workshop kedinasan yang diselenggarakan oleh pihak terkait.`,
        hariTanggalKegiatan: 'Senin - Selasa, 07 - 08 September 2026',
        waktuKegiatan: '08.00 WIB s/d Selesai',
        tempatKegiatan: 'Aula Kemenag / Tempat Penyelenggara',
        salamPenutup: 'Demikian surat tugas ini diberikan untuk dapat dilaksanakan dengan penuh dedikasi dan tanggung jawab.'
      }));
    } else if (type === 'Surat Panggilan Orang Tua' || type === 'Surat Panggilan Orang Tua Siswa') {
      const kode = 'KS.01';
      setKeluarFormData(prev => ({
        ...prev,
        kodeKlasifikasi: kode,
        kategoriSurat: 'Surat Panggilan Orang Tua',
        nomorSurat: generateNomorSurat(kode),
        perihal: 'Panggilan Orang Tua / Wali Murid',
        tujuanSurat: 'Bapak/Ibu Orang Tua / Wali Siswa',
        tujuanAlamat: 'di Tempat',
        salamPembuka: 'Assalamu’alaikum Warahmatullahi Wabarakatuh,',
        isiSurat: `Sehubungan dengan pembinaan kedisiplinan dan perkembangan belajar siswa kami di madrasah, dengan ini kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali dari:\n\nNama Siswa: [PILIH SISWA DI ATAS]\nKelas: -\n\nUntuk hadir berkonsultasi bersama Tim BK dan Kesiswaan pada:`,
        hariTanggalKegiatan: 'Kamis, 03 September 2026',
        waktuKegiatan: '09.00 WIB',
        tempatKegiatan: 'Ruang Bimbingan Konseling (BK)',
        salamPenutup: 'Demikian surat undangan ini kami sampaikan, atas kehadiran dan kerjasamanya kami ucapkan terima kasih.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.'
      }));
    } else if (type === 'Surat Edaran / Pemberitahuan' || type === 'Surat Pemberitahuan Libur / Kegiatan') {
      const kode = 'HM.00.4';
      setKeluarFormData(prev => ({
        ...prev,
        kodeKlasifikasi: kode,
        kategoriSurat: 'Surat Edaran / Pemberitahuan',
        nomorSurat: generateNomorSurat(kode),
        perihal: 'Pemberitahuan Libur Resmi & Kegiatan Madrasah',
        tujuanSurat: 'Bapak/Ibu Dewan Guru, Karyawan & Wali Murid',
        tujuanAlamat: 'di Tempat',
        salamPembuka: 'Assalamu’alaikum Warahmatullahi Wabarakatuh,',
        isiSurat: `Berdasarkan Kalender Pendidikan dan Surat Keputusan Bersama, bersama ini kami sampaikan bahwa kegiatan belajar mengajar diliburkan mulai tanggal [TANGGAL] sampai dengan [TANGGAL]. Siswa masuk kembali pada hari [HARI, TANGGAL].`,
        salamPenutup: 'Demikian pemberitahuan ini disampaikan untuk diketahui dan dipedomani bersama.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.'
      }));
    }
  };

  // Student selection autofill
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentForLetter(studentId);
    const stu = students.find(s => s.id === studentId);
    if (!stu) return;

    const namaSekolah = schoolOfficials?.namaSekolah || "Madrasah Tsanawiyah Manba'ul Islam";

    setKeluarFormData(prev => {
      let updatedIsi = prev.isiSurat || '';
      let updatedTujuan = prev.tujuanSurat || 'Bapak/Ibu Orang Tua / Wali Siswa';

      if (prev.kategoriSurat === 'Surat Keterangan Aktif Siswa') {
        updatedIsi = `Yang bertanda tangan di bawah ini Kepala ${namaSekolah}, menerangkan dengan sebenarnya bahwa:\n\nNama Siswa: ${stu.name}\nNISN / NIS: ${stu.nisn || '-'} / ${stu.nis || stu.rollNo || '-'}\nKelas: ${stu.className}\nNama Orang Tua / Wali: Orang Tua / Wali\n\nAdalah benar-benar siswa/siswi aktif terdaftar pada ${namaSekolah} pada Tahun Ajaran 2026/2027 dan berkelakuan baik di lingkungan madrasah.\n\nDemikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.`;
      } else if (prev.kategoriSurat === 'Surat Panggilan Orang Tua Siswa' || prev.kategoriSurat === 'Surat Panggilan Orang Tua') {
        updatedIsi = `Sehubungan dengan pembinaan kedisiplinan dan perkembangan belajar siswa kami di madrasah, dengan ini kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali dari:\n\nNama Siswa: ${stu.name}\nNISN: ${stu.nisn || '-'}\nKelas: ${stu.className}\n\nUntuk hadir berkonsultasi bersama Tim BK dan Kesiswaan pada:`;
      } else if (prev.kategoriSurat === 'Surat Pemberitahuan Ulangan' || prev.kategoriSurat === 'Surat Pemberitahuan Ujian') {
        updatedTujuan = `Bapak/Ibu Orang Tua / Wali dari ${stu.name} (${stu.className})`;
        updatedIsi = `Puji syukur kehadirat Allah SWT atas limpahan rahmat-Nya. Sehubungan dengan agenda pelaksanaan evaluasi ulangan semester di ${namaSekolah}, bersama ini kami sampaikan informasi penting terkait jadwal pelaksanaan ulangan serta rincian kewajiban administrasi keuangan (SPP atau Ekstrakulikuler dan Ulangan) untuk siswa:\n\nNama Siswa: ${stu.name}\nNISN / NIS: ${stu.nisn || '-'} / ${stu.nis || stu.rollNo || '-'}\nKelas: ${stu.className}\n\nDemi kelancaran pelaksanaan ulangan dan ketertiban administrasi, kami mengharapkan Bapak/Ibu Wali Murid dapat menyelesaikan seluruh kewajiban administrasi keuangan sebagaimana tertera pada rincian di bawah ini sebelum batas waktu yang ditentukan untuk pengambilan Kartu Peserta Ulangan.`;
      }
      return {
        ...prev,
        studentId: stu.id,
        studentName: stu.name,
        studentClass: stu.className,
        studentNisn: stu.nisn,
        tujuanSurat: updatedTujuan,
        isiSurat: updatedIsi
      };
    });
  };

  // Teacher selection autofill
  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherForLetter(teacherId);
    const t = teachers.find(tch => tch.id === teacherId);
    if (!t) return;

    const namaSekolah = schoolOfficials?.namaSekolah || "Madrasah Tsanawiyah Manba'ul Islam";

    setKeluarFormData(prev => {
      let updatedIsi = prev.isiSurat || '';
      if (prev.kategoriSurat === 'Surat Tugas Guru / Karyawan') {
        updatedIsi = `Kepala ${namaSekolah} dengan ini menugaskan kepada:\n\nNama: ${t.name}\nNIP: ${t.nip || '-'}\nJabatan: Guru Pengampu / Tenaga Pendidik\n\nUntuk mengikuti kegiatan pembinaan / workshop kedinasan yang diselenggarakan oleh pihak terkait.`;
      }
      return {
        ...prev,
        teacherId: t.id,
        teacherName: t.name,
        teacherNip: t.nip,
        isiSurat: updatedIsi
      };
    });
  };

  // Save Surat Keluar
  const handleSaveKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keluarFormData.nomorSurat || !keluarFormData.perihal || !keluarFormData.isiSurat) {
      alert('Mohon lengkapi Nomor Surat, Perihal, dan Isi Surat.');
      return;
    }

    const newLetter: SuratKeluar = {
      id: editingKeluar ? editingKeluar.id : `sk-${Date.now()}`,
      nomorSurat: keluarFormData.nomorSurat || generateNomorSurat(keluarFormData.kodeKlasifikasi || 'PP.00.1'),
      kodeKlasifikasi: keluarFormData.kodeKlasifikasi || 'PP.00.1',
      kategoriSurat: keluarFormData.kategoriSurat || 'Surat Keterangan Aktif Siswa',
      tanggalSurat: keluarFormData.tanggalSurat || new Date().toISOString().split('T')[0],
      lampiran: keluarFormData.lampiran || '-',
      perihal: keluarFormData.perihal,
      tujuanSurat: keluarFormData.tujuanSurat || 'Bapak/Ibu',
      tujuanAlamat: keluarFormData.tujuanAlamat || 'di Tempat',
      salamPembuka: keluarFormData.salamPembuka || 'Assalamu’alaikum Warahmatullahi Wabarakatuh,',
      isiSurat: keluarFormData.isiSurat,
      hariTanggalKegiatan: keluarFormData.hariTanggalKegiatan,
      waktuKegiatan: keluarFormData.waktuKegiatan,
      tempatKegiatan: keluarFormData.tempatKegiatan,
      agendaKegiatan: keluarFormData.agendaKegiatan,
      namaUjian: keluarFormData.namaUjian,
      jadwalPelaksanaanUjian: keluarFormData.jadwalPelaksanaanUjian,
      batasWaktuPembayaran: keluarFormData.batasWaktuPembayaran,
      tempatMetodePembayaran: keluarFormData.tempatMetodePembayaran,
      catatanSyaratUjian: keluarFormData.catatanSyaratUjian,
      rincianBiaya: keluarFormData.rincianBiaya || [],
      salamPenutup: keluarFormData.salamPenutup || 'Wassalamu’alaikum Warahmatullahi Wabarakatuh.',
      penandatanganNama: keluarFormData.penandatanganNama || schoolOfficials?.kepalaSekolah?.name || 'Kepala Madrasah',
      penandatanganNip: keluarFormData.penandatanganNip || schoolOfficials?.kepalaSekolah?.nip || '-',
      penandatanganJabatan: keluarFormData.penandatanganJabatan || 'Kepala Madrasah',
      status: (keluarFormData.status as LetterStatus) || 'Terbit',
      studentId: keluarFormData.studentId,
      studentName: keluarFormData.studentName,
      studentClass: keluarFormData.studentClass,
      studentNisn: keluarFormData.studentNisn,
      teacherId: keluarFormData.teacherId,
      teacherName: keluarFormData.teacherName,
      teacherNip: keluarFormData.teacherNip,
      tembusan: keluarFormData.tembusan && keluarFormData.tembusan.length > 0 ? keluarFormData.tembusan : ['Arsip Tata Usaha'],
      createdAt: editingKeluar ? editingKeluar.createdAt : new Date().toISOString(),
      schoolId
    };

    await onSaveSuratKeluar(newLetter);
    setIsKeluarModalOpen(false);
    setEditingKeluar(null);
    setKeluarFormData(initialKeluarForm);
  };

  // Save Surat Masuk
  const handleSaveMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masukFormData.nomorSuratAsal || !masukFormData.pengirim || !masukFormData.perihal) {
      alert('Mohon lengkapi Nomor Surat Asal, Pengirim, dan Perihal Surat.');
      return;
    }

    const newLetter: SuratMasuk = {
      id: editingMasuk ? editingMasuk.id : `sm-${Date.now()}`,
      nomorAgenda: masukFormData.nomorAgenda || `AG-${new Date().getFullYear()}-${String(suratMasukList.length + 1).padStart(3, '0')}`,
      nomorSuratAsal: masukFormData.nomorSuratAsal,
      pengirim: masukFormData.pengirim,
      tanggalSurat: masukFormData.tanggalSurat || new Date().toISOString().split('T')[0],
      tanggalDiterima: masukFormData.tanggalDiterima || new Date().toISOString().split('T')[0],
      perihal: masukFormData.perihal,
      sifat: (masukFormData.sifat as LetterIncomingNature) || 'Biasa',
      lampiran: masukFormData.lampiran || '-',
      kategori: masukFormData.kategori || 'Umum',
      disposisiTujuan: masukFormData.disposisiTujuan || [],
      disposisiInstruksi: masukFormData.disposisiInstruksi || [],
      disposisiCatatan: masukFormData.disposisiCatatan || '',
      disposisiTanggal: masukFormData.disposisiTanggal,
      disposisiStatus: (masukFormData.disposisiStatus as LetterDispositionStatus) || 'Belum Disposisi',
      lokasiArsip: masukFormData.lokasiArsip || 'Ordner Surat Masuk',
      fileUrl: masukFormData.fileUrl,
      createdAt: editingMasuk ? editingMasuk.createdAt : new Date().toISOString(),
      schoolId
    };

    await onSaveSuratMasuk(newLetter);
    setIsMasukModalOpen(false);
    setEditingMasuk(null);
    setMasukFormData(initialMasukForm);
  };

  // Save Disposisi Quick Update
  const handleSaveDisposisi = async () => {
    if (!activeDisposisiItem) return;
    await onSaveSuratMasuk(activeDisposisiItem);
    setIsDisposisiModalOpen(false);
    setActiveDisposisiItem(null);
  };

  // Generate HTML for Surat Keluar (Supports A4/F4, Normal/Single-Page Fit & Font Color Theme)
  const generateSuratKeluarHtml = (
    surat: SuratKeluar,
    paperSize: 'A4' | 'F4' = 'A4',
    layoutMode: 'normal' | 'single-page' = 'single-page',
    colorTheme?: 'hitam' | 'berwarna'
  ) => {
    const isSinglePage = layoutMode === 'single-page';
    // Mode warna: 'hitam' (monokrom resmi) vs 'berwarna' (sorotan visual)
    const isColorMode = (colorTheme || surat.warnaTeks || 'hitam') === 'berwarna';
    const city = schoolOfficials?.kotaSekolah || 'Jakarta Barat';

    const formattedDate = new Date(surat.tanggalSurat).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const signatoryName = surat.penandatanganNama || schoolOfficials?.kepalaSekolah?.name || 'Dra. Hj. Nurjanah, M.Pd';
    const signatoryNip = surat.penandatanganNip && surat.penandatanganNip !== '-' ? surat.penandatanganNip : (schoolOfficials?.kepalaSekolah?.nip || '');
    const signatoryJabatan = surat.penandatanganJabatan || 'Kepala Madrasah';

    const bodyFontSize = isSinglePage ? '11pt' : '12pt';
    const bodyLineHeight = isSinglePage ? '1.38' : '1.6';
    const containerPadding = isSinglePage ? '10px 20px' : '20px 30px';
    const metaTableMarginBottom = isSinglePage ? '10px' : '20px';
    const tujuanMarginBottom = isSinglePage ? '10px' : '20px';
    const paragraphMarginBottom = isSinglePage ? '8px' : '15px';
    const tableInfoPadding = isSinglePage ? '3px 6px' : '5px 8px';
    const tableMargin = isSinglePage ? '8px auto' : '12px auto';
    const ttdMarginTop = isSinglePage ? '14px' : '30px';
    const ttdSpaceHeight = isSinglePage ? '48px' : '75px';
    const tembusanMarginTop = isSinglePage ? '12px' : '30px';

    // KOP SURAT DIKUNCI (Tetap Mempertahankan Warna & Desain Asli Resmi Lembaga)
    const kopHtml = renderKopSuratHtml(schoolOfficials, { isSinglePage });

    return `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: ${bodyFontSize}; line-height: ${bodyLineHeight}; color: #000; padding: ${containerPadding};">
        ${kopHtml}

        <table style="width: 100%; margin-bottom: ${metaTableMarginBottom}; border-collapse: collapse; font-size: ${isSinglePage ? '10.5pt' : '11.5pt'}; color: #000;">
          <tr>
            <td style="width: 15%; vertical-align: top;">Nomor</td>
            <td style="width: 2%; vertical-align: top;">:</td>
            <td style="width: 48%; vertical-align: top; font-weight: bold;">${surat.nomorSurat}</td>
            <td style="width: 35%; text-align: right; vertical-align: top;">${city}, ${formattedDate}</td>
          </tr>
          <tr>
            <td style="vertical-align: top;">Lampiran</td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;">${surat.lampiran || '-'}</td>
            <td></td>
          </tr>
          <tr>
            <td style="vertical-align: top;">Perihal</td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top; font-weight: bold; text-decoration: underline;">${surat.perihal}</td>
            <td></td>
          </tr>
        </table>

        <div style="margin-bottom: ${tujuanMarginBottom}; font-size: ${isSinglePage ? '10.5pt' : '11.5pt'}; color: #000;">
          <div>Kepada Yth.</div>
          <div style="font-weight: bold;">${surat.tujuanSurat}</div>
          <div>${surat.tujuanAlamat || 'di Tempat'}</div>
        </div>

        <div style="margin-bottom: ${isSinglePage ? '8px' : '12px'}; font-style: italic; color: #000;">
          ${surat.salamPembuka || 'Assalamu’alaikum Warahmatullahi Wabarakatuh,'}
        </div>

        <div style="text-align: justify; margin-bottom: ${paragraphMarginBottom}; white-space: pre-wrap; color: #000;">${surat.isiSurat}</div>

        ${surat.namaUjian || surat.jadwalPelaksanaanUjian || surat.batasWaktuPembayaran || surat.tempatMetodePembayaran ? `
          <table style="width: 95%; margin: ${tableMargin}; border-collapse: collapse; font-size: ${isSinglePage ? '10pt' : '11pt'}; background-color: ${isColorMode ? '#f8fafc' : '#ffffff'}; border: 1px solid ${isColorMode ? '#cbd5e1' : '#334155'};">
            ${surat.namaUjian ? `
              <tr>
                <td style="width: 32%; padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; font-weight: bold; color: ${isColorMode ? '#1e293b' : '#000000'};">Agenda / Nama Ulangan</td>
                <td style="width: 3%; padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; color: #000;">:</td>
                <td style="width: 65%; padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; font-weight: bold; color: ${isColorMode ? '#0f172a' : '#000000'};">${surat.namaUjian}</td>
              </tr>
            ` : ''}
            ${surat.jadwalPelaksanaanUjian ? `
              <tr>
                <td style="padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; font-weight: bold; color: ${isColorMode ? '#1e293b' : '#000000'};">Waktu Pelaksanaan</td>
                <td style="padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; color: #000;">:</td>
                <td style="padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; color: #000;">${surat.jadwalPelaksanaanUjian}</td>
              </tr>
            ` : ''}
            ${surat.batasWaktuPembayaran ? `
              <tr>
                <td style="padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; font-weight: bold; color: ${isColorMode ? '#1e293b' : '#000000'};">Batas Waktu Pelunasan</td>
                <td style="padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; color: #000;">:</td>
                <td style="padding: ${tableInfoPadding}; border-bottom: 1px solid ${isColorMode ? '#e2e8f0' : '#334155'}; font-weight: bold; color: ${isColorMode ? '#991b1b' : '#000000'};">${surat.batasWaktuPembayaran}</td>
              </tr>
            ` : ''}
            ${surat.tempatMetodePembayaran ? `
              <tr>
                <td style="padding: ${tableInfoPadding}; font-weight: bold; color: ${isColorMode ? '#1e293b' : '#000000'};">Tempat / Metode Bayar</td>
                <td style="padding: ${tableInfoPadding}; color: #000;">:</td>
                <td style="padding: ${tableInfoPadding}; color: #000;">${surat.tempatMetodePembayaran}</td>
              </tr>
            ` : ''}
          </table>
        ` : ''}

        ${surat.rincianBiaya && surat.rincianBiaya.length > 0 ? (() => {
          const feeSummary = calculateFeeSummary(surat.rincianBiaya);
          return `
          <div style="margin: ${isSinglePage ? '8px 0' : '14px 0'};">
            <div style="font-weight: bold; font-size: ${isSinglePage ? '10pt' : '11pt'}; margin-bottom: 4px; color: ${isColorMode ? '#0f172a' : '#000000'};">
              Rincian Pos Kewajiban Administrasi / Pembayaran:
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: ${isSinglePage ? '9.5pt' : '10.5pt'}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; color: #000;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="width: 7%; padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: center; color: #000;">No</th>
                  <th style="width: 48%; padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: left; color: #000;">Rincian Pos Pembayaran / Tunggakan</th>
                  <th style="width: 25%; padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: left; color: #000;">Kategori / Keterangan</th>
                  <th style="width: 20%; padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: right; color: #000;">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                ${surat.rincianBiaya.map((item, idx) => {
                  const text = `${item.namaBiaya || ''} ${item.keterangan || ''} ${item.kategoriTarget || ''}`.toLowerCase();
                  let badge = '';
                  if (item.kategoriTarget === 'Reguler' || text.includes('reguler')) {
                    badge = isColorMode
                      ? '<span style="display:inline-block; font-size:7.5pt; padding:1px 4px; background:#dcfce7; color:#166534; border:1px solid #86efac; border-radius:3px; margin-left:4px; font-weight:bold;">Reguler</span>'
                      : '<span style="display:inline-block; font-size:7.5pt; padding:1px 4px; background:#f8fafc; color:#000000; border:1px solid #475569; border-radius:3px; margin-left:4px; font-weight:bold;">Reguler</span>';
                  } else if (item.kategoriTarget === 'Duafa' || text.includes('duafa') || text.includes('dhuafa')) {
                    badge = isColorMode
                      ? '<span style="display:inline-block; font-size:7.5pt; padding:1px 4px; background:#e0f2fe; color:#075985; border:1px solid #7dd3fc; border-radius:3px; margin-left:4px; font-weight:bold;">Duafa</span>'
                      : '<span style="display:inline-block; font-size:7.5pt; padding:1px 4px; background:#f8fafc; color:#000000; border:1px solid #475569; border-radius:3px; margin-left:4px; font-weight:bold;">Duafa</span>';
                  } else if (item.kategoriTarget === 'Yatim' || text.includes('yatim') || text.includes('piatu')) {
                    badge = isColorMode
                      ? '<span style="display:inline-block; font-size:7.5pt; padding:1px 4px; background:#fef3c7; color:#92400e; border:1px solid #fcd34d; border-radius:3px; margin-left:4px; font-weight:bold;">Yatim</span>'
                      : '<span style="display:inline-block; font-size:7.5pt; padding:1px 4px; background:#f8fafc; color:#000000; border:1px solid #475569; border-radius:3px; margin-left:4px; font-weight:bold;">Yatim</span>';
                  }
                  return `
                  <tr>
                    <td style="padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: center; color: #000;">${idx + 1}</td>
                    <td style="padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; font-weight: 500; color: #000;">
                      ${item.namaBiaya} ${badge}
                    </td>
                    <td style="padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; font-size: 9pt; color: ${isColorMode ? '#475569' : '#000000'};">${item.keterangan || '-'}</td>
                    <td style="padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: right; font-family: monospace; font-weight: bold; color: #000;">
                      ${(Number(item.nominal) || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  `;
                }).join('')}

                ${feeSummary.isCategoryMode ? `
                <tr style="background-color: ${isColorMode ? '#f8fafc' : '#ffffff'}; border-top: 2px solid ${isColorMode ? '#334155' : '#000000'};">
                  <td colspan="4" style="padding: ${isSinglePage ? '6px 8px' : '8px 12px'}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; color: #000;">
                    <div style="font-weight: bold; font-size: ${isSinglePage ? '9.5pt' : '10.5pt'}; color: ${isColorMode ? '#0f172a' : '#000000'}; margin-bottom: 5px; text-transform: uppercase;">
                      Rincian Total Biaya yang Harus Dilunasi Berdasarkan Kategori Siswa:
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: ${isSinglePage ? '9pt' : '10pt'}; color: #000;">
                      <tr style="border-bottom: 1px dashed ${isColorMode ? '#cbd5e1' : '#475569'};">
                        <td style="padding: 3px 0; width: 64%; font-weight: 600; color: ${isColorMode ? '#0f172a' : '#000000'};">
                          1. Siswa Kategori REGULER (SPP atau Ekstrakulikuler + Ulangan Reguler)
                        </td>
                        <td style="padding: 3px 0; width: 3%; text-align: center; color: #000;">:</td>
                        <td style="padding: 3px 0; width: 33%; text-align: right; font-family: monospace; font-weight: bold; font-size: ${isSinglePage ? '9.5pt' : '10.5pt'}; color: ${isColorMode ? '#047857' : '#000000'};">
                          Rp ${feeSummary.totalReguler.toLocaleString('id-ID')}
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px dashed ${isColorMode ? '#cbd5e1' : '#475569'};">
                        <td style="padding: 3px 0; font-weight: 600; color: ${isColorMode ? '#0f172a' : '#000000'};">
                          2. Siswa Kategori DUAFA (SPP atau Ekstrakulikuler + Ulangan Duafa)
                        </td>
                        <td style="padding: 3px 0; text-align: center; color: #000;">:</td>
                        <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: bold; font-size: ${isSinglePage ? '9.5pt' : '10.5pt'}; color: ${isColorMode ? '#0284c7' : '#000000'};">
                          Rp ${feeSummary.totalDuafa.toLocaleString('id-ID')}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-weight: 600; color: ${isColorMode ? '#0f172a' : '#000000'};">
                          3. Siswa Kategori YATIM (SPP atau Ekstrakulikuler + Ulangan Yatim)
                        </td>
                        <td style="padding: 3px 0; text-align: center; color: #000;">:</td>
                        <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: bold; font-size: ${isSinglePage ? '9.5pt' : '10.5pt'}; color: ${isColorMode ? '#b45309' : '#000000'};">
                          Rp ${feeSummary.totalYatim.toLocaleString('id-ID')}${feeSummary.yatimFee === 0 ? ' (Bebas Biaya Ulangan)' : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : `
                <tr style="background-color: ${isColorMode ? '#f8fafc' : '#ffffff'}; font-weight: bold;">
                  <td colspan="3" style="padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: right; text-transform: uppercase; color: #000;">
                    Total Biaya yang Harus Dilunasi:
                  </td>
                  <td style="padding: ${tableInfoPadding}; border: 1px solid ${isColorMode ? '#334155' : '#000000'}; text-align: right; font-family: monospace; font-size: ${isSinglePage ? '10.5pt' : '11.5pt'}; color: ${isColorMode ? '#047857' : '#000000'};">
                    Rp ${feeSummary.grandTotal.toLocaleString('id-ID')}
                  </td>
                </tr>
                `}
              </tbody>
            </table>
          </div>
          `;
        })() : ''}

        ${surat.catatanSyaratUjian ? `
          <div style="margin: ${isSinglePage ? '6px 0' : '12px 0'}; padding: ${isSinglePage ? '5px 8px' : '8px 12px'}; background-color: ${isColorMode ? '#fffbeb' : '#f9fafb'}; border: 1px solid ${isColorMode ? '#fde68a' : '#334155'}; border-left: 3px solid ${isColorMode ? '#d97706' : '#000000'}; font-size: ${isSinglePage ? '9.5pt' : '10.5pt'}; font-style: italic; color: ${isColorMode ? '#78350f' : '#000000'};">
            <strong>Catatan:</strong> ${surat.catatanSyaratUjian}
          </div>
        ` : ''}

        ${surat.hariTanggalKegiatan || surat.tempatKegiatan ? `
          <table style="width: 90%; margin: ${tableMargin}; border-collapse: collapse; font-size: ${isSinglePage ? '10pt' : '11.5pt'}; color: #000;">
            ${surat.hariTanggalKegiatan ? `
              <tr>
                <td style="width: 25%; padding: 2px 0; vertical-align: top;">Hari / Tanggal</td>
                <td style="width: 3%; padding: 2px 0; vertical-align: top;">:</td>
                <td style="width: 72%; padding: 2px 0; font-weight: bold;">${surat.hariTanggalKegiatan}</td>
              </tr>
            ` : ''}
            ${surat.waktuKegiatan ? `
              <tr>
                <td style="padding: 2px 0; vertical-align: top;">Waktu</td>
                <td style="padding: 2px 0; vertical-align: top;">:</td>
                <td style="padding: 2px 0;">${surat.waktuKegiatan}</td>
              </tr>
            ` : ''}
            ${surat.tempatKegiatan ? `
              <tr>
                <td style="padding: 2px 0; vertical-align: top;">Tempat</td>
                <td style="padding: 2px 0; vertical-align: top;">:</td>
                <td style="padding: 2px 0; font-weight: bold;">${surat.tempatKegiatan}</td>
              </tr>
            ` : ''}
            ${surat.agendaKegiatan ? `
              <tr>
                <td style="padding: 2px 0; vertical-align: top;">Acara / Agenda</td>
                <td style="padding: 2px 0; vertical-align: top;">:</td>
                <td style="padding: 2px 0; white-space: pre-wrap;">${surat.agendaKegiatan}</td>
              </tr>
            ` : ''}
          </table>
        ` : ''}

        <div style="text-align: justify; margin-top: ${isSinglePage ? '8px' : '15px'}; margin-bottom: ${isSinglePage ? '12px' : '25px'}; color: #000;">
          ${surat.salamPenutup || 'Demikian surat ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.'}
        </div>

        <table style="width: 100%; margin-top: ${ttdMarginTop}; border-collapse: collapse; color: #000;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center;">
              <div>${signatoryJabatan},</div>
              <div style="height: ${ttdSpaceHeight};"></div>
              <div style="font-weight: bold; text-decoration: underline;">${signatoryName}</div>
              ${signatoryNip && signatoryNip !== '-' ? `<div>NIP. ${signatoryNip}</div>` : ''}
            </td>
          </tr>
        </table>

        ${surat.tembusan && surat.tembusan.length > 0 ? `
          <div style="margin-top: ${tembusanMarginTop}; font-size: ${isSinglePage ? '8.5pt' : '9.5pt'}; color: ${isColorMode ? '#334155' : '#000000'}; border-top: 1px dashed ${isColorMode ? '#cbd5e1' : '#000000'}; padding-top: 6px;">
            <div style="font-weight: bold; text-decoration: underline;">Tembusan:</div>
            <ol style="margin: 2px 0 0 14px; padding: 0;">
              ${surat.tembusan.map(t => `<li>${t}</li>`).join('')}
            </ol>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Direct Print Surat Keluar Handler
  const handlePrintSuratKeluar = (
    surat: SuratKeluar,
    paperSize: 'A4' | 'F4' = printPaperSize,
    layoutMode: 'normal' | 'single-page' = printLayoutMode,
    colorTheme: 'hitam' | 'berwarna' = printColorTheme
  ) => {
    const html = generateSuratKeluarHtml(surat, paperSize, layoutMode, colorTheme);
    printHtmlString(html, `Surat_Keluar_${surat.nomorSurat.replace(/[\/\\:]/g, '_')}`, {
      paperSize,
      layoutMode
    });
  };

  // Print Lembar Disposisi (Standard Kemenag / Administrative Sheet)
  const handlePrintDisposisi = (surat: SuratMasuk) => {
    const formattedDiterima = new Date(surat.tanggalDiterima).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formattedSurat = new Date(surat.tanggalSurat).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const namaSekolah = schoolOfficials?.namaSekolah || "MADRASAH TSANAWIYAH MANBA'UL ISLAM";
    const namaYayasan = schoolOfficials?.namaYayasan || 'YAYASAN PENDIDIKAN MANBAUL ISLAM';
    const city = schoolOfficials?.kotaSekolah || 'Jakarta Barat';
    const addressParts = [
      schoolOfficials?.alamatSekolah || 'Jl. Sandang No. 34',
      schoolOfficials?.rtRw,
      schoolOfficials?.kelurahan ? `Kel. ${schoolOfficials.kelurahan}` : '',
      schoolOfficials?.kecamatan ? `Kec. ${schoolOfficials.kecamatan}` : '',
      schoolOfficials?.kotaSekolah || 'Jakarta Barat',
      schoolOfficials?.provinsi ? `- ${schoolOfficials.provinsi}` : '',
      schoolOfficials?.kodePos
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    const headmasterName = schoolOfficials?.kepalaSekolah?.name || 'Dra. Hj. Nurjanah, M.Pd';
    const headmasterNip = schoolOfficials?.kepalaSekolah?.nip || '197208151998032001';

    const targetOfficers = [
      'Waka Kurikulum',
      'Waka Kesiswaan',
      'Waka Sarana Prasarana',
      'Waka Humas',
      'Kepala Tata Usaha',
      'Bendahara Madrasah',
      'Bimbingan Konseling (BK)',
      'Pembina OSIS / Ekstrakurikuler',
      'Wali Kelas',
      'Operator Data / EMIS'
    ];

    const instructions = [
      'Tindak Lanjuti Segera',
      'Hadiri / Wakili',
      'Siapkan Berkas / Bahan',
      'Koordinasikan dengan Terkait',
      'Untuk Diketahui / Arsip',
      'Pelajari / Beri Masukan',
      'Laporkan Hasilnya'
    ];

    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #000; padding: 15px; border: 2px solid #000;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px;">
          <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #475569;">${namaYayasan}</div>
          <div style="font-size: 13pt; font-weight: 900; text-transform: uppercase; color: #047857; margin: 2px 0;">${namaSekolah}</div>
          <div style="font-size: 12pt; font-weight: 900; text-transform: uppercase; margin: 3px 0; letter-spacing: 1px;">LEMBAR DISPOSISI SURAT MASUK</div>
          <div style="font-size: 8.5pt; color: #333;">${fullAddress}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #000;">
          <tr>
            <td style="width: 20%; padding: 5px; border: 1px solid #000; background-color: #f1f5f9; font-weight: bold;">No. Agenda</td>
            <td style="width: 30%; padding: 5px; border: 1px solid #000; font-weight: bold; color: #0f172a;">${surat.nomorAgenda}</td>
            <td style="width: 20%; padding: 5px; border: 1px solid #000; background-color: #f1f5f9; font-weight: bold;">Sifat Surat</td>
            <td style="width: 30%; padding: 5px; border: 1px solid #000; font-weight: bold;">[ ${surat.sifat.toUpperCase()} ]</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #000; background-color: #f1f5f9;">Surat Dari</td>
            <td style="padding: 5px; border: 1px solid #000; font-weight: bold;" colspan="3">${surat.pengirim}</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #000; background-color: #f1f5f9;">No. Surat Asal</td>
            <td style="padding: 5px; border: 1px solid #000;">${surat.nomorSuratAsal}</td>
            <td style="padding: 5px; border: 1px solid #000; background-color: #f1f5f9;">Tgl. Surat</td>
            <td style="padding: 5px; border: 1px solid #000;">${formattedSurat}</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #000; background-color: #f1f5f9;">Tgl. Diterima</td>
            <td style="padding: 5px; border: 1px solid #000;">${formattedDiterima}</td>
            <td style="padding: 5px; border: 1px solid #000; background-color: #f1f5f9;">Lokasi Arsip</td>
            <td style="padding: 5px; border: 1px solid #000;">${surat.lokasiArsip || 'Ordner TU'}</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #000; background-color: #f1f5f9; vertical-align: top;">Perihal</td>
            <td style="padding: 5px; border: 1px solid #000; font-weight: bold;" colspan="3">${surat.perihal}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #000;">
          <tr style="background-color: #e2e8f0;">
            <th style="width: 50%; padding: 6px; border: 1px solid #000; text-align: left;">DISPOSISI KEPADA:</th>
            <th style="width: 50%; padding: 6px; border: 1px solid #000; text-align: left;">PETUNJUK / INSTRUKSI:</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000; vertical-align: top;">
              ${targetOfficers.map(off => {
                const isChecked = surat.disposisiTujuan?.includes(off);
                return `
                  <div style="margin-bottom: 4px; font-size: 9pt;">
                    <span style="display: inline-block; width: 14px; height: 14px; border: 1px solid #000; text-align: center; line-height: 12px; margin-right: 6px; font-weight: bold;">
                      ${isChecked ? '✓' : ''}
                    </span>
                    <span style="${isChecked ? 'font-weight: bold; color: #0f172a;' : ''}">${off}</span>
                  </div>
                `;
              }).join('')}
            </td>
            <td style="padding: 8px; border: 1px solid #000; vertical-align: top;">
              ${instructions.map(ins => {
                const isChecked = surat.disposisiInstruksi?.includes(ins);
                return `
                  <div style="margin-bottom: 4px; font-size: 9pt;">
                    <span style="display: inline-block; width: 14px; height: 14px; border: 1px solid #000; text-align: center; line-height: 12px; margin-right: 6px; font-weight: bold;">
                      ${isChecked ? '✓' : ''}
                    </span>
                    <span style="${isChecked ? 'font-weight: bold; color: #0f172a;' : ''}">${ins}</span>
                  </div>
                `;
              }).join('')}
            </td>
          </tr>
        </table>

        <div style="border: 1px solid #000; padding: 8px; margin-bottom: 15px; min-height: 90px;">
          <div style="font-weight: bold; font-size: 9.5pt; text-decoration: underline; margin-bottom: 5px;">CATATAN KHUSUS KEPALA MADRASAH / PIMPINAN:</div>
          <div style="font-size: 9.5pt; white-space: pre-wrap; font-style: italic; color: #1e293b;">
            ${surat.disposisiCatatan || '...................................................................................................................................................................................................'}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 60%; font-size: 8.5pt; color: #475569; vertical-align: bottom;">
              <div>* Lembar disposisi ini harus dilampirkan pada berkas surat asli</div>
              <div>* Status Disposisi: <b>${surat.disposisiStatus}</b></div>
            </td>
            <td style="width: 40%; text-align: center;">
              <div style="font-size: 9.5pt;">${city}, ${surat.disposisiTanggal ? new Date(surat.disposisiTanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : formattedDiterima}</div>
              <div style="font-size: 9.5pt; font-weight: bold;">Kepala Madrasah,</div>
              <div style="height: 55px;"></div>
              <div style="font-weight: bold; text-decoration: underline; font-size: 9.5pt;">${headmasterName}</div>
              ${headmasterNip && headmasterNip !== '-' ? `<div style="font-size: 8.5pt;">NIP. ${headmasterNip}</div>` : ''}
            </td>
          </tr>
        </table>
      </div>
    `;

    printHtmlString(html, `Lembar_Disposisi_${surat.nomorAgenda}`);
  };

  // Export Agenda to CSV
  const handleExportAgenda = () => {
    if (activeSubTab === 'surat_keluar') {
      const rows: (string | number)[][] = [
        ['No', 'Nomor Surat', 'Kode Klasifikasi', 'Kategori Surat', 'Tanggal Surat', 'Perihal', 'Tujuan Surat', 'Penandatangan', 'Status'],
        ...suratKeluarList.map((item, idx) => [
          idx + 1,
          item.nomorSurat,
          item.kodeKlasifikasi,
          item.kategoriSurat,
          item.tanggalSurat,
          item.perihal,
          item.tujuanSurat,
          item.penandatanganNama,
          item.status
        ])
      ];
      exportToCsv(`Buku_Agenda_Surat_Keluar_${schoolId}_${new Date().toISOString().split('T')[0]}.csv`, rows);
    } else {
      const rows: (string | number)[][] = [
        ['No', 'Nomor Agenda', 'Nomor Surat Asal', 'Pengirim', 'Tanggal Surat', 'Tanggal Diterima', 'Perihal', 'Sifat', 'Status Disposisi', 'Lokasi Arsip'],
        ...suratMasukList.map((item, idx) => [
          idx + 1,
          item.nomorAgenda,
          item.nomorSuratAsal,
          item.pengirim,
          item.tanggalSurat,
          item.tanggalDiterima,
          item.perihal,
          item.sifat,
          item.disposisiStatus,
          item.lokasiArsip
        ])
      ];
      exportToCsv(`Buku_Agenda_Surat_Masuk_${schoolId}_${new Date().toISOString().split('T')[0]}.csv`, rows);
    }
  };

  // Filtered lists
  const filteredSuratKeluar = useMemo(() => {
    return suratKeluarList.filter(item => {
      const matchSearch =
        item.nomorSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.perihal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tujuanSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.studentName && item.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.teacherName && item.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = categoryFilter === 'ALL' || item.kategoriSurat === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [suratKeluarList, searchQuery, categoryFilter, statusFilter]);

  const filteredSuratMasuk = useMemo(() => {
    return suratMasukList.filter(item => {
      const matchSearch =
        item.nomorAgenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nomorSuratAsal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pengirim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.perihal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || item.kategori === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.disposisiStatus === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [suratMasukList, searchQuery, categoryFilter, statusFilter]);

  // Copy text to clipboard
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-bold text-indigo-200 uppercase tracking-wider mb-3">
              <Mail className="w-3.5 h-3.5" />
              Sistem Informasi Tata Usaha & Administrasi Persuratan
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pengelolaan Surat & Disposisi
            </h1>
            <p className="text-sm sm:text-base text-indigo-200/80 mt-1 max-w-2xl">
              Penerbitan surat resmi madrasah, pembuatan surat keterangan siswa/guru, inventarisir surat masuk, lembar disposisi kepala madrasah, serta buku register agenda persuratan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingKeluar(null);
                setKeluarFormData({
                  ...initialKeluarForm,
                  nomorSurat: generateNomorSurat('PP.00.5')
                });
                setIsKeluarModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Surat Keluar
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingMasuk(null);
                setMasukFormData(initialMasukForm);
                setIsMasukModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Inbox className="w-4 h-4" />
              Catat Surat Masuk
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="text-xs text-indigo-200/70 font-medium">Surat Keluar Terbit</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{suratKeluarList.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="text-xs text-emerald-200/70 font-medium">Surat Masuk Tercatat</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">{suratMasukList.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="text-xs text-amber-200/70 font-medium">Menunggu Disposisi</div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {suratMasukList.filter(s => s.disposisiStatus === 'Menunggu Disposisi').length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="text-xs text-sky-200/70 font-medium">Proses Tindak Lanjut</div>
            <div className="text-xl sm:text-2xl font-black text-sky-300 mt-0.5">
              {suratMasukList.filter(s => s.disposisiStatus === 'Proses Tindak Lanjut').length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub Tabs */}
      <div className="bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('surat_keluar');
            setSearchQuery('');
            setCategoryFilter('ALL');
            setStatusFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'surat_keluar'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          Surat Keluar ({suratKeluarList.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('surat_masuk');
            setSearchQuery('');
            setCategoryFilter('ALL');
            setStatusFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'surat_masuk'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Surat Masuk & Disposisi ({suratMasukList.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('buku_agenda');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'buku_agenda'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Buku Register Agenda
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('klasifikasi');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'klasifikasi'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          Kode Klasifikasi Surat
        </button>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'surat_keluar' && (
        <div className="space-y-4">
          {/* Quick Actions & Search */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor surat, perihal, tujuan, nama siswa/guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Kategori Surat</option>
                <option value="Surat Pemberitahuan Ulangan">Surat Pemberitahuan Ulangan</option>
                <option value="Surat Pemberitahuan Ujian">Surat Pemberitahuan Ujian</option>
                <option value="Surat Keterangan Aktif Siswa">Surat Keterangan Siswa</option>
                <option value="Surat Undangan Wali Murid">Surat Undangan</option>
                <option value="Surat Tugas Guru / Karyawan">Surat Tugas</option>
                <option value="Surat Panggilan Orang Tua Siswa">Surat Panggilan Siswa</option>
                <option value="Surat Pemberitahuan Libur / Kegiatan">Surat Pemberitahuan</option>
                <option value="Surat Rekomendasi Siswa">Surat Rekomendasi</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="Terbit">Terbit</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Draft">Draft</option>
                <option value="Diarsipkan">Diarsipkan</option>
              </select>

              <button
                type="button"
                onClick={handleExportAgenda}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Ekspor Data ke Excel/CSV"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor
              </button>
            </div>
          </div>

          {/* Letter List */}
          {filteredSuratKeluar.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Belum ada Surat Keluar</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Gunakan tombol "Buat Surat Keluar" di atas untuk membuat surat keterangan aktif belajar, undangan rapat, surat tugas, atau surat resmi lainnya.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuratKeluar.map((letter) => (
                <div
                  key={letter.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                          {letter.kodeKlasifikasi} • {letter.kategoriSurat}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                          {letter.perihal}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        letter.status === 'Terbit'
                          ? 'bg-emerald-100 text-emerald-800'
                          : letter.status === 'Draft'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {letter.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Nomor:</span>
                        <span className="font-semibold text-slate-800 font-mono text-[11px]">{letter.nomorSurat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tanggal:</span>
                        <span className="font-medium text-slate-700">{letter.tanggalSurat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tujuan:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[220px]">{letter.tujuanSurat}</span>
                      </div>
                      {letter.studentName && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400">Siswa Terkait:</span>
                          <span className="font-bold text-indigo-700">{letter.studentName} ({letter.studentClass})</span>
                        </div>
                      )}
                      {letter.teacherName && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400">Guru Terkait:</span>
                          <span className="font-bold text-teal-700">{letter.teacherName}</span>
                        </div>
                      )}
                      {letter.rincianBiaya && letter.rincianBiaya.length > 0 && (() => {
                        const feeSummary = calculateFeeSummary(letter.rincianBiaya);
                        if (feeSummary.isCategoryMode) {
                          return (
                            <div className="pt-2 border-t border-amber-200/60 bg-amber-50/50 -mx-3 -mb-3 px-3 py-2 rounded-b-lg space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                                <span>Kewajiban Biaya (3 Kategori):</span>
                                <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                  Tarif Terpisah
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-[10px]">
                                <div className="bg-white p-1 rounded border border-emerald-200 text-center">
                                  <span className="block text-[8.5px] text-emerald-700 font-semibold">1. Reguler</span>
                                  <span className="font-bold text-emerald-900 font-mono">Rp {feeSummary.totalReguler.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="bg-white p-1 rounded border border-sky-200 text-center">
                                  <span className="block text-[8.5px] text-sky-700 font-semibold">2. Duafa</span>
                                  <span className="font-bold text-sky-900 font-mono">Rp {feeSummary.totalDuafa.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="bg-white p-1 rounded border border-amber-200 text-center">
                                  <span className="block text-[8.5px] text-amber-700 font-semibold">3. Yatim</span>
                                  <span className="font-bold text-amber-900 font-mono">Rp {feeSummary.totalYatim.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 bg-amber-50/50 -mx-3 -mb-3 px-3 py-1.5 rounded-b-lg">
                            <span className="text-amber-800 font-medium">Total Kewajiban Biaya:</span>
                            <span className="font-bold text-amber-900 font-mono">
                              Rp {feeSummary.grandTotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPrintingSuratKeluar(letter);
                          setPrintColorTheme(letter.warnaTeks || 'hitam');
                          setIsPrintSuratModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                        title="Atur Kertas, Warna Font & Cetak Surat Keluar (A4 / F4 & 1 Lembar)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Surat
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyText(letter.id, letter.isiSurat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        title="Salin Teks Isi Surat"
                      >
                        {copiedId === letter.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Disalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKeluar(letter);
                          setKeluarFormData(letter);
                          setIsKeluarModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="Edit Surat"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus surat nomor "${letter.nomorSurat}"?`)) {
                            onDeleteSuratKeluar(letter.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus Surat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Surat Masuk & Disposisi Tab */}
      {activeSubTab === 'surat_masuk' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor agenda, pengirim, perihal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Status Disposisi</option>
                <option value="Menunggu Disposisi">Menunggu Disposisi</option>
                <option value="Proses Tindak Lanjut">Proses Tindak Lanjut</option>
                <option value="Selesai">Selesai</option>
                <option value="Diarsipkan">Diarsipkan</option>
              </select>

              <button
                type="button"
                onClick={handleExportAgenda}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Ekspor Data ke Excel/CSV"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor
              </button>
            </div>
          </div>

          {filteredSuratMasuk.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Belum ada Surat Masuk Tercatat</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Catat surat masuk kedinasan dari Kemenag, Dinas, Puskesmas, Kepolisian, atau instansi lainnya menggunakan tombol "Catat Surat Masuk".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuratMasuk.map((letter) => (
                <div
                  key={letter.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          {letter.nomorAgenda} • Sifat: {letter.sifat}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                          {letter.perihal}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        letter.disposisiStatus === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : letter.disposisiStatus === 'Proses Tindak Lanjut'
                          ? 'bg-sky-100 text-sky-800'
                          : letter.disposisiStatus === 'Menunggu Disposisi'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {letter.disposisiStatus}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Pengirim:</span>
                        <span className="font-bold text-slate-800">{letter.pengirim}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">No. Surat Asal:</span>
                        <span className="font-mono text-[11px] text-slate-700">{letter.nomorSuratAsal}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tgl. Diterima:</span>
                        <span className="font-medium text-slate-700">{letter.tanggalDiterima} (Surat: {letter.tanggalSurat})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Lokasi Arsip:</span>
                        <span className="font-semibold text-slate-700">{letter.lokasiArsip || 'Ordner TU'}</span>
                      </div>

                      {/* Disposisi summary */}
                      {letter.disposisiTujuan && letter.disposisiTujuan.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 mt-1">
                          <div className="text-[11px] font-bold text-slate-700">Disposisi Kepada:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {letter.disposisiTujuan.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-emerald-100/80 text-emerald-900 rounded text-[9.5px] font-semibold">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePrintDisposisi(letter)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Cetak Lembar Disposisi Kepala Madrasah"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Lembar Disposisi
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveDisposisiItem(letter);
                          setIsDisposisiModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Atur Disposisi & Instruksi"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        Disposisi
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMasuk(letter);
                          setMasukFormData(letter);
                          setIsMasukModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        title="Edit Surat Masuk"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus surat masuk "${letter.nomorAgenda}"?`)) {
                            onDeleteSuratMasuk(letter.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus Surat Masuk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buku Agenda Register */}
      {activeSubTab === 'buku_agenda' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Buku Register & Agenda Persuratan</h3>
                <p className="text-xs text-slate-500">Rekapitulasi berkas keluar dan masuk untuk pengarsipan tahunan dan akreditasi madrasah.</p>
              </div>
              <button
                type="button"
                onClick={handleExportAgenda}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Unduh Buku Agenda (.CSV)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="p-2.5 font-bold">No</th>
                    <th className="p-2.5 font-bold">Tipe</th>
                    <th className="p-2.5 font-bold">Nomor Surat / Agenda</th>
                    <th className="p-2.5 font-bold">Tanggal</th>
                    <th className="p-2.5 font-bold">Pengirim / Tujuan</th>
                    <th className="p-2.5 font-bold">Perihal</th>
                    <th className="p-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suratKeluarList.map((k, idx) => (
                    <tr key={k.id} className="hover:bg-indigo-50/40">
                      <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                          KELUAR
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-medium text-slate-800">{k.nomorSurat}</td>
                      <td className="p-2.5 text-slate-600">{k.tanggalSurat}</td>
                      <td className="p-2.5 text-slate-700">{k.tujuanSurat}</td>
                      <td className="p-2.5 font-medium text-slate-900">{k.perihal}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">{k.status}</span>
                      </td>
                    </tr>
                  ))}
                  {suratMasukList.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-emerald-50/40">
                      <td className="p-2.5 text-slate-400 font-mono">{suratKeluarList.length + idx + 1}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          MASUK
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-medium text-slate-800">{m.nomorAgenda} ({m.nomorSuratAsal})</td>
                      <td className="p-2.5 text-slate-600">{m.tanggalDiterima}</td>
                      <td className="p-2.5 text-slate-700 font-semibold">{m.pengirim}</td>
                      <td className="p-2.5 font-medium text-slate-900">{m.perihal}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">{m.disposisiStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Kode Klasifikasi Tab */}
      {activeSubTab === 'klasifikasi' && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Kode Klasifikasi Persuratan Madrasah & Sekolah</h3>
            <p className="text-xs text-slate-500">Standar pedoman tata naskah dinas Kementerian Agama dan Kementerian Pendidikan untuk penomoran surat dinas resmi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {KLASIFIKASI_SURAT_LIST.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {item.kode}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{item.kategori}</span>
                </div>
                <div className="text-xs font-medium text-slate-800 mt-2">{item.nama}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL BUAT / EDIT SURAT KELUAR ================= */}
      {isKeluarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold">
                  {editingKeluar ? 'Edit Surat Keluar' : 'Buat Surat Keluar Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKeluarModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKeluar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Quick Template Picker */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-950 mb-1.5">
                  ⚡ Pilih Template Cepat:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Surat Pemberitahuan Ulangan',
                    'Surat Keterangan Aktif Siswa',
                    'Surat Undangan Wali Murid',
                    'Surat Tugas Guru / Karyawan',
                    'Surat Panggilan Orang Tua Siswa',
                    'Surat Pemberitahuan Libur / Kegiatan'
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl as LetterTypeCategory)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                        tpl === 'Surat Pemberitahuan Ulangan'
                          ? 'bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-950 border border-amber-300 font-bold'
                          : 'bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200'
                      }`}
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Klasifikasi Surat
                  </label>
                  <select
                    value={keluarFormData.kodeKlasifikasi}
                    onChange={(e) => {
                      const kode = e.target.value;
                      setKeluarFormData(prev => ({
                        ...prev,
                        kodeKlasifikasi: kode,
                        nomorSurat: generateNomorSurat(kode)
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {KLASIFIKASI_SURAT_LIST.map((k) => (
                      <option key={k.kode} value={k.kode}>
                        {k.kode} - {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Surat (Auto/Manual)
                  </label>
                  <input
                    type="text"
                    required
                    value={keluarFormData.nomorSurat || ''}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="MTs.13.08/PP.00.5/001/VIII/2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    required
                    value={keluarFormData.tanggalSurat || ''}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    value={keluarFormData.lampiran || '-'}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, lampiran: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="- atau 1 Lembar"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Perihal Surat
                  </label>
                  <input
                    type="text"
                    required
                    value={keluarFormData.perihal || ''}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, perihal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: Surat Keterangan Aktif Belajar Siswa"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tujuan Surat (Kepada Yth.)
                  </label>
                  <input
                    type="text"
                    required
                    value={keluarFormData.tujuanSurat || ''}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, tujuanSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="Orang Tua / Wali Siswa"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat / Tempat Tujuan
                  </label>
                  <input
                    type="text"
                    value={keluarFormData.tujuanAlamat || 'di Tempat'}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, tujuanAlamat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="di Tempat"
                  />
                </div>

                {/* Autofill from student or teacher list */}
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">
                    Autofill Data Siswa (Opsional)
                  </label>
                  <select
                    value={selectedStudentForLetter}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">-- Pilih Siswa Untuk Isi Otomatis --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className}) - NISN: {s.nisn || '-'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1">
                    Autofill Data Guru (Opsional)
                  </label>
                  <select
                    value={selectedTeacherForLetter}
                    onChange={(e) => handleTeacherSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-teal-50/50 border border-teal-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="">-- Pilih Guru Untuk Surat Tugas --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} - NIP: {t.nip || '-'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Isi Surat */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Isi Utama Surat
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={keluarFormData.isiSurat || ''}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, isiSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tuliskan isi surat lengkap di sini..."
                  />
                </div>

                {/* Optional event details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hari / Tanggal Acara (Bila Undangan)
                  </label>
                  <input
                    type="text"
                    value={keluarFormData.hariTanggalKegiatan || ''}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, hariTanggalKegiatan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="Sabtu, 12 September 2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu & Tempat Acara
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={keluarFormData.waktuKegiatan || ''}
                      onChange={(e) => setKeluarFormData({ ...keluarFormData, waktuKegiatan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      placeholder="08.00 - Selesai"
                    />
                    <input
                      type="text"
                      value={keluarFormData.tempatKegiatan || ''}
                      onChange={(e) => setKeluarFormData({ ...keluarFormData, tempatKegiatan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      placeholder="Aula Madrasah"
                    />
                  </div>
                </div>

                {/* Section Khusus Surat Pemberitahuan Ulangan & Rincian Pembiayaan / Tunggakan */}
                {(() => {
                  const formFeeSummary = calculateFeeSummary(keluarFormData.rincianBiaya || []);
                  return (
                    <div className="sm:col-span-2 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/30 p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/80">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-amber-100 text-amber-900 rounded-lg shrink-0">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
                              <span>Rincian Informasi Ulangan & Pembiayaan / Tunggakan</span>
                              {(keluarFormData.kategoriSurat === 'Surat Pemberitahuan Ulangan' || keluarFormData.kategoriSurat === 'Surat Pemberitahuan Ujian') && (
                                <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded text-[10px] font-extrabold">
                                  Format Ulangan Aktif
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-amber-800/80">
                              Kategori tarif ulangan dipisah secara otomatis (Reguler, Duafa, dan Yatim) sehingga tidak ditotal menjadi satu.
                            </p>
                          </div>
                        </div>

                        <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-right shrink-0">
                          {formFeeSummary.isCategoryMode ? (
                            <div>
                              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Mode 3 Kategori Aktif:</div>
                              <div className="text-xs font-black text-amber-950 flex items-center gap-1.5 justify-end">
                                <span className="text-emerald-700">Reg: Rp {formFeeSummary.totalReguler.toLocaleString('id-ID')}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-sky-700">Duafa: Rp {formFeeSummary.totalDuafa.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Total Biaya:</div>
                              <div className="text-sm font-black text-amber-950 font-mono">
                                Rp {formFeeSummary.grandTotal.toLocaleString('id-ID')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live 3-Category Breakdown Box */}
                      {formFeeSummary.isCategoryMode && (
                        <div className="bg-white/90 p-3 rounded-xl border border-amber-300/80 shadow-2xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <span className="font-bold text-amber-950 flex items-center gap-1">
                              <span>💡</span>
                              <span>Total Kewajiban Biaya per Kategori Siswa (Hasil Akhir di Surat):</span>
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                              SPP atau Ekstrakulikuler + Ulangan Dipisahkan
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* 1. Reguler */}
                            <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                                <span>1. Siswa Reguler</span>
                                <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-extrabold">
                                  SPP/Ekskul + Ulangan Reguler
                                </span>
                              </div>
                              <div className="text-base font-black text-emerald-900 font-mono mt-1">
                                Rp {formFeeSummary.totalReguler.toLocaleString('id-ID')}
                              </div>
                              <div className="text-[10px] text-emerald-700/80 mt-0.5">
                                SPP Rp {formFeeSummary.commonTotal.toLocaleString('id-ID')} + Ulangan Rp {formFeeSummary.regulerFee.toLocaleString('id-ID')}
                              </div>
                            </div>

                            {/* 2. Duafa */}
                            <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-200">
                              <div className="flex items-center justify-between text-[11px] font-bold text-sky-900">
                                <span>2. Siswa Duafa</span>
                                <span className="text-[9px] bg-sky-200/80 text-sky-900 px-1.5 py-0.2 rounded font-extrabold">
                                  SPP/Ekskul + Ulangan Duafa
                                </span>
                              </div>
                              <div className="text-base font-black text-sky-900 font-mono mt-1">
                                Rp {formFeeSummary.totalDuafa.toLocaleString('id-ID')}
                              </div>
                              <div className="text-[10px] text-sky-700/80 mt-0.5">
                                SPP Rp {formFeeSummary.commonTotal.toLocaleString('id-ID')} + Ulangan Rp {formFeeSummary.duafaFee.toLocaleString('id-ID')}
                              </div>
                            </div>

                            {/* 3. Yatim */}
                            <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                                <span>3. Siswa Yatim</span>
                                <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-extrabold">
                                  SPP/Ekskul + Ulangan Yatim
                                </span>
                              </div>
                              <div className="text-base font-black text-amber-900 font-mono mt-1">
                                Rp {formFeeSummary.totalYatim.toLocaleString('id-ID')}
                              </div>
                              <div className="text-[10px] text-amber-700/80 mt-0.5">
                                {formFeeSummary.yatimFee === 0 ? 'Bebas Biaya Ulangan (Hanya SPP)' : `SPP Rp ${formFeeSummary.commonTotal.toLocaleString('id-ID')} + Ulangan Rp ${formFeeSummary.yatimFee.toLocaleString('id-ID')}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Informasi Pelaksanaan Ulangan */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Nama / Agenda Ulangan
                          </label>
                          <input
                            type="text"
                            value={keluarFormData.namaUjian || ''}
                            onChange={(e) => setKeluarFormData({ ...keluarFormData, namaUjian: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
                            placeholder="Contoh: Penilaian Akhir Semester (PAS) Ganjil"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Jadwal Pelaksanaan Ulangan
                          </label>
                          <input
                            type="text"
                            value={keluarFormData.jadwalPelaksanaanUjian || ''}
                            onChange={(e) => setKeluarFormData({ ...keluarFormData, jadwalPelaksanaanUjian: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                            placeholder="Contoh: 21 - 26 September 2026"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Batas Waktu Pelunasan Pembayaran
                          </label>
                          <input
                            type="text"
                            value={keluarFormData.batasWaktuPembayaran || ''}
                            onChange={(e) => setKeluarFormData({ ...keluarFormData, batasWaktuPembayaran: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                            placeholder="Contoh: Jumat, 18 September 2026"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Tempat / Rekening Pembayaran
                          </label>
                          <input
                            type="text"
                            value={keluarFormData.tempatMetodePembayaran || ''}
                            onChange={(e) => setKeluarFormData({ ...keluarFormData, tempatMetodePembayaran: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                            placeholder="Contoh: Loket Keuangan / Bendahara TU Madrasah"
                          />
                        </div>
                      </div>

                      {/* List of Dynamic Fee Items */}
                      <div className="pt-2 border-t border-amber-200/70 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-700" />
                            <span>Daftar Pos Pembayaran & Kategori:</span>
                            <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                              {(keluarFormData.rincianBiaya || []).length} Pos
                            </span>
                          </label>

                          {/* Quick Add Presets */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleApply3KategoriPreset}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded text-[11px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                              title="Terapkan Otomatis 3 Kategori: SPP atau Ekstrakulikuler, Ulangan Reguler (165rb), Ulangan Duafa (90rb), Ulangan Yatim (0rb)"
                            >
                              <span>✨</span>
                              <span>Preset 3 Kategori (Reguler, Duafa, Yatim)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddRincianBiaya('Tunggakan SPP atau Ekstrakulikuler', 150000, 'Wajib lunas s.d bulan berjalan', 'Semua')}
                              className="px-2 py-0.5 bg-white hover:bg-amber-600 hover:text-white text-amber-900 border border-amber-300 rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              + SPP atau Ekstrakulikuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddRincianBiaya('Biaya Penyelenggaraan Ulangan (PAS/PTS)', 165000, 'Kategori Siswa Reguler', 'Reguler')}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-900 border border-emerald-300 rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              + Ulangan Reguler (165rb)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddRincianBiaya('Biaya Penyelenggaraan Ulangan (PAS/PTS)', 90000, 'Kategori Siswa Duafa / Keringanan', 'Duafa')}
                              className="px-2 py-0.5 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-900 border border-sky-300 rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              + Ulangan Duafa (90rb)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddRincianBiaya('Biaya Penyelenggaraan Ulangan (PAS/PTS)', 0, 'Kategori Siswa Yatim (Bebas Biaya Ulangan)', 'Yatim')}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 border border-amber-300 rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              + Ulangan Yatim (0rb)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddRincianBiaya('Pos Biaya Tambahan', 0, '', 'Semua')}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              + Tambah Bebas
                            </button>
                          </div>
                        </div>

                        {(!keluarFormData.rincianBiaya || keluarFormData.rincianBiaya.length === 0) ? (
                          <div className="bg-white/80 rounded-lg p-3.5 text-center border border-dashed border-amber-300 text-xs text-amber-800">
                            Belum ada pos rincian biaya yang ditambahkan. Silakan klik tombol <strong>"Preset 3 Kategori (Reguler, Duafa, Yatim)"</strong> di atas untuk mengatur langsung.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {keluarFormData.rincianBiaya.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                              >
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-bold text-slate-500 sm:hidden">Nama Pos Biaya</label>
                                  <input
                                    type="text"
                                    placeholder="Nama Pos Biaya (misal: Biaya Penyelenggaraan Ulangan)"
                                    value={item.namaBiaya}
                                    onChange={(e) => handleUpdateRincianBiaya(idx, 'namaBiaya', e.target.value)}
                                    className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-500 sm:hidden">Kategori Target</label>
                                  <select
                                    value={item.kategoriTarget || 'Semua'}
                                    onChange={(e) => handleUpdateRincianBiaya(idx, 'kategoriTarget', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="Semua">🌐 Semua Siswa (Wajib / SPP)</option>
                                    <option value="Reguler">🟢 Kategori Siswa REGULER</option>
                                    <option value="Duafa">🔵 Kategori Siswa DUAFA</option>
                                    <option value="Yatim">🟠 Kategori Siswa YATIM</option>
                                  </select>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-500 sm:hidden">Keterangan</label>
                                  <input
                                    type="text"
                                    placeholder="Keterangan (Opsional)"
                                    value={item.keterangan || ''}
                                    onChange={(e) => handleUpdateRincianBiaya(idx, 'keterangan', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-500 sm:hidden">Nominal (Rp)</label>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1000"
                                      placeholder="0"
                                      value={item.nominal}
                                      onChange={(e) => handleUpdateRincianBiaya(idx, 'nominal', parseFloat(e.target.value) || 0)}
                                      className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-emerald-800 focus:bg-white focus:ring-1 focus:ring-amber-500 text-right"
                                    />
                                  </div>
                                </div>

                                <div className="sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRincianBiaya(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Hapus Pos Biaya"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Syarat Kartu Peserta Ulangan */}
                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Catatan Pengambilan Kartu Peserta Ulangan
                          </label>
                          <input
                            type="text"
                            value={keluarFormData.catatanSyaratUjian || ''}
                            onChange={(e) => setKeluarFormData({ ...keluarFormData, catatanSyaratUjian: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                            placeholder="Contoh: Kartu Peserta Ulangan dapat diambil di Ruang Tata Usaha setelah menyelesaikan seluruh kewajiban administrasi di atas."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Signatory */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Penandatangan
                  </label>
                  <input
                    type="text"
                    value={keluarFormData.penandatanganNama || ''}
                    onChange={(e) => setKeluarFormData({ ...keluarFormData, penandatanganNama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan & NIP Penandatangan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={keluarFormData.penandatanganJabatan || 'Kepala Madrasah'}
                      onChange={(e) => setKeluarFormData({ ...keluarFormData, penandatanganJabatan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={keluarFormData.penandatanganNip || '-'}
                      onChange={(e) => setKeluarFormData({ ...keluarFormData, penandatanganNip: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Pilihan Warna Font Isi Surat (Kop Surat Tetap Terkunci) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Warna Font Isi Surat <span className="text-[11px] font-normal text-slate-500">(Kop Surat tetap resmi/terkunci)</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold uppercase">
                      Kop Surat Terkunci
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setKeluarFormData({ ...keluarFormData, warnaTeks: 'hitam' })}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        (keluarFormData.warnaTeks || 'hitam') === 'hitam'
                          ? 'bg-white border-slate-900 shadow-xs ring-2 ring-slate-900/10'
                          : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                        {(keluarFormData.warnaTeks || 'hitam') === 'hitam' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Hitam Semua</div>
                        <div className="text-[10px] text-slate-500">Monokrom resmi standar dinas/arsip</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKeluarFormData({ ...keluarFormData, warnaTeks: 'berwarna' })}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        keluarFormData.warnaTeks === 'berwarna'
                          ? 'bg-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-600 border border-indigo-400 flex items-center justify-center shrink-0">
                        {keluarFormData.warnaTeks === 'berwarna' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-indigo-900">Ada Warnanya</div>
                        <div className="text-[10px] text-slate-500">Aksen badge & sorotan kategori warna</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {keluarFormData.nomorSurat && (
                    <button
                      type="button"
                      onClick={() => {
                        setPrintingSuratKeluar(keluarFormData as SuratKeluar);
                        setPrintColorTheme(keluarFormData.warnaTeks || 'hitam');
                        setIsPrintSuratModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      title="Pratinjau & Pengaturan Cetak (A4/F4, 1 Lembar & Warna Font)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Pratinjau & Atur Kertas
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsKeluarModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    Simpan & Terbitkan Surat
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PRATINJAU & PENGATURAN CETAK SURAT KELUAR ================= */}
      {isPrintSuratModalOpen && printingSuratKeluar && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 text-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-700 overflow-hidden my-4 flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Pratinjau & Pengaturan Cetak Surat
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-md">
                    No: <span className="font-semibold text-slate-200">{printingSuratKeluar.nomorSurat}</span> • Perihal: <span className="font-semibold text-slate-200">{printingSuratKeluar.perihal}</span>
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsPrintSuratModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Pratinjau"
              >
                ✕
              </button>
            </div>

            {/* Control Bar: Paper Size, Single Page Toggle & Font Color Selection */}
            <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                
                {/* 1. Paper Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Kertas:</span>
                  <div className="inline-flex p-1 bg-slate-900/90 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPrintPaperSize('A4')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        printPaperSize === 'A4'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>A4</span>
                      <span className="text-[10px] opacity-75 font-normal hidden lg:inline">(210×297)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintPaperSize('F4')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        printPaperSize === 'F4'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>F4/Folio</span>
                      <span className="text-[10px] opacity-75 font-normal hidden lg:inline">(215×330)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Single Page Layout Mode */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Format:</span>
                  <div className="inline-flex p-1 bg-slate-900/90 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPrintLayoutMode('single-page')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        printLayoutMode === 'single-page'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Otomatis menyesuaikan spasi dan font agar pas 1 halaman utuh"
                    >
                      <span>⚡ 1 Lembar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintLayoutMode('normal')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        printLayoutMode === 'normal'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Format spasi dan ukuran standar dokumen resmi"
                    >
                      <span>📏 Normal</span>
                    </button>
                  </div>
                </div>

                {/* 3. Warna Font Isi Surat (Kop Surat Tetap Terkunci) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Warna Isi:</span>
                  <div className="inline-flex p-1 bg-slate-900/90 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPrintColorTheme('hitam')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        printColorTheme === 'hitam'
                          ? 'bg-slate-100 text-slate-950 shadow-sm font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Hitam semua (Kecuali Kop Surat yang tetap resmi)"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-950 border border-slate-500"></span>
                      <span>Hitam Semua</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintColorTheme('berwarna')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        printColorTheme === 'berwarna'
                          ? 'bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-sm font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Ada warnanya untuk penekanan dan rincian kategori"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Berwarna</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons in Control Bar */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handlePrintSuratKeluar(printingSuratKeluar, printPaperSize, printLayoutMode, printColorTheme)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md hover:shadow-emerald-900/30"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Sekarang ({printPaperSize} • {printLayoutMode === 'single-page' ? '1 Lembar' : 'Normal'} • {printColorTheme === 'hitam' ? 'Hitam' : 'Warna'})
                </button>
              </div>
            </div>

            {/* Paper Preview Area (Interactive Sheet Simulator) */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex flex-col items-center justify-start min-h-[420px] max-h-[calc(85vh-160px)]">
              
              {/* Paper Dimension & Mode Badge */}
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Kertas: <strong className="text-white">{printPaperSize}</strong> ({printPaperSize === 'A4' ? '210 × 297 mm' : '215 × 330 mm'})</span>
                <span>•</span>
                <span>Tata Letak: <strong className="text-emerald-300">{printLayoutMode === 'single-page' ? 'Pas 1 Lembar' : 'Normal'}</strong></span>
                <span>•</span>
                <span>Font Isi: <strong className={printColorTheme === 'hitam' ? 'text-slate-200' : 'text-sky-300'}>{printColorTheme === 'hitam' ? 'Hitam Semua' : 'Berwarna'}</strong></span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-medium">(Kop Surat Terkunci)</span>
              </div>

              {/* Realistic Paper Container */}
              <div
                className={`bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 w-full transition-all duration-200 overflow-hidden ${
                  printPaperSize === 'A4' ? 'max-w-[794px]' : 'max-w-[812px]'
                }`}
                style={{
                  minHeight: printPaperSize === 'A4' ? '1000px' : '1100px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateSuratKeluarHtml(printingSuratKeluar, printPaperSize, printLayoutMode, printColorTheme)
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 hidden sm:inline">
                💡 <em>Tips:</em> Pilih <strong>"Hitam Semua"</strong> untuk cetakan dokumen dinas monokrom. Kop surat tetap menjaga identitas resmi lembaga.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsPrintSuratModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintSuratKeluar(printingSuratKeluar, printPaperSize, printLayoutMode, printColorTheme)}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Buka Dialog Cetak
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL CATAT SURAT MASUK ================= */}
      {isMasukModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Inbox className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold">
                  {editingMasuk ? 'Edit Surat Masuk' : 'Pencatatan Surat Masuk Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMasukModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMasuk} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Agenda (Auto)
                  </label>
                  <input
                    type="text"
                    required
                    value={masukFormData.nomorAgenda || ''}
                    onChange={(e) => setMasukFormData({ ...masukFormData, nomorAgenda: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sifat Surat
                  </label>
                  <select
                    value={masukFormData.sifat}
                    onChange={(e) => setMasukFormData({ ...masukFormData, sifat: e.target.value as LetterIncomingNature })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Penting">Penting</option>
                    <option value="Segera">Segera</option>
                    <option value="Sangat Segera">Sangat Segera</option>
                    <option value="Rahasia">Rahasia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Surat Asal
                  </label>
                  <input
                    type="text"
                    required
                    value={masukFormData.nomorSuratAsal || ''}
                    onChange={(e) => setMasukFormData({ ...masukFormData, nomorSuratAsal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    placeholder="B-1420/Kk.13.08/PP.00/08/2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instansi / Pengirim Surat
                  </label>
                  <input
                    type="text"
                    required
                    value={masukFormData.pengirim || ''}
                    onChange={(e) => setMasukFormData({ ...masukFormData, pengirim: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Kankemenag Kab. Gresik - Pendma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Surat Asal
                  </label>
                  <input
                    type="date"
                    required
                    value={masukFormData.tanggalSurat || ''}
                    onChange={(e) => setMasukFormData({ ...masukFormData, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Diterima di TU
                  </label>
                  <input
                    type="date"
                    required
                    value={masukFormData.tanggalDiterima || ''}
                    onChange={(e) => setMasukFormData({ ...masukFormData, tanggalDiterima: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Perihal / Ringkasan Isi Surat
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={masukFormData.perihal || ''}
                    onChange={(e) => setMasukFormData({ ...masukFormData, perihal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Undangan Rapat Koordinasi Persiapan Asesmen & Validasi EMIS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Penyimpanan Fisik / Ordner
                  </label>
                  <input
                    type="text"
                    value={masukFormData.lokasiArsip || ''}
                    onChange={(e) => setMasukFormData({ ...masukFormData, lokasiArsip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ordner A-1 (Kemenag)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lampiran Berkas
                  </label>
                  <input
                    type="text"
                    value={masukFormData.lampiran || '-'}
                    onChange={(e) => setMasukFormData({ ...masukFormData, lampiran: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="- atau 1 Berkas Juknis"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMasukModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Simpan Surat Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ATUR DISPOSISI KEPALA MADRASAH ================= */}
      {isDisposisiModalOpen && activeDisposisiItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-sky-900 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-lg font-bold">Disposisi Kepala Madrasah</h3>
                  <p className="text-xs text-sky-200/80 font-mono">No. Agenda: {activeDisposisiItem.nomorAgenda}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDisposisiModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{activeDisposisiItem.perihal}</div>
                <div className="text-slate-500 mt-0.5">Dari: <span className="font-semibold text-slate-800">{activeDisposisiItem.pengirim}</span></div>
              </div>

              {/* Disposisi Kepada Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Diteruskan / Disposisi Kepada:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Waka Kurikulum',
                    'Waka Kesiswaan',
                    'Waka Sarana Prasarana',
                    'Waka Humas',
                    'Kepala Tata Usaha',
                    'Bendahara Madrasah',
                    'Bimbingan Konseling (BK)',
                    'Pembina OSIS / Ekstrakurikuler',
                    'Wali Kelas',
                    'Operator Data / EMIS'
                  ].map((target) => {
                    const isChecked = activeDisposisiItem.disposisiTujuan?.includes(target);
                    return (
                      <label
                        key={target}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-sky-50 border-sky-300 font-bold text-sky-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = activeDisposisiItem.disposisiTujuan || [];
                            const updated = e.target.checked
                              ? [...current, target]
                              : current.filter(t => t !== target);
                            setActiveDisposisiItem({
                              ...activeDisposisiItem,
                              disposisiTujuan: updated
                            });
                          }}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>{target}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Instruksi Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Petunjuk / Instruksi Pimpinan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Tindak Lanjuti Segera',
                    'Hadiri / Wakili',
                    'Siapkan Berkas / Bahan',
                    'Koordinasikan dengan Terkait',
                    'Untuk Diketahui / Arsip',
                    'Pelajari / Beri Masukan',
                    'Laporkan Hasilnya'
                  ].map((inst) => {
                    const isChecked = activeDisposisiItem.disposisiInstruksi?.includes(inst);
                    return (
                      <label
                        key={inst}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = activeDisposisiItem.disposisiInstruksi || [];
                            const updated = e.target.checked
                              ? [...current, inst]
                              : current.filter(i => i !== inst);
                            setActiveDisposisiItem({
                              ...activeDisposisiItem,
                              disposisiInstruksi: updated
                            });
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{inst}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Disposisi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan Khusus Pimpinan
                </label>
                <textarea
                  rows={3}
                  value={activeDisposisiItem.disposisiCatatan || ''}
                  onChange={(e) => setActiveDisposisiItem({ ...activeDisposisiItem, disposisiCatatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-sky-500"
                  placeholder="Tuliskan arahan atau catatan penting dari Kepala Madrasah di sini..."
                />
              </div>

              {/* Status Disposisi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Status Tindak Lanjut
                  </label>
                  <select
                    value={activeDisposisiItem.disposisiStatus}
                    onChange={(e) => setActiveDisposisiItem({ ...activeDisposisiItem, disposisiStatus: e.target.value as LetterDispositionStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Menunggu Disposisi">Menunggu Disposisi</option>
                    <option value="Proses Tindak Lanjut">Proses Tindak Lanjut</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Diarsipkan">Diarsipkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tanggal Disposisi
                  </label>
                  <input
                    type="date"
                    value={activeDisposisiItem.disposisiTanggal || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setActiveDisposisiItem({ ...activeDisposisiItem, disposisiTanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePrintDisposisi(activeDisposisiItem)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Lembar Disposisi
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDisposisiModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDisposisi}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    Simpan Disposisi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

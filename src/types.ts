export type AttendanceStatus = 'H' | 'I' | 'S' | 'A'; // Hadir, Izin, Sakit, Alpa

export interface OfficialPerson {
  name: string;
  nip: string;
  phone?: string;
  email?: string;
  nuptk?: string;
  signatureTitle?: string;
  kodeUnik?: string; // Kode Akses Login (khusus untuk kurikulum atau pimpinan)
}

export interface BendaharaPerson extends OfficialPerson {
  id?: string;
  kodeUnik?: string;
  phone?: string;
  roleTitle?: string;
  active?: boolean;
}

export interface KopSuratConfig {
  // Font Styling
  fontFamily?: 'Arial' | 'Times New Roman' | 'Bookman Old Style' | 'Calibri' | 'Georgia';
  namaYayasanColor?: string; // e.g. '#1e293b'
  namaYayasanFontSize?: number; // in pt, default 11
  namaSekolahColor?: string; // e.g. '#047857'
  namaSekolahFontSize?: number; // in pt, default 15
  statusAkreditasiColor?: string; // e.g. '#334155'
  alamatColor?: string; // e.g. '#475569'
  kontakColor?: string; // e.g. '#64748b'
  
  // Layout & Alignment
  layoutAlign?: 'center' | 'left' | 'right';
  logoPosition?: 'left' | 'right' | 'both' | 'top_center' | 'none';
  secondaryLogoUrl?: string; // Secondary logo e.g. Kemenag / Yayasan / Tut Wuri Handayani
  
  // Logo Size
  logoSize?: number; // height in px (e.g. 75, range: 45 - 120)
  secondaryLogoSize?: number; // height in px
  
  // Border Styling
  borderStyle?: 'double' | 'solid' | 'classic_double' | 'none';
  borderColor?: string; // default '#000000'
  borderThickness?: number; // default 3
}

export interface SchoolOfficials {
  // Identitas Lembaga & Profil
  namaSekolah?: string;
  namaYayasan?: string;
  npsn?: string;
  nsm?: string;
  akreditasi?: string;
  izinOperasional?: string;
  jenjang?: string; // 'MTs' | 'SMK' | 'SMP' | 'SMA' | 'MA' | string
  statusSekolah?: string; // 'Swasta' | 'Negeri' | string
  tagline?: string;
  logoUrl?: string;

  // Custom Kop Surat Settings
  kopSuratConfig?: KopSuratConfig;

  // Alamat & Kontak Lembaga
  alamatSekolah?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  kotaSekolah?: string;
  provinsi?: string;
  kodePos?: string;
  teleponSekolah?: string;
  whatsappSekolah?: string;
  emailSekolah?: string;
  website?: string;

  // Pejabat & Pimpinan Lembaga
  kepalaSekolah: OfficialPerson;
  kesiswaan: OfficialPerson;
  kurikulum: OfficialPerson;
  sarpras?: OfficialPerson;
  humas?: OfficialPerson;
  tataUsaha?: OfficialPerson;
  bk?: OfficialPerson;

  // Bendahara
  bendaharaUtama?: BendaharaPerson; // Bendahara Utama (Pusat)
  bendahara?: BendaharaPerson; // Bendahara 1
  bendahara2?: BendaharaPerson; // Bendahara 2
  bendahara3?: BendaharaPerson; // Bendahara 3
  bendahara4?: BendaharaPerson; // Bendahara 4
  bendahara5?: BendaharaPerson; // Bendahara 5
  treasurers?: BendaharaPerson[]; // List of all registered bendahara managed by Super Admin (Bendahara Utama & Bendahara 1 s/d 5)
}

export type ClassWaliKelasMap = Record<string, string>; // className -> teacherName or teacherId

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  phone?: string;
  email?: string;
  kodeUnik?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category?: 'Umat' | 'Umum' | 'Lokal' | 'Kedinasan';
}

export interface Student {
  id: string;
  className: string;
  rollNo: number;
  name: string;
  gender?: 'L' | 'P';
  nisn?: string;
  nis?: string;
  kodeUnik?: string;
  parentPhone?: string;

  // Buku Induk - Identitas Pribadi Siswa
  namaPanggilan?: string;
  nik?: string;
  noKk?: string;
  tempatLahir?: string;
  tanggalLahir?: string; // YYYY-MM-DD
  agama?: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu' | string;
  kewarganegaraan?: 'WNI' | 'WNA' | string;
  anakKe?: number;
  jumlahSaudara?: number;
  statusKeluarga?: 'Anak Kandung' | 'Anak Tiri' | 'Anak Angkat' | 'Yatim' | 'Piatu' | 'Yatim Piatu' | string;
  bahasaSehariHari?: string;
  fotoUrl?: string;

  // Buku Induk - Alamat & Tempat Tinggal
  alamat?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  kodePos?: string;
  tinggalBersama?: 'Orang Tua' | 'Wali' | 'Pesantren / Asrama' | 'Kost' | 'Kerabat' | string;
  jarakSekolah?: string;
  transportasi?: string;
  phone?: string;

  // Buku Induk - Kondisi Jasmani & Kesehatan
  golonganDarah?: 'A' | 'B' | 'AB' | 'O' | 'Belum Tahu' | string;
  penyakitBerat?: string;
  kelainanJasmani?: string;
  tinggiBadan?: number;
  beratBadan?: number;

  // Buku Induk - Riwayat Pendidikan Sebelumnya
  asalSekolah?: string;
  nomorIjazah?: string;
  nomorSkhun?: string;
  nomorPesertaUjianAsal?: string;
  statusMasuk?: 'Siswa Baru' | 'Pindahan (Mutasi Masuk)' | string;
  asalPindahan?: string;
  alasanPindah?: string;

  // Buku Induk - Orang Tua Kandung (Ayah)
  namaAyah?: string;
  nikAyah?: string;
  tempatTanggalLahirAyah?: string;
  statusAyah?: 'Masih Hidup' | 'Meninggal Dunia' | string;
  pendidikanAyah?: string;
  pekerjaanAyah?: string;
  penghasilanAyah?: string;
  hpAyah?: string;

  // Buku Induk - Orang Tua Kandung (Ibu)
  namaIbu?: string;
  nikIbu?: string;
  tempatTanggalLahirIbu?: string;
  statusIbu?: 'Masih Hidup' | 'Meninggal Dunia' | string;
  pendidikanIbu?: string;
  pekerjaanIbu?: string;
  penghasilanIbu?: string;
  hpIbu?: string;

  // Buku Induk - Wali Siswa
  namaWali?: string;
  nikWali?: string;
  hubunganWali?: string;
  pendidikanWali?: string;
  pekerjaanWali?: string;
  penghasilanWali?: string;
  hpWali?: string;
  alamatWali?: string;

  // Buku Induk - Bantuan Sosial & Minat
  kategoriSosial?: 'Reguler' | 'Duafa' | 'Yatim' | 'Beasiswa Prestasi' | string;
  noKip?: string;
  noKks?: string;
  noPkh?: string;
  kebutuhanKhusus?: string;
  disabilitas?: string;
  umur?: string;
  hobi?: string;
  citaCita?: string;

  // Buku Induk - Registrasi Administrasi Madrasah
  tanggalMasuk?: string;
  diterimaDiKelas?: string;
  statusSiswa?: 'Aktif' | 'Lulus' | 'Mutasi Keluar' | 'Mengundurkan Diri' | string;
  catatanKhusus?: string;
}

export interface AttendanceEntry {
  studentId: string;
  studentName?: string;
  rollNo?: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  teacherName: string;
  teacherNip: string;
  subjectId: string;
  subjectName: string;
  className: string;
  meetingNumber: number; // Pertemuan ke-
  periodNumber: string; // Jam ke- (e.g. "1-2" or "3-4")
  topic: string; // Materi / Topik Pembelajaran
  competency?: string; // Capaian / Tujuan Pembelajaran
  teachingNotes?: string; // Catatan kejadian di kelas / Refleksi
  entries: AttendanceEntry[];
  createdAt: string;
  updatedAt: string;
  isSyncedToCloud?: boolean; // Status apakah sudah tersimpan ke Database Cloud Firestore
  syncedAt?: string; // Waktu terakhir tersinkronisasi ke cloud
}

export interface OfflineAttendanceQueueItem {
  id: string;
  session: AttendanceSession;
  violationsToSave?: StudentViolation[];
  violationIdsToDelete?: string[];
  queuedAt: string;
  retryCount?: number;
  lastError?: string;
  schoolId?: SchoolId;
}

export interface StudentGrade {
  studentId: string;
  formatif1?: number;
  formatif2?: number;
  formatif3?: number;
  formatif4?: number;
  formatif5?: number;
  formatif6?: number;
  formatif7?: number;
  formatif8?: number;
  formatif9?: number;
  formatif10?: number;
  formatifAvg?: number;

  sumatif1?: number;
  sumatif2?: number;
  sumatif3?: number;
  sumatif4?: number;
  sumatif5?: number;
  sumatif6?: number;
  sumatif7?: number;
  sumatif8?: number;
  sumatif9?: number;
  sumatif10?: number;
  sumatifTPAvg?: number;

  sts?: number; // Sumatif Tengah Semester
  sas?: number; // Sumatif Akhir Semester
  finalGrade?: number;
  predicate?: 'A' | 'B' | 'C' | 'D';
  notes?: string;
  [key: string]: any;
}

export interface GradeRecord {
  id: string;
  className: string;
  subjectId: string;
  subjectName: string;
  semester: 'Ganjil' | 'Genap';
  academicYear: string; // e.g. "2026/2027"
  grades: StudentGrade[];
  updatedAt: string;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  subjectId: string;
  subjectName: string;
  className: string;
  topic: string;
  timeAllocation: string;
  learningObjectives: string[]; // Tujuan Pembelajaran (TP)
  activities: {
    pendahuluan: string;
    inti: string;
    penutup: string;
  };
  assessment: string;
  mediaAndTools: string;
  createdAt: string;
}

export interface StudentViolation {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  violationType: string;
  category: 'Ringan' | 'Sedang' | 'Berat' | 'Apresiasi';
  points: number;
  reporterName: string; // BK / BP / Wakasek Kesiswaan / Guru
  description: string;
  followUpNote?: string;
  status: 'Baru' | 'Proses Bimbingan' | 'Panggilan Orang Tua' | 'Telah Ditangani';
  handledByWaliKelas?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentCategory = 
  | 'SPP' 
  | 'GEDUNG' 
  | 'SERAGAM' 
  | 'BUKU' 
  | 'PTS'
  | 'SAS'
  | 'DAT'
  | 'UJIAN' 
  | 'KEGIATAN' 
  | 'LAINNYA';

export interface PaymentTransaction {
  id: string;
  invoiceNumber: string; // e.g. "KW/2026/08/001"
  studentId: string;
  studentName: string;
  className: string;
  nisn?: string;
  nis?: string;
  parentPhone?: string;
  
  category: PaymentCategory;
  categoryLabel: string; // e.g. "SPP Bulan Agustus 2026", "Infaq Gedung", etc.
  month?: string; // e.g. "Agustus 2026"
  academicYear?: string;
  
  amount: number; // Rupiah
  totalBillAmount?: number;
  paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS';
  paymentDate: string; // YYYY-MM-DD
  
  status: 'Lunas' | 'Sebagian' | 'Dibatalkan';
  receivedBy: string; // Nama Bendahara penerima
  notes?: string;

  // Inventory Integration (Otomatis Potong Stok)
  inventoryItemIds?: string[];
  inventoryItemsPurchased?: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    variantType?: string;
    size?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  inventoryDetails?: string;

  createdAt: string;
  updatedAt?: string;
}

export type InventoryCategory = 'SERAGAM' | 'LKS' | 'ATRIBUT';

export type UniformType = 
  | 'Baju Olahraga'
  | 'Baju Kotak'
  | 'Rok Kotak'
  | 'Almamater'
  | 'Baju Jurusan'
  | 'Baju Khas'
  | 'Baju Batik'
  | 'Baju Muslim'
  | 'Lainnya';

export type ItemSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | 'All Size' | 'Standar';

export interface InventoryItem {
  id: string;
  itemCode: string; // e.g. "SRG-OLR-01", "LKS-VII-01", "ATB-DSI-01"
  category: InventoryCategory;
  name: string; // e.g. "Baju Olahraga", "Baju Kotak", "LKS Kelas VII", "Topi Sekolah"
  variantType?: UniformType | string; // e.g. 'Baju Olahraga'
  size?: ItemSize | string; // 'S', 'M', 'L', 'XL', 'All Size'
  gradeLevel?: 'VII' | 'VIII' | 'IX' | 'SEMUA' | string; // e.g. Kelas VII
  unitPrice: number; // Harga satuan (Rp)
  currentStock: number; // Stok saat ini
  minStockAlert: number; // Peringatan stok minimum (default 5)
  totalSold: number; // Total item terjual / terdistribusi
  totalRestocked: number; // Total stok masuk
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryMovementLog {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  variantType?: string;
  size?: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'; // IN = Restock, OUT = Terjual, ADJUSTMENT = Penyesuaian
  quantity: number; // Jumlah unit
  previousStock: number;
  newStock: number;
  unitPrice: number;
  totalPrice: number;
  studentId?: string;
  studentName?: string;
  studentClass?: string;
  invoiceNumber?: string; // Terhubung ke Kwitansi Pembayaran
  paymentId?: string;
  treasurerName: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface CashDepositTransaction {
  id: string;
  depositNumber: string; // e.g. "STR/2026/08/001"
  fromTreasurerId: string; // 'b1', 'b2', 'b3', 'b4', 'b5'
  fromTreasurerName: string;
  fromTreasurerRole: string; // e.g. "Bendahara 1", "Bendahara 2"
  toTreasurerId: string; // 'bu'
  toTreasurerName: string;
  toTreasurerRole: string; // "Bendahara Utama"
  amount: number; // Nominal Rupiah yang disetor
  depositDate: string; // YYYY-MM-DD
  posCategory?: string; // e.g. 'SEMUA', 'SPP', 'STS', 'SAS', 'GEDUNG', 'SERAGAM', 'BUKU', 'DAT', 'KEGIATAN', 'LAINNYA'
  posCategoryLabel?: string; // e.g. "Semua Pos Kasir", "SPP Bulanan", "Infaq Gedung", etc.
  notes?: string; // e.g. "Setoran penerimaan kas SPP & Gedung minggu ke-2"
  receiptNumber?: string;
  status: 'Diterima' | 'Draf';
  createdAt: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'Operasional Madrasah'
  | 'Belanja ATK & Sarana'
  | 'Honor & Kegiatan Guru'
  | 'Kegiatan Siswa & Lomba'
  | 'Perawatan Gedung & Fasilitas'
  | 'Listrik, Air & Internet'
  | 'Konsumsi & Rapat'
  | 'Lain-lain';

export interface TreasurerExpenseTransaction {
  id: string;
  expenseNumber: string; // e.g. "BKK/2026/08/001" (Bukti Kas Keluar)
  treasurerId: string; // 'bu', 'b1', 'b2', 'b3', 'b4', 'b5'
  treasurerName: string;
  treasurerRole: string; // e.g. "Bendahara Utama", "Bendahara 1"
  category: ExpenseCategory | string;
  sourcePos?: string; // e.g. 'KAS_UMUM', 'SPP', 'STS', 'SAS', 'GEDUNG', 'SERAGAM', 'BUKU', 'DAT', 'KEGIATAN', 'LAINNYA'
  sourcePosLabel?: string; // e.g. "Kas Umum / Operasional Bebas", "Pos SPP Bulanan", etc.
  title: string; // Uraian / Keperluan pengeluaran
  recipientName?: string; // Penerima dana / Toko / Vendor
  amount: number; // Nominal Rupiah pengeluaran
  expenseDate: string; // YYYY-MM-DD
  paymentMethod: 'Tunai' | 'Transfer Bank';
  notes?: string;
  receiptNumber?: string; // No. Nota/Kwitansi Toko
  createdAt: string;
  updatedAt?: string;
}

export const POS_PEMASUKAN_OPTIONS: Array<{ key: string; name: string; shortLabel: string; codeBadge: string }> = [
  { key: 'SEMUA', name: 'Semua Pos (Konsolidasi)', shortLabel: 'Semua Pos', codeBadge: 'POS-ALL' },
  { key: 'SPP', name: 'SPP Bulanan', shortLabel: 'SPP', codeBadge: 'POS-01' },
  { key: 'STS', name: 'STS / Ujian PTS', shortLabel: 'STS / PTS', codeBadge: 'POS-02' },
  { key: 'SAS', name: 'SAS / Ujian PAS', shortLabel: 'SAS / PAS', codeBadge: 'POS-03' },
  { key: 'GEDUNG', name: 'Infaq Gedung / DSP', shortLabel: 'Gedung', codeBadge: 'POS-04' },
  { key: 'SERAGAM', name: 'Uang Seragam & Atribut', shortLabel: 'Seragam', codeBadge: 'POS-05' },
  { key: 'BUKU', name: 'Buku & Modul LKS', shortLabel: 'Buku & LKS', codeBadge: 'POS-06' },
  { key: 'DAT', name: 'Dana Akhir Tahun (DAT)', shortLabel: 'DAT / Ujian', codeBadge: 'POS-07' },
  { key: 'KEGIATAN', name: 'Kegiatan Siswa & Ekskul', shortLabel: 'Kegiatan', codeBadge: 'POS-08' },
  { key: 'LAINNYA', name: 'Pos Lainnya / Administrasi', shortLabel: 'Lainnya', codeBadge: 'POS-09' }
];

export const SOURCE_POS_EXPENSE_OPTIONS: Array<{ key: string; name: string; description: string }> = [
  { key: 'KAS_UMUM', name: 'Kas Umum / Operasional Bebas', description: 'Dana kas umum operasional harian madrasah' },
  { key: 'SPP', name: 'Pos SPP Bulanan', description: 'Dana dari pos iuran pembinaan pendidikan SPP' },
  { key: 'STS', name: 'Pos STS / Ujian PTS', description: 'Dana dari pos pelaksanaan STS / PTS' },
  { key: 'SAS', name: 'Pos SAS / Ujian PAS', description: 'Dana dari pos pelaksanaan SAS / PAS' },
  { key: 'GEDUNG', name: 'Pos Infaq Gedung / DSP', description: 'Dana dari pos sarana prasarana / pembangunan' },
  { key: 'SERAGAM', name: 'Pos Seragam & Atribut', description: 'Dana dari pos pengadaan seragam & atribut' },
  { key: 'BUKU', name: 'Pos Buku & Modul LKS', description: 'Dana dari pos pengadaan buku paket & LKS' },
  { key: 'DAT', name: 'Pos Dana Akhir Tahun (DAT)', description: 'Dana dari pos pelepasan & akhir tahun' },
  { key: 'KEGIATAN', name: 'Pos Kegiatan & Ekskul', description: 'Dana dari pos even kesiswaan & kepramukaan' },
  { key: 'LAINNYA', name: 'Pos Lainnya / Bebas', description: 'Dana dari pos penerimaan lainnya' }
];

export interface FeeTariffSettings {
  sppMonthly: number;
  sppMonthlyByGrade?: {
    VII?: number;
    VIII?: number;
    IX?: number;
    X?: number;
    XI?: number;
    XII?: number;
    [gradeKey: string]: number | undefined;
  };
  uangGedung: number;
  uangSeragam: number;
  uangBuku: number;
  biayaPTS: number; // Penilaian Tengah Semester
  biayaSAS: number; // Sumatif Akhir Semester
  biayaDAT: number; // Dana Akhir Tahun
  biayaUjian?: number; // Fallback / legacy support
  bendaharaUtamaKodeUnik?: string; // Kode Akses Bendahara Utama
  bendaharaKodeUnik: string; // Kode Akses Bendahara 1
  bendahara2KodeUnik?: string; // Kode Akses Bendahara 2
  bendahara3KodeUnik?: string; // Kode Akses Bendahara 3
  bendahara4KodeUnik?: string; // Kode Akses Bendahara 4
  bendahara5KodeUnik?: string; // Kode Akses Bendahara 5
}

export interface CustomBillItem {
  id: string;
  title: string;
  amount: number;
  category?: PaymentCategory | string;
  targetClass?: string; // 'ALL' or specific class e.g. 'VII A', 'IX B'
  targetStudentIds?: string[]; // optional specific students
  dueDate?: string;
  description?: string;
  createdAt?: string;
}

export interface StudentBillOverride {
  studentId: string;

  // 1. SPP Bulanan
  sppExempt?: boolean; // Bebas SPP (Beasiswa 100%)
  sppDiscountPercent?: number; // Diskon % SPP
  sppDiscountFixed?: number; // Diskon tetap Rp SPP

  // 2. Infaq Gedung / Pembangunan
  gedungExempt?: boolean; // Bebas Gedung 100%
  gedungDiscountPercent?: number; // Diskon % Gedung
  gedungDiscountFixed?: number; // Potongan tetap Rp Gedung
  gedungCustomAmount?: number; // Custom nominal

  // 3. Uang Seragam & Atribut
  seragamExempt?: boolean; // Bebas Seragam 100%
  seragamDiscountPercent?: number; // Diskon % Seragam
  seragamDiscountFixed?: number; // Potongan tetap Rp Seragam
  seragamCustomAmount?: number; // Custom nominal

  // 4. Buku / Modul / LKS
  bukuExempt?: boolean; // Bebas Buku 100%
  bukuDiscountPercent?: number; // Diskon % Buku
  bukuDiscountFixed?: number; // Potongan tetap Rp Buku
  bukuCustomAmount?: number; // Custom nominal

  // 5. Biaya PTS (Penilaian Tengah Semester)
  ptsExempt?: boolean; // Bebas PTS 100%
  ptsDiscountPercent?: number; // Diskon % PTS
  ptsDiscountFixed?: number; // Potongan tetap Rp PTS
  ptsCustomAmount?: number; // Custom nominal

  // 6. Biaya SAS (Sumatif Akhir Semester)
  sasExempt?: boolean; // Bebas SAS 100%
  sasDiscountPercent?: number; // Diskon % SAS
  sasDiscountFixed?: number; // Potongan tetap Rp SAS
  sasCustomAmount?: number; // Custom nominal

  // 7. Biaya DAT (Dana Akhir Tahun)
  datExempt?: boolean; // Bebas DAT 100%
  datDiscountPercent?: number; // Diskon % DAT
  datDiscountFixed?: number; // Potongan tetap Rp DAT
  datCustomAmount?: number; // Custom nominal

  customNote?: string;
  individualBills?: Array<{
    id: string;
    title: string;
    amount: number;
    description?: string;
  }>;
}

export interface StandardBillItem {
  id: string; // e.g. 'spp', 'gedung', 'seragam', 'buku', 'pts', 'sas', 'dat', or 'std-xxx'
  key?: string; // Built-in key or custom identifier
  name: string; // e.g. 'SPP Bulanan', 'Infaq Gedung / Pembangunan', 'Biaya Praktikum Komputer', etc.
  category: PaymentCategory | string;
  defaultAmount: number;
  frequency?: 'Bulanan' | 'Per Semester' | 'Tahunan / Sekali Bayar' | 'Kondisional' | string;
  targetGrades?: ('VII' | 'VIII' | 'IX' | 'SEMUA' | string)[]; // Tingkat kelas yang diwajibkan: VII, VIII, IX, atau SEMUA
  description?: string;
  isActive: boolean; // whether enabled as active obligation
  isBuiltIn?: boolean; // true for standard 7 built-in items
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentBillSettings {
  // Flag which categories count as mandatory obligations
  activeObligations: {
    spp: boolean;
    gedung: boolean;
    seragam: boolean;
    buku: boolean;
    pts: boolean;
    sas: boolean;
    dat: boolean;
    [customKey: string]: boolean;
  };
  // Dynamic list of standard billing items
  standardBillingItems?: StandardBillItem[];
  // SPP months billed for current academic year (default 12 months)
  sppMonthsBilled: string[]; // e.g. ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']
  // Custom extra bills created by school/bendahara
  customBills: CustomBillItem[];
  // Per student individual overrides / exemptions
  studentOverrides: Record<string, StudentBillOverride>;
  // Bank Account & Payment Instructions for Parents
  paymentAccountInfo?: {
    bankName?: string; // e.g. "Bank Syariah Indonesia (BSI)"
    accountNumber?: string; // e.g. "7123456789"
    accountHolder?: string; // e.g. "Madrasah"
    qrisImageUrl?: string;
    paymentInstructions?: string;
    contactPersonPhone?: string;
  };
  lastUpdated?: string;
}

export interface StudentArrearsItem {
  id: string;
  category: PaymentCategory | string;
  title: string;
  description?: string;
  billAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isPaid: boolean;
  statusLabel: 'Lunas' | 'Sebagian' | 'Belum Dibayar' | 'Bebas Biaya';
  details?: string; // e.g. "Bulan: Juli, Agustus (Lunas), Sep s/d Jun (Belum)"
  paidMonths?: string[];
  unpaidMonths?: string[];
}

export interface StudentArrearsSummary {
  student: Student;
  totalBill: number;
  totalPaid: number;
  totalRemaining: number;
  isAllPaid: boolean;
  items: StudentArrearsItem[];
  sppPaidMonthsCount: number;
  sppTotalMonthsCount: number;
  sppPaidMonths?: string[];
  sppUnpaidMonths?: string[];
  lastPaymentDate?: string;
}

export interface AdminSettings {
  adminPasscode: string; // Master PIN/Password for Super Admin
  kurikulumKodeUnik?: string; // Kode Akses Login Portal Kurikulum & Ujian (dikelola khusus oleh Super Admin)
  lastUpdated?: string;
}

export type AnnouncementType = 'info' | 'warning' | 'important' | 'urgent';

export type AnnouncementTarget = 'all' | 'guru' | 'wali_kelas' | 'orang_tua' | 'siswa_khusus';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  targetAudience?: AnnouncementTarget | string;
  targetStudentId?: string;
  targetStudentCode?: string; // Kode Unik Siswa
  targetStudentName?: string;
  targetClass?: string;
  createdAt: string; // ISO date
  updatedAt?: string;
  pushedAt?: string; // Timestamp of latest remote push broadcast
  authorName?: string;
  active: boolean;
  expiresAt?: string;
}

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface TeachingSchedule {
  id: string;
  day: DayOfWeek;
  periodNumber: string; // e.g. "1 - 2 (07.15 - 08.25 WIB)"
  periodStartHour?: number;
  periodEndHour?: number;
  teacherId: string;
  teacherName: string;
  teacherNip: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  className: string; // e.g. "VII A", "VIII B", "IX A", etc.
  academicYear: string; // e.g. "2026/2027"
  semester: 'Semester Ganjil' | 'Semester Genap' | 'Ganjil' | 'Genap' | string;
  room?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LetterTypeCategory = 
  | 'Surat Dinas / Biasa'
  | 'Surat Keterangan Aktif Siswa'
  | 'Surat Keterangan Pindah / Mutasi'
  | 'Surat Tugas Guru / Karyawan'
  | 'Surat Undangan Wali Murid'
  | 'Surat Undangan Rapat Dinas'
  | 'Surat Pemberitahuan Ulangan'
  | 'Surat Pemberitahuan Ujian'
  | 'Surat Rekomendasi'
  | 'Surat Edaran / Pemberitahuan'
  | 'Surat Keputusan (SK)'
  | 'Surat Panggilan Orang Tua'
  | 'Surat Permohonan / Kerjasama'
  | 'Lainnya';

export type LetterStatus = 'Draf' | 'Menunggu TTD' | 'Terbit' | 'Diarsipkan';

export type LetterIncomingNature = 'Biasa' | 'Penting' | 'Rahasia' | 'Segera' | 'Sangat Segera';

export type LetterDispositionStatus = 'Belum Disposisi' | 'Proses Tindak Lanjut' | 'Selesai' | 'Diarsipkan';

export interface KlasifikasiSuratItem {
  kode: string;
  nama: string;
  keterangan?: string;
  kategori: 'Kurikulum & Pengajaran' | 'Kesiswaan' | 'Kepegawaian' | 'Keuangan' | 'Sarana Prasarana' | 'Humas & Kerjasama' | 'Umum & Tata Usaha';
}

export interface RincianBiayaSuratItem {
  id?: string;
  namaBiaya: string;
  nominal: number;
  keterangan?: string;
  kategoriTarget?: 'Semua' | 'Reguler' | 'Duafa' | 'Yatim' | string; // Target kategori siswa
}

export interface SuratKeluar {
  id: string;
  nomorSurat: string;
  kodeKlasifikasi: string; // e.g. "PP.00.5", "KP.01", "KS.02", "UND.01"
  kategoriSurat: LetterTypeCategory | string;
  tanggalSurat: string; // YYYY-MM-DD
  lampiran: string; // e.g. "-" or "1 (satu) Berkas"
  perihal: string; // Perihal / Hal Surat
  tujuanSurat: string; // Kepada Yth. ...
  tujuanAlamat?: string; // di Tempat / Kota
  
  // Isi Surat
  salamPembuka?: string; // e.g. "Assalamu'alaikum Wr. Wb." atau "Dengan hormat,"
  isiSurat: string; // Isi / pokok surat dalam format paragraf / teks
  salamPenutup?: string; // e.g. "Wassalamu'alaikum Wr. Wb."

  // Data Kegiatan (Opsional jika surat berupa undangan/tugas)
  hariTanggalKegiatan?: string;
  waktuKegiatan?: string;
  tempatKegiatan?: string;
  agendaKegiatan?: string;

  // Data Khusus Surat Pemberitahuan Ujian & Pembiayaan
  namaUjian?: string; // e.g. "Penilaian Akhir Semester (PAS) Ganjil TP 2026/2027"
  jadwalPelaksanaanUjian?: string; // e.g. "21 - 26 September 2026"
  batasWaktuPembayaran?: string; // e.g. "18 September 2026"
  tempatMetodePembayaran?: string; // e.g. "Loket Tata Usaha / Bendahara Madrasah"
  catatanSyaratUjian?: string; // e.g. "Kartu Peserta Ujian dapat diambil setelah melunasi seluruh kewajiban administrasi"
  rincianBiaya?: RincianBiayaSuratItem[]; // Rincian tunggakan SPP, ekskul, ujian, dll.
  modeHitungBiaya?: 'kategori_tarif' | 'akumulasi_semua'; // Mode perhitungan total: per kategori vs total semua pos
  warnaTeks?: 'hitam' | 'berwarna'; // Pilihan warna font isi surat: Hitam Monokrom vs Berwarna (Kop surat tetap kunci)

  // Penandatangan
  penandatanganNama: string;
  penandatanganNip: string;
  penandatanganJabatan: string; // e.g. "Kepala Madrasah", "Kepala Tata Usaha", "Waka Kesiswaan"

  tembusan?: string[]; // Daftar tembusan
  status: LetterStatus;
  
  // Relasi Data (Opsional jika surat ditujukan / terkait siswa atau guru tertentu)
  studentId?: string;
  studentName?: string;
  studentClass?: string;
  studentNisn?: string;
  studentNis?: string;
  studentBirthInfo?: string; // Tempat, Tanggal Lahir
  parentName?: string;
  teacherId?: string;
  teacherName?: string;
  teacherNip?: string;
  
  catatanInternal?: string;
  createdAt: string;
  updatedAt?: string;
  schoolId?: SchoolId;
}

export interface SuratMasuk {
  id: string;
  nomorAgenda: string; // e.g. "AG-2026-001"
  nomorSuratAsal: string; // Nomor dari instansi pengirim
  pengirim: string; // Nama instansi / pengirim (e.g. "Kemenag Kab. Gresik", "Dinas Pendidikan")
  tanggalSurat: string; // Tanggal yang tertera di surat pengirim
  tanggalDiterima: string; // Tanggal surat diterima oleh TU
  perihal: string; // Perihal / Ringkasan isi surat
  sifat: LetterIncomingNature;
  lampiran: string; // e.g. "1 Berkas", "-"
  kategori: string; // e.g. "Kedinasan / Kemenag", "Undangan", "Pemberitahuan", "Edaran", "Permohonan", "Lainnya"
  
  // Lembar Disposisi Kepala Madrasah / Pimpinan
  disposisiTujuan?: string[]; // ['Kepala Madrasah', 'Waka Kurikulum', 'Waka Kesiswaan', 'Kepala TU', 'Bendahara', ...]
  disposisiInstruksi?: string[]; // ['Tindak Lanjuti Segera', 'Pelajari & Laporkan', 'Hadiri / Wakili', 'Siapkan Bahan/Berkas', 'Arsipkan', 'Balas Surat', 'Koordinasikan']
  disposisiCatatan?: string; // Catatan tangan / instruksi khusus dari Kepala Madrasah
  disposisiTanggal?: string; // Tanggal disposisi dibuat
  disposisiStatus: LetterDispositionStatus;
  
  lokasiArsip?: string; // e.g. "Ordner A-1 (Surat Masuk Kemenag)", "Lemari TU Rak 1"
  fileUrl?: string; // Tautan scan dokumen / catatan lampiran
  createdAt: string;
  updatedAt?: string;
  schoolId?: SchoolId;
}

export type ActiveTab = 
  | 'absensi' 
  | 'jadwal'
  | 'jurnal' 
  | 'matrix' 
  | 'walikelas' 
  | 'kurikulum'
  | 'penilaian' 
  | 'modul' 
  | 'rekap' 
  | 'tatausaha'
  | 'identitas'
  | 'datamaster' 
  | 'ai' 
  | 'kesiswaan' 
  | 'pembayaran'
  | 'admin';

export type ExamType = 
  | 'STS' // Sumatif Tengah Semester (Kurikulum Merdeka)
  | 'SAS' // Sumatif Akhir Semester (Kurikulum Merdeka)
  | 'PTS' // Penilaian Tengah Semester (K13)
  | 'PAS' // Penilaian Akhir Semester (K13)
  | 'PAT' // Penilaian Akhir Tahun (K13)
  | 'AM'  // Asesmen Madrasah
  | 'US'  // Ujian Sekolah
  | 'SIMULASI' // Simulasi / Try Out
  | 'LAINNYA';

export interface ExamEvent {
  id: string;
  title: string; // e.g. "Sumatif Tengah Semester (STS) Ganjil TP 2026/2027"
  type: ExamType;
  academicYear: string; // e.g. "2026/2027"
  semester: 'Semester Ganjil' | 'Semester Genap' | 'Ganjil' | 'Genap' | string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetClasses: string[]; // ['VII A', 'VII B', ...]
  status: 'Persiapan' | 'Berlangsung' | 'Selesai' | 'Draf';
  
  // Susunan Panitia Ujian
  penanggungJawab?: string; // Kepala Madrasah / Sekolah
  ketuaPanitia: string;
  sekretaris: string;
  bendaharaPanitia: string;
  seksiNaskah?: string;
  seksiRuang?: string;
  seksiKonsumsi?: string;
  
  nomorSKPanitia?: string; // e.g. "421.2/089/MTs-MI/SK-STS/IX/2026"
  tanggalSK?: string; // YYYY-MM-DD
  biayaUjianDefault?: number; // Biaya pendaftaran / administrasi ujian
  catatan?: string;
  schoolId?: SchoolId;
  createdAt: string;
  updatedAt?: string;
}

export interface ExamRoomProctor {
  dayDate: string; // e.g. "Senin, 21 September 2026"
  sessionSlot: string; // e.g. "Sesi 1 (07.30 - 09.00 WIB)"
  subjectName: string;
  teacherId?: string;
  teacherName: string;
  teacherNip?: string;
}

export interface ExamRoom {
  id: string;
  examId: string;
  roomNumber: number; // 1, 2, 3...
  roomName: string; // e.g. "Ruang 01 (Kelas VII A)"
  buildingOrLocation?: string; // e.g. "Lantai 1 Gedung A"
  capacity: number; // e.g. 20 / 24
  assignedStudentIds: string[]; // List of Student IDs in this room
  studentSeatNumbers?: Record<string, number>; // studentId -> seatNumber (1..capacity)
  proctorAssignments?: ExamRoomProctor[];
  notes?: string;
  schoolId?: SchoolId;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamScheduleItem {
  id: string;
  examId: string;
  dayName: string; // e.g. "Senin"
  dateFormatted: string; // e.g. "21 September 2026"
  date: string; // YYYY-MM-DD
  sessionNumber: number; // 1, 2, 3
  timeSlot: string; // e.g. "07.30 - 09.00 WIB"
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  targetGrades: string[]; // ['VII', 'VIII', 'IX'] or specific classes
  durationMinutes?: number; // default 90
  proctorsByRoom?: Record<string, { teacherId?: string; teacherName: string; teacherNip?: string }>; // roomId -> proctor
  notes?: string;
  schoolId?: SchoolId;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumSettings {
  curriculumType: 'Kurikulum Merdeka' | 'Kurikulum 2013' | 'Kombinasi';
  wakaKurikulumName?: string;
  wakaKurikulumNip?: string;
  curriculumCode?: string; // Code for login, default "kurikulum"
  defaultRoomCapacity?: number; // default 20
  kktpStandard?: Record<string, number>; // subjectCode/subjectId -> KKTP/KKM (e.g. 75)
  lastUpdated?: string;
}

export type SchoolId = 'mts_manbaul_islam';

export interface SchoolConfig {
  id: SchoolId;
  name: string;
  shortName: string;
  fullName: string;
  level: 'MTs';
  foundation: string;
  city: string;
  address?: string;
  tagline?: string;
  classes: string[];
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  headerGradient: string;
}

export interface DatabaseBackupCounts {
  students: number;
  teachers: number;
  subjects: number;
  sessions: number;
  grades: number;
  lessonPlans: number;
  violations: number;
  payments: number;
  cashDeposits: number;
  treasurerExpenses: number;
  schedules: number;
  announcements: number;
  suratKeluar?: number;
  suratMasuk?: number;
  examEvents?: number;
  examRooms?: number;
  examSchedules?: number;
}

export interface DatabaseBackupMetadata {
  version: string;
  timestamp: string; // ISO format
  appVersion?: string;
  schoolId: SchoolId;
  schoolName: string;
  academicYear?: string;
  semester?: string;
  generatedBy: string;
  type: 'full' | 'finance' | 'academic' | 'master';
  counts: DatabaseBackupCounts;
}

export interface DatabaseBackupData {
  metadata: DatabaseBackupMetadata;
  students?: Student[];
  teachers?: Teacher[];
  subjects?: Subject[];
  schoolOfficials?: SchoolOfficials;
  classWaliKelas?: ClassWaliKelasMap;
  sessions?: AttendanceSession[];
  grades?: GradeRecord[];
  lessonPlans?: LessonPlan[];
  violations?: StudentViolation[];
  payments?: PaymentTransaction[];
  cashDeposits?: CashDepositTransaction[];
  treasurerExpenses?: TreasurerExpenseTransaction[];
  feeTariffs?: FeeTariffSettings;
  studentBillSettings?: StudentBillSettings;
  adminSettings?: AdminSettings;
  schedules?: TeachingSchedule[];
  announcements?: Announcement[];
  suratKeluar?: SuratKeluar[];
  suratMasuk?: SuratMasuk[];
  examEvents?: ExamEvent[];
  examRooms?: ExamRoom[];
  examSchedules?: ExamScheduleItem[];
  curriculumSettings?: CurriculumSettings;
  academicSettings?: {
    academicYear: string;
    semester: string;
  };
}


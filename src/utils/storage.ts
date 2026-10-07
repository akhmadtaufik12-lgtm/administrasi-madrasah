import { Teacher, Subject, Student, AttendanceSession, GradeRecord, LessonPlan, SchoolOfficials, ClassWaliKelasMap, StudentViolation, PaymentTransaction, FeeTariffSettings, AdminSettings, BendaharaPerson, StudentBillSettings, StandardBillItem, StudentArrearsSummary, StudentArrearsItem, CustomBillItem, StudentBillOverride, CashDepositTransaction, TreasurerExpenseTransaction, TeachingSchedule, DayOfWeek, Announcement, SchoolId, SchoolConfig, DatabaseBackupData, DatabaseBackupCounts, InventoryItem, InventoryMovementLog, InventoryCategory, UniformType, ItemSize, SuratKeluar, SuratMasuk, ExamEvent, ExamRoom, ExamScheduleItem, CurriculumSettings, OfflineAttendanceQueueItem } from '../types';
import { INITIAL_TEACHERS, INITIAL_SUBJECTS, INITIAL_STUDENTS, INITIAL_SCHEDULES, DAYS_OF_WEEK, STANDARD_SCHEDULE_PERIODS, CLASSES_LIST, INITIAL_INVENTORY_ITEMS } from '../data/initialData';
import { INITIAL_SURAT_KELUAR, INITIAL_SURAT_MASUK } from '../data/initialLettersData';
import { INITIAL_EXAM_EVENTS, INITIAL_EXAM_ROOMS, INITIAL_EXAM_SCHEDULES, DEFAULT_CURRICULUM_SETTINGS } from '../data/initialExamData';
import {
  SCHOOL_CONFIGS,
  ALL_SCHOOLS
} from '../data/schoolsData';

export {
  SCHOOL_CONFIGS,
  ALL_SCHOOLS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_SUBJECTS,
  INITIAL_SCHEDULES,
  INITIAL_EXAM_EVENTS,
  INITIAL_EXAM_ROOMS,
  INITIAL_EXAM_SCHEDULES,
  DEFAULT_CURRICULUM_SETTINGS
};

// ==========================================
// RESILIENT IN-MEMORY + STORAGE LAYER
// ==========================================
const memoryStorage = new Map<string, string>();

export function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sVal = sessionStorage.getItem(key);
      if (sVal !== null) return sVal;
    }
  } catch (_) {}
  return memoryStorage.get(key) || null;
}

export function pruneAndCleanLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToPurge: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Remove any firestore sequence number keys that cause QuotaExceededError
      if (k.startsWith('firestore_') || k.includes('sequence_number') || k.includes('firestore/')) {
        keysToPurge.push(k);
      }
      // Remove bulky backup snapshots from localStorage to keep storage lightweight
      if (k.startsWith('mts_db_snapshots_') || k.startsWith('mts_manbaul_snapshots_') || k === 'mts_manbaul_database_backups_v1') {
        keysToPurge.push(k);
      }
    }
    keysToPurge.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  } catch (_) {}
}

// Proactively run cleanup on startup
pruneAndCleanLocalStorage();

export function safeLocalStorageSet(key: string, value: string): void {
  // Always update memory storage as guarantee
  memoryStorage.set(key, value);

  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Storage quota notice for "${key}". Initiating auto-cleanup.`);
    try {
      // Free up heavy/regenerable snapshots & static data cache from localStorage
      const purgeableKeys = [
        'mts_manbaul_database_backups_v1',
        'mts_manbaul_students_v1',
        'mts_manbaul_attendance_export_cache',
        'mts_manbaul_snapshots_mts_manbaul_islam',
        'mts_db_snapshots_mts_manbaul_islam'
      ];
      for (const k of purgeableKeys) {
        if (k !== key) {
          try {
            localStorage.removeItem(k);
          } catch (_) {}
        }
      }
      // Also purge any firestore internal keys that may have accumulated
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('firestore_') || k.includes('sequence_number'))) {
          try { localStorage.removeItem(k); } catch (_) {}
        }
      }
      localStorage.setItem(key, value);
    } catch {
      try {
        if (window.sessionStorage) {
          sessionStorage.setItem(key, value);
        }
      } catch (_) {
        // memoryStorage already holds the state for the current session
      }
    }
  }
}

export function safeLocalStorageRemove(key: string): void {
  memoryStorage.delete(key);
  try {
    if (typeof window !== 'undefined') {
      if (window.localStorage) localStorage.removeItem(key);
      if (window.sessionStorage) sessionStorage.removeItem(key);
    }
  } catch (_) {}
}

export function getActiveSchoolId(): SchoolId {
  return 'mts_manbaul_islam';
}

export function setActiveSchoolId(schoolId: SchoolId): void {
  try {
    safeLocalStorageSet('app_active_school_id', schoolId);
  } catch (e) {
    console.error(e);
  }
}

export function getSchoolConfig(schoolId?: SchoolId): SchoolConfig {
  const id = schoolId || getActiveSchoolId();
  const base = SCHOOL_CONFIGS[id] || SCHOOL_CONFIGS.mts_manbaul_islam;
  try {
    const officials = getStoredSchoolOfficials(id);
    if (officials && officials.namaSekolah) {
      return {
        ...base,
        name: officials.namaSekolah,
        shortName: officials.namaSekolah,
        fullName: officials.namaSekolah,
        foundation: officials.namaYayasan || base.foundation,
        address: officials.alamatSekolah || base.address,
        city: officials.kotaSekolah || base.city,
        tagline: officials.tagline || base.tagline,
      };
    }
  } catch (_) {}
  return base;
}

export function getClassesForSchool(schoolId?: SchoolId): string[] {
  const id = schoolId || getActiveSchoolId();
  return SCHOOL_CONFIGS[id]?.classes || CLASSES_LIST;
}

export interface AcademicSettings {
  academicYear: string;
  semester: 'Semester Ganjil' | 'Semester Genap';
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminPasscode: 'akhmadtaufik84@',
  kurikulumKodeUnik: 'KURIKULUM2026',
  lastUpdated: new Date().toISOString()
};

export const DEFAULT_TREASURER_UTAMA: BendaharaPerson = {
  id: 'bu',
  name: 'Hj. Siti Mardhiyah, S.E., M.M.',
  nip: '197506122002122001',
  kodeUnik: 'BENDAHARAUTAMA',
  phone: '081198765432',
  roleTitle: 'Bendahara Utama',
  active: true
};

export const DEFAULT_TREASURERS: BendaharaPerson[] = [
  {
    id: 'b1',
    name: 'Siti Rahmawati, S.E.',
    nip: '85792',
    kodeUnik: 'BENDAHARA1',
    phone: '081234567890',
    roleTitle: 'Bendahara 1',
    active: true
  },
  {
    id: 'b2',
    name: 'Dewi Sutrawati, SE',
    nip: '85784',
    kodeUnik: 'BENDAHARA2',
    phone: '081398765432',
    roleTitle: 'Bendahara 2',
    active: true
  },
  {
    id: 'b3',
    name: 'Ahmad Fauzi, S.Pd',
    nip: '85785',
    kodeUnik: 'BENDAHARA3',
    phone: '081298761234',
    roleTitle: 'Bendahara 3',
    active: true
  },
  {
    id: 'b4',
    name: 'Nurul Hidayah, S.Kom',
    nip: '85786',
    kodeUnik: 'BENDAHARA4',
    phone: '081356781234',
    roleTitle: 'Bendahara 4',
    active: true
  },
  {
    id: 'b5',
    name: 'Hendra Kurniawan, S.Pd',
    nip: '85787',
    kodeUnik: 'BENDAHARA5',
    phone: '081267891234',
    roleTitle: 'Bendahara 5',
    active: true
  }
];

export const DEFAULT_FEE_TARIFFS: FeeTariffSettings = {
  sppMonthly: 150000,
  sppMonthlyByGrade: {
    'VII': 150000,
    'VIII': 150000,
    'IX': 150000
  },
  uangGedung: 1200000,
  uangSeragam: 650000,
  uangBuku: 400000,
  biayaPTS: 150000,
  biayaSAS: 200000,
  biayaDAT: 250000,
  biayaUjian: 200000,
  bendaharaUtamaKodeUnik: 'BENDAHARAUTAMA',
  bendaharaKodeUnik: 'BENDAHARA1',
  bendahara2KodeUnik: 'BENDAHARA2',
  bendahara3KodeUnik: 'BENDAHARA3',
  bendahara4KodeUnik: 'BENDAHARA4',
  bendahara5KodeUnik: 'BENDAHARA5'
};

export const DEFAULT_STANDARD_BILLING_ITEMS: StandardBillItem[] = [
  {
    id: 'spp',
    key: 'spp',
    name: 'SPP Bulanan',
    category: 'SPP',
    defaultAmount: 175000,
    frequency: 'Bulanan',
    targetGrades: ['SEMUA'],
    description: 'Tarif kewajiban iuran bulanan peserta didik',
    isActive: true,
    isBuiltIn: true
  },
  {
    id: 'gedung',
    key: 'gedung',
    name: 'Infaq Gedung / Pembangunan',
    category: 'GEDUNG',
    defaultAmount: 1500000,
    frequency: 'Tahunan / Sekali Bayar',
    targetGrades: ['SEMUA'],
    description: 'Infaq sarana, prasarana, dan pembangunan madrasah',
    isActive: false,
    isBuiltIn: true
  },
  {
    id: 'seragam',
    key: 'seragam',
    name: 'Uang Seragam & Atribut',
    category: 'SERAGAM',
    defaultAmount: 750000,
    frequency: 'Tahunan / Sekali Bayar',
    targetGrades: ['SEMUA'],
    description: 'Paket seragam batik, olahraga, identitas madrasah & atribut',
    isActive: false,
    isBuiltIn: true
  },
  {
    id: 'buku',
    key: 'buku',
    name: 'Uang Buku / LKS / Modul',
    category: 'BUKU',
    defaultAmount: 500000,
    frequency: 'Tahunan / Sekali Bayar',
    targetGrades: ['SEMUA'],
    description: 'Modul materi ajar & lembar kerja siswa satu tahun',
    isActive: false,
    isBuiltIn: true
  },
  {
    id: 'pts',
    key: 'pts',
    name: 'Biaya PTS (Tengah Semester)',
    category: 'PTS',
    defaultAmount: 175000,
    frequency: 'Per Semester',
    targetGrades: ['SEMUA'],
    description: 'Penilaian Tengah Semester & penyusunan naskah ujian',
    isActive: true,
    isBuiltIn: true
  },
  {
    id: 'sas',
    key: 'sas',
    name: 'Biaya SAS (Akhir Semester)',
    category: 'SAS',
    defaultAmount: 225000,
    frequency: 'Per Semester',
    targetGrades: ['SEMUA'],
    description: 'Sumatif Akhir Semester (SAS / PAS)',
    isActive: true,
    isBuiltIn: true
  },
  {
    id: 'dat',
    key: 'dat',
    name: 'Biaya DAT (Dana Akhir Tahun)',
    category: 'DAT',
    defaultAmount: 275000,
    frequency: 'Tahunan / Sekali Bayar',
    targetGrades: ['SEMUA'],
    description: 'Biaya evaluasi kenaikan kelas / kelulusan madrasah',
    isActive: false,
    isBuiltIn: true
  }
];

export const DEFAULT_STUDENT_BILL_SETTINGS: StudentBillSettings = {
  activeObligations: {
    spp: true,
    gedung: false,
    seragam: false,
    buku: false,
    pts: true,
    sas: true,
    dat: false
  },
  standardBillingItems: DEFAULT_STANDARD_BILLING_ITEMS,
  sppMonthsBilled: [
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
  ],
  customBills: [
    {
      id: 'cb-wisuda-9a',
      title: 'Pelepasan & Wisuda Siswa Kelas IX',
      amount: 350000,
      targetClass: 'IX A',
      description: 'Biaya seremonial pelepasan, medali kelulusan, map ijazah & kenang-kenangan',
      dueDate: '2027-05-15',
      createdAt: new Date().toISOString()
    },
    {
      id: 'cb-wisuda-9b',
      title: 'Pelepasan & Wisuda Siswa Kelas IX',
      amount: 350000,
      targetClass: 'IX B',
      description: 'Biaya seremonial pelepasan, medali kelulusan, map ijazah & kenang-kenangan',
      dueDate: '2027-05-15',
      createdAt: new Date().toISOString()
    }
  ],
  studentOverrides: {
    'stu-VIIA-1': {
      studentId: 'stu-VIIA-1',
      sppExempt: true,
      sppDiscountPercent: 0,
      sppDiscountFixed: 0,
      gedungExempt: true,
      seragamExempt: true,
      bukuExempt: true,
      ptsExempt: true,
      sasExempt: true,
      datExempt: true,
      customNote: 'Siswa Yatim Piatu & Dhuafa (SK Madrasah No. 01/SK-YTM/2026 - Bebas Biaya Penuh 100%)'
    },
    'stu-VIIIA-2': {
      studentId: 'stu-VIIIA-2',
      sppExempt: false,
      sppDiscountPercent: 50,
      sppDiscountFixed: 0,
      gedungExempt: false,
      seragamExempt: false,
      bukuExempt: false,
      ptsExempt: false,
      sasExempt: false,
      datExempt: false,
      customNote: 'Keringanan Dhuafa / Kurang Mampu (Potongan SPP 50%)'
    },
    'stu-IXA-4': {
      studentId: 'stu-IXA-4',
      sppExempt: true,
      sppDiscountPercent: 0,
      sppDiscountFixed: 0,
      gedungExempt: false,
      seragamExempt: false,
      bukuExempt: false,
      ptsExempt: false,
      sasExempt: false,
      datExempt: false,
      customNote: 'Anak Yatim - Keringanan SPP Bulanan 100%'
    }
  },
  paymentAccountInfo: {
    bankName: 'Bank Syariah Indonesia (BSI)',
    accountNumber: '7123456789',
    accountHolder: 'MTs MANBAUL ISLAM',
    qrisImageUrl: '',
    paymentInstructions: 'Transfer melalui BSI / ATM Bersama / Mobile Banking. Berita transfer: [Nama Siswa - Kelas - Pos Pembayaran]. Kirim bukti transfer ke kontak WhatsApp Bendahara.',
    contactPersonPhone: '081234567890'
  },
  lastUpdated: new Date().toISOString()
};

export const DEFAULT_SCHOOL_OFFICIALS: SchoolOfficials = {
  // Profil & Identitas Lembaga
  namaSekolah: 'Madrasah Tsanawiyah Manbaul Islam',
  namaYayasan: 'Yayasan Pendidikan Manbaul Islam',
  npsn: '20108921',
  nsm: '121231730005',
  akreditasi: 'A (Unggul)',
  izinOperasional: 'Kd.09.03/4/PP.00.5/123/2018',
  jenjang: 'MTs',
  statusSekolah: 'Swasta',
  tagline: 'Madrasah Hebat Bermartabat • Berakhlak Mulia & Berprestasi',
  logoUrl: '',

  // Alamat & Kontak Lembaga
  alamatSekolah: 'Jl. Sandang No. 34',
  rtRw: 'RT 004 / RW 011',
  kelurahan: 'Palmerah',
  kecamatan: 'Palmerah',
  kotaSekolah: 'Jakarta Barat',
  provinsi: 'DKI Jakarta',
  kodePos: '11480',
  teleponSekolah: '(021) 5321855',
  whatsappSekolah: '0812-3456-7890',
  emailSekolah: 'mtsmanbaulislam@gmail.com',
  website: 'https://mtsmanbaulislam.sch.id',

  // Pejabat & Pimpinan Lembaga
  kepalaSekolah: {
    name: 'Dra. Hj. Nurjanah, M.Pd',
    nip: '197208151998032001',
    phone: '081288991122',
    email: 'nurjanah@mtsmanbaulislam.sch.id'
  },
  kesiswaan: {
    name: 'M. Sholihin, SE',
    nip: '85780',
    phone: '081234567804',
    email: 'sholihin@mtsmanbaulislam.sch.id'
  },
  kurikulum: {
    name: 'Agustiani, S.Pd',
    nip: '85781',
    phone: '081234567806',
    email: 'agustiani@mtsmanbaulislam.sch.id',
    kodeUnik: 'KURIKULUM2026'
  },
  sarpras: {
    name: 'Sugiyono, S.Pd',
    nip: '85788',
    phone: '081234567807'
  },
  humas: {
    name: 'Erna Ekawati, SH',
    nip: '85798',
    phone: '081234567808'
  },
  tataUsaha: {
    name: 'Akhmad Taufik',
    nip: '85804',
    phone: '081234567809'
  },
  bk: {
    name: 'Fahmi, S.Pd',
    nip: '85821',
    phone: '081234567810'
  },
  bendaharaUtama: DEFAULT_TREASURER_UTAMA,
  bendahara: DEFAULT_TREASURERS[0],
  bendahara2: DEFAULT_TREASURERS[1],
  bendahara3: DEFAULT_TREASURERS[2],
  bendahara4: DEFAULT_TREASURERS[3],
  bendahara5: DEFAULT_TREASURERS[4],
  treasurers: [DEFAULT_TREASURER_UTAMA, ...DEFAULT_TREASURERS]
};

export const DEFAULT_OFFICIALS = DEFAULT_SCHOOL_OFFICIALS;

export function cleanTreasurerRole(role?: string, fallbackIndex: number = 1): string {
  if (!role) return `Bendahara ${fallbackIndex}`;
  if (role.toLowerCase().includes('utama')) return 'Bendahara Utama';
  // Strip anything in parentheses e.g. "(SPP & Kas Rutin)", "(Ujian, Infaq & Kegiatan)", "(Buku, Seragam)", etc.
  const cleaned = role.replace(/\s*\([^)]*\)/g, '').trim();
  if (!cleaned || cleaned.toLowerCase() === 'bendahara') {
    return `Bendahara ${fallbackIndex}`;
  }
  return cleaned;
}

export function getTreasurerUtama(officials?: SchoolOfficials): BendaharaPerson {
  if (!officials) return DEFAULT_TREASURER_UTAMA;
  const fromList = officials.treasurers?.find(t => t.id === 'bu' || (t.roleTitle && t.roleTitle.toLowerCase().includes('utama')));
  if (fromList) {
    return {
      ...DEFAULT_TREASURER_UTAMA,
      ...fromList,
      id: 'bu',
      roleTitle: 'Bendahara Utama',
      kodeUnik: fromList.kodeUnik || officials.bendaharaUtama?.kodeUnik || DEFAULT_TREASURER_UTAMA.kodeUnik
    };
  }
  if (officials.bendaharaUtama && officials.bendaharaUtama.name) {
    return {
      ...DEFAULT_TREASURER_UTAMA,
      ...officials.bendaharaUtama,
      id: 'bu',
      roleTitle: 'Bendahara Utama',
      kodeUnik: officials.bendaharaUtama.kodeUnik || DEFAULT_TREASURER_UTAMA.kodeUnik
    };
  }
  return DEFAULT_TREASURER_UTAMA;
}

export function getCollectingTreasurers(officials?: SchoolOfficials): BendaharaPerson[] {
  if (!officials) return DEFAULT_TREASURERS;
  
  let rawList: BendaharaPerson[] = [];
  if (officials.treasurers && Array.isArray(officials.treasurers) && officials.treasurers.length > 0) {
    // Exclude bendahara utama if present in list
    rawList = officials.treasurers
      .filter(t => t.id !== 'bu' && !(t.roleTitle && t.roleTitle.toLowerCase().includes('utama')))
      .map(t => ({ ...t }));
  } else {
    if (officials.bendahara) rawList.push({ ...officials.bendahara, id: officials.bendahara.id || 'b1' });
    if (officials.bendahara2) rawList.push({ ...officials.bendahara2, id: officials.bendahara2.id || 'b2' });
    if (officials.bendahara3) rawList.push({ ...officials.bendahara3, id: officials.bendahara3.id || 'b3' });
    if (officials.bendahara4) rawList.push({ ...officials.bendahara4, id: officials.bendahara4.id || 'b4' });
    if (officials.bendahara5) rawList.push({ ...officials.bendahara5, id: officials.bendahara5.id || 'b5' });
  }

  DEFAULT_TREASURERS.forEach(dt => {
    if (!rawList.some(t => t.id === dt.id)) {
      rawList.push({ ...dt });
    }
  });

  return rawList.map((t, idx) => {
    const num = idx + 1;
    const cleanedRole = cleanTreasurerRole(t.roleTitle, num);
    const defaultObj = DEFAULT_TREASURERS.find(d => d.id === t.id) || DEFAULT_TREASURERS[idx] || DEFAULT_TREASURERS[0];
    return {
      ...t,
      roleTitle: cleanedRole,
      kodeUnik: t.kodeUnik || defaultObj.kodeUnik
    };
  });
}

export function getAllTreasurers(officials?: SchoolOfficials): BendaharaPerson[] {
  const bu = getTreasurerUtama(officials);
  const collecting = getCollectingTreasurers(officials);
  return [bu, ...collecting];
}

export interface MatchedTreasurerInfo {
  id: string;
  name: string;
  roleTitle: string;
  nip?: string;
  phone?: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export function matchTreasurerFromReceivedBy(
  receivedBy: string | undefined,
  allTreasurers: BendaharaPerson[]
): MatchedTreasurerInfo {
  const raw = (receivedBy || '').trim();
  const lower = raw.toLowerCase();

  // 1. Check if it's Bendahara Utama
  if (lower.includes('utama') || lower.includes('mardhiyah') || lower === 'bu') {
    const bu = allTreasurers.find(t => t.id === 'bu' || t.roleTitle?.toLowerCase().includes('utama')) || DEFAULT_TREASURER_UTAMA;
    return {
      id: 'bu',
      name: bu.name || 'Hj. Siti Mardhiyah, S.E., M.M.',
      roleTitle: 'Bendahara Utama',
      nip: bu.nip,
      phone: bu.phone,
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
      dotColor: 'bg-amber-600'
    };
  }

  const colorPalettes = [
    { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' }, // Bendahara 1
    { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' }, // Bendahara 2
    { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500' }, // Bendahara 3
    { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' }, // Bendahara 4
    { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500' }, // Bendahara 5
  ];

  // 2. Try matching against all collecting treasurers list
  const collecting = allTreasurers.filter(t => t.id !== 'bu');
  for (let i = 0; i < collecting.length; i++) {
    const t = collecting[i];
    const tName = (t.name || '').toLowerCase();
    const tId = (t.id || `b${i + 1}`).toLowerCase();
    const palette = colorPalettes[i % colorPalettes.length];

    if (
      (tName && (lower.includes(tName) || tName.includes(lower))) ||
      (t.nip && raw.includes(t.nip)) ||
      (tId && lower === tId) ||
      lower.includes(`bendahara ${i + 1}`) ||
      lower.includes(`bendahara${i + 1}`)
    ) {
      return {
        id: t.id || `b${i + 1}`,
        name: t.name || `Bendahara ${i + 1}`,
        roleTitle: cleanTreasurerRole(t.roleTitle, i + 1),
        nip: t.nip,
        phone: t.phone,
        badgeBg: palette.bg,
        badgeText: palette.text,
        badgeBorder: palette.border,
        dotColor: palette.dot
      };
    }
  }

  // 3. Fallback check for numbers 1..5 in string
  for (let num = 1; num <= 5; num++) {
    if (lower.includes(`bendahara ${num}`) || lower.includes(`bendahara${num}`)) {
      const t = collecting[num - 1];
      const palette = colorPalettes[(num - 1) % colorPalettes.length];
      return {
        id: t?.id || `b${num}`,
        name: t?.name || `Bendahara ${num}`,
        roleTitle: cleanTreasurerRole(t?.roleTitle, num),
        nip: t?.nip,
        phone: t?.phone,
        badgeBg: palette.bg,
        badgeText: palette.text,
        badgeBorder: palette.border,
        dotColor: palette.dot
      };
    }
  }

  return {
    id: 'other',
    name: raw || 'Bendahara Madrasah',
    roleTitle: 'Petugas Kasir',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    dotColor: 'bg-slate-500'
  };
}

export const DEFAULT_CLASS_WALIKELAS: ClassWaliKelasMap = {
  'VII A': 'Andri Setiawan',
  'VII B': 'Agustiani, S.Pd',
  'VII C': 'Listijawati, SE',
  'VII D': 'M. Sholihin, SE',
  'VII E': 'Listijawati, SE',
  'VIII A': 'Andri Setiawan',
  'VIII B': 'Agustiani, S.Pd',
  'IX A': 'M. Sholihin, SE',
  'IX B': 'Agustiani, S.Pd'
};

export const DEFAULT_WALI_KELAS = DEFAULT_CLASS_WALIKELAS;

export function getSchoolStorageKey(baseName: string, schoolId?: SchoolId): string {
  return `mts_manbaul_${baseName}_v1`;
}

export function getStoredSchoolOfficials(schoolId?: SchoolId): SchoolOfficials {
  const activeId = schoolId || getActiveSchoolId();
  const defaultOfficials = DEFAULT_SCHOOL_OFFICIALS;
  const storageKey = getSchoolStorageKey('officials', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      const bu = getTreasurerUtama(parsed);
      const collecting = getCollectingTreasurers(parsed);
      const treasurersList = [bu, ...collecting];
      return {
        ...defaultOfficials,
        ...parsed,
        bendaharaUtama: bu,
        bendahara: collecting[0] || defaultOfficials.bendahara || DEFAULT_TREASURERS[0],
        bendahara2: collecting[1] || defaultOfficials.bendahara2 || DEFAULT_TREASURERS[1],
        bendahara3: collecting[2] || defaultOfficials.bendahara3 || DEFAULT_TREASURERS[2],
        bendahara4: collecting[3] || defaultOfficials.bendahara4 || DEFAULT_TREASURERS[3],
        bendahara5: collecting[4] || defaultOfficials.bendahara5 || DEFAULT_TREASURERS[4],
        treasurers: treasurersList
      };
    }
  } catch (e) {
    console.error(e);
  }
  return defaultOfficials;
}

export function saveSchoolOfficials(officials: SchoolOfficials, schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const defaultOfficials = DEFAULT_SCHOOL_OFFICIALS;
  const storageKey = getSchoolStorageKey('officials', activeId);

  try {
    const bu = getTreasurerUtama(officials);
    const collecting = getCollectingTreasurers(officials);
    const treasurersList = [bu, ...collecting];
    const cleanedOfficials: SchoolOfficials = {
      ...officials,
      bendaharaUtama: bu,
      bendahara: collecting[0] || defaultOfficials.bendahara || DEFAULT_TREASURERS[0],
      bendahara2: collecting[1] || defaultOfficials.bendahara2 || DEFAULT_TREASURERS[1],
      bendahara3: collecting[2] || defaultOfficials.bendahara3 || DEFAULT_TREASURERS[2],
      bendahara4: collecting[3] || defaultOfficials.bendahara4 || DEFAULT_TREASURERS[3],
      bendahara5: collecting[4] || defaultOfficials.bendahara5 || DEFAULT_TREASURERS[4],
      treasurers: treasurersList
    };
    safeLocalStorageSet(storageKey, JSON.stringify(cleanedOfficials));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredClassWaliKelas(schoolId?: SchoolId): ClassWaliKelasMap {
  const activeId = schoolId || getActiveSchoolId();
  const defaultWaliKelas = DEFAULT_CLASS_WALIKELAS;
  const storageKey = getSchoolStorageKey('class_walikelas', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return defaultWaliKelas;
}

export function saveClassWaliKelas(mapping: ClassWaliKelasMap, schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('class_walikelas', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(mapping));
  } catch (e) {
    console.error(e);
  }
}

export function getAcademicSettings(): AcademicSettings {
  try {
    const data = safeLocalStorageGet('mts_manbaul_academic_settings_v1');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return { academicYear: '2026/2027', semester: 'Semester Ganjil' };
}

export function saveAcademicSettings(settings: AcademicSettings): void {
  try {
    safeLocalStorageSet('mts_manbaul_academic_settings_v1', JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function deduplicateTeachers(teachers: Teacher[]): { deduplicated: Teacher[]; hasDuplicates: boolean } {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenNips = new Set<string>();
  const result: Teacher[] = [];
  let hasDuplicates = false;

  for (const rawTeacher of teachers) {
    if (!rawTeacher || !rawTeacher.name) continue;
    const t = { ...rawTeacher };
    const lowerName = t.name.toLowerCase().trim();

    // Normalize known name aliases
    if (lowerName === 'andri setiayan' || lowerName === 'andi setiawan' || lowerName === 'andri setiawan') {
      t.name = 'Andri Setiawan';
      t.id = 't-85831';
      t.nip = '-';
    } else if (lowerName === 'agustiyan, s.pd' || lowerName === 'agustiani, s.pd') {
      t.name = 'Agustiani, S.Pd';
    }

    const normName = t.name.toLowerCase().trim();
    const hasValidNip = t.nip && t.nip !== '-' && t.nip !== 'undefined' && t.nip.trim() !== '';
    const normNip = hasValidNip ? t.nip.trim() : null;

    if (seenIds.has(t.id) || seenNames.has(normName) || (normNip && seenNips.has(normNip))) {
      hasDuplicates = true;
      continue;
    }

    seenIds.add(t.id);
    seenNames.add(normName);
    if (normNip) seenNips.add(normNip);

    result.push({
      ...t,
      kodeUnik: t.kodeUnik || `GURU-${hasValidNip ? t.nip : t.id.replace('t-', '')}`
    });
  }

  return { deduplicated: result, hasDuplicates };
}

export function getStoredTeachers(schoolId?: SchoolId): Teacher[] {
  const activeId = schoolId || getActiveSchoolId();
  const defaultTeachers = INITIAL_TEACHERS;
  const storageKey = getSchoolStorageKey('teachers', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    const rawList: Teacher[] = data ? JSON.parse(data) : defaultTeachers;
    const { deduplicated } = deduplicateTeachers(rawList);
    return deduplicated;
  } catch (e) {
    console.error(e);
    const { deduplicated } = deduplicateTeachers(defaultTeachers);
    return deduplicated;
  }
}

export function saveTeachers(teachers: Teacher[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('teachers', activeId);
  try {
    const { deduplicated } = deduplicateTeachers(teachers);
    safeLocalStorageSet(storageKey, JSON.stringify(deduplicated));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredSubjects(schoolId?: SchoolId): Subject[] {
  const activeId = schoolId || getActiveSchoolId();
  const defaultSubjects = INITIAL_SUBJECTS;
  const storageKey = getSchoolStorageKey('subjects', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    return data ? JSON.parse(data) : defaultSubjects;
  } catch (e) {
    console.error(e);
    return defaultSubjects;
  }
}

export function saveSubjects(subjects: Subject[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('subjects', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(subjects));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredStudents(schoolId?: SchoolId): Student[] {
  const activeId = schoolId || getActiveSchoolId();
  const defaultStudents = INITIAL_STUDENTS;
  const storageKey = getSchoolStorageKey('students', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    const parsed: Student[] = data ? JSON.parse(data) : defaultStudents;
    const seenIds = new Set<string>();

    const mergedList: Student[] = parsed.map((s, idx) => {
      const item = { ...s };
      const sNorm = (item.name || '').toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim();
      const sClass = (item.className || '').toUpperCase().replace(/\s+/g, '');

      const match = defaultStudents.find(init => {
        const initNorm = (init.name || '').toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim();
        const initClass = (init.className || '').toUpperCase().replace(/\s+/g, '');
        return (initNorm === sNorm || initNorm.includes(sNorm) || sNorm.includes(initNorm)) &&
               (!sClass || !initClass || initClass === sClass);
      });

      if (match) {
        if (!item.kodeUnik && match.kodeUnik) item.kodeUnik = match.kodeUnik;
        if (!item.nisn && match.nisn) item.nisn = match.nisn;
        if (!item.nik && match.nik) item.nik = match.nik;
        if (!item.gender && match.gender) item.gender = match.gender;
        if (!item.tempatLahir && match.tempatLahir) item.tempatLahir = match.tempatLahir;
        if (!item.tanggalLahir && match.tanggalLahir) item.tanggalLahir = match.tanggalLahir;
        if (!item.alamat && match.alamat) item.alamat = match.alamat;
        if (!item.kodePos && match.kodePos) item.kodePos = match.kodePos;
        if (!item.namaAyah && match.namaAyah) item.namaAyah = match.namaAyah;
        if (!item.namaIbu && match.namaIbu) item.namaIbu = match.namaIbu;
        if (!item.namaWali && match.namaWali) item.namaWali = match.namaWali;
        if (!item.noKip && match.noKip) item.noKip = match.noKip;
        if (!item.kategoriSosial && match.kategoriSosial) item.kategoriSosial = match.kategoriSosial;
        if (!item.kebutuhanKhusus && match.kebutuhanKhusus) item.kebutuhanKhusus = match.kebutuhanKhusus;
        if (!item.disabilitas && match.disabilitas) item.disabilitas = match.disabilitas;
        if (!item.umur && match.umur) item.umur = match.umur;
        if (!item.statusSiswa && match.statusSiswa) item.statusSiswa = match.statusSiswa;
        if (!item.phone && match.phone) item.phone = match.phone;
        if (!item.parentPhone && match.parentPhone) item.parentPhone = match.parentPhone;
      }

      let cleanId = item.id;
      if (!cleanId || seenIds.has(cleanId)) {
        cleanId = item.kodeUnik ? `stu-${item.kodeUnik}` : `stu-${item.className.replace(/\s+/g, '')}-${item.rollNo}`;
      }
      if (seenIds.has(cleanId)) {
        cleanId = `${cleanId}-${idx + 1}`;
      }
      seenIds.add(cleanId);
      item.id = cleanId;

      return item;
    });

    // Also include any students in defaultStudents that aren't in parsed yet
    defaultStudents.forEach((ds, dsIdx) => {
      const dsNorm = (ds.name || '').toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim();
      const exists = mergedList.some(p => (p.name || '').toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim() === dsNorm);
      if (!exists) {
        let cleanId = ds.id || (ds.kodeUnik ? `stu-${ds.kodeUnik}` : `stu-ds-${dsIdx + 1}`);
        if (seenIds.has(cleanId)) cleanId = `${cleanId}-${dsIdx + 1}`;
        seenIds.add(cleanId);
        mergedList.push({ ...ds, id: cleanId });
      }
    });

    return mergedList;
  } catch (e) {
    console.error(e);
    return defaultStudents;
  }
}

export function saveStudents(students: Student[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('students', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(students));
  } catch (e) {
    console.error(e);
  }
}

export function getActiveTeacherId(schoolId?: SchoolId): string {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('active_teacher', activeId);
  try {
    const saved = safeLocalStorageGet(storageKey);
    if (saved) return saved;
    const teachers = getStoredTeachers(activeId);
    return teachers[0]?.id || 't-85780';
  } catch (e) {
    console.error(e);
    return 't-85780';
  }
}

export function saveActiveTeacherId(id: string, schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('active_teacher', activeId);
  try {
    safeLocalStorageSet(storageKey, id);
  } catch (e) {
    console.error(e);
  }
}

export function getStoredSessions(schoolId?: SchoolId): AttendanceSession[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('sessions', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) return JSON.parse(data);
    
    // Default sample sessions for MTs Manbaul Islam
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const classes = ['VII A', 'VII B', 'VIII A', 'VIII B', 'IX A', 'IX B'];
    const sampleSessions: AttendanceSession[] = [];

    classes.forEach((clsName) => {
      const classStudents = INITIAL_STUDENTS.filter(s => s.className === clsName);
      
      sampleSessions.push({
        id: `sess-sample-${clsName}-1`,
        date: today,
        teacherId: 't-85780',
        teacherName: 'M. Sholihin, SE',
        teacherNip: '85780',
        subjectId: 'sub-mtk',
        subjectName: 'Matematika',
        className: clsName,
        meetingNumber: 12,
        periodNumber: '1 - 2 (07.30 - 08.50 WIB)',
        topic: 'Persamaan dan Fungsi Kuadrat: Menentukan Akar-Akar Persamaan Kuadrat',
        competency: 'Siswa dapat menentukan akar persamaan kuadrat dengan pemfaktoran',
        teachingNotes: 'Proses KBM berjalan lancar. Diskusi kelompok aktif.',
        entries: classStudents.map((s, idx) => ({
          studentId: s.id,
          status: idx === 2 ? 'S' : idx === 4 ? 'I' : idx === 7 ? 'A' : 'H',
          notes: idx === 2 ? 'Sakit demam' : idx === 4 ? 'Izin surat orang tua' : idx === 7 ? 'Tanpa keterangan' : 'Mengikuti KBM dengan baik'
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      sampleSessions.push({
        id: `sess-sample-${clsName}-2`,
        date: yesterday,
        teacherId: 't-85781',
        teacherName: 'Dra. Hj. Nurjanah',
        teacherNip: '85781',
        subjectId: 'sub-bind',
        subjectName: 'Bahasa Indonesia',
        className: clsName,
        meetingNumber: 11,
        periodNumber: '3 - 4 (09.10 - 10.30 WIB)',
        topic: 'Teks Laporan Hasil Observasi: Struktur dan Ciri Kebahasaan',
        competency: 'Mengidentifikasi informasi teks laporan hasil observasi',
        teachingNotes: 'Tugas kelompok observasi lingkungan sekolah.',
        entries: classStudents.map((s, idx) => ({
          studentId: s.id,
          status: idx === 3 ? 'I' : 'H',
          notes: idx === 3 ? 'Izin lomba antar madrasah' : 'Hadir aktif'
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    return sampleSessions;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveSessions(sessions: AttendanceSession[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('sessions', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(sessions));
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// OFFLINE ATTENDANCE SYNC QUEUE HELPERS
// ==========================================
export function getOfflineAttendanceQueue(schoolId?: SchoolId): OfflineAttendanceQueueItem[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('offline_attendance_queue', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to read offline attendance queue:', e);
    return [];
  }
}

export function saveOfflineAttendanceQueue(queue: OfflineAttendanceQueueItem[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('offline_attendance_queue', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to write offline attendance queue:', e);
  }
}

export function enqueueOfflineAttendance(
  session: AttendanceSession,
  violationsToSave?: StudentViolation[],
  violationIdsToDelete?: string[],
  schoolId?: SchoolId
): void {
  const currentQueue = getOfflineAttendanceQueue(schoolId);
  const existingIdx = currentQueue.findIndex(item => item.id === session.id);
  const newItem: OfflineAttendanceQueueItem = {
    id: session.id,
    session: {
      ...session,
      isSyncedToCloud: false
    },
    violationsToSave,
    violationIdsToDelete,
    queuedAt: new Date().toISOString(),
    retryCount: 0
  };

  let updatedQueue: OfflineAttendanceQueueItem[];
  if (existingIdx >= 0) {
    updatedQueue = currentQueue.map((item, idx) => (idx === existingIdx ? newItem : item));
  } else {
    updatedQueue = [...currentQueue, newItem];
  }
  saveOfflineAttendanceQueue(updatedQueue, schoolId);
}

export function removeOfflineAttendanceItem(sessionId: string, schoolId?: SchoolId): void {
  const currentQueue = getOfflineAttendanceQueue(schoolId);
  const updatedQueue = currentQueue.filter(item => item.id !== sessionId);
  saveOfflineAttendanceQueue(updatedQueue, schoolId);
}

export function clearOfflineAttendanceQueue(schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('offline_attendance_queue', activeId);
  safeLocalStorageRemove(storageKey);
}

export function getStoredSchedules(schoolId?: SchoolId): TeachingSchedule[] {
  const activeId = schoolId || getActiveSchoolId();
  const defaultSchedules = INITIAL_SCHEDULES as TeachingSchedule[];
  const storageKey = getSchoolStorageKey('schedules', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    let list: TeachingSchedule[] = [];
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
    if (list.length === 0) {
      list = defaultSchedules;
    }

    if (activeId === 'mts_manbaul_islam') {
      const normalizedList = list.map(s => {
        const isGrade7or9 = s.className.startsWith('VII') || s.className.startsWith('IX');
        const isGrade8 = s.className.startsWith('VIII');
        const isPenjas = (s.subjectCode && s.subjectCode.toUpperCase() === 'PENJAS') || 
                         (s.subjectName && s.subjectName.toLowerCase().includes('jasmani'));
        const isOldAndri = s.teacherName === 'Andi Setiawan' || s.teacherName === 'Andri setiawan' || s.teacherName === 'Andri Setiayan' || s.teacherId === 't-85831';

        if (isGrade8 && isPenjas) {
          return {
            ...s,
            teacherId: 't-85829',
            teacherName: 'Randi',
            teacherNip: '85829'
          };
        }

        if ((isGrade7or9 && isPenjas) || (isOldAndri && !isGrade8)) {
          return {
            ...s,
            teacherId: 't-85831',
            teacherName: 'Andri Setiawan',
            teacherNip: '-'
          };
        }
        return s;
      });

      return normalizedList;
    }

    return list;
  } catch (e) {
    console.error(e);
    return defaultSchedules;
  }
}

export function saveSchedules(schedules: TeachingSchedule[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('schedules', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(schedules));
  } catch (e) {
    console.error(e);
  }
}

export function getDayNameFromDate(dateStr: string): DayOfWeek {
  try {
    const d = new Date(dateStr);
    const dayIndex = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayMap: Record<number, DayOfWeek> = {
      1: 'Senin',
      2: 'Selasa',
      3: 'Rabu',
      4: 'Kamis',
      5: 'Jumat',
      6: 'Sabtu'
    };
    return dayMap[dayIndex] || 'Senin';
  } catch {
    return 'Senin';
  }
}

export function getStoredGrades(schoolId?: SchoolId): GradeRecord[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('grades', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveGrades(grades: GradeRecord[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('grades', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(grades));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredLessonPlans(schoolId?: SchoolId): LessonPlan[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('lesson_plans', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveLessonPlans(plans: LessonPlan[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('lesson_plans', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(plans));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredViolations(schoolId?: SchoolId): StudentViolation[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('violations', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) return JSON.parse(data);

    // Initial sample violations for MTs if empty
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sampleViolations: StudentViolation[] = [
      {
        id: 'viol-sample-1',
        studentId: 'stu-IXA-1',
        studentName: 'ACHMAD FADILAH',
        className: 'IX A',
        date: today,
        violationType: 'Terlambat Masuk Sekolah (>15 Menit)',
        category: 'Ringan',
        points: 5,
        reporterName: 'Tim BK / Tim Kedisiplinan',
        description: 'Siswa datang pukul 07.25 WIB (pintu gerbang sudah ditutup). Diberikan sanksi membaca Al-Quran di perpustakaan.',
        status: 'Baru',
        handledByWaliKelas: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'viol-sample-2',
        studentId: 'stu-IXA-3',
        studentName: 'ALDO PRATAMA',
        className: 'IX A',
        date: yesterday,
        violationType: 'Atribut Seragam Tidak Lengkap',
        category: 'Ringan',
        points: 5,
        reporterName: 'M. Sholihin, SE (Wakasek Kesiswaan)',
        description: 'Tidak memakai sabuk hitam dan dasi madrasah saat upacara bendera.',
        status: 'Proses Bimbingan',
        handledByWaliKelas: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'viol-sample-3',
        studentId: 'stu-VIIIA-2',
        studentName: 'BAYU APRIADI',
        className: 'VIII A',
        date: yesterday,
        violationType: 'Membolos Jam Pelajaran KBM',
        category: 'Sedang',
        points: 15,
        reporterName: 'Guru BK / BP',
        description: 'Tidak berada di kelas saat jam pelajaran ke-3 dan 4 (pindah ke kantin tanpa izin guru).',
        status: 'Panggilan Orang Tua',
        handledByWaliKelas: false,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    return sampleViolations;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveViolations(violations: StudentViolation[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('violations', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(violations));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredBendaharaCode(): string {
  try {
    const code = safeLocalStorageGet('mts_manbaul_bendahara_code_v1');
    if (code) return code;
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_FEE_TARIFFS.bendaharaKodeUnik;
}

export function saveBendaharaCode(code: string): void {
  try {
    safeLocalStorageSet('mts_manbaul_bendahara_code_v1', code);
  } catch (e) {
    console.error(e);
  }
}

export function getStoredBendahara2Code(): string {
  try {
    const code = safeLocalStorageGet('mts_manbaul_bendahara2_code_v1');
    if (code) return code;
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_FEE_TARIFFS.bendahara2KodeUnik || 'BENDAHARA2';
}

export function saveBendahara2Code(code: string): void {
  try {
    safeLocalStorageSet('mts_manbaul_bendahara2_code_v1', code);
  } catch (e) {
    console.error(e);
  }
}

export function getStoredAdminSettings(): AdminSettings {
  try {
    const data = safeLocalStorageGet('mts_manbaul_admin_settings_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.adminPasscode === 'ADMIN2026' || !parsed.adminPasscode) {
        parsed.adminPasscode = 'akhmadtaufik84@';
        safeLocalStorageSet('mts_manbaul_admin_settings_v1', JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export function saveAdminSettings(settings: AdminSettings): void {
  try {
    safeLocalStorageSet('mts_manbaul_admin_settings_v1', JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredFeeTariffs(schoolId?: SchoolId): FeeTariffSettings {
  const activeId = schoolId || getActiveSchoolId();
  const defaultTariffs = DEFAULT_FEE_TARIFFS;
  const storageKey = getSchoolStorageKey('fee_tariffs', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...defaultTariffs,
        ...parsed,
        sppMonthlyByGrade: parsed.sppMonthlyByGrade || defaultTariffs.sppMonthlyByGrade,
        bendaharaKodeUnik: parsed.bendaharaKodeUnik || defaultTariffs.bendaharaKodeUnik,
        bendahara2KodeUnik: parsed.bendahara2KodeUnik || defaultTariffs.bendahara2KodeUnik,
        biayaPTS: parsed.biayaPTS ?? defaultTariffs.biayaPTS,
        biayaSAS: parsed.biayaSAS ?? defaultTariffs.biayaSAS,
        biayaDAT: parsed.biayaDAT ?? defaultTariffs.biayaDAT,
      };
    }
  } catch (e) {
    console.error(e);
  }
  return defaultTariffs;
}

export function saveFeeTariffs(tariffs: FeeTariffSettings, schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('fee_tariffs', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(tariffs));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredPayments(schoolId?: SchoolId): PaymentTransaction[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('payments', activeId);

  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) return JSON.parse(data);

    // Initial sample payments for MTs
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const samplePayments: PaymentTransaction[] = [
      {
        id: 'pay-sample-1',
        invoiceNumber: 'KW/2026/08/001',
        studentId: 'stu-IXA-1',
        studentName: 'ACHMAD FADILAH',
        className: 'IX A',
        nisn: '0089123401',
        parentPhone: '081234567890',
        category: 'SPP',
        categoryLabel: 'SPP Bulan Agustus 2026',
        month: 'Agustus 2026',
        academicYear: '2026/2027',
        amount: 150000,
        totalBillAmount: 150000,
        paymentMethod: 'Tunai',
        paymentDate: today,
        status: 'Lunas',
        receivedBy: 'Siti Rahmawati, S.E.',
        notes: 'Pembayaran lunas tepat waktu',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay-sample-2',
        invoiceNumber: 'KW/2026/08/002',
        studentId: 'stu-IXA-2',
        studentName: 'AFIFAH NUR AINI',
        className: 'IX A',
        nisn: '0089123402',
        parentPhone: '081398765432',
        category: 'SPP',
        categoryLabel: 'SPP Bulan Agustus 2026',
        month: 'Agustus 2026',
        academicYear: '2026/2027',
        amount: 150000,
        totalBillAmount: 150000,
        paymentMethod: 'Transfer Bank',
        paymentDate: today,
        status: 'Lunas',
        receivedBy: 'Siti Rahmawati, S.E.',
        notes: 'Transfer via BSI Mobile',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay-sample-3',
        invoiceNumber: 'KW/2026/08/003',
        studentId: 'stu-VIIA-1',
        studentName: 'ADAM MALIK',
        className: 'VII A',
        nisn: '0091234501',
        category: 'GEDUNG',
        categoryLabel: 'Infaq Pembangunan / Uang Gedung (Angsuran 1)',
        academicYear: '2026/2027',
        amount: 600000,
        totalBillAmount: 1200000,
        paymentMethod: 'Tunai',
        paymentDate: yesterday,
        status: 'Sebagian',
        receivedBy: 'Siti Rahmawati, S.E.',
        notes: 'Sisa uang gedung Rp 600.000',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'pay-sample-4',
        invoiceNumber: 'KW/2026/08/004',
        studentId: 'stu-VIIA-2',
        studentName: 'AISYAH PUTRI',
        className: 'VII A',
        nisn: '0091234502',
        category: 'SERAGAM',
        categoryLabel: 'Uang Seragam & Atribut Lengkap',
        academicYear: '2026/2027',
        amount: 650000,
        totalBillAmount: 650000,
        paymentMethod: 'QRIS',
        paymentDate: yesterday,
        status: 'Lunas',
        receivedBy: 'Siti Rahmawati, S.E.',
        notes: 'Seragam batik, olahraga, dan atribut diserahkan',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    return samplePayments;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function savePayments(payments: PaymentTransaction[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('payments', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(payments));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredCashDeposits(schoolId?: SchoolId): CashDepositTransaction[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('cash_deposits', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) return JSON.parse(data);

    // Initial sample deposits
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sampleDeposits: CashDepositTransaction[] = [
      {
        id: 'dep-sample-1',
        depositNumber: 'STR/2026/08/001',
        fromTreasurerId: 'b1',
        fromTreasurerName: 'Siti Rahmawati, S.E.',
        fromTreasurerRole: 'Bendahara 1',
        toTreasurerId: 'bu',
        toTreasurerName: 'Hj. Siti Mardhiyah, S.E., M.M.',
        toTreasurerRole: 'Bendahara Utama',
        amount: 800000,
        depositDate: yesterday,
        notes: 'Setoran penerimaan kas SPP & Infaq pembangunan tahap awal',
        status: 'Diterima',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    return sampleDeposits;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveCashDeposits(deposits: CashDepositTransaction[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('cash_deposits', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(deposits));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredExpenses(schoolId?: SchoolId): TreasurerExpenseTransaction[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('expenses', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) return JSON.parse(data);

    // Initial sample expenses
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sampleExpenses: TreasurerExpenseTransaction[] = [
      {
        id: 'exp-sample-1',
        expenseNumber: 'BKK/2026/08/001',
        treasurerId: 'b1',
        treasurerName: 'Siti Rahmawati, S.E.',
        treasurerRole: 'Bendahara 1',
        category: 'Belanja ATK & Sarana',
        title: 'Pembelian Kertas HVS F4 5 Rim & Spidol Whiteboard',
        recipientName: 'Toko ATK Berkah Mandiri',
        amount: 325000,
        expenseDate: yesterday,
        paymentMethod: 'Tunai',
        notes: 'Kebutuhan administrasi cetak modul dan lembar kerja siswa',
        receiptNumber: 'NOTA-BM/8821',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'exp-sample-2',
        expenseNumber: 'BKK/2026/08/002',
        treasurerId: 'bu',
        treasurerName: 'Hj. Siti Mardhiyah, S.E., M.M.',
        treasurerRole: 'Bendahara Utama',
        category: 'Operasional Sekolah',
        title: 'Langganan Internet & Wifi Sekolah Bulan Agustus',
        recipientName: 'Telkom Indihome / Biznet',
        amount: 650000,
        expenseDate: today,
        paymentMethod: 'Transfer Bank',
        notes: 'Pembayaran rutin koneksi internet lab komputer dan kantor guru',
        receiptNumber: 'TELKOM-892110',
        createdAt: new Date().toISOString()
      }
    ];

    return sampleExpenses;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveExpenses(expenses: TreasurerExpenseTransaction[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('expenses', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(expenses));
  } catch (e) {
    console.error(e);
  }
}

export const saveTreasurerExpenses = saveExpenses;

export function getStoredStudentBillSettings(schoolId?: SchoolId): StudentBillSettings {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('student_bills', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_STUDENT_BILL_SETTINGS,
        ...parsed,
        activeObligations: {
          ...DEFAULT_STUDENT_BILL_SETTINGS.activeObligations,
          ...(parsed.activeObligations || {})
        },
        standardBillingItems: parsed.standardBillingItems || DEFAULT_STUDENT_BILL_SETTINGS.standardBillingItems || DEFAULT_STANDARD_BILLING_ITEMS,
        sppMonthsBilled: parsed.sppMonthsBilled || DEFAULT_STUDENT_BILL_SETTINGS.sppMonthsBilled,
        customBills: parsed.customBills || DEFAULT_STUDENT_BILL_SETTINGS.customBills,
        studentOverrides: parsed.studentOverrides !== undefined
          ? parsed.studentOverrides
          : DEFAULT_STUDENT_BILL_SETTINGS.studentOverrides,
        paymentAccountInfo: {
          ...DEFAULT_STUDENT_BILL_SETTINGS.paymentAccountInfo,
          ...(parsed.paymentAccountInfo || {})
        }
      };
    }
    return DEFAULT_STUDENT_BILL_SETTINGS;
  } catch (e) {
    console.error(e);
    return DEFAULT_STUDENT_BILL_SETTINGS;
  }
}

export function saveStudentBillSettings(settings: StudentBillSettings, schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('student_bills', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Extracts normalized grade level string (VII, VIII, IX, X, XI, XII) from class name.
 */
export function getGradeFromClassName(className?: string): string {
  if (!className) return 'VII';
  const norm = className.toUpperCase().trim();
  // Check multi-character Roman numerals first to avoid partial substring clashes
  if (norm.startsWith('VIII') || norm.includes('VIII') || norm.startsWith('8')) return 'VIII';
  if (norm.startsWith('VII') || norm.includes('VII') || norm.startsWith('7')) return 'VII';
  if (norm.startsWith('IX') || norm.includes('IX') || norm.startsWith('9')) return 'IX';
  if (norm.startsWith('XII') || norm.includes('XII') || norm.startsWith('12')) return 'XII';
  if (norm.startsWith('XI') || norm.includes('XI') || norm.startsWith('11')) return 'XI';
  if (norm.startsWith('X') || norm.includes('X') || norm.startsWith('10')) return 'X';
  return 'VII';
}

/**
 * Resolves the effective SPP monthly tariff for a given student's class / grade level.
 * Falls back to tariffs.sppMonthly if no grade-specific tariff is set.
 */
export function getSppTariffForGrade(tariffs?: FeeTariffSettings, gradeOrClass?: string): number {
  if (!tariffs) return 150000;
  const grade = getGradeFromClassName(gradeOrClass);
  if (
    tariffs.sppMonthlyByGrade &&
    typeof tariffs.sppMonthlyByGrade[grade] === 'number' &&
    tariffs.sppMonthlyByGrade[grade]! > 0
  ) {
    return tariffs.sppMonthlyByGrade[grade]!;
  }
  return tariffs.sppMonthly || 150000;
}

/**
 * Checks whether a student's class matches the target grade levels (VII, VIII, IX, X, XI, XII, or SEMUA).
 */
export function isStudentGradeMatching(studentClassName?: string, targetGrades?: string[]): boolean {
  if (!targetGrades || targetGrades.length === 0 || targetGrades.includes('SEMUA') || targetGrades.includes('ALL')) {
    return true;
  }
  if (!studentClassName) return true;

  const studentGrade = getGradeFromClassName(studentClassName);
  return targetGrades.includes(studentGrade);
}

export function normalizeStudentSearchString(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, '') // keep only alphanumeric
    .trim();
}

export function normalizeClassName(className?: string): string {
  if (!className) return '';
  return className
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[-_.]/g, '')
    .replace(/^KELAS/i, '');
}

/**
 * Checks if a payment transaction belongs to a given student.
 * Checks ID match, NISN match, NIS match, or normalized name + class match.
 */
export function isPaymentForStudent(payment: PaymentTransaction, student: Student): boolean {
  if (!payment || !student) return false;
  
  // 1. Direct ID match
  if (payment.studentId && student.id && payment.studentId === student.id) {
    return true;
  }
  
  // 2. Direct NISN match (if valid length >= 4)
  if (payment.nisn && student.nisn) {
    const pNisn = payment.nisn.trim().toLowerCase();
    const sNisn = student.nisn.trim().toLowerCase();
    if (pNisn.length >= 4 && pNisn === sNisn) {
      return true;
    }
  }

  // 3. Direct NIS match (if valid length >= 2)
  if (payment.nis && student.nis) {
    const pNis = payment.nis.trim().toLowerCase();
    const sNis = student.nis.trim().toLowerCase();
    if (pNis.length >= 2 && pNis === sNis) {
      return true;
    }
  }

  // 4. Normalized Name & Class match
  const normPName = normalizeStudentSearchString(payment.studentName);
  const normSName = normalizeStudentSearchString(student.name);
  if (normPName && normSName && normPName === normSName) {
    const normPClass = normalizeClassName(payment.className);
    const normSClass = normalizeClassName(student.className);
    if (!normPClass || !normSClass || normPClass === normSClass) {
      return true;
    }
    if (getGradeFromClassName(payment.className) === getGradeFromClassName(student.className)) {
      return true;
    }
    return true; // Name match takes precedence
  }

  return false;
}

/**
 * Filters all valid (non-cancelled) payments belonging to a student.
 */
export function filterPaymentsForStudent(
  payments: PaymentTransaction[],
  student: Student
): PaymentTransaction[] {
  if (!student || !payments || !Array.isArray(payments)) return [];
  return payments.filter(
    p => isPaymentForStudent(p, student) && p.status !== 'Dibatalkan'
  );
}

export interface SyncPaymentResult {
  updatedPayments: PaymentTransaction[];
  syncedCount: number;
  alreadySyncedCount: number;
  unmatchedCount: number;
  details: Array<{
    paymentId: string;
    invoiceNumber: string;
    oldStudentId: string;
    newStudentId: string;
    studentName: string;
    className: string;
    amount: number;
    matchReason: string;
  }>;
}

/**
 * Permanently re-maps and synchronizes payment records to the current student list.
 * Fixes broken relationships when students are deleted and re-imported with new IDs.
 */
export function syncPaymentsWithStudents(
  payments: PaymentTransaction[],
  students: Student[]
): SyncPaymentResult {
  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return { updatedPayments: [], syncedCount: 0, alreadySyncedCount: 0, unmatchedCount: 0, details: [] };
  }
  if (!students || !Array.isArray(students) || students.length === 0) {
    return { updatedPayments: payments, syncedCount: 0, alreadySyncedCount: 0, unmatchedCount: payments.length, details: [] };
  }

  let syncedCount = 0;
  let alreadySyncedCount = 0;
  let unmatchedCount = 0;
  const details: SyncPaymentResult['details'] = [];

  const studentMapById = new Map<string, Student>();
  students.forEach(s => {
    if (s.id) studentMapById.set(s.id, s);
  });

  const updatedPayments = payments.map(p => {
    // 1. Direct ID match already exists
    if (p.studentId && studentMapById.has(p.studentId)) {
      const currentStudent = studentMapById.get(p.studentId)!;
      alreadySyncedCount++;
      return {
        ...p,
        studentName: currentStudent.name || p.studentName,
        className: currentStudent.className || p.className,
        nisn: currentStudent.nisn || p.nisn,
        nis: currentStudent.nis || p.nis
      };
    }

    // 2. Find matching student from current students
    let matchedStudent: Student | undefined;
    let matchReason = '';

    // A. Match by NISN
    if (p.nisn && p.nisn.trim().length >= 4) {
      const targetNisn = p.nisn.trim().toLowerCase();
      matchedStudent = students.find(s => s.nisn && s.nisn.trim().toLowerCase() === targetNisn);
      if (matchedStudent) matchReason = `NISN: ${p.nisn}`;
    }

    // B. Match by NIS
    if (!matchedStudent && p.nis && p.nis.trim().length >= 2) {
      const targetNis = p.nis.trim().toLowerCase();
      matchedStudent = students.find(s => s.nis && s.nis.trim().toLowerCase() === targetNis);
      if (matchedStudent) matchReason = `NIS: ${p.nis}`;
    }

    // C. Match by Exact Name + Class
    const normPName = normalizeStudentSearchString(p.studentName);
    const normPClass = normalizeClassName(p.className);

    if (!matchedStudent && normPName) {
      matchedStudent = students.find(s => {
        const normSName = normalizeStudentSearchString(s.name);
        const normSClass = normalizeClassName(s.className);
        return normSName === normPName && (!normPClass || !normSClass || normPClass === normSClass);
      });
      if (matchedStudent) matchReason = `Nama & Kelas: ${matchedStudent.name} (${matchedStudent.className})`;
    }

    // D. Match by Exact Name
    if (!matchedStudent && normPName) {
      const candidateList = students.filter(s => normalizeStudentSearchString(s.name) === normPName);
      if (candidateList.length === 1) {
        matchedStudent = candidateList[0];
        matchReason = `Nama Siswa Sesuai: ${matchedStudent.name}`;
      } else if (candidateList.length > 1 && p.className) {
        const candidateInGrade = candidateList.find(s => getGradeFromClassName(s.className) === getGradeFromClassName(p.className));
        if (candidateInGrade) {
          matchedStudent = candidateInGrade;
          matchReason = `Nama & Tingkat Kelas: ${matchedStudent.name} (${matchedStudent.className})`;
        }
      }
    }

    // E. Match by partial / fuzzy name
    if (!matchedStudent && normPName && normPName.length >= 4) {
      const candidateList = students.filter(s => {
        const normSName = normalizeStudentSearchString(s.name);
        return normSName.includes(normPName) || normPName.includes(normSName);
      });
      if (candidateList.length === 1) {
        matchedStudent = candidateList[0];
        matchReason = `Nama Siswa Mirip: ${matchedStudent.name}`;
      }
    }

    if (matchedStudent) {
      syncedCount++;
      details.push({
        paymentId: p.id,
        invoiceNumber: p.invoiceNumber || p.id,
        oldStudentId: p.studentId,
        newStudentId: matchedStudent.id,
        studentName: matchedStudent.name,
        className: matchedStudent.className,
        amount: p.amount,
        matchReason
      });

      return {
        ...p,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        className: matchedStudent.className,
        nisn: matchedStudent.nisn || p.nisn,
        nis: matchedStudent.nis || p.nis
      };
    }

    unmatchedCount++;
    return p;
  });

  return {
    updatedPayments,
    syncedCount,
    alreadySyncedCount,
    unmatchedCount,
    details
  };
}

/**
 * Counts how many payments have orphaned studentIds that do not match the current student list.
 */
export function countUnsyncedPayments(
  payments: PaymentTransaction[],
  students: Student[]
): { orphanCount: number; fixableCount: number } {
  if (!payments || !students) return { orphanCount: 0, fixableCount: 0 };
  const studentIds = new Set(students.map(s => s.id));
  
  let orphanCount = 0;
  let fixableCount = 0;

  payments.forEach(p => {
    if (!studentIds.has(p.studentId)) {
      orphanCount++;
      const canFix = students.some(s => isPaymentForStudent(p, s));
      if (canFix) fixableCount++;
    }
  });

  return { orphanCount, fixableCount };
}

/**
 * Calculates complete student arrears summary, combining global tariffs,
 * active billing items, individual exemptions/discounts, and paid transactions.
 */
export function calculateStudentArrears(
  student: Student,
  payments: PaymentTransaction[],
  tariffs: FeeTariffSettings,
  billSettings: StudentBillSettings,
  academicYear?: string
): StudentArrearsSummary {
  const override: StudentBillOverride | undefined = billSettings.studentOverrides?.[student.id];
  const items: StudentArrearsItem[] = [];

  // Helper to find targetGrades of a standard billing item
  const getStandardItem = (id: string) => billSettings.standardBillingItems?.find(i => i.id === id || i.key === id);

  // Filter payments for this student using smart matching (exclude cancelled)
  const studentPayments = filterPaymentsForStudent(payments, student);

  // 1. SPP BULANAN
  const sppItem = getStandardItem('spp');
  const sppActive = (billSettings.activeObligations?.spp ?? true) && isStudentGradeMatching(student.className, sppItem?.targetGrades);
  let sppPaidMonthsCount = 0;
  let sppPaidMonthsList: string[] = [];
  let sppUnpaidMonthsList: string[] = [];
  const activeMonths = billSettings.sppMonthsBilled || DEFAULT_STUDENT_BILL_SETTINGS.sppMonthsBilled;

  if (sppActive) {
    if (override?.sppExempt) {
      sppPaidMonthsList = [...activeMonths];
      sppUnpaidMonthsList = [];
      items.push({
        id: 'item-spp',
        category: 'SPP',
        title: 'SPP Bulanan (12 Bulan)',
        description: 'Bebas Biaya (Beasiswa / Keringanan Khusus)',
        billAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        isPaid: true,
        statusLabel: 'Bebas Biaya',
        details: 'Diberikan Pembebasan SPP Penuh (Beasiswa / Keringanan)',
        paidMonths: activeMonths,
        unpaidMonths: []
      });
      sppPaidMonthsCount = activeMonths.length;
    } else {
      // Calculate effective monthly tariff for this student based on grade level
      const baseMonthly = getSppTariffForGrade(tariffs, student.className);
      let effectiveMonthly = baseMonthly;
      if (override?.sppDiscountPercent && override.sppDiscountPercent > 0) {
        effectiveMonthly = Math.max(0, effectiveMonthly * (1 - override.sppDiscountPercent / 100));
      }
      if (override?.sppDiscountFixed && override.sppDiscountFixed > 0) {
        effectiveMonthly = Math.max(0, effectiveMonthly - override.sppDiscountFixed);
      }

      const totalSppBill = effectiveMonthly * activeMonths.length;

      // SPP Payments
      const sppPayments = studentPayments.filter(p => p.category === 'SPP');
      const totalSppPaid = sppPayments.reduce((sum, p) => sum + p.amount, 0);

      // Determine which months are recorded as paid
      const paidMonthsSet = new Set<string>();
      sppPayments.forEach(p => {
        if (p.month) {
          activeMonths.forEach(m => {
            if (p.month!.toLowerCase().includes(m.toLowerCase()) || p.categoryLabel.toLowerCase().includes(m.toLowerCase())) {
              paidMonthsSet.add(m);
            }
          });
        } else if (p.categoryLabel) {
          activeMonths.forEach(m => {
            if (p.categoryLabel.toLowerCase().includes(m.toLowerCase())) {
              paidMonthsSet.add(m);
            }
          });
        }
      });

      // If months recorded explicitly count them, or deduce from amount paid
      let countFromAmount = effectiveMonthly > 0 ? Math.floor(totalSppPaid / effectiveMonthly) : activeMonths.length;
      if (countFromAmount > activeMonths.length) countFromAmount = activeMonths.length;

      const finalPaidMonths: string[] = [];
      const finalUnpaidMonths: string[] = [];

      activeMonths.forEach((m, idx) => {
        if (paidMonthsSet.has(m) || idx < countFromAmount) {
          finalPaidMonths.push(m);
        } else {
          finalUnpaidMonths.push(m);
        }
      });

      sppPaidMonthsList = finalPaidMonths;
      sppUnpaidMonthsList = finalUnpaidMonths;
      sppPaidMonthsCount = finalPaidMonths.length;
      const remainingSpp = Math.max(0, totalSppBill - totalSppPaid);
      const isPaid = remainingSpp === 0;

      let statusLabel: StudentArrearsItem['statusLabel'] = 'Belum Dibayar';
      if (isPaid) statusLabel = 'Lunas';
      else if (totalSppPaid > 0) statusLabel = 'Sebagian';

      const studentGrade = getGradeFromClassName(student.className);
      const details = isPaid
        ? `Lunas seluruh ${activeMonths.length} bulan (@Rp ${effectiveMonthly.toLocaleString('id-ID')})`
        : totalSppPaid > 0
        ? `Lunas ${finalPaidMonths.length} bulan. Menunggak ${finalUnpaidMonths.length} bulan (${finalUnpaidMonths.join(', ')})`
        : `Belum bayar ${activeMonths.length} bulan (Tingkat ${studentGrade}: @Rp ${effectiveMonthly.toLocaleString('id-ID')}/bln)`;

      items.push({
        id: 'item-spp',
        category: 'SPP',
        title: `SPP Bulanan (${activeMonths.length} Bulan)`,
        description: `Tarif Tingkat ${studentGrade}: Rp ${effectiveMonthly.toLocaleString('id-ID')}/bulan`,
        billAmount: totalSppBill,
        paidAmount: totalSppPaid,
        remainingAmount: remainingSpp,
        isPaid,
        statusLabel,
        details,
        paidMonths: finalPaidMonths,
        unpaidMonths: finalUnpaidMonths
      });
    }
  }

  // 2. INFAQ GEDUNG / PEMBANGUNAN
  const gedungItem = getStandardItem('gedung');
  if ((billSettings.activeObligations?.gedung ?? true) && isStudentGradeMatching(student.className, gedungItem?.targetGrades)) {
    if (override?.gedungExempt) {
      items.push({
        id: 'item-gedung',
        category: 'GEDUNG',
        title: 'Infaq Gedung / Pembangunan',
        description: 'Bebas Biaya (Keringanan 100%)',
        billAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        isPaid: true,
        statusLabel: 'Bebas Biaya',
        details: 'Diberikan Pembebasan Infaq Gedung Penuh (100%)'
      });
    } else {
      const originalBill = override?.gedungCustomAmount !== undefined ? override.gedungCustomAmount : (tariffs.uangGedung || 1200000);
      let bill = originalBill;
      let discountLabel = '';
      if (override?.gedungDiscountPercent && override.gedungDiscountPercent > 0) {
        bill = Math.max(0, Math.round(bill * (1 - override.gedungDiscountPercent / 100)));
        discountLabel = `Diskon ${override.gedungDiscountPercent}%`;
      }
      if (override?.gedungDiscountFixed && override.gedungDiscountFixed > 0) {
        bill = Math.max(0, bill - override.gedungDiscountFixed);
        discountLabel = discountLabel ? `${discountLabel} + Potongan Rp ${override.gedungDiscountFixed.toLocaleString('id-ID')}` : `Potongan Rp ${override.gedungDiscountFixed.toLocaleString('id-ID')}`;
      }

      const paid = studentPayments.filter(p => p.category === 'GEDUNG').reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, bill - paid);
      const isPaid = remaining === 0;

      items.push({
        id: 'item-gedung',
        category: 'GEDUNG',
        title: 'Infaq Gedung / Pembangunan',
        description: discountLabel ? `Tarif: Rp ${bill.toLocaleString('id-ID')} (${discountLabel})` : 'Biaya infaq sarana & prasarana madrasah',
        billAmount: bill,
        paidAmount: paid,
        remainingAmount: remaining,
        isPaid,
        statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
        details: isPaid
          ? (discountLabel ? `Lunas Sepenuhnya (${discountLabel})` : 'Lunas Sepenuhnya')
          : (paid > 0 ? `Telah diangsur Rp ${paid.toLocaleString('id-ID')}, sisa Rp ${remaining.toLocaleString('id-ID')}` : (discountLabel ? `Tarif diskon: Rp ${bill.toLocaleString('id-ID')} (Hemat Rp ${(originalBill - bill).toLocaleString('id-ID')})` : 'Belum ada pembayaran'))
      });
    }
  }

  // 3. UANG SERAGAM & ATRIBUT
  const seragamItem = getStandardItem('seragam');
  if ((billSettings.activeObligations?.seragam ?? true) && isStudentGradeMatching(student.className, seragamItem?.targetGrades)) {
    if (override?.seragamExempt) {
      items.push({
        id: 'item-seragam',
        category: 'SERAGAM',
        title: 'Uang Seragam & Atribut Sekolah',
        description: 'Bebas Biaya (Keringanan 100%)',
        billAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        isPaid: true,
        statusLabel: 'Bebas Biaya',
        details: 'Pembebasan Biaya Seragam Penuh (100%)'
      });
    } else {
      const originalBill = override?.seragamCustomAmount !== undefined ? override.seragamCustomAmount : (tariffs.uangSeragam || 650000);
      let bill = originalBill;
      let discountLabel = '';
      if (override?.seragamDiscountPercent && override.seragamDiscountPercent > 0) {
        bill = Math.max(0, Math.round(bill * (1 - override.seragamDiscountPercent / 100)));
        discountLabel = `Diskon ${override.seragamDiscountPercent}%`;
      }
      if (override?.seragamDiscountFixed && override.seragamDiscountFixed > 0) {
        bill = Math.max(0, bill - override.seragamDiscountFixed);
        discountLabel = discountLabel ? `${discountLabel} + Potongan Rp ${override.seragamDiscountFixed.toLocaleString('id-ID')}` : `Potongan Rp ${override.seragamDiscountFixed.toLocaleString('id-ID')}`;
      }

      const paid = studentPayments.filter(p => p.category === 'SERAGAM').reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, bill - paid);
      const isPaid = remaining === 0;

      items.push({
        id: 'item-seragam',
        category: 'SERAGAM',
        title: 'Uang Seragam & Atribut',
        description: discountLabel ? `Tarif: Rp ${bill.toLocaleString('id-ID')} (${discountLabel})` : 'Paket seragam batik, olahraga, dan atribut madrasah',
        billAmount: bill,
        paidAmount: paid,
        remainingAmount: remaining,
        isPaid,
        statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
        details: isPaid
          ? (discountLabel ? `Lunas Sepenuhnya (${discountLabel})` : 'Lunas Sepenuhnya')
          : (paid > 0 ? `Telah diangsur Rp ${paid.toLocaleString('id-ID')}, sisa Rp ${remaining.toLocaleString('id-ID')}` : (discountLabel ? `Tarif diskon: Rp ${bill.toLocaleString('id-ID')} (Hemat Rp ${(originalBill - bill).toLocaleString('id-ID')})` : 'Belum ada pembayaran'))
      });
    }
  }

  // 4. BUKU & LKS
  const bukuItem = getStandardItem('buku');
  if ((billSettings.activeObligations?.buku ?? true) && isStudentGradeMatching(student.className, bukuItem?.targetGrades)) {
    if (override?.bukuExempt) {
      items.push({
        id: 'item-buku',
        category: 'BUKU',
        title: 'Uang Buku & Modul / LKS',
        description: 'Bebas Biaya (Keringanan 100%)',
        billAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        isPaid: true,
        statusLabel: 'Bebas Biaya',
        details: 'Pembebasan Biaya Buku Penuh (100%)'
      });
    } else {
      const originalBill = override?.bukuCustomAmount !== undefined ? override.bukuCustomAmount : (tariffs.uangBuku || 400000);
      let bill = originalBill;
      let discountLabel = '';
      if (override?.bukuDiscountPercent && override.bukuDiscountPercent > 0) {
        bill = Math.max(0, Math.round(bill * (1 - override.bukuDiscountPercent / 100)));
        discountLabel = `Diskon ${override.bukuDiscountPercent}%`;
      }
      if (override?.bukuDiscountFixed && override.bukuDiscountFixed > 0) {
        bill = Math.max(0, bill - override.bukuDiscountFixed);
        discountLabel = discountLabel ? `${discountLabel} + Potongan Rp ${override.bukuDiscountFixed.toLocaleString('id-ID')}` : `Potongan Rp ${override.bukuDiscountFixed.toLocaleString('id-ID')}`;
      }

      const paid = studentPayments.filter(p => p.category === 'BUKU').reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, bill - paid);
      const isPaid = remaining === 0;

      items.push({
        id: 'item-buku',
        category: 'BUKU',
        title: 'Uang Buku & Modul Pembelajaran / LKS',
        description: discountLabel ? `Tarif: Rp ${bill.toLocaleString('id-ID')} (${discountLabel})` : 'Modul materi & lembar kerja siswa satu tahun',
        billAmount: bill,
        paidAmount: paid,
        remainingAmount: remaining,
        isPaid,
        statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
        details: isPaid
          ? (discountLabel ? `Lunas Sepenuhnya (${discountLabel})` : 'Lunas Sepenuhnya')
          : (paid > 0 ? `Telah diangsur Rp ${paid.toLocaleString('id-ID')}, sisa Rp ${remaining.toLocaleString('id-ID')}` : (discountLabel ? `Tarif diskon: Rp ${bill.toLocaleString('id-ID')} (Hemat Rp ${(originalBill - bill).toLocaleString('id-ID')})` : 'Belum ada pembayaran'))
      });
    }
  }

  // 5. BIAYA PTS (Penilaian Tengah Semester)
  const ptsItem = getStandardItem('pts');
  if ((billSettings.activeObligations?.pts ?? true) && isStudentGradeMatching(student.className, ptsItem?.targetGrades)) {
    if (override?.ptsExempt) {
      items.push({
        id: 'item-pts',
        category: 'PTS',
        title: 'Biaya Penilaian Tengah Semester (PTS)',
        description: 'Bebas Biaya (Keringanan 100%)',
        billAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        isPaid: true,
        statusLabel: 'Bebas Biaya',
        details: 'Pembebasan Biaya Ujian PTS (100%)'
      });
    } else {
      const originalBill = override?.ptsCustomAmount !== undefined ? override.ptsCustomAmount : (tariffs.biayaPTS || 150000);
      let bill = originalBill;
      let discountLabel = '';
      if (override?.ptsDiscountPercent && override.ptsDiscountPercent > 0) {
        bill = Math.max(0, Math.round(bill * (1 - override.ptsDiscountPercent / 100)));
        discountLabel = `Diskon ${override.ptsDiscountPercent}%`;
      }
      if (override?.ptsDiscountFixed && override.ptsDiscountFixed > 0) {
        bill = Math.max(0, bill - override.ptsDiscountFixed);
        discountLabel = discountLabel ? `${discountLabel} + Potongan Rp ${override.ptsDiscountFixed.toLocaleString('id-ID')}` : `Potongan Rp ${override.ptsDiscountFixed.toLocaleString('id-ID')}`;
      }

      const paid = studentPayments.filter(p => p.category === 'PTS').reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, bill - paid);
      const isPaid = remaining === 0;

      items.push({
        id: 'item-pts',
        category: 'PTS',
        title: 'Biaya Penilaian Tengah Semester (PTS)',
        description: discountLabel ? `Tarif: Rp ${bill.toLocaleString('id-ID')} (${discountLabel})` : 'Pelaksanaan asesmen & naskah ujian PTS',
        billAmount: bill,
        paidAmount: paid,
        remainingAmount: remaining,
        isPaid,
        statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
        details: isPaid
          ? (discountLabel ? `Lunas Sepenuhnya (${discountLabel})` : 'Lunas Sepenuhnya')
          : (paid > 0 ? `Telah dibayar Rp ${paid.toLocaleString('id-ID')}, sisa Rp ${remaining.toLocaleString('id-ID')}` : (discountLabel ? `Tarif diskon: Rp ${bill.toLocaleString('id-ID')} (Hemat Rp ${(originalBill - bill).toLocaleString('id-ID')})` : 'Belum dibayar'))
      });
    }
  }

  // 6. BIAYA SAS (Sumatif Akhir Semester)
  const sasItem = getStandardItem('sas');
  if ((billSettings.activeObligations?.sas ?? true) && isStudentGradeMatching(student.className, sasItem?.targetGrades)) {
    if (override?.sasExempt) {
      items.push({
        id: 'item-sas',
        category: 'SAS',
        title: 'Biaya Sumatif Akhir Semester (SAS / PAS)',
        description: 'Bebas Biaya (Keringanan 100%)',
        billAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        isPaid: true,
        statusLabel: 'Bebas Biaya',
        details: 'Pembebasan Biaya Ujian SAS (100%)'
      });
    } else {
      const originalBill = override?.sasCustomAmount !== undefined ? override.sasCustomAmount : (tariffs.biayaSAS || 200000);
      let bill = originalBill;
      let discountLabel = '';
      if (override?.sasDiscountPercent && override.sasDiscountPercent > 0) {
        bill = Math.max(0, Math.round(bill * (1 - override.sasDiscountPercent / 100)));
        discountLabel = `Diskon ${override.sasDiscountPercent}%`;
      }
      if (override?.sasDiscountFixed && override.sasDiscountFixed > 0) {
        bill = Math.max(0, bill - override.sasDiscountFixed);
        discountLabel = discountLabel ? `${discountLabel} + Potongan Rp ${override.sasDiscountFixed.toLocaleString('id-ID')}` : `Potongan Rp ${override.sasDiscountFixed.toLocaleString('id-ID')}`;
      }

      const paid = studentPayments.filter(p => p.category === 'SAS').reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, bill - paid);
      const isPaid = remaining === 0;

      items.push({
        id: 'item-sas',
        category: 'SAS',
        title: 'Biaya Sumatif Akhir Semester (SAS / PAS)',
        description: discountLabel ? `Tarif: Rp ${bill.toLocaleString('id-ID')} (${discountLabel})` : 'Pelaksanaan asesmen & evaluasi akhir semester',
        billAmount: bill,
        paidAmount: paid,
        remainingAmount: remaining,
        isPaid,
        statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
        details: isPaid
          ? (discountLabel ? `Lunas Sepenuhnya (${discountLabel})` : 'Lunas Sepenuhnya')
          : (paid > 0 ? `Telah dibayar Rp ${paid.toLocaleString('id-ID')}, sisa Rp ${remaining.toLocaleString('id-ID')}` : (discountLabel ? `Tarif diskon: Rp ${bill.toLocaleString('id-ID')} (Hemat Rp ${(originalBill - bill).toLocaleString('id-ID')})` : 'Belum dibayar'))
      });
    }
  }

  // 7. BIAYA DAT (Dana Akhir Tahun)
  const datItem = getStandardItem('dat');
  if ((billSettings.activeObligations?.dat ?? true) && isStudentGradeMatching(student.className, datItem?.targetGrades)) {
    if (override?.datExempt) {
      items.push({
        id: 'item-dat',
        category: 'DAT',
        title: 'Biaya Dana Akhir Tahun (DAT / PAT)',
        description: 'Bebas Biaya (Keringanan 100%)',
        billAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        isPaid: true,
        statusLabel: 'Bebas Biaya',
        details: 'Pembebasan Biaya DAT (100%)'
      });
    } else {
      const originalBill = override?.datCustomAmount !== undefined ? override.datCustomAmount : (tariffs.biayaDAT || 250000);
      let bill = originalBill;
      let discountLabel = '';
      if (override?.datDiscountPercent && override.datDiscountPercent > 0) {
        bill = Math.max(0, Math.round(bill * (1 - override.datDiscountPercent / 100)));
        discountLabel = `Diskon ${override.datDiscountPercent}%`;
      }
      if (override?.datDiscountFixed && override.datDiscountFixed > 0) {
        bill = Math.max(0, bill - override.datDiscountFixed);
        discountLabel = discountLabel ? `${discountLabel} + Potongan Rp ${override.datDiscountFixed.toLocaleString('id-ID')}` : `Potongan Rp ${override.datDiscountFixed.toLocaleString('id-ID')}`;
      }

      const paid = studentPayments.filter(p => p.category === 'DAT').reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, bill - paid);
      const isPaid = remaining === 0;

      items.push({
        id: 'item-dat',
        category: 'DAT',
        title: 'Biaya Dana Akhir Tahun (DAT / PAT)',
        description: discountLabel ? `Tarif: Rp ${bill.toLocaleString('id-ID')} (${discountLabel})` : 'Biaya evaluasi kenaikan kelas / kelulusan',
        billAmount: bill,
        paidAmount: paid,
        remainingAmount: remaining,
        isPaid,
        statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
        details: isPaid
          ? (discountLabel ? `Lunas Sepenuhnya (${discountLabel})` : 'Lunas Sepenuhnya')
          : (paid > 0 ? `Telah dibayar Rp ${paid.toLocaleString('id-ID')}, sisa Rp ${remaining.toLocaleString('id-ID')}` : (discountLabel ? `Tarif diskon: Rp ${bill.toLocaleString('id-ID')} (Hemat Rp ${(originalBill - bill).toLocaleString('id-ID')})` : 'Belum dibayar'))
      });
    }
  }

  // 7.5 DYNAMIC / CUSTOM STANDARD BILLING ITEMS (Added by school/bendahara)
  if (billSettings.standardBillingItems && Array.isArray(billSettings.standardBillingItems)) {
    billSettings.standardBillingItems.forEach(sItem => {
      const isBuiltInKey = ['spp', 'gedung', 'seragam', 'buku', 'pts', 'sas', 'dat'].includes(sItem.id);
      if (!isBuiltInKey) {
        const isObligationActive = sItem.isActive && (billSettings.activeObligations?.[sItem.id] ?? true) && isStudentGradeMatching(student.className, sItem.targetGrades);
        if (isObligationActive) {
          const bill = sItem.defaultAmount || 0;
          const paid = studentPayments.filter(p =>
            (p.category === sItem.category) ||
            (p.categoryLabel && p.categoryLabel.toLowerCase().includes(sItem.name.toLowerCase())) ||
            (p.notes && p.notes.toLowerCase().includes(sItem.name.toLowerCase()))
          ).reduce((sum, p) => sum + p.amount, 0);

          const remaining = Math.max(0, bill - paid);
          const isPaid = remaining === 0;

          items.push({
            id: `std-${sItem.id}`,
            category: sItem.category || 'LAINNYA',
            title: sItem.name,
            description: sItem.description || `Tarif: Rp ${bill.toLocaleString('id-ID')} (${sItem.frequency || 'Sekali Bayar'})`,
            billAmount: bill,
            paidAmount: paid,
            remainingAmount: remaining,
            isPaid,
            statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
            details: isPaid
              ? 'Lunas Sepenuhnya'
              : (paid > 0 ? `Telah dibayar Rp ${paid.toLocaleString('id-ID')}, sisa Rp ${remaining.toLocaleString('id-ID')}` : `Kewajiban standar: Rp ${bill.toLocaleString('id-ID')}`)
          });
        }
      }
    });
  }

  // 8. CUSTOM EXTRA BILLS (Global or per Class or specific student)
  if (billSettings.customBills && Array.isArray(billSettings.customBills)) {
    billSettings.customBills.forEach(cb => {
      // Check if applies to this student
      const matchClass = !cb.targetClass || cb.targetClass === 'ALL' || cb.targetClass === student.className;
      const matchStudent = !cb.targetStudentIds || cb.targetStudentIds.length === 0 || cb.targetStudentIds.includes(student.id);

      if (matchClass && matchStudent) {
        // Search payments with matching title in categoryLabel or notes
        const paid = studentPayments.filter(p => 
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(cb.title.toLowerCase())) ||
          (p.notes && p.notes.toLowerCase().includes(cb.title.toLowerCase()))
        ).reduce((sum, p) => sum + p.amount, 0);

        const remaining = Math.max(0, cb.amount - paid);
        const isPaid = remaining === 0;

        items.push({
          id: `custom-${cb.id}`,
          category: cb.category || 'KEGIATAN',
          title: cb.title,
          description: cb.description || 'Tagihan khusus kegiatan madrasah',
          billAmount: cb.amount,
          paidAmount: paid,
          remainingAmount: remaining,
          isPaid,
          statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
          details: isPaid ? 'Lunas Sepenuhnya' : (paid > 0 ? `Telah dibayar Rp ${paid.toLocaleString('id-ID')}` : `Batas waktu: ${cb.dueDate || 'Sesuai jadwal'}`)
        });
      }
    });
  }

  // 9. INDIVIDUAL SPECIFIC BILLS FOR THIS STUDENT
  if (override?.individualBills && Array.isArray(override.individualBills)) {
    override.individualBills.forEach(ib => {
      const paid = studentPayments.filter(p =>
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(ib.title.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(ib.title.toLowerCase()))
      ).reduce((sum, p) => sum + p.amount, 0);

      const remaining = Math.max(0, ib.amount - paid);
      const isPaid = remaining === 0;

      items.push({
        id: `indiv-${ib.id}`,
        category: 'LAINNYA',
        title: ib.title,
        description: ib.description || 'Tagihan khusus siswa',
        billAmount: ib.amount,
        paidAmount: paid,
        remainingAmount: remaining,
        isPaid,
        statusLabel: isPaid ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Dibayar'),
        details: isPaid ? 'Lunas' : `Sisa Rp ${remaining.toLocaleString('id-ID')}`
      });
    });
  }

  // Calculate totals
  const totalBill = items.reduce((sum, it) => sum + it.billAmount, 0);
  const totalPaid = items.reduce((sum, it) => sum + it.paidAmount, 0);
  const totalRemaining = items.reduce((sum, it) => sum + it.remainingAmount, 0);
  const isAllPaid = totalRemaining === 0;

  // Find last payment date
  const lastPayment = studentPayments.length > 0 ? studentPayments[0].paymentDate : undefined;

  return {
    student,
    totalBill,
    totalPaid,
    totalRemaining,
    isAllPaid,
    items,
    sppPaidMonthsCount,
    sppTotalMonthsCount: activeMonths.length,
    sppPaidMonths: sppPaidMonthsList,
    sppUnpaidMonths: sppUnpaidMonthsList,
    lastPaymentDate: lastPayment
  };
}

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Pengisian Presensi & Jurnal KBM Tepat Waktu',
    message: 'Bapak/Ibu Dewan Guru dimohon untuk selalu mengisi presensi kehadiran siswa dan jurnal mengajar di setiap jam pelajaran berlangsung untuk kelancaran pelaporan.',
    type: 'important',
    targetAudience: 'all',
    createdAt: new Date().toISOString(),
    authorName: 'Admin Sekolah',
    active: true
  }
];

export function getStoredAnnouncements(schoolId?: SchoolId): Announcement[] {
  const activeId = schoolId || getActiveSchoolId();
  const key = getSchoolStorageKey('announcements', activeId);
  try {
    const raw = safeLocalStorageGet(key);
    if (!raw) return DEFAULT_ANNOUNCEMENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ANNOUNCEMENTS;
  } catch {
    return DEFAULT_ANNOUNCEMENTS;
  }
}

export function saveAnnouncements(announcements: Announcement[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const key = getSchoolStorageKey('announcements', activeId);
  try {
    safeLocalStorageSet(key, JSON.stringify(announcements));
  } catch (e) {
    console.error('Failed to save announcements to localStorage', e);
  }
}

/**
 * Creates a comprehensive DatabaseBackupData package for export or snapshot.
 */
export function createDatabaseBackupObject(
  schoolId: SchoolId = getActiveSchoolId(),
  liveData?: Partial<DatabaseBackupData>,
  type: 'full' | 'finance' | 'academic' | 'master' = 'full'
): DatabaseBackupData {
  const schoolConfig = getSchoolConfig(schoolId);
  const academic = getAcademicSettings();

  const students = liveData?.students || getStoredStudents(schoolId);
  const teachers = liveData?.teachers || getStoredTeachers(schoolId);
  const subjects = liveData?.subjects || getStoredSubjects(schoolId);
  const schoolOfficials = liveData?.schoolOfficials || getStoredSchoolOfficials(schoolId);
  const classWaliKelas = liveData?.classWaliKelas || getStoredClassWaliKelas(schoolId);
  const sessions = liveData?.sessions || getStoredSessions(schoolId);
  const grades = liveData?.grades || getStoredGrades(schoolId);
  const lessonPlans = liveData?.lessonPlans || getStoredLessonPlans(schoolId);
  const violations = liveData?.violations || getStoredViolations(schoolId);
  const payments = liveData?.payments || getStoredPayments(schoolId);
  const cashDeposits = liveData?.cashDeposits || getStoredCashDeposits(schoolId);
  const treasurerExpenses = liveData?.treasurerExpenses || getStoredExpenses(schoolId);
  const feeTariffs = liveData?.feeTariffs || getStoredFeeTariffs(schoolId);
  const studentBillSettings = liveData?.studentBillSettings || getStoredStudentBillSettings(schoolId);
  const adminSettings = liveData?.adminSettings || getStoredAdminSettings();
  const schedules = liveData?.schedules || getStoredSchedules(schoolId);
  const announcements = liveData?.announcements || getStoredAnnouncements(schoolId);
  const suratKeluar = liveData?.suratKeluar || getStoredSuratKeluar(schoolId);
  const suratMasuk = liveData?.suratMasuk || getStoredSuratMasuk(schoolId);
  const examEvents = liveData?.examEvents || getStoredExamEvents(schoolId);
  const examRooms = liveData?.examRooms || getStoredExamRooms(schoolId);
  const examSchedules = liveData?.examSchedules || getStoredExamSchedules(schoolId);
  const curriculumSettings = liveData?.curriculumSettings || getStoredCurriculumSettings(schoolId);

  const counts: DatabaseBackupCounts = {
    students: students.length,
    teachers: teachers.length,
    subjects: subjects.length,
    sessions: sessions.length,
    grades: grades.length,
    lessonPlans: lessonPlans.length,
    violations: violations.length,
    payments: payments.length,
    cashDeposits: cashDeposits.length,
    treasurerExpenses: treasurerExpenses.length,
    schedules: schedules.length,
    announcements: announcements.length,
    suratKeluar: suratKeluar.length,
    suratMasuk: suratMasuk.length,
    examEvents: examEvents.length,
    examRooms: examRooms.length,
    examSchedules: examSchedules.length
  };

  const backup: DatabaseBackupData = {
    metadata: {
      version: '1.0.0',
      appVersion: '2026.1',
      timestamp: new Date().toISOString(),
      schoolId,
      schoolName: schoolConfig.name,
      academicYear: academic.academicYear,
      semester: academic.semester,
      generatedBy: 'Super Admin Portal',
      type,
      counts
    }
  };

  if (type === 'full' || type === 'master') {
    backup.students = students;
    backup.teachers = teachers;
    backup.subjects = subjects;
    backup.schoolOfficials = schoolOfficials;
    backup.classWaliKelas = classWaliKelas;
    backup.adminSettings = adminSettings;
    backup.suratKeluar = suratKeluar;
    backup.suratMasuk = suratMasuk;
    backup.curriculumSettings = curriculumSettings;
  }

  if (type === 'full' || type === 'finance') {
    backup.payments = payments;
    backup.cashDeposits = cashDeposits;
    backup.treasurerExpenses = treasurerExpenses;
    backup.feeTariffs = feeTariffs;
    backup.studentBillSettings = studentBillSettings;
  }

  if (type === 'full' || type === 'academic') {
    backup.sessions = sessions;
    backup.grades = grades;
    backup.lessonPlans = lessonPlans;
    backup.violations = violations;
    backup.schedules = schedules;
    backup.announcements = announcements;
    backup.examEvents = examEvents;
    backup.examRooms = examRooms;
    backup.examSchedules = examSchedules;
    backup.curriculumSettings = curriculumSettings;
    backup.academicSettings = academic;
  }

  return backup;
}

/**
 * Saves all records from a backup object to localStorage for the target school.
 */
export function saveFullDatabaseToLocalStorage(data: DatabaseBackupData, schoolId: SchoolId = getActiveSchoolId()): void {
  try {
    if (data.students) saveStudents(data.students, schoolId);
    if (data.teachers) saveTeachers(data.teachers, schoolId);
    if (data.subjects) saveSubjects(data.subjects, schoolId);
    if (data.schoolOfficials) saveSchoolOfficials(data.schoolOfficials, schoolId);
    if (data.classWaliKelas) saveClassWaliKelas(data.classWaliKelas, schoolId);
    if (data.sessions) saveSessions(data.sessions, schoolId);
    if (data.grades) saveGrades(data.grades, schoolId);
    if (data.lessonPlans) saveLessonPlans(data.lessonPlans, schoolId);
    if (data.violations) saveViolations(data.violations, schoolId);
    if (data.payments) savePayments(data.payments, schoolId);
    if (data.cashDeposits) saveCashDeposits(data.cashDeposits, schoolId);
    if (data.treasurerExpenses) saveExpenses(data.treasurerExpenses, schoolId);
    if (data.feeTariffs) saveFeeTariffs(data.feeTariffs, schoolId);
    if (data.studentBillSettings) saveStudentBillSettings(data.studentBillSettings, schoolId);
    if (data.adminSettings) saveAdminSettings(data.adminSettings);
    if (data.schedules) saveSchedules(data.schedules, schoolId);
    if (data.announcements) saveAnnouncements(data.announcements, schoolId);
    if (data.suratKeluar) saveSuratKeluar(data.suratKeluar, schoolId);
    if (data.suratMasuk) saveSuratMasuk(data.suratMasuk, schoolId);
    if (data.examEvents) saveExamEvents(data.examEvents, schoolId);
    if (data.examRooms) saveExamRooms(data.examRooms, schoolId);
    if (data.examSchedules) saveExamSchedules(data.examSchedules, schoolId);
    if (data.curriculumSettings) saveCurriculumSettings(data.curriculumSettings, schoolId);
    if (data.academicSettings) {
      saveAcademicSettings({
        academicYear: data.academicSettings.academicYear,
        semester: (data.academicSettings.semester as 'Semester Ganjil' | 'Semester Genap') || 'Semester Ganjil'
      });
    }
  } catch (e) {
    console.error('Failed to restore database to localStorage', e);
  }
}

const SNAPSHOTS_KEY_PREFIX = 'mts_db_snapshots_';

/**
 * Retrieves list of locally saved browser snapshots for a school.
 */
export function getStoredDatabaseSnapshots(schoolId: SchoolId = getActiveSchoolId()): DatabaseBackupData[] {
  try {
    const raw = safeLocalStorageGet(`${SNAPSHOTS_KEY_PREFIX}${schoolId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Stores a quick browser snapshot (keeps up to 2 latest snapshots to preserve quota).
 */
export function saveStoredDatabaseSnapshot(snapshot: DatabaseBackupData, schoolId: SchoolId = getActiveSchoolId()): void {
  try {
    const list = getStoredDatabaseSnapshots(schoolId);
    const updated = [snapshot, ...list.filter(s => s.metadata.timestamp !== snapshot.metadata.timestamp)].slice(0, 2);
    safeLocalStorageSet(`${SNAPSHOTS_KEY_PREFIX}${schoolId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save browser snapshot', e);
  }
}

/**
 * Deletes a snapshot by its timestamp.
 */
export function deleteStoredDatabaseSnapshot(timestamp: string, schoolId: SchoolId = getActiveSchoolId()): void {
  try {
    const list = getStoredDatabaseSnapshots(schoolId);
    const updated = list.filter(s => s.metadata.timestamp !== timestamp);
    safeLocalStorageSet(`${SNAPSHOTS_KEY_PREFIX}${schoolId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete snapshot', e);
  }
}

// ==========================================
// INVENTORY & STOCK MANAGEMENT (LKS, ATRIBUT, SERAGAM)
// ==========================================

export function getStoredInventory(schoolId?: SchoolId): InventoryItem[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('inventory_items', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) {
      const parsed: InventoryItem[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Return default initial inventory items
    return INITIAL_INVENTORY_ITEMS;
  } catch (e) {
    console.error('Failed to load inventory from storage', e);
    return INITIAL_INVENTORY_ITEMS;
  }
}

export function saveInventory(items: InventoryItem[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('inventory_items', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save inventory to storage', e);
  }
}

export function getStoredInventoryLogs(schoolId?: SchoolId): InventoryMovementLog[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('inventory_logs', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (data) {
      const parsed: InventoryMovementLog[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Default sample initial logs
    const today = new Date().toISOString().split('T')[0];
    const initialLogs: InventoryMovementLog[] = [
      {
        id: 'invlog-sample-1',
        itemId: 'inv-srg-olr-m',
        itemCode: 'SRG-OLR-M',
        itemName: 'Baju Olahraga (Ukuran M)',
        category: 'SERAGAM',
        variantType: 'Baju Olahraga',
        size: 'M',
        movementType: 'OUT',
        quantity: 1,
        previousStock: 31,
        newStock: 30,
        unitPrice: 150000,
        totalPrice: 150000,
        studentId: 'stu-VIIA-1',
        studentName: 'ADAM MALIK',
        studentClass: 'VII A',
        invoiceNumber: 'KW/2026/08/004',
        treasurerName: 'Siti Rahmawati, S.E.',
        date: today,
        notes: 'Penyerahan Baju Olahraga M saat pembayaran uang seragam',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'invlog-sample-2',
        itemId: 'inv-srg-ktk-m',
        itemCode: 'SRG-KTK-M',
        itemName: 'Baju Kotak (Ukuran M)',
        category: 'SERAGAM',
        variantType: 'Baju Kotak',
        size: 'M',
        movementType: 'OUT',
        quantity: 1,
        previousStock: 27,
        newStock: 26,
        unitPrice: 120000,
        totalPrice: 120000,
        studentId: 'stu-VIIA-2',
        studentName: 'AISYAH PUTRI',
        studentClass: 'VII A',
        invoiceNumber: 'KW/2026/08/004',
        treasurerName: 'Siti Rahmawati, S.E.',
        date: today,
        notes: 'Penyerahan Baju Kotak M',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    return initialLogs;
  } catch (e) {
    console.error('Failed to load inventory logs', e);
    return [];
  }
}

export function saveInventoryLogs(logs: InventoryMovementLog[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('inventory_logs', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save inventory logs', e);
  }
}

/**
 * Automatically deducts stock when an item is sold / distributed upon payment.
 */
export function deductInventoryStock(
  itemId: string,
  quantity: number,
  metadata: {
    studentId?: string;
    studentName?: string;
    studentClass?: string;
    invoiceNumber?: string;
    paymentId?: string;
    treasurerName: string;
    notes?: string;
    date?: string;
  },
  schoolId?: SchoolId
): { success: boolean; item?: InventoryItem; log?: InventoryMovementLog; error?: string } {
  try {
    const currentInventory = getStoredInventory(schoolId);
    const targetItemIndex = currentInventory.findIndex(i => i.id === itemId || i.itemCode === itemId);

    if (targetItemIndex === -1) {
      return { success: false, error: `Item stok dengan ID/Kode '${itemId}' tidak ditemukan.` };
    }

    const targetItem = currentInventory[targetItemIndex];
    const prevStock = targetItem.currentStock;
    const qtyToDeduct = Math.max(1, quantity);
    const newStock = Math.max(0, prevStock - qtyToDeduct);
    const totalSold = (targetItem.totalSold || 0) + qtyToDeduct;

    const updatedItem: InventoryItem = {
      ...targetItem,
      currentStock: newStock,
      totalSold: totalSold,
      updatedAt: new Date().toISOString()
    };

    currentInventory[targetItemIndex] = updatedItem;
    saveInventory(currentInventory, schoolId);

    // Create movement log
    const logId = `invlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const movementLog: InventoryMovementLog = {
      id: logId,
      itemId: updatedItem.id,
      itemCode: updatedItem.itemCode,
      itemName: updatedItem.name,
      category: updatedItem.category,
      variantType: updatedItem.variantType,
      size: updatedItem.size,
      movementType: 'OUT',
      quantity: qtyToDeduct,
      previousStock: prevStock,
      newStock: newStock,
      unitPrice: updatedItem.unitPrice,
      totalPrice: updatedItem.unitPrice * qtyToDeduct,
      studentId: metadata.studentId,
      studentName: metadata.studentName,
      studentClass: metadata.studentClass,
      invoiceNumber: metadata.invoiceNumber,
      paymentId: metadata.paymentId,
      treasurerName: metadata.treasurerName,
      date: metadata.date || new Date().toISOString().split('T')[0],
      notes: metadata.notes || `Penjualan / Penyerahan ${updatedItem.name} (${qtyToDeduct} unit)`,
      createdAt: new Date().toISOString()
    };

    const currentLogs = getStoredInventoryLogs(schoolId);
    saveInventoryLogs([movementLog, ...currentLogs], schoolId);

    return { success: true, item: updatedItem, log: movementLog };
  } catch (e) {
    console.error('Error deducting inventory stock:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * Adds incoming stock (Restock)
 */
export function restockInventoryItem(
  itemId: string,
  quantity: number,
  metadata: {
    treasurerName: string;
    notes?: string;
    date?: string;
    unitPrice?: number;
  },
  schoolId?: SchoolId
): { success: boolean; item?: InventoryItem; log?: InventoryMovementLog } {
  try {
    const currentInventory = getStoredInventory(schoolId);
    const targetItemIndex = currentInventory.findIndex(i => i.id === itemId || i.itemCode === itemId);

    if (targetItemIndex === -1) {
      return { success: false };
    }

    const targetItem = currentInventory[targetItemIndex];
    const prevStock = targetItem.currentStock;
    const qtyToAdd = Math.max(1, quantity);
    const newStock = prevStock + qtyToAdd;
    const totalRestocked = (targetItem.totalRestocked || 0) + qtyToAdd;

    const updatedItem: InventoryItem = {
      ...targetItem,
      currentStock: newStock,
      totalRestocked: totalRestocked,
      unitPrice: metadata.unitPrice && metadata.unitPrice > 0 ? metadata.unitPrice : targetItem.unitPrice,
      updatedAt: new Date().toISOString()
    };

    currentInventory[targetItemIndex] = updatedItem;
    saveInventory(currentInventory, schoolId);

    // Log movement
    const logId = `invlog-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const movementLog: InventoryMovementLog = {
      id: logId,
      itemId: updatedItem.id,
      itemCode: updatedItem.itemCode,
      itemName: updatedItem.name,
      category: updatedItem.category,
      variantType: updatedItem.variantType,
      size: updatedItem.size,
      movementType: 'IN',
      quantity: qtyToAdd,
      previousStock: prevStock,
      newStock: newStock,
      unitPrice: updatedItem.unitPrice,
      totalPrice: updatedItem.unitPrice * qtyToAdd,
      treasurerName: metadata.treasurerName,
      date: metadata.date || new Date().toISOString().split('T')[0],
      notes: metadata.notes || `Penambahan Stok Masuk (${qtyToAdd} unit)`,
      createdAt: new Date().toISOString()
    };

    const currentLogs = getStoredInventoryLogs(schoolId);
    saveInventoryLogs([movementLog, ...currentLogs], schoolId);

    return { success: true, item: updatedItem, log: movementLog };
  } catch (e) {
    console.error('Error restocking inventory:', e);
    return { success: false };
  }
}

/**
 * Persuratan & Tata Usaha Storage Functions
 */
export function getStoredSuratKeluar(schoolId?: SchoolId): SuratKeluar[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('surat_keluar', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (!data) return INITIAL_SURAT_KELUAR;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_SURAT_KELUAR;

    // Migrate any legacy sample letters referencing Gresik / old principal
    const migrated = parsed.map((letter: SuratKeluar) => {
      if (letter.penandatanganNama === 'H. Moh. Nashir, S.Ag., M.Pd.I.') {
        return {
          ...letter,
          penandatanganNama: 'Dra. Hj. Nurjanah, M.Pd',
          penandatanganNip: '197208151998032001',
          isiSurat: letter.isiSurat
            .replace(/Manyar Gresik/g, 'Jakarta Barat')
            .replace(/Gresik/g, 'Jakarta Barat')
            .replace(/Hotel Pesona Gresik/g, 'Aula Kantor Kemenag Kota Jakarta Barat')
        };
      }
      return letter;
    });

    return migrated;
  } catch (e) {
    console.error('Failed to get stored surat keluar', e);
    return INITIAL_SURAT_KELUAR;
  }
}

export function saveSuratKeluar(letters: SuratKeluar[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('surat_keluar', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(letters));
  } catch (e) {
    console.error('Failed to save surat keluar', e);
  }
}

export function getStoredSuratMasuk(schoolId?: SchoolId): SuratMasuk[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('surat_masuk', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (!data) return INITIAL_SURAT_MASUK;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_SURAT_MASUK;

    // Migrate any legacy incoming sample letters referencing Gresik
    const migrated = parsed.map((letter: SuratMasuk) => {
      if (letter.pengirim && letter.pengirim.includes('Gresik')) {
        return {
          ...letter,
          pengirim: letter.pengirim.replace(/Kab\. Gresik/g, 'Kota Jakarta Barat').replace(/Gresik/g, 'Jakarta Barat'),
          disposisiCatatan: letter.disposisiCatatan?.replace(/MTsN 1 Gresik/g, 'MTsN 1 Jakarta Barat') || letter.disposisiCatatan
        };
      }
      return letter;
    });

    return migrated;
  } catch (e) {
    console.error('Failed to get stored surat masuk', e);
    return INITIAL_SURAT_MASUK;
  }
}

export function saveSuratMasuk(letters: SuratMasuk[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('surat_masuk', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(letters));
  } catch (e) {
    console.error('Failed to save surat masuk', e);
  }
}

/**
 * ============================================================================
 * KURIKULUM & MANAJEMEN KEGIATAN UJIAN (STS, SAS, AM, PTS, PAT)
 * ============================================================================
 */

export function getStoredExamEvents(schoolId?: SchoolId): ExamEvent[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('exam_events', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (!data) {
      return INITIAL_EXAM_EVENTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_EXAM_EVENTS;
  } catch (e) {
    console.error('Failed to get stored exam events', e);
    return INITIAL_EXAM_EVENTS;
  }
}

export function saveExamEvents(events: ExamEvent[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('exam_events', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save exam events', e);
  }
}

export function getStoredExamRooms(schoolId?: SchoolId): ExamRoom[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('exam_rooms', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (!data) {
      return INITIAL_EXAM_ROOMS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_EXAM_ROOMS;
  } catch (e) {
    console.error('Failed to get stored exam rooms', e);
    return INITIAL_EXAM_ROOMS;
  }
}

export function saveExamRooms(rooms: ExamRoom[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('exam_rooms', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(rooms));
  } catch (e) {
    console.error('Failed to save exam rooms', e);
  }
}

export function getStoredExamSchedules(schoolId?: SchoolId): ExamScheduleItem[] {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('exam_schedules', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (!data) {
      return INITIAL_EXAM_SCHEDULES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_EXAM_SCHEDULES;
  } catch (e) {
    console.error('Failed to get stored exam schedules', e);
    return INITIAL_EXAM_SCHEDULES;
  }
}

export function saveExamSchedules(schedules: ExamScheduleItem[], schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('exam_schedules', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(schedules));
  } catch (e) {
    console.error('Failed to save exam schedules', e);
  }
}

export function getStoredCurriculumSettings(schoolId?: SchoolId): CurriculumSettings {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('curriculum_settings', activeId);
  try {
    const data = safeLocalStorageGet(storageKey);
    if (!data) {
      return DEFAULT_CURRICULUM_SETTINGS;
    }
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' 
      ? { ...DEFAULT_CURRICULUM_SETTINGS, ...parsed }
      : DEFAULT_CURRICULUM_SETTINGS;
  } catch (e) {
    console.error('Failed to get stored curriculum settings', e);
    return DEFAULT_CURRICULUM_SETTINGS;
  }
}

export function saveCurriculumSettings(settings: CurriculumSettings, schoolId?: SchoolId): void {
  const activeId = schoolId || getActiveSchoolId();
  const storageKey = getSchoolStorageKey('curriculum_settings', activeId);
  try {
    safeLocalStorageSet(storageKey, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save curriculum settings', e);
  }
}

export function getStoredCurriculumPasscode(): string {
  try {
    const code = safeLocalStorageGet('kurikulum_access_passcode_v1');
    if (code) return code.trim();
    const adminData = safeLocalStorageGet('mts_manbaul_admin_settings_v1');
    if (adminData) {
      const parsed = JSON.parse(adminData);
      if (parsed?.kurikulumKodeUnik) return parsed.kurikulumKodeUnik.trim();
    }
  } catch (e) {
    console.error(e);
  }
  return 'KURIKULUM2026';
}

export function saveCurriculumPasscode(code: string): void {
  try {
    safeLocalStorageSet('kurikulum_access_passcode_v1', code.trim());
  } catch (e) {
    console.error(e);
  }
}






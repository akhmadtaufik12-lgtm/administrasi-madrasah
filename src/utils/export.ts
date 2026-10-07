import { AttendanceSession, Student, SchoolOfficials, KopSuratConfig } from '../types';
import { getStoredSchoolOfficials } from './storage';
import * as XLSX from 'xlsx';

export const DEFAULT_KOP_CONFIG: KopSuratConfig = {
  fontFamily: 'Arial',
  namaYayasanColor: '#1e293b',
  namaYayasanFontSize: 11,
  namaSekolahColor: '#047857',
  namaSekolahFontSize: 15,
  statusAkreditasiColor: '#334155',
  alamatColor: '#475569',
  kontakColor: '#64748b',
  layoutAlign: 'center',
  logoPosition: 'left',
  logoSize: 75,
  borderStyle: 'double',
  borderColor: '#000000',
  borderThickness: 3
};

/**
 * Standardized Official Letterhead (KOP SURAT) HTML Generator
 * Reads configuration and identity from SchoolOfficials to ensure 100% uniformity across all letters.
 */
export function renderKopSuratHtml(
  schoolOfficials?: SchoolOfficials,
  options?: {
    isSinglePage?: boolean;
    customConfig?: Partial<KopSuratConfig>;
    hideBorder?: boolean;
  }
): string {
  const isSinglePage = options?.isSinglePage ?? false;
  const cfg: KopSuratConfig = {
    ...DEFAULT_KOP_CONFIG,
    ...(schoolOfficials?.kopSuratConfig || {}),
    ...(options?.customConfig || {})
  };

  const namaYayasan = schoolOfficials?.namaYayasan || 'YAYASAN PENDIDIKAN MANBAUL ISLAM';
  const namaSekolah = schoolOfficials?.namaSekolah || "MADRASAH TSANAWIYAH MANBA'UL ISLAM";
  const statusSekolah = schoolOfficials?.statusSekolah || 'Swasta';
  const akreditasi = schoolOfficials?.akreditasi || 'A (Unggul)';
  const nsm = schoolOfficials?.nsm || '';
  const npsn = schoolOfficials?.npsn || '';

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

  const contactParts = [
    schoolOfficials?.teleponSekolah ? `Telp: ${schoolOfficials.teleponSekolah}` : '',
    schoolOfficials?.whatsappSekolah ? `WA: ${schoolOfficials.whatsappSekolah}` : '',
    schoolOfficials?.emailSekolah ? `Email: ${schoolOfficials.emailSekolah}` : '',
    schoolOfficials?.website ? `Web: ${schoolOfficials.website}` : ''
  ].filter(Boolean);
  const fullContacts = contactParts.join(' • ');

  const logoUrl = schoolOfficials?.logoUrl || '';
  const secondaryLogoUrl = cfg.secondaryLogoUrl || logoUrl;

  const baseLogoSize = cfg.logoSize || 75;
  const computedLogoSize = isSinglePage ? Math.max(45, Math.round(baseLogoSize * 0.85)) : baseLogoSize;

  const fontFam = cfg.fontFamily === 'Times New Roman'
    ? "'Times New Roman', Times, serif"
    : cfg.fontFamily === 'Bookman Old Style'
    ? "'Bookman Old Style', Georgia, serif"
    : cfg.fontFamily === 'Calibri'
    ? "Calibri, Arial, sans-serif"
    : cfg.fontFamily === 'Georgia'
    ? "Georgia, serif"
    : "Arial, Helvetica, sans-serif";

  const yayasanSize = isSinglePage 
    ? `${Math.max(8.5, (cfg.namaYayasanFontSize || 11) - 1.5)}pt` 
    : `${cfg.namaYayasanFontSize || 11}pt`;

  const sekolahSize = isSinglePage 
    ? `${Math.max(11, (cfg.namaSekolahFontSize || 15) - 2)}pt` 
    : `${cfg.namaSekolahFontSize || 15}pt`;

  const statusSize = isSinglePage ? '8pt' : '9pt';
  const alamatSize = isSinglePage ? '8pt' : '9pt';
  const kontakSize = isSinglePage ? '7.5pt' : '8.5pt';

  const textAlign = cfg.layoutAlign || 'center';
  const logoPos = cfg.logoPosition || 'left';
  const hasPrimaryLogo = Boolean(logoUrl && logoPos !== 'none');
  const hasSecondaryLogo = Boolean((secondaryLogoUrl || logoUrl) && logoPos === 'both');

  const primaryLogoImg = hasPrimaryLogo ? `
    <div style="width: ${computedLogoSize}px; height: ${computedLogoSize}px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
      <img src="${logoUrl}" alt="Logo" style="max-height: ${computedLogoSize}px; max-width: ${computedLogoSize}px; object-fit: contain;" />
    </div>
  ` : '';

  const secondaryLogoImg = hasSecondaryLogo ? `
    <div style="width: ${computedLogoSize}px; height: ${computedLogoSize}px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
      <img src="${secondaryLogoUrl || logoUrl}" alt="Logo 2" style="max-height: ${computedLogoSize}px; max-width: ${computedLogoSize}px; object-fit: contain;" />
    </div>
  ` : (hasPrimaryLogo && textAlign === 'center' && logoPos === 'left' ? `
    <div style="width: ${computedLogoSize}px; flex-shrink: 0;" class="kop-spacer"></div>
  ` : (hasPrimaryLogo && textAlign === 'center' && logoPos === 'right' ? '' : ''));

  const leftSpacerForRightLogo = (hasPrimaryLogo && textAlign === 'center' && logoPos === 'right') ? `
    <div style="width: ${computedLogoSize}px; flex-shrink: 0;" class="kop-spacer"></div>
  ` : '';

  // Text content block
  const textBlockHtml = `
    <div style="flex: 1; text-align: ${textAlign}; font-family: ${fontFam};">
      <div style="font-size: ${yayasanSize}; font-weight: bold; text-transform: uppercase; color: ${cfg.namaYayasanColor || '#1e293b'}; letter-spacing: 0.5px; line-height: 1.2;">
        ${namaYayasan}
      </div>
      <div style="font-size: ${sekolahSize}; font-weight: 900; text-transform: uppercase; color: ${cfg.namaSekolahColor || '#047857'}; margin-top: 2px; letter-spacing: 0.5px; line-height: 1.2;">
        ${namaSekolah}
      </div>
      <div style="font-size: ${statusSize}; font-weight: bold; color: ${cfg.statusAkreditasiColor || '#334155'}; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.3px;">
        STATUS: ${statusSekolah} • AKREDITASI: ${akreditasi} • NSM: ${nsm || '-'} • NPSN: ${npsn || '-'}
      </div>
      <div style="font-size: ${alamatSize}; color: ${cfg.alamatColor || '#475569'}; margin-top: 2px; line-height: 1.25;">
        ${fullAddress}
      </div>
      ${fullContacts ? `
        <div style="font-size: ${kontakSize}; color: ${cfg.kontakColor || '#64748b'}; margin-top: 2px; line-height: 1.2;">
          ${fullContacts}
        </div>
      ` : ''}
    </div>
  `;

  // Assemble Kop Header Layout
  let headerHtml = '';
  if (logoPos === 'top_center') {
    headerHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding-bottom: ${isSinglePage ? '4px' : '8px'};">
        ${hasPrimaryLogo ? primaryLogoImg : ''}
        ${textBlockHtml}
      </div>
    `;
  } else if (logoPos === 'right') {
    headerHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: ${isSinglePage ? '4px' : '8px'};">
        ${leftSpacerForRightLogo}
        ${textBlockHtml}
        ${primaryLogoImg}
      </div>
    `;
  } else if (logoPos === 'both') {
    headerHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: ${isSinglePage ? '4px' : '8px'};">
        ${primaryLogoImg}
        ${textBlockHtml}
        ${secondaryLogoImg}
      </div>
    `;
  } else if (logoPos === 'none') {
    headerHtml = `
      <div style="display: flex; align-items: center; justify-content: center; padding-bottom: ${isSinglePage ? '4px' : '8px'};">
        ${textBlockHtml}
      </div>
    `;
  } else {
    // default: logoPos === 'left'
    headerHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: ${isSinglePage ? '4px' : '8px'};">
        ${primaryLogoImg}
        ${textBlockHtml}
        ${secondaryLogoImg}
      </div>
    `;
  }

  // Border Below Kop
  let borderHtml = '';
  if (!options?.hideBorder && cfg.borderStyle !== 'none') {
    const borderColor = cfg.borderColor || '#000000';
    const borderThick = cfg.borderThickness || 3;
    const mb = isSinglePage ? '10px' : '16px';

    if (cfg.borderStyle === 'solid') {
      borderHtml = `<div style="border-bottom: ${borderThick}px solid ${borderColor}; margin-top: 4px; margin-bottom: ${mb};"></div>`;
    } else if (cfg.borderStyle === 'classic_double') {
      borderHtml = `
        <div style="border-bottom: ${borderThick}px solid ${borderColor}; margin-top: 3px;"></div>
        <div style="border-bottom: 1px solid ${borderColor}; margin-top: 2px; margin-bottom: ${mb};"></div>
      `;
    } else {
      // default: double
      borderHtml = `<div style="border-bottom: ${borderThick + 1}px double ${borderColor}; margin-top: 3px; margin-bottom: ${mb};"></div>`;
    }
  } else if (!options?.hideBorder) {
    borderHtml = `<div style="margin-bottom: ${isSinglePage ? '10px' : '16px'};"></div>`;
  }

  return `
    <!-- KOP SURAT RESMI LEMBAGA -->
    <div class="kop-surat-wrapper" style="width: 100%;">
      ${headerHtml}
      ${borderHtml}
    </div>
  `;
}

export function exportToCSV(filename: string, rows: (string | number)[][]): void {
  const processRow = (row: (string | number)[]) => {
    return row
      .map(val => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');
  };

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportToCsv = exportToCSV;

/**
 * Generate and download formatted Excel Template (.xlsx) matching EMIS 4.0 (Kemenag)
 * Format with columns:
 * No | Nama Lengkap | NISN | NIK | Tempat Lahir | Tanggal Lahir | Tingkat - Rombel | Umur | Status | Jenis Kelamin | Alamat | No Telepon | Kebutuhan Khusus | Disabilitas | Nomor KIP/PIP | Nama Ayah Kandung | Nama Ibu Kandung | Nama Wali
 */
export function downloadEmisStudentExcelTemplate(classList: string[] = ['VII A', 'VII B', 'VIII A', 'VIII B', 'IX A', 'IX B'], schoolName: string = 'Madrasah'): void {
  const sampleClass1 = classList[0] || 'VII A';
  const sampleClass2 = classList[1] || 'VII B';
  const sampleClass3 = classList.find(c => c.includes('9') || c.includes('IX')) || classList[classList.length - 1] || 'IX A';

  const data = [
    {
      'No': 1,
      'Nama Lengkap': 'NAURA YASMIN ZUFARANI',
      'NISN': '0109990877',
      'NIK': '3201044408110008',
      'Tempat Lahir': 'BOGOR',
      'Tanggal Lahir': '2011-08-04',
      'Tingkat - Rombel': `Kelas 9 - ${sampleClass3}`,
      'Umur': '15 th, 0 bln',
      'Status': 'Aktif',
      'Jenis Kelamin': 'Perempuan',
      'Alamat': 'Bojong jengkol SIDOHARJO, TEPUS, GUNUNGKIDUL, DAERAH ISTIMEWA YOGYAKARTA, 64836',
      'No Telepon': '081234567890',
      'Kebutuhan Khusus': '-',
      'Disabilitas': '-',
      'Nomor KIP/PIP': '-',
      'Nama Ayah Kandung': 'VERA',
      'Nama Ibu Kandung': 'SITI AMINAH',
      'Nama Wali': '-'
    },
    {
      'No': 2,
      'Nama Lengkap': 'AHMAD FAUZI RAHMAN',
      'NISN': '0098765432',
      'NIK': '3201041505100002',
      'Tempat Lahir': 'GUNUNGKIDUL',
      'Tanggal Lahir': '2012-05-15',
      'Tingkat - Rombel': `Kelas 7 - ${sampleClass1}`,
      'Umur': '14 th, 3 bln',
      'Status': 'Aktif',
      'Jenis Kelamin': 'Laki-laki',
      'Alamat': 'Jl. Raya Tepus No. 12, Tepus, Gunungkidul, D.I. Yogyakarta',
      'No Telepon': '085712345678',
      'Kebutuhan Khusus': '-',
      'Disabilitas': '-',
      'Nomor KIP/PIP': 'PIP-2026-00912',
      'Nama Ayah Kandung': 'RAHMAN SYAHPUTRA',
      'Nama Ibu Kandung': 'NURHAYATI',
      'Nama Wali': '-'
    },
    {
      'No': 3,
      'Nama Lengkap': 'AISYAH PUTRI AZZAHRA',
      'NISN': '0098765433',
      'NIK': '3201045209120003',
      'Tempat Lahir': 'YOGYAKARTA',
      'Tanggal Lahir': '2012-09-12',
      'Tingkat - Rombel': `Kelas 7 - ${sampleClass1}`,
      'Umur': '13 th, 11 bln',
      'Status': 'Aktif',
      'Jenis Kelamin': 'Perempuan',
      'Alamat': 'Dusun Bintaos, Sidoharjo, Tepus, Gunungkidul',
      'No Telepon': '081298765432',
      'Kebutuhan Khusus': '-',
      'Disabilitas': '-',
      'Nomor KIP/PIP': '-',
      'Nama Ayah Kandung': 'AGUS SETIAWAN',
      'Nama Ibu Kandung': 'RATNA JUWITA',
      'Nama Wali': '-'
    },
    {
      'No': 4,
      'Nama Lengkap': 'BAGUS DWI WICAKSONO',
      'NISN': '0098765434',
      'NIK': '3201041003110004',
      'Tempat Lahir': 'BANTUL',
      'Tanggal Lahir': '2011-03-10',
      'Tingkat - Rombel': `Kelas 8 - ${sampleClass2}`,
      'Umur': '15 th, 5 bln',
      'Status': 'Aktif',
      'Jenis Kelamin': 'Laki-laki',
      'Alamat': 'Jl. Pantai Baron Km. 3, Tepus, Gunungkidul',
      'No Telepon': '087811223344',
      'Kebutuhan Khusus': '-',
      'Disabilitas': '-',
      'Nomor KIP/PIP': '-',
      'Nama Ayah Kandung': 'WICAKSONO ADI',
      'Nama Ibu Kandung': 'TRI WAHYUNI',
      'Nama Wali': '-'
    },
    {
      'No': 5,
      'Nama Lengkap': 'CANTIKA DEWI LESTARI',
      'NISN': '0098765435',
      'NIK': '3201046111110005',
      'Tempat Lahir': 'SLEMAN',
      'Tanggal Lahir': '2011-11-21',
      'Tingkat - Rombel': `Kelas 8 - ${sampleClass2}`,
      'Umur': '14 th, 9 bln',
      'Status': 'Aktif',
      'Jenis Kelamin': 'Perempuan',
      'Alamat': 'Desa Purwodadi, Tepus, Gunungkidul, D.I. Yogyakarta',
      'No Telepon': '085888999000',
      'Kebutuhan Khusus': '-',
      'Disabilitas': '-',
      'Nomor KIP/PIP': 'PIP-2026-00984',
      'Nama Ayah Kandung': 'LESTARI BUDI',
      'Nama Ibu Kandung': 'DEWI ASTUTI',
      'Nama Wali': '-'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 28 }, // Nama Lengkap
    { wch: 16 }, // NISN
    { wch: 20 }, // NIK
    { wch: 18 }, // Tempat Lahir
    { wch: 14 }, // Tanggal Lahir
    { wch: 22 }, // Tingkat - Rombel
    { wch: 14 }, // Umur
    { wch: 12 }, // Status
    { wch: 14 }, // Jenis Kelamin
    { wch: 45 }, // Alamat
    { wch: 16 }, // No Telepon
    { wch: 18 }, // Kebutuhan Khusus
    { wch: 16 }, // Disabilitas
    { wch: 18 }, // Nomor KIP/PIP
    { wch: 22 }, // Nama Ayah Kandung
    { wch: 22 }, // Nama Ibu Kandung
    { wch: 20 }  // Nama Wali
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Siswa_EMIS4');

  // Petunjuk worksheet
  const instructionsData = [
    ['PANDUAN PENGISIAN & FORMAT HASIL DOWNLOAD EMIS 4.0 (KEMENAG)'],
    ['1. Format template ini 100% identik dengan hasil download data siswa dari EMIS 4.0 Kemenag.'],
    ['2. Anda dapat langsung mengunggah file Excel hasil export dari aplikasi EMIS 4.0 tanpa perlu mengubah kolom.'],
    ['3. Kolom "Nama Lengkap" dan "NISN" digunakan sebagai KUNCI IDENTIFIKASI UTAMA (Unique Key) saat sinkronisasi.'],
    ['4. Siswa yang memiliki NISN atau Nama yang cocok akan diperbarui otomatis tanpa merusak data presensi, nilai, atau tagihan.'],
    ['5. Kolom "Tingkat - Rombel" otomatis dideteksi rombel kelasnya (contoh: "Kelas 9 - 9-A1" atau "Kelas 7 - VII A").'],
    ['6. Kolom NIK, Tempat/Tanggal Lahir, Alamat, No Telepon, Jenis Kelamin, dan Nama Orang Tua otomatis masuk ke Buku Induk Siswa.'],
    ['7. Daftar rombel kelas aktif saat ini: ' + classList.join(', ')]
  ];
  const instrSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  instrSheet['!cols'] = [{ wch: 95 }];
  XLSX.utils.book_append_sheet(workbook, instrSheet, 'Petunjuk_EMIS_4_0');

  XLSX.writeFile(workbook, `Template_EMIS_4_0_Siswa_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}

/**
 * Generate and download formatted Excel Template (.xlsx) for Student Import (Standard Format)
 */
export function downloadStudentExcelTemplate(classList: string[], schoolName?: string): void {
  const actualSchoolName = schoolName || getStoredSchoolOfficials()?.namaYayasan || getStoredSchoolOfficials()?.namaSekolah || 'Madrasah';
  const sampleClasses = classList.length > 0 ? classList : ['VII A', 'VII B', 'IX A'];
  const sampleClass1 = sampleClasses[0] || 'VII A';
  const sampleClass2 = sampleClasses[1] || sampleClass1;

  const data = [
    {
      'No': 1,
      'Kelas': sampleClass1,
      'No Absen': 1,
      'Nama Siswa': 'Ahmad Fauzi Rahman',
      'Kode Unik (NIS)': '7A01',
      'NISN': '0098765432',
      'Jenis Kelamin (L/P)': 'L',
      'No HP Orang Tua': '081234567890'
    },
    {
      'No': 2,
      'Kelas': sampleClass1,
      'No Absen': 2,
      'Nama Siswa': 'Aisyah Putri Azzahra',
      'Kode Unik (NIS)': '7A02',
      'NISN': '0098765433',
      'Jenis Kelamin (L/P)': 'P',
      'No HP Orang Tua': '081298765432'
    },
    {
      'No': 3,
      'Kelas': sampleClass1,
      'No Absen': 3,
      'Nama Siswa': 'Bagus Dwi Wicaksono',
      'Kode Unik (NIS)': '7A03',
      'NISN': '0098765434',
      'Jenis Kelamin (L/P)': 'L',
      'No HP Orang Tua': '085712345678'
    },
    {
      'No': 4,
      'Kelas': sampleClass2,
      'No Absen': 1,
      'Nama Siswa': 'Cantika Dewi Lestari',
      'Kode Unik (NIS)': '7B01',
      'NISN': '0098765435',
      'Jenis Kelamin (L/P)': 'P',
      'No HP Orang Tua': '085888999000'
    },
    {
      'No': 5,
      'Kelas': sampleClass2,
      'No Absen': 2,
      'Nama Siswa': 'Dimas Prasetyo',
      'Kode Unik (NIS)': '7B02',
      'NISN': '0098765436',
      'Jenis Kelamin (L/P)': 'L',
      'No HP Orang Tua': '087811223344'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Kelas
    { wch: 10 }, // No Absen
    { wch: 30 }, // Nama Siswa
    { wch: 18 }, // Kode Unik (NIS)
    { wch: 16 }, // NISN
    { wch: 20 }, // Jenis Kelamin
    { wch: 20 }  // No HP Orang Tua
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Siswa');

  // Petunjuk worksheet
  const instructionsData = [
    ['PANDUAN PENGISIAN TEMPLATE IMPORT SISWA EXCEL'],
    ['1. Kolom "Nama Siswa" dan "Kelas" adalah kolom UTAMA yang wajib terisi.'],
    ['2. Kolom "No Absen" diisi angka urut (1, 2, 3, dst). Jika dikosongkan, sistem akan mengurutkan otomatis.'],
    ['3. Kolom "Kode Unik (NIS)" dipakai untuk login Portal Orang Tua / Siswa. Jika dikosongkan, sistem membuatkan otomatis.'],
    ['4. Kolom "NISN", "Jenis Kelamin (L/P)", dan "No HP Orang Tua" bersifat opsional tapi sangat disarankan diisi.'],
    ['5. Format nomor HP orang tua dapat diawali dengan 08... atau 62... untuk integrasi tombol kirim WhatsApp portal.'],
    ['6. Daftar rombel kelas yang tersedia: ' + classList.join(', ')],
    ['7. Simpan file ini dengan ekstensi .xlsx atau .csv lalu upload ke menu "Import Data dari Excel".']
  ];
  const instrSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  instrSheet['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, instrSheet, 'Petunjuk_Pengisian');

  XLSX.writeFile(workbook, `Template_Import_Siswa_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}

/**
 * Export all students to .xlsx (Format Lengkap Buku Induk)
 */
export function exportStudentsToExcel(students: Student[], schoolName: string = 'Madrasah'): void {
  const data = students.map((s, idx) => ({
    'No': idx + 1,
    'Kelas': s.className,
    'No Absen': s.rollNo,
    'Nama Lengkap Siswa': s.name,
    'Nama Panggilan': s.namaPanggilan || '-',
    'Jenis Kelamin': s.gender || '-',
    'NIS (Lokal)': s.nis || '-',
    'NISN': s.nisn || '-',
    'Kode Unik (Akses)': s.kodeUnik || '-',
    'NIK Siswa': s.nik || '-',
    'No KK': s.noKk || '-',
    'Tempat Lahir': s.tempatLahir || '-',
    'Tanggal Lahir': s.tanggalLahir || '-',
    'Agama': s.agama || 'Islam',
    'Kewarganegaraan': s.kewarganegaraan || 'WNI',
    'Anak Ke': s.anakKe || '-',
    'Jumlah Saudara': s.jumlahSaudara !== undefined ? s.jumlahSaudara : '-',
    'Status Keluarga': s.statusKeluarga || 'Anak Kandung',
    'Alamat Lengkap': s.alamat || '-',
    'RT / RW': s.rtRw || '-',
    'Desa / Kelurahan': s.kelurahan || '-',
    'Kecamatan': s.kecamatan || '-',
    'Kab / Kota': s.kabupaten || '-',
    'Provinsi': s.provinsi || '-',
    'Kode Pos': s.kodePos || '-',
    'Tinggal Bersama': s.tinggalBersama || 'Orang Tua',
    'Jarak ke Sekolah': s.jarakSekolah || '-',
    'Transportasi': s.transportasi || '-',
    'No HP Siswa': s.phone || '-',
    'No HP / WA Ortu': s.parentPhone || '-',
    'Golongan Darah': s.golonganDarah || 'Belum Tahu',
    'Tinggi Badan (cm)': s.tinggiBadan || '-',
    'Berat Badan (kg)': s.beratBadan || '-',
    'Penyakit Berat': s.penyakitBerat || '-',
    'Kelainan Jasmani': s.kelainanJasmani || '-',
    'Asal SD/MI': s.asalSekolah || '-',
    'Nomor Ijazah SD/MI': s.nomorIjazah || '-',
    'Nomor SKHUN': s.nomorSkhun || '-',
    'Status Masuk': s.statusMasuk || 'Siswa Baru',
    'Asal Pindahan': s.asalPindahan || '-',
    'Nama Ayah': s.namaAyah || '-',
    'NIK Ayah': s.nikAyah || '-',
    'Status Ayah': s.statusAyah || 'Masih Hidup',
    'Pendidikan Ayah': s.pendidikanAyah || '-',
    'Pekerjaan Ayah': s.pekerjaanAyah || '-',
    'Penghasilan Ayah': s.penghasilanAyah || '-',
    'Nama Ibu': s.namaIbu || '-',
    'NIK Ibu': s.nikIbu || '-',
    'Status Ibu': s.statusIbu || 'Masih Hidup',
    'Pendidikan Ibu': s.pendidikanIbu || '-',
    'Pekerjaan Ibu': s.pekerjaanIbu || '-',
    'Penghasilan Ibu': s.penghasilanIbu || '-',
    'Nama Wali': s.namaWali || '-',
    'Hubungan Wali': s.hubunganWali || '-',
    'Pekerjaan Wali': s.pekerjaanWali || '-',
    'HP Wali': s.hpWali || '-',
    'Kategori Sosial': s.kategoriSosial || 'Reguler',
    'No KIP': s.noKip || '-',
    'No KKS': s.noKks || '-',
    'No PKH': s.noPkh || '-',
    'Hobi': s.hobi || '-',
    'Cita-cita': s.citaCita || '-',
    'Tanggal Masuk': s.tanggalMasuk || '-',
    'Status Siswa': s.statusSiswa || 'Aktif',
    'Catatan Khusus': s.catatanKhusus || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 8 },
    { wch: 32 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 30 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku_Induk_Siswa');
  XLSX.writeFile(workbook, `Buku_Induk_Siswa_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportAttendanceSessionCSV(session: AttendanceSession, studentsMap: Map<string, Student>): void {
  const headers = ['No', 'Kelas', 'Nama Siswa', 'Status Kehadiran', 'Keterangan / Catatan'];
  
  const rows: (string | number)[][] = [
    ['JURNAL DAN PRESENSI MENGAJAR GURU - MTS MANBAUL ISLAM'],
    [`Tanggal: ${session.date}`],
    [`Guru: ${session.teacherName} (NIP: ${session.teacherNip})`],
    [`Mata Pelajaran: ${session.subjectName}`],
    [`Kelas: ${session.className}`],
    [`Pertemuan Ke: ${session.meetingNumber} | Jam: ${session.periodNumber}`],
    [`Materi / Topik: ${session.topic}`],
    [''],
    headers
  ];

  session.entries.forEach((entry, idx) => {
    const student = studentsMap.get(entry.studentId);
    const studentName = student ? student.name : (entry.studentName || entry.studentId);
    const statusLabel = 
      entry.status === 'H' ? 'Hadir (H)' :
      entry.status === 'I' ? 'Izin (I)' :
      entry.status === 'S' ? 'Sakit (S)' : 'Alpa (A)';
      
    rows.push([
      idx + 1,
      session.className,
      studentName,
      statusLabel,
      entry.notes || '-'
    ]);
  });

  const currentSchoolName = (getStoredSchoolOfficials()?.namaSekolah || 'Madrasah').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Presensi_${currentSchoolName}_${session.className}_${session.subjectName}_P${session.meetingNumber}_${session.date}.csv`;
  exportToCSV(filename, rows);
}

export interface PrintHtmlOptions {
  paperSize?: 'A4' | 'F4';
  layoutMode?: 'normal' | 'single-page';
  margin?: string;
  customCss?: string;
}

export function printHtmlString(arg1: string, arg2?: string, options?: PrintHtmlOptions): void {
  const activeSchoolName = getStoredSchoolOfficials()?.namaSekolah || 'Madrasah';
  let title = `Dokumen Cetak - ${activeSchoolName}`;
  let bodyHtml = '';

  if (arg2 !== undefined && arg2 !== null) {
    // Detect whether arg1 or arg2 contains the actual HTML markup
    const isArg1Html = arg1.includes('<') && (arg1.includes('</div>') || arg1.includes('</td>') || arg1.includes('</p>') || arg1.includes('<html') || arg1.includes('<table') || arg1.length > 200);
    const isArg2Html = arg2.includes('<') && (arg2.includes('</div>') || arg2.includes('</td>') || arg2.includes('</p>') || arg2.includes('<html') || arg2.includes('<table') || arg2.length > 200);

    if (isArg1Html && !isArg2Html) {
      bodyHtml = arg1;
      title = arg2;
    } else {
      title = arg1;
      bodyHtml = arg2;
    }
  } else {
    bodyHtml = arg1;
  }

  const paperSize = options?.paperSize || 'A4';
  const layoutMode = options?.layoutMode || 'normal';
  const sizeCss = paperSize === 'F4' ? '215mm 330mm portrait' : 'A4 portrait';
  const marginCss = options?.margin || (layoutMode === 'single-page' ? '0.7cm 1cm' : '1.2cm 1.5cm');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Mohon izinkan popup browser untuk mencetak dokumen.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: ${sizeCss};
            margin: ${marginCss};
          }
          @media print {
            body {
              padding: 0 !important;
              margin: 0 !important;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none !important; }
            ${layoutMode === 'single-page' ? `
              html, body {
                height: 100% !important;
                overflow: hidden !important;
              }
              .single-page-wrapper {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                break-inside: avoid !important;
                max-height: 100% !important;
              }
            ` : ''}
          }
          body {
            font-family: 'Times New Roman', Times, serif, system-ui;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          * {
            box-sizing: border-box;
          }
          ${options?.customCss || ''}
        </style>
      </head>
      <body>
        <div class="${layoutMode === 'single-page' ? 'single-page-wrapper' : ''}">
          ${bodyHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 300);
          };
          // Fallback if onload already triggered
          setTimeout(() => {
            window.print();
          }, 600);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function printFormattedDocument(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Mohon izinkan popup browser untuk mencetak dokumen.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cetak Dokumen Administrasi Guru - ${getStoredSchoolOfficials()?.namaSekolah || 'Madrasah'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { padding: 15px; color: #000; background: #fff; }
            .no-print { display: none !important; }
            @page { margin: 1.5cm; size: portrait; }
          }
          body { font-family: 'Times New Roman', Times, serif; }
        </style>
      </head>
      <body>
        <div class="p-6 max-w-4xl mx-auto">
          ${element.innerHTML}
        </div>
        <script>
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

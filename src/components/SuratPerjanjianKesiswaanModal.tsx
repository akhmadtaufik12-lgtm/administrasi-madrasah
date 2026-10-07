import React, { useState, useMemo, useEffect } from 'react';
import { Student, StudentViolation, Teacher, SchoolOfficials, ClassWaliKelasMap } from '../types';
import {
  FileText,
  Printer,
  X,
  User,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Edit3,
  AlertTriangle,
  Sparkles,
  Scroll,
  Plus,
  Trash2,
  Download,
  Info
} from 'lucide-react';
import { printHtmlString, renderKopSuratHtml } from '../utils/export';

interface SuratPerjanjianKesiswaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  initialViolationId?: string;
  students: Student[];
  violations: StudentViolation[];
  teachers: Teacher[];
  classList: string[];
  classWaliKelas?: ClassWaliKelasMap;
  schoolOfficials?: SchoolOfficials;
  academicYear?: string;
  semester?: string;
}

export type LetterTemplateType = 
  | 'SURAT_PERNYATAAN_SISWA'
  | 'SURAT_PERJANJIAN_BERSAMA'
  | 'SURAT_PERINGATAN_PERJANJIAN';

const DEFAULT_COMMITMENTS = [
  'Mengakui dengan jujur atas kesalahan dan pelanggaran tata tertib madrasah yang telah saya lakukan.',
  'Berjanji dengan sungguh-sungguh dari hati nurani tidak akan mengulangi perbuatan tersebut maupun pelanggaran lainnya.',
  'Berjanji untuk selalu mematuhi seluruh peraturan, tata tertib, norma agama, dan tata krama di lingkungan madrasah.',
  'Berjanji untuk hadir tepat waktu, disiplin mengikuti seluruh proses Kegiatan Belajar Mengajar (KBM), dan tidak membolos.',
  'Berjanji untuk bersikap sopan, santun, menghormati Bapak/Ibu Guru, Karyawan, serta menghargai sesama teman.',
  'Menjaga nama baik diri sendiri, keluarga, serta nama baik dan kehormatan madrasah/sekolah.',
  'Apabila di kemudian hari saya mengulangi pelanggaran atau melanggar tata tertib kembali, saya bersedia menerima sanksi tegas sesuai aturan madrasah (termasuk skorsing, pemanggilan orang tua, hingga dikembalikan kepada orang tua).'
];

export const SuratPerjanjianKesiswaanModal: React.FC<SuratPerjanjianKesiswaanModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  initialViolationId,
  students,
  violations,
  teachers,
  classList,
  classWaliKelas,
  schoolOfficials,
  academicYear = '2026/2027',
  semester = 'Semester Ganjil'
}) => {
  // Extract School Officials & Identity details
  const namaYayasan = schoolOfficials?.namaYayasan || 'YAYASAN PENDIDIKAN MANBAUL ISLAM';
  const namaSekolah = schoolOfficials?.namaSekolah || "MADRASAH TSANAWIYAH MANBA'UL ISLAM";
  const statusSekolah = schoolOfficials?.statusSekolah || 'Swasta';
  const akreditasi = schoolOfficials?.akreditasi || 'A (Unggul)';
  const nsm = schoolOfficials?.nsm || '121231730005';
  const npsn = schoolOfficials?.npsn || '20108921';
  const alamatSekolah = schoolOfficials?.alamatSekolah || 'Jl. Sandang No. 34';
  const rtRw = schoolOfficials?.rtRw ? `${schoolOfficials.rtRw}, ` : '';
  const kelurahan = schoolOfficials?.kelurahan ? `Kel. ${schoolOfficials.kelurahan}, ` : '';
  const kecamatan = schoolOfficials?.kecamatan ? `Kec. ${schoolOfficials.kecamatan}, ` : '';
  const kotaSekolah = schoolOfficials?.kotaSekolah || 'Jakarta Barat';
  const provinsi = schoolOfficials?.provinsi || 'DKI Jakarta';
  const kodePos = schoolOfficials?.kodePos || '11480';
  const teleponSekolah = schoolOfficials?.teleponSekolah || '(021) 5321855';
  const whatsappSekolah = schoolOfficials?.whatsappSekolah || '0812-3456-7890';
  const emailSekolah = schoolOfficials?.emailSekolah || 'mtsmanbaulislam@gmail.com';
  const website = schoolOfficials?.website || 'https://mtsmanbaulislam.sch.id';
  const logoUrl = schoolOfficials?.logoUrl || '';

  const fullSchoolAddress = `${alamatSekolah}, ${rtRw}${kelurahan}${kecamatan}${kotaSekolah} - ${provinsi} ${kodePos}`;

  // State
  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || 'VII A');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [letterType, setLetterType] = useState<LetterTemplateType>('SURAT_PERNYATAAN_SISWA');
  const [letterNumber, setLetterNumber] = useState<string>('');
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cityLocation, setCityLocation] = useState<string>(kotaSekolah);

  // Parent Info
  const [parentName, setParentName] = useState<string>('');
  const [parentRelation, setParentRelation] = useState<string>('Orang Tua / Wali');
  const [parentJob, setParentJob] = useState<string>('Wiraswasta / Karyawan');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [parentAddress, setParentAddress] = useState<string>('');

  // Case details
  const [violationCaseTitle, setViolationCaseTitle] = useState<string>('');
  const [violationDescription, setViolationDescription] = useState<string>('');
  const [customSanction, setCustomSanction] = useState<string>('Skorsing selama 3 hari dan/atau Dikembalikan kepada Orang Tua');
  
  // Custom clauses
  const [commitments, setCommitments] = useState<string[]>(DEFAULT_COMMITMENTS);
  const [newCommitmentText, setNewCommitmentText] = useState<string>('');

  // Print options
  const [includeMaterai, setIncludeMaterai] = useState<boolean>(true);
  const [includeViolationTable, setIncludeViolationTable] = useState<boolean>(true);
  const [guruBkName, setGuruBkName] = useState<string>(schoolOfficials?.bk?.name || 'Fahmi, S.Pd');
  const [guruBkNip, setGuruBkNip] = useState<string>(schoolOfficials?.bk?.nip || '85821');

  // Sync officials on update
  useEffect(() => {
    if (schoolOfficials) {
      if (schoolOfficials.kotaSekolah) setCityLocation(schoolOfficials.kotaSekolah);
      if (schoolOfficials.bk?.name) setGuruBkName(schoolOfficials.bk.name);
      if (schoolOfficials.bk?.nip) setGuruBkNip(schoolOfficials.bk.nip);
    }
  }, [schoolOfficials]);

  // Find Student
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Violations of Selected Student
  const studentViolations = useMemo(() => {
    if (!currentStudent) return [];
    return violations.filter(v => 
      v.studentId === currentStudent.id ||
      (v.studentName?.toLowerCase().trim() === currentStudent.name.toLowerCase().trim() && v.className === currentStudent.className)
    );
  }, [violations, currentStudent]);

  // Aggregate points
  const totalStudentPoints = useMemo(() => {
    return studentViolations.reduce((acc, curr) => acc + curr.points, 0);
  }, [studentViolations]);

  // Homeroom teacher for selected student's class
  const waliKelasInfo = useMemo(() => {
    const targetClass = currentStudent?.className || selectedClass;
    const defaultMap: Record<string, string> = {
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
    const map = classWaliKelas || defaultMap;
    const mappedName = map[targetClass];
    const teacherMatch = teachers.find(t => t.name === mappedName);
    return teacherMatch || { name: mappedName || `Wali Kelas ${targetClass}`, nip: '-' };
  }, [currentStudent, selectedClass, teachers, classWaliKelas]);

  // Sync initial student on open
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      const st = students.find(s => s.id === initialStudentId);
      if (st) {
        setSelectedClass(st.className);
        if (st.parentPhone) setParentPhone(st.parentPhone);
      }
    } else if (students.length > 0 && !selectedStudentId) {
      const firstSt = students.find(s => s.className === selectedClass) || students[0];
      if (firstSt) {
        setSelectedStudentId(firstSt.id);
        setSelectedClass(firstSt.className);
      }
    }
  }, [initialStudentId, isOpen]);

  // Sync specific violation if requested
  useEffect(() => {
    if (initialViolationId) {
      const v = violations.find(item => item.id === initialViolationId);
      if (v) {
        setViolationCaseTitle(`${v.violationType} (${v.points} Poin)`);
        setViolationDescription(v.description || '');
        if (v.reporterName) {
          setGuruBkName(v.reporterName);
        }
      }
    }
  }, [initialViolationId, violations]);

  // When selected student changes, prefill case title & parent phone
  useEffect(() => {
    if (currentStudent) {
      if (currentStudent.parentPhone) {
        setParentPhone(currentStudent.parentPhone);
      }
      // If no specific violation selected, summarize student's top cases
      if (!initialViolationId && studentViolations.length > 0) {
        const latest = studentViolations[0];
        setViolationCaseTitle(`${latest.violationType} (Total Akumulasi: ${totalStudentPoints} Poin)`);
        setViolationDescription(latest.description || 'Tercatat pelanggaran disiplin madrasah.');
        if (latest.reporterName) {
          setGuruBkName(latest.reporterName);
        }
      }

      // Generate Letter Number automatically
      const monthRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
      const year = new Date().getFullYear();
      const randomNo = Math.floor(100 + Math.random() * 900);
      setLetterNumber(`${randomNo}/BK-KESISWAAN/MTs.MI/${monthRomawi}/${year}`);
    }
  }, [currentStudent]);

  if (!isOpen) return null;

  // Handler to add commitment
  const handleAddCommitment = () => {
    if (!newCommitmentText.trim()) return;
    setCommitments([...commitments, newCommitmentText.trim()]);
    setNewCommitmentText('');
  };

  // Handler to remove commitment
  const handleRemoveCommitment = (index: number) => {
    setCommitments(commitments.filter((_, i) => i !== index));
  };

  // Format Indo Date
  const formattedLetterDate = new Date(letterDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get Letter Title
  const getDocumentTitle = () => {
    switch (letterType) {
      case 'SURAT_PERJANJIAN_BERSAMA':
        return 'SURAT PERJANJIAN BERSAMA SISWA & ORANG TUA / WALI';
      case 'SURAT_PERINGATAN_PERJANJIAN':
        return 'SURAT PERINGATAN (SP) & PERNYATAAN KEDISIPLINAN SISWA';
      default:
        return 'SURAT PERNYATAAN & PERJANJIAN KEDISIPLINAN SISWA';
    }
  };

  // Generate Print HTML
  const handlePrint = () => {
    if (!currentStudent) {
      alert('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    const kepalaSekolahName = schoolOfficials?.kepalaSekolah?.name || 'Dra. Hj. Nurjanah, M.Pd';
    const kepalaSekolahNip = schoolOfficials?.kepalaSekolah?.nip || '197208151998032001';
    const kesiswaanName = schoolOfficials?.kesiswaan?.name || 'M. Sholihin, SE';
    const kesiswaanNip = schoolOfficials?.kesiswaan?.nip || '85780';

    const docTitle = getDocumentTitle();
    const kopHtml = renderKopSuratHtml(schoolOfficials);

    const letterHtml = `
      <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 13px;">
        
        <!-- KOP SURAT RESMI (KONFIGURASI LEMBAGA) -->
        ${kopHtml}

        <!-- JUDUL SURAT -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px;">
            ${docTitle}
          </h3>
          <p style="margin: 3px 0 0 0; font-size: 12px;">
            Nomor: <strong>${letterNumber || '-'}</strong>
          </p>
        </div>

        <!-- PEMBUKA -->
        <p style="margin: 0 0 10px 0; text-align: justify;">
          Yang bertanda tangan di bawah ini:
        </p>

        <!-- DATA SISWA -->
        <table style="width: 100%; font-size: 13px; margin-bottom: 12px; border-collapse: collapse;">
          <tr>
            <td style="width: 28%; padding: 2px 0; vertical-align: top;">Nama Lengkap Siswa</td>
            <td style="width: 3%; padding: 2px 0; vertical-align: top;">:</td>
            <td style="width: 69%; padding: 2px 0; font-weight: bold; text-transform: uppercase;">${currentStudent.name}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Nomor Induk / NISN</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${currentStudent.nisn || currentStudent.kodeUnik || '-'} (No. Absen: ${currentStudent.rollNo})</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Kelas / Tingkat</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0; font-weight: bold;">${currentStudent.className} (${academicYear})</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Jenis Kelamin</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${currentStudent.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
          </tr>
        </table>

        <!-- DATA ORANG TUA / WALI -->
        <p style="margin: 10px 0 6px 0; text-align: justify;">
          Didampingi oleh Orang Tua / Wali Murid:
        </p>
        <table style="width: 100%; font-size: 13px; margin-bottom: 14px; border-collapse: collapse;">
          <tr>
            <td style="width: 28%; padding: 2px 0; vertical-align: top;">Nama Orang Tua / Wali</td>
            <td style="width: 3%; padding: 2px 0; vertical-align: top;">:</td>
            <td style="width: 69%; padding: 2px 0; font-weight: bold;">${parentName || '..................................................................'} (${parentRelation})</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Pekerjaan</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${parentJob || '..................................................................'}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">No. Telepon / HP</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${parentPhone || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Alamat Tempat Tinggal</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${parentAddress || '.....................................................................................................................'}</td>
          </tr>
        </table>

        <!-- KASUS / PELANGGARAN -->
        <div style="background-color: #f8fafc; border: 1px solid #000; padding: 8px 12px; margin-bottom: 14px; font-size: 12px;">
          <p style="margin: 0 0 4px 0; font-weight: bold; text-decoration: underline;">
            KETERANGAN TINDAKAN / KASUS PELANGGARAN KEDISIPLINAN:
          </p>
          <p style="margin: 2px 0;">
            <strong>Jenis Kasus/Pelanggaran:</strong> ${violationCaseTitle || 'Pelanggaran Tata Tertib Madrasah'}
          </p>
          <p style="margin: 2px 0;">
            <strong>Akumulasi Poin Pelanggaran:</strong> <span style="font-weight: bold; color: #b91c1c;">${totalStudentPoints} Poin</span>
          </p>
          ${violationDescription ? `
            <p style="margin: 2px 0; font-style: italic;">
              <strong>Kronologi/Uraian:</strong> "${violationDescription}"
            </p>
          ` : ''}
        </div>

        ${includeViolationTable && studentViolations.length > 0 ? `
          <!-- TABEL RIWAYAT KASUS -->
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px;" border="1" cellPadding="4">
            <thead>
              <tr style="background-color: #eee; text-align: center; font-weight: bold;">
                <th style="width: 6%;">No</th>
                <th style="width: 18%;">Tanggal</th>
                <th style="text-align: left;">Bentuk Pelanggaran</th>
                <th style="width: 14%;">Kategori</th>
                <th style="width: 12%;">Poin</th>
                <th style="width: 20%;">Tindak Lanjut BK</th>
              </tr>
            </thead>
            <tbody>
              ${studentViolations.slice(0, 5).map((v, i) => `
                <tr>
                  <td style="text-align: center;">${i + 1}</td>
                  <td style="text-align: center;">${v.date}</td>
                  <td>${v.violationType}</td>
                  <td style="text-align: center;">${v.category}</td>
                  <td style="text-align: center; font-weight: bold; color: ${v.points > 0 ? '#b91c1c' : '#047857'};">${v.points > 0 ? `+${v.points}` : v.points} pt</td>
                  <td>${v.followUpNote || v.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- ISI PERNYATAAN / PERJANJIAN -->
        <p style="margin: 0 0 8px 0; text-align: justify;">
          Sehubungan dengan pelanggaran tata tertib tersebut di atas, dengan ini saya menyatakan dan berjanji dengan sungguh-sungguh bahwa:
        </p>

        <ol style="margin: 0 0 14px 0; padding-left: 22px; text-align: justify;">
          ${commitments.map(item => `
            <li style="margin-bottom: 5px;">${item}</li>
          `).join('')}
        </ol>

        <p style="margin: 0 0 20px 0; text-align: justify; text-indent: 28px;">
          Demikian surat pernyataan dan perjanjian ini saya buat dengan sebenarnya, atas kesadaran sendiri tanpa adanya paksaan maupun tekanan dari pihak manapun, serta diketahui dan disetujui sepenuhnya oleh Orang Tua/Wali saya.
        </p>

        <!-- TANDA TANGAN 4-6 KOLOM RESMI -->
        <table style="width: 100%; font-size: 12px; margin-top: 10px; border-collapse: collapse;">
          <tr>
            <td colspan="2" style="text-align: right; padding-bottom: 8px;">
              ${cityLocation || kotaSekolah}, ${formattedLetterDate}
            </td>
          </tr>
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top; padding-bottom: 40px;">
              Orang Tua / Wali Siswa,
              <br/><br/><br/><br/>
              <strong>( ${parentName || '..............................................'} )</strong>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top; padding-bottom: 40px;">
              Yang Membuat Pernyataan / Siswa,
              <br/>
              ${includeMaterai ? `
                <div style="width: 80px; height: 35px; border: 1px dashed #666; margin: 4px auto; font-size: 8px; line-height: 35px; color: #666; text-align: center;">
                  Materai 10.000
                </div>
              ` : '<br/><br/>'}
              <strong>( ${currentStudent.name} )</strong>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="text-align: center; font-weight: bold; padding: 4px 0;">
              Saksi-Saksi Pihak Madrasah:
            </td>
          </tr>
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top; padding-top: 6px; padding-bottom: 30px;">
              Guru Bimbingan Konseling (BK/BP),
              <br/><br/><br/><br/>
              <strong><u>${guruBkName}</u></strong><br/>
              NIP: ${guruBkNip}
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top; padding-top: 6px; padding-bottom: 30px;">
              Wali Kelas ${currentStudent.className},
              <br/><br/><br/><br/>
              <strong><u>${waliKelasInfo.name}</u></strong><br/>
              NIP: ${waliKelasInfo.nip || '-'}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="text-align: center; vertical-align: top; padding-top: 10px;">
              Mengetahui,<br/>
              <strong>Waka Kesiswaan & Kepala Madrasah</strong>
              <br/><br/><br/><br/>
              <table style="width: 100%; text-align: center;">
                <tr>
                  <td style="width: 50%;">
                    <strong><u>${kesiswaanName}</u></strong><br/>
                    Waka Kesiswaan (NIP: ${kesiswaanNip})
                  </td>
                  <td style="width: 50%;">
                    <strong><u>${kepalaSekolahName}</u></strong><br/>
                    Kepala Madrasah (NIP: ${kepalaSekolahNip})
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </div>
    `;

    printHtmlString(`Surat_Perjanjian_Disiplin_${currentStudent.name}_${currentStudent.className}`, letterHtml);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-indigo-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-indigo-950 flex items-center justify-center font-black shadow-md">
              <Scroll className="w-5 h-5 text-indigo-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  BK & Kesiswaan
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  {academicYear} • Dokumen Resmi Kedisiplinan
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Cetak Surat Pernyataan / Surat Perjanjian Siswa
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Split Left (Settings Form) & Right (Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT FORM PANEL (5 COLS) */}
          <div className="lg:col-span-5 p-5 space-y-4 bg-slate-50/50 text-xs overflow-y-auto">
            
            {/* 1. Pilih Siswa & Format Surat */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-black text-slate-900 text-xs flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>1. Pilih Siswa & Format Surat</span>
              </h4>

              {/* Kelas & Siswa */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Filter Kelas:</label>
                  <select
                    value={selectedClass}
                    onChange={e => {
                      setSelectedClass(e.target.value);
                      const matched = students.find(s => s.className === e.target.value);
                      if (matched) setSelectedStudentId(matched.id);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                  >
                    {classList.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Nama Siswa:*</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-black text-indigo-950"
                  >
                    {students
                      .filter(s => s.className === selectedClass)
                      .map(st => (
                        <option key={st.id} value={st.id}>
                          #{st.rollNo} {st.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Jenis Format Dokumen */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Jenis Dokumen Surat:</label>
                <select
                  value={letterType}
                  onChange={e => setLetterType(e.target.value as LetterTemplateType)}
                  className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-2.5 py-2 font-black text-indigo-900"
                >
                  <option value="SURAT_PERNYATAAN_SISWA">Surat Pernyataan & Perjanjian Siswa</option>
                  <option value="SURAT_PERJANJIAN_BERSAMA">Surat Perjanjian Bersama Siswa & Orang Tua</option>
                  <option value="SURAT_PERINGATAN_PERJANJIAN">Surat Peringatan (SP) & Komitmen Terakhir</option>
                </select>
              </div>

              {/* Status Siswa Pill */}
              {currentStudent && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-500 font-medium">Akumulasi Poin:</span>
                    <strong className="ml-1 text-rose-600 font-black">{totalStudentPoints} Poin</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Total Kasus:</span>
                    <strong className="ml-1 text-slate-800 font-black">{studentViolations.length} Kasus</strong>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Nomor, Tanggal & Identitas Wali */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-black text-slate-900 text-xs flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>2. Nomor Surat & Data Orang Tua/Wali</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Nomor Surat:</label>
                  <input
                    type="text"
                    value={letterNumber}
                    onChange={e => setLetterNumber(e.target.value)}
                    placeholder="Contoh: 102/BK/MTs.MI/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Tanggal Surat:</label>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={e => setLetterDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Nama Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="Nama Ayah/Ibu/Wali"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">No. HP Orang Tua:</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Alamat Orang Tua / Siswa (Opsional):</label>
                <input
                  type="text"
                  value={parentAddress}
                  onChange={e => setParentAddress(e.target.value)}
                  placeholder="Jl. ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>
            </div>

            {/* 3. Kasus & Tindakan Sanksi */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-black text-slate-900 text-xs flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>3. Uraian Kasus & Pelanggaran</span>
              </h4>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Judul Kasus / Pelanggaran Terakhir:</label>
                <input
                  type="text"
                  value={violationCaseTitle}
                  onChange={e => setViolationCaseTitle(e.target.value)}
                  placeholder="Misal: Membolos saat jam KBM / Merokok..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-rose-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Kronologi Singkat / Catatan Kasus:</label>
                <textarea
                  rows={2}
                  value={violationDescription}
                  onChange={e => setViolationDescription(e.target.value)}
                  placeholder="Keterangan singkat kejadian..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Nama Guru BK / Pelapor:</label>
                  <input
                    type="text"
                    value={guruBkName}
                    onChange={e => setGuruBkName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Kota Dokumen:</label>
                  <input
                    type="text"
                    value={cityLocation}
                    onChange={e => setCityLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* 4. Butir-Butir Komitmen & Opsi Cetak */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-black text-slate-900 text-xs flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>4. Butir Janji Komitmen & Opsi Cetak</span>
              </h4>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Daftar Komitmen Siswa ({commitments.length} butir):</label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {commitments.map((c, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px]">
                      <span className="font-bold text-indigo-950 shrink-0">{idx + 1}.</span>
                      <span className="flex-1 text-slate-700 leading-snug">{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitment(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Hapus butir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tambah butir baru */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newCommitmentText}
                  onChange={e => setNewCommitmentText(e.target.value)}
                  placeholder="Ketik butir janji tambahan..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px]"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCommitment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCommitment}
                  className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold text-[11px] cursor-pointer"
                >
                  + Tambah
                </button>
              </div>

              {/* Checklist Toggles */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMaterai}
                    onChange={e => setIncludeMaterai(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-700">Kotak Materai 10.000</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeViolationTable}
                    onChange={e => setIncludeViolationTable(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-700">Tabel Riwayat Kasus</span>
                </label>
              </div>

            </div>

          </div>

          {/* RIGHT PREVIEW PANEL (7 COLS) */}
          <div className="lg:col-span-7 p-5 bg-slate-100 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-600 flex items-center space-x-1.5 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Pratinjau Lembar Surat Resmi (A4)</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Siap Dicetak
                </span>
              </div>

              {/* Letter Document Preview Box */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-300 font-serif text-[12px] text-black leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto">
                
                {/* Kop Preview */}
                <div className="border-b-2 border-black pb-2">
                  <div className="flex items-center justify-between gap-3">
                    {logoUrl && (
                      <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-h-14 max-w-14 object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 text-center">
                      <div className="font-sans font-bold text-[11px] uppercase tracking-wide text-slate-800">
                        {namaYayasan}
                      </div>
                      <div className="font-sans font-black text-[14px] uppercase tracking-tight text-black mt-0.5">
                        {namaSekolah}
                      </div>
                      <div className="font-sans text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                        STATUS: {statusSekolah} • AKREDITASI: {akreditasi} • NSM: {nsm || '-'} • NPSN: {npsn || '-'}
                      </div>
                      <div className="font-sans text-[9px] text-slate-700 leading-tight mt-0.5">
                        {fullSchoolAddress}
                      </div>
                      <div className="font-sans text-[8px] text-slate-600">
                        Telp: {teleponSekolah || '-'} • WA: {whatsappSekolah || '-'} • Email: {emailSekolah || '-'} • Website: {website || '-'}
                      </div>
                    </div>
                    {logoUrl && <div className="w-14 shrink-0 hidden sm:block" />}
                  </div>
                  <div className="border-b border-black mt-1" />
                </div>

                {/* Title */}
                <div className="text-center space-y-0.5">
                  <div className="font-black text-[13px] underline uppercase tracking-wide">{getDocumentTitle()}</div>
                  <div className="text-[11px]">Nomor: {letterNumber || '... / BK-KES / MTs.MI / ...'}</div>
                </div>

                {/* Body Preview */}
                <p>Yang bertanda tangan di bawah ini:</p>
                <div className="pl-4 space-y-1 text-[11px]">
                  <div><strong>Nama Siswa:</strong> {currentStudent?.name || '-'}</div>
                  <div><strong>NISN / Kelas:</strong> {currentStudent?.nisn || '-'} / Kelas {currentStudent?.className || '-'}</div>
                  <div><strong>Nama Orang Tua / Wali:</strong> {parentName || '..............................................'}</div>
                </div>

                <div className="bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-[11px] space-y-1">
                  <strong>Kasus / Pelanggaran:</strong> {violationCaseTitle || 'Pelanggaran Tata Tertib'} (Total {totalStudentPoints} Poin)
                  {violationDescription && <p className="italic text-slate-600">"{violationDescription}"</p>}
                </div>

                <p>Menyatakan dan berjanji dengan sungguh-sungguh bahwa:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] pl-2">
                  {commitments.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>

                <p className="text-justify text-[11px] indent-4">
                  Demikian surat pernyataan dan perjanjian ini saya buat dengan sebenarnya atas kesadaran penuh tanpa paksaan.
                </p>

                {/* Signatures preview */}
                <div className="grid grid-cols-2 gap-4 text-center pt-2 text-[11px] border-t border-slate-200">
                  <div>
                    <p>Orang Tua / Wali Siswa,</p>
                    <br/><br/>
                    <strong>( {parentName || '................................'} )</strong>
                  </div>
                  <div>
                    <p>Yang Membuat Pernyataan,</p>
                    {includeMaterai && <div className="text-[9px] border border-dashed border-slate-400 p-0.5 my-1 inline-block">Materai 10.000</div>}
                    <br/>
                    <strong>( {currentStudent?.name || 'Siswa'} )</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center pt-2 text-[11px]">
                  <div>
                    <p>Guru BK / BP,</p>
                    <br/><br/>
                    <strong><u>{guruBkName}</u></strong>
                  </div>
                  <div>
                    <p>Wali Kelas {currentStudent?.className},</p>
                    <br/><br/>
                    <strong><u>{waliKelasInfo.name}</u></strong>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 mt-4 bg-white/80 p-3 rounded-2xl">
              <div className="text-xs text-slate-500">
                Siswa terpilih: <strong className="text-slate-900">{currentStudent?.name} ({currentStudent?.className})</strong>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Cetak Surat Pernyataan (Print / PDF)</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

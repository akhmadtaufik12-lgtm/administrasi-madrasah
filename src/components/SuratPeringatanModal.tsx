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
  Info,
  Clock,
  MapPin,
  Flame,
  AlertOctagon,
  Building
} from 'lucide-react';
import { printHtmlString, renderKopSuratHtml } from '../utils/export';

export type SPLevel = 'SP_1' | 'SP_2' | 'SP_3';

interface SuratPeringatanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  initialSpLevel?: SPLevel;
  students: Student[];
  violations: StudentViolation[];
  teachers: Teacher[];
  classList: string[];
  classWaliKelas?: ClassWaliKelasMap;
  schoolOfficials?: SchoolOfficials;
  academicYear?: string;
  semester?: string;
}

const DEFAULT_SP_CLAUSES: Record<SPLevel, { title: string; perihal: string; clauses: string[]; defaultSanction: string; color: string; badge: string }> = {
  SP_1: {
    title: 'SURAT PERINGATAN PERTAMA (SP - 1)',
    perihal: 'Peringatan Pertama (SP-1) atas Pelanggaran Tata Tertib & Kedisiplinan Siswa',
    color: 'amber',
    badge: 'SP 1 - Peringatan Awal',
    defaultSanction: 'Pembinaan khusus bersama Guru BK dan Wali Kelas, tugas edukatif kedisiplinan, dan pembuatan surat pernyataan siswa.',
    clauses: [
      'Berdasarkan data rekapitulasi dan catatan kedisiplinan madrasah, ananda tercatat telah melakukan pelanggaran tata tertib dan belum menunjukkan sikap disiplin yang diharapkan.',
      'Surat Peringatan Pertama (SP-1) ini diterbitkan sebagai bentuk teguran tertulis resmi dan peringatan awal agar ananda segera memperbaiki sikap, kehadiran, serta kedisiplinan belajar.',
      'Diharapkan kepada Orang Tua / Wali Murid untuk memberikan perhatian khusus, pengawasan, serta bimbingan intensif kepada ananda di lingkungan keluarga.',
      'Siswa yang bersangkutan wajib mengikuti program pembinaan karakter bersama Guru BK dan Wali Kelas, serta berkomitmen untuk tidak mengulangi pelanggaran.',
      'Apabila setelah terbitnya SP-1 ini ananda kembali melakukan pelanggaran tata tertib, maka madrasah akan menerbitkan Surat Peringatan Kedua (SP-2) dengan tindakan yang lebih tegas.'
    ]
  },
  SP_2: {
    title: 'SURAT PERINGATAN KEDUA (SP - 2)',
    perihal: 'Peringatan Kedua (SP-2) & Pemanggilan Orang Tua / Wali Murid ke Madrasah',
    color: 'orange',
    badge: 'SP 2 - Peringatan Keras',
    defaultSanction: 'Sanksi pembelajaran mandiri di rumah (Skorsing) selama 3 (tiga) hari kerja, pemanggilan orang tua ke madrasah, dan penandatanganan perjanjian kedisiplinan bermaterai.',
    clauses: [
      'Menindaklanjuti Surat Peringatan Pertama (SP-1) yang telah disampaikan sebelumnya, ananda terbukti masih mengulangi tindakan pelanggaran tata tertib madrasah.',
      'Surat Peringatan Kedua (SP-2) ini diterbitkan sebagai peringatan keras atas akumulasi pelanggaran yang telah mendekati batas toleransi kedisiplinan madrasah.',
      'Madrasah mewajibkan kehadiran Bapak/Ibu Orang Tua/Wali Murid untuk hadir ke madrasah guna menghadiri Konferensi Kasus (Case Conference) bersama Tim BK, Wali Kelas, dan Waka Kesiswaan.',
      'Siswa yang bersangkutan dikenakan sanksi pembelajaran mandiri di rumah (Skorsing Akademik) selama 3 (tiga) hari kerja terhitung sejak tanggal yang ditetapkan.',
      'Apabila ananda tidak menunjukkan perubahan perilaku dan kembali melanggar tata tertib setelah SP-2 ini, maka madrasah akan langsung menerbitkan Surat Peringatan Ketiga (SP-3 / Terakhir) dengan konsekuensi dikembalikan kepada Orang Tua.'
    ]
  },
  SP_3: {
    title: 'SURAT PERINGATAN KETIGA / TERAKHIR (SP - 3)',
    perihal: 'Peringatan Terakhir (SP-3) & Sanksi Pengembalian Siswa Kepada Orang Tua / Wali Murid',
    color: 'rose',
    badge: 'SP 3 - Sanksi Terakhir / Kritis',
    defaultSanction: 'Dikembalikan Secara Resmi Kepada Orang Tua / Wali Murid (Pemberhentian / Pemindahan Studi) sesuai Buku Pedoman Tata Tertib Madrasah.',
    clauses: [
      'Bahwa setelah diterbitkannya Surat Peringatan Pertama (SP-1) dan Surat Peringatan Kedua (SP-2) serta berbagai tahapan konseling BK dan musyawarah bersama orang tua, ananda tetap tidak menunjukkan itikad perbaikan dan kembali melakukan pelanggaran disiplin berat.',
      'Bahwa akumulasi poin pelanggaran ananda telah mencapai ambang batas maksimal (100 Poin) yang telah ditetapkan dalam Buku Pedoman Tata Tertib Madrasah.',
      'Berdasarkan hasil rapat koordinasi Dewan Guru, Tim BK, Wali Kelas, Waka Kesiswaan, dan Kepala Madrasah, dengan ini diterbitkan SURAT PERINGATAN KETIGA (SP-3 / TERAKHIR).',
      'Terhitung sejak tanggal ditetapkannya surat ini, siswa yang bersangkutan SECARA RESMI DIKEMBALIKAN KEPADA ORANG TUA / WALI MURID (dikeluarkan / dialihkan ke sekolah lain).',
      'Pihak madrasah siap membantu memfasilitasi kelengkapan dokumen administrasi kepindahan (mutasi) ananda ke lembaga pendidikan lain demi kelanjutan proses belajarnya.'
    ]
  }
};

export const SuratPeringatanModal: React.FC<SuratPeringatanModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  initialSpLevel = 'SP_1',
  students,
  violations,
  teachers,
  classList,
  classWaliKelas,
  schoolOfficials,
  academicYear = '2026/2027',
  semester = 'Semester Ganjil'
}) => {
  // Kop Surat & Identitas Lembaga
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

  // Form State
  const [spLevel, setSpLevel] = useState<SPLevel>(initialSpLevel);
  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || 'VII A');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [letterNumber, setLetterNumber] = useState<string>('');
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cityLocation, setCityLocation] = useState<string>(kotaSekolah);

  // Parent Info
  const [parentName, setParentName] = useState<string>('');
  const [parentRelation, setParentRelation] = useState<string>('Orang Tua / Wali');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [parentAddress, setParentAddress] = useState<string>('');

  // SP Details
  const [caseTitle, setCaseTitle] = useState<string>('');
  const [caseChronology, setCaseChronology] = useState<string>('');
  const [sanctionNote, setSanctionNote] = useState<string>(DEFAULT_SP_CLAUSES[initialSpLevel].defaultSanction);
  const [clauses, setClauses] = useState<string[]>(DEFAULT_SP_CLAUSES[initialSpLevel].clauses);
  const [newClauseText, setNewClauseText] = useState<string>('');

  // Parent Meeting Schedule (for SP-2 / SP-3)
  const [includeMeetingSchedule, setIncludeMeetingSchedule] = useState<boolean>(initialSpLevel === 'SP_2');
  const [meetingDayDate, setMeetingDayDate] = useState<string>('Senin, ' + new Date(Date.now() + 2 * 86400000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [meetingTime, setMeetingTime] = useState<string>('09.00 WIB s/d Selesai');
  const [meetingRoom, setMeetingRoom] = useState<string>('Ruang Bimbingan Konseling (BK) / Ruang Kesiswaan');
  const [meetingContactPerson, setMeetingContactPerson] = useState<string>('Guru BK & Wali Kelas');

  // Options
  const [includeViolationTable, setIncludeViolationTable] = useState<boolean>(true);
  const [includeMaterai, setIncludeMaterai] = useState<boolean>(true);
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

  // Filter students in current class
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  // Sync initial student and level on open
  useEffect(() => {
    if (initialSpLevel) {
      setSpLevel(initialSpLevel);
      setClauses(DEFAULT_SP_CLAUSES[initialSpLevel].clauses);
      setSanctionNote(DEFAULT_SP_CLAUSES[initialSpLevel].defaultSanction);
      setIncludeMeetingSchedule(initialSpLevel === 'SP_2');
    }
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
  }, [initialStudentId, initialSpLevel, isOpen]);

  // When SP Level changes, refresh default clauses and auto letter number
  const handleSelectSpLevel = (level: SPLevel) => {
    setSpLevel(level);
    setClauses(DEFAULT_SP_CLAUSES[level].clauses);
    setSanctionNote(DEFAULT_SP_CLAUSES[level].defaultSanction);
    setIncludeMeetingSchedule(level === 'SP_2');

    const monthRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
    const year = new Date().getFullYear();
    const randomNo = Math.floor(100 + Math.random() * 900);
    const spTag = level === 'SP_1' ? 'SP-1' : level === 'SP_2' ? 'SP-2' : 'SP-3';
    setLetterNumber(`${randomNo}/${spTag}/BK-KESISWAAN/MTs.MI/${monthRomawi}/${year}`);
  };

  // When selected student changes
  useEffect(() => {
    if (currentStudent) {
      if (currentStudent.parentPhone) {
        setParentPhone(currentStudent.parentPhone);
      }

      if (studentViolations.length > 0) {
        const topCases = studentViolations.slice(0, 2).map(v => v.violationType).join(', ');
        setCaseTitle(`${topCases} (Akumulasi: ${totalStudentPoints} Poin)`);
        setCaseChronology(studentViolations[0].description || 'Tercatat pelanggaran kedisiplinan dan tata tertib madrasah.');
        if (studentViolations[0].reporterName) {
          setGuruBkName(studentViolations[0].reporterName);
        }
      } else {
        setCaseTitle(`Pelanggaran Kedisiplinan & Tata Tertib Madrasah`);
        setCaseChronology('Siswa terindikasi melanggar aturan dan tata tertib madrasah yang telah ditetapkan.');
      }

      const monthRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
      const year = new Date().getFullYear();
      const randomNo = Math.floor(100 + Math.random() * 900);
      const spTag = spLevel === 'SP_1' ? 'SP-1' : spLevel === 'SP_2' ? 'SP-2' : 'SP-3';
      setLetterNumber(`${randomNo}/${spTag}/BK-KESISWAAN/MTs.MI/${monthRomawi}/${year}`);
    }
  }, [currentStudent, spLevel]);

  if (!isOpen) return null;

  const handleAddClause = () => {
    if (!newClauseText.trim()) return;
    setClauses([...clauses, newClauseText.trim()]);
    setNewClauseText('');
  };

  const handleRemoveClause = (idx: number) => {
    setClauses(clauses.filter((_, i) => i !== idx));
  };

  const formattedLetterDate = new Date(letterDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const spConfig = DEFAULT_SP_CLAUSES[spLevel];

  // Print Action
  const handlePrint = () => {
    if (!currentStudent) {
      alert('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    const kepalaSekolahName = schoolOfficials?.kepalaSekolah?.name || 'Dra. Hj. Nurjanah, M.Pd';
    const kepalaSekolahNip = schoolOfficials?.kepalaSekolah?.nip || '197208151998032001';
    const kesiswaanName = schoolOfficials?.kesiswaan?.name || 'M. Sholihin, SE';
    const kesiswaanNip = schoolOfficials?.kesiswaan?.nip || '85780';

    const kopHtml = renderKopSuratHtml(schoolOfficials);

    const printHtml = `
      <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.45; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 13px;">
        
        <!-- KOP SURAT RESMI (KONFIGURASI LEMBAGA) -->
        ${kopHtml}

        <!-- HEADER SURAT KEDINASAN -->
        <table style="width: 100%; font-size: 12.5px; margin-bottom: 14px; border-collapse: collapse;">
          <tr>
            <td style="width: 12%; padding: 2px 0; vertical-align: top;">Nomor</td>
            <td style="width: 2%; padding: 2px 0; vertical-align: top;">:</td>
            <td style="width: 48%; padding: 2px 0; font-weight: bold;">${letterNumber || '-'}</td>
            <td style="width: 38%; text-align: right; padding: 2px 0;">${cityLocation || kotaSekolah}, ${formattedLetterDate}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Lampiran</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">1 (Satu) Berkas Lembar Rekap Disiplin</td>
            <td style="padding: 2px 0;"></td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Perihal</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0; font-weight: bold; text-decoration: underline;" colspan="2">
              ${spConfig.perihal}
            </td>
          </tr>
        </table>

        <!-- TUJUAN SURAT -->
        <div style="margin-bottom: 14px; font-size: 13px;">
          <p style="margin: 0;">Kepada Yth.</p>
          <p style="margin: 2px 0 0 0; font-weight: bold;">
            Bapak / Ibu Orang Tua / Wali dari Ananda: <u>${currentStudent.name}</u>
          </p>
          <p style="margin: 2px 0 0 0;">
            di - Tempat / Kediaman
          </p>
        </div>

        <!-- SALAM PEMBUKA -->
        <p style="margin: 0 0 8px 0; text-align: justify; font-style: italic;">
          Assalamu'alaikum Warahmatullahi Wabarakatuh,
        </p>

        <!-- KATA PENGANTAR -->
        <p style="margin: 0 0 10px 0; text-align: justify; text-indent: 28px;">
          Dengan hormat, teriring doa dan salam kami sampaikan semoga Bapak/Ibu senantiasa berada dalam lindungan Allah SWT serta sukses dalam menjalankan aktivitas sehari-hari.
        </p>

        <p style="margin: 0 0 10px 0; text-align: justify;">
          Sehubungan dengan pelaksanaan tata tertib dan pemeliharaan kedisiplinan madrasah Tahun Ajaran ${academicYear}, melalui surat ini pihak Madrasah menerbitkan <strong>${spConfig.title}</strong> kepada siswa dengan identitas sebagai berikut:
        </p>

        <!-- IDENTITAS SISWA -->
        <table style="width: 100%; font-size: 12.5px; margin-bottom: 12px; border-collapse: collapse; margin-left: 10px;">
          <tr>
            <td style="width: 25%; padding: 2px 0; vertical-align: top;">Nama Lengkap</td>
            <td style="width: 3%; padding: 2px 0; vertical-align: top;">:</td>
            <td style="width: 72%; padding: 2px 0; font-weight: bold; text-transform: uppercase;">${currentStudent.name}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">NIS / NISN</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${currentStudent.nisn || currentStudent.kodeUnik || '-'} (No. Absen: ${currentStudent.rollNo || '-'})</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Kelas / Tingkat</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0; font-weight: bold;">Kelas ${currentStudent.className}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Jenis Kelamin</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${currentStudent.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">Nama Orang Tua/Wali</td>
            <td style="padding: 2px 0; vertical-align: top;">:</td>
            <td style="padding: 2px 0;">${parentName || '....................................................................'} (${parentRelation})</td>
          </tr>
        </table>

        <!-- RINCIAN KASUS & AKUMULASI POIN -->
        <div style="background-color: #f8fafc; border: 1px solid #1e293b; padding: 8px 12px; margin-bottom: 12px; font-size: 12px;">
          <p style="margin: 0 0 4px 0; font-weight: bold; text-decoration: underline;">
            POKOK PELANGGARAN & AKUMULASI POIN DISIPLIN:
          </p>
          <p style="margin: 2px 0;">
            <strong>Pelanggaran Terdata:</strong> ${caseTitle || 'Pelanggaran Tata Tertib Madrasah'}
          </p>
          <p style="margin: 2px 0;">
            <strong>Total Akumulasi Poin:</strong> <span style="font-weight: bold; color: #b91c1c; font-size: 13px;">${totalStudentPoints} Poin Pelanggaran</span>
          </p>
          ${caseChronology ? `
            <p style="margin: 2px 0; font-style: italic;">
              <strong>Keterangan / Kronologi:</strong> "${caseChronology}"
            </p>
          ` : ''}
        </div>

        ${includeViolationTable && studentViolations.length > 0 ? `
          <!-- TABEL RIWAYAT PELANGGARAN -->
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;" border="1" cellPadding="4">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
                <th style="width: 6%;">No</th>
                <th style="width: 18%;">Tanggal</th>
                <th style="text-align: left;">Bentuk Pelanggaran</th>
                <th style="width: 14%;">Kategori</th>
                <th style="width: 12%;">Poin</th>
                <th style="width: 22%;">Tindak Lanjut / Status</th>
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

        <!-- BUTIR-BUTIR PERINGATAN / KLAUSUL SP -->
        <p style="margin: 0 0 6px 0; text-align: justify; font-weight: bold;">
          Adapun butir-butir ketetapan dan peringatan yang diberlakukan adalah sebagai berikut:
        </p>

        <ol style="margin: 0 0 10px 0; padding-left: 22px; text-align: justify;">
          ${clauses.map(c => `
            <li style="margin-bottom: 4px;">${c}</li>
          `).join('')}
        </ol>

        <!-- SANKSI RESMI -->
        <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 6px 12px; margin-bottom: 12px; font-size: 12px;">
          <strong>Ketetapan Tindakan / Sanksi Kedisiplinan:</strong>
          <p style="margin: 2px 0 0 0; font-weight: bold; color: #9f1239;">
            ${sanctionNote || spConfig.defaultSanction}
          </p>
        </div>

        ${includeMeetingSchedule ? `
          <!-- JADWAL PEMANGGILAN ORANG TUA (SP-2 / SP-3) -->
          <div style="border: 1px dashed #334155; padding: 8px 12px; margin-bottom: 12px; font-size: 12px; background-color: #f8fafc;">
            <p style="margin: 0 0 4px 0; font-weight: bold; text-decoration: underline;">
              UNDANGAN KEHADIRAN ORANG TUA / WALI MURID KE MADRASAH:
            </p>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="width: 25%; padding: 2px 0;">Hari / Tanggal</td>
                <td style="width: 3%; padding: 2px 0;">:</td>
                <td style="width: 72%; padding: 2px 0; font-weight: bold;">${meetingDayDate}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Waktu / Pukul</td>
                <td style="padding: 2px 0;">:</td>
                <td style="padding: 2px 0; font-weight: bold;">${meetingTime}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Tempat</td>
                <td style="padding: 2px 0;">:</td>
                <td style="padding: 2px 0;">${meetingRoom}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Menghadap</td>
                <td style="padding: 2px 0;">:</td>
                <td style="padding: 2px 0;">${meetingContactPerson}</td>
              </tr>
            </table>
          </div>
        ` : ''}

        <p style="margin: 0 0 16px 0; text-align: justify; text-indent: 28px;">
          Demikian surat peringatan ini disampaikan untuk diperhatikan dan ditaati dengan penuh rasa tanggung jawab demi kebaikan bersama dan tercapainya pembinaan kepribadian ananda. Atas perhatian dan kerja sama yang baik, kami haturkan terima kasih.
        </p>

        <p style="margin: 0 0 14px 0; text-align: justify; font-style: italic;">
          Wassalamu'alaikum Warahmatullahi Wabarakatuh.
        </p>

        <!-- TANDA TANGAN FORMAL (6 KOLOM RESMI) -->
        <table style="width: 100%; font-size: 11.5px; margin-top: 10px; border-collapse: collapse;">
          <tr>
            <td style="width: 33%; text-align: center; vertical-align: top; padding-bottom: 35px;">
              Siswa Yang Bersangkutan,
              <br/>
              ${includeMaterai ? `
                <div style="width: 70px; height: 30px; border: 1px dashed #666; margin: 4px auto; font-size: 8px; line-height: 30px; color: #666; text-align: center;">
                  Materai 10.000
                </div>
              ` : '<br/><br/>'}
              <strong>( ${currentStudent.name} )</strong>
              <div style="font-size: 10px; color: #444;">NIS: ${currentStudent.nisn || '-'}</div>
            </td>

            <td style="width: 33%; text-align: center; vertical-align: top; padding-bottom: 35px;">
              Orang Tua / Wali Siswa,
              <br/><br/><br/><br/>
              <strong>( ${parentName || '...........................................'} )</strong>
              <div style="font-size: 10px; color: #444;">Tanda Tangan & Nama Terang</div>
            </td>

            <td style="width: 33%; text-align: center; vertical-align: top; padding-bottom: 35px;">
              Guru Pembimbing / BK,
              <br/><br/><br/><br/>
              <strong><u>${guruBkName}</u></strong>
              <div style="font-size: 10px; color: #444;">NIP/PegID: ${guruBkNip}</div>
            </td>
          </tr>

          <tr>
            <td style="width: 33%; text-align: center; vertical-align: top;">
              Wali Kelas ${currentStudent.className},
              <br/><br/><br/><br/>
              <strong><u>${waliKelasInfo.name}</u></strong>
              <div style="font-size: 10px; color: #444;">NIP: ${waliKelasInfo.nip || '-'}</div>
            </td>

            <td style="width: 33%; text-align: center; vertical-align: top;">
              Waka Kesiswaan,
              <br/><br/><br/><br/>
              <strong><u>${kesiswaanName}</u></strong>
              <div style="font-size: 10px; color: #444;">NIP: ${kesiswaanNip}</div>
            </td>

            <td style="width: 33%; text-align: center; vertical-align: top;">
              Mengetahui,<br/>Kepala Madrasah,
              <br/><br/><br/><br/>
              <strong><u>${kepalaSekolahName}</u></strong>
              <div style="font-size: 10px; color: #444;">NIP: ${kepalaSekolahNip}</div>
            </td>
          </tr>
        </table>

      </div>
    `;

    printHtmlString(`${spConfig.title}_${currentStudent.name.replace(/\s+/g, '_')}`, printHtml);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md ${
              spLevel === 'SP_1' ? 'bg-amber-500 text-slate-950' :
              spLevel === 'SP_2' ? 'bg-orange-500 text-white' : 'bg-rose-600 text-white'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Cetak Surat Peringatan (SP 1, SP 2, SP 3)
                </h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  spLevel === 'SP_1' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' :
                  spLevel === 'SP_2' ? 'bg-orange-400/20 text-orange-300 border border-orange-400/40' :
                  'bg-rose-400/20 text-rose-300 border border-rose-400/40'
                }`}>
                  {spConfig.badge}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Pembuatan dan pencetakan dokumen resmi Surat Peringatan Siswa & Orang Tua/Wali
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY (2-COLUMNS: CONFIG & LIVE PREVIEW) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* LEFT COLUMN: CONFIGURATION (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* SP LEVEL TABS */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Pilih Tingkat Surat Peringatan (SP):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectSpLevel('SP_1')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                    spLevel === 'SP_1'
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                      : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-900 border border-slate-200'
                  }`}
                >
                  <span className="text-sm font-black">SP - 1</span>
                  <span className="text-[10px] font-bold opacity-90">Peringatan Awal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSpLevel('SP_2')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                    spLevel === 'SP_2'
                      ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-400'
                      : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-900 border border-slate-200'
                  }`}
                >
                  <span className="text-sm font-black">SP - 2</span>
                  <span className="text-[10px] font-bold opacity-90">Peringatan Keras</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSpLevel('SP_3')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                    spLevel === 'SP_3'
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                      : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-900 border border-slate-200'
                  }`}
                >
                  <span className="text-sm font-black">SP - 3</span>
                  <span className="text-[10px] font-bold opacity-90">Sanksi Terakhir</span>
                </button>
              </div>
            </div>

            {/* STUDENT & CLASS SELECTOR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Pilih Sasaran Siswa</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kelas:</label>
                  <select
                    value={selectedClass}
                    onChange={e => {
                      setSelectedClass(e.target.value);
                      const firstInClass = students.find(s => s.className === e.target.value);
                      if (firstInClass) setSelectedStudentId(firstInClass.id);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {classList.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Siswa:*</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-black text-indigo-950 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {classStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        Absen #{st.rollNo} - {st.name} ({st.nisn || 'No NISN'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentStudent && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-indigo-950">{currentStudent.name}</span>
                    <span className="text-indigo-600 text-[11px] block">
                      Kelas {currentStudent.className} • NISN: {currentStudent.nisn || '-'} • Wali: {waliKelasInfo.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Akumulasi Poin</span>
                    <span className="text-sm font-black text-rose-600">{totalStudentPoints} Poin</span>
                  </div>
                </div>
              )}
            </div>

            {/* PARENT INFO & LETTER NUMBER */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Nomor Surat & Identitas Orang Tua / Wali</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Surat Resmi:</label>
                  <input
                    type="text"
                    value={letterNumber}
                    onChange={e => setLetterNumber(e.target.value)}
                    placeholder="Contoh: 102/SP-1/BK/2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Surat:</label>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={e => setLetterDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="Nama Orang Tua / Wali Murid"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. HP / WhatsApp Orang Tua:</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* KASUS & KRONOLOGI */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Pokok Pelanggaran & Uraian Kasus</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Judul / Pokok Pelanggaran:</label>
                  <input
                    type="text"
                    value={caseTitle}
                    onChange={e => setCaseTitle(e.target.value)}
                    placeholder="Contoh: Membolos KBM & Merokok di Lingkungan Sekolah..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kronologi / Uraian Pelanggaran:</label>
                  <textarea
                    rows={2}
                    value={caseChronology}
                    onChange={e => setCaseChronology(e.target.value)}
                    placeholder="Uraikan kejadian atau latar belakang diterbitkannya SP ini..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-normal text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ketetapan Sanksi / Tindak Lanjut:</label>
                  <textarea
                    rows={2}
                    value={sanctionNote}
                    onChange={e => setSanctionNote(e.target.value)}
                    placeholder="Ketetapan sanksi atau konsekuensi yang diberlakukan..."
                    className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-2.5 font-bold text-rose-900 focus:ring-2 focus:ring-rose-500"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* UNDANGAN ORANG TUA KE SEKOLAH (SP-2 / SP-3) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Sertakan Jadwal Pemanggilan Orang Tua ke Madrasah</span>
                </h4>
                <input
                  type="checkbox"
                  checked={includeMeetingSchedule}
                  onChange={e => setIncludeMeetingSchedule(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {includeMeetingSchedule && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hari & Tanggal:</label>
                    <input
                      type="text"
                      value={meetingDayDate}
                      onChange={e => setMeetingDayDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Waktu / Jam:</label>
                    <input
                      type="text"
                      value={meetingTime}
                      onChange={e => setMeetingTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tempat Ruangan:</label>
                    <input
                      type="text"
                      value={meetingRoom}
                      onChange={e => setMeetingRoom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Menghadap Petugas:</label>
                    <input
                      type="text"
                      value={meetingContactPerson}
                      onChange={e => setMeetingContactPerson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* EDIT BUTIR PERINGATAN / KLAUSUL */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                  <Scroll className="w-4 h-4 text-indigo-600" />
                  <span>Butir Ketetapan & Klausul Peringatan ({clauses.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setClauses(DEFAULT_SP_CLAUSES[spLevel].clauses)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Reset Default {spLevel.replace('_', ' ')}
                </button>
              </div>

              <div className="space-y-2">
                {clauses.map((clause, idx) => (
                  <div key={idx} className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-slate-800 leading-relaxed">{clause}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveClause(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newClauseText}
                  onChange={e => setNewClauseText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddClause())}
                  placeholder="Tambahkan butir ketetapan khusus..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddClause}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* EXTRA PRINT OPTIONS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
              <h4 className="text-xs font-black text-slate-900">Opsi Cetak & Tanda Tangan</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeViolationTable}
                    onChange={e => setIncludeViolationTable(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span>Tabel Riwayat Kasus</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeMaterai}
                    onChange={e => setIncludeMaterai(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span>Kotak Materai 10.000</span>
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE DOCUMENT PREVIEW (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center space-x-1.5">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Pratinjau Surat Resmi</span>
              </span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                Format Standar Cetak A4
              </span>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-inner flex-1 overflow-y-auto max-h-[620px] text-[11px] text-slate-800 space-y-3 font-serif">
              
              {/* Kop Mini Preview */}
              <div className="text-center border-b-2 border-black pb-2 space-y-0.5">
                <p className="font-sans font-bold text-[10px] text-slate-600 uppercase">{namaYayasan}</p>
                <p className="font-sans font-black text-xs text-black uppercase">{namaSekolah}</p>
                <p className="font-sans text-[8px] text-slate-500">{fullSchoolAddress}</p>
              </div>

              {/* Title & Number */}
              <div className="text-center py-1">
                <p className="font-black text-xs underline uppercase tracking-wider text-black">
                  {spConfig.title}
                </p>
                <p className="text-[9px] font-mono text-slate-600">
                  Nomor: {letterNumber || '.../SP/BK/2026'}
                </p>
              </div>

              {/* Target */}
              <div className="space-y-0.5 text-[10px]">
                <p>Kepada Yth.</p>
                <p className="font-bold">Bapak/Ibu Orang Tua/Wali Ananda: <u>{currentStudent?.name || 'Nama Siswa'}</u></p>
                <p>di - Tempat</p>
              </div>

              <p className="italic text-[9.5px]">Assalamu'alaikum Wr. Wb.,</p>
              <p className="text-[9.5px] leading-relaxed text-justify">
                Dengan hormat, sehubungan dengan penegakan tata tertib madrasah, dengan ini diterbitkan <strong>{spConfig.title}</strong> kepada:
              </p>

              {/* Student info */}
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[9.5px] space-y-0.5">
                <p><strong>Nama:</strong> {currentStudent?.name || '-'}</p>
                <p><strong>Kelas:</strong> {currentStudent?.className || '-'} (NISN: {currentStudent?.nisn || '-'})</p>
                <p><strong>Akumulasi Poin:</strong> <span className="text-rose-600 font-bold">{totalStudentPoints} Poin</span></p>
                <p><strong>Kasus:</strong> {caseTitle || '-'}</p>
              </div>

              {/* Clauses Preview */}
              <div className="space-y-1">
                <p className="font-bold text-[9.5px]">Ketetapan Peringatan:</p>
                <ol className="list-decimal list-inside space-y-1 text-[9px] leading-relaxed">
                  {clauses.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              </div>

              {/* Sanction preview */}
              <div className="p-2 bg-rose-50 border border-rose-200 text-[9px] text-rose-900 rounded font-bold">
                Sanksi: {sanctionNote}
              </div>

              {/* Signatures mini */}
              <div className="pt-3 border-t border-slate-200 text-center text-[8.5px] grid grid-cols-3 gap-1">
                <div>
                  <p>Siswa,</p>
                  <p className="mt-5 font-bold">({currentStudent?.name || 'Siswa'})</p>
                </div>
                <div>
                  <p>Orang Tua/Wali,</p>
                  <p className="mt-5 font-bold">({parentName || 'Orang Tua'})</p>
                </div>
                <div>
                  <p>Guru BK,</p>
                  <p className="mt-5 font-bold"><u>{guruBkName}</u></p>
                </div>
              </div>

            </div>

            {/* ACTION PRINT BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3.5 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center space-x-2 text-sm"
              >
                <Printer className="w-5 h-5 text-amber-400" />
                <span>Cetak / Print PDF {spConfig.title}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useRef, useMemo } from 'react';
import { Student } from '../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Users,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
  Search,
  Sparkles,
  Key,
  ShieldCheck,
  UserCheck,
  UserPlus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadStudentExcelTemplate, downloadEmisStudentExcelTemplate } from '../utils/export';
import { normalizeStudentName, normalizeClassName } from '../utils/studentMatcher';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classList: string[];
  currentStudents: Student[];
  schoolName?: string;
  onImport: (importedStudents: Student[], mode: 'merge_key' | 'append' | 'replace_class' | 'replace_all') => void;
}

export type MatchStatus = 'both' | 'nisn' | 'name' | 'new';

export interface ParsedRowPreview {
  rawNo?: any;
  name: string;
  className: string;
  rollNo: number;
  kodeUnik: string;
  nisn?: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  umur?: string;
  statusSiswa?: string;
  gender?: 'L' | 'P';
  alamat?: string;
  parentPhone?: string;
  phone?: string;
  kebutuhanKhusus?: string;
  disabilitas?: string;
  noKip?: string;
  namaAyah?: string;
  namaIbu?: string;
  namaWali?: string;
  
  // Matching Info
  matchStatus: MatchStatus;
  matchedStudent?: Student;
  isValid: boolean;
  issueNote?: string;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  classList,
  currentStudents,
  schoolName = 'Madrasah',
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRowPreview[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isEmisFormatDetected, setIsEmisFormatDetected] = useState(false);

  // Settings
  const [targetClassMode, setTargetClassMode] = useState<'auto' | 'custom'>('auto');
  const [customTargetClass, setCustomTargetClass] = useState<string>(classList[0] || 'VII A');
  const [importMode, setImportMode] = useState<'merge_key' | 'append' | 'replace_class' | 'replace_all'>('merge_key');
  
  // Preview Filters
  const [previewFilter, setPreviewFilter] = useState<'all' | 'matched' | 'new'>('all');
  const [previewSearch, setPreviewSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDownloadEmisTemplate = () => {
    downloadEmisStudentExcelTemplate(classList, schoolName);
  };

  const handleDownloadStandardTemplate = () => {
    downloadStudentExcelTemplate(classList, schoolName);
  };

  const cleanHeaderKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const cleanStringVal = (val: any): string => {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    // Strip leading single quote often added by Excel for text numbers e.g. '320104...
    if (str.startsWith("'")) {
      str = str.substring(1).trim();
    }
    return str;
  };

  const cleanDigitsOnly = (val?: string): string => {
    if (!val) return '';
    return String(val).replace(/[^0-9]/g, '');
  };

  // Convert Excel dates to YYYY-MM-DD
  const parseExcelDateValue = (rawDate: any): string => {
    if (!rawDate) return '';
    if (typeof rawDate === 'number') {
      // Excel serial date number
      const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    const str = cleanStringVal(rawDate);
    if (!str || str === '-') return '';

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }

    // Handle YYYY-MM-DD
    const yyyymmdd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return str;
  };

  // Extract clean class name from EMIS format like "Kelas 9 - 9-A1" or "Kelas 7 - VII A"
  const resolveRombelClass = (rawRombel: string, activeClassList: string[]): string => {
    if (!rawRombel) return activeClassList[0] || 'VII A';
    let trimmed = cleanStringVal(rawRombel);
    if (!trimmed || trimmed === '-') return activeClassList[0] || 'VII A';

    // 1. Direct match with classList
    const direct = activeClassList.find(c => c.toLowerCase() === trimmed.toLowerCase());
    if (direct) return direct;

    // 2. If format is "Kelas X - RombelName"
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      const rombelPart = parts.slice(1).join('-').trim();
      const matchedRombel = activeClassList.find(c => 
        c.toLowerCase() === rombelPart.toLowerCase() ||
        normalizeClassName(c) === normalizeClassName(rombelPart)
      );
      if (matchedRombel) return matchedRombel;
      if (rombelPart) return rombelPart;
    }

    // 3. Match normalized form
    const norm = normalizeClassName(trimmed);
    const matchedNorm = activeClassList.find(c => normalizeClassName(c) === norm);
    if (matchedNorm) return matchedNorm;

    // 4. Clean "Kelas" prefix if remaining
    if (trimmed.toLowerCase().startsWith('kelas ')) {
      const stripped = trimmed.substring(6).trim();
      const matchStripped = activeClassList.find(c => c.toLowerCase() === stripped.toLowerCase());
      if (matchStripped) return matchStripped;
      return stripped;
    }

    return trimmed;
  };

  const parseExcelFile = async (uploadedFile: File) => {
    setIsParsing(true);
    setParseError(null);
    setFileName(uploadedFile.name);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Look for worksheet
      let targetSheetName = workbook.SheetNames[0];
      const preferred = workbook.SheetNames.find(n => 
        n.toLowerCase().includes('siswa') || n.toLowerCase().includes('emis') || n.toLowerCase().includes('data') || n.toLowerCase().includes('murid')
      );
      if (preferred) targetSheetName = preferred;

      const worksheet = workbook.Sheets[targetSheetName];
      if (!worksheet) {
        throw new Error('Lembar kerja (Sheet) di dalam file Excel kosong atau tidak terbaca.');
      }

      // Convert sheet to JSON rows
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      if (!rawJson || rawJson.length === 0) {
        throw new Error('File Excel tidak memiliki baris data siswa yang dapat diproses.');
      }

      // Check for EMIS 4.0 indicators
      const firstRowKeys = Object.keys(rawJson[0] || {}).map(k => cleanHeaderKey(k));
      const hasEmisTingkat = firstRowKeys.some(k => k.includes('tingkat') || k.includes('rombel'));
      const hasEmisNik = firstRowKeys.some(k => k.includes('nik'));
      const hasEmisTempat = firstRowKeys.some(k => k.includes('tempatlahir'));
      const hasEmisOrtu = firstRowKeys.some(k => k.includes('ayah') || k.includes('ibu'));
      const isEmis = (hasEmisTingkat && hasEmisNik) || (hasEmisTempat && hasEmisOrtu);
      setIsEmisFormatDetected(isEmis);

      const rows: ParsedRowPreview[] = [];
      const classRollTracker: Record<string, number> = {};

      // Build indexing of current students for matching on NISN & Name (Kunci Nama & NISN)
      const nisnMap = new Map<string, Student>();
      const nameMap = new Map<string, Student>();

      currentStudents.forEach(st => {
        const cleanNisn = cleanDigitsOnly(st.nisn);
        if (cleanNisn && cleanNisn.length >= 6) {
          nisnMap.set(cleanNisn, st);
        }
        const normName = normalizeStudentName(st.name);
        if (normName && !nameMap.has(normName)) {
          nameMap.set(normName, st);
        }
      });

      rawJson.forEach((row, index) => {
        // Map normalized header keys
        const normalizedRow: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          normalizedRow[cleanHeaderKey(k)] = v;
        }

        // 1. Name
        const nameVal = 
          normalizedRow['namalengkap'] ||
          normalizedRow['namalengkapsiswa'] ||
          normalizedRow['namasiswa'] ||
          normalizedRow['nama'] ||
          normalizedRow['name'] ||
          normalizedRow['namamurid'] ||
          '';
        const nameStr = cleanStringVal(nameVal);
        if (!nameStr) return; // Skip empty row

        // 2. NISN
        const nisnVal = normalizedRow['nisn'] || normalizedRow['nomornisn'] || '';
        const nisnStr = cleanStringVal(nisnVal);

        // 3. NIK
        const nikVal = normalizedRow['nik'] || normalizedRow['niksiswa'] || normalizedRow['noktp'] || '';
        const nikStr = cleanStringVal(nikVal);

        // 4. Tempat Lahir
        const tempatLahirVal = normalizedRow['tempatlahir'] || normalizedRow['tempatlahirsplay'] || '';
        const tempatLahirStr = cleanStringVal(tempatLahirVal);

        // 5. Tanggal Lahir
        const tglLahirVal = normalizedRow['tanggallahir'] || normalizedRow['tgllahir'] || '';
        const tglLahirStr = parseExcelDateValue(tglLahirVal);

        // 6. Tingkat - Rombel / Kelas
        const rombelVal = 
          normalizedRow['tingkatrombel'] ||
          normalizedRow['tingkatdanrombel'] ||
          normalizedRow['rombel'] ||
          normalizedRow['kelas'] ||
          normalizedRow['tingkat'] ||
          normalizedRow['class'] ||
          normalizedRow['kelasrombel'] ||
          '';
        const rawRombelStr = cleanStringVal(rombelVal);
        const resolvedClass = resolveRombelClass(rawRombelStr, classList);

        // 7. Umur
        const umurVal = normalizedRow['umur'] || normalizedRow['usia'] || '';
        const umurStr = cleanStringVal(umurVal);

        // 8. Status
        const statusVal = normalizedRow['status'] || normalizedRow['statussiswa'] || 'Aktif';
        const statusStr = cleanStringVal(statusVal) || 'Aktif';

        // 9. Gender (L/P)
        const genderVal = normalizedRow['jeniskelamin'] || normalizedRow['jeniskelaminlp'] || normalizedRow['jk'] || normalizedRow['gender'] || '';
        const genderRaw = cleanStringVal(genderVal).toUpperCase();
        let gender: 'L' | 'P' | undefined = undefined;
        if (genderRaw.startsWith('L') || genderRaw.includes('LAKI') || genderRaw.includes('PRIA')) {
          gender = 'L';
        } else if (genderRaw.startsWith('P') || genderRaw.includes('PEREMPUAN') || genderRaw.includes('WANITA')) {
          gender = 'P';
        }

        // 10. Alamat
        const alamatVal = normalizedRow['alamat'] || normalizedRow['alamatlengkap'] || normalizedRow['domisili'] || '';
        const alamatStr = cleanStringVal(alamatVal);

        // 11. No Telepon / No HP
        const phoneVal = 
          normalizedRow['notelepon'] ||
          normalizedRow['notelp'] ||
          normalizedRow['nohp'] ||
          normalizedRow['nowa'] ||
          normalizedRow['nohporangtua'] ||
          normalizedRow['nohportu'] ||
          normalizedRow['telepon'] ||
          '';
        const phoneStr = cleanStringVal(phoneVal);

        // 12. Kebutuhan Khusus
        const kebKhususVal = normalizedRow['kebutuhankhusus'] || normalizedRow['berkebutuhankhusus'] || '';
        const kebKhususStr = cleanStringVal(kebKhususVal);

        // 13. Disabilitas
        const disabilitasVal = normalizedRow['disabilitas'] || normalizedRow['ragamdisabilitas'] || '';
        const disabilitasStr = cleanStringVal(disabilitasVal);

        // 14. Nomor KIP/PIP
        const kipVal = 
          normalizedRow['nomorkippip'] ||
          normalizedRow['nomorkip'] ||
          normalizedRow['nokippip'] ||
          normalizedRow['nokip'] ||
          normalizedRow['kip'] ||
          normalizedRow['pip'] ||
          '';
        const kipStr = cleanStringVal(kipVal);

        // 15. Nama Ayah Kandung
        const ayahVal = normalizedRow['namaayahkandung'] || normalizedRow['namaayah'] || normalizedRow['ayah'] || '';
        const ayahStr = cleanStringVal(ayahVal);

        // 16. Nama Ibu Kandung
        const ibuVal = normalizedRow['namaibukandung'] || normalizedRow['namaibu'] || normalizedRow['ibu'] || '';
        const ibuStr = cleanStringVal(ibuVal);

        // 17. Nama Wali
        const waliVal = normalizedRow['namawali'] || normalizedRow['wali'] || '';
        const waliStr = cleanStringVal(waliVal);

        // 18. Roll No / No Absen
        if (!classRollTracker[resolvedClass]) {
          classRollTracker[resolvedClass] = 1;
        }
        const rollVal = normalizedRow['noabsen'] || normalizedRow['absen'] || normalizedRow['nomorabsen'] || normalizedRow['no'] || '';
        let parsedRoll = parseInt(cleanDigitsOnly(String(rollVal)), 10);
        if (isNaN(parsedRoll) || parsedRoll <= 0) {
          parsedRoll = classRollTracker[resolvedClass];
        }
        classRollTracker[resolvedClass] = parsedRoll + 1;

        // 19. Kode Unik NIS
        const kodeVal = normalizedRow['kodeuniknis'] || normalizedRow['kodeunik'] || normalizedRow['nis'] || normalizedRow['kode'] || '';
        let kodeStr = cleanStringVal(kodeVal);
        if (!kodeStr) {
          const cleanClassCode = resolvedClass.replace(/[^a-zA-Z0-9]/g, '');
          kodeStr = `${cleanClassCode}${parsedRoll.toString().padStart(2, '0')}`;
        }

        // ==========================================
        // MATCHING STRATEGY: KUNCI DI NAMA & NISN
        // ==========================================
        const cleanRowNisn = cleanDigitsOnly(nisnStr);
        const normRowName = normalizeStudentName(nameStr);

        let matchedStudent: Student | undefined = undefined;
        let matchStatus: MatchStatus = 'new';

        const matchByNisn = cleanRowNisn && cleanRowNisn.length >= 6 ? nisnMap.get(cleanRowNisn) : undefined;
        const matchByName = normRowName ? nameMap.get(normRowName) : undefined;

        if (matchByNisn && matchByName && matchByNisn.id === matchByName.id) {
          matchedStudent = matchByNisn;
          matchStatus = 'both';
        } else if (matchByNisn) {
          matchedStudent = matchByNisn;
          matchStatus = 'nisn';
        } else if (matchByName) {
          matchedStudent = matchByName;
          matchStatus = 'name';
        } else {
          matchStatus = 'new';
        }

        rows.push({
          rawNo: index + 1,
          name: nameStr,
          className: resolvedClass,
          rollNo: parsedRoll,
          kodeUnik: kodeStr,
          nisn: nisnStr || undefined,
          nik: nikStr || undefined,
          tempatLahir: tempatLahirStr || undefined,
          tanggalLahir: tglLahirStr || undefined,
          umur: umurStr || undefined,
          statusSiswa: statusStr || 'Aktif',
          gender,
          alamat: alamatStr || undefined,
          parentPhone: phoneStr || undefined,
          phone: phoneStr || undefined,
          kebutuhanKhusus: kebKhususStr || undefined,
          disabilitas: disabilitasStr || undefined,
          noKip: kipStr || undefined,
          namaAyah: ayahStr || undefined,
          namaIbu: ibuStr || undefined,
          namaWali: waliStr || undefined,
          matchStatus,
          matchedStudent,
          isValid: true
        });
      });

      if (rows.length === 0) {
        throw new Error('Tidak ditemukan data baris nama siswa yang valid di file ini. Pastikan format kolom sesuai dengan EMIS 4.0 atau Template Excel.');
      }

      setParsedRows(rows);
      setFile(uploadedFile);
    } catch (err: any) {
      console.error('Failed to parse excel:', err);
      setParseError(err.message || 'Gagal membaca file Excel. Pastikan file valid (.xlsx, .xls, .csv).');
      setParsedRows([]);
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      parseExcelFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      parseExcelFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    const finalStudents: Student[] = parsedRows.map((r, idx) => {
      const assignedClass = targetClassMode === 'custom' ? customTargetClass : r.className;
      const cleanClassKey = assignedClass.replace(/\s+/g, '');
      
      // If student matched an existing student and mode is merge_key, preserve original ID!
      let finalId = `stu-emis-${cleanClassKey}-${Date.now().toString().slice(-4)}-${idx + 1}`;
      let finalRollNo = r.rollNo;
      let finalKodeUnik = r.kodeUnik || `${cleanClassKey}${r.rollNo.toString().padStart(2, '0')}`;

      if (r.matchedStudent && importMode === 'merge_key') {
        finalId = r.matchedStudent.id;
        finalKodeUnik = r.matchedStudent.kodeUnik || finalKodeUnik;
        finalRollNo = r.matchedStudent.rollNo || finalRollNo;
      }

      // Merge existing student attributes if present
      const baseExisting = r.matchedStudent && importMode === 'merge_key' ? r.matchedStudent : {};

      const studentResult: Student = {
        ...baseExisting,
        id: finalId,
        name: r.name,
        className: assignedClass,
        rollNo: finalRollNo,
        kodeUnik: finalKodeUnik,
        nisn: r.nisn || (baseExisting as any)?.nisn,
        nik: r.nik || (baseExisting as any)?.nik,
        tempatLahir: r.tempatLahir || (baseExisting as any)?.tempatLahir,
        tanggalLahir: r.tanggalLahir || (baseExisting as any)?.tanggalLahir,
        umur: r.umur || (baseExisting as any)?.umur,
        statusSiswa: r.statusSiswa || (baseExisting as any)?.statusSiswa || 'Aktif',
        gender: r.gender || (baseExisting as any)?.gender,
        alamat: r.alamat || (baseExisting as any)?.alamat,
        parentPhone: r.parentPhone || (baseExisting as any)?.parentPhone,
        phone: r.phone || (baseExisting as any)?.phone,
        kebutuhanKhusus: r.kebutuhanKhusus !== '-' ? (r.kebutuhanKhusus || (baseExisting as any)?.kebutuhanKhusus) : undefined,
        disabilitas: r.disabilitas !== '-' ? (r.disabilitas || (baseExisting as any)?.disabilitas) : undefined,
        noKip: r.noKip !== '-' ? (r.noKip || (baseExisting as any)?.noKip) : undefined,
        namaAyah: r.namaAyah !== '-' ? (r.namaAyah || (baseExisting as any)?.namaAyah) : undefined,
        namaIbu: r.namaIbu !== '-' ? (r.namaIbu || (baseExisting as any)?.namaIbu) : undefined,
        namaWali: r.namaWali !== '-' ? (r.namaWali || (baseExisting as any)?.namaWali) : undefined
      };

      return studentResult;
    });

    onImport(finalStudents, importMode);
    onClose();
  };

  // Group summary for preview
  const classBreakdown = useMemo(() => {
    return parsedRows.reduce((acc, row) => {
      const cls = targetClassMode === 'custom' ? customTargetClass : row.className;
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [parsedRows, targetClassMode, customTargetClass]);

  const matchStats = useMemo(() => {
    let both = 0;
    let nisn = 0;
    let name = 0;
    let newCount = 0;

    parsedRows.forEach(r => {
      if (r.matchStatus === 'both') both++;
      else if (r.matchStatus === 'nisn') nisn++;
      else if (r.matchStatus === 'name') name++;
      else newCount++;
    });

    return {
      both,
      nisn,
      name,
      totalMatched: both + nisn + name,
      newCount,
      total: parsedRows.length
    };
  }, [parsedRows]);

  const filteredPreviewRows = useMemo(() => {
    return parsedRows.filter(r => {
      if (previewFilter === 'matched' && r.matchStatus === 'new') return false;
      if (previewFilter === 'new' && r.matchStatus !== 'new') return false;

      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchNisn = r.nisn?.toLowerCase().includes(q);
        const matchNik = r.nik?.toLowerCase().includes(q);
        const matchClass = r.className.toLowerCase().includes(q);
        return matchName || matchNisn || matchNik || matchClass;
      }
      return true;
    });
  }, [parsedRows, previewFilter, previewSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-indigo-950 text-white px-5 py-3.5 sm:py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  EMIS 4.0 & Excel Ready
                </span>
                <span className="text-[10px] text-slate-300 font-bold hidden sm:inline-block">
                  {schoolName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Import Data Siswa (Format Hasil Download EMIS 4.0 / Excel)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          
          {/* STEP 1: Download Templates Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-emerald-700 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h4 className="font-black text-emerald-950 text-sm flex items-center space-x-1.5">
                  <span>1. Format Kolom Sesuai EMIS 4.0 Kemenag</span>
                </h4>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  Sistem mendukung 100% kolom hasil download EMIS 4.0 (18 Kolom: <strong>Nama Lengkap, NISN, NIK, Tempat/Tgl Lahir, Tingkat-Rombel, Umur, Status, Jenis Kelamin, Alamat, No Telepon, Kebutuhan Khusus, Disabilitas, KIP/PIP, Nama Orang Tua & Wali</strong>).
                  Kunci identifikasi utama berbasis <strong>Nama dan NISN</strong>.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
              <button
                onClick={handleDownloadEmisTemplate}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer border border-emerald-800"
                title="Unduh Template Excel dengan 18 Kolom EMIS 4.0 Kemenag"
              >
                <Download className="w-3.5 h-3.5 text-emerald-200" />
                <span>Format EMIS 4.0 (.xlsx)</span>
              </button>
              <button
                onClick={handleDownloadStandardTemplate}
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 border border-slate-300 shadow-2xs transition cursor-pointer"
                title="Unduh Template Excel Sederhana (8 Kolom)"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Format Sederhana</span>
              </button>
            </div>
          </div>

          {/* STEP 2: Drag & Drop Upload Zone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                2. Pilih atau Tarik File Hasil Download EMIS 4.0 / Excel (.xlsx / .xls / .csv)
              </label>
              {isEmisFormatDetected && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 animate-fade-in">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Format EMIS 4.0 Terdeteksi</span>
                </span>
              )}
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center space-y-2 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              {file ? (
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900 text-sm flex items-center justify-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{fileName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • Klik untuk mengganti file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-xs">
                    Tarik file hasil unduh EMIS 4.0 ke sini, atau <span className="text-emerald-700 underline font-extrabold">Pilih File dari Komputer</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Mendukung file format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                  </p>
                </div>
              )}
            </div>

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2 font-bold animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* STEP 3 & 4: Options & Preview (When File Loaded) */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              
              {/* Option Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {/* Option: Import Mode */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mode Import & Kunci Identifikasi</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      importMode === 'merge_key' ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="merge_key"
                        checked={importMode === 'merge_key'}
                        onChange={() => setImportMode('merge_key')}
                        className="text-emerald-600 focus:ring-emerald-500 mt-0.5"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-emerald-950">Perbarui & Tambah Berdasarkan NISN / Nama (Upsert)</span>
                          <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded">Rekomendasi</span>
                        </div>
                        <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">
                          Memperbarui profil siswa yang cocok (kunci NISN/Nama) dengan data EMIS terbaru tanpa menghapus ID/riwayat presensi, nilai, atau tagihan. Siswa baru ditambahkan otomatis.
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-start space-x-2.5 p-2 rounded-lg border cursor-pointer transition ${
                      importMode === 'append' ? 'bg-indigo-50/80 border-indigo-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-xs text-indigo-950">Tambahkan Semua Sebagai Siswa Baru (Append)</span>
                        <p className="text-[10px] text-slate-500">Semua baris di Excel ditambahkan sebagai entri siswa baru tanpa memeriksa data yang ada.</p>
                      </div>
                    </label>

                    <label className={`flex items-start space-x-2.5 p-2 rounded-lg border cursor-pointer transition ${
                      importMode === 'replace_class' ? 'bg-amber-50/80 border-amber-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="replace_class"
                        checked={importMode === 'replace_class'}
                        onChange={() => setImportMode('replace_class')}
                        className="text-amber-600 focus:ring-amber-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-xs text-amber-950">Timpa Hanya Rombel Kelas Terkait</span>
                        <p className="text-[10px] text-slate-500">Hanya memperbarui rombel kelas yang termuat di file Excel, kelas lain tetap aman.</p>
                      </div>
                    </label>

                    <label className={`flex items-start space-x-2.5 p-2 rounded-lg border cursor-pointer transition ${
                      importMode === 'replace_all' ? 'bg-rose-50/80 border-rose-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="replace_all"
                        checked={importMode === 'replace_all'}
                        onChange={() => setImportMode('replace_all')}
                        className="text-rose-600 focus:ring-rose-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-xs text-rose-950">Ganti Seluruh Data Siswa (Replace All)</span>
                        <p className="text-[10px] text-slate-500">Menghapus seluruh siswa sekolah saat ini dan menggantikan dengan isi file Excel ini.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Option: Target Class Placement */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Penempatan Rombel Kelas</span>
                  </label>
                  
                  <div className="space-y-1.5">
                    <label className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      targetClassMode === 'auto' ? 'bg-white border-emerald-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="targetClassMode"
                        checked={targetClassMode === 'auto'}
                        onChange={() => setTargetClassMode('auto')}
                        className="text-emerald-600 focus:ring-emerald-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900">Otomatis dari Kolom "Tingkat - Rombel" / "Kelas"</span>
                        <p className="text-[10px] text-slate-500">Masing-masing siswa ditempatkan ke rombel kelas sesuai file EMIS (misal: "Kelas 9 - 9-A1" atau "VII A").</p>
                      </div>
                    </label>

                    <label className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      targetClassMode === 'custom' ? 'bg-white border-emerald-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="targetClassMode"
                        checked={targetClassMode === 'custom'}
                        onChange={() => setTargetClassMode('custom')}
                        className="text-emerald-600 focus:ring-emerald-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-xs text-slate-900">Tetapkan Semua ke 1 Kelas Tertentu:</span>
                        {targetClassMode === 'custom' && (
                          <select
                            value={customTargetClass}
                            onChange={e => setCustomTargetClass(e.target.value)}
                            className="mt-1.5 w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {classList.map(c => (
                              <option key={c} value={c}>Kelas {c}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Summary Breakdown Rombel */}
                  <div className="mt-2 bg-slate-100/80 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">Distribusi Rombel Terdeteksi:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(classBreakdown).map(([cls, count]) => (
                        <span key={cls} className="bg-white text-slate-800 border border-slate-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                          {cls}: <strong className="text-emerald-700">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Statistics Bar (KUNCI DI NAMA & NISN) */}
              <div className="bg-gradient-to-r from-teal-900 to-indigo-950 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black">
                      Total Ditemukan: <span className="text-emerald-300 font-mono text-sm">{matchStats.total} Siswa</span>
                    </span>
                  </div>

                  <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      <span>{matchStats.totalMatched} Cocok (Update Profil)</span>
                    </span>
                    <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <UserPlus className="w-3 h-3 text-indigo-300" />
                      <span>{matchStats.newCount} Siswa Baru</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-lg">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      previewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Semua ({matchStats.total})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('matched')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      previewFilter === 'matched' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Cocok ({matchStats.totalMatched})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('new')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      previewFilter === 'new' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Baru ({matchStats.newCount})
                  </button>
                </div>
              </div>

              {/* Preview Table Header & Search */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Pratinjau Data Siswa EMIS 4.0:
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                      Menampilkan {filteredPreviewRows.length} dari {parsedRows.length} baris
                    </span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama / NISN / NIK..."
                      value={previewSearch}
                      onChange={e => setPreviewSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Table with all EMIS columns */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[9.5px]">
                        <th className="py-2 px-2 text-center w-8">No</th>
                        <th className="py-2 px-2 text-center w-28">Status Kunci</th>
                        <th className="py-2 px-2.5 w-36">Nama Lengkap</th>
                        <th className="py-2 px-2 text-center w-24">NISN</th>
                        <th className="py-2 px-2 text-center w-28">NIK</th>
                        <th className="py-2 px-2 text-center w-20">Rombel</th>
                        <th className="py-2 px-2 text-center w-10">L/P</th>
                        <th className="py-2 px-2 text-center w-16">Umur</th>
                        <th className="py-2 px-2.5 w-32">Tempat, Tgl Lahir</th>
                        <th className="py-2 px-2.5 w-40">Alamat</th>
                        <th className="py-2 px-2.5 w-28">Nama Ayah</th>
                        <th className="py-2 px-2.5 w-28">Nama Ibu</th>
                        <th className="py-2 px-2 text-center w-16">Status</th>
                        <th className="py-2 px-2 text-center w-20">KIP/PIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="py-8 text-center text-slate-400 font-bold text-xs">
                            Tidak ada siswa yang sesuai filter pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-1.5 px-2 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                            
                            {/* Status Kunci Badge */}
                            <td className="py-1.5 px-2 text-center">
                              {row.matchStatus === 'both' ? (
                                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center space-x-1" title="Cocok dengan data siswa saat ini berdasarkan NISN dan Nama Lengkap">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                  <span>NISN & Nama Cocok</span>
                                </span>
                              ) : row.matchStatus === 'nisn' ? (
                                <span className="bg-cyan-100 text-cyan-900 border border-cyan-300 font-black text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center space-x-1" title="Cocok dengan data siswa saat ini berdasarkan NISN">
                                  <Key className="w-2.5 h-2.5 text-cyan-600 shrink-0" />
                                  <span>NISN Cocok</span>
                                </span>
                              ) : row.matchStatus === 'name' ? (
                                <span className="bg-blue-100 text-blue-900 border border-blue-300 font-black text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center space-x-1" title="Cocok dengan data siswa saat ini berdasarkan Nama Lengkap">
                                  <UserCheck className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                  <span>Nama Cocok</span>
                                </span>
                              ) : (
                                <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center space-x-1">
                                  <UserPlus className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                  <span>Siswa Baru</span>
                                </span>
                              )}
                            </td>

                            <td className="py-1.5 px-2.5 font-bold text-slate-900">
                              <div>{row.name}</div>
                              {row.matchedStudent && (
                                <div className="text-[9px] text-emerald-700 font-medium truncate max-w-[140px]">
                                  (ID: {row.matchedStudent.id})
                                </div>
                              )}
                            </td>

                            <td className="py-1.5 px-2 text-center font-mono font-bold text-indigo-950 bg-slate-50/50">
                              {row.nisn || '-'}
                            </td>

                            <td className="py-1.5 px-2 text-center font-mono text-[10px] text-slate-700">
                              {row.nik || '-'}
                            </td>

                            <td className="py-1.5 px-2 text-center font-extrabold text-indigo-900 bg-indigo-50/40">
                              {targetClassMode === 'custom' ? customTargetClass : row.className}
                            </td>

                            <td className="py-1.5 px-2 text-center font-bold">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                row.gender === 'L' ? 'bg-sky-100 text-sky-800' : row.gender === 'P' ? 'bg-pink-100 text-pink-800' : 'text-slate-400'
                              }`}>
                                {row.gender || '-'}
                              </span>
                            </td>

                            <td className="py-1.5 px-2 text-center text-slate-600 text-[10px]">
                              {row.umur || '-'}
                            </td>

                            <td className="py-1.5 px-2.5 text-slate-700 text-[10px]">
                              {row.tempatLahir ? `${row.tempatLahir}, ` : ''}{row.tanggalLahir || '-'}
                            </td>

                            <td className="py-1.5 px-2.5 text-slate-600 text-[10px] truncate max-w-[160px]" title={row.alamat}>
                              {row.alamat || '-'}
                            </td>

                            <td className="py-1.5 px-2.5 text-slate-700 text-[10px] truncate max-w-[110px]" title={row.namaAyah}>
                              {row.namaAyah || '-'}
                            </td>

                            <td className="py-1.5 px-2.5 text-slate-700 text-[10px] truncate max-w-[110px]" title={row.namaIbu}>
                              {row.namaIbu || '-'}
                            </td>

                            <td className="py-1.5 px-2 text-center">
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                {row.statusSiswa || 'Aktif'}
                              </span>
                            </td>

                            <td className="py-1.5 px-2 text-center font-mono text-[9.5px] text-slate-600">
                              {row.noKip || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="text-[11px] text-slate-600 font-medium">
            {parsedRows.length > 0 ? (
              <span>
                Siap memproses <strong>{parsedRows.length} siswa</strong> ({matchStats.totalMatched} diperbarui, {matchStats.newCount} baru) ke database madrasah.
              </span>
            ) : (
              <span>Silakan pilih atau tarik file format EMIS 4.0 / Excel terlebih dahulu.</span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              disabled={parsedRows.length === 0 || isParsing}
              onClick={handleExecuteImport}
              className={`px-5 py-2 text-white font-black rounded-xl text-xs flex items-center space-x-2 shadow-sm transition cursor-pointer ${
                parsedRows.length > 0 && !isParsing
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer shadow-md'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {importMode === 'merge_key'
                  ? `Simpan & Sinkronkan (${parsedRows.length} Siswa)`
                  : `Proses Impor (${parsedRows.length} Siswa)`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

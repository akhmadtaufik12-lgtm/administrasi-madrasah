import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Users,
  BookOpen,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  Info,
  Clock,
  ArrowRight,
  ClipboardPaste,
  ShieldAlert,
  CalendarDays,
  FileText,
  Trash2
} from 'lucide-react';
import { TeachingSchedule, Teacher, Subject, DayOfWeek } from '../types';
import { DAYS_OF_WEEK, STANDARD_SCHEDULE_PERIODS, CLASSES_LIST } from '../data/initialData';
import { OFFICIAL_ASC_SCHEDULES } from '../data/officialSchedules';
import { downloadAscTimetableExcelTemplate, downloadTabularScheduleTemplate } from '../utils/export';

interface UploadJadwalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedules: TeachingSchedule[];
  teachers: Teacher[];
  subjects: Subject[];
  classList: string[];
  schoolName?: string;
  academicYear?: string;
  semester?: string;
  initialTab?: 'pdf' | 'file' | 'paste' | 'preset';
  onImport: (newSchedules: TeachingSchedule[], mode: 'replace' | 'merge') => Promise<void> | void;
  onDeleteAll?: () => void;
}

// Normalized Subject dictionary for intelligent auto-matching
const SUBJECT_SYNONYMS: Record<string, string> = {
  'ips': 'Ilmu Pengetahuan Sosial',
  'ilmu pengetahuan sosial': 'Ilmu Pengetahuan Sosial',
  'ipa': 'Ilmu Pengetahuan Alam',
  'ilmu pengetahuan alam': 'Ilmu Pengetahuan Alam',
  'mtk': 'Matematika',
  'matematika': 'Matematika',
  'bind': 'Bahasa Indonesia',
  'bahasa indonesia': 'Bahasa Indonesia',
  'eng': 'Bahasa Inggris (ENGLISH)',
  'english': 'Bahasa Inggris (ENGLISH)',
  'bahasa english': 'Bahasa Inggris (ENGLISH)',
  'bahasa inggris': 'Bahasa Inggris (ENGLISH)',
  'b. inggris': 'Bahasa Inggris (ENGLISH)',
  'ski': 'Sejarah Kebudayaan Islam (SKI)',
  'sejarah kebudayaan islam': 'Sejarah Kebudayaan Islam (SKI)',
  'aqh': "Al-Qur'an Hadits",
  'qurdis': "Al-Qur'an Hadits",
  'quran hadits': "Al-Qur'an Hadits",
  'al quran hadist': "Al-Qur'an Hadits",
  "al qur'an hadist": "Al-Qur'an Hadits",
  "al-qur'an hadits": "Al-Qur'an Hadits",
  'barab': 'Bahasa Arab',
  'bahasa arab': 'Bahasa Arab',
  'b. arab': 'Bahasa Arab',
  'bsund': 'Bahasa Sunda',
  'bahasa sunda': 'Bahasa Sunda',
  'b. sunda': 'Bahasa Sunda',
  'btq': "Baca Tulis Al-Qur'an (BTQ)",
  "baca tulis qur'an": "Baca Tulis Al-Qur'an (BTQ)",
  "baca tulis al-qur'an": "Baca Tulis Al-Qur'an (BTQ)",
  'baca tulis quran': "Baca Tulis Al-Qur'an (BTQ)",
  'ppkn': 'Pancasila & Kewarganegaraan',
  'pkn': 'Pancasila & Kewarganegaraan',
  'pendidikan kewarganegaraan': 'Pancasila & Kewarganegaraan',
  'pancasila & kewarganegaraan': 'Pancasila & Kewarganegaraan',
  'penjas': 'Pendidikan Jasmani & Kesehatan',
  'penjasorkes': 'Pendidikan Jasmani & Kesehatan',
  'pjok': 'Pendidikan Jasmani & Kesehatan',
  'olahraga': 'Pendidikan Jasmani & Kesehatan',
  'pendidikan jasmani & kesehatan': 'Pendidikan Jasmani & Kesehatan',
  'prky': 'Prakarya',
  'prakarya': 'Prakarya',
  'sbk': 'Seni Budaya & Keterampilan',
  'seni budaya': 'Seni Budaya & Keterampilan',
  'seni budaya & keterampilan': 'Seni Budaya & Keterampilan',
  'tik': 'Teknologi Informasi & Komunikasi',
  'informatika': 'Teknologi Informasi & Komunikasi',
  'teknologi informasi & komunikasi': 'Teknologi Informasi & Komunikasi',
  'teknologi informasi dan komunikasi': 'Teknologi Informasi & Komunikasi',
  'fiqih': 'Fiqih',
  'fikih': 'Fiqih',
  'aqidah': 'Aqidah Akhlak',
  'akidah': 'Aqidah Akhlak',
  'aqidah akhlak': 'Aqidah Akhlak',
  'akidah akhlak': 'Aqidah Akhlak',
  'supervisi': 'Supervisi Pembelajaran',
  'supervisi pembelajaran': 'Supervisi Pembelajaran'
};

// Period standard definitions
const PERIOD_TIME_MAP: Record<string, { label: string; start: number; end: number }> = {
  '1-2': { label: '1 - 2 (07.15 - 08.25 WIB)', start: 1, end: 2 },
  '3-4': { label: '3 - 4 (08.25 - 09.35 WIB)', start: 3, end: 4 },
  '5-6': { label: '5 - 6 (09.55 - 11.05 WIB)', start: 5, end: 6 },
  '7-8': { label: '7 - 8 (11.05 - 12.15 WIB)', start: 7, end: 8 },
  '1': { label: '1 (07.15 - 07.50 WIB)', start: 1, end: 1 },
  '2': { label: '2 (07.50 - 08.25 WIB)', start: 2, end: 2 },
  '3': { label: '3 (08.25 - 09.00 WIB)', start: 3, end: 3 },
  '4': { label: '4 (09.00 - 09.35 WIB)', start: 4, end: 4 },
  '5': { label: '5 (09.55 - 10.30 WIB)', start: 5, end: 5 },
  '6': { label: '6 (10.30 - 11.05 WIB)', start: 6, end: 6 },
  '7': { label: '7 (11.05 - 11.40 WIB)', start: 7, end: 7 },
  '8': { label: '8 (11.40 - 12.15 WIB)', start: 8, end: 8 }
};

export const UploadJadwalModal: React.FC<UploadJadwalModalProps> = ({
  isOpen,
  onClose,
  currentSchedules = [],
  teachers = [],
  subjects = [],
  classList = CLASSES_LIST,
  schoolName = 'Madrasah',
  academicYear = '2026/2027',
  semester = 'Semester Ganjil',
  initialTab = 'pdf',
  onImport,
  onDeleteAll
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Active tab in modal: 'pdf' | 'file' | 'paste' | 'preset'
  const [activeTab, setActiveTab] = useState<'pdf' | 'file' | 'paste' | 'preset'>(initialTab || 'pdf');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Parsed schedules state
  const [parsedSchedules, setParsedSchedules] = useState<TeachingSchedule[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  // Preview filtering state
  const [previewViewType, setPreviewViewType] = useState<'matriks' | 'tabel'>('matriks');
  const [previewDay, setPreviewDay] = useState<DayOfWeek>('Senin');
  const [searchPreview, setSearchPreview] = useState('');

  // Conflict detector hook
  const conflictReport = useMemo(() => {
    if (parsedSchedules.length === 0) return [];
    const conflicts: { teacherName: string; day: DayOfWeek; period: string; classes: string[] }[] = [];
    const slotMap = new Map<string, string[]>(); // key: `${day}-${period}-${teacherName}` -> classes

    parsedSchedules.forEach(s => {
      if (!s.teacherName || s.teacherName === 'Guru Pengajar') return;
      const key = `${s.day}|${s.periodNumber}|${s.teacherName.toLowerCase()}`;
      const existing = slotMap.get(key) || [];
      if (!existing.includes(s.className)) {
        existing.push(s.className);
      }
      slotMap.set(key, existing);
    });

    slotMap.forEach((classes, key) => {
      if (classes.length > 1) {
        const [day, period, teacherName] = key.split('|');
        conflicts.push({
          teacherName,
          day: day as DayOfWeek,
          period,
          classes
        });
      }
    });

    return conflicts;
  }, [parsedSchedules]);

  // Statistics hook
  const stats = useMemo(() => {
    const totalSlots = parsedSchedules.length;
    const uniqueClasses = Array.from(new Set(parsedSchedules.map(s => s.className)));
    const uniqueTeachers = Array.from(new Set(parsedSchedules.map(s => s.teacherName).filter(Boolean)));
    const uniqueSubjects = Array.from(new Set(parsedSchedules.map(s => s.subjectName)));

    const dayBreakdown: Record<string, number> = {};
    DAYS_OF_WEEK.forEach(d => {
      dayBreakdown[d] = parsedSchedules.filter(s => s.day === d).length;
    });

    return {
      totalSlots,
      classCount: uniqueClasses.length,
      teacherCount: uniqueTeachers.length,
      subjectCount: uniqueSubjects.length,
      dayBreakdown
    };
  }, [parsedSchedules]);

  // Filtered schedules for table preview hook
  const filteredList = useMemo(() => {
    return parsedSchedules.filter(s => {
      if (s.day !== previewDay) return false;
      if (searchPreview) {
        const q = searchPreview.toLowerCase();
        return (
          s.className.toLowerCase().includes(q) ||
          s.subjectName.toLowerCase().includes(q) ||
          s.teacherName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [parsedSchedules, previewDay, searchPreview]);

  // Normalization helpers
  const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // Match subject by name / code / synonyms
  const resolveSubject = (rawSubjectName: string): { id: string; name: string; code: string } => {
    const rawClean = rawSubjectName.trim();
    const lookup = cleanStr(rawClean);

    // 1. Direct synonym lookup
    for (const [key, val] of Object.entries(SUBJECT_SYNONYMS)) {
      if (cleanStr(key) === lookup || lookup.includes(cleanStr(key))) {
        const found = subjects.find(s => cleanStr(s.name) === cleanStr(val));
        if (found) return { id: found.id, name: found.name, code: found.code };
        return { id: `sub-${cleanStr(val).slice(0, 8)}`, name: val, code: val.slice(0, 4).toUpperCase() };
      }
    }

    // 2. Direct subjects list lookup
    const foundDirect = subjects.find(s => cleanStr(s.name) === lookup || cleanStr(s.code) === lookup);
    if (foundDirect) {
      return { id: foundDirect.id, name: foundDirect.name, code: foundDirect.code };
    }

    return {
      id: `sub-custom-${lookup.slice(0, 10)}`,
      name: rawClean || 'Mata Pelajaran',
      code: rawClean.slice(0, 5).toUpperCase()
    };
  };

  // Match teacher by name
  const resolveTeacher = (rawTeacherName: string): { id: string; name: string; nip: string } => {
    const rawClean = rawTeacherName.trim();
    if (!rawClean) return { id: 't-unassigned', name: 'Guru Pengajar', nip: '-' };

    const cleanT = cleanStr(rawClean);

    // Look in teachers list
    const found = teachers.find(t => {
      const dbClean = cleanStr(t.name);
      return dbClean === cleanT || dbClean.includes(cleanT) || cleanT.includes(dbClean);
    });

    if (found) {
      return { id: found.id, name: found.name, nip: found.nip || '-' };
    }

    return {
      id: `t-imp-${cleanT.slice(0, 10)}`,
      name: rawClean,
      nip: '-'
    };
  };

  // Parse a cell that may contain "Mata Pelajaran\nNama Guru"
  const parseCellContent = (cellValue: any): { subjectName: string; teacherName: string } | null => {
    if (!cellValue) return null;
    const str = String(cellValue).trim();
    if (!str || str.toLowerCase() === 'istirahat' || str.toLowerCase() === 'upacara') return null;

    // Check for newline
    if (str.includes('\n')) {
      const parts = str.split('\n').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { subjectName: parts[0], teacherName: parts.slice(1).join(' ') };
      }
      return { subjectName: parts[0], teacherName: '' };
    }

    // Check for slash separator
    if (str.includes('/')) {
      const parts = str.split('/').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { subjectName: parts[0], teacherName: parts[1] };
      }
    }

    // Check for dash separator e.g. "Matematika - Listijawati, SE"
    if (str.includes(' - ')) {
      const parts = str.split(' - ').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { subjectName: parts[0], teacherName: parts[1] };
      }
    }

    // Check if starts with SUPERVISI
    if (str.toUpperCase().startsWith('SUPERVISI')) {
      const rest = str.replace(/^SUPERVISI/i, '').trim();
      return { subjectName: 'Supervisi Pembelajaran', teacherName: rest };
    }

    // If only one line, check if a known teacher name is at the end
    for (const t of teachers) {
      if (t.name && str.toLowerCase().includes(t.name.toLowerCase())) {
        const sub = str.replace(new RegExp(t.name, 'i'), '').trim();
        return { subjectName: sub || 'Mata Pelajaran', teacherName: t.name };
      }
    }

    return { subjectName: str, teacherName: '' };
  };

  // Maps raw day string to DayOfWeek
  const mapDayString = (rawDay: string): DayOfWeek | null => {
    const s = cleanStr(rawDay);
    if (s.includes('senin')) return 'Senin';
    if (s.includes('selasa')) return 'Selasa';
    if (s.includes('rabu')) return 'Rabu';
    if (s.includes('kamis')) return 'Kamis';
    if (s.includes('jumat') || s.includes('jum')) return 'Jumat';
    if (s.includes('sabtu')) return 'Sabtu';
    return null;
  };

  // Normalize Class (e.g. "VII A", "8B", "7-A", "Kelas VII A" -> "VIII B", "VII A")
  const normalizeClassName = (raw: string): string => {
    let s = (raw || '').trim().toUpperCase();
    s = s.replace(/^KELAS\s+/i, '').replace(/^KLS\s+/i, '').trim();
    // 7A -> VII A, 7-A -> VII A, 7 A -> VII A, 7.A -> VII A
    const matchDigit = s.match(/^(7|8|9)\s*[-._\s]?\s*([A-Z])$/i);
    if (matchDigit) {
      const rom = matchDigit[1] === '7' ? 'VII' : matchDigit[1] === '8' ? 'VIII' : 'IX';
      return `${rom} ${matchDigit[2].toUpperCase()}`;
    }
    const matchRoman = s.match(/^(VII|VIII|IX)\s*[-._\s]?\s*([A-Z])$/i);
    if (matchRoman) {
      return `${matchRoman[1].toUpperCase()} ${matchRoman[2].toUpperCase()}`;
    }
    if (s.startsWith('7')) return s.replace(/^7/, 'VII');
    if (s.startsWith('8')) return s.replace(/^8/, 'VIII');
    if (s.startsWith('9')) return s.replace(/^9/, 'IX');
    return s;
  };

  // Main Workbook Parser
  const processWorkbook = (workbook: XLSX.WorkBook) => {
    const allSlots: TeachingSchedule[] = [];
    const validDays: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Check if sheets correspond to days (e.g. SENIN, SELASA, RABU...)
    const daySheetMap: { sheetName: string; day: DayOfWeek }[] = [];
    workbook.SheetNames.forEach(sheetName => {
      const day = mapDayString(sheetName);
      if (day) {
        daySheetMap.push({ sheetName, day });
      }
    });

    if (daySheetMap.length > 0) {
      // -------------------------------------------------------------
      // Case A: Format Matriks aSc Timetables (Sheet per Hari)
      // -------------------------------------------------------------
      daySheetMap.forEach(({ sheetName, day }) => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;

        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (rows.length < 2) return;

        // Find header row with period numbers (1, 2, 3, 4, 5, 6, 7, 8)
        let headerRowIdx = -1;
        let colPeriodMap: { colIdx: number; periodNum: number }[] = [];

        for (let r = 0; r < Math.min(rows.length, 6); r++) {
          const row = rows[r];
          const foundCols: { colIdx: number; periodNum: number }[] = [];

          row.forEach((cellVal: any, cIdx: number) => {
            const cellStr = String(cellVal).trim();
            // Match "1", "Jam 1", "1 (07:15 - 07:50)", etc.
            const match = cellStr.match(/^(?:jam\s*)?([1-8])(?:\b|\s|\()/i);
            if (match) {
              const pNum = parseInt(match[1], 10);
              if (pNum >= 1 && pNum <= 8) {
                foundCols.push({ colIdx: cIdx, periodNum: pNum });
              }
            }
          });

          if (foundCols.length >= 4) {
            headerRowIdx = r;
            colPeriodMap = foundCols;
            break;
          }
        }

        // Default mapping if not found explicitly
        if (headerRowIdx === -1) {
          headerRowIdx = 0;
          // Assume col 1 to 8 or ignore istirahat
          colPeriodMap = [
            { colIdx: 1, periodNum: 1 },
            { colIdx: 2, periodNum: 2 },
            { colIdx: 3, periodNum: 3 },
            { colIdx: 4, periodNum: 4 },
            { colIdx: 6, periodNum: 5 },
            { colIdx: 7, periodNum: 6 },
            { colIdx: 8, periodNum: 7 },
            { colIdx: 9, periodNum: 8 }
          ];
        }

        // Iterate class rows
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          // Class name in column 0 (or first non-empty cell)
          let rawClass = String(row[0] || '').trim();
          if (!rawClass) {
            for (let c = 0; c < Math.min(row.length, 3); c++) {
              if (String(row[c]).trim().match(/^(VII|VIII|IX|7|8|9)/i)) {
                rawClass = String(row[c]).trim();
                break;
              }
            }
          }

          if (!rawClass || rawClass.toLowerCase().includes('istirahat') || rawClass.toLowerCase().includes('jadwal')) {
            continue;
          }

          // Normalize Class (e.g. "VII A", "8B", "7-A" -> "VIII B", "VII A")
          const normalizedClass = normalizeClassName(rawClass);

          // Collect period cells for this class row
          const periodData: { [pNum: number]: { subjectName: string; teacherName: string } } = {};

          colPeriodMap.forEach(({ colIdx, periodNum }) => {
            if (row[colIdx]) {
              const parsed = parseCellContent(row[colIdx]);
              if (parsed) {
                periodData[periodNum] = parsed;
              }
            }
          });

          // Group paired periods (1-2, 3-4, 5-6, 7-8) or single
          const processedPeriods = new Set<number>();
          const pairs = [
            { p1: 1, p2: 2, key: '1-2' },
            { p1: 3, p2: 4, key: '3-4' },
            { p1: 5, p2: 6, key: '5-6' },
            { p1: 7, p2: 8, key: '7-8' }
          ];

          pairs.forEach(({ p1, p2, key }) => {
            const data1 = periodData[p1];
            const data2 = periodData[p2];

            if (data1 && data2 && cleanStr(data1.subjectName) === cleanStr(data2.subjectName)) {
              // Both periods have the same subject -> paired block!
              const teacherName = data1.teacherName || data2.teacherName;
              const subObj = resolveSubject(data1.subjectName);
              const teaObj = resolveTeacher(teacherName);
              const pConfig = PERIOD_TIME_MAP[key];

              allSlots.push({
                id: `imp-${day.toLowerCase()}-${normalizedClass.replace(/\s+/g, '')}-${key}-${allSlots.length}`,
                day,
                periodNumber: pConfig.label,
                periodStartHour: pConfig.start,
                periodEndHour: pConfig.end,
                teacherId: teaObj.id,
                teacherName: teaObj.name,
                teacherNip: teaObj.nip,
                subjectId: subObj.id,
                subjectName: subObj.name,
                subjectCode: subObj.code,
                className: normalizedClass,
                academicYear,
                semester,
                room: `Ruang ${normalizedClass.replace(/\s+/g, '-')}`,
                notes: 'Imported aSc Timetables',
                createdAt: new Date().toISOString()
              });

              processedPeriods.add(p1);
              processedPeriods.add(p2);
            } else if (data1 && !data2) {
              // Only period 1 is filled: if single period 1 or 2
              const subObj = resolveSubject(data1.subjectName);
              const teaObj = resolveTeacher(data1.teacherName);
              const pKey = String(p1);
              const pConfig = PERIOD_TIME_MAP[pKey] || { label: `Jam ${p1}`, start: p1, end: p1 };

              allSlots.push({
                id: `imp-${day.toLowerCase()}-${normalizedClass.replace(/\s+/g, '')}-${pKey}-${allSlots.length}`,
                day,
                periodNumber: pConfig.label,
                periodStartHour: pConfig.start,
                periodEndHour: pConfig.end,
                teacherId: teaObj.id,
                teacherName: teaObj.name,
                teacherNip: teaObj.nip,
                subjectId: subObj.id,
                subjectName: subObj.name,
                subjectCode: subObj.code,
                className: normalizedClass,
                academicYear,
                semester,
                room: `Ruang ${normalizedClass.replace(/\s+/g, '-')}`,
                notes: 'Imported aSc Timetables',
                createdAt: new Date().toISOString()
              });
              processedPeriods.add(p1);
            } else if (!data1 && data2) {
              const subObj = resolveSubject(data2.subjectName);
              const teaObj = resolveTeacher(data2.teacherName);
              const pKey = String(p2);
              const pConfig = PERIOD_TIME_MAP[pKey] || { label: `Jam ${p2}`, start: p2, end: p2 };

              allSlots.push({
                id: `imp-${day.toLowerCase()}-${normalizedClass.replace(/\s+/g, '')}-${pKey}-${allSlots.length}`,
                day,
                periodNumber: pConfig.label,
                periodStartHour: pConfig.start,
                periodEndHour: pConfig.end,
                teacherId: teaObj.id,
                teacherName: teaObj.name,
                teacherNip: teaObj.nip,
                subjectId: subObj.id,
                subjectName: subObj.name,
                subjectCode: subObj.code,
                className: normalizedClass,
                academicYear,
                semester,
                room: `Ruang ${normalizedClass.replace(/\s+/g, '-')}`,
                notes: 'Imported aSc Timetables',
                createdAt: new Date().toISOString()
              });
              processedPeriods.add(p2);
            } else if (data1 && data2 && cleanStr(data1.subjectName) !== cleanStr(data2.subjectName)) {
              // Different subjects in p1 and p2
              [ { d: data1, p: p1 }, { d: data2, p: p2 } ].forEach(({ d, p }) => {
                const subObj = resolveSubject(d.subjectName);
                const teaObj = resolveTeacher(d.teacherName);
                const pKey = String(p);
                const pConfig = PERIOD_TIME_MAP[pKey] || { label: `Jam ${p}`, start: p, end: p };

                allSlots.push({
                  id: `imp-${day.toLowerCase()}-${normalizedClass.replace(/\s+/g, '')}-${pKey}-${allSlots.length}`,
                  day,
                  periodNumber: pConfig.label,
                  periodStartHour: pConfig.start,
                  periodEndHour: pConfig.end,
                  teacherId: teaObj.id,
                  teacherName: teaObj.name,
                  teacherNip: teaObj.nip,
                  subjectId: subObj.id,
                  subjectName: subObj.name,
                  subjectCode: subObj.code,
                  className: normalizedClass,
                  academicYear,
                  semester,
                  room: `Ruang ${normalizedClass.replace(/\s+/g, '-')}`,
                  notes: 'Imported aSc Timetables',
                  createdAt: new Date().toISOString()
                });
              });
              processedPeriods.add(p1);
              processedPeriods.add(p2);
            }
          });
        }
      });
    } else {
      // -------------------------------------------------------------
      // Case B: Format Baris / Tabular (Columns: Hari, Kelas, Jam, Mapel, Guru)
      // -------------------------------------------------------------
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) return;

      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      rawJson.forEach((row, idx) => {
        // Find keys flexibly
        const getVal = (patterns: string[]) => {
          for (const key of Object.keys(row)) {
            const cleanK = cleanStr(key);
            if (patterns.some(p => cleanK.includes(p))) {
              return String(row[key]).trim();
            }
          }
          return '';
        };

        const rawDay = getVal(['hari', 'day']);
        const rawClass = getVal(['kelas', 'class']);
        const rawPeriod = getVal(['jam', 'period', 'waktu']);
        const rawSubject = getVal(['mapel', 'matapelajaran', 'subject']);
        const rawTeacher = getVal(['guru', 'teacher', 'pengajar', 'nama']);

        const day = mapDayString(rawDay);
        if (!day || !rawClass || !rawSubject) return;

        let cleanPeriodKey = '1-2';
        if (rawPeriod.includes('3') && rawPeriod.includes('4')) cleanPeriodKey = '3-4';
        else if (rawPeriod.includes('5') && rawPeriod.includes('6')) cleanPeriodKey = '5-6';
        else if (rawPeriod.includes('7') && rawPeriod.includes('8')) cleanPeriodKey = '7-8';
        else if (rawPeriod.includes('1') && rawPeriod.includes('2')) cleanPeriodKey = '1-2';
        else if (rawPeriod.includes('2')) cleanPeriodKey = '2';
        else if (rawPeriod.includes('1')) cleanPeriodKey = '1';

        const pConfig = PERIOD_TIME_MAP[cleanPeriodKey] || {
          label: rawPeriod || 'Jam 1 - 2',
          start: 1,
          end: 2
        };

        const subObj = resolveSubject(rawSubject);
        const teaObj = resolveTeacher(rawTeacher);
        const normClass = normalizeClassName(rawClass);

        allSlots.push({
          id: `imp-tab-${idx}-${day.toLowerCase()}-${normClass.replace(/\s+/g, '')}`,
          day,
          periodNumber: pConfig.label,
          periodStartHour: pConfig.start,
          periodEndHour: pConfig.end,
          teacherId: teaObj.id,
          teacherName: teaObj.name,
          teacherNip: teaObj.nip,
          subjectId: subObj.id,
          subjectName: subObj.name,
          subjectCode: subObj.code,
          className: normClass,
          academicYear,
          semester,
          room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
          notes: 'Imported Excel/CSV',
          createdAt: new Date().toISOString()
        });
      });

      // -------------------------------------------------------------
      // Case C Fallback: Single Sheet Multi-Day Matrix
      // -------------------------------------------------------------
      if (allSlots.length === 0) {
        const matrixRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        let currentDay: DayOfWeek = 'Senin';
        let currentPeriodMap: { colIdx: number; periodNum: number }[] = [
          { colIdx: 1, periodNum: 1 },
          { colIdx: 2, periodNum: 2 },
          { colIdx: 3, periodNum: 3 },
          { colIdx: 4, periodNum: 4 },
          { colIdx: 6, periodNum: 5 },
          { colIdx: 7, periodNum: 6 },
          { colIdx: 8, periodNum: 7 },
          { colIdx: 9, periodNum: 8 }
        ];

        matrixRows.forEach((row) => {
          if (!row || row.length === 0) return;

          // Check if this row announces a Day (e.g. "SENIN", "HARI SENIN")
          const firstCellStr = String(row[0] || '').trim();
          const detectedDay = mapDayString(firstCellStr);
          if (detectedDay && !firstCellStr.match(/^(VII|VIII|IX|7|8|9)/i)) {
            currentDay = detectedDay;
            return;
          }

          // Check if row has period numbers header
          const periodCols: { colIdx: number; periodNum: number }[] = [];
          row.forEach((cellVal: any, cIdx: number) => {
            const cellStr = String(cellVal).trim();
            const match = cellStr.match(/^(?:jam\s*)?([1-8])(?:\b|\s|\()/i);
            if (match) {
              const pNum = parseInt(match[1], 10);
              if (pNum >= 1 && pNum <= 8) {
                periodCols.push({ colIdx: cIdx, periodNum: pNum });
              }
            }
          });
          if (periodCols.length >= 4) {
            currentPeriodMap = periodCols;
            return;
          }

          // Check if this row is a class row
          let rawClass = firstCellStr;
          if (!rawClass.match(/^(VII|VIII|IX|7|8|9|KELAS|KLS)/i)) {
            for (let c = 0; c < Math.min(row.length, 3); c++) {
              if (String(row[c]).trim().match(/^(VII|VIII|IX|7|8|9|KELAS|KLS)/i)) {
                rawClass = String(row[c]).trim();
                break;
              }
            }
          }

          if (!rawClass || rawClass.toLowerCase().includes('istirahat') || rawClass.toLowerCase().includes('jadwal')) {
            return;
          }

          const normClass = normalizeClassName(rawClass);
          if (!normClass) return;

          const periodData: { [pNum: number]: { subjectName: string; teacherName: string } } = {};
          currentPeriodMap.forEach(({ colIdx, periodNum }) => {
            if (row[colIdx]) {
              const parsed = parseCellContent(row[colIdx]);
              if (parsed) periodData[periodNum] = parsed;
            }
          });

          const pairs = [
            { p1: 1, p2: 2, key: '1-2' },
            { p1: 3, p2: 4, key: '3-4' },
            { p1: 5, p2: 6, key: '5-6' },
            { p1: 7, p2: 8, key: '7-8' }
          ];

          pairs.forEach(({ p1, p2, key }) => {
            const data1 = periodData[p1];
            const data2 = periodData[p2];

            if (data1 && data2 && cleanStr(data1.subjectName) === cleanStr(data2.subjectName)) {
              const teacherName = data1.teacherName || data2.teacherName;
              const subObj = resolveSubject(data1.subjectName);
              const teaObj = resolveTeacher(teacherName);
              const pConfig = PERIOD_TIME_MAP[key];

              allSlots.push({
                id: `imp-${currentDay.toLowerCase()}-${normClass.replace(/\s+/g, '')}-${key}-${allSlots.length}`,
                day: currentDay,
                periodNumber: pConfig.label,
                periodStartHour: pConfig.start,
                periodEndHour: pConfig.end,
                teacherId: teaObj.id,
                teacherName: teaObj.name,
                teacherNip: teaObj.nip,
                subjectId: subObj.id,
                subjectName: subObj.name,
                subjectCode: subObj.code,
                className: normClass,
                academicYear,
                semester,
                room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
                notes: 'Imported aSc Timetables',
                createdAt: new Date().toISOString()
              });
            } else if (data1 && !data2) {
              const subObj = resolveSubject(data1.subjectName);
              const teaObj = resolveTeacher(data1.teacherName);
              const pKey = String(p1);
              const pConfig = PERIOD_TIME_MAP[pKey] || { label: `Jam ${p1}`, start: p1, end: p1 };

              allSlots.push({
                id: `imp-${currentDay.toLowerCase()}-${normClass.replace(/\s+/g, '')}-${pKey}-${allSlots.length}`,
                day: currentDay,
                periodNumber: pConfig.label,
                periodStartHour: pConfig.start,
                periodEndHour: pConfig.end,
                teacherId: teaObj.id,
                teacherName: teaObj.name,
                teacherNip: teaObj.nip,
                subjectId: subObj.id,
                subjectName: subObj.name,
                subjectCode: subObj.code,
                className: normClass,
                academicYear,
                semester,
                room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
                notes: 'Imported aSc Timetables',
                createdAt: new Date().toISOString()
              });
            } else if (!data1 && data2) {
              const subObj = resolveSubject(data2.subjectName);
              const teaObj = resolveTeacher(data2.teacherName);
              const pKey = String(p2);
              const pConfig = PERIOD_TIME_MAP[pKey] || { label: `Jam ${p2}`, start: p2, end: p2 };

              allSlots.push({
                id: `imp-${currentDay.toLowerCase()}-${normClass.replace(/\s+/g, '')}-${pKey}-${allSlots.length}`,
                day: currentDay,
                periodNumber: pConfig.label,
                periodStartHour: pConfig.start,
                periodEndHour: pConfig.end,
                teacherId: teaObj.id,
                teacherName: teaObj.name,
                teacherNip: teaObj.nip,
                subjectId: subObj.id,
                subjectName: subObj.name,
                subjectCode: subObj.code,
                className: normClass,
                academicYear,
                semester,
                room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
                notes: 'Imported aSc Timetables',
                createdAt: new Date().toISOString()
              });
            }
          });
        });
      }
    }

    if (allSlots.length === 0) {
      throw new Error('Tidak ada data jadwal valid yang berhasil diparsing. Pastikan file menggunakan format tabel atau format sheet per hari aSc Timetables.');
    }

    setParsedSchedules(allSlots);
    setErrorMessage('');
  };

  // Handle PDF file upload via /api/parse-schedule-pdf (with AI & intelligent preset fallback)
  const handlePdfFile = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(b64);
        };
        reader.onerror = err => reject(err);
      });
      reader.readAsDataURL(file);
      const base64Pdf = await base64Promise;

      const resp = await fetch('/api/parse-schedule-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Pdf,
          fileName: file.name
        })
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        const errorMsg = json?.error || `Server status ${resp.status}`;
        throw new Error(errorMsg);
      }

      if (!json || !json.success || !json.schedules || json.schedules.length === 0) {
        throw new Error(json?.error || 'Tidak ada jadwal valid yang ditemukan dalam PDF');
      }

      const loadedSlots: TeachingSchedule[] = json.schedules.map((item: any, idx: number) => {
        const subObj = resolveSubject(item.subjectName);
        const teaObj = resolveTeacher(item.teacherName);
        const pKey = item.periodKey || (item.periodNumber ? item.periodNumber.replace(/[^0-9-]/g, '') : '1-2');
        const pConfig = PERIOD_TIME_MAP[pKey] || {
          label: item.periodNumber || `Jam ${pKey}`,
          start: item.periodStartHour || 1,
          end: item.periodEndHour || 2
        };
        const normClass = normalizeClassName(item.className);

        return {
          id: item.id || `imp-pdf-${item.day?.toLowerCase() || 'senin'}-${normClass.replace(/\s+/g, '')}-${idx}`,
          day: item.day as DayOfWeek,
          periodNumber: pConfig.label,
          periodStartHour: pConfig.start,
          periodEndHour: pConfig.end,
          teacherId: teaObj.id,
          teacherName: teaObj.name,
          teacherNip: teaObj.nip,
          subjectId: subObj.id,
          subjectName: subObj.name,
          subjectCode: subObj.code,
          className: normClass,
          academicYear,
          semester,
          room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
          notes: `Imported PDF: ${file.name}`,
          createdAt: new Date().toISOString()
        };
      });

      setParsedSchedules(loadedSlots);
    } catch (err: any) {
      console.warn('PDF parser error:', err);
      setParsedSchedules([]);
      setErrorMessage(
        err.message ||
        'Gagal membaca jadwal dari file PDF ini. Pastikan file PDF memuat teks tabel jadwal pelajaran yang terbaca, atau gunakan opsi tab "File Excel/CSV" atau "Tempel Teks" untuk memasukkan jadwal Anda.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Group consecutive periods (e.g. Jam 1 and Jam 2 for same teacher, subject, class, day -> Jam 1-2)
  const groupConsecutivePeriods = (slots: TeachingSchedule[]): TeachingSchedule[] => {
    const dayOrder: Record<string, number> = {
      Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6
    };

    const sorted = [...slots].sort((a, b) => {
      const dDiff = (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9);
      if (dDiff !== 0) return dDiff;
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      return a.periodStartHour - b.periodStartHour;
    });

    const merged: TeachingSchedule[] = [];
    let current: TeachingSchedule | null = null;

    for (const slot of sorted) {
      if (!current) {
        current = { ...slot };
        continue;
      }

      const isConsecutive =
        slot.day === current.day &&
        slot.className === current.className &&
        slot.teacherId === current.teacherId &&
        slot.subjectId === current.subjectId &&
        slot.periodStartHour === current.periodEndHour + 1 &&
        (current.periodEndHour - current.periodStartHour + 1) < 2;

      if (isConsecutive) {
        const combinedKey = `${current.periodStartHour}-${slot.periodEndHour}`;
        const pConfig = PERIOD_TIME_MAP[combinedKey] || {
          label: `${current.periodStartHour} - ${slot.periodEndHour}`,
          start: current.periodStartHour,
          end: slot.periodEndHour
        };
        current.periodNumber = pConfig.label;
        current.periodEndHour = slot.periodEndHour;
      } else {
        merged.push(current);
        current = { ...slot };
      }
    }

    if (current) {
      merged.push(current);
    }

    return merged;
  };

  // XML Schedule Parser (supports aSc Timetables XML export, FET, Excel XML Spreadsheet)
  const parseXmlScheduleContent = (xmlString: string, originalFileName: string): TeachingSchedule[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      const getElements = (tag: string): Element[] => {
        const lower = xmlDoc.getElementsByTagName(tag.toLowerCase());
        if (lower.length > 0) return Array.from(lower);
        const cap = xmlDoc.getElementsByTagName(tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
        if (cap.length > 0) return Array.from(cap);
        const upper = xmlDoc.getElementsByTagName(tag.toUpperCase());
        if (upper.length > 0) return Array.from(upper);
        return [];
      };

      // 1. Check aSc Timetables XML export (<timetable> or contains <card> and <lesson>)
      const timetableEls = getElements('timetable');
      const cardEls = getElements('card');
      const lessonEls = getElements('lesson');

      if (timetableEls.length > 0 || cardEls.length > 0 || lessonEls.length > 0) {
        // Collect periods
        const periodEls = getElements('period');
        const periodMap = new Map<string, { period: string; name: string; start: number; end: number; time: string }>();
        periodEls.forEach((el, idx) => {
          const pId = el.getAttribute('id') || el.getAttribute('period') || el.getAttribute('name') || String(idx + 1);
          const pName = el.getAttribute('name') || `Jam ${idx + 1}`;
          const starttime = el.getAttribute('starttime') || '';
          const endtime = el.getAttribute('endtime') || '';
          const num = parseInt(el.getAttribute('period') || String(idx + 1), 10) || (idx + 1);
          periodMap.set(pId, {
            period: String(num),
            name: pName,
            start: num,
            end: num,
            time: starttime && endtime ? `(${starttime} - ${endtime})` : ''
          });
        });

        // Collect days and daysdefs
        const dayEls = getElements('day');
        const daysMap = new Map<string, string>();
        dayEls.forEach((el, idx) => {
          const dId = el.getAttribute('id') || String(idx + 1);
          const dName = el.getAttribute('name') || el.getAttribute('short') || '';
          daysMap.set(dId, dName);
        });

        const daysdefEls = getElements('daysdef');
        const daysdefMap = new Map<string, string>();
        daysdefEls.forEach((el) => {
          const dId = el.getAttribute('id') || el.getAttribute('days') || '';
          const dName = el.getAttribute('name') || el.getAttribute('short') || '';
          daysdefMap.set(dId, dName);
        });

        // Collect subjects
        const subjectEls = getElements('subject');
        const subjectMap = new Map<string, { name: string; short: string }>();
        subjectEls.forEach((el) => {
          const sId = el.getAttribute('id') || '';
          const sName = el.getAttribute('name') || el.getAttribute('short') || 'Mata Pelajaran';
          const sShort = el.getAttribute('short') || '';
          subjectMap.set(sId, { name: sName, short: sShort });
        });

        // Collect teachers
        const teacherEls = getElements('teacher');
        const teacherMap = new Map<string, { name: string; short: string }>();
        teacherEls.forEach((el) => {
          const tId = el.getAttribute('id') || '';
          let tName = el.getAttribute('name') || '';
          if (!tName) {
            const first = el.getAttribute('firstname') || '';
            const last = el.getAttribute('lastname') || '';
            tName = `${first} ${last}`.trim();
          }
          const tShort = el.getAttribute('short') || '';
          teacherMap.set(tId, { name: tName || 'Guru Pengajar', short: tShort });
        });

        // Collect classes
        const classEls = getElements('class');
        const classMap = new Map<string, { name: string; short: string }>();
        classEls.forEach((el) => {
          const cId = el.getAttribute('id') || '';
          const cName = el.getAttribute('name') || el.getAttribute('short') || '';
          const cShort = el.getAttribute('short') || '';
          classMap.set(cId, { name: cName, short: cShort });
        });

        // Collect lessons
        const lessonMap = new Map<string, { subjectId: string; teacherIds: string[]; classIds: string[]; periodsPerCard: number }>();
        lessonEls.forEach((el) => {
          const lId = el.getAttribute('id') || '';
          const sId = el.getAttribute('subjectid') || '';
          const tIds = (el.getAttribute('teacherids') || '').split(',').map(s => s.trim()).filter(Boolean);
          const cIds = (el.getAttribute('classids') || '').split(',').map(s => s.trim()).filter(Boolean);
          const ppc = parseInt(el.getAttribute('periodspercard') || '1', 10) || 1;
          lessonMap.set(lId, { subjectId: sId, teacherIds: tIds, classIds: cIds, periodsPerCard: ppc });
        });

        // Resolve Day
        const resolveDay = (dayAttr: string | null, daysAttr: string | null): DayOfWeek => {
          if (daysAttr) {
            if (daysdefMap.has(daysAttr)) {
              const mapped = mapDayString(daysdefMap.get(daysAttr)!);
              if (mapped) return mapped;
            }
            const bitIdx = daysAttr.indexOf('1');
            if (bitIdx === 0) return 'Senin';
            if (bitIdx === 1) return 'Selasa';
            if (bitIdx === 2) return 'Rabu';
            if (bitIdx === 3) return 'Kamis';
            if (bitIdx === 4) return 'Jumat';
            if (bitIdx === 5) return 'Sabtu';
          }
          if (dayAttr) {
            if (daysMap.has(dayAttr)) {
              const mapped = mapDayString(daysMap.get(dayAttr)!);
              if (mapped) return mapped;
            }
            const num = parseInt(dayAttr, 10);
            if (num === 1) return 'Senin';
            if (num === 2) return 'Selasa';
            if (num === 3) return 'Rabu';
            if (num === 4) return 'Kamis';
            if (num === 5) return 'Jumat';
            if (num === 6) return 'Sabtu';
          }
          return 'Senin';
        };

        const results: TeachingSchedule[] = [];

        cardEls.forEach((card, i) => {
          const lessonId = card.getAttribute('lessonid') || '';
          const periodAttr = card.getAttribute('period') || '1';
          const dayAttr = card.getAttribute('day');
          const daysAttr = card.getAttribute('days');

          const lesson = lessonMap.get(lessonId);
          if (!lesson) return;

          const rawSubject = subjectMap.get(lesson.subjectId)?.name || 'Mata Pelajaran';
          const subObj = resolveSubject(rawSubject);

          const teacherIdFirst = lesson.teacherIds[0] || '';
          const rawTeacher = teacherMap.get(teacherIdFirst)?.name || 'Guru Pengajar';
          const teaObj = resolveTeacher(rawTeacher);

          const day = resolveDay(dayAttr, daysAttr);
          const pNum = parseInt(periodAttr, 10) || 1;
          const pConfig = PERIOD_TIME_MAP[String(pNum)] || {
            label: `Jam ${pNum}`,
            start: pNum,
            end: pNum
          };

          const targetClasses = lesson.classIds.length > 0 ? lesson.classIds : ['default'];
          targetClasses.forEach(cId => {
            const rawClass = classMap.get(cId)?.name || 'Kelas';
            const normClass = normalizeClassName(rawClass);

            results.push({
              id: `asc-xml-${day.toLowerCase()}-${normClass.replace(/\s+/g, '')}-${pNum}-${i}`,
              day,
              periodNumber: pConfig.label,
              periodStartHour: pConfig.start,
              periodEndHour: pConfig.end,
              teacherId: teaObj.id,
              teacherName: teaObj.name,
              teacherNip: teaObj.nip,
              subjectId: subObj.id,
              subjectName: subObj.name,
              subjectCode: subObj.code,
              className: normClass,
              academicYear,
              semester,
              room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
              notes: `aSc XML: ${originalFileName}`,
              createdAt: new Date().toISOString()
            });
          });
        });

        if (results.length > 0) {
          return groupConsecutivePeriods(results);
        }
      }

      // 2. Check FET XML format (<fet> with <Activity>)
      const activityEls = getElements('Activity');
      if (activityEls.length > 0) {
        const results: TeachingSchedule[] = [];
        activityEls.forEach((act, i) => {
          const teacher = act.getElementsByTagName('Teacher')[0]?.textContent?.trim() || '';
          const subject = act.getElementsByTagName('Subject')[0]?.textContent?.trim() || '';
          const students = act.getElementsByTagName('Students')[0]?.textContent?.trim() || '';
          const dayStr = act.getElementsByTagName('Day')[0]?.textContent?.trim() || 'Senin';
          const hourStr = act.getElementsByTagName('Hour')[0]?.textContent?.trim() || '1';

          const day = mapDayString(dayStr) || 'Senin';
          const normClass = normalizeClassName(students || 'VII A');
          const subObj = resolveSubject(subject || 'Mata Pelajaran');
          const teaObj = resolveTeacher(teacher || 'Guru Pengajar');
          const pNum = parseInt(hourStr, 10) || 1;
          const pConfig = PERIOD_TIME_MAP[String(pNum)] || { label: `Jam ${pNum}`, start: pNum, end: pNum };

          results.push({
            id: `fet-xml-${day.toLowerCase()}-${normClass.replace(/\s+/g, '')}-${pNum}-${i}`,
            day,
            periodNumber: pConfig.label,
            periodStartHour: pConfig.start,
            periodEndHour: pConfig.end,
            teacherId: teaObj.id,
            teacherName: teaObj.name,
            teacherNip: teaObj.nip,
            subjectId: subObj.id,
            subjectName: subObj.name,
            subjectCode: subObj.code,
            className: normClass,
            academicYear,
            semester,
            room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
            notes: `FET XML: ${originalFileName}`,
            createdAt: new Date().toISOString()
          });
        });
        if (results.length > 0) {
          return groupConsecutivePeriods(results);
        }
      }

      return [];
    } catch (err) {
      console.warn('parseXmlScheduleContent error:', err);
      return [];
    }
  };

  // Handle XML file upload (native XML parser with server Gemini fallback)
  const handleXmlFile = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const xmlText = await file.text();

      // 1. Direct Client-Side XML Parser (aSc Timetables XML / FET)
      const clientParsed = parseXmlScheduleContent(xmlText, file.name);
      if (clientParsed && clientParsed.length > 0) {
        setParsedSchedules(clientParsed);
        setIsProcessing(false);
        return;
      }

      // 2. Check if it is an Excel XML Spreadsheet via SheetJS
      try {
        const wb = XLSX.read(xmlText, { type: 'string' });
        if (wb && wb.SheetNames && wb.SheetNames.length > 0) {
          processWorkbook(wb);
          setIsProcessing(false);
          return;
        }
      } catch (xlsxErr) {
        // Not a spreadsheet XML, continue to AI fallback
      }

      // 3. Server-side AI XML Parser fallback
      const resp = await fetch('/api/parse-schedule-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xmlContent: xmlText,
          fileName: file.name
        })
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(json?.error || `Server status ${resp.status}`);
      }

      if (!json || !json.success || !json.schedules || json.schedules.length === 0) {
        throw new Error(json?.error || 'Tidak ada jadwal valid yang ditemukan di file XML ini');
      }

      const loadedSlots: TeachingSchedule[] = json.schedules.map((item: any, idx: number) => {
        const subObj = resolveSubject(item.subjectName);
        const teaObj = resolveTeacher(item.teacherName);
        const pKey = item.periodKey || (item.periodNumber ? item.periodNumber.replace(/[^0-9-]/g, '') : '1-2');
        const pConfig = PERIOD_TIME_MAP[pKey] || {
          label: item.periodNumber || `Jam ${pKey}`,
          start: item.periodStartHour || 1,
          end: item.periodEndHour || 2
        };
        const normClass = normalizeClassName(item.className);

        return {
          id: item.id || `imp-xml-${item.day?.toLowerCase() || 'senin'}-${normClass.replace(/\s+/g, '')}-${idx}`,
          day: item.day as DayOfWeek,
          periodNumber: pConfig.label,
          periodStartHour: pConfig.start,
          periodEndHour: pConfig.end,
          teacherId: teaObj.id,
          teacherName: teaObj.name,
          teacherNip: teaObj.nip,
          subjectId: subObj.id,
          subjectName: subObj.name,
          subjectCode: subObj.code,
          className: normClass,
          academicYear,
          semester,
          room: `Ruang ${normClass.replace(/\s+/g, '-')}`,
          notes: `Imported XML: ${file.name}`,
          createdAt: new Date().toISOString()
        };
      });

      setParsedSchedules(loadedSlots);
    } catch (err: any) {
      console.warn('XML parser error:', err);
      setParsedSchedules([]);
      setErrorMessage(
        err.message ||
        'Gagal membaca jadwal dari file XML ini. Pastikan file merupakan format ekspor resmi dari software jadwal (seperti aSc Timetables XML).'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload (Supports PDF, XML aSc Timetables, Excel .xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      handlePdfFile(file);
      return;
    }

    if (
      file.name.toLowerCase().endsWith('.xml') ||
      file.type === 'text/xml' ||
      file.type === 'application/xml'
    ) {
      handleXmlFile(file);
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        processWorkbook(workbook);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setErrorMessage(err.message || 'Gagal membaca file Excel/CSV. Silakan periksa kembali format file.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Terjadi kesalahan saat membaca file.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle pasted text parsing
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Silakan tempel teks tabel terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const trimmed = pastedText.trim();
      if (
        trimmed.startsWith('<') &&
        (trimmed.includes('<timetable') ||
          trimmed.includes('<fet') ||
          trimmed.includes('<Workbook') ||
          trimmed.includes('<lessons') ||
          trimmed.includes('<card'))
      ) {
        const slots = parseXmlScheduleContent(trimmed, 'Pasted_Schedule.xml');
        if (slots.length > 0) {
          setParsedSchedules(slots);
          setFileName('Pasted_Schedule.xml');
          setIsProcessing(false);
          return;
        }
      }

      // Parse TSV / CSV text into worksheet
      const workbook = XLSX.read(pastedText, { type: 'string' });
      processWorkbook(workbook);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal memproses teks yang ditempel.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle one-click Preset load
  const handleLoadOfficialPreset = () => {
    setParsedSchedules(OFFICIAL_ASC_SCHEDULES);
    setFileName('Jadwal_Resmi_aSc_Timetables_MTs.pdf (Preset)');
    setErrorMessage('');
  };

  // Submit Handler
  const handleConfirmSave = async () => {
    if (parsedSchedules.length === 0) return;
    setIsProcessing(true);
    try {
      await onImport(parsedSchedules, importMode);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal menyimpan jadwal ke sistem.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#063016] via-[#0b4822] to-[#15803d] text-white px-6 py-4.5 flex items-center justify-between border-b border-emerald-700/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Import Jadwal PDF & Excel aSc
                </span>
                <span className="text-xs text-emerald-200 font-semibold">TP {academicYear} • {semester}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Upload Jadwal Pelajaran (File PDF / Excel aSc Timetables)
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentSchedules.length > 0 && onDeleteAll && (
              <button
                type="button"
                onClick={onDeleteAll}
                className="bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 border border-rose-400/40 text-xs font-black px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                title="Hapus / Kosongkan semua jadwal yang ada saat ini sebelum impor"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden sm:inline">Hapus Semua Jadwal ({currentSchedules.length})</span>
                <span className="sm:hidden">Hapus Semua</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Bar: Download Templates & Upload Methods */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-950 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Unduh Template Jadwal Siap Pakai</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Gunakan template Excel berikut yang telah disesuaikan dengan struktur aSc Timetables (per Hari & per Jam KBM 1-8).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadAscTimetableExcelTemplate(schoolName)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                title="Download template aSc Timetables per sheet hari"
              >
                <Download className="w-4 h-4" />
                <span>Template aSc Matriks (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadTabularScheduleTemplate(schoolName)}
                className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                title="Download template format tabel baris"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Template Format Tabel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Upload Method Selector */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'pdf'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>1. Upload File PDF aSc (.pdf)</span>
                <span className="bg-amber-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ml-1">
                  Format Anda
                </span>
              </button>

              <button
                onClick={() => setActiveTab('file')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'file'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>2. Upload File aSc XML & Excel (.xml / .xlsx / .csv)</span>
                <span className="bg-amber-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ml-1">
                  Format XML Anda
                </span>
              </button>

              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'paste'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>3. Salin & Tempel (Copy-Paste)</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('preset');
                  handleLoadOfficialPreset();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'preset'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Muat Sesuai PDF aSc (368 Sesi)</span>
              </button>
            </div>

            {/* TAB PDF: PDF UPLOADER */}
            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-500 hover:border-emerald-600 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-7 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group shadow-xs"
                >
                  <input
                    type="file"
                    ref={pdfInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,application/pdf,.xml,text/xml,application/xml"
                    className="hidden"
                  />

                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs relative">
                    <FileText className="w-7 h-7" />
                    <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                      PDF
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900">
                      Klik untuk memilih file PDF Jadwal atau seret file ke sini
                    </p>
                    <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                      Format aSc Timetables (6 Halaman SENIN s/d SABTU, Kelas VII A - IX F, Jam 1 - 8). Sistem akan mengekstrak otomatis seluruh sesi KBM.
                    </p>
                  </div>

                  {isProcessing && (
                    <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-black animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Sedang membaca dan mengekstrak jadwal dari file...</span>
                    </div>
                  )}

                  {fileName && !isProcessing && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-black inline-flex items-center space-x-2 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>File Berhasil Dimuat: {fileName}</span>
                    </span>
                  )}
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        Sudah Memiliki Dokumen aSc Timetables Resmi?
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        Anda juga dapat langsung memuat 368 sesi KBM lengkap (Senin - Sabtu seluruh kelas) dengan 1 klik tanpa perlu memilih file manual.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadOfficialPreset}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shrink-0 transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Muat Langsung Isi Jadwal Ini (368 Sesi)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: FILE UPLOADER (XML / EXCEL / CSV) */}
            {activeTab === 'file' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500 hover:border-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group shadow-xs"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xml, .xlsx, .xls, .csv, text/xml, application/xml"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs relative">
                  <Upload className="w-6 h-6" />
                  <span className="absolute -top-1.5 -right-2 bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                    XML / XLSX
                  </span>
                </div>

                <div>
                  <p className="text-sm font-black text-slate-800">
                    Klik untuk memilih file jadwal atau tarik file ke sini
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mendukung file ekspor resmi aSc Timetables (.xml), FET (.xml), Excel (.xlsx, .xls), atau CSV (.csv)
                  </p>
                </div>

                {isProcessing && (
                  <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-black animate-pulse mt-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>Sedang memproses dan mengekstrak jadwal...</span>
                  </div>
                )}

                {fileName && !isProcessing && (
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black mt-2 inline-flex items-center space-x-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>File Terpilih: {fileName}</span>
                  </span>
                )}
              </div>
            )}

            {/* TAB 2: PASTE TEXT */}
            {activeTab === 'paste' && (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Tempel data tabel dari Excel / Google Sheets di sini (salin seluruh baris dan kolom tabel)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    disabled={!pastedText.trim() || isProcessing}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>Proses Data Tempel</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ONE-CLICK PRESET */}
            {activeTab === 'preset' && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Preset Otomatis Dokumen aSc Timetables (368 Sesi)
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Jadwal resmi mingguan kelas VII A s/d IX F (Senin s/d Sabtu) sesuai dokumen PDF yang Anda upload telah siap dimuat.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadOfficialPreset}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                >
                  Muat Ulang Preset
                </button>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start space-x-2 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Memproses Jadwal</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* PARSED PREVIEW SECTION */}
          {parsedSchedules.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              
              {/* Summary Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-emerald-800">Total Sesi Mengajar</p>
                  <p className="text-2xl font-black text-emerald-950 mt-0.5">{stats.totalSlots} Sesi</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Berhasil terurai</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-slate-500">Kelas Terdaftar</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.classCount} Kelas</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Jenjang VII, VIII, IX</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase text-slate-500">Guru Terpetakan</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.teacherCount} Guru</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Beban jam mengajar</p>
                </div>

                <div className={`rounded-2xl p-3.5 shadow-2xs border ${
                  conflictReport.length > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <p className="text-[10px] font-extrabold uppercase opacity-80">Pengecekan Konflik Jam</p>
                  <p className="text-2xl font-black mt-0.5">
                    {conflictReport.length === 0 ? '0 Konflik' : `${conflictReport.length} Bentrok`}
                  </p>
                  <p className="text-[10px] font-semibold mt-0.5">
                    {conflictReport.length === 0 ? 'Semua guru bebas bentrok' : 'Perlu diperhatikan'}
                  </p>
                </div>
              </div>

              {/* Conflict Warnings if any */}
              {conflictReport.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1.5 text-amber-900 font-black">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Peringatan Jam Mengajar Bersamaan (Bentrok Guru):</span>
                  </div>
                  <ul className="space-y-1 text-amber-800 text-[11px] list-disc list-inside">
                    {conflictReport.slice(0, 5).map((c, idx) => (
                      <li key={idx}>
                        <strong>{c.teacherName}</strong> terjadwal di hari {c.day} ({c.period}) pada kelas:{' '}
                        <strong>{c.classes.join(', ')}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Navigation & View Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                
                {/* Day selector tabs */}
                <div className="flex flex-wrap items-center gap-1">
                  {DAYS_OF_WEEK.map(day => {
                    const count = stats.dayBreakdown[day] || 0;
                    return (
                      <button
                        key={day}
                        onClick={() => setPreviewDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                          previewDay === day
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{day}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          previewDay === day ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center">
                    <button
                      onClick={() => setPreviewViewType('matriks')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1 ${
                        previewViewType === 'matriks'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Matriks aSc</span>
                    </button>
                    <button
                      onClick={() => setPreviewViewType('tabel')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1 ${
                        previewViewType === 'tabel'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Daftar Tabel</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* VIEW 1: ASC TIMETABLE MATRIX (EXACT REPLICA OF USER'S PDF) */}
              {previewViewType === 'matriks' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-xs uppercase tracking-wider text-slate-800">
                        Jadwal Hari {previewDay.toUpperCase()} ({stats.dayBreakdown[previewDay]} Sesi)
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Format Grid aSc Timetables
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                      Struktur Jam: 1 s/d 8 (07:15 - 12:15 WIB)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs text-center min-w-[760px]">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                          <th className="py-2.5 px-3 text-left w-20 border-r border-slate-200">Kelas</th>
                          <th className="py-2 px-2 border-r border-slate-200">
                            <div>Jam 1</div>
                            <div className="text-[9px] font-normal text-slate-500">07:15 - 07:50</div>
                          </th>
                          <th className="py-2 px-2 border-r border-slate-200">
                            <div>Jam 2</div>
                            <div className="text-[9px] font-normal text-slate-500">07:50 - 08:25</div>
                          </th>
                          <th className="py-2 px-2 border-r border-slate-200">
                            <div>Jam 3</div>
                            <div className="text-[9px] font-normal text-slate-500">08:25 - 09:00</div>
                          </th>
                          <th className="py-2 px-2 border-r border-slate-200">
                            <div>Jam 4</div>
                            <div className="text-[9px] font-normal text-slate-500">09:00 - 09:35</div>
                          </th>
                          <th className="py-2 px-2 border-r border-slate-200 bg-amber-50/70 text-amber-900 w-16">
                            <div>Istirahat</div>
                            <div className="text-[8px] font-normal text-amber-700">09:35 - 09:55</div>
                          </th>
                          <th className="py-2 px-2 border-r border-slate-200">
                            <div>Jam 5</div>
                            <div className="text-[9px] font-normal text-slate-500">09:55 - 10:30</div>
                          </th>
                          <th className="py-2 px-2 border-r border-slate-200">
                            <div>Jam 6</div>
                            <div className="text-[9px] font-normal text-slate-500">10:30 - 11:05</div>
                          </th>
                          <th className="py-2 px-2 border-r border-slate-200">
                            <div>Jam 7</div>
                            <div className="text-[9px] font-normal text-slate-500">11:05 - 11:40</div>
                          </th>
                          <th className="py-2 px-2">
                            <div>Jam 8</div>
                            <div className="text-[9px] font-normal text-slate-500">11:40 - 12:15</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classList.map(clsName => {
                          const classSchedules = parsedSchedules.filter(
                            s => s.day === previewDay && s.className === clsName
                          );

                          // Find slot covering each period
                          const getSlot = (pHour: number) => {
                            return classSchedules.find(s => {
                              if (s.periodStartHour !== undefined && s.periodEndHour !== undefined) {
                                return pHour >= s.periodStartHour && pHour <= s.periodEndHour;
                              }
                              return s.periodNumber.includes(String(pHour));
                            });
                          };

                          const slot1 = getSlot(1);
                          const slot2 = getSlot(2);
                          const slot3 = getSlot(3);
                          const slot4 = getSlot(4);
                          const slot5 = getSlot(5);
                          const slot6 = getSlot(6);
                          const slot7 = getSlot(7);
                          const slot8 = getSlot(8);

                          const renderCell = (slot?: TeachingSchedule, periodKey?: string) => {
                            if (!slot) {
                              return <span className="text-slate-300">-</span>;
                            }

                            // Color accents based on subject
                            const isSupervisi = slot.subjectCode === 'SUPERVISI' || slot.subjectName.toLowerCase().includes('supervisi');
                            const isAgama = ['AQH', 'FIQIH', 'AQIDAH', 'SKI', 'BTQ'].includes(slot.subjectCode || '');

                            let bgClass = 'bg-emerald-50/80 border-emerald-200 text-emerald-950';
                            if (isSupervisi) bgClass = 'bg-rose-50 border-rose-200 text-rose-950';
                            else if (isAgama) bgClass = 'bg-teal-50 border-teal-200 text-teal-950';
                            else if (slot.subjectCode === 'MTK' || slot.subjectCode === 'IPA') bgClass = 'bg-sky-50 border-sky-200 text-sky-950';
                            else if (slot.subjectCode === 'ENG' || slot.subjectCode === 'BIND') bgClass = 'bg-indigo-50 border-indigo-200 text-indigo-950';

                            return (
                              <div className={`p-1.5 rounded-lg border text-left shadow-2xs ${bgClass}`}>
                                <p className="font-extrabold text-[10px] leading-tight line-clamp-2">
                                  {slot.subjectName}
                                </p>
                                <p className="text-[9px] opacity-80 truncate mt-0.5 font-medium">
                                  {slot.teacherName}
                                </p>
                              </div>
                            );
                          };

                          return (
                            <tr key={clsName} className="hover:bg-slate-50/60 transition">
                              <td className="py-2 px-3 text-left font-black text-slate-800 border-r border-slate-200 bg-slate-50/40">
                                {clsName}
                              </td>
                              
                              {/* Jam 1 & 2 */}
                              {slot1 && slot2 && slot1.id === slot2.id ? (
                                <td colSpan={2} className="p-1 border-r border-slate-200">
                                  {renderCell(slot1, '1-2')}
                                </td>
                              ) : (
                                <>
                                  <td className="p-1 border-r border-slate-200">{renderCell(slot1, '1')}</td>
                                  <td className="p-1 border-r border-slate-200">{renderCell(slot2, '2')}</td>
                                </>
                              )}

                              {/* Jam 3 & 4 */}
                              {slot3 && slot4 && slot3.id === slot4.id ? (
                                <td colSpan={2} className="p-1 border-r border-slate-200">
                                  {renderCell(slot3, '3-4')}
                                </td>
                              ) : (
                                <>
                                  <td className="p-1 border-r border-slate-200">{renderCell(slot3, '3')}</td>
                                  <td className="p-1 border-r border-slate-200">{renderCell(slot4, '4')}</td>
                                </>
                              )}

                              {/* Istirahat */}
                              <td className="p-1 border-r border-slate-200 bg-amber-50/40 text-[9px] font-bold text-amber-700">
                                Break
                              </td>

                              {/* Jam 5 & 6 */}
                              {slot5 && slot6 && slot5.id === slot6.id ? (
                                <td colSpan={2} className="p-1 border-r border-slate-200">
                                  {renderCell(slot5, '5-6')}
                                </td>
                              ) : (
                                <>
                                  <td className="p-1 border-r border-slate-200">{renderCell(slot5, '5')}</td>
                                  <td className="p-1 border-r border-slate-200">{renderCell(slot6, '6')}</td>
                                </>
                              )}

                              {/* Jam 7 & 8 */}
                              {slot7 && slot8 && slot7.id === slot8.id ? (
                                <td colSpan={2} className="p-1">
                                  {renderCell(slot7, '7-8')}
                                </td>
                              ) : (
                                <>
                                  <td className="p-1 border-r border-slate-200">{renderCell(slot7, '7')}</td>
                                  <td className="p-1">{renderCell(slot8, '8')}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: TABLE LIST */}
              {previewViewType === 'tabel' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari guru, mata pelajaran, atau kelas..."
                      value={searchPreview}
                      onChange={e => setSearchPreview(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Hari</th>
                          <th className="py-2 px-3">Kelas</th>
                          <th className="py-2 px-3">Jam Ke</th>
                          <th className="py-2 px-3">Mata Pelajaran</th>
                          <th className="py-2 px-3">Guru Pengajar</th>
                          <th className="py-2 px-3">Ruang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredList.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-emerald-800">{item.day}</td>
                            <td className="py-2 px-3 font-black text-slate-900">{item.className}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.periodNumber}</td>
                            <td className="py-2 px-3 font-extrabold text-slate-900">{item.subjectName}</td>
                            <td className="py-2 px-3 font-medium text-slate-700">{item.teacherName}</td>
                            <td className="py-2 px-3 text-slate-500">{item.room || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Mode Radio Options */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Pilihan Mode Simpan ke Database:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">
                        Ganti Seluruh Jadwal (Replace All) — Rekomendasi
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Menghapus jadwal lama dan menerapkan {parsedSchedules.length} sesi jadwal aSc Timetables baru secara bersih.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('merge')}
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">
                        Gabungkan / Timpa (Merge)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Hanya memperbarui jadwal untuk kelas dan sesi yang tercantum, mempertahankan jadwal kelas lain yang tidak diubah.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl border border-slate-300 text-xs transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={parsedSchedules.length === 0 || isProcessing}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black rounded-xl text-xs transition flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>
              {isProcessing
                ? 'Menyimpan Jadwal...'
                : `Terapkan & Simpan ${parsedSchedules.length > 0 ? `(${parsedSchedules.length} Sesi)` : ''}`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

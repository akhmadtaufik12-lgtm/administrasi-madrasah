import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Building2,
  Users,
  Printer,
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Upload,
  Copy,
  Layers,
  Sparkles,
  Award,
  BookOpen,
  Eye,
  Sliders,
  Check,
  RefreshCw,
  Clock,
  MapPin,
  IdCard,
  QrCode,
  ShieldCheck,
  FileText,
  BadgeAlert,
  ChevronRight,
  Filter,
  UserCheck,
  Settings2,
  FolderDown,
  LayoutGrid,
  Maximize2
} from 'lucide-react';
import {
  ExamEvent,
  ExamRoom,
  ExamScheduleItem,
  CurriculumSettings,
  Student,
  Teacher,
  Subject,
  SchoolOfficials,
  SchoolId,
  SchoolConfig,
  PaymentTransaction
} from '../types';
import {
  getStoredExamEvents,
  saveExamEvents,
  getStoredExamRooms,
  saveExamRooms,
  getStoredExamSchedules,
  saveExamSchedules,
  getStoredCurriculumSettings,
  saveCurriculumSettings,
  getSchoolConfig,
  getClassesForSchool,
  getStoredFeeTariffs
} from '../utils/storage';
import { renderKopSuratHtml, printHtmlString } from '../utils/export';

interface KurikulumPortalProps {
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  schoolOfficials: SchoolOfficials;
  activeSchoolId: SchoolId;
  payments?: PaymentTransaction[];
  onSwitchSchool?: (schoolId: SchoolId) => void;
  examEvents?: ExamEvent[];
  onSaveExamEvents?: (events: ExamEvent[]) => void;
  examRooms?: ExamRoom[];
  onSaveExamRooms?: (rooms: ExamRoom[]) => void;
  examSchedules?: ExamScheduleItem[];
  onSaveExamSchedules?: (schedules: ExamScheduleItem[]) => void;
  curriculumSettings?: CurriculumSettings;
  onSaveCurriculumSettings?: (settings: CurriculumSettings) => void;
}

type KurikulumTab = 'agenda' | 'ruang' | 'jadwal' | 'administrasi' | 'kartu' | 'kktp';

// Helper to parse grade level / tingkat for anti-cheating separation
export const parseGradeInfo = (className: string): { key: string; label: string; rank: number } => {
  if (!className) return { key: 'UMUM', label: 'Tingkat Umum', rank: 99 };
  const raw = className.trim().toUpperCase();
  const cleaned = raw.replace(/^(?:KELAS|KLS|TINGKAT|TK|GR)\s*[\.\-:]*\s*/i, '').trim();

  // 1. Check Roman VIII / 8 FIRST before VII
  if (/^(VIII\b|VIII[\s\-_\./]|\b8\b|^8[\s\-_\.A-Z]|^8$)/i.test(cleaned) || /\bVIII\b/i.test(raw)) {
    return { key: 'VIII', label: 'Tingkat VIII (Kelas 8)', rank: 8 };
  }

  // 2. Check Roman VII / 7 (Make sure not VIII)
  if (/^(VII\b|VII[\s\-_\./]|\b7\b|^7[\s\-_\.A-Z]|^7$)/i.test(cleaned) || (/\bVII\b/i.test(raw) && !/\bVIII\b/i.test(raw))) {
    return { key: 'VII', label: 'Tingkat VII (Kelas 7)', rank: 7 };
  }

  // 3. Check Roman IX / 9
  if (/^(IX\b|IX[\s\-_\./]|\b9\b|^9[\s\-_\.A-Z]|^9$)/i.test(cleaned) || /\bIX\b/i.test(raw)) {
    return { key: 'IX', label: 'Tingkat IX (Kelas 9)', rank: 9 };
  }

  // 4. Check Roman XII / 12 FIRST before XI and X
  if (/^(XII\b|XII[\s\-_\./]|\b12\b|^12[\s\-_\.A-Z]|^12$)/i.test(cleaned) || /\bXII\b/i.test(raw)) {
    return { key: 'XII', label: 'Tingkat XII (Kelas 12)', rank: 12 };
  }

  // 5. Check Roman XI / 11 (Make sure not XII)
  if (/^(XI\b|XI[\s\-_\./]|\b11\b|^11[\s\-_\.A-Z]|^11$)/i.test(cleaned) || (/\bXI\b/i.test(raw) && !/\bXII\b/i.test(raw))) {
    return { key: 'XI', label: 'Tingkat XI (Kelas 11)', rank: 11 };
  }

  // 6. Check Roman X / 10 (Make sure not XI, XII, IX)
  if (/^(X\b|X[\s\-_\./]|\b10\b|^10[\s\-_\.A-Z]|^10$)/i.test(cleaned) || (/\bX\b/i.test(raw) && !/\b(XI|XII|IX)\b/i.test(raw))) {
    return { key: 'X', label: 'Tingkat X (Kelas 10)', rank: 10 };
  }

  // 7. Check Roman VI / 6 (SD/MI) - check before V
  if (/^(VI\b|VI[\s\-_\./]|\b6\b|^6[\s\-_\.A-Z]|^6$)/i.test(cleaned) || (/\bVI\b/i.test(raw) && !/\b(VII|VIII)\b/i.test(raw))) {
    return { key: 'VI', label: 'Tingkat VI (Kelas 6)', rank: 6 };
  }

  // 8. Check Roman IV / 4
  if (/^(IV\b|IV[\s\-_\./]|\b4\b|^4[\s\-_\.A-Z]|^4$)/i.test(cleaned) || /\bIV\b/i.test(raw)) {
    return { key: 'IV', label: 'Tingkat IV (Kelas 4)', rank: 4 };
  }

  // 9. Check Roman V / 5 (Make sure not IV, VI, VII, VIII)
  if (/^(V\b|V[\s\-_\./]|\b5\b|^5[\s\-_\.A-Z]|^5$)/i.test(cleaned) || (/\bV\b/i.test(raw) && !/\b(IV|VI|VII|VIII)\b/i.test(raw))) {
    return { key: 'V', label: 'Tingkat V (Kelas 5)', rank: 5 };
  }

  // 10. Check Roman III / 3
  if (/^(III\b|III[\s\-_\./]|\b3\b|^3[\s\-_\.A-Z]|^3$)/i.test(cleaned) || /\bIII\b/i.test(raw)) {
    return { key: 'III', label: 'Tingkat III (Kelas 3)', rank: 3 };
  }

  // 11. Check Roman II / 2 (Make sure not III)
  if (/^(II\b|II[\s\-_\./]|\b2\b|^2[\s\-_\.A-Z]|^2$)/i.test(cleaned) || (/\bII\b/i.test(raw) && !/\bIII\b/i.test(raw))) {
    return { key: 'II', label: 'Tingkat II (Kelas 2)', rank: 2 };
  }

  // 12. Check Roman I / 1 (Make sure not II, III, IV, IX, XI, XII)
  if (/^(I\b|I[\s\-_\./]|\b1\b|^1[\s\-_\.A-Z]|^1$)/i.test(cleaned) || (/\bI\b/i.test(raw) && !/\b(II|III|IV|IX|XI|XII)\b/i.test(raw))) {
    return { key: 'I', label: 'Tingkat I (Kelas 1)', rank: 1 };
  }

  // Fallback to number match
  const matchNum = cleaned.match(/^([1-9]|1[0-2])\b/);
  if (matchNum) {
    const n = Number(matchNum[1]);
    const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n];
    return { key: roman || `KL_${n}`, label: `Tingkat ${roman || n} (Kelas ${n})`, rank: n };
  }

  return { key: raw, label: `Kelas ${raw}`, rank: 50 };
};

export const KurikulumPortal: React.FC<KurikulumPortalProps> = ({
  students,
  teachers,
  subjects,
  schoolOfficials,
  activeSchoolId,
  payments = [],
  onSwitchSchool,
  examEvents: propExamEvents,
  onSaveExamEvents,
  examRooms: propExamRooms,
  onSaveExamRooms,
  examSchedules: propExamSchedules,
  onSaveExamSchedules,
  curriculumSettings: propCurriculumSettings,
  onSaveCurriculumSettings
}) => {
  const schoolConfig: SchoolConfig = getSchoolConfig(activeSchoolId);
  const classesList = useMemo(() => getClassesForSchool(activeSchoolId), [activeSchoolId]);

  // Internal state if props not provided
  const [localExamEvents, setLocalExamEvents] = useState<ExamEvent[]>(() => 
    propExamEvents || getStoredExamEvents(activeSchoolId)
  );
  const [localExamRooms, setLocalExamRooms] = useState<ExamRoom[]>(() => 
    propExamRooms || getStoredExamRooms(activeSchoolId)
  );
  const [localExamSchedules, setLocalExamSchedules] = useState<ExamScheduleItem[]>(() => 
    propExamSchedules || getStoredExamSchedules(activeSchoolId)
  );
  const [localSettings, setLocalSettings] = useState<CurriculumSettings>(() => 
    propCurriculumSettings || getStoredCurriculumSettings(activeSchoolId)
  );

  const examEvents = propExamEvents || localExamEvents;
  const examRooms = propExamRooms || localExamRooms;
  const examSchedules = propExamSchedules || localExamSchedules;
  const curriculumSettings = propCurriculumSettings || localSettings;

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<KurikulumTab>('agenda');

  // Active Selected Exam Event
  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    return examEvents.length > 0 ? examEvents[0].id : '';
  });

  const activeExam = useMemo(() => {
    return examEvents.find(e => e.id === selectedExamId) || examEvents[0] || null;
  }, [examEvents, selectedExamId]);

  // Filtered rooms and schedules for active exam
  const activeRooms = useMemo(() => {
    if (!activeExam) return [];
    return examRooms.filter(r => r.examId === activeExam.id);
  }, [examRooms, activeExam]);

  const activeSchedules = useMemo(() => {
    if (!activeExam) return [];
    return examSchedules.filter(s => s.examId === activeExam.id);
  }, [examSchedules, activeExam]);

  // Persistence triggers
  const handleUpdateExamEvents = (updated: ExamEvent[]) => {
    setLocalExamEvents(updated);
    saveExamEvents(updated, activeSchoolId);
    if (onSaveExamEvents) onSaveExamEvents(updated);
  };

  const handleUpdateExamRooms = (updated: ExamRoom[]) => {
    setLocalExamRooms(updated);
    saveExamRooms(updated, activeSchoolId);
    if (onSaveExamRooms) onSaveExamRooms(updated);
  };

  const handleUpdateExamSchedules = (updated: ExamScheduleItem[]) => {
    setLocalExamSchedules(updated);
    saveExamSchedules(updated, activeSchoolId);
    if (onSaveExamSchedules) onSaveExamSchedules(updated);
  };

  const handleUpdateCurriculumSettings = (updated: CurriculumSettings) => {
    setLocalSettings(updated);
    saveCurriculumSettings(updated, activeSchoolId);
    if (onSaveCurriculumSettings) onSaveCurriculumSettings(updated);
  };

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ExamEvent | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamScheduleItem | null>(null);

  const [isAutoDistributeModalOpen, setIsAutoDistributeModalOpen] = useState(false);
  const [autoDistributeMode, setAutoDistributeMode] = useState<'cross_grade_anti_cheat' | 'checkerboard' | 'cross_class_anti_cheat' | 'per_class'>('cross_grade_anti_cheat');
  const [autoDistributeDeskFormat, setAutoDistributeDeskFormat] = useState<'kemendikbud_pair' | 'serpentine_pair'>('kemendikbud_pair');
  const [autoCapacity, setAutoCapacity] = useState<number>(curriculumSettings.defaultRoomCapacity || 20);

  // Card filter state
  const [cardClassFilter, setCardClassFilter] = useState<string>('ALL');
  const [cardRoomFilter, setCardRoomFilter] = useState<string>('ALL');
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');
  const [cardPaperLayout, setCardPaperLayout] = useState<'grid_2x2' | 'grid_2x4' | 'single'>('grid_2x2');
  const [showPaymentStatusStamp, setShowPaymentStatusStamp] = useState<boolean>(true);

  // Room View & Denah Ruang state
  const [roomViewMode, setRoomViewMode] = useState<'denah' | 'cards'>('denah');
  const [selectedDenahRoomId, setSelectedDenahRoomId] = useState<string>('');
  const [denahDeskType, setDenahDeskType] = useState<'double' | 'single'>('double');
  const [denahCols, setDenahCols] = useState<number>(4);
  const [denahRows, setDenahRows] = useState<number>(5);
  const [denahPattern, setDenahPattern] = useState<'standard_kemendikbud' | 'serpentine' | 'left_to_right' | 'vertical'>('standard_kemendikbud');
  const [denahTemplate, setDenahTemplate] = useState<'exact_image_official' | 'formal_kop'>('exact_image_official');
  const [denahProctorPos, setDenahProctorPos] = useState<'bottom_left' | 'bottom_right' | 'top'>('bottom_left');
  const [denahPaperSize, setDenahPaperSize] = useState<'A4' | 'F4'>('A4');
  const [denahOrientation, setDenahOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Administrasi Document tab state
  const [selectedAdminDoc, setSelectedAdminDoc] = useState<'daftar_hadir' | 'berita_acara' | 'daftar_pengawas' | 'tata_tertib' | 'label_amplop' | 'dnt' | 'sk_panitia'>('daftar_hadir');
  const [adminDocRoomId, setAdminDocRoomId] = useState<string>('ALL');
  const [adminDocScheduleId, setAdminDocScheduleId] = useState<string>('ALL');
  const [adminDocPaperSize, setAdminDocPaperSize] = useState<'A4' | 'F4'>('A4');
  const [adminDocSinglePage, setAdminDocSinglePage] = useState<boolean>(true);

  // Calculate quick stats
  const totalStudentsInExam = useMemo(() => {
    if (!activeExam) return 0;
    const assignedIds = new Set<string>();
    activeRooms.forEach(r => {
      r.assignedStudentIds.forEach(id => assignedIds.add(id));
    });
    return assignedIds.size > 0 ? assignedIds.size : students.length;
  }, [activeExam, activeRooms, students]);

  // Handle Event Creation & Edition
  const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingEvent ? editingEvent.id : `exam-${Date.now()}`;
    const selectedClasses = formData.getAll('targetClasses') as string[];

    const newEvent: ExamEvent = {
      id,
      title: (formData.get('title') as string) || 'Kegiatan Ujian',
      type: (formData.get('type') as any) || 'STS',
      academicYear: (formData.get('academicYear') as string) || '2026/2027',
      semester: (formData.get('semester') as string) || 'Semester Ganjil',
      startDate: (formData.get('startDate') as string) || new Date().toISOString().split('T')[0],
      endDate: (formData.get('endDate') as string) || new Date().toISOString().split('T')[0],
      targetClasses: selectedClasses.length > 0 ? selectedClasses : classesList,
      status: (formData.get('status') as any) || 'Persiapan',
      penanggungJawab: (formData.get('penanggungJawab') as string) || schoolOfficials.kepalaSekolah.name,
      ketuaPanitia: (formData.get('ketuaPanitia') as string) || schoolOfficials.kurikulum.name || 'Waka Kurikulum',
      sekretaris: (formData.get('sekretaris') as string) || 'Sekretaris Panitia',
      bendaharaPanitia: (formData.get('bendaharaPanitia') as string) || schoolOfficials.bendahara.name || 'Bendahara Panitia',
      seksiNaskah: (formData.get('seksiNaskah') as string) || '',
      seksiRuang: (formData.get('seksiRuang') as string) || '',
      seksiKonsumsi: (formData.get('seksiKonsumsi') as string) || '',
      nomorSKPanitia: (formData.get('nomorSKPanitia') as string) || `421.2/${Math.floor(100 + Math.random()*899)}/${schoolConfig.shortName}/SK-${formData.get('type')}/2026`,
      tanggalSK: (formData.get('tanggalSK') as string) || new Date().toISOString().split('T')[0],
      biayaUjianDefault: Number(formData.get('biayaUjianDefault')) || 0,
      catatan: (formData.get('catatan') as string) || '',
      schoolId: activeSchoolId,
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedList: ExamEvent[];
    if (editingEvent) {
      updatedList = examEvents.map(ev => ev.id === editingEvent.id ? newEvent : ev);
    } else {
      updatedList = [newEvent, ...examEvents];
    }

    handleUpdateExamEvents(updatedList);
    setSelectedExamId(newEvent.id);
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Yakin ingin menghapus agenda kegiatan ujian ini? Seluruh pembagian ruang dan jadwal terkait akan ikut disesuaikan.')) {
      const updated = examEvents.filter(e => e.id !== eventId);
      handleUpdateExamEvents(updated);
      if (selectedExamId === eventId && updated.length > 0) {
        setSelectedExamId(updated[0].id);
      }
    }
  };

  // Auto-Distribution Algorithm with Strict Anti-Cheating (Anti-Mencontek)
  const handleExecuteAutoDistribute = () => {
    if (!activeExam) return;
    const capacity = Math.max(5, autoCapacity || 20);

    // Target students filter
    let candidateStudents = students.filter(s => 
      activeExam.targetClasses.length === 0 || activeExam.targetClasses.includes(s.className)
    );

    if (candidateStudents.length === 0) {
      candidateStudents = [...students];
    }

    if (candidateStudents.length === 0) {
      alert('Tidak ada data siswa yang tersedia untuk dibagikan ke ruang ujian.');
      return;
    }

    const totalStudents = candidateStudents.length;
    const totalRooms = Math.ceil(totalStudents / capacity);
    const newRooms: ExamRoom[] = [];

    if (autoDistributeMode === 'per_class') {
      // 1. CLASSIC PER-CLASS MODE
      const classes = (Array.from(new Set(candidateStudents.map(s => s.className))) as string[]).sort();
      const ordered: Student[] = [];
      classes.forEach(c => {
        const inClass = candidateStudents.filter(s => s.className === c).sort((a, b) => a.name.localeCompare(b.name));
        ordered.push(...inClass);
      });

      let roomCounter = 1;
      for (let i = 0; i < ordered.length; i += capacity) {
        const chunk = ordered.slice(i, i + capacity);
        const roomId = `room-${activeExam.id}-${roomCounter}`;
        const seatMap: Record<string, number> = {};
        chunk.forEach((st, idx) => {
          seatMap[st.id] = idx + 1;
        });

        const primaryClass = chunk.length > 0 ? chunk[0].className : '';
        newRooms.push({
          id: roomId,
          examId: activeExam.id,
          roomNumber: roomCounter,
          roomName: `Ruang ${String(roomCounter).padStart(2, '0')} (Kelas ${primaryClass})`,
          buildingOrLocation: `Lantai ${Math.ceil(roomCounter / 4)} Gedung ${schoolConfig.shortName}`,
          capacity,
          assignedStudentIds: chunk.map(s => s.id),
          studentSeatNumbers: seatMap,
          schoolId: activeSchoolId,
          createdAt: new Date().toISOString()
        });
        roomCounter++;
      }
    } else {
      // 2. GUARANTEED ANTI-CHEATING DISTRIBUTIONS (CROSS-GRADE / CHECKERBOARD / CROSS-CLASS)
      // Group candidate students by Tier (Grade/Tingkat or Class/Rombel)
      const groupStudentsMap: Record<string, Student[]> = {};
      const groupMeta: Record<string, { label: string; rank: number }> = {};

      candidateStudents.forEach(st => {
        let groupKey: string;
        let groupLabel: string;
        let groupRank: number;

        if (autoDistributeMode === 'cross_class_anti_cheat') {
          groupKey = st.className;
          groupLabel = `Kelas ${st.className}`;
          groupRank = 1;
        } else {
          const gInfo = parseGradeInfo(st.className);
          groupKey = gInfo.key;
          groupLabel = gInfo.label;
          groupRank = gInfo.rank;
        }

        if (!groupStudentsMap[groupKey]) {
          groupStudentsMap[groupKey] = [];
          groupMeta[groupKey] = { label: groupLabel, rank: groupRank };
        }
        groupStudentsMap[groupKey].push(st);
      });

      // Sort each group's students by name alphabetically
      Object.keys(groupStudentsMap).forEach(k => {
        groupStudentsMap[k].sort((a, b) => a.name.localeCompare(b.name));
      });

      let sortedGroupKeys = Object.keys(groupStudentsMap).sort((a, b) => groupMeta[a].rank - groupMeta[b].rank);

      // If only 1 grade level is present, automatically fallback to separating by class/rombel (e.g. 9A & 9B)
      if (sortedGroupKeys.length === 1 && autoDistributeMode !== 'cross_class_anti_cheat') {
        const singleKey = sortedGroupKeys[0];
        const allInSingle = groupStudentsMap[singleKey];
        const distinctClasses = Array.from(new Set(allInSingle.map(s => s.className))).sort();
        
        if (distinctClasses.length > 1) {
          sortedGroupKeys = [];
          Object.keys(groupStudentsMap).forEach(k => delete groupStudentsMap[k]);
          Object.keys(groupMeta).forEach(k => delete groupMeta[k]);

          distinctClasses.forEach((cls, idx) => {
            groupStudentsMap[cls] = allInSingle.filter(s => s.className === cls).sort((a, b) => a.name.localeCompare(b.name));
            groupMeta[cls] = { label: `Kelas ${cls}`, rank: idx + 1 };
            sortedGroupKeys.push(cls);
          });
        }
      }

      // Distribute students evenly into each room bucket to ensure uniform grade balance across all rooms
      const roomBuckets: Student[][] = Array.from({ length: totalRooms }, () => []);
      
      // Distribute each tier across all rooms cyclically
      sortedGroupKeys.forEach(gKey => {
        const pool = [...groupStudentsMap[gKey]];
        let rIdx = 0;
        while (pool.length > 0) {
          const st = pool.shift()!;
          roomBuckets[rIdx].push(st);
          rIdx = (rIdx + 1) % totalRooms;
        }
      });

      // Build each room with strict desk & seat separation to guarantee NO same-grade/class at the same desk
      roomBuckets.forEach((roomStudentList, rIdx) => {
        if (roomStudentList.length === 0) return;
        const roomNumber = rIdx + 1;
        const roomId = `room-${activeExam.id}-${roomNumber}`;
        const totalDesksInRoom = Math.ceil(capacity / 2);

        // Group students in this room by tier
        const inRoomTiers: Record<string, Student[]> = {};
        roomStudentList.forEach(st => {
          const k = autoDistributeMode === 'cross_class_anti_cheat' || sortedGroupKeys.some(sgk => sgk === st.className) 
            ? st.className 
            : parseGradeInfo(st.className).key;
          if (!inRoomTiers[k]) inRoomTiers[k] = [];
          inRoomTiers[k].push(st);
        });

        // Helper to get tier key for any student
        const getStudentTier = (st: Student | null): string => {
          if (!st) return '';
          return inRoomTiers[st.className] ? st.className : parseGradeInfo(st.className).key;
        };

        const seatMap: Record<string, number> = {};
        const finalAssignedStudents: Student[] = [];

        if (autoDistributeMode === 'checkerboard') {
          // MATRIX CHECKERBOARD PATTERN (Anti-Contek Selang-Seling Depan-Belakang-Kiri-Kanan)
          const tierKeys = Object.keys(inRoomTiers).sort((a, b) => inRoomTiers[b].length - inRoomTiers[a].length);
          const tierQueues: Record<string, Student[]> = {};
          tierKeys.forEach(k => {
            tierQueues[k] = [...inRoomTiers[k]];
          });

          for (let sNum = 1; sNum <= capacity; sNum++) {
            const prefIdx = (sNum - 1) % tierKeys.length;
            let chosen: Student | null = null;
            for (let off = 0; off < tierKeys.length; off++) {
              const tk = tierKeys[(prefIdx + off) % tierKeys.length];
              if (tierQueues[tk] && tierQueues[tk].length > 0) {
                chosen = tierQueues[tk].shift()!;
                break;
              }
            }
            if (chosen) {
              seatMap[chosen.id] = sNum;
              finalAssignedStudents.push(chosen);
            }
          }
        } else {
          // DUAL-DESK ANTI-CHEATING BIPARTITE MATCHING SOLVER
          // Sort tiers by size descending (largest tier first)
          const tierKeys = Object.keys(inRoomTiers).sort((a, b) => inRoomTiers[b].length - inRoomTiers[a].length);
          
          // Build ordered student list
          const orderedPool: Student[] = [];
          tierKeys.forEach(k => {
            inRoomTiers[k].sort((a, b) => a.name.localeCompare(b.name));
            orderedPool.push(...inRoomTiers[k]);
          });

          const nStudents = orderedPool.length;
          const halfOffset = Math.ceil(nStudents / 2);

          // Partition into left and right desk seats using half-shifted offset
          const leftList: (Student | null)[] = orderedPool.slice(0, halfOffset);
          const rightList: (Student | null)[] = orderedPool.slice(halfOffset);

          // Pad both lists to totalDesksInRoom
          while (leftList.length < totalDesksInRoom) leftList.push(null);
          while (rightList.length < totalDesksInRoom) rightList.push(null);

          // Active Conflict Resolution Optimization Passes (Swap Optimizer)
          // If any desk has left and right from the SAME tier, find another desk and swap to resolve!
          for (let pass = 0; pass < 25; pass++) {
            let conflictCount = 0;

            for (let d = 0; d < totalDesksInRoom; d++) {
              const lSt = leftList[d];
              const rSt = rightList[d];

              if (lSt && rSt && getStudentTier(lSt) === getStudentTier(rSt)) {
                conflictCount++;
                let resolved = false;

                // Attempt 1: Swap rightList[d] with rightList[otherD]
                for (let otherD = 0; otherD < totalDesksInRoom; otherD++) {
                  if (d === otherD) continue;
                  const candRight = rightList[otherD];
                  const otherLeft = leftList[otherD];

                  const validForD = !candRight || getStudentTier(lSt) !== getStudentTier(candRight);
                  const validForOther = !otherLeft || !rSt || getStudentTier(otherLeft) !== getStudentTier(rSt);

                  if (validForD && validForOther) {
                    rightList[d] = candRight;
                    rightList[otherD] = rSt;
                    resolved = true;
                    break;
                  }
                }

                // Attempt 2: Swap leftList[d] with leftList[otherD]
                if (!resolved) {
                  for (let otherD = 0; otherD < totalDesksInRoom; otherD++) {
                    if (d === otherD) continue;
                    const candLeft = leftList[otherD];
                    const otherRight = rightList[otherD];

                    const validForD = !candLeft || !rSt || getStudentTier(candLeft) !== getStudentTier(rSt);
                    const validForOther = !otherRight || !lSt || getStudentTier(lSt) !== getStudentTier(otherRight);

                    if (validForD && validForOther) {
                      leftList[d] = candLeft;
                      leftList[otherD] = lSt;
                      resolved = true;
                      break;
                    }
                  }
                }
              }
            }

            if (conflictCount === 0) break;
          }

          // Assign seat numbers strictly to the paired desks
          for (let d = 0; d < totalDesksInRoom; d++) {
            const deskNumber = d + 1;
            const lSt = leftList[d];
            const rSt = rightList[d];

            if (autoDistributeDeskFormat === 'kemendikbud_pair') {
              // Standard Kemendikbud: Desk d has Left = d, Right = d + totalDesksInRoom
              if (lSt) {
                seatMap[lSt.id] = deskNumber;
                finalAssignedStudents.push(lSt);
              }
              if (rSt) {
                seatMap[rSt.id] = deskNumber + totalDesksInRoom;
                finalAssignedStudents.push(rSt);
              }
            } else {
              // Ganjil-Genap / Serpentine: Desk d has Left = 2*d - 1, Right = 2*d
              if (lSt) {
                seatMap[lSt.id] = 2 * deskNumber - 1;
                finalAssignedStudents.push(lSt);
              }
              if (rSt) {
                seatMap[rSt.id] = 2 * deskNumber;
                finalAssignedStudents.push(rSt);
              }
            }
          }
        }

        // Sort assigned IDs strictly by allocated seat number
        finalAssignedStudents.sort((a, b) => (seatMap[a.id] || 0) - (seatMap[b.id] || 0));

        // Format room title with tier badges
        const roomTierKeys = Object.keys(inRoomTiers);
        const tierSummary = roomTierKeys.map(k => groupMeta[k]?.label?.replace('Tingkat ', 'Kls ') || k).join(' & ');
        const roomName = `Ruang ${String(roomNumber).padStart(2, '0')} (${tierSummary || 'Silang Anti-Contek'})`;

        newRooms.push({
          id: roomId,
          examId: activeExam.id,
          roomNumber,
          roomName,
          buildingOrLocation: `Lantai ${Math.ceil(roomNumber / 4)} Gedung ${schoolConfig.shortName}`,
          capacity,
          assignedStudentIds: finalAssignedStudents.map(s => s.id),
          studentSeatNumbers: seatMap,
          schoolId: activeSchoolId,
          createdAt: new Date().toISOString()
        });
      });
    }

    // Replace rooms for this exam
    const otherRooms = examRooms.filter(r => r.examId !== activeExam.id);
    const combinedRooms = [...otherRooms, ...newRooms];
    handleUpdateExamRooms(combinedRooms);
    setIsAutoDistributeModalOpen(false);
    if (newRooms.length > 0) {
      setSelectedDenahRoomId(newRooms[0].id);
    }
    alert(`Berhasil membuat ${newRooms.length} ruang ujian dengan penataan Anti-Contek untuk ${candidateStudents.length} peserta!`);
  };

  // Helper to find student by ID
  const studentMap = useMemo(() => {
    const map: Record<string, Student> = {};
    students.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [students]);

  // Helper to get room and seat of student
  const studentExamPlacement = useMemo(() => {
    const map: Record<string, { roomNumber: number; roomName: string; seatNumber: number; examNumber: string }> = {};
    activeRooms.forEach(room => {
      room.assignedStudentIds.forEach((sId, idx) => {
        const seatNum = room.studentSeatNumbers?.[sId] || (idx + 1);
        const st = studentMap[sId];
        const examNum = `${String(room.roomNumber).padStart(2, '0')}-${String(seatNum).padStart(3, '0')}-${st?.nis || '01'}`;
        map[sId] = {
          roomNumber: room.roomNumber,
          roomName: room.roomName,
          seatNumber: seatNum,
          examNumber: examNum
        };
      });
    });
    return map;
  }, [activeRooms, studentMap]);

  // Filtered students for Card Print
  const printableStudents = useMemo(() => {
    let list = students;
    if (activeExam && activeExam.targetClasses.length > 0) {
      list = list.filter(s => activeExam.targetClasses.includes(s.className));
    }
    if (cardClassFilter !== 'ALL') {
      list = list.filter(s => s.className === cardClassFilter);
    }
    if (cardRoomFilter !== 'ALL') {
      const targetRoom = activeRooms.find(r => r.id === cardRoomFilter);
      if (targetRoom) {
        list = list.filter(s => targetRoom.assignedStudentIds.includes(s.id));
      }
    }
    if (cardSearchQuery.trim()) {
      const q = cardSearchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        s.className.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, activeExam, cardClassFilter, cardRoomFilter, cardSearchQuery, activeRooms]);

  // PRINTING UTILITIES: Exam Participant Cards
  const handlePrintCards = () => {
    if (!activeExam) return;
    if (printableStudents.length === 0) {
      alert('Tidak ada peserta yang sesuai dengan filter pencarian untuk dicetak.');
      return;
    }

    const kopHtml = renderKopSuratHtml(schoolOfficials, {
      isSinglePage: true,
      customConfig: {
        namaYayasanFontSize: 8.5,
        namaSekolahFontSize: 11,
        logoSize: 45
      }
    });

    const examLabel = activeExam.title;

    // Generate HTML for each card
    const cardsHtml = printableStudents.map((st) => {
      const placement = studentExamPlacement[st.id] || {
        roomNumber: 1,
        roomName: 'Ruang 01',
        seatNumber: 1,
        examNumber: `01-001-${st.nis || '01'}`
      };

      // Check payment status if enabled
      const studentPayments = payments.filter(p => p.studentId === st.id);
      const isPaid = studentPayments.length > 0;

      return `
        <div class="exam-card">
          <div class="card-kop-container">
            ${kopHtml}
          </div>
          
          <div class="card-title-banner">
            <div class="exam-type-badge">${activeExam.type} • TP ${activeExam.academicYear}</div>
            <div class="exam-main-title">KARTU PESERTA ASESMEN</div>
          </div>

          <div class="card-body">
            <div class="card-left-col">
              <table class="card-data-table">
                <tr>
                  <td class="lbl">Nama Peserta</td>
                  <td class="colon">:</td>
                  <td class="val"><strong>${st.name.toUpperCase()}</strong></td>
                </tr>
                <tr>
                  <td class="lbl">NIS / NISN</td>
                  <td class="colon">:</td>
                  <td class="val">${st.nis || '-'} / ${st.nisn || '-'}</td>
                </tr>
                <tr>
                  <td class="lbl">No. Peserta</td>
                  <td class="colon">:</td>
                  <td class="val"><span class="no-peserta-pill">${placement.examNumber}</span></td>
                </tr>
                <tr>
                  <td class="lbl">Kelas Asal</td>
                  <td class="colon">:</td>
                  <td class="val font-semibold">${st.className}</td>
                </tr>
                <tr>
                  <td class="lbl">Lokasi Ruang</td>
                  <td class="colon">:</td>
                  <td class="val"><strong>Ruang ${String(placement.roomNumber).padStart(2, '0')}</strong> (${placement.roomName})</td>
                </tr>
                <tr>
                  <td class="lbl">Nomor Meja</td>
                  <td class="colon">:</td>
                  <td class="val"><strong>Meja ${String(placement.seatNumber).padStart(2, '0')}</strong></td>
                </tr>
              </table>
            </div>

            <div class="card-right-col">
              <div class="card-photo-box">
                <div class="photo-placeholder">
                  PAS FOTO<br/>2 x 3
                </div>
              </div>
              <div class="card-qr-box">
                <div class="qr-label">VALIDASI RESMI</div>
                <div class="barcode-sim">||| | |||| | |||</div>
              </div>
            </div>
          </div>

          <!-- Schedule & Signature Footer -->
          <div class="card-footer">
            <div class="footer-rules">
              <p><strong>Tata Tertib:</strong> Wajib membawa kartu ini selama ujian, hadir 15 menit sebelum bel, dan menjaga ketertiban.</p>
              ${showPaymentStatusStamp ? `
                <div class="stamp-verified ${isPaid ? 'stamp-green' : 'stamp-blue'}">
                  ${isPaid ? '✓ TERVERIFIKASI LUNAS' : '✓ TERDAFTAR RESMI'}
                </div>
              ` : ''}
            </div>

            <div class="footer-signature">
              <p class="sig-city">${schoolOfficials.kotaSekolah || 'Jakarta'}, ${activeExam.tanggalSK || 'September 2026'}</p>
              <p class="sig-role">Ketua Panitia Ujian,</p>
              <div class="sig-space"></div>
              <p class="sig-name"><u>${activeExam.ketuaPanitia || 'Niarsih, S.Pd.I'}</u></p>
              <p class="sig-nip">NIP. ${schoolOfficials.kurikulum.nip || '-'}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const layoutCss = cardPaperLayout === 'grid_2x2' ? `
      .cards-grid-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .exam-card {
        border: 2px solid #0f172a;
        border-radius: 8px;
        padding: 10px;
        background: #ffffff;
        page-break-inside: avoid;
        break-inside: avoid;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 480px;
        box-sizing: border-box;
      }
    ` : cardPaperLayout === 'grid_2x4' ? `
      .cards-grid-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .exam-card {
        border: 1.5px solid #0f172a;
        border-radius: 6px;
        padding: 8px;
        background: #ffffff;
        page-break-inside: avoid;
        break-inside: avoid;
        min-height: 290px;
        font-size: 8pt;
      }
    ` : `
      .cards-grid-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .exam-card {
        border: 2px solid #0f172a;
        border-radius: 12px;
        padding: 24px;
        background: #ffffff;
        page-break-after: always;
        min-height: 600px;
      }
    `;

    const customCss = `
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      ${layoutCss}
      .card-kop-container {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 4px;
        margin-bottom: 6px;
      }
      .card-title-banner {
        text-align: center;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 3px;
        margin-bottom: 8px;
      }
      .exam-type-badge {
        font-size: 7.5pt;
        font-weight: 800;
        color: #047857;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .exam-main-title {
        font-size: 10pt;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: 1px;
      }
      .card-body {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      .card-left-col {
        flex: 1;
      }
      .card-data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5pt;
      }
      .card-data-table td {
        padding: 2.5px 0;
        vertical-align: top;
      }
      .card-data-table .lbl {
        width: 85px;
        color: #475569;
        font-size: 8pt;
      }
      .card-data-table .colon {
        width: 10px;
        color: #475569;
      }
      .card-data-table .val {
        color: #0f172a;
      }
      .no-peserta-pill {
        display: inline-block;
        background: #0f172a;
        color: #ffffff;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 800;
        font-family: monospace;
        font-size: 8.5pt;
      }
      .card-right-col {
        width: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .card-photo-box {
        width: 65px;
        height: 75px;
        border: 1px dashed #64748b;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 4px;
      }
      .photo-placeholder {
        font-size: 6.5pt;
        color: #64748b;
        font-weight: bold;
        line-height: 1.2;
      }
      .card-qr-box {
        text-align: center;
      }
      .qr-label {
        font-size: 5.5pt;
        font-weight: bold;
        color: #047857;
      }
      .barcode-sim {
        font-family: monospace;
        font-size: 8pt;
        letter-spacing: -1px;
        color: #334155;
      }
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-top: 1px dashed #cbd5e1;
        padding-top: 6px;
        margin-top: auto;
      }
      .footer-rules {
        width: 60%;
        font-size: 6.5pt;
        color: #475569;
        line-height: 1.2;
      }
      .stamp-verified {
        display: inline-block;
        margin-top: 4px;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 800;
        font-size: 6.5pt;
        border: 1px solid;
      }
      .stamp-green {
        color: #047857;
        border-color: #047857;
        background: #ecfdf5;
      }
      .stamp-blue {
        color: #1e40af;
        border-color: #1e40af;
        background: #eff6ff;
      }
      .footer-signature {
        width: 38%;
        text-align: center;
        font-size: 7pt;
        line-height: 1.15;
      }
      .sig-city { color: #334155; }
      .sig-role { font-weight: bold; }
      .sig-space { height: 26px; }
      .sig-name { font-weight: bold; color: #0f172a; }
      .sig-nip { font-size: 6pt; color: #64748b; }
    `;

    const bodyHtml = `
      <div class="cards-grid-container">
        ${cardsHtml}
      </div>
    `;

    printHtmlString(
      bodyHtml,
      `Kartu_Peserta_${activeExam.type}_${schoolConfig.shortName}`,
      {
        paperSize: 'A4',
        customCss
      }
    );
  };

  // PRINTING UTILITIES: Table Labels & Seat Labels
  const handlePrintTableLabels = () => {
    if (!activeExam) return;
    const targetRoom = cardRoomFilter === 'ALL' ? null : activeRooms.find(r => r.id === cardRoomFilter);
    const roomsToPrint = targetRoom ? [targetRoom] : activeRooms;

    if (roomsToPrint.length === 0) {
      alert('Belum ada ruang ujian yang dikonfigurasi.');
      return;
    }

    const labelsHtml = roomsToPrint.flatMap(room => {
      return room.assignedStudentIds.map(sId => {
        const st = studentMap[sId];
        const placement = studentExamPlacement[sId] || {
          roomNumber: room.roomNumber,
          roomName: room.roomName,
          seatNumber: 1,
          examNumber: `01-001-${st?.nis || '01'}`
        };

        return `
          <div class="table-label-card">
            <div class="label-header">
              <div class="label-school">${schoolConfig.fullName.toUpperCase()}</div>
              <div class="label-exam">${activeExam.title.toUpperCase()}</div>
            </div>
            <div class="label-seat-badge">MEJA ${String(placement.seatNumber).padStart(2, '0')}</div>
            <div class="label-main">
              <div class="label-student-name">${st ? st.name.toUpperCase() : 'NAMA SISWA'}</div>
              <div class="label-meta">
                <span>NIS: <strong>${st?.nis || '-'}</strong></span> • 
                <span>Kelas: <strong>${st?.className || '-'}</strong></span> • 
                <span>Ruang: <strong>${String(room.roomNumber).padStart(2, '0')}</strong></span>
              </div>
              <div class="label-no-peserta">NO. PESERTA: ${placement.examNumber}</div>
            </div>
          </div>
        `;
      });
    }).join('');

    const customCss = `
      @page { size: A4 portrait; margin: 8mm; }
      body { font-family: Arial, sans-serif; color: #000; }
      .labels-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .table-label-card {
        border: 2px dashed #000;
        border-radius: 6px;
        padding: 12px;
        text-align: center;
        page-break-inside: avoid;
        break-inside: avoid;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 140px;
      }
      .label-header {
        border-bottom: 1px solid #000;
        padding-bottom: 4px;
        margin-bottom: 6px;
      }
      .label-school { font-size: 8pt; font-weight: 900; color: #047857; }
      .label-exam { font-size: 7pt; font-weight: bold; color: #334155; }
      .label-seat-badge {
        display: inline-block;
        margin: 2px auto;
        background: #0f172a;
        color: #fff;
        font-weight: 900;
        font-size: 11pt;
        padding: 2px 12px;
        border-radius: 4px;
      }
      .label-student-name {
        font-size: 10pt;
        font-weight: 900;
        margin-top: 4px;
      }
      .label-meta { font-size: 8pt; color: #334155; margin-top: 2px; }
      .label-no-peserta {
        font-size: 8.5pt;
        font-weight: bold;
        font-family: monospace;
        margin-top: 4px;
        background: #f1f5f9;
        padding: 2px;
        border-radius: 3px;
      }
    `;

    const bodyHtml = `<div class="labels-grid">${labelsHtml}</div>`;
    printHtmlString(
      bodyHtml,
      `Label_Meja_Ujian_${activeExam.type}`,
      {
        paperSize: 'A4',
        customCss
      }
    );
  };

  // Selected Room for Denah
  const currentDenahRoom = useMemo(() => {
    if (!activeRooms || activeRooms.length === 0) return null;
    return activeRooms.find(r => r.id === selectedDenahRoomId) || activeRooms[0];
  }, [activeRooms, selectedDenahRoomId]);

  // Generate seats grid for a room based on capacity, desk type, columns, rows, and pattern
  const getRoomSeatsGrid = (
    room: ExamRoom,
    cols: number = 4,
    pattern: 'standard_kemendikbud' | 'serpentine' | 'left_to_right' | 'vertical' = 'standard_kemendikbud',
    deskType: 'double' | 'single' = 'double',
    customRows: number = 5
  ) => {
    const capacity = room.capacity || 20;
    const studentsInRoom = room.assignedStudentIds.map(id => studentMap[id]).filter(Boolean);

    // Map seatNumber -> Student
    const seatToStudentMap: Record<number, Student> = {};
    room.assignedStudentIds.forEach((sId, idx) => {
      const seatNum = room.studentSeatNumbers?.[sId] || (idx + 1);
      const st = studentMap[sId];
      if (st) seatToStudentMap[seatNum] = st;
    });

    // Determine rows
    let effectiveRows = customRows > 0 ? customRows : 5;
    if (customRows === 0) {
      if (deskType === 'double') {
        effectiveRows = Math.max(1, Math.ceil(capacity / (cols * 2)));
      } else {
        effectiveRows = Math.max(1, Math.ceil(capacity / cols));
      }
    }

    if (deskType === 'double') {
      // 2D Array of rows x cols of Desk Blocks (Each desk has Left & Right Student)
      const doubleGrid: {
        r: number;
        c: number;
        deskNumber: number;
        leftSeat: {
          seatNumber: number;
          student: Student | null;
          placement: any | null;
          isFilled: boolean;
        };
        rightSeat: {
          seatNumber: number;
          student: Student | null;
          placement: any | null;
          isFilled: boolean;
        };
      }[][] = [];

      const totalDesksInRoom = Math.ceil(capacity / 2);

      for (let r = 0; r < effectiveRows; r++) {
        const rowBlocks: any[] = [];
        for (let c = 0; c < cols; c++) {
          let leftSeatNum = 0;
          let rightSeatNum = 0;
          let deskNum = 0;

          if (pattern === 'standard_kemendikbud') {
            // Standard Kemendikbud Order: Desk 1..totalDesksInRoom (Left = d, Right = d + totalDesksInRoom)
            deskNum = r * cols + c + 1;
            if (deskNum <= totalDesksInRoom) {
              leftSeatNum = deskNum;
              rightSeatNum = deskNum + totalDesksInRoom;
            }
          } else if (pattern === 'serpentine') {
            const deskIdx = (r % 2 === 0) ? (r * cols + c) : (r * cols + (cols - 1 - c));
            deskNum = deskIdx + 1;
            if (deskNum <= totalDesksInRoom) {
              leftSeatNum = deskIdx * 2 + 1;
              rightSeatNum = deskIdx * 2 + 2;
            }
          } else if (pattern === 'left_to_right') {
            const deskIdx = r * cols + c;
            deskNum = deskIdx + 1;
            if (deskNum <= totalDesksInRoom) {
              leftSeatNum = deskIdx * 2 + 1;
              rightSeatNum = deskIdx * 2 + 2;
            }
          } else if (pattern === 'vertical') {
            const deskIdx = c * effectiveRows + r;
            deskNum = deskIdx + 1;
            if (deskNum <= totalDesksInRoom) {
              leftSeatNum = deskIdx * 2 + 1;
              rightSeatNum = deskIdx * 2 + 2;
            }
          }

          const leftSt = leftSeatNum > 0 ? (seatToStudentMap[leftSeatNum] || null) : null;
          const rightSt = rightSeatNum > 0 ? (seatToStudentMap[rightSeatNum] || null) : null;

          const getPlacement = (st: Student | null, sNum: number) => {
            if (!st || sNum === 0) return null;
            return studentExamPlacement[st.id] || {
              roomNumber: room.roomNumber,
              roomName: room.roomName,
              seatNumber: sNum,
              examNumber: `${String(room.roomNumber).padStart(2, '0')}-${String(sNum).padStart(3, '0')}-${st.nis || '01'}`
            };
          };

          rowBlocks.push({
            r,
            c,
            deskNumber: deskNum,
            leftSeat: {
              seatNumber: leftSeatNum,
              student: leftSt,
              placement: getPlacement(leftSt, leftSeatNum),
              isFilled: !!leftSt
            },
            rightSeat: {
              seatNumber: rightSeatNum,
              student: rightSt,
              placement: getPlacement(rightSt, rightSeatNum),
              isFilled: !!rightSt
            }
          });
        }
        doubleGrid.push(rowBlocks);
      }

      return {
        deskType: 'double' as const,
        cols,
        rows: effectiveRows,
        capacity,
        studentsInRoom,
        doubleGrid,
        singleGrid: []
      };
    } else {
      // Single Desk Grid
      const singleGrid: {
        seatNumber: number;
        student: Student | null;
        placement: any | null;
        isFilled: boolean;
      }[][] = [];

      for (let r = 0; r < effectiveRows; r++) {
        const rowSeats: any[] = [];
        for (let c = 0; c < cols; c++) {
          let seatNum = 0;
          if (pattern === 'standard_kemendikbud') {
            const cFromRight = (cols - 1) - c;
            const rFromBottom = (effectiveRows - 1) - r;
            seatNum = cFromRight * effectiveRows + rFromBottom + 1;
          } else if (pattern === 'serpentine') {
            if (r % 2 === 0) {
              seatNum = r * cols + c + 1;
            } else {
              seatNum = r * cols + (cols - 1 - c) + 1;
            }
          } else if (pattern === 'left_to_right') {
            seatNum = r * cols + c + 1;
          } else if (pattern === 'vertical') {
            seatNum = c * effectiveRows + r + 1;
          }

          if (seatNum <= capacity) {
            const st = seatToStudentMap[seatNum] || null;
            const placement = st ? (studentExamPlacement[st.id] || {
              roomNumber: room.roomNumber,
              roomName: room.roomName,
              seatNumber: seatNum,
              examNumber: `${String(room.roomNumber).padStart(2, '0')}-${String(seatNum).padStart(3, '0')}-${st.nis || '01'}`
            }) : null;

            rowSeats.push({
              seatNumber: seatNum,
              student: st,
              placement,
              isFilled: !!st
            });
          } else {
            rowSeats.push({
              seatNumber: seatNum,
              student: null,
              placement: null,
              isFilled: false
            });
          }
        }
        singleGrid.push(rowSeats);
      }

      return {
        deskType: 'single' as const,
        cols,
        rows: effectiveRows,
        capacity,
        studentsInRoom,
        doubleGrid: [],
        singleGrid
      };
    }
  };

  // PRINTING UTILITIES: Denah Ruang Ujian & Tata Letak Tempat Duduk
  const handlePrintDenahRuang = (targetRoomId?: string) => {
    if (!activeExam) return;
    const roomsToPrint = targetRoomId && targetRoomId !== 'ALL'
      ? activeRooms.filter(r => r.id === targetRoomId)
      : activeRooms;

    if (roomsToPrint.length === 0) {
      alert('Belum ada ruang ujian yang dapat dicetak denahnya.');
      return;
    }

    const kopHtml = renderKopSuratHtml(schoolOfficials, {
      isSinglePage: true,
      customConfig: {
        logoSize: 55,
        namaYayasanFontSize: 9.5,
        namaSekolahFontSize: 13
      }
    });

    const city = schoolOfficials?.kotaSekolah || 'Jakarta Barat';
    const todayFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const pagesHtml = roomsToPrint.map((room) => {
      const { deskType, doubleGrid, singleGrid, rows, cols, capacity, studentsInRoom } = getRoomSeatsGrid(
        room,
        denahCols,
        denahPattern,
        denahDeskType,
        denahRows
      );

      const countL = studentsInRoom.filter(s => s.gender === 'L').length;
      const countP = studentsInRoom.filter(s => s.gender === 'P').length;
      const classesInRoom = Array.from(new Set(studentsInRoom.map(s => s.className))).sort();

      // =======================================================================
      // TEMPLATE 1: EXACT IMAGE OFFICIAL FORMAT (Persis Lampiran Gambar)
      // =======================================================================
      if (denahTemplate === 'exact_image_official') {
        let gridBodyHtml = '';

        if (deskType === 'double') {
          gridBodyHtml = doubleGrid.map(row => {
            const cellsHtml = row.map(desk => {
              const leftName = desk.leftSeat.student ? desk.leftSeat.student.name : '&nbsp;';
              const leftNo = desk.leftSeat.placement ? desk.leftSeat.placement.examNumber : (desk.leftSeat.seatNumber <= capacity ? `Kursi ${desk.leftSeat.seatNumber}` : '&nbsp;');
              
              const rightName = desk.rightSeat.student ? desk.rightSeat.student.name : '&nbsp;';
              const rightNo = desk.rightSeat.placement ? desk.rightSeat.placement.examNumber : (desk.rightSeat.seatNumber <= capacity ? `Kursi ${desk.rightSeat.seatNumber}` : '&nbsp;');

              return `
                <td class="official-double-desk">
                  <table class="desk-sub-table">
                    <tr>
                      <td class="desk-sub-cell sub-cell-left">
                        <div class="student-name-box">${leftName}</div>
                        <div class="dashed-divider">:=:=:=:=:=:</div>
                        <div class="student-no-box">${leftNo}</div>
                      </td>
                      <td class="desk-sub-cell sub-cell-right">
                        <div class="student-name-box">${rightName}</div>
                        <div class="dashed-divider">:=:=:=:=:=:</div>
                        <div class="student-no-box">${rightNo}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              `;
            }).join('');
            return `<tr>${cellsHtml}</tr>`;
          }).join('');
        } else {
          // Single Desk in official format
          gridBodyHtml = singleGrid.map(row => {
            const cellsHtml = row.map(cell => {
              const name = cell.student ? cell.student.name : '&nbsp;';
              const no = cell.placement ? cell.placement.examNumber : (cell.seatNumber <= capacity ? `Kursi ${cell.seatNumber}` : '&nbsp;');
              return `
                <td class="official-single-desk">
                  <div class="student-name-box">${name}</div>
                  <div class="dashed-divider">:=:=:=:=:=:</div>
                  <div class="student-no-box">${no}</div>
                </td>
              `;
            }).join('');
            return `<tr>${cellsHtml}</tr>`;
          }).join('');
        }

        // Proctor and Door arrangement
        const proctorHtml = `<div class="official-pengawas-badge">PENGAWAS</div>`;
        const doorHtml = `<div class="official-pintu-text">Pintu .....................................</div>`;

        let bottomControlsHtml = '';
        if (denahProctorPos === 'bottom_left') {
          bottomControlsHtml = `
            <div class="official-bottom-row">
              ${proctorHtml}
              ${doorHtml}
            </div>
          `;
        } else if (denahProctorPos === 'bottom_right') {
          bottomControlsHtml = `
            <div class="official-bottom-row">
              ${doorHtml}
              ${proctorHtml}
            </div>
          `;
        } else {
          bottomControlsHtml = `
            <div class="official-bottom-row" style="justify-content: flex-end;">
              ${doorHtml}
            </div>
          `;
        }

        const topProctorHtml = denahProctorPos === 'top' ? `
          <div class="official-top-proctor-row">
            ${proctorHtml}
            <div class="official-papan-tulis">PAPAN TULIS</div>
          </div>
        ` : '';

        return `
          <div class="official-paper-container">
            <div class="official-outer-frame">
              <div class="official-title-header">
                Ruang : ${String(room.roomNumber).padStart(2, '0')}
              </div>

              ${topProctorHtml}

              <div class="official-table-wrapper">
                <table class="official-grid-table">
                  ${gridBodyHtml}
                </table>
              </div>

              ${bottomControlsHtml}
            </div>
          </div>
        `;
      }

      // =======================================================================
      // TEMPLATE 2: FORMAL KOP SURAT & SIGNATURE FORMAT
      // =======================================================================
      let formalTableRowsHtml = '';

      if (deskType === 'double') {
        formalTableRowsHtml = doubleGrid.map(row => {
          const cellsHtml = row.map(desk => {
            const renderHalf = (seat: any, sideLabel: string) => {
              if (seat.student) {
                const st = seat.student;
                const pl = seat.placement;
                return `
                  <div class="formal-seat-half filled">
                    <div class="seat-badge-row">
                      <span class="seat-badge">M.${String(seat.seatNumber).padStart(2, '0')}</span>
                      <span class="class-pill">${st.className}</span>
                    </div>
                    <div class="formal-st-name">${st.name}</div>
                    <div class="formal-st-no">${pl.examNumber}</div>
                  </div>
                `;
              } else if (seat.seatNumber <= capacity) {
                return `
                  <div class="formal-seat-half vacant">
                    <span class="vacant-badge">M.${String(seat.seatNumber).padStart(2, '0')}</span>
                    <div class="vacant-lbl">Kosong</div>
                  </div>
                `;
              } else {
                return `<div class="formal-seat-half invisible-half"></div>`;
              }
            };

            return `
              <td class="formal-double-cell">
                <div class="double-pair-wrapper">
                  ${renderHalf(desk.leftSeat, 'L')}
                  <div class="pair-divider"></div>
                  ${renderHalf(desk.rightSeat, 'R')}
                </div>
              </td>
            `;
          }).join('');
          return `<tr>${cellsHtml}</tr>`;
        }).join('');
      } else {
        formalTableRowsHtml = singleGrid.map(row => {
          const cellsHtml = row.map(cell => {
            if (!cell.isFilled && cell.seatNumber > capacity) {
              return `<td class="empty-cell"></td>`;
            }

            if (cell.student) {
              const st = cell.student;
              const pl = cell.placement;
              return `
                <td class="seat-cell filled-seat">
                  <div class="seat-badge">MEJA ${String(cell.seatNumber).padStart(2, '0')}</div>
                  <div class="student-name">${st.name.toUpperCase()}</div>
                  <div class="student-meta">
                    <span class="no-peserta">${pl.examNumber}</span>
                  </div>
                  <div class="student-class-badge">
                    <span>${st.className}</span> • <span>(${st.gender === 'P' ? 'P' : 'L'})</span>
                  </div>
                </td>
              `;
            } else {
              return `
                <td class="seat-cell vacant-seat">
                  <div class="seat-badge vacant-badge">MEJA ${String(cell.seatNumber).padStart(2, '0')}</div>
                  <div class="vacant-text">[ MEJA CADANGAN ]</div>
                  <div class="vacant-sub">Kapasitas Tersedia</div>
                </td>
              `;
            }
          }).join('');

          return `<tr>${cellsHtml}</tr>`;
        }).join('');
      }

      return `
        <div class="denah-page-container">
          <div class="denah-kop">
            ${kopHtml}
          </div>

          <div class="denah-header-title">
            <h2 class="main-title">DENAH TATA LETAK TEMPAT DUDUK PESERTA ASESMEN / UJIAN</h2>
            <h3 class="exam-title">${activeExam.title.toUpperCase()}</h3>
            <p class="academic-sub">TAHUN PELAJARAN ${activeExam.academicYear} • SEMESTER ${activeExam.semester.toUpperCase()}</p>
          </div>

          <div class="room-meta-card">
            <table class="meta-table">
              <tr>
                <td class="lbl">Ruang Ujian</td>
                <td class="sep">:</td>
                <td class="val font-bold">Ruang ${String(room.roomNumber).padStart(2, '0')} (${room.roomName})</td>
                <td class="lbl">Kapasitas Meja</td>
                <td class="sep">:</td>
                <td class="val">${capacity} Meja / Kursi</td>
              </tr>
              <tr>
                <td class="lbl">Lokasi / Gedung</td>
                <td class="sep">:</td>
                <td class="val">${room.buildingOrLocation || 'Gedung Utama Madrasah'}</td>
                <td class="lbl">Jumlah Peserta</td>
                <td class="sep">:</td>
                <td class="val font-bold">${studentsInRoom.length} Siswa (L: ${countL} | P: ${countP})</td>
              </tr>
              <tr>
                <td class="lbl">Rombel / Kelas</td>
                <td class="sep">:</td>
                <td class="val" colspan="4">${classesInRoom.join(', ') || '-'}</td>
              </tr>
            </table>
          </div>

          <div class="floor-plan-box">
            <!-- Front Area: Doors, Whiteboard, Proctor -->
            <div class="front-area-banner">
              <div class="door-badge left-door">🚪 PINTU MASUK</div>
              <div class="blackboard-box">📋 PAPAN TULIS & MEJA PENGAWAS RUANG</div>
              <div class="window-badge">🪟 JENDELA / VENTILASI</div>
            </div>

            <!-- Desks Grid -->
            <table class="desks-grid-table" style="width: 100%;">
              ${formalTableRowsHtml}
            </table>

            <!-- Back Area: Exit Door -->
            <div class="back-area-banner">
              <div class="back-door-badge">🚪 PINTU KELUAR / AREA BELAKANG RUANGAN</div>
            </div>
          </div>

          <div class="signature-section">
            <table class="sig-table">
              <tr>
                <td style="width: 50%; text-align: center; vertical-align: top;">
                  <div class="sig-title">Mengetahui,</div>
                  <div class="sig-role">Ketua Panitia Ujian</div>
                  <div class="sig-space"></div>
                  <div class="sig-name"><strong>${activeExam.ketuaPanitia}</strong></div>
                  <div class="sig-nip">NIP. ${schoolOfficials.kurikulum?.nip || '-'}</div>
                </td>
                <td style="width: 50%; text-align: center; vertical-align: top;">
                  <div class="sig-title">${city}, ${todayFormatted}</div>
                  <div class="sig-role">Pengawas Ruang ${String(room.roomNumber).padStart(2, '0')}</div>
                  <div class="sig-space"></div>
                  <div class="sig-name"><strong>( .................................................... )</strong></div>
                  <div class="sig-nip">NIP. ....................................................</div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;
    }).join('');

    const customCss = `
      @page {
        size: ${denahPaperSize} ${denahOrientation};
        margin: ${denahTemplate === 'exact_image_official' ? '6mm 8mm' : '8mm 10mm'};
      }
      body {
        font-family: Arial, sans-serif;
        color: #000;
        background: #fff;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      /* ========================================================= */
      /* EXACT IMAGE OFFICIAL PRINT STYLES (Persis Gambar Lampiran) */
      /* ========================================================= */
      .official-paper-container {
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
        height: 98vh;
        display: flex;
        flex-direction: column;
        justify-content: stretch;
      }
      .official-paper-container:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
      .official-outer-frame {
        border: 3.5px double #000;
        padding: 12px 14px;
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: #fff;
      }
      .official-title-header {
        text-align: center;
        font-size: 18pt;
        font-family: 'Times New Roman', Times, serif;
        font-weight: 900;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
        color: #000;
      }
      .official-top-proctor-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .official-papan-tulis {
        border: 1px solid #000;
        padding: 2px 14px;
        font-size: 9pt;
        font-weight: bold;
        font-family: 'Times New Roman', serif;
      }
      .official-table-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 4px 0;
      }
      .official-grid-table {
        width: 100%;
        height: 100%;
        border-collapse: separate;
        border-spacing: 12px 10px;
        table-layout: fixed;
      }
      .official-double-desk {
        border: 1.5px solid #000;
        padding: 0;
        vertical-align: top;
        background: #fff;
      }
      .official-single-desk {
        border: 1.5px solid #000;
        padding: 6px 4px;
        text-align: center;
        vertical-align: top;
        background: #fff;
      }
      .desk-sub-table {
        width: 100%;
        height: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .desk-sub-cell {
        width: 50%;
        padding: 4px 3px;
        text-align: center;
        vertical-align: middle;
        font-family: 'Times New Roman', Times, serif;
      }
      .sub-cell-left {
        border-right: 1.5px solid #000;
      }
      .student-name-box {
        font-size: 8.5pt;
        font-weight: bold;
        color: #000;
        line-height: 1.15;
        min-height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        word-break: break-word;
      }
      .dashed-divider {
        font-size: 7.5pt;
        font-weight: bold;
        letter-spacing: 1.5px;
        color: #000;
        margin: 2px 0;
        line-height: 1;
      }
      .student-no-box {
        font-size: 8pt;
        font-weight: 500;
        color: #000;
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.1;
      }
      .official-bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 10px;
        padding: 0 4px;
      }
      .official-pengawas-badge {
        border: 2.5px solid #000;
        padding: 4px 18px;
        font-size: 11pt;
        font-weight: 900;
        font-family: 'Times New Roman', Times, serif;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #000;
      }
      .official-pintu-text {
        font-size: 11pt;
        font-weight: bold;
        font-family: 'Times New Roman', Times, serif;
        color: #000;
      }

      /* ========================================================= */
      /* FORMAL KOP SURAT PRINT STYLES */
      /* ========================================================= */
      .denah-page-container {
        page-break-after: always;
        break-after: page;
        margin-bottom: 20px;
      }
      .denah-page-container:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
      .denah-header-title {
        text-align: center;
        margin-top: 4px;
        margin-bottom: 8px;
      }
      .denah-header-title .main-title {
        font-size: 11pt;
        font-weight: 900;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .denah-header-title .exam-title {
        font-size: 10pt;
        font-weight: bold;
        color: #047857;
        margin: 2px 0;
      }
      .denah-header-title .academic-sub {
        font-size: 8pt;
        color: #475569;
        margin: 0;
      }
      .room-meta-card {
        border: 1.5px solid #0f172a;
        border-radius: 4px;
        padding: 4px 8px;
        margin-bottom: 8px;
        background: #f8fafc;
      }
      .meta-table {
        width: 100%;
        font-size: 8pt;
        border-collapse: collapse;
      }
      .meta-table td {
        padding: 1.5px 3px;
      }
      .meta-table .lbl {
        width: 15%;
        color: #475569;
      }
      .meta-table .sep {
        width: 2%;
      }
      .meta-table .val {
        width: 33%;
        color: #0f172a;
      }
      .floor-plan-box {
        border: 2px solid #0f172a;
        border-radius: 6px;
        padding: 6px;
        background: #fff;
        margin-bottom: 10px;
      }
      .front-area-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #0f172a;
        color: #fff;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 8pt;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .front-area-banner .blackboard-box {
        font-size: 9pt;
        font-weight: 900;
        letter-spacing: 1px;
        background: #047857;
        padding: 3px 15px;
        border-radius: 3px;
        border: 1px solid #10b981;
      }
      .desks-grid-table {
        border-collapse: separate;
        border-spacing: 6px;
        table-layout: fixed;
      }
      .formal-double-cell {
        border: 1.5px solid #0f172a;
        border-radius: 4px;
        padding: 3px;
        vertical-align: top;
        background: #fff;
      }
      .double-pair-wrapper {
        display: flex;
        gap: 3px;
        height: 100%;
      }
      .formal-seat-half {
        flex: 1;
        padding: 3px;
        border-radius: 3px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 60px;
      }
      .formal-seat-half.filled {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
      }
      .formal-seat-half.vacant {
        background: #f1f5f9;
        border: 1px dashed #94a3b8;
        align-items: center;
        justify-content: center;
      }
      .pair-divider {
        width: 1px;
        background: #cbd5e1;
      }
      .seat-badge-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2px;
      }
      .class-pill {
        font-size: 6.5pt;
        font-weight: bold;
        color: #047857;
        background: #d1fae5;
        padding: 1px 3px;
        border-radius: 2px;
      }
      .formal-st-name {
        font-size: 7.5pt;
        font-weight: bold;
        color: #0f172a;
        line-height: 1.15;
        max-height: 24px;
        overflow: hidden;
      }
      .formal-st-no {
        font-size: 6.5pt;
        font-family: monospace;
        color: #475569;
      }
      .seat-cell {
        border: 2px solid #0f172a;
        border-radius: 4px;
        padding: 5px 6px;
        text-align: center;
        vertical-align: top;
        height: 72px;
        width: ${100 / denahCols}%;
      }
      .filled-seat {
        background: #f8fafc;
      }
      .vacant-seat {
        background: #f1f5f9;
        border: 2px dashed #94a3b8;
      }
      .seat-badge {
        display: inline-block;
        background: #0f172a;
        color: #fff;
        font-size: 7pt;
        font-weight: 900;
        padding: 1px 5px;
        border-radius: 3px;
      }
      .vacant-badge {
        background: #64748b;
        color: #fff;
        font-size: 6.5pt;
        padding: 1px 4px;
        border-radius: 2px;
      }
      .student-name {
        font-size: 8pt;
        font-weight: 900;
        color: #0f172a;
        line-height: 1.15;
        margin: 2px 0;
        max-height: 24px;
        overflow: hidden;
      }
      .student-meta {
        font-size: 7pt;
        color: #334155;
        font-family: monospace;
      }
      .student-class-badge {
        font-size: 7pt;
        font-weight: bold;
        color: #047857;
        margin-top: 2px;
      }
      .vacant-text {
        font-size: 7.5pt;
        font-weight: bold;
        color: #64748b;
        margin-top: 6px;
      }
      .vacant-sub {
        font-size: 6.5pt;
        color: #94a3b8;
      }
      .back-area-banner {
        text-align: center;
        background: #f1f5f9;
        border: 1px dashed #64748b;
        color: #475569;
        padding: 3px;
        border-radius: 3px;
        font-size: 7.5pt;
        font-weight: bold;
        margin-top: 8px;
      }
      .signature-section {
        margin-top: 10px;
      }
      .sig-table {
        width: 100%;
        font-size: 8pt;
        border-collapse: collapse;
      }
      .sig-space {
        height: 48px;
      }
      .sig-role {
        font-weight: bold;
        margin-top: 2px;
      }
    `;

    printHtmlString(
      pagesHtml,
      `Denah_Ruang_Ujian_${activeExam.type}_${schoolConfig.shortName}`,
      {
        paperSize: denahPaperSize,
        customCss
      }
    );
  };

  // PRINTING UTILITIES: Official Administration Documents
  const handlePrintAdminDocument = () => {
    if (!activeExam) return;

    const kopHtml = renderKopSuratHtml(schoolOfficials, {
      isSinglePage: adminDocSinglePage
    });

    const targetRoom = adminDocRoomId === 'ALL' ? activeRooms[0] : activeRooms.find(r => r.id === adminDocRoomId) || activeRooms[0];
    const targetSchedule = adminDocScheduleId === 'ALL' ? activeSchedules[0] : activeSchedules.find(s => s.id === adminDocScheduleId) || activeSchedules[0];

    let docTitle = 'DOKUMEN ADMINISTRASI UJIAN';
    let contentHtml = '';

    if (selectedAdminDoc === 'daftar_hadir') {
      docTitle = 'DAFTAR HADIR PESERTA UJIAN';
      const studentsInRoom = targetRoom ? targetRoom.assignedStudentIds.map(id => studentMap[id]).filter(Boolean) : [];

      contentHtml = `
        <div class="admin-doc-wrapper">
          <div class="kop-box">${kopHtml}</div>
          
          <div class="doc-header">
            <h2 class="doc-main-title">DAFTAR HADIR PESERTA ASESMEN / UJIAN</h2>
            <h3 class="doc-sub-title">${activeExam.title.toUpperCase()}</h3>
          </div>

          <table class="doc-meta-table">
            <tr>
              <td class="lbl">Mata Pelajaran</td>
              <td class="col">:</td>
              <td class="val font-bold">${targetSchedule ? targetSchedule.subjectName : 'Semua Mata Pelajaran'}</td>
              <td class="lbl">Ruang Ujian</td>
              <td class="col">:</td>
              <td class="val font-bold">Ruang ${targetRoom ? String(targetRoom.roomNumber).padStart(2, '0') : '01'} (${targetRoom?.roomName || ''})</td>
            </tr>
            <tr>
              <td class="lbl">Hari, Tanggal</td>
              <td class="col">:</td>
              <td class="val">${targetSchedule ? `${targetSchedule.dayName}, ${targetSchedule.dateFormatted}` : 'Sesuai Jadwal'}</td>
              <td class="lbl">Waktu / Sesi</td>
              <td class="col">:</td>
              <td class="val">${targetSchedule ? targetSchedule.timeSlot : 'Sesi 1 (07.30 - 09.00 WIB)'}</td>
            </tr>
          </table>

          <table class="doc-data-grid">
            <thead>
              <tr>
                <th style="width: 35px;">No.</th>
                <th style="width: 100px;">No. Peserta</th>
                <th style="width: 80px;">NIS / NISN</th>
                <th>Nama Lengkap Peserta</th>
                <th style="width: 60px;">Kelas</th>
                <th style="width: 140px;" colspan="2">Tanda Tangan Peserta</th>
                <th style="width: 80px;">Ket.</th>
              </tr>
            </thead>
            <tbody>
              ${studentsInRoom.length > 0 ? studentsInRoom.map((st, idx) => {
                const placement = studentExamPlacement[st.id];
                const isOdd = (idx + 1) % 2 !== 0;
                return `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-center font-mono font-bold">${placement ? placement.examNumber : '-'}</td>
                    <td class="text-center">${st.nis || '-'}</td>
                    <td class="font-bold">${st.name.toUpperCase()}</td>
                    <td class="text-center">${st.className}</td>
                    <td style="width: 70px; text-align: left; padding-left: 6px; font-size: 7.5pt; color: #64748b;">
                      ${isOdd ? `${idx + 1}. .........` : ''}
                    </td>
                    <td style="width: 70px; text-align: left; padding-left: 6px; font-size: 7.5pt; color: #64748b;">
                      ${!isOdd ? `${idx + 1}. .........` : ''}
                    </td>
                    <td class="text-center"></td>
                  </tr>
                `;
              }).join('') : `
                <tr><td colspan="8" class="text-center py-4">Belum ada siswa di ruang ini.</td></tr>
              `}
            </tbody>
          </table>

          <div class="doc-recap-box">
            <div class="recap-stats">
              <p>Jumlah Peserta Seharusnya : <strong>${studentsInRoom.length}</strong> orang</p>
              <p>Jumlah Peserta Hadir : ......... orang</p>
              <p>Jumlah Peserta Tidak Hadir : ......... orang</p>
            </div>
            <div class="proctor-signatures">
              <p class="sig-city">${schoolOfficials.kotaSekolah || 'Jakarta'}, ${targetSchedule ? targetSchedule.dateFormatted : 'September 2026'}</p>
              <table class="sig-table">
                <tr>
                  <td style="width: 50%; text-align: center;">
                    <p>Pengawas I,</p>
                    <div style="height: 35px;"></div>
                    <p><u>( .................................................. )</u></p>
                    <p style="font-size: 7pt; color: #64748b;">NIP. -</p>
                  </td>
                  <td style="width: 50%; text-align: center;">
                    <p>Pengawas II,</p>
                    <div style="height: 35px;"></div>
                    <p><u>( .................................................. )</u></p>
                    <p style="font-size: 7pt; color: #64748b;">NIP. -</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (selectedAdminDoc === 'berita_acara') {
      docTitle = 'BERITA ACARA PELAKSANAAN UJIAN';
      contentHtml = `
        <div class="admin-doc-wrapper">
          <div class="kop-box">${kopHtml}</div>
          
          <div class="doc-header">
            <h2 class="doc-main-title">BERITA ACARA PELAKSANAAN ASESMEN</h2>
            <h3 class="doc-sub-title">${activeExam.title.toUpperCase()}</h3>
          </div>

          <p class="prose-text">
            Pada hari ini <strong>....................</strong> tanggal <strong>.......</strong> bulan <strong>....................</strong> tahun <strong>2026</strong>, di <strong>${schoolConfig.fullName}</strong> telah diselenggarakan kegiatan asesmen:
          </p>

          <table class="doc-meta-table" style="margin-top: 6px;">
            <tr>
              <td class="lbl">Mata Pelajaran</td>
              <td class="col">:</td>
              <td class="val font-bold">${targetSchedule ? targetSchedule.subjectName : '...................................................'}</td>
            </tr>
            <tr>
              <td class="lbl">Ruang / Sesi</td>
              <td class="col">:</td>
              <td class="val">Ruang ${targetRoom ? String(targetRoom.roomNumber).padStart(2, '0') : '01'} / Sesi ${targetSchedule ? targetSchedule.sessionNumber : '1'} (${targetSchedule ? targetSchedule.timeSlot : '07.30 - 09.00 WIB'})</td>
            </tr>
            <tr>
              <td class="lbl">Jumlah Peserta Terdaftar</td>
              <td class="col">:</td>
              <td class="val"><strong>${targetRoom ? targetRoom.assignedStudentIds.length : 20}</strong> Orang</td>
            </tr>
            <tr>
              <td class="lbl">Jumlah Peserta Hadir</td>
              <td class="col">:</td>
              <td class="val">.......... Orang</td>
            </tr>
            <tr>
              <td class="lbl">Jumlah Peserta Tidak Hadir</td>
              <td class="col">:</td>
              <td class="val">.......... Orang (No. Peserta: .....................................................)</td>
            </tr>
          </table>

          <div style="margin-top: 10px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px;">
            <p style="font-weight: bold; font-size: 8.5pt; margin-bottom: 4px;">Catatan / Kejadian Penting Selama Pelaksanaan Asesmen:</p>
            <div style="height: 60px; font-size: 8pt; color: #64748b; font-style: italic;">
              (Ujian berlangsung dengan tertib, aman, dan lancar / Keterangan naskah soal lengkap dan bersegel utuh).
            </div>
          </div>

          <div class="proctor-signatures" style="margin-top: 20px;">
            <p style="font-size: 8.5pt;">Berita Acara ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.</p>
            <table class="sig-table" style="margin-top: 15px;">
              <tr>
                <td style="width: 50%; text-align: center;">
                  <p>Pengawas I,</p>
                  <div style="height: 45px;"></div>
                  <p><u>( .................................................. )</u></p>
                  <p style="font-size: 7.5pt; color: #64748b;">NIP. -</p>
                </td>
                <td style="width: 50%; text-align: center;">
                  <p>Pengawas II,</p>
                  <div style="height: 45px;"></div>
                  <p><u>( .................................................. )</u></p>
                  <p style="font-size: 7.5pt; color: #64748b;">NIP. -</p>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;
    } else if (selectedAdminDoc === 'tata_tertib') {
      docTitle = 'TATA TERTIB PESERTA & PENGAWAS UJIAN';
      contentHtml = `
        <div class="admin-doc-wrapper">
          <div class="kop-box">${kopHtml}</div>
          
          <div class="doc-header">
            <h2 class="doc-main-title">TATA TERTIB PESERTA ASESMEN / UJIAN</h2>
            <h3 class="doc-sub-title">${activeExam.title.toUpperCase()}</h3>
          </div>

          <ol class="rules-list" style="font-size: 8.5pt; line-height: 1.5; padding-left: 18px; margin-top: 10px;">
            <li>Peserta memasuki ruangan setelah tanda masuk dibunyikan (15 menit sebelum ujian dimulai).</li>
            <li>Peserta yang terlambat hanya boleh mengikuti ujian setelah mendapat izin dari Ketua Panitia tanpa perpanjangan waktu.</li>
            <li>Peserta wajib membawa dan meletakkan <strong>Kartu Peserta Ujian</strong> di atas meja masing-masing.</li>
            <li>Peserta wajib membawa alat tulis sendiri (pensil 2B, pulpen, penghapus) dan dilarang saling meminjamkan alat tulis.</li>
            <li>Peserta dilarang membawa buku, catatan, kalkulator, serta alat komunikasi (HP/Smartphone) ke dalam ruang ujian kecuali diizinkan secara tertulis.</li>
            <li>Peserta mengisi daftar hadir dengan menandatangani kolom presensi yang telah disediakan pengawas.</li>
            <li>Selama asesmen berlangsung, peserta dilarang: menanyakan jawaban kepada siapa pun, bekerjasama, atau menyontek.</li>
            <li>Peserta yang telah selesai mengerjakan soal sebelum waktu habis dapat meninggalkan ruangan setelah mendapat izin dari pengawas.</li>
            <li>Peserta wajib menjaga ketertiban, ketenangan, dan kebersihan di dalam ruang ujian.</li>
          </ol>

          <div style="margin-top: 30px; display: flex; justify-content: flex-end;">
            <div style="text-align: center; width: 220px; font-size: 8.5pt;">
              <p>${schoolOfficials.kotaSekolah || 'Jakarta'}, ${activeExam.tanggalSK || 'September 2026'}</p>
              <p style="font-weight: bold;">Kepala Madrasah / Sekolah,</p>
              <div style="height: 45px;"></div>
              <p><strong><u>${schoolOfficials.kepalaSekolah.name}</u></strong></p>
              <p style="font-size: 7.5pt; color: #64748b;">NIP. ${schoolOfficials.kepalaSekolah.nip || '-'}</p>
            </div>
          </div>
        </div>
      `;
    } else if (selectedAdminDoc === 'label_amplop') {
      docTitle = 'LABEL AMPLOP SOAL & LEMBAR JAWABAN';
      contentHtml = `
        <div class="admin-doc-wrapper">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${activeRooms.slice(0, 4).map(r => `
              <div style="border: 2px solid #000; border-radius: 6px; padding: 10px;">
                <div style="text-align: center; border-bottom: 1.5px solid #000; padding-bottom: 4px; margin-bottom: 6px;">
                  <div style="font-size: 8.5pt; font-weight: 900; color: #047857;">${schoolConfig.fullName.toUpperCase()}</div>
                  <div style="font-size: 7.5pt; font-weight: bold;">LABEL AMPLOP NASKAH SOAL & LJ</div>
                </div>
                <table style="width: 100%; font-size: 8pt;">
                  <tr><td style="width: 90px;">Kegiatan</td><td>: <strong>${activeExam.type} TP ${activeExam.academicYear}</strong></td></tr>
                  <tr><td>Mata Pelajaran</td><td>: <strong>${targetSchedule ? targetSchedule.subjectName : 'Semua Mapel'}</strong></td></tr>
                  <tr><td>Ruang Ujian</td><td>: <strong>Ruang ${String(r.roomNumber).padStart(2, '0')} (${r.roomName})</strong></td></tr>
                  <tr><td>Waktu / Sesi</td><td>: ${targetSchedule ? targetSchedule.timeSlot : '07.30 - 09.00 WIB'}</td></tr>
                  <tr><td>Isi Amplop</td><td>: • Naskah Soal (${r.capacity} Eks)<br/>• Lembar Jawaban (${r.capacity} Eks)<br/>• Berita Acara & Daftar Hadir</td></tr>
                  <tr><td>Status Segel</td><td>: [ ✓ ] UTUH DAN RAPI TERSEGEL</td></tr>
                </table>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (selectedAdminDoc === 'sk_panitia') {
      docTitle = 'SK KEPANITIAAN UJIAN RESMI';
      contentHtml = `
        <div class="admin-doc-wrapper">
          <div class="kop-box">${kopHtml}</div>
          
          <div class="doc-header">
            <h2 class="doc-main-title">SURAT KEPUTUSAN KEPALA MADRASAH / SEKOLAH</h2>
            <h3 class="doc-sub-title">NOMOR: ${activeExam.nomorSKPanitia || '421.2/089/SK-UJIAN/2026'}</h3>
            <p style="font-size: 9pt; font-weight: bold; margin-top: 4px;">TENTANG<br/>SUSUNAN PANITIA PELAKSANA ${activeExam.title.toUpperCase()}</p>
          </div>

          <div style="font-size: 8.5pt; line-height: 1.5; margin-top: 10px;">
            <p>Menimbang, Mengingat, dan Memperhatikan kelancaran pelaksanaan evaluasi pembelajaran, Kepala ${schoolConfig.fullName} memutuskan susunan panitia sebagai berikut:</p>
            <table class="doc-data-grid" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width: 40px;">No.</th>
                  <th>Jabatan Kepanitiaan</th>
                  <th>Nama Lengkap & Gelar</th>
                  <th>Keterangan / Tugas Pokok</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="text-center">1</td><td class="font-bold">Penanggung Jawab</td><td>${activeExam.penanggungJawab || schoolOfficials.kepalaSekolah.name}</td><td>Kepala Madrasah</td></tr>
                <tr><td class="text-center">2</td><td class="font-bold">Ketua Panitia</td><td>${activeExam.ketuaPanitia}</td><td>Waka Kurikulum</td></tr>
                <tr><td class="text-center">3</td><td class="font-bold">Sekretaris</td><td>${activeExam.sekretaris}</td><td>Administrasi & Berkas</td></tr>
                <tr><td class="text-center">4</td><td class="font-bold">Bendahara</td><td>${activeExam.bendaharaPanitia}</td><td>Pengelolaan Anggaran</td></tr>
                <tr><td class="text-center">5</td><td class="font-bold">Seksi Naskah & CBT</td><td>${activeExam.seksiNaskah || 'Akhmad Taufik'}</td><td>Penggandaan & Bank Soal</td></tr>
                <tr><td class="text-center">6</td><td class="font-bold">Seksi Ruang & Meja</td><td>${activeExam.seksiRuang || 'Sugiyono, S.Pd'}</td><td>Penataan Denah & Ruang</td></tr>
                <tr><td class="text-center">7</td><td class="font-bold">Seksi Konsumsi</td><td>${activeExam.seksiKonsumsi || 'Listijawati, SE'}</td><td>Logistik Pengawas</td></tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 25px; display: flex; justify-content: flex-end;">
            <div style="text-align: center; width: 220px; font-size: 8.5pt;">
              <p>${schoolOfficials.kotaSekolah || 'Jakarta'}, ${activeExam.tanggalSK || 'September 2026'}</p>
              <p style="font-weight: bold;">Kepala Madrasah / Sekolah,</p>
              <div style="height: 45px;"></div>
              <p><strong><u>${schoolOfficials.kepalaSekolah.name}</u></strong></p>
              <p style="font-size: 7.5pt; color: #64748b;">NIP. ${schoolOfficials.kepalaSekolah.nip || '-'}</p>
            </div>
          </div>
        </div>
      `;
    }

    const customCss = `
      @page { size: ${adminDocPaperSize} portrait; margin: 12mm; }
      body { font-family: 'Times New Roman', Times, serif; color: #000; }
      .admin-doc-wrapper { width: 100%; }
      .kop-box { margin-bottom: 6px; }
      .doc-header { text-align: center; margin-bottom: 8px; }
      .doc-main-title { font-size: 11.5pt; font-weight: bold; margin: 0; text-decoration: underline; }
      .doc-sub-title { font-size: 9.5pt; font-weight: bold; margin: 2px 0 0 0; }
      .doc-meta-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8px; }
      .doc-meta-table td { padding: 1.5px 0; vertical-align: top; }
      .doc-meta-table .lbl { width: 110px; color: #334155; }
      .doc-meta-table .col { width: 10px; }
      .doc-data-grid { width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 4px; }
      .doc-data-grid th, .doc-data-grid td { border: 1px solid #000; padding: 3px 5px; }
      .doc-data-grid th { background: #f1f5f9; font-weight: bold; text-align: center; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      .font-mono { font-family: monospace; }
      .doc-recap-box { display: flex; justify-content: space-between; margin-top: 10px; font-size: 8.5pt; }
      .recap-stats { width: 45%; line-height: 1.4; }
      .proctor-signatures { width: 50%; }
      .sig-city { text-align: center; margin-bottom: 6px; }
      .sig-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
    `;

    printHtmlString(
      contentHtml,
      `${docTitle}_${schoolConfig.shortName}`,
      {
        paperSize: adminDocPaperSize,
        customCss
      }
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header Banner with School Switcher & Exam Selection */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-black tracking-wide mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>PORTAL WAKA KURIKULUM & MANAJEMEN UJIAN</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{schoolConfig.fullName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-600/80 font-mono text-indigo-100 border border-indigo-400/30">
                {schoolConfig.shortName}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 max-w-2xl leading-relaxed">
              Pengelolaan Asesmen Terpadu (STS / SAS / AM), Pembagian Ruang Ujian Otomatis, Matriks Pengawas, Berkas Administrasi Kedinasan & Cetak Kartu Peserta Ujian.
            </p>
          </div>

          {/* Active Exam Selector & New Event Trigger */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-indigo-900/80">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kegiatan Ujian Aktif:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-slate-900 border border-indigo-700/80 text-white font-bold text-xs sm:text-sm rounded-lg px-3 py-1.5 mt-0.5 focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer max-w-xs"
              >
                {examEvents.map(e => (
                  <option key={e.id} value={e.id}>
                    [{e.type}] {e.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="mt-3.5 sm:mt-0 flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-3.5 py-2 rounded-lg shadow-md cursor-pointer transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Ujian Baru</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-5 pt-4 border-t border-indigo-900/60 text-xs">
          <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Peserta</span>
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">{totalStudentsInExam} Siswa</div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ruang Ujian</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">{activeRooms.length} Ruang</div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Sesi Mapel</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">{activeSchedules.length} Sesi</div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ketua Panitia</span>
            </div>
            <div className="text-xs font-bold text-cyan-300 mt-1 truncate">{activeExam?.ketuaPanitia || 'Waka Kurikulum'}</div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Status Agenda</span>
            </div>
            <div className="text-xs font-bold text-purple-300 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>{activeExam?.status || 'Persiapan'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'agenda'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-indigo-300" />
          <span>1. Agenda & Panitia</span>
        </button>

        <button
          onClick={() => setActiveTab('ruang')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'ruang'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-300" />
          <span>2. Pembagian Ruang & Meja</span>
        </button>

        <button
          onClick={() => setActiveTab('jadwal')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'jadwal'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-300" />
          <span>3. Jadwal & Pengawas</span>
        </button>

        <button
          onClick={() => setActiveTab('administrasi')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'administrasi'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-300" />
          <span>4. Berkas Kedinasan</span>
        </button>

        <button
          onClick={() => setActiveTab('kartu')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'kartu'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <IdCard className="w-4 h-4 text-purple-300" />
          <span>5. Cetak Kartu Peserta</span>
        </button>

        <button
          onClick={() => setActiveTab('kktp')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
            activeTab === 'kktp'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-rose-300" />
          <span>6. Standar KKTP / KKM</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AGENDA & PANITIA UJIAN */}
      {/* ========================================================================= */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          
          {/* Active Exam Overview Card */}
          {activeExam && (
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-black px-2.5 py-0.5 rounded-md">
                      {activeExam.type}
                    </span>
                    <h2 className="text-lg font-black text-white">{activeExam.title}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Tahun Pelajaran {activeExam.academicYear} • {activeExam.semester} • Rentang Tanggal: {activeExam.startDate} s/d {activeExam.endDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingEvent(activeExam);
                      setIsEventModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 cursor-pointer transition-all"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Agenda</span>
                  </button>

                  <button
                    onClick={() => handleDeleteEvent(activeExam.id)}
                    className="flex items-center space-x-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold px-3 py-2 rounded-lg border border-rose-800/40 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Committee Structure Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Penanggung Jawab</span>
                  <div className="text-xs font-black text-slate-200 mt-0.5">{activeExam.penanggungJawab || schoolOfficials.kepalaSekolah.name}</div>
                  <div className="text-[10px] text-slate-400">Kepala Madrasah / Sekolah</div>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Ketua Panitia Ujian</span>
                  <div className="text-xs font-black text-indigo-200 mt-0.5">{activeExam.ketuaPanitia}</div>
                  <div className="text-[10px] text-slate-400">Waka Kurikulum</div>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Sekretaris Panitia</span>
                  <div className="text-xs font-black text-emerald-200 mt-0.5">{activeExam.sekretaris}</div>
                  <div className="text-[10px] text-slate-400">Koordinator Administrasi</div>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Bendahara Panitia</span>
                  <div className="text-xs font-black text-amber-200 mt-0.5">{activeExam.bendaharaPanitia}</div>
                  <div className="text-[10px] text-slate-400">Pengelolaan Anggaran</div>
                </div>
              </div>

              {/* Legal SK and Details */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div>
                  <strong>Nomor SK Panitia:</strong> <span className="font-mono text-slate-300">{activeExam.nomorSKPanitia || '-'}</span> (Tgl: {activeExam.tanggalSK || '-'})
                </div>
                <div>
                  <strong>Kelas Sasaran:</strong> <span className="text-emerald-400 font-semibold">{activeExam.targetClasses.join(', ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* All Exams List Table */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>Daftar Seluruh Agenda Ujian Madrasah / Sekolah</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Jenis</th>
                    <th className="p-3">Judul Kegiatan Ujian</th>
                    <th className="p-3">Tahun & Semester</th>
                    <th className="p-3">Rentang Tanggal</th>
                    <th className="p-3">Ketua Panitia</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {examEvents.map(e => (
                    <tr key={e.id} className={e.id === selectedExamId ? 'bg-indigo-950/40' : 'hover:bg-slate-800/50'}>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-slate-800 text-slate-200 border border-slate-700">
                          {e.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">
                        {e.title}
                        {e.id === selectedExamId && (
                          <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black">
                            AKTIF
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">{e.academicYear} • {e.semester}</td>
                      <td className="p-3 text-slate-400">{e.startDate} s/d {e.endDate}</td>
                      <td className="p-3 text-slate-300 font-medium">{e.ketuaPanitia}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          {e.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedExamId(e.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded text-[11px] cursor-pointer"
                        >
                          Pilih
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PEMBAGIAN RUANG & DENAH TATA LETAK MEJA */}
      {/* ========================================================================= */}
      {activeTab === 'ruang' && (
        <div className="space-y-6">
          
          {/* Action Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Manajemen Ruang & Denah Meja
                </span>
                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                  • Total {activeRooms.length} Ruangan Terdaftar
                </span>
              </div>
              <h2 className="text-base font-black text-white flex items-center gap-2 mt-1">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Pembagian Ruang Ujian & Denah Meja Peserta</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kegiatan: <strong className="text-slate-200">{activeExam?.title}</strong> • Total <strong className="text-emerald-400">{totalStudentsInExam} Peserta</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Switcher: Denah Visual vs Daftar Kartu */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
                <button
                  onClick={() => setRoomViewMode('denah')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    roomViewMode === 'denah'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Denah Visual</span>
                </button>

                <button
                  onClick={() => setRoomViewMode('cards')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    roomViewMode === 'cards'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Daftar Kartu</span>
                </button>
              </div>

              <button
                onClick={() => setIsAutoDistributeModalOpen(true)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Auto-Bagi Ruang</span>
              </button>

              <button
                onClick={() => handlePrintDenahRuang(currentDenahRoom?.id)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md cursor-pointer transition-all"
                title="Cetak Denah Ruang yang sedang aktif"
              >
                <Printer className="w-4 h-4 text-indigo-200" />
                <span>Cetak Denah Ruang Ini</span>
              </button>

              <button
                onClick={() => handlePrintDenahRuang('ALL')}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 cursor-pointer transition-all"
                title="Cetak Seluruh Denah Ruang Sekaligus"
              >
                <FolderDown className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Cetak Semua Denah</span>
              </button>

              <button
                onClick={handlePrintTableLabels}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Label Meja</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUB-VIEW 1: DENAH TATA LETAK TEMPAT DUDUK (VISUAL FLOOR PLAN) */}
          {/* ========================================================================= */}
          {roomViewMode === 'denah' && (
            <div className="space-y-5">
              {/* Room Selector Tab Bar */}
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Pilih Ruang Ujian untuk Pratinjau Denah:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
                    Klik tombol ruang untuk melihat tata letak kursi & peserta
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {activeRooms.map((room) => {
                    const isSelected = currentDenahRoom?.id === room.id;
                    const studentsInRoom = room.assignedStudentIds.map(id => studentMap[id]).filter(Boolean);
                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedDenahRoomId(room.id)}
                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
                            : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                          isSelected ? 'bg-white text-emerald-700' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {String(room.roomNumber).padStart(2, '0')}
                        </span>
                        <span>{room.roomName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-emerald-800/80 text-emerald-100' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {studentsInRoom.length}/{room.capacity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Denah Settings & Layout Controls */}
              {currentDenahRoom && (
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Pengaturan Tata Letak & Jalur Meja Denah
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Konfigurasi kolom, baris, pola kursi berpasangan & format cetak
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Desk Type Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Tipe Meja / Format Kursi:
                      </label>
                      <select
                        value={denahDeskType}
                        onChange={(e) => setDenahDeskType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="double">Meja Berpasangan (2 Siswa/Meja - Sesuai Gambar)</option>
                        <option value="single">Meja Tunggal (1 Siswa/Meja)</option>
                      </select>
                    </div>

                    {/* Column Configuration */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Jumlah Kolom / Jalur Meja:
                      </label>
                      <select
                        value={denahCols}
                        onChange={(e) => setDenahCols(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value={2}>2 Kolom / Jalur Meja</option>
                        <option value={3}>3 Kolom / Jalur Meja</option>
                        <option value={4}>4 Kolom / Jalur Meja (Standar - Sesuai Gambar)</option>
                        <option value={5}>5 Kolom / Jalur Meja</option>
                        <option value={6}>6 Kolom / Jalur Meja (Aula / Ruang Besar)</option>
                      </select>
                    </div>

                    {/* Row Configuration */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Jumlah Baris Meja (Depan ke Belakang):
                      </label>
                      <select
                        value={denahRows}
                        onChange={(e) => setDenahRows(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value={0}>Otomatis (Sesuai Kapasitas Ruang)</option>
                        <option value={3}>3 Baris Meja</option>
                        <option value={4}>4 Baris Meja</option>
                        <option value={5}>5 Baris Meja (Standar 5 Baris - Sesuai Gambar)</option>
                        <option value={6}>6 Baris Meja</option>
                        <option value={7}>7 Baris Meja</option>
                      </select>
                    </div>

                    {/* Numbering Pattern */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Pola Arah Penomoran Meja:
                      </label>
                      <select
                        value={denahPattern}
                        onChange={(e) => setDenahPattern(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="standard_kemendikbud">Standar Dinas / Kemenag (Sesuai Gambar)</option>
                        <option value="serpentine">Ular Berkelok (S-Pattern)</option>
                        <option value="left_to_right">Kiri ke Kanan Tiap Baris (Z-Pattern)</option>
                        <option value="vertical">Lajur Vertikal (Depan ke Belakang)</option>
                      </select>
                    </div>
                  </div>

                  {/* Secondary Configuration Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-800/60">
                    {/* Print Template Style */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Format Desain Cetak:
                      </label>
                      <select
                        value={denahTemplate}
                        onChange={(e) => setDenahTemplate(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="exact_image_official">Format Bingkai Klasik Resmi (Persis Gambar)</option>
                        <option value="formal_kop">Format Kop Surat & TTD Panitia</option>
                      </select>
                    </div>

                    {/* Proctor & Door Position */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Posisi Pengawas & Pintu:
                      </label>
                      <select
                        value={denahProctorPos}
                        onChange={(e) => setDenahProctorPos(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="bottom_left">Pengawas Kiri & Pintu Kanan (Sesuai Gambar)</option>
                        <option value="bottom_right">Pengawas Kanan & Pintu Kiri</option>
                        <option value="top">Pengawas di Depan Atas</option>
                      </select>
                    </div>

                    {/* Paper Size for Print */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Ukuran Kertas Cetak:
                      </label>
                      <select
                        value={denahPaperSize}
                        onChange={(e) => setDenahPaperSize(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="A4">A4 (210 x 297 mm)</option>
                        <option value="F4">F4 / Folio (215 x 330 mm)</option>
                      </select>
                    </div>

                    {/* Orientation for Print */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Orientasi Lembar Cetak:
                      </label>
                      <select
                        value={denahOrientation}
                        onChange={(e) => setDenahOrientation(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="portrait">Tegak (Portrait)</option>
                        <option value="landscape">Melebar (Landscape)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Floor Plan Canvas (Interactive Denah Ruang) */}
              {currentDenahRoom ? (() => {
                const { deskType, doubleGrid, singleGrid, rows, cols, capacity, studentsInRoom } = getRoomSeatsGrid(
                  currentDenahRoom,
                  denahCols,
                  denahPattern,
                  denahDeskType,
                  denahRows
                );
                const countL = studentsInRoom.filter(s => s.gender === 'L').length;
                const countP = studentsInRoom.filter(s => s.gender === 'P').length;
                const classesPresent = Array.from(new Set(studentsInRoom.map(s => s.className))).sort();

                // Palette colors for classes to visually distinguish cross-grades
                const classColors: Record<string, string> = {
                  'VII A': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                  'VII B': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
                  'VIII A': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                  'VIII B': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                  'IX A': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                  'IX B': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
                  'X': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                  'XI': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  'XII': 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                };

                return (
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-6">
                    {/* Room Header Info Bar */}
                    <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                            RUANG {String(currentDenahRoom.roomNumber).padStart(2, '0')}
                          </span>
                          <h3 className="text-base font-black text-white">{currentDenahRoom.roomName}</h3>
                          <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {deskType === 'double' ? `${cols} Lajur Meja Ganda (${cols * rows} Meja)` : `${cols} Kolom Tunggal`}
                          </span>
                          {classesPresent.length > 1 && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Anti-Contek Aktif</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Lokasi: <strong className="text-slate-200">{currentDenahRoom.buildingOrLocation || 'Gedung Utama'}</strong> • 
                          Kapasitas: <strong className="text-emerald-400">{capacity} Kursi</strong> • 
                          Pola: <strong className="text-amber-300">{denahPattern === 'standard_kemendikbud' ? 'Standar Ujian Resmi (Sesuai Gambar)' : denahPattern}</strong>
                        </p>
                      </div>

                      {/* Quick Meta Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                          <span className="text-slate-400">Total Peserta: </span>
                          <span className="font-black text-white">{studentsInRoom.length} Siswa</span>
                          <span className="text-slate-500 text-[10px] ml-1.5">(L: {countL} | P: {countP})</span>
                        </div>

                        <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs flex items-center space-x-1.5">
                          <span className="text-slate-400">Rombel: </span>
                          <div className="flex items-center gap-1">
                            {classesPresent.map(c => (
                              <span key={c} className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${classColors[c] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handlePrintDenahRuang(currentDenahRoom.id)}
                          className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Denah</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Denah Layout Stage */}
                    <div className="bg-slate-950 rounded-2xl border-2 border-emerald-600/40 p-4 sm:p-6 relative overflow-hidden shadow-inner space-y-6">
                      
                      {/* Top Front Area (Papan Tulis & Pengawas bila di atas) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          {/* Door Entrance Badge (if proctor top) */}
                          <div className="bg-amber-950/40 border-2 border-amber-500/60 text-amber-300 text-xs font-black px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-sm">
                            <span className="text-sm">🚪</span>
                            <span>PINTU MASUK DEPAN</span>
                          </div>

                          {/* Whiteboard / Projector Screen */}
                          <div className="flex-1 min-w-[240px] bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-2 border-emerald-500/80 text-emerald-100 text-center py-2 px-4 rounded-xl shadow-md">
                            <span className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                              <span>📋</span>
                              <span>PAPAN TULIS & AREA DEPAN RUANG {String(currentDenahRoom.roomNumber).padStart(2, '0')}</span>
                            </span>
                          </div>

                          {/* Windows Badge */}
                          <div className="bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl hidden sm:flex items-center space-x-1.5">
                            <span>🪟</span>
                            <span>VENTILASI / JENDELA</span>
                          </div>
                        </div>

                        {denahProctorPos === 'top' && (
                          <div className="flex justify-center">
                            <div className="bg-slate-900/90 border border-slate-700 rounded-xl px-5 py-2 flex items-center space-x-4 shadow-sm">
                              <div className="flex items-center space-x-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-xs font-black text-slate-200">MEJA PENGAWAS RUANG</span>
                              </div>
                              <span className="text-slate-600">|</span>
                              <div className="text-[11px] text-slate-400">
                                Pengawas 1 & Pengawas 2
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Seating Grid (Meja Peserta) */}
                      <div className="overflow-x-auto pb-2">
                        {deskType === 'double' ? (
                          /* ======================================================= */
                          /* DOUBLE DESK GRID (Meja Berpasangan - Sesuai Gambar)     */
                          /* ======================================================= */
                          <div
                            className="grid gap-4 min-w-[700px]"
                            style={{
                              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                            }}
                          >
                            {doubleGrid.flatMap((row, rIdx) => 
                              row.map((desk, cIdx) => {
                                const renderSeatHalf = (seat: any, side: 'L' | 'R') => {
                                  const st = seat.student;
                                  const pl = seat.placement;

                                  if (st) {
                                    return (
                                      <div className="flex-1 bg-slate-900 p-2.5 rounded-lg border border-slate-700/80 flex flex-col justify-between group hover:border-emerald-500 transition-all min-h-[92px]">
                                        <div>
                                          <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-800">
                                            <span className="bg-emerald-500/20 text-emerald-300 font-mono font-black text-[10px] px-1.5 py-0.2 rounded border border-emerald-500/30">
                                              K.{String(seat.seatNumber).padStart(2, '0')}
                                            </span>
                                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${classColors[st.className] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                              {st.className}
                                            </span>
                                          </div>
                                          <h4 className="text-[11px] font-black text-white line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors">
                                            {st.name}
                                          </h4>
                                        </div>

                                        <div className="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                                          <span className="font-mono text-slate-300 truncate max-w-[85px]">
                                            {pl?.examNumber || `${st.nis || '01'}`}
                                          </span>
                                          <span className={`font-bold px-1 rounded ${st.gender === 'P' ? 'text-pink-400 bg-pink-950/40' : 'text-cyan-400 bg-cyan-950/40'}`}>
                                            {st.gender === 'P' ? 'P' : 'L'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  } else if (seat.seatNumber <= capacity) {
                                    return (
                                      <div className="flex-1 bg-slate-950/50 p-2 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-center text-slate-500 min-h-[92px]">
                                        <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1 rounded mb-1">
                                          K.{String(seat.seatNumber).padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-500">Kosong</span>
                                      </div>
                                    );
                                  } else {
                                    return <div className="flex-1 invisible"></div>;
                                  }
                                };

                                const totalRoomDesks = Math.ceil(capacity / 2);
                                if (desk.deskNumber > totalRoomDesks) {
                                  return (
                                    <div
                                      key={`double-desk-${rIdx}-${cIdx}`}
                                      className="bg-slate-950/40 border border-dashed border-slate-800/60 rounded-xl p-2 flex flex-col items-center justify-center text-center opacity-40 min-h-[110px]"
                                    >
                                      <span className="text-[10px] font-mono text-slate-500">MEJA CADANGAN</span>
                                      <span className="text-[9px] text-slate-600">Kosong</span>
                                    </div>
                                  );
                                }

                                const lSt = desk.leftSeat.student;
                                const rSt = desk.rightSeat.student;
                                const isDiffGrade = lSt && rSt && parseGradeInfo(lSt.className).key !== parseGradeInfo(rSt.className).key;
                                const isDiffClass = lSt && rSt && !isDiffGrade && lSt.className !== rSt.className;

                                return (
                                  <div
                                    key={`double-desk-${rIdx}-${cIdx}`}
                                    className="bg-slate-950/90 border-2 border-slate-700 hover:border-emerald-500/80 rounded-xl p-2 shadow-md transition-all space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-emerald-400">MEJA {String(desk.deskNumber).padStart(2, '0')}</span>
                                        {isDiffGrade && (
                                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8.5px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                            <span>🛡️</span>
                                            <span>Silang Tingkat</span>
                                          </span>
                                        )}
                                        {isDiffClass && (
                                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[8.5px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                            <span>🔀</span>
                                            <span>Silang Kelas</span>
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9px] text-slate-500 font-mono">
                                        Kursi {desk.leftSeat.seatNumber} & {desk.rightSeat.seatNumber}
                                      </span>
                                    </div>

                                    <div className="flex items-stretch gap-1.5">
                                      {renderSeatHalf(desk.leftSeat, 'L')}
                                      <div className="w-[1px] bg-slate-800 self-stretch"></div>
                                      {renderSeatHalf(desk.rightSeat, 'R')}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ) : (
                          /* ======================================================= */
                          /* SINGLE DESK GRID (Meja Tunggal)                         */
                          /* ======================================================= */
                          <div
                            className="grid gap-3 sm:gap-4 min-w-[640px]"
                            style={{
                              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                            }}
                          >
                            {singleGrid.flatMap((row, rIdx) => 
                              row.map((cell, cIdx) => {
                                if (!cell.isFilled && cell.seatNumber > capacity) {
                                  return <div key={`empty-${rIdx}-${cIdx}`} className="invisible h-24"></div>;
                                }

                                if (cell.student) {
                                  const st = cell.student;
                                  const pl = cell.placement;

                                  return (
                                    <div
                                      key={st.id}
                                      className="bg-slate-900/95 border-2 border-slate-700 hover:border-emerald-500 rounded-xl p-3 shadow-md hover:shadow-emerald-500/10 transition-all flex flex-col justify-between group min-h-[110px]"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-slate-800 pb-1.5">
                                          <span className="bg-emerald-500/20 text-emerald-300 font-mono font-black text-[11px] px-2 py-0.5 rounded border border-emerald-500/30">
                                            MEJA {String(cell.seatNumber).padStart(2, '0')}
                                          </span>
                                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${classColors[st.className] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                            {st.className}
                                          </span>
                                        </div>

                                        <h4 className="text-xs font-black text-white line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors">
                                          {st.name}
                                        </h4>
                                      </div>

                                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                                        <span className="font-mono font-semibold text-slate-300 truncate max-w-[110px]">
                                          {pl?.examNumber || `${st.nis || '01'}`}
                                        </span>
                                        <span className={`font-bold px-1 rounded ${st.gender === 'P' ? 'text-pink-400 bg-pink-950/40' : 'text-cyan-400 bg-cyan-950/40'}`}>
                                          {st.gender === 'P' ? 'P' : 'L'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div
                                      key={`vacant-${rIdx}-${cIdx}`}
                                      className="bg-slate-950/60 border-2 border-dashed border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center text-slate-600 min-h-[110px]"
                                    >
                                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded mb-1">
                                        MEJA {String(cell.seatNumber).padStart(2, '0')}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500">MEJA CADANGAN</span>
                                      <span className="text-[9px] text-slate-600">Kosong</span>
                                    </div>
                                  );
                                }
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Front / Back Controls (Pengawas & Pintu Sesuai Posisi Gambar) */}
                      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        {denahProctorPos === 'bottom_left' ? (
                          <>
                            <div className="border-2 border-slate-200 bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-lg tracking-widest uppercase flex items-center space-x-2 shadow-md">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>PENGAWAS</span>
                            </div>
                            <div className="text-slate-300 text-xs font-bold font-mono tracking-wider flex items-center space-x-1.5">
                              <span>Pintu .....................................</span>
                              <span>🚪</span>
                            </div>
                          </>
                        ) : denahProctorPos === 'bottom_right' ? (
                          <>
                            <div className="text-slate-300 text-xs font-bold font-mono tracking-wider flex items-center space-x-1.5">
                              <span>🚪</span>
                              <span>Pintu .....................................</span>
                            </div>
                            <div className="border-2 border-slate-200 bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-lg tracking-widest uppercase flex items-center space-x-2 shadow-md">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>PENGAWAS</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full flex justify-center">
                            <div className="bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-bold px-4 py-1.5 rounded-xl flex items-center space-x-2">
                              <span>🚪</span>
                              <span>PINTU KELUAR / AREA BELAKANG RUANGAN</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Room Denah Quick Actions Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-400">
                        Denah ini dapat dicetak dengan format <strong>{denahTemplate === 'exact_image_official' ? 'Bingkai Resmi Ujian (Sesuai Gambar)' : 'Kop Surat & TTD'}</strong> untuk ditempel di pintu masuk & meja pengawas ruang.
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintDenahRuang(currentDenahRoom.id)}
                          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md cursor-pointer transition-all"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Cetak Denah Ruang {String(currentDenahRoom.roomNumber).padStart(2, '0')}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAdminDoc('daftar_hadir');
                            setAdminDocRoomId(currentDenahRoom.id);
                            setActiveTab('administrasi');
                          }}
                          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 cursor-pointer transition-all"
                        >
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span>Daftar Hadir Ruang Ini</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-slate-900/90 rounded-2xl p-8 text-center text-slate-400 border border-slate-800">
                  <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="font-bold">Belum ada ruang ujian yang tersedia.</p>
                  <p className="text-xs text-slate-500 mt-1">Gunakan tombol "Auto-Bagi Ruang" di atas untuk membuat pembagian ruang dan denah otomatis.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 2: DAFTAR KARTU RINGKASAN RUANG (CARDS GRID) */}
          {/* ========================================================================= */}
          {roomViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeRooms.map(room => {
                const studentsInRoom = room.assignedStudentIds.map(id => studentMap[id]).filter(Boolean);
                return (
                  <div key={room.id} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs border border-emerald-500/30">
                            {String(room.roomNumber).padStart(2, '0')}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">{room.roomName}</h3>
                            <p className="text-[11px] text-slate-400">{room.buildingOrLocation || 'Gedung Utama'}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md border border-slate-700">
                          {studentsInRoom.length} / {room.capacity} Siswa
                        </span>
                      </div>

                      {/* Student List in Room */}
                      <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {studentsInRoom.map((st, idx) => {
                          const seatNum = room.studentSeatNumbers?.[st.id] || (idx + 1);
                          return (
                            <div key={st.id} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg text-xs hover:bg-slate-800/80">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 text-center font-mono font-bold text-slate-400 text-[10px]">
                                  {String(seatNum).padStart(2, '0')}
                                </span>
                                <span className="font-semibold text-slate-200 truncate max-w-[140px]">{st.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {st.className}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Room Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setSelectedDenahRoomId(room.id);
                          setRoomViewMode('denah');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Denah Ruang</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintDenahRuang(room.id)}
                          className="text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Cetak Denah Ruang Ini"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAdminDoc('daftar_hadir');
                            setAdminDocRoomId(room.id);
                            setActiveTab('administrasi');
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <span>Presensi</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: JADWAL UJIAN & DISTRIBUSI PENGAWAS */}
      {/* ========================================================================= */}
      {activeTab === 'jadwal' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Matriks Jadwal Pelaksanaan Asesmen & Tugas Pengawas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Penyusunan jadwal mata pelajaran per hari, alokasi waktu sesi, dan dewan guru pengawas ruang.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setIsScheduleModalOpen(true);
                }}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Mapel</span>
              </button>

              <button
                onClick={() => {
                  setSelectedAdminDoc('daftar_pengawas');
                  setActiveTab('administrasi');
                }}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Cetak Jadwal Pengawas</span>
              </button>
            </div>
          </div>

          {/* Schedules Table */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Hari & Tanggal</th>
                    <th className="p-3">Sesi & Waktu</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3">Tingkat Kelas</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeSchedules.map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">
                        {sch.dayName}, {sch.dateFormatted}
                      </td>
                      <td className="p-3">
                        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-bold">
                          Sesi {sch.sessionNumber} ({sch.timeSlot})
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-200">
                        {sch.subjectName}
                        {sch.subjectCode && (
                          <span className="ml-1.5 text-[10px] text-slate-400 font-mono">[{sch.subjectCode}]</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {sch.targetGrades.join(', ')}
                      </td>
                      <td className="p-3 text-slate-400">
                        {sch.durationMinutes || 90} Menit
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Hapus jadwal mata pelajaran ini?')) {
                              const updated = examSchedules.filter(s => s.id !== sch.id);
                              handleUpdateExamSchedules(updated);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 font-bold p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADMINISTRASI & BERKAS KEDINASAN */}
      {/* ========================================================================= */}
      {activeTab === 'administrasi' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md">
            <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Generator Berkas Administrasi Kedinasan Ujian</span>
            </h2>

            {/* Document Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { id: 'daftar_hadir', label: '1. Daftar Hadir Peserta' },
                { id: 'berita_acara', label: '2. Berita Acara Ujian' },
                { id: 'daftar_pengawas', label: '3. Presensi Pengawas' },
                { id: 'tata_tertib', label: '4. Tata Tertib Ruang' },
                { id: 'label_amplop', label: '5. Label Amplop Soal' },
                { id: 'dnt', label: '6. Nominasi Tetap (DNT)' },
                { id: 'sk_panitia', label: '7. SK Panitia Ujian' }
              ].map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedAdminDoc(doc.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer border ${
                    selectedAdminDoc === doc.id
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>

            {/* Filter Options for Doc */}
            <div className="mt-5 p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Ruang:</label>
                  <select
                    value={adminDocRoomId}
                    onChange={(e) => setAdminDocRoomId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 mt-0.5 text-white cursor-pointer"
                  >
                    <option value="ALL">Semua Ruang</option>
                    {activeRooms.map(r => (
                      <option key={r.id} value={r.id}>Ruang {String(r.roomNumber).padStart(2, '0')} ({r.roomName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Mapel / Sesi:</label>
                  <select
                    value={adminDocScheduleId}
                    onChange={(e) => setAdminDocScheduleId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 mt-0.5 text-white cursor-pointer"
                  >
                    <option value="ALL">Semua Mata Pelajaran</option>
                    {activeSchedules.map(s => (
                      <option key={s.id} value={s.id}>{s.dayName} • {s.subjectName} ({s.timeSlot})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ukuran Kertas:</label>
                  <select
                    value={adminDocPaperSize}
                    onChange={(e) => setAdminDocPaperSize(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 mt-0.5 text-white cursor-pointer"
                  >
                    <option value="A4">A4 (210 x 297 mm)</option>
                    <option value="F4">F4 / Folio (215 x 330 mm)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handlePrintAdminDocument}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Resmi (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CETAK KARTU PESERTA UJIAN */}
      {/* ========================================================================= */}
      {activeTab === 'kartu' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-purple-400" />
                  <span>Pembuat & Cetak Kartu Peserta Asesmen Resmi</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mendukung layout otomatis 4 Kartu per Lembar A4 (Grid 2x2), 8 Kartu per Lembar F4, dengan Barcode validasi & stempel verifikasi.
                </p>
              </div>

              <button
                onClick={handlePrintCards}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Seluruh Kartu ({printableStudents.length} Siswa)</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="mt-5 p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Kelas:</label>
                <select
                  value={cardClassFilter}
                  onChange={(e) => setCardClassFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 mt-0.5 text-white cursor-pointer"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Ruang Ujian:</label>
                <select
                  value={cardRoomFilter}
                  onChange={(e) => setCardRoomFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 mt-0.5 text-white cursor-pointer"
                >
                  <option value="ALL">Semua Ruang</option>
                  {activeRooms.map(r => (
                    <option key={r.id} value={r.id}>Ruang {String(r.roomNumber).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Layout Lembar Cetak:</label>
                <select
                  value={cardPaperLayout}
                  onChange={(e) => setCardPaperLayout(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 mt-0.5 text-white cursor-pointer"
                >
                  <option value="grid_2x2">4 Kartu / Lembar A4 (Grid 2x2)</option>
                  <option value="grid_2x4">8 Kartu / Lembar F4 (Grid 2x4)</option>
                  <option value="single">1 Kartu / Halaman</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cari Siswa / NIS:</label>
                <div className="relative mt-0.5">
                  <input
                    type="text"
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    placeholder="Nama / NIS..."
                    className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg pl-8 pr-2.5 py-1.5 text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="chkStamp"
                  checked={showPaymentStatusStamp}
                  onChange={(e) => setShowPaymentStatusStamp(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="chkStamp" className="text-xs text-slate-300 font-bold cursor-pointer">
                  Tampilkan Stempel Terverifikasi
                </label>
              </div>
            </div>
          </div>

          {/* Live Card Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printableStudents.slice(0, 6).map((st) => {
              const placement = studentExamPlacement[st.id] || {
                roomNumber: 1,
                roomName: 'Ruang 01',
                seatNumber: 1,
                examNumber: `01-001-${st.nis || '01'}`
              };

              return (
                <div key={st.id} className="bg-white text-slate-900 rounded-xl p-4 shadow-lg border-2 border-slate-800 flex flex-col justify-between text-xs">
                  <div>
                    {/* Card Header */}
                    <div className="border-b-2 border-slate-900 pb-2 text-center">
                      <div className="font-black text-[10px] text-emerald-800">{schoolConfig.fullName.toUpperCase()}</div>
                      <div className="font-bold text-[9px] text-slate-600">KARTU PESERTA {activeExam?.type} TP {activeExam?.academicYear}</div>
                    </div>

                    {/* Card Content */}
                    <div className="mt-3 flex justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div>
                          <span className="text-[10px] text-slate-500">Nama Peserta:</span>
                          <div className="font-black text-slate-900 text-xs">{st.name.toUpperCase()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500">NIS:</span>
                            <div className="font-bold text-slate-800">{st.nis || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Kelas:</span>
                            <div className="font-bold text-slate-800">{st.className}</div>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="bg-slate-900 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                            {placement.examNumber}
                          </span>
                        </div>
                      </div>

                      {/* Photo placeholder */}
                      <div className="w-16 h-20 border border-dashed border-slate-400 bg-slate-50 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold text-center">
                        FOTO<br/>2x3
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-100 p-2 rounded text-[10px] font-semibold text-slate-700 flex justify-between">
                      <span>Ruang: <strong>{String(placement.roomNumber).padStart(2, '0')}</strong></span>
                      <span>Meja: <strong>{String(placement.seatNumber).padStart(2, '0')}</strong></span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
                    <span>Validasi Resmi</span>
                    <span className="font-bold text-emerald-800">Panitia Asesmen</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: STANDAR KKTP / KKM */}
      {/* ========================================================================= */}
      {activeTab === 'kktp' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md">
            <h2 className="text-base font-black text-white flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-rose-400" />
              <span>Kriteria Ketercapaian Tujuan Pembelajaran (KKTP / KKM)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Konfigurasi standar nilai batas tuntas mata pelajaran untuk evaluasi hasil asesmen sumatif.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map(sub => {
                const currentKktp = curriculumSettings.kktpStandard?.[sub.id] || 75;
                return (
                  <div key={sub.id} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950 px-1.5 py-0.5 rounded">
                        {sub.code}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">{sub.name}</h4>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-slate-400">KKTP:</span>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={currentKktp}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = {
                            ...curriculumSettings,
                            kktpStandard: {
                              ...(curriculumSettings.kktpStandard || {}),
                              [sub.id]: val
                            }
                          };
                          handleUpdateCurriculumSettings(updated);
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 text-emerald-400 font-black text-center text-xs rounded-lg py-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT / EDIT AGENDA UJIAN */}
      {/* ========================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-400" />
                <span>{editingEvent ? 'Edit Agenda Kegiatan Ujian' : 'Buat Kegiatan Ujian Baru'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsEventModalOpen(false);
                  setEditingEvent(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Judul Kegiatan Ujian:</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingEvent?.title || 'Sumatif Tengah Semester (STS) Ganjil TP 2026/2027'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Jenis Asesmen:</label>
                  <select
                    name="type"
                    defaultValue={editingEvent?.type || 'STS'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                  >
                    <option value="STS">STS (Sumatif Tengah Semester)</option>
                    <option value="SAS">SAS (Sumatif Akhir Semester)</option>
                    <option value="AM">AM (Asesmen Madrasah)</option>
                    <option value="PTS">PTS (Penilaian Tengah Semester)</option>
                    <option value="PAT">PAT (Penilaian Akhir Tahun)</option>
                    <option value="US">US (Ujian Sekolah)</option>
                    <option value="SIMULASI">Simulasi / Try Out</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Status Pelaksanaan:</label>
                  <select
                    name="status"
                    defaultValue={editingEvent?.status || 'Persiapan'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                  >
                    <option value="Persiapan">Persiapan</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Draf">Draf</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Tanggal Mulai:</label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={editingEvent?.startDate || '2026-09-21'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Tanggal Selesai:</label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editingEvent?.endDate || '2026-09-26'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Ketua Panitia:</label>
                  <input
                    type="text"
                    name="ketuaPanitia"
                    defaultValue={editingEvent?.ketuaPanitia || schoolOfficials.kurikulum.name || 'Niarsih, S.Pd.I'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Sekretaris Panitia:</label>
                  <input
                    type="text"
                    name="sekretaris"
                    defaultValue={editingEvent?.sekretaris || 'Lia Marlianty, S.Pd.I'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Bendahara Panitia:</label>
                  <input
                    type="text"
                    name="bendaharaPanitia"
                    defaultValue={editingEvent?.bendaharaPanitia || schoolOfficials.bendahara.name || 'Dewi Sutrawati, SE'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Nomor SK Panitia:</label>
                  <input
                    type="text"
                    name="nomorSKPanitia"
                    defaultValue={editingEvent?.nomorSKPanitia || `421.2/089/${schoolConfig.shortName}/SK-STS/IX/2026`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Class targets checkboxes */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Kelas Sasaran Peserta:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {classesList.map(c => (
                    <label key={c} className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        name="targetClasses"
                        value={c}
                        defaultChecked={editingEvent ? editingEvent.targetClasses.includes(c) : true}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-black shadow-md"
                >
                  Simpan Agenda Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTO DISTRIBUTE RUANG ANTI-CONTEK */}
      {/* ========================================================================= */}
      {isAutoDistributeModalOpen && (() => {
        // Calculate candidate stats for modal preview
        const candidateStudents = students.filter(s => 
          !activeExam || activeExam.targetClasses.length === 0 || activeExam.targetClasses.includes(s.className)
        );
        const capacity = Math.max(5, autoCapacity || 20);
        const estRooms = Math.ceil(candidateStudents.length / capacity);

        // Grade breakdown
        const gradeCounts: Record<string, { label: string; count: number }> = {};
        candidateStudents.forEach(s => {
          const gInfo = parseGradeInfo(s.className);
          if (!gradeCounts[gInfo.key]) {
            gradeCounts[gInfo.key] = { label: gInfo.label, count: 0 };
          }
          gradeCounts[gInfo.key].count++;
        });
        const gradeList = Object.values(gradeCounts);

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      <span>Auto-Bagi Ruang Anti-Contek</span>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Smart AI
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Penataan otomatis agar siswa satu tingkat/kelas tidak bersebelahan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAutoDistributeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Live Student & Grade Composition Preview */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Komposisi Peserta Ujian:</span>
                  </span>
                  <span className="text-emerald-400 font-black">
                    Total {candidateStudents.length} Siswa
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {gradeList.map((g, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-900 border border-slate-700/80 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center space-x-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{g.label}:</span>
                      <strong className="text-emerald-300 font-black">{g.count} Siswa</strong>
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Estimasi Pembagian Ruangan:</span>
                  <span className="font-black text-slate-200">
                    {estRooms} Ruangan Ujian (@ {capacity} Kursi/Ruang)
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pilih Skema Penataan Meja & Anti-Contek:</span>
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: Cross Grade Anti-Cheat */}
                  <label className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    autoDistributeMode === 'cross_grade_anti_cheat'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-950 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="distMode"
                      checked={autoDistributeMode === 'cross_grade_anti_cheat'}
                      onChange={() => setAutoDistributeMode('cross_grade_anti_cheat')}
                      className="mt-1 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-100 text-xs">
                          🛡️ Silang Tingkat Anti-Contek (Rekomendasi Utama)
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                          Bebas Nyontek
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Siswa satu tingkat/kelas dipisahkan dan <strong>TIDAK bersebelahan</strong>. Meja ganda diisi silang (Kursi Kiri: Tingkat VII, Kursi Kanan: Tingkat VIII/IX). Teman sebangku beda soal sehingga 100% tidak bisa mencontek.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Checkerboard Matrix */}
                  <label className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    autoDistributeMode === 'checkerboard'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-950 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="distMode"
                      checked={autoDistributeMode === 'checkerboard'}
                      onChange={() => setAutoDistributeMode('checkerboard')}
                      className="mt-1 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-100 text-xs">
                          🏁 Pola Papan Catur Silang (Checkerboard Matrix)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Selang-seling vertikal dan horizontal (Depan, Belakang, Kiri, dan Kanan diatur bersilangan tingkat kelas secara bergantian).
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Cross Class */}
                  <label className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    autoDistributeMode === 'cross_class_anti_cheat'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-950 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="distMode"
                      checked={autoDistributeMode === 'cross_class_anti_cheat'}
                      onChange={() => setAutoDistributeMode('cross_class_anti_cheat')}
                      className="mt-1 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-100 text-xs">
                          🔀 Silang Antar-Rombel (Untuk Ujian 1 Tingkatan Saja)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Untuk ujian khusus 1 tingkatan (misal hanya Kelas 9). Menyilang peserta dari rombel berbeda (IX-A & IX-B) agar teman sebangku bukan teman sekelasnya.
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Classic per Class */}
                  <label className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    autoDistributeMode === 'per_class'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-950 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="distMode"
                      checked={autoDistributeMode === 'per_class'}
                      onChange={() => setAutoDistributeMode('per_class')}
                      className="mt-1 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 text-xs">
                        📋 Mode Berurutan per Kelas (Standar Klasik)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Siswa kelas yang sama ditempatkan berurutan di ruang yang sama tanpa silang tingkat.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Seating Numbering Pattern & Capacity Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Pola Penomoran Kursi Denah:
                  </label>
                  <select
                    value={autoDistributeDeskFormat}
                    onChange={(e) => setAutoDistributeDeskFormat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kemendikbud_pair">Format Dinas: Kursi 1..10 (Kiri) & 11..20 (Kanan)</option>
                    <option value="serpentine_pair">Format Ganjil-Genap: Ganjil (Kiri) & Genap (Kanan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Kapasitas Maksimal per Ruang (Kursi):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={autoCapacity}
                    onChange={(e) => setAutoCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-black text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Guarantee Notice */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-start space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  <strong>Jaminan Anti-Contek:</strong> Algoritma akan menempatkan teman sebangku dari tingkat/kelas yang berlainan pada setiap meja ganda. Denah visual dan kartu ujian akan otomatis tersinkronisasi.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAutoDistributeModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAutoDistribute}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Jalankan Auto-Bagi Anti-Contek</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH JADWAL MAPEL */}
      {/* ========================================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Tambah Jadwal Mata Pelajaran</span>
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const subId = fd.get('subjectId') as string;
                const sub = subjects.find(s => s.id === subId);
                const newSched: ExamScheduleItem = {
                  id: `sched-${Date.now()}`,
                  examId: activeExam?.id || 'exam-sts-ganjil-2026',
                  dayName: (fd.get('dayName') as string) || 'Senin',
                  dateFormatted: (fd.get('dateFormatted') as string) || '21 September 2026',
                  date: (fd.get('date') as string) || '2026-09-21',
                  sessionNumber: Number(fd.get('sessionNumber')) || 1,
                  timeSlot: (fd.get('timeSlot') as string) || '07.30 - 09.00 WIB',
                  subjectId: subId,
                  subjectName: sub?.name || 'Mata Pelajaran',
                  subjectCode: sub?.code || 'MAPEL',
                  targetGrades: ['VII', 'VIII', 'IX'],
                  durationMinutes: 90,
                  schoolId: activeSchoolId
                };

                const updated = [...examSchedules, newSched];
                handleUpdateExamSchedules(updated);
                setIsScheduleModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Mata Pelajaran:</label>
                <select name="subjectId" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold">
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Hari:</label>
                  <select name="dayName" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white">
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Tanggal (Teks):</label>
                  <input type="text" name="dateFormatted" defaultValue="21 September 2026" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Sesi Ke-:</label>
                  <input type="number" name="sessionNumber" min="1" max="5" defaultValue={1} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Jam / Waktu:</label>
                  <input type="text" name="timeSlot" defaultValue="07.30 - 09.00 WIB" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold">
                  Batal
                </button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-lg font-black shadow-md">
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

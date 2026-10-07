import { ExamEvent, ExamRoom, ExamScheduleItem, CurriculumSettings, SchoolId } from '../types';
import { INITIAL_STUDENTS } from './initialData';

export const DEFAULT_CURRICULUM_SETTINGS: CurriculumSettings = {
  curriculumType: 'Kurikulum Merdeka',
  wakaKurikulumName: 'Niarsih, S.Pd.I',
  wakaKurikulumNip: '85781',
  curriculumCode: 'kurikulum',
  defaultRoomCapacity: 20,
  kktpStandard: {
    'sub-mtk': 75,
    'sub-ipa': 75,
    'sub-bind': 78,
    'sub-eng': 75,
    'sub-aqh': 78,
    'sub-fiqih': 78,
    'sub-aqidah': 78,
    'sub-ski': 78,
    'sub-ppkn': 76,
    'sub-ips': 75,
    'sub-barab': 75,
    'sub-bsund': 75,
    'sub-prky': 76,
    'sub-penjas': 78,
    'sub-sbk': 76
  },
  lastUpdated: new Date().toISOString()
};

export const INITIAL_EXAM_EVENTS: ExamEvent[] = [
  {
    id: 'exam-sts-ganjil-2026',
    title: 'Sumatif Tengah Semester (STS) Ganjil TP 2026/2027',
    type: 'STS',
    academicYear: '2026/2027',
    semester: 'Semester Ganjil',
    startDate: '2026-09-21',
    endDate: '2026-09-26',
    targetClasses: ['VII A', 'VII B', 'VII C', 'VII D', 'VIII A', 'VIII B', 'VIII C', 'IX A', 'IX B', 'IX C'],
    status: 'Persiapan',
    penanggungJawab: 'Dra. Hj. Nurjanah, M.Pd.I',
    ketuaPanitia: 'Niarsih, S.Pd.I',
    sekretaris: 'Lia Marlianty, S.Pd.I',
    bendaharaPanitia: 'Dewi Sutrawati, SE',
    seksiNaskah: 'Akhmad Taufik',
    seksiRuang: 'Sugiyono, S.Pd',
    seksiKonsumsi: 'Listijawati, SE',
    nomorSKPanitia: '421.2/089/MTs-MI/SK-STS/IX/2026',
    tanggalSK: '2026-09-01',
    biayaUjianDefault: 75000,
    catatan: 'Pelaksanaan STS Ganjil dilaksanakan berbasis Paper-Based & Android CBT terpadu.',
    schoolId: 'mts_manbaul_islam',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'exam-sas-ganjil-2026',
    title: 'Sumatif Akhir Semester (SAS) Ganjil TP 2026/2027',
    type: 'SAS',
    academicYear: '2026/2027',
    semester: 'Semester Ganjil',
    startDate: '2026-12-01',
    endDate: '2026-12-08',
    targetClasses: ['VII A', 'VII B', 'VII C', 'VII D', 'VIII A', 'VIII B', 'VIII C', 'IX A', 'IX B', 'IX C'],
    status: 'Draf',
    penanggungJawab: 'Dra. Hj. Nurjanah, M.Pd.I',
    ketuaPanitia: 'Niarsih, S.Pd.I',
    sekretaris: 'Saodah, S.Pd',
    bendaharaPanitia: 'Dewi Sutrawati, SE',
    seksiNaskah: 'Akhmad Taufik',
    seksiRuang: 'Sugiyono, S.Pd',
    seksiKonsumsi: 'Maryani, S.Pd.I',
    nomorSKPanitia: '421.2/112/MTs-MI/SK-SAS/XI/2026',
    tanggalSK: '2026-11-15',
    biayaUjianDefault: 85000,
    catatan: 'Asesmen Sumatif Akhir Semester Ganjil penentu nilai rapor semester ganjil.',
    schoolId: 'mts_manbaul_islam',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  }
];

export const INITIAL_EXAM_ROOMS: ExamRoom[] = [
  {
    id: 'room-sts-01',
    examId: 'exam-sts-ganjil-2026',
    roomNumber: 1,
    roomName: 'Ruang 01 (Kelas VII A)',
    buildingOrLocation: 'Lantai 1 - Gedung Utama',
    capacity: 20,
    assignedStudentIds: INITIAL_STUDENTS.slice(0, 20).map(s => s.id),
    studentSeatNumbers: INITIAL_STUDENTS.slice(0, 20).reduce((acc, s, idx) => ({ ...acc, [s.id]: idx + 1 }), {}),
    proctorAssignments: [
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 1 (07.30 - 09.00 WIB)', subjectName: 'Bahasa Indonesia', teacherId: 't-85780', teacherName: 'M. Sholihin, SE' },
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 2 (09.30 - 11.00 WIB)', subjectName: "Al-Qur'an Hadits", teacherId: 't-85782', teacherName: 'Saodah, S.Pd' }
    ],
    notes: 'Kondisi ruangan baik, proyektor dan AC berfungsi.',
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'room-sts-02',
    examId: 'exam-sts-ganjil-2026',
    roomNumber: 2,
    roomName: 'Ruang 02 (Kelas VII B)',
    buildingOrLocation: 'Lantai 1 - Gedung Utama',
    capacity: 20,
    assignedStudentIds: INITIAL_STUDENTS.slice(20, 40).map(s => s.id),
    studentSeatNumbers: INITIAL_STUDENTS.slice(20, 40).reduce((acc, s, idx) => ({ ...acc, [s.id]: idx + 1 }), {}),
    proctorAssignments: [
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 1 (07.30 - 09.00 WIB)', subjectName: 'Bahasa Indonesia', teacherId: 't-85783', teacherName: 'Lia Marlianty, S.Pd.I' },
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 2 (09.30 - 11.00 WIB)', subjectName: "Al-Qur'an Hadits", teacherId: 't-85785', teacherName: 'Listijawati, SE' }
    ],
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'room-sts-03',
    examId: 'exam-sts-ganjil-2026',
    roomNumber: 3,
    roomName: 'Ruang 03 (Kelas VIII A)',
    buildingOrLocation: 'Lantai 2 - Gedung Timur',
    capacity: 20,
    assignedStudentIds: INITIAL_STUDENTS.slice(40, 60).map(s => s.id),
    studentSeatNumbers: INITIAL_STUDENTS.slice(40, 60).reduce((acc, s, idx) => ({ ...acc, [s.id]: idx + 1 }), {}),
    proctorAssignments: [
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 1 (07.30 - 09.00 WIB)', subjectName: 'Bahasa Indonesia', teacherId: 't-85788', teacherName: 'Sugiyono, S.Pd' },
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 2 (09.30 - 11.00 WIB)', subjectName: "Al-Qur'an Hadits", teacherId: 't-85789', teacherName: 'Anah, S.Pd' }
    ],
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'room-sts-04',
    examId: 'exam-sts-ganjil-2026',
    roomNumber: 4,
    roomName: 'Ruang 04 (Kelas VIII B)',
    buildingOrLocation: 'Lantai 2 - Gedung Timur',
    capacity: 20,
    assignedStudentIds: INITIAL_STUDENTS.slice(60, 80).map(s => s.id),
    studentSeatNumbers: INITIAL_STUDENTS.slice(60, 80).reduce((acc, s, idx) => ({ ...acc, [s.id]: idx + 1 }), {}),
    proctorAssignments: [
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 1 (07.30 - 09.00 WIB)', subjectName: 'Bahasa Indonesia', teacherId: 't-85790', teacherName: 'Zakiah Tohir, S.Ag' },
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 2 (09.30 - 11.00 WIB)', subjectName: "Al-Qur'an Hadits", teacherId: 't-85791', teacherName: 'Indra Sofianis, S.Ag' }
    ],
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'room-sts-05',
    examId: 'exam-sts-ganjil-2026',
    roomNumber: 5,
    roomName: 'Ruang 05 (Kelas IX A)',
    buildingOrLocation: 'Lantai 2 - Gedung Barat',
    capacity: 20,
    assignedStudentIds: INITIAL_STUDENTS.slice(80, 100).map(s => s.id),
    studentSeatNumbers: INITIAL_STUDENTS.slice(80, 100).reduce((acc, s, idx) => ({ ...acc, [s.id]: idx + 1 }), {}),
    proctorAssignments: [
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 1 (07.30 - 09.00 WIB)', subjectName: 'Bahasa Indonesia', teacherId: 't-85792', teacherName: 'Isti Septiani, S.sos' },
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 2 (09.30 - 11.00 WIB)', subjectName: "Al-Qur'an Hadits", teacherId: 't-85793', teacherName: 'Maryani, S.Pd.I' }
    ],
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'room-sts-06',
    examId: 'exam-sts-ganjil-2026',
    roomNumber: 6,
    roomName: 'Ruang 06 (Lab Komputer)',
    buildingOrLocation: 'Lantai 3 - Gedung Sayap Barat',
    capacity: 20,
    assignedStudentIds: INITIAL_STUDENTS.slice(100, 120).map(s => s.id),
    studentSeatNumbers: INITIAL_STUDENTS.slice(100, 120).reduce((acc, s, idx) => ({ ...acc, [s.id]: idx + 1 }), {}),
    proctorAssignments: [
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 1 (07.30 - 09.00 WIB)', subjectName: 'Bahasa Indonesia', teacherId: 't-85804', teacherName: 'Akhmad Taufik' },
      { dayDate: 'Senin, 21 September 2026', sessionSlot: 'Sesi 2 (09.30 - 11.00 WIB)', subjectName: "Al-Qur'an Hadits", teacherId: 't-85805', teacherName: 'Maulida, S.Pd' }
    ],
    schoolId: 'mts_manbaul_islam'
  }
];

export const INITIAL_EXAM_SCHEDULES: ExamScheduleItem[] = [
  // HARI 1: Senin, 21 September 2026
  {
    id: 'sched-sts-01',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Senin',
    dateFormatted: '21 September 2026',
    date: '2026-09-21',
    sessionNumber: 1,
    timeSlot: '07.30 - 09.00 WIB',
    subjectId: 'sub-bind',
    subjectName: 'Bahasa Indonesia',
    subjectCode: 'BIND',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'sched-sts-02',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Senin',
    dateFormatted: '21 September 2026',
    date: '2026-09-21',
    sessionNumber: 2,
    timeSlot: '09.30 - 11.00 WIB',
    subjectId: 'sub-aqh',
    subjectName: "Al-Qur'an Hadits",
    subjectCode: 'AQH',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },

  // HARI 2: Selasa, 22 September 2026
  {
    id: 'sched-sts-03',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Selasa',
    dateFormatted: '22 September 2026',
    date: '2026-09-22',
    sessionNumber: 1,
    timeSlot: '07.30 - 09.00 WIB',
    subjectId: 'sub-mtk',
    subjectName: 'Matematika',
    subjectCode: 'MTK',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'sched-sts-04',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Selasa',
    dateFormatted: '22 September 2026',
    date: '2026-09-22',
    sessionNumber: 2,
    timeSlot: '09.30 - 11.00 WIB',
    subjectId: 'sub-aqidah',
    subjectName: 'Aqidah Akhlak',
    subjectCode: 'AQIDAH',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },

  // HARI 3: Rabu, 23 September 2026
  {
    id: 'sched-sts-05',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Rabu',
    dateFormatted: '23 September 2026',
    date: '2026-09-23',
    sessionNumber: 1,
    timeSlot: '07.30 - 09.00 WIB',
    subjectId: 'sub-ipa',
    subjectName: 'Ilmu Pengetahuan Alam (IPA)',
    subjectCode: 'IPA',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'sched-sts-06',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Rabu',
    dateFormatted: '23 September 2026',
    date: '2026-09-23',
    sessionNumber: 2,
    timeSlot: '09.30 - 11.00 WIB',
    subjectId: 'sub-fiqih',
    subjectName: 'Fiqih',
    subjectCode: 'FIQIH',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },

  // HARI 4: Kamis, 24 September 2026
  {
    id: 'sched-sts-07',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Kamis',
    dateFormatted: '24 September 2026',
    date: '2026-09-24',
    sessionNumber: 1,
    timeSlot: '07.30 - 09.00 WIB',
    subjectId: 'sub-eng',
    subjectName: 'Bahasa Inggris (ENGLISH)',
    subjectCode: 'ENG',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'sched-sts-08',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Kamis',
    dateFormatted: '24 September 2026',
    date: '2026-09-24',
    sessionNumber: 2,
    timeSlot: '09.30 - 11.00 WIB',
    subjectId: 'sub-ski',
    subjectName: 'Sejarah Kebudayaan Islam (SKI)',
    subjectCode: 'SKI',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },

  // HARI 5: Jumat, 25 September 2026
  {
    id: 'sched-sts-09',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Jumat',
    dateFormatted: '25 September 2026',
    date: '2026-09-25',
    sessionNumber: 1,
    timeSlot: '07.30 - 09.00 WIB',
    subjectId: 'sub-ppkn',
    subjectName: 'Pendidikan Pancasila & Kewarganegaraan',
    subjectCode: 'PPKN',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'sched-sts-10',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Jumat',
    dateFormatted: '25 September 2026',
    date: '2026-09-25',
    sessionNumber: 2,
    timeSlot: '09.15 - 10.45 WIB',
    subjectId: 'sub-barab',
    subjectName: 'Bahasa Arab',
    subjectCode: 'BARAB',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },

  // HARI 6: Sabtu, 26 September 2026
  {
    id: 'sched-sts-11',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Sabtu',
    dateFormatted: '26 September 2026',
    date: '2026-09-26',
    sessionNumber: 1,
    timeSlot: '07.30 - 09.00 WIB',
    subjectId: 'sub-ips',
    subjectName: 'Ilmu Pengetahuan Sosial (IPS)',
    subjectCode: 'IPS',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  },
  {
    id: 'sched-sts-12',
    examId: 'exam-sts-ganjil-2026',
    dayName: 'Sabtu',
    dateFormatted: '26 September 2026',
    date: '2026-09-26',
    sessionNumber: 2,
    timeSlot: '09.30 - 11.00 WIB',
    subjectId: 'sub-bsund',
    subjectName: 'Bahasa Sunda',
    subjectCode: 'BSUND',
    targetGrades: ['VII', 'VIII', 'IX'],
    durationMinutes: 90,
    schoolId: 'mts_manbaul_islam'
  }
];


import { Student, AttendanceSession, AttendanceEntry, StudentViolation, PaymentTransaction } from '../types';
import { INITIAL_STUDENTS } from '../data/initialData';

/**
 * Normalizes student name for safe comparison:
 * - lowercase
 * - remove punctuation (., ', -, etc.)
 * - normalize whitespace
 */
export function normalizeStudentName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/['"`.,\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes class name (e.g. "IX A" vs "IXA" vs "ix-a")
 */
export function normalizeClassName(className?: string): string {
  if (!className) return '';
  return className.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
}

/**
 * Builds a dictionary mapping any known historical studentId to a Student Name and Class
 * from:
 * 1. Current students
 * 2. INITIAL_STUDENTS (official preset)
 * 3. Student Violations (which persist studentId and studentName)
 * 4. Payment Transactions (which persist studentId and studentName)
 */
export function buildHistoricalStudentDictionary(
  students: Student[],
  violations: StudentViolation[] = [],
  payments: PaymentTransaction[] = []
): {
  idToStudentInfo: Map<string, { name: string; className: string }>;
  nameClassToStudent: Map<string, Student>;
  nameOnlyToStudent: Map<string, Student>;
} {
  const idToStudentInfo = new Map<string, { name: string; className: string }>();
  const nameClassToStudent = new Map<string, Student>();
  const nameOnlyToStudent = new Map<string, Student>();

  // 1. Load from INITIAL_STUDENTS
  INITIAL_STUDENTS.forEach(s => {
    idToStudentInfo.set(s.id, { name: s.name, className: s.className });
  });

  // 2. Load from violations
  violations.forEach(v => {
    if (v.studentId && v.studentName) {
      idToStudentInfo.set(v.studentId, { name: v.studentName, className: v.className });
    }
  });

  // 3. Load from payments
  payments.forEach(p => {
    if (p.studentId && p.studentName) {
      idToStudentInfo.set(p.studentId, { name: p.studentName, className: p.className });
    }
  });

  // 4. Index current active students
  students.forEach(s => {
    idToStudentInfo.set(s.id, { name: s.name, className: s.className });

    const classKey = `${normalizeClassName(s.className)}::${normalizeStudentName(s.name)}`;
    nameClassToStudent.set(classKey, s);

    const nameKey = normalizeStudentName(s.name);
    if (!nameOnlyToStudent.has(nameKey)) {
      nameOnlyToStudent.set(nameKey, s);
    }
  });

  return { idToStudentInfo, nameClassToStudent, nameOnlyToStudent };
}

/**
 * Finds the matching current Student for a given AttendanceEntry in a session
 */
export function findStudentForEntry(
  entry: AttendanceEntry,
  session: { className: string },
  studentsInClass: Student[],
  allStudents: Student[],
  entryIndex?: number,
  dictionary?: {
    idToStudentInfo: Map<string, { name: string; className: string }>;
    nameClassToStudent: Map<string, Student>;
    nameOnlyToStudent: Map<string, Student>;
  }
): Student | undefined {
  // 1. Direct ID match in class
  const directClassMatch = studentsInClass.find(s => s.id === entry.studentId);
  if (directClassMatch) return directClassMatch;

  // 2. Direct ID match in all students
  const directAllMatch = allStudents.find(s => s.id === entry.studentId);
  if (directAllMatch) return directAllMatch;

  const sessionNormClass = normalizeClassName(session.className);

  // 3. Match via entry's embedded studentName property if present
  const embeddedName = (entry as any).studentName;
  if (embeddedName) {
    const normEmbeddedName = normalizeStudentName(embeddedName);
    const matched = studentsInClass.find(s => normalizeStudentName(s.name) === normEmbeddedName) ||
                    allStudents.find(s => normalizeStudentName(s.name) === normEmbeddedName && normalizeClassName(s.className) === sessionNormClass) ||
                    allStudents.find(s => normalizeStudentName(s.name) === normEmbeddedName);
    if (matched) return matched;
  }

  // 4. Match via dictionary (resolving old ID to historical student name)
  if (dictionary) {
    const historical = dictionary.idToStudentInfo.get(entry.studentId);
    if (historical) {
      const normHistName = normalizeStudentName(historical.name);
      const histNormClass = normalizeClassName(historical.className || session.className);

      const matched = studentsInClass.find(s => normalizeStudentName(s.name) === normHistName) ||
                      allStudents.find(s => normalizeStudentName(s.name) === normHistName && normalizeClassName(s.className) === histNormClass) ||
                      allStudents.find(s => normalizeStudentName(s.name) === normHistName);
      if (matched) return matched;
    }
  }

  // 5. Try parsing rollNo or ID patterns (e.g. stu-IXA-1 -> rollNo 1)
  if (entry.studentId) {
    const rollNoMatch = entry.studentId.match(/-(\d+)$/);
    if (rollNoMatch) {
      const parsedRoll = parseInt(rollNoMatch[1], 10);
      const matched = studentsInClass.find(s => s.rollNo === parsedRoll);
      if (matched) return matched;
    }
  }

  // 6. Fallback to positional index if valid within class students count
  if (typeof entryIndex === 'number' && entryIndex >= 0 && entryIndex < studentsInClass.length) {
    return studentsInClass[entryIndex];
  }

  return undefined;
}

/**
 * Heals and synchronizes all attendance sessions so their entries map directly to current students
 * matching primarily by Name and Class!
 */
export function healAndSyncAttendanceSessions(
  sessions: AttendanceSession[],
  students: Student[],
  violations: StudentViolation[] = [],
  payments: PaymentTransaction[] = []
): { healedSessions: AttendanceSession[]; updatedCount: number } {
  if (!sessions || sessions.length === 0 || !students || students.length === 0) {
    return { healedSessions: sessions || [], updatedCount: 0 };
  }

  const dictionary = buildHistoricalStudentDictionary(students, violations, payments);
  let totalUpdatedSessions = 0;

  const healedSessions = sessions.map(session => {
    const classStudents = students.filter(
      s => normalizeClassName(s.className) === normalizeClassName(session.className)
    );

    let sessionHasChanges = false;

    // Map existing entries with matching current students
    const updatedEntries: AttendanceEntry[] = (session.entries || []).map((entry, idx) => {
      const matchedStudent = findStudentForEntry(
        entry,
        session,
        classStudents,
        students,
        idx,
        dictionary
      );

      if (matchedStudent) {
        const needsIdUpdate = entry.studentId !== matchedStudent.id;
        const needsNameUpdate = (entry as any).studentName !== matchedStudent.name;

        if (needsIdUpdate || needsNameUpdate) {
          sessionHasChanges = true;
          return {
            ...entry,
            studentId: matchedStudent.id,
            studentName: matchedStudent.name,
            rollNo: matchedStudent.rollNo
          } as AttendanceEntry & { studentName: string; rollNo: number };
        }
      }

      return entry;
    });

    // If entries list didn't include some students from class, or has duplicate resolved IDs, keep clean list
    if (sessionHasChanges) {
      totalUpdatedSessions++;
      return {
        ...session,
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };
    }

    return session;
  });

  return { healedSessions, updatedCount: totalUpdatedSessions };
}

/**
 * Finds an AttendanceEntry in an entries array matching a target student by:
 * 1. direct studentId
 * 2. embedded studentName
 * 3. dictionary-resolved old ID matching student name
 * 4. student roll number / position
 */
export function findMatchingEntryForStudent(
  entries: AttendanceEntry[] | undefined,
  student: Student,
  dictionary?: {
    idToStudentInfo: Map<string, { name: string; className: string }>;
    nameClassToStudent: Map<string, Student>;
    nameOnlyToStudent: Map<string, Student>;
  }
): AttendanceEntry | undefined {
  if (!entries || !Array.isArray(entries) || entries.length === 0 || !student) {
    return undefined;
  }

  // 1. Direct ID match
  const direct = entries.find(e => e && e.studentId === student.id);
  if (direct) return direct;

  const targetNormName = normalizeStudentName(student.name);

  // 2. Embedded studentName match
  const nameMatch = entries.find(e => {
    const entryName = (e as any)?.studentName;
    return entryName && normalizeStudentName(entryName) === targetNormName;
  });
  if (nameMatch) return nameMatch;

  // 3. Dictionary match
  if (dictionary) {
    const dictMatch = entries.find(e => {
      if (!e?.studentId) return false;
      const hist = dictionary.idToStudentInfo.get(e.studentId);
      return hist && normalizeStudentName(hist.name) === targetNormName;
    });
    if (dictMatch) return dictMatch;
  }

  // 4. Roll number match
  if (student.rollNo) {
    const rollMatch = entries.find(e => {
      if ((e as any)?.rollNo === student.rollNo) return true;
      if (e?.studentId && e.studentId.endsWith(`-${student.rollNo}`)) return true;
      return false;
    });
    if (rollMatch) return rollMatch;
  }

  return undefined;
}

/**
 * Resolves a human-readable student name from an AttendanceEntry
 */
export function resolveStudentNameFromEntry(
  entry: AttendanceEntry,
  dictionary?: {
    idToStudentInfo: Map<string, { name: string; className: string }>;
    nameClassToStudent: Map<string, Student>;
    nameOnlyToStudent: Map<string, Student>;
  }
): string {
  if (!entry) return 'Siswa';

  if ((entry as any).studentName) {
    return (entry as any).studentName;
  }

  if (dictionary && entry.studentId) {
    const hist = dictionary.idToStudentInfo.get(entry.studentId);
    if (hist && hist.name) {
      return hist.name;
    }
  }

  return entry.studentId || 'Siswa';
}

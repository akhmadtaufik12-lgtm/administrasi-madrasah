import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocFromServer,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendanceSession, GradeRecord, LessonPlan, SchoolOfficials, ClassWaliKelasMap, Teacher, Subject, Student, StudentViolation, PaymentTransaction, FeeTariffSettings, AdminSettings, StudentBillSettings, CashDepositTransaction, TreasurerExpenseTransaction, TeachingSchedule, Announcement, DatabaseBackupData, InventoryItem, InventoryMovementLog, SuratKeluar, SuratMasuk } from '../types';
import { INITIAL_STUDENTS, INITIAL_SCHEDULES, INITIAL_INVENTORY_ITEMS } from '../data/initialData';
import { INITIAL_SURAT_KELUAR, INITIAL_SURAT_MASUK } from '../data/initialLettersData';

const app = initializeApp(firebaseConfig);

const targetDatabaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

// Proactively clean up any legacy webStorage keys left by persistentMultipleTabManager
// which cause QuotaExceededError in localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToPurge: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('firestore_') || k.includes('sequence_number') || k.includes('firestore/'))) {
        keysToPurge.push(k);
      }
    }
    keysToPurge.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
  } catch (_) {}
}

let firestoreInstance;
try {
  // Use persistentSingleTabManager with IndexedDB storage (not localStorage) to prevent QuotaExceededError
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({ forceOwnership: true })
      })
    },
    targetDatabaseId
  );
} catch (err) {
  console.info('Persistent local cache not available, falling back to memoryLocalCache:', err);
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        localCache: memoryLocalCache()
      },
      targetDatabaseId
    );
  } catch {
    firestoreInstance = targetDatabaseId ? getFirestore(app, targetDatabaseId) : getFirestore(app);
  }
}

export const db = firestoreInstance;

// COLLECTIONS
const SESSIONS_COL = 'attendance_sessions';
const GRADES_COL = 'grade_records';
const LESSON_PLANS_COL = 'lesson_plans';
const CONFIG_COL = 'school_configs';
const VIOLATIONS_COL = 'student_violations';
const PAYMENTS_COL = 'student_payments';
const CASH_DEPOSITS_COL = 'cash_deposits';
const EXPENSES_COL = 'treasurer_expenses';
const SCHEDULES_COL = 'teaching_schedules';
const INVENTORY_COL = 'inventory_items';
const INVENTORY_LOGS_COL = 'inventory_movement_logs';
const SURAT_KELUAR_COL = 'surat_keluar';
const SURAT_MASUK_COL = 'surat_masuk';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const auth = getAuth(app);

// Test Firestore connection on boot as required by Firebase integration guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] The client is offline or network is limited.');
    }
  }
}
if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo?: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Recursively removes all properties with `undefined` values from an object or array.
 * Firestore setDoc / updateDoc rejects payloads containing `undefined` values.
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): Error {
  const message = error instanceof Error ? error.message : String(error);
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: message,
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };
  console.warn('Firestore Notice (Falling back to local storage):', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

// Seed initial session if collection is completely empty
const sampleSession: AttendanceSession = {
  id: 'sess-sample-1',
  date: new Date().toISOString().split('T')[0],
  teacherId: 't-85780',
  teacherName: 'M. Sholihin, SE',
  teacherNip: '85780',
  subjectId: 'sub-mtk',
  subjectName: 'Matematika',
  className: 'IX A',
  meetingNumber: 1,
  periodNumber: '1 - 2 (07.30 - 08.50 WIB)',
  topic: 'Persamaan dan Fungsi Kuadrat: Menentukan Akar-Akar Persamaan Kuadrat',
  competency: 'Siswa dapat menentukan akar persamaan kuadrat dengan pemfaktoran',
  teachingNotes: 'Proses KBM berjalan lancar. 2 siswa izin ke UKS, 1 siswa sakit.',
  entries: INITIAL_STUDENTS.filter(s => s.className === 'IX A').map((s, idx) => ({
    studentId: s.id,
    status: idx === 5 ? 'S' : idx === 10 ? 'I' : 'H',
    notes: idx === 5 ? 'Sakit demam' : idx === 10 ? 'Izin surat ortu' : ''
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Real-time listener for Attendance Sessions
 */
export function subscribeAttendanceSessions(
  onUpdate: (sessions: AttendanceSession[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, SESSIONS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed initial sample session to Firestore if empty
        setDoc(doc(db, SESSIONS_COL, sampleSession.id), sampleSession).catch((err) => {
          console.warn('Failed to seed initial session to Firestore:', err);
        });
        onUpdate([sampleSession]);
        return;
      }
      const sessions: AttendanceSession[] = snapshot.docs.map(
        (doc) => doc.data() as AttendanceSession
      );
      // Sort newest date / createdAt first
      sessions.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
      onUpdate(sessions);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, SESSIONS_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveSessionToFirebase(session: AttendanceSession) {
  try {
    const docRef = doc(db, SESSIONS_COL, session.id);
    await setDoc(docRef, cleanUndefined(session), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${SESSIONS_COL}/${session.id}`);
  }
}

export async function deleteSessionFromFirebase(sessionId: string) {
  try {
    const docRef = doc(db, SESSIONS_COL, sessionId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${SESSIONS_COL}/${sessionId}`);
  }
}

/**
 * Real-time listener for Grade Records
 */
export function subscribeGrades(
  onUpdate: (grades: GradeRecord[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, GRADES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const records: GradeRecord[] = snapshot.docs.map(
        (doc) => doc.data() as GradeRecord
      );
      onUpdate(records);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, GRADES_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveGradeToFirebase(record: GradeRecord) {
  try {
    const docRef = doc(db, GRADES_COL, record.id);
    await setDoc(docRef, cleanUndefined(record), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${GRADES_COL}/${record.id}`);
  }
}

/**
 * Real-time listener for Lesson Plans
 */
export function subscribeLessonPlans(
  onUpdate: (plans: LessonPlan[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, LESSON_PLANS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const plans: LessonPlan[] = snapshot.docs.map(
        (doc) => doc.data() as LessonPlan
      );
      plans.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onUpdate(plans);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, LESSON_PLANS_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveLessonPlanToFirebase(plan: LessonPlan) {
  try {
    const docRef = doc(db, LESSON_PLANS_COL, plan.id);
    await setDoc(docRef, cleanUndefined(plan), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${LESSON_PLANS_COL}/${plan.id}`);
  }
}

export async function deleteLessonPlanFromFirebase(planId: string) {
  try {
    const docRef = doc(db, LESSON_PLANS_COL, planId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${LESSON_PLANS_COL}/${planId}`);
  }
}

/**
 * Real-time listener for School Officials
 */
export function subscribeSchoolOfficials(
  onUpdate: (officials: SchoolOfficials) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'officials');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SchoolOfficials);
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/officials`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveSchoolOfficialsToFirebase(officials: SchoolOfficials) {
  try {
    const docRef = doc(db, CONFIG_COL, 'officials');
    await setDoc(docRef, cleanUndefined(officials), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/officials`);
  }
}

/**
 * Real-time listener for Class Wali Kelas
 */
export function subscribeClassWaliKelas(
  onUpdate: (mapping: ClassWaliKelasMap) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'class_walikelas');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as ClassWaliKelasMap);
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/class_walikelas`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveClassWaliKelasToFirebase(mapping: ClassWaliKelasMap) {
  try {
    const docRef = doc(db, CONFIG_COL, 'class_walikelas');
    await setDoc(docRef, cleanUndefined(mapping), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/class_walikelas`);
  }
}

/**
 * Real-time listener for Master Teachers
 */
export function subscribeTeachers(
  onUpdate: (teachers: Teacher[]) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'teachers');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.list)) {
          const seenIds = new Set<string>();
          const seenNames = new Set<string>();
          const seenNips = new Set<string>();
          let hasDuplicates = false;
          const cleaned: Teacher[] = [];

          for (const rawTeacher of (data.list as Teacher[])) {
            if (!rawTeacher || !rawTeacher.name) continue;
            const t = { ...rawTeacher };
            const lower = t.name.toLowerCase().trim();
            if (lower === 'andri setiayan' || lower === 'andi setiawan' || lower === 'andri setiawan') {
              t.name = 'Andri Setiawan';
              t.id = 't-85831';
              t.nip = '-';
            } else if (lower === 'agustiyan, s.pd' || lower === 'agustiani, s.pd') {
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
            cleaned.push({
              ...t,
              kodeUnik: t.kodeUnik || `GURU-${hasValidNip ? t.nip : t.id.replace('t-', '')}`
            });
          }

          if (hasDuplicates || cleaned.length !== data.list.length) {
            saveTeachersToFirebase(cleaned).catch(() => {});
          }
          onUpdate(cleaned);
        }
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/teachers`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveTeachersToFirebase(teachers: Teacher[]) {
  try {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const seenNips = new Set<string>();
    const cleaned: Teacher[] = [];

    for (const rawTeacher of teachers) {
      if (!rawTeacher || !rawTeacher.name) continue;
      const t = { ...rawTeacher };
      const lower = t.name.toLowerCase().trim();
      if (lower === 'andri setiayan' || lower === 'andi setiawan' || lower === 'andri setiawan') {
        t.name = 'Andri Setiawan';
        t.id = 't-85831';
        t.nip = '-';
      } else if (lower === 'agustiyan, s.pd' || lower === 'agustiani, s.pd') {
        t.name = 'Agustiani, S.Pd';
      }

      const normName = t.name.toLowerCase().trim();
      const hasValidNip = t.nip && t.nip !== '-' && t.nip !== 'undefined' && t.nip.trim() !== '';
      const normNip = hasValidNip ? t.nip.trim() : null;

      if (seenIds.has(t.id) || seenNames.has(normName) || (normNip && seenNips.has(normNip))) {
        continue;
      }

      seenIds.add(t.id);
      seenNames.add(normName);
      if (normNip) seenNips.add(normNip);
      cleaned.push({
        ...t,
        kodeUnik: t.kodeUnik || `GURU-${hasValidNip ? t.nip : t.id.replace('t-', '')}`
      });
    }

    const docRef = doc(db, CONFIG_COL, 'teachers');
    await setDoc(docRef, cleanUndefined({ list: cleaned }), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/teachers`);
  }
}

/**
 * Real-time listener for Master Subjects
 */
export function subscribeSubjects(
  onUpdate: (subjects: Subject[]) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'subjects');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.list)) {
          onUpdate(data.list as Subject[]);
        }
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/subjects`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveSubjectsToFirebase(subjects: Subject[]) {
  try {
    const docRef = doc(db, CONFIG_COL, 'subjects');
    await setDoc(docRef, cleanUndefined({ list: subjects }), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/subjects`);
  }
}

/**
 * Real-time listener for Master Students
 */
export function subscribeStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'students');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.list)) {
          onUpdate(data.list as Student[]);
        }
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/students`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveStudentsToFirebase(students: Student[]) {
  try {
    const docRef = doc(db, CONFIG_COL, 'students');
    await setDoc(docRef, cleanUndefined({ list: students }), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/students`);
  }
}

/**
 * Real-time listener for Student Violations
 */
export function subscribeViolations(
  onUpdate: (violations: StudentViolation[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, VIOLATIONS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const violations: StudentViolation[] = snapshot.docs.map(
        (doc) => doc.data() as StudentViolation
      );
      violations.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
      onUpdate(violations);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, VIOLATIONS_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveViolationToFirebase(violation: StudentViolation) {
  try {
    const docRef = doc(db, VIOLATIONS_COL, violation.id);
    await setDoc(docRef, cleanUndefined(violation), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${VIOLATIONS_COL}/${violation.id}`);
  }
}

export async function deleteViolationFromFirebase(violationId: string) {
  try {
    const docRef = doc(db, VIOLATIONS_COL, violationId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${VIOLATIONS_COL}/${violationId}`);
  }
}

/**
 * Real-time listener for Student Payment Transactions
 */
export function subscribePayments(
  onUpdate: (payments: PaymentTransaction[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PAYMENTS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const payments: PaymentTransaction[] = snapshot.docs.map(
        (doc) => doc.data() as PaymentTransaction
      );
      payments.sort((a, b) => (b.createdAt || b.paymentDate).localeCompare(a.createdAt || a.paymentDate));
      onUpdate(payments);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, PAYMENTS_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function savePaymentToFirebase(payment: PaymentTransaction) {
  try {
    const docRef = doc(db, PAYMENTS_COL, payment.id);
    await setDoc(docRef, cleanUndefined(payment), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${PAYMENTS_COL}/${payment.id}`);
  }
}

export async function deletePaymentFromFirebase(paymentId: string) {
  try {
    const docRef = doc(db, PAYMENTS_COL, paymentId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${PAYMENTS_COL}/${paymentId}`);
  }
}

/**
 * Real-time listener for Fee Tariff Settings
 */
export function subscribeFeeTariffs(
  onUpdate: (tariffs: FeeTariffSettings) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'fee_tariffs');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as FeeTariffSettings);
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/fee_tariffs`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveFeeTariffsToFirebase(tariffs: FeeTariffSettings) {
  try {
    const docRef = doc(db, CONFIG_COL, 'fee_tariffs');
    await setDoc(docRef, cleanUndefined(tariffs), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/fee_tariffs`);
  }
}

/**
 * Real-time listener for Super Admin Settings (Master Passcode & Security)
 */
export function subscribeAdminSettings(
  onUpdate: (settings: AdminSettings) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'admin_settings');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AdminSettings);
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/admin_settings`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveAdminSettingsToFirebase(settings: AdminSettings) {
  try {
    const docRef = doc(db, CONFIG_COL, 'admin_settings');
    await setDoc(docRef, cleanUndefined(settings), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/admin_settings`);
  }
}

/**
 * Real-time listener for Student Bill & Arrears Configuration
 */
export function subscribeStudentBillSettings(
  onUpdate: (settings: StudentBillSettings) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'student_bills');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as StudentBillSettings);
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/student_bills`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveStudentBillSettingsToFirebase(settings: StudentBillSettings) {
  try {
    const docRef = doc(db, CONFIG_COL, 'student_bills');
    await setDoc(docRef, cleanUndefined(settings));
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/student_bills`);
  }
}

/**
 * Real-time listener for Cash Deposit Transactions (Handover from Bendahara 1-5 to Bendahara Utama)
 */
export function subscribeCashDeposits(
  onUpdate: (deposits: CashDepositTransaction[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, CASH_DEPOSITS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as CashDepositTransaction[];
      // Sort newest first
      list.sort((a, b) => new Date(b.depositDate || b.createdAt).getTime() - new Date(a.depositDate || a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.LIST, CASH_DEPOSITS_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveCashDepositToFirebase(deposit: CashDepositTransaction) {
  try {
    const docRef = doc(db, CASH_DEPOSITS_COL, deposit.id);
    await setDoc(docRef, cleanUndefined(deposit), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CASH_DEPOSITS_COL}/${deposit.id}`);
  }
}

export async function deleteCashDepositFromFirebase(depositId: string) {
  try {
    const docRef = doc(db, CASH_DEPOSITS_COL, depositId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${CASH_DEPOSITS_COL}/${depositId}`);
  }
}

/**
 * Real-time listener for Treasurer Expenses (Operational Disbursements per Treasurer)
 */
export function subscribeTreasurerExpenses(
  onUpdate: (expenses: TreasurerExpenseTransaction[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, EXPENSES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as TreasurerExpenseTransaction[];
      // Sort newest date / createdAt first
      list.sort((a, b) => new Date(b.expenseDate || b.createdAt).getTime() - new Date(a.expenseDate || a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.LIST, EXPENSES_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveTreasurerExpenseToFirebase(expense: TreasurerExpenseTransaction) {
  try {
    const docRef = doc(db, EXPENSES_COL, expense.id);
    await setDoc(docRef, cleanUndefined(expense), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${EXPENSES_COL}/${expense.id}`);
  }
}

export async function deleteTreasurerExpenseFromFirebase(expenseId: string) {
  try {
    const docRef = doc(db, EXPENSES_COL, expenseId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${EXPENSES_COL}/${expenseId}`);
  }
}

/**
 * Real-time listener for Inventory Items (Seragam, LKS, Atribut)
 */
export function subscribeInventory(
  onUpdate: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, INVENTORY_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed default initial inventory
        (async () => {
          try {
            for (const item of INITIAL_INVENTORY_ITEMS) {
              await setDoc(doc(db, INVENTORY_COL, item.id), cleanUndefined(item), { merge: true });
            }
          } catch (err) {
            console.warn('Seeding initial inventory notice:', err);
          }
        })();
        onUpdate(INITIAL_INVENTORY_ITEMS);
        return;
      }

      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as InventoryItem[];

      // Sort by category, variantType, size
      list.sort((a, b) => a.category.localeCompare(b.category) || (a.name || '').localeCompare(b.name || ''));
      onUpdate(list);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.LIST, INVENTORY_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveInventoryItemToFirebase(item: InventoryItem) {
  try {
    const docRef = doc(db, INVENTORY_COL, item.id);
    await setDoc(docRef, cleanUndefined(item), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${INVENTORY_COL}/${item.id}`);
  }
}

export async function deleteInventoryItemFromFirebase(itemId: string) {
  try {
    const docRef = doc(db, INVENTORY_COL, itemId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${INVENTORY_COL}/${itemId}`);
  }
}

export async function saveAllInventoryToFirebase(items: InventoryItem[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, INVENTORY_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, INVENTORY_COL);
  }
}

/**
 * Real-time listener for Inventory Movement Logs
 */
export function subscribeInventoryLogs(
  onUpdate: (logs: InventoryMovementLog[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, INVENTORY_LOGS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as InventoryMovementLog[];

      // Sort newest date & createdAt first
      list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      onUpdate(list);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.LIST, INVENTORY_LOGS_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveInventoryLogToFirebase(log: InventoryMovementLog) {
  try {
    const docRef = doc(db, INVENTORY_LOGS_COL, log.id);
    await setDoc(docRef, cleanUndefined(log), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${INVENTORY_LOGS_COL}/${log.id}`);
  }
}

export async function deleteInventoryLogFromFirebase(logId: string) {
  try {
    const docRef = doc(db, INVENTORY_LOGS_COL, logId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${INVENTORY_LOGS_COL}/${logId}`);
  }
}

/**
 * Real-time listener for Teaching Schedules
 */
export function subscribeTeachingSchedules(
  onUpdate: (schedules: TeachingSchedule[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, SCHEDULES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      // If collection is empty or has obsolete partial data (< 350 items), seed full 368 official schedules
      if (snapshot.empty || snapshot.docs.length < 350) {
        (async () => {
          try {
            // Batch seed all 368 official schedules
            for (const sch of INITIAL_SCHEDULES) {
              await setDoc(doc(db, SCHEDULES_COL, sch.id), cleanUndefined(sch), { merge: true });
            }
          } catch (err) {
            console.warn('Seeding schedules notice:', err);
          }
        })();
        onUpdate(INITIAL_SCHEDULES as TeachingSchedule[]);
        return;
      }
      let needsFirestoreRepair = false;
      const list = snapshot.docs.map(d => {
        const item = { id: d.id, ...d.data() } as TeachingSchedule;
        const isGrade7or9 = item.className && (item.className.startsWith('VII') || item.className.startsWith('IX'));
        const isGrade8 = item.className && item.className.startsWith('VIII');
        const isPenjas = (item.subjectCode && item.subjectCode.toUpperCase() === 'PENJAS') || 
                         (item.subjectName && item.subjectName.toLowerCase().includes('jasmani'));
        const isOldAndri = item.teacherName === 'Andi Setiawan' || item.teacherName === 'Andri setiawan' || item.teacherName === 'Andri Setiayan' || item.teacherId === 't-85831';

        // Grade VIII Penjas -> Randi (t-85829, NIP: 85829)
        if (isGrade8 && isPenjas) {
          if (item.teacherName !== 'Randi' || item.teacherId !== 't-85829') {
            needsFirestoreRepair = true;
            // Repair in background Firestore
            setDoc(doc(db, SCHEDULES_COL, d.id), cleanUndefined({
              ...item,
              teacherId: 't-85829',
              teacherName: 'Randi',
              teacherNip: '85829'
            }), { merge: true }).catch(() => {});
          }
          return {
            ...item,
            teacherId: 't-85829',
            teacherName: 'Randi',
            teacherNip: '85829'
          };
        }

        // Grade VII & IX Penjas -> Andri Setiawan (t-85831, NIP: -)
        if ((isGrade7or9 && isPenjas) || (isOldAndri && !isGrade8)) {
          if (item.teacherName !== 'Andri Setiawan' || item.teacherId !== 't-85831') {
            needsFirestoreRepair = true;
            // Repair in background
            setDoc(doc(db, SCHEDULES_COL, d.id), cleanUndefined({
              ...item,
              teacherId: 't-85831',
              teacherName: 'Andri Setiawan',
              teacherNip: '-'
            }), { merge: true }).catch(() => {});
          }
          return {
            ...item,
            teacherId: 't-85831',
            teacherName: 'Andri Setiawan',
            teacherNip: '-'
          };
        }
        return item;
      }) as TeachingSchedule[];
      onUpdate(list);
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.LIST, SCHEDULES_COL);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveScheduleToFirebase(schedule: TeachingSchedule) {
  try {
    const docRef = doc(db, SCHEDULES_COL, schedule.id);
    await setDoc(docRef, cleanUndefined(schedule), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${SCHEDULES_COL}/${schedule.id}`);
  }
}

export async function deleteScheduleFromFirebase(scheduleId: string) {
  try {
    const docRef = doc(db, SCHEDULES_COL, scheduleId);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${SCHEDULES_COL}/${scheduleId}`);
  }
}

export async function saveAllSchedulesToFirebase(schedules: TeachingSchedule[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < schedules.length; i += chunkSize) {
      const chunk = schedules.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const sch of chunk) {
        const docRef = doc(db, SCHEDULES_COL, sch.id);
        batch.set(docRef, cleanUndefined(sch), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, SCHEDULES_COL);
  }
}

/**
 * Real-time listener for Announcements
 */
export function subscribeAnnouncements(
  onUpdate: (announcements: Announcement[]) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, CONFIG_COL, 'announcements');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.list)) {
          onUpdate(data.list as Announcement[]);
        }
      }
    },
    (error) => {
      const formattedErr = handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/announcements`);
      if (onError) onError(formattedErr);
    }
  );
}

export async function saveAnnouncementsToFirebase(announcements: Announcement[]) {
  try {
    const docRef = doc(db, CONFIG_COL, 'announcements');
    await setDoc(docRef, cleanUndefined({ list: announcements }), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${CONFIG_COL}/announcements`);
  }
}

/**
 * Batch saves attendance sessions to Firestore in chunks of 350 items.
 */
export async function saveAllSessionsToFirebase(sessions: AttendanceSession[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < sessions.length; i += chunkSize) {
      const chunk = sessions.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, SESSIONS_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, SESSIONS_COL);
  }
}

/**
 * Batch saves student grade records to Firestore in chunks of 350 items.
 */
export async function saveAllGradesToFirebase(grades: GradeRecord[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < grades.length; i += chunkSize) {
      const chunk = grades.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, GRADES_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, GRADES_COL);
  }
}

/**
 * Batch saves lesson plans to Firestore.
 */
export async function saveAllLessonPlansToFirebase(plans: LessonPlan[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < plans.length; i += chunkSize) {
      const chunk = plans.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, LESSON_PLANS_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, LESSON_PLANS_COL);
  }
}

/**
 * Batch saves student violations to Firestore.
 */
export async function saveAllViolationsToFirebase(violations: StudentViolation[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < violations.length; i += chunkSize) {
      const chunk = violations.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, VIOLATIONS_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, VIOLATIONS_COL);
  }
}

/**
 * Batch saves payment transactions to Firestore.
 */
export async function saveAllPaymentsToFirebase(payments: PaymentTransaction[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < payments.length; i += chunkSize) {
      const chunk = payments.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, PAYMENTS_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, PAYMENTS_COL);
  }
}

/**
 * Batch saves cash deposits to Firestore.
 */
export async function saveAllCashDepositsToFirebase(deposits: CashDepositTransaction[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < deposits.length; i += chunkSize) {
      const chunk = deposits.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, CASH_DEPOSITS_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, CASH_DEPOSITS_COL);
  }
}

/**
 * Batch saves treasurer expense transactions to Firestore.
 */
export async function saveAllTreasurerExpensesToFirebase(expenses: TreasurerExpenseTransaction[]) {
  try {
    const chunkSize = 350;
    for (let i = 0; i < expenses.length; i += chunkSize) {
      const chunk = expenses.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, EXPENSES_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, EXPENSES_COL);
  }
}

/**
 * Real-time listener for Surat Keluar (Outgoing Letters)
 */
export function subscribeSuratKeluar(
  onUpdate: (letters: SuratKeluar[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, SURAT_KELUAR_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed initial surat keluar if empty
        INITIAL_SURAT_KELUAR.forEach(item => {
          setDoc(doc(db, SURAT_KELUAR_COL, item.id), cleanUndefined(item)).catch(() => {});
        });
        onUpdate(INITIAL_SURAT_KELUAR);
        return;
      }
      const letters: SuratKeluar[] = [];
      snapshot.forEach((d) => {
        letters.push(d.data() as SuratKeluar);
      });
      // Sort newest first
      letters.sort((a, b) => new Date(b.createdAt || b.tanggalSurat).getTime() - new Date(a.createdAt || a.tanggalSurat).getTime());
      onUpdate(letters);
    },
    (error) => {
      const err = handleFirestoreError(error, OperationType.LIST, SURAT_KELUAR_COL);
      if (onError) onError(err);
    }
  );
}

export async function saveSuratKeluarToFirebase(letter: SuratKeluar) {
  try {
    const docRef = doc(db, SURAT_KELUAR_COL, letter.id);
    await setDoc(docRef, cleanUndefined(letter), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${SURAT_KELUAR_COL}/${letter.id}`);
  }
}

export async function deleteSuratKeluarFromFirebase(id: string) {
  try {
    const docRef = doc(db, SURAT_KELUAR_COL, id);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${SURAT_KELUAR_COL}/${id}`);
  }
}

export async function saveAllSuratKeluarToFirebase(letters: SuratKeluar[]) {
  try {
    const chunkSize = 200;
    for (let i = 0; i < letters.length; i += chunkSize) {
      const chunk = letters.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, SURAT_KELUAR_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, SURAT_KELUAR_COL);
  }
}

/**
 * Real-time listener for Surat Masuk (Incoming Letters)
 */
export function subscribeSuratMasuk(
  onUpdate: (letters: SuratMasuk[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, SURAT_MASUK_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed initial surat masuk if empty
        INITIAL_SURAT_MASUK.forEach(item => {
          setDoc(doc(db, SURAT_MASUK_COL, item.id), cleanUndefined(item)).catch(() => {});
        });
        onUpdate(INITIAL_SURAT_MASUK);
        return;
      }
      const letters: SuratMasuk[] = [];
      snapshot.forEach((d) => {
        letters.push(d.data() as SuratMasuk);
      });
      // Sort newest first
      letters.sort((a, b) => new Date(b.createdAt || b.tanggalDiterima).getTime() - new Date(a.createdAt || a.tanggalDiterima).getTime());
      onUpdate(letters);
    },
    (error) => {
      const err = handleFirestoreError(error, OperationType.LIST, SURAT_MASUK_COL);
      if (onError) onError(err);
    }
  );
}

export async function saveSuratMasukToFirebase(letter: SuratMasuk) {
  try {
    const docRef = doc(db, SURAT_MASUK_COL, letter.id);
    await setDoc(docRef, cleanUndefined(letter), { merge: true });
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, `${SURAT_MASUK_COL}/${letter.id}`);
  }
}

export async function deleteSuratMasukFromFirebase(id: string) {
  try {
    const docRef = doc(db, SURAT_MASUK_COL, id);
    await deleteDoc(docRef);
  } catch (e) {
    throw handleFirestoreError(e, OperationType.DELETE, `${SURAT_MASUK_COL}/${id}`);
  }
}

export async function saveAllSuratMasukToFirebase(letters: SuratMasuk[]) {
  try {
    const chunkSize = 200;
    for (let i = 0; i < letters.length; i += chunkSize) {
      const chunk = letters.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, SURAT_MASUK_COL, item.id);
        batch.set(docRef, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
  } catch (e) {
    throw handleFirestoreError(e, OperationType.WRITE, SURAT_MASUK_COL);
  }
}

/**
 * Full database sync function for Database Restore operation
 */
export async function restoreFullDatabaseToFirebase(data: DatabaseBackupData) {
  const tasks: Promise<any>[] = [];

  if (data.students && Array.isArray(data.students)) {
    tasks.push(saveStudentsToFirebase(data.students));
  }
  if (data.teachers && Array.isArray(data.teachers)) {
    tasks.push(saveTeachersToFirebase(data.teachers));
  }
  if (data.subjects && Array.isArray(data.subjects)) {
    tasks.push(saveSubjectsToFirebase(data.subjects));
  }
  if (data.schoolOfficials) {
    tasks.push(saveSchoolOfficialsToFirebase(data.schoolOfficials));
  }
  if (data.classWaliKelas) {
    tasks.push(saveClassWaliKelasToFirebase(data.classWaliKelas));
  }
  if (data.feeTariffs) {
    tasks.push(saveFeeTariffsToFirebase(data.feeTariffs));
  }
  if (data.studentBillSettings) {
    tasks.push(saveStudentBillSettingsToFirebase(data.studentBillSettings));
  }
  if (data.adminSettings) {
    tasks.push(saveAdminSettingsToFirebase(data.adminSettings));
  }
  if (data.announcements && Array.isArray(data.announcements)) {
    tasks.push(saveAnnouncementsToFirebase(data.announcements));
  }
  if (data.sessions && Array.isArray(data.sessions)) {
    tasks.push(saveAllSessionsToFirebase(data.sessions));
  }
  if (data.grades && Array.isArray(data.grades)) {
    tasks.push(saveAllGradesToFirebase(data.grades));
  }
  if (data.lessonPlans && Array.isArray(data.lessonPlans)) {
    tasks.push(saveAllLessonPlansToFirebase(data.lessonPlans));
  }
  if (data.violations && Array.isArray(data.violations)) {
    tasks.push(saveAllViolationsToFirebase(data.violations));
  }
  if (data.payments && Array.isArray(data.payments)) {
    tasks.push(saveAllPaymentsToFirebase(data.payments));
  }
  if (data.cashDeposits && Array.isArray(data.cashDeposits)) {
    tasks.push(saveAllCashDepositsToFirebase(data.cashDeposits));
  }
  if (data.treasurerExpenses && Array.isArray(data.treasurerExpenses)) {
    tasks.push(saveAllTreasurerExpensesToFirebase(data.treasurerExpenses));
  }
  if (data.schedules && Array.isArray(data.schedules)) {
    tasks.push(saveAllSchedulesToFirebase(data.schedules));
  }
  if (data.suratKeluar && Array.isArray(data.suratKeluar)) {
    tasks.push(saveAllSuratKeluarToFirebase(data.suratKeluar));
  }
  if (data.suratMasuk && Array.isArray(data.suratMasuk)) {
    tasks.push(saveAllSuratMasukToFirebase(data.suratMasuk));
  }

  await Promise.all(tasks);
}






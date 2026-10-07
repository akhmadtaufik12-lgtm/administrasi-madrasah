import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, WalletCards, LogOut, Building2, CalendarCheck, BookOpen, Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { ActiveTab, Teacher, Subject, Student, AttendanceSession, GradeRecord, LessonPlan, SchoolOfficials, ClassWaliKelasMap, StudentViolation, PaymentTransaction, FeeTariffSettings, AdminSettings, StudentBillSettings, CashDepositTransaction, TreasurerExpenseTransaction, TeachingSchedule, Announcement, SchoolId, DatabaseBackupData, InventoryItem, InventoryMovementLog, SuratKeluar, SuratMasuk } from './types';
import {
  getStoredTeachers,
  saveTeachers,
  deduplicateTeachers,
  getStoredSubjects,
  saveSubjects,
  getStoredStudents,
  saveStudents,
  getActiveTeacherId,
  saveActiveTeacherId,
  getStoredSessions,
  saveSessions,
  getStoredGrades,
  saveGrades,
  getStoredLessonPlans,
  saveLessonPlans,
  getAcademicSettings,
  saveAcademicSettings,
  getStoredSchoolOfficials,
  saveSchoolOfficials,
  getStoredClassWaliKelas,
  saveClassWaliKelas,
  getStoredViolations,
  saveViolations,
  getStoredPayments,
  savePayments,
  getStoredCashDeposits,
  saveCashDeposits,
  getStoredExpenses,
  saveExpenses,
  saveTreasurerExpenses,
  getStoredFeeTariffs,
  saveFeeTariffs,
  getStoredBendaharaCode,
  saveBendaharaCode,
  getStoredAdminSettings,
  saveAdminSettings,
  getStoredStudentBillSettings,
  saveStudentBillSettings,
  getStoredSchedules,
  saveSchedules,
  getStoredAnnouncements,
  saveAnnouncements,
  getAllTreasurers,
  DEFAULT_STUDENT_BILL_SETTINGS,
  getActiveSchoolId,
  setActiveSchoolId,
  getSchoolConfig,
  getClassesForSchool,
  ALL_SCHOOLS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_SUBJECTS,
  INITIAL_SCHEDULES,
  DEFAULT_OFFICIALS,
  DEFAULT_WALI_KELAS,
  DEFAULT_FEE_TARIFFS,
  DEFAULT_ANNOUNCEMENTS,
  getStoredInventory,
  saveInventory,
  getStoredInventoryLogs,
  saveInventoryLogs,
  deductInventoryStock,
  restockInventoryItem,
  getStoredSuratKeluar,
  saveSuratKeluar,
  getStoredSuratMasuk,
  saveSuratMasuk,
  saveFullDatabaseToLocalStorage,
  syncPaymentsWithStudents,
  countUnsyncedPayments,
  getOfflineAttendanceQueue,
  saveOfflineAttendanceQueue,
  enqueueOfflineAttendance,
  removeOfflineAttendanceItem,
  clearOfflineAttendanceQueue
} from './utils/storage';
import { healAndSyncAttendanceSessions } from './utils/studentMatcher';
import {
  subscribeAttendanceSessions,
  saveSessionToFirebase,
  deleteSessionFromFirebase,
  subscribeGrades,
  saveGradeToFirebase,
  subscribeLessonPlans,
  saveLessonPlanToFirebase,
  deleteLessonPlanFromFirebase,
  subscribeSchoolOfficials,
  saveSchoolOfficialsToFirebase,
  subscribeClassWaliKelas,
  saveClassWaliKelasToFirebase,
  subscribeTeachers,
  saveTeachersToFirebase,
  subscribeSubjects,
  saveSubjectsToFirebase,
  subscribeStudents,
  saveStudentsToFirebase,
  subscribeViolations,
  saveViolationToFirebase,
  deleteViolationFromFirebase,
  subscribePayments,
  savePaymentToFirebase,
  deletePaymentFromFirebase,
  subscribeCashDeposits,
  saveCashDepositToFirebase,
  deleteCashDepositFromFirebase,
  subscribeTreasurerExpenses,
  saveTreasurerExpenseToFirebase,
  deleteTreasurerExpenseFromFirebase,
  subscribeFeeTariffs,
  saveFeeTariffsToFirebase,
  subscribeAdminSettings,
  saveAdminSettingsToFirebase,
  subscribeStudentBillSettings,
  saveStudentBillSettingsToFirebase,
  subscribeTeachingSchedules,
  saveScheduleToFirebase,
  deleteScheduleFromFirebase,
  saveAllSchedulesToFirebase,
  subscribeAnnouncements,
  saveAnnouncementsToFirebase,
  subscribeInventory,
  saveInventoryItemToFirebase,
  deleteInventoryItemFromFirebase,
  subscribeInventoryLogs,
  saveInventoryLogToFirebase,
  subscribeSuratKeluar,
  saveSuratKeluarToFirebase,
  deleteSuratKeluarFromFirebase,
  subscribeSuratMasuk,
  saveSuratMasukToFirebase,
  deleteSuratMasukFromFirebase,
  restoreFullDatabaseToFirebase
} from './lib/firebase';
import { CLASSES_LIST } from './data/initialData';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AbsensiMengajar } from './components/AbsensiMengajar';
import { JadwalPelajaran } from './components/JadwalPelajaran';
import { JurnalMengajar } from './components/JurnalMengajar';
import { MonitoringMatrix } from './components/MonitoringMatrix';
import { Penilaian } from './components/Penilaian';
import { ModulAjar } from './components/ModulAjar';
import { RekapLaporan } from './components/RekapLaporan';
import { DataMaster } from './components/DataMaster';
import { AiAssistant } from './components/AiAssistant';
import { PortalGate } from './components/PortalGate';
import { SettingsModal } from './components/SettingsModal';
import { ParentPortal } from './components/ParentPortal';
import { WaliKelas } from './components/WaliKelas';
import { Kesiswaan } from './components/Kesiswaan';
import { PembayaranSiswa } from './components/PembayaranSiswa';
import { TataUsaha } from './components/TataUsaha';
import { AdminPanel } from './components/AdminPanel';
import { IdentitasLembaga } from './components/IdentitasLembaga';
import { KurikulumPortal } from './components/KurikulumPortal';
import { StartKbmTeacherModal } from './components/StartKbmTeacherModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { AnnouncementModal } from './components/AnnouncementModal';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { InstallPwaModal } from './components/InstallPwaModal';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import {
  registerServiceWorker,
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  broadcastAnnouncementPushNotification
} from './utils/notifications';

export default function App() {
  // Portal Gate Security & Role State ('none' | 'teacher' | 'parent' | 'treasurer' | 'curriculum')
  const [userRole, setUserRole] = useState<'none' | 'teacher' | 'parent' | 'treasurer' | 'curriculum'>(() => {
    const stored =
      localStorage.getItem('portal_unlocked_madrasah') ||
      sessionStorage.getItem('portal_unlocked_madrasah');
    if (stored === 'teacher' || stored === 'true') return 'teacher';
    if (stored === 'parent') return 'parent';
    if (stored === 'treasurer') return 'treasurer';
    if (stored === 'curriculum') return 'curriculum';
    return 'none';
  });

  // Locked Student ID for student-specific single portal access
  const [lockedStudentId, setLockedStudentId] = useState<string | null>(() => {
    return localStorage.getItem('portal_locked_student_id') || sessionStorage.getItem('portal_locked_student_id');
  });

  // Academic Settings State (Tahun Pelajaran & Semester)
  const [academicSettings, setAcademicSettings] = useState(() => getAcademicSettings());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // School Officials & Class Wali Kelas Configuration State
  const [schoolOfficials, setSchoolOfficials] = useState<SchoolOfficials>(() => getStoredSchoolOfficials());
  const [classWaliKelas, setClassWaliKelas] = useState<ClassWaliKelasMap>(() => getStoredClassWaliKelas());

  const handleUpdateSchoolOfficials = async (updated: SchoolOfficials) => {
    setSchoolOfficials(updated);
    saveSchoolOfficials(updated);
    try {
      await saveSchoolOfficialsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync school officials to Firebase:', e);
    }
  };

  // Dynamically synchronize document title and meta description with school name set in Identitas Lembaga
  useEffect(() => {
    const schoolName = schoolOfficials?.namaSekolah || 'Madrasah';
    document.title = `Administrasi Guru ${schoolName}`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', `Sistem Informasi & Administrasi Terpadu Pembelajaran, Jadwal, Nilai, Kas Keuangan, SPP & Tata Usaha ${schoolName}`);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `Administrasi Guru ${schoolName}`);
    }
  }, [schoolOfficials?.namaSekolah]);

  const handleUpdateClassWaliKelas = async (updated: ClassWaliKelasMap) => {
    setClassWaliKelas(updated);
    saveClassWaliKelas(updated);
    try {
      await saveClassWaliKelasToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync wali kelas map to Firebase:', e);
    }
  };

  // Application Data State - Initialized immediately from offline persistent storage
  const [teachers, setTeachers] = useState<Teacher[]>(() => getStoredTeachers(getActiveSchoolId()));
  const [subjects, setSubjects] = useState<Subject[]>(() => getStoredSubjects(getActiveSchoolId()));
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents(getActiveSchoolId()));
  const [sessions, setSessions] = useState<AttendanceSession[]>(() => getStoredSessions(getActiveSchoolId()));
  const [grades, setGrades] = useState<GradeRecord[]>(() => getStoredGrades(getActiveSchoolId()));
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(() => getStoredLessonPlans(getActiveSchoolId()));
  const [violations, setViolations] = useState<StudentViolation[]>(() => getStoredViolations(getActiveSchoolId()));
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => getStoredPayments(getActiveSchoolId()));
  const [cashDeposits, setCashDeposits] = useState<CashDepositTransaction[]>(() => getStoredCashDeposits(getActiveSchoolId()));
  const [expenses, setExpenses] = useState<TreasurerExpenseTransaction[]>(() => getStoredExpenses(getActiveSchoolId()));
  const [feeTariffs, setFeeTariffs] = useState<FeeTariffSettings>(() => getStoredFeeTariffs(getActiveSchoolId()));
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => getStoredAdminSettings());
  const [billSettings, setBillSettings] = useState<StudentBillSettings>(() => getStoredStudentBillSettings(getActiveSchoolId()));
  const [schedules, setSchedules] = useState<TeachingSchedule[]>(() => getStoredSchedules(getActiveSchoolId()));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredInventory(getActiveSchoolId()));
  const [inventoryLogs, setInventoryLogs] = useState<InventoryMovementLog[]>(() => getStoredInventoryLogs(getActiveSchoolId()));
  const [suratKeluarList, setSuratKeluarList] = useState<SuratKeluar[]>(() => getStoredSuratKeluar(getActiveSchoolId()));
  const [suratMasukList, setSuratMasukList] = useState<SuratMasuk[]>(() => getStoredSuratMasuk(getActiveSchoolId()));
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);

  // Network Connectivity & Offline Attendance Queue State
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineAttendanceQueue().length);
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState<boolean>(false);
  const [offlineToast, setOfflineToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'warning' }>({ show: false, message: '', type: 'info' });

  const handleSaveSuratKeluar = async (letter: SuratKeluar) => {
    setSuratKeluarList(prev => {
      const idx = prev.findIndex(item => item.id === letter.id);
      const updated = idx >= 0 ? prev.map(item => item.id === letter.id ? letter : item) : [letter, ...prev];
      saveSuratKeluar(updated, activeSchoolId);
      return updated;
    });
    try {
      await saveSuratKeluarToFirebase(letter);
    } catch (e) {
      console.error('Failed to sync surat keluar to Firebase:', e);
    }
  };

  const handleDeleteSuratKeluar = async (id: string) => {
    setSuratKeluarList(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveSuratKeluar(updated, activeSchoolId);
      return updated;
    });
    try {
      await deleteSuratKeluarFromFirebase(id);
    } catch (e) {
      console.error('Failed to delete surat keluar from Firebase:', e);
    }
  };

  const handleSaveSuratMasuk = async (letter: SuratMasuk) => {
    setSuratMasukList(prev => {
      const idx = prev.findIndex(item => item.id === letter.id);
      const updated = idx >= 0 ? prev.map(item => item.id === letter.id ? letter : item) : [letter, ...prev];
      saveSuratMasuk(updated, activeSchoolId);
      return updated;
    });
    try {
      await saveSuratMasukToFirebase(letter);
    } catch (e) {
      console.error('Failed to sync surat masuk to Firebase:', e);
    }
  };

  const handleDeleteSuratMasuk = async (id: string) => {
    setSuratMasukList(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveSuratMasuk(updated, activeSchoolId);
      return updated;
    });
    try {
      await deleteSuratMasukFromFirebase(id);
    } catch (e) {
      console.error('Failed to delete surat masuk from Firebase:', e);
    }
  };

  const handleSaveBillSettings = async (updated: StudentBillSettings) => {
    setBillSettings(updated);
    saveStudentBillSettings(updated);
    try {
      await saveStudentBillSettingsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync student bill settings to Firebase:', e);
    }
  };

  const handleSaveAdminSettings = async (updated: AdminSettings) => {
    setAdminSettings(updated);
    saveAdminSettings(updated);
    try {
      await saveAdminSettingsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync admin settings to Firebase:', e);
    }
  };

  // Broadcast Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>(getStoredAnnouncements);
  const [activeModalAnnouncement, setActiveModalAnnouncement] = useState<Announcement | null>(null);

  // PWA Install State & Event Listener
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
    const localInstalled = localStorage.getItem('madrasah_pwa_installed') === 'true';
    return isStandaloneMode || localInstalled;
  });

  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem('madrasah_pwa_banner_dismissed') === 'true';
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
    const localInstalled = localStorage.getItem('madrasah_pwa_installed') === 'true';
    return !isStandaloneMode && !localInstalled && !dismissed;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      const handleDisplayModeChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setIsAppInstalled(true);
          setShowInstallBanner(false);
          localStorage.setItem('madrasah_pwa_installed', 'true');
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleDisplayModeChange);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      const localInstalled = localStorage.getItem('madrasah_pwa_installed') === 'true';
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (!localInstalled && !isStandaloneMode) {
        const dismissed = localStorage.getItem('madrasah_pwa_banner_dismissed') === 'true';
        if (!dismissed) setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsAppInstalled(true);
      setShowInstallBanner(false);
      localStorage.setItem('madrasah_pwa_installed', 'true');
      localStorage.setItem('madrasah_pwa_banner_dismissed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('madrasah_pwa_banner_dismissed', 'true');
  };

  // Web Push Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return getNotificationPermission();
  });
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(() => {
    const dismissed = localStorage.getItem('madrasah_notification_banner_dismissed') === 'true';
    return isNotificationSupported() && getNotificationPermission() === 'default' && !dismissed;
  });

  // Handle request notification permission
  const handleRequestNotificationPermission = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
    if (result === 'granted') {
      setShowPermissionBanner(false);
      // Send welcoming notification to confirm it's working
      await broadcastAnnouncementPushNotification({
        id: 'welcome-notification',
        title: 'Notifikasi Madrasah Aktif!',
        message: 'Layar HP Anda siap menerima siaran pengumuman penting madrasah secara langsung.',
        type: 'important',
        authorName: 'Sistem Madrasah',
        active: true,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleDismissPermissionBanner = () => {
    setShowPermissionBanner(false);
    localStorage.setItem('madrasah_notification_banner_dismissed', 'true');
  };

  const handleSaveAnnouncements = async (updated: Announcement[]) => {
    setAnnouncements(updated);
    saveAnnouncements(updated);
    try {
      await saveAnnouncementsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync announcements to Firebase:', e);
    }
  };

  // Active School State ('mts_manbaul_islam' | 'smk_yak_1')
  const [activeSchoolId, setActiveSchoolIdState] = useState<SchoolId>(() => getActiveSchoolId());
  const currentSchool = getSchoolConfig(activeSchoolId);
  const currentClassesList = getClassesForSchool(activeSchoolId);

  // Selection Context
  const [activeTab, setActiveTab] = useState<ActiveTab>('jadwal');
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(() => {
    const sid = getActiveSchoolId();
    const storedList = getStoredTeachers(sid);
    const activeTid = getActiveTeacherId(sid);
    return storedList.find(t => t.id === activeTid) || storedList[0] || null;
  });
  const [activeSubject, setActiveSubject] = useState<Subject | null>(() => {
    const sid = getActiveSchoolId();
    const storedSubjects = getStoredSubjects(sid);
    return storedSubjects[0] || null;
  });
  const [activeClass, setActiveClass] = useState<string>(() => {
    const list = getClassesForSchool(getActiveSchoolId());
    return list[0] || 'IX A';
  });
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState<TeachingSchedule | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTeacherSelectModalOpen, setIsTeacherSelectModalOpen] = useState<boolean>(true);
  const [isSidebarAutoHide, setIsSidebarAutoHide] = useState<boolean>(() => {
    return localStorage.getItem('mts_sidebar_autohide') === 'true';
  });

  const handleToggleSidebarAutoHide = () => {
    setIsSidebarAutoHide(prev => {
      const next = !prev;
      localStorage.setItem('mts_sidebar_autohide', String(next));
      return next;
    });
  };

  // Switch School Handler (Loads dataset specific to selected school)
  const handleSwitchSchool = (newSchoolId: SchoolId) => {
    setActiveSchoolId(newSchoolId);
    setActiveSchoolIdState(newSchoolId);

    const loadedTeachers = getStoredTeachers(newSchoolId);
    const loadedSubjects = getStoredSubjects(newSchoolId);
    const loadedStudents = getStoredStudents(newSchoolId);
    const loadedSchedules = getStoredSchedules(newSchoolId);
    const loadedSessions = getStoredSessions(newSchoolId);
    const loadedGrades = getStoredGrades(newSchoolId);
    const loadedPlans = getStoredLessonPlans(newSchoolId);
    const loadedViolations = getStoredViolations(newSchoolId);
    const loadedPayments = getStoredPayments(newSchoolId);
    const loadedDeposits = getStoredCashDeposits(newSchoolId);
    const loadedExpenses = getStoredExpenses(newSchoolId);
    const loadedTariffs = getStoredFeeTariffs(newSchoolId);
    const loadedOfficials = getStoredSchoolOfficials(newSchoolId);
    const loadedWaliKelas = getStoredClassWaliKelas(newSchoolId);
    const loadedBillSettings = getStoredStudentBillSettings(newSchoolId);
    const loadedAnnouncements = getStoredAnnouncements(newSchoolId);
    const loadedInventory = getStoredInventory(newSchoolId);
    const loadedInventoryLogs = getStoredInventoryLogs(newSchoolId);
    const loadedSuratKeluar = getStoredSuratKeluar(newSchoolId);
    const loadedSuratMasuk = getStoredSuratMasuk(newSchoolId);

    setTeachers(loadedTeachers);
    setSubjects(loadedSubjects);
    setStudents(loadedStudents);
    setSchedules(loadedSchedules);
    setSessions(loadedSessions);
    setGrades(loadedGrades);
    setLessonPlans(loadedPlans);
    setViolations(loadedViolations);
    setPayments(loadedPayments);
    setCashDeposits(loadedDeposits);
    setExpenses(loadedExpenses);
    setFeeTariffs(loadedTariffs);
    setSchoolOfficials(loadedOfficials);
    setClassWaliKelas(loadedWaliKelas);
    setBillSettings(loadedBillSettings);
    setAnnouncements(loadedAnnouncements);
    setInventory(loadedInventory);
    setInventoryLogs(loadedInventoryLogs);
    setSuratKeluarList(loadedSuratKeluar);
    setSuratMasukList(loadedSuratMasuk);

    const classes = getClassesForSchool(newSchoolId);
    const nextClass = classes[0] || 'VII A';
    setActiveClass(nextClass);

    const activeTeacherId = getActiveTeacherId(newSchoolId);
    const currentTeacher = loadedTeachers.find(t => t.id === activeTeacherId) || loadedTeachers[0];
    setActiveTeacher(currentTeacher || null);

    if (loadedSubjects.length > 0) {
      setActiveSubject(loadedSubjects[0]);
    }
  };

  // Load Initial Base Master Data
  useEffect(() => {
    const currentSid = getActiveSchoolId();
    const loadedTeachers = getStoredTeachers(currentSid);
    const loadedSubjects = getStoredSubjects(currentSid);
    const loadedStudents = getStoredStudents(currentSid);

    setTeachers(loadedTeachers);
    setSubjects(loadedSubjects);
    setStudents(loadedStudents);

    // Initial fallback data from localStorage
    const loadedSchedules = getStoredSchedules(currentSid);
    setSchedules(loadedSchedules);
    saveSchedules(loadedSchedules, currentSid);
    saveTeachers(loadedTeachers, currentSid);

    setSessions(getStoredSessions(currentSid));
    setGrades(getStoredGrades(currentSid));
    setLessonPlans(getStoredLessonPlans(currentSid));
    setViolations(getStoredViolations(currentSid));
    setPayments(getStoredPayments(currentSid));
    setFeeTariffs(getStoredFeeTariffs(currentSid));
    setSchoolOfficials(getStoredSchoolOfficials(currentSid));
    setClassWaliKelas(getStoredClassWaliKelas(currentSid));
    setBillSettings(getStoredStudentBillSettings(currentSid));
    setAnnouncements(getStoredAnnouncements(currentSid));
    setInventory(getStoredInventory(currentSid));
    setInventoryLogs(getStoredInventoryLogs(currentSid));
    setSuratKeluarList(getStoredSuratKeluar(currentSid));
    setSuratMasukList(getStoredSuratMasuk(currentSid));

    // Active Teacher selection
    const activeTeacherId = getActiveTeacherId(currentSid);
    const currentTeacher = loadedTeachers.find(t => t.id === activeTeacherId) || loadedTeachers[0];
    setActiveTeacher(currentTeacher);

    // Default subject (Matematika / Kejuruan)
    if (loadedSubjects.length > 0) {
      setActiveSubject(loadedSubjects[0]);
    }
  }, []);

  // Subscribe to Realtime Firebase Listeners (Real-time sync across devices & tabs)
  useEffect(() => {
    const handleSubError = (source: string, err: Error) => {
      console.warn(`Using local fallback for ${source}:`, err.message);
      if (err.message && (err.message.includes('Quota') || err.message.includes('quota'))) {
        setIsQuotaExceeded(true);
      }
    };

    const unsubscribeSessions = subscribeAttendanceSessions(
      (realtimeSessions) => {
        setSessions(realtimeSessions);
        saveSessions(realtimeSessions); // Keep local storage backup synced
        setIsFirebaseConnected(true);
      },
      (err) => handleSubError('sessions', err)
    );

    const unsubscribeGrades = subscribeGrades(
      (realtimeGrades) => {
        setGrades(realtimeGrades);
        saveGrades(realtimeGrades);
      },
      (err) => handleSubError('grades', err)
    );

    const unsubscribePlans = subscribeLessonPlans(
      (realtimePlans) => {
        setLessonPlans(realtimePlans);
        saveLessonPlans(realtimePlans);
      },
      (err) => handleSubError('lesson plans', err)
    );

    const unsubscribeOfficials = subscribeSchoolOfficials(
      (realtimeOfficials) => {
        setSchoolOfficials(realtimeOfficials);
        saveSchoolOfficials(realtimeOfficials);
      },
      (err) => handleSubError('school officials', err)
    );

    const unsubscribeWaliKelas = subscribeClassWaliKelas(
      (realtimeWaliKelas) => {
        setClassWaliKelas(realtimeWaliKelas);
        saveClassWaliKelas(realtimeWaliKelas);
      },
      (err) => handleSubError('class wali kelas', err)
    );

    const unsubscribeTeachers = subscribeTeachers(
      (realtimeTeachers) => {
        const { deduplicated } = deduplicateTeachers(realtimeTeachers);
        setTeachers(deduplicated);
        saveTeachers(deduplicated);
        setActiveTeacher((prev) => {
          if (!prev) return deduplicated[0] || null;
          const matched = deduplicated.find(t => t.id === prev.id || t.name === prev.name);
          return matched || deduplicated[0] || prev;
        });
      },
      (err) => handleSubError('teachers', err)
    );

    const unsubscribeSubjects = subscribeSubjects(
      (realtimeSubjects) => {
        setSubjects(realtimeSubjects);
        saveSubjects(realtimeSubjects);
      },
      (err) => handleSubError('subjects', err)
    );

    const unsubscribeStudents = subscribeStudents(
      (realtimeStudents) => {
        setStudents(realtimeStudents);
        saveStudents(realtimeStudents);
      },
      (err) => handleSubError('students', err)
    );

    const unsubscribeViolations = subscribeViolations(
      (realtimeViolations) => {
        setViolations(realtimeViolations);
        saveViolations(realtimeViolations);
      },
      (err) => handleSubError('violations', err)
    );

    const unsubscribePayments = subscribePayments(
      (realtimePayments) => {
        setPayments(realtimePayments);
        savePayments(realtimePayments);
      },
      (err) => handleSubError('payments', err)
    );

    const unsubscribeCashDeposits = subscribeCashDeposits(
      (realtimeDeposits) => {
        setCashDeposits(realtimeDeposits);
        saveCashDeposits(realtimeDeposits);
      },
      (err) => handleSubError('cash deposits', err)
    );

    const unsubscribeExpenses = subscribeTreasurerExpenses(
      (realtimeExpenses) => {
        setExpenses(realtimeExpenses);
        saveExpenses(realtimeExpenses);
      },
      (err) => handleSubError('treasurer expenses', err)
    );

    const unsubscribeTariffs = subscribeFeeTariffs(
      (realtimeTariffs) => {
        setFeeTariffs(realtimeTariffs);
        saveFeeTariffs(realtimeTariffs);
      },
      (err) => handleSubError('fee tariffs', err)
    );

    const unsubscribeAdmin = subscribeAdminSettings(
      (realtimeAdmin) => {
        if (realtimeAdmin) {
          setAdminSettings(realtimeAdmin);
          saveAdminSettings(realtimeAdmin);
        }
      },
      (err) => handleSubError('admin settings', err)
    );

    const unsubscribeBillSettings = subscribeStudentBillSettings(
      (realtimeBills) => {
        if (realtimeBills) {
          setBillSettings(realtimeBills);
          saveStudentBillSettings(realtimeBills);
        }
      },
      (err) => handleSubError('bill settings', err)
    );

    const unsubscribeSchedules = subscribeTeachingSchedules(
      (realtimeSchedules) => {
        setSchedules(realtimeSchedules);
        saveSchedules(realtimeSchedules);
      },
      (err) => handleSubError('teaching schedules', err)
    );

    const unsubscribeAnnouncements = subscribeAnnouncements(
      (realtimeAnnouncements) => {
        setAnnouncements(realtimeAnnouncements);
        saveAnnouncements(realtimeAnnouncements);

        // Check if there is any announcement triggered for push
        if (Array.isArray(realtimeAnnouncements) && realtimeAnnouncements.length > 0) {
          const lastProcessedPush = localStorage.getItem('madrasah_last_processed_push') || '';
          
          // Find active announcement with newest push timestamp or creation
          const latestPushed = realtimeAnnouncements.find(a => 
            a.active && a.pushedAt && a.pushedAt > lastProcessedPush
          );

          if (latestPushed && latestPushed.pushedAt) {
            localStorage.setItem('madrasah_last_processed_push', latestPushed.pushedAt);
            // Trigger push notification banner & loud school broadcast sound
            broadcastAnnouncementPushNotification(latestPushed).catch(console.warn);
            // Automatically open official Announcement Modal popup on teacher's screen
            setActiveModalAnnouncement(latestPushed);
          }
        }
      },
      (err) => handleSubError('announcements', err)
    );

    const unsubscribeInventory = subscribeInventory(
      (realtimeInv) => {
        if (realtimeInv && realtimeInv.length > 0) {
          setInventory(realtimeInv);
          saveInventory(realtimeInv);
        }
      },
      (err) => handleSubError('inventory', err)
    );

    const unsubscribeInventoryLogs = subscribeInventoryLogs(
      (realtimeLogs) => {
        if (realtimeLogs) {
          setInventoryLogs(realtimeLogs);
          saveInventoryLogs(realtimeLogs);
        }
      },
      (err) => handleSubError('inventory logs', err)
    );

    const unsubscribeSuratKeluar = subscribeSuratKeluar(
      (realtimeSuratKeluar) => {
        if (realtimeSuratKeluar) {
          setSuratKeluarList(realtimeSuratKeluar);
          saveSuratKeluar(realtimeSuratKeluar, activeSchoolId);
        }
      },
      (err) => handleSubError('surat keluar', err)
    );

    const unsubscribeSuratMasuk = subscribeSuratMasuk(
      (realtimeSuratMasuk) => {
        if (realtimeSuratMasuk) {
          setSuratMasukList(realtimeSuratMasuk);
          saveSuratMasuk(realtimeSuratMasuk, activeSchoolId);
        }
      },
      (err) => handleSubError('surat masuk', err)
    );

    return () => {
      unsubscribeSessions();
      unsubscribeGrades();
      unsubscribePlans();
      unsubscribeOfficials();
      unsubscribeWaliKelas();
      unsubscribeTeachers();
      unsubscribeSubjects();
      unsubscribeStudents();
      unsubscribeViolations();
      unsubscribePayments();
      unsubscribeCashDeposits();
      unsubscribeExpenses();
      unsubscribeTariffs();
      unsubscribeAdmin();
      unsubscribeBillSettings();
      unsubscribeSchedules();
      unsubscribeAnnouncements();
      unsubscribeInventory();
      unsubscribeInventoryLogs();
      unsubscribeSuratKeluar();
      unsubscribeSuratMasuk();
    };
  }, []);

  // Manual trigger to re-sync attendance sessions by student name (triggered on Sync button or student bulk updates)
  const handleManualResyncAttendance = (customStudents?: Student[]) => {
    const targetStudents = customStudents || students;
    const { healedSessions, updatedCount } = healAndSyncAttendanceSessions(
      sessions,
      targetStudents,
      violations,
      payments
    );
    if (updatedCount > 0) {
      setSessions(healedSessions);
      saveSessions(healedSessions);
      healedSessions.forEach(sess => {
        saveSessionToFirebase(sess).catch(err => console.error('Failed to sync healed session to Firebase:', err));
      });
    }
    return { updatedCount, totalSessions: sessions.length };
  };

  // Synchronize offline attendance queue to Firebase Firestore
  const syncOfflineQueueToFirebase = async (manual = false) => {
    if (isSyncingOfflineQueue) return;
    const queue = getOfflineAttendanceQueue();
    if (queue.length === 0) {
      if (manual) {
        setOfflineToast({
          show: true,
          message: 'Semua data presensi sudah tersinkronkan ke Database Cloud.',
          type: 'info'
        });
        setTimeout(() => setOfflineToast(prev => ({ ...prev, show: false })), 4000);
      }
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (manual) {
        setOfflineToast({
          show: true,
          message: 'Tidak ada koneksi internet. Data tetap tersimpan aman di perangkat dan akan disinkronkan saat online.',
          type: 'warning'
        });
        setTimeout(() => setOfflineToast(prev => ({ ...prev, show: false })), 5000);
      }
      return;
    }

    setIsSyncingOfflineQueue(true);
    let syncedCount = 0;
    const errors: string[] = [];

    for (const item of queue) {
      try {
        // 1. Upload session to Firebase Firestore
        const sessionWithCloudStatus: AttendanceSession = {
          ...item.session,
          isSyncedToCloud: true,
          syncedAt: new Date().toISOString()
        };
        await saveSessionToFirebase(sessionWithCloudStatus);

        // 2. Upload any auto-violations
        if (item.violationsToSave && item.violationsToSave.length > 0) {
          for (const viol of item.violationsToSave) {
            try {
              await saveViolationToFirebase(viol);
            } catch (vErr) {
              console.warn('Auto-violation sync warning:', vErr);
            }
          }
        }
        if (item.violationIdsToDelete && item.violationIdsToDelete.length > 0) {
          for (const vId of item.violationIdsToDelete) {
            try {
              await deleteViolationFromFirebase(vId);
            } catch (vErr) {
              console.warn('Auto-violation delete warning:', vErr);
            }
          }
        }

        // 3. Remove successfully synced item from local queue
        removeOfflineAttendanceItem(item.id);
        syncedCount++;

        // 4. Update in-memory and stored session status
        setSessions(prev => {
          const updated = prev.map(s => s.id === item.session.id ? sessionWithCloudStatus : s);
          saveSessions(updated, item.schoolId || activeSchoolId);
          return updated;
        });
      } catch (err: any) {
        console.error(`Failed to sync offline attendance session ${item.session.id}:`, err);
        errors.push(item.session.className);
      }
    }

    const remainingQueue = getOfflineAttendanceQueue();
    setOfflineQueueCount(remainingQueue.length);
    setIsSyncingOfflineQueue(false);

    if (syncedCount > 0) {
      setOfflineToast({
        show: true,
        message: `✅ Berhasil menyinkronkan ${syncedCount} sesi presensi offline ke Database Cloud!`,
        type: 'success'
      });
      setTimeout(() => setOfflineToast(prev => ({ ...prev, show: false })), 6000);
    } else if (errors.length > 0 && manual) {
      setOfflineToast({
        show: true,
        message: 'Gagal menyinkronkan data ke cloud. Pastikan koneksi internet stabil dan coba lagi.',
        type: 'warning'
      });
      setTimeout(() => setOfflineToast(prev => ({ ...prev, show: false })), 5000);
    }
  };

  // Online / Offline Connectivity & Auto-Sync Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineToast({
        show: true,
        message: '🌐 Koneksi internet kembali aktif! Memeriksa dan menyinkronkan data presensi offline...',
        type: 'info'
      });
      setTimeout(() => setOfflineToast(prev => ({ ...prev, show: false })), 4500);
      syncOfflineQueueToFirebase(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineToast({
        show: true,
        message: '📡 Mode Offline Aktif: Anda tetap dapat mengisi presensi siswa dengan lancar.',
        type: 'warning'
      });
      setTimeout(() => setOfflineToast(prev => ({ ...prev, show: false })), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount: if online and queue has pending items, auto-sync
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const q = getOfflineAttendanceQueue();
      if (q.length > 0) {
        syncOfflineQueueToFirebase(false);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeSchoolId]);

  // Handlers
  const handleSelectTeacher = (teacher: Teacher) => {
    setActiveTeacher(teacher);
    saveActiveTeacherId(teacher.id);

    const teacherSchedule = schedules.find(
      s => s.teacherId === teacher.id || s.teacherName === teacher.name || (teacher.nip && s.teacherNip === teacher.nip)
    );
    if (teacherSchedule) {
      const matchedSubject = subjects.find(
        s => s.id === teacherSchedule.subjectId || s.name === teacherSchedule.subjectName || (teacherSchedule.subjectCode && s.code === teacherSchedule.subjectCode)
      );
      if (matchedSubject) {
        setActiveSubject(matchedSubject);
      }
    }
  };

  const handleSelectSubject = (subject: Subject) => {
    setActiveSubject(subject);
  };

  const handleSelectClass = (className: string) => {
    setActiveClass(className);
  };

  const handleSaveSession = async (newSession: AttendanceSession) => {
    // Enrich entries with studentName and rollNo if available
    const enrichedEntries = newSession.entries.map(entry => {
      const st = students.find(s => s.id === entry.studentId) ||
                 students.find(s => s.name.toLowerCase().trim() === (entry.studentName || '').toLowerCase().trim());
      return {
        ...entry,
        studentId: st ? st.id : entry.studentId,
        studentName: st ? st.name : (entry.studentName || 'Siswa'),
        rollNo: st ? st.rollNo : entry.rollNo
      };
    });

    const isCurrentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : isOnline;

    const sessionToSave: AttendanceSession = {
      ...newSession,
      entries: enrichedEntries,
      isSyncedToCloud: isCurrentlyOnline,
      syncedAt: isCurrentlyOnline ? new Date().toISOString() : undefined
    };

    // Optimistic UI update
    const updated = [sessionToSave, ...sessions.filter(s => s.id !== sessionToSave.id)];
    setSessions(updated);
    saveSessions(updated, activeSchoolId);

    // Auto-add +3 violation points for students marked 'A' (Alpa / tanpa keterangan)
    let currentViolations = [...violations];
    const violationsToSave: StudentViolation[] = [];
    const violationIdsToDelete: string[] = [];

    sessionToSave.entries.forEach(entry => {
      const student = students.find(st => st.id === entry.studentId);
      const studentName = student ? student.name : entry.studentName || 'Siswa';
      const violationId = `viol-alpa-${sessionToSave.className.replace(/\s+/g, '')}-${sessionToSave.subjectId}-${sessionToSave.date}-${entry.studentId}`;

      if (entry.status === 'A') {
        const existingViol = currentViolations.find(v => v.id === violationId);
        const alpaViolation: StudentViolation = {
          id: violationId,
          studentId: entry.studentId,
          studentName: studentName,
          className: sessionToSave.className,
          date: sessionToSave.date,
          violationType: `Tanpa Keterangan / Alpa (${sessionToSave.subjectName})`,
          category: 'Ringan',
          points: 3,
          reporterName: `Sistem Presensi (${sessionToSave.teacherName})`,
          description: `Tidak masuk jam pelajaran ${sessionToSave.subjectName} tanpa keterangan (Alpa) pada Pertemuan ke-${sessionToSave.meetingNumber} (${sessionToSave.periodNumber}). (Otomatis +3 poin)`,
          status: existingViol?.status || 'Baru',
          handledByWaliKelas: existingViol?.handledByWaliKelas || false,
          followUpNote: existingViol?.followUpNote,
          createdAt: existingViol?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        currentViolations = [alpaViolation, ...currentViolations.filter(v => v.id !== violationId)];
        violationsToSave.push(alpaViolation);
      } else {
        const existed = currentViolations.some(v => v.id === violationId);
        if (existed) {
          currentViolations = currentViolations.filter(v => v.id !== violationId);
          violationIdsToDelete.push(violationId);
        }
      }
    });

    if (violationsToSave.length > 0 || violationIdsToDelete.length > 0) {
      setViolations(currentViolations);
      saveViolations(currentViolations, activeSchoolId);

      if (isCurrentlyOnline) {
        for (const viol of violationsToSave) {
          try {
            await saveViolationToFirebase(viol);
          } catch (e) {
            console.error('Failed to save auto violation to Firebase:', e);
          }
        }
        for (const vId of violationIdsToDelete) {
          try {
            await deleteViolationFromFirebase(vId);
          } catch (e) {
            console.error('Failed to delete auto violation from Firebase:', e);
          }
        }
      }
    }

    // Save to Firebase Firestore or queue offline
    if (!isCurrentlyOnline) {
      enqueueOfflineAttendance(sessionToSave, violationsToSave, violationIdsToDelete, activeSchoolId);
      const q = getOfflineAttendanceQueue();
      setOfflineQueueCount(q.length);
      console.log(`[Offline Mode] Presensi kelas ${sessionToSave.className} disimpan lokal. Antrean: ${q.length}`);
    } else {
      try {
        await saveSessionToFirebase(sessionToSave);
      } catch (e) {
        console.warn('Network issue saving session to Firebase, saving to offline queue instead:', e);
        const fallbackSession = { ...sessionToSave, isSyncedToCloud: false };
        setSessions(prev => {
          const up = prev.map(s => s.id === fallbackSession.id ? fallbackSession : s);
          saveSessions(up, activeSchoolId);
          return up;
        });
        enqueueOfflineAttendance(fallbackSession, violationsToSave, violationIdsToDelete, activeSchoolId);
        const q = getOfflineAttendanceQueue();
        setOfflineQueueCount(q.length);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    // Also remove from offline queue if queued
    removeOfflineAttendanceItem(sessionId);
    setOfflineQueueCount(getOfflineAttendanceQueue().length);

    const sessionToDelete = sessions.find(s => s.id === sessionId);
    // Optimistic UI update
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessions(updated, activeSchoolId);

    if (sessionToDelete) {
      const relatedViolations = violations.filter(v =>
        v.id.startsWith(`viol-alpa-${sessionToDelete.className.replace(/\s+/g, '')}-${sessionToDelete.subjectId}-${sessionToDelete.date}-`)
      );

      if (relatedViolations.length > 0) {
        const remainingViolations = violations.filter(v => !relatedViolations.some(rv => rv.id === v.id));
        setViolations(remainingViolations);
        saveViolations(remainingViolations);

        for (const rv of relatedViolations) {
          try {
            await deleteViolationFromFirebase(rv.id);
          } catch (e) {
            console.error('Failed to delete related violation from Firebase:', e);
          }
        }
      }
    }

    // Delete from Firebase Firestore
    try {
      await deleteSessionFromFirebase(sessionId);
    } catch (e) {
      console.error('Failed to delete session from Firebase:', e);
    }
  };

  const handleSaveGrades = async (record: GradeRecord) => {
    const updated = [record, ...grades.filter(g => g.id !== record.id)];
    setGrades(updated);
    saveGrades(updated);

    try {
      await saveGradeToFirebase(record);
    } catch (e) {
      console.error('Failed to save grades to Firebase:', e);
    }
  };

  const handleSaveLessonPlan = async (plan: LessonPlan) => {
    const updated = [plan, ...lessonPlans.filter(p => p.id !== plan.id)];
    setLessonPlans(updated);
    saveLessonPlans(updated);

    try {
      await saveLessonPlanToFirebase(plan);
    } catch (e) {
      console.error('Failed to save lesson plan to Firebase:', e);
    }
  };

  const handleDeleteLessonPlan = async (planId: string) => {
    const updated = lessonPlans.filter(p => p.id !== planId);
    setLessonPlans(updated);
    saveLessonPlans(updated);

    try {
      await deleteLessonPlanFromFirebase(planId);
    } catch (e) {
      console.error('Failed to delete lesson plan from Firebase:', e);
    }
  };

  const handleLockPortal = () => {
    localStorage.removeItem('portal_unlocked_madrasah');
    sessionStorage.removeItem('portal_unlocked_madrasah');
    localStorage.removeItem('portal_locked_student_id');
    sessionStorage.removeItem('portal_locked_student_id');
    localStorage.removeItem('mts_bendahara_unlocked');
    sessionStorage.removeItem('mts_bendahara_unlocked');
    localStorage.removeItem('mts_active_treasurer_id');
    sessionStorage.removeItem('mts_active_treasurer_id');
    setLockedStudentId(null);
    setUserRole('none');
  };

  const handleSaveAcademicSettings = (
    academicYear: string,
    semester: 'Semester Ganjil' | 'Semester Genap'
  ) => {
    const updated = { academicYear, semester };
    setAcademicSettings(updated);
    saveAcademicSettings(updated);
  };

  const handleAddTeacher = async (teacher: Teacher) => {
    const updated = [teacher, ...teachers];
    setTeachers(updated);
    saveTeachers(updated);
    try {
      await saveTeachersToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync teachers to Firebase:', e);
    }
  };

  const handleSaveTeachers = async (updated: Teacher[]) => {
    setTeachers(updated);
    saveTeachers(updated);
    try {
      await saveTeachersToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync teachers list to Firebase:', e);
    }
  };

  const handleEditTeacher = async (updatedTeacher: Teacher) => {
    const updated = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    setTeachers(updated);
    saveTeachers(updated);
    if (activeTeacher?.id === updatedTeacher.id) {
      setActiveTeacher(updatedTeacher);
    }
    try {
      await saveTeachersToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync teachers to Firebase:', e);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    saveTeachers(updated);
    if (activeTeacher?.id === id && updated.length > 0) {
      setActiveTeacher(updated[0]);
      saveActiveTeacherId(updated[0].id);
    }
    try {
      await saveTeachersToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync teachers to Firebase:', e);
    }
  };

  const handleAddSubject = async (subject: Subject) => {
    const updated = [...subjects, subject];
    setSubjects(updated);
    saveSubjects(updated);
    try {
      await saveSubjectsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync subjects to Firebase:', e);
    }
  };

  const handleEditSubject = async (updatedSubject: Subject) => {
    const updated = subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    setSubjects(updated);
    saveSubjects(updated);
    if (activeSubject?.id === updatedSubject.id) {
      setActiveSubject(updatedSubject);
    }
    try {
      await saveSubjectsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync subjects to Firebase:', e);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    saveSubjects(updated);
    if (activeSubject?.id === id && updated.length > 0) {
      setActiveSubject(updated[0]);
    }
    try {
      await saveSubjectsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync subjects to Firebase:', e);
    }
  };

  const handleAddStudent = async (student: Student) => {
    const updated = [...students, student];
    setStudents(updated);
    saveStudents(updated, activeSchoolId);
    try {
      await saveStudentsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync students to Firebase:', e);
    }
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    const updated = students.map(st => st.id === updatedStudent.id ? updatedStudent : st);
    setStudents(updated);
    saveStudents(updated, activeSchoolId);

    // Reconcile attendance sessions if student name or attributes changed
    handleManualResyncAttendance(updated);

    try {
      await saveStudentsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync students to Firebase:', e);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    saveStudents(updated, activeSchoolId);
    try {
      await saveStudentsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync students to Firebase:', e);
    }
  };

  const handleBulkSaveStudents = async (updatedList: Student[]) => {
    setStudents(updatedList);
    saveStudents(updatedList, activeSchoolId);
    
    // Automatically re-link all existing payment records to the new student list
    const syncRes = syncPaymentsWithStudents(payments, updatedList);
    if (syncRes.syncedCount > 0) {
      setPayments(syncRes.updatedPayments);
      savePayments(syncRes.updatedPayments, activeSchoolId);
      for (const p of syncRes.updatedPayments) {
        try {
          await savePaymentToFirebase(p);
        } catch (e) {
          console.error('Failed to sync payment to Firebase:', e);
        }
      }
    }

    // Automatically reconcile attendance sessions when new student list is imported
    handleManualResyncAttendance(updatedList);

    try {
      await saveStudentsToFirebase(updatedList);
    } catch (e) {
      console.error('Failed to sync bulk students to Firebase:', e);
    }
  };

  const handleSyncPayments = async () => {
    const syncRes = syncPaymentsWithStudents(payments, students);
    if (syncRes.syncedCount > 0) {
      setPayments(syncRes.updatedPayments);
      savePayments(syncRes.updatedPayments, activeSchoolId);
      for (const p of syncRes.updatedPayments) {
        try {
          await savePaymentToFirebase(p);
        } catch (e) {
          console.error('Failed to sync payment to Firebase:', e);
        }
      }
    }
    return syncRes;
  };

  const handleDeleteAllStudents = async (classFilter?: string) => {
    let updatedList: Student[];
    if (classFilter && classFilter !== 'ALL') {
      updatedList = students.filter(s => s.className !== classFilter);
    } else {
      updatedList = [];
    }
    setStudents(updatedList);
    saveStudents(updatedList, activeSchoolId);
    try {
      await saveStudentsToFirebase(updatedList);
    } catch (e) {
      console.error('Failed to sync students after delete to Firebase:', e);
    }
  };

  const handleResetDefaultStudents = async () => {
    const defaults = INITIAL_STUDENTS;
    setStudents(defaults);
    saveStudents(defaults, activeSchoolId);

    const syncRes = syncPaymentsWithStudents(payments, defaults);
    if (syncRes.syncedCount > 0) {
      setPayments(syncRes.updatedPayments);
      savePayments(syncRes.updatedPayments, activeSchoolId);
    }

    try {
      await saveStudentsToFirebase(defaults);
    } catch (e) {
      console.error('Failed to sync default students to Firebase:', e);
    }
  };

  const handleAddViolation = async (violation: StudentViolation) => {
    const updated = [violation, ...violations.filter(v => v.id !== violation.id)];
    setViolations(updated);
    saveViolations(updated);
    try {
      await saveViolationToFirebase(violation);
    } catch (e) {
      console.error('Failed to save violation to Firebase:', e);
    }
  };

  const handleUpdateViolationStatus = async (id: string, status: StudentViolation['status'], followUpNote?: string) => {
    const target = violations.find(v => v.id === id);
    if (!target) return;
    const updatedItem: StudentViolation = {
      ...target,
      status,
      followUpNote: followUpNote !== undefined ? followUpNote : target.followUpNote
    };
    const updatedList = violations.map(v => v.id === id ? updatedItem : v);
    setViolations(updatedList);
    saveViolations(updatedList);
    try {
      await saveViolationToFirebase(updatedItem);
    } catch (e) {
      console.error('Failed to update violation status in Firebase:', e);
    }
  };

  const handleToggleViolationHandled = async (id: string, note?: string) => {
    const target = violations.find(v => v.id === id);
    if (!target) return;
    const isHandled = target.handledByWaliKelas || target.status === 'Telah Ditangani';
    const nextHandled = note !== undefined ? (note.trim().length > 0) : !isHandled;

    const updatedItem: StudentViolation = {
      ...target,
      handledByWaliKelas: nextHandled,
      status: nextHandled ? 'Telah Ditangani' : 'Proses Bimbingan',
      followUpNote: note !== undefined ? note : (nextHandled ? target.followUpNote : ''),
      updatedAt: new Date().toISOString()
    };
    const updatedList = violations.map(v => v.id === id ? updatedItem : v);
    setViolations(updatedList);
    saveViolations(updatedList);
    try {
      await saveViolationToFirebase(updatedItem);
    } catch (e) {
      console.error('Failed to toggle violation handled in Firebase:', e);
    }
  };

  const handleDeleteViolation = async (id: string) => {
    const updatedList = violations.filter(v => v.id !== id);
    setViolations(updatedList);
    saveViolations(updatedList);
    try {
      await deleteViolationFromFirebase(id);
    } catch (e) {
      console.error('Failed to delete violation from Firebase:', e);
    }
  };

  const handleSavePayment = async (payment: PaymentTransaction) => {
    const existingIndex = payments.findIndex(p => p.id === payment.id);
    let updated: PaymentTransaction[];
    if (existingIndex >= 0) {
      updated = payments.map(p => p.id === payment.id ? payment : p);
    } else {
      updated = [payment, ...payments];
    }
    setPayments(updated);
    savePayments(updated);
    try {
      await savePaymentToFirebase(payment);
    } catch (e) {
      console.error('Failed to sync payment to Firebase:', e);
    }
  };

  const handleDeletePayment = async (id: string) => {
    const updated = payments.filter(p => p.id !== id);
    setPayments(updated);
    savePayments(updated);
    try {
      await deletePaymentFromFirebase(id);
    } catch (e) {
      console.error('Failed to delete payment from Firebase:', e);
    }
  };

  const handleSaveCashDeposit = async (deposit: CashDepositTransaction) => {
    const existingIndex = cashDeposits.findIndex(d => d.id === deposit.id);
    let updated: CashDepositTransaction[];
    if (existingIndex >= 0) {
      updated = cashDeposits.map(d => d.id === deposit.id ? deposit : d);
    } else {
      updated = [deposit, ...cashDeposits];
    }
    setCashDeposits(updated);
    saveCashDeposits(updated);
    try {
      await saveCashDepositToFirebase(deposit);
    } catch (e) {
      console.error('Failed to sync cash deposit to Firebase:', e);
    }
  };

  const handleDeleteCashDeposit = async (id: string) => {
    const updated = cashDeposits.filter(d => d.id !== id);
    setCashDeposits(updated);
    saveCashDeposits(updated);
    try {
      await deleteCashDepositFromFirebase(id);
    } catch (e) {
      console.error('Failed to delete cash deposit from Firebase:', e);
    }
  };

  const handleSaveExpense = async (expense: TreasurerExpenseTransaction) => {
    const existingIndex = expenses.findIndex(e => e.id === expense.id);
    let updated: TreasurerExpenseTransaction[];
    if (existingIndex >= 0) {
      updated = expenses.map(e => e.id === expense.id ? expense : e);
    } else {
      updated = [expense, ...expenses];
    }
    setExpenses(updated);
    saveExpenses(updated);
    try {
      await saveTreasurerExpenseToFirebase(expense);
    } catch (e) {
      console.error('Failed to sync expense to Firebase:', e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
    try {
      await deleteTreasurerExpenseFromFirebase(id);
    } catch (e) {
      console.error('Failed to delete expense from Firebase:', e);
    }
  };

  // Inventory Management Handlers
  const handleSaveInventoryItem = async (item: InventoryItem) => {
    const existing = inventory.some(i => i.id === item.id);
    const updated = existing
      ? inventory.map(i => i.id === item.id ? item : i)
      : [item, ...inventory];
    setInventory(updated);
    saveInventory(updated, activeSchoolId);
    try {
      await saveInventoryItemToFirebase(item);
    } catch (e) {
      console.error('Failed to sync inventory item to Firebase:', e);
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    const updated = inventory.filter(i => i.id !== itemId);
    setInventory(updated);
    saveInventory(updated, activeSchoolId);
    try {
      await deleteInventoryItemFromFirebase(itemId);
    } catch (e) {
      console.error('Failed to delete inventory item from Firebase:', e);
    }
  };

  const handleSaveInventoryLog = async (log: InventoryMovementLog) => {
    const updated = [log, ...inventoryLogs];
    setInventoryLogs(updated);
    saveInventoryLogs(updated, activeSchoolId);
    try {
      await saveInventoryLogToFirebase(log);
    } catch (e) {
      console.error('Failed to sync inventory log to Firebase:', e);
    }
  };

  const handleDeductStock = async (
    itemId: string,
    quantity: number,
    metadata?: {
      studentId?: string;
      studentName?: string;
      studentClass?: string;
      invoiceNumber?: string;
      treasurerName?: string;
      notes?: string;
      date?: string;
    }
  ) => {
    const res = deductInventoryStock(
      itemId,
      quantity,
      {
        studentId: metadata?.studentId,
        studentName: metadata?.studentName,
        studentClass: metadata?.studentClass,
        invoiceNumber: metadata?.invoiceNumber,
        treasurerName: metadata?.treasurerName || 'Bendahara',
        notes: metadata?.notes,
        date: metadata?.date
      },
      activeSchoolId
    );
    if (res.success && res.item && res.log) {
      const updatedItem = res.item;
      const newLog = res.log;
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      setInventoryLogs(prev => [newLog, ...prev]);
      try {
        await saveInventoryItemToFirebase(updatedItem);
        await saveInventoryLogToFirebase(newLog);
      } catch (e) {
        console.error('Failed to sync stock deduction to Firebase:', e);
      }
    }
  };

  const handleRestockItem = async (
    itemId: string,
    quantity: number,
    metadata?: {
      treasurerName?: string;
      notes?: string;
      supplier?: string;
      date?: string;
      unitPrice?: number;
    }
  ) => {
    const res = restockInventoryItem(
      itemId,
      quantity,
      {
        treasurerName: metadata?.treasurerName || 'Bendahara',
        notes: metadata?.notes || (metadata?.supplier ? `Pemasok: ${metadata.supplier}` : undefined),
        date: metadata?.date,
        unitPrice: metadata?.unitPrice
      },
      activeSchoolId
    );
    if (res.success && res.item && res.log) {
      const updatedItem = res.item;
      const newLog = res.log;
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      setInventoryLogs(prev => [newLog, ...prev]);
      try {
        await saveInventoryItemToFirebase(updatedItem);
        await saveInventoryLogToFirebase(newLog);
      } catch (e) {
        console.error('Failed to sync restock to Firebase:', e);
      }
    }
  };

  const handleSaveFeeTariffs = async (updated: FeeTariffSettings) => {
    setFeeTariffs(updated);
    saveFeeTariffs(updated);
    try {
      await saveFeeTariffsToFirebase(updated);
    } catch (e) {
      console.error('Failed to sync fee tariffs to Firebase:', e);
    }
  };

  const handleSaveBendaharaCode = (code: string) => {
    saveBendaharaCode(code);
  };

  const handleSaveSchedule = async (schedule: TeachingSchedule) => {
    const updated = [schedule, ...schedules.filter(s => s.id !== schedule.id)];
    setSchedules(updated);
    saveSchedules(updated);
    try {
      await saveScheduleToFirebase(schedule);
    } catch (e) {
      console.error('Failed to sync schedule to Firebase:', e);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    saveSchedules(updated);
    try {
      await deleteScheduleFromFirebase(id);
    } catch (e) {
      console.error('Failed to delete schedule from Firebase:', e);
    }
  };

  const handleSaveAllSchedules = async (updatedSchedules: TeachingSchedule[]) => {
    setSchedules(updatedSchedules);
    saveSchedules(updatedSchedules);
    try {
      await saveAllSchedulesToFirebase(updatedSchedules);
    } catch (e) {
      console.error('Failed to sync all schedules to Firebase:', e);
    }
  };

  const handleRestoreFullDatabase = async (data: DatabaseBackupData, mode: 'replace' | 'merge') => {
    let finalStudents = students;
    let finalTeachers = teachers;
    let finalSubjects = subjects;
    let finalOfficials = schoolOfficials;
    let finalClassWaliKelas = classWaliKelas;
    let finalSessions = sessions;
    let finalGrades = grades;
    let finalLessonPlans = lessonPlans;
    let finalViolations = violations;
    let finalPayments = payments;
    let finalCashDeposits = cashDeposits;
    let finalExpenses = expenses;
    let finalTariffs = feeTariffs;
    let finalStudentBills = billSettings;
    let finalAdmin = adminSettings;
    let finalSchedules = schedules;
    let finalAnnouncements = announcements;
    let finalAcademic = academicSettings;
    let finalSuratKeluar = suratKeluarList;
    let finalSuratMasuk = suratMasukList;

    if (mode === 'replace') {
      if (data.students) finalStudents = data.students;
      if (data.teachers) finalTeachers = data.teachers;
      if (data.subjects) finalSubjects = data.subjects;
      if (data.schoolOfficials) finalOfficials = data.schoolOfficials;
      if (data.classWaliKelas) finalClassWaliKelas = data.classWaliKelas;
      if (data.sessions) finalSessions = data.sessions;
      if (data.grades) finalGrades = data.grades;
      if (data.lessonPlans) finalLessonPlans = data.lessonPlans;
      if (data.violations) finalViolations = data.violations;
      if (data.payments) finalPayments = data.payments;
      if (data.cashDeposits) finalCashDeposits = data.cashDeposits;
      if (data.treasurerExpenses) finalExpenses = data.treasurerExpenses;
      if (data.feeTariffs) finalTariffs = data.feeTariffs;
      if (data.studentBillSettings) finalStudentBills = data.studentBillSettings;
      if (data.adminSettings) finalAdmin = data.adminSettings;
      if (data.schedules) finalSchedules = data.schedules;
      if (data.announcements) finalAnnouncements = data.announcements;
      if (data.academicSettings) finalAcademic = data.academicSettings;
      if (data.suratKeluar) finalSuratKeluar = data.suratKeluar;
      if (data.suratMasuk) finalSuratMasuk = data.suratMasuk;
    } else {
      // Merge mode
      if (data.students) {
        const idMap = new Map(students.map(s => [s.id, s]));
        data.students.forEach(s => idMap.set(s.id, s));
        finalStudents = Array.from(idMap.values());
      }
      if (data.teachers) {
        const idMap = new Map(teachers.map(t => [t.id, t]));
        data.teachers.forEach(t => idMap.set(t.id, t));
        finalTeachers = Array.from(idMap.values());
      }
      if (data.subjects) {
        const idMap = new Map(subjects.map(s => [s.id, s]));
        data.subjects.forEach(s => idMap.set(s.id, s));
        finalSubjects = Array.from(idMap.values());
      }
      if (data.schoolOfficials) finalOfficials = { ...schoolOfficials, ...data.schoolOfficials };
      if (data.classWaliKelas) finalClassWaliKelas = { ...classWaliKelas, ...data.classWaliKelas };
      if (data.sessions) {
        const idMap = new Map(sessions.map(s => [s.id, s]));
        data.sessions.forEach(s => idMap.set(s.id, s));
        finalSessions = Array.from(idMap.values());
      }
      if (data.grades) {
        const idMap = new Map(grades.map(g => [g.id, g]));
        data.grades.forEach(g => idMap.set(g.id, g));
        finalGrades = Array.from(idMap.values());
      }
      if (data.lessonPlans) {
        const idMap = new Map(lessonPlans.map(l => [l.id, l]));
        data.lessonPlans.forEach(l => idMap.set(l.id, l));
        finalLessonPlans = Array.from(idMap.values());
      }
      if (data.violations) {
        const idMap = new Map(violations.map(v => [v.id, v]));
        data.violations.forEach(v => idMap.set(v.id, v));
        finalViolations = Array.from(idMap.values());
      }
      if (data.payments) {
        const idMap = new Map(payments.map(p => [p.id, p]));
        data.payments.forEach(p => idMap.set(p.id, p));
        finalPayments = Array.from(idMap.values());
      }
      if (data.cashDeposits) {
        const idMap = new Map(cashDeposits.map(c => [c.id, c]));
        data.cashDeposits.forEach(c => idMap.set(c.id, c));
        finalCashDeposits = Array.from(idMap.values());
      }
      if (data.treasurerExpenses) {
        const idMap = new Map(expenses.map(e => [e.id, e]));
        data.treasurerExpenses.forEach(e => idMap.set(e.id, e));
        finalExpenses = Array.from(idMap.values());
      }
      if (data.feeTariffs) finalTariffs = { ...feeTariffs, ...data.feeTariffs };
      if (data.studentBillSettings) finalStudentBills = { ...billSettings, ...data.studentBillSettings };
      if (data.adminSettings) finalAdmin = { ...adminSettings, ...data.adminSettings };
      if (data.schedules) {
        const idMap = new Map(schedules.map(s => [s.id, s]));
        data.schedules.forEach(s => idMap.set(s.id, s));
        finalSchedules = Array.from(idMap.values());
      }
      if (data.announcements) {
        const idMap = new Map(announcements.map(a => [a.id, a]));
        data.announcements.forEach(a => idMap.set(a.id, a));
        finalAnnouncements = Array.from(idMap.values());
      }
      if (data.suratKeluar) {
        const idMap = new Map(suratKeluarList.map(s => [s.id, s]));
        data.suratKeluar.forEach(s => idMap.set(s.id, s));
        finalSuratKeluar = Array.from(idMap.values());
      }
      if (data.suratMasuk) {
        const idMap = new Map(suratMasukList.map(s => [s.id, s]));
        data.suratMasuk.forEach(s => idMap.set(s.id, s));
        finalSuratMasuk = Array.from(idMap.values());
      }
    }

    // 1. Update React State
    setStudents(finalStudents);
    setTeachers(finalTeachers);
    setSubjects(finalSubjects);
    setSchoolOfficials(finalOfficials);
    setClassWaliKelas(finalClassWaliKelas);
    setSessions(finalSessions);
    setGrades(finalGrades);
    setLessonPlans(finalLessonPlans);
    setViolations(finalViolations);
    setPayments(finalPayments);
    setCashDeposits(finalCashDeposits);
    setExpenses(finalExpenses);
    if (finalTariffs) setFeeTariffs(finalTariffs);
    if (finalStudentBills) setBillSettings(finalStudentBills);
    if (finalAdmin) setAdminSettings(finalAdmin);
    setSchedules(finalSchedules);
    setAnnouncements(finalAnnouncements);
    if (finalAcademic) setAcademicSettings(finalAcademic);
    setSuratKeluarList(finalSuratKeluar);
    setSuratMasukList(finalSuratMasuk);

    const consolidatedData: DatabaseBackupData = {
      metadata: data.metadata || {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        schoolId: activeSchoolId,
        schoolName: currentSchool.name,
        generatedBy: 'Restore Operation',
        type: 'full',
        counts: {
          students: finalStudents.length,
          teachers: finalTeachers.length,
          subjects: finalSubjects.length,
          sessions: finalSessions.length,
          grades: finalGrades.length,
          lessonPlans: finalLessonPlans.length,
          violations: finalViolations.length,
          payments: finalPayments.length,
          cashDeposits: finalCashDeposits.length,
          treasurerExpenses: finalExpenses.length,
          schedules: finalSchedules.length,
          announcements: finalAnnouncements.length,
          suratKeluar: finalSuratKeluar.length,
          suratMasuk: finalSuratMasuk.length
        }
      },
      students: finalStudents,
      teachers: finalTeachers,
      subjects: finalSubjects,
      schoolOfficials: finalOfficials,
      classWaliKelas: finalClassWaliKelas,
      sessions: finalSessions,
      grades: finalGrades,
      lessonPlans: finalLessonPlans,
      violations: finalViolations,
      payments: finalPayments,
      cashDeposits: finalCashDeposits,
      treasurerExpenses: finalExpenses,
      feeTariffs: finalTariffs,
      studentBillSettings: finalStudentBills,
      adminSettings: finalAdmin,
      schedules: finalSchedules,
      announcements: finalAnnouncements,
      suratKeluar: finalSuratKeluar,
      suratMasuk: finalSuratMasuk,
      academicSettings: finalAcademic
    };

    // 2. Save to LocalStorage
    saveFullDatabaseToLocalStorage(consolidatedData, activeSchoolId);

    // 3. Sync to Firebase
    try {
      await restoreFullDatabaseToFirebase(consolidatedData);
    } catch (e) {
      console.error('Failed to sync restored database to Firebase:', e);
    }
  };

  const handleResetDatabase = async (scope: 'all' | 'transactions_only') => {
    if (scope === 'transactions_only') {
      setSessions([]);
      setGrades([]);
      setLessonPlans([]);
      setViolations([]);
      setPayments([]);
      setCashDeposits([]);
      setExpenses([]);

      saveSessions([], activeSchoolId);
      saveGrades([], activeSchoolId);
      saveLessonPlans([], activeSchoolId);
      saveViolations([], activeSchoolId);
      savePayments([], activeSchoolId);
      saveCashDeposits([], activeSchoolId);
      saveTreasurerExpenses([], activeSchoolId);

      try {
        await restoreFullDatabaseToFirebase({
          metadata: {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            schoolId: activeSchoolId,
            schoolName: currentSchool.name,
            generatedBy: 'Reset Transactions',
            type: 'academic',
            counts: {
              students: students.length,
              teachers: teachers.length,
              subjects: subjects.length,
              sessions: 0,
              grades: 0,
              lessonPlans: 0,
              violations: 0,
              payments: 0,
              cashDeposits: 0,
              treasurerExpenses: 0,
              schedules: schedules.length,
              announcements: announcements.length
            }
          },
          sessions: [],
          grades: [],
          lessonPlans: [],
          violations: [],
          payments: [],
          cashDeposits: [],
          treasurerExpenses: []
        });
      } catch (e) {
        console.error('Failed to sync transaction reset to Firebase:', e);
      }
    } else {
      // Reset all to defaults
      const defStudents = INITIAL_STUDENTS;
      const defTeachers = INITIAL_TEACHERS;
      const defSubjects = INITIAL_SUBJECTS;
      const defOfficials = DEFAULT_OFFICIALS;
      const defWaliKelas = DEFAULT_WALI_KELAS;
      const defTariffs = DEFAULT_FEE_TARIFFS;
      const defSchedules = INITIAL_SCHEDULES;

      setStudents(defStudents);
      setTeachers(defTeachers);
      setSubjects(defSubjects);
      setSchoolOfficials(defOfficials);
      setClassWaliKelas(defWaliKelas);
      setSessions([]);
      setGrades([]);
      setLessonPlans([]);
      setViolations([]);
      setPayments([]);
      setCashDeposits([]);
      setExpenses([]);
      setFeeTariffs(defTariffs);
      setSchedules(defSchedules);
      setAnnouncements(DEFAULT_ANNOUNCEMENTS);

      const resetData: DatabaseBackupData = {
        metadata: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          schoolId: activeSchoolId,
          schoolName: currentSchool.name,
          generatedBy: 'Factory Reset',
          type: 'full',
          counts: {
            students: defStudents.length,
            teachers: defTeachers.length,
            subjects: defSubjects.length,
            sessions: 0,
            grades: 0,
            lessonPlans: 0,
            violations: 0,
            payments: 0,
            cashDeposits: 0,
            treasurerExpenses: 0,
            schedules: defSchedules.length,
            announcements: DEFAULT_ANNOUNCEMENTS.length
          }
        },
        students: defStudents,
        teachers: defTeachers,
        subjects: defSubjects,
        schoolOfficials: defOfficials,
        classWaliKelas: defWaliKelas,
        sessions: [],
        grades: [],
        lessonPlans: [],
        violations: [],
        payments: [],
        cashDeposits: [],
        treasurerExpenses: [],
        feeTariffs: defTariffs,
        schedules: defSchedules,
        announcements: DEFAULT_ANNOUNCEMENTS
      };

      saveFullDatabaseToLocalStorage(resetData, activeSchoolId);
      try {
        await restoreFullDatabaseToFirebase(resetData);
      } catch (e) {
        console.error('Failed to sync full reset to Firebase:', e);
      }
    }
  };

  const tabLabels: Record<ActiveTab, string> = {
    absensi: 'Absensi Kehadiran Siswa',
    jadwal: 'Jadwal Pelajaran & Alokasi Jam Mengajar',
    walikelas: 'Menu Wali Kelas & Monitoring Binaan',
    kurikulum: 'Waka Kurikulum & Manajemen Ujian (STS, SAS, Kartu Peserta)',
    pembayaran: 'Pembayaran Siswa & Administrasi Kas Bendahara',
    kesiswaan: 'Catatan Kedisiplinan & Poin BK/Kesiswaan',
    matrix: 'Matriks Kehadiran Guru & Monitoring KBM',
    jurnal: 'Jurnal KBM & Catatan Mengajar',
    penilaian: 'Rekapitulasi Nilai & Evaluasi Siswa',
    modul: 'Penyusunan Modul Ajar / RPP',
    rekap: 'Laporan Rekapitulasi Presensi',
    identitas: 'Identitas Lembaga & Struktur Pejabat',
    tatausaha: 'Bagian Tata Usaha (Pengelolaan Surat & Arsip)',
    datamaster: 'Master Buku Induk Siswa & Pengajar',
    ai: 'Asisten AI Administrasi Guru',
    admin: 'Panel Kontrol Khusus Super Admin'
  };

  if (userRole === 'none') {
    return (
      <PortalGate
        students={students}
        teachers={teachers}
        adminSettings={adminSettings}
        schoolOfficials={schoolOfficials}
        tariffs={feeTariffs}
        activeSchoolId={activeSchoolId}
        onSelectSchool={handleSwitchSchool}
        onUnlock={(role, studentId, treasurerId) => {
          setUserRole(role);
          setLockedStudentId(studentId || null);
          if (role === 'treasurer' && treasurerId) {
            localStorage.setItem('mts_active_treasurer_id', treasurerId);
            sessionStorage.setItem('mts_active_treasurer_id', treasurerId);
            localStorage.setItem('mts_bendahara_unlocked', 'true');
            sessionStorage.setItem('mts_bendahara_unlocked', 'true');
          }
          if (role === 'teacher') {
            setIsTeacherSelectModalOpen(true);
          }
        }}
      />
    );
  }

  if (userRole === 'curriculum') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
        {/* Top Sticky Header for Kurikulum Portal */}
        <header className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white px-4 sm:px-6 py-3 shadow-md sticky top-0 z-30 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-xs shrink-0">
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded-full">
                  Portal Waka Kurikulum & Ujian • {currentSchool.shortName}
                </span>
                <span className="text-[10px] text-slate-300 font-bold hidden sm:inline-block">
                  TP {academicSettings.academicYear} • {academicSettings.semester}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-black text-white leading-tight">
                {currentSchool.name.toUpperCase()} • MANAJEMEN UJIAN & ASESMEN (STS / SAS)
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Pejabat Kurikulum Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="text-left">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider leading-none">
                  Waka Kurikulum
                </p>
                <p className="text-xs font-black text-white leading-tight">
                  {schoolOfficials.kurikulum?.name || 'Waka Kurikulum'}
                </p>
              </div>
            </div>

            {/* Logout / Return to Portal Gate */}
            <button
              onClick={handleLockPortal}
              title="Kunci & Keluar ke Portal Utama"
              className="bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 hover:border-rose-500 text-rose-200 hover:text-white font-black px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 text-xs shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kunci Portal</span>
            </button>
          </div>
        </header>

        {/* Running Announcement Marquee if any */}
        {announcements.some(a => a.active) && (
          <div className="px-4 sm:px-6 pt-2 pb-1 bg-slate-900/5 backdrop-blur-xs">
            <div className="max-w-7xl mx-auto">
              <AnnouncementBanner
                announcements={announcements}
                onOpenModal={(ann) => setActiveModalAnnouncement(ann)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area Rendering KurikulumPortal */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
          <KurikulumPortal
            students={students}
            teachers={teachers}
            subjects={subjects}
            schoolOfficials={schoolOfficials}
            activeSchoolId={activeSchoolId}
            onSwitchSchool={handleSwitchSchool}
            payments={payments}
          />
        </main>
      </div>
    );
  }

  if (userRole === 'treasurer') {
    const storedTreasurerId =
      localStorage.getItem('mts_active_treasurer_id') ||
      sessionStorage.getItem('mts_active_treasurer_id') ||
      'bu';
    const allTreasurers = getAllTreasurers(schoolOfficials);
    const activeTreasurer = allTreasurers.find(t => t.id === storedTreasurerId) || allTreasurers[0];

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-500 selection:text-white">
        {/* Top Sticky Header for Bendahara Portal */}
        <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-3 shadow-md sticky top-0 z-30 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-xs shrink-0">
              <WalletCards className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full">
                  Portal Bendahara • {currentSchool.shortName}
                </span>
                <span className="text-[10px] text-slate-300 font-bold hidden sm:inline-block">
                  TP {academicSettings.academicYear} • {academicSettings.semester}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-black text-white leading-tight">
                {currentSchool.name.toUpperCase()} • ADMINISTRASI KAS & KEUANGAN
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Active Treasurer Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="text-left">
                <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider leading-none">
                  {activeTreasurer?.roleTitle || 'Bendahara'}
                </p>
                <p className="text-xs font-black text-white leading-tight">
                  {activeTreasurer?.name || 'Petugas Keuangan'}
                </p>
              </div>
            </div>

            {/* Logout / Return to Portal Gate */}
            <button
              onClick={handleLockPortal}
              title="Kunci & Keluar ke Portal Utama"
              className="bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 hover:border-rose-500 text-rose-200 hover:text-white font-black px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 text-xs shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kunci Portal</span>
            </button>
          </div>
        </header>

        {/* Running Announcement Marquee if any */}
        {announcements.some(a => a.active) && (
          <div className="px-4 sm:px-6 pt-2 pb-1 bg-slate-900/5 backdrop-blur-xs">
            <div className="max-w-7xl mx-auto">
              <AnnouncementBanner
                announcements={announcements}
                onOpenModal={(ann) => setActiveModalAnnouncement(ann)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area Rendering PembayaranSiswa with all its subtabs */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
          <PembayaranSiswa
            students={students}
            classList={currentClassesList}
            payments={payments}
            tariffs={feeTariffs}
            schoolOfficials={schoolOfficials}
            adminSettings={adminSettings}
            academicYear={academicSettings.academicYear}
            semester={academicSettings.semester}
            billSettings={billSettings}
            cashDeposits={cashDeposits}
            expenses={expenses}
            inventory={inventory}
            inventoryLogs={inventoryLogs}
            onSavePayment={handleSavePayment}
            onDeletePayment={handleDeletePayment}
            onSaveTariffs={handleSaveFeeTariffs}
            onSaveBendaharaCode={handleSaveBendaharaCode}
            onUpdateSchoolOfficials={handleUpdateSchoolOfficials}
            onSaveBillSettings={handleSaveBillSettings}
            onSaveCashDeposit={handleSaveCashDeposit}
            onDeleteCashDeposit={handleDeleteCashDeposit}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onSaveInventoryItem={handleSaveInventoryItem}
            onDeleteInventoryItem={handleDeleteInventoryItem}
            onSaveInventoryLog={handleSaveInventoryLog}
            onDeductStock={handleDeductStock}
            onRestockItem={handleRestockItem}
            onLogout={handleLockPortal}
          />
        </main>
      </div>
    );
  }

  if (userRole === 'parent') {
    return (
      <ParentPortal
        students={students}
        sessions={sessions}
        grades={grades}
        subjects={subjects}
        lessonPlans={lessonPlans}
        classList={currentClassesList}
        academicYear={academicSettings.academicYear}
        semester={academicSettings.semester}
        lockedStudentId={lockedStudentId}
        violations={violations}
        payments={payments}
        tariffs={feeTariffs}
        billSettings={billSettings}
        schoolOfficials={schoolOfficials}
        announcements={announcements}
        onLogout={handleLockPortal}
      />
    );
  }

  if (!activeTeacher || !activeSubject) {
    return (
      <div className="h-screen bg-indigo-950 flex items-center justify-center text-white p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-xs uppercase tracking-wider text-indigo-200">
            Memuat Sistem Administrasi {currentSchool.shortName}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sessionCount={sessions.length}
        todaySessionCount={sessions.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        onOpenInstallPwa={!isAppInstalled ? () => setIsInstallModalOpen(true) : undefined}
        isAutoHide={isSidebarAutoHide}
        onToggleAutoHide={handleToggleSidebarAutoHide}
        offlineQueueCount={offlineQueueCount}
        schoolOfficials={schoolOfficials}
        schoolName={schoolOfficials?.namaSekolah || currentSchool.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-hidden">
        
        {/* Top Header */}
        <Header
          teachers={teachers}
          subjects={subjects}
          activeTeacher={activeTeacher}
          activeSubject={activeSubject}
          activeClass={activeClass}
          activeSchoolId={activeSchoolId}
          onSwitchSchool={handleSwitchSchool}
          onSelectTeacher={handleSelectTeacher}
          onSelectSubject={handleSelectSubject}
          onSelectClass={handleSelectClass}
          classList={currentClassesList}
          activeTabLabel={tabLabels[activeTab]}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLockPortal={handleLockPortal}
          academicYear={academicSettings.academicYear}
          semester={academicSettings.semester}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenTeacherModal={() => setIsTeacherSelectModalOpen(true)}
          onOpenInstallPwa={!isAppInstalled ? () => setIsInstallModalOpen(true) : undefined}
          isAutoHide={isSidebarAutoHide}
          onToggleAutoHide={handleToggleSidebarAutoHide}
          announcements={announcements}
          onOpenAnnouncement={() => {
            const activeList = announcements.filter(a => a.active);
            if (activeList.length > 0) {
              setActiveModalAnnouncement(activeList[0]);
            }
          }}
          isOnline={isOnline}
          offlineQueueCount={offlineQueueCount}
          onSyncOfflineQueue={() => syncOfflineQueueToFirebase(true)}
          isSyncingOfflineQueue={isSyncingOfflineQueue}
        />

        {/* Sticky Running Announcement Marquee at Top (Always visible when scrolling) */}
        {announcements.some(a => a.active) && (
          <div className="sticky top-0 z-20 px-3 sm:px-6 pt-2 pb-1.5 bg-slate-900/10 backdrop-blur-xs shrink-0">
            <div className="max-w-7xl mx-auto">
              <AnnouncementBanner
                announcements={announcements}
                onOpenModal={(ann) => setActiveModalAnnouncement(ann)}
                onNavigateToAdmin={() => setActiveTab('admin')}
              />
            </div>
          </div>
        )}

        {/* Content Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-3 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Install PWA Prompt Banner for Teachers on Phone/Browser */}
            {showInstallBanner && !isAppInstalled && (
              <InstallPwaBanner
                onOpenInstallModal={() => setIsInstallModalOpen(true)}
                onDismiss={handleDismissInstallBanner}
                hasPrompt={Boolean(deferredInstallPrompt)}
              />
            )}

            {/* Notification Permission Request Banner */}
            {showPermissionBanner && (
              <NotificationPermissionBanner
                permission={notificationPermission}
                onRequestPermission={handleRequestNotificationPermission}
                onDismiss={handleDismissPermissionBanner}
              />
            )}

            {isQuotaExceeded && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 font-black text-amber-950 text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Batas Kuota Harian Firestore Terlampaui (Free Quota Exceeded)</span>
                  </div>
                  <button 
                    onClick={() => setIsQuotaExceeded(false)}
                    className="text-amber-700 hover:text-amber-950 font-bold px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 transition text-[11px]"
                  >
                    Tutup
                  </button>
                </div>
                <p className="leading-relaxed">
                  Aplikasi telah beralih otomatis ke <strong>Mode Penyimpanan Lokal (Offline Fallback)</strong>. Semua data tetap dapat dibaca, disimpan, dan diedit dengan lancar tanpa hambatan di browser ini.
                </p>
              </div>
            )}

            {/* Global Offline Mode Notification Banner */}
            {!isOnline && (
              <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3">
                  <span className="p-2 bg-amber-400 text-slate-950 rounded-xl shrink-0 font-black">
                    <WifiOff className="w-5 h-5 text-amber-950" />
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">Mode Offline</span>
                      <span className="text-xs text-amber-800 font-bold">• Absensi Siswa Tetap Berjalan</span>
                    </div>
                    <p className="text-xs text-amber-900 mt-1 font-medium leading-relaxed">
                      Koneksi internet sedang tidak terhubung. Bapak/Ibu Guru tetap dapat mengabsen siswa dan mengisi jurnal mengajar seperti biasa. Data tersimpan aman di perangkat dan akan <strong>otomatis disinkronkan ke Database Cloud</strong> begitu terhubung kembali ke internet.
                    </p>
                  </div>
                </div>
                {offlineQueueCount > 0 && (
                  <div className="shrink-0 flex items-center space-x-2 self-start sm:self-center">
                    <span className="text-xs font-black bg-amber-300 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-400 shadow-2xs">
                      💾 {offlineQueueCount} Data Tersimpan Lokal
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'absensi' && (
              <AbsensiMengajar
                activeTeacher={activeTeacher!}
                activeSubject={activeSubject!}
                subjects={subjects}
                activeClass={activeClass}
                classList={currentClassesList}
                students={students}
                onSaveSession={handleSaveSession}
                savedSessions={sessions}
                schedules={schedules}
                selectedSchedule={selectedScheduleSlot}
                onSelectClass={handleSelectClass}
                onSelectSubject={handleSelectSubject}
                onNavigateToTab={setActiveTab}
                isOnline={isOnline}
                offlineQueueCount={offlineQueueCount}
                isSyncingOfflineQueue={isSyncingOfflineQueue}
                onSyncOfflineQueue={() => syncOfflineQueueToFirebase(true)}
                schoolOfficials={schoolOfficials}
              />
            )}

            {activeTab === 'jadwal' && (
              <JadwalPelajaran
                teachers={teachers}
                subjects={subjects}
                classList={currentClassesList}
                schedules={schedules}
                adminSettings={adminSettings}
                activeTeacher={activeTeacher || teachers[0]}
                activeSubject={activeSubject || subjects[0]}
                schoolOfficials={schoolOfficials}
                academicYear={academicSettings.academicYear}
                semester={academicSettings.semester}
                onSaveSchedule={handleSaveSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onSaveAllSchedules={handleSaveAllSchedules}
                onBulkSaveSchedules={handleSaveAllSchedules}
                onSelectTeacher={(t) => {
                  setActiveTeacher(t);
                  saveActiveTeacherId(t.id, activeSchoolId);
                }}
                onSelectSubject={handleSelectSubject}
                onSelectClass={handleSelectClass}
                onNavigateToTab={setActiveTab}
                onNavigateToAbsensi={(sch) => {
                  const teacher = teachers.find(t => t.id === sch.teacherId || t.name === sch.teacherName || (sch.teacherNip && t.nip === sch.teacherNip));
                  const subject = subjects.find(s => s.id === sch.subjectId || s.name === sch.subjectName || (sch.subjectCode && s.code === sch.subjectCode));
                  if (teacher) {
                    setActiveTeacher(teacher);
                    saveActiveTeacherId(teacher.id, activeSchoolId);
                  }
                  if (subject) {
                    setActiveSubject(subject);
                  }
                  setActiveClass(sch.className);
                  setSelectedScheduleSlot(sch);
                  setActiveTab('absensi');
                }}
                onOpenTeacherModal={() => setIsTeacherSelectModalOpen(true)}
              />
            )}

            {activeTab === 'walikelas' && (
              <WaliKelas
                teachers={teachers}
                subjects={subjects}
                students={students}
                sessions={sessions}
                classList={currentClassesList}
                activeClass={activeClass}
                onSelectClass={handleSelectClass}
                academicYear={academicSettings.academicYear}
                semester={academicSettings.semester}
                schoolOfficials={schoolOfficials}
                classWaliKelas={classWaliKelas}
                violations={violations}
                onToggleViolationHandled={handleToggleViolationHandled}
              />
            )}

            {activeTab === 'kurikulum' && (
              <KurikulumPortal
                students={students}
                teachers={teachers}
                subjects={subjects}
                schoolOfficials={schoolOfficials}
                activeSchoolId={activeSchoolId}
                onSwitchSchool={handleSwitchSchool}
                payments={payments}
              />
            )}

            {activeTab === 'pembayaran' && (
              <PembayaranSiswa
                students={students}
                classList={currentClassesList}
                payments={payments}
                cashDeposits={cashDeposits}
                expenses={expenses}
                tariffs={feeTariffs}
                schoolOfficials={schoolOfficials}
                adminSettings={adminSettings}
                academicYear={academicSettings.academicYear}
                semester={academicSettings.semester}
                billSettings={billSettings}
                onSavePayment={handleSavePayment}
                onDeletePayment={handleDeletePayment}
                onSaveCashDeposit={handleSaveCashDeposit}
                onDeleteCashDeposit={handleDeleteCashDeposit}
                onSaveExpense={handleSaveExpense}
                onDeleteExpense={handleDeleteExpense}
                onSaveTariffs={handleSaveFeeTariffs}
                onSaveBendaharaCode={handleSaveBendaharaCode}
                onUpdateSchoolOfficials={handleUpdateSchoolOfficials}
                onSaveBillSettings={handleSaveBillSettings}
                onSyncPayments={handleSyncPayments}
              />
            )}

            {activeTab === 'kesiswaan' && (
              <Kesiswaan
                students={students}
                teachers={teachers}
                classList={currentClassesList}
                violations={violations}
                onSaveViolation={handleAddViolation}
                onAddViolation={handleAddViolation}
                onDeleteViolation={handleDeleteViolation}
                academicYear={academicSettings.academicYear}
                semester={academicSettings.semester}
                schoolOfficials={schoolOfficials}
                classWaliKelas={classWaliKelas}
              />
            )}

            {activeTab === 'matrix' && (
              <MonitoringMatrix
                sessions={sessions}
                teachers={teachers}
                subjects={subjects}
                students={students}
                classList={currentClassesList}
                onSaveSession={handleSaveSession}
                onDeleteSession={handleDeleteSession}
                onSelectClass={handleSelectClass}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'jurnal' && (
              <JurnalMengajar
                sessions={sessions}
                students={students}
                teachers={teachers}
                activeTeacher={activeTeacher}
                subjects={subjects}
                violations={violations}
                payments={payments}
                onDeleteSession={handleDeleteSession}
                onSelectClass={handleSelectClass}
                onResyncAttendance={handleManualResyncAttendance}
                isOnline={isOnline}
                offlineQueueCount={offlineQueueCount}
                onSyncOfflineQueue={() => syncOfflineQueueToFirebase(true)}
                isSyncingOfflineQueue={isSyncingOfflineQueue}
              />
            )}

            {activeTab === 'penilaian' && (
              <Penilaian
                activeTeacher={activeTeacher}
                activeSubject={activeSubject}
                activeClass={activeClass}
                students={students}
                storedGrades={grades}
                onSaveGrades={handleSaveGrades}
                activeSemester={academicSettings.semester}
                activeAcademicYear={academicSettings.academicYear}
                schoolOfficials={schoolOfficials}
              />
            )}

            {activeTab === 'rekap' && (
              <RekapLaporan
                activeTeacher={activeTeacher}
                activeSubject={activeSubject}
                activeClass={activeClass}
                classList={currentClassesList}
                teachers={teachers}
                subjects={subjects}
                schedules={schedules}
                students={students}
                sessions={sessions}
                schoolOfficials={schoolOfficials}
                violations={violations}
                payments={payments}
                onResyncAttendance={handleManualResyncAttendance}
              />
            )}

            {activeTab === 'datamaster' && (
              <DataMaster
                teachers={teachers}
                subjects={subjects}
                students={students}
                classList={currentClassesList}
                schoolOfficials={schoolOfficials}
                classWaliKelas={classWaliKelas}
                schoolName={currentSchool.name}
                payments={payments}
                onSyncPayments={handleSyncPayments}
                onResyncAttendance={handleManualResyncAttendance}
                onUpdateSchoolOfficials={handleUpdateSchoolOfficials}
                onUpdateClassWaliKelas={handleUpdateClassWaliKelas}
                onAddTeacher={handleAddTeacher}
                onEditTeacher={handleEditTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onAddSubject={handleAddSubject}
                onEditSubject={handleEditSubject}
                onDeleteSubject={handleDeleteSubject}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onBulkSaveStudents={handleBulkSaveStudents}
                onDeleteAllStudents={handleDeleteAllStudents}
                onResetDefaultStudents={handleResetDefaultStudents}
              />
            )}

            {activeTab === 'ai' && (
              <AiAssistant
                activeTeacher={activeTeacher}
                activeSubject={activeSubject}
                activeClass={activeClass}
              />
            )}

            {activeTab === 'identitas' && (
              <IdentitasLembaga
                schoolOfficials={schoolOfficials}
                onSaveOfficials={handleUpdateSchoolOfficials}
                teachers={teachers}
                activeSchoolId={activeSchoolId}
                schoolName={schoolOfficials?.namaSekolah || currentSchool.name}
                onSwitchSchool={handleSwitchSchool}
              />
            )}

            {activeTab === 'tatausaha' && (
              <TataUsaha
                schoolId={activeSchoolId}
                schoolOfficials={schoolOfficials}
                students={students}
                teachers={teachers}
                suratKeluarList={suratKeluarList}
                suratMasukList={suratMasukList}
                onSaveSuratKeluar={handleSaveSuratKeluar}
                onDeleteSuratKeluar={handleDeleteSuratKeluar}
                onSaveSuratMasuk={handleSaveSuratMasuk}
                onDeleteSuratMasuk={handleDeleteSuratMasuk}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                teachers={teachers}
                schoolOfficials={schoolOfficials}
                classWaliKelas={classWaliKelas}
                tariffs={feeTariffs}
                adminSettings={adminSettings}
                announcements={announcements}
                students={students}
                subjects={subjects}
                sessions={sessions}
                grades={grades}
                lessonPlans={lessonPlans}
                violations={violations}
                payments={payments}
                cashDeposits={cashDeposits}
                treasurerExpenses={expenses}
                studentBillSettings={billSettings}
                schedules={schedules}
                schoolId={activeSchoolId}
                schoolName={currentSchool.name}
                academicSettings={academicSettings}
                classList={currentClassesList}
                onSaveAnnouncements={handleSaveAnnouncements}
                onSaveAdminSettings={handleSaveAdminSettings}
                onSaveTeachers={handleSaveTeachers}
                onSaveOfficials={handleUpdateSchoolOfficials}
                onSaveTariffs={handleSaveFeeTariffs}
                onRestoreFullDatabase={handleRestoreFullDatabase}
                onResetDatabase={handleResetDatabase}
              />
            )}

          </div>
        </div>

      </main>

      {/* Mobile Bottom Navigation Bar (Jadwal Pelajaran, Jurnal Mengajar, Monitor Matrix, Portal Absensi Guru, Pasang HP) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        todaySessionCount={sessions.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
        onOpenInstallPwa={!isAppInstalled ? () => setIsInstallModalOpen(true) : undefined}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentAcademicYear={academicSettings.academicYear}
        currentSemester={academicSettings.semester}
        onSave={handleSaveAcademicSettings}
      />

      {/* Pop-up Dialog Guru KBM & Quotes Motivasi saat Refresh / Login */}
      <StartKbmTeacherModal
        isOpen={isTeacherSelectModalOpen}
        onClose={() => setIsTeacherSelectModalOpen(false)}
        teachers={teachers}
        subjects={subjects}
        schedules={schedules}
        activeTeacher={activeTeacher}
        onSelectTeacher={handleSelectTeacher}
        onStartScheduleSession={(sch) => {
          const teacher = teachers.find(t => t.id === sch.teacherId || t.name === sch.teacherName || (sch.teacherNip && t.nip === sch.teacherNip));
          const subject = subjects.find(s => s.id === sch.subjectId || s.name === sch.subjectName || (sch.subjectCode && s.code === sch.subjectCode));
          if (teacher) {
            setActiveTeacher(teacher);
            saveActiveTeacherId(teacher.id, activeSchoolId);
          }
          if (subject) {
            setActiveSubject(subject);
          }
          setActiveClass(sch.className);
          setSelectedScheduleSlot(sch);
          setActiveTab('absensi');
        }}
      />

      {/* Dialog Detail Pesan Pengumuman */}
      <AnnouncementModal
        announcement={activeModalAnnouncement}
        isOpen={Boolean(activeModalAnnouncement)}
        onClose={() => setActiveModalAnnouncement(null)}
      />

      {/* Modal Petunjuk Pasang di Layar HP (PWA) */}
      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredInstallPrompt}
        onInstallSuccess={() => {
          setIsAppInstalled(true);
          setShowInstallBanner(false);
          localStorage.setItem('madrasah_pwa_installed', 'true');
          localStorage.setItem('madrasah_pwa_banner_dismissed', 'true');
        }}
      />

      {/* Floating Offline Sync Notification Toast */}
      {offlineToast.show && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-start space-x-3 transition-all duration-300">
          <div className="mt-0.5 shrink-0">
            {offlineToast.type === 'success' ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            ) : offlineToast.type === 'warning' ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            ) : (
              <span className="flex h-3 w-3 relative">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-100 leading-relaxed">
              {offlineToast.message}
            </p>
            {offlineQueueCount > 0 && !isOnline && (
              <p className="text-[11px] text-amber-300 font-bold mt-1">
                💾 Tersimpan {offlineQueueCount} sesi di memori perangkat
              </p>
            )}
          </div>
          <button
            onClick={() => setOfflineToast(prev => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white text-xs font-bold shrink-0 p-1"
            title="Tutup pemberitahuan"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}


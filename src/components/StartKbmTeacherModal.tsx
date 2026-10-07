import React, { useState, useMemo, useEffect } from 'react';
import { Teacher, Subject, TeachingSchedule } from '../types';
import {
  Sparkles,
  BookOpen,
  UserCheck,
  Search,
  X,
  Quote,
  ArrowRight,
  Clock,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Flame,
  GraduationCap,
  Heart,
  ChevronRight,
  Users
} from 'lucide-react';

interface StartKbmTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  subjects: Subject[];
  schedules: TeachingSchedule[];
  activeTeacher: Teacher | null;
  onSelectTeacher: (teacher: Teacher) => void;
  onStartScheduleSession?: (schedule: TeachingSchedule) => void;
}

interface TeacherQuote {
  quote: string;
  author: string;
  category: 'Motivasi' | 'Keikhlasan' | 'Inspirasi' | 'Keteladanan' | 'Hikmah';
}

const TEACHER_QUOTES: TeacherQuote[] = [
  {
    quote: "Ing ngarsa sung tulada, ing madya mangun karsa, tut wuri handayani. Di depan memberi teladan, di tengah membangun semangat, di belakang memberi dorongan.",
    author: "Ki Hajar Dewantara",
    category: "Keteladanan"
  },
  {
    quote: "Barangsiapa menempuh jalan untuk menuntut ilmu atau mengajarkannya kepada sesama, maka Allah akan memudahkan baginya jalan menuju surga.",
    author: "HR. Muslim",
    category: "Keikhlasan"
  },
  {
    quote: "Mengajar bukan sekadar mentransfer materi pelajaran, melainkan menyalakan lentera harapan, menumbuhkan adab, dan membentuk karakter generasi peradaban.",
    author: "Keluarga Besar Pendidik Madrasah",
    category: "Motivasi"
  },
  {
    quote: "Jika engkau tidak tahan lelahnya mendidik dan belajar, engkau akan menanggung perihnya kebodohan generasi.",
    author: "Imam Asy-Syafi'i (Rahimahullah)",
    category: "Hikmah"
  },
  {
    quote: "Setiap butir ilmu, kesabaran, dan senyuman tulus yang engkau berikan kepada siswa di kelas adalah amal jariyah yang pahalanya mengalir abadi.",
    author: "Nasihat Guru Pendidik",
    category: "Keikhlasan"
  },
  {
    quote: "Pendidik yang hebat tidak sekadar mengisi bejana yang kosong, tetapi mampu menyalakan api rasa ingin tahu dan cinta belajar pada jiwa anak didiknya.",
    author: "William Arthur Ward",
    category: "Inspirasi"
  },
  {
    quote: "Jadilah guru yang dirindukan kehadirannya, didengar nasihatnya, dan diteladani akhlaknya oleh setiap murid.",
    author: "Kearifan Pendidik Islami",
    category: "Keteladanan"
  },
  {
    quote: "Pendidikan adalah bekal terbaik untuk hari esok, dan guru yang berdedikasi adalah arsitek masa depan anak bangsa.",
    author: "B.J. Habibie",
    category: "Motivasi"
  },
  {
    quote: "Mendidik pikiran tanpa mendidik budi pekerti dan hati nurani bukanlah pendidikan sama sekali.",
    author: "Aristoteles",
    category: "Inspirasi"
  }
];

export const StartKbmTeacherModal: React.FC<StartKbmTeacherModalProps> = ({
  isOpen,
  onClose,
  teachers,
  subjects,
  schedules,
  activeTeacher,
  onSelectTeacher,
  onStartScheduleSession
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(activeTeacher?.id || '');
  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  // Pick a randomized quote on open
  useEffect(() => {
    if (isOpen) {
      const randomIndex = Math.floor(Math.random() * TEACHER_QUOTES.length);
      setQuoteIndex(randomIndex);
      if (activeTeacher) {
        setSelectedId(activeTeacher.id);
      }
    }
  }, [isOpen, activeTeacher]);

  const currentQuote = TEACHER_QUOTES[quoteIndex] || TEACHER_QUOTES[0];

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % TEACHER_QUOTES.length);
  };

  // Determine current day name in Indonesian
  const todayDayName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  }, []);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.nip && t.nip.toLowerCase().includes(q)) ||
        (t.kodeUnik && t.kodeUnik.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  // Selected teacher object
  const chosenTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedId) || activeTeacher || teachers[0] || null;
  }, [teachers, selectedId, activeTeacher]);

  // Today's schedule for the selected teacher
  const chosenTeacherTodaySchedules = useMemo(() => {
    if (!chosenTeacher) return [];
    return schedules
      .filter((s) => {
        if (s.day !== todayDayName) return false;
        if (s.teacherId === chosenTeacher.id) return true;
        if (s.teacherName && chosenTeacher.name && s.teacherName.toLowerCase() === chosenTeacher.name.toLowerCase()) return true;
        if (chosenTeacher.id === 't-85829' || chosenTeacher.name.toLowerCase().includes('randi')) {
          return s.teacherId === 't-85829' || s.teacherName.toLowerCase().includes('randi') ||
            (s.className.startsWith('VIII') && ((s.subjectCode && s.subjectCode.toUpperCase() === 'PENJAS') || (s.subjectName && s.subjectName.toLowerCase().includes('jasmani'))));
        }
        if (chosenTeacher.id === 't-85831' || chosenTeacher.name.toLowerCase().includes('andri set') || chosenTeacher.name.toLowerCase().includes('andi set')) {
          return (s.teacherId === 't-85831' || s.teacherName.toLowerCase().includes('andri set') || s.teacherName.toLowerCase().includes('andi set')) && !s.className.startsWith('VIII');
        }
        return false;
      })
      .sort((a, b) => a.periodNumber.localeCompare(b.periodNumber));
  }, [chosenTeacher, schedules, todayDayName]);

  // Total teaching sessions across the week for selected teacher
  const chosenTeacherWeekSessionsCount = useMemo(() => {
    if (!chosenTeacher) return 0;
    return schedules.filter((s) => {
      if (s.teacherId === chosenTeacher.id) return true;
      if (s.teacherName && chosenTeacher.name && s.teacherName.toLowerCase() === chosenTeacher.name.toLowerCase()) return true;
      if (chosenTeacher.id === 't-85829' || chosenTeacher.name.toLowerCase().includes('randi')) {
        return s.teacherId === 't-85829' || s.teacherName.toLowerCase().includes('randi') ||
          (s.className.startsWith('VIII') && ((s.subjectCode && s.subjectCode.toUpperCase() === 'PENJAS') || (s.subjectName && s.subjectName.toLowerCase().includes('jasmani'))));
      }
      if (chosenTeacher.id === 't-85831' || chosenTeacher.name.toLowerCase().includes('andri set') || chosenTeacher.name.toLowerCase().includes('andi set')) {
        return (s.teacherId === 't-85831' || s.teacherName.toLowerCase().includes('andri set') || s.teacherName.toLowerCase().includes('andi set')) && !s.className.startsWith('VIII');
      }
      return false;
    }).length;
  }, [chosenTeacher, schedules]);

  if (!isOpen) return null;

  const handleConfirmTeacher = (teacherToSet?: Teacher) => {
    const t = teacherToSet || chosenTeacher;
    if (t) {
      onSelectTeacher(t);
    }
    onClose();
  };

  return (
    <div
      id="start-kbm-teacher-modal"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-indigo-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
          {/* Decorative Glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 text-indigo-950 flex items-center justify-center font-black shadow-lg shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-400/90 text-indigo-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Konfirmasi Guru KBM
                  </span>
                  <span className="text-xs text-indigo-200 font-bold">• Hari {todayDayName}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                  Siapa yang Akan Mulai Mengajar Hari Ini?
                </h2>
                <p className="text-xs text-indigo-200/90 mt-0.5">
                  Pilih profil nama Bapak/Ibu Guru untuk memastikan materi & presensi masuk ke kelas yang tepat.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/60">
          
          {/* Daily Inspirational Teacher Quote Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-indigo-500/10 border-2 border-amber-300/70 rounded-2xl p-4 sm:p-5 relative shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-indigo-950 flex items-center justify-center font-black shadow-2xs">
                  <Quote className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  Quotes Penyemangat Pendidik
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                  {currentQuote.category}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextQuote}
                className="text-[11px] font-black text-indigo-700 hover:text-indigo-900 bg-white/80 hover:bg-white border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                title="Ganti Kata Mutiara"
              >
                <RefreshCw className="w-3 h-3 text-indigo-600" />
                <span>Ganti Quotes</span>
              </button>
            </div>

            <blockquote className="text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed pl-3 border-l-3 border-amber-400 my-2">
              "{currentQuote.quote}"
            </blockquote>

            <div className="text-right text-[11px] font-black text-slate-600">
              — <span className="text-indigo-900">{currentQuote.author}</span>
            </div>
          </div>

          {/* Teacher Selection Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-indigo-700" />
                <span>Pilih Profil Bapak/Ibu Guru Pengajar:</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                {filteredTeachers.length} Guru Ditemukan
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama guru atau NIP (contoh: Andri, Taufik, Marlina, NIP...)"
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-xs font-bold text-slate-800 focus:outline-none shadow-xs placeholder:font-normal placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Teacher Cards Grid */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto space-y-2 pr-1 rounded-2xl border border-slate-200/80 bg-white p-2.5">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-xs font-bold">Nama guru tidak ditemukan dengan kata kunci "{searchQuery}"</p>
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = t.id === selectedId;
                  // Count today's schedule for this teacher
                  const todayCount = schedules.filter((s) => {
                    if (s.day !== todayDayName) return false;
                    if (s.teacherId === t.id) return true;
                    if (s.teacherName && t.name && s.teacherName.toLowerCase() === t.name.toLowerCase()) return true;
                    if (t.id === 't-85829' || t.name.toLowerCase().includes('randi')) {
                      return s.teacherId === 't-85829' || s.teacherName.toLowerCase().includes('randi') ||
                        (s.className.startsWith('VIII') && ((s.subjectCode && s.subjectCode.toUpperCase() === 'PENJAS') || (s.subjectName && s.subjectName.toLowerCase().includes('jasmani'))));
                    }
                    if (t.id === 't-85831' || t.name.toLowerCase().includes('andri set') || t.name.toLowerCase().includes('andi set')) {
                      return (s.teacherId === 't-85831' || s.teacherName.toLowerCase().includes('andri set') || s.teacherName.toLowerCase().includes('andi set')) && !s.className.startsWith('VIII');
                    }
                    return false;
                  }).length;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-500'
                          : 'border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/90'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                            isSelected
                              ? 'bg-indigo-900 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.name
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-black truncate ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                            {t.name}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                            <span>NIP: {t.nip || '-'}</span>
                            {todayCount > 0 && (
                              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
                                {todayCount} Kelas Hari Ini
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isSelected ? (
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Terpilih</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmTeacher(t);
                            }}
                            className="text-[11px] font-black text-indigo-700 hover:text-white hover:bg-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                          >
                            Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Selection Today Schedule Preview */}
          {chosenTeacher && (
            <div className="bg-indigo-950 text-white rounded-2xl p-4 sm:p-5 space-y-3 shadow-md border border-indigo-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    Konfirmasi Pilihan Guru
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                    {chosenTeacher.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-200 font-bold block">Jadwal Mengajar</span>
                  <span className="text-xs font-black text-emerald-300">
                    {chosenTeacherTodaySchedules.length} Sesi Hari Ini ({todayDayName})
                  </span>
                </div>
              </div>

              {chosenTeacherTodaySchedules.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-indigo-800/80">
                  <p className="text-[11px] text-indigo-200 font-bold">
                    Daftar kelas yang harus diajar hari ini:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {chosenTeacherTodaySchedules.map((sch) => (
                      <div
                        key={`modal-sch-${sch.id}`}
                        className="bg-white/10 hover:bg-white/20 border border-indigo-700/60 rounded-xl p-2.5 flex items-center justify-between transition"
                      >
                        <div>
                          <span className="bg-amber-400 text-indigo-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                            {sch.periodNumber}
                          </span>
                          <p className="text-xs font-bold text-white mt-1">
                            Kelas {sch.className}
                          </p>
                          <p className="text-[10px] text-indigo-200 truncate">
                            {sch.subjectName}
                          </p>
                        </div>
                        {onStartScheduleSession && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTeacher(chosenTeacher);
                              onStartScheduleSession(sch);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-indigo-950 rounded-lg text-[10px] font-black flex items-center space-x-1 shadow-xs transition cursor-pointer"
                            title="Langsung Masuk ke Kelas Ini"
                          >
                            <span>Masuk KBM</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-indigo-200/90 pt-2 border-t border-indigo-800/80">
                  Tidak ada jadwal reguler terdaftar untuk hari {todayDayName}. Bapak/Ibu tetap dapat mengajar jam pengganti atau menginput KBM mandiri melalui Jadwal Pelajaran.
                </p>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-white p-4 sm:p-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Tutup & Lanjutkan
          </button>

          <button
            type="button"
            onClick={() => handleConfirmTeacher()}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Mulai KBM dengan Profil Ini</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

      </div>
    </div>
  );
};

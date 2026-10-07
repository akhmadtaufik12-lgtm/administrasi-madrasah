import React, { useState, useEffect } from 'react';
import { Teacher, Subject, Student, StudentGrade, GradeRecord, SchoolOfficials } from '../types';
import {
  GraduationCap,
  Save,
  FileSpreadsheet,
  Award,
  Search,
  CheckCircle2
} from 'lucide-react';
import { exportToCSV } from '../utils/export';
import { getStoredSchoolOfficials } from '../utils/storage';

interface PenilaianProps {
  activeTeacher: Teacher;
  activeSubject: Subject;
  activeClass: string;
  students: Student[];
  storedGrades: GradeRecord[];
  onSaveGrades: (gradeRecord: GradeRecord) => void;
  activeSemester?: 'Semester Ganjil' | 'Semester Genap';
  activeAcademicYear?: string;
  schoolOfficials?: SchoolOfficials;
}

export const Penilaian: React.FC<PenilaianProps> = ({
  activeTeacher,
  activeSubject,
  activeClass,
  students,
  storedGrades,
  onSaveGrades,
  activeSemester,
  activeAcademicYear,
  schoolOfficials: propSchoolOfficials
}) => {
  const schoolOfficials = propSchoolOfficials || getStoredSchoolOfficials();
  const classStudents = students.filter(s => s.className === activeClass);

  const initialSem: 'Ganjil' | 'Genap' = activeSemester
    ? (activeSemester.includes('Genap') ? 'Genap' : 'Ganjil')
    : 'Ganjil';

  const [gradesMap, setGradesMap] = useState<Record<string, StudentGrade>>({});
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(initialSem);
  const [academicYear, setAcademicYear] = useState(activeAcademicYear || '2026/2027');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (activeAcademicYear) setAcademicYear(activeAcademicYear);
    if (activeSemester) setSemester(activeSemester.includes('Genap') ? 'Genap' : 'Ganjil');
  }, [activeAcademicYear, activeSemester]);

  // Load existing grade record for active class & subject
  useEffect(() => {
    const record = storedGrades.find(
      g => g.className === activeClass && g.subjectId === activeSubject.id && g.semester === semester
    );

    const initial: Record<string, StudentGrade> = {};
    if (record) {
      record.grades.forEach(g => {
        initial[g.studentId] = g;
      });
    } else {
      classStudents.forEach(s => {
        initial[s.id] = { studentId: s.id };
      });
    }
    setGradesMap(initial);
  }, [activeClass, activeSubject.id, semester, storedGrades]);

  const computeFinalGrade = (g: StudentGrade) => {
    const fValues: number[] = [];
    for (let i = 1; i <= 10; i++) {
      const v = g[`formatif${i}`];
      if (typeof v === 'number' && !isNaN(v)) {
        fValues.push(v);
      }
    }

    const sValues: number[] = [];
    for (let i = 1; i <= 10; i++) {
      const v = g[`sumatif${i}`];
      if (typeof v === 'number' && !isNaN(v)) {
        sValues.push(v);
      }
    }

    const fAvg = fValues.length > 0 ? fValues.reduce((a, b) => a + b, 0) / fValues.length : 0;
    const sAvg = sValues.length > 0 ? sValues.reduce((a, b) => a + b, 0) / sValues.length : 0;
    const sts = typeof g.sts === 'number' && !isNaN(g.sts) ? g.sts : 0;
    const sas = typeof g.sas === 'number' && !isNaN(g.sas) ? g.sas : 0;

    let finalVal = 0;
    if (fValues.length > 0 && sValues.length > 0) {
      finalVal = Math.round(fAvg * 0.3 + sAvg * 0.3 + sts * 0.2 + sas * 0.2);
    } else if (fValues.length > 0) {
      finalVal = Math.round(fAvg * 0.4 + sts * 0.3 + sas * 0.3);
    } else if (sValues.length > 0) {
      finalVal = Math.round(sAvg * 0.4 + sts * 0.3 + sas * 0.3);
    } else {
      finalVal = Math.round(sts * 0.5 + sas * 0.5);
    }

    let predicate: 'A' | 'B' | 'C' | 'D' = 'C';
    if (finalVal >= 90) predicate = 'A';
    else if (finalVal >= 80) predicate = 'B';
    else if (finalVal >= 70) predicate = 'C';
    else predicate = 'D';

    const formatifAvg = fValues.length > 0 ? Math.round(fAvg * 10) / 10 : undefined;
    const sumatifTPAvg = sValues.length > 0 ? Math.round(sAvg * 10) / 10 : undefined;

    return { finalVal, predicate, formatifAvg, sumatifTPAvg };
  };

  const handleGradeChange = (studentId: string, field: string, valStr: string) => {
    const numVal = valStr.trim() === '' ? undefined : parseInt(valStr);
    setGradesMap(prev => {
      const current = prev[studentId] || { studentId };
      const updated = { ...current, [field]: numVal };
      const { finalVal, predicate, formatifAvg, sumatifTPAvg } = computeFinalGrade(updated);
      return {
        ...prev,
        [studentId]: {
          ...updated,
          finalGrade: finalVal,
          predicate,
          formatifAvg,
          sumatifTPAvg
        }
      };
    });
  };

  const handleSave = () => {
    const gradeList: StudentGrade[] = classStudents.map(s => {
      const g = gradesMap[s.id] || { studentId: s.id };
      const { finalVal, predicate, formatifAvg, sumatifTPAvg } = computeFinalGrade(g);
      return {
        ...g,
        finalGrade: finalVal,
        predicate,
        formatifAvg,
        sumatifTPAvg
      };
    });

    const record: GradeRecord = {
      id: `grade-${activeClass}-${activeSubject.id}-${semester}`,
      className: activeClass,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      semester,
      academicYear,
      grades: gradeList,
      updatedAt: new Date().toISOString()
    };

    onSaveGrades(record);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExportCSV = () => {
    const fCols = Array.from({ length: 10 }, (_, i) => `F${i + 1}`);
    const sCols = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);

    const rows: (string | number)[][] = [
      [`DAFTAR NILAI - MTS MANBAUL ISLAM`],
      [`Kelas: ${activeClass} | Mata Pelajaran: ${activeSubject.name}`],
      [`Guru: ${activeTeacher.name}`],
      [''],
      ['No', 'Absen', 'Nama Siswa', ...fCols, 'Rata Formatif', ...sCols, 'Rata Sumatif Harian', 'STS', 'SAS', 'Nilai Akhir', 'Predikat']
    ];

    classStudents.forEach((st, idx) => {
      const g = gradesMap[st.id] || { studentId: st.id };
      const { finalVal, predicate, formatifAvg, sumatifTPAvg } = computeFinalGrade(g);

      const fVals = Array.from({ length: 10 }, (_, i) => g[`formatif${i + 1}`] ?? '-');
      const sVals = Array.from({ length: 10 }, (_, i) => g[`sumatif${i + 1}`] ?? '-');

      rows.push([
        idx + 1,
        st.rollNo,
        st.name,
        ...fVals,
        formatifAvg ?? '-',
        ...sVals,
        sumatifTPAvg ?? '-',
        g.sts ?? '-',
        g.sas ?? '-',
        finalVal || '-',
        predicate
      ]);
    });

    const cleanSchoolName = (schoolOfficials?.namaSekolah || 'Madrasah').replace(/[^a-zA-Z0-9]/g, '_');
    exportToCSV(`Nilai_${cleanSchoolName}_${activeClass}_${activeSubject.code}.csv`, rows);
  };

  const filteredStudents = classStudents.filter(
    s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-12">
      
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span className="font-bold text-xs">Nilai Kelas {activeClass} Berhasil Disimpan!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-xs border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Buku Nilai & Asesmen Pembelajaran</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              Penilaian {activeSubject.name} — Kelas {activeClass}
            </h2>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Pengisian Nilai Formatif (F1-F10), Sumatif Harian (S1-S10), STS, dan SAS.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="bg-indigo-800 hover:bg-indigo-700 text-indigo-100 font-bold px-3 py-1.5 rounded-md text-xs flex items-center space-x-1.5 border border-indigo-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-300" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-indigo-200" />
              <span>Simpan Nilai</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Settings */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor absen siswa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-[10px] uppercase text-slate-400">Semester:</span>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value as 'Ganjil' | 'Genap')}
              className="border border-slate-200 rounded px-2 py-1 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="font-bold text-[10px] uppercase text-slate-400">Tahun Ajaran:</span>
            <span className="bg-indigo-50 text-indigo-800 font-extrabold px-2.5 py-1 rounded border border-indigo-200 text-xs">
              {academicYear}
            </span>
          </div>
        </div>

      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh]">
          <table className="w-full text-left border-collapse text-xs min-w-[1400px]">
            <thead className="sticky top-0 z-20 bg-slate-100 shadow-2xs">
              <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-2 w-10 text-center border-r border-slate-200 bg-slate-100 sticky left-0 z-30" rowSpan={2}>No</th>
                <th className="py-2.5 px-2 w-12 text-center border-r border-slate-200 bg-slate-100 sticky left-10 z-30" rowSpan={2}>Absen</th>
                <th className="py-2.5 px-3 border-r border-slate-200 bg-slate-100 sticky left-22 z-30 min-w-[160px]" rowSpan={2}>Nama Siswa</th>

                <th colSpan={10} className="py-1.5 px-2 text-center bg-indigo-100 text-indigo-950 border-r border-indigo-200 font-extrabold text-[11px]">
                  NILAI FORMATIF (F1 - F10)
                </th>
                <th className="py-2 px-2 text-center bg-indigo-200 text-indigo-950 border-r border-slate-200 font-extrabold w-14" rowSpan={2}>Rata F</th>

                <th colSpan={10} className="py-1.5 px-2 text-center bg-emerald-100 text-emerald-950 border-r border-emerald-200 font-extrabold text-[11px]">
                  NILAI SUMATIF HARIAN / LINGKUP MATERI (S1 - S10)
                </th>
                <th className="py-2 px-2 text-center bg-emerald-200 text-emerald-950 border-r border-slate-200 font-extrabold w-14" rowSpan={2}>Rata S</th>

                <th className="py-2 px-2 text-center bg-blue-100 text-blue-950 border-r border-slate-200 font-extrabold w-14" rowSpan={2}>STS</th>
                <th className="py-2 px-2 text-center bg-amber-100 text-amber-950 border-r border-slate-200 font-extrabold w-14" rowSpan={2}>SAS</th>
                <th className="py-2 px-2 text-center bg-indigo-900 text-white font-black w-16" rowSpan={2}>Akhir</th>
                <th className="py-2 px-2 text-center bg-indigo-900 text-white font-black w-14" rowSpan={2}>Predikat</th>
              </tr>
              <tr className="border-b border-slate-200 text-slate-700 font-bold text-[10px] text-center bg-slate-50">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <th key={`fh-${i}`} className="py-1.5 px-1 border-r border-slate-200 w-12 bg-indigo-50/80">F{i}</th>
                ))}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <th key={`sh-${i}`} className="py-1.5 px-1 border-r border-slate-200 w-12 bg-emerald-50/80">S{i}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredStudents.map((st, idx) => {
                const g = gradesMap[st.id] || { studentId: st.id };
                const { finalVal, predicate, formatifAvg, sumatifTPAvg } = computeFinalGrade(g);

                return (
                  <tr key={st.id} className="hover:bg-indigo-50/30 transition group">
                    <td className="py-2 px-2 text-center text-slate-400 font-mono border-r border-slate-100 bg-white group-hover:bg-indigo-50/30 sticky left-0 z-10">{idx + 1}</td>
                    <td className="py-2 px-2 text-center font-bold text-indigo-900 border-r border-slate-100 bg-white group-hover:bg-indigo-50/30 sticky left-10 z-10">{st.rollNo}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-100 bg-white group-hover:bg-indigo-50/30 sticky left-22 z-10 truncate">{st.name}</td>

                    {/* Formatif Inputs F1 - F10 */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
                      const key = `formatif${i}`;
                      const val = g[key];
                      return (
                        <td key={`f-${st.id}-${i}`} className="py-1.5 px-1 text-center border-r border-slate-100">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={val ?? ''}
                            onChange={e => handleGradeChange(st.id, key, e.target.value)}
                            className="w-11 text-center border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white rounded py-1 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder={`F${i}`}
                          />
                        </td>
                      );
                    })}

                    {/* Rata Formatif */}
                    <td className="py-1.5 px-1 text-center font-bold text-indigo-900 bg-indigo-50/50 border-r border-slate-200 text-xs">
                      {formatifAvg ?? '-'}
                    </td>

                    {/* Sumatif Harian Inputs S1 - S10 */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
                      const key = `sumatif${i}`;
                      const val = g[key];
                      return (
                        <td key={`s-${st.id}-${i}`} className="py-1.5 px-1 text-center border-r border-slate-100">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={val ?? ''}
                            onChange={e => handleGradeChange(st.id, key, e.target.value)}
                            className="w-11 text-center border border-slate-200 bg-emerald-50/30 hover:bg-white focus:bg-white rounded py-1 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder={`S${i}`}
                          />
                        </td>
                      );
                    })}

                    {/* Rata Sumatif Harian */}
                    <td className="py-1.5 px-1 text-center font-bold text-emerald-900 bg-emerald-50/50 border-r border-slate-200 text-xs">
                      {sumatifTPAvg ?? '-'}
                    </td>

                    {/* STS */}
                    <td className="py-1.5 px-1 text-center border-r border-slate-100">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={g.sts ?? ''}
                        onChange={e => handleGradeChange(st.id, 'sts', e.target.value)}
                        className="w-11 text-center border border-slate-200 bg-blue-50/40 hover:bg-white focus:bg-white rounded py-1 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="STS"
                      />
                    </td>

                    {/* SAS */}
                    <td className="py-1.5 px-1 text-center border-r border-slate-100">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={g.sas ?? ''}
                        onChange={e => handleGradeChange(st.id, 'sas', e.target.value)}
                        className="w-11 text-center border border-slate-200 bg-amber-50/40 hover:bg-white focus:bg-white rounded py-1 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="SAS"
                      />
                    </td>

                    {/* Nilai Akhir */}
                    <td className="py-2 px-1 text-center font-black text-xs bg-indigo-50/80 text-indigo-950 font-mono border-r border-slate-100">
                      {finalVal || '-'}
                    </td>

                    {/* Predikat */}
                    <td className="py-2 px-1 text-center font-extrabold bg-indigo-50/80">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                        predicate === 'A' ? 'bg-indigo-700 text-white' :
                        predicate === 'B' ? 'bg-indigo-500 text-white' :
                        predicate === 'C' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {predicate}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

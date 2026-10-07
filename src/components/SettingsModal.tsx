import React, { useState } from 'react';
import { Settings, Calendar, Check, X, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAcademicYear: string;
  currentSemester: 'Semester Ganjil' | 'Semester Genap';
  onSave: (academicYear: string, semester: 'Semester Ganjil' | 'Semester Genap') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentAcademicYear,
  currentSemester,
  onSave
}) => {
  const [academicYear, setAcademicYear] = useState(currentAcademicYear);
  const [semester, setSemester] = useState<'Semester Ganjil' | 'Semester Genap'>(currentSemester);
  const [isCustomYear, setIsCustomYear] = useState(false);
  const [customYearInput, setCustomYearInput] = useState('');

  if (!isOpen) return null;

  const presetYears = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalYear = isCustomYear ? customYearInput.trim() : academicYear;
    if (!finalYear) return;
    onSave(finalYear, semester);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-800 rounded-lg text-indigo-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white">
                Pengaturan Aplikasi
              </h3>
              <p className="text-[11px] text-indigo-200 opacity-90">
                Tahun Pelajaran & Semester Aktif
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-slate-800">
          
          {/* Semester Selector */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Semester Aktif <span className="text-indigo-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['Semester Ganjil', 'Semester Genap'] as const).map(sem => {
                const isSelected = semester === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSemester(sem)}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sem}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Year Selector */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Tahun Pelajaran (TP) <span className="text-indigo-600">*</span>
            </label>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              {presetYears.map(year => {
                const isSelected = !isCustomYear && academicYear === year;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setIsCustomYear(false);
                      setAcademicYear(year);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-900 text-white border-indigo-950 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>TP {year}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Year Option */}
            <div className="mt-2">
              {!isCustomYear ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomYear(true);
                    setCustomYearInput(academicYear);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>+ Tambah Tahun Pelajaran Lain</span>
                </button>
              ) : (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Ketik Tahun Pelajaran Kustom:</span>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Contoh: 2028/2029"
                      value={customYearInput}
                      onChange={e => setCustomYearInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomYear(false)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2 text-amber-900 text-[11px]">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Informasi Pengaturan:</p>
              <p className="text-amber-800">
                Pengaturan semester & tahun pelajaran ini akan langsung memperbarui seluruh tampilan header, modul ajar, dan rekap penilaian siswa.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

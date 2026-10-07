import React, { useState } from 'react';
import { Student } from '../types';
import {
  X,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Users,
  CheckCircle2
} from 'lucide-react';

interface DeleteAllStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classList: string[];
  students: Student[];
  schoolName?: string;
  onDeleteAll: (classFilter?: string) => void;
  onResetDefault?: () => void;
}

export const DeleteAllStudentsModal: React.FC<DeleteAllStudentsModalProps> = ({
  isOpen,
  onClose,
  classList,
  students,
  schoolName = 'Madrasah',
  onDeleteAll,
  onResetDefault
}) => {
  const [deleteScope, setDeleteScope] = useState<'all' | 'class'>('all');
  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || 'VII A');
  const [confirmationInput, setConfirmationInput] = useState<string>('');
  const [isResetConfirm, setIsResetConfirm] = useState(false);

  if (!isOpen) return null;

  // Counts
  const totalStudentsCount = students.length;
  const targetClassCount = students.filter(s => s.className === selectedClass).length;
  const countToDelete = deleteScope === 'all' ? totalStudentsCount : targetClassCount;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'HAPUS';

  const handleExecuteDelete = () => {
    if (!isConfirmed) return;
    onDeleteAll(deleteScope === 'all' ? undefined : selectedClass);
    setConfirmationInput('');
    onClose();
  };

  const handleExecuteReset = () => {
    onResetDefault?.();
    setConfirmationInput('');
    onClose();
  };

  // Breakdown per class
  const classBreakdown = classList.map(cls => ({
    className: cls,
    count: students.filter(s => s.className === cls).length
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-950 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/40 text-rose-100 px-2 py-0.5 rounded-full">
                  Peringatan Tindakan Kritis
                </span>
                <span className="text-[10px] text-rose-200 font-bold hidden sm:inline-block">
                  {schoolName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Hapus Data Siswa Madrasah
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          
          {/* Warning Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-rose-950 text-sm">
                Perhatian: Tindakan ini bersifat permanen
              </h4>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Data siswa yang dihapus akan dibersihkan dari penyimpanan lokal dan basis data sekolah. Pastikan Anda telah melakukan ekspor atau pencadangan jika data masih diperlukan.
              </p>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
              Pilih Cakupan Siswa yang Akan Dihapus:
            </label>

            <div className="space-y-2">
              {/* Option 1: All Students */}
              <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                deleteScope === 'all'
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="deleteScope"
                  checked={deleteScope === 'all'}
                  onChange={() => setDeleteScope('all')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">
                      Hapus SEMUA Siswa (Seluruh Kelas)
                    </span>
                    <span className="font-mono text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      {totalStudentsCount} Siswa
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menghapus seluruh daftar siswa di unit sekolah ini dari semua rombel kelas.
                  </p>
                </div>
              </label>

              {/* Option 2: By Class */}
              <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                deleteScope === 'class'
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="deleteScope"
                  checked={deleteScope === 'class'}
                  onChange={() => setDeleteScope('class')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">
                      Hapus Siswa Berdasarkan Kelas Tertentu Saja
                    </span>
                    <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                      {targetClassCount} Siswa
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hanya menghapus siswa di kelas yang dipilih, siswa di kelas lain tetap tersimpan.
                  </p>

                  {deleteScope === 'class' && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200/60">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Pilih Rombel Kelas:
                      </label>
                      <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="w-full bg-white border border-rose-300 rounded-lg px-3 py-1.5 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        {classBreakdown.map(c => (
                          <option key={c.className} value={c.className}>
                            Kelas {c.className} ({c.count} Siswa)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Safety Confirmation Text Input */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-[11px] font-bold text-slate-800">
              Ketik kata <span className="font-mono font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">HAPUS</span> di bawah ini untuk mengonfirmasi:
            </label>
            <input
              type="text"
              placeholder='Ketik "HAPUS"'
              value={confirmationInput}
              onChange={e => setConfirmationInput(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 tracking-wider"
            />
            {confirmationInput && !isConfirmed && (
              <p className="text-[10px] text-rose-600 font-semibold">
                * Kata yang Anda ketik belum cocok (harus tepat "HAPUS")
              </p>
            )}
          </div>

          {/* Reset to Default Starter Option */}
          {onResetDefault && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Ingin memulihkan ke data siswa awal bawaan?
              </div>
              <button
                onClick={handleExecuteReset}
                className="text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-indigo-200 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Bawaan</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium">
            Akan menghapus: <strong className="text-rose-700">{countToDelete} siswa</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              disabled={!isConfirmed || countToDelete === 0}
              onClick={handleExecuteDelete}
              className={`px-5 py-2 font-extrabold rounded-xl text-xs flex items-center space-x-2 transition shadow-xs ${
                isConfirmed && countToDelete > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Sekarang ({countToDelete} Siswa)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

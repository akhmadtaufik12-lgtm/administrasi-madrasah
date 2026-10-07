import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import {
  X,
  User,
  MapPin,
  HeartPulse,
  GraduationCap,
  Users,
  ShieldCheck,
  BookOpen,
  Save,
  CheckCircle2,
  Sparkles,
  Camera,
  AlertCircle
} from 'lucide-react';

interface BukuIndukModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null; // If null => adding new student
  classList: string[];
  defaultClass?: string;
  onSave: (studentData: Student) => void;
}

type TabKey = 'pribadi' | 'alamat' | 'kesehatan' | 'pendidikan' | 'ortu' | 'wali' | 'madrasah';

export const BukuIndukModal: React.FC<BukuIndukModalProps> = ({
  isOpen,
  onClose,
  student,
  classList,
  defaultClass,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('pribadi');

  // Form states
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    if (student) {
      setFormData({ ...student });
    } else {
      const selectedCls = defaultClass || classList[0] || '7-A';
      setFormData({
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        className: selectedCls,
        rollNo: 1,
        name: '',
        gender: 'L',
        nis: '',
        nisn: '',
        kodeUnik: '',
        parentPhone: '',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        statusKeluarga: 'Anak Kandung',
        kategoriSosial: 'Reguler',
        statusSiswa: 'Aktif',
        statusMasuk: 'Siswa Baru',
        tinggalBersama: 'Orang Tua',
        golonganDarah: 'Belum Tahu',
        statusAyah: 'Masih Hidup',
        statusIbu: 'Masih Hidup',
        tanggalMasuk: new Date().toISOString().split('T')[0]
      });
    }
    setActiveTab('pribadi');
  }, [student, isOpen, defaultClass, classList]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateKodeUnik = () => {
    const clsClean = (formData.className || '7A').replace(/[^a-zA-Z0-9]/g, '');
    const rollPadded = String(formData.rollNo || 1).padStart(2, '0');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newCode = `${clsClean}-${rollPadded}${randomSuffix}`;
    handleChange('kodeUnik', newCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Mohon isi Nama Lengkap Siswa terlebih dahulu!');
      setActiveTab('pribadi');
      return;
    }

    // Auto assign kodeUnik if empty
    let finalKode = formData.kodeUnik?.trim();
    if (!finalKode) {
      const clsClean = (formData.className || '7A').replace(/[^a-zA-Z0-9]/g, '');
      const rollPadded = String(formData.rollNo || 1).padStart(2, '0');
      finalKode = `${clsClean}-${rollPadded}${Math.floor(100 + Math.random() * 900)}`;
    }

    const finalStudent: Student = {
      id: formData.id || `st-${Date.now()}`,
      className: formData.className || classList[0] || '7-A',
      rollNo: Number(formData.rollNo) || 1,
      name: formData.name.trim().toUpperCase(),
      gender: formData.gender || 'L',
      nisn: formData.nisn?.trim() || '',
      nis: formData.nis?.trim() || '',
      kodeUnik: finalKode,
      parentPhone: formData.parentPhone?.trim() || '',
      ...formData
    };

    onSave(finalStudent);
    onClose();
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'pribadi', label: 'Identitas Siswa', icon: <User className="w-4 h-4" /> },
    { key: 'alamat', label: 'Alamat & Kontak', icon: <MapPin className="w-4 h-4" /> },
    { key: 'kesehatan', label: 'Jasmani / Kesehatan', icon: <HeartPulse className="w-4 h-4" /> },
    { key: 'pendidikan', label: 'Pendidikan Asal', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'ortu', label: 'Data Orang Tua', icon: <Users className="w-4 h-4" /> },
    { key: 'wali', label: 'Wali & Bantuan Sosial', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'madrasah', label: 'Registrasi Madrasah', icon: <BookOpen className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  {student ? 'Edit Lembar Buku Induk Siswa' : 'Registrasi Baru Buku Induk Siswa'}
                </h3>
                <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Standar Kemenag / Kemdikbud
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {formData.name ? `Peserta Didik: ${formData.name} (Kelas ${formData.className || '-'})` : 'Isi identitas lengkap peserta didik untuk arsip Buku Induk resmi'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center space-x-1 overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-200/60'
              }`}
            >
              <span className={activeTab === tab.key ? 'text-indigo-600' : 'text-slate-400'}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* FORM CONTENT BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: IDENTITAS SISWA */}
          {activeTab === 'pribadi' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-indigo-900">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bagian A: Keterangan Tentang Diri Peserta Didik</p>
                  <p className="text-indigo-800/80 text-[11px] mt-0.5">Pastikan Nama Lengkap, NIS, NISN, dan NIK diisi sesuai dokumen Akta Kelahiran dan Kartu Keluarga resmi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Lengkap Peserta Didik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MUHAMMAD FARHAN AL-FARIZI"
                    value={formData.name || ''}
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Farhan"
                    value={formData.namaPanggilan || ''}
                    onChange={e => handleChange('namaPanggilan', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender || 'L'}
                    onChange={e => handleChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Induk Siswa (NIS Lokal)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 2601001"
                    value={formData.nis || ''}
                    onChange={e => handleChange('nis', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NISN (Nasional)</label>
                  <input
                    type="text"
                    placeholder="10 Digit NISN (Contoh: 0098123456)"
                    value={formData.nisn || ''}
                    onChange={e => handleChange('nisn', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIK Siswa (16 Digit)</label>
                  <input
                    type="text"
                    placeholder="3201xxxxxxxxxxxx"
                    value={formData.nik || ''}
                    onChange={e => handleChange('nik', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    placeholder="3201xxxxxxxxxxxx"
                    value={formData.noKk || ''}
                    onChange={e => handleChange('noKk', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
                  <select
                    value={formData.agama || 'Islam'}
                    onChange={e => handleChange('agama', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bandung"
                    value={formData.tempatLahir || ''}
                    onChange={e => handleChange('tempatLahir', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir || ''}
                    onChange={e => handleChange('tanggalLahir', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kewarganegaraan</label>
                  <select
                    value={formData.kewarganegaraan || 'WNI'}
                    onChange={e => handleChange('kewarganegaraan', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="WNI">Warga Negara Indonesia (WNI)</option>
                    <option value="WNA">Warga Negara Asing (WNA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Anak Ke-</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.anakKe || ''}
                    onChange={e => handleChange('anakKe', parseInt(e.target.value, 10) || undefined)}
                    placeholder="Contoh: 1"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Saudara Kandung</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.jumlahSaudara !== undefined ? formData.jumlahSaudara : ''}
                    onChange={e => handleChange('jumlahSaudara', parseInt(e.target.value, 10) || 0)}
                    placeholder="Contoh: 2"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status dalam Keluarga</label>
                  <select
                    value={formData.statusKeluarga || 'Anak Kandung'}
                    onChange={e => handleChange('statusKeluarga', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Anak Kandung">Anak Kandung</option>
                    <option value="Yatim">Yatim</option>
                    <option value="Piatu">Piatu</option>
                    <option value="Yatim Piatu">Yatim Piatu</option>
                    <option value="Anak Angkat">Anak Angkat</option>
                    <option value="Anak Tiri">Anak Tiri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bahasa Sehari-hari</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bahasa Indonesia / Sunda / Jawa"
                    value={formData.bahasaSehariHari || ''}
                    onChange={e => handleChange('bahasaSehariHari', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link / URL Foto Siswa (Opsional)</label>
                  <input
                    type="url"
                    placeholder="https://... (Foto Pas 3x4)"
                    value={formData.fotoUrl || ''}
                    onChange={e => handleChange('fotoUrl', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALAMAT & KONTAK */}
          {activeTab === 'alamat' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-emerald-950">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bagian B: Keterangan Tempat Tinggal & Kontak</p>
                  <p className="text-emerald-800/80 text-[11px] mt-0.5">Alamat domisili saat ini, jarak ke madrasah, dan nomor kontak aktif orang tua/wali.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap / Jalan / Dusun</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Pesantren No. 12, Kp. Babakan"
                    value={formData.alamat || ''}
                    onChange={e => handleChange('alamat', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RT / RW</label>
                  <input
                    type="text"
                    placeholder="Contoh: 003 / 005"
                    value={formData.rtRw || ''}
                    onChange={e => handleChange('rtRw', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Desa / Kelurahan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sukamaju"
                    value={formData.kelurahan || ''}
                    onChange={e => handleChange('kelurahan', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Cileunyi"
                    value={formData.kecamatan || ''}
                    onChange={e => handleChange('kecamatan', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bandung"
                    value={formData.kabupaten || ''}
                    onChange={e => handleChange('kabupaten', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jawa Barat"
                    value={formData.provinsi || ''}
                    onChange={e => handleChange('provinsi', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    placeholder="Contoh: 40393"
                    value={formData.kodePos || ''}
                    onChange={e => handleChange('kodePos', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tinggal Bersama</label>
                  <select
                    value={formData.tinggalBersama || 'Orang Tua'}
                    onChange={e => handleChange('tinggalBersama', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Orang Tua">Bersama Orang Tua</option>
                    <option value="Wali">Bersama Wali / Kakek / Nenek</option>
                    <option value="Pesantren / Asrama">Pesantren / Asrama</option>
                    <option value="Kost">Kost / Mandiri</option>
                    <option value="Kerabat">Bersama Saudara / Kerabat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jarak Tempat Tinggal ke Madrasah</label>
                  <select
                    value={formData.jarakSekolah || '< 1 km'}
                    onChange={e => handleChange('jarakSekolah', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="< 1 km">Kurang dari 1 km</option>
                    <option value="1 - 3 km">1 s/d 3 km</option>
                    <option value="3 - 5 km">3 s/d 5 km</option>
                    <option value="5 - 10 km">5 s/d 10 km</option>
                    <option value="> 10 km">Lebih dari 10 km</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transportasi ke Madrasah</label>
                  <select
                    value={formData.transportasi || 'Jalan Kaki'}
                    onChange={e => handleChange('transportasi', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Jalan Kaki">Jalan Kaki</option>
                    <option value="Sepeda">Sepeda</option>
                    <option value="Sepeda Motor">Sepeda Motor</option>
                    <option value="Angkutan Umum">Angkutan Umum / Bus</option>
                    <option value="Mobil Pribadi">Mobil Pribadi / Antar Jemput</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp Siswa</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0895xxxxxxxx"
                    value={formData.phone || ''}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    No. HP / WhatsApp Orang Tua / Wali Utama <span className="text-emerald-700 font-extrabold">(Untuk Notifikasi & Portal Wali)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={formData.parentPhone || ''}
                    onChange={e => handleChange('parentPhone', e.target.value)}
                    className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JASMANI / KESEHATAN */}
          {activeTab === 'kesehatan' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-rose-950">
                <HeartPulse className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bagian C: Keterangan Jasmani & Riwayat Kesehatan</p>
                  <p className="text-rose-800/80 text-[11px] mt-0.5">Catatan fisik, golongan darah, tinggi/berat badan, dan kondisi khusus untuk UKS & Guru PJOK.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Golongan Darah</label>
                  <select
                    value={formData.golonganDarah || 'Belum Tahu'}
                    onChange={e => handleChange('golonganDarah', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Belum Tahu">Belum Diketahui</option>
                    <option value="A">Golongan Darah A</option>
                    <option value="B">Golongan Darah B</option>
                    <option value="AB">Golongan Darah AB</option>
                    <option value="O">Golongan Darah O</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    min={50}
                    max={250}
                    placeholder="Contoh: 155"
                    value={formData.tinggiBadan || ''}
                    onChange={e => handleChange('tinggiBadan', parseInt(e.target.value, 10) || undefined)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Berat Badan (kg)</label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    placeholder="Contoh: 45"
                    value={formData.beratBadan || ''}
                    onChange={e => handleChange('beratBadan', parseInt(e.target.value, 10) || undefined)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Riwayat Penyakit Berat / Khusus (Jika Ada)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Asma, Alergi Antibiotik Tertentu, atau Tidak Ada"
                    value={formData.penyakitBerat || ''}
                    onChange={e => handleChange('penyakitBerat', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelainan Jasmani / Disabilitas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tidak Ada / Buta Warna Parsial"
                    value={formData.kelainanJasmani || ''}
                    onChange={e => handleChange('kelainanJasmani', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PENDIDIKAN ASAL */}
          {activeTab === 'pendidikan' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-950">
                <GraduationCap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bagian D: Keterangan Pendidikan Sebelumnya</p>
                  <p className="text-amber-800/80 text-[11px] mt-0.5">Asal SD/MI, nomor ijazah kelulusan, atau riwayat mutasi dari madrasah/sekolah lain.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Masuk</label>
                  <select
                    value={formData.statusMasuk || 'Siswa Baru'}
                    onChange={e => handleChange('statusMasuk', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Siswa Baru">Siswa Baru (Lulusan SD/MI)</option>
                    <option value="Pindahan (Mutasi Masuk)">Pindahan (Mutasi Masuk)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sekolah / Madrasah Asal (SD / MI)</label>
                  <input
                    type="text"
                    placeholder="Contoh: MI Nurul Huda / SDN 1 Sukamaju"
                    value={formData.asalSekolah || ''}
                    onChange={e => handleChange('asalSekolah', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Ijazah SD/MI</label>
                  <input
                    type="text"
                    placeholder="Contoh: DN-02/D-SD/13/001234"
                    value={formData.nomorIjazah || ''}
                    onChange={e => handleChange('nomorIjazah', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor SKHUN / SHUN</label>
                  <input
                    type="text"
                    placeholder="Nomor Sertifikat Hasil Ujian"
                    value={formData.nomorSkhun || ''}
                    onChange={e => handleChange('nomorSkhun', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Peserta Ujian SD/MI</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1-24-02-01-001-2"
                    value={formData.nomorPesertaUjianAsal || ''}
                    onChange={e => handleChange('nomorPesertaUjianAsal', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {formData.statusMasuk === 'Pindahan (Mutasi Masuk)' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-amber-950 mb-1">Nama Madrasah / Sekolah Asal Pindahan</label>
                      <input
                        type="text"
                        placeholder="Contoh: MTs Al-Falah Jakarta"
                        value={formData.asalPindahan || ''}
                        onChange={e => handleChange('asalPindahan', e.target.value)}
                        className="w-full px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-950 mb-1">Alasan Pindah</label>
                      <input
                        type="text"
                        placeholder="Contoh: Mengikuti Orang Tua Pindah Tugas"
                        value={formData.alasanPindah || ''}
                        onChange={e => handleChange('alasanPindah', e.target.value)}
                        className="w-full px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DATA ORANG TUA */}
          {activeTab === 'ortu' && (
            <div className="space-y-6 animate-fade-in">
              {/* DATA AYAH KANDUNG */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                  <User className="w-4 h-4 text-blue-700" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Data Ayah Kandung
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Ayah</label>
                    <input
                      type="text"
                      placeholder="Contoh: ACHMAD HIDAYAT"
                      value={formData.namaAyah || ''}
                      onChange={e => handleChange('namaAyah', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">NIK Ayah (16 Digit)</label>
                    <input
                      type="text"
                      placeholder="3201xxxxxxxxxxxx"
                      value={formData.nikAyah || ''}
                      onChange={e => handleChange('nikAyah', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Keberadaan</label>
                    <select
                      value={formData.statusAyah || 'Masih Hidup'}
                      onChange={e => handleChange('statusAyah', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Meninggal Dunia">Meninggal Dunia (Alm.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tempat/Tgl Lahir / Tahun</label>
                    <input
                      type="text"
                      placeholder="Contoh: Bandung, 1978"
                      value={formData.tempatTanggalLahirAyah || ''}
                      onChange={e => handleChange('tempatTanggalLahirAyah', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                    <select
                      value={formData.pendidikanAyah || 'SMA / Sederajat'}
                      onChange={e => handleChange('pendidikanAyah', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Tidak Sekolah">Tidak Sekolah</option>
                      <option value="SD / MI">SD / MI</option>
                      <option value="SMP / MTs">SMP / MTs</option>
                      <option value="SMA / MA / SMK">SMA / MA / SMK</option>
                      <option value="Diploma (D1-D3)">Diploma (D1 - D3)</option>
                      <option value="Sarjana (S1)">Sarjana (S1)</option>
                      <option value="Magister (S2)">Magister (S2)</option>
                      <option value="Doktor (S3)">Doktor (S3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan Ayah</label>
                    <input
                      type="text"
                      placeholder="Contoh: Wiraswasta / Karyawan"
                      value={formData.pekerjaanAyah || ''}
                      onChange={e => handleChange('pekerjaanAyah', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Penghasilan Bulanan</label>
                    <select
                      value={formData.penghasilanAyah || 'Rp 1.000.000 - Rp 2.000.000'}
                      onChange={e => handleChange('penghasilanAyah', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Kurang dari Rp 1.000.000">Kurang dari Rp 1.000.000</option>
                      <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                      <option value="Rp 2.000.000 - Rp 3.000.000">Rp 2.000.000 - Rp 3.000.000</option>
                      <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                      <option value="Lebih dari Rp 5.000.000">Lebih dari Rp 5.000.000</option>
                      <option value="Tidak Berpenghasilan">Tidak Berpenghasilan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DATA IBU KANDUNG */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                  <User className="w-4 h-4 text-pink-700" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Data Ibu Kandung
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Ibu Kandung</label>
                    <input
                      type="text"
                      placeholder="Contoh: SITI NURHASANAH"
                      value={formData.namaIbu || ''}
                      onChange={e => handleChange('namaIbu', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-pink-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">NIK Ibu (16 Digit)</label>
                    <input
                      type="text"
                      placeholder="3201xxxxxxxxxxxx"
                      value={formData.nikIbu || ''}
                      onChange={e => handleChange('nikIbu', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Keberadaan</label>
                    <select
                      value={formData.statusIbu || 'Masih Hidup'}
                      onChange={e => handleChange('statusIbu', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Meninggal Dunia">Meninggal Dunia (Almh.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tempat/Tgl Lahir / Tahun</label>
                    <input
                      type="text"
                      placeholder="Contoh: Garut, 1982"
                      value={formData.tempatTanggalLahirIbu || ''}
                      onChange={e => handleChange('tempatTanggalLahirIbu', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                    <select
                      value={formData.pendidikanIbu || 'SMA / Sederajat'}
                      onChange={e => handleChange('pendidikanIbu', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="Tidak Sekolah">Tidak Sekolah</option>
                      <option value="SD / MI">SD / MI</option>
                      <option value="SMP / MTs">SMP / MTs</option>
                      <option value="SMA / MA / SMK">SMA / MA / SMK</option>
                      <option value="Diploma (D1-D3)">Diploma (D1 - D3)</option>
                      <option value="Sarjana (S1)">Sarjana (S1)</option>
                      <option value="Magister (S2)">Magister (S2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan Ibu</label>
                    <input
                      type="text"
                      placeholder="Contoh: Ibu Rumah Tangga / Guru / Pedagang"
                      value={formData.pekerjaanIbu || ''}
                      onChange={e => handleChange('pekerjaanIbu', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Penghasilan Bulanan</label>
                    <select
                      value={formData.penghasilanIbu || 'Tidak Berpenghasilan'}
                      onChange={e => handleChange('penghasilanIbu', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="Tidak Berpenghasilan">Tidak Berpenghasilan (IRT)</option>
                      <option value="Kurang dari Rp 1.000.000">Kurang dari Rp 1.000.000</option>
                      <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                      <option value="Rp 2.000.000 - Rp 3.000.000">Rp 2.000.000 - Rp 3.000.000</option>
                      <option value="Lebih dari Rp 3.000.000">Lebih dari Rp 3.000.000</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WALI & BANTUAN SOSIAL */}
          {activeTab === 'wali' && (
            <div className="space-y-6 animate-fade-in">
              {/* BANTUAN SOSIAL & KATEGORI FINANSIAL */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-amber-200">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                    Program Bantuan Sosial & Kategori Finansial Siswa
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1">Kategori Finansial Siswa</label>
                    <select
                      value={formData.kategoriSosial || 'Reguler'}
                      onChange={e => handleChange('kategoriSosial', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-extrabold text-amber-950 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="Reguler">🟢 Siswa Reguler</option>
                      <option value="Duafa">🔵 Siswa Duafa / Keringanan</option>
                      <option value="Yatim">🟠 Siswa Yatim (Bebas Biaya Ulangan)</option>
                      <option value="Beasiswa Prestasi">⭐ Beasiswa Prestasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor KIP (Kartu Indonesia Pintar)</label>
                    <input
                      type="text"
                      placeholder="Nomor KIP jika ada"
                      value={formData.noKip || ''}
                      onChange={e => handleChange('noKip', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor KKS (Kartu Keluarga Sejahtera)</label>
                    <input
                      type="text"
                      placeholder="Nomor KKS jika ada"
                      value={formData.noKks || ''}
                      onChange={e => handleChange('noKks', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor PKH (Program Keluarga Harapan)</label>
                    <input
                      type="text"
                      placeholder="Nomor PKH jika ada"
                      value={formData.noPkh || ''}
                      onChange={e => handleChange('noPkh', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hobi / Kegemaran Khusus</label>
                    <input
                      type="text"
                      placeholder="Contoh: Membaca, Futsal, Tahfidz"
                      value={formData.hobi || ''}
                      onChange={e => handleChange('hobi', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cita-cita</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dokter / Guru / Arsitek / Ulama"
                      value={formData.citaCita || ''}
                      onChange={e => handleChange('citaCita', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* DATA WALI SISWA */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                  <User className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Data Wali Siswa (Jika Tinggal Bersama Wali)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Wali</label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap Wali"
                      value={formData.namaWali || ''}
                      onChange={e => handleChange('namaWali', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan Keluarga</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kakek / Paman / Kakak Kandung"
                      value={formData.hubunganWali || ''}
                      onChange={e => handleChange('hubunganWali', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp Wali</label>
                    <input
                      type="text"
                      placeholder="Contoh: 0813xxxxxxxx"
                      value={formData.hpWali || ''}
                      onChange={e => handleChange('hpWali', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan Wali</label>
                    <input
                      type="text"
                      placeholder="Pekerjaan Wali"
                      value={formData.pekerjaanWali || ''}
                      onChange={e => handleChange('pekerjaanWali', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Tinggal Wali</label>
                    <input
                      type="text"
                      placeholder="Alamat domisili wali jika berbeda"
                      value={formData.alamatWali || ''}
                      onChange={e => handleChange('alamatWali', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: REGISTRASI MADRASAH */}
          {activeTab === 'madrasah' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-indigo-950">
                <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bagian G: Registrasi Administrasi di Madrasah</p>
                  <p className="text-indigo-800/80 text-[11px] mt-0.5">Penempatan rombel kelas, nomor absen, tanggal diterima, serta kode unik portal wali murid.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Rombongan Belajar (Kelas) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.className || classList[0] || '7-A'}
                    onChange={e => handleChange('className', e.target.value)}
                    className="w-full px-3.5 py-2 bg-indigo-50/40 border border-indigo-300 rounded-xl text-xs font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {classList.map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nomor Absen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.rollNo || 1}
                    onChange={e => handleChange('rollNo', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Keaktifan Siswa</label>
                  <select
                    value={formData.statusSiswa || 'Aktif'}
                    onChange={e => handleChange('statusSiswa', e.target.value)}
                    className="w-full px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Aktif">🟢 Siswa Aktif</option>
                    <option value="Lulus">🎓 Sudah Lulus</option>
                    <option value="Mutasi Keluar">🔄 Mutasi Keluar (Pindah Sekolah)</option>
                    <option value="Mengundurkan Diri">⚠️ Mengundurkan Diri / Drop Out</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-indigo-950">Kode Unik Siswa / Ortu</label>
                    <button
                      type="button"
                      onClick={handleGenerateKodeUnik}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Buat Kode</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: 7A-01824"
                    value={formData.kodeUnik || ''}
                    onChange={e => handleChange('kodeUnik', e.target.value)}
                    className="w-full px-3.5 py-2 bg-indigo-50/50 border border-indigo-300 rounded-xl text-xs font-mono font-extrabold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Diterima di Madrasah</label>
                  <input
                    type="date"
                    value={formData.tanggalMasuk || ''}
                    onChange={e => handleChange('tanggalMasuk', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diterima di Kelas Awal</label>
                  <input
                    type="text"
                    placeholder="Contoh: VII (Tujuh)"
                    value={formData.diterimaDiKelas || ''}
                    onChange={e => handleChange('diterimaDiKelas', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Khusus / Prestasi / BK</label>
                  <textarea
                    rows={3}
                    placeholder="Catatan prestasi siswa, riwayat pembinaan, atau catatan administratif penting lainnya..."
                    value={formData.catatanKhusus || ''}
                    onChange={e => handleChange('catatanKhusus', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODAL FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Data otomatis terintegrasi dengan Presensi, Jurnal, Kasir SPP, dan Portal Siswa</span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-800 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{student ? 'Simpan Perubahan Buku Induk' : 'Simpan Peserta Didik Baru'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

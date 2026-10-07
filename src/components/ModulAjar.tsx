import React, { useState } from 'react';
import { Teacher, Subject, LessonPlan, SchoolOfficials } from '../types';
import { FileText, Plus, Sparkles, Printer, Trash2, BookOpen } from 'lucide-react';
import { printFormattedDocument } from '../utils/export';
import { getStoredSchoolOfficials } from '../utils/storage';

interface ModulAjarProps {
  activeTeacher: Teacher;
  activeSubject: Subject;
  activeClass: string;
  lessonPlans: LessonPlan[];
  schoolOfficials?: SchoolOfficials;
  onSavePlan: (plan: LessonPlan) => void;
  onDeletePlan: (planId: string) => void;
}

export const ModulAjar: React.FC<ModulAjarProps> = ({
  activeTeacher,
  activeSubject,
  activeClass,
  lessonPlans,
  schoolOfficials: propSchoolOfficials,
  onSavePlan,
  onDeletePlan
}) => {
  const schoolOfficials = propSchoolOfficials || getStoredSchoolOfficials();
  const [isCreating, setIsCreating] = useState(false);
  const [topic, setTopic] = useState('');
  const [timeAllocation, setTimeAllocation] = useState('2 JP (2 x 40 Menit)');
  const [objectives, setObjectives] = useState('');
  const [pendahuluan, setPendahuluan] = useState('Guru membuka pelajaran dengan salam, doa bersama, dan presensi.');
  const [inti, setInti] = useState('Siswa mendiskusikan materi dalam kelompok, guru memberikan bimbingan.');
  const [penutup, setPenutup] = useState('Guru dan siswa menyimpulkan pembelajaran, berdoa dan salam penutup.');
  const [assessment, setAssessment] = useState('Asesmen Formatif (Keaktifan Diskusi) & Tes Tertulis Singkat.');
  const [mediaAndTools, setMediaAndTools] = useState('Buku Paket MTs, Papan Tulis, Proyektor / LKPD.');

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerateAiRPP = async () => {
    if (!topic.trim()) {
      alert('Mohon isi Topik / Materi Pembelajaran terlebih dahulu untuk digenerate AI.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rpp',
          subject: activeSubject.name,
          className: activeClass,
          topic
        })
      });

      const data = await res.json();
      if (data.result) {
        setObjectives(`Siswa dapat memahami dan menguasai konsep ${topic} pada mata pelajaran ${activeSubject.name}.`);
        setInti(data.result);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal membuat RPP dari AI. Silakan coba lagi.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSave = () => {
    if (!topic.trim()) {
      alert('Mohon isi Topik terlebih dahulu.');
      return;
    }

    const newPlan: LessonPlan = {
      id: `plan-${Date.now()}`,
      teacherId: activeTeacher.id,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      className: activeClass,
      topic,
      timeAllocation,
      learningObjectives: objectives.split('\n').filter(Boolean),
      activities: {
        pendahuluan,
        inti,
        penutup
      },
      assessment,
      mediaAndTools,
      createdAt: new Date().toISOString()
    };

    onSavePlan(newPlan);
    setIsCreating(false);
    setTopic('');
  };

  const filteredPlans = lessonPlans.filter(
    p => p.className === activeClass && p.subjectId === activeSubject.id
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-xs border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Perencanaan Pembelajaran & Modul Ajar</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              Modul Ajar / RPP — {activeSubject.name} ({activeClass})
            </h2>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Penyusunan Perangkat Ajar Kurikulum Merdeka / K13 terintegrasi AI Assistant.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-200" />
            <span>{isCreating ? 'Batal Tambah' : 'Buat Modul Ajar Baru'}</span>
          </button>
        </div>
      </div>

      {/* Form Creating New Plan */}
      {isCreating && (
        <div className="bg-white rounded-xl p-5 border border-indigo-200 shadow-xs space-y-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Formulir Penyusunan Modul Ajar</span>
            </h3>

            <button
              onClick={handleGenerateAiRPP}
              disabled={isGeneratingAi}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isGeneratingAi ? 'Membuat via AI...' : 'Generate AI RPP'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Topik / Judul Modul Pembelajaran *</label>
              <input
                type="text"
                placeholder="Misal: Bab 1 - Rukun Shalat & Syarat Sah"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Alokasi Waktu</label>
              <input
                type="text"
                value={timeAllocation}
                onChange={e => setTimeAllocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Tujuan Pembelajaran (TP)</label>
            <textarea
              rows={2}
              value={objectives}
              onChange={e => setObjectives(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Langkah-Langkah Pembelajaran:</h4>
            
            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-[11px]">1. Pendahuluan</label>
              <textarea
                rows={2}
                value={pendahuluan}
                onChange={e => setPendahuluan(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-[11px]">2. Kegiatan Inti</label>
              <textarea
                rows={4}
                value={inti}
                onChange={e => setInti(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-[11px]">3. Penutup & Refleksi</label>
              <textarea
                rows={2}
                value={penutup}
                onChange={e => setPenutup(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Rencana Asesmen / Penilaian</label>
              <input
                type="text"
                value={assessment}
                onChange={e => setAssessment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Media, Alat & Bahan Ajar</label>
              <input
                type="text"
                value={mediaAndTools}
                onChange={e => setMediaAndTools(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-right pt-2">
            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-1.5 rounded-md text-xs shadow-md transition cursor-pointer"
            >
              Simpan Modul Ajar
            </button>
          </div>
        </div>
      )}

      {/* Lesson Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlans.map(plan => (
          <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 relative hover:border-indigo-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] bg-indigo-50 text-indigo-900 border border-indigo-200 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wide">
                  {plan.subjectName} — {plan.className}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-1.5">{plan.topic}</h3>
                <p className="text-[11px] text-slate-500 font-medium">Alokasi: {plan.timeAllocation}</p>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => printFormattedDocument(`printable-plan-${plan.id}`)}
                  className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition"
                  title="Cetak RPP"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeletePlan(plan.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Hapus Modul"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Tujuan Pembelajaran:</p>
              <p className="text-slate-600 font-medium">{plan.learningObjectives.join(', ') || '-'}</p>
            </div>

            <div className="text-xs text-slate-600 space-y-1 font-medium">
              <p><strong className="text-slate-800">Inti:</strong> {plan.activities.inti}</p>
              <p><strong className="text-slate-800">Asesmen:</strong> {plan.assessment}</p>
            </div>

            {/* Hidden Printable Version */}
            <div className="hidden">
              <div id={`printable-plan-${plan.id}`} className="text-black font-serif">
                <div className="text-center border-b-2 border-black pb-3 mb-4">
                  <h2 className="text-lg font-bold">MTs MANBAUL ISLAM</h2>
                  <h1 className="text-xl font-black">PERANGKAT AJAR / MODUL AJAR (RPP)</h1>
                  <p className="text-xs">Tahun Pelajaran 2026/2027</p>
                </div>

                <div className="text-xs space-y-1 mb-4">
                  <p><strong>Guru Pengajar:</strong> {activeTeacher.name}</p>
                  <p><strong>Mata Pelajaran:</strong> {plan.subjectName}</p>
                  <p><strong>Kelas:</strong> {plan.className}</p>
                  <p><strong>Topik:</strong> {plan.topic}</p>
                  <p><strong>Alokasi Waktu:</strong> {plan.timeAllocation}</p>
                </div>

                <div className="border border-black p-3 text-xs mb-4 space-y-2">
                  <p className="font-bold">A. Tujuan Pembelajaran:</p>
                  <p>{plan.learningObjectives.join('\n')}</p>

                  <p className="font-bold pt-2">B. Langkah Pembelajaran:</p>
                  <p>1. Pendahuluan: {plan.activities.pendahuluan}</p>
                  <p>2. Inti: {plan.activities.inti}</p>
                  <p>3. Penutup: {plan.activities.penutup}</p>

                  <p className="font-bold pt-2">C. Asesmen:</p>
                  <p>{plan.assessment}</p>
                </div>

                <div className="grid grid-cols-2 text-center text-xs mt-12">
                  <div>
                    <p className="mb-14">Mengetahui,<br />Kepala {schoolOfficials?.namaSekolah || 'Madrasah'}</p>
                    <p className="font-bold underline">{schoolOfficials?.kepalaSekolah?.name || 'Kepala Madrasah'}</p>
                    <p>NIP. {schoolOfficials?.kepalaSekolah?.nip || '-'}</p>
                  </div>
                  <div>
                    <p className="mb-14">Guru Mata Pelajaran</p>
                    <p className="font-bold underline">{activeTeacher.name}</p>
                    <p>NIP. {activeTeacher.nip}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}

        {filteredPlans.length === 0 && !isCreating && (
          <div className="col-span-2 bg-white rounded-2xl p-10 text-center border border-gray-200">
            <FileText className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-bold text-gray-800 text-sm">Belum Ada Modul Ajar di Kelas {activeClass}</h3>
            <p className="text-xs text-gray-500 mt-1 mb-3">Klik tombol "Buat Modul Ajar Baru" atau gunakan fitur AI Assistant untuk menyusun RPP otomatis.</p>
          </div>
        )}
      </div>

    </div>
  );
};

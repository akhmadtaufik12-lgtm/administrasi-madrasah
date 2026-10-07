import React, { useState } from 'react';
import { Teacher, Subject } from '../types';
import { Sparkles, Send, BookOpen, HelpCircle, FileText, CheckCircle2, Copy, Check } from 'lucide-react';

interface AiAssistantProps {
  activeTeacher: Teacher;
  activeSubject: Subject;
  activeClass: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  activeTeacher,
  activeSubject,
  activeClass
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const presets = [
    {
      title: 'Buat RPP Modul Ajar',
      icon: FileText,
      query: `Buatkan Modul Ajar KBM ringkas untuk Mata Pelajaran ${activeSubject.name}, Kelas ${activeClass}, mengenai topik pilihan utama semester ini. Sertakan Capaian Pembelajaran, Langkah Inti, dan Asesmen.`
    },
    {
      title: 'Buat 5 Soal Ujian + Kunci',
      icon: HelpCircle,
      query: `Buatkan 5 Soal Pilihan Ganda (PG) dan 2 Soal Uraian untuk Mata Pelajaran ${activeSubject.name} Kelas ${activeClass}, lengkap dengan Kunci Jawaban dan Pembahasan ringkas.`
    },
    {
      title: 'Ide Kegiatan Pembelajaran Interaktif',
      icon: BookOpen,
      query: `Berikan 3 ide metode pembelajaran aktif dan interaktif yang cocok untuk mengajar ${activeSubject.name} di kelas ${activeClass} MTs agar siswa tidak bosan.`
    }
  ];

  const handleSubmit = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim()) return;

    setIsLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit,
          subject: activeSubject.name,
          className: activeClass
        })
      });

      const data = await res.json();
      if (data.result) {
        setResponse(data.result);
      } else {
        setResponse('Terjadi kesalahan saat memproses jawaban dari AI.');
      }
    } catch (e) {
      console.error(e);
      setResponse('Gagal terhubung ke layanan AI Assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-xs border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Asisten Pintar Guru Madrasah</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              Asisten AI Administrasi Guru
            </h2>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Bantuan kecerdasan buatan Gemini untuk menyusun Modul Ajar, Kisi-Kisi Soal Ujian, Rubrik Penilaian, dan Materi Ajar.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {presets.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                setPrompt(p.query);
                handleSubmit(p.query);
              }}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 shadow-2xs text-left transition hover:bg-indigo-50/50 cursor-pointer group"
            >
              <Icon className="w-4 h-4 text-indigo-700 mb-1.5 group-hover:scale-110 transition" />
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">{p.title}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 font-medium">{p.query}</p>
            </button>
          );
        })}
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
        <label className="font-bold text-[10px] uppercase text-slate-400 block tracking-wide">
          Tuliskan Permintaan atau Pertanyaan Pembelajaran Anda:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Misal: Buatkan 3 soal uraian Fiqih tentang zakat fitrah untuk kelas ${activeClass}...`}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-md transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </div>
      </div>

      {/* Result Display Box */}
      {(response || isLoading) && (
        <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-xs space-y-3 relative">
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs uppercase text-indigo-950 tracking-wide">Hasil Tanggapan AI Assistant</h3>
            </div>

            {response && (
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-indigo-800 space-y-2">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold animate-pulse">Sedang menyusun materi pembelajaran untuk Anda...</p>
            </div>
          ) : (
            <div className="prose prose-xs max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed text-xs font-medium">
              {response}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

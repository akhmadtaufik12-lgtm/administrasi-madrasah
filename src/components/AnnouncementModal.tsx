import React from 'react';
import { Announcement } from '../types';
import { getStoredSchoolOfficials } from '../utils/storage';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Flame,
  CheckCircle2,
  X,
  Calendar,
  UserCheck,
  Share2,
  Bell
} from 'lucide-react';

interface AnnouncementModalProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  isOpen,
  onClose
}) => {
  if (!isOpen || !announcement) return null;

  const formattedDate = announcement.createdAt
    ? new Date(announcement.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const getStyleForType = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return {
          headerBg: 'bg-gradient-to-r from-rose-600 to-red-700 text-white',
          badge: 'bg-white text-rose-800',
          badgeBorder: 'border-rose-300',
          icon: <Flame className="w-5 h-5 text-amber-300 animate-bounce" />,
          label: 'PENGUMUMAN DARURAT'
        };
      case 'warning':
        return {
          headerBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
          badge: 'bg-white text-amber-900',
          badgeBorder: 'border-amber-300',
          icon: <AlertTriangle className="w-5 h-5 text-amber-200" />,
          label: 'PERINGATAN RESMI'
        };
      case 'important':
        return {
          headerBg: 'bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-900 text-white',
          badge: 'bg-amber-400 text-slate-950 font-black',
          badgeBorder: 'border-amber-300',
          icon: <Megaphone className="w-5 h-5 text-amber-300" />,
          label: 'PENGUMUMAN PENTING'
        };
      default:
        return {
          headerBg: 'bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white',
          badge: 'bg-blue-100 text-blue-900',
          badgeBorder: 'border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-200" />,
          label: 'INFORMASI MADRASAH'
        };
    }
  };

  const style = getStyleForType(announcement.type);

  const handleShareWhatsApp = () => {
    const schoolName = getStoredSchoolOfficials()?.namaSekolah || 'Madrasah';
    const text = `*PENGUMUMAN MADRASAH - ${schoolName}*\n\n*${announcement.title}*\n\n${announcement.message}\n\n_Diterbitkan oleh: ${announcement.authorName || 'Admin'} (${formattedDate})_`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className={`p-5 relative ${style.headerBg}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                {style.icon}
              </div>
              <span
                className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider shadow-2xs ${style.badge}`}
              >
                {style.label}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
              aria-label="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-black text-white mt-3 tracking-tight leading-snug">
            {announcement.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-2 font-medium">
            {announcement.authorName && (
              <span className="flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-white/60" />
                <span>Oleh: {announcement.authorName}</span>
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-white/60" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100 font-medium">
            {announcement.message}
          </div>

          <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 text-xs text-indigo-900 flex items-start space-x-2.5">
            <Bell className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Pesan ini disiarkan secara resmi oleh <strong>Super Admin Madrasah</strong> untuk seluruh Bapak/Ibu Dewan Guru & Tenaga Kependidikan melalui sistem Banner Berjalan.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan ke WA</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-sm transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-indigo-200" />
            <span>Saya Mengerti / Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

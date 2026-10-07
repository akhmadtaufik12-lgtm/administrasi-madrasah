import React, { useState } from 'react';
import { Announcement } from '../types';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Flame
} from 'lucide-react';

interface AnnouncementBannerProps {
  announcements: Announcement[];
  onOpenModal?: (announcement: Announcement) => void;
  onNavigateToAdmin?: () => void;
  isSuperAdminUnlocked?: boolean;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcements,
  onOpenModal,
  onNavigateToAdmin,
  isSuperAdminUnlocked = false
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const activeAnnouncements = announcements.filter((a) => a.active);

  if (activeAnnouncements.length === 0 || isDismissed) {
    return null;
  }

  // Determine overall badge color depending on highest priority announcement
  const hasUrgent = activeAnnouncements.some((a) => a.type === 'urgent');
  const hasWarning = activeAnnouncements.some((a) => a.type === 'warning');

  const containerTheme = hasUrgent
    ? 'border-rose-400/80 bg-gradient-to-b from-rose-950 via-slate-950 to-rose-950 text-white shadow-rose-950/40'
    : hasWarning
    ? 'border-amber-400/80 bg-gradient-to-b from-amber-950 via-slate-950 to-amber-950 text-white shadow-amber-950/40'
    : 'border-indigo-500/50 bg-gradient-to-b from-slate-950 via-indigo-950/90 to-slate-950 text-white shadow-slate-950/40';

  const getUrgencyBadge = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase shadow-md shrink-0 border border-rose-300">
            <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>DARURAT</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase shadow-md shrink-0 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-950" />
            <span>PERINGATAN</span>
          </span>
        );
      case 'important':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase shadow-md shrink-0 border border-amber-200">
            <Megaphone className="w-4 h-4 text-slate-950" />
            <span>PENTING</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-500 text-white text-xs sm:text-sm font-black px-3 py-1 rounded-full uppercase shadow-md shrink-0 border border-blue-200">
            <Info className="w-4 h-4 text-blue-100" />
            <span>INFORMASI</span>
          </span>
        );
    }
  };

  // Duplicate items array for seamless infinite continuous marquee loop
  const tickerItems =
    activeAnnouncements.length === 1
      ? [...activeAnnouncements, ...activeAnnouncements, ...activeAnnouncements, ...activeAnnouncements]
      : [...activeAnnouncements, ...activeAnnouncements];

  return (
    <div
      id="running-announcement-banner"
      className={`relative rounded-2xl sm:rounded-3xl border-2 shadow-2xl overflow-hidden transition-all duration-300 select-none ${containerTheme}`}
    >
      {/* Decorative background glow accents */}
      <div className="absolute left-0 top-0 w-64 h-full bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-500/15 via-rose-500/10 to-transparent pointer-events-none" />

      {/* =========================================================================
          FULL-WIDTH RUNNING TEXT PENGUMUMAN
          ========================================================================= */}
      <div
        className="w-full overflow-hidden relative py-3 sm:py-3.5 px-3 cursor-pointer bg-slate-950/70 flex items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        title="Klik pengumuman untuk membaca detail lengkap (Arahkan kursor / sentuh untuk menjeda)"
      >
        <div className={`animate-marquee ${isPaused ? 'pause-marquee' : ''} flex items-center space-x-16 sm:space-x-20`}>
          {tickerItems.map((ann, idx) => {
            const formattedDate = ann.createdAt
              ? new Date(ann.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : '';

            return (
              <div
                key={`${ann.id}-${idx}`}
                onClick={() => onOpenModal && onOpenModal(ann)}
                className="inline-flex items-center space-x-4 text-base sm:text-lg lg:text-xl text-white hover:text-amber-200 transition group cursor-pointer shrink-0 py-0.5"
              >
                {getUrgencyBadge(ann.type)}

                <span className="font-black text-white tracking-tight group-hover:underline group-hover:text-amber-300 drop-shadow-md">
                  {ann.title}
                </span>

                <span className="text-white/95 font-medium max-w-xl lg:max-w-3xl truncate">
                  — {ann.message}
                </span>

                {ann.authorName && (
                  <span className="text-xs sm:text-sm text-amber-300 font-bold bg-white/15 px-3 py-0.5 rounded-lg border border-white/15">
                    Oleh: {ann.authorName}
                  </span>
                )}

                {formattedDate && (
                  <span className="text-xs sm:text-sm text-white/70 font-semibold">
                    ({formattedDate})
                  </span>
                )}

                <span className="text-amber-400 font-black px-4 text-xl opacity-80">✦</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

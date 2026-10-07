import { Announcement } from '../types';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Register Service Worker for PWA and Web Push
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('Service Worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Check if Web Notifications are supported in the current environment
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('madrasah_notification_permission', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Play a loud, clear, and resonant school broadcast chime using Web Audio API
 */
export function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master Gain & Dynamics (Loud & Clear without distortion)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);
    masterGain.connect(ctx.destination);

    // Chime Notes: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.5Hz)
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.4 },  // C5
      { freq: 659.25, time: 0.2, dur: 0.4 },  // E5
      { freq: 783.99, time: 0.4, dur: 0.5 },  // G5
      { freq: 1046.5, time: 0.65, dur: 1.1 }  // C6 (resonant finale)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const noteStartTime = now + time;
      const noteEndTime = noteStartTime + dur;

      // 1. Primary body tone (Triangle wave for warm presence & acoustic resonance)
      const oscPrimary = ctx.createOscillator();
      const gainPrimary = ctx.createGain();
      oscPrimary.type = 'triangle';
      oscPrimary.frequency.setValueAtTime(freq, noteStartTime);

      gainPrimary.gain.setValueAtTime(0.7, noteStartTime);
      gainPrimary.gain.exponentialRampToValueAtTime(0.001, noteEndTime);

      oscPrimary.connect(gainPrimary);
      gainPrimary.connect(masterGain);

      oscPrimary.start(noteStartTime);
      oscPrimary.stop(noteEndTime);

      // 2. Harmonic overtone (Sine wave 2x octave for crisp clarity & bell chime sparkle)
      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2, noteStartTime);

      gainHarmonic.gain.setValueAtTime(0.35, noteStartTime);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, noteEndTime);

      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(masterGain);

      oscHarmonic.start(noteStartTime);
      oscHarmonic.stop(noteEndTime);
    });

    // Mobile Phone Strong Vibration Pattern
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 450]);
    }
  } catch (e) {
    // Silently ignore if audio context is blocked by browser autoplay policy
    console.warn('Audio chime note:', e);
  }
}

/**
 * Trigger local browser / system push notification
 */
export async function sendLocalNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    type?: 'info' | 'important' | 'warning' | 'urgent';
  }
) {
  // Play chime regardless
  playNotificationSound();

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Cannot display notification: Permission not granted or not supported.');
    return false;
  }

  const notificationTitle = options?.type === 'urgent'
    ? `🚨 [DARURAT] ${title}`
    : options?.type === 'warning'
    ? `⚠️ [PERINGATAN] ${title}`
    : options?.type === 'important'
    ? `📢 [PENTING] ${title}`
    : `ℹ️ [PENGUMUMAN] ${title}`;

  const notificationOptions: NotificationOptions = {
    body: options?.body || 'Buka aplikasi Administrasi Guru Madrasah untuk membaca detailnya.',
    icon: options?.icon || 'https://api.iconify.design/lucide:megaphone.svg?color=%23f59e0b',
    badge: options?.badge || 'https://api.iconify.design/lucide:bell.svg?color=%234f46e5',
    tag: options?.tag || `announcement-${Date.now()}`,
    data: { url: options?.url || '/' }
  };

  try {
    // Try to trigger via service worker registration first (works even when tab is backgrounded/closed)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(notificationTitle, notificationOptions);
        return true;
      }
    }

    // Fallback to standard Notification API
    new Notification(notificationTitle, notificationOptions);
    return true;
  } catch (error) {
    console.error('Error displaying push notification:', error);
    return false;
  }
}

/**
 * Broadcast notification from an announcement
 */
export async function broadcastAnnouncementPushNotification(announcement: Announcement) {
  return sendLocalNotification(announcement.title, {
    body: `${announcement.message} (Oleh: ${announcement.authorName || 'Super Admin'})`,
    type: announcement.type,
    tag: `ann-${announcement.id}`
  });
}

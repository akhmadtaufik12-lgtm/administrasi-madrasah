// Global WebStorage Quota Guard
if (typeof window !== 'undefined' && window.Storage) {
  try {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      try {
        originalSetItem.call(this, key, value);
      } catch (err: any) {
        if (err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014 || String(err).includes('quota'))) {
          console.warn('[Storage Protection] Quota reached for:', key);
          try {
            // Remove non-critical and legacy firestore sequence keys
            for (let i = 0; i < this.length; i++) {
              const k = this.key(i);
              if (k && (k.startsWith('firestore_') || k.includes('sequence_number') || k.startsWith('mts_db_snapshots_'))) {
                this.removeItem(k);
              }
            }
            originalSetItem.call(this, key, value);
          } catch {
            // Silently absorb so it does not crash Firestore AsyncQueue
            console.warn('[Storage Protection] Absorbed QuotaExceededError for:', key);
          }
        } else {
          throw err;
        }
      }
    };
  } catch (_) {}
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

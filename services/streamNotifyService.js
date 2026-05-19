import { ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import { realtimeDb } from './firebaseConfig';

// Standalone Stream Tool — global notification channel that is pushed onto the
// OBS overlay (public/notify-display.html). Not tied to Sync-Vote or any room.
const NOTIFY_PATH = 'streamNotify';

// Push a notification to the OBS overlay. Every send writes a fresh id so the
// overlay re-triggers even when the text is identical to the previous one.
export async function sendNotification(text, options = {}) {
  const message = (text || '').trim().slice(0, 200);
  if (!message) return;
  await set(ref(realtimeDb, NOTIFY_PATH), {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: message,
    sound: options.sound !== false,
    durationMs: options.durationMs || null,
    at: serverTimestamp(),
  });
}

export function subscribeNotification(callback) {
  const r = ref(realtimeDb, NOTIFY_PATH);
  const listener = onValue(
    r,
    (snap) => callback(snap.exists() ? snap.val() : null),
    (err) => {
      console.error('subscribeNotification error:', err);
      callback(null);
    }
  );
  return () => off(r, 'value', listener);
}

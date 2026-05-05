import {
  ref, set, get, update, remove, onValue, off, push,
} from 'firebase/database';
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL,
} from 'firebase/storage';
import { realtimeDb, storage } from './firebaseConfig';

const BASE = 'soundboard';
const CH = `${BASE}/channels`;
const BTN = `${BASE}/buttons`;
const QUEUE = `${BASE}/queue`;
const STOP = `${BASE}/stopSignal`;

// ─── Channels ───────────────────────────────────────────────────────────────

export async function createChannel(name) {
  try {
    const newRef = push(ref(realtimeDb, CH));
    const id = newRef.key;
    await set(newRef, { id, name, order: Date.now(), createdAt: new Date().toISOString() });
    return { success: true, channelId: id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateChannel(channelId, updates) {
  try {
    await update(ref(realtimeDb, `${CH}/${channelId}`), updates);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteChannel(channelId) {
  try {
    const updates = {};
    updates[`${CH}/${channelId}`] = null;
    updates[`${BTN}/${channelId}`] = null;
    await update(ref(realtimeDb, '/'), updates);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function subscribeToChannels(callback) {
  const dbRef = ref(realtimeDb, CH);
  const listener = onValue(dbRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return; }
    const val = snapshot.val();
    const arr = Object.values(val).sort((a, b) => a.order - b.order);
    callback(arr);
  });
  return () => off(dbRef, 'value', listener);
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

export async function createButton(channelId, buttonData) {
  try {
    const newRef = push(ref(realtimeDb, `${BTN}/${channelId}`));
    const id = newRef.key;
    await set(newRef, { ...buttonData, id, channelId, createdAt: new Date().toISOString() });
    return { success: true, buttonId: id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateButton(channelId, buttonId, updates) {
  try {
    await update(ref(realtimeDb, `${BTN}/${channelId}/${buttonId}`), updates);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteButton(channelId, buttonId) {
  try {
    await remove(ref(realtimeDb, `${BTN}/${channelId}/${buttonId}`));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function moveButton(channelId, buttonId, row, col) {
  return updateButton(channelId, buttonId, { row, col });
}

export function subscribeToChannelButtons(channelId, callback) {
  const dbRef = ref(realtimeDb, `${BTN}/${channelId}`);
  const listener = onValue(dbRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return; }
    callback(Object.values(snapshot.val()));
  });
  return () => off(dbRef, 'value', listener);
}

// ─── Play Control ─────────────────────────────────────────────────────────────

export async function triggerPlay(button, channelName = '') {
  try {
    const newRef = push(ref(realtimeDb, QUEUE));
    await set(newRef, {
      buttonId: button.id,
      channelId: button.channelId,
      action: 'play',
      soundUrl: button.soundSource?.url || '',
      volume: button.volume ?? 1,
      loop: button.loop ?? false,
      stopOnNew: button.stopOnNew ?? false,
      buttonName: button.name || '',
      buttonColor: button.color || '#5b8de8',
      channelName,
      triggeredAt: new Date().toISOString(),
    });
    // clean up entries older than 5 minutes to prevent queue buildup
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const old = await get(ref(realtimeDb, QUEUE));
    if (old.exists()) {
      const updates = {};
      old.forEach(child => {
        if ((child.val().triggeredAt || '') < cutoff) updates[child.key] = null;
      });
      if (Object.keys(updates).length > 0) {
        update(ref(realtimeDb, QUEUE), updates);
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function triggerStopAll() {
  try {
    await set(ref(realtimeDb, STOP), {
      action: 'stop_all',
      triggeredAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function subscribeToPlaySignal(callback) {
  const dbRef = ref(realtimeDb, QUEUE);
  const listener = onValue(dbRef, (snapshot) => callback(snapshot.val()));
  return () => off(dbRef, 'value', listener);
}

export function subscribeToStopSignal(callback) {
  const dbRef = ref(realtimeDb, STOP);
  const listener = onValue(dbRef, (snapshot) => callback(snapshot.val()));
  return () => off(dbRef, 'value', listener);
}

// ─── Storage Upload ───────────────────────────────────────────────────────────

export function uploadSoundFile(file, onProgress) {
  return new Promise((resolve) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `soundboard/${Date.now()}_${safeName}`;
    const fileRef = storageRef(storage, path);
    const task = uploadBytesResumable(fileRef, file);

    task.on(
      'state_changed',
      (snap) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => resolve({ success: false, error: err.message }),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ success: true, url });
      },
    );
  });
}

// ─── Google Drive URL Conversion ──────────────────────────────────────────────

export function convertGoogleDriveUrl(inputUrl) {
  if (!inputUrl) return '';
  const p1 = inputUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (p1) return `https://drive.google.com/uc?export=download&id=${p1[1]}`;
  const p2 = inputUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (p2) return `https://drive.google.com/uc?export=download&id=${p2[1]}`;
  return inputUrl;
}

import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  serverTimestamp,
  runTransaction,
} from 'firebase/database';
import { realtimeDb } from './firebaseConfig';

const ROOMS_PATH = 'syncVoteRooms';
const ACTIVE_PATH = 'syncVoteActive'; // single pointer to the currently-open room code
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous I/O/0/1
export const MAX_SLOTS = 6;
export const THEME_COLORS = ['yellow', 'red', 'green', 'cyan'];

export function generateRoomCode(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

function emptySlot(index) {
  return {
    uid: null,
    name: `ผู้เล่น ${index}`,
    choice: null,
    isFinal: false,
  };
}

function buildInitialRoom(code, hostUid) {
  const room = {
    code,
    hostUid,
    locked: false,
    activePlayers: 4,
    themeColor: 'yellow',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  for (let i = 1; i <= MAX_SLOTS; i++) {
    room[`player${i}`] = emptySlot(i);
  }
  return room;
}

export async function createRoom(hostUid) {
  // Try a few times in the (vanishingly unlikely) event of a code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${code}`);
    const existing = await get(roomRef);
    if (existing.exists()) continue;
    await set(roomRef, buildInitialRoom(code, hostUid));
    await set(ref(realtimeDb, ACTIVE_PATH), { code, hostUid, openedAt: serverTimestamp() });
    return { success: true, code };
  }
  return { success: false, error: 'Could not allocate a room code, try again.' };
}

export async function getRoomOnce(code) {
  const snap = await get(ref(realtimeDb, `${ROOMS_PATH}/${code}`));
  return snap.exists() ? snap.val() : null;
}

export function subscribeRoom(code, callback) {
  const r = ref(realtimeDb, `${ROOMS_PATH}/${code}`);
  const listener = onValue(
    r,
    (snap) => callback(snap.exists() ? snap.val() : null),
    (err) => {
      console.error('subscribeRoom error:', err);
      callback(null);
    }
  );
  return () => off(r, 'value', listener);
}

// Claim a slot atomically — only succeeds if slot is currently unclaimed or
// already owned by this uid.
export async function joinSlot(code, slotIndex, uid) {
  const slotRef = ref(realtimeDb, `${ROOMS_PATH}/${code}/player${slotIndex}`);
  const result = await runTransaction(slotRef, (current) => {
    if (current === null) return emptySlot(slotIndex);
    if (current.uid && current.uid !== uid) return; // abort
    return { ...current, uid };
  });
  if (!result.committed) {
    return { success: false, error: 'Slot already taken' };
  }
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), {
    updatedAt: serverTimestamp(),
  });
  return { success: true };
}

export async function leaveSlot(code, slotIndex, uid) {
  const slotRef = ref(realtimeDb, `${ROOMS_PATH}/${code}/player${slotIndex}`);
  const result = await runTransaction(slotRef, (current) => {
    if (!current) return current;
    if (current.uid !== uid) return; // abort, not ours
    return { ...emptySlot(slotIndex) };
  });
  return { success: result.committed };
}

export async function setChoice(code, slotIndex, choice) {
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}/player${slotIndex}`), {
    choice,
  });
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), {
    updatedAt: serverTimestamp(),
  });
}

export async function submitFinal(code, slotIndex) {
  const updates = {
    [`player${slotIndex}/isFinal`]: true,
    themeColor: 'cyan',
    updatedAt: serverTimestamp(),
  };
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), updates);
}

export async function takeOver(code, choice) {
  const updates = {
    locked: true,
    themeColor: 'cyan',
    updatedAt: serverTimestamp(),
  };
  for (let i = 1; i <= MAX_SLOTS; i++) {
    updates[`player${i}/choice`] = choice;
    updates[`player${i}/isFinal`] = true;
  }
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), updates);
}

export async function resetProtocol(code) {
  const updates = {
    locked: false,
    themeColor: 'yellow',
    updatedAt: serverTimestamp(),
  };
  for (let i = 1; i <= MAX_SLOTS; i++) {
    updates[`player${i}/choice`] = null;
    updates[`player${i}/isFinal`] = false;
  }
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), updates);
}

export async function setActivePlayers(code, count) {
  const n = Math.max(1, Math.min(MAX_SLOTS, count));
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), {
    activePlayers: n,
    updatedAt: serverTimestamp(),
  });
}

// Replace the pilot roster with the given VTuber list (max MAX_SLOTS).
// Each entry: { id, name, imageUrl }. Slots are compacted to player1..N.
// Slots that change identity get their uid/choice/isFinal cleared so a
// disconnected pilot doesn't keep a claim under a different persona.
export async function setPilots(code, vtubers) {
  const list = (vtubers || []).slice(0, MAX_SLOTS);
  const roomSnap = await get(ref(realtimeDb, `${ROOMS_PATH}/${code}`));
  const room = roomSnap.exists() ? roomSnap.val() : {};
  const updates = {
    activePlayers: Math.max(1, list.length || 1),
    updatedAt: serverTimestamp(),
  };
  for (let i = 1; i <= MAX_SLOTS; i++) {
    const v = list[i - 1];
    const prev = room[`player${i}`] || {};
    if (v) {
      const identityChanged = prev.vtuberId !== v.id;
      updates[`player${i}/vtuberId`] = v.id;
      updates[`player${i}/name`] = v.name || `ผู้เล่น ${i}`;
      updates[`player${i}/imageUrl`] = v.imageUrl || null;
      if (identityChanged) {
        updates[`player${i}/uid`] = null;
        updates[`player${i}/choice`] = null;
        updates[`player${i}/isFinal`] = false;
      }
    } else {
      updates[`player${i}/vtuberId`] = null;
      updates[`player${i}/name`] = `ผู้เล่น ${i}`;
      updates[`player${i}/imageUrl`] = null;
      updates[`player${i}/uid`] = null;
      updates[`player${i}/choice`] = null;
      updates[`player${i}/isFinal`] = false;
    }
  }
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), updates);
}

export async function setThemeColor(code, color) {
  if (!THEME_COLORS.includes(color)) return;
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}`), {
    themeColor: color,
    updatedAt: serverTimestamp(),
  });
}

export async function setSlotName(code, slotIndex, name) {
  await update(ref(realtimeDb, `${ROOMS_PATH}/${code}/player${slotIndex}`), {
    name: (name || '').slice(0, 32),
  });
}

export async function deleteRoom(code) {
  await remove(ref(realtimeDb, `${ROOMS_PATH}/${code}`));
  // Clear the active pointer only if it still points at this room.
  const snap = await get(ref(realtimeDb, ACTIVE_PATH));
  if (snap.exists() && snap.val()?.code === code) {
    await remove(ref(realtimeDb, ACTIVE_PATH));
  }
}

export function subscribeActiveRoom(callback) {
  const r = ref(realtimeDb, ACTIVE_PATH);
  const listener = onValue(
    r,
    (snap) => callback(snap.exists() ? snap.val() : null),
    (err) => {
      console.error('subscribeActiveRoom error:', err);
      callback(null);
    }
  );
  return () => off(r, 'value', listener);
}

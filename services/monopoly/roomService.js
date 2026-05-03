import { realtimeDb } from '../firebaseConfig';
import { ref, set, get, onValue, off, push } from 'firebase/database';
import { PLAYER_COLORS, STARTING_MONEY } from '../../data/monopolyBoard';

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom(hostName) {
  const roomCode = generateRoomCode();
  const hostId = push(ref(realtimeDb)).key;
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);

  await set(roomRef, {
    status: 'waiting',
    hostId,
    roomCode,
    createdAt: Date.now(),
    currentTurn: null,
    currentRound: 0,
    dice: [0, 0],
    turnPhase: 'waiting',
    lastAction: null,
    players: {
      [hostId]: {
        name: hostName,
        position: 0,
        money: STARTING_MONEY,
        status: 'alive',
        jailTurns: 0,
        jailFreeCard: false,
        color: PLAYER_COLORS[0],
        order: 0,
      },
    },
    properties: {},
  });

  return { roomCode, playerId: hostId };
}

export async function joinRoom(roomCode, playerName) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) throw new Error('ไม่พบห้องนี้');

  const room = snapshot.val();
  if (room.status !== 'waiting') throw new Error('เกมเริ่มแล้ว');

  const playerCount = room.players ? Object.keys(room.players).length : 0;
  if (playerCount >= 4) throw new Error('ห้องเต็มแล้ว');

  const playerId = push(ref(realtimeDb)).key;
  const playerRef = ref(realtimeDb, `monopolyRooms/${roomCode}/players/${playerId}`);

  await set(playerRef, {
    name: playerName,
    position: 0,
    money: STARTING_MONEY,
    status: 'alive',
    jailTurns: 0,
    jailFreeCard: false,
    color: PLAYER_COLORS[playerCount],
    order: playerCount,
  });

  return { roomCode, playerId };
}

export async function getOpenRooms() {
  const roomsRef = ref(realtimeDb, 'monopolyRooms');
  const snapshot = await get(roomsRef);
  if (!snapshot.exists()) return [];

  const all = snapshot.val();
  const rooms = [];
  for (const [code, room] of Object.entries(all)) {
    if (room.status !== 'waiting') continue;
    const playerCount = room.players ? Object.keys(room.players).length : 0;
    if (playerCount >= 4) continue;
    if (room.createdAt && Date.now() - room.createdAt > 30 * 60 * 1000) continue;
    const hostPlayer = room.players ? Object.values(room.players).find((_, i) => i === 0) : null;
    rooms.push({
      roomCode: code,
      hostName: hostPlayer?.name || '???',
      playerCount,
      maxPlayers: 4,
      createdAt: room.createdAt,
    });
  }
  return rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function quickJoin(playerName) {
  const rooms = await getOpenRooms();
  if (rooms.length === 0) return await createRoom(playerName);
  return await joinRoom(rooms[0].roomCode, playerName);
}

export function subscribeToRoom(roomCode, callback) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(roomRef, 'value', unsubscribe);
}

export async function deleteRoom(roomCode) {
  await set(ref(realtimeDb, `monopolyRooms/${roomCode}`), null);
}

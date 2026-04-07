import { realtimeDb } from './firebaseConfig';
import { ref, set, get, update, onValue, off, push, remove, serverTimestamp } from 'firebase/database';
import { BOARD, CHANCE_CARDS, PLAYER_COLORS, STARTING_MONEY, PASS_START_BONUS, BOARD_SIZE } from '../data/monopolyBoard';

// สร้างรหัสห้อง 6 หลัก
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// สร้างห้อง
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
    turnPhase: 'waiting', // waiting | rolled | action | ended
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

// เข้าร่วมห้อง
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

// ค้นหาห้องเปิดทั้งหมดที่กำลังรอผู้เล่น
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
    // ลบห้องเก่าเกิน 30 นาที
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
  // เรียงจากใหม่ → เก่า
  return rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Quick Join — เข้าห้องแรกที่ว่าง
export async function quickJoin(playerName) {
  const rooms = await getOpenRooms();
  if (rooms.length === 0) {
    // ไม่มีห้องว่าง → สร้างใหม่
    return await createRoom(playerName);
  }
  // เข้าห้องแรกที่ว่าง
  return await joinRoom(rooms[0].roomCode, playerName);
}

// Subscribe realtime
export function subscribeToRoom(roomCode, callback) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(roomRef, 'value', unsubscribe);
}

// เริ่มเกม
export async function startGame(roomCode) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  const playerIds = Object.keys(room.players);
  if (playerIds.length < 2) throw new Error('ต้องมีอย่างน้อย 2 คน');

  // สุ่มลำดับ
  const shuffled = playerIds.sort(() => Math.random() - 0.5);
  const updates = {};
  shuffled.forEach((id, i) => {
    updates[`players/${id}/order`] = i;
  });
  updates.status = 'playing';
  updates.currentTurn = shuffled[0];
  updates.currentRound = 1;
  updates.turnPhase = 'roll';

  await update(roomRef, updates);
}

// ทอยเต๋า
export async function rollDice(roomCode, playerId) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  if (room.currentTurn !== playerId) throw new Error('ไม่ใช่ตาคุณ');
  if (room.turnPhase !== 'roll') throw new Error('ทอยเต๋าไปแล้ว');

  const player = room.players[playerId];

  // ถ้าอยู่ในคุก
  if (player.status === 'jail') {
    if (player.jailTurns >= 3) {
      // อยู่ครบ 3 ตา ปล่อยออก จ่าย 200
      await update(roomRef, {
        [`players/${playerId}/status`]: 'alive',
        [`players/${playerId}/jailTurns`]: 0,
        [`players/${playerId}/money`]: player.money - 200,
      });
    } else {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      if (d1 === d2) {
        // ทอยได้ดับเบิ้ล ออกจากคุก
        await update(roomRef, {
          dice: [d1, d2],
          [`players/${playerId}/status`]: 'alive',
          [`players/${playerId}/jailTurns`]: 0,
          turnPhase: 'action',
          lastAction: { type: 'jail-free-double', dice: [d1, d2] },
        });
        return await movePlayer(roomCode, playerId, d1 + d2);
      } else {
        // ยังออกไม่ได้
        await update(roomRef, {
          dice: [d1, d2],
          [`players/${playerId}/jailTurns`]: player.jailTurns + 1,
          turnPhase: 'ended',
          lastAction: { type: 'jail-stay', dice: [d1, d2] },
        });
        return { action: 'jail-stay', dice: [d1, d2] };
      }
    }
  }

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2;

  await update(roomRef, {
    dice: [d1, d2],
    turnPhase: 'action',
  });

  return await movePlayer(roomCode, playerId, total);
}

// ใช้บัตรออกจากคุก
export async function useJailFreeCard(roomCode, playerId) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  await update(roomRef, {
    [`players/${playerId}/status`]: 'alive',
    [`players/${playerId}/jailTurns`]: 0,
    [`players/${playerId}/jailFreeCard`]: false,
    turnPhase: 'roll',
    lastAction: { type: 'used-jail-free-card' },
  });
}

// เดินผู้เล่น
async function movePlayer(roomCode, playerId, steps) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  const player = room.players[playerId];

  const oldPos = player.position;
  const newPos = (oldPos + steps) % BOARD_SIZE;
  const passedStart = (oldPos + steps) >= BOARD_SIZE;

  const updates = {
    [`players/${playerId}/position`]: newPos,
  };

  // ผ่านจุดเริ่มต้น = รับเงิน
  if (passedStart && newPos !== 0) {
    updates[`players/${playerId}/money`] = player.money + PASS_START_BONUS;
  }

  await update(roomRef, updates);

  // ทำ action ตามช่องที่หยุด
  return await handleLanding(roomCode, playerId, newPos);
}

// จัดการเมื่อหยุดที่ช่อง
async function handleLanding(roomCode, playerId, position) {
  const tile = BOARD[position];
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  const player = room.players[playerId];

  switch (tile.type) {
    case 'start':
    case 'free-parking':
    case 'jail': // แค่เยี่ยม
      await update(roomRef, {
        turnPhase: 'ended',
        lastAction: { type: 'safe', tileName: tile.name },
      });
      return { action: 'safe', tile };

    case 'land': {
      const prop = room.properties?.[position];
      if (!prop) {
        // ที่ว่าง — ให้ซื้อ
        await update(roomRef, {
          turnPhase: 'buy-decision',
          lastAction: { type: 'can-buy', position, tileName: tile.name, price: tile.price },
        });
        return { action: 'can-buy', tile, position };
      } else if (prop.owner !== playerId && room.players[prop.owner]?.status === 'alive') {
        // จ่ายค่าเช่า
        const rentAmount = tile.rent[prop.level || 0];
        const ownerMoney = room.players[prop.owner].money;
        const playerMoney = player.money;

        const updates = {
          [`players/${playerId}/money`]: playerMoney - rentAmount,
          [`players/${prop.owner}/money`]: ownerMoney + rentAmount,
          turnPhase: 'ended',
          lastAction: { type: 'pay-rent', position, tileName: tile.name, amount: rentAmount, to: prop.owner },
        };

        // ตรวจล้มละลาย
        if (playerMoney - rentAmount <= 0) {
          updates[`players/${playerId}/status`] = 'bankrupt';
          updates[`players/${playerId}/money`] = 0;
          // คืนที่ดินให้ว่าง
          if (room.properties) {
            Object.entries(room.properties).forEach(([pos, p]) => {
              if (p.owner === playerId) {
                updates[`properties/${pos}`] = null;
              }
            });
          }
        }

        await update(roomRef, updates);
        await checkGameEnd(roomCode);
        return { action: 'pay-rent', tile, rentAmount };
      } else {
        // ที่ตัวเอง หรือเจ้าของล้มละลาย
        await update(roomRef, {
          turnPhase: 'ended',
          lastAction: { type: 'own-land', tileName: tile.name },
        });
        return { action: 'own-land', tile };
      }
    }

    case 'tax': {
      const newMoney = player.money - tile.amount;
      const updates = {
        [`players/${playerId}/money`]: Math.max(0, newMoney),
        turnPhase: 'ended',
        lastAction: { type: 'tax', amount: tile.amount, tileName: tile.name },
      };
      if (newMoney <= 0) {
        updates[`players/${playerId}/status`] = 'bankrupt';
        if (room.properties) {
          Object.entries(room.properties).forEach(([pos, p]) => {
            if (p.owner === playerId) updates[`properties/${pos}`] = null;
          });
        }
      }
      await update(roomRef, updates);
      await checkGameEnd(roomCode);
      return { action: 'tax', tile, amount: tile.amount };
    }

    case 'chance': {
      const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      return await handleChanceCard(roomCode, playerId, card);
    }

    case 'go-to-jail': {
      await update(roomRef, {
        [`players/${playerId}/position`]: 7, // ช่องคุก
        [`players/${playerId}/status`]: 'jail',
        [`players/${playerId}/jailTurns`]: 0,
        turnPhase: 'ended',
        lastAction: { type: 'go-to-jail' },
      });
      return { action: 'go-to-jail', tile };
    }

    default:
      await update(roomRef, { turnPhase: 'ended' });
      return { action: 'unknown', tile };
  }
}

// จัดการการ์ด Chance
async function handleChanceCard(roomCode, playerId, card) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  const player = room.players[playerId];

  switch (card.type) {
    case 'money': {
      const newMoney = player.money + card.amount;
      const updates = {
        [`players/${playerId}/money`]: Math.max(0, newMoney),
        turnPhase: 'ended',
        lastAction: { type: 'chance', card },
      };
      if (newMoney <= 0) {
        updates[`players/${playerId}/status`] = 'bankrupt';
        if (room.properties) {
          Object.entries(room.properties).forEach(([pos, p]) => {
            if (p.owner === playerId) updates[`properties/${pos}`] = null;
          });
        }
      }
      await update(roomRef, updates);
      await checkGameEnd(roomCode);
      return { action: 'chance', card };
    }

    case 'move': {
      await update(roomRef, {
        [`players/${playerId}/position`]: card.destination,
        [`players/${playerId}/money`]: player.money + (card.bonus || 0),
        turnPhase: 'ended',
        lastAction: { type: 'chance', card },
      });
      return { action: 'chance', card };
    }

    case 'go-to-jail': {
      await update(roomRef, {
        [`players/${playerId}/position`]: 7,
        [`players/${playerId}/status`]: 'jail',
        [`players/${playerId}/jailTurns`]: 0,
        turnPhase: 'ended',
        lastAction: { type: 'chance', card },
      });
      return { action: 'chance', card };
    }

    case 'jail-free': {
      await update(roomRef, {
        [`players/${playerId}/jailFreeCard`]: true,
        turnPhase: 'ended',
        lastAction: { type: 'chance', card },
      });
      return { action: 'chance', card };
    }

    case 'birthday': {
      const updates = { turnPhase: 'ended', lastAction: { type: 'chance', card } };
      let totalReceived = 0;
      Object.entries(room.players).forEach(([pid, p]) => {
        if (pid !== playerId && p.status === 'alive') {
          updates[`players/${pid}/money`] = p.money - card.amount;
          totalReceived += card.amount;
        }
      });
      updates[`players/${playerId}/money`] = player.money + totalReceived;
      await update(roomRef, updates);
      return { action: 'chance', card };
    }

    default:
      await update(roomRef, { turnPhase: 'ended', lastAction: { type: 'chance', card } });
      return { action: 'chance', card };
  }
}

// ซื้อที่ดิน
export async function buyProperty(roomCode, playerId, position) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  const player = room.players[playerId];
  const tile = BOARD[position];

  if (player.money < tile.price) throw new Error('เงินไม่พอ');

  await update(roomRef, {
    [`properties/${position}`]: { owner: playerId, level: 0 },
    [`players/${playerId}/money`]: player.money - tile.price,
    turnPhase: 'ended',
    lastAction: { type: 'bought', position, tileName: tile.name, price: tile.price },
  });
}

// ไม่ซื้อที่ดิน
export async function skipBuy(roomCode) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  await update(roomRef, {
    turnPhase: 'ended',
    lastAction: { type: 'skip-buy' },
  });
}

// อัพเกรดที่ดิน
export async function upgradeProperty(roomCode, playerId, position) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  const prop = room.properties?.[position];
  const tile = BOARD[position];

  if (!prop || prop.owner !== playerId) throw new Error('ไม่ใช่ที่ดินของคุณ');
  if (prop.level >= 3) throw new Error('อัพเกรดเต็มแล้ว');

  const upgradeCost = Math.floor(tile.price * 0.5);
  const player = room.players[playerId];
  if (player.money < upgradeCost) throw new Error('เงินไม่พอ');

  await update(roomRef, {
    [`properties/${position}/level`]: prop.level + 1,
    [`players/${playerId}/money`]: player.money - upgradeCost,
  });
}

// จบ turn → เปลี่ยนคนเล่น
export async function endTurn(roomCode) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  const alivePlayers = Object.entries(room.players)
    .filter(([, p]) => p.status === 'alive')
    .sort((a, b) => a[1].order - b[1].order);

  if (alivePlayers.length <= 1) {
    await update(roomRef, { status: 'ended', turnPhase: 'game-over' });
    return;
  }

  const currentIdx = alivePlayers.findIndex(([id]) => id === room.currentTurn);
  const nextIdx = (currentIdx + 1) % alivePlayers.length;
  const nextPlayerId = alivePlayers[nextIdx][0];

  const updates = {
    currentTurn: nextPlayerId,
    turnPhase: 'roll',
  };

  // เพิ่ม round เมื่อวนกลับมาคนแรก
  if (nextIdx === 0) {
    updates.currentRound = (room.currentRound || 1) + 1;
  }

  await update(roomRef, updates);
}

// ตรวจจบเกม
async function checkGameEnd(roomCode) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  const alivePlayers = Object.entries(room.players).filter(([, p]) => p.status === 'alive');

  if (alivePlayers.length <= 1) {
    await update(roomRef, { status: 'ended', turnPhase: 'game-over' });
  }
}

// ออกจากห้อง
export async function leaveRoom(roomCode, playerId) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  if (room.status === 'waiting') {
    await set(ref(realtimeDb, `monopolyRooms/${roomCode}/players/${playerId}`), null);
    // ถ้า host ออก ลบห้อง
    if (room.hostId === playerId) {
      await set(roomRef, null);
    }
  } else {
    // ระหว่างเกม = ล้มละลาย
    await update(roomRef, {
      [`players/${playerId}/status`]: 'bankrupt',
    });
    if (room.properties) {
      const updates = {};
      Object.entries(room.properties).forEach(([pos, p]) => {
        if (p.owner === playerId) updates[`properties/${pos}`] = null;
      });
      if (Object.keys(updates).length > 0) {
        await update(roomRef, updates);
      }
    }
    if (room.currentTurn === playerId) {
      await endTurn(roomCode);
    }
    await checkGameEnd(roomCode);
  }
}

// ลบห้อง
export async function deleteRoom(roomCode) {
  await set(ref(realtimeDb, `monopolyRooms/${roomCode}`), null);
}

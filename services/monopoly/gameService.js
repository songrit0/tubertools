import { realtimeDb } from '../firebaseConfig';
import { ref, set, get, update } from 'firebase/database';
import { BOARD, CHANCE_CARDS, PASS_START_BONUS, BOARD_SIZE } from '../../data/monopolyBoard';

export async function startGame(roomCode) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  const playerIds = Object.keys(room.players);
  if (playerIds.length < 2) throw new Error('ต้องมีอย่างน้อย 2 คน');

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

function rollWithPower(power) {
  const rollOne = () => {
    const r = Math.random();
    const biased = r * (1 - power * 0.4) + power * 0.4;
    return Math.min(6, Math.max(1, Math.ceil(biased * 6)));
  };
  return [rollOne(), rollOne()];
}

export async function rollDice(roomCode, playerId, power = 0) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  if (room.currentTurn !== playerId) throw new Error('ไม่ใช่ตาคุณ');
  if (room.turnPhase !== 'roll') throw new Error('ทอยเต๋าไปแล้ว');

  const player = room.players[playerId];
  const hasDoubleToken = player.doubleToken || false;

  if (player.status === 'jail') {
    if (player.jailTurns >= 3) {
      await update(roomRef, {
        [`players/${playerId}/status`]: 'alive',
        [`players/${playerId}/jailTurns`]: 0,
        [`players/${playerId}/money`]: player.money - 200,
      });
    } else {
      const [d1, d2] = rollWithPower(power);
      if (d1 === d2) {
        await update(roomRef, {
          dice: [d1, d2],
          [`players/${playerId}/status`]: 'alive',
          [`players/${playerId}/jailTurns`]: 0,
          [`players/${playerId}/doubleToken`]: false,
          turnPhase: 'action',
          lastAction: { type: 'jail-free-double', dice: [d1, d2] },
        });
        return await movePlayer(roomCode, playerId, d1 + d2);
      } else {
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

  const [d1, d2] = rollWithPower(power);
  const isDouble = d1 === d2;
  let total = d1 + d2;

  if (hasDoubleToken) {
    total = total * 2;
  }

  const updates = {
    dice: [d1, d2],
    turnPhase: 'action',
    lastRoll: {
      d1, d2,
      originalTotal: d1 + d2,
      finalTotal: total,
      usedDoubleToken: hasDoubleToken,
      isDouble,
      power: Math.round(power * 100),
    },
  };

  if (hasDoubleToken) {
    updates[`players/${playerId}/doubleToken`] = false;
  }

  if (isDouble) {
    updates[`players/${playerId}/doubleToken`] = true;
  }

  await update(roomRef, updates);

  return await movePlayer(roomCode, playerId, total);
}

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

  if (passedStart) {
    updates[`players/${playerId}/money`] = player.money + PASS_START_BONUS;
    updates.lastAction = { type: 'pass-start', bonus: PASS_START_BONUS, playerName: player.name };
  }

  await update(roomRef, updates);

  return await handleLanding(roomCode, playerId, newPos);
}

async function handleLanding(roomCode, playerId, position) {
  const tile = BOARD[position];
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();
  const player = room.players[playerId];

  switch (tile.type) {
    case 'start':
    case 'free-parking':
    case 'jail':
      await update(roomRef, {
        turnPhase: 'ended',
        lastAction: { type: 'safe', tileName: tile.name },
      });
      return { action: 'safe', tile };

    case 'land': {
      const prop = room.properties?.[position];
      if (!prop) {
        await update(roomRef, {
          turnPhase: 'buy-decision',
          lastAction: { type: 'can-buy', position, tileName: tile.name, price: tile.price },
        });
        return { action: 'can-buy', tile, position };
      } else if (prop.owner !== playerId && room.players[prop.owner]?.status === 'alive') {
        const rentAmount = tile.rent[prop.level || 0];
        const ownerMoney = room.players[prop.owner].money;
        const playerMoney = player.money;

        const updates = {
          [`players/${playerId}/money`]: playerMoney - rentAmount,
          [`players/${prop.owner}/money`]: ownerMoney + rentAmount,
          turnPhase: 'ended',
          lastAction: { type: 'pay-rent', position, tileName: tile.name, amount: rentAmount, to: prop.owner },
        };

        if (playerMoney - rentAmount <= 0) {
          updates[`players/${playerId}/status`] = 'bankrupt';
          updates[`players/${playerId}/money`] = 0;
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
        [`players/${playerId}/position`]: 7,
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

export async function skipBuy(roomCode) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  await update(roomRef, {
    turnPhase: 'ended',
    lastAction: { type: 'skip-buy' },
  });
}

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

  if (nextIdx === 0) {
    updates.currentRound = (room.currentRound || 1) + 1;
  }

  await update(roomRef, updates);
}

async function checkGameEnd(roomCode) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  const alivePlayers = Object.entries(room.players).filter(([, p]) => p.status === 'alive');

  if (alivePlayers.length <= 1) {
    await update(roomRef, { status: 'ended', turnPhase: 'game-over' });
  }
}

export async function leaveRoom(roomCode, playerId) {
  const roomRef = ref(realtimeDb, `monopolyRooms/${roomCode}`);
  const snapshot = await get(roomRef);
  const room = snapshot.val();

  if (room.status === 'waiting') {
    await set(ref(realtimeDb, `monopolyRooms/${roomCode}/players/${playerId}`), null);
    if (room.hostId === playerId) {
      await set(roomRef, null);
    }
  } else {
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

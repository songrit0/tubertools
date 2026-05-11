// Returns true when every active player has chosen the same non-null choice.
export function computeAllMatch(room) {
  if (!room) return false;
  const n = room.activePlayers ?? 0;
  if (n < 1) return false;
  const first = room.player1?.choice;
  if (!first) return false;
  for (let i = 2; i <= n; i++) {
    if (room[`player${i}`]?.choice !== first) return false;
  }
  return true;
}

export function consensusChoice(room) {
  return computeAllMatch(room) ? room.player1.choice : null;
}

export function allFinal(room) {
  if (!room) return false;
  const n = room.activePlayers ?? 0;
  for (let i = 1; i <= n; i++) {
    if (!room[`player${i}`]?.isFinal) return false;
  }
  return n > 0;
}

export function findSlotForUid(room, uid) {
  if (!room || !uid) return null;
  for (let i = 1; i <= 6; i++) {
    if (room[`player${i}`]?.uid === uid) return i;
  }
  return null;
}

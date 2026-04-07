// กระดานเกมเศรษฐี 28 ช่อง
export const BOARD = [
  // === ด้านล่าง (0-6) ===
  { position: 0, type: 'start', name: 'จุดเริ่มต้น', emoji: '🏁' },
  { position: 1, type: 'land', name: 'ซอยสุขสันต์', price: 600, rent: [30, 90, 270, 500], color: '#8B4513', group: 'A' },
  { position: 2, type: 'chance', name: 'โชคชะตา', emoji: '❓' },
  { position: 3, type: 'land', name: 'ถนนพระราม', price: 600, rent: [30, 90, 270, 500], color: '#8B4513', group: 'A' },
  { position: 4, type: 'tax', name: 'จ่ายภาษี', amount: 200, emoji: '💰' },
  { position: 5, type: 'land', name: 'สถานีรถไฟเหนือ', price: 1000, rent: [50, 100, 150, 200], color: '#333', group: 'STATION' },
  { position: 6, type: 'land', name: 'ตลาดนัด', price: 1000, rent: [50, 150, 450, 750], color: '#00BFFF', group: 'B' },

  // === ด้านซ้าย (7-13) ===
  { position: 7, type: 'jail', name: 'คุก (เยี่ยม)', emoji: '🔒' },
  { position: 8, type: 'land', name: 'หมู่บ้านสวย', price: 1000, rent: [50, 150, 450, 750], color: '#00BFFF', group: 'B' },
  { position: 9, type: 'land', name: 'คอนโดริมน้ำ', price: 1200, rent: [60, 180, 500, 900], color: '#FF69B4', group: 'C' },
  { position: 10, type: 'chance', name: 'โชคชะตา', emoji: '❓' },
  { position: 11, type: 'land', name: 'ห้างสรรพสินค้า', price: 1200, rent: [60, 180, 500, 900], color: '#FF69B4', group: 'C' },
  { position: 12, type: 'land', name: 'สถานีรถไฟใต้', price: 1000, rent: [50, 100, 150, 200], color: '#333', group: 'STATION' },
  { position: 13, type: 'land', name: 'โรงแรมหรู', price: 1400, rent: [70, 200, 600, 1000], color: '#FF8C00', group: 'D' },

  // === ด้านบน (14-20) ===
  { position: 14, type: 'free-parking', name: 'จอดฟรี', emoji: '🅿️' },
  { position: 15, type: 'land', name: 'รีสอร์ทภูเขา', price: 1400, rent: [70, 200, 600, 1000], color: '#FF8C00', group: 'D' },
  { position: 16, type: 'chance', name: 'โชคชะตา', emoji: '❓' },
  { position: 17, type: 'land', name: 'ตึกออฟฟิศ', price: 1600, rent: [80, 220, 700, 1100], color: '#FF0000', group: 'E' },
  { position: 18, type: 'tax', name: 'ภาษีพิเศษ', amount: 300, emoji: '💰' },
  { position: 19, type: 'land', name: 'สถานีรถไฟตะวันออก', price: 1000, rent: [50, 100, 150, 200], color: '#333', group: 'STATION' },
  { position: 20, type: 'land', name: 'ห้างหรูระดับโลก', price: 1600, rent: [80, 220, 700, 1100], color: '#FF0000', group: 'E' },

  // === ด้านขวา (21-27) ===
  { position: 21, type: 'go-to-jail', name: 'ไปคุก!', emoji: '🚔' },
  { position: 22, type: 'land', name: 'คาสิโนรอยัล', price: 1800, rent: [90, 250, 800, 1200], color: '#FFD700', group: 'F' },
  { position: 23, type: 'land', name: 'ทำเนียบทอง', price: 1800, rent: [90, 250, 800, 1200], color: '#FFD700', group: 'F' },
  { position: 24, type: 'chance', name: 'โชคชะตา', emoji: '❓' },
  { position: 25, type: 'land', name: 'สถานีรถไฟตะวันตก', price: 1000, rent: [50, 100, 150, 200], color: '#333', group: 'STATION' },
  { position: 26, type: 'land', name: 'เพนท์เฮาส์', price: 2000, rent: [100, 300, 900, 1400], color: '#9400D3', group: 'G' },
  { position: 27, type: 'land', name: 'พระราชวัง', price: 2500, rent: [150, 400, 1200, 1800], color: '#9400D3', group: 'G' },
];

export const CHANCE_CARDS = [
  { id: 1, text: 'ได้รับเงินปันผล +300', type: 'money', amount: 300 },
  { id: 2, text: 'จ่ายค่าซ่อมบ้าน -200', type: 'money', amount: -200 },
  { id: 3, text: 'ถูกรางวัล! +500', type: 'money', amount: 500 },
  { id: 4, text: 'จ่ายค่ารักษาพยาบาล -100', type: 'money', amount: -100 },
  { id: 5, text: 'ได้รับมรดก +400', type: 'money', amount: 400 },
  { id: 6, text: 'จ่ายค่าประกัน -150', type: 'money', amount: -150 },
  { id: 7, text: 'ไปจุดเริ่มต้น รับ 200', type: 'move', destination: 0, bonus: 200 },
  { id: 8, text: 'ไปคุก!', type: 'go-to-jail' },
  { id: 9, text: 'ได้บัตรออกจากคุกฟรี', type: 'jail-free' },
  { id: 10, text: 'วันเกิด! ทุกคนจ่ายให้ 100', type: 'birthday', amount: 100 },
  { id: 11, text: 'เก็บเงินได้ข้างทาง +200', type: 'money', amount: 200 },
  { id: 12, text: 'ถูกปรับจราจร -100', type: 'money', amount: -100 },
];

export const PLAYER_COLORS = ['#FF4444', '#44AAFF', '#44DD44', '#FFAA00'];
export const PLAYER_EMOJIS = ['🔴', '🔵', '🟢', '🟡'];

export const STARTING_MONEY = 5000;
export const PASS_START_BONUS = 1000;
export const BOARD_SIZE = BOARD.length;

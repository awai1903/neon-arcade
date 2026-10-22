import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, getPixel) {
  // getPixel(x, y) returns [r, g, b, a] where 0 <= r,g,b,a <= 255
  const rawBytes = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawBytes);

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = buf.subarray(4, 8 + len);
    const crc = crc32(typeAndData);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

// 1. Neon Runner Player (48x48)
const runnerPlayer = createPNG(48, 48, (x, y) => {
  // Runner silhouette with neon cyan/magenta trim and visor
  // Head: x in [22..34], y in [6..18]
  const dxHead = x - 28;
  const dyHead = y - 12;
  if (dxHead * dxHead + dyHead * dyHead <= 36) {
    // Visor glow
    if (x >= 28 && y >= 10 && y <= 14) {
      return [6, 182, 212, 255]; // cyan visor glow
    }
    return [15, 23, 42, 255]; // dark helmet
  }

  // Torso: x in [18..32], y in [18..32]
  if (x >= 20 && x <= 30 && y >= 18 && y <= 32) {
    if (x === 25 || y === 24) return [168, 85, 247, 255]; // purple neon line
    return [30, 41, 59, 255];
  }

  // Arms:
  if ((x >= 12 && x < 20 && y >= 20 && y <= 24) || (x >= 30 && x <= 40 && y >= 22 && y <= 27)) {
    return [6, 182, 212, 255];
  }

  // Legs in running stride:
  if ((x >= 14 && x <= 22 && y >= 32 && y <= 44) || (x >= 26 && x <= 36 && y >= 32 && y <= 44)) {
    if (y >= 42) return [236, 72, 153, 255]; // pink boots
    return [15, 23, 42, 255];
  }

  return [0, 0, 0, 0];
});

// 2. Obstacle / Neon Cyber Hazard (40x48)
const runnerObstacle = createPNG(40, 48, (x, y) => {
  // Laser crystal / pyramid spike
  const midX = 20;
  const distFromCenter = Math.abs(x - midX);
  const allowedWidth = Math.floor((y / 48) * 18);
  if (distFromCenter <= allowedWidth && y >= 4) {
    if (distFromCenter === allowedWidth || distFromCenter === 0 || y === 46) {
      return [236, 72, 153, 255]; // neon pink edge
    }
    return [168, 85, 247, 220]; // glowing purple core
  }
  return [0, 0, 0, 0];
});

// 3. Neon Energy Coin / Token (32x32)
const runnerCoin = createPNG(32, 32, (x, y) => {
  const dx = x - 16;
  const dy = y - 16;
  const distSq = dx * dx + dy * dy;
  if (distSq <= 120) {
    if (distSq >= 90) return [6, 182, 212, 255]; // bright cyan ring
    if (distSq <= 30) return [255, 255, 255, 255]; // white center spark
    return [56, 189, 248, 200];
  }
  return [0, 0, 0, 0];
});

// 4. Cyber Invader Ship (48x36)
const invaderShip = createPNG(48, 36, (x, y) => {
  const midX = 24;
  const dx = Math.abs(x - midX);
  // Triangular fighter
  if (y >= 4 && dx <= (y / 36) * 22) {
    if (dx === 0 || dx >= (y / 36) * 20 || y >= 32) return [6, 182, 212, 255]; // cyan edge
    if (y >= 26 && dx <= 8) return [236, 72, 153, 255]; // engine thruster glow
    return [15, 23, 42, 255];
  }
  return [0, 0, 0, 0];
});

// 5. Alien Invader (36x28)
const alienInvader = createPNG(36, 28, (x, y) => {
  const dx = Math.abs(x - 18);
  if ((dx <= 12 && y >= 6 && y <= 20) || (dx >= 10 && dx <= 16 && y >= 14 && y <= 24) || (dx <= 4 && y >= 2 && y <= 6)) {
    // Eyes:
    if ((dx === 4 || dx === 5) && y >= 10 && y <= 13) return [0, 0, 0, 255];
    return [168, 85, 247, 255]; // purple alien
  }
  return [0, 0, 0, 0];
});

fs.writeFileSync('games/endless-runner/assets/player.png', runnerPlayer);
fs.writeFileSync('games/endless-runner/assets/obstacle.png', runnerObstacle);
fs.writeFileSync('games/endless-runner/assets/coin.png', runnerCoin);
fs.writeFileSync('games/cyber-invaders/assets/player.png', invaderShip);
fs.writeFileSync('games/cyber-invaders/assets/invader.png', alienInvader);
console.log('Successfully generated all game sprite assets');

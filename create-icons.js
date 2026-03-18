const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Lexi 로고 - 심플한 둥근 사각형 + L

function createPNG(size) {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdr = createChunk('IHDR', ihdrData);

  const rawData = [];
  
  // 토스 블루
  const mainR = 49, mainG = 130, mainB = 246; // #3182f6
  
  // 둥근 사각형 파라미터 (더 둥글게)
  const cornerRadius = size * 0.35;

  for (let y = 0; y < size; y++) {
    rawData.push(0);
    for (let x = 0; x < size; x++) {
      
      // 둥근 사각형 체크
      let inRect = false;
      const inset = cornerRadius;
      
      if (x >= inset && x < size - inset) {
        inRect = y >= 0 && y < size;
      } else if (y >= inset && y < size - inset) {
        inRect = x >= 0 && x < size;
      } else {
        // 코너 체크
        let cornerX, cornerY;
        if (x < inset && y < inset) {
          cornerX = inset; cornerY = inset;
        } else if (x >= size - inset && y < inset) {
          cornerX = size - inset; cornerY = inset;
        } else if (x < inset && y >= size - inset) {
          cornerX = inset; cornerY = size - inset;
        } else {
          cornerX = size - inset; cornerY = size - inset;
        }
        const cdx = x - cornerX + 0.5;
        const cdy = y - cornerY + 0.5;
        inRect = Math.sqrt(cdx * cdx + cdy * cdy) <= cornerRadius;
      }
      
      if (inRect) {
        // "L" 문자 체크
        let isL = false;
        const marginX = size * 0.25;
        const marginTop = size * 0.15;  // 위쪽 여백 줄임
        const marginBottom = size * 0.22;
        const lLeft = marginX;
        const lTop = marginTop;
        const lBottom = size - marginBottom;
        const lRight = size - marginX;
        const strokeWidth = size * 0.16;
        
        // L의 세로 획
        if (x >= lLeft && x <= lLeft + strokeWidth && y >= lTop && y <= lBottom) {
          isL = true;
        }
        // L의 가로 획
        if (x >= lLeft && x <= lRight && y >= lBottom - strokeWidth && y <= lBottom) {
          isL = true;
        }
        
        if (isL) {
          // 흰색 L
          rawData.push(255, 255, 255, 255);
        } else {
          // 파란색 배경
          rawData.push(mainR, mainG, mainB, 255);
        }
      } else {
        // 투명
        rawData.push(0, 0, 0, 0);
      }
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([PNG_SIGNATURE, ihdr, idat, iend]);
}

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

sizes.forEach(size => {
  const png = createPNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created: icon${size}.png`);
});

console.log('Lexi icons created!');

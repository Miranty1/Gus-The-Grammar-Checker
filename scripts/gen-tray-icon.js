// Generates electron/assets/trayTemplate.png — a 16x16 RGBA PNG with a minimal "G" mark.
// The "Template" suffix tells macOS to auto-invert for dark/light mode.
// Run once: node scripts/gen-tray-icon.js
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[n] = c
}
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

const W = 16, H = 16
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const ihdr = Buffer.allocUnsafe(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8   // bit depth
ihdr[9] = 6   // RGBA
ihdr[10] = ihdr[11] = ihdr[12] = 0

// Build raw pixel data: 1 filter byte + W*4 RGBA bytes per row
const raw = Buffer.alloc(H * (1 + W * 4), 0)

function px(x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const o = y * (1 + W * 4) + 1 + x * 4
  raw[o] = raw[o + 1] = raw[o + 2] = 0
  raw[o + 3] = 255
}

// Simple pixel-art "G" centered in 16x16
// Outer arc: columns 4–11, rows 2–13
const arc = [
  [2,5],[2,6],[2,7],[2,8],[2,9],[2,10],
  [3,3],[3,4],[3,11],[3,12],
  [4,3],[4,12],
  [5,2],[5,13],
  [6,2],[6,13],
  [7,2],
  [8,2],
  [9,2],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],
  [10,2],[10,13],
  [11,3],[11,13],
  [12,3],[12,4],[12,12],[12,13],
  [13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],
]
for (const [y, x] of arc) px(x, y)

const compressed = zlib.deflateSync(raw, { level: 9 })
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])

const out = path.join(__dirname, '../electron/assets/trayTemplate.png')
fs.writeFileSync(out, png)
console.log('Written:', out, `(${png.length} bytes)`)

// Generates 4 tray icon PNGs from scratch — no dependencies beyond Node built-ins.
// Pencil shape: rectangular body + eraser cap + triangular tip, fully opaque pixels.
// Run: node scripts/gen-tray.js
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

// ── PNG encode helpers ────────────────────────────────────────────────────────

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
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length)
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(W, H, rgba) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = ihdr[11] = ihdr[12] = 0   // 8-bit RGBA

  // One filter byte (0 = None) per row + 4 bytes per pixel
  const raw = Buffer.alloc(H * (1 + W * 4), 0)
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0
    for (let x = 0; x < W; x++) {
      const si = (y * W + x) * 4
      const di = y * (1 + W * 4) + 1 + x * 4
      raw[di] = rgba[si]; raw[di+1] = rgba[si+1]; raw[di+2] = rgba[si+2]; raw[di+3] = rgba[si+3]
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ── Pencil pixel art ──────────────────────────────────────────────────────────
//
// 16×16 layout (all coordinates 0-indexed):
//   Eraser:  x=5–10, y=1–2    (6×2)
//   Body:    x=5–10, y=3–11   (6×9)
//   Neck:    x=6–9,  y=12     (4×1)
//   Tip:     x=7–8,  y=13     (2×1)
//   Point:   x=8,    y=14     (1×1)
//
// 32×32 — every 1×1 logical pixel becomes 2×2 physical pixels

function drawPencil(W, H, fill) {
  const rgba  = new Uint8Array(W * H * 4)   // all transparent initially
  const scale = W / 16                        // 1 at 16px, 2 at 32px
  const s     = Math.round(scale)

  function rect(x0, y0, x1, y1) {
    for (let row = y0; row <= y1; row++) {
      for (let col = x0; col <= x1; col++) {
        for (let dy = 0; dy < s; dy++) {
          for (let dx = 0; dx < s; dx++) {
            const py = row * s + dy
            const px = col * s + dx
            if (px < 0 || px >= W || py < 0 || py >= H) continue
            const i = (py * W + px) * 4
            rgba[i] = fill[0]; rgba[i+1] = fill[1]; rgba[i+2] = fill[2]; rgba[i+3] = 255
          }
        }
      }
    }
  }

  rect(5, 1, 10, 2)    // eraser cap
  rect(5, 3, 10, 11)   // body
  rect(6, 12, 9, 12)   // neck
  rect(7, 13, 8, 13)   // tip base
  rect(8, 14, 8, 14)   // point

  return rgba
}

// ── Write files ───────────────────────────────────────────────────────────────

const ASSETS = path.join(__dirname, '../assets')
const white  = [255, 255, 255]
const black  = [0,   0,   0]

const files = [
  { name: 'tray-dark.png',    W: 16, H: 16, fill: white },
  { name: 'tray-dark@2x.png', W: 32, H: 32, fill: white },
  { name: 'tray-light.png',    W: 16, H: 16, fill: black },
  { name: 'tray-light@2x.png', W: 32, H: 32, fill: black },
]

for (const { name, W, H, fill } of files) {
  const out  = path.join(ASSETS, name)
  const png  = encodePNG(W, H, drawPencil(W, H, fill))
  fs.writeFileSync(out, png)
  console.log(`Written: assets/${name}  (${png.length} bytes, ${W}×${H})`)
}

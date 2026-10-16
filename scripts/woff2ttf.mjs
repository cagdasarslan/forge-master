// WOFF (1.0) yazı tipini TTF'ye çevirir; simge betiği (make-icon.ps1) oyunun yazı tipini kullanabilsin diye.
// Kullanım: node scripts/woff2ttf.mjs <girdi.woff> <çıktı.ttf>
import fs from 'node:fs';
import zlib from 'node:zlib';

const [src, dst] = process.argv.slice(2);
const w = fs.readFileSync(src);
if (w.toString('ascii', 0, 4) !== 'wOFF') throw new Error('WOFF değil: ' + src);
const flavor = w.readUInt32BE(4);
const numTables = w.readUInt16BE(12);

const tables = [];
for (let i = 0; i < numTables; i++) {
  const o = 44 + i * 20;
  const tag = w.toString('ascii', o, o + 4);
  const offset = w.readUInt32BE(o + 4), compLen = w.readUInt32BE(o + 8), origLen = w.readUInt32BE(o + 12), checksum = w.readUInt32BE(o + 16);
  const raw = w.subarray(offset, offset + compLen);
  const data = compLen < origLen ? zlib.inflateSync(raw) : Buffer.from(raw);
  tables.push({ tag, checksum, data });
}

// sfnt başlığı + tablo dizini + 4 bayta hizalanmış tablolar
const pow = 2 ** Math.floor(Math.log2(numTables));
const head = Buffer.alloc(12 + numTables * 16);
head.writeUInt32BE(flavor, 0);
head.writeUInt16BE(numTables, 4);
head.writeUInt16BE(pow * 16, 6);
head.writeUInt16BE(Math.log2(pow), 8);
head.writeUInt16BE(numTables * 16 - pow * 16, 10);
let offset = head.length;
const bodies = [];
tables.forEach((t, i) => {
  const o = 12 + i * 16;
  head.write(t.tag, o, 'ascii');
  head.writeUInt32BE(t.checksum, o + 4);
  head.writeUInt32BE(offset, o + 8);
  head.writeUInt32BE(t.data.length, o + 12);
  const pad = (4 - (t.data.length % 4)) % 4;
  bodies.push(t.data, Buffer.alloc(pad));
  offset += t.data.length + pad;
});
fs.writeFileSync(dst, Buffer.concat([head, ...bodies]));
console.log('Yazildi: ' + dst);

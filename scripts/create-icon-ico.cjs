'use strict';

const fs = require('node:fs');
const path = require('node:path');

const buildDir = path.join(__dirname, '..', 'build');
const pngPath = path.join(buildDir, 'icon-256.png');
const icoPath = path.join(buildDir, 'icon.ico');

function fail(message) {
  console.error('[2Dlock icon]', message);
  process.exitCode = 1;
}

try {
  const png = fs.readFileSync(pngPath);

  if (png.length < 33 || png.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('build/icon-256.png is not a valid PNG file.');
  }

  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== 256 || height !== 256) {
    throw new Error(`Expected a 256x256 icon, received ${width}x${height}.`);
  }

  // A PNG-compressed 256x256 image inside an ICO container preserves the
  // original alpha channel and is supported by modern Windows versions.
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO resource type
  header.writeUInt16LE(1, 4); // One image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // Width 256
  entry.writeUInt8(0, 1); // Height 256
  entry.writeUInt8(0, 2); // Palette count: PNG has its own color data
  entry.writeUInt8(0, 3); // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(png.length, 8); // PNG payload size
  entry.writeUInt32LE(22, 12); // ICO header (6) + directory entry (16)

  fs.writeFileSync(icoPath, Buffer.concat([header, entry, png]));
  console.log('[2Dlock icon] Created transparent 256x256 Windows icon:', icoPath);
} catch (error) {
  fail(error && error.message ? error.message : String(error));
}

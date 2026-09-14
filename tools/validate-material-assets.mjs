import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolverPath = path.join(root, 'frontend/webApp/src/react-app/pages/AddMaterialPage/materialImageResolver.js');
const materialsDir = path.join(root, 'frontend/webApp/public/materials');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const filenames = [...new Set([...resolver.matchAll(/'\/materials\/([^']+)'/g)].map(match => match[1]))];
const errors = [];

function isValidWebp(bytes) {
  if (
    bytes.length < 20 ||
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WEBP' ||
    bytes.readUInt32LE(4) + 8 !== bytes.length
  ) return false;

  let offset = 12;
  let hasImageChunk = false;

  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return false;

    const type = bytes.subarray(offset, offset + 4).toString('ascii');
    const size = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + size;
    if (dataEnd > bytes.length) return false;

    if (type === 'VP8 ' && size >= 10) {
      const signature = bytes.subarray(dataOffset + 3, dataOffset + 6);
      const width = bytes.readUInt16LE(dataOffset + 6) & 0x3fff;
      const height = bytes.readUInt16LE(dataOffset + 8) & 0x3fff;
      hasImageChunk ||= signature.equals(Buffer.from([0x9d, 0x01, 0x2a])) && width > 0 && height > 0;
    } else if (type === 'VP8L' && size >= 5) {
      const b1 = bytes[dataOffset + 1];
      const b2 = bytes[dataOffset + 2];
      const b3 = bytes[dataOffset + 3];
      const b4 = bytes[dataOffset + 4];
      const width = 1 + b1 + ((b2 & 0x3f) << 8);
      const height = 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10);
      hasImageChunk ||= bytes[dataOffset] === 0x2f && width > 0 && height > 0;
    } else if (type === 'VP8X' && size >= 10) {
      const width = 1 + bytes.readUIntLE(dataOffset + 4, 3);
      const height = 1 + bytes.readUIntLE(dataOffset + 7, 3);
      hasImageChunk ||= width > 0 && height > 0;
    }

    offset = dataEnd + (size % 2);
  }

  return offset === bytes.length && hasImageChunk;
}

for (const filename of filenames) {
  const assetPath = path.join(materialsDir, filename);
  if (!fs.existsSync(assetPath)) {
    errors.push(`missing: ${filename}`);
    continue;
  }

  const bytes = fs.readFileSync(assetPath);
  const valid = filename.endsWith('.webp')
    ? isValidWebp(bytes)
    : bytes.subarray(0, 512).toString('utf8').includes('<svg');

  if (!valid) errors.push(`invalid ${path.extname(filename)}: ${filename}`);
}

if (errors.length) {
  console.error(`Material asset validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${filenames.length} referenced material assets.`);
}

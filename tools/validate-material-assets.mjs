import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolverPath = path.join(root, 'frontend/webApp/src/react-app/pages/AddMaterialPage/materialImageResolver.js');
const materialsDir = path.join(root, 'frontend/webApp/public/materials');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const filenames = [...new Set([...resolver.matchAll(/'\/materials\/([^']+)'/g)].map(match => match[1]))];
const errors = [];

for (const filename of filenames) {
  const assetPath = path.join(materialsDir, filename);
  if (!fs.existsSync(assetPath)) {
    errors.push(`missing: ${filename}`);
    continue;
  }

  const bytes = fs.readFileSync(assetPath);
  const valid = filename.endsWith('.webp')
    ? bytes.length >= 12 &&
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP' &&
      bytes.readUInt32LE(4) + 8 === bytes.length
    : bytes.subarray(0, 512).toString('utf8').includes('<svg');

  if (!valid) errors.push(`invalid ${path.extname(filename)}: ${filename}`);
}

if (errors.length) {
  console.error(`Material asset validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${filenames.length} referenced material assets.`);
}

import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const launcher = Buffer.from(svg.replace('<svg ', '<svg class="launcher" '));

for (const { file, size, rounded } of [
  { file: 'pwa-192.png', size: 192, rounded: true },
  { file: 'pwa-512.png', size: 512, rounded: true },
  { file: 'pwa-maskable-512.png', size: 512, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, rounded: false }
]) {
  const markSize = Math.round(size * 0.8);
  const mark = await sharp(launcher).resize(markSize, markSize).png().toBuffer();
  // Adaptive launchers and iOS shape their own opaque tiles.
  const radius = rounded ? size * 0.2 : 0;
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#1b3227"/></svg>`
  );
  await sharp(tile)
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(fileURLToPath(new URL(`../public/${file}`, import.meta.url)));
}
console.log('PWA and Apple touch icons generated.');

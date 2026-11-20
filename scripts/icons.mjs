import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const launcher = Buffer.from(svg.replace('<svg ', '<svg class="launcher" '));

for (const [file, size] of [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180]
]) {
  const markSize = Math.round(size * 0.8);
  const mark = await sharp(launcher).resize(markSize, markSize).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: '#1b3227' } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(fileURLToPath(new URL(`../public/${file}`, import.meta.url)));
}
console.log('PWA and Apple touch icons generated.');

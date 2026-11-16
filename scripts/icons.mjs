import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const input = fileURLToPath(new URL('../public/icon.svg', import.meta.url));
for (const [file, size] of [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180]
]) {
  await sharp(input)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../public/${file}`, import.meta.url)));
}
console.log('PWA and Apple touch icons generated.');

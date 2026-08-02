/**
 * Generate full iOS / Android / Expo icon packs from a 1024 master PNG.
 *
 *   node scripts/generate-app-icons.mjs /path/to/master-1024.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MOBILE = path.join(ROOT, 'apps/mobile');
const require = createRequire(path.join(ROOT, 'scripts/solve-proxy/package.json'));
const sharp = require('sharp');

const masterPath = process.argv[2];
if (!masterPath || !fs.existsSync(masterPath)) {
  console.error('Usage: node scripts/generate-app-icons.mjs <master-1024.png>');
  process.exit(1);
}

const IOS_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];
const ANDROID_MIPMAP = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
];

async function writePng(buf, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log('wrote', path.relative(ROOT, outPath));
}

async function resize(size, outPath) {
  const buf = await sharp(masterPath)
    .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writePng(buf, outPath);
}

async function solidNavy(size, outPath) {
  const buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 30, g: 27, b: 75 },
    },
  })
    .png()
    .toBuffer();
  await writePng(buf, outPath);
}

/** Approximate monochrome: white mark on transparent (themed Android icon). */
async function monochrome(size, outPath) {
  const buf = await sharp(masterPath)
    .resize(size, size, { fit: 'cover' })
    .greyscale()
    .normalize()
    .threshold(140)
    .png()
    .toBuffer();
  await writePng(buf, outPath);
}

const brandDir = path.join(MOBILE, 'assets/brand/app-icon');
const sourceDir = path.join(brandDir, 'source');
fs.mkdirSync(sourceDir, { recursive: true });
fs.copyFileSync(masterPath, path.join(sourceDir, 'cozbil-app-icon-1024.png'));
console.log('source master copied');

for (const size of IOS_SIZES) {
  await resize(size, path.join(brandDir, 'iOS', `icon_${size}x${size}.png`));
}

for (const [dir, size] of ANDROID_MIPMAP) {
  await resize(size, path.join(brandDir, 'Android', dir, 'ic_launcher.png'));
}
await resize(512, path.join(brandDir, 'Android/playstore/ic_launcher.png'));

const images = path.join(MOBILE, 'assets/images');
await resize(1024, path.join(images, 'icon.png'));
await resize(1024, path.join(images, 'splash-icon.png'));
await resize(1024, path.join(images, 'brand-mark.png'));
await resize(1024, path.join(images, 'android-icon-foreground.png'));
await solidNavy(1024, path.join(images, 'android-icon-background.png'));
await monochrome(1024, path.join(images, 'android-icon-monochrome.png'));
await resize(180, path.join(images, 'favicon.png'));

const store = path.join(ROOT, 'docs/store/app-icon');
fs.mkdirSync(store, { recursive: true });
await resize(1024, path.join(store, 'ios-marketing-1024.png'));
await resize(512, path.join(store, 'playstore-512.png'));

console.log('generate-app-icons.mjs OK');

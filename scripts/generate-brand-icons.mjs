import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const sourceLogo = path.join(rootDir, 'public', 'winning_heaven_logo.png');

if (!fs.existsSync(sourceLogo)) {
  console.error(`Source logo not found at: ${sourceLogo}`);
  process.exit(1);
}

console.log('🌟 Generating Winning Heaven Brand Icons & Android Mipmaps...');

async function generateWebIcons() {
  const publicDir = path.join(rootDir, 'public');

  // 192x192 PWA Icon
  await sharp(sourceLogo)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✅ Generated public/icon-192.png');

  // 512x512 PWA Icon
  await sharp(sourceLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✅ Generated public/icon-512.png');

  // 512x512 Maskable Icon with 10% safe zone padding
  await sharp(sourceLogo)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 8, g: 10, b: 17, alpha: 1 } // #080a11
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✅ Generated public/icon-maskable-512.png');

  // 180x180 Apple Touch Icon
  await sharp(sourceLogo)
    .resize(180, 180, { fit: 'contain', background: { r: 8, g: 10, b: 17, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ Generated public/apple-touch-icon.png');
}

const ANDROID_DENSITIES = [
  { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 }
];

async function generateAndroidAppIcons(resDir, appLabel) {
  if (!fs.existsSync(resDir)) {
    console.warn(`Res directory does not exist: ${resDir}`);
    return;
  }

  for (const { folder, iconSize, fgSize } of ANDROID_DENSITIES) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // ic_launcher.png (Square / Adaptive standard)
    await sharp(sourceLogo)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // ic_launcher_round.png
    // Create circular mask
    const circleBuffer = Buffer.from(
      `<svg width="${iconSize}" height="${iconSize}"><circle cx="${iconSize / 2}" cy="${iconSize / 2}" r="${iconSize / 2}" fill="#080a11"/></svg>`
    );
    const resizedForRound = await sharp(sourceLogo)
      .resize(Math.round(iconSize * 0.85), Math.round(iconSize * 0.85), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp(circleBuffer)
      .composite([{ input: resizedForRound, gravity: 'center' }])
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png (for adaptive icons, centered in 108dp canvas)
    const innerFgSize = Math.round(fgSize * 0.65);
    const fgLogo = await sharp(sourceLogo)
      .resize(innerFgSize, innerFgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: fgLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));
  }

  // Generate splash screen in drawable folders
  const splashDrawable = path.join(resDir, 'drawable');
  if (fs.existsSync(splashDrawable)) {
    const splashLogo = await sharp(sourceLogo)
      .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 8, g: 10, b: 17, alpha: 1 } // #080a11
      }
    })
      .composite([{ input: splashLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(splashDrawable, 'splash.png'));
  }

  console.log(`✅ Generated Android Mipmaps & Splash for: ${appLabel}`);
}

async function run() {
  await generateWebIcons();

  // 1. Player App (android/)
  await generateAndroidAppIcons(path.join(rootDir, 'android', 'app', 'src', 'main', 'res'), 'Player APK');

  // 2. Distributor App (android-distributor/)
  await generateAndroidAppIcons(path.join(rootDir, 'android-distributor', 'app', 'src', 'main', 'res'), 'Distributor APK');

  // 3. Portal Staff App (android-portal/)
  await generateAndroidAppIcons(path.join(rootDir, 'android-portal', 'app', 'src', 'main', 'res'), 'Portal APK');

  console.log('🎉 All Winning Heaven Icons & Mipmaps Generated Successfully!');
}

run().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});

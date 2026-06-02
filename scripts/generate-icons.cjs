const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

async function createIcon(size) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#1f2937" rx="${size * 0.18}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.28}" fill="none" stroke="#f87171" stroke-width="${size * 0.06}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.12}" fill="#f87171"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(publicDir, `pwa-${size}x${size}.png`));

  console.log(`Generated pwa-${size}x${size}.png`);
}

(async () => {
  await createIcon(192);
  await createIcon(512);
  console.log('All icons generated.');
})();

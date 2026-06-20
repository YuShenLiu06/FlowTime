// 生成 Windows 应用图标 build/icon.ico（electron-builder 要求 .ico，且不小于 256x256）。
// 输入复用 PWA 的 512x512 图标，用 sharp 缩放到 256，再用 png-to-ico 转换。
import fs from 'node:fs/promises';
import path from 'node:path';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const src = path.resolve('public/pwa-512x512.png');
const outDir = path.resolve('build');
const outFile = path.join(outDir, 'icon.ico');

await fs.mkdir(outDir, { recursive: true });
const buf256 = await sharp(src).resize(256, 256).png().toBuffer();
await fs.writeFile(outFile, await pngToIco(buf256));
console.log(`Generated ${outFile}`);

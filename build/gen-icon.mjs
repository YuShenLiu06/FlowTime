// 生成 Windows 应用图标 build/icon2.ico（electron-builder 要求 .ico，且不小于 256x256）。
// 输入使用 build/icon2.png，用 sharp 缩放到 256，再用 png-to-ico 转换。
import fs from 'node:fs/promises';
import path from 'node:path';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const src = path.resolve('build/icon2.png');
const outDir = path.resolve('build');
const outFile = path.join(outDir, 'icon2.ico');

await fs.mkdir(outDir, { recursive: true });
const buf256 = await sharp(src).resize(256, 256).png().toBuffer();
await fs.writeFile(outFile, await pngToIco(buf256));
console.log(`Generated ${outFile}`);

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const umd = path.join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'umd');
const dist = path.join(root, 'node_modules', '@ffmpeg', 'core', 'dist');
const dst = path.join(root, 'public', 'ffmpeg');

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js'];
const srcDir = fs.existsSync(umd) ? umd : dist;

fs.mkdirSync(dst, { recursive: true });
for (const f of files) {
  const srcPath = path.join(srcDir, f);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(dst, f));
    console.log(`Copied ${f}`);
  } else {
    console.warn(`Skip ${f} (not found in ${srcDir})`);
  }
}

// Takes the still of the hologram (three-quarter view, no zone lit) that stands in for it
// where WebGL is missing, and that the other two sites show as a picture:
// public/holo/fallback.webp here, src/assets/holo-head.webp in Website and Portfolio.
//
//   npm run dev                       (in another terminal)
//   node scripts/make-holo-photo.mjs http://localhost:4321/es/ public/holo/fallback.webp
//
// Needs Playwright with Chromium, and Python with Pillow to write the WebP.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const [url, output] = process.argv.slice(2);
if (!url || !output) {
  console.error('usage: node scripts/make-holo-photo.mjs <url of the home page> <out.webp>');
  process.exit(1);
}
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')); }

const W = 600, H = 796, VIEW = 1.12; // the crop, in CSS pixels, is VIEW times the picture
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// Reduced motion freezes the scan line and the twinkle, and the head follows the pointer at once.
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
await page.waitForSelector('.is-live', { timeout: 30000 });
await page.addStyleTag({ content: `
  html, body, [data-holo] { background: #03070c !important; }
  [data-holo] > *:not(.canvas) { display: none !important; }
  [data-holo]::after { display: none !important; }
  [data-holo] { border: 0 !important; }
` });
// The pointer, off to the right of the head and on no zone, turns it three quarters.
const box = await page.locator('.canvas canvas').boundingBox();
await page.mouse.move(box.x + box.width * 0.84, box.y + box.height * 0.44);
await page.waitForTimeout(1500);
const turned = await page.evaluate(() => document.querySelector('.readout').textContent);
const dir = mkdtempSync(join(tmpdir(), 'holo-'));
const png = join(dir, 'holo.png');
const w = W * VIEW, h = H * VIEW;
await page.screenshot({ path: png, clip: { x: box.x + box.width / 2 - w / 2, y: box.y + box.height * 0.5 - h * 0.47, width: w, height: h } });
await browser.close();
// One device pixel per line reads fainter in a still than on the moving hologram:
// lift the light over the background and add a soft glow around it.
execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageChops, ImageFilter
BG = (3, 7, 12)
im = Image.open(sys.argv[1]).convert('RGB').resize((${W}, ${H}), Image.LANCZOS)
light = ImageChops.subtract(im, Image.new('RGB', im.size, BG)).point(lambda v: min(255, int(v * 2.3)))
glow = light.filter(ImageFilter.GaussianBlur(7)).point(lambda v: int(v * 0.8))
out = ImageChops.add(Image.new('RGB', im.size, BG), ImageChops.screen(light, glow))
out.save(sys.argv[2], 'WEBP', quality=90, method=6)
`, png, output]);
rmSync(dir, { recursive: true });
console.log(`wrote ${output} (${W}×${H}; ${turned})`);

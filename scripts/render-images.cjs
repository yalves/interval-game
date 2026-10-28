// Renders the app icons and the link-preview image into images/.
// Run with: node scripts/render-images.cjs  (uses the globally installed Playwright)
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const NAME = 'Musicle';
const OUT = path.join(__dirname, '..', 'images');

// Four piano keys with the "first" and "second" notes highlighted, like the result screen.
function iconSvg({ rounded = true } = {}) {
  const keys = [0, 1, 2, 3]
    .map((i) => {
      const fill = i === 0 ? '#ffd166' : i === 3 ? '#ff7a95' : '#ffffff';
      return `<rect x="${104 + i * 78}" y="148" width="70" height="232" rx="12" fill="${fill}"/>`;
    })
    .join('');
  const blacks = [0, 1]
    .map((i) => `<rect x="${158 + i * 78}" y="148" width="40" height="138" rx="8" fill="#26215c"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b7cf6"/><stop offset="1" stop-color="#5b4bd8"/></linearGradient></defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
  ${keys}${blacks}
</svg>`;
}

function ogHtml() {
  const whites = 15;
  const highlighted = { 2: '#7c6cf2', 6: '#e0617d' };
  const whiteKeys = Array.from({ length: whites }, (_, i) => {
    const color = highlighted[i] ?? '#f7f7f2';
    const label = i === 2 ? '1' : i === 6 ? '2' : '';
    return `<div class="w" style="background:${color}">${label}</div>`;
  }).join('');
  const blackAfter = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13];
  const blackKeys = blackAfter.map((n) => `<div class="b" style="left: calc(${(n * 100) / whites}% - 2.2%)"></div>`).join('');
  return `<!doctype html><html><head><style>
    body { margin: 0; width: 1200px; height: 630px; background: #121213; color: #f2f2f2; font-family: Inter, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; }
    h1 { margin: 0; font: 800 108px 'Inter Display', Inter, sans-serif; letter-spacing: 2px; }
    p { margin: 0; font-size: 40px; color: #c8c8cc; }
    .kb { position: relative; display: flex; width: 900px; height: 190px; background: #1b1b1b; padding-top: 6px; border-radius: 10px; overflow: hidden; }
    .w { flex: 1; margin-right: 3px; border-radius: 0 0 8px 8px; display: flex; align-items: flex-end; justify-content: center;
      font: 800 34px Inter, sans-serif; color: #fff; padding-bottom: 14px; }
    .b { position: absolute; top: 6px; width: 4.4%; height: 60%; background: #1b1b1b; border-radius: 0 0 6px 6px; }
    .squares { display: flex; gap: 12px; }
    .squares span { width: 48px; height: 48px; border-radius: 8px; }
  </style></head><body>
    <h1>${NAME}</h1>
    <p>Can you name the interval? A new puzzle every day.</p>
    <div class="kb">${whiteKeys}${blackKeys}</div>
    <div class="squares"><span style="background:#3a3a3c"></span><span style="background:#b59f3b"></span><span style="background:#538d4e"></span><span style="background:#2a2a2d"></span></div>
  </body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'icon.svg'), iconSvg());
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const icons = [
    ['icon-192.png', 192, true],
    ['icon-512.png', 512, true],
    // Maskable and Apple icons get cropped by the system, so they're square and full-bleed.
    ['icon-maskable-512.png', 512, false],
    ['apple-touch-icon.png', 180, false],
  ];
  for (const [file, size, rounded] of icons) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${iconSvg({ rounded })}`);
    await page.screenshot({ path: path.join(OUT, file), omitBackground: rounded });
  }

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(ogHtml());
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, 'og.png') });
  await browser.close();
  console.log('Rendered images into', OUT);
})();

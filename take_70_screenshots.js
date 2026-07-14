import { chromium } from "playwright";
import { mkdirSync } from "fs";

const urls = Array.from(
  { length: 64 },
  (_, i) => `http:/localhost:5173/game/${i + 1}`,
);

const OUT_DIR = "./screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // retina-quality output
  });

  for (const [i, url] of urls.entries()) {
    const out = `${OUT_DIR}/game-${i + 1}.png`;
    console.log(`Navigating to ${url} ...`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    // Give canvas/WebGL content a moment to render a few frames —
    // "networkidle" fires before the game loop has drawn anything.
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`Saved ${out}`);
  }
} finally {
  await browser.close();
}

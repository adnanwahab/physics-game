let urls = [`https://physics-game-five.vercel.app/game/1`];

import { chromium } from "playwright";

const URL = "https://physics-game-five.vercel.app/";
const OUT = "screenshot.png";

const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // retina-quality output
  });

  console.log(`Navigating to ${URL} ...`);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30_000 });

  // Give canvas/WebGL content a moment to render a few frames —
  // "networkidle" fires before the game loop has drawn anything.
  await page.waitForTimeout(2_000);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`Saved ${OUT}`);
} finally {
  await browser.close();
}

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "artifacts");
const baselineDir = path.join(root, "artifacts", "baseline");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  ensureDir(outDir);
  ensureDir(baselineDir);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  const fileUrl = `file://${path.join(root, "index.html")}`;
  await page.goto(fileUrl);
  await page.waitForTimeout(600);
  const homePath = path.join(outDir, "home.png");
  await page.screenshot({ path: homePath, fullPage: true });

  const startBtn = await page.$("#startBtn");
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, "playing.png"), fullPage: true });
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

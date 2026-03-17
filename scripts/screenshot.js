const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "artifacts");

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  const fileUrl = `file://${path.join(root, "index.html")}`;
  await page.goto(fileUrl);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "home.png"), fullPage: true });

  const startBtn = await page.$("#startBtn");
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "playing.png"), fullPage: true });
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

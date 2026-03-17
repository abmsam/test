const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

const root = path.resolve(__dirname, "..");
const artifactsDir = path.join(root, "artifacts");
const baselineDir = path.join(artifactsDir, "baseline");

function copyBaseline(name) {
  const src = path.join(artifactsDir, name);
  const dest = path.join(baselineDir, name);
  fs.copyFileSync(src, dest);
}

function compareImages(name) {
  const baselinePath = path.join(baselineDir, name);
  const currentPath = path.join(artifactsDir, name);
  if (!fs.existsSync(baselinePath)) {
    copyBaseline(name);
    return 0;
  }
  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(fs.readFileSync(currentPath));
  const { width, height } = img1;
  const diff = new PNG({ width, height });
  const mismatch = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  if (mismatch > 0) {
    return mismatch;
  }
  return 0;
}

const homeMismatch = compareImages("home.png");
const playMismatch = compareImages("playing.png");

if (homeMismatch > 0 || playMismatch > 0) {
  console.error(`Visual regression detected home=${homeMismatch} play=${playMismatch}`);
  process.exit(1);
}

console.log("Screenshot baseline ok");

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

const root = path.resolve(__dirname, "..");
const artifactsDir = path.join(root, "artifacts");
const baselineDir = path.join(artifactsDir, "baseline");
const diffDir = path.join(artifactsDir, "diff");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function compareImages(name) {
  const baselinePath = path.join(baselineDir, name);
  const currentPath = path.join(artifactsDir, name);
  if (!fs.existsSync(baselinePath)) {
    return 0;
  }
  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(fs.readFileSync(currentPath));
  const { width, height } = img1;
  const diff = new PNG({ width, height });
  const mismatch = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  if (mismatch > 0) {
    ensureDir(diffDir);
    const diffPath = path.join(diffDir, name);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }
  return mismatch;
}

const homeMismatch = compareImages("home.png");
const playMismatch = compareImages("playing.png");

if (homeMismatch > 0 || playMismatch > 0) {
  console.error(`Visual regression detected home=${homeMismatch} play=${playMismatch}`);
  process.exit(1);
}

console.log("Screenshot baseline ok");

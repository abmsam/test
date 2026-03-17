const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "style.css",
  "game.js",
  "manifest.json",
  "sw.js",
  "icon.svg",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function main() {
  requiredFiles.forEach((file) => {
    const fullPath = path.join(root, file);
    assert(fs.existsSync(fullPath), `Missing required file: ${file}`);
  });

  const manifest = readJson(path.join(root, "manifest.json"));
  assert(manifest.name, "manifest.json missing name");
  assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest.json missing icons");

  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  requiredFiles.forEach((file) => {
    assert(sw.includes(file), `sw.js does not cache ${file}`);
  });

  console.log("Checks passed.");
}

main();

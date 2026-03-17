const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const limits = [
  { file: "game.js", maxKb: 200 },
  { file: "style.css", maxKb: 80 },
  { file: "index.html", maxKb: 120 },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

limits.forEach(({ file, maxKb }) => {
  const filePath = path.join(root, file);
  const sizeKb = fs.statSync(filePath).size / 1024;
  assert(sizeKb <= maxKb, `${file} exceeds ${maxKb}KB (got ${sizeKb.toFixed(1)}KB)`);
});

console.log("Performance budget checks passed.");

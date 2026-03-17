const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const requiredIds = [
  "board",
  "score",
  "highScore",
  "levelLabel",
  "timeLabel",
  "difficultySelect",
  "modeSelect",
  "wrapToggle",
  "autoPauseToggle",
  "leaderList",
  "logList",
];

const missing = requiredIds.filter((id) => !html.includes(`id=\"${id}\"`));
if (missing.length) {
  console.error(`Missing required ids: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Health check passed.");

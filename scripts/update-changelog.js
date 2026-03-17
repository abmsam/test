const fs = require("fs");
const path = require("path");

const version = process.argv[2];
if (!version) {
  console.error("Missing version argument");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const changelogPath = path.join(root, "CHANGELOG.md");
const changelog = fs.readFileSync(changelogPath, "utf8");

const lines = changelog.split(/\r?\n/);
const unreleasedIndex = lines.findIndex((line) => line.trim() === "## Unreleased");
if (unreleasedIndex === -1) {
  console.error("CHANGELOG missing 'Unreleased' section");
  process.exit(1);
}

let endIndex = lines.length;
for (let i = unreleasedIndex + 1; i < lines.length; i += 1) {
  if (lines[i].startsWith("## ")) {
    endIndex = i;
    break;
  }
}

const section = lines.slice(unreleasedIndex + 1, endIndex).join("\n").trim();
const today = new Date().toISOString().slice(0, 10);
const releaseHeader = `## ${version} - ${today}`;

const newLines = [
  ...lines.slice(0, unreleasedIndex),
  "## Unreleased",
  "",
  releaseHeader,
  section.length ? section : "- No notes yet.",
  "",
  ...lines.slice(endIndex).filter((line, index) => !(index === 0 && line.trim() === "")),
];

fs.writeFileSync(changelogPath, newLines.join("\n").replace(/\n{3,}/g, "\n\n"));
console.log(`Updated CHANGELOG for ${version}`);

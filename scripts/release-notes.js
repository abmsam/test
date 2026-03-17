const fs = require("fs");
const path = require("path");

const version = process.argv[2];
const root = path.resolve(__dirname, "..");
const changelogPath = path.join(root, "CHANGELOG.md");

if (!version) {
  console.error("Missing version argument");
  process.exit(1);
}

const changelog = fs.readFileSync(changelogPath, "utf8");
const lines = changelog.split(/\r?\n/);

const headerIndex = lines.findIndex((line) => line.trim() === "## Unreleased");
if (headerIndex === -1) {
  console.error("CHANGELOG missing 'Unreleased' section");
  process.exit(1);
}

const section = [];
for (let i = headerIndex + 1; i < lines.length; i += 1) {
  if (lines[i].startsWith("## ")) {
    break;
  }
  section.push(lines[i]);
}

const trimmed = section.join("\n").trim();
const content = trimmed.length ? trimmed : "- No notes yet.";

console.log(`# ${version}\n\n${content}`);

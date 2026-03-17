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

function extractSection(header) {
  const start = lines.findIndex((line) => line.trim() === header);
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

const versionHeader = `## ${version}`;
let notes = extractSection(versionHeader);
if (!notes) {
  notes = extractSection("## Unreleased") || "- No notes yet.";
}

const output = `# ${version}\n\n${notes.length ? notes : "- No notes yet."}`;
console.log(output);

const fs = require("fs");
const path = require("path");

const version = process.argv[2];
if (!version) {
  console.error("Missing version argument");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const statusPath = path.join(root, "status.json");

const payload = {
  version,
  updatedAt: new Date().toISOString(),
  site: "https://abmsam.github.io/test/",
};

fs.writeFileSync(statusPath, JSON.stringify(payload, null, 2));
console.log("Updated status.json");

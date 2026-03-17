const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Basic accessibility checks.
assert(html.includes("aria-label=\"Snake game board\""), "Canvas missing aria-label");

const buttonMatches = html.match(/<button[^>]*>(.*?)<\/button>/g) || [];
assert(buttonMatches.length > 0, "No buttons found");
buttonMatches.forEach((btn) => {
  const text = btn.replace(/<[^>]*>/g, "").trim();
  assert(text.length > 0, "Button missing text label");
});

console.log("Accessibility checks passed.");
